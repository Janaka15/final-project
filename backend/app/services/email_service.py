import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings

def send_booking_confirmation(to_email: str, name: str, booking: dict):
    subject = f"Booking Confirmed — {booking['confirmation_code']} | Somerset Mirissa"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2a9d8f;">Booking Confirmed!</h2>
        <p>Dear {name},</p>
        <p>Your booking at <strong>Somerset Mirissa Beach Hotel</strong> has been confirmed.</p>
        <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px;"><strong>Confirmation Code</strong></td>
                <td style="padding: 8px;">{booking['confirmation_code']}</td></tr>
            <tr><td style="padding: 8px;"><strong>Room Type</strong></td>
                <td style="padding: 8px;">{booking['room_type']}</td></tr>
            <tr><td style="padding: 8px;"><strong>Check-in</strong></td>
                <td style="padding: 8px;">{booking['check_in']}</td></tr>
            <tr><td style="padding: 8px;"><strong>Check-out</strong></td>
                <td style="padding: 8px;">{booking['check_out']}</td></tr>
            <tr><td style="padding: 8px;"><strong>Guests</strong></td>
                <td style="padding: 8px;">{booking['guests']}</td></tr>
            <tr><td style="padding: 8px;"><strong>Total Price</strong></td>
                <td style="padding: 8px;">LKR {booking['total_price']:,}</td></tr>
        </table>
        <p>We look forward to welcoming you!</p>
        <p style="color: #888;">Somerset Mirissa Beach Hotel, Mirissa, Sri Lanka</p>
    </body>
    </html>
    """
    _send_email(to_email, subject, body)

def send_booking_cancellation(to_email: str, name: str, booking: dict):
    subject = f"Booking Cancelled — {booking['confirmation_code']} | Somerset Mirissa"
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #e63946;">Booking Cancelled</h2>
        <p>Dear {name},</p>
        <p>Your booking at <strong>Somerset Mirissa Beach Hotel</strong> has been cancelled.</p>
        <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px;"><strong>Confirmation Code</strong></td>
                <td style="padding: 8px;">{booking['confirmation_code']}</td></tr>
            <tr><td style="padding: 8px;"><strong>Check-in</strong></td>
                <td style="padding: 8px;">{booking['check_in']}</td></tr>
            <tr><td style="padding: 8px;"><strong>Check-out</strong></td>
                <td style="padding: 8px;">{booking['check_out']}</td></tr>
        </table>
        <p>We hope to see you again soon!</p>
        <p style="color: #888;">Somerset Mirissa Beach Hotel, Mirissa, Sri Lanka</p>
    </body>
    </html>
    """
    _send_email(to_email, subject, body)

def _send_email(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_EMAIL
        msg["To"] = to_email
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_EMAIL, to_email, msg.as_string())
    except Exception as e:
        print(f"Email send failed: {e}")