from flask import Blueprint, request, jsonify
from flask_mail import Message
from src.app import mail
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User

email_bp = Blueprint('email', __name__)

@email_bp.route('/send', methods=['POST'])
@jwt_required()
def send_email():
    """Send an email"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['subject', 'body']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Get recipient email
    recipient_email = data.get('recipient_email')
    recipient_id = data.get('recipient_id')
    
    if not recipient_email and not recipient_id:
        return jsonify({'error': 'Either recipient_email or recipient_id is required'}), 400
    
    if recipient_id:
        recipient = User.query.get(recipient_id)
        if not recipient:
            return jsonify({'error': 'Recipient user not found'}), 404
        recipient_email = recipient.email
    
    try:
        # Create message
        msg = Message(
            subject=data['subject'],
            recipients=[recipient_email],
            body=data['body'],
            sender=user.email
        )
        
        # Send email
        mail.send(msg)
        
        return jsonify({'message': 'Email sent successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@email_bp.route('/notify-booking', methods=['POST'])
@jwt_required()
def notify_booking():
    """Send booking notification email"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['booking_id', 'field_name', 'start_time', 'end_time', 'recipient_email']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        # Create message
        subject = f"Booking Confirmation: {data['field_name']}"
        body = f"""
        Dear User,
        
        Your booking has been confirmed:
        
        Field: {data['field_name']}
        Date: {data['start_time']} to {data['end_time']}
        Booking ID: {data['booking_id']}
        
        Thank you for using ZoneHub!
        """
        
        msg = Message(
            subject=subject,
            recipients=[data['recipient_email']],
            body=body,
            sender="zonehub.service@gmail.com"
        )
        
        # Send email
        mail.send(msg)
        
        return jsonify({'message': 'Booking notification email sent successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
