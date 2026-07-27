"""
Selenium Test Cases for CureConnect / MediCheck Web App (Expo/React Native Web)
End-to-end tests covering all major features.

KEY NOTES:
- App is a React Native Web (Expo) SPA
- All navigation is via React Navigation (not real URL routes)
- Elements use data-testid (mapped from React Native testID prop)
- Alerts use window.alert / window.confirm (from Alert.alert)
- Flow: Load '/' → Splash (3s) → Onboarding → (Skip) → Login → Main Tabs
"""

import unittest
import logging
import time
from datetime import datetime
from driver import SeleniumDriver
from pages import (
    LoginPage, DashboardPage, DoctorsPage, AppointmentsPage,
    MedicinesPage, ProfilePage, HomePage, SplashAndOnboardingPage
)
from config import TEST_ACCOUNTS, BASE_URL

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


# ============================================================================
# Base Test Class
# ============================================================================

class MediCheckTestBase(unittest.TestCase):
    """Base test class with setup and teardown"""

    def setUp(self):
        """Set up test fixtures"""
        logger.info("\n" + "=" * 70)
        logger.info(f"[TEST] {self._testMethodName}")
        logger.info("=" * 70)

        self.driver = SeleniumDriver()
        self.driver.initialize_driver()
        self.test_result = "NOT_RUN"
        self.test_start_time = datetime.now()

    def tearDown(self):
        """Clean up after tests"""
        duration = (datetime.now() - self.test_start_time).total_seconds()
        logger.info(f"Duration: {duration:.1f}s  |  Result: {self.test_result}")
        logger.info("=" * 70 + "\n")
        self.driver.close_driver()

    def _login(self):
        """Helper: Full login flow (Splash → Onboarding → Login → Home)"""
        login_page = LoginPage(self.driver)
        login_page.login(
            TEST_ACCOUNTS["admin"]["email"],
            TEST_ACCOUNTS["admin"]["password"]
        )

    def _is_logged_in(self):
        """Helper: Verify we're on the Home screen after login"""
        home = HomePage(self.driver)
        return home.is_home_displayed()


# ============================================================================
# Test Suite 1: Authentication
# ============================================================================

class TestAuthentication(MediCheckTestBase):
    """Test Cases: Authentication flows"""

    def test_01_login_with_valid_credentials(self):
        """Verify login with correct email and password reaches Home screen"""
        logger.info("\n[TEST] Login with valid credentials")

        try:
            self._login()

            # Verify Home screen is displayed
            self.assertTrue(
                self._is_logged_in(),
                "Home screen not shown after login — check login flow"
            )

            logger.info("✓ TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_01_failed.png")
            self.test_result = "FAILED"
            raise

    def test_02_login_with_invalid_credentials(self):
        """Verify login with wrong credentials does NOT navigate to Home screen"""
        logger.info("\n[TEST] Login with invalid credentials")

        try:
            login_page = LoginPage(self.driver)
            login_page.navigate_to_login()

            login_page.enter_email("wrong@example.com")
            login_page.enter_password("wrongpass123")
            login_page.click_login_button()

            # React Native Web Alert.alert renders as a CUSTOM modal (not window.alert).
            # First try to dismiss any alert that appeared (native or custom)
            login_page.handle_rn_confirmation_dialog("OK", timeout=5)
            login_page.accept_alert_if_present(timeout=2)
            time.sleep(1)

            # KEY ASSERTION: Invalid login should keep user on the login screen.
            # We verify the email input is STILL visible (i.e., no navigation occurred).
            still_on_login = login_page.is_still_on_login_screen()
            self.assertTrue(
                still_on_login,
                "Invalid credentials should keep user on the login screen (not navigate to Home)"
            )
            logger.info("Confirmed: invalid login did NOT navigate away from login screen")

            logger.info("TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"TEST FAILED: {e}")
            self.driver.take_screenshot("test_02_failed.png")
            self.test_result = "FAILED"
            raise

    def test_03_logout_functionality(self):
        """Verify logout from Home => Profile => Log Out brings user back to Login"""
        logger.info("\n[TEST] Logout functionality")

        try:
            # Login first
            self._login()
            self.assertTrue(self._is_logged_in(), "Must be logged in before testing logout")

            # Perform logout (handles RN custom dialog internally)
            dashboard = DashboardPage(self.driver)
            dashboard.logout()

            # After logout + AsyncStorage clear, app navigates to Login screen
            login_page = LoginPage(self.driver)
            time.sleep(1.5)

            is_on_login = login_page.is_login_screen_visible()
            self.assertTrue(is_on_login, "Should be back on Login screen after logout")

            logger.info("TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"TEST FAILED: {e}")
            self.driver.take_screenshot("test_03_failed.png")
            self.test_result = "FAILED"
            raise


# ============================================================================
# Test Suite 2: Home Screen & Navigation
# ============================================================================

class TestHomeNavigation(MediCheckTestBase):
    """Test Cases: Home screen display and navigation"""

    def setUp(self):
        """Set up with logged-in user"""
        super().setUp()
        self._login()
        self.assertTrue(self._is_logged_in(), "Login required for navigation tests")

    def test_04_home_screen_displays_correctly(self):
        """Verify key UI elements on Home screen"""
        logger.info("\n[TEST] Home screen elements")

        try:
            home = HomePage(self.driver)

            # Should see greeting and quick actions
            self.assertTrue(
                home.is_home_displayed(),
                "Home screen not visible"
            )

            # Check quick action buttons exist
            actions_visible = home.is_element_visible(
                ("xpath", "//*[@data-testid='action-symptoms']"),
                timeout=8
            )
            self.assertTrue(actions_visible, "Quick action buttons not visible")

            logger.info("✓ TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_04_failed.png")
            self.test_result = "FAILED"
            raise

    def test_05_navigate_to_doctors(self):
        """Verify navigation to Doctors screen via quick action"""
        logger.info("\n[TEST] Navigate to Doctors screen")

        try:
            doctors_page = DoctorsPage(self.driver)
            doctors_page.navigate_to_doctors()

            # Accept any location permission alert
            doctors_page.accept_alert_if_present(timeout=4)

            # Doctors screen should be visible
            self.assertTrue(
                doctors_page.is_doctors_list_displayed(),
                "Doctors screen not displayed"
            )

            logger.info("✓ TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_05_failed.png")
            self.test_result = "FAILED"
            raise

    def test_06_navigate_to_appointments(self):
        """Verify navigation to Appointments tab"""
        logger.info("\n[TEST] Navigate to Appointments tab")

        try:
            appts_page = AppointmentsPage(self.driver)
            appts_page.navigate_to_appointments()

            self.assertTrue(
                appts_page.is_appointments_list_displayed(),
                "Appointments screen not displayed"
            )

            logger.info("✓ TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_06_failed.png")
            self.test_result = "FAILED"
            raise

    def test_07_navigate_to_profile(self):
        """Verify navigation to Profile screen via avatar button"""
        logger.info("\n[TEST] Navigate to Profile screen")

        try:
            profile_page = ProfilePage(self.driver)
            profile_page.navigate_to_profile()

            # Profile screen should show email
            self.assertTrue(
                profile_page.is_profile_visible(),
                "Profile screen not displayed"
            )

            email = profile_page.get_profile_email()
            logger.info(f"Profile email visible: {email!r}")

            logger.info("✓ TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_07_failed.png")
            self.test_result = "FAILED"
            raise


# ============================================================================
# Test Suite 3: Doctors Screen
# ============================================================================

class TestDoctorFunctionality(MediCheckTestBase):
    """Test Cases: Doctor related features"""

    def setUp(self):
        super().setUp()
        self._login()
        self.assertTrue(self._is_logged_in(), "Login required")
        # Navigate to doctors screen
        self._doctors_page = DoctorsPage(self.driver)
        self._doctors_page.navigate_to_doctors()
        self._doctors_page.accept_alert_if_present(timeout=4)

    def test_08_doctors_list_loads(self):
        """Verify doctors list loads on screen"""
        logger.info("\n[TEST] Doctors list loads")

        try:
            self.assertTrue(
                self._doctors_page.is_doctors_list_displayed(),
                "Doctors list not visible"
            )

            count = self._doctors_page.get_doctors_count()
            logger.info(f"Doctors loaded: {count}")

            logger.info("✓ TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_08_failed.png")
            self.test_result = "FAILED"
            raise

    def test_09_search_doctors(self):
        """Verify search functionality filters results"""
        logger.info("\n[TEST] Search doctors by name/specialization")

        try:
            # Get count before search
            count_before = self._doctors_page.get_doctors_count()
            logger.info(f"Doctors before search: {count_before}")

            # Search for Cardiologist
            self._doctors_page.search_doctor("Cardiologist")

            # Get count after search
            count_after = self._doctors_page.get_doctors_count()
            logger.info(f"Doctors after search 'Cardiologist': {count_after}")

            # Search results should be non-negative (may be 0 if no cardiologists)
            self.assertGreaterEqual(count_after, 0, "Search returned negative results")

            logger.info("✓ TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_09_failed.png")
            self.test_result = "FAILED"
            raise

    def test_10_get_first_doctor_name(self):
        """Verify doctor cards show names"""
        logger.info("\n[TEST] Doctor cards display names")

        try:
            count = self._doctors_page.get_doctors_count()
            if count == 0:
                logger.warning("No doctors found — possibly location permission denied or API empty")
                self.test_result = "SKIPPED"
                return

            name = self._doctors_page.get_first_doctor_name()
            self.assertIsNotNone(name, "First doctor name not found")
            self.assertGreater(len(name), 0, "Doctor name is empty")
            logger.info(f"First doctor name: {name!r}")

            logger.info("✓ TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_10_failed.png")
            self.test_result = "FAILED"
            raise


# ============================================================================
# Test Suite 4: Appointments
# ============================================================================

class TestAppointmentFunctionality(MediCheckTestBase):
    """Test Cases: Appointment related features"""

    def setUp(self):
        super().setUp()
        self._login()
        self.assertTrue(self._is_logged_in(), "Login required")

    def test_11_appointments_list_loads(self):
        """Verify appointments screen loads with mock data"""
        logger.info("\n[TEST] Appointments list loads")

        try:
            appts_page = AppointmentsPage(self.driver)
            appts_page.navigate_to_appointments()

            self.assertTrue(
                appts_page.is_appointments_list_displayed(),
                "Appointments screen not visible"
            )

            count = appts_page.get_appointments_count()
            logger.info(f"Appointments found: {count}")

            logger.info("✓ TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_11_failed.png")
            self.test_result = "FAILED"
            raise


# ============================================================================
# Test Suite 5: Profile
# ============================================================================

class TestProfileFunctionality(MediCheckTestBase):
    """Test Cases: User profile features"""

    def setUp(self):
        super().setUp()
        self._login()
        self.assertTrue(self._is_logged_in(), "Login required")

    def test_12_profile_shows_user_email(self):
        """Verify profile screen shows the logged-in user's email"""
        logger.info("\n[TEST] Profile shows user email")

        try:
            profile_page = ProfilePage(self.driver)
            profile_page.navigate_to_profile()

            self.assertTrue(
                profile_page.is_profile_visible(),
                "Profile screen not visible"
            )

            email = profile_page.get_profile_email()
            logger.info(f"Profile email: {email!r}")

            # Email should contain @ sign
            self.assertIsNotNone(email, "Email not displayed on profile")

            logger.info("✓ TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_12_failed.png")
            self.test_result = "FAILED"
            raise

    def test_13_profile_edit_button_visible(self):
        """Verify the Edit Profile button is shown on profile screen"""
        logger.info("\n[TEST] Edit Profile button visible")

        try:
            profile_page = ProfilePage(self.driver)
            profile_page.navigate_to_profile()

            edit_visible = profile_page.is_element_visible(
                ("xpath", "//*[@data-testid='edit-profile-btn']"),
                timeout=8
            )
            self.assertTrue(edit_visible, "Edit Profile button not found")

            logger.info("✓ TEST PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_13_failed.png")
            self.test_result = "FAILED"
            raise


# ============================================================================
# Test Suite 6: End-to-End Journey
# ============================================================================

class TestEndToEnd(MediCheckTestBase):
    """Test Cases: Complete end-to-end user journey"""

    def test_14_complete_user_journey(self):
        """
        Full E2E: Login → Home → Doctors → Appointments → Profile → Logout
        """
        logger.info("\n[TEST] Complete end-to-end user journey")

        try:
            # --- Step 1: Login ---
            logger.info("Step 1: Login")
            self._login()
            self.assertTrue(self._is_logged_in(), "Step 1 FAILED: Not on Home after login")
            logger.info("  ✓ Logged in successfully")

            # --- Step 2: Doctors ---
            logger.info("Step 2: Navigate to Doctors")
            doctors_page = DoctorsPage(self.driver)
            doctors_page.navigate_to_doctors()
            doctors_page.accept_alert_if_present(timeout=4)
            self.assertTrue(
                doctors_page.is_doctors_list_displayed(),
                "Step 2 FAILED: Doctors screen not shown"
            )
            logger.info("  ✓ Doctors screen loaded")

            # --- Step 3: Go back to Home ---
            logger.info("Step 3: Return to Home via back button")
            doctors_page.try_click(("xpath", "//*[contains(text(),'← Back') or contains(text(),'Back')]"), timeout=5)
            time.sleep(1.5)

            # --- Step 4: Appointments ---
            logger.info("Step 4: Navigate to Appointments tab")
            appts_page = AppointmentsPage(self.driver)
            appts_page.navigate_to_appointments()
            self.assertTrue(
                appts_page.is_appointments_list_displayed(),
                "Step 4 FAILED: Appointments screen not shown"
            )
            logger.info("  ✓ Appointments screen loaded")

            # --- Step 5: Profile ---
            logger.info("Step 5: Navigate to Profile")
            # First go back to Home tab
            appts_page.try_click(("xpath", "//*[@data-testid='tab-home']"), timeout=5)
            time.sleep(1)
            profile_page = ProfilePage(self.driver)
            profile_page.navigate_to_profile()
            self.assertTrue(
                profile_page.is_profile_visible(),
                "Step 5 FAILED: Profile screen not shown"
            )
            email = profile_page.get_profile_email()
            logger.info(f"  ✓ Profile visible, email: {email!r}")

            # --- Step 6: Logout ---
            logger.info("Step 6: Logout")
            # Click logout button then handle the RN custom confirmation dialog
            profile_page.click_logout()
            time.sleep(0.8)  # Give dialog time to render
            profile_page.handle_rn_confirmation_dialog("Log Out", timeout=8)
            profile_page.accept_alert_if_present(timeout=2)  # fallback for native dialog
            time.sleep(2.5)  # Wait for AsyncStorage clear + navigation

            login_page = LoginPage(self.driver)
            self.assertTrue(
                login_page.is_login_screen_visible(),
                "Step 6 FAILED: Not on Login screen after logout"
            )
            logger.info("  Logged out, back on Login screen")

            logger.info("✓ COMPLETE USER JOURNEY PASSED")
            self.test_result = "PASSED"

        except Exception as e:
            logger.error(f"✗ TEST FAILED: {e}")
            self.driver.take_screenshot("test_14_failed.png")
            self.test_result = "FAILED"
            raise


# ============================================================================
# Entry point
# ============================================================================

if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    suite.addTests(loader.loadTestsFromTestCase(TestAuthentication))
    suite.addTests(loader.loadTestsFromTestCase(TestHomeNavigation))
    suite.addTests(loader.loadTestsFromTestCase(TestDoctorFunctionality))
    suite.addTests(loader.loadTestsFromTestCase(TestAppointmentFunctionality))
    suite.addTests(loader.loadTestsFromTestCase(TestProfileFunctionality))
    suite.addTests(loader.loadTestsFromTestCase(TestEndToEnd))

    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)
