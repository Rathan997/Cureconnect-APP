"""
Selenium WebDriver Wrapper
Provides abstraction layer for Selenium WebDriver operations
"""

import os
import logging
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import (
    NoSuchElementException, TimeoutException, 
    StaleElementReferenceException, ElementClickInterceptedException
)
from pathlib import Path

from config import (
    BROWSER, HEADLESS_MODE, BROWSER_OPTIONS, IMPLICIT_WAIT,
    EXPLICIT_WAIT, PAGE_LOAD_TIMEOUT, SCREENSHOTS_DIR, LOGS_DIR, LOG_FORMAT
)

# Configure logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT['detailed'],
    handlers=[
        logging.FileHandler(LOGS_DIR / f"selenium_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
# Set UTF-8 encoding for all handlers
for handler in logger.handlers:
    if isinstance(handler, logging.StreamHandler) and not isinstance(handler, logging.FileHandler):
        handler.setStream(__import__('sys').stdout)

class SeleniumDriver:
    """Selenium WebDriver Wrapper with utilities"""
    
    def __init__(self):
        """Initialize Selenium driver"""
        self.driver = None
        self.wait = None
        self.actions = None
        logger.info("Initializing Selenium WebDriver")
    
    def initialize_driver(self, browser=BROWSER):
        """
        Initialize and return WebDriver
        
        Args:
            browser: Browser type (chrome, firefox, edge, safari)
        
        Returns:
            WebDriver instance
        """
        try:
            logger.info(f"Starting {browser} browser")
            
            if browser.lower() == "chrome":
                self.driver = self._setup_chrome()
            elif browser.lower() == "firefox":
                self.driver = self._setup_firefox()
            elif browser.lower() == "edge":
                self.driver = self._setup_edge()
            else:
                logger.warning(f"Browser {browser} not supported, using Chrome")
                self.driver = self._setup_chrome()
            
            # Set timeouts
            self.driver.implicitly_wait(IMPLICIT_WAIT)
            self.driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
            
            # Initialize wait and actions
            self.wait = WebDriverWait(self.driver, EXPLICIT_WAIT)
            self.actions = ActionChains(self.driver)
            
            logger.info(f"✓ Browser initialized successfully")
            return self.driver
            
        except Exception as e:
            logger.error(f"✗ Failed to initialize browser: {e}")
            raise
    
    def _setup_chrome(self):
        """Setup Chrome browser with options"""
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.chrome.options import Options
        
        chrome_options = Options()
        
        if HEADLESS_MODE:
            chrome_options.add_argument("--headless")
        
        # Add browser options
        for key, value in BROWSER_OPTIONS.get("chrome", {}).items():
            if value is True:
                chrome_options.add_argument(f"--{key}")
            elif value:
                chrome_options.add_argument(f"--{key}={value}")
        
        # Additional options
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        
        try:
            driver = webdriver.Chrome(options=chrome_options)
            logger.info("Chrome browser initialized")
            return driver
        except Exception as e:
            logger.error(f"Failed to setup Chrome: {e}")
            raise
    
    def _setup_firefox(self):
        """Setup Firefox browser with options"""
        from selenium.webdriver.firefox.options import Options
        
        firefox_options = Options()
        
        if HEADLESS_MODE:
            firefox_options.add_argument("--headless")
        
        try:
            driver = webdriver.Firefox(options=firefox_options)
            logger.info("Firefox browser initialized")
            return driver
        except Exception as e:
            logger.error(f"Failed to setup Firefox: {e}")
            raise
    
    def _setup_edge(self):
        """Setup Edge browser with options"""
        from selenium.webdriver.edge.options import Options
        
        edge_options = Options()
        
        if HEADLESS_MODE:
            edge_options.add_argument("--headless")
        
        try:
            driver = webdriver.Edge(options=edge_options)
            logger.info("Edge browser initialized")
            return driver
        except Exception as e:
            logger.error(f"Failed to setup Edge: {e}")
            raise
    
    def navigate_to(self, url):
        """
        Navigate to URL
        
        Args:
            url: URL to navigate to
        """
        try:
            logger.info(f"Navigating to {url}")
            self.driver.get(url)
            logger.info(f"✓ Navigated successfully")
        except Exception as e:
            logger.error(f"✗ Failed to navigate to {url}: {e}")
            raise
    
    def find_element(self, locator, timeout=EXPLICIT_WAIT):
        """
        Find element using locator
        
        Args:
            locator: Tuple of (By method, locator value)
            timeout: Wait timeout in seconds
        
        Returns:
            WebElement
        """
        try:
            element = self.wait.until(
                EC.presence_of_element_located(locator),
                message=f"Element {locator} not found after {timeout}s"
            )
            logger.debug(f"✓ Element found: {locator}")
            return element
        except TimeoutException:
            logger.error(f"✗ Element not found: {locator}")
            raise
        except Exception as e:
            logger.error(f"✗ Error finding element {locator}: {e}")
            raise
    
    def find_elements(self, locator):
        """Find multiple elements"""
        try:
            elements = self.driver.find_elements(*locator)
            logger.debug(f"✓ Found {len(elements)} elements: {locator}")
            return elements
        except Exception as e:
            logger.error(f"✗ Error finding elements {locator}: {e}")
            return []
    
    def click_element(self, locator, retries=3):
        """
        Click element with retry logic
        
        Args:
            locator: Tuple of (By method, locator value)
            retries: Number of retry attempts
        """
        for attempt in range(retries):
            try:
                element = self.wait.until(EC.element_to_be_clickable(locator))
                element.click()
                logger.info(f"✓ Element clicked: {locator}")
                return
            except ElementClickInterceptedException:
                if attempt < retries - 1:
                    logger.warning(f"Element intercepted, retrying... ({attempt + 1}/{retries})")
                    time.sleep(0.5)
                else:
                    logger.error(f"✗ Failed to click element after {retries} retries")
                    raise
            except Exception as e:
                logger.error(f"✗ Failed to click element {locator}: {e}")
                raise
    
    def send_keys(self, locator, text, clear_first=True):
        """
        Send text to input element
        
        Args:
            locator: Tuple of (By method, locator value)
            text: Text to send
            clear_first: Clear field before sending text
        """
        try:
            element = self.find_element(locator)
            if clear_first:
                element.clear()
            element.send_keys(text)
            logger.info(f"✓ Text sent to element {locator}: {text[:20]}...")
        except Exception as e:
            logger.error(f"✗ Failed to send keys to {locator}: {e}")
            raise
    
    def get_text(self, locator):
        """Get text from element"""
        try:
            element = self.find_element(locator)
            text = element.text
            logger.debug(f"✓ Text retrieved: {text[:50]}...")
            return text
        except Exception as e:
            logger.error(f"✗ Failed to get text from {locator}: {e}")
            raise
    
    def get_attribute(self, locator, attribute):
        """Get element attribute"""
        try:
            element = self.find_element(locator)
            value = element.get_attribute(attribute)
            logger.debug(f"✓ Attribute retrieved: {attribute}={value}")
            return value
        except Exception as e:
            logger.error(f"✗ Failed to get attribute {attribute} from {locator}: {e}")
            raise
    
    def is_element_displayed(self, locator, timeout=5):
        """Check if element is displayed"""
        try:
            element = self.wait.until(
                EC.visibility_of_element_located(locator),
                message=f"Element {locator} not visible"
            )
            logger.debug(f"✓ Element is displayed: {locator}")
            return True
        except TimeoutException:
            logger.debug(f"Element not displayed: {locator}")
            return False
        except Exception as e:
            logger.error(f"✗ Error checking element visibility: {e}")
            return False
    
    def is_element_present(self, locator):
        """Check if element is present in DOM"""
        try:
            self.driver.find_element(*locator)
            logger.debug(f"✓ Element present: {locator}")
            return True
        except NoSuchElementException:
            logger.debug(f"Element not present: {locator}")
            return False
    
    def wait_for_element(self, locator, timeout=EXPLICIT_WAIT):
        """Wait for element to be visible"""
        try:
            element = self.wait.until(
                EC.visibility_of_element_located(locator),
                message=f"Element {locator} not visible after {timeout}s"
            )
            logger.info(f"✓ Element visible: {locator}")
            return element
        except TimeoutException:
            logger.error(f"✗ Element not visible: {locator}")
            raise
    
    def wait_for_element_to_disappear(self, locator, timeout=EXPLICIT_WAIT):
        """Wait for element to disappear"""
        try:
            self.wait.until(
                EC.invisibility_of_element_located(locator),
                message=f"Element {locator} still visible after {timeout}s"
            )
            logger.info(f"✓ Element disappeared: {locator}")
        except TimeoutException:
            logger.error(f"✗ Element still visible: {locator}")
            raise
    
    def scroll_to_element(self, locator):
        """Scroll to element"""
        try:
            element = self.find_element(locator)
            self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
            logger.info(f"✓ Scrolled to element: {locator}")
        except Exception as e:
            logger.error(f"✗ Failed to scroll to element: {e}")
            raise
    
    def hover_over_element(self, locator):
        """Hover over element"""
        try:
            element = self.find_element(locator)
            self.actions.move_to_element(element).perform()
            logger.info(f"✓ Hovered over element: {locator}")
        except Exception as e:
            logger.error(f"✗ Failed to hover over element: {e}")
            raise
    
    def take_screenshot(self, filename=None):
        """
        Take screenshot
        
        Args:
            filename: Custom filename (without path)
        
        Returns:
            Path to screenshot
        """
        try:
            if not filename:
                filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            
            filepath = SCREENSHOTS_DIR / filename
            self.driver.save_screenshot(str(filepath))
            logger.info(f"✓ Screenshot saved: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"✗ Failed to take screenshot: {e}")
            return None
    
    def get_current_url(self):
        """Get current page URL"""
        url = self.driver.current_url
        logger.debug(f"Current URL: {url}")
        return url
    
    def get_page_title(self):
        """Get page title"""
        title = self.driver.title
        logger.debug(f"Page title: {title}")
        return title
    
    def refresh_page(self):
        """Refresh current page"""
        try:
            self.driver.refresh()
            logger.info("✓ Page refreshed")
        except Exception as e:
            logger.error(f"✗ Failed to refresh page: {e}")
            raise
    
    def go_back(self):
        """Go back to previous page"""
        try:
            self.driver.back()
            logger.info("✓ Navigated back")
        except Exception as e:
            logger.error(f"✗ Failed to go back: {e}")
            raise
    
    def go_forward(self):
        """Go forward to next page"""
        try:
            self.driver.forward()
            logger.info("✓ Navigated forward")
        except Exception as e:
            logger.error(f"✗ Failed to go forward: {e}")
            raise
    
    def close_driver(self):
        """Close WebDriver"""
        try:
            if self.driver:
                self.driver.quit()
                logger.info("✓ Browser closed successfully")
        except Exception as e:
            logger.error(f"✗ Error closing browser: {e}")
            raise
    
    def execute_script(self, script, *args):
        """Execute JavaScript"""
        try:
            result = self.driver.execute_script(script, *args)
            logger.debug(f"✓ JavaScript executed")
            return result
        except Exception as e:
            logger.error(f"✗ Failed to execute script: {e}")
            raise
    
    def wait_for_ajax(self, timeout=10):
        """Wait for AJAX calls to complete"""
        try:
            self.wait.until(
                lambda driver: driver.execute_script("return jQuery.active == 0"),
                message="AJAX call did not complete"
            )
            logger.info("✓ AJAX calls completed")
        except:
            logger.warning("⚠ Could not verify AJAX completion (jQuery might not be available)")
    
    def clear_cookies(self):
        """Clear all cookies"""
        try:
            self.driver.delete_all_cookies()
            logger.info("✓ Cookies cleared")
        except Exception as e:
            logger.error(f"✗ Failed to clear cookies: {e}")
            raise
    
    def get_page_source(self):
        """Get page source HTML"""
        try:
            source = self.driver.page_source
            logger.debug("✓ Page source retrieved")
            return source
        except Exception as e:
            logger.error(f"✗ Failed to get page source: {e}")
            raise

# ============================================================================
# Example Usage
# ============================================================================

if __name__ == "__main__":
    driver_wrapper = SeleniumDriver()
    driver = driver_wrapper.initialize_driver("chrome")
    
    try:
        driver_wrapper.navigate_to("http://localhost:3000")
        print(f"Title: {driver_wrapper.get_page_title()}")
        print(f"URL: {driver_wrapper.get_current_url()}")
        driver_wrapper.take_screenshot("test_screenshot.png")
    finally:
        driver_wrapper.close_driver()
