<template>
  <div>
    <!-- Alert banner -->
    <div v-if="alert" class="alert-banner" role="alert">
      <div class="alert-message">{{ alert.message }}</div>
      <div class="alert-subtext">{{ alert.subtext }}</div>
      <button class="alert-dismiss" @click="$emit('dismissAlert')">DISMISS &times;</button>
    </div>

    <!-- Active timer -->
    <div v-if="currentItem" class="timer-display">
      <div class="now-label">{{ currentItem.type === 'preheat' ? 'Preheating' : 'Now cooking' }}</div>
      <div class="current-name">{{ currentItem.name }}</div>
      <div class="current-method">{{ currentItem.method }}</div>

      <div
        class="countdown"
        :class="{ overtime: isOvertime }"
        role="timer"
        :aria-label="`${formatTime(secondsLeft)} remaining`"
      >
        {{ formatTime(secondsLeft) }}
      </div>

      <div v-if="isOvertime" class="overtime-label" role="alert">
        OVERTIME — TAKE OUT WHEN READY
      </div>

      <div class="progress-track" role="progressbar" :aria-valuenow="Math.round(progress * 100)" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar" :style="{ width: `${progress * 100}%` }"></div>
      </div>

      <div v-if="currentItem.notes" class="current-notes">{{ currentItem.notes }}</div>

      <button v-if="isDev" class="skip-btn" @click="$emit('skip')">
        SKIP &rarr;
      </button>
    </div>

    <!-- Queue -->
    <div class="queue">
      <div class="queue-label">Coming up</div>
      <div
        v-for="(item, i) in items"
        :key="i"
        class="queue-item"
        :class="{
          done: completedIndices.has(i),
          active: i === activeIndex,
          future: !completedIndices.has(i) && i !== activeIndex,
          'no-border': i === items.length - 1,
        }"
      >
        <div
          class="queue-dot"
          :class="{
            'dot-done': completedIndices.has(i),
            'dot-active': i === activeIndex,
          }"
          :aria-hidden="true"
        ></div>
        <span class="queue-name" :class="{ strikethrough: completedIndices.has(i) }">
          {{ item.name }}
        </span>
        <span class="queue-duration">{{ formatDuration(item.durationMinutes) }}</span>
        <span v-if="completedIndices.has(i)" class="queue-check" aria-label="completed">&check;</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { formatTime, formatDuration } from "../utils/formatTime.js";


const props = defineProps({
  items: Array,
  activeIndex: Number,
  secondsLeft: Number,
  completedIndices: Set,
  alert: Object,
  isOvertime: Boolean,
  progress: Number,
  isDev: Boolean,
});

defineEmits(["dismissAlert", "skip"]);

const currentItem = computed(() => props.items[props.activeIndex]);
</script>

<style scoped>
.alert-banner {
  background: var(--bg-tertiary);
  border: 1px solid var(--accent-gold);
  padding: 16px 20px;
  margin-bottom: 32px;
  border-left: 3px solid var(--accent-gold);
}

.alert-message {
  font-size: 17px;
  color: var(--text-primary);
}

.alert-subtext {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.alert-dismiss {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
  margin-top: 8px;
  padding: 0;
  font-family: inherit;
  letter-spacing: 0.08em;
}

.timer-display {
  margin-bottom: 40px;
  text-align: center;
}

.now-label {
  color: var(--text-tertiary);
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.current-name {
  font-size: 19px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.current-method {
  color: var(--text-tertiary);
  font-size: 13px;
  margin-bottom: 28px;
}

.countdown {
  font-size: 80px;
  font-feature-settings: "tnum";
  color: var(--accent-gold);
  letter-spacing: 0.04em;
  line-height: 1;
  margin-bottom: 20px;
}

.countdown.overtime {
  color: var(--accent-red);
  font-style: italic;
}

.overtime-label {
  color: var(--accent-red);
  font-size: 13px;
  letter-spacing: 0.1em;
}

.progress-track {
  background: var(--border-secondary);
  height: 3px;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--accent-gold);
  transition: width 0.5s linear;
}

.current-notes {
  color: var(--text-muted);
  font-size: 13px;
  margin-top: 14px;
  font-style: italic;
}

.skip-btn {
  margin-top: 20px;
  background: none;
  border: 1px dashed var(--border-primary);
  color: var(--text-muted);
  padding: 8px 20px;
  font-size: 11px;
  letter-spacing: 0.1em;
  font-family: inherit;
  cursor: pointer;
}

.queue {
  border-top: 1px solid var(--border-secondary);
  padding-top: 24px;
}

.queue-label {
  color: var(--text-faint);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px solid var(--bg-secondary);
}

.queue-item.no-border {
  border-bottom: none;
}

.queue-item.done {
  opacity: 0.4;
}

.queue-item.future {
  opacity: 0.7;
}

.queue-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-faint);
  flex-shrink: 0;
}

.queue-dot.dot-done {
  background: var(--border-primary);
}

.queue-dot.dot-active {
  background: var(--accent-gold);
}

.queue-name {
  font-size: 15px;
  color: var(--text-secondary);
}

.queue-item.done .queue-name {
  color: var(--text-muted);
}

.strikethrough {
  text-decoration: line-through;
}

.queue-duration {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 13px;
  font-feature-settings: "tnum";
}

.queue-check {
  color: var(--accent-success);
  font-size: 12px;
}
</style>
