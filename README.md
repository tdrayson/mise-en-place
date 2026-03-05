# Mise en Place

A cooking timer that takes a free-form description of your meal and creates a step-by-step cooking plan so everything finishes at the same time.

Describe what you're cooking in plain English — the app uses Claude AI to parse your items, figure out preheating, calculate stagger times, and give you a timeline of exactly when to put each thing in. Then it counts you through each step with audio alerts and notifications.

Available as a web app and a macOS desktop app (Tauri v2).

## Try it

**Web:** [tdrayson.github.io/mise-en-place](https://tdrayson.github.io/mise-en-place/)

**Desktop:** Grab the latest `.dmg` from [Releases](https://github.com/tdrayson/mise-en-place/releases)

> You'll need a [Claude API key](https://console.anthropic.com/) — enter it in Settings on first launch.

> **macOS note:** The app isn't code-signed. Right-click and choose "Open" the first time.

## How it works

1. **Describe your meal** — type what you're cooking, how long each thing takes, and what method (oven, air fryer, hob, etc.)
2. **Get a cooking plan** — the AI creates a chronological timeline including preheat steps, staggered so all food finishes together
3. **Follow the timer** — step-by-step countdowns with audio beeps and notifications telling you when to act
4. **Everything's ready** — all your food finishes at the same time

## Features

- Smart scheduling — multi-step dishes (boil then roast) are chained correctly
- Simultaneous events are merged into single steps
- Automatic preheating — one preheat per appliance, timed before it's needed
- Back-scheduled so all food finishes together
- Audio beeps on step transitions
- System notifications (native on Tauri, browser Notification API on web)
- Light and dark mode (follows system preference)

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri desktop builds only)

### Install

```bash
git clone https://github.com/tdrayson/mise-en-place.git
cd mise-en-place
npm install
```

### Run

```bash
# Browser (development)
npm run dev

# Tauri desktop app (development)
npm run tauri dev

# Build for GitHub Pages
npm run build

# Build .dmg for distribution
npm run tauri build
```

## Project structure

```
src/
├── App.vue                        # Phase routing + top-level state
├── main.js                        # Vue app entry
├── style.css                      # CSS variables, light/dark mode
├── components/
│   ├── AppHeader.vue              # Logo + settings gear + reset button
│   ├── SettingsScreen.vue         # API key configuration
│   ├── MealInput.vue              # Text input + loading state
│   ├── CookingPlan.vue            # Timeline view of the plan
│   ├── ActiveTimer.vue            # Countdown + queue
│   └── CompletedScreen.vue        # Done screen
├── composables/
│   ├── useAI.js                   # Claude Haiku API integration
│   ├── useAudioAlert.js           # Web Audio beep + notifications
│   ├── useCookingSchedule.js      # Timeline offset calculations
│   ├── useSettings.js             # API key persistence (localStorage)
│   └── useTimer.js                # Countdown logic
├── utils/
│   ├── buildSchedule.js           # Scheduling algorithm (grouping, merging, back-scheduling)
│   └── formatTime.js              # Time formatting (mm:ss, Xh Ym)
└── constants/
    └── prompts.js                 # AI system prompt
```

## License

MIT
