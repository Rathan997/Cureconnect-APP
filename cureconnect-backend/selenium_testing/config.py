"""
Selenium Test Configuration - React Native Web App Testing
Contains configuration for browsers, URLs, credentials, and test data.

IMPORTANT: This app is a React Native Web app built with Expo.
- Elements use testID props which become data-testid attributes in the DOM
- Navigation is SPA-based (React Navigation) - not real URL routing
- Alerts use window.confirm() / window.alert() on web
"""

import os
from pathlib import Path

# ============================================================================
# BASE CONFIGURATION
# ============================================================================

# Project root directory
PROJECT_ROOT = Path(__file__).parent

# Report and log directories
REPORTS_DIR = PROJECT_ROOT / "reports"
SCREENSHOTS_DIR = REPORTS_DIR / "screenshots"
LOGS_DIR = REPORTS_DIR / "logs"

# Create directories if they don't exist
REPORTS_DIR.mkdir(exist_ok=True)
SCREENSHOTS_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# ============================================================================
# WEB APPLICATION CONFIGURATION
# ============================================================================

# Application URL (Expo web runs as a SPA - all routes load same root)
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")

# ============================================================================
# SELENIUM BROWSER CONFIGURATION
# ============================================================================

# Browser type: 'chrome', 'firefox', 'edge'
BROWSER = os.getenv("BROWSER", "chrome")

# Browser options
BROWSER_OPTIONS = {
    "chrome": {
        "start-maximized": True,
        "disable-notifications": True,
        "disable-popup-blocking": False,    # Keep popups enabled so alerts work
        "disable-blink-features": "AutomationControlled",
    },
}

# Headless mode (no GUI - useful for CI/CD)
HEADLESS_MODE = os.getenv("HEADLESS", "false").lower() == "true"

# ============================================================================
# WAIT CONFIGURATION
# ============================================================================

# Default wait timeout (seconds)
IMPLICIT_WAIT = 10
EXPLICIT_WAIT = 20
PAGE_LOAD_TIMEOUT = 30

# ============================================================================
# TEST CREDENTIALS
# ============================================================================

TEST_ACCOUNTS = {
    "admin": {
        "email": "rathanreddy676@gmail.com",
        "password": "9652090259",
        "name": "Admin User",
        "role": "admin"
    }
}

# ============================================================================
# WEB ELEMENT LOCATORS (for React Native Web / Expo Web)
#
# React Native TextInput with testID="foo" renders as:
#   <input data-testid="foo" ... />
#
# React Native TouchableOpacity with testID="foo" renders as:
#   <div data-testid="foo" role="button" ... />
#
# Tab bar buttons: tabBarButtonTestID="tab-home" → data-testid="tab-home"
# ============================================================================

LOCATORS = {
    # -------------------------------------------------------------------------
    # Splash / Onboarding detection
    # -------------------------------------------------------------------------
    # The splash screen shows "CureConnect" or "Cureconnect" text
    "splash_title": ("xpath", "//*[contains(text(),'Cureconnect') or contains(text(),'CureConnect')]"),
    # Onboarding has a Skip button
    "onboarding_skip": ("xpath", "//*[@data-testid='skip-onboarding'] | //*[contains(text(),'Skip') or contains(text(),'Get Started')]"),

    # -------------------------------------------------------------------------
    # Login Screen
    # LoginScreen uses testID="email-input", testID="password-input",
    # testID="login-submit", testID="signup-link"
    # -------------------------------------------------------------------------
    "email_input":    ("xpath", "//*[@data-testid='email-input']"),
    "password_input": ("xpath", "//*[@data-testid='password-input']"),
    "login_button":   ("xpath", "//*[@data-testid='login-submit']"),
    "signup_link":    ("xpath", "//*[@data-testid='signup-link']"),

    # Fallback locators using text content
    "email_input_fallback":    ("xpath", "//input[@placeholder='your@email.com' or contains(@placeholder,'email')]"),
    "password_input_fallback": ("xpath", "//input[@type='password' or @placeholder='Min. 6 characters']"),
    "login_button_fallback":   ("xpath", "//*[contains(text(),'Sign In') or contains(text(),'Log In')]"),

    # -------------------------------------------------------------------------
    # Home Screen (after login, shows the Main tab navigator)
    # HomeScreen uses testID="dashboard-title" and testID="profile-avatar"
    # -------------------------------------------------------------------------
    "dashboard_title":  ("xpath", "//*[@data-testid='dashboard-title']"),
    "home_title_text":  ("xpath", "//*[contains(text(),'Good Morning') or contains(text(),'Good Afternoon') or contains(text(),'Good Evening')]"),
    "profile_avatar":   ("xpath", "//*[@data-testid='profile-avatar']"),
    "home_greeting":    ("xpath", "//*[contains(text(),'Quick Actions')]"),

    # -------------------------------------------------------------------------
    # Bottom Tab Bar Navigation
    # AppNavigator uses tabBarButtonTestID for each tab
    # -------------------------------------------------------------------------
    "tab_home":         ("xpath", "//*[@data-testid='tab-home']"),
    "tab_appointments": ("xpath", "//*[@data-testid='tab-appointments']"),
    "tab_symptoms":     ("xpath", "//*[@data-testid='tab-symptoms']"),
    "tab_doctors":      ("xpath", "//*[@data-testid='tab-doctors']"),
    "tab_family":       ("xpath", "//*[@data-testid='tab-family']"),
    "tab_emergency":    ("xpath", "//*[@data-testid='tab-emergency']"),
    "tab_chat":         ("xpath", "//*[@data-testid='tab-chat']"),

    # Fallback tab nav by text
    "tab_home_text":         ("xpath", "//div[contains(@class,'tabBar')]//span[contains(text(),'Home')]"),
    "doctors_tab_text":      ("xpath", "//*[@role='tab' and contains(.,'Doctors')]"),
    "appointments_tab_text": ("xpath", "//*[@role='tab' and contains(.,'Appointments')]"),

    # -------------------------------------------------------------------------
    # Quick Action Buttons (on HomeScreen)
    # -------------------------------------------------------------------------
    "action_doctors":    ("xpath", "//*[@data-testid='action-doctors']"),
    "action_symptoms":   ("xpath", "//*[@data-testid='action-symptoms']"),
    "action_emergency":  ("xpath", "//*[@data-testid='action-emergency']"),
    "action_medicines":  ("xpath", "//*[@data-testid='action-medicines']"),
    "action_dashboard":  ("xpath", "//*[@data-testid='action-dashboard']"),
    "action_family":     ("xpath", "//*[@data-testid='action-family']"),

    # -------------------------------------------------------------------------
    # Doctors Screen
    # DoctorsScreen uses testID="search-doctors", testID="doctors-list",
    # testID="doctor-card", testID="doctor-name"
    # -------------------------------------------------------------------------
    "search_doctors_input": ("xpath", "//*[@data-testid='search-doctors']"),
    "doctors_list":         ("xpath", "//*[@data-testid='doctors-list']"),
    "doctor_card":          ("xpath", "//*[@data-testid='doctor-card']"),
    "doctor_name":          ("xpath", ".//*[@data-testid='doctor-name']"),
    "doctors_header":       ("xpath", "//*[contains(text(),'Find Doctors')]"),

    # -------------------------------------------------------------------------
    # Appointments Screen
    # -------------------------------------------------------------------------
    "appointments_header": ("xpath", "//*[contains(text(),'Appointments') or contains(text(),'My Bookings')]"),
    "appointment_card":    ("xpath", "//*[contains(@data-testid,'appointment')]"),

    # -------------------------------------------------------------------------
    # Profile Screen
    # ProfileScreen uses testID="profile-email", testID="profile-name",
    # testID="edit-profile-btn", testID="logout-btn"
    # -------------------------------------------------------------------------
    "profile_email":      ("xpath", "//*[@data-testid='profile-email']"),
    "profile_name":       ("xpath", "//*[@data-testid='profile-name']"),
    "edit_profile_btn":   ("xpath", "//*[@data-testid='edit-profile-btn']"),
    "logout_btn":         ("xpath", "//*[@data-testid='logout-btn']"),
    "logout_text":        ("xpath", "//*[contains(text(),'Log Out') or contains(text(),'Logout')]"),

    # -------------------------------------------------------------------------
    # Common / General
    # -------------------------------------------------------------------------
    "back_button":     ("xpath", "//*[contains(text(),'← Back') or contains(text(),'Back')]"),
    "loading_spinner": ("xpath", "//*[@role='progressbar' or contains(@class,'ActivityIndicator')]"),
    "page_title":      ("tag name", "h1"),
    "app_root":        ("id", "root"),
}

# ============================================================================
# TEST DATA
# ============================================================================

TEST_DATA = {
    "doctors": [
        {
            "name": "Dr. Cardiologist",
            "specialization": "Cardiology",
        },
    ],
    "symptoms": [
        "fever and headache",
        "cough and cold",
    ],
}

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

LOG_FORMAT = {
    "simple":   "[%(levelname)s] %(message)s",
    "detailed": "[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s",
    "timestamp": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
}

# ============================================================================
# TEST EXECUTION CONFIGURATION
# ============================================================================

# Screenshot on failure
SCREENSHOT_ON_FAILURE = True

# Retry failed tests
RETRY_FAILED_TESTS = True
RETRY_COUNT = 1

# Splash screen wait time (the SplashScreen shows for 3 seconds then goes to Onboarding)
SPLASH_WAIT_SECONDS = 4

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def get_locator(element_name):
    """Get locator by element name"""
    if element_name in LOCATORS:
        return LOCATORS[element_name]
    else:
        raise ValueError(f"Locator '{element_name}' not found in configuration")


def get_test_account(account_type="admin"):
    """Get test account credentials"""
    if account_type in TEST_ACCOUNTS:
        return TEST_ACCOUNTS[account_type]
    else:
        return TEST_ACCOUNTS["admin"]


# ============================================================================
# PRINT CONFIGURATION (for debugging)
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("SELENIUM TEST CONFIGURATION")
    print("=" * 80)
    print(f"\nApplication URL: {BASE_URL}")
    print(f"Browser: {BROWSER}")
    print(f"Headless: {HEADLESS_MODE}")
    print(f"Wait Timeout: {EXPLICIT_WAIT}s")
    print(f"\nTest Accounts:")
    for account_type in TEST_ACCOUNTS:
        print(f"  - {account_type}: {TEST_ACCOUNTS[account_type]['email']}")
    print(f"\nReports Directory: {REPORTS_DIR}")
    print(f"Screenshots Directory: {SCREENSHOTS_DIR}")
    print(f"Logs Directory: {LOGS_DIR}")
    print(f"\nTotal Locators: {len(LOCATORS)}")
    print("\n" + "=" * 80)
