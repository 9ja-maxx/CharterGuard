#!/bin/bash
set -e

echo "=== 1. Running GenVM Linter ==="
python3 -X utf8 -m genvm_linter.cli contracts/charter_guard.py

echo "=== 2. Running Contract Unit Tests ==="
python3 -m pytest tests -q

echo "=== 3. Running Frontend Tests ==="
cd frontend
npm test

echo "=== 4. Verifying Production Frontend Build ==="
npm run build

echo ""
echo "🛡️ All CharterGuard verification checks PASSED!"
