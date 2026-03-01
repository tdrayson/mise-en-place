<template>
  <div>
    <p class="description">Configure your AI provider to get started.</p>

    <div class="field">
      <label class="label" for="provider">Provider</label>
      <div class="select-wrapper">
        <select id="provider" v-model="form.provider" class="select">
          <option value="anthropic">Anthropic</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label class="label" for="model">Model</label>
      <div class="input-wrapper">
        <input
          id="model"
          v-model="form.model"
          type="text"
          class="input"
          :placeholder="form.provider === 'openai' ? 'gpt-4o-mini' : 'claude-sonnet-4-20250514'"
        />
      </div>
    </div>

    <div class="field">
      <label class="label" for="apiKey">API Key</label>
      <div class="input-wrapper">
        <input
          id="apiKey"
          v-model="form.apiKey"
          type="password"
          class="input"
          placeholder="sk-..."
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
import { reactive, ref, watch } from "vue";
import { useSettings } from "../composables/useSettings.js";

const props = defineProps({
  showCancel: Boolean,
});

const emit = defineEmits(["saved", "cancel"]);

const { provider, model, apiKey, saveSettings } = useSettings();

const form = reactive({
  provider: provider.value,
  model: model.value,
  apiKey: apiKey.value,
});

const validationError = ref("");

// Update default model when provider changes
watch(
  () => form.provider,
  (newProvider, oldProvider) => {
    const defaults = { anthropic: "claude-sonnet-4-20250514", openai: "gpt-4o-mini" };
    if (form.model === defaults[oldProvider] || !form.model) {
      form.model = defaults[newProvider];
    }
  }
);

function handleSave() {
  validationError.value = "";
  if (!form.apiKey.trim()) {
    validationError.value = "API key is required.";
    return;
  }
  saveSettings(form.provider, form.model, form.apiKey);
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

.input-wrapper,
.select-wrapper {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  padding: 2px;
}

.input,
.select {
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

.select {
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.select-wrapper {
  position: relative;
}

.select-wrapper::after {
  content: "\25BE";
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
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
