# Define Match, ChatRoom, ChatMessage models
from src.app import db
from datetime import datetime

class Match(db.Model):
    __tablename__ = 'matches'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=True, unique=True) # Link to a specific booking if applicable
    team_a_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    team_b_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    # Confirmation flow fields
    initiating_team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False) # Team that sent the initial request
    invited_team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False) # Team that received the request
    status = db.Column(db.String(30), default='pending_invitee_acceptance') # pending_invitee_acceptance, pending_initiator_confirmation, confirmed, completed, cancelled, expired
    # Match details
    match_date = db.Column(db.DateTime, nullable=True) # Can be derived from booking or set separately
    location = db.Column(db.String(255), nullable=True) # Can be derived from booking field
    score_team_a = db.Column(db.Integer, nullable=True)
    score_team_b = db.Column(db.Integer, nullable=True)
    # Reputation/FairPlay - simple implementation for now
    fair_play_rating_team_a = db.Column(db.Integer, nullable=True) # Rating given by team B
    fair_play_rating_team_b = db.Column(db.Integer, nullable=True) # Rating given by team A
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (optional, define if needed for easy access)
    team_a = db.relationship('Team', foreign_keys=[team_a_id], backref='matches_as_team_a')
    team_b = db.relationship('Team', foreign_keys=[team_b_id], backref='matches_as_team_b')
    booking = db.relationship('Booking', backref='match')
    chat_room = db.relationship('ChatRoom', backref='match', uselist=False) # One-to-one with ChatRoom

    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'team_a_id': self.team_a_id,
            'team_b_id': self.team_b_id,
            'initiating_team_id': self.initiating_team_id,
            'invited_team_id': self.invited_team_id,
            'status': self.status,
            'match_date': self.match_date.isoformat() if self.match_date else None,
            'location': self.location,
            'score_team_a': self.score_team_a,
            'score_team_b': self.score_team_b,
            'fair_play_rating_team_a': self.fair_play_rating_team_a,
            'fair_play_rating_team_b': self.fair_play_rating_team_b,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class ChatRoom(db.Model):
    __tablename__ = 'chat_rooms'

    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey('matches.id'), nullable=False, unique=True) # Each match gets one room
    status = db.Column(db.String(20), default='active') # active, archived, read_only
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    messages = db.relationship('ChatMessage', backref='room', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'match_id': self.match_id,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('chat_rooms.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Null if system message
    message_type = db.Column(db.String(20), default='user') # user, system
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Relationships
    sender = db.relationship('User', backref='sent_chat_messages')

    def to_dict(self):
        return {
            'id': self.id,
            'room_id': self.room_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.full_name if self.sender else 'Hệ thống', # Include sender name
            'message_type': self.message_type,
            'content': self.content,
            'timestamp': self.timestamp.isoformat()
        }

# Add relationships to other models if needed
# Example: Add to Booking model
# match = db.relationship('Match', backref='booking', uselist=False)

# Example: Add to Team model for reputation (simple average)
# fair_play_score = db.Column(db.Float, nullable=True)

