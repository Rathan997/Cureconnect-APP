# 🤖 CureConnect — Appium Android E2E Testing

Comprehensive end-to-end test suite for the **CureConnect / MediCheck** React Native Android app using **Appium 2** + **UiAutomator2**.

---

## 📁 Folder Structure

```
appium_testing/
├── config.py              # Capabilities, locators, test data
├── driver.py              # AppiumDriver wrapper (find, tap, scroll, screenshot)
├── pages.py               # Page Object Models — one class per screen
├── test_cases.py          # 41 E2E test cases across 11 suites
├── run_tests.py           # CLI runner + Excel report generator
├── report_generator.py    # Excel report builder (7 sheets)
├── requirements.txt       # Python dependencies
└── reports/               # Auto-created
    ├── screenshots/        # Failure screenshots (PNG)
    └── logs/               # Run logs (TXT)
```

---

## ✅ Test Coverage (41 Tests)

| Suite | Tests | Feature Area |
|-------|-------|-------------|
| Test01_Authentication | 5 | Login, logout, empty/invalid creds |
| Test02_Navigation | 10 | All tabs + quick-action buttons |
| Test03_Doctors | 4 | Search, filter, detail view |
| Test04_Appointments | 5 | List, tab filters |
| Test05_SymptomChecker | 3 | Symptom selection & scroll |
| Test06_Medicine | 3 | Add medicine form, list |
| Test07_Family | 3 | Family member list & scroll |
| Test08_Dashboard | 3 | Score ring, refresh |
| Test09_EmergencyAndChat | 2 | Emergency contacts, AI chat |
| Test10_ProfileAndLogout | 2 | Profile info, full logout |
| Test11_EndToEnd | 1 | **Full user journey** |

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Install Appium 2
```bash
npm install -g appium@next
appium driver install uiautomator2
```

### 3. Build & install the APK
```bash
# Option A: EAS build
eas build -p android --profile preview

# Option B: Expo Dev Build
npx expo run:android
```

### 4. Connect your Android device
```bash
adb devices   # your device must show as 'device' (not 'offline')
```

### 5. Start the Appium server
```bash
appium --port 4723
```

### 6. Run the tests
```bash
# All 41 tests
python run_tests.py

# Only Authentication suite
python run_tests.py --class Auth

# Only Doctors + Appointments
python run_tests.py --class Doctor
python run_tests.py --class Appoint

# Dry-run (prerequisite check only)
python run_tests.py --dry-run

# Skip Excel report
python run_tests.py --no-report
```

---

## 📊 Excel Report

After every run, a timestamped workbook is saved to `reports/`:

```
Appium_Test_Report_20260610_212345.xlsx
```

**7 sheets:**
| Sheet | Contents |
|-------|---------|
| 📊 Summary | KPI cards + full results table |
| ✅ Test Results | Per-test rows with colour-coded status |
| ❌ Failures | Error messages + screenshot paths |
| 🗺 Coverage | Feature matrix + app checklist |
| 📈 Statistics | Pass/fail rates + bar chart |
| 💡 Recommendations | Prioritised QA action items |
| 🚀 Setup Guide | Step-by-step run instructions |

---

## ⚙️ Environment Variables

Override any config without editing `config.py`:

| Variable | Default | Description |
|----------|---------|-------------|
| `APPIUM_HOST` | `127.0.0.1` | Appium server host |
| `APPIUM_PORT` | `4723` | Appium server port |
| `DEVICE_NAME` | `Android Device` | ADB device name |
| `DEVICE_SERIAL` | *(auto)* | ADB device serial (`adb devices`) |
| `PLATFORM_VERSION` | *(auto)* | Android version e.g. `14.0` |
| `APK_PATH` | `./app-release.apk` | Absolute path to APK |
| `LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARNING` |

```bash
# Example — real device with serial
set DEVICE_SERIAL=R58MC3HBXXX
set PLATFORM_VERSION=14.0
python run_tests.py
```

---

## 🔑 Test Credentials

Edit `config.py → TEST_ACCOUNTS`:
```python
TEST_ACCOUNTS = {
    "valid":   {"email": "your@email.com", "password": "yourpassword"},
    "invalid": {"email": "wrong@test.com", "password": "wrongpassword"},
}
```

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot reach Appium server` | Run `appium --port 4723` in a separate terminal |
| `No ADB device found` | Run `adb devices`, enable USB debugging on the device |
| `Element not found` (timeout) | Ensure the app has the correct `testID` props set |
| `App not installed` | Build APK and install, or set `APK_PATH` env var |
| `UiAutomator2 not installed` | Run `appium driver install uiautomator2` |
| Screenshot empty | Grant screen-capture permission on device |
