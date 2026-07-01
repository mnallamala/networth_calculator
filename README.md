# Net worth Tracking

A personal net worth tracker for assets, liabilities, goals, and educational AI-style financial observations.

## Run Locally

From this folder:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/index.html
```

The app uses Firebase compat SDK scripts from Google's CDN. Local browser storage remains available as a cache and fallback.

## Data Storage

Financial items, settings, and categories are cached in browser `localStorage` using these keys:

```text
my-net-worth-tracker:items
my-net-worth-tracker:settings
my-net-worth-tracker:categories
```

When Firebase is configured, the same app state is privately synced to:

```text
users/{firebaseAuthUid}/apps/networth
```

The app uses Firebase Anonymous Authentication. Each browser profile receives a separate Firebase UID, and the included Firestore rules restrict access to the matching UID.

## Firebase Setup

In the Firebase project `nallamala-ccf51`:

1. Open **Authentication > Sign-in method** and enable **Anonymous** authentication.
2. Open **Firestore Database** and create a database.
3. Open the Firestore **Rules** tab and publish the contents of `firestore.rules`.
4. In **Authentication > Settings > Authorized domains**, add `mnallamala.github.io` for the GitHub Pages site.

The app shows **Saved to Firebase** when cloud sync is working. If setup or connectivity is unavailable, it shows **Local only** and continues storing changes in the browser.

Important: anonymous authentication keeps users isolated, but it does not provide cross-browser or cross-device account recovery. A future Google or email sign-in flow is required for the same person to access their data on multiple devices.

## Modify Categories

Use **Manage Categories** in the Assets section. Category changes are included in local and Firebase storage.

Default categories are defined near the top of `src/app.js`:

Each category has:

```js
{
  id: "savings",
  label: "Savings Account",
  type: "asset",
  icon: "🐷",
  description: "Emergency savings and cash reserves"
}
```

Set `type` to either `asset` or `liability`. The app automatically uses this value to place items in the correct list and calculation.
