import { reactive, computed, toRefs } from "vue";

const STORAGE_KEY = "mise-en-place-settings";

const state = reactive({
  apiKey: "",
});

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored) {
      state.apiKey = stored.apiKey || "";
    }
  } catch {
    // ignore corrupt localStorage
  }
}

load();

function saveSettings(apiKey) {
  state.apiKey = apiKey;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey }));
}

const isConfigured = computed(() => state.apiKey.trim().length > 0);

export function useSettings() {
  return {
    ...toRefs(state),
    isConfigured,
    saveSettings,
  };
}
