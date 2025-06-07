from src.app import db
from datetime import datetime

class FindTeamRequest(db.Model):
    __tablename__ = 'find_team_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    position = db.Column(db.String(50), nullable=True)
    skill_level = db.Column(db.String(20), nullable=True)
    availability = db.Column(db.Text, nullable=True)  # JSON data for availability
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='active')  # active, matched, closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert find team request object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'position': self.position,
            'skill_level': self.skill_level,
            'availability': self.availability,
            'notes': self.notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class FindOpponentRequest(db.Model):
    __tablename__ = 'find_opponent_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    preferred_location = db.Column(db.String(100), nullable=True)
    preferred_date = db.Column(db.DateTime, nullable=True)
    skill_level = db.Column(db.String(20), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='active')  # active, matched, closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert find opponent request object to dictionary"""
        return {
            'id': self.id,
            'team_id': self.team_id,
            'preferred_location': self.preferred_location,
            'preferred_date': self.preferred_date.isoformat() if self.preferred_date else None,
            'skill_level': self.skill_level,
            'notes': self.notes,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Invitation(db.Model):
    __tablename__ = 'invitations'
    
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=True)
    type = db.Column(db.String(20), nullable=False)  # team_join, match_request
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected
    message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert invitation object to dictionary"""
        return {
            'id': self.id,
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'team_id': self.team_id,
            'type': self.type,
            'status': self.status,
            'message': self.message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
