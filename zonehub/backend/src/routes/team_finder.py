from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.team_finder import FindTeamRequest, FindOpponentRequest, Invitation
from src.models.user import User, Team, TeamMember
from src.app import db
from datetime import datetime

team_finder_bp = Blueprint('team_finder', __name__)

@team_finder_bp.route('/find-team', methods=['POST'])
@jwt_required()
def create_find_team_request():
    """Create a new request to find a team"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.get_json()
    
    # Validate required fields
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Create new find team request
    try:
        find_team_request = FindTeamRequest(
            user_id=current_user_id,
            position=data.get('position'),
            skill_level=data.get('skill_level'),
            availability=data.get('availability'),
            notes=data.get('notes'),
            status='active'
        )
        
        db.session.add(find_team_request)
        db.session.commit()
        
        return jsonify({
            'message': 'Find team request created successfully',
            'request': find_team_request.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@team_finder_bp.route('/find-team', methods=['GET'])
@jwt_required()
def get_find_team_requests():
    """Get all active find team requests"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    # Get query parameters for filtering
    position = request.args.get('position')
    skill_level = request.args.get('skill_level')
    
    # Start with base query for active requests
    query = FindTeamRequest.query.filter_by(status='active')
    
    # Apply filters if provided
    if position:
        query = query.filter(FindTeamRequest.position == position)
    
    if skill_level:
        query = query.filter(FindTeamRequest.skill_level == skill_level)
    
    # Execute query and return results
    requests = query.all()
    return jsonify({'requests': [request.to_dict() for request in requests]}), 200

@team_finder_bp.route('/find-opponent', methods=['POST'])
@jwt_required()
def create_find_opponent_request():
    """Create a new request to find an opponent team"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.get_json()
    
    # Validate required fields
    if not data or 'team_id' not in data:
        return jsonify({'error': 'Team ID is required'}), 400
    
    # Check if user is a member of the team
    team_member = TeamMember.query.filter_by(team_id=data['team_id'], user_id=current_user_id).first()
    if not team_member:
        return jsonify({'error': 'You are not a member of this team'}), 403
    
    # Create new find opponent request
    try:
        find_opponent_request = FindOpponentRequest(
            team_id=data['team_id'],
            preferred_location=data.get('preferred_location'),
            preferred_date=datetime.fromisoformat(data['preferred_date'].replace('Z', '+00:00')) if 'preferred_date' in data else None,
            skill_level=data.get('skill_level'),
            notes=data.get('notes'),
            status='active'
        )
        
        db.session.add(find_opponent_request)
        db.session.commit()
        
        return jsonify({
            'message': 'Find opponent request created successfully',
            'request': find_opponent_request.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@team_finder_bp.route('/find-opponent', methods=['GET'])
@jwt_required()
def get_find_opponent_requests():
    """Get all active find opponent requests"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    # Get query parameters for filtering
    location = request.args.get('location')
    skill_level = request.args.get('skill_level')
    
    # Start with base query for active requests
    query = FindOpponentRequest.query.filter_by(status='active')
    
    # Apply filters if provided
    if location:
        query = query.filter(FindOpponentRequest.preferred_location.like(f'%{location}%'))
    
    if skill_level:
        query = query.filter(FindOpponentRequest.skill_level == skill_level)
    
    # Execute query and return results
    requests = query.all()
    return jsonify({'requests': [request.to_dict() for request in requests]}), 200

@team_finder_bp.route('/invitation', methods=['POST'])
@jwt_required()
def create_invitation():
    """Create a new invitation"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['receiver_id', 'type']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Validate invitation type
    if data['type'] not in ['team_join', 'match_request']:
        return jsonify({'error': 'Invalid invitation type'}), 400
    
    # If team_join type, team_id is required
    if data['type'] == 'team_join' and 'team_id' not in data:
        return jsonify({'error': 'Team ID is required for team join invitations'}), 400
    
    # Create new invitation
    try:
        invitation = Invitation(
            sender_id=current_user_id,
            receiver_id=data['receiver_id'],
            team_id=data.get('team_id'),
            type=data['type'],
            status='pending',
            message=data.get('message')
        )
        
        db.session.add(invitation)
        db.session.commit()
        
        return jsonify({
            'message': 'Invitation created successfully',
            'invitation': invitation.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@team_finder_bp.route('/invitation/<int:invitation_id>', methods=['PUT'])
@jwt_required()
def respond_to_invitation(invitation_id):
    """Respond to an invitation"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    invitation = Invitation.query.get(invitation_id)
    
    if not invitation:
        return jsonify({'error': 'Invitation not found'}), 404
    
    # Check if user is the receiver of the invitation
    if invitation.receiver_id != current_user_id:
        return jsonify({'error': 'Unauthorized access'}), 403
    
    data = request.get_json()
    
    # Validate response
    if 'status' not in data or data['status'] not in ['accepted', 'rejected']:
        return jsonify({'error': 'Invalid response status'}), 400
    
    # Update invitation status
    invitation.status = data['status']
    
    # If accepted and it's a team join invitation, add user to team
    if data['status'] == 'accepted' and invitation.type == 'team_join' and invitation.team_id:
        # Check if user is already a member of the team
        existing_member = TeamMember.query.filter_by(team_id=invitation.team_id, user_id=current_user_id).first()
        if not existing_member:
            team_member = TeamMember(
                team_id=invitation.team_id,
                user_id=current_user_id,
                role='member'
            )
            db.session.add(team_member)
    
    try:
        db.session.commit()
        return jsonify({
            'message': f'Invitation {data["status"]}',
            'invitation': invitation.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@team_finder_bp.route('/invitation', methods=['GET'])
@jwt_required()
def get_user_invitations():
    """Get all invitations for the current user"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    # Get query parameters for filtering
    status = request.args.get('status')
    type = request.args.get('type')
    
    # Start with base query for invitations where user is receiver
    query = Invitation.query.filter_by(receiver_id=current_user_id)
    
    # Apply filters if provided
    if status:
        query = query.filter(Invitation.status == status)
    
    if type:
        query = query.filter(Invitation.type == type)
    
    # Execute query and return results
    invitations = query.all()
    return jsonify({'invitations': [invitation.to_dict() for invitation in invitations]}), 200
