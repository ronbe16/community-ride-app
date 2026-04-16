# Changelog

All notable changes to Community Ride are documented here.

Format: `[version] — Date — Summary`

---

## [1.0.4] — April 2026

**LTFRB Compliance Readiness**

- Added LTFRB permit number + QR photo upload to driver profile
- Added driver's license number and expiry to driver profile
- Added LTO OR/CR number to driver profile
- Added insurance provider and expiry to driver profile
- Vehicle age warning shown for vehicles older than 5 years
- LTFRB permit number and compliance docs now shown on passenger manifest
- LTFRB 🛂 badge shown on trip cards for permitted drivers
- LTFRB permit application link added to profile (pending official URL from circular)
- `isHoaMember: true` flag added to all user accounts (supports LTFRB eligibility list requirement)
- Manifest footer now shows "All passengers are verified members of [community name]"

---

## [1.0.3] — April 2026

**Profile hardening + Safety Card fixes**

- Fixed: Profile trip count was hardcoded — now reads actual `tripCount` from Firestore
- Fixed: Safety Card driver section showed hardcoded "New member" — now reads live trip count
- Added: Driver phone number shown on Safety Card as tappable link
- Added: Required field validation for Full name, Mobile number, Home address on profile
- Added: Required field validation for vehicle Make, Model, Year, Plate, Color (LTFRB permit remains optional)

---

## [1.0.2] — April 2026

**Safety exchange photo fixes**

- Fixed: Only the first passenger could take safety exchange photos — now all passengers have independent slots
- Fixed: Driver scanning a passenger caused safety card to become unavailable for others — `showExchange` now based on timing only
- Fixed: Driver trip count not updating on profile after trip completion
- Added: App version display

---

## [1.0.1] — April 2026

**Alpha testing fixes**

- Fixed: TC-11.2 — `tripCount` was directly writable by doc owner. Added Firestore rule to protect it.
- Fixed: Profile showed "New member" label even after trip completion — threshold corrected to `tripCount > 0`
- Fixed: Google SSO profile display bug
- Confirmed: Google SSO, Web Share API, camera photo tests all passing

---

## [1.0.0] — April 2026

**Initial release**

- Driver trip posting with route, departure time, available seats, gas contribution
- Passenger browse and join with one tap
- Trip lifecycle: Open → Ongoing → Completed
- Safety exchange photos: passengers photograph driver (face, ID, plate); driver scans each boarding passenger
- Trip Safety Card — shareable public link per participant (keyed by `{tripId}_{uid}`)
- Passenger Manifest — LTFRB-compliant shareable public link
- Google SSO + email/password authentication
- PWA installable on Android and iOS
- Cloudinary unsigned photo uploads
- Firestore TTL auto-delete: safety photos after 24 hours, trip data after 90 days
- Window-based Firestore listeners (5AM–10AM and 4PM–10PM PHT)
- 2-trip-per-day limit enforced at posting stage
- Web Share API with Viber/Messenger fallback
- LTFRB permit number field on driver profile

---

## Updating your fork

When a new version is released:

1. Go to your forked repo on GitHub
2. Click **Sync fork → Update branch**
3. Vercel auto-deploys after sync
4. For Lovable: re-import from GitHub or apply the patch manually

Check this CHANGELOG for any manual steps required (e.g. new Firestore fields to add in Firebase Console, new environment variables).
