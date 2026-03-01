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

Grab the latest `.dmg` from [Releases](https://github.com/taylordrayson/mise-en-place/releases), open it, and drag the app to Applications. On first launch you'll be prompted to enter your AI provider, model, and API key.

You'll need an API key from [Anthropic](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/). For this use case (parsing text into structured JSON), cheaper/faster models work great — `gpt-4o-mini` or `gpt-4.1-nano` are recommended.

> **Note:** The app isn't code-signed, so macOS will show a warning. Right-click the app and choose "Open" the first time.

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

### Configure (optional)

To skip the settings screen during development, create a `.env.development` file in the project root:

```env
# Provider: "anthropic" or "openai"
VITE_AI_PROVIDER=openai

# Model (e.g. gpt-4o-mini, gpt-4.1-nano, claude-sonnet-4-20250514)
VITE_AI_MODEL=gpt-4o-mini

# API keys — only the one matching your provider is needed
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-...
```

This file is gitignored and only loaded in dev mode — production builds won't include your keys.

Without a `.env.development` file, the in-app settings screen will appear on first launch instead.

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
│   ├── AppHeader.vue              # Logo + settings gear + reset button
│   ├── SettingsScreen.vue         # AI provider/model/key configuration
│   ├── MealInput.vue              # Text input + loading state
│   ├── CookingPlan.vue            # Timeline view of the plan
│   ├── ActiveTimer.vue            # Countdown + queue
│   └── CompletedScreen.vue        # Done screen
├── composables/
│   ├── useSettings.js             # Settings persistence (localStorage + env fallback)
│   ├── useAI.js                   # Anthropic/OpenAI API calls
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

- In-app settings — configure your AI provider on first launch, no `.env` needed
- Supports both Anthropic (Claude) and OpenAI APIs
- Smart preheating — one preheat per appliance, timed just before it's needed
- Staggered timing so all food finishes together
- Audio beeps on step transitions
- macOS system notifications (via Tauri)
- Light and dark mode (follows system preference)
- Settings persist across sessions via localStorage

## License

MIT
