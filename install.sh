#!/usr/bin/env bash
# EmployeeLock one-click install. Counted download via this project's Worker.
# Usage: curl -fsSL https://employeelock-download-tracker.vibelock.workers.dev/install.sh | bash
set -euo pipefail

HOST="${EMPLOYEELOCK_HOST:-https://employeelock-download-tracker.vibelock.workers.dev}"
ASSET="${EMPLOYEELOCK_ASSET:-employeelock-0.1.0.tar.gz}"
WORKDIR="${EMPLOYEELOCK_HOME:-$HOME/employeelock}"

mkdir -p "$WORKDIR"
cd "$WORKDIR"

echo "Downloading counted tarball from ${HOST}/download (User-Agent Mozilla/5.0)…"
curl -fsSL -A 'Mozilla/5.0' "${HOST}/download?asset=${ASSET}" -o "${ASSET}"

tar -xzf "${ASSET}"
DIR="$(find . -maxdepth 1 -type d -name 'employeelock-*' | head -n 1)"
if [ -n "${DIR}" ]; then
  cd "${DIR}"
fi

python3 -m venv .venv
# shellcheck disable=SC1091
. .venv/bin/activate
python -m pip install -U pip
python -m pip install -e .

echo
echo "Installed EmployeeLock."
echo "Run:  employeelock ui"
echo "Then open http://127.0.0.1:8871  (loopback only)"
echo "Not a court. Not UL. Not a truth score. Author: Aziel Eliab."
