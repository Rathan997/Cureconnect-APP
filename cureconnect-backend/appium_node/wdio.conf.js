const path = require('path');

exports.config = {
    // ====================
    // Runner Configuration
    // ====================
    runner: 'local',
    port: 4723,
    path: '/',

    // ==================
    // Specify Test Files
    // ==================
    specs: [
        './test/specs/**/*.js'
    ],
    exclude: [],

    // ============
    // Capabilities
    // ============
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Android Emulator',
        'appium:platformVersion': '11.0', // change to match target version
        'appium:automationName': 'UiAutomator2',
        'appium:app': path.join(__dirname, '../appium_testing/app-release.apk'),
        'appium:appPackage': 'com.rathan997.Cureconnect',
        'appium:appActivity': 'com.rathan997.Cureconnect.MainActivity',
        'appium:newCommandTimeout': 240,
        'appium:noReset': false,
        'appium:fullReset': false,
        'appium:autoGrantPermissions': true
    }],

    // ===================
    // Test Configurations
    // ===================
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 15000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 600000 // 10 minutes
    },

    // =====
    // Hooks
    // =====
    before: function (capabilities, specs) {
        // Custom setup if needed
    }
};
