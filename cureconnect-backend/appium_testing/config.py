"""
Appium Android Test Configuration - CureConnect React Native App
================================================================
Tests the native Android app (APK) using UiAutomator2 driver.

IMPORTANT NOTES:
  - React Native `testID` prop maps to Android `content-desc` (accessibility id)
  - Appium locator strategy: AppiumBy.ACCESSIBILITY_ID matches content-desc
  - Alert.alert() works NATIVELY on Android — no window.confirm tricks needed
  - Build APK first: `eas build -p android --profile preview` or use Expo Dev Build

HOW TO RUN:
  1. Install Appium 2:  npm install -g appium@next
  2. Install driver:    appium driver install uiautomator2
  3. Build APK:         eas build -p android --profile preview
  4. Start Appium:      appium --port 4723
  5. Connect device:    adb devices  (must show your device)
  6. Run tests:         py run_tests.py
"""

import os
from pathlib import Path

# ============================================================================
# PROJECT PATHS
# ============================================================================

PROJECT_ROOT = Path(__file__).parent
REPORTS_DIR  = PROJECT_ROOT / "reports"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots"
LOGS_DIR     = REPORTS_DIR / "logs"

# Auto-create directories
REPORTS_DIR.mkdir(exist_ok=True)
SCREENSHOTS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# ============================================================================
# APPIUM SERVER CONFIGURATION
# ============================================================================

APPIUM_HOST = os.getenv("APPIUM_HOST", "127.0.0.1")
APPIUM_PORT = int(os.getenv("APPIUM_PORT", "4723"))
APPIUM_URL  = f"http://{APPIUM_HOST}:{APPIUM_PORT}"

# ============================================================================
# ANDROID DEVICE CONFIGURATION
# ============================================================================

# Device serial from `adb devices`. Use "emulator-5554" for emulator.
DEVICE_NAME   = os.getenv("DEVICE_NAME", "Android Device")
DEVICE_SERIAL = os.getenv("DEVICE_SERIAL", "")   # Leave blank to auto-detect

# Android version on the device/emulator (e.g., "14.0", "13.0")
PLATFORM_VERSION = os.getenv("PLATFORM_VERSION", "")  # Leave blank to auto-detect

# ============================================================================
# APP CONFIGURATION
# ============================================================================

# Path to the built APK file.
# Build with: eas build -p android --profile preview
# OR place your APK at this default path.
APK_PATH = os.getenv(
    "APK_PATH",
    str(PROJECT_ROOT / "app-release.apk")
)

# App package and activity from app.json android section
APP_PACKAGE  = "com.medicheck.app"
APP_ACTIVITY = ".MainActivity"

# ============================================================================
# APPIUM DESIRED CAPABILITIES
# ============================================================================

APPIUM_CAPABILITIES = {
    "platformName":        "Android",
    "automationName":      "UiAutomator2",
    "deviceName":          DEVICE_NAME,
    "appPackage":          APP_PACKAGE,
    "appActivity":         APP_ACTIVITY,
    "noReset":             False,   # Full reset between test sessions
    "fullReset":           False,
    "newCommandTimeout":   120,     # Max seconds between commands
    "uiautomator2ServerLaunchTimeout": 60000,
    "uiautomator2ServerInstallTimeout": 60000,
    "androidDeviceReadyTimeout": 60,
    "autoGrantPermissions": True,   # Auto-grant camera, location etc.
    "skipDeviceInitialization": False,
    "unicodeKeyboard":     False,    # Disable Unicode input for text fields
    "resetKeyboard":       False,    # Reset keyboard after test
}

# Add optional fields only when set
if DEVICE_SERIAL:
    APPIUM_CAPABILITIES["udid"] = DEVICE_SERIAL
if PLATFORM_VERSION:
    APPIUM_CAPABILITIES["platformVersion"] = PLATFORM_VERSION

# Add APK path only when file exists (omit to launch already-installed app)
if os.path.exists(APK_PATH):
    APPIUM_CAPABILITIES["app"] = APK_PATH

# ============================================================================
# WAIT CONFIGURATION
# ============================================================================

IMPLICIT_WAIT       = 10   # seconds
EXPLICIT_WAIT       = 25   # seconds
PAGE_LOAD_TIMEOUT   = 40   # seconds
SPLASH_WAIT_SECONDS = 5    # Splash screen duration

# ============================================================================
# TEST CREDENTIALS
# ============================================================================

TEST_ACCOUNTS = {
    "valid": {
        "email":    "rathanreddy676@gmail.com",
        "password": "9652090259",
        "name":     "Rathan",
    },
    "invalid": {
        "email":    "wrong@test.com",
        "password": "wrongpassword",
    }
}

# ============================================================================
# LOCATORS
# ============================================================================
# React Native `testID` → Android content-desc → Appium ACCESSIBILITY_ID
# Fallback: XPATH with @content-desc or @text attributes
#
# Strategy: ("accessibility id", "testID-value")  — primary
#           ("xpath", "//...")                     — fallback

LOCATORS = {

    # ─── Onboarding / Splash ────────────────────────────────────────────────
    "splash_text": (
        "xpath",
        '//*[contains(@text,"CureConnect") or contains(@content-desc,"CureConnect")]'
    ),
    "onboarding_skip": (
        "xpath",
        '//*[@content-desc="skip-onboarding"] '
        '| //*[@text="Skip"] | //*[@text="Get Started"]'
    ),

    # ─── Login Screen ────────────────────────────────────────────────────────
    # LoginScreen: testID="email-input", "password-input", "login-submit"
    "email_input":    ("accessibility id", "email-input"),
    "password_input": ("accessibility id", "password-input"),
    "login_button":   ("accessibility id", "login-submit"),
    "signup_link":    ("accessibility id", "signup-link"),

    # Fallback by hint/placeholder text
    "email_input_text":    ("xpath", '//*[@hint="your@email.com" or contains(@hint,"email")]'),
    "password_input_text": ("xpath", '//*[@hint="Min. 6 characters" or contains(@hint,"password")]'),
    "login_button_text":   ("xpath", '//*[@text="Sign In"]'),

    # ─── Home Screen ─────────────────────────────────────────────────────────
    "dashboard_title":  ("accessibility id", "dashboard-title"),
    "profile_avatar":   ("accessibility id", "profile-avatar"),
    "home_greeting":    ("xpath", '//*[contains(@text,"Good Morning") or '
                                  'contains(@text,"Good Afternoon") or '
                                  'contains(@text,"Good Evening")]'),

    # ─── Bottom Tab Bar ───────────────────────────────────────────────────────
    "tab_home":         ("accessibility id", "tab-home"),
    "tab_appointments": ("accessibility id", "tab-appointments"),
    "tab_symptoms":     ("accessibility id", "tab-symptoms"),
    "tab_doctors":      ("accessibility id", "tab-doctors"),
    "tab_family":       ("accessibility id", "tab-family"),
    "tab_emergency":    ("accessibility id", "tab-emergency"),
    "tab_chat":         ("accessibility id", "tab-chat"),

    # ─── Quick Action Buttons (Home Screen) ───────────────────────────────────
    "action_doctors":   ("accessibility id", "action-doctors"),
    "action_symptoms":  ("accessibility id", "action-symptoms"),
    "action_emergency": ("accessibility id", "action-emergency"),
    "action_medicines": ("accessibility id", "action-medicines"),
    "action_dashboard": ("accessibility id", "action-dashboard"),
    "action_family":    ("accessibility id", "action-family"),

    # ─── Doctors Screen ───────────────────────────────────────────────────────
    "search_doctors":  ("accessibility id", "search-doctors"),
    "doctors_list":    ("accessibility id", "doctors-list"),
    "doctor_card":     ("accessibility id", "doctor-card"),
    "doctor_name":     ("accessibility id", "doctor-name"),
    "doctors_header":  ("xpath", '//*[@text="Find Doctors"]'),

    # ─── Appointments Screen ─────────────────────────────────────────────────
    "appointments_list":   ("accessibility id", "appointments-list"),
    "appointment_card":    ("accessibility id", "appointment-card"),
    "appointments_header": ("xpath",
        '//*[contains(@text,"Appointments") or contains(@text,"My Bookings")]'
    ),

    # ─── Profile Screen ───────────────────────────────────────────────────────
    "profile_email":    ("accessibility id", "profile-email"),
    "profile_name":     ("accessibility id", "profile-name"),
    "edit_profile_btn": ("accessibility id", "edit-profile-btn"),
    "logout_btn":       ("accessibility id", "logout-btn"),
    "logout_text":      ("xpath", '//*[@text="Log Out"] | //*[@text="Logout"]'),

    # ─── Alert Dialog (native Android — Alert.alert works on Android!) ─────
    # Android AlertDialog buttons have @text = button label
    "alert_confirm_btn": ("xpath", '//*[@text="Log Out"]'),
    "alert_cancel_btn":  ("xpath", '//*[@text="Cancel"]'),

    # ─── Medicine Scanner ─────────────────────────────────────────────────────
    "add_medicine_btn":      ("accessibility id", "add-medicine-btn"),
    "medicines_list":        ("accessibility id", "medicines-list"),
    "medicine_card":         ("accessibility id", "medicine-card"),
    "medicine_name_input":   ("accessibility id", "medicine-name-input"),
    "medicine_dosage_input": ("accessibility id", "medicine-dosage-input"),
    "medicine_expiry_input": ("accessibility id", "medicine-expiry-input"),
    "medicine_times_input":  ("accessibility id", "medicine-times-input"),
    "medicine_submit":       ("accessibility id", "medicine-submit"),

    # ─── Family Screen ────────────────────────────────────────────────────────
    "add_family_btn":        ("xpath", '//*[contains(@text,"Add Member")]'),
    "family_member_card":    ("accessibility id", "family-member-card"),
    "family_name_input":     ("accessibility id", "family-name-input"),
    "family_relation_input": ("accessibility id", "family-relation-input"),
    "family_age_input":      ("accessibility id", "family-age-input"),
    "family_submit_btn":     ("xpath", '//*[contains(@text,"Save") or contains(@text,"Add")]'),

    # ─── Forgot Password ──────────────────────────────────────────────────────
    "forgot_password_link":  ("accessibility id", "forgot-password-link"),
    "forgot_email_input":    ("accessibility id", "forgot-email-input"),
    "forgot_submit_btn":     ("accessibility id", "forgot-submit-btn"),

    # ─── AI Chat ──────────────────────────────────────────────────────────────
    "chat_input":            ("accessibility id", "chat-input"),
    "chat_send":             ("accessibility id", "chat-send"),
    "chat_message":          ("accessibility id", "chat-message"),

    # ─── Symptom Checker ──────────────────────────────────────────────────────
    "symptom_search":        ("accessibility id", "symptom-search"),
    "analyze_btn":           ("xpath", '//*[contains(@text,"Analyze") or contains(@text,"Check Symptoms")]'),

    # ─── Doctor Detail / Booking ──────────────────────────────────────────────
    "book_appointment_btn":  ("xpath", '//*[contains(@text,"Book")]'),
    "doctor_detail_name":    ("accessibility id", "doctor-detail-name"),
    "notifications_btn":     ("accessibility id", "notifications-btn"),

    # ─── Common ───────────────────────────────────────────────────────────────
    "back_button": ("xpath",
        '//*[@content-desc="Back"] | //*[@text="Back"] | '
        '//*[@content-desc="Navigate up"]'
    ),
    "loading_indicator": ("xpath", '//*[@class="android.widget.ProgressBar"]'),
}

# ============================================================================
# TEST DATA
# ============================================================================

TEST_DATA = {
    "doctors_search_term": "Card",
    "medicine": {
        "name":   "Dolo 650",
        "dosage": "Paracetamol 650mg",
        "expiry": "12/2026",
        "times":  "8:00 AM, 8:00 PM",
    },
    "family_member": {
        "name":     "Ravi Kumar",
        "relation": "Father",
        "age":      55,
    },
    "symptom_query": "fever and headache",
    "chat_message":  "I have a mild headache, what should I do?",
}

# ============================================================================
# EXECUTION SETTINGS
# ============================================================================

SCREENSHOT_ON_FAILURE = True
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

LOG_FORMAT = "[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s"

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_locator(name):
    """Get locator tuple by name."""
    if name in LOCATORS:
        return LOCATORS[name]
    raise KeyError(f"Locator '{name}' not found in LOCATORS dict")


def get_account(account_type="valid"):
    """Get test account credentials."""
    return TEST_ACCOUNTS.get(account_type, TEST_ACCOUNTS["valid"])


# ============================================================================
# PRINT CONFIG (debugging)
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("APPIUM TEST CONFIGURATION — CureConnect Android")
    print("=" * 70)
    print(f"\nAppium Server : {APPIUM_URL}")
    print(f"Device        : {DEVICE_NAME}")
    print(f"App Package   : {APP_PACKAGE}")
    print(f"APK Path      : {APK_PATH}")
    print(f"APK Exists    : {os.path.exists(APK_PATH)}")
    print(f"Reports Dir   : {REPORTS_DIR}")
    print(f"Total Locators: {len(LOCATORS)}")
    print("\n" + "=" * 70)
