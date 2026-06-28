# My Net Worth Tracker

A private local net worth tracker for assets, liabilities, goals, and educational AI-style financial observations.

## Run Locally

From this folder:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173/index.html
```

The app is dependency-free and works offline after the files are on your machine. No backend is required.

## Data Storage

Financial items and settings are saved in your browser's `localStorage` using these keys:

```text
my-net-worth-tracker:items
my-net-worth-tracker:settings
```

No financial data is sent to an external API. There is no analytics tracking, cloud sync, or backend service.

## Modify Categories

Edit the `categories` array near the top of `src/app.js`.

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
