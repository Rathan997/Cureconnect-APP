# Selenium Testing Suite - Quick Start Guide

## ⚡ 60-Second Setup

### 1. Install Dependencies
```bash
cd d:\cureconnect-backend\selenium_testing
pip install -r requirements.txt
```

### 2. Update Configuration
- Open `config.py`
- Update `TEST_ACCOUNTS` with your credentials
- Update `BASE_URL` (default: http://localhost:3000)
- Update element locators in `LOCATORS`

### 3. Run Tests
```bash
python run_tests.py
```

### 4. View Report
- Excel report: `reports/Selenium_Test_Report_*.xlsx`
- Screenshots: `reports/screenshots/`
- Logs: `reports/logs/`

---

## 📋 Checklist

- [ ] Python 3.8+ installed
- [ ] Dependencies installed
- [ ] Browser driver downloaded (ChromeDriver for Chrome)
- [ ] Web application running on configured URL
- [ ] config.py updated with credentials
- [ ] Element locators verified with browser Inspect
- [ ] Tests executed successfully
- [ ] Excel report generated

---

## 🔍 Getting Element Locators

### Chrome Browser
1. Right-click element → "Inspect" (or F12)
2. Find the element in DevTools
3. Get the `id`, `class`, or `xpath`
4. Update in config.py LOCATORS

### Example
```python
# In browser: <input id="email" type="email" />
LOCATORS = {
    "email_input": ("id", "email"),  # <- Add this
}
```

---

## 🚀 Common Commands

```bash
# Run all tests
python run_tests.py

# Run specific test class
python -m unittest test_cases.TestAuthentication -v

# Run single test
python -m unittest test_cases.TestAuthentication.test_01_login_with_valid_credentials -v

# Run with Chrome (default)
BROWSER=chrome python run_tests.py

# Run with Firefox
BROWSER=firefox python run_tests.py

# Run in headless mode
HEADLESS=true python run_tests.py
```

---

## 📁 File Structure

```
selenium_testing/
├── config.py              ← Update this with credentials & locators
├── driver.py              ← Selenium WebDriver wrapper
├── pages.py               ← Page Object Models
├── test_cases.py          ← 13 test cases
├── run_tests.py           ← Run this to execute tests
├── report_generator.py    ← Excel report generation
├── requirements.txt       ← Dependencies
├── README.md              ← Full documentation
└── reports/               ← Test results
    ├── *.xlsx             ← Excel report
    ├── screenshots/       ← Failed test evidence
    └── logs/              ← Execution logs
```

---

## 🧪 Test Coverage

- **Authentication**: Login, logout, error handling
- **Navigation**: Dashboard, doctors, medicines, appointments, profile
- **Features**: Search, add, view, manage
- **End-to-End**: Complete user journey

**Total: 13 comprehensive tests**

---

## ⚙️ Configuration Quick Reference

### Update Credentials
```python
# config.py
TEST_ACCOUNTS = {
    "admin": {
        "email": "rathanreddy676@gmail.com",  # Update this
        "password": "9652090259",              # Update this
        "name": "Admin User",
        "role": "admin"
    }
}
```

### Update Application URL
```python
# config.py
BASE_URL = "http://localhost:3000"  # Update this
API_BASE_URL = "http://localhost:8000"
```

### Update Element Locators
```python
# config.py - Use browser Inspect to get actual IDs
LOCATORS = {
    "email_input": ("id", "email"),           # Update this
    "password_input": ("id", "password"),     # Update this
    "login_button": ("id", "login-btn"),      # Update this
    # ... rest of locators
}
```

---

## 🐛 Troubleshooting

### "Element not found" Error
→ Use browser Inspect to get correct locator and update config.py

### "Connection refused"
→ Verify web app is running on BASE_URL (http://localhost:3000)

### "ChromeDriver not found"
→ Download from https://chromedriver.chromium.org/ and add to PATH

### Tests run but report not generated
→ Check reports/ folder permissions and verify openpyxl is installed

---

## 📊 Test Report Contents

### Summary Sheet
- Total tests, passed, failed
- Pass rate percentage
- Quick statistics

### Test Results Sheet
- Each test with status (green = pass, red = fail)
- Test duration
- Timestamp

### Issues Sheet
- Failed tests details
- Error messages
- Screenshot references

### Recommendations Sheet
- Best practices
- Areas for improvement
- Maintenance tips

---

## 🎯 Next Steps

1. **Setup** (5 min)
   - Install dependencies
   - Update config.py

2. **Configure** (5 min)
   - Add credentials
   - Update element locators

3. **Run** (5 min)
   - Execute tests
   - View results

4. **Extend** (ongoing)
   - Add more tests
   - Integrate with CI/CD

---

## 📞 Quick Help

**Full Documentation**: See README.md

**Test Details**: See test_cases.py comments

**Configuration Options**: See config.py

**API Reference**: See driver.py docstrings

---

## ✅ Success Indicators

- ✓ All 13 tests pass (green status)
- ✓ Excel report generated
- ✓ No errors in console
- ✓ Screenshots folder empty (no failures)
- ✓ Logs show INFO level messages

---

## 🚀 Ready to Test?

```bash
cd d:\cureconnect-backend\selenium_testing
python run_tests.py
```

Check results in `reports/Selenium_Test_Report_*.xlsx`

Good luck! 🎉

