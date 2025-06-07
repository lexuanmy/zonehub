# Database models initialization
from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy without binding to app
db = SQLAlchemy()

# Import all models here so Flask-Migrate can detect them
from .user import User, Team, TeamMember
from .field import Field, FieldComplex
from .booking import Booking, Payment
from .team_finder import FindTeamRequest, FindOpponentRequest, Invitation
from .notification import Notification
# from .chat import ChatMessage as OldChatMessage # Keep old chat if needed, or remove
from .match_chat import Match, ChatRoom, ChatMessage # Import new models

