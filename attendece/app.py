import eventlet
eventlet.monkey_patch()

from flask import Flask, send_from_directory, request, jsonify, session
from extensions import db, socketio
from flask_socketio import emit
import os
import base64
import numpy as np
import cv2
import functools

# ── App Setup ──────────────────────────────────────────────────────────────
# Serve the React build from frontend/dist at the root URL
app = Flask(
    __name__,
    static_folder='frontend/dist',
    static_url_path=''
)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'secret!')

# ── Database ───────────────────────────────────────────────────────────────
database_url = os.environ.get('DATABASE_URL', 'sqlite:///attendance.db')
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ── Security ───────────────────────────────────────────────────────────────
TEACHER_PASSWORD = os.environ.get('TEACHER_PASSWORD', 'admin123')

# ── Extensions ─────────────────────────────────────────────────────────────
db.init_app(app)
socketio.init_app(app, cors_allowed_origins="*", async_mode='eventlet')

# ── Auth Decorator ─────────────────────────────────────────────────────────
def login_required(f):
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if not session.get('logged_in'):
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return wrapped

# ── Models & Services ──────────────────────────────────────────────────────
with app.app_context():
    from models import Student, Attendance
    db.create_all()

from services.face_service import FaceService
from services.email_service import EmailService

face_service = FaceService()
email_service = EmailService()

# ═══════════════════════════════════════════════════════════════════════════
# API ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if data.get('password') == TEACHER_PASSWORD:
        session['logged_in'] = True
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Invalid Password'}), 401

@app.route('/api/students', methods=['GET'])
def get_students():
    if not session.get('logged_in'):
        return jsonify({'error': 'Unauthorized'}), 401
    students = Student.query.all()
    return jsonify([s.to_dict() for s in students])

@app.route('/api/students', methods=['POST'])
@login_required
def add_student():
    name = request.form.get('name')
    email = request.form.get('email')
    parent_email = request.form.get('parent_email')
    photo = request.files.get('photo')

    if not name or not photo:
        return jsonify({'error': 'Name and Photo are required'}), 400

    encoding = face_service.encode_image(photo)
    if encoding is None:
        return jsonify({'error': 'No face detected in photo. Use a clear, front-facing photo.'}), 400

    new_student = Student(
        name=name,
        email=email,
        parent_email=parent_email,
        face_encoding=encoding
    )
    db.session.add(new_student)
    db.session.commit()

    all_students = Student.query.all()
    face_service.load_known_faces(all_students)

    return jsonify({'message': 'Student added', 'student': new_student.to_dict()}), 201

@app.route('/api/students/<int:id>', methods=['DELETE'])
@login_required
def delete_student(id):
    student = Student.query.get_or_404(id)
    try:
        # Delete all attendance records for this student first (FK constraint)
        Attendance.query.filter_by(student_id=id).delete()
        db.session.delete(student)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete student: {str(e)}'}), 500

    all_students = Student.query.all()
    face_service.load_known_faces(all_students)

    return jsonify({'message': 'Student deleted'})

# ═══════════════════════════════════════════════════════════════════════════
# SOCKETIO EVENTS
# ═══════════════════════════════════════════════════════════════════════════

pending_student_ids = set()

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    if not face_service.is_trained:
        with app.app_context():
            students = Student.query.all()
            face_service.load_known_faces(students)

@socketio.on('frame_process')
def handle_frame(data):
    image_data = data['image'].split(',')[1]
    nparr = np.frombuffer(base64.b64decode(image_data), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    found_ids, total_faces = face_service.process_frame(rgb_frame)

    for sid in found_ids:
        if sid not in pending_student_ids:
            pending_student_ids.add(sid)

    current_students_query = Student.query.filter(Student.id.in_(found_ids)).all()
    current_list = [{'id': s.id, 'name': s.name} for s in current_students_query]

    marked_students_query = Student.query.filter(Student.id.in_(pending_student_ids)).all()
    marked_list = [{'id': s.id, 'name': s.name} for s in marked_students_query]

    emit('attendance_update', {
        'current_students': current_list,
        'marked_students': marked_list,
        'total_faces': total_faces
    })

@socketio.on('reset_session')
def handle_reset():
    global pending_student_ids
    pending_student_ids = set()
    emit('session_reset', {'message': 'Session cleared'})

@socketio.on('commit_attendance')
def handle_commit():
    global pending_student_ids
    if not pending_student_ids:
        return

    present_students = []

    for sid in pending_student_ids:
        student = Student.query.get(sid)
        if student:
            record = Attendance(student_id=sid, status='Present')
            db.session.add(record)
            present_students.append(student)

    db.session.commit()

    all_students = Student.query.all()
    absent_students = [s for s in all_students if s.id not in pending_student_ids]

    for s in absent_students:
        record = Attendance(student_id=s.id, status='Absent')
        db.session.add(record)

    db.session.commit()

    email_service.send_attendance_notifications(present_students, absent_students)

    pending_student_ids = set()
    emit('attendance_committed', {
        'message': f'Attendance finalised. {len(present_students)} Present, {len(absent_students)} Absent.'
    })

# ═══════════════════════════════════════════════════════════════════════════
# SERVE REACT SPA  (catch-all — must be LAST)
# ═══════════════════════════════════════════════════════════════════════════

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React build files. Fall back to index.html for client-side routing."""
    static_file = os.path.join(app.static_folder, path)
    if path and os.path.exists(static_file):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, debug=True, host='0.0.0.0', port=port)
