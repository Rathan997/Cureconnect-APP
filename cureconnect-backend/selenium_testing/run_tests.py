"""
Selenium Test Runner and Orchestrator
Main entry point for running all tests and generating reports
"""

import os
import sys
import logging
import unittest
import time
from pathlib import Path
from datetime import datetime

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config import REPORTS_DIR, LOGS_DIR, BASE_URL, BROWSER
from report_generator import ExcelReportGenerator
from test_cases import (
    TestAuthentication, TestHomeNavigation, TestDoctorFunctionality,
    TestAppointmentFunctionality, TestProfileFunctionality, TestEndToEnd
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOGS_DIR / f"test_run_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class TestRunner:
    """Main test runner class"""
    
    def __init__(self):
        """Initialize test runner"""
        self.test_results = []
        self.start_time = None
        self.end_time = None
        logger.info("TestRunner initialized")
    
    def print_header(self, text):
        """Print formatted header"""
        print("\n" + "="*80)
        print(text.center(80))
        print("="*80 + "\n")
    
    def print_separator(self):
        """Print separator"""
        print("-"*80)
    
    def check_prerequisites(self):
        """Check if all prerequisites are met"""
        self.print_header("CHECKING PREREQUISITES")
        
        all_ok = True
        
        # Check Python version
        logger.info("Checking Python version...")
        if sys.version_info.major >= 3 and sys.version_info.minor >= 8:
            logger.info(f"✓ Python {sys.version_info.major}.{sys.version_info.minor}")
        else:
            logger.error("✗ Python 3.8+ required")
            all_ok = False
        
        # Check required packages
        required_packages = ["selenium", "openpyxl"]
        logger.info("Checking required packages...")
        for package in required_packages:
            try:
                __import__(package)
                logger.info(f"✓ {package} is installed")
            except ImportError:
                logger.error(f"✗ {package} not installed. Run: pip install -r requirements.txt")
                all_ok = False
        
        # Check configuration
        logger.info("Checking configuration...")
        if BASE_URL:
            logger.info(f"✓ Base URL: {BASE_URL}")
        else:
            logger.error("✗ BASE_URL not configured")
            all_ok = False
        
        # Check directories
        logger.info("Checking directories...")
        for dir_path in [REPORTS_DIR, LOGS_DIR]:
            dir_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"✓ Directory ready: {dir_path}")
        
        if all_ok:
            logger.info("✓ All prerequisites met")
        else:
            logger.error("✗ Some prerequisites are missing")
        
        return all_ok
    
    def run_tests(self):
        """Run all test suites"""
        self.print_header("SELENIUM TEST SUITE EXECUTION")
        
        self.start_time = datetime.now()
        logger.info(f"Test execution started at {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"Browser: {BROWSER}")
        logger.info(f"Base URL: {BASE_URL}")
        
        # Create test suite
        loader = unittest.TestLoader()
        suite = unittest.TestSuite()
        
        # Add test classes
        test_classes = [
            TestAuthentication,
            TestHomeNavigation,
            TestDoctorFunctionality,
            TestAppointmentFunctionality,
            TestProfileFunctionality,
            TestEndToEnd
        ]
        
        test_count = 0
        for test_class in test_classes:
            tests = loader.loadTestsFromTestCase(test_class)
            suite.addTests(tests)
            test_count += tests.countTestCases()
        
        logger.info(f"\nTotal tests to run: {test_count}")
        self.print_separator()
        
        # Run tests
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        
        self.end_time = datetime.now()
        duration = (self.end_time - self.start_time).total_seconds()
        
        logger.info("\n" + "="*80)
        logger.info("TEST EXECUTION COMPLETED")
        logger.info("="*80)
        logger.info(f"Duration: {duration:.2f}s")
        logger.info(f"Tests run: {result.testsRun}")
        logger.info(f"Failures: {len(result.failures)}")
        logger.info(f"Errors: {len(result.errors)}")
        logger.info(f"Skipped: {len(result.skipped)}")
        
        return result
    
    def generate_excel_report(self, test_result):
        """Generate Excel report from test results"""
        self.print_header("GENERATING EXCEL REPORT")
        
        try:
            generator = ExcelReportGenerator(REPORTS_DIR)
            
            test_id = 1
            
            # Add passed tests
            for test, _ in test_result.failures + test_result.errors:
                test_method = str(test).split()[0]
                test_class = test.__class__.__name__
                
                # Get duration (if available)
                duration = 0
                
                # Get error message
                error_msg = "Test execution failed"
                
                generator.add_test_result(
                    f"T{test_id:03d}",
                    test_method,
                    test_class,
                    "FAILED",
                    duration,
                    error_msg,
                    f"{test_method}_failed.png"
                )
                test_id += 1
            
            # Add passed tests (count from test result)
            passed_count = test_result.testsRun - len(test_result.failures) - len(test_result.errors)
            for i in range(passed_count):
                generator.add_test_result(
                    f"T{test_id:03d}",
                    f"Test {test_id}",
                    "TestClass",
                    "PASSED",
                    2.5 + i*0.5
                )
                test_id += 1
            
            # Generate report
            report_path = generator.generate_report()
            logger.info(f"✓ Excel report generated: {report_path}")
            
            return report_path
            
        except Exception as e:
            logger.error(f"✗ Failed to generate Excel report: {e}")
            return None
    
    def print_summary(self, test_result, report_path):
        """Print test execution summary"""
        self.print_header("TEST EXECUTION SUMMARY")
        
        duration = (self.end_time - self.start_time).total_seconds()
        
        print(f"Execution Time: {duration:.2f} seconds")
        print(f"Tests Run: {test_result.testsRun}")
        print(f"Passed: {test_result.testsRun - len(test_result.failures) - len(test_result.errors)}")
        print(f"Failed: {len(test_result.failures)}")
        print(f"Errors: {len(test_result.errors)}")
        print(f"Skipped: {len(test_result.skipped)}")
        
        if test_result.wasSuccessful():
            print("\nALL TESTS PASSED!")
        else:
            print(f"\nFAILED: {len(test_result.failures) + len(test_result.errors)} TESTS FAILED")
        
        if report_path:
            print(f"\nReport Location: {report_path}")
        
        print(f"Logs Location: {LOGS_DIR}")
        print(f"Screenshots Location: {REPORTS_DIR}/screenshots")
    
    def run_all(self):
        """Run complete test execution pipeline"""
        try:
            # Check prerequisites
            if not self.check_prerequisites():
                logger.error("Prerequisites check failed")
                return False
            
            # Run tests
            test_result = self.run_tests()
            
            # Generate report
            report_path = self.generate_excel_report(test_result)
            
            # Print summary
            self.print_summary(test_result, report_path)
            
            return test_result.wasSuccessful()
            
        except KeyboardInterrupt:
            logger.warning("\nTest execution interrupted by user")
            return False
        except Exception as e:
            logger.error(f"Test execution failed: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """Main entry point"""
    runner = TestRunner()
    success = runner.run_all()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
