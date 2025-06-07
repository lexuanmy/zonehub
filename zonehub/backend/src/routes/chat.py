# This file contained routes for a general chat system.
# It has been deprecated in favor of the match-specific chat system.
# Commenting out the content to avoid ImportError.

# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from src.models import db
# from src.models.user import User
# # Attempting to import from the now-empty models/chat.py causes ImportError
# # from src.models.chat import ChatMessage, ChatRoom, ChatRoomMember 
# from datetime import datetime

# chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

# # --- Placeholder Endpoints for the old chat system --- 

# @chat_bp.route("/rooms", methods=["GET"])
# @jwt_required()
# def get_chat_rooms():
#     # Logic to get rooms user is part of
#     return jsonify({"message": "Old chat rooms endpoint - deprecated"}), 200

# @chat_bp.route("/rooms/<int:room_id>/messages", methods=["GET"])
# @jwt_required()
# def get_room_messages(room_id):
#     # Logic to get messages for a specific room
#     return jsonify({"message": f"Old messages endpoint for room {room_id} - deprecated"}), 200

# @chat_bp.route("/messages", methods=["POST"])
# @jwt_required()
# def send_chat_message():
#     # Logic to send a message in the old system
#     return jsonify({"message": "Old send message endpoint - deprecated"}), 201

