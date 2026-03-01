<template>
  <AppHeader :showReset="phase !== 'input'" @reset="resetAll" />

  <div class="content">
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
import MealInput from "./components/MealInput.vue";
import CookingPlan from "./components/CookingPlan.vue";
import ActiveTimer from "./components/ActiveTimer.vue";
import CompletedScreen from "./components/CompletedScreen.vue";
import { useAI } from "./composables/useAI.js";
import { useAudioAlert } from "./composables/useAudioAlert.js";
import { useCookingSchedule } from "./composables/useCookingSchedule.js";
import { useTimer } from "./composables/useTimer.js";

const isDev = import.meta.env.DEV;
const input = ref("");
const items = ref([]);
const phase = ref("input");

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
