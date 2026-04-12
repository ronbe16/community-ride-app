#!/bin/bash
# Community Ride Patch 1.0.1 Regression Test Runner
# Runs the 9 regression test cases and outputs a results table

echo "========================================"
echo "Community Ride Patch 1.0.1 Regression"
echo "========================================"
echo ""

# Run the regression tests
echo "Running regression tests..."
npx playwright test tests/regression-patch-1.0.1.spec.ts --workers=1

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests completed!"
else
    echo ""
    echo "⚠️ Some tests failed. Check results above."
fi

echo ""
echo "========================================"
echo "Screenshots saved in: screenshots/"
echo "Full report: npx playwright show-report"
echo "========================================"
