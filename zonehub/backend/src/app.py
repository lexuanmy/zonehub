# backend/src/app.py
import os
from flask import Flask
from dotenv import load_dotenv
from src.extensions import db, migrate, jwt, cors, socketio # Import socketio
from src.models import User, Team, Field, Booking # Import models to ensure they are registered
from src.routes.user import user_bp
from src.routes.field import field_bp
from src.routes.booking import booking_bp
from src.routes.team_finder import team_finder_bp
from src.routes.notification import notification_bp
# from src.routes.chat import chat_bp # Removed import for deprecated chat system
from src.routes.matchmaking import matchmaking_bp # Import new matchmaking routes
# Import chat events after defining create_app to avoid circular imports if needed
# from . import chat_events 

# Load environment variables
load_dotenv()

def create_app(config_name="default"):
    app = Flask(__name__)

    # Configuration
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "your_default_secret_key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "mysql+mysqlconnector://user:password@host/db_name")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "your_jwt_secret_key")

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}}) # Adjust origins as needed
    # Initialize SocketIO with the app
    # Use async_mode="eventlet" as specified in requirements.txt
    socketio.init_app(app, cors_allowed_origins="*") # Adjust origins

    # Register Blueprints
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(field_bp) # Already has url_prefix="/api/fields"
    app.register_blueprint(booking_bp, url_prefix="/api/bookings")
    app.register_blueprint(team_finder_bp, url_prefix="/api/team_finder")
    app.register_blueprint(notification_bp, url_prefix="/api/notifications")
    # app.register_blueprint(chat_bp, url_prefix="/api/chat") # Removed registration for deprecated chat system
    app.register_blueprint(matchmaking_bp) # Already has url_prefix="/api/matchmaking"

    # Import and register SocketIO event handlers here
    # This needs to be done after socketio is initialized
    from . import chat_events # Assuming chat_events.py is in the same directory (src)
    chat_events.register_events(socketio)

    return app

