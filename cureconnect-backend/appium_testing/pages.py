"""
Page Object Models — CureConnect Android (Appium)
==================================================
Complete page objects for every screen in the app.

Locator strategy:
  • PRIMARY   → Appium ACCESSIBILITY_ID  (matches React Native testID → Android content-desc)
  • FALLBACK  → XPATH with @text / @content-desc attributes

Key Android notes:
  • .click()       → native tap (no JS / ActionChains)
  • Alert.alert()  → real Android AlertDialog (handle with handle_alert_dialog)
  • testID prop    → content-desc in the Android view hierarchy
  • Keyboard       → call hide_keyboard() after text input
"""

import logging
import time

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

from config import LOCATORS, TEST_ACCOUNTS, SPLASH_WAIT_SECONDS, EXPLICIT_WAIT

logger = logging.getLogger("pages")


# =============================================================================
# BASE PAGE
# =============================================================================

class BasePage:
    """Shared helpers for every page object."""

    def __init__(self, driver):
        self.driver = driver      # AppiumDriver wrapper
        self.d      = driver.driver  # raw Appium WebDriver

    # ── waits ────────────────────────────────────────────────────────────────

    def _by(self, locator):
        return self.driver._by_from_locator(locator)

    def wait_for(self, locator, timeout=EXPLICIT_WAIT):
        by, val = self._by(locator)
        return WebDriverWait(self.d, timeout).until(
            EC.presence_of_element_located((by, val))
        )

    def wait_visible(self, locator, timeout=EXPLICIT_WAIT):
        by, val = self._by(locator)
        try:
            return WebDriverWait(self.d, timeout).until(
                EC.visibility_of_element_located((by, val))
            )
        except TimeoutException:
            return None

    def is_visible(self, locator, timeout=6):
        return self.driver.is_element_visible(locator, timeout=timeout)

    # ── interactions ─────────────────────────────────────────────────────────

    def tap(self, locator, timeout=EXPLICIT_WAIT):
        return self.driver.tap(locator, timeout=timeout)

    def type_text(self, locator, text, clear_first=True):
        return self.driver.type_text(locator, text, clear_first=clear_first)

    def get_text(self, locator, timeout=EXPLICIT_WAIT):
        return self.driver.get_text(locator, timeout=timeout)

    def scroll_to(self, locator, max_swipes=6):
        return self.driver.scroll_to_element(locator, max_swipes=max_swipes)

    def swipe_up(self):
        self.driver.swipe_up()

    def swipe_down(self):
        self.driver.swipe_down()

    def back(self):
        self.driver.navigate_back()

    def hide_keyboard(self):
        self.driver.hide_keyboard()

    def screenshot(self, name):
        return self.driver.take_screenshot(name)

    def tap_tab(self, tab_key):
        """Tap a bottom tab bar item by key name (e.g. 'tab_home')."""
        logger.info("Tapping tab: %s", tab_key)
        return self.tap(LOCATORS[tab_key], timeout=8)


# =============================================================================
# SPLASH & ONBOARDING PAGE
# =============================================================================

class SplashOnboardingPage(BasePage):
    """Splash → Onboarding → Login transition."""

    def wait_through_splash(self):
        logger.info("Waiting %ds for Splash screen …", SPLASH_WAIT_SECONDS)
        time.sleep(SPLASH_WAIT_SECONDS)

    def skip_onboarding(self):
        logger.info("Trying to skip Onboarding …")
        tapped = self.tap(LOCATORS["onboarding_skip"], timeout=8)
        if tapped:
            logger.info("Skipped Onboarding")
            time.sleep(1)
            return True
        logger.info("Skip button not found — already on Login?")
        return False

    def handle_app_start(self):
        """Full cold-start flow: Splash → (Onboarding skip) → Login ready."""
        self.wait_through_splash()
        self.skip_onboarding()
        time.sleep(1)
        logger.info("App startup complete")


# =============================================================================
# LOGIN PAGE
# =============================================================================

class LoginPage(BasePage):
    """Login screen: email-input, password-input, login-submit."""

    def login(self, email, password):
        logger.info("Logging in as: %s", email)
        # email
        if not self.type_text(LOCATORS["email_input"], email):
            self.type_text(LOCATORS["email_input_text"], email)
        self.hide_keyboard()
        time.sleep(0.3)
        # password
        if not self.type_text(LOCATORS["password_input"], password):
            self.type_text(LOCATORS["password_input_text"], password)
        self.hide_keyboard()
        time.sleep(0.3)
        # submit
        if not self.tap(LOCATORS["login_button"], timeout=10):
            self.tap(LOCATORS["login_button_text"], timeout=5)
        time.sleep(3)

    def is_login_screen_visible(self, timeout=8):
        return (self.is_visible(LOCATORS["email_input"], timeout=timeout) or
                self.is_visible(LOCATORS["login_button"], timeout=timeout))

    def get_error_text(self, timeout=5):
        """Read native Android AlertDialog error text after failed login."""
        try:
            locator = ("xpath",
                '//*[contains(@text,"Incorrect") or contains(@text,"Failed") or contains(@text,"invalid") or contains(@text,"try again")] | '
                '//*[@resource-id="android:id/alertTitle"] | '
                '//*[@resource-id="android:id/message"]')
            el = self.wait_for(locator, timeout=timeout)
            return el.get_attribute("text") or ""
        except Exception:
            return ""

    def tap_forgot_password(self):
        return self.tap(LOCATORS["forgot_password_link"], timeout=8)


# =============================================================================
# FORGOT PASSWORD PAGE
# =============================================================================

class ForgotPasswordPage(BasePage):
    """Forgot-password screen."""

    def is_visible_screen(self, timeout=10):
        return self.is_visible(
            ("xpath", '//*[contains(@text,"Forgot") or contains(@text,"Reset")]'),
            timeout=timeout
        )

    def submit_email(self, email):
        self.type_text(LOCATORS["forgot_email_input"], email)
        self.hide_keyboard()
        self.tap(LOCATORS["forgot_submit_btn"], timeout=8)
        time.sleep(2)


# =============================================================================
# HOME PAGE
# =============================================================================

class HomePage(BasePage):
    """Home screen with greeting, quick-action cards and tab bar."""

    def is_home_visible(self, timeout=12):
        return (self.is_visible(LOCATORS["dashboard_title"], timeout=timeout) or
                self.is_visible(LOCATORS["profile_avatar"],  timeout=timeout) or
                self.is_visible(LOCATORS["home_greeting"],   timeout=timeout))

    def get_greeting_text(self):
        return self.get_text(LOCATORS["home_greeting"], timeout=8)

    def tap_action(self, action_key):
        logger.info("Tapping quick action: %s", action_key)
        return self.tap(LOCATORS[action_key], timeout=10)

    def tap_profile_avatar(self):
        logger.info("Tapping profile avatar")
        return self.tap(LOCATORS["profile_avatar"], timeout=10)

    def tap_notifications(self):
        return self.tap(LOCATORS.get("notifications_btn",
                        ("xpath", '//*[@content-desc="notifications-btn"]')), timeout=8)

    def scroll_to_recently_added(self):
        self.scroll_to(("xpath", '//*[contains(@text,"Recently")]'), max_swipes=4)


# =============================================================================
# DOCTORS PAGE
# =============================================================================

class DoctorsPage(BasePage):
    """Doctors list screen with search, filter, and doctor cards."""

    def is_doctors_screen_visible(self, timeout=12):
        return (self.is_visible(LOCATORS["doctors_list"],   timeout=timeout) or
                self.is_visible(LOCATORS["doctors_header"], timeout=timeout) or
                self.is_visible(LOCATORS["search_doctors"], timeout=timeout))

    def search_doctors(self, query):
        logger.info("Searching doctors: '%s'", query)
        if self.type_text(LOCATORS["search_doctors"], query):
            self.hide_keyboard()
            time.sleep(1.5)
            return True
        return False

    def get_doctor_cards(self):
        return self.driver.find_elements(LOCATORS["doctor_card"], timeout=10)

    def get_first_doctor_name(self):
        return self.get_text(LOCATORS["doctor_name"], timeout=8)

    def tap_first_doctor(self):
        """Tap the first doctor card to open Doctor Detail."""
        cards = self.get_doctor_cards()
        if cards:
            cards[0].click()
            time.sleep(1.5)
            return True
        return False

    def tap_back(self):
        if not self.tap(LOCATORS["back_button"], timeout=5):
            self.back()
        time.sleep(0.8)

    def apply_specialization_filter(self, specialization):
        """Select a specialization from the filter dropdown/chips."""
        locator = ("xpath", f'//*[contains(@text,"{specialization}")]')
        self.tap(locator, timeout=8)
        time.sleep(1)

    def clear_search(self):
        self.type_text(LOCATORS["search_doctors"], "", clear_first=True)
        self.hide_keyboard()
        time.sleep(1)


# =============================================================================
# DOCTOR DETAIL PAGE
# =============================================================================

class DoctorDetailPage(BasePage):
    """Doctor profile detail screen."""

    def is_visible_screen(self, timeout=12):
        return self.is_visible(
            ("xpath", '//*[contains(@text,"Book") or contains(@text,"Appointment")]'),
            timeout=timeout
        )

    def get_doctor_name(self):
        return self.get_text(
            ("xpath", '//*[@content-desc="doctor-detail-name"]'), timeout=8
        )

    def get_doctor_fee(self):
        return self.get_text(
            ("xpath", '//*[contains(@text,"₹")]'), timeout=8
        )

    def tap_book_appointment(self):
        return self.tap(LOCATORS.get("book_appointment_btn",
                        ("xpath", '//*[contains(@text,"Book")]')), timeout=10)

    def tap_back(self):
        if not self.tap(LOCATORS["back_button"], timeout=5):
            self.back()
        time.sleep(0.5)


# =============================================================================
# APPOINTMENTS PAGE
# =============================================================================

class AppointmentsPage(BasePage):
    """Appointments list screen with tab filters."""

    def is_appointments_screen_visible(self, timeout=12):
        return (self.is_visible(LOCATORS["appointments_list"],   timeout=timeout) or
                self.is_visible(LOCATORS["appointments_header"], timeout=timeout))

    def get_appointment_cards(self):
        return self.driver.find_elements(LOCATORS["appointment_card"], timeout=8)

    def get_appointment_count(self):
        return len(self.get_appointment_cards())

    def tap_tab_filter(self, tab_label):
        """Tap Upcoming / Completed / Cancelled filter tab."""
        locator = ("xpath", f'//*[contains(@text,"{tab_label}")]')
        return self.tap(locator, timeout=8)

    def cancel_first_appointment(self):
        """Tap Cancel on the first appointment card."""
        cancel_locator = ("xpath", '//*[contains(@text,"Cancel")]')
        return self.tap(cancel_locator, timeout=8)


# =============================================================================
# PROFILE PAGE
# =============================================================================

class ProfilePage(BasePage):
    """Profile screen with user info, edit, and logout."""

    def is_profile_visible(self, timeout=12):
        return (self.is_visible(LOCATORS["profile_email"],  timeout=timeout) or
                self.is_visible(LOCATORS["logout_btn"],     timeout=timeout) or
                self.is_visible(LOCATORS["profile_name"],   timeout=timeout))

    def get_profile_email(self):
        return self.get_text(LOCATORS["profile_email"], timeout=8)

    def get_profile_name(self):
        return self.get_text(LOCATORS["profile_name"], timeout=8)

    def tap_edit_profile(self):
        return self.tap(LOCATORS["edit_profile_btn"], timeout=8)

    def scroll_to_logout(self):
        logger.info("Scrolling to logout button …")
        el = self.scroll_to(LOCATORS["logout_btn"], max_swipes=5)
        if el:
            return True
        for _ in range(3):
            self.swipe_up()
            if self.is_visible(LOCATORS["logout_btn"], timeout=2):
                return True
        return self.is_visible(LOCATORS["logout_btn"], timeout=3)

    def tap_logout(self):
        self.scroll_to_logout()
        time.sleep(0.5)
        return self.tap(LOCATORS["logout_btn"], timeout=8)

    def confirm_logout(self):
        """Tap 'Log Out' in the native Android AlertDialog."""
        logger.info("Confirming logout in Alert dialog …")
        return self.driver.handle_alert_dialog("Log Out", timeout=8)

    def full_logout(self):
        """Scroll → tap Logout → confirm in dialog → wait for Login screen."""
        if not self.tap_logout():
            raise Exception("Logout button not found")
        time.sleep(0.8)
        if not self.confirm_logout():
            logger.warning("Alert 'Log Out' button not found — pressing Back")
            self.back()
        time.sleep(3)
        logger.info("Logout complete")


# =============================================================================
# SYMPTOM CHECKER PAGE
# =============================================================================

class SymptomCheckerPage(BasePage):
    """AI-powered symptom checker screen."""

    def is_symptom_screen_visible(self, timeout=12):
        return self.is_visible(
            ("xpath", '//*[contains(@text,"Symptom") or contains(@text,"symptom")]'),
            timeout=timeout
        )

    def search_symptom(self, symptom):
        """Type symptom into the search/input field."""
        locator = LOCATORS.get("symptom_search",
                  ("xpath", '//*[contains(@hint,"symptom") or contains(@hint,"Search")]'))
        self.type_text(locator, symptom)
        self.hide_keyboard()
        time.sleep(1)

    def select_symptom_chip(self, symptom_text):
        """Tap a symptom chip/badge by its text."""
        locator = ("xpath", f'//*[contains(@text,"{symptom_text}")]')
        return self.tap(locator, timeout=8)

    def tap_analyze(self):
        """Tap the Analyze / Check Symptoms button."""
        locator = LOCATORS.get("analyze_btn",
                  ("xpath", '//*[contains(@text,"Analyze") or contains(@text,"Check")]'))
        return self.tap(locator, timeout=10)

    def get_result_text(self, timeout=20):
        """Wait for and return analysis result text."""
        locator = ("xpath", '//*[contains(@text,"Risk") or contains(@text,"Condition")]')
        try:
            el = self.wait_for(locator, timeout=timeout)
            return el.text or ""
        except Exception:
            return ""

    def tap_back(self):
        if not self.tap(LOCATORS["back_button"], timeout=5):
            self.back()
        time.sleep(0.5)


# =============================================================================
# MEDICINE SCANNER PAGE
# =============================================================================

class MedicineScannerPage(BasePage):
    """Medicine Scanner and medicine list screen."""

    def is_medicine_screen_visible(self, timeout=12):
        return self.is_visible(
            ("xpath", '//*[contains(@text,"Medicine") or contains(@text,"Scanner")]'),
            timeout=timeout
        )

    def get_medicine_cards(self):
        return self.driver.find_elements(LOCATORS["medicine_card"], timeout=8)

    def tap_add_medicine(self):
        return self.tap(LOCATORS["add_medicine_btn"], timeout=8)

    def add_medicine(self, name, dosage, expiry, times):
        """Fill and submit the Add Medicine form."""
        self.type_text(LOCATORS["medicine_name_input"], name)
        self.type_text(
            LOCATORS.get("medicine_dosage_input",
                         ("accessibility id", "medicine-dosage-input")), dosage)
        self.type_text(
            LOCATORS.get("medicine_expiry_input",
                         ("accessibility id", "medicine-expiry-input")), expiry)
        self.type_text(
            LOCATORS.get("medicine_times_input",
                         ("accessibility id", "medicine-times-input")), times)
        self.hide_keyboard()
        return self.tap(LOCATORS["medicine_submit"], timeout=8)

    def delete_medicine(self, medicine_name):
        """Long-press a medicine card to trigger delete action."""
        locator = ("xpath", f'//*[contains(@text,"{medicine_name}")]')
        try:
            el = self.wait_for(locator, timeout=8)
            self.d.long_click(el, 1000)
            time.sleep(0.5)
            return True
        except Exception:
            return False

    def tap_back(self):
        if not self.tap(LOCATORS["back_button"], timeout=5):
            self.back()
        time.sleep(0.5)


# =============================================================================
# FAMILY HEALTH PAGE
# =============================================================================

class FamilyPage(BasePage):
    """Family Health management screen."""

    def is_family_screen_visible(self, timeout=12):
        return self.is_visible(
            ("xpath", '//*[contains(@text,"Family")]'),
            timeout=timeout
        )

    def get_member_cards(self):
        return self.driver.find_elements(
            LOCATORS.get("family_member_card",
                         ("xpath", '//*[@content-desc="family-member-card"]')),
            timeout=8
        )

    def get_member_count(self):
        return len(self.get_member_cards())

    def tap_add_member(self):
        locator = LOCATORS.get("add_family_btn",
                  ("xpath", '//*[contains(@text,"Add") and contains(@text,"Member")]'))
        return self.tap(locator, timeout=8)

    def add_family_member(self, name, relation, age):
        """Fill in the add-family-member form."""
        self.type_text(
            LOCATORS.get("family_name_input",
                         ("accessibility id", "family-name-input")), name)
        self.type_text(
            LOCATORS.get("family_relation_input",
                         ("accessibility id", "family-relation-input")), relation)
        self.type_text(
            LOCATORS.get("family_age_input",
                         ("accessibility id", "family-age-input")), str(age))
        self.hide_keyboard()
        submit_locator = LOCATORS.get("family_submit_btn",
                         ("xpath", '//*[contains(@text,"Save") or contains(@text,"Add")]'))
        return self.tap(submit_locator, timeout=8)

    def tap_check_in(self, member_name):
        """Tap Check-In button next to a specific family member."""
        locator = ("xpath",
            f'//android.view.View[contains(@content-desc,"{member_name}")]'
            '/following-sibling::*[contains(@text,"Check") or contains(@content-desc,"check")]'
        )
        return self.tap(locator, timeout=8)

    def tap_back(self):
        if not self.tap(LOCATORS["back_button"], timeout=5):
            self.back()
        time.sleep(0.5)


# =============================================================================
# HEALTH DASHBOARD PAGE
# =============================================================================

class HealthDashboardPage(BasePage):
    """Health Dashboard — score ring, stats, weekly chart."""

    def is_dashboard_visible(self, timeout=12):
        return self.is_visible(
            ("xpath", '//*[contains(@text,"Health Dashboard") or contains(@text,"dashboard")]'),
            timeout=timeout
        )

    def get_health_score(self):
        """Get the numeric health score displayed in the ring."""
        try:
            el = self.wait_for(
                ("xpath", '//*[@content-desc="dashboard-title"]'), timeout=8
            )
            # Score text is a sibling — fallback to finding number text
            score_el = self.wait_for(
                ("xpath", '//*[string-length(@text)<=3 and number(@text)=number(@text)]'),
                timeout=5
            )
            return score_el.text
        except Exception:
            return ""

    def scroll_to_weekly_activity(self):
        self.scroll_to(
            ("xpath", '//*[contains(@text,"Weekly")]'), max_swipes=3
        )

    def tap_refresh(self):
        return self.tap(
            ("xpath", '//*[contains(@text,"Refresh")]'), timeout=6
        )

    def tap_back(self):
        if not self.tap(LOCATORS["back_button"], timeout=5):
            self.back()
        time.sleep(0.5)


# =============================================================================
# EMERGENCY PAGE
# =============================================================================

class EmergencyPage(BasePage):
    """Emergency SOS screen."""

    def is_emergency_screen_visible(self, timeout=12):
        return self.is_visible(
            ("xpath", '//*[contains(@text,"Emergency") or contains(@text,"SOS")]'),
            timeout=timeout
        )

    def get_emergency_contacts(self):
        return self.driver.find_elements(
            ("xpath", '//*[contains(@content-desc,"emergency-contact")]'),
            timeout=8
        )

    def tap_ambulance_call(self):
        """Tap the Call Ambulance button (will open dialler on real device)."""
        locator = ("xpath",
            '//*[contains(@text,"Ambulance") or contains(@text,"108")]')
        return self.tap(locator, timeout=8)

    def tap_back(self):
        if not self.tap(LOCATORS["back_button"], timeout=5):
            self.back()
        time.sleep(0.5)


# =============================================================================
# AI CHAT PAGE
# =============================================================================

class ChatPage(BasePage):
    """AI Health Assistant chat screen."""

    def is_chat_screen_visible(self, timeout=12):
        return self.is_visible(
            ("xpath", '//*[contains(@text,"Chat") or contains(@text,"AI") or contains(@text,"Assistant")]'),
            timeout=timeout
        )

    def send_message(self, message):
        """Type a message and tap Send."""
        input_locator = LOCATORS.get("chat_input",
                        ("xpath", '//*[@content-desc="chat-input"]'))
        send_locator  = LOCATORS.get("chat_send",
                        ("xpath", '//*[@content-desc="chat-send"]'))
        self.type_text(input_locator, message)
        self.hide_keyboard()
        return self.tap(send_locator, timeout=8)

    def get_last_response(self, timeout=15):
        """Wait for and return the last assistant message text."""
        locator = ("xpath",
            '(//*[contains(@content-desc,"chat-message")])[last()]')
        try:
            el = self.wait_for(locator, timeout=timeout)
            return el.text or el.get_attribute("content-desc") or ""
        except Exception:
            return ""

    def tap_back(self):
        if not self.tap(LOCATORS["back_button"], timeout=5):
            self.back()
        time.sleep(0.5)
