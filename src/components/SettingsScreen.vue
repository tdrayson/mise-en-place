<template>
  <div>
    <p class="description">Enter your Anthropic API key to get started. The app uses Claude Haiku for fast, cheap meal parsing.</p>

    <div class="field">
      <label class="label" for="apiKey">API Key</label>
      <div class="input-wrapper">
        <input
          id="apiKey"
          v-model="form.apiKey"
          type="password"
          class="input"
          placeholder="sk-ant-..."
        />
      </div>
    </div>

    <p v-if="validationError" class="error">{{ validationError }}</p>

    <button class="save-btn" @click="handleSave">SAVE</button>

    <button v-if="showCancel" class="cancel-btn" @click="$emit('cancel')">
      CANCEL
    </button>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useSettings } from "../composables/useSettings.js";

const props = defineProps({
  showCancel: Boolean,
});

const emit = defineEmits(["saved", "cancel"]);

const { apiKey, saveSettings } = useSettings();

const form = reactive({
  apiKey: apiKey.value,
});

const validationError = ref("");

function handleSave() {
  validationError.value = "";
  if (!form.apiKey.trim()) {
    validationError.value = "API key is required.";
    return;
  }
  saveSettings(form.apiKey);
  emit("saved");
}
</script>

<style scoped>
.description {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.7;
  margin-bottom: 28px;
}

.field {
  margin-bottom: 20px;
}

.label {
  display: block;
  color: var(--text-tertiary);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.input-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  padding: 2px;
}

.input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 16px;
  font-family: inherit;
  padding: 14px 16px;
  caret-color: var(--caret-color);
}

.error {
  color: var(--accent-red);
  font-size: 13px;
  margin-bottom: 10px;
}

.save-btn {
  margin-top: 8px;
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

.cancel-btn {
  margin-top: 10px;
  background: none;
  border: 1px solid var(--border-primary);
  color: var(--text-tertiary);
  padding: 14px 32px;
  font-size: 14px;
  letter-spacing: 0.1em;
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}
</style>
