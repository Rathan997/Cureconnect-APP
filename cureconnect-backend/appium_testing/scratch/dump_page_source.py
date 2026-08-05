import logging
import time
from driver import AppiumDriver
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    appium_driver = AppiumDriver()
    logger.info("Initializing driver...")
    driver = appium_driver.init_driver()
    try:
        logger.info("Driver initialized. Sleeping 8 seconds to let app load...")
        time.sleep(8)
        
        # Skip onboarding if skip button exists
        logger.info("Attempting to skip onboarding...")
        try:
            # Tap skip button if visible
            skip_loc = ("xpath", '//*[@content-desc="skip-onboarding"] | //*[@text="Skip"] | //*[@text="Get Started"]')
            el = driver.find_element(*appium_driver._by_from_locator(skip_loc))
            el.click()
            logger.info("Clicked skip onboarding button!")
            time.sleep(3)
        except Exception as e:
            logger.info("Skip button not found or clicked, proceeding. Error: %s", e)
            
        logger.info("Dumping page source...")
        xml_source = driver.page_source
        with open("reports/page_source.xml", "w", encoding="utf-8") as f:
            f.write(xml_source)
        logger.info("Page source dumped to reports/page_source.xml")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
