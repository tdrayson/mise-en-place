import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are a cooking assistant. The user will describe a meal they're cooking — listing items with their cooking times and cooking methods (oven, air fryer, microwave, hob, etc.).

Your job is to extract each item and return a JSON array. Each item should have:
- "name": string (e.g. "Chicken breast")
- "method": string (e.g. "Oven 200°C", "Microwave", "Air fryer 180°C", "Hob - boiling")
- "durationMinutes": number (in minutes, can be decimal e.g. 1.5 for 90 seconds)
- "notes": string (any helpful tip, e.g. "Flip halfway through" or "Cover with foil" — keep brief)

Sort the array from LONGEST to SHORTEST duration (so index 0 starts first).

Respond ONLY with a valid JSON array, no markdown, no explanation. Example:
[
  {"name":"Roast potatoes","method":"Oven 200°C","durationMinutes":40,"notes":"Shake tray halfway"},
  {"name":"Chicken breast","method":"Oven 200°C","durationMinutes":25,"notes":"Check core temp hits 75°C"},
  {"name":"Peas","method":"Microwave","durationMinutes":3,"notes":"Add splash of water"}
]`;

function formatTime(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? "-" : "";
  return `${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatStartDelay(delayMinutes) {
  if (delayMinutes === 0) return "Starts immediately";
  const m = Math.floor(delayMinutes);
  const s = Math.round((delayMinutes - m) * 60);
  if (s === 0) return `Starts in ${m}m`;
  return `Starts in ${m}m ${s}s`;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const times = [0, 0.3, 0.6];
    times.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.25);
    });
  } catch (e) {}
}

// METHOD ICONS
const methodIcon = (method) => {
  const m = method.toLowerCase();
  if (m.includes("microwave")) return "📡";
  if (m.includes("air fryer") || m.includes("airfryer")) return "💨";
  if (m.includes("oven")) return "🔲";
  if (m.includes("hob") || m.includes("boil") || m.includes("simmer") || m.includes("pan") || m.includes("fry")) return "🔥";
  if (m.includes("grill")) return "♨️";
  return "⏱";
};

export default function CookingTimer() {
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("input"); // "input" | "ready" | "running" | "done"

  // Timer state
  const [activeIndex, setActiveIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [completedIndices, setCompletedIndices] = useState(new Set());
  const [alert, setAlert] = useState(null); // { message, subtext }

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const activeIndexRef = useRef(0);
  const itemsRef = useRef([]);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const advanceToNext = useCallback((fromIndex) => {
    const nextIndex = fromIndex + 1;
    const allItems = itemsRef.current;

    if (nextIndex >= allItems.length) {
      stopTimer();
      setPhase("done");
      beep();
      setAlert({ message: "🍽 Everything's ready!", subtext: "Time to plate up. Enjoy your meal!" });
      return;
    }

    setCompletedIndices(prev => new Set([...prev, fromIndex]));
    setActiveIndex(nextIndex);
    activeIndexRef.current = nextIndex;
    const nextItem = allItems[nextIndex];
    const nextSeconds = Math.round(nextItem.durationMinutes * 60);
    setSecondsLeft(nextSeconds);
    startTimeRef.current = Date.now();

    beep();
    setAlert({
      message: `Now: ${nextItem.name}`,
      subtext: `Put it in — ${nextItem.method} — ${formatTime(nextSeconds)} on the clock`,
    });
  }, [stopTimer]);

  const tick = useCallback(() => {
    const currentItem = itemsRef.current[activeIndexRef.current];
    if (!currentItem || !startTimeRef.current) return;

    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const totalSeconds = Math.round(currentItem.durationMinutes * 60);
    const remaining = totalSeconds - elapsed;

    setSecondsLeft(remaining);

    if (remaining <= 0) {
      advanceToNext(activeIndexRef.current);
    }
  }, [advanceToNext]);

  const startCooking = useCallback(() => {
    if (items.length === 0) return;
    setActiveIndex(0);
    setCompletedIndices(new Set());
    const firstItem = items[0];
    const firstSeconds = Math.round(firstItem.durationMinutes * 60);
    setSecondsLeft(firstSeconds);
    startTimeRef.current = Date.now();
    setPhase("running");
    setAlert({
      message: `Put in: ${firstItem.name}`,
      subtext: `${firstItem.method} — ${formatTime(firstSeconds)} on the clock`,
    });
    beep();
    intervalRef.current = setInterval(tick, 500);
  }, [items, tick]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const resetAll = () => {
    stopTimer();
    setPhase("input");
    setItems([]);
    setInput("");
    setAlert(null);
    setActiveIndex(0);
    setCompletedIndices(new Set());
    setError("");
  };

  const analyseInput = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: input }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("No items found");
      setItems(parsed);
      setPhase("ready");
    } catch (e) {
      setError("Couldn't parse that — try describing each item with its time and cooking method.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate start offsets
  const totalDuration = items.reduce((sum, i) => sum + i.durationMinutes, 0);
  let cumulativeDelay = 0;
  const schedule = items.map((item, idx) => {
    const delay = idx === 0 ? 0 : cumulativeDelay;
    if (idx > 0) cumulativeDelay += items[idx - 1].durationMinutes; // items are sorted longest first
    // Actually recalculate properly:
    return item;
  });

  // Proper schedule: item[0] starts at 0, item[1] starts when item[0] finishes (totalDuration - item[1].duration from end)
  // All items finish at the same time if we start them staggered
  // item[i] starts at: totalDuration - sum(items[i..n-1].duration)
  let runningTotal = totalDuration;
  const startOffsets = items.map(item => {
    const offset = totalDuration - runningTotal;
    runningTotal -= item.durationMinutes;
    return offset;
  });

  const isOvertime = phase === "running" && secondsLeft < 0;
  const progress = items[activeIndex]
    ? Math.max(0, Math.min(1, 1 - secondsLeft / (items[activeIndex].durationMinutes * 60)))
    : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0e0c",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#f5f0e8",
      padding: "0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      {/* Header */}
      <div style={{
        width: "100%",
        borderBottom: "1px solid #2a2520",
        padding: "20px 32px",
        display: "flex",
        alignItems: "baseline",
        gap: "12px",
        boxSizing: "border-box",
      }}>
        <span style={{ fontSize: "22px", letterSpacing: "0.08em", fontWeight: "normal", color: "#f5f0e8" }}>
          MISE EN PLACE
        </span>
        <span style={{ fontSize: "13px", color: "#6b6258", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          cooking timer
        </span>
        {phase !== "input" && (
          <button onClick={resetAll} style={{
            marginLeft: "auto", background: "none", border: "1px solid #2a2520",
            color: "#6b6258", padding: "6px 14px", cursor: "pointer", fontSize: "12px",
            letterSpacing: "0.08em", fontFamily: "inherit",
          }}>
            ← NEW MEAL
          </button>
        )}
      </div>

      <div style={{ width: "100%", maxWidth: "640px", padding: "40px 24px", boxSizing: "border-box" }}>

        {/* INPUT PHASE */}
        {phase === "input" && (
          <div>
            <p style={{ color: "#8a7d6e", fontSize: "15px", lineHeight: 1.7, marginBottom: "28px", marginTop: 0 }}>
              Describe what you're cooking — each item, how long it takes, and where it's going.
            </p>
            <div style={{
              background: "#161410", border: "1px solid #2a2520", borderRadius: "4px",
              padding: "2px",
            }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.metaKey) analyseInput(); }}
                placeholder={`e.g. Chicken breast 25 mins oven 200°C, roast potatoes 40 mins oven, peas 3 mins microwave, gravy 10 mins on the hob`}
                style={{
                  width: "100%", minHeight: "120px", background: "transparent",
                  border: "none", outline: "none", resize: "vertical",
                  color: "#f5f0e8", fontSize: "16px", fontFamily: "inherit",
                  lineHeight: 1.6, padding: "16px", boxSizing: "border-box",
                  caretColor: "#c8a96e",
                }}
              />
            </div>
            {error && (
              <p style={{ color: "#c0614a", fontSize: "13px", marginTop: "10px" }}>{error}</p>
            )}
            <button
              onClick={analyseInput}
              disabled={loading || !input.trim()}
              style={{
                marginTop: "20px", background: loading ? "#2a2520" : "#c8a96e",
                border: "none", color: loading ? "#6b6258" : "#0f0e0c",
                padding: "14px 32px", fontSize: "14px", letterSpacing: "0.1em",
                fontFamily: "inherit", cursor: loading ? "default" : "pointer",
                width: "100%", transition: "all 0.2s",
              }}
            >
              {loading ? "READING YOUR MEAL..." : "PLAN MY COOK ↵"}
            </button>
            <p style={{ color: "#3a3530", fontSize: "12px", textAlign: "center", marginTop: "12px" }}>
              ⌘ + Enter to submit
            </p>
          </div>
        )}

        {/* READY PHASE */}
        {phase === "ready" && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <p style={{ color: "#8a7d6e", fontSize: "13px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "20px", marginTop: 0 }}>
                Your cooking plan — total {Math.floor(totalDuration)}m
              </p>
              {items.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: "16px",
                  padding: "16px 0",
                  borderBottom: i < items.length - 1 ? "1px solid #1e1c18" : "none",
                }}>
                  <div style={{
                    minWidth: "48px", height: "48px", background: "#1a1812",
                    border: "1px solid #2a2520", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "22px",
                  }}>
                    {methodIcon(item.method)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: "17px", color: "#f5f0e8" }}>{item.name}</span>
                      <span style={{ color: "#c8a96e", fontSize: "15px", fontFeatureSettings: "'tnum'" }}>
                        {item.durationMinutes >= 1 ? `${item.durationMinutes}m` : `${item.durationMinutes * 60}s`}
                      </span>
                    </div>
                    <div style={{ color: "#6b6258", fontSize: "13px", marginTop: "3px" }}>{item.method}</div>
                    {item.notes && <div style={{ color: "#4a4540", fontSize: "13px", marginTop: "3px", fontStyle: "italic" }}>{item.notes}</div>}
                    <div style={{ color: "#3d5a3e", fontSize: "12px", marginTop: "6px", letterSpacing: "0.05em" }}>
                      {i === 0 ? "Goes in first" : `Goes in after ${items.slice(0, i).reduce((s, x) => s + x.durationMinutes, 0)}m`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={startCooking} style={{
              background: "#3d5a3e", border: "none", color: "#c8e6c9",
              padding: "16px 32px", fontSize: "14px", letterSpacing: "0.1em",
              fontFamily: "inherit", cursor: "pointer", width: "100%",
            }}>
              START COOKING
            </button>
          </div>
        )}

        {/* RUNNING PHASE */}
        {phase === "running" && (
          <div>
            {/* Alert banner */}
            {alert && (
              <div style={{
                background: "#1a1812", border: "1px solid #c8a96e",
                padding: "16px 20px", marginBottom: "32px",
                borderLeft: "3px solid #c8a96e",
              }}>
                <div style={{ fontSize: "17px", color: "#f5f0e8" }}>{alert.message}</div>
                <div style={{ fontSize: "13px", color: "#8a7d6e", marginTop: "4px" }}>{alert.subtext}</div>
                <button onClick={() => setAlert(null)} style={{
                  background: "none", border: "none", color: "#4a4540",
                  fontSize: "11px", cursor: "pointer", marginTop: "8px", padding: 0,
                  fontFamily: "inherit", letterSpacing: "0.08em",
                }}>DISMISS ×</button>
              </div>
            )}

            {/* Active timer */}
            {items[activeIndex] && (
              <div style={{ marginBottom: "40px", textAlign: "center" }}>
                <div style={{ color: "#6b6258", fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Now cooking
                </div>
                <div style={{ fontSize: "19px", color: "#f5f0e8", marginBottom: "4px" }}>
                  {methodIcon(items[activeIndex].method)} {items[activeIndex].name}
                </div>
                <div style={{ color: "#6b6258", fontSize: "13px", marginBottom: "28px" }}>
                  {items[activeIndex].method}
                </div>
                {/* Big countdown */}
                <div style={{
                  fontSize: "80px", fontFeatureSettings: "'tnum'",
                  color: isOvertime ? "#c0614a" : "#c8a96e",
                  letterSpacing: "0.04em", lineHeight: 1,
                  marginBottom: "20px",
                  fontStyle: isOvertime ? "italic" : "normal",
                }}>
                  {formatTime(secondsLeft)}
                </div>
                {isOvertime && (
                  <div style={{ color: "#c0614a", fontSize: "13px", letterSpacing: "0.1em" }}>
                    OVERTIME — TAKE OUT WHEN READY
                  </div>
                )}
                {/* Progress bar */}
                <div style={{ background: "#1e1c18", height: "3px", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", background: "#c8a96e",
                    width: `${progress * 100}%`, transition: "width 0.5s linear",
                  }} />
                </div>
                {items[activeIndex].notes && (
                  <div style={{ color: "#4a4540", fontSize: "13px", marginTop: "14px", fontStyle: "italic" }}>
                    {items[activeIndex].notes}
                  </div>
                )}
              </div>
            )}

            {/* Queue */}
            <div style={{ borderTop: "1px solid #1e1c18", paddingTop: "24px" }}>
              <div style={{ color: "#3a3530", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "16px" }}>
                Coming up
              </div>
              {items.map((item, i) => {
                const isDone = completedIndices.has(i);
                const isActive = i === activeIndex;
                const isFuture = !isDone && !isActive;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    padding: "10px 0",
                    opacity: isDone ? 0.3 : isFuture ? 0.6 : 1,
                    borderBottom: i < items.length - 1 ? "1px solid #161410" : "none",
                  }}>
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: isDone ? "#2a2520" : isActive ? "#c8a96e" : "#3a3530",
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: "15px", color: isDone ? "#4a4540" : "#c8bfb4", textDecoration: isDone ? "line-through" : "none" }}>
                      {item.name}
                    </span>
                    <span style={{ marginLeft: "auto", color: "#4a4540", fontSize: "13px", fontFeatureSettings: "'tnum'" }}>
                      {item.durationMinutes}m
                    </span>
                    {isDone && <span style={{ color: "#3d5a3e", fontSize: "12px" }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DONE PHASE */}
        {phase === "done" && (
          <div style={{ textAlign: "center", paddingTop: "40px" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>🍽</div>
            <div style={{ fontSize: "26px", color: "#c8a96e", marginBottom: "8px" }}>Everything's ready.</div>
            <div style={{ color: "#6b6258", fontSize: "15px", marginBottom: "40px" }}>Time to plate up. Enjoy your meal.</div>
            <div style={{ borderTop: "1px solid #1e1c18", paddingTop: "24px" }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", justifyContent: "center" }}>
                  <span style={{ color: "#3d5a3e" }}>✓</span>
                  <span style={{ color: "#4a4540", fontSize: "14px" }}>{item.name}</span>
                </div>
              ))}
            </div>
            <button onClick={resetAll} style={{
              marginTop: "32px", background: "none", border: "1px solid #2a2520",
              color: "#6b6258", padding: "12px 28px", fontSize: "13px",
              letterSpacing: "0.1em", fontFamily: "inherit", cursor: "pointer",
            }}>
              COOK AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
