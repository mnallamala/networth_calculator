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

The app uses Firebase Google Authentication. Browser cache keys and Firestore documents are scoped to the signed-in Firebase UID, and the included Firestore rules restrict access to that UID.

## Firebase Setup

In the Firebase project `nallamala-ccf51`:

1. Open **Authentication > Sign-in method** and enable the **Google** provider.
2. Select a project support email and save the Google provider configuration.
3. Open **Firestore Database** and create a database.
4. Open the Firestore **Rules** tab and publish the contents of `firestore.rules`.
5. In **Authentication > Settings > Authorized domains**, add `mnallamala.github.io` for the GitHub Pages site.

The app shows **Saved to Firebase** when cloud sync is working. If setup or connectivity is unavailable, it shows **Local only** and continues storing changes in the browser.

The same Google account can access its Firestore data across supported browsers and devices. If an older anonymous Firebase session exists, the app attempts to link it to the selected Google account so its Firebase UID and data are preserved.

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
