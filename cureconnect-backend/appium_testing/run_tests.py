"""
run_tests.py — CureConnect Appium Android Test Runner
======================================================
Usage:
    python run_tests.py                   # run all suites
    python run_tests.py --class Auth      # run only matching suite(s)
    python run_tests.py --dry-run         # check prerequisites only
    python run_tests.py --no-report       # skip Excel report generation

Generates a timestamped Excel report in appium_testing/reports/
"""

import argparse
import logging
import sys
import time
import unittest
from datetime import datetime
from pathlib import Path

# ── make sure this folder is on sys.path ──────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent))

import config
from driver import check_appium_server, check_adb_device
from report_generator import AppiumExcelReportGenerator
from test_cases import (
    Test01_Authentication,
    Test02_Navigation,
    Test03_Doctors,
    Test04_Appointments,
    Test05_SymptomChecker,
    Test06_Medicine,
    Test07_Family,
    Test08_Dashboard,
    Test09_EmergencyAndChat,
    Test10_ProfileAndLogout,
    Test11_EndToEnd,
)

ALL_SUITES = [
    Test01_Authentication,
    Test02_Navigation,
    Test03_Doctors,
    Test04_Appointments,
    Test05_SymptomChecker,
    Test06_Medicine,
    Test07_Family,
    Test08_Dashboard,
    Test09_EmergencyAndChat,
    Test10_ProfileAndLogout,
    Test11_EndToEnd,
]

# Feature labels for the Excel coverage sheet
SUITE_FEATURES = {
    "Test01_Authentication":   "Authentication",
    "Test02_Navigation":       "Navigation",
    "Test03_Doctors":          "Doctors",
    "Test04_Appointments":     "Appointments",
    "Test05_SymptomChecker":   "Symptom Checker",
    "Test06_Medicine":         "Medicine Scanner",
    "Test07_Family":           "Family Management",
    "Test08_Dashboard":        "Health Dashboard",
    "Test09_EmergencyAndChat": "Emergency & AI Chat",
    "Test10_ProfileAndLogout": "Profile & Logout",
    "Test11_EndToEnd":         "End-to-End Journey",
}


# =============================================================================
# Logging
# =============================================================================

def setup_logging():
    config.LOGS_DIR.mkdir(parents=True, exist_ok=True)
    ts  = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = config.LOGS_DIR / f"appium_run_{ts}.log"

    level = getattr(logging, config.LOG_LEVEL.upper(), logging.INFO)
    fmt   = config.LOG_FORMAT

    logging.basicConfig(
        level=level,
        format=fmt,
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )
    logger = logging.getLogger("runner")
    logger.info("Log file: %s", log_file)
    return logger


# =============================================================================
# Prerequisite checks
# =============================================================================

def check_prerequisites(logger):
    logger.info("=" * 70)
    logger.info("CHECKING PREREQUISITES")
    logger.info("=" * 70)

    ok = True

    if not check_appium_server():
        logger.error("[FAIL] Appium server not running.")
        logger.error("    Start it:  appium --port %d", config.APPIUM_PORT)
        ok = False
    else:
        logger.info("[ OK ] Appium server is running at %s", config.APPIUM_URL)

    if not check_adb_device():
        logger.error("[FAIL] No Android device / emulator connected via ADB.")
        logger.error("    Run `adb devices` to verify.")
        ok = False
    else:
        logger.info("[ OK ] ADB device detected.")

    apk = Path(config.APK_PATH)
    if apk.exists():
        logger.info("[ OK ] APK found: %s", apk)
    else:
        logger.warning("[WARN] APK not found at %s — using installed app.", apk)

    return ok


# =============================================================================
# Result collector
# =============================================================================

def _flatten(suite):
    """Recursively yield all TestCase instances from a TestSuite."""
    for item in suite:
        if isinstance(item, unittest.TestSuite):
            yield from _flatten(item)
        else:
            yield item


def collect_results(suite, result, report: AppiumExcelReportGenerator,
                    durations: dict):
    """Map unittest result → Excel report rows."""
    failed_ids  = {t.id(): err for t, err in result.failures}
    error_ids   = {t.id(): err for t, err in result.errors}
    skipped_ids = {t.id(): r   for t, r   in getattr(result, "skipped", [])}

    for idx, test in enumerate(_flatten(suite), 1):
        if test is None:
            continue
        tid      = test.id()
        cls_name = test.__class__.__name__
        method   = test._testMethodName
        feature  = SUITE_FEATURES.get(cls_name, cls_name)
        dur      = durations.get(tid, 0.0)

        if tid in failed_ids:
            status = "FAILED"
            err    = failed_ids[tid]
        elif tid in error_ids:
            status = "FAILED"
            err    = error_ids[tid]
        elif tid in skipped_ids:
            status = "SKIPPED"
            err    = skipped_ids[tid]
        else:
            status = "PASSED"
            err    = None

        # screenshot path if it exists
        shot_pattern = config.SCREENSHOTS_DIR / f"FAIL_{method}_*.png"
        import glob
        shots = glob.glob(str(shot_pattern))
        shot  = shots[-1] if shots else None

        report.add_result(
            test_id       = f"APP_T{idx:03d}",
            test_name     = method,
            test_class    = cls_name,
            feature       = feature,
            status        = status,
            duration      = dur,
            error_message = str(err)[:500] if err else None,
            screenshot    = shot,
        )


# =============================================================================
# Timing result wrapper
# =============================================================================

class TimedTextTestResult(unittest.TextTestResult):
    """Extends TextTestResult to record per-test wall-clock durations."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.durations = {}
        self._t0 = None
        self._cur = None

    def startTest(self, test):
        super().startTest(test)
        self._cur = test.id()
        self._t0  = time.perf_counter()

    def stopTest(self, test):
        super().stopTest(test)
        if self._t0 and self._cur:
            self.durations[self._cur] = round(time.perf_counter() - self._t0, 2)
            self._cur = None
            self._t0  = None


class TimedTestRunner(unittest.TextTestRunner):
    def _makeResult(self):
        return TimedTextTestResult(self.stream, self.descriptions, self.verbosity)


# =============================================================================
# Main runner
# =============================================================================

class AppiumTestRunner:

    def __init__(self, suites=None, generate_report=True):
        self.logger          = setup_logging()
        self.suites          = suites or ALL_SUITES
        self.generate_report = generate_report
        self.report          = AppiumExcelReportGenerator(config.REPORTS_DIR)

    def _build_suite(self):
        loader = unittest.TestLoader()
        master = unittest.TestSuite()
        for cls in self.suites:
            master.addTests(loader.loadTestsFromTestCase(cls))
        return master

    def run(self):
        if not check_prerequisites(self.logger):
            self.logger.error("Prerequisites not met. Aborting.")
            sys.exit(1)

        suite = self._build_suite()
        total = suite.countTestCases()

        self.logger.info("=" * 70)
        self.logger.info("APPIUM E2E TEST SUITE — CureConnect Android")
        self.logger.info("%-20s %s", "Suites:", len(self.suites))
        self.logger.info("%-20s %s", "Total tests:", total)
        self.logger.info("%-20s %s", "Device:", config.DEVICE_NAME)
        self.logger.info("%-20s %s", "App package:", config.APP_PACKAGE)
        self.logger.info("=" * 70)

        runner = TimedTestRunner(verbosity=2)
        t_start = datetime.now()
        result  = runner.run(suite)
        t_end   = datetime.now()
        duration = (t_end - t_start).total_seconds()

        # ── collect results ──
        collect_results(suite, result, self.report, runner._makeResult().durations)

        # ── print summary ──
        passed  = result.testsRun - len(result.failures) - len(result.errors)
        failed  = len(result.failures) + len(result.errors)
        skipped = len(getattr(result, "skipped", []))

        self.logger.info("")
        self.logger.info("=" * 70)
        self.logger.info("RESULTS")
        self.logger.info("%-20s %d", "Tests run:",  result.testsRun)
        self.logger.info("%-20s %d [PASSED]", "Passed:",   passed)
        self.logger.info("%-20s %d [FAILED]", "Failed:",   failed)
        self.logger.info("%-20s %d [SKIPPED]", "Skipped:",  skipped)
        self.logger.info("%-20s %.1f%%", "Pass rate:",
                         passed / max(result.testsRun, 1) * 100)
        self.logger.info("%-20s %.2f s", "Duration:", duration)
        self.logger.info("=" * 70)

        # ── Excel report ──
        if self.generate_report:
            try:
                path = self.report.generate()
                self.logger.info("Excel report generated -> %s", path)
            except Exception as e:
                self.logger.error("Report generation failed: %s", e)

        sys.exit(0 if result.wasSuccessful() else 1)


# =============================================================================
# CLI entry point
# =============================================================================

def parse_args():
    p = argparse.ArgumentParser(description="CureConnect Appium Test Runner")
    p.add_argument("--class", dest="filter_class", default=None,
                   help="Run only suites whose name contains this string (e.g. Auth)")
    p.add_argument("--dry-run", action="store_true",
                   help="Check prerequisites only, do not run tests")
    p.add_argument("--no-report", action="store_true",
                   help="Skip generating the Excel report")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()

    logger = setup_logging()

    if args.dry_run:
        ok = check_prerequisites(logger)
        sys.exit(0 if ok else 1)

    # Filter suites if --class supplied
    selected = ALL_SUITES
    if args.filter_class:
        selected = [s for s in ALL_SUITES if args.filter_class.lower() in s.__name__.lower()]
        if not selected:
            logger.error("No suite matched '--class %s'.", args.filter_class)
            logger.error("Available: %s", [s.__name__ for s in ALL_SUITES])
            sys.exit(1)
        logger.info("Running %d matching suite(s): %s",
                    len(selected), [s.__name__ for s in selected])

    AppiumTestRunner(
        suites          = selected,
        generate_report = not args.no_report,
    ).run()
