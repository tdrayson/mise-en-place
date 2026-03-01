<template>
  <div>
    <p class="description">
      Describe what you're cooking — each item, how long it takes, and where it's going.
    </p>
    <div class="textarea-wrapper">
      <textarea
        ref="textareaRef"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @keydown.meta.enter="submit"
        placeholder="e.g. Chicken breast 25 mins oven 200°C, roast potatoes 40 mins oven, peas 3 mins microwave, gravy 10 mins on the hob"
      ></textarea>
    </div>
    <p v-if="error" class="error">{{ error }}</p>

    <!-- Loading state -->
    <div v-if="loading" class="loader">
      <div class="spinner"></div>
      <p class="loader-phrase">{{ currentPhrase }}</p>
    </div>

    <button
      v-else
      class="submit-btn"
      :disabled="!modelValue.trim()"
      @click="submit"
    >
      PLAN MY COOK ↵
    </button>
    <p class="hint">&#8984; + Enter to submit</p>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from "vue";

const PHRASES = [
  "Reading the menu...",
  "Preheating the oven...",
  "Sharpening the knives...",
  "Checking the pantry...",
  "Tasting the seasoning...",
  "Consulting the cookbook...",
  "Warming up the hob...",
  "Setting the table...",
  "Chopping the onions...",
  "Simmering the ideas...",
  "Firing up the grill...",
  "Greasing the pan...",
  "Peeling the potatoes...",
  "Whipping up a plan...",
  "Measuring the ingredients...",
];

const props = defineProps({
  modelValue: String,
  loading: Boolean,
  error: String,
});

const emit = defineEmits(["update:modelValue", "submit"]);

const textareaRef = ref(null);
const currentPhrase = ref(PHRASES[0]);
let phraseInterval = null;

function shufflePhrase() {
  const available = PHRASES.filter((p) => p !== currentPhrase.value);
  currentPhrase.value = available[Math.floor(Math.random() * available.length)];
}

watch(
  () => props.loading,
  (isLoading) => {
    if (isLoading) {
      shufflePhrase();
      phraseInterval = setInterval(shufflePhrase, 2000);
    } else {
      if (phraseInterval) clearInterval(phraseInterval);
      phraseInterval = null;
    }
  }
);

onUnmounted(() => {
  if (phraseInterval) clearInterval(phraseInterval);
});

function submit() {
  if (!props.loading && props.modelValue.trim()) {
    emit("submit");
  }
}
</script>

<style scoped>
.description {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.7;
  margin-bottom: 28px;
}

.textarea-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  padding: 2px;
}

textarea {
  width: 100%;
  min-height: 120px;
  background: transparent;
  border: none;
  outline: none;
  resize: vertical;
  color: var(--text-primary);
  font-size: 16px;
  font-family: inherit;
  line-height: 1.6;
  padding: 16px;
  caret-color: var(--caret-color);
}

.error {
  color: var(--accent-red);
  font-size: 13px;
  margin-top: 10px;
}

.loader {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 14px 32px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-primary);
  border-top-color: var(--accent-gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loader-phrase {
  color: var(--text-secondary);
  font-size: 14px;
  letter-spacing: 0.05em;
  font-style: italic;
}

.submit-btn {
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
  transition: all 0.2s;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.hint {
  color: var(--text-faint);
  font-size: 12px;
  text-align: center;
  margin-top: 12px;
}
</style>
