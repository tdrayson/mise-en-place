<template>
  <AppHeader
    :showReset="phase !== 'input' && phase !== 'setup'"
    :showSettings="phase === 'input'"
    @reset="resetAll"
    @openSettings="openSettings"
  />

  <div class="content">
    <SettingsScreen
      v-if="phase === 'setup'"
      :showCancel="hasBeenConfigured"
      @saved="phase = 'input'"
      @cancel="phase = 'input'"
    />

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
import { ref } from "vue";
import AppHeader from "./components/AppHeader.vue";
import SettingsScreen from "./components/SettingsScreen.vue";
import MealInput from "./components/MealInput.vue";
import CookingPlan from "./components/CookingPlan.vue";
import ActiveTimer from "./components/ActiveTimer.vue";
import CompletedScreen from "./components/CompletedScreen.vue";
import { useAI } from "./composables/useAI.js";
import { useAudioAlert } from "./composables/useAudioAlert.js";
import { useCookingSchedule } from "./composables/useCookingSchedule.js";
import { useTimer } from "./composables/useTimer.js";
import { useSettings } from "./composables/useSettings.js";

const isDev = import.meta.env.DEV;
const input = ref("");
const items = ref([]);

const { isConfigured } = useSettings();
const hasBeenConfigured = ref(isConfigured.value);
const phase = ref(isConfigured.value ? "input" : "setup");

const { loading, error, analyseInput } = useAI();
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

function openSettings() {
  hasBeenConfigured.value = isConfigured.value;
  phase.value = "setup";
}

async function handleSubmit() {
  const parsed = await analyseInput(input.value);
  if (parsed) {
    items.value = parsed;
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
</style>
