<template>
  <AppHeader
    :showReset="phase !== 'input' && phase !== 'setup' && phase !== 'loading'"
    @reset="resetAll"
  />

  <div class="content">
    <div v-if="phase === 'setup'" class="model-setup">
      <p class="setup-heading">Local AI Model Required</p>
      <p class="setup-text">
        This app uses a local AI model that runs entirely in your browser — no data leaves your device.
      </p>
      <p class="setup-text">
        The model needs to be downloaded once (<strong>~600 MB</strong>) and will be cached for future visits.
        This may not be ideal on a mobile data connection.
      </p>
      <button class="download-btn" @click="handleDownload">DOWNLOAD &amp; CONTINUE</button>
    </div>

    <div v-if="phase === 'loading'" class="model-loading">
      <div class="spinner"></div>
      <p class="loading-text">{{ loadProgress || 'Preparing local AI model...' }}</p>
      <p v-if="modelError" class="error">{{ modelError }}</p>
    </div>

    <MealInput
      v-if="phase === 'input'"
      v-model="input"
      :loading="loading"
      :error="error"
      @submit="handleSubmit"
    />

    <CookingPlan
      v-if="phase === 'ready'"
      :items="items"
      :totalDuration="totalDuration"
      :startOffsets="startOffsets"
      @start="handleStartCooking"
    />

    <ActiveTimer
      v-if="phase === 'running'"
      :items="items"
      :activeIndex="activeIndex"
      :secondsLeft="secondsLeft"
      :completedIndices="completedIndices"
      :alert="alert"
      :isOvertime="isOvertime"
      :progress="progress"
      :isDev="isDev"
      @dismissAlert="dismissAlert"
      @skip="handleSkip"
    />

    <CompletedScreen
      v-if="phase === 'done'"
      :items="items"
      @reset="resetAll"
    />
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import AppHeader from "./components/AppHeader.vue";
import MealInput from "./components/MealInput.vue";
import CookingPlan from "./components/CookingPlan.vue";
import ActiveTimer from "./components/ActiveTimer.vue";
import CompletedScreen from "./components/CompletedScreen.vue";
import { useAI } from "./composables/useAI.js";
import { useAudioAlert } from "./composables/useAudioAlert.js";
import { useCookingSchedule } from "./composables/useCookingSchedule.js";
import { useTimer } from "./composables/useTimer.js";
import { buildSchedule } from "./utils/buildSchedule.js";

const isDev = import.meta.env.DEV;
const input = ref("");
const items = ref([]);

const { loading, error, analyseInput, modelReady, modelLoading, modelError, loadProgress, modelCached, startModelLoad } = useAI();
const phase = ref("setup");

watch(modelCached, (cached) => {
  if (cached && phase.value === "setup") phase.value = "loading";
});

watch(modelReady, (ready) => {
  if (ready && (phase.value === "loading" || phase.value === "setup")) phase.value = "input";
});

function handleDownload() {
  phase.value = "loading";
  startModelLoad();
}

const { beep, notifyUser } = useAudioAlert();
const { totalDuration, startOffsets } = useCookingSchedule(items);

const {
  activeIndex,
  secondsLeft,
  completedIndices,
  alert,
  isOvertime,
  progress,
  startCooking,
  reset: resetTimer,
  dismissAlert,
  skip,
} = useTimer(items, {
  onComplete() {
    phase.value = "done";
    beep();
    notifyUser("Mise en Place", "Everything's ready! Time to plate up.");
  },
  onAdvance(nextItem, nextSeconds) {
    beep();
    notifyUser("Mise en Place", `Now: ${nextItem.name} — ${nextItem.method}`);
  },
});

async function handleSubmit() {
  const parsed = await analyseInput(input.value);
  if (parsed) {
    items.value = buildSchedule(parsed);
    phase.value = "ready";
  }
}

function handleStartCooking() {
  const result = startCooking();
  if (result) {
    phase.value = "running";
    beep();
    notifyUser("Mise en Place", `Put in: ${result.firstItem.name} — ${result.firstItem.method}`);
  }
}

function handleSkip() {
  skip();
  beep();
}

function resetAll() {
  resetTimer();
  phase.value = "input";
  items.value = [];
  input.value = "";
  error.value = "";
}
</script>

<style scoped>
.content {
  width: 100%;
  max-width: 640px;
  padding: 40px 24px;
}

.model-setup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 60px 24px;
  text-align: center;
}

.setup-heading {
  color: var(--text-primary);
  font-size: 18px;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.setup-text {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
  max-width: 400px;
}

.download-btn {
  margin-top: 20px;
  background: var(--accent-gold);
  border: none;
  color: var(--bg-primary);
  padding: 14px 32px;
  font-size: 14px;
  letter-spacing: 0.1em;
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  max-width: 400px;
  transition: all 0.2s;
}

.model-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 24px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-primary);
  border-top-color: var(--accent-gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--text-secondary);
  font-size: 14px;
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
}

.error {
  color: var(--accent-red);
  font-size: 13px;
}
</style>
