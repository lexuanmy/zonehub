# backend/src/chat_events.py
from flask import request
from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token # To manually decode token if needed
from .extensions import socketio, db
from .models import ChatMessage, ChatRoom, User, TeamMember, Match
from datetime import datetime

# Helper function to get user_id from token (adapt as needed)
# This is a simplified example; robust token handling might be needed
def get_user_id_from_token(auth_header):
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        decoded_token = decode_token(token)
        return decoded_token["sub"] # Assuming default identity claim "sub"
    except Exception as e:
        print(f"Token decoding error: {e}")
        return None

# Function to check if user is part of the match associated with the room
def is_user_in_match_room(user_id, room_id):
    room = ChatRoom.query.get(room_id)
    # Corrected string literal
    if not room or room.status != "active":
        return False
    match = Match.query.get(room.match_id)
    if not match:
        return False
    
    is_member_a = TeamMember.query.filter_by(team_id=match.team_a_id, user_id=user_id).first()
    is_member_b = TeamMember.query.filter_by(team_id=match.team_b_id, user_id=user_id).first()
    
    return bool(is_member_a or is_member_b)

def register_events(socketio_instance):

    # Corrected event names and dictionary keys/values
    @socketio_instance.on("connect")
    def handle_connect():
        # Optional: Authenticate user on connection using token
        # auth_header = request.headers.get("Authorization")
        # user_id = get_user_id_from_token(auth_header)
        # if not user_id:
        #     print(f"Client disconnected: Invalid token")
        #     return False # Reject connection
        # print(f"Client connected: {request.sid}, User ID: {user_id}")
        print(f"Client connected: {request.sid}")
        emit("connection_success", {"message": "Connected successfully"})

    @socketio_instance.on("disconnect")
    def handle_disconnect():
        print(f"Client disconnected: {request.sid}")

    @socketio_instance.on("join_room")
    def handle_join_room(data):
        """Handle client joining a chat room."""
        room_id = data.get("room_id")
        token = data.get("token") # Expect token for authorization

        if not room_id or not token:
            emit("error", {"message": "Missing room_id or token"})
            return

        try:
            decoded_token = decode_token(token)
            user_id = decoded_token["sub"]
        except Exception as e:
            emit("error", {"message": "Invalid or expired token"})
            return

        if not is_user_in_match_room(user_id, room_id):
            emit("error", {"message": "Unauthorized to join this room"})
            return

        room_name = f"match_room_{room_id}"
        join_room(room_name)
        print(f"User {user_id} joined room: {room_name} (sid: {request.sid})")
        emit("room_joined", {"room_id": room_id, "message": f"Successfully joined room {room_id}"}, room=room_name)
        
        # Optionally send recent chat history
        try:
            messages = ChatMessage.query.filter_by(room_id=room_id).order_by(ChatMessage.timestamp.asc()).limit(50).all()
            emit("chat_history", {"room_id": room_id, "messages": [msg.to_dict() for msg in messages]})
        except Exception as e:
             print(f"Error fetching chat history for room {room_id}: {e}")

    @socketio_instance.on("leave_room")
    def handle_leave_room(data):
        """Handle client leaving a chat room."""
        room_id = data.get("room_id")
        if not room_id:
             emit("error", {"message": "Missing room_id"})
             return
             
        room_name = f"match_room_{room_id}"
        leave_room(room_name)
        # user_id = get_user_id_from_token(request.headers.get("Authorization")) # Get user ID if needed
        print(f"Client {request.sid} left room: {room_name}")
        emit("room_left", {"room_id": room_id, "message": f"Successfully left room {room_id}"})

    @socketio_instance.on("send_message")
    def handle_send_message(data):
        """Handle receiving and broadcasting messages."""
        room_id = data.get("room_id")
        content = data.get("content")
        token = data.get("token") # Expect token for authorization

        if not room_id or not content or not token:
            emit("error", {"message": "Missing room_id, content, or token"})
            return

        try:
            decoded_token = decode_token(token)
            user_id = decoded_token["sub"]
        except Exception as e:
            emit("error", {"message": "Invalid or expired token"})
            return

        if not is_user_in_match_room(user_id, room_id):
            emit("error", {"message": "Unauthorized to send message to this room"})
            return

        try:
            # Save message to database
            # Corrected string literal
            message = ChatMessage(
                room_id=room_id,
                sender_id=user_id,
                content=content,
                message_type="user"
            )
            db.session.add(message)
            db.session.commit()

            # Broadcast message to the room
            room_name = f"match_room_{room_id}"
            emit("new_message", message.to_dict(), room=room_name)
            print(f"Message sent by User {user_id} to room {room_name}: {content}")

        except Exception as e:
            db.session.rollback()
            print(f"Error saving/sending message: {e}")
            emit("error", {"message": "Failed to send message"})

    # Add more event handlers as needed (e.g., typing indicators)

    print("SocketIO events registered.")

# Note: Need to implement sending system messages via a regular HTTP endpoint
# or a dedicated SocketIO event triggered by backend logic (e.g., after match confirmation).

