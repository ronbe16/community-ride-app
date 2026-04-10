# Community Ride — Alpha Testing Playbook

> **Version:** 3.0
> **Date:** April 10, 2026
> **Tester:** Kilocode / Claude Agentic Browser
> **Trust Model:** Addendum B — Simplified (no roles, no admin approval, no ID upload)
> **Auth:** Email/Password + Google SSO — both immediately active on signup
> **App URL:** *(fill in your Lovable URL before running)*
> **Total Test Cases:** 139
> **Supersedes:** v2.0 (103 cases)

---

## What's New in v3.0

This playbook fully supersedes v2.0. All 103 original test cases are retained (some revised) plus 36 new cases covering:

- Trip lifecycle: Start Trip, ongoing status, Complete Trip, tripCount increment (Groups 6, 7, 13)
- Ongoing ride guards: driver blocked from posting, passenger blocked from joining (Groups 6, 7, 13)
- Contact number visibility: driver mobile to joined passenger, passenger mobile to driver (Group 14)
- Exchange photos: face/ID/plate capture, confirm-before-upload modal, locked state, Cloudinary upload (Group 15)
- Driver scan photos: Scan button, thumbnail feedback, per-passenger locked state (Group 15)
- Mutual read-only visibility: passenger sees driver's scan of them; driver sees passenger's exchange photos (Group 15)
- Safety card: per-participant doc key (`tripId_uid`), photo layout per passenger, public page (Groups 8, 16)
- Manifest: auto-generated on Start Trip, View Manifest and Share Manifest buttons (Group 9)
- Dashboard: ongoing trip yellow card, section structure (Group 5)
- Firestore rules v3: `manifests` and `safety_links` allow update, canonical published rules (Group 11)
- Data integrity: manifest fields, safety link per-participant key, exchange photo fields (Group 12)

---

## How to Use This Document

You are an agentic tester (Kilocode or Claude). Read this entire document before starting. Then execute each test case in order, group by group. For each test:

1. Perform the steps exactly as written
2. Compare actual result to expected result
3. Mark status: `PASS` / `FAIL` / `SKIP` / `BLOCKED`
4. Note any error messages, crashes, or unexpected behavior verbatim
5. Take a screenshot where noted with 📸

**Do NOT delete any test data unless a test case explicitly requires it — earlier test data is depended on by later tests.**

**When a test says "verify," it means visually confirm the information is on screen.**

---

## Testing Strategy

This playbook uses a **mixed approach**:

- **Browser automation (Playwright)** — for auth flows, form validation, navigation, Firestore rule enforcement, trip lifecycle, real-time multi-context tests
- **Manual browser steps (👤)** — for Google SSO (OAuth popup cannot be automated), share sheet interactions, camera/photo capture, print dialog
- **Firestore Console verification (🔥)** — for data integrity checks, field presence, TTL timestamps, Firestore rules enforcement

Tests that require Playwright are marked with 🤖. Manual steps are marked with 👤. Firebase Console steps are marked with 🔥.

---

## Pre-Test Setup

### 1. Firebase Console Checklist 🔥

Before running any tests, verify in Firebase Console:

- [ ] Firebase Auth → Authentication → Settings → **Authorized domains** includes your Lovable preview URL
- [ ] Firebase Auth → Sign-in method → **Email/Password** is enabled
- [ ] Firebase Auth → Sign-in method → **Google** is enabled
- [ ] Firestore → Rules → published rules match the **Addendum E canonical version** (includes `allow update` on `manifests` and `safety_links`)
- [ ] Firestore → Rules → `/users/{userId}` `allow read: if isSignedIn()` (NOT `isOwner` — required for driver mobile display)
- [ ] Firestore → Indexes → Composite index on `trips`: `status ASC` + `departureTime ASC` shows **Enabled**
- [ ] Firestore is NOT in open test mode — rules are published and enforced

### 2. Cloudinary Checklist

- [ ] Cloudinary Console → Settings → Upload → Upload Presets → `community-ride` preset exists
- [ ] Preset signing mode = **Unsigned**
- [ ] Preset folder = `community-ride` (root — no subfolders)

### 3. Playwright Setup 🤖

```bash
npm init playwright@latest
npx playwright install chromium
```

Create `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'YOUR_LOVABLE_APP_URL',
    headless: false,
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  timeout: 30000,
  workers: 1, // avoid Firestore free-tier quota exhaustion
});
```

> ⚠️ **Use `workers: 1`** — parallel runs against a live Firebase project will exhaust free-tier quota. Add a 500ms delay between tests if your runner supports it.

### 4. Test Accounts

Create these via the app's normal signup before running the test suite. No manual Firebase seeding required — signup is immediate with no email confirmation.

| Label | Email | Password | Notes |
|---|---|---|---|
| **User A** | `testdriver@communityride.test` | `Test123!` | Primary — posts trips, acts as driver |
| **User B** | `testpassenger@communityride.test` | `Test123!` | Joins trips, generates safety links |
| **User C** | `testthird@communityride.test` | `Test123!` | Seat-full and conflict tests |
| **User G** | *(real Google account)* | *(Google OAuth)* | Google SSO tests only — manual |

> These accounts are created during Group 1 tests. Groups 2+ depend on them existing.

### 5. Firebase Quota Warning

Check Firebase Console → Usage → Last 1 hour before and after each test session.

- Normal usage: < 2,000 reads for a 2-user session
- Warning threshold: > 5,000 reads — something is wrong
- If reads spike to 10K+/hour or a user doc appears to be updating rapidly: **close all app tabs immediately** and check `AuthContext.tsx` for writes inside `onSnapshot` callbacks (the infinite loop regression from Addendum D)

---

## Playwright Helper — Auth Utilities

Save as `tests/helpers/auth.ts` for reuse across test files:

```typescript
import { Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function logout(page: Page) {
  await page.click('[data-testid="logout"], text=Log Out, text=Sign Out');
  await page.waitForURL('/login');
}

export async function signupAs(
  page: Page,
  name: string,
  email: string,
  password: string,
  mobile: string
) {
  await page.goto('/signup');
  await page.fill('input[name="fullName"], input[placeholder*="name"]', name);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.fill('input[type="tel"], input[placeholder*="917"]', mobile);
  await page.check('input[type="checkbox"]');
  await page.click('button[type="submit"], button:has-text("Join Now")');
  await page.waitForURL('/');
}
```

---

## Test Groups Summary

| Group | ID Range | Method | Count | Description |
|---|---|---|---|---|
| Auth — Signup | TC-1.x | 🤖 | 10 | Email/password signup, validation, consent |
| Auth — Login / Logout | TC-2.x | 🤖 | 8 | Login, logout, wrong creds, protected routes |
| Auth — Google SSO | TC-3.x | 👤 | 6 | Google signup, complete profile, returning user |
| Auth — Forgot Password | TC-4.x | 🤖 👤 | 5 | Reset email, validation, unregistered email |
| Dashboard | TC-5.x | 🤖 | 10 | Trip list, empty state, real-time updates, ongoing card, nav |
| Post Trip | TC-6.x | 🤖 | 15 | Form fields, validation, submission, limits, ongoing guard |
| Trip Detail & Join | TC-7.x | 🤖 | 12 | View, join, cancel, seat counts, driver view, ongoing guard |
| Safety Card (Basic) | TC-8.x | 🤖 👤 | 10 | Generate, public access, data accuracy, expiry |
| Manifest | TC-9.x | 🤖 👤 | 10 | Auto-generate on Start Trip, view, share, public access |
| Profile | TC-10.x | 🤖 🔥 | 10 | View, edit, vehicle info, mobile format, tripCount |
| Firestore Rules | TC-11.x | 🤖 🔥 | 12 | Security boundary — unauthorized write attempts, rules v3 |
| Data Integrity | TC-12.x | 🔥 | 10 | TTL timestamps, field presence, schema checks, photos |
| Trip Lifecycle | TC-13.x | 🤖 🔥 | 10 | Start Trip, Complete Trip, status transitions, guards |
| Contact Numbers | TC-14.x | 🤖 | 6 | Driver mobile to passenger, passenger mobile to driver |
| Exchange Photos | TC-15.x | 🤖 👤 🔥 | 15 | Capture, confirm modal, locked state, driver scan, mutual visibility |
| Safety Card (Photos) | TC-16.x | 🤖 👤 🔥 | 10 | Per-participant key, photos on public card, layout |

**Total: 139 test cases**

---

## GROUP 1 — Auth: Signup (Email/Password)

### TC-1.1 — Successful Signup User A 🤖
**Steps:**
1. Navigate to `/signup`
2. Fill: Full Name = `Test Driver`, Email = `testdriver@communityride.test`, Password = `Test123!`, Mobile = `9171234567`
3. Check consent checkbox
4. Click "Join Now"

**Expected:** Redirected to `/` (dashboard) immediately. No pending screen. No email verification step. 📸

---

### TC-1.2 — Signup Creates Firestore Doc 🔥
**Setup:** TC-1.1 must have passed.

**Steps:**
1. Firebase Console → Firestore → `users` collection
2. Find the document for User A's UID

**Expected:** Document exists with: `uid`, `fullName` = "Test Driver", `mobileNumber` = "+639171234567", `consentVersion`, `consentAcceptedAt`, `deleteAt`, `createdAt`, `tripCount` = 0, `rating` = 0, `ratingCount` = 0. No `role` field. (`status: 'verified'` may be present — acceptable.)

---

### TC-1.3 — Signup User B 🤖
**Steps:**
1. Log out, navigate to `/signup`
2. Fill: Full Name = `Test Passenger`, Email = `testpassenger@communityride.test`, Password = `Test123!`, Mobile = `9189876543`
3. Check consent, click "Join Now"

**Expected:** Redirected to `/` immediately.

---

### TC-1.4 — Signup User C 🤖
**Steps:**
1. Log out, navigate to `/signup`
2. Fill: Full Name = `Test Third`, Email = `testthird@communityride.test`, Password = `Test123!`, Mobile = `9181112222`
3. Check consent, click "Join Now"

**Expected:** Redirected to `/` immediately.

---

### TC-1.5 — Duplicate Email Rejected 🤖
**Steps:**
1. Navigate to `/signup`
2. Fill all fields using `testdriver@communityride.test` (already registered)
3. Click "Join Now"

**Expected:** Error message shown — email already in use. User stays on `/signup`. No new Firebase Auth entry created.

---

### TC-1.6 — Consent Checkbox Required 🤖
**Steps:**
1. Navigate to `/signup`
2. Fill all fields correctly but do **not** check the consent checkbox
3. Click "Join Now"

**Expected:** Form does not submit. Checkbox shows required state or button is disabled. No navigation away from `/signup`.

---

### TC-1.7 — Short Password Rejected 🤖
**Steps:**
1. Navigate to `/signup`
2. Enter password: `abc` (less than 8 characters)
3. Fill all other fields, check consent, click "Join Now"

**Expected:** Error shown — password too short. No account created.

---

### TC-1.8 — Invalid Email Format Rejected 🤖
**Steps:**
1. Navigate to `/signup`
2. Enter email: `notanemail`
3. Fill other fields, check consent, click "Join Now"

**Expected:** Email format validation error. Form does not submit.

---

### TC-1.9 — Empty Full Name Rejected 🤖
**Steps:**
1. Navigate to `/signup`
2. Leave Full Name blank, fill all other fields, check consent, click "Join Now"

**Expected:** Full Name required validation error. Form does not submit.

---

### TC-1.10 — Signup Page Has Google Button 🤖
**Steps:**
1. Navigate to `/signup`
2. Verify "Continue with Google" button is present above the form fields
3. Verify "or continue with email" divider exists between the button and form

**Expected:** Google button with icon visible. Divider present. 📸

---

## GROUP 2 — Auth: Login / Logout

### TC-2.1 — Successful Login 🤖
**Steps:**
1. Ensure logged out
2. Navigate to `/login`
3. Enter `testdriver@communityride.test` / `Test123!`
4. Click "Sign In"

**Expected:** Redirected to `/`. User A's name visible in the UI. 📸

---

### TC-2.2 — Login Page Has Google Button 🤖
**Steps:**
1. Navigate to `/login`
2. Verify "Continue with Google" button is present

**Expected:** Google button visible on the login page. 📸

---

### TC-2.3 — Wrong Password 🤖
**Steps:**
1. Navigate to `/login`
2. Enter `testdriver@communityride.test` / `WrongPass!`
3. Click "Sign In"

**Expected:** Error message shown. No crash. User stays on `/login`.

---

### TC-2.4 — Unregistered Email 🤖
**Steps:**
1. Navigate to `/login`
2. Enter `nobody@nowhere.test` / `Test123!`
3. Click "Sign In"

**Expected:** Error message shown. User stays on `/login`.

---

### TC-2.5 — Empty Fields on Login 🤖
**Steps:**
1. Navigate to `/login`
2. Click "Sign In" without filling any fields

**Expected:** Validation errors on both fields. No Firebase call made.

---

### TC-2.6 — Logout 🤖
**Steps:**
1. Log in as User A
2. Find and click the logout option (Sign Out button in header or profile area)

**Expected:** Redirected to `/login` or landing page. Session cleared. Navigating back to `/` redirects to `/login`.

---

### TC-2.7 — Unauthenticated User Redirected from Dashboard 🤖
**Steps:**
1. Log out completely
2. Navigate directly to `/`

**Expected:** Redirected to `/login`. Dashboard content never shown.

---

### TC-2.8 — All Protected Routes Redirect When Unauthenticated 🤖
**Steps:**
1. Log out
2. Navigate to each: `/post-trip`, `/profile`, `/trip/fakeid`

**Expected:** All redirect to `/login`. None render app content. 📸 (one screenshot per route)

---

## GROUP 3 — Auth: Google SSO

> ⚠️ **These tests are MANUAL (👤).** Google OAuth popup cannot be fully automated. Run in a real browser with User G's Google account (must NOT be previously registered in this app).

### TC-3.1 — Google SSO New User → Complete Profile 👤
**Steps:**
1. Navigate to `/signup`
2. Click "Continue with Google"
3. Complete Google OAuth with User G (first time using this app)
4. Verify redirect to `/complete-profile`
5. Verify Full Name and Email are pre-filled from Google and are read-only
6. Enter Mobile: `9167778888`
7. Check consent checkbox
8. Click "Join Now"

**Expected:** Redirected to `/` immediately. No pending screen. 📸

---

### TC-3.2 — Google SSO Complete Profile Creates Firestore Doc 🔥
**Setup:** TC-3.1 must have passed.

**Steps:**
1. Firebase Console → Firestore → `users` → find User G's doc by UID

**Expected:** Doc has `fullName` from Google, `email` from Google, `mobileNumber` = "+639167778888", `consentVersion` set. No `role` field.

---

### TC-3.3 — Google SSO Returning User Skips Complete Profile 👤
**Steps:**
1. Log out
2. Navigate to `/login`
3. Click "Continue with Google", use same User G account

**Expected:** Redirected directly to `/`. `/complete-profile` is NOT shown. 📸

---

### TC-3.4 — Google SSO Works from Login Page 👤
**Steps:**
1. Log out, navigate specifically to `/login` (not `/signup`)
2. Click "Continue with Google", use User G

**Expected:** Redirected to `/`. Google button functional on both login and signup pages.

---

### TC-3.5 — Complete Profile — Mobile Number Required 👤
**Steps:**
1. Simulate a new Google SSO user reaching `/complete-profile`
2. Leave Mobile Number empty, check consent, click "Join Now"

**Expected:** Mobile number validation error. Form does not submit.

---

### TC-3.6 — Complete Profile — Consent Required 👤
**Steps:**
1. On `/complete-profile` (new Google SSO user)
2. Fill mobile number but do NOT check consent
3. Click "Join Now"

**Expected:** Consent required error. Form does not submit.

---

## GROUP 4 — Auth: Forgot Password

### TC-4.1 — Forgot Password Link on Login Page 🤖
**Steps:**
1. Navigate to `/login`
2. Verify "Forgot password?" link is visible

**Expected:** Link present on the login page. 📸

---

### TC-4.2 — Request Password Reset — Valid Email 🤖 👤
**Steps:**
1. Click "Forgot password?" on login page
2. Enter `testdriver@communityride.test`
3. Click "Send Reset Link"

**Expected:** Success message shown: "Check your email for a reset link." No error, no crash.
*(Manual follow-up: Check inbox — verify Firebase reset email arrives.)*

---

### TC-4.3 — Reset — Unregistered Email 🤖
**Steps:**
1. Open forgot password form
2. Enter `nobody@nowhere.test`
3. Click "Send Reset Link"

**Expected:** Either a generic success message OR a user-not-found error. No crash either way.

---

### TC-4.4 — Reset — Invalid Email Format 🤖
**Steps:**
1. Open forgot password form
2. Enter `notanemail`
3. Click "Send Reset Link"

**Expected:** Client-side validation error before any Firebase call. User stays on the form.

---

### TC-4.5 — Reset — Empty Field 🤖
**Steps:**
1. Open forgot password form
2. Click "Send Reset Link" without entering anything

**Expected:** Required field validation error. No Firebase call.

---

## GROUP 5 — Dashboard

### TC-5.1 — Dashboard Loads When Authenticated 🤖
**Steps:**
1. Log in as User B
2. Navigate to `/`

**Expected:** Dashboard renders without crash. Trip list area visible. Bottom nav with 3 items visible: Trips, Post Trip, Profile. 📸

---

### TC-5.2 — Dashboard Empty State 🤖
**Setup:** Run before any trips are posted.

**Steps:**
1. Log in as User B, view dashboard

**Expected:** Empty state message shown — not a blank screen or error. Something like "No trips available right now." 📸

---

### TC-5.3 — Dashboard Shows Open Trips 🤖
**Setup:** Run after TC-6.1 (User A has posted an open trip).

**Steps:**
1. Log in as User B, navigate to `/`

**Expected:** Trip card visible showing driver name, route (pickup → destination), departure time, seats remaining. Card is white/default style. 📸

---

### TC-5.4 — Real-time Trip Updates 🤖
**Setup:** Two Playwright browser contexts simultaneously.

**Steps:**
1. Context 1: Log in as User B — open dashboard
2. Context 2: Log in as User A — post a new trip
3. Without refreshing Context 1, wait up to 5 seconds and observe

**Expected:** New trip appears on User B's dashboard without a page reload. 📸

---

### TC-5.5 — Bottom Navigation — All Tabs 🤖
**Steps:**
1. Log in as any user
2. Tap Trips nav → verify URL is `/`
3. Tap Post Trip nav → verify URL is `/post-trip`
4. Tap Profile nav → verify URL is `/profile`

**Expected:** All 3 tabs navigate correctly. All visible for all users — no role gating.

---

### TC-5.6 — Dashboard Shows Joined Trip 🤖
**Setup:** Run after TC-7.2 (User B has joined a trip).

**Steps:**
1. Log in as User B, view dashboard

**Expected:** Joined trip visible in a "My Trips" or "Upcoming" section, distinct from the open trips browse list.

---

### TC-5.7 — Trips Sorted by Departure Time 🤖
**Setup:** At least 2 trips with different departure times exist.

**Steps:**
1. Log in as User B, view the trip list

**Expected:** Trips are sorted soonest departure first.

---

### TC-5.8 — Ongoing Trip Shows Yellow Card on Dashboard 🤖
**Setup:** TC-13.1 must have passed (User A's trip has been started and is `status: 'ongoing'`).

**Steps:**
1. Log in as User A, navigate to `/`
2. Log in as User B (joined passenger), navigate to `/`

**Expected:** For both User A and User B, the ongoing trip card is styled with yellow (#FFDE00) background and dark text. Labeled something like "🚗 Your ongoing trip" or "🎫 Your ride today." 📸

---

### TC-5.9 — Full Trip Shows Full Badge 🤖
**Setup:** Trip with Available Seats = 1 has been filled.

**Steps:**
1. Log in as any user, view dashboard

**Expected:** Full trip card shows a "Full" or "Full — Ongoing" blue badge. Visible in the trip list.

---

### TC-5.10 — Passenger with Ongoing Ride Sees Disabled Join on Other Trip Cards 🤖
**Setup:** User B has a joined trip that is `status: 'ongoing'` (TC-13.1).

**Steps:**
1. Log in as User B, view dashboard
2. Observe any other open trip cards

**Expected:** Other trip cards show "Ongoing ride active" with a disabled/gray join button. User B cannot browse-join a second trip while their current ride is ongoing.

---

## GROUP 6 — Post Trip

### TC-6.1 — Post a Valid Trip 🤖
**Steps:**
1. Log in as User A, navigate to `/post-trip`
2. Fill:
   - Pickup point: `Main Gate, Block 3`
   - Destination: `Ayala MRT Station`
   - Departure time: tomorrow, 7:00 AM
   - Waiting time: 10 minutes
   - Available seats: 3
   - Gas contribution: 50
3. Submit

**Expected:** Trip created. Redirected to trip detail or dashboard. Trip visible in the list. 📸

---

### TC-6.2 — Trip Stored Correctly in Firestore 🔥
**Setup:** TC-6.1 passed.

**Steps:**
1. Firestore Console → `trips` collection → find the new trip

**Expected:** Fields: `driverUid` = User A's UID, `status` = "open", `filledSeats` = 0, `availableSeats` = 3, `origin` = "Main Gate, Block 3", `destination` = "Ayala MRT Station", `gasContribution` = 50, `deleteAt` set.

---

### TC-6.3 — Missing Destination Rejected 🤖
**Steps:**
1. Go to `/post-trip`, fill all fields except Destination
2. Submit

**Expected:** Validation error on Destination. Form does not submit. No Firestore write.

---

### TC-6.4 — Missing Departure Time Rejected 🤖
**Steps:**
1. Go to `/post-trip`, fill all fields except Departure Time
2. Submit

**Expected:** Validation error. Form does not submit.

---

### TC-6.5 — Missing Pickup Point Rejected 🤖
**Steps:**
1. Go to `/post-trip`, leave Pickup Point blank
2. Submit

**Expected:** Validation error. Form does not submit.

---

### TC-6.6 — Gas Contribution Is Optional 🤖
**Steps:**
1. Go to `/post-trip`, fill all required fields
2. Leave Gas Contribution blank
3. Submit

**Expected:** Trip creates successfully. Gas shows as blank or "To be discussed" on the trip card.

---

### TC-6.7 — Off-Peak Hours Warning Shown 🤖
**Steps:**
1. Go to `/post-trip`
2. Set departure time to 2:00 PM (outside 6–9 AM / 5–9 PM peak)
3. Fill other fields normally

**Expected:** Amber/yellow warning shown: "Note: LTFRB carpooling is allowed during peak hours only." Trip can still be submitted — not blocked. 📸

---

### TC-6.8 — Peak Hours — No Warning Shown 🤖
**Steps:**
1. Go to `/post-trip`, set departure time to 7:30 AM (inside peak)
2. Fill other fields

**Expected:** No peak hours warning appears.

---

### TC-6.9 — Seats Stepper Cannot Go Below 1 🤖
**Steps:**
1. Go to `/post-trip`
2. Use the minus button on Available Seats to try to set it below 1

**Expected:** Minimum of 1 enforced. Value does not go to 0 or negative.

---

### TC-6.10 — Seats Stepper Cannot Exceed 4 🤖
**Steps:**
1. Go to `/post-trip`
2. Use the plus button to try to set seats above 4

**Expected:** Maximum of 4 enforced. Value does not go to 5+.

---

### TC-6.11 — Driver Sees Their Own Posted Trip 🤖
**Steps:**
1. After posting as User A, navigate to dashboard or "My Trips"

**Expected:** User A's trip appears in their own trips view with a driver indicator or "Your trip" label.

---

### TC-6.12 — Cancel Own Trip 🤖
**Steps:**
1. Log in as User A, open a posted trip
2. Find and tap the cancel option

**Expected:** Option to cancel is available. After cancelling, trip status changes to "cancelled" and it disappears from the public trip list.

---

### TC-6.13 — Cancelled Trip Does Not Count Toward Daily Limit 🤖
**Steps:**
1. Log in as User A
2. Post a trip → cancel it
3. Post a second trip → cancel it
4. Post a third trip

**Expected:** Third post succeeds. Only non-cancelled trips (`status in ['open', 'full']`) count toward the 2-trips-per-day limit.

---

### TC-6.14 — Driver Blocked from Posting While Trip Is Ongoing 🤖
**Setup:** TC-13.1 must have passed (User A has a trip with `status: 'ongoing'`).

**Steps:**
1. Log in as User A
2. Navigate to `/post-trip`
3. Attempt to fill and submit a new trip

**Expected:** Toast shown: "You have an ongoing trip. Complete it before posting a new one." Form does not submit. No new trip created in Firestore.

---

### TC-6.15 — Two-Trip Daily Limit Enforced 🤖
**Steps:**
1. Log in as User A
2. Post trip 1 (departure time: tomorrow 7:00 AM) → successful
3. Post trip 2 (departure time: tomorrow 8:00 AM) → successful
4. Attempt to post trip 3 (departure time: tomorrow 9:00 AM)

**Expected:** Third post blocked with a toast or error message indicating the daily limit has been reached. No third trip written to Firestore.

---

## GROUP 7 — Trip Detail & Join

### TC-7.1 — View Trip Detail 🤖
**Steps:**
1. Log in as User B
2. Tap a trip card on the dashboard

**Expected:** Trip detail page loads showing: driver name, pickup, destination, departure time, waiting time, gas contribution, seats remaining, "Join Trip" button. 📸

---

### TC-7.2 — Join a Trip 🤖
**Steps:**
1. Log in as User B
2. Open User A's trip from TC-6.1
3. Tap "Join Trip" and confirm

**Expected:** User B added to passenger list. Seats remaining decreases by 1. Confirmation shown. Button state changes to "Joined" or "Cancel Seat". 📸

---

### TC-7.3 — Seat Count Decrements in Firestore 🔥
**Setup:** TC-7.2 passed.

**Steps:**
1. Firestore Console → `trips/{tripId}`

**Expected:** `filledSeats` = 1.

---

### TC-7.4 — Passenger Subcollection Created 🔥
**Setup:** TC-7.2 passed.

**Steps:**
1. Firestore Console → `trips/{tripId}/passengers`

**Expected:** Subcollection has a document with User B's UID. Fields: `uid`, `fullName`, `status` = "confirmed", `joinedAt`.

---

### TC-7.5 — Driver Sees Passenger 🤖
**Steps:**
1. Log in as User A
2. Open the trip User B just joined

**Expected:** User B's name visible in the passenger list on the trip detail page. 📸

---

### TC-7.6 — Cannot Join Own Trip 🤖
**Steps:**
1. Log in as User A
2. Navigate to a trip they posted

**Expected:** "Join Trip" button not visible or disabled for the trip owner. Attempting to join shows an error.

---

### TC-7.7 — Cancel Seat 🤖
**Steps:**
1. Log in as User B, open their joined trip
2. Tap "Cancel Seat"

**Expected:** User B removed from passenger list. Seat count increments back up by 1.

---

### TC-7.8 — Real-time Passenger List 🤖
**Setup:** Two Playwright browser contexts.

**Steps:**
1. Context 1: Log in as User A — open their trip detail
2. Context 2: Log in as User B — join the same trip
3. Observe Context 1 without refreshing

**Expected:** User B's name appears on User A's passenger list in real-time, no page reload.

---

### TC-7.9 — Full Trip Cannot Be Joined 🤖
**Steps:**
1. Post a new trip as User A with Available Seats = 1
2. Log in as User B — join it (fills the trip)
3. Log in as User C — attempt to join the same trip

**Expected:** Trip shows as full. "Join Trip" disabled or hidden for User C. Error shown if attempted: "This trip is full."

---

### TC-7.10 — Share Driver Info Button Visible After Joining 🤖
**Steps:**
1. Log in as User B, open a trip they have joined

**Expected:** "Share Driver Info" or "Share Safety Link" button is visible on the trip detail page. 📸

---

### TC-7.11 — Duplicate Join Prevented 🤖
**Steps:**
1. Log in as User B, open a trip they have already joined
2. Find and attempt to trigger "Join Trip" again (browser console or direct action)

**Expected:** Toast shown: "You've already joined this trip." No duplicate passenger subcollection document created.

---

### TC-7.12 — Passenger Blocked from Joining While Ride Is Ongoing 🤖
**Setup:** User B has a joined trip that is `status: 'ongoing'` (TC-13.1).

**Steps:**
1. Log in as User B
2. Navigate to a different trip and attempt to join

**Expected:** Join blocked with a toast or error. `TripDetail` `handleJoin` prevents the write. No new passenger doc created.

---

## GROUP 8 — Safety Card (Basic)

### TC-8.1 — Generate Safety Card Link 🤖
**Steps:**
1. Log in as User B, open a joined trip
2. Tap "Share Driver Info" or "Share Safety Link"

**Expected:** Safety link generated. URL format: `{appUrl}/safety/{tripId}_{userBUid}`. Link displayed or native share sheet opens. 📸

---

### TC-8.2 — Safety Link Stored in Firestore 🔥
**Setup:** TC-8.1 passed.

**Steps:**
1. Firestore Console → `safety_links` → find the new doc

**Expected:** Document ID = `{tripId}_{userBUid}`. Fields: `generatedBy` = User B's UID, `tripId`, `driver.fullName`, `trip.origin`, `trip.destination`, `trip.departureTime`, `expiresAt`, `deleteAt`, `createdAt`.

---

### TC-8.3 — Safety Card Accessible Without Login 🤖
**Steps:**
1. Copy the safety card URL
2. Open in a new Playwright incognito context (no auth)
3. Navigate to the URL

**Expected:** Page loads fully without redirecting to `/login`. Driver and trip info shown. No bottom nav or app shell. 📸

---

### TC-8.4 — Safety Card Shows Correct Driver Name 🤖
**Steps:**
1. On the public safety card

**Expected:** Driver name = User A's full name "Test Driver".

---

### TC-8.5 — Safety Card Shows Correct Route 🤖
**Steps:**
1. On the public safety card

**Expected:** "Main Gate, Block 3" → "Ayala MRT Station" displayed.

---

### TC-8.6 — Safety Card Shows Departure Time 🤖
**Steps:**
1. On the public safety card

**Expected:** Departure time shown and matches the trip's scheduled time.

---

### TC-8.7 — Safety Card Shows Vehicle If Set 🤖
**Setup:** User A has added vehicle info (TC-10.2 must have run first).

**Steps:**
1. Generate a new safety card after vehicle info has been added
2. View in incognito

**Expected:** Vehicle make, color, and plate number visible on the safety card.

---

### TC-8.8 — Safety Link expiresAt Is 48 Hours After Departure 🔥
**Setup:** TC-8.2 passed.

**Steps:**
1. Open `safety_links/{linkId}` doc in Firestore
2. Compare `trip.departureTime` and `expiresAt`

**Expected:** `expiresAt` = `departureTime` + exactly 48 hours.

---

### TC-8.9 — Expired Safety Card Shows Message 🤖
**Steps:**
1. Manually set `expiresAt` on a test safety link doc to a time in the past (Firebase Console)
2. Navigate to that safety card URL

**Expected:** Page shows an "expired" message rather than the trip data. Does not crash.

---

### TC-8.10 — Non-Participant Cannot Generate Safety Card 🤖
**Steps:**
1. Log in as User C (not a participant in User A's trip)
2. Navigate to User A's trip detail URL directly
3. Attempt to find or trigger the "Share Safety Link" button

**Expected:** Button is not visible or is disabled for User C. If triggered programmatically, the Firestore write fails because `generatedBy` would not match `request.auth.uid` for a non-participant.

---

## GROUP 9 — Manifest

### TC-9.1 — Manifest Auto-Generated on Start Trip 🤖 🔥
**Setup:** TC-13.1 (Start Trip) must pass first.

**Steps:**
1. Log in as User A, open a trip with at least 1 confirmed passenger
2. Tap "Start Trip"
3. Wait 2–3 seconds for background generation

**Expected:** In Firestore → `manifests/{tripId}`, a new document exists. Fields: `generatedBy` = User A's UID, `driver.fullName`, `trip.origin`, `trip.destination`, `trip.departureTime`, `passengers` array with at least User B's entry, `communityName`, `generatedAt`, `expiresAt`. 📸

---

### TC-9.2 — View Manifest Button Appears After Trip Started 🤖
**Setup:** TC-13.1 passed, trip is `status: 'ongoing'`.

**Steps:**
1. Log in as User A, open the ongoing trip
2. Log in as User B, open the same trip

**Expected:** "View Manifest" button visible for both the driver (User A) and confirmed passenger (User B). Not visible for unrelated users.

---

### TC-9.3 — Share Manifest Button Appears After Trip Started 🤖
**Setup:** Trip is `status: 'ongoing'` or `'completed'`.

**Steps:**
1. Log in as User A, open the trip

**Expected:** "Share Manifest" button visible alongside "View Manifest". 📸

---

### TC-9.4 — View Manifest Opens Public Page 🤖
**Steps:**
1. Click "View Manifest" on the trip detail

**Expected:** New tab/window opens at `{appUrl}/manifest/{tripId}`. Page renders without login. 📸

---

### TC-9.5 — Manifest Accessible Without Login 🤖
**Steps:**
1. Copy manifest URL
2. Open in incognito context (no auth)

**Expected:** Manifest page renders. No redirect to `/login`. 📸

---

### TC-9.6 — Manifest Shows Correct Driver and Vehicle Info 🤖
**Steps:**
1. On the public manifest page

**Expected:** Driver name, vehicle make/model (if set), plate number (if set) visible. Community name shown.

---

### TC-9.7 — Manifest Shows Correct Passenger List 🤖
**Steps:**
1. On the public manifest page

**Expected:** Each confirmed passenger listed with full name and join time. User B's entry present.

---

### TC-9.8 — Share Manifest — Web Share API 👤
**Steps:**
1. Log in as User A (on mobile or a browser supporting Web Share API)
2. Tap "Share Manifest"

**Expected:** Native share sheet opens with the manifest URL. Viber/SMS/Messenger visible as share targets on mobile.

---

### TC-9.9 — Share Manifest — Clipboard Fallback 🤖
**Steps:**
1. Log in as User A (desktop browser, Web Share API not supported)
2. Click "Share Manifest"

**Expected:** Toast shown: "Manifest link copied!" Manifest URL on clipboard. No crash.

---

### TC-9.10 — Manifest Shows on Completed Trip 🤖
**Setup:** TC-13.2 must have passed (trip is `status: 'completed'`).

**Steps:**
1. Log in as User A, open the completed trip
2. Check for View/Share Manifest buttons

**Expected:** "View Manifest" and "Share Manifest" still visible on a completed trip. Manifest page still accessible.

---

## GROUP 10 — Profile

### TC-10.1 — View Profile 🤖
**Steps:**
1. Log in as User A, navigate to `/profile`

**Expected:** Full name, email, mobile number, and trip count visible. No crash. 📸

---

### TC-10.2 — Add Vehicle Info 🤖
**Steps:**
1. Log in as User A, navigate to `/profile`
2. Fill vehicle fields: Make = `Toyota`, Model = `Vios`, Year = `2020`, Plate = `ABC 123`, Color = `White`
3. Save

**Expected:** Vehicle info saved. Fields persist when navigating away and returning to Profile. 📸

---

### TC-10.3 — Vehicle Info Stored in Firestore 🔥
**Setup:** TC-10.2 passed.

**Steps:**
1. Firestore Console → `users/{userAUid}`

**Expected:** `vehicle` object present with `make`, `model`, `year`, `plateNumber`, `color`.

---

### TC-10.4 — Edit Full Name 🤖
**Steps:**
1. Log in as User A, navigate to `/profile`
2. Edit Full Name to `Test Driver Updated`
3. Save

**Expected:** New name saved and displayed. Reflected in trip cards on subsequent loads.

---

### TC-10.5 — Mobile Number Format 🤖
**Steps:**
1. Log in as User A, navigate to `/profile`
2. Observe Mobile Number display

**Expected:** Mobile shown in `+63XXXXXXXXXX` format. Not editable as a raw 11-digit number without the +63 prefix.

---

### TC-10.6 — Cannot Edit Another User's Profile 🤖
**Steps:**
1. Log in as User B
2. Attempt to navigate to `/profile` for User A's UID (if direct URL is exposed)

**Expected:** Not possible or redirected to User B's own profile. No cross-user profile editing allowed.

---

### TC-10.7 — Trip Count Shows Correctly 🤖
**Setup:** TC-13.2 must have passed (User A has completed at least 1 trip, `tripCount` = 1).

**Steps:**
1. Log in as User A, navigate to `/profile`

**Expected:** Trip count shows 1 (or higher). Does NOT show "New member" threshold label anymore (resolved: threshold is `> 0`). 📸

---

### TC-10.8 — Vehicle Info Optional 🤖
**Steps:**
1. Log in as User B, navigate to `/profile`
2. Leave all vehicle fields empty

**Expected:** Profile saves without vehicle info. No validation errors. No crash.

---

### TC-10.9 — deleteAt Extended on Login 🔥
**Steps:**
1. Note User A's current `deleteAt` value in Firestore
2. Log out User A, wait 30 seconds, log back in
3. Recheck `deleteAt`

**Expected:** `deleteAt` has been updated to approximately 90 days from the new login time. `lastActiveAt` also updated.

---

### TC-10.10 — Name Reflects in Trip Cards 🤖
**Setup:** TC-10.4 passed (User A's name changed to "Test Driver Updated").

**Steps:**
1. Log in as User B, view the trip list

**Expected:** User A's trip cards now show "Test Driver Updated" as the driver name.

---

## GROUP 11 — Firestore Rules

> All TC-11.x verify that Firestore rules enforce security boundaries. Tests use browser console SDK calls or Playwright direct writes.

### TC-11.1 — Cannot Write to Another User's Doc 🤖 🔥
**Steps:**
1. Log in as User B
2. In browser console, attempt:
```javascript
await updateDoc(doc(db, 'users', USER_A_UID), { fullName: 'Hacked' });
```

**Expected:** Permission denied. User A's name unchanged in Firestore.

---

### TC-11.2 — Cannot Update Own tripCount Directly 🤖
**Steps:**
1. Log in as User A
2. In browser console, attempt:
```javascript
await updateDoc(doc(db, 'users', USER_A_UID), { tripCount: 9999 });
```

**Expected:** Permission denied — `tripCount` is only incremented server-side via the trip completion flow. (Note: current rules allow `update: if isOwner` — if this passes, it is a known rule gap to address.)

---

### TC-11.3 — Cannot Post a Trip as Another Driver 🤖
**Steps:**
1. Log in as User B
2. In browser console, attempt to create a trip with `driverUid` = User A's UID

**Expected:** Permission denied — `allow create` requires `request.resource.data.driverUid == request.auth.uid`.

---

### TC-11.4 — Unauthenticated User Cannot Read Users Collection 🤖
**Steps:**
1. Incognito context (no auth)
2. Attempt to read any user doc via Firestore SDK

**Expected:** Permission denied — `allow read: if isSignedIn()`.

---

### TC-11.5 — Safety Links Publicly Readable 🤖
**Steps:**
1. Incognito context (no auth)
2. Navigate to a valid safety card URL

**Expected:** Page loads and displays safety data — `allow read: if true` confirmed working.

---

### TC-11.6 — Manifests Publicly Readable 🤖
**Steps:**
1. Incognito context (no auth)
2. Navigate to a valid manifest URL

**Expected:** Manifest page renders — `allow read: if true` confirmed working.

---

### TC-11.7 — Safety Link Cannot Be Updated by Non-Creator 🤖
**Steps:**
1. Log in as User C (not the generator of an existing safety link)
2. In browser console, attempt to update a `safety_links` doc generated by User B

**Expected:** Permission denied — `allow update: if resource.data.generatedBy == request.auth.uid` rejects User C.

---

### TC-11.8 — Unauthenticated User Cannot Post Trips 🤖
**Steps:**
1. Incognito context (no auth)
2. Attempt to write to `trips` collection via Firestore SDK

**Expected:** Permission denied.

---

### TC-11.9 — Non-Driver Cannot Delete Another User's Trip 🤖 🔥
**Steps:**
1. Log in as User B
2. Attempt to delete a trip that belongs to User A

**Expected:** Permission denied. Trip still exists in Firestore.

---

### TC-11.10 — Passenger Cannot Update Trip's filledSeats Directly 🤖
**Steps:**
1. Log in as User B
2. In browser console, attempt:
```javascript
await updateDoc(doc(db, 'trips', 'TRIP_ID'), { filledSeats: 0 });
```

**Expected:** Either permission denied OR the update silently fails. `filledSeats` must only change via the atomic join transaction.

---

### TC-11.11 — Manifest Cannot Be Updated by Non-Creator 🤖
**Steps:**
1. Log in as User B (not the generator of an existing manifest)
2. In browser console, attempt to update a `manifests` doc generated by User A

**Expected:** Permission denied — `resource.data.generatedBy == request.auth.uid` rejects User B.

---

### TC-11.12 — Safety Link Cannot Be Deleted 🤖
**Steps:**
1. Log in as User B
2. Attempt to delete their own safety link doc via Firestore SDK

**Expected:** Permission denied — `allow delete: if false` on `safety_links`.

---

## GROUP 12 — Data Integrity

> All TC-12.x verified directly in Firebase Console unless noted.

### TC-12.1 — User Doc deleteAt Is ~90 Days from createdAt 🔥
**Steps:**
1. Open any user doc in Firestore
2. Compare `createdAt` and `deleteAt`

**Expected:** `deleteAt` ≈ `createdAt` + 90 days (within a few minutes tolerance).

---

### TC-12.2 — Trip Doc Has deleteAt Set 🔥
**Steps:**
1. Open a trip doc in Firestore
2. Check `deleteAt` field

**Expected:** `deleteAt` timestamp is present and set to ~90 days from `createdAt`.

---

### TC-12.3 — Safety Link expiresAt Is 48 Hours After Departure 🔥
**Steps:**
1. Open a `safety_links` doc
2. Compare `trip.departureTime` and `expiresAt`

**Expected:** `expiresAt` = `departureTime` + exactly 48 hours.

---

### TC-12.4 — Safety Link deleteAt Is ~90 Days 🔥
**Steps:**
1. Open a `safety_links` doc
2. Check `deleteAt`

**Expected:** ~90 days from trip departure or creation date. Present and populated.

---

### TC-12.5 — Passenger Subcollection Doc Has Required Fields 🔥
**Steps:**
1. Firestore → `trips/{tripId}/passengers/{passengerId}`

**Expected:** `uid` matches passenger's Firebase Auth UID. `status` = "confirmed". `joinedAt` timestamp present. `fullName` present (denormalized).

---

### TC-12.6 — filledSeats Matches Subcollection Count 🔥
**Steps:**
1. Open a trip with exactly 1 passenger
2. Check `filledSeats` on trip doc
3. Count docs in `trips/{tripId}/passengers`

**Expected:** `filledSeats` count matches the actual number of passenger documents.

---

### TC-12.7 — consentVersion Present on All User Docs 🔥
**Steps:**
1. Open User A, B, C, and G docs in Firestore
2. Check `consentVersion` and `consentAcceptedAt` on each

**Expected:** All 4 docs have both fields set. No nulls or missing values.

---

### TC-12.8 — Manifest Doc Has Required Fields 🔥
**Setup:** TC-9.1 passed.

**Steps:**
1. Firestore → `manifests/{tripId}`

**Expected:** Fields present: `generatedBy`, `driver.fullName`, `driver.vehicle` (if set), `trip.origin`, `trip.destination`, `trip.departureTime`, `passengers` (array), `communityName`, `generatedAt`, `expiresAt`.

---

### TC-12.9 — Safety Link Doc ID Uses Per-Participant Format 🔥
**Setup:** TC-8.2 passed (User B generated a safety link).

**Steps:**
1. Firestore → `safety_links`
2. Inspect the document ID for the safety link generated by User B

**Expected:** Document ID = `{tripId}_{userBUid}` — NOT just `{tripId}`. Two participants generating links for the same trip each produce separate documents.

---

### TC-12.10 — Exchange Photo Fields Present on Passenger Doc (if uploaded) 🔥
**Setup:** TC-15.3 passed (User B has uploaded at least one exchange photo).

**Steps:**
1. Firestore → `trips/{tripId}/passengers/{userBUid}`

**Expected:** At least one of `facePhotoUrl`, `idPhotoUrl`, `platePhotoUrl` contains a Cloudinary URL string. `boardPhotoUrl` present if driver has scanned User B.

---

## GROUP 13 — Trip Lifecycle

### TC-13.1 — Start Trip Changes Status to Ongoing 🤖 🔥
**Setup:** TC-7.2 passed (User B has joined User A's trip). Trip is `status: 'open'` or `'full'`.

**Steps:**
1. Log in as User A, open the trip
2. Tap "Start Trip"
3. Observe toast and button state

**Expected:** Toast shown: "Trip started!" Trip `status` in Firestore changes to `'ongoing'`. "Start Trip" button replaced by "Mark trip as completed". 📸

---

### TC-13.2 — Complete Trip Changes Status and Increments tripCount 🤖 🔥
**Setup:** TC-13.1 passed. Trip is `status: 'ongoing'`.

**Steps:**
1. Log in as User A, open the ongoing trip
2. Tap "Mark trip as completed"
3. Check Firestore for trip status and User A's `tripCount`

**Expected:** Toast shown: "Trip completed!" Trip `status` = `'completed'` in Firestore. User A's `tripCount` incremented by 1. 📸

---

### TC-13.3 — Non-Driver Cannot Start Trip 🤖
**Steps:**
1. Log in as User B (confirmed passenger), open the trip
2. Look for "Start Trip" button

**Expected:** "Start Trip" button is not visible to User B. Trip can only be started by the driver (User A).

---

### TC-13.4 — Non-Driver Cannot Complete Trip 🤖
**Steps:**
1. Log in as User B, open an ongoing trip
2. Look for "Mark trip as completed" button

**Expected:** "Mark trip as completed" not visible to User B.

---

### TC-13.5 — Manifest and Safety Card Buttons Appear After Start Trip 🤖
**Setup:** TC-13.1 passed.

**Steps:**
1. Log in as User A, open the ongoing trip
2. Log in as User B, open the same trip

**Expected:** "View Manifest" and "Share Manifest" buttons visible for both driver and confirmed passenger. Safety link share button still visible. 📸

---

### TC-13.6 — Manifest and Safety Card Buttons Still Visible on Completed Trip 🤖
**Setup:** TC-13.2 passed.

**Steps:**
1. Log in as User A, open the completed trip

**Expected:** "View Manifest" and "Share Manifest" still present. Safety card share still accessible.

---

### TC-13.7 — tripCount Only Increments on Complete, Not Cancel 🤖 🔥
**Steps:**
1. Log in as User A, note current `tripCount`
2. Post a trip → cancel it
3. Check `tripCount` in Firestore

**Expected:** `tripCount` unchanged after cancellation. Only `Complete Trip` increments the count.

---

### TC-13.8 — Trip Status Progression Is One-Way 🤖
**Steps:**
1. Start a trip (status → ongoing)
2. Complete the trip (status → completed)
3. Attempt to restart the trip or change status back to open

**Expected:** No UI affordance to go backwards. Trip remains `completed`. Any direct Firestore write attempt should fail or be blocked by client logic.

---

### TC-13.9 — Ongoing Trip Visible to All Signed-In Users on Dashboard 🤖
**Setup:** TC-13.1 passed.

**Steps:**
1. Log in as User C (not on the trip), view dashboard

**Expected:** User A's ongoing trip is still visible in the trip list with a "Full — Ongoing" or similar badge. Non-participants can see it exists but cannot join.

---

### TC-13.10 — Completed Trip Disappears from Open Trips List 🤖
**Setup:** TC-13.2 passed.

**Steps:**
1. Log in as User C, view the open trips list on dashboard

**Expected:** The completed trip no longer appears in the browsable open trips list. It may still be visible in User A's or User B's "My Trips" section.

---

## GROUP 14 — Contact Numbers

### TC-14.1 — Driver Mobile Visible to Joined Passenger 🤖
**Setup:** User B has joined User A's trip (TC-7.2).

**Steps:**
1. Log in as User B, open the trip detail

**Expected:** User A's mobile number visible as a tappable `tel:` link with a 📞 icon. Format: `+63XXXXXXXXXX`. 📸

---

### TC-14.2 — Driver Mobile NOT Visible Before Joining 🤖
**Steps:**
1. Log in as User B (not yet joined a second trip posted by User A)
2. Open the trip detail without joining

**Expected:** Driver mobile number is NOT shown anywhere on the trip detail page before joining.

---

### TC-14.3 — Passenger Mobile Visible to Driver 🤖
**Setup:** User B has joined User A's trip (TC-7.2).

**Steps:**
1. Log in as User A, open the trip detail
2. View the passenger list

**Expected:** User B's mobile number visible in the passenger list as a tappable `tel:` link. 📸

---

### TC-14.4 — Mobile Number Not Visible to Non-Participants 🤖
**Steps:**
1. Log in as User C (not on the trip)
2. Navigate to the trip detail URL directly

**Expected:** No mobile numbers visible anywhere on the trip detail page. Contact info is only shown to participants.

---

### TC-14.5 — Driver Mobile Appears in Real-time After Join 🤖
**Setup:** Two Playwright browser contexts.

**Steps:**
1. Context 1: Log in as User B — open trip detail (not yet joined)
2. Context 2: Log in as User B's session — trigger join
3. Observe Context 1

**Expected:** Driver mobile number appears without page reload once `isJoinedPassenger` becomes true.

---

### TC-14.6 — Mobile Number Format is +63 Prefix 🤖
**Steps:**
1. Log in as User B, view driver mobile on a joined trip

**Expected:** Number displayed as `+639XXXXXXXXX` not `09XXXXXXXXX`. The `+63` prefix was added at signup.

---

## GROUP 15 — Exchange Photos

> ⚠️ Photo capture tests require **manual interaction (👤)** for camera-based capture. Cloudinary upload tests can be partially automated by simulating file input.

### TC-15.1 — Exchange Section Visible to Joined Passenger Only 🤖
**Setup:** User A has an open trip within 2 hours of departure. User B has joined. User C has not joined.

**Steps:**
1. Log in as User B (joined passenger), open the trip detail
2. Log in as User A (driver), open the same trip detail
3. Log in as User C (non-participant), open the trip detail

**Expected:**
- User B: Exchange photo section (face/ID/plate slots) visible with capture buttons
- User A: Exchange photo section NOT visible in passenger form — driver sees Scan buttons in passenger list instead
- User C: No exchange photo section at all 📸

---

### TC-15.2 — Exchange Section Only Shown Within 2 Hours of Departure 🤖
**Steps:**
1. Log in as User B, open a joined trip with departure time > 2 hours away

**Expected:** Exchange photo section NOT visible. Section only appears when `trip.status === 'open' && isWithinTwoHours(trip.departureTime)`.

---

### TC-15.3 — Passenger Can Upload Face Photo 👤
**Steps:**
1. Log in as User B, open a trip where exchange section is visible
2. Tap the face photo button
3. Select an image from device
4. Confirm preview modal → tap "Confirm"

**Expected:** Photo uploads to Cloudinary. Button replaced by a locked thumbnail with a green checkmark overlay. URL saved to `trips/{tripId}/passengers/{userBUid}.facePhotoUrl` in Firestore. 📸

---

### TC-15.4 — Confirm-Before-Upload Modal Appears 👤
**Steps:**
1. Tap any exchange photo button (face, ID, or plate)
2. Select an image

**Expected:** Preview modal appears showing the selected image with "Confirm" and "Retake" buttons. No upload happens until "Confirm" is tapped.

---

### TC-15.5 — Retake Clears Preview Without Uploading 👤
**Steps:**
1. Tap a photo button, select an image, when preview modal appears tap "Retake"

**Expected:** Modal closes. No upload occurred. Photo slot remains unchanged. Camera/file picker can be reopened.

---

### TC-15.6 — Uploaded Photo is Locked (Cannot Be Changed) 🤖
**Setup:** TC-15.3 passed (User B has uploaded a face photo).

**Steps:**
1. Log in as User B, return to the exchange section

**Expected:** Face photo slot shows thumbnail + green checkmark. The capture button is disabled/replaced. Tapping does nothing — photo cannot be changed after confirmation.

---

### TC-15.7 — Driver Scan Button Visible in Passenger List 🤖
**Setup:** User A's trip has User B as a confirmed passenger.

**Steps:**
1. Log in as User A, open the trip detail
2. View the passenger list section

**Expected:** A "Scan" button (or camera icon) visible next to User B's name in the passenger list. 📸

---

### TC-15.8 — Driver Scan Uploads and Shows Thumbnail 👤
**Steps:**
1. Log in as User A, open the trip detail
2. Tap the Scan button next to User B
3. Select or capture an image, confirm

**Expected:** Image uploads to Cloudinary. Scan button replaced by a 56×56 thumbnail with a green checkmark overlay — locked, same pattern as passenger exchange photos. URL saved to `trips/{tripId}/passengers/{userBUid}.boardPhotoUrl` in Firestore. 📸

---

### TC-15.9 — Passenger Sees Driver's Boarding Scan of Them 🤖
**Setup:** TC-15.8 passed (driver has scanned User B).

**Steps:**
1. Log in as User B, open the trip detail
2. Scroll below the exchange photo slots

**Expected:** A read-only section labeled "Driver's boarding scan of you" is visible showing the thumbnail uploaded by User A. User B cannot delete or modify it. 📸

---

### TC-15.10 — Driver Sees Passenger's Exchange Photos of Them 🤖
**Setup:** TC-15.3 passed (User B has uploaded face photo and/or ID/plate).

**Steps:**
1. Log in as User A, open the trip detail
2. View User B's entry in the passenger list (below the Scan thumbnail)

**Expected:** Small read-only section labeled "Photos this passenger took of you" shows User B's uploaded exchange photos (face, ID, plate) with labels. Only photos with non-null URLs are shown. 📸

---

### TC-15.11 — Exchange Photos Stored in Cloudinary Root Folder 🔥
**Setup:** TC-15.3 passed.

**Steps:**
1. Log into Cloudinary Console → Media Library → `community-ride` folder (root)
2. Look for the uploaded photo asset

**Expected:** Photo exists in `community-ride` root folder, NOT in a subfolder like `community-ride/exchange/{tripId}`. Unsigned preset used — no API key in app.

---

### TC-15.12 — ID Photo Slot Works Independently 👤
**Steps:**
1. Log in as User B, open trip exchange section
2. Upload only the ID photo (skip face and plate)

**Expected:** Only ID photo slot shows uploaded thumbnail. Face and plate slots remain uncaptured. Each slot is independent.

---

### TC-15.13 — Plate Photo Slot Works Independently 👤
**Steps:**
1. Log in as User B, upload only the plate photo

**Expected:** Only plate photo slot shows thumbnail. Independent of face and ID slots.

---

### TC-15.14 — Exchange Section Not Shown to Driver (Regression Check) 🤖
**Steps:**
1. Log in as User A, open their own posted trip within 2 hours of departure

**Expected:** The face/ID/plate photo slots ("Take a photo of the driver") are NOT shown to User A. The driver's safety participation is the Scan buttons in the passenger list — not the exchange slots. This is the Addendum E design decision.

---

### TC-15.15 — Exchange Photos Survive Safety Link Generation 🔥
**Setup:** TC-15.3 and TC-8.1 both passed.

**Steps:**
1. After User B has uploaded exchange photos, generate a new safety card
2. Firestore → `safety_links/{tripId}_{userBUid}`
3. Check `passengers` array entry for User B

**Expected:** `facePhotoUrl`, `idPhotoUrl`, `platePhotoUrl`, and `boardScanUrl` (if driver has scanned) are present in the passenger entry within the safety link doc's `passengers` array.

---

## GROUP 16 — Safety Card (Photos & Per-Participant Key)

### TC-16.1 — Driver Generates Their Own Safety Link 🤖
**Setup:** User A is the driver of a trip. User B has joined.

**Steps:**
1. Log in as User A, open the trip detail
2. Tap the safety link share button

**Expected:** Safety link generated with doc ID = `{tripId}_{userAUid}`. URL contains `{tripId}_{userAUid}`. Driver can generate their own card distinct from User B's card.

---

### TC-16.2 — Driver and Passenger Have Separate Safety Link Docs 🔥
**Setup:** TC-8.1 (User B generated) and TC-16.1 (User A generated) both passed.

**Steps:**
1. Firestore → `safety_links`

**Expected:** Two separate documents exist: `{tripId}_{userAUid}` and `{tripId}_{userBUid}`. Each has `generatedBy` matching its respective creator.

---

### TC-16.3 — Both Safety Cards Show Identical Trip Content 🤖
**Steps:**
1. Open User A's safety card URL in incognito
2. Open User B's safety card URL in incognito
3. Compare the displayed content

**Expected:** Both cards show the same driver name, vehicle, route, departure time, and passenger list. Content does not differ based on who generated the card — only `generatedBy` differs internally.

---

### TC-16.4 — Safety Card Shows Passenger Exchange Photos 🤖
**Setup:** TC-15.3 passed (User B has uploaded at least one exchange photo). Safety link generated after the upload.

**Steps:**
1. Open the safety card URL in incognito

**Expected:** "Safety Verification Photos" section visible. User B's entry shows their uploaded exchange photo(s) with labels (Face, ID, Plate). 📸

---

### TC-16.5 — Safety Card Shows Driver's Boarding Scan Per Passenger 🤖
**Setup:** TC-15.8 passed (driver has scanned User B).

**Steps:**
1. Open the safety card URL in incognito
2. Find User B's photo section

**Expected:** User B's section includes a "Boarding Scan" thumbnail — the photo the driver took of User B when they boarded. Labeled "Boarding Scan". 📸

---

### TC-16.6 — Safety Card Photo Layout: One Section Per Passenger 🤖
**Setup:** Multiple passengers with different photo sets (some with all photos, some with partial).

**Steps:**
1. Open the safety card URL in incognito

**Expected:** Photos section is organized one block per passenger, each headed by the passenger's full name. Photos show only for slots that have a non-null URL — empty slots are silently skipped. Passenger with zero photos has no section at all. 📸

---

### TC-16.7 — Safety Card: Photo Labels Match Addendum E Spec 🤖
**Steps:**
1. On the public safety card, inspect the photo labels below each thumbnail

**Expected:** Labels are: "Face", "ID", "Plate", "Boarding Scan". Section header text: "SAFETY VERIFICATION PHOTOS" in uppercase with small tracking. Footer note: "Shared for trip safety. Deleted 24 hours after departure." 📸

---

### TC-16.8 — Safety Card Accessible Without Login (Post-Photo Redesign) 🤖
**Steps:**
1. Copy any safety card URL
2. Open in fresh incognito context

**Expected:** Full page renders without auth. Photos section visible if photos were uploaded. No auth wall.

---

### TC-16.9 — Regenerating Safety Card Overwrites With Latest Photos 🤖
**Setup:** User B has already generated a safety card before uploading photos. They now upload a face photo and regenerate.

**Steps:**
1. User B generates safety card (no photos yet)
2. User B uploads face photo (TC-15.3)
3. User B generates safety card again (taps share button again)
4. Open the new safety card URL

**Expected:** New card reflects the face photo. `setDoc` with `merge: false` overwrites the previous doc, not merges it. Doc key `{tripId}_{userBUid}` is the same — doc is replaced.

---

### TC-16.10 — Safety Link Copy Icon Resets After 2 Seconds 🤖
**Steps:**
1. Log in as User B, generate a safety card
2. Tap the copy icon on the safety link URL
3. Observe the icon state

**Expected:** Icon changes to a "copied" state (checkmark or green color) immediately, then resets to the copy icon after approximately 2 seconds. Does not stay in copied state permanently.

---

## Test Results Summary

Fill in after each run. Status: `PASS` / `FAIL` / `SKIP` / `BLOCKED`

| TC | Description | Method | Status | Notes |
|---|---|---|---|---|
| 1.1 | Signup User A | 🤖 | | |
| 1.2 | Firestore doc created on signup | 🔥 | | |
| 1.3 | Signup User B | 🤖 | | |
| 1.4 | Signup User C | 🤖 | | |
| 1.5 | Duplicate email rejected | 🤖 | | |
| 1.6 | Consent checkbox required | 🤖 | | |
| 1.7 | Short password rejected | 🤖 | | |
| 1.8 | Invalid email format | 🤖 | | |
| 1.9 | Empty name rejected | 🤖 | | |
| 1.10 | Google button on signup | 🤖 | | |
| 2.1 | Login User A | 🤖 | | |
| 2.2 | Google button on login | 🤖 | | |
| 2.3 | Wrong password | 🤖 | | |
| 2.4 | Unregistered email | 🤖 | | |
| 2.5 | Empty login fields | 🤖 | | |
| 2.6 | Logout | 🤖 | | |
| 2.7 | Dashboard redirect when unauth | 🤖 | | |
| 2.8 | All protected routes redirect | 🤖 | | |
| 3.1 | Google SSO new user | 👤 | | |
| 3.2 | Google SSO Firestore doc | 🔥 | | |
| 3.3 | Google SSO returning user | 👤 | | |
| 3.4 | Google SSO from login page | 👤 | | |
| 3.5 | Complete profile mobile required | 👤 | | |
| 3.6 | Complete profile consent required | 👤 | | |
| 4.1 | Forgot password link present | 🤖 | | |
| 4.2 | Reset email sent | 🤖 👤 | | |
| 4.3 | Reset unregistered email | 🤖 | | |
| 4.4 | Reset invalid format | 🤖 | | |
| 4.5 | Reset empty field | 🤖 | | |
| 5.1 | Dashboard loads | 🤖 | | |
| 5.2 | Dashboard empty state | 🤖 | | |
| 5.3 | Dashboard shows open trips | 🤖 | | |
| 5.4 | Real-time trip updates | 🤖 | | |
| 5.5 | Bottom nav tabs | 🤖 | | |
| 5.6 | Dashboard shows joined trip | 🤖 | | |
| 5.7 | Trips sorted by departure | 🤖 | | |
| 5.8 | Ongoing trip yellow card | 🤖 | | |
| 5.9 | Full trip shows Full badge | 🤖 | | |
| 5.10 | Ongoing passenger sees disabled join | 🤖 | | |
| 6.1 | Post valid trip | 🤖 | | |
| 6.2 | Trip in Firestore | 🔥 | | |
| 6.3 | Missing destination | 🤖 | | |
| 6.4 | Missing departure time | 🤖 | | |
| 6.5 | Missing pickup point | 🤖 | | |
| 6.6 | Gas contribution optional | 🤖 | | |
| 6.7 | Off-peak warning shown | 🤖 | | |
| 6.8 | Peak hours no warning | 🤖 | | |
| 6.9 | Seats min = 1 | 🤖 | | |
| 6.10 | Seats max = 4 | 🤖 | | |
| 6.11 | Driver sees own trip | 🤖 | | |
| 6.12 | Cancel own trip | 🤖 | | |
| 6.13 | Cancelled trip doesn't count toward limit | 🤖 | | |
| 6.14 | Driver blocked while trip ongoing | 🤖 | | |
| 6.15 | Two-trip daily limit enforced | 🤖 | | |
| 7.1 | View trip detail | 🤖 | | |
| 7.2 | Join trip | 🤖 | | |
| 7.3 | Seat count in Firestore | 🔥 | | |
| 7.4 | Passenger subcollection created | 🔥 | | |
| 7.5 | Driver sees passenger | 🤖 | | |
| 7.6 | Cannot join own trip | 🤖 | | |
| 7.7 | Cancel seat | 🤖 | | |
| 7.8 | Real-time passenger list | 🤖 | | |
| 7.9 | Full trip cannot be joined | 🤖 | | |
| 7.10 | Share driver info button visible | 🤖 | | |
| 7.11 | Duplicate join prevented | 🤖 | | |
| 7.12 | Passenger blocked while ongoing | 🤖 | | |
| 8.1 | Generate safety card link | 🤖 | | |
| 8.2 | Safety link in Firestore | 🔥 | | |
| 8.3 | Safety card no-auth access | 🤖 | | |
| 8.4 | Safety card driver name correct | 🤖 | | |
| 8.5 | Safety card route correct | 🤖 | | |
| 8.6 | Safety card departure time | 🤖 | | |
| 8.7 | Safety card vehicle info | 🤖 | | |
| 8.8 | expiresAt = departure + 48h | 🔥 | | |
| 8.9 | Expired link shows message | 🤖 | | |
| 8.10 | Non-participant cannot generate | 🤖 | | |
| 9.1 | Manifest auto-generated on Start Trip | 🤖 🔥 | | |
| 9.2 | View Manifest button appears | 🤖 | | |
| 9.3 | Share Manifest button appears | 🤖 | | |
| 9.4 | View Manifest opens public page | 🤖 | | |
| 9.5 | Manifest no-auth access | 🤖 | | |
| 9.6 | Manifest driver and vehicle info | 🤖 | | |
| 9.7 | Manifest passenger list | 🤖 | | |
| 9.8 | Share Manifest Web Share API | 👤 | | |
| 9.9 | Share Manifest clipboard fallback | 🤖 | | |
| 9.10 | Manifest on completed trip | 🤖 | | |
| 10.1 | View profile | 🤖 | | |
| 10.2 | Add vehicle info | 🤖 | | |
| 10.3 | Vehicle in Firestore | 🔥 | | |
| 10.4 | Edit full name | 🤖 | | |
| 10.5 | Mobile number format | 🤖 | | |
| 10.6 | Cannot edit other user's profile | 🤖 | | |
| 10.7 | Trip count shows correctly | 🤖 | | |
| 10.8 | Vehicle info optional | 🤖 | | |
| 10.9 | deleteAt extended on login | 🔥 | | |
| 10.10 | Name reflects in trip cards | 🤖 | | |
| 11.1 | Cannot write other user's doc | 🤖 🔥 | | |
| 11.2 | Cannot update own tripCount | 🤖 | | |
| 11.3 | Cannot post trip as other driver | 🤖 | | |
| 11.4 | Unauth cannot read users | 🤖 | | |
| 11.5 | Safety links publicly readable | 🤖 | | |
| 11.6 | Manifests publicly readable | 🤖 | | |
| 11.7 | Safety link immutable by non-creator | 🤖 | | |
| 11.8 | Unauth cannot post trips | 🤖 | | |
| 11.9 | Non-driver cannot delete trip | 🤖 🔥 | | |
| 11.10 | Passenger cannot update filledSeats | 🤖 | | |
| 11.11 | Manifest immutable by non-creator | 🤖 | | |
| 11.12 | Safety link cannot be deleted | 🤖 | | |
| 12.1 | User deleteAt ~90 days | 🔥 | | |
| 12.2 | Trip deleteAt set | 🔥 | | |
| 12.3 | Safety link expiresAt = dep + 48h | 🔥 | | |
| 12.4 | Safety link deleteAt ~90 days | 🔥 | | |
| 12.5 | Passenger doc has required fields | 🔥 | | |
| 12.6 | filledSeats matches subcollection | 🔥 | | |
| 12.7 | consentVersion on all user docs | 🔥 | | |
| 12.8 | Manifest doc has required fields | 🔥 | | |
| 12.9 | Safety link doc ID uses per-participant format | 🔥 | | |
| 12.10 | Exchange photo fields on passenger doc | 🔥 | | |
| 13.1 | Start Trip → ongoing | 🤖 🔥 | | |
| 13.2 | Complete Trip → completed + tripCount | 🤖 🔥 | | |
| 13.3 | Non-driver cannot start trip | 🤖 | | |
| 13.4 | Non-driver cannot complete trip | 🤖 | | |
| 13.5 | Manifest + safety buttons after start | 🤖 | | |
| 13.6 | Manifest + safety buttons on completed | 🤖 | | |
| 13.7 | tripCount only increments on complete | 🤖 🔥 | | |
| 13.8 | Trip status one-way | 🤖 | | |
| 13.9 | Ongoing trip visible to all users | 🤖 | | |
| 13.10 | Completed trip off open list | 🤖 | | |
| 14.1 | Driver mobile visible to joined passenger | 🤖 | | |
| 14.2 | Driver mobile hidden before joining | 🤖 | | |
| 14.3 | Passenger mobile visible to driver | 🤖 | | |
| 14.4 | Mobile not visible to non-participants | 🤖 | | |
| 14.5 | Driver mobile appears in real-time after join | 🤖 | | |
| 14.6 | Mobile format +63 prefix | 🤖 | | |
| 15.1 | Exchange section visible to joined passenger only | 🤖 | | |
| 15.2 | Exchange section only within 2hrs of departure | 🤖 | | |
| 15.3 | Passenger uploads face photo | 👤 | | |
| 15.4 | Confirm-before-upload modal appears | 👤 | | |
| 15.5 | Retake clears preview without uploading | 👤 | | |
| 15.6 | Uploaded photo is locked | 🤖 | | |
| 15.7 | Driver Scan button in passenger list | 🤖 | | |
| 15.8 | Driver scan uploads and shows thumbnail | 👤 | | |
| 15.9 | Passenger sees driver's scan of them | 🤖 | | |
| 15.10 | Driver sees passenger's exchange photos | 🤖 | | |
| 15.11 | Photos in Cloudinary root folder | 🔥 | | |
| 15.12 | ID photo slot independent | 👤 | | |
| 15.13 | Plate photo slot independent | 👤 | | |
| 15.14 | Exchange section not shown to driver (regression) | 🤖 | | |
| 15.15 | Exchange photos survive safety link generation | 🔥 | | |
| 16.1 | Driver generates their own safety link | 🤖 | | |
| 16.2 | Driver and passenger have separate safety link docs | 🔥 | | |
| 16.3 | Both safety cards show identical trip content | 🤖 | | |
| 16.4 | Safety card shows exchange photos | 🤖 | | |
| 16.5 | Safety card shows driver's boarding scan | 🤖 | | |
| 16.6 | Photo layout one section per passenger | 🤖 | | |
| 16.7 | Photo labels match spec | 🤖 | | |
| 16.8 | Safety card no-auth (post-photo redesign) | 🤖 | | |
| 16.9 | Regenerating card overwrites with latest photos | 🤖 | | |
| 16.10 | Copy icon resets after 2 seconds | 🤖 | | |

---

## Known Limitations — Out of Scope

- Push notifications (FCM token + foreground messages) — deferred
- LTFRB QR permit photo upload on Profile — deferred
- Re-consent modal on policy version change — deferred
- Offline mode / Firestore offline cache — deferred
- Mutual star ratings after trip completion — permanently cut (Addendum C)
- Admin panel — permanently cut (Addendum B/C)
- Google SSO full automation (OAuth popup requires manual interaction)
- "📞 Contact after joining" hint on TripCard — pending next session
- Separate Firebase test project for Playwright — pending infrastructure setup (recommended before any automated run to isolate test traffic from free-tier quota)

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | April 2026 | Initial 37-case playbook |
| 2.0 | April 2026 | Expanded to 103 cases — Playwright automation, Firestore rules, data integrity, multi-context real-time, security boundaries |
| 3.0 | April 10, 2026 | Full rewrite — 139 cases. Added trip lifecycle (Group 13), contact numbers (Group 14), exchange photos (Group 15), safety card photos/per-participant key (Group 16). Updated Groups 5, 6, 7, 8, 9, 10, 11, 12 to reflect Addendum D and E changes. Pre-test setup expanded with Cloudinary and quota checks. |

**Project:** Community Ride (Metrocor-B Homes)
**Author:** Ron Bernardo / Enata Digital
