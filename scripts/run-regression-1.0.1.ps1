# Community Ride Patch 1.0.1 Regression Test Runner
# Runs the 9 regression test cases and outputs a results table

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Community Ride Patch 1.0.1 Regression" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Run the regression tests
Write-Host "Running regression tests..." -ForegroundColor Yellow
npx playwright test tests/regression-patch-1.0.1.spec.ts --workers=1

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All tests completed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ Some tests failed. Check results above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Screenshots saved in: screenshots/" -ForegroundColor Cyan
Write-Host "Full report: npx playwright show-report" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
