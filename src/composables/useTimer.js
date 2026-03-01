import { ref, computed, onUnmounted } from "vue";
import { formatTime } from "../utils/formatTime.js";

export function useTimer(items, { onComplete, onAdvance }) {
  const activeIndex = ref(0);
  const secondsLeft = ref(0);
  const completedIndices = ref(new Set());
  const alert = ref(null);

  let intervalId = null;
  let startTime = null;

  const isOvertime = computed(() => secondsLeft.value < 0);

  const progress = computed(() => {
    const item = items.value[activeIndex.value];
    if (!item) return 0;
    return Math.max(0, Math.min(1, 1 - secondsLeft.value / (item.durationMinutes * 60)));
  });

  function stopTimer() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }

  function buildAlert(item) {
    if (item.type === "preheat") {
      return {
        message: item.name,
        subtext: `${formatTime(Math.round(item.durationMinutes * 60))} until next step`,
      };
    }
    return {
      message: item.name,
      subtext: `${item.method} — ${formatTime(Math.round(item.durationMinutes * 60))} until next step`,
    };
  }

  function advanceToNext(fromIndex) {
    const nextIndex = fromIndex + 1;
    const allItems = items.value;

    if (nextIndex >= allItems.length) {
      stopTimer();
      alert.value = { message: "\u{1F37D} Everything's ready!", subtext: "Time to plate up. Enjoy your meal!" };
      onComplete();
      return;
    }

    completedIndices.value = new Set([...completedIndices.value, fromIndex]);
    activeIndex.value = nextIndex;
    const nextItem = allItems[nextIndex];
    const nextSeconds = Math.round(nextItem.durationMinutes * 60);
    secondsLeft.value = nextSeconds;
    startTime = Date.now();

    alert.value = buildAlert(nextItem);
    onAdvance(nextItem, nextSeconds);
  }

  function tick() {
    const currentItem = items.value[activeIndex.value];
    if (!currentItem || !startTime) return;

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const totalSeconds = Math.round(currentItem.durationMinutes * 60);
    const remaining = totalSeconds - elapsed;

    secondsLeft.value = remaining;

    if (remaining <= 0) {
      advanceToNext(activeIndex.value);
    }
  }

  function startCooking() {
    if (items.value.length === 0) return;
    activeIndex.value = 0;
    completedIndices.value = new Set();
    const firstItem = items.value[0];
    const firstSeconds = Math.round(firstItem.durationMinutes * 60);
    secondsLeft.value = firstSeconds;
    startTime = Date.now();

    alert.value = buildAlert(firstItem);

    intervalId = setInterval(tick, 500);
    return { firstItem, firstSeconds };
  }

  function reset() {
    stopTimer();
    activeIndex.value = 0;
    secondsLeft.value = 0;
    completedIndices.value = new Set();
    alert.value = null;
  }

  function skip() {
    advanceToNext(activeIndex.value);
  }

  function dismissAlert() {
    alert.value = null;
  }

  onUnmounted(stopTimer);

  return {
    activeIndex,
    secondsLeft,
    completedIndices,
    alert,
    isOvertime,
    progress,
    startCooking,
    reset,
    dismissAlert,
    skip,
  };
}
