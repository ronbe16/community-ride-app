# Community Ride — Setup Guide

> **For the tech-savvy nephew.** This guide takes about 30 minutes and requires no coding — just following steps.

You'll need:
- A **Google account** (for Firebase)
- A **GitHub account** (to fork the repo)
- A **Cloudinary account** (free — for photo storage)
- A **Lovable or Vercel account** (free — for hosting)

---

## Step 1 — Fork the repo

1. Go to `https://github.com/[org]/community-ride`
2. Click **Fork** (top right)
3. Choose your GitHub account
4. You now have your own copy of the code

---

## Step 2 — Create your Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name it: `community-ride-[your-village]` (e.g. `community-ride-sunshine-village`)
4. **Disable** Google Analytics — not needed
5. Click **Create project**

### Enable Authentication

1. Left sidebar → **Build → Authentication → Get started**
2. Under **Sign-in providers**, enable **Email/Password**
3. Also enable **Google** if you want Google sign-in (recommended)
4. Click **Save**

### Enable Firestore Database

1. Left sidebar → **Build → Firestore Database → Create database**
2. Choose **Start in production mode**
3. Select region: **asia-southeast1 (Singapore)** — closest to Philippines
4. Click **Enable**

### Apply Firestore security rules

1. In Firestore → click the **Rules** tab
2. Delete everything in the editor
3. Open the `firestore.rules` file from this repo
4. Copy the entire contents and paste it into the editor
5. Click **Publish**

### Set up TTL (auto-delete) policies

This makes old data delete itself automatically. Do this once — it runs forever.

1. Firestore → **Indexes** tab → **TTL policies**
2. Click **Add TTL policy** for each of these:

| Collection path | Field |
|---|---|
| `users` | `deleteAt` |
| `trips` | `deleteAt` |
| `safety_links` | `deleteAt` |
| `manifests` | `deleteAt` |
| `trips/{tripId}/passengers` (collection group) | `deleteAt` |

For the last one, use **Collection group** and enter `passengers` as the collection group ID.

### Enable Storage

1. Left sidebar → **Build → Storage → Get started**
2. Production mode → same region (asia-southeast1)
3. Click **Done**

### Get your Firebase config

1. Click the **gear icon** (top left) → **Project settings**
2. Scroll down to **Your apps** → click **Add app** → choose **Web** (`</>`)
3. Register with any nickname (e.g. "Community Ride Web")
4. Copy the `firebaseConfig` object — you'll need it in Step 4

---

## Step 3 — Set up Cloudinary (photo storage)

1. Go to [cloudinary.com](https://cloudinary.com) and create a free account
2. From the dashboard, note your **Cloud name**
3. Go to **Settings → Upload → Upload presets**
4. Click **Add upload preset**
5. Set:
   - Preset name: `community-ride`
   - Signing mode: **Unsigned**
   - Folder: `community-ride`
6. Click **Save**

---

## Step 4 — Set up your environment variables

In your forked repo, find the file called `.env.example`. You'll fill in these values:

```
VITE_FIREBASE_API_KEY=            ← from Firebase config (apiKey)
VITE_FIREBASE_AUTH_DOMAIN=        ← [your-project-id].firebaseapp.com
VITE_FIREBASE_PROJECT_ID=         ← your Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET=     ← [your-project-id].appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID= ← from Firebase config (messagingSenderId)
VITE_FIREBASE_APP_ID=             ← from Firebase config (appId)
VITE_CLOUDINARY_CLOUD_NAME=       ← your Cloudinary cloud name
VITE_CLOUDINARY_UPLOAD_PRESET=    community-ride
VITE_COMMUNITY_NAME=              ← Your community name, e.g. "Sunshine Village"
```

---

## Step 5 — Deploy

### Option A: Lovable (easiest)

If you're using Lovable to host:

1. In Lovable → **Settings → Environment Variables**
2. Add each variable from Step 4
3. Lovable auto-deploys. Your app is live at `[yourproject].lovable.app`

### Option B: Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your forked GitHub repo
3. Framework: **Vite** | Build command: `npm run build` | Output: `dist`
4. Add environment variables in Vercel → **Settings → Environment Variables**
5. Click **Deploy**
6. Your app is live at `[yourproject].vercel.app`

---

## Step 6 — Create your community config document

This tells the app your community's name and who the admin is.

1. In Firebase Console → **Firestore Database → Data**
2. Click **Start collection** → Collection ID: `community`
3. Document ID: `config`
4. Add these fields:

| Field | Type | Value |
|---|---|---|
| `name` | string | Your community name (e.g. "Sunshine Village") |
| `adminUids` | array | Leave empty for now — you'll add your UID in Step 7 |
| `ltfrbPermitRequired` | boolean | `false` |
| `maxTripsPerDay` | number | `2` |
| `vehicleMaxAgeYears` | number | `5` |

5. Click **Save**

---

## Step 7 — Set up the first admin account

The admin is the person who manages the community (HOA officer, barangay secretary, or trusted volunteer). They don't need to know anything technical — the admin panel is a simple web UI.

1. Open your deployed app URL
2. Sign up with the admin's email and password
3. After signing up, go to **Firebase Console → Authentication → Users**
4. Find the admin's account → copy their **UID** (the long string under "User UID")
5. Go to **Firestore → community → config**
6. Click on `adminUids` field → **Add item** → paste the UID
7. The admin account now has admin access immediately

---

## Step 8 — Share with your community

Your app is ready. Share the URL with your community via:

- **Viber group chat** — paste the URL with a short message
- **Facebook group** — post with a screenshot
- **Printed QR code** — generate a QR at [qr-code-generator.com](https://www.qr-code-generator.com) and post it on the bulletin board

**PWA install instructions to share with residents:**

*Android:*
Open the URL in Chrome → tap the three-dot menu → "Add to Home Screen" → tap "Add"

*iPhone:*
Open the URL in Safari → tap the Share button → "Add to Home Screen" → tap "Add"

---

## Customization

You can change these without touching any code:

| What | How |
|---|---|
| Community name | Change `VITE_COMMUNITY_NAME` in environment variables |
| App colors | Edit the primary color in `tailwind.config.js` |
| App icons | Replace files in `/public/icons/` |
| Footer text | Edit `SafetyCard.tsx` and `Manifest.tsx` |

---

## Staying up to date

When bug fixes or LTFRB compliance updates are released:

1. Go to your forked repo on GitHub
2. Click **Sync fork** → **Update branch**
3. If using Vercel: it auto-deploys after sync
4. If using Lovable: re-import from GitHub or apply the patch manually

---

## Getting help

- **Something broke?** Open an issue on GitHub with what happened and what you expected
- **LTFRB question?** See the LTFRB compliance section in `README.md`
- **Firebase quota exceeded?** See the Troubleshooting section below

---

## Troubleshooting

**"Firebase quota exceeded" error**
Your community is very active — that's great! At a typical HOA scale this shouldn't happen. If it does:
- Check Firebase Console → **Usage and billing** for which operation is spiking
- Most common cause: a browser tab left open all day re-reading Firestore

**"Permission denied" error**
Usually means the Firestore security rules weren't applied correctly. Re-paste the contents of `firestore.rules` into Firebase Console → Firestore → Rules → Publish.

**Google sign-in not working**
In Firebase Console → Authentication → Sign-in providers → Google → make sure your app's domain is listed under "Authorized domains". Add `[yourproject].vercel.app` or `[yourproject].lovable.app`.

**Photos not uploading**
Check that your Cloudinary upload preset name is exactly `community-ride` and that it's set to **Unsigned**.
