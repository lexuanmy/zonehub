import os
import sys

# Thêm thư mục gốc vào sys.path để có thể import các module từ src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the factory function and socketio instance
from src.app import create_app
from src.extensions import socketio
# Removed init_db import as it's typically handled by migrations
# from src.app import init_db 

# Create the Flask app instance using the factory
app = create_app()

if __name__ == '__main__':
    # Database initialization/migration should be done via Flask-Migrate commands
    # init_db() # Removed this call
    
    # Chạy ứng dụng với SocketIO
    port = int(os.environ.get('PORT', 5000))
    # Use the socketio instance imported from extensions
    # The app instance is passed to socketio.run
    socketio.run(app, host='127.0.0.1', port=port, debug=True, allow_unsafe_werkzeug=True)

