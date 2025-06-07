import os
from dotenv import load_dotenv

# Tải biến môi trường từ file .env
load_dotenv()

# Cấu hình cho Flask
FLASK_CONFIG = {
    'SECRET_KEY': os.environ.get('SECRET_KEY', 'zonehub_secret_key'),
    'DEBUG': os.environ.get('FLASK_DEBUG', '1') == '1',
    'ENV': os.environ.get('FLASK_ENV', 'development')
}

# Cấu hình cho JWT
JWT_CONFIG = {
    'SECRET_KEY': os.environ.get('JWT_SECRET_KEY', 'zonehub_jwt_secret_key'),
    'EXPIRATION': int(os.environ.get('JWT_EXPIRATION', 86400))
}

# Cấu hình cho CORS
CORS_CONFIG = {
    'ORIGINS': os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
}
