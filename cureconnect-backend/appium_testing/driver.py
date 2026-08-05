"""
Appium Driver Wrapper — CureConnect Android Testing
====================================================
Wraps the Appium WebDriver with helper methods for:
  - Element finding with explicit waits
  - Scroll helpers (swipe up/down to reveal elements)
  - Text input with clear-first
  - Screenshot capture
  - Alert dialog handling (native Android Alert.alert)
  - Connectivity check (ping Appium server before starting)
"""

import logging
import time
from pathlib import Path
from datetime import datetime

import requests
from appium import webdriver
from appium.options.android.uiautomator2.base import UiAutomator2Options
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException, NoSuchElementException,
    StaleElementReferenceException, WebDriverException,
)

import config

logger = logging.getLogger("driver")


class AppiumDriver:
    """
    Appium WebDriver wrapper for the CureConnect Android app.

    Usage:
        driver = AppiumDriver()
        driver.init_driver()
        # ... interact ...
        driver.quit()
    """

    def __init__(self):
        self.driver = None
        self._screenshot_dir = config.SCREENSHOTS_DIR

    # ─────────────────────────────────────────────────────────────────────────
    # DRIVER LIFECYCLE
    # ─────────────────────────────────────────────────────────────────────────

    def init_driver(self):
        """Initialize Appium WebDriver with UiAutomator2 options."""
        logger.info("Initializing Appium WebDriver")
        try:
            options = UiAutomator2Options()
            for key, val in config.APPIUM_CAPABILITIES.items():
                # Map capability keys to options attributes
                setattr(options, key, val)

            self.driver = webdriver.Remote(
                command_executor=config.APPIUM_URL,
                options=options,
            )
            self.driver.implicitly_wait(config.IMPLICIT_WAIT)
            logger.info("Appium WebDriver initialized successfully")
            logger.info(f"  Session ID : {self.driver.session_id}")
            logger.info(f"  Platform   : {self.driver.capabilities.get('platformName')}")
            logger.info(f"  OS Version : {self.driver.capabilities.get('platformVersion', 'N/A')}")
            return self.driver

        except Exception as e:
            logger.error(f"Failed to initialize Appium driver: {e}")
            raise

    def quit(self):
        """Quit the Appium session and close the app."""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("Appium session closed")
            except Exception as e:
                logger.warning(f"Error closing driver: {e}")
            finally:
                self.driver = None

    # ─────────────────────────────────────────────────────────────────────────
    # ELEMENT FINDERS
    # ─────────────────────────────────────────────────────────────────────────

    def _by_from_locator(self, locator):
        """Convert ('accessibility id', 'value') → (By, value) for Appium."""
        strategy, value = locator
        strategy_map = {
            "accessibility id": AppiumBy.ACCESSIBILITY_ID,
            "xpath":            AppiumBy.XPATH,
            "id":               AppiumBy.ID,
            "class name":       AppiumBy.CLASS_NAME,
            "android uiautomator": AppiumBy.ANDROID_UIAUTOMATOR,
        }
        by = strategy_map.get(strategy, strategy)
        return by, value

    def _wait_for_condition(self, locator, condition, timeout):
        """Wait for element condition, with fallback from accessibility id to resource-id XPath on Android."""
        by, value = self._by_from_locator(locator)
        wait = WebDriverWait(self.driver, timeout)
        try:
            return wait.until(condition((by, value)))
        except TimeoutException as e:
            if by == AppiumBy.ACCESSIBILITY_ID:
                try:
                    logger.debug(f"Fallback to resource-id XPath for: {value}")
                    fallback_locator = (AppiumBy.XPATH, f'//*[@resource-id="{value}"]')
                    return wait.until(condition(fallback_locator))
                except TimeoutException:
                    pass
            raise e

    def find_element(self, locator, timeout=None):
        """Wait for element to be present and return it."""
        timeout = timeout or config.EXPLICIT_WAIT
        return self._wait_for_condition(locator, EC.presence_of_element_located, timeout)

    def find_elements(self, locator, timeout=None):
        """Find all matching elements."""
        timeout = timeout or config.EXPLICIT_WAIT
        by, value = self._by_from_locator(locator)
        try:
            self._wait_for_condition(locator, EC.presence_of_element_located, timeout)
            elements = self.driver.find_elements(by, value)
            if not elements and by == AppiumBy.ACCESSIBILITY_ID:
                elements = self.driver.find_elements(AppiumBy.XPATH, f'//*[@resource-id="{value}"]')
            return elements
        except TimeoutException:
            return []

    def wait_for_element(self, locator, timeout=None):
        """Wait until element is visible."""
        timeout = timeout or config.EXPLICIT_WAIT
        try:
            return self._wait_for_condition(locator, EC.visibility_of_element_located, timeout)
        except TimeoutException:
            return None

    def is_element_visible(self, locator, timeout=5):
        """Return True if element is visible within timeout."""
        try:
            el = self.wait_for_element(locator, timeout=timeout)
            return el is not None and el.is_displayed()
        except Exception:
            return False

    # ─────────────────────────────────────────────────────────────────────────
    # INTERACTION HELPERS
    # ─────────────────────────────────────────────────────────────────────────

    def tap(self, locator, timeout=None):
        """
        Tap an element. Returns True on success.
        Uses .click() which sends a native tap event (no ActionChains needed).
        """
        timeout = timeout or config.EXPLICIT_WAIT
        try:
            el = self._wait_for_condition(locator, EC.element_to_be_clickable, timeout)
            el.click()
            logger.info(f"Tapped: {locator[1]}")
            return True
        except TimeoutException:
            logger.warning(f"Tap timeout: {locator[1]}")
            return False
        except Exception as e:
            logger.warning(f"Tap failed on {locator[1]}: {e}")
            return False

    def type_text(self, locator, text, clear_first=True, timeout=None):
        """
        Type text into an input field.
        clear_first=True clears existing content before typing.
        """
        timeout = timeout or config.EXPLICIT_WAIT
        try:
            el = self._wait_for_condition(locator, EC.element_to_be_clickable, timeout)
            el.click()
            time.sleep(0.2)
            if clear_first:
                try:
                    el.clear()
                except Exception:
                    pass
            el.send_keys(text)
            
            # Double check if text was entered successfully
            entered_text = ""
            try:
                entered_text = el.text or el.get_attribute("text") or ""
            except Exception:
                pass
            
            hint_text = ""
            try:
                hint_text = el.get_attribute("hint") or ""
            except Exception:
                pass
                
            is_empty = not entered_text or entered_text == hint_text
            if is_empty and text:
                logger.info(f"Appium send_keys failed to input text. Falling back to ADB key event input...")
                escaped_text = text.replace(" ", "%s").replace("&", r"\&")
                import subprocess
                subprocess.run(["adb", "shell", "input", "text", escaped_text], capture_output=True)
                time.sleep(0.2)
                
            logger.info(f"Typed '{text[:30]}' into: {locator[1]}")
            return True
        except TimeoutException:
            logger.warning(f"Type text timeout: {locator[1]}")
            return False
        except Exception as e:
            logger.warning(f"Type text failed on {locator[1]}: {e}")
            return False

    def get_text(self, locator, timeout=None):
        """Get text content of an element."""
        timeout = timeout or config.EXPLICIT_WAIT
        try:
            el = self.find_element(locator, timeout=timeout)
            # React Native elements expose text via 'text' attribute
            text = el.text or el.get_attribute("text") or el.get_attribute("content-desc") or ""
            return text.strip()
        except Exception as e:
            logger.warning(f"get_text failed for {locator[1]}: {e}")
            return ""

    # ─────────────────────────────────────────────────────────────────────────
    # SCROLL / SWIPE HELPERS
    # ─────────────────────────────────────────────────────────────────────────

    def swipe_up(self, duration=800):
        """Swipe up (scroll down the screen)."""
        size = self.driver.get_window_size()
        start_x = size["width"] // 2
        start_y = int(size["height"] * 0.75)
        end_y   = int(size["height"] * 0.25)
        self.driver.swipe(start_x, start_y, start_x, end_y, duration)
        time.sleep(0.3)

    def swipe_down(self, duration=800):
        """Swipe down (scroll up the screen)."""
        size = self.driver.get_window_size()
        start_x = size["width"] // 2
        start_y = int(size["height"] * 0.25)
        end_y   = int(size["height"] * 0.75)
        self.driver.swipe(start_x, start_y, start_x, end_y, duration)
        time.sleep(0.3)

    def scroll_to_element(self, locator, max_swipes=5):
        """
        Swipe up until element is found on screen.
        Uses UiScrollable when possible (faster), falls back to swipe loop.
        """
        # Try UiAutomator's UiScrollable for fast scrolling
        if locator[0] in ("accessibility id",):
            text_val = locator[1]
            try:
                scroll_locator = (
                    "android uiautomator",
                    f'new UiScrollable(new UiSelector().scrollable(true))'
                    f'.scrollIntoView(new UiSelector().description("{text_val}"))'
                )
                el = self.find_element(scroll_locator, timeout=8)
                if el:
                    logger.info(f"Scrolled to element via UiScrollable: {text_val}")
                    return el
            except Exception:
                pass

        # Fallback: manual swipe loop
        for i in range(max_swipes):
            if self.is_element_visible(locator, timeout=2):
                return self.find_element(locator, timeout=5)
            logger.debug(f"Swipe {i+1}/{max_swipes} to find: {locator[1]}")
            self.swipe_up()

        logger.warning(f"Element not found after {max_swipes} swipes: {locator[1]}")
        return None

    # ─────────────────────────────────────────────────────────────────────────
    # ALERT / DIALOG HANDLING
    # ─────────────────────────────────────────────────────────────────────────

    def handle_alert_dialog(self, button_text="OK", timeout=8):
        """
        Handle native Android AlertDialog (from React Native's Alert.alert).
        On Android, Alert.alert renders a REAL native dialog — not a no-op!
        Finds the dialog button by its text and taps it.
        """
        logger.info(f"Waiting for Alert dialog with button: '{button_text}'")
        locator = ("xpath", f'//*[@text="{button_text}"]')
        by, value = self._by_from_locator(locator)
        wait = WebDriverWait(self.driver, timeout)
        try:
            btn = wait.until(EC.element_to_be_clickable((by, value)))
            btn.click()
            logger.info(f"Tapped alert button: '{button_text}'")
            return True
        except TimeoutException:
            logger.warning(f"Alert button '{button_text}' not found after {timeout}s")
            return False

    def dismiss_alert(self, timeout=5):
        """Dismiss any Android native alert/dialog by pressing Back."""
        try:
            self.driver.back()
            return True
        except Exception:
            return False

    # ─────────────────────────────────────────────────────────────────────────
    # SCREENSHOT
    # ─────────────────────────────────────────────────────────────────────────

    def take_screenshot(self, name="screenshot"):
        """Save screenshot to reports/screenshots/. Returns file path."""
        try:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_name = name.replace(" ", "_").replace("/", "_")
            filename = self._screenshot_dir / f"{safe_name}_{ts}.png"
            self.driver.save_screenshot(str(filename))
            logger.info(f"Screenshot saved: {filename}")
            return str(filename)
        except Exception as e:
            logger.warning(f"Screenshot failed: {e}")
            return None

    # ─────────────────────────────────────────────────────────────────────────
    # APP CONTROL
    # ─────────────────────────────────────────────────────────────────────────

    def navigate_back(self):
        """Press the Android back button."""
        try:
            self.driver.back()
            time.sleep(0.5)
            logger.info("Pressed Android Back button")
        except Exception as e:
            logger.warning(f"Back navigation failed: {e}")

    def hide_keyboard(self):
        """Hide soft keyboard if visible."""
        try:
            if self.driver.is_keyboard_shown():
                self.driver.hide_keyboard()
                time.sleep(0.5)
                logger.info("Dismissed keyboard natively")
        except Exception:
            try:
                # ADB fallback to dismiss keyboard
                import subprocess
                subprocess.run(["adb", "shell", "input", "keyevent", "111"], capture_output=True)
                time.sleep(0.5)
            except Exception:
                pass

    def reset_app(self):
        """Terminate and relaunch the app (clears session state)."""
        try:
            self.driver.terminate_app(config.APP_PACKAGE)
            time.sleep(1)
            self.driver.activate_app(config.APP_PACKAGE)
            time.sleep(2)
            logger.info("App reset (terminate + relaunch)")
        except Exception as e:
            logger.warning(f"App reset failed: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# CONNECTIVITY CHECK
# ─────────────────────────────────────────────────────────────────────────────

def check_appium_server():
    """Ping the Appium server to verify it's running."""
    try:
        resp = requests.get(f"{config.APPIUM_URL}/status", timeout=5)
        data = resp.json()
        ready = data.get("value", {}).get("ready", False)
        if ready:
            logger.info(f"Appium server is running at {config.APPIUM_URL}")
            return True
        else:
            logger.warning(f"Appium server responded but not ready: {data}")
            return False
    except requests.ConnectionError:
        logger.error(f"Cannot reach Appium server at {config.APPIUM_URL}")
        logger.error("Start it with: appium --port 4723")
        return False
    except Exception as e:
        logger.error(f"Appium server check failed: {e}")
        return False


def check_adb_device():
    """Check that at least one Android device/emulator is connected via ADB."""
    import subprocess
    try:
        result = subprocess.run(
            ["adb", "devices"],
            capture_output=True, text=True, timeout=10
        )
        lines = result.stdout.strip().splitlines()
        # Lines after header that contain 'device' (not 'offline')
        devices = [l for l in lines[1:] if "\tdevice" in l]
        if devices:
            logger.info(f"ADB device(s) found: {devices}")
            return True
        else:
            logger.error("No Android devices/emulators connected via ADB")
            logger.error("Run `adb devices` to check, or start an emulator")
            return False
    except FileNotFoundError:
        logger.error("adb not found. Install Android SDK and add to PATH")
        return False
    except Exception as e:
        logger.error(f"ADB check failed: {e}")
        return False
