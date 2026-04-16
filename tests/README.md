# Community Ride — Alpha Testing Suite

Automated and manual testing suite for the Community Ride application.

## Overview

This test suite covers 103 test cases across 12 functional groups:
- **Automated (Playwright 🤖):** Groups 1, 2, 4, 5, 6, 7, 8, 9, 10, 11 (~80 tests)
- **Manual (👤):** Group 3 (6 tests - Google SSO)
- **Firebase Console (🔥):** Group 12 (7 tests - Data Integrity) + verification steps for automated tests

## Prerequisites

1. **Node.js** and npm installed
2. **Playwright** installed (already in package.json)
3. **App URL configured:** https://community-ride.lovable.app
4. **Firebase Console access** for verification steps
5. **Real Google account** for Group 3 tests

## Setup

The tests are already configured. To verify Playwright is installed:

```bash
npm install
npx playwright install chromium
```

## Running Tests

### Run All Automated Tests

```bash
npx playwright test
```

### Run Specific Test Group

```bash
# Group 1 - Signup
npx playwright test tests/01-auth-signup.spec.ts

# Group 2 - Login/Logout
npx playwright test tests/02-auth-login.spec.ts

# Group 4 - Forgot Password
npx playwright test tests/04-forgot-password.spec.ts

# Group 5 - Dashboard
npx playwright test tests/05-dashboard.spec.ts

# Group 6 - Post Trip
npx playwright test tests/06-post-trip.spec.ts

# Group 7 - Trip Detail & Join
npx playwright test tests/07-trip-detail-join.spec.ts

# Group 8 - Safety Card
npx playwright test tests/08-safety-card.spec.ts

# Group 9 - Manifest
npx playwright test tests/09-manifest.spec.ts

# Group 10 - Profile
npx playwright test tests/10-profile.spec.ts

# Group 11 - Firestore Rules
npx playwright test tests/11-firestore-rules.spec.ts
```

### Run in UI Mode (Recommended for Debugging)

```bash
npx playwright test --ui
```

### Run with Visible Browser

```bash
npx playwright test --headed
```

## Test Results

Results are stored in:
- `test-results/` - JSON results and artifacts
- `playwright-report/` - HTML report
- `screenshots/` - Screenshots for specific test cases

### View HTML Report

```bash
npx playwright show-report
```

## Test Accounts

These accounts are created during the first test run (Group 1):

| Label | Email | Password | Role |
|---|---|---|---|
| User A | testdriver@communityride.test | Test123! | Driver (posts trips) |
| User B | testpassenger@communityride.test | Test123! | Passenger (joins trips) |
| User C | testthird@communityride.test | Test123! | Additional user (conflict tests) |

**Note:** If tests fail due to "user already exists," these accounts were created in a previous run and tests should proceed normally.

## Manual Testing

### Group 3 — Google SSO
See `MANUAL-TESTS-CHECKLIST.md` for step-by-step instructions. These require:
- Real Google account
- Manual OAuth flow interaction
- Cannot be automated without mocking

### Group 12 — Data Integrity
Firebase Console verification steps are listed in `MANUAL-TESTS-CHECKLIST.md`.

## Test Execution Order

**IMPORTANT:** Tests must run sequentially (not in parallel) because:
- Group 1 creates test accounts used by all other groups
- Some tests depend on data created by previous tests
- The configuration enforces `workers: 1` to ensure sequential execution

## CI/CD Integration

To run in CI:

```bash
npx playwright test --reporter=json
```

## Troubleshooting

### Tests Fail with "Cannot find element"
- The app UI may have changed selector names
- Check `tests/helpers/auth.ts` for selector updates
- Run with `--headed` to see what's happening

### Authentication Fails
- Ensure test accounts exist (run Group 1 tests first)
- Check Firebase Auth is enabled for Email/Password
- Verify app URL is correct in `playwright.config.ts`

### Firestore Permission Errors
- Verify Firestore rules are published (not in test mode)
- Check Firebase Console → Firestore → Rules

### Screenshots Not Generated
- Screenshots are only taken for specific tests marked with 📸
- Check `screenshots/` folder after test run

## File Structure

```
tests/
├── helpers/
│   └── auth.ts                    # Reusable auth functions
├── 01-auth-signup.spec.ts         # Group 1 tests
├── 02-auth-login.spec.ts          # Group 2 tests
├── 04-forgot-password.spec.ts     # Group 4 tests
├── 05-dashboard.spec.ts           # Group 5 tests
├── 06-post-trip.spec.ts           # Group 6 tests
├── 07-trip-detail-join.spec.ts    # Group 7 tests
├── 08-safety-card.spec.ts         # Group 8 tests
├── 09-manifest.spec.ts            # Group 9 tests
├── 10-profile.spec.ts             # Group 10 tests
├── 11-firestore-rules.spec.ts     # Group 11 tests
├── MANUAL-TESTS-CHECKLIST.md      # Groups 3 & 12
└── README.md                      # This file
```

## Notes

- Test execution time: ~10-15 minutes for all automated tests
- Manual tests (Group 3): ~5 minutes
- Firebase Console verification: ~10 minutes
- **Total coverage: 103 test cases**
