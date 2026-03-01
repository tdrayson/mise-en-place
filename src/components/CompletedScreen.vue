<template>
  <div class="done-screen">
    <div class="done-emoji">&#127869;</div>
    <div class="done-title">Everything's ready.</div>
    <div class="done-subtitle">Time to plate up. Enjoy your meal.</div>
    <div class="done-list">
      <div v-for="(item, i) in items.filter(it => it.type !== 'preheat')" :key="i" class="done-item">
        <span class="done-check">&check;</span>
        <span class="done-name">{{ item.name }}</span>
      </div>
    </div>
    <button class="again-btn" @click="$emit('reset')">COOK AGAIN</button>
  </div>
</template>

<script setup>
defineProps({
  items: Array,
});

defineEmits(["reset"]);
</script>

<style scoped>
.done-screen {
  text-align: center;
  padding-top: 40px;
}

.done-emoji {
  font-size: 48px;
  margin-bottom: 20px;
}

.done-title {
  font-size: 26px;
  color: var(--accent-gold);
  margin-bottom: 8px;
}

.done-subtitle {
  color: var(--text-tertiary);
  font-size: 15px;
  margin-bottom: 40px;
}

.done-list {
  border-top: 1px solid var(--border-secondary);
  padding-top: 24px;
}

.done-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  justify-content: center;
}

.done-check {
  color: var(--accent-success);
}

.done-name {
  color: var(--text-muted);
  font-size: 14px;
}

.again-btn {
  margin-top: 32px;
  background: none;
  border: 1px solid var(--border-primary);
  color: var(--text-tertiary);
  padding: 12px 28px;
  font-size: 13px;
  letter-spacing: 0.1em;
  font-family: inherit;
  cursor: pointer;
}
</style>
