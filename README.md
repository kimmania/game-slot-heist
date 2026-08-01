# 🎰 Slot Heist

A heist-themed slot machine PWA built with Vite + TypeScript. Crack the vault, dodge the alarms, spin the mystery wheel, and escape with the loot!

**Live Demo:** [https://kimmania.github.io/game-slot-heist/](https://kimmania.github.io/game-slot-heist/)

---

## Features

### Core Gameplay
- **5×3 Reel Slot Machine** with 20 paylines and weighted symbol distribution
- **Heist Theme** — diamond 💎, gold bars 🥇, vault doors 🚪, cash 💵, coins 🪙, cop badges 🛡️, drills 🔩, alarm bells 🔔, and safe dials 🎛️
- **Progressive Economy** — $100 starting bankroll, bet from $1 to $25
- **Level Up System** — earn XP on every spin, level up for $50 bank bonuses
- **Wild Symbols** — vault doors substitute any pay symbol
- **Win Line Overlay** — animated payline highlights on wins
- **Multiplier Badge** — shows rising free-spin multiplier during bonus rounds

### Bonus Rounds
- **Free Spins** — 3+ scatter bells award 10–25 free spins with a rising win multiplier (×1 → ×2 → ×3…)
- **Vault Break** — pick boxes for instant loot (+$50–$500, ×2–×5 multipliers, extra picks). Beware the 2 buzzers that end the round! Max win capped at $5,000 with live remaining-picks counter. **Cash out early** once loot is on the table, or push your luck for more.
- **Mystery Wheel** — random chance (~1/70, 5-min cooldown) per spin to spin for prizes up to ×2,000 or +5 free spins. 8 labeled segments with a fixed top pointer.
- **Loot Chest Keypad** — random chance (~1/100) per spin. Crack a 4-digit code in 30s using Mastermind-style color hints (green = right spot, amber = right digit/wrong spot). Reward scales with bet.

### Meta Systems
- **Heat Meter** — rises +3 per spin; at high heat up to 4 reel cells per spin get upgraded toward high-value/bonus symbols. Vents whenever a bonus round triggers.
- **Crew** — spend bankroll on permanent specialists (👥 button):
  - 🧑‍💻 **The Hacker** ($500) — +15s on the loot chest code timer
  - 💪 **The Muscle** ($750) — absorbs one buzzer per Vault Break
  - 🚗 **The Driver** ($1,000) — +10% on every reel win
- **Achievements** — 12 unlockable achievements (🏆 button): first win, big/mega wins, bonus triggers, level milestones, hot streak, and more.
- **Daily Heist** — one fixed date-seeded grid per calendar day (📅 button), same for everyone. Best haul per day is tracked.
- **Win Tiers** — BIG WIN (×25 bet) and MEGA WIN (×100 bet) toasts with a fanfare.
- **Near-Miss Pulse** — exactly 2 scatters or 2 bonus symbols glow purple after a spin.

### UI & Polish
- **Win Toast** — win amount displayed in gold text directly above the spin button
- **Animated Balance** — bankroll counts up on wins with coin-blip sounds
- **Free Spins Counter** — live counter in the top bar (green when active)
- **Daily Login Bonus** — $100 every 24 hours
- **Top Wins Leaderboard** — local top 10 wins tracked
- **Turbo Mode** — skip animations for rapid-fire spins
- **Detailed Help Screen** — inline payline mini-grids, symbol info, and full paytable modal
- **Reset Game** — 🗑️ button with confirmation dialog to wipe all progress and start fresh

### Audio (Muteable)
- Synthesized effects via the Web Audio API (zero external assets):
  - Reel ticking during spins
  - Win chime on payouts
  - Vault unlock / buzzer SFX
  - Coin blips during animated count-ups
  - Button click feedback
- **Toggle** 🔊/🔇 in the top bar — persists with save state

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Build Tool | [Vite](https://vitejs.dev/) v6 |
| Language | TypeScript (ES modules, `noEmit`) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox `generateSW`) |
| Styling | Vanilla CSS with CSS custom properties |
| Audio | Web Audio API (oscillators + gain nodes) |
| Hosting | [GitHub Pages](https://pages.github.com/) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
game-slot-heist/
├── .github/workflows/deploy.yml   # GitHub Actions → Pages
├── public/
│   └── icons/                     # PWA icons (192, 512, apple-touch)
├── src/
│   ├── main.ts                    # Entry point
│   ├── app.ts                     # Game engine, spin logic, bonuses
│   ├── ui.ts                      # DOM helpers, render, modals
│   ├── reels.ts                   # Win evaluation, scatter/bonus counting
│   ├── rng.ts                     # Weighted random + heat boost + daily seeded PRNG
│   ├── storage.ts                 # localStorage read/write/clear
│   ├── sound.ts                   # Web Audio API synthesizer (muteable)
│   ├── achievements.ts            # Achievement definitions
│   ├── crew.ts                    # Crew member definitions
│   ├── types.ts                   # Symbols, paylines, constants, save schema
│   ├── style.css                  # Global layout, modals, controls, wheel
│   └── reels.css                  # Reel window + spin strip styles
├── index.html                     # App shell (mobile-optimized viewport + safe-area)
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Vite + PWA config
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
git clone https://github.com/kimmania/game-slot-heist.git
cd game-slot-heist
npm install
```

### Development

```bash
npm run dev
```

Vite dev server starts on `http://localhost:5173` (or next available port).

### Production Build

```bash
npm run build
```

Output goes to `dist/`. The build includes:
- JS/CSS bundles with hashed filenames
- `manifest.webmanifest` (auto-generated by `vite-plugin-pwa`)
- Service worker (`sw.js`) + Workbox runtime
- Precached assets for offline play

### Preview

```bash
npm run preview
```

Serves the `dist/` build locally on `http://localhost:4173`.

---

## Configuration

### Vite Base Path

`vite.config.ts` sets `base: '/game-slot-heist/'` — this must match the GitHub Pages repository name so asset links resolve correctly.

### PWA Manifest

Generated automatically from `vite.config.ts` → `manifest` options:
- `display: standalone`
- `orientation: portrait`
- Theme/background color: `#0f1115`
- Icons referenced from `public/icons/`

### GitHub Actions Deploy

On every push to `main`, the workflow:
1. Checks out the repo
2. Installs dependencies (`npm ci`)
3. Builds the project (`npm run build`)
4. Uploads `dist/` as a Pages artifact
5. Deploys to GitHub Pages

See `.github/workflows/deploy.yml`.

---

## Game Data

### Symbol Payouts (× bet per line; total bet spread across 20 lines)

| Symbol | 3 of a kind | 4 of a kind | 5 of a kind |
|--------|-------------|-------------|-------------|
| 💎 Diamond | ×40 | ×80 | ×200 |
| 🥇 Gold Bar | ×20 | ×40 | ×100 |
| 💵 Cash | ×12 | ×24 | ×60 |
| 🪙 Coin | ×8 | ×16 | ×40 |
| 🛡️ Badge | ×5 | ×10 | ×24 |
| 🔩 Drill | ×3 | ×6 | ×16 |
| 🚪 Vault | Wild — substitutes any pay symbol | | |
| 🔔 Bell | 3+ triggers Free Spins (10–25; retriggers during free spins award +5) | | |
| 🎛️ Dial | 3+ triggers Vault Break | | |

Economy tuned to ~110% RTP: free spins ~1 in 100 spins, Vault Break ~1 in 90.

### Betting Levels

$1, $2, $5, $10, $25

### Free Spin Multipliers

Each consecutive free-spin win increases the multiplier by 1 (×1 → ×2 → ×3…). Only applies **during** actual free spins, not normal play.

### Vault Break Prizes (12 boxes)
- 2 buzzers — end the round immediately
- Cash: $50, $100, $200, $300, $500
- Multipliers: ×2, ×3, ×5
- Extra picks: +2, +2
- Hard win cap: **$5,000**
- Live remaining-picks counter shown in the status text

### Mystery Wheel Segments (8)
1. ×10  2. ×25  3. ×50  4. ×100  5. ×250  6. +5FS  7. Vault Break  8. ×2,000

---

## Save State

Game state is persisted to `localStorage` under key `slot-heist-save`:

- `bank` — current bankroll
- `betIdx` — selected bet index
- `level` / `xp` — progression
- `dailyLogin` — last daily bonus timestamp
- `recentWins` / `topWins` — leaderboard data
- `turbo` — user preference
- `sound` — audio enabled (default `true`)
- `hasSeenHelp` — first-time help flag
- `heat` — current heat meter (0–100)
- `achievements` — unlocked achievement ids
- `crew` — hired crew member ids
- `dailyHeist` — last daily-heist date + best haul

**Reset** wipes all of the above and restores defaults.

---

## Browser Support

- Chrome / Edge (recommended)
- Safari (iOS 15+, iPadOS) — safe-area insets supported
- Firefox

### Android Notes
- `user-scalable=no` viewport + `touch-action: manipulation` prevent zoom/selection issues
- `-webkit-user-select: none; user-select: none` on `html, body` prevent accidental text-selection / Google Search pop-ups on long-presses

**Add to Home Screen** on iOS/Android for the full standalone PWA experience.

---

## License

MIT © 2026 kimmania
