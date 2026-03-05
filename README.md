# Mise en Place

A macOS desktop cooking timer that takes a free-form description of your meal and creates a step-by-step cooking plan so everything finishes at the same time.

Describe what you're cooking in plain English — the app uses AI to parse your items, figure out preheating, calculate stagger times, and give you a timeline of exactly when to put each thing in. Then it counts you through each step with audio alerts and notifications.

Built with Vue 3 + Tauri v2.

## How it works

1. **Describe your meal** — type what you're cooking, how long each thing takes, and what method (oven, air fryer, hob, etc.)
2. **Get a cooking plan** — the AI creates a chronological timeline including preheat steps, staggered so all food finishes together
3. **Follow the timer** — step-by-step countdowns with audio beeps and macOS notifications telling you when to put each item in
4. **Everything's ready** — all your food finishes at the same time

## Download

Grab the latest `.dmg` from [Releases](https://github.com/taylordrayson/mise-en-place/releases), open it, and drag the app to Applications.

The AI runs entirely in your browser using [WebLLM](https://github.com/mlc-ai/web-llm) — no API keys, no server, no cost. The model downloads and caches on first launch (~600MB).

> **Note:** The app isn't code-signed, so macOS will show a warning. Right-click the app and choose "Open" the first time.

> **Note:** WebLLM requires a browser with WebGPU support (Chrome 113+, Edge 113+).

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)

### Install

```bash
git clone https://github.com/taylordrayson/mise-en-place.git
cd mise-en-place
npm install
```

### Run

```bash
# Browser (development)
npm run dev

# Tauri desktop app (development)
npm run tauri dev

# Build .dmg for distribution
npm run tauri build
```

The built `.dmg` is at `src-tauri/target/release/bundle/dmg/`.

## Project structure

```
src/
├── App.vue                        # Phase routing + top-level state
├── main.js                        # Vue app entry
├── style.css                      # CSS variables, light/dark mode
├── components/
│   ├── AppHeader.vue              # Logo + reset button
│   ├── MealInput.vue              # Text input + loading state
│   ├── CookingPlan.vue            # Timeline view of the plan
│   ├── ActiveTimer.vue            # Countdown + queue
│   └── CompletedScreen.vue        # Done screen
├── composables/
│   ├── useAI.js                   # Local LLM via WebLLM
│   ├── useAudioAlert.js           # Web Audio beep + macOS notifications
│   ├── useCookingSchedule.js      # Timeline offset calculations
│   └── useTimer.js                # Countdown logic
├── utils/
│   ├── formatTime.js              # Time formatting (mm:ss, Xh Ym)
│   └── methodIcon.js              # Lucide icon by cooking method
└── constants/
    └── prompts.js                 # AI system prompt
```

## Features

- Runs entirely locally — no API keys, no cloud services, no cost
- Uses WebLLM to run an LLM directly in the browser via WebGPU
- Smart preheating — one preheat per appliance, timed just before it's needed
- Staggered timing so all food finishes together
- Audio beeps on step transitions
- macOS system notifications (via Tauri)
- Light and dark mode (follows system preference)

## License

MIT
