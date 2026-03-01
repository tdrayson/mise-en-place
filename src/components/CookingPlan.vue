<template>
  <div>
    <p class="plan-header">
      Your cooking plan — total {{ formatDuration(totalDuration) }}
    </p>

    <div class="timeline">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="step"
      >
        <div class="track">
          <div class="dot" :class="{ 'dot-preheat': item.type === 'preheat' }"></div>
          <div v-if="i < items.length - 1" class="line"></div>
        </div>
        <div class="content">
          <div class="row">
            <div class="info">
              <span class="name">{{ item.name }}</span>
              <span class="method">{{ item.method }}</span>
              <span v-if="item.notes" class="notes">{{ item.notes }}</span>
            </div>
            <div class="meta">
              <span class="wait">{{ formatDuration(item.durationMinutes) }}</span>
              <span class="offset">at {{ offsetLabel(i) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Finish -->
      <div class="step">
        <div class="track">
          <div class="dot dot-finish"></div>
        </div>
        <div class="content">
          <div class="row">
            <div class="info">
              <span class="name finish-name">Everything's ready</span>
            </div>
            <div class="meta">
              <span class="offset">at {{ formatDuration(totalDuration) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button class="start-btn" @click="$emit('start')">
      START COOKING
    </button>
  </div>
</template>

<script setup>
import { formatDuration } from "../utils/formatTime.js";

const props = defineProps({
  items: Array,
  totalDuration: Number,
  startOffsets: Array,
});

defineEmits(["start"]);

function offsetLabel(i) {
  if (i === 0) return "0m";
  return formatDuration(props.startOffsets[i]);
}
</script>

<style scoped>
.plan-header {
  color: var(--text-secondary);
  font-size: 14px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 28px;
}

.timeline {
  margin-bottom: 32px;
}

.step {
  display: flex;
  gap: 16px;
}

.track {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 12px;
  flex-shrink: 0;
  padding-top: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-gold);
  flex-shrink: 0;
}

.dot-preheat {
  background: var(--text-tertiary);
}

.dot-finish {
  background: var(--accent-action);
}

.line {
  width: 1px;
  flex: 1;
  background: var(--border-primary);
}

.content {
  flex: 1;
  padding-bottom: 24px;
  min-width: 0;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.name {
  font-size: 16px;
  color: var(--text-primary);
  line-height: 1.3;
}

.method {
  font-size: 14px;
  color: var(--text-secondary);
}

.notes {
  font-size: 13px;
  color: var(--text-tertiary);
  font-style: italic;
}

.meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 2px;
}

.wait {
  font-size: 18px;
  color: var(--accent-gold);
  font-feature-settings: "tnum";
}

.offset {
  font-size: 13px;
  color: var(--text-tertiary);
  font-feature-settings: "tnum";
}

.finish-name {
  color: var(--accent-action);
}

.start-btn {
  background: var(--accent-action);
  border: none;
  color: var(--accent-action-text);
  padding: 16px 32px;
  font-size: 14px;
  letter-spacing: 0.1em;
  font-family: inherit;
  cursor: pointer;
  width: 100%;
}
</style>
