# Quick Start: Patch 1.0.1 Regression Tests

## 🚀 Run Tests in 3 Steps

### 1. Install Dependencies (if not done)
```bash
npm install
```

### 2. Run the Tests
```bash
npm run test:regression:1.0.1
```

### 3. View Results
```bash
npx playwright show-report
```

---

## ⚡ Alternative Commands

**Run with UI (interactive mode):**
```bash
npm run test:regression:1.0.1:ui
```

**Direct Playwright command:**
```bash
npx playwright test tests/regression-patch-1.0.1.spec.ts --workers=1
```

**Debug mode:**
```bash
npx playwright test tests/regression-patch-1.0.1.spec.ts --debug
```

---

## 📋 What Gets Tested

✅ **SETUP** - Creates test trip and joins it  
✅ **TC-11.2** - Security: tripCount update blocked  
✅ **TC-6.1** - Post trip regression check  
📝 **TC-6.2** - Firestore deleteAt field *(manual check)*  
✅ **TC-6.3** - Missing destination validation  
✅ **TC-6.4** - Missing departure time validation  
✅ **TC-6.5** - Missing pickup point validation  
✅ **TC-13.2** - Complete trip increments tripCount  
✅ **TC-10.7** - Trip count displays correctly  
✅ **TC-13.7** - Cancel doesn't increment tripCount  
✅ **TC-10.1** - Profile page loads cleanly  
✅ **TC-10.4** - Edit name still works  

---

## 📸 Screenshots

All screenshots saved to: `screenshots/`

---

## 🔍 Manual Checks Required

### TC-6.2 — Check deleteAt Field
1. Open Firebase Console
2. Go to Firestore → trips → [TRIP_ID from test output]
3. Verify `deleteAt` field exists (~90 days from now)

### TC-13.2 — Verify tripCount in Firestore
1. Open Firebase Console
2. Go to Firestore → users → [User D UID]
3. Verify `tripCount = 1`

---

## 🎯 Expected Output

```
Running 11 tests using 1 worker

✓ SETUP — Create trip and have User E join (15s)
✓ TC-11.2 — Cannot update own tripCount directly (3s)
✓ TC-6.1 — Post valid trip (regression check) (2s)
✓ TC-6.2 — Trip has deleteAt in Firestore 🔥 (1s)
✓ TC-6.3 — Missing destination still rejected (2s)
✓ TC-6.4 — Missing departure time still rejected (2s)
✓ TC-6.5 — Missing pickup point still rejected (2s)
✓ TC-13.2 — Complete Trip increments tripCount (8s)
✓ TC-10.7 — Trip count shows correctly on profile (2s)
✓ TC-13.7 — tripCount does NOT increment on cancel (6s)
✓ TC-10.1 — Profile page still loads cleanly (2s)
✓ TC-10.4 — Edit full name still works (3s)

11 passed (48s)
```

---

## ⚠️ Prerequisites

1. **Test accounts must exist:**
   - `testlifecycle@communityride.test` (Test123!)
   - `testlifecyclepass@communityride.test` (Test123!)

2. **App deployed to:** `https://community-ride.lovable.app`

3. **Playwright installed:** Already in devDependencies

---

## 🐛 Troubleshooting

**Tests fail with "timeout":**
- Increase timeout in `playwright.config.ts`
- Check app is deployed and accessible

**"Cannot find test accounts":**
- Create accounts in Firebase Auth with exact credentials above

**Screenshots missing:**
- Create `screenshots/` directory manually
- Check file system permissions

---

## 📚 Full Documentation

For detailed information, see:
- **Full Test Plan:** `REGRESSION-TEST-1.0.1.md`
- **Results Template:** `REGRESSION-RESULTS-1.0.1.md`

---

## ✅ Success Criteria

All tests should **PASS** except:
- TC-6.2 shows "Manual check required" (verify in Firebase)
- TC-13.2 Firestore check needs manual verification

**Ready for release if:** 9/11 automated tests pass + 2 manual checks OK
