# backend/src/routes/matchmaking.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models import db
from src.models.user import User, Team, TeamMember
from src.models.booking import Booking
from src.models.team_finder import FindOpponentRequest # May need adjustment
from src.models.match_chat import Match, ChatRoom, ChatMessage # Import new models
from datetime import datetime

matchmaking_bp = Blueprint("matchmaking", __name__, url_prefix="/api/matchmaking")

# --- Helper Functions (Placeholder) --- 
def calculate_match_score(request1, request2):
    """Placeholder for the scoring algorithm."""
    # Logic based on location, time, skill level, etc.
    score = 0
    # Example: Check skill level
    # if request1.skill_level == request2.skill_level: score += 5
    # elif abs(skill_level_to_int(request1.skill_level) - skill_level_to_int(request2.skill_level)) == 1: score += 3
    # ... add more criteria
    return score

def find_best_matches(current_request):
    """Placeholder for finding potential matches based on score."""
    # Query active FindOpponentRequests, calculate scores, return top suggestions
    # potential_matches = FindOpponentRequest.query.filter(FindOpponentRequest.status == 'active', FindOpponentRequest.team_id != current_request.team_id).all()
    # scored_matches = []
    # for match in potential_matches:
    #     score = calculate_match_score(current_request, match)
    #     scored_matches.append((match, score))
    # scored_matches.sort(key=lambda x: x[1], reverse=True)
    # return scored_matches[:5] # Return top 5 suggestions
    return []

# --- API Endpoints --- 

@matchmaking_bp.route("/suggestions/<int:request_id>", methods=["GET"])
@jwt_required()
def get_match_suggestions(request_id):
    """Get potential match suggestions for a specific FindOpponentRequest."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    find_opponent_request = FindOpponentRequest.query.get(request_id)
    if not find_opponent_request or find_opponent_request.status != 'active':
        return jsonify({"error": "Request not found or not active"}), 404

    # Ensure the user is part of the requesting team
    is_member = TeamMember.query.filter_by(team_id=find_opponent_request.team_id, user_id=current_user_id).first()
    if not is_member:
         return jsonify({"error": "Unauthorized"}), 403

    suggestions = find_best_matches(find_opponent_request)
    # Format suggestions for response
    suggestions_data = [req.to_dict() for req, score in suggestions]
    
    return jsonify({"suggestions": suggestions_data}), 200

@matchmaking_bp.route("/challenge", methods=["POST"])
@jwt_required()
def create_match_challenge():
    """Team A challenges Team B."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    required_fields = ["initiating_team_id", "invited_team_id"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing initiating_team_id or invited_team_id"}), 400

    initiating_team_id = data["initiating_team_id"]
    invited_team_id = data["invited_team_id"]
    booking_id = data.get("booking_id") # Optional: link to a pre-existing booking
    match_date_str = data.get("match_date") # Optional: propose a date/time
    location = data.get("location") # Optional: propose a location

    # Validate teams exist
    team_a = Team.query.get(initiating_team_id)
    team_b = Team.query.get(invited_team_id)
    if not team_a or not team_b:
        return jsonify({"error": "One or both teams not found"}), 404
    if initiating_team_id == invited_team_id:
        return jsonify({"error": "Cannot challenge the same team"}), 400

    # Check if user is a member (e.g., captain) of the initiating team
    is_member = TeamMember.query.filter_by(team_id=initiating_team_id, user_id=current_user_id).first() # Add role check if needed
    if not is_member:
        return jsonify({"error": "User is not a member of the initiating team"}), 403
        
    # Check for existing pending matches between these teams?
    existing_match = Match.query.filter(
        ((Match.team_a_id == initiating_team_id) & (Match.team_b_id == invited_team_id)) |
        ((Match.team_a_id == invited_team_id) & (Match.team_b_id == initiating_team_id)),
        Match.status.like('pending_%') # Corrected string literal
    ).first()
    if existing_match:
        return jsonify({"error": "A pending match/challenge already exists between these teams"}), 409

    try:
        match_date = datetime.fromisoformat(match_date_str) if match_date_str else None
        
        new_match = Match(
            team_a_id=initiating_team_id, # Convention: team_a is initiator
            team_b_id=invited_team_id,    # Convention: team_b is invitee
            initiating_team_id=initiating_team_id,
            invited_team_id=invited_team_id,
            booking_id=booking_id,
            match_date=match_date,
            location=location,
            status='pending_invitee_acceptance' # Corrected string literal
        )
        db.session.add(new_match)
        db.session.commit()
        
        # TODO: Send notification to invited team's captain(s)
        
        return jsonify({"message": "Challenge sent successfully", "match": new_match.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating challenge: {e}")
        return jsonify({"error": "Failed to create challenge"}), 500

@matchmaking_bp.route("/matches/<int:match_id>/accept", methods=["PUT"])
@jwt_required()
def accept_match_challenge(match_id):
    """Invited team (Team B) accepts the challenge."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    match = Match.query.get(match_id)
    if not match:
        return jsonify({"error": "Match not found"}), 404

    # Check if the current user is part of the invited team (Team B)
    is_member = TeamMember.query.filter_by(team_id=match.invited_team_id, user_id=current_user_id).first()
    if not is_member:
        return jsonify({"error": "User is not a member of the invited team"}), 403

    if match.status != 'pending_invitee_acceptance': # Corrected string literal
        return jsonify({"error": f"Cannot accept match in status: {match.status}"}), 400

    try:
        match.status = 'pending_initiator_confirmation' # Corrected string literal
        match.updated_at = datetime.utcnow()
        db.session.commit()
        
        # TODO: Send notification to initiating team's captain(s)
        
        return jsonify({"message": "Challenge accepted, awaiting final confirmation", "match": match.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error accepting challenge: {e}")
        return jsonify({"error": "Failed to accept challenge"}), 500

@matchmaking_bp.route("/matches/<int:match_id>/confirm", methods=["PUT"])
@jwt_required()
def confirm_match(match_id):
    """Initiating team (Team A) confirms the accepted challenge."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    match = Match.query.get(match_id)
    if not match:
        return jsonify({"error": "Match not found"}), 404

    # Check if the current user is part of the initiating team (Team A)
    is_member = TeamMember.query.filter_by(team_id=match.initiating_team_id, user_id=current_user_id).first()
    if not is_member:
        return jsonify({"error": "User is not a member of the initiating team"}), 403

    if match.status != 'pending_initiator_confirmation': # Corrected string literal
        return jsonify({"error": f"Cannot confirm match in status: {match.status}"}), 400

    try:
        match.status = 'confirmed' # Corrected string literal
        match.updated_at = datetime.utcnow()
        
        # Create Chat Room automatically
        chat_room = ChatRoom(match_id=match.id, status='active') # Corrected string literal
        db.session.add(chat_room)
        
        # Add system message to chat room
        system_message = ChatMessage(
            room_id=chat_room.id, 
            message_type='system', # Corrected string literal
            content=f"Trận đấu giữa {match.team_a.name} và {match.team_b.name} đã được xác nhận."
        )
        # We need the chat_room.id, so commit chat_room first or handle differently
        db.session.flush() # Get chat_room.id before commit
        system_message.room_id = chat_room.id
        db.session.add(system_message)
        
        db.session.commit()
        
        # TODO: Send notification to both teams
        
        return jsonify({"message": "Match confirmed successfully! Chat room created.", "match": match.to_dict(), "chat_room_id": chat_room.id}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error confirming match: {e}")
        return jsonify({"error": "Failed to confirm match"}), 500

@matchmaking_bp.route("/matches/<int:match_id>/cancel", methods=["PUT"])
@jwt_required()
def cancel_match(match_id):
    """Cancel a pending or confirmed match."""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    match = Match.query.get(match_id)
    if not match:
        return jsonify({"error": "Match not found"}), 404

    # Check if user is part of either team involved
    is_member_a = TeamMember.query.filter_by(team_id=match.team_a_id, user_id=current_user_id).first()
    is_member_b = TeamMember.query.filter_by(team_id=match.team_b_id, user_id=current_user_id).first()
    if not is_member_a and not is_member_b:
        return jsonify({"error": "User is not part of either team involved in the match"}), 403

    # Define cancellable statuses
    cancellable_statuses = ['pending_invitee_acceptance', 'pending_initiator_confirmation', 'confirmed'] # Corrected string literals
    if match.status not in cancellable_statuses:
        return jsonify({"error": f"Cannot cancel match in status: {match.status}"}), 400

    try:
        original_status = match.status
        match.status = 'cancelled' # Corrected string literal
        match.updated_at = datetime.utcnow()
        
        # Archive chat room if it exists
        if match.chat_room:
            match.chat_room.status = 'archived' # Corrected string literal
            # Add system message about cancellation
            system_message = ChatMessage(
                room_id=match.chat_room.id,
                message_type='system', # Corrected string literal
                content=f"Trận đấu đã bị hủy bởi {user.full_name} (Đội {'A' if is_member_a else 'B'})."
            )
            db.session.add(system_message)
            
        db.session.commit()
        
        # TODO: Send notification to the other team
        
        return jsonify({"message": "Match cancelled successfully.", "match": match.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error cancelling match: {e}")
        return jsonify({"error": "Failed to cancel match"}), 500

# Add endpoints for match history, submitting scores, rating fair play etc. later

