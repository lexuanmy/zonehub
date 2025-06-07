import os
from dotenv import load_dotenv
from src.config.mysql_connector import pymysql

# Tải biến môi trường từ file .env
load_dotenv()

# Cấu hình kết nối MySQL
DB_CONFIG = {
    'username': os.environ.get('DB_USERNAME', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': os.environ.get('DB_PORT', '3306'),
    'database': os.environ.get('DB_NAME', 'zonehub')
}

# Tạo connection string cho SQLAlchemy
def get_database_uri():
    # Kiểm tra môi trường, nếu là testing thì dùng SQLite
    if os.environ.get('FLASK_ENV') == 'testing':
        return 'sqlite:///zonehub.db'
    
    # Nếu không phải testing, dùng MySQL
    return f"mysql+pymysql://{DB_CONFIG['username']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
