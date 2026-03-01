import { ref } from "vue";
import { SYSTEM_PROMPT } from "../constants/prompts.js";
import { useSettings } from "./useSettings.js";

function buildAnthropicRequest(input, currentModel, currentApiKey) {
  return {
    url: "https://api.anthropic.com/v1/messages",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": currentApiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: {
      model: currentModel,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: input }],
    },
    extractText(data) {
      return data.content?.[0]?.text || "";
    },
  };
}

function buildOpenAIRequest(input, currentModel, currentApiKey) {
  return {
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentApiKey}`,
    },
    body: {
      model: currentModel,
      max_completion_tokens: 16384,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input },
      ],
    },
    extractText(data) {
      return data.choices?.[0]?.message?.content || "";
    },
  };
}

function buildRequest(input) {
  const { provider, model, apiKey } = useSettings();
  if (provider.value === "openai") return buildOpenAIRequest(input, model.value, apiKey.value);
  return buildAnthropicRequest(input, model.value, apiKey.value);
}

export function useAI() {
  const loading = ref(false);
  const error = ref("");

  async function analyseInput(input) {
    if (!input.trim()) return null;
    loading.value = true;
    error.value = "";
    try {
      const req = buildRequest(input);
      const res = await fetch(req.url, {
        method: "POST",
        headers: req.headers,
        body: JSON.stringify(req.body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `API returned ${res.status}`);
      }
      const text = req.extractText(data);
      if (!text) throw new Error("Empty response from API");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No items found");
      return parsed;
    } catch (e) {
      error.value = "Couldn't parse that — try describing each item with its time and cooking method.";
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, analyseInput };
}
