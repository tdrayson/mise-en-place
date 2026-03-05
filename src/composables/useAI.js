import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const modelReady = ref(false);
const modelLoading = ref(false);
const modelError = ref("");
const loadProgress = ref("");
const modelCached = ref(false);

// Check if model is already downloaded
invoke("model_status").then((status) => {
  modelCached.value = status === "ready";
  if (modelCached.value) {
    loadModel();
  }
});

async function loadModel() {
  modelLoading.value = true;
  modelError.value = "";
  loadProgress.value = "Loading model...";
  try {
    await invoke("load_model");
    modelReady.value = true;
  } catch (e) {
    modelError.value = String(e);
  } finally {
    modelLoading.value = false;
  }
}

async function startModelLoad() {
  modelLoading.value = true;
  modelError.value = "";
  loadProgress.value = "Starting download...";

  const unlisten = await listen("download-progress", (event) => {
    const { downloaded, total } = event.payload;
    if (total) {
      const pct = Math.round((downloaded / total) * 100);
      const mb = (downloaded / 1024 / 1024).toFixed(0);
      const totalMb = (total / 1024 / 1024).toFixed(0);
      loadProgress.value = `Downloading model... ${mb} / ${totalMb} MB (${pct}%)`;
    } else {
      const mb = (downloaded / 1024 / 1024).toFixed(0);
      loadProgress.value = `Downloading model... ${mb} MB`;
    }
  });

  try {
    await invoke("download_model");
    unlisten();
    loadProgress.value = "Loading model...";
    await invoke("load_model");
    modelReady.value = true;
  } catch (e) {
    modelError.value = String(e);
  } finally {
    modelLoading.value = false;
  }
}

export function useAI() {
  const loading = ref(false);
  const error = ref("");

  async function analyseInput(input) {
    if (!input.trim()) return null;
    loading.value = true;
    error.value = "";
    try {
      const items = await invoke("analyse_input", { input });
      if (!items || items.length === 0) throw new Error("No items found");
      return items;
    } catch (e) {
      console.error("AI error:", e);
      error.value = "Couldn't parse that — try describing each item with its time and cooking method.";
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, analyseInput, modelReady, modelLoading, modelError, loadProgress, modelCached, startModelLoad };
}
