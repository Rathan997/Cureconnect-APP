# CureConnect Mobile Appium Automation Suite (Node.js)

This folder contains a complete Appium mobile test automation suite written in JavaScript/Node.js utilizing WebdriverIO.

## Folder Structure

```
appium_node/
├── package.json         # Project metadata and dependencies
├── wdio.conf.js         # WebdriverIO and Appium capability configurations
└── test/
    └── specs/
        └── e2e.test.js  # JavaScript mobile E2E test scenarios
```

## Prerequisites

1. **Node.js** (v16+ recommended) installed.
2. **Appium Server** installed globally:
   ```bash
   npm install -g appium
   ```
3. **Android UIAutomator2 Driver** installed:
   ```bash
   appium driver install uiautomator2
   ```
4. **Android SDK & Emulator** configured on your local machine (with matching Android versions or config edits in `wdio.conf.js`).

## Installation

Run the following command inside this directory to install all dependencies:
```bash
npm install
```

## Run the Mobile Tests

1. Start your Android Emulator or connect a physical developer device.
2. In a separate terminal shell, start the Appium server:
   ```bash
   appium
   ```
3. Execute the tests:
   ```bash
   npm test
   ```

The WebdriverIO runner will automatically start, initialize the session with the `app-release.apk` compiled in `appium_testing/app-release.apk`, boot the application on your target device, bypass the onboarding slides, and walk through authentication, symptoms checking, doctor appointments, medicine tracker, family health manager, and profile logout.
