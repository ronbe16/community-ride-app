# 🚗 Community Ride

> **Carpooling para sa komunidad. Safe. Simple. Libre.**

A free, open-source carpooling PWA for Philippine barangays and village communities. Built to comply with LTFRB's 2026 carpooling program.

**License:** MIT — fork it, deploy it, modify it freely. No attribution required.

---

## What it does

- **Drivers** post trips with their route, departure time, available seats, and gas contribution
- **Passengers** browse and join trips with one tap
- **Both sides** get shareable safety links — passengers share driver info with family; drivers get an LTFRB-compliant passenger manifest
- **Safety exchange** — passengers photograph the driver's face, ID, and plate; driver scans each boarding passenger
- Everything auto-deletes after 90 days. Safety photos after 24 hours.

No payment processing. No central server. No monthly cost. **Each community runs their own free Firebase instance.**

---

## Screenshots

> *(Add screenshots of Dashboard, TripDetail, SafetyCard, and Manifest here after first public deployment)*

---

## Tech Stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend | React 18 + TypeScript | Free |
| UI | shadcn/ui + Tailwind CSS | Free |
| Auth | Firebase Authentication | Free |
| Database | Firebase Firestore | Free (50K reads/day) |
| Photo storage | Cloudinary | Free (unsigned uploads) |
| Hosting | Lovable / Vercel / Netlify | Free |

**Firebase free tier is more than enough for a village.** At 100 active users doing 5 actions/day, you'll use ~1,500 reads/day — well under the 50K limit.

---

## Quick Start

If you just want to deploy this for your own community, go to **[SETUP.md](./SETUP.md)**.

It takes about 30 minutes and you don't need to write any code.

---

## LTFRB Compliance

Community Ride is built to support the LTFRB 2026 carpooling program:

| LTFRB Requirement | How the app handles it |
|---|---|
| Passenger manifest available on demand | ✅ Auto-generated shareable link per trip |
| Point-to-point only | ✅ Single origin + destination fields only |
| 2 trips per day limit | ✅ Enforced at the posting stage |
| Non-profit / cost-recovery model | ✅ "Gas contribution" label — no payment processing |
| Vehicle ≤ 5 years old | ✅ Warning shown for out-of-range vehicles |
| Special permit / QR code | ✅ LTFRB permit number + QR photo upload on driver profile |
| Driver eligibility | ✅ License number field on driver profile |

The app works fully without LTFRB permits — for informal HOA carpools that predate the formal program.

---

## For Developers

### Project Structure

```
/src
  /pages          — Dashboard, TripDetail, Profile, PostTrip, SafetyCard, Manifest
  /components     — TripCard, BottomNav, AppHeader, shared UI
  /contexts       — AuthContext (Firebase Auth + user profile)
  /hooks          — useTrips, useMyTrips, usePWAInstall
  /lib            — firebase.ts, cloudinary upload helpers
  /constants      — app.ts (version, changelog, config constants)
/public
  manifest.json   — PWA manifest
  icons/          — App icons
/firebase
  firestore.rules — Copy-paste into Firebase Console
```

### Local development

```bash
git clone https://github.com/[your-org]/community-ride
cd community-ride
cp .env.example .env.local
# Fill in your Firebase config in .env.local
npm install
npm run dev
```

### Environment variables

See `.env.example` for all required variables.

---

## Contributing

Bug reports and PRs welcome. If you're deploying for your own community and hit a problem, open an issue — it probably affects others too.

When the official LTFRB circular is published, update `LTFRB_PERMIT_URL` in `src/constants/app.ts` and submit a PR.

---

## License

MIT. Do whatever you want with it. If you fix a bug or add a feature, consider sending a PR so other communities benefit too.

---

*Built by [Enata Digital](https://enatadigital.com) · Quezon City, Philippines*
