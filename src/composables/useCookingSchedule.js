import { computed } from "vue";

export function useCookingSchedule(items) {
  const totalDuration = computed(() =>
    items.value.reduce((sum, i) => sum + i.durationMinutes, 0)
  );

  // Cumulative offset: when each step starts relative to t=0
  const startOffsets = computed(() => {
    let cumulative = 0;
    return items.value.map((item, i) => {
      const offset = cumulative;
      cumulative += item.durationMinutes;
      return offset;
    });
  });

  return { totalDuration, startOffsets };
}
