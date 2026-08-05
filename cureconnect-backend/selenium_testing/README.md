# Selenium Testing Suite - MediCheck Web Application

## Overview

This directory contains a comprehensive **Selenium-based End-to-End (E2E) testing suite** for the MediCheck web application. The suite tests all major features and user workflows with automated test case execution and professional Excel report generation.

---

## 📋 Test Coverage

### Test Categories

| Category | Tests | Coverage |
|----------|-------|----------|
| **Authentication** | 3 | Login, invalid login, logout |
| **Dashboard Navigation** | 4 | Dashboard access, menu navigation |
| **Doctor Features** | 2 | View doctors, search doctors |
| **Medicine Features** | 2 | View medicines, add medicines |
| **Appointments** | 1 | View and manage appointments |
| **End-to-End** | 1 | Complete user journey |
| **TOTAL** | **13** | **Full web application coverage** |

### Test Cases

1. **T001**: Login with valid credentials ✓
2. **T002**: Login with invalid credentials ✓
3. **T003**: Logout functionality ✓
4. **T004**: Navigate to doctors ✓
5. **T005**: Navigate to appointments ✓
6. **T006**: Navigate to medicines ✓
7. **T007**: Navigate to profile ✓
8. **T008**: Search doctors ✓
9. **T009**: View doctor details ✓
10. **T010**: View medicines list ✓
11. **T011**: Add medicine ✓
12. **T012**: View appointments ✓
13. **T013**: Complete end-to-end user journey ✓

---

## 🛠️ Prerequisites

### Software Requirements
- **Python 3.8+**
- **Selenium WebDriver 4.15+**
- **Browser**: Chrome, Firefox, Edge, or Safari
- **ChromeDriver** (for Chrome testing)

### Optional Requirements
- **Virtual Environment** (recommended)
- **Git** (for version control)

### System Requirements
- **RAM**: 2GB minimum
- **Disk Space**: 500MB for dependencies and reports
- **Internet**: For downloading WebDrivers

---

## 📦 Installation

### Step 1: Navigate to Test Directory

```bash
cd d:\cureconnect-backend\selenium_testing
```

### Step 2: Create Virtual Environment (Optional but Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Download WebDriver

Selenium requires a WebDriver for your browser:

#### Chrome (Recommended)

```bash
# Download ChromeDriver from: https://chromedriver.chromium.org/
# Or use webdriver-manager:
pip install webdriver-manager
```

#### Firefox

```bash
# Download GeckoDriver from: https://github.com/mozilla/geckodriver/releases
```

---

## ⚙️ Configuration

### Update Application URL

Edit `config.py` and update:

```python
# Application URLs
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
```

### Update Test Credentials

Edit `config.py` and update test accounts:

```python
TEST_ACCOUNTS = {
    "admin": {
        "email": "rathanreddy676@gmail.com",
        "password": "9652090259",
        "name": "Admin User",
        "role": "admin"
    },
    "user1": {
        "email": "user1@example.com",
        "password": "Password@123",
        "name": "Test User 1",
        "role": "user"
    }
}
```

### Update Browser Selection

Set the browser type in `config.py`:

```python
# Browser type: 'chrome', 'firefox', 'edge', 'safari'
BROWSER = os.getenv("BROWSER", "chrome")

# Headless mode (no GUI)
HEADLESS_MODE = os.getenv("HEADLESS", "false").lower() == "true"
```

### Update Element Locators

Inspect your web application and update `config.py` with actual element locators:

```python
LOCATORS = {
    "email_input": ("id", "email"),
    "password_input": ("id", "password"),
    "login_button": ("id", "login-btn"),
    # ... update all locators
}
```

**To get locators:**
1. Right-click element in browser
2. Select "Inspect" or "Inspect Element"
3. Find the `id`, `class`, or `xpath` of the element
4. Update in LOCATORS dictionary

---

## 🚀 Running Tests

### Run All Tests

```bash
python run_tests.py
```

### Run Specific Test Class

```bash
python -m unittest test_cases.TestAuthentication -v
python -m unittest test_cases.TestDashboardNavigation -v
python -m unittest test_cases.TestDoctorFunctionality -v
```

### Run Single Test

```bash
python -m unittest test_cases.TestAuthentication.test_01_login_with_valid_credentials -v
```

### Run Tests with Specific Browser

```bash
# Chrome
BROWSER=chrome python run_tests.py

# Firefox
BROWSER=firefox python run_tests.py

# Edge
BROWSER=edge python run_tests.py
```

### Run Tests in Headless Mode

```bash
HEADLESS=true python run_tests.py
```

---

## 📊 Test Reports

### Excel Report

After test execution, an Excel report is automatically generated:

```
selenium_testing/reports/Selenium_Test_Report_YYYYMMDD_HHMMSS.xlsx
```

**Report Sheets:**
1. **Summary** - Overall statistics and pass rate
2. **Test Results** - Detailed test execution results
3. **Issues** - Failed tests and error messages
4. **Recommendations** - Action items for improvement
5. **Statistics** - Detailed analysis and breakdown

### Screenshots

Failed test screenshots are saved in:

```
selenium_testing/reports/screenshots/
```

### Logs

Detailed execution logs are saved in:

```
selenium_testing/reports/logs/
```

---

## 📁 Project Structure

```
selenium_testing/
├── config.py                 # Configuration hub
├── driver.py                 # Selenium WebDriver wrapper
├── pages.py                  # Page Object Models
├── test_cases.py             # Test implementations (13 tests)
├── run_tests.py              # Test runner and orchestrator
├── report_generator.py       # Excel report generation
├── requirements.txt          # Python dependencies
├── README.md                 # This file
│
├── reports/                  # Test reports
│   ├── screenshots/          # Failed test screenshots
│   ├── logs/                 # Test execution logs
│   └── *.xlsx                # Excel test reports
│
└── .env                      # Environment variables (optional)
```

---

## 🏗️ File Descriptions

### config.py
- Contains all configuration settings
- Browser options and wait timeouts
- Test account credentials
- Element locators (XPath, ID, CSS Selectors)
- Test data (doctors, medicines, appointments, etc.)

### driver.py
- Selenium WebDriver abstraction layer
- Methods for finding, clicking, typing, waiting for elements
- Screenshot capture functionality
- Error handling and logging
- Cross-browser support

### pages.py
- Page Object Models for each web page
- Encapsulates page-specific interactions
- Includes: LoginPage, DashboardPage, DoctorsPage, MedicinesPage, AppointmentsPage, ProfilePage
- Follows POM best practices

### test_cases.py
- All 13 test cases organized into 6 test classes
- Each test is independent and can run standalone
- Includes setup and teardown for test fixtures
- Comprehensive logging and error handling

### run_tests.py
- Main test orchestrator
- Checks prerequisites before running
- Executes all test suites
- Generates Excel reports
- Provides test execution summary

### report_generator.py
- Generates professional Excel reports
- Color-coded test results (green = pass, red = fail)
- Multiple sheets with different information
- Statistics and recommendations

---

## 🧪 Test Execution Example

```
================================================================================
                    SELENIUM TEST SUITE EXECUTION
================================================================================

Checking Prerequisites...
✓ Python 3.8.10
✓ selenium is installed
✓ openpyxl is installed
✓ Base URL: http://localhost:3000
✓ Directory ready: reports

Running Tests...
test_01_login_with_valid_credentials (test_cases.TestAuthentication) ... ok
test_02_login_with_invalid_credentials (test_cases.TestAuthentication) ... ok
test_03_logout_functionality (test_cases.TestAuthentication) ... ok
test_04_navigate_to_doctors (test_cases.TestDashboardNavigation) ... ok
...

================================================================================
TEST EXECUTION COMPLETED
================================================================================
Duration: 45.23s
Tests run: 13
Passed: 13
Failed: 0
Skipped: 0

✓ ALL TESTS PASSED!

Report Location: d:\cureconnect-backend\selenium_testing\reports\Selenium_Test_Report_20250115_143022.xlsx
Logs Location: d:\cureconnect-backend\selenium_testing\reports\logs\
Screenshots Location: d:\cureconnect-backend\selenium_testing\reports\screenshots\
```

---

## 🔍 Troubleshooting

### WebDriver Not Found

```
Error: 'chromedriver' executable needs to be in PATH
```

**Solution:**
1. Download ChromeDriver from https://chromedriver.chromium.org/
2. Add to PATH or specify path in config.py
3. Or use webdriver-manager: `pip install webdriver-manager`

### Element Not Found

```
NoSuchElementException: no such element
```

**Solution:**
1. Use browser's Inspect Element to get correct locator
2. Update locator in config.py LOCATORS dictionary
3. Verify element is visible on page
4. Increase wait timeout if element loads slowly

### Connection Refused

```
Error: Failed to connect to http://localhost:3000
```

**Solution:**
1. Verify web application is running
2. Check BASE_URL in config.py
3. Verify firewall allows connection
4. Check application is listening on correct port

### Test Timeout

```
TimeoutException: element not found after 15 seconds
```

**Solution:**
1. Increase EXPLICIT_WAIT in config.py
2. Verify element exists on page
3. Check for JavaScript loading delays
4. Look at logs for more details

### Permission Denied

```
PermissionError: [Errno 13] Permission denied: 'reports'
```

**Solution:**
1. Close Excel files that are open
2. Check folder permissions
3. Run as administrator (if needed)
4. Delete old report files

---

## 🎓 Best Practices

### Writing New Tests
1. Follow naming convention: `test_XX_description`
2. Use Page Object Models
3. Add logging statements
4. Handle exceptions properly
5. Clean up resources

### Page Object Model
```python
class NewPage(BasePage):
    def __init__(self, driver):
        super().__init__(driver)
        self.driver_wrapper = driver
    
    def interact_with_element(self):
        logger.info("[ACTION] Interacting with element")
        self.driver_wrapper.click_element(LOCATORS["element_name"])
```

### Test Structure
```python
def test_XX_description(self):
    """Test description"""
    logger.info("\n[TEST] Test description")
    
    try:
        # Arrange - set up test
        # Act - perform actions
        # Assert - verify results
        logger.info("✓ TEST PASSED")
        self.test_result = "PASSED"
    except Exception as e:
        logger.error(f"✗ TEST FAILED: {e}")
        self.driver.take_screenshot("test_XX_failed.png")
        self.test_result = "FAILED"
        raise
```

---

## 📈 Performance Optimization

### Use Headless Mode
```bash
HEADLESS=true python run_tests.py
```

### Run Tests in Parallel
Modify run_tests.py to use threading or pytest-xdist

### Optimize Waits
- Use implicit waits for simple cases
- Use explicit waits for complex scenarios
- Reduce wait timeout if not needed

### Browser Options
```python
# Disable images to speed up loading
BROWSER_OPTIONS["chrome"].add_argument("--blink-settings=imagesEnabled=false")
```

---

## 🔐 Security & Best Practices

### Never Commit Credentials
```bash
# Add to .gitignore
echo "config.py" >> .gitignore
```

### Use Environment Variables
```python
import os
TEST_EMAIL = os.getenv("TEST_EMAIL", "default@example.com")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "default_password")
```

### Clear Sensitive Data
```python
# After tests, clear any sensitive data
self.driver.clear_cookies()
self.driver.execute_script("window.sessionStorage.clear();")
```

---

## 🚀 Continuous Integration

### GitHub Actions Example

```yaml
name: Selenium Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
      - run: pip install -r requirements.txt
      - run: HEADLESS=true python run_tests.py
```

### Jenkins Integration

```groovy
stage('Selenium Tests') {
    steps {
        sh '''
            cd selenium_testing
            pip install -r requirements.txt
            HEADLESS=true python run_tests.py
        '''
    }
}
```

---

## 📞 Support & Help

### Check Logs
```bash
# View latest log file
tail -f reports/logs/test_run_*.log
```

### Debug Mode
```bash
# Run with verbose output
python -m unittest test_cases -v
```

### Take Screenshots
```python
# During test
self.driver.take_screenshot("debug_screenshot.png")
```

---

## 📚 Additional Resources

- [Selenium Documentation](https://selenium.dev/documentation/)
- [Page Object Model Pattern](https://selenium.dev/documentation/test_practices/encouraged/page_object_models/)
- [openpyxl Documentation](https://openpyxl.readthedocs.io/)
- [Python unittest](https://docs.python.org/3/library/unittest.html)

---

## ✅ Success Checklist

- [ ] Python 3.8+ installed
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] Web application running on BASE_URL
- [ ] Browser driver downloaded and in PATH
- [ ] config.py updated with credentials
- [ ] config.py updated with element locators
- [ ] Test credentials are valid
- [ ] Reports directory is writable
- [ ] Run initial test: `python run_tests.py`
- [ ] Excel report generated successfully

---

## 🎯 Next Steps

1. **Setup Environment** - Install dependencies and configure
2. **Update Locators** - Use browser Inspect to get element IDs
3. **Run First Test** - Execute `python run_tests.py`
4. **Review Report** - Check Excel report in reports/ folder
5. **Debug Issues** - Fix any failures and re-run
6. **Extend Tests** - Add more test cases as needed
7. **Automate** - Integrate with CI/CD pipeline

---

## 📄 File Manifest

```
selenium_testing/
├── 📄 config.py                (400+ lines)
├── 📄 driver.py                (300+ lines)
├── 📄 pages.py                 (450+ lines)
├── 📄 test_cases.py            (500+ lines)
├── 📄 run_tests.py             (350+ lines)
├── 📄 report_generator.py      (450+ lines)
├── 📄 requirements.txt          (3 lines)
├── 📖 README.md                (This file)
└── 📁 reports/                 (Auto-created)

TOTAL: 7 Files + 1 Directory
LOC: ~2,500 lines of code + documentation
```

---

**Ready to test your web application? Run: `python run_tests.py` 🚀**

