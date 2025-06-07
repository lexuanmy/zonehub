from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.booking import Booking, Payment
from src.models.field import Field
from src.models.user import User
from src.app import db
from datetime import datetime

booking_bp = Blueprint('booking', __name__)

@booking_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_bookings():
    """Get all bookings for the current user"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get query parameters for filtering
    status = request.args.get('status')
    
    # Start with base query
    query = Booking.query.filter_by(user_id=current_user_id)
    
    # Apply filters if provided
    if status:
        query = query.filter(Booking.status == status)
    
    # Execute query and return results
    bookings = query.all()
    return jsonify({'bookings': [booking.to_dict() for booking in bookings]}), 200

@booking_bp.route('/field/<int:field_id>', methods=['GET'])
@jwt_required()
def get_field_bookings(field_id):
    """Get all bookings for a specific field (owner or admin only)"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    field = Field.query.get(field_id)
    
    if not field:
        return jsonify({'error': 'Field not found'}), 404
    
    # Check if user is owner or admin
    if field.owner_id != current_user_id and user.role != 'admin':
        return jsonify({'error': 'Unauthorized access'}), 403
    
    # Get all bookings for the field
    bookings = Booking.query.filter_by(field_id=field_id).all()
    return jsonify({'bookings': [booking.to_dict() for booking in bookings]}), 200

@booking_bp.route('/', methods=['POST'])
@jwt_required()
def create_booking():
    """Create a new booking"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['field_id', 'start_time', 'end_time', 'total_price']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if field exists
    field = Field.query.get(data['field_id'])
    if not field:
        return jsonify({'error': 'Field not found'}), 404
    
    # Parse datetime strings
    try:
        start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Invalid datetime format'}), 400
    
    # Check if the time slot is available
    overlapping_bookings = Booking.query.filter(
        Booking.field_id == data['field_id'],
        Booking.status != 'cancelled',
        Booking.start_time < end_time,
        Booking.end_time > start_time
    ).all()
    
    if overlapping_bookings:
        return jsonify({'error': 'Time slot is not available'}), 400
    
    # Create new booking
    try:
        booking = Booking(
            field_id=data['field_id'],
            user_id=current_user_id,
            start_time=start_time,
            end_time=end_time,
            status='pending',
            total_price=data['total_price'],
            notes=data.get('notes')
        )
        
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'message': 'Booking created successfully',
            'booking': booking.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/<int:booking_id>', methods=['PUT'])
@jwt_required()
def update_booking(booking_id):
    """Update booking status (user, owner, or admin)"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    # Check if user is the booking owner, field owner, or admin
    field = Field.query.get(booking.field_id)
    
    if booking.user_id != current_user_id and field.owner_id != current_user_id and user.role != 'admin':
        return jsonify({'error': 'Unauthorized access'}), 403
    
    data = request.get_json()
    
    # Update booking status
    if 'status' in data:
        booking.status = data['status']
    
    # Update notes
    if 'notes' in data:
        booking.notes = data['notes']
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Booking updated successfully',
            'booking': booking.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@booking_bp.route('/<int:booking_id>/payment', methods=['POST'])
@jwt_required()
def create_payment(booking_id):
    """Create a payment for a booking"""
    current_user_id = get_jwt_identity()
    
    # Verify user exists
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    # Check if user is the booking owner
    if booking.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized access'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['amount', 'payment_method']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Create new payment
    try:
        payment = Payment(
            booking_id=booking_id,
            amount=data['amount'],
            payment_method=data['payment_method'],
            transaction_id=data.get('transaction_id'),
            status='completed',
            payment_date=datetime.utcnow()
        )
        
        # Update booking status to confirmed
        booking.status = 'confirmed'
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            'message': 'Payment created successfully',
            'payment': payment.to_dict(),
            'booking': booking.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
