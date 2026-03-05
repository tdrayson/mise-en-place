<template>
  <div class="header">
    <div class="logo">
      <span class="title">MISE EN PLACE</span>
      <span class="subtitle">cooking timer</span>
    </div>
    <div class="actions">
      <button v-if="showSettings" class="icon-btn" @click="$emit('openSettings')" aria-label="Settings">
        <Settings :size="18" />
      </button>
      <button v-if="showReset" class="reset-btn" @click="$emit('reset')">
        &larr; NEW MEAL
      </button>
    </div>
  </div>
</template>

<script setup>
import { Settings } from "lucide-vue-next";

defineProps({
  showReset: Boolean,
  showSettings: Boolean,
});

defineEmits(["reset", "openSettings"]);
</script>

<style scoped>
.header {
  width: 100%;
  border-bottom: 1px solid var(--border-primary);
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  font-size: 20px;
  letter-spacing: 0.12em;
  font-weight: normal;
  color: var(--text-primary);
  line-height: 1;
}

.subtitle {
  font-size: 11px;
  color: var(--text-tertiary);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  line-height: 1;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.icon-btn:hover {
  color: var(--text-primary);
}

.reset-btn {
  background: none;
  border: 1px solid var(--border-primary);
  color: var(--text-tertiary);
  padding: 6px 14px;
  cursor: pointer;
  font-size: 12px;
  letter-spacing: 0.08em;
  font-family: inherit;
}
</style>
