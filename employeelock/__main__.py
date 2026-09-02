"""Allow ``python -m employeelock`` and ``python3 employeelock.py``."""

from employeelock.cli import main

if __name__ == "__main__":
    raise SystemExit(main())
