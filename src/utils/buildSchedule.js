const PREHEAT_MINUTES = {
  'Oven': 5,
  'Air fryer': 5,
  'Grill': 5,
};

// Appliances where multiple items can cook at the same time (e.g. oven shelves, hob burners).
// Items overlap — chain time = preheat + longest single item.
const OVERLAPPING = new Set(['Oven', 'Grill', 'Hob']);

// All other appliances (Air fryer, Microwave) are sequential —
// only one item at a time, chain time = preheat + sum of all items.

const PREPOSITION = {
  Hob: 'on',
};

/**
 * Takes raw cooking items from the AI and produces a deterministic,
 * optimally-scheduled sequential step list.
 *
 * Each returned step has: name, method, durationMinutes, notes, type.
 * durationMinutes = time until the NEXT action (not the item's cooking time).
 */
export function buildSchedule(rawItems) {
  // 1. Group items by appliance
  const groups = {};
  for (const item of rawItems) {
    const m = item.method;
    if (!groups[m]) groups[m] = [];
    groups[m].push(item);
  }

  // 2. Sort items within each appliance by cookingMinutes descending (longest first)
  for (const m in groups) {
    groups[m].sort((a, b) => b.cookingMinutes - a.cookingMinutes);
  }

  // 3. Calculate each appliance chain's total time
  const chains = {};
  for (const m in groups) {
    const preheat = PREHEAT_MINUTES[m] || 0;
    if (OVERLAPPING.has(m)) {
      // Items cook simultaneously — chain = preheat + longest item
      const maxCooking = groups[m][0].cookingMinutes;
      chains[m] = { preheat, total: preheat + maxCooking, sequential: false };
    } else {
      // Items cook one at a time — chain = preheat + sum of all items
      const sumCooking = groups[m].reduce((s, i) => s + i.cookingMinutes, 0);
      chains[m] = { preheat, total: preheat + sumCooking, sequential: true };
    }
  }

  // 4. Total time = the longest appliance chain
  const totalTime = Math.max(...Object.values(chains).map((c) => c.total));

  // 5. Build timeline events with absolute start times.
  //    Each chain is back-scheduled so it finishes exactly at totalTime.
  const events = [];

  for (const m in groups) {
    const chain = chains[m];
    const chainStart = totalTime - chain.total;

    // Preheat event
    if (chain.preheat > 0) {
      const temp = groups[m]
        .map((i) => i.temperature)
        .filter(Boolean)
        .sort()
        .pop();
      const label = temp
        ? `Preheat ${m.toLowerCase()} to ${temp}`
        : `Preheat ${m.toLowerCase()}`;
      events.push({
        name: label,
        method: m,
        startTime: chainStart,
        type: 'preheat',
        notes: '',
      });
    }

    // Cooking events
    const prep = PREPOSITION[m] || 'in';
    if (chain.sequential) {
      // Sequential: items cook one after another
      let t = chainStart + chain.preheat;
      for (const item of groups[m]) {
        events.push({
          name: `Cook ${item.name} ${prep} the ${m.toLowerCase()}`,
          method: item.temperature ? `${m} ${item.temperature}` : m,
          startTime: t,
          type: 'cook',
          notes: item.notes || '',
        });
        t += item.cookingMinutes;
      }
    } else {
      // Overlapping: each item starts so it finishes at totalTime
      for (const item of groups[m]) {
        events.push({
          name: `Put ${item.name} ${prep} the ${m.toLowerCase()}`,
          method: item.temperature ? `${m} ${item.temperature}` : m,
          startTime: totalTime - item.cookingMinutes,
          type: 'cook',
          notes: item.notes || '',
        });
      }
    }
  }

  // 6. Sort by start time (stable — preserves insertion order for ties)
  events.sort((a, b) => a.startTime - b.startTime);

  // 7. Convert to sequential steps: durationMinutes = gap until the next event
  return events.map((ev, i) => {
    const nextStart =
      i < events.length - 1 ? events[i + 1].startTime : totalTime;
    return {
      name: ev.name,
      method: ev.method,
      durationMinutes: nextStart - ev.startTime,
      notes: ev.notes,
      type: ev.type,
    };
  });
}
