import { reactive, computed, toRefs } from "vue";

const STORAGE_KEY = "mise-en-place-settings";

const state = reactive({
  provider: "",
  model: "",
  apiKey: "",
});

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored) {
      state.provider = stored.provider || "";
      state.model = stored.model || "";
      state.apiKey = stored.apiKey || "";
    }
  } catch {
    // ignore corrupt localStorage
  }

  // Fall back to env values if localStorage is empty
  if (!state.provider) state.provider = import.meta.env.VITE_AI_PROVIDER || "anthropic";
  if (!state.model) state.model = import.meta.env.VITE_AI_MODEL || "claude-sonnet-4-20250514";
  if (!state.apiKey) {
    state.apiKey =
      import.meta.env.VITE_ANTHROPIC_API_KEY ||
      import.meta.env.VITE_OPENAI_API_KEY ||
      "";
  }
}

load();

function saveSettings(provider, model, apiKey) {
  state.provider = provider;
  state.model = model;
  state.apiKey = apiKey;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ provider, model, apiKey }));
}

const isConfigured = computed(() => state.apiKey.trim().length > 0);

export function useSettings() {
  return {
    ...toRefs(state),
    isConfigured,
    saveSettings,
  };
}
