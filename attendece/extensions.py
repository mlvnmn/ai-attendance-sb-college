from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO

db = SQLAlchemy()
# async_mode is set explicitly in app.py's init_app call
socketio = SocketIO(cors_allowed_origins="*")
