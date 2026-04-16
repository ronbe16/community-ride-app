# Manual Testing Checklist

This document covers test cases that require manual execution (Groups 3 & 12) and Firebase Console verification steps.

## GROUP 3 — Auth: Google SSO (Manual 👤)

These tests require actual Google OAuth interaction and cannot be fully automated.

### TC-3.1 — Google SSO New User → Complete Profile
**Steps:**
1. Navigate to `/signup`
2. Click "Continue with Google"
3. Complete Google OAuth with a real Google account (first time using this app)
4. Verify redirect to `/complete-profile`
5. Verify Full Name and Email are pre-filled from Google and are read-only
6. Enter Mobile: `9167778888`
7. Check consent checkbox
8. Click "Join Now"

**Expected:** Redirected to `/` immediately. No pending screen.

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

### TC-3.2 — Google SSO Complete Profile Creates Firestore Doc
**Setup:** TC-3.1 must have passed.

**Steps:**
1. Firebase Console → Firestore → `users` → find User G's doc by UID

**Expected:** Doc has `fullName` from Google, `email` from Google, `mobileNumber` = "+639167778888", `consentVersion` set, no `status` field.

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

### TC-3.3 — Google SSO Returning User Skips Complete Profile
**Steps:**
1. Log out
2. Navigate to `/login`
3. Click "Continue with Google", use same Google account from TC-3.1

**Expected:** Redirected directly to `/`. `/complete-profile` is NOT shown.

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

### TC-3.4 — Google SSO Works from Login Page
**Steps:**
1. Log out, navigate specifically to `/login` (not `/signup`)
2. Click "Continue with Google"

**Expected:** Redirected to `/`. Google button functional on both login and signup pages.

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

### TC-3.5 — Complete Profile — Mobile Number Required
**Steps:**
1. Simulate a new Google SSO user reaching `/complete-profile`
2. Leave Mobile Number empty, check consent, click "Join Now"

**Expected:** Mobile number validation error. Form does not submit.

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

### TC-3.6 — Complete Profile — Consent Required
**Steps:**
1. On `/complete-profile` (new Google SSO user)
2. Fill mobile number but do NOT check consent
3. Click "Join Now"

**Expected:** Consent required error. Form does not submit.

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

## GROUP 12 — Data Integrity (Firebase Console 🔥)

All TC-12.x verified directly in Firebase Console.

### TC-12.1 — User Doc deleteAt Is ~90 Days from createdAt
**Steps:**
1. Open any user doc in Firestore
2. Compare `createdAt` and `deleteAt`

**Expected:** `deleteAt` ≈ `createdAt` + 90 days (within a few minutes tolerance).

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

### TC-12.2 — Trip Doc Has deleteAt Set
**Steps:**
1. Open a trip doc in Firestore
2. Check `deleteAt` field

**Expected:** `deleteAt` timestamp is present and set to ~90 days from `createdAt`.

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

### TC-12.3 — Safety Link expiresAt Is 48 Hours After Departure
**Steps:**
1. Open a `safety_links` doc
2. Compare `trip.departureTime` and `expiresAt`

**Expected:** `expiresAt` = `departureTime` + exactly 48 hours.

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

### TC-12.4 — Safety Link deleteAt Is ~90 Days
**Steps:**
1. Open a `safety_links` doc
2. Check `deleteAt`

**Expected:** ~90 days from trip departure or creation date. Present and populated.

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

### TC-12.5 — Passenger Subcollection Doc Has Required Fields
**Steps:**
1. Firestore → `trips/{tripId}/passengers/{passengerId}`

**Expected:** `uid` field matches passenger's Firebase Auth UID. `status` = "confirmed". `joinedAt` timestamp present. `fullName` present (denormalized).

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

### TC-12.6 — filledSeats Matches Subcollection Count
**Steps:**
1. Open a trip with exactly 1 passenger
2. Check `filledSeats` on trip doc
3. Count docs in `trips/{tripId}/passengers`

**Expected:** `filledSeats` count matches the actual number of passenger documents.

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

### TC-12.7 — consentVersion Present on All User Docs
**Steps:**
1. Open User A, B, C docs in Firestore
2. Check `consentVersion` and `consentAcceptedAt` on each

**Expected:** All docs have both fields set. No nulls or missing values.

**Status:** `[ ]` PASS / `[ ]` FAIL / `[ ]` SKIP

**Notes:**

---

## Firebase Console Verification Steps (For Automated Tests)

After running automated tests, verify these in Firebase Console:

### TC-1.2 — Signup Creates Firestore Doc
**Check:** `users` collection has doc for testdriver@communityride.test with all required fields

**Status:** `[ ]` PASS / `[ ]` FAIL

---

### TC-6.2 — Trip Stored Correctly in Firestore
**Check:** `trips` collection has trip with correct fields (driverUid, status, availableSeats, etc.)

**Status:** `[ ]` PASS / `[ ]` FAIL

---

### TC-7.3 — Seat Count Decrements in Firestore
**Check:** `filledSeats` incremented when passenger joins

**Status:** `[ ]` PASS / `[ ]` FAIL

---

### TC-7.4 — Passenger Subcollection Created
**Check:** `trips/{tripId}/passengers` has doc for joined passenger

**Status:** `[ ]` PASS / `[ ]` FAIL

---

### TC-8.2 — Safety Link Stored in Firestore
**Check:** `safety_links` has doc with correct fields (type, generatedBy, tripId, expiresAt, etc.)

**Status:** `[ ]` PASS / `[ ]` FAIL

---

### TC-9.2 — Manifest Stored in Firestore
**Check:** `manifests` has doc with vehicle, driver, trip, passengers array

**Status:** `[ ]` PASS / `[ ]` FAIL

---

### TC-10.3 — Vehicle Stored in Firestore
**Check:** User doc has `vehicle` object with make, model, year, plateNumber, color

**Status:** `[ ]` PASS / `[ ]` FAIL

---

### TC-10.6 — Cannot Edit Another User's Profile
**Check:** User A's doc unchanged after User B attempted update

**Status:** `[ ]` PASS / `[ ]` FAIL

---

### TC-10.9 — deleteAt Extended on Login
**Check:** User's `deleteAt` updated to ~90 days from now, `lastActiveAt` updated

**Status:** `[ ]` PASS / `[ ]` FAIL

---

### TC-11.1 — User Cannot Write to Another User's Doc
**Check:** User A's doc unchanged in Firebase Console after attempted hack

**Status:** `[ ]` PASS / `[ ]` FAIL

---

### TC-11.9 — Non-Driver Cannot Delete Another User's Trip
**Check:** Trip still exists in Firestore after non-driver deletion attempt

**Status:** `[ ]` PASS / `[ ]` FAIL

---
