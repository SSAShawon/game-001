# LIFE LEAD — Personal Life Simulation & Business Empire Game

A playable, browser-based, single-player life simulation game. Build your virtual life, run a house, collect items, manage a virtual bank, take and repay loans, start businesses, and grow a property empire — all saved locally on your PC.

## Tech stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS
- Phaser 3 for the hand-drawn isometric world map
- IndexedDB (via [idb](https://github.com/jakearchibald/idb)) for persistent local saves — no account, no server, no cloud

## How to run

```bash
npm install        # install dependencies
npm run dev        # start dev server on http://localhost:3000
npm run build      # production build
npm run start      # serve production build
```

Open `http://localhost:3000` in your browser. The game works mouse-first and is usable from the keyboard.

## How saving works

- All game progress is saved to your browser's **IndexedDB** database under the database name `life-lead-db` (store `saves`, key `main-save`). There is no server, no login, and no cloud sync in this version.
- Changes are **auto-saved** a short time after you make them (when auto-save is on). A subtle "Saving…" indicator shows while a write is in progress, and an error toast appears if persistence fails.
- Your save is restored automatically when you reopen the game — even after closing the browser.
- Use **Save & Backup → Save Now** to save immediately, **Export Backup** to download a JSON file you can keep somewhere safe, and **Import Backup** to restore a backup. Backups are validated before being applied, so a valid save is never overwritten by an invalid or partial backup.

### Important: local-only data

IndexedDB is tied to your browser and profile. **Browser data clearing, using a different browser profile, or opening the game on another device can affect or erase your local save.** Export backups regularly if you want to keep your progress. This is a single-player, single-PC design by intention; cloud synchronization is planned as an optional future feature.

## What works in this version

- Hand-drawn style isometric city map with clickable locations: Home, Bank, Football Turf, Food Court, Gaming Café, Shopping Area, Garage, Empty Land / Property Market, and a future expansion area
- My Home with 5 rooms (Bedroom, Gaming Room, Collection Room, Library, Garage); buy items, place/move/remove them in rooms; layouts persist
- Collection catalog with 20 categories (watches, sneakers, books, jerseys, coins, building sets, and more) and 45 sample items; collection progress per category
- Virtual wallet & bank in Bangladeshi Taka (৳, fictional game money); deposits/withdrawals; transaction history
- Bank loans: flexible amounts, multiple simultaneous loans, documented simple interest, partial/full/early repayment, payment history, overdue status
- Businesses: Football Turf, Food Court, Gaming Café — startup investment, revenue collection, operating costs, upgrades, payouts to wallet/bank
- Properties: buy available plots; owned property value counts toward net worth
- Dreams & Wishlist: personal aspirations tracked separately from the virtual economy
- Financial Overview: net worth breakdown, monthly summary, business performance, loans
- Save & Backup settings with auto-save toggle, export, and import

## Virtual economy disclaimer

All money, businesses, loans, and values are **entirely fictional in-game currency** (Bangladeshi Taka ৳ used as the display unit). This is a simulation game — not real financial software, not real money, and not a real-world financial forecast. Loan rates and business values are fictional game settings for experimentation.

## Project status

This is the first playable prototype (Phase 1–2 of the roadmap). Core save/load, world map, home, collections, wallet/bank, loans, and businesses work. Remaining work includes property construction, deeper business simulation, character movement on the map, and more item art. See the source `lib/` and `components/` folders — the architecture is modular by design so new locations, item categories, and business types can be added without rewriting the core.

## License

MIT