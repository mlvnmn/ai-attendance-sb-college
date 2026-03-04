from extensions import db
from datetime import datetime

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    parent_email = db.Column(db.String(120), nullable=True)
    # Storing face encoding as a BLOB (Pickled numpy array or similar)
    face_encoding = db.Column(db.PickleType, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'parent_email': self.parent_email,
            'has_encoding': self.face_encoding is not None
        }

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    status = db.Column(db.String(20), nullable=False) # 'Present', 'Absent'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref=db.backref('attendance_records', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'student_name': self.student.name,
            'date': self.date.isoformat(),
            'status': self.status,
            'timestamp': self.timestamp.isoformat()
        }
