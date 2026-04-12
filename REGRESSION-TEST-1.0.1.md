# Community Ride Patch 1.0.1 Regression Test Suite

Automated E2E regression tests for Community Ride Patch 1.0.1.

## Test Coverage

This suite includes 9 test cases plus a setup phase:

### SETUP
- Create trip as User D
- Have User E join the trip
- Store trip ID for subsequent tests

### Test Cases

| TC ID | Description | Type |
|-------|-------------|------|
| TC-11.2 | Cannot update own tripCount directly | Security |
| TC-6.1 | Post valid trip (regression) | PostTrip.tsx |
| TC-6.2 | Trip has deleteAt in Firestore 🔥 | Manual Check |
| TC-6.3 | Missing destination rejected | Validation |
| TC-6.4 | Missing departure time rejected | Validation |
| TC-6.5 | Missing pickup point rejected | Validation |
| TC-13.2 | Complete trip increments tripCount | Trip Lifecycle |
| TC-10.7 | Trip count shows correctly on profile | Profile Display |
| TC-13.7 | tripCount does NOT increment on cancel | Trip Lifecycle |
| TC-10.1 | Profile page loads cleanly | Profile.tsx Regression |
| TC-10.4 | Edit full name still works | Profile Edit |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| User D | testlifecycle@communityride.test | Test123! |
| User E | testlifecyclepass@communityride.test | Test123! |

## Prerequisites

1. **Test accounts must exist** in Firebase Auth with the credentials above
2. **App must be deployed** to the Lovable URL specified in `playwright.config.ts`
3. **Node.js and npm** installed
4. **Playwright** installed (`npm install`)

## Running the Tests

### Option 1: Using the helper script (Recommended)

**Windows (PowerShell):**
```powershell
.\scripts\run-regression-1.0.1.ps1
```

**macOS/Linux:**
```bash
chmod +x scripts/run-regression-1.0.1.sh
./scripts/run-regression-1.0.1.sh
```

### Option 2: Direct Playwright command

```bash
npx playwright test tests/regression-patch-1.0.1.spec.ts --workers=1
```

### Option 3: Run with UI mode (for debugging)

```bash
npx playwright test tests/regression-patch-1.0.1.spec.ts --ui
```

## Configuration

- **Workers:** 1 (sequential execution)
- **Delay between tests:** 500ms (configured in beforeEach)
- **Timeout:** 60 seconds per test
- **Headless:** true (can be changed in playwright.config.ts)

## Output

### Screenshots
All test cases capture screenshots in the `screenshots/` directory:
- `SETUP-trip-created.png`
- `SETUP-user-e-joined.png`
- `TC-11.2-tripcount-update-blocked.png`
- `TC-6.1-trip-posted.png`
- `TC-6.3-missing-destination.png`
- `TC-6.4-missing-departure-time.png`
- `TC-6.5-missing-pickup.png`
- `TC-13.2-trip-started.png`
- `TC-13.2-trip-completed.png`
- `TC-13.2-profile-trip-count.png`
- `TC-10.7-trip-count-display.png`
- `TC-13.7-cancel-no-increment.png`
- `TC-10.1-profile-loads-cleanly.png`
- `TC-10.4-edit-name.png`

### HTML Report
View the detailed Playwright HTML report:
```bash
npx playwright show-report
```

### Console Output
The tests output detailed logging for each step, including:
- ✅ PASS indicators
- ❌ FAIL indicators
- ⚠️ INFO messages for blocked or skipped tests
- 📋 Manual check reminders for Firestore validation

## Manual Verification Steps

### TC-6.2 — deleteAt Field Check
1. Open Firebase Console → Firestore Database
2. Navigate to `trips` collection → locate the trip ID from SETUP
3. Verify `deleteAt` field exists
4. Confirm it's set to approximately 90 days from the trip creation date

### TC-13.2 — tripCount in Firestore
1. Open Firebase Console → Firestore Database
2. Navigate to `users` collection → find User D's document
3. Verify `tripCount` field = 1 after completing the trip

### TC-11.2 — Additional Validation
If the browser console test doesn't work, verify Firestore security rules:
```javascript
// In firestore.rules, users collection should NOT allow arbitrary field updates
match /users/{userId} {
  allow update: if isOwner(userId);
  // This rule should be enhanced to prevent tripCount direct updates
}
```

## Expected Results Table

| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| SETUP | Trip created, User E joined | ✅ Auto |
| TC-11.2 | Permission denied error | 🔍 Auto/Manual |
| TC-6.1 | Trip posted successfully | ✅ Auto |
| TC-6.2 | deleteAt field exists in Firestore | 🔥 Manual |
| TC-6.3 | Form validation error, stays on /post-trip | ✅ Auto |
| TC-6.4 | Form validation error, stays on /post-trip | ✅ Auto |
| TC-6.5 | Form validation error, stays on /post-trip | ✅ Auto |
| TC-13.2 | "1 trip completed" visible, tripCount=1 in 🔥 | ✅ Auto + 🔥 |
| TC-10.7 | "1 trip completed" NOT "New member" | ✅ Auto |
| TC-13.7 | Trip count stays at 1 after cancel | ✅ Auto |
| TC-10.1 | Profile loads, version 1.0.1 visible | ✅ Auto |
| TC-10.4 | Name saved successfully | ✅ Auto |

**Legend:**
- ✅ Auto = Fully automated verification
- 🔥 Manual = Requires Firebase Console check
- 🔍 Auto/Manual = Automated attempt, manual fallback

## Troubleshooting

### Test accounts don't exist
Create them manually in Firebase Console:
1. Go to Authentication
2. Add user with email/password
3. Use the exact credentials from the table above

### Vehicle info not set
The test will automatically fill vehicle info for User D if missing.

### Trip ID not captured
Check that the trip was successfully posted in the SETUP phase. Verify the URL redirection works correctly.

### Firestore console commands fail
TC-11.2 attempts to run Firestore commands from the browser console. If this fails due to CSP or module loading issues, verify the rules manually in `firestore.rules`.

## Notes

- Tests run **sequentially** (workers=1) to avoid race conditions
- 500ms delay between tests protects Firebase free-tier quota
- The SETUP phase must succeed for dependent tests to work
- Some tests (TC-6.2, TC-13.2 Firestore check) require manual Firebase Console verification
- Screenshots are captured for all tests to provide visual verification

## Clean Up

After running the tests:
1. Delete the test trip from Firestore (optional)
2. Reset User D's tripCount to 0 if needed (optional)
3. Clear test data from Firebase if running multiple times

## Integration with CI/CD

To integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Regression Tests
  run: npx playwright test tests/regression-patch-1.0.1.spec.ts --workers=1
  
- name: Upload Screenshots
  uses: actions/upload-artifact@v3
  with:
    name: regression-screenshots
    path: screenshots/
```

## Version History

- **v1.0** - Initial regression test suite for Patch 1.0.1
  - Covers PostTrip.tsx modifications
  - Covers Profile.tsx modifications
  - Covers Firestore rules validation
  - Covers trip lifecycle and tripCount logic
