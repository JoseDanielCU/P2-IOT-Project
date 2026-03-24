#!/usr/bin/env python3
"""
Test runner for HU (Human Use) tests.
Executes only tests in the tests_hu folder.
"""

import sys
import subprocess
import argparse
from pathlib import Path
from datetime import datetime


# ================= COLORS =================

class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'


def c(text, color):
    return f"{color}{text}{Colors.END}"


# ================= PRINT HELPERS =================

def header(text):
    print(c("\n" + "=" * 70, Colors.HEADER))
    print(c(text.center(70), Colors.HEADER + Colors.BOLD))
    print(c("=" * 70, Colors.HEADER))


def section(text):
    print(c(f"\n>> {text}", Colors.BLUE + Colors.BOLD))


def ok(text):
    print(c(f"✓ {text}", Colors.GREEN))


def fail(text):
    print(c(f"✗ {text}", Colors.RED))


def warn(text):
    print(c(f"⚠ {text}", Colors.YELLOW))


def info(text):
    print(c(f"ℹ {text}", Colors.CYAN))


# ================= PATH =================

def find_root():
    current = Path(__file__).resolve().parent

    while current != current.parent:
        if (current / "backend" / "app" / "main.py").exists():
            return current
        current = current.parent

    return Path(__file__).resolve().parent


# ================= DEPENDENCIES =================

def check_dependencies():

    section("Checking dependencies")

    packages = {
        "pytest": "pytest",
        "fastapi": "fastapi",
        "sqlalchemy": "sqlalchemy",
    }

    missing = []

    for name, module in packages.items():

        try:
            __import__(module)
            ok(f"{name}")

        except ImportError:
            fail(f"{name}")
            missing.append(name)

    if missing:
        fail(f"Missing packages: {', '.join(missing)}")
        return False

    return True


# ================= TEST EXECUTION =================

def run_hu_tests(root, quiet=False, coverage=False):

    backend = root / "backend"
    tests_hu = backend / "tests_hu"

    if not tests_hu.exists():
        fail(f"tests_hu directory not found: {tests_hu}")
        return False

    # Count test files
    test_files = list(tests_hu.glob("test_*.py"))
    info(f"Found {len(test_files)} test files in tests_hu")

    cmd = [
        sys.executable,
        "-m",
        "pytest",
        str(tests_hu),
    ]

    if quiet:
        cmd += ["-q"]
    else:
        cmd += ["-v", "--tb=short"]

    if coverage:
        cmd += [
            "--cov=app",
            "--cov-report=term-missing",
        ]

    info("Command:")
    print(" ".join(cmd))
    print()

    result = subprocess.run(cmd, cwd=backend)

    return result.returncode == 0


# ================= MAIN =================

def main():

    parser = argparse.ArgumentParser()

    parser.add_argument("--quiet", action="store_true")
    parser.add_argument("--coverage", action="store_true")

    args = parser.parse_args()

    root = find_root()

    header("HU Tests Runner")

    info(f"Root: {root}")
    info(f"Time: {datetime.now()}")

    if not check_dependencies():
        fail("Install dependencies first")
        sys.exit(1)

    success = run_hu_tests(
        root,
        quiet=args.quiet,
        coverage=args.coverage,
    )

    section("Summary")

    if success:
        ok("ALL HU TESTS PASSED")
        sys.exit(0)

    else:
        fail("HU TESTS FAILED")
        sys.exit(1)


if __name__ == "__main__":
    main()