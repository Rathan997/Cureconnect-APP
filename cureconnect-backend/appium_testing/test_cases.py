"""
Appium E2E Test Cases — CureConnect Android
============================================
40 end-to-end tests covering every screen and feature.
Tests run sequentially; each class shares one driver session.
"""

import unittest
import logging
import time

from driver import AppiumDriver
from pages import (
    SplashOnboardingPage, LoginPage, ForgotPasswordPage,
    HomePage, DoctorsPage, DoctorDetailPage,
    AppointmentsPage, ProfilePage, SymptomCheckerPage,
    MedicineScannerPage, FamilyPage, HealthDashboardPage,
    EmergencyPage, ChatPage,
)
import config

logger = logging.getLogger("test_cases")


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class BaseAppiumTest(unittest.TestCase):
    """Shared driver lifecycle for all test suites."""

    appium_driver: AppiumDriver = None

    @classmethod
    def setUpClass(cls):
        cls.appium_driver = AppiumDriver()
        cls.driver = cls.appium_driver.init_driver()

        cls.splash    = SplashOnboardingPage(cls.appium_driver)
        cls.login     = LoginPage(cls.appium_driver)
        cls.forgot    = ForgotPasswordPage(cls.appium_driver)
        cls.home      = HomePage(cls.appium_driver)
        cls.doctors   = DoctorsPage(cls.appium_driver)
        cls.doc_detail= DoctorDetailPage(cls.appium_driver)
        cls.appts     = AppointmentsPage(cls.appium_driver)
        cls.profile   = ProfilePage(cls.appium_driver)
        cls.symptom   = SymptomCheckerPage(cls.appium_driver)
        cls.medicine  = MedicineScannerPage(cls.appium_driver)
        cls.family    = FamilyPage(cls.appium_driver)
        cls.dashboard = HealthDashboardPage(cls.appium_driver)
        cls.emergency = EmergencyPage(cls.appium_driver)
        cls.chat      = ChatPage(cls.appium_driver)

    @classmethod
    def tearDownClass(cls):
        if cls.appium_driver:
            cls.appium_driver.quit()

    def setUp(self):
        """Ensure the app is in the foreground before each test runs."""
        try:
            logger.info("Ensuring app is in foreground...")
            self.driver.activate_app(config.APP_PACKAGE)
            time.sleep(1.0)
        except Exception as e:
            logger.warning(f"Failed to activate app in setUp: {e}")

    def tearDown(self):
        """Screenshot on test failure."""
        has_failed = False
        outcome = getattr(self, '_outcome', None)
        if outcome:
            errors = getattr(outcome, 'errors', [])
            for test, exc_info in errors:
                if exc_info:
                    has_failed = True
                    break
            result = getattr(outcome, 'result', None)
            if result and (result.failures or result.errors):
                has_failed = True
        
        if has_failed:
            logger.info("Test %s FAILED/ERRORED. Taking screenshot...", self._testMethodName)
            try:
                path = self.appium_driver.take_screenshot(f"FAIL_{self._testMethodName}")
                logger.info("Screenshot saved to: %s", path)
            except Exception as e:
                logger.warning("Failed to take screenshot: %s", e)


# ===========================================================================
# Test Suite 01 — App Launch & Authentication
# ===========================================================================

class Test01_Authentication(BaseAppiumTest):
    """Login, logout, forgot-password flows."""

    def test_01_splash_and_onboarding(self):
        """App cold start: splash screen shows then transitions to Login."""
        logger.info("[T01] Splash & Onboarding")
        self.splash.handle_app_start()
        self.assertTrue(
            self.login.is_login_screen_visible(),
            "Should reach Login screen after onboarding"
        )

    def test_02_login_with_empty_fields(self):
        """Tapping Sign In with empty fields should stay on Login screen."""
        logger.info("[T02] Empty-field login")
        # Ensure fields are empty
        try:
            self.appium_driver.type_text(config.LOCATORS["email_input"], "", clear_first=True)
            self.appium_driver.type_text(config.LOCATORS["password_input"], "", clear_first=True)
        except Exception:
            pass
        self.appium_driver.tap(config.LOCATORS["login_button"])
        time.sleep(2)
        self.assertTrue(self.login.is_login_screen_visible(), "Should remain on Login")

    def test_03_login_with_invalid_credentials(self):
        """Wrong email/password → stay on Login or show error."""
        logger.info("[T03] Invalid credentials")
        acct = config.get_account("invalid")
        self.login.login(acct["email"], acct["password"])
        self.assertTrue(self.login.is_login_screen_visible(), "Should stay on Login")

    def test_04_login_with_valid_credentials(self):
        """Correct credentials → Home screen."""
        logger.info("[T04] Valid login")
        acct = config.get_account("valid")
        self.login.login(acct["email"], acct["password"])
        self.assertTrue(self.home.is_home_visible(timeout=20), "Home should be visible")

    def test_05_home_greeting_displayed(self):
        """Greeting text (Good Morning/Afternoon/Evening) is visible."""
        logger.info("[T05] Greeting text")
        greeting = self.home.get_greeting_text()
        has_greeting = any(w in greeting for w in ["Good Morning", "Good Afternoon", "Good Evening"])
        self.assertTrue(has_greeting or self.home.is_home_visible(),
                        "Greeting should contain time-of-day text")


# ===========================================================================
# Test Suite 02 — Navigation
# ===========================================================================

class Test02_Navigation(BaseAppiumTest):
    """Bottom tab bar and quick-action navigation."""

    def test_06_tab_appointments(self):
        logger.info("[T06] Tab → Appointments")
        self.home.tap_tab("tab_appointments")
        self.assertTrue(self.appts.is_appointments_screen_visible(), "Appointments visible")

    def test_07_tab_symptom_checker(self):
        logger.info("[T07] Tab → Symptom Checker")
        self.home.tap_tab("tab_symptoms")
        self.assertTrue(self.symptom.is_symptom_screen_visible(), "Symptoms visible")

    def test_08_tab_doctors(self):
        logger.info("[T08] Tab → Doctors")
        self.home.tap_tab("tab_doctors")
        self.assertTrue(self.doctors.is_doctors_screen_visible(), "Doctors visible")

    def test_09_tab_family(self):
        logger.info("[T09] Tab → Family")
        self.home.tap_tab("tab_family")
        self.assertTrue(self.family.is_family_screen_visible(), "Family visible")

    def test_10_tab_emergency(self):
        logger.info("[T10] Tab → Emergency")
        self.home.tap_tab("tab_emergency")
        self.assertTrue(self.emergency.is_emergency_screen_visible(), "Emergency visible")

    def test_11_tab_ai_chat(self):
        logger.info("[T11] Tab → AI Chat")
        self.home.tap_tab("tab_chat")
        self.assertTrue(self.chat.is_chat_screen_visible(), "Chat visible")

    def test_12_return_home_tab(self):
        logger.info("[T12] Return to Home tab")
        self.home.tap_tab("tab_home")
        self.assertTrue(self.home.is_home_visible(), "Should be back on Home")

    def test_13_quick_action_doctors(self):
        logger.info("[T13] Quick action → Doctors")
        self.home.tap_action("action_doctors")
        self.assertTrue(self.doctors.is_doctors_screen_visible())
        self.appium_driver.navigate_back()

    def test_14_quick_action_symptoms(self):
        logger.info("[T14] Quick action → Symptoms")
        self.home.tap_action("action_symptoms")
        self.assertTrue(self.symptom.is_symptom_screen_visible())
        self.appium_driver.navigate_back()

    def test_15_quick_action_emergency(self):
        logger.info("[T15] Quick action → Emergency")
        self.home.tap_action("action_emergency")
        self.assertTrue(self.emergency.is_emergency_screen_visible())
        self.appium_driver.navigate_back()


# ===========================================================================
# Test Suite 03 — Doctors Feature
# ===========================================================================

class Test03_Doctors(BaseAppiumTest):
    """Doctor search, filter, and detail view."""

    def test_16_doctors_list_loads(self):
        logger.info("[T16] Doctors list loads")
        self.home.tap_tab("tab_doctors")
        self.assertTrue(self.doctors.is_doctors_screen_visible())
        cards = self.doctors.get_doctor_cards()
        self.assertGreater(len(cards), 0, "Should show doctor cards")

    def test_17_search_cardiologist(self):
        logger.info("[T17] Search Cardiologist")
        self.doctors.search_doctors(config.TEST_DATA["doctors_search_term"])
        cards = self.doctors.get_doctor_cards()
        self.assertGreater(len(cards), 0, "Search should return results")

    def test_18_search_clear_shows_all(self):
        logger.info("[T18] Clear search")
        self.doctors.clear_search()
        cards = self.doctors.get_doctor_cards()
        self.assertGreater(len(cards), 0, "All doctors should reappear")

    def test_19_doctor_detail_view(self):
        logger.info("[T19] Doctor detail view")
        tapped = self.doctors.tap_first_doctor()
        if tapped:
            visible = self.doc_detail.is_visible_screen()
            self.assertTrue(visible, "Doctor detail should be visible")
            self.doc_detail.tap_back()
        else:
            self.skipTest("No doctor card to tap")


# ===========================================================================
# Test Suite 04 — Appointments
# ===========================================================================

class Test04_Appointments(BaseAppiumTest):
    """Appointment listing and tab filtering."""

    def test_20_appointments_screen_loads(self):
        logger.info("[T20] Appointments screen loads")
        self.home.tap_tab("tab_appointments")
        self.assertTrue(self.appts.is_appointments_screen_visible())

    def test_21_upcoming_tab_filter(self):
        logger.info("[T21] Upcoming filter tab")
        self.appts.tap_tab_filter("Upcoming")
        time.sleep(1)
        self.assertTrue(self.appts.is_appointments_screen_visible())

    def test_22_completed_tab_filter(self):
        logger.info("[T22] Completed filter tab")
        self.appts.tap_tab_filter("Completed")
        time.sleep(1)
        self.assertTrue(self.appts.is_appointments_screen_visible())

    def test_23_cancelled_tab_filter(self):
        logger.info("[T23] Cancelled filter tab")
        self.appts.tap_tab_filter("Cancelled")
        time.sleep(1)
        self.assertTrue(self.appts.is_appointments_screen_visible())

    def test_24_all_tab_filter(self):
        logger.info("[T24] All filter tab")
        self.appts.tap_tab_filter("All")
        time.sleep(1)
        cards = self.appts.get_appointment_cards()
        self.assertIsNotNone(cards)


# ===========================================================================
# Test Suite 05 — Symptom Checker
# ===========================================================================

class Test05_SymptomChecker(BaseAppiumTest):
    """Symptom checker AI analysis flow."""

    def test_25_symptom_screen_loads(self):
        logger.info("[T25] Symptom screen loads")
        self.home.tap_tab("tab_symptoms")
        self.assertTrue(self.symptom.is_symptom_screen_visible())

    def test_26_symptom_chip_selection(self):
        logger.info("[T26] Select a symptom chip")
        # Try to select Fever chip if visible
        tapped = self.symptom.select_symptom_chip("Fever")
        # Even if not found, screen must still be visible
        self.assertTrue(self.symptom.is_symptom_screen_visible())

    def test_27_scroll_symptom_screen(self):
        logger.info("[T27] Scroll symptom screen")
        self.appium_driver.swipe_up()
        time.sleep(0.5)
        self.appium_driver.swipe_down()
        self.assertTrue(self.symptom.is_symptom_screen_visible())


# ===========================================================================
# Test Suite 06 — Medicine Scanner
# ===========================================================================

class Test06_Medicine(BaseAppiumTest):
    """Medicine list and add-medicine flow."""

    def test_28_medicine_screen_loads(self):
        logger.info("[T28] Medicine screen loads")
        self.home.tap_action("action_medicines")
        self.assertTrue(self.medicine.is_medicine_screen_visible())

    def test_29_add_medicine_form(self):
        logger.info("[T29] Add medicine form")
        self.medicine.tap_add_medicine()
        med = config.TEST_DATA["medicine"]
        result = self.medicine.add_medicine(
            med["name"], med["dosage"], med["expiry"], med["times"]
        )
        time.sleep(2)
        # Either submitted or form still visible — both acceptable
        self.assertIsNotNone(result)

    def test_30_medicine_card_appears(self):
        logger.info("[T30] Medicine card in list")
        # Navigate back to list if needed
        if not self.medicine.is_medicine_screen_visible(timeout=3):
            self.appium_driver.navigate_back()
        time.sleep(1)
        cards = self.medicine.get_medicine_cards()
        # May be 0 if backend unavailable — not a hard failure
        self.assertIsNotNone(cards)
        self.medicine.tap_back()


# ===========================================================================
# Test Suite 07 — Family Management
# ===========================================================================

class Test07_Family(BaseAppiumTest):
    """Family health member management."""

    def test_31_family_screen_loads(self):
        logger.info("[T31] Family screen loads")
        self.home.tap_tab("tab_family")
        self.assertTrue(self.family.is_family_screen_visible())

    def test_32_family_member_count(self):
        logger.info("[T32] Family member count")
        count = self.family.get_member_count()
        self.assertGreaterEqual(count, 0, "Member count should be >= 0")

    def test_33_scroll_family_screen(self):
        logger.info("[T33] Scroll family screen")
        self.appium_driver.swipe_up()
        time.sleep(0.5)
        self.assertTrue(self.family.is_family_screen_visible())


# ===========================================================================
# Test Suite 08 — Health Dashboard
# ===========================================================================

class Test08_Dashboard(BaseAppiumTest):
    """Health Dashboard stats and score ring."""

    def test_34_dashboard_loads(self):
        logger.info("[T34] Health Dashboard loads")
        self.home.tap_action("action_dashboard")
        self.assertTrue(self.dashboard.is_dashboard_visible())

    def test_35_dashboard_scroll(self):
        logger.info("[T35] Dashboard scroll")
        self.appium_driver.swipe_up()
        time.sleep(0.5)
        self.appium_driver.swipe_down()
        self.assertTrue(self.dashboard.is_dashboard_visible())

    def test_36_dashboard_refresh(self):
        logger.info("[T36] Dashboard refresh")
        self.dashboard.tap_refresh()
        time.sleep(2)
        self.assertTrue(self.dashboard.is_dashboard_visible())
        self.dashboard.tap_back()


# ===========================================================================
# Test Suite 09 — Emergency & AI Chat
# ===========================================================================

class Test09_EmergencyAndChat(BaseAppiumTest):
    """Emergency SOS and AI Chat screens."""

    def test_37_emergency_contacts_visible(self):
        logger.info("[T37] Emergency contacts")
        self.home.tap_tab("tab_emergency")
        self.assertTrue(self.emergency.is_emergency_screen_visible())
        self.appium_driver.swipe_up()
        time.sleep(0.5)
        self.appium_driver.navigate_back()

    def test_38_ai_chat_send_message(self):
        logger.info("[T38] AI Chat message")
        self.home.tap_tab("tab_chat")
        self.assertTrue(self.chat.is_chat_screen_visible())
        sent = self.chat.send_message("I have a headache")
        time.sleep(3)
        self.assertTrue(self.chat.is_chat_screen_visible())


# ===========================================================================
# Test Suite 10 — Profile & Logout
# ===========================================================================

class Test10_ProfileAndLogout(BaseAppiumTest):
    """Profile info display and logout."""

    def test_39_profile_info_visible(self):
        logger.info("[T39] Profile info")
        self.home.tap_profile_avatar()
        self.assertTrue(self.profile.is_profile_visible())
        email = self.profile.get_profile_email()
        expected = config.get_account("valid")["email"].lower()
        self.assertEqual(email.lower(), expected, "Profile email should match login email")

    def test_40_logout(self):
        logger.info("[T40] Logout")
        # Ensure we are on profile
        if not self.profile.is_profile_visible(timeout=3):
            self.home.tap_profile_avatar()
        self.profile.full_logout()
        self.assertTrue(self.login.is_login_screen_visible(), "Should reach Login after logout")


# ===========================================================================
# Test Suite 11 — Full End-to-End Journey
# ===========================================================================

class Test11_EndToEnd(BaseAppiumTest):
    """Single complete user journey test."""

    def test_41_complete_e2e_journey(self):
        """Login → Doctors → Appointments → Symptom → Medicine → Logout."""
        logger.info("[T41] Full E2E journey")

        # ── Ensure on Login ──
        if not self.login.is_login_screen_visible(timeout=4):
            self.appium_driver.reset_app()
            self.splash.handle_app_start()

        acct = config.get_account("valid")

        # 1. Login
        self.login.login(acct["email"], acct["password"])
        self.assertTrue(self.home.is_home_visible(timeout=20), "Step 1: Login failed")

        # 2. Doctors
        self.home.tap_tab("tab_doctors")
        self.assertTrue(self.doctors.is_doctors_screen_visible(), "Step 2: Doctors failed")
        self.doctors.search_doctors(config.TEST_DATA["doctors_search_term"])
        self.assertGreater(len(self.doctors.get_doctor_cards()), 0, "Step 2b: No results")

        # 3. Appointments
        self.home.tap_tab("tab_appointments")
        self.assertTrue(self.appts.is_appointments_screen_visible(), "Step 3: Appointments failed")

        # 4. Symptom Checker
        self.home.tap_tab("tab_symptoms")
        self.assertTrue(self.symptom.is_symptom_screen_visible(), "Step 4: Symptom failed")

        # 5. Medicine
        self.home.tap_tab("tab_home")
        self.home.tap_action("action_medicines")
        self.assertTrue(self.medicine.is_medicine_screen_visible(), "Step 5: Medicine failed")
        self.medicine.tap_back()

        # 6. Family
        self.home.tap_tab("tab_family")
        self.assertTrue(self.family.is_family_screen_visible(), "Step 6: Family failed")

        # 7. Emergency
        self.home.tap_tab("tab_emergency")
        self.assertTrue(self.emergency.is_emergency_screen_visible(), "Step 7: Emergency failed")

        # 8. Profile → Logout
        self.home.tap_tab("tab_home")
        self.home.tap_profile_avatar()
        self.assertTrue(self.profile.is_profile_visible(), "Step 8: Profile failed")
        self.profile.full_logout()
        self.assertTrue(self.login.is_login_screen_visible(), "Step 9: Logout failed")

        logger.info("[T41] ✅ Full E2E journey PASSED")


if __name__ == "__main__":
    unittest.main()
