# FlockMaster — Poultry Farm & Batch Manager (React)

A React + Vite + Tailwind port of the original vanilla FlockMaster app. All screens,
widgets, data model and features are preserved and fully responsive.

## Features

- **Dashboard** — global flock size, revenue, expenses and net profit with charts.
- **Batch overview** — age, live birds, mortality, revenue (with sale count) and a
  per-batch **net profit** card.
- **All Batches expenses** — tag an expense as *All Batches* to split it evenly across
  every batch. The batch card shows the allocated share alongside direct costs, and it
  rebalances automatically when batches are added or removed.
- **Expense ledger** — shows the **total of the currently filtered** expenses, with an
  *All Batches* filter.
- **Sales ledger** — total of the filtered sales.

## Progressive Web App (PWA)

FlockMaster is installable and works offline.

- **Install**: open the app in Chrome/Edge and use the install button in the address
  bar (or the in-app "Install" prompt).
- **Offline**: a service worker (`public/sw.js`) pre-caches the app shell and icons,
  and caches build assets + the FontAwesome CDN with *stale-while-revalidate*.
- **Updates**: when a new build is deployed a "Refresh" prompt appears so you can load
  the latest version.
- **Manifest**: `public/manifest.webmanifest` defines name, icons (192/512 + maskable),
  theme color and shortcuts.

The service worker is **registered only for production builds** (`import.meta.env.PROD`)
to keep Vite's dev HMR uncached. Test it with:

