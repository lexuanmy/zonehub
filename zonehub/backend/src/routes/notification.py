from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.notification import Notification
from src.app import db
from datetime import datetime

notification_bp = Blueprint('notification', __name__, url_prefix='/api/notifications')

@notification_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_notifications():
    """Get all notifications for the current user"""
    user_id = get_jwt_identity()
    
    # Get query parameters for filtering
    is_read = request.args.get('is_read')
    
    # Start with base query
    query = Notification.query.filter_by(user_id=user_id)
    
    # Apply filters if provided
    if is_read is not None:
        is_read_bool = is_read.lower() == 'true'
        query = query.filter(Notification.is_read == is_read_bool)
    
    # Order by creation date, newest first
    query = query.order_by(Notification.created_at.desc())
    
    # Execute query and return results
    notifications = query.all()
    return jsonify({'notifications': [notification.to_dict() for notification in notifications]}), 200

@notification_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    user_id = get_jwt_identity()
    notification = Notification.query.get(notification_id)
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    # Check if user is the notification owner
    if notification.user_id != user_id:
        return jsonify({'error': 'Unauthorized access'}), 403
    
    # Mark notification as read
    notification.is_read = True
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Notification marked as read',
            'notification': notification.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for the current user"""
    user_id = get_jwt_identity()
    
    try:
        # Update all unread notifications for the user
        Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
        db.session.commit()
        
        return jsonify({'message': 'All notifications marked as read'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications for the current user"""
    user_id = get_jwt_identity()
    
    count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    
    return jsonify({'unread_count': count}), 200
