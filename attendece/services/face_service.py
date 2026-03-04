import cv2
import numpy as np
import io

class FaceService:
    def __init__(self):
        self.known_face_ids = []
        # Load OpenCV Haar Cascade for detection
        haarcascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(haarcascade_path)
        if self.face_cascade.empty():
            print("Error loading Haar Cascade!")

        # LBPH Face Recognizer for actual recognition
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        self.is_trained = False

        # Confidence threshold - lower = stricter match
        self.CONFIDENCE_THRESHOLD = 80

    def _detect_face(self, gray_img):
        """Detect and return the largest face ROI from a grayscale image."""
        faces = self.face_cascade.detectMultiScale(
            gray_img,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(50, 50)
        )
        if len(faces) == 0:
            return None, None
        # Pick the largest face
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        face_roi = gray_img[y:y+h, x:x+w]
        face_roi = cv2.resize(face_roi, (100, 100))
        # Histogram equalization for better lighting handling
        face_roi = cv2.equalizeHist(face_roi)
        return face_roi, (x, y, w, h)

    def encode_image(self, image_file):
        """
        Extract the face ROI from the uploaded photo file and return as numpy array.
        Returns None if no face is found.
        """
        file_bytes = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img is None:
            print("Could not decode image file.")
            return None

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_roi, _ = self._detect_face(gray)

        if face_roi is None:
            print("No face detected in uploaded photo.")
            return None

        print("Face encoded successfully from uploaded photo.")
        return face_roi  # numpy array (100x100 grayscale)

    def load_known_faces(self, students):
        """
        Train the LBPH recognizer with stored face encodings from the database.
        """
        self.known_face_ids = []
        self.is_trained = False

        faces = []
        labels = []

        for student in students:
            if student.face_encoding is not None:
                face_array = student.face_encoding
                # Ensure correct type and shape
                if isinstance(face_array, np.ndarray) and face_array.shape == (100, 100):
                    faces.append(face_array.astype(np.uint8))
                    labels.append(student.id)
                    self.known_face_ids.append(student.id)

        if len(faces) >= 1:
            self.recognizer.train(faces, np.array(labels))
            self.is_trained = True
            print(f"LBPH recognizer trained with {len(faces)} student(s).")
        else:
            print("No valid face encodings found. Recognizer not trained.")

    def process_frame(self, frame_rgb):
        """
        Detect and recognize faces in a frame using LBPH.
        Returns: ([list of recognized student_ids], total_faces_count)
        """
        gray = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2GRAY)

        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(50, 50)
        )

        found_student_ids = []
        total_faces = len(faces)

        if not self.is_trained or total_faces == 0:
            return found_student_ids, total_faces

        for (x, y, w, h) in faces:
            face_roi = gray[y:y+h, x:x+w]
            face_roi = cv2.resize(face_roi, (100, 100))
            face_roi = cv2.equalizeHist(face_roi)

            try:
                label, confidence = self.recognizer.predict(face_roi)
                print(f"DEBUG: Predicted label={label}, confidence={confidence:.2f}")

                # For LBPH, a lower confidence score (distance) is a better match.
                # Usually values below 100 are decent matches.
                if confidence < 100: 
                    if label not in found_student_ids:
                        found_student_ids.append(label)
                    print(f"DEBUG: Student {label} RECOGNIZED with confidence {confidence:.2f}")
                else:
                    print(f"DEBUG: Face detected but confidence {confidence:.1f} is too high (threshold=100)")
            except Exception as e:
                print(f"DEBUG: Recognition error: {e}")

        return found_student_ids, total_faces
