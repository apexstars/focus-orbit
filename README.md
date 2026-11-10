# Focus Orbit

Focus Orbit is a privacy-first focus timer that turns intentional work into earned break credits. Complete a focus session, bank credits, and spend them on guilt-free breaks—all without an account or server.

## Why this project

Product Hunt's October 28, 2026 leaderboard showed strong demand for tools that reduce doomscrolling and reward intentional app use. Focus Orbit explores the same market need as an original, open-source browser experience with local-only data.

## Features

- Four focus presets, with the last selection remembered
- Live timer with pause and reset controls
- Break credits earned from completed sessions
- Daily goals and streak tracking
- Local activity history and persistence
- Responsive, keyboard-friendly interface
- Customizable focus-to-credit reward rate
- Configurable break length and daily goal
- Credit-gated break redemption with a dedicated break countdown
- Personal distraction list stored only on-device
- Five-second breathing pause before an intentional choice
- Local intervention history with return-to-focus tracking
- Weekly focus chart, totals, and strongest day
- Web app manifest and cached app shell for offline use
- Keyboard shortcuts: Space starts or pauses focus; R resets the timer (outside forms and dialogs)
- Local JSON backup and restore in Preferences. Restoring replaces the current browser's saved data.

## Offline use

Open the app once while online to cache its files. Subsequent visits work offline on the same browser. Installation is available through supporting browsers on HTTPS (or localhost); browser support varies. Fonts fall back to the system sans-serif when unavailable. Your focus data remains in this browser's local storage.

## Run locally

You’ll need Node.js 22 or newer and Python 3. There are no npm dependencies to install.

```bash
npm start
```

Open `http://localhost:4173`.

## Test

```bash
npm test
```

## Try the focus-to-break loop

1. In Preferences, set **Focus per credit** to 3 and keep the break length at 5 minutes.
2. Choose **Quick start · 15 min** and finish the session. The app should log the orbit, update your weekly totals, and add 5 break credits.
3. Select **Take a 5 min break**. The app should deduct 5 credits and open the break countdown. Reload after ending the break to check that your session and remaining balance were saved.

## Release checks

- [ ] Run the focus-to-break loop in Chrome and Safari.
- [ ] Verify backup download and restore using disposable browser data.
- [ ] Check keyboard focus and chart announcements with a screen reader, and check the layout on a narrow viewport.
- [ ] Confirm installation and offline reload from the final HTTPS deployment.

## License

MIT
