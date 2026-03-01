import {
  Microwave,
  Wind,
  Square,
  Flame,
  Heater,
  Timer,
} from "lucide-vue-next";

export function methodIcon(method) {
  const m = method.toLowerCase();
  if (m.includes("microwave")) return Microwave;
  if (m.includes("air fryer") || m.includes("airfryer")) return Wind;
  if (m.includes("oven")) return Square;
  if (m.includes("hob") || m.includes("boil") || m.includes("simmer") || m.includes("pan") || m.includes("fry")) return Flame;
  if (m.includes("grill")) return Heater;
  return Timer;
}
