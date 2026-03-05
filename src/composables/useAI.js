import { ref } from "vue";
import { SYSTEM_PROMPT } from "../constants/prompts.js";
import { useSettings } from "./useSettings.js";

export function useAI() {
  const loading = ref(false);
  const error = ref("");

  async function analyseInput(input) {
    if (!input.trim()) return null;
    loading.value = true;
    error.value = "";
    try {
      const { apiKey } = useSettings();

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.value,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: input }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `API returned ${res.status}`);
      }

      const text = data.content?.[0]?.text || "";
      if (!text) throw new Error("Empty response from API");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No items found");
      return parsed;
    } catch (e) {
      console.error("AI error:", e);
      error.value = "Couldn't parse that — try describing each item with its time and cooking method.";
      return null;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, analyseInput };
}
