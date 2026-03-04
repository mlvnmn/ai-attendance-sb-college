import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

class EmailService:
    def __init__(self):
        # In a real app, use env vars. For now, we will just print if no credentials.
        self.smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', 587))
        self.sender_email = os.environ.get('SENDER_EMAIL')
        self.sender_password = os.environ.get('SENDER_PASSWORD')

    def send_email(self, to_email, subject, body):
        if not self.sender_email or not self.sender_password:
            print(f"-------- MOCK EMAIL --------")
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(f"Body: {body}")
            print(f"----------------------------")
            return

        try:
            msg = MIMEMultipart()
            msg['From'] = self.sender_email
            msg['To'] = to_email
            msg['Subject'] = subject

            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.sender_email, self.sender_password)
            text = msg.as_string()
            server.sendmail(self.sender_email, to_email, text)
            server.quit()
            print(f"Email sent to {to_email}")
        except Exception as e:
            print(f"Failed to send email: {e}")

    def send_attendance_notifications(self, present_students, absent_students):
        # Notify Present Students
        for student in present_students:
            if student.email:
                self.send_email(
                    student.email, 
                    "Attendance: Present", 
                    f"Hi {student.name},\n\nYou have been marked PRESENT for today's class."
                )

        # Notify Absent Students AND Parents
        for student in absent_students:
            if student.email:
                self.send_email(
                    student.email, 
                    "Attendance: Absent", 
                    f"Hi {student.name},\n\nYou have been marked ABSENT for today's class."
                )
            if student.parent_email:
                self.send_email(
                    student.parent_email, 
                    f"Absence Alert: {student.name}", 
                    f"Dear Parent,\n\nThis is to inform you that {student.name} was marked ABSENT for today's class."
                )
