import smtplib
import random
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

def get_env_clean(key: str, default: str) -> str:
    val = os.getenv(key, default)
    if val:
        val = val.strip()
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        val = val.strip()
    return val

# Email config
MAIL_USERNAME = get_env_clean("MAIL_USERNAME", "support.cureconnect@gmail.com")
MAIL_PASSWORD = get_env_clean("MAIL_PASSWORD", "uxdu sijc ujyr qfvk")
MAIL_FROM = get_env_clean("MAIL_FROM", "CureConnect <support.cureconnect@gmail.com>")
MAIL_SERVER = get_env_clean("MAIL_SERVER", "smtp.gmail.com")

try:
    MAIL_PORT = int(get_env_clean("MAIL_PORT", "587"))
except ValueError:
    MAIL_PORT = 587

# OTP store in memory
otp_store = {}

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))

def store_otp(email: str, otp: str):
    otp_store[email.lower()] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=10)
    }
    logger.info(f"OTP stored for {email}: {otp}")

def verify_otp(email: str, otp: str) -> bool:
    email = email.lower()
    if email not in otp_store:
        logger.warning(f"No OTP found for {email}")
        return False
    stored = otp_store[email]
    if datetime.utcnow() > stored["expires"]:
        del otp_store[email]
        logger.warning(f"OTP expired for {email}")
        return False
    if stored["otp"] != otp:
        logger.warning(f"Wrong OTP for {email}")
        return False
    del otp_store[email]
    return True

def send_otp_email(to_email: str, otp: str, user_name: str = "User") -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "🔐 Your CureConnect OTP Code"
        msg["From"] = MAIL_FROM
        msg["To"] = to_email

        html = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#F0F4F8;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:40px 0;">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(3,4,94,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:#03045E;padding:32px;text-align:center;">
                      <div style="font-size:40px;margin-bottom:8px;">✚</div>
                      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;">CureConnect</h1>
                      <p style="color:rgba(144,224,239,0.8);margin:4px 0 0;font-size:13px;">Your Personal Health Companion</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:32px;">
                      <h2 style="color:#03045E;margin:0 0 8px;font-size:20px;">Hi {user_name}! 👋</h2>
                      <p style="color:#6B7280;font-size:14px;line-height:22px;margin:0 0 24px;">
                        We received a request to reset your CureConnect password. Use the OTP below to proceed.
                      </p>

                      <!-- OTP Box -->
                      <div style="background:#F0F4F8;border-radius:16px;padding:24px;text-align:center;margin:0 0 24px;">
                        <p style="color:#9CA3AF;font-size:12px;font-weight:700;letter-spacing:2px;margin:0 0 8px;">YOUR OTP CODE</p>
                        <div style="font-size:42px;font-weight:800;color:#03045E;letter-spacing:12px;">{otp}</div>
                        <p style="color:#9CA3AF;font-size:12px;margin:8px 0 0;">Valid for <strong>10 minutes</strong></p>
                      </div>

                      <p style="color:#6B7280;font-size:13px;line-height:20px;margin:0 0 24px;">
                        If you did not request this, please ignore this email. Your account is safe.
                      </p>

                      <!-- Warning -->
                      <div style="background:#FDE8E8;border-radius:12px;padding:14px;border-left:4px solid #E63946;">
                        <p style="color:#E63946;font-size:12px;margin:0;font-weight:600;">
                          ⚠️ Never share this OTP with anyone. CureConnect will never ask for your OTP.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#F8FAFC;padding:20px;text-align:center;border-top:1px solid #E5E7EB;">
                      <p style="color:#9CA3AF;font-size:11px;margin:0;">
                        © 2026 CureConnect · Made with ❤️ in Tamil Nadu
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        if MAIL_PORT == 465:
            with smtplib.SMTP_SSL(MAIL_SERVER, MAIL_PORT, timeout=3) as server:
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
                server.sendmail(MAIL_FROM, to_email, msg.as_string())
        else:
            with smtplib.SMTP(MAIL_SERVER, MAIL_PORT, timeout=3) as server:
                server.starttls()
                server.login(MAIL_USERNAME, MAIL_PASSWORD)
                server.sendmail(MAIL_FROM, to_email, msg.as_string())

        logger.info(f"OTP email sent to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Email send error: {e}")
        return False