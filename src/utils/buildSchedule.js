const PREHEAT_MINUTES = {
  'Oven': 5,
  'Air fryer': 5,
  'Grill': 5,
};

const PREPOSITION = {
  Hob: 'on',
};

/**
 * Takes raw cooking items from the AI and produces a deterministic,
 * optimally-scheduled sequential step list.
 *
 * Items with the same `group` are chained sequentially (in array order).
 * Independent items on overlapping appliances (Oven, Grill, Hob) run simultaneously.
 * Items on sequential appliances (Air fryer, Microwave) run one after another.
 *
 * Each returned step has: name, method, durationMinutes, notes, type.
 * durationMinutes = time until the NEXT action (not the item's cooking time).
 */
export function buildSchedule(rawItems) {
  // 1. Build groups — each group is an ordered chain of steps
  const groupMap = {};
  for (const item of rawItems) {
    const key = item.group || item.name;
    if (!groupMap[key]) groupMap[key] = [];
    groupMap[key].push(item);
  }

  // 2. Calculate total time for each group (sum of all steps in chain)
  const groupChains = [];
  for (const [key, steps] of Object.entries(groupMap)) {
    const totalMinutes = steps.reduce((s, i) => s + i.cookingMinutes, 0);
    // Collect unique appliances that need preheating
    const appliances = [...new Set(steps.map((s) => s.method))];
    const preheatNeeded = appliances.filter((a) => PREHEAT_MINUTES[a]);
    groupChains.push({ key, steps, totalMinutes, preheatNeeded });
  }

  // 3. Total meal time = longest group chain + preheat
  //    We need to account for preheat of any appliance used by any group
  const allAppliances = [...new Set(rawItems.map((i) => i.method))];
  const preheatTime = Math.max(
    0,
    ...allAppliances.map((a) => PREHEAT_MINUTES[a] || 0)
  );
  const longestChain = Math.max(...groupChains.map((g) => g.totalMinutes));
  const totalTime = preheatTime + longestChain;

  // 4. Build timeline events
  const events = [];

  // Add preheat events for each appliance that needs it
  const preheatedAppliances = new Set();
  for (const appliance of allAppliances) {
    if (PREHEAT_MINUTES[appliance] && !preheatedAppliances.has(appliance)) {
      preheatedAppliances.add(appliance);
      // Find highest temperature for this appliance
      const temp = rawItems
        .filter((i) => i.method === appliance)
        .map((i) => i.temperature)
        .filter(Boolean)
        .sort()
        .pop();
      const label = temp
        ? `Preheat ${appliance.toLowerCase()} to ${temp}`
        : `Preheat ${appliance.toLowerCase()}`;
      events.push({
        name: label,
        method: appliance,
        startTime: 0,
        type: 'preheat',
        notes: '',
      });
    }
  }

  // 5. Schedule each group chain, back-scheduled so it finishes at totalTime
  for (const group of groupChains) {
    const chainStart = totalTime - group.totalMinutes;
    let t = chainStart;

    for (const item of group.steps) {
      const name = item.name.charAt(0).toUpperCase() + item.name.slice(1);
      events.push({
        name,
        method: item.temperature ? `${item.method} ${item.temperature}` : item.method,
        startTime: t,
        type: 'cook',
        notes: item.notes || '',
      });
      t += item.cookingMinutes;
    }
  }

  // 6. Sort by start time (stable — preserves insertion order for ties)
  events.sort((a, b) => a.startTime - b.startTime);

  // 7. Merge events at the same start time and method
  const merged = [];
  for (const ev of events) {
    const prev = merged[merged.length - 1];
    if (prev && prev.startTime === ev.startTime && prev.method === ev.method && prev.type === ev.type) {
      prev.name += ` & ${ev.name.charAt(0).toLowerCase() + ev.name.slice(1)}`;
      if (ev.notes) {
        prev.notes = prev.notes ? `${prev.notes}; ${ev.notes}` : ev.notes;
      }
    } else {
      merged.push({ ...ev });
    }
  }

  // 8. Convert to sequential steps: durationMinutes = gap until the next event
  return merged.map((ev, i) => {
    const nextStart =
      i < merged.length - 1 ? merged[i + 1].startTime : totalTime;
    return {
      name: ev.name,
      method: ev.method,
      durationMinutes: nextStart - ev.startTime,
      notes: ev.notes,
      type: ev.type,
    };
  });
}
