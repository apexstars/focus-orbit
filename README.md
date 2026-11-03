# Focus Orbit

Focus Orbit is a privacy-first focus timer that turns intentional work into earned break credits. Complete a focus session, bank credits, and spend them on guilt-free breaks—all without an account or server.

## Why this project

Product Hunt's October 28, 2026 leaderboard showed strong demand for tools that reduce doomscrolling and reward intentional app use. Focus Orbit explores the same market need as an original, open-source browser experience with local-only data.

## Features through Day 5

- Configurable focus sessions
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

## Offline use

Open the app once while online to cache its files. Subsequent visits work offline on the same browser. Installation is available through supporting browsers on HTTPS (or localhost); browser support varies. Fonts fall back to the system sans-serif when unavailable. Your focus data remains in this browser's local storage.

## Run locally

```bash
npm start
```

Open `http://localhost:4173`.

## Test

```bash
npm test
```

## Ten-day build plan

1. Core timer, credits, goals, and local persistence
2. ✅ Break-spending flow and customizable reward rules
3. ✅ Distraction list and gentle intervention screen
4. ✅ Weekly insights and activity charts
5. ✅ PWA manifest and offline app shell
6. Focus presets and keyboard shortcuts
7. Import/export and privacy controls
8. Accessibility and mobile interaction pass
9. Automated tests, performance, and polish
10. Release documentation, demo, and v1.0 launch

## License

MIT
