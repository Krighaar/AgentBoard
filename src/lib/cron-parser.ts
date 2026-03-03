/**
 * Lightweight 5-field cron parser (minute hour day-of-month month day-of-week).
 * Supports: numbers, wildcards (*), ranges (1-5), steps (*\/5, 1-10\/2), lists (1,3,5).
 * No npm dependencies.
 */

function parseField(field: string, min: number, max: number): Set<number> {
  const values = new Set<number>();

  for (const part of field.split(",")) {
    const trimmed = part.trim();

    // Handle step: */n or range/n
    if (trimmed.includes("/")) {
      const [rangePart, stepStr] = trimmed.split("/");
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) continue;

      let start = min;
      let end = max;

      if (rangePart !== "*") {
        if (rangePart.includes("-")) {
          const [lo, hi] = rangePart.split("-").map(Number);
          start = lo;
          end = hi;
        } else {
          start = parseInt(rangePart, 10);
        }
      }

      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) values.add(i);
      }
      continue;
    }

    // Handle wildcard
    if (trimmed === "*") {
      for (let i = min; i <= max; i++) values.add(i);
      continue;
    }

    // Handle range: a-b
    if (trimmed.includes("-")) {
      const [lo, hi] = trimmed.split("-").map(Number);
      for (let i = lo; i <= hi; i++) {
        if (i >= min && i <= max) values.add(i);
      }
      continue;
    }

    // Single number
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= min && num <= max) {
      values.add(num);
    }
  }

  return values;
}

function parseCron(expression: string) {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return null;

  return {
    minutes: parseField(fields[0], 0, 59),
    hours: parseField(fields[1], 0, 23),
    daysOfMonth: parseField(fields[2], 1, 31),
    months: parseField(fields[3], 1, 12),
    daysOfWeek: parseField(fields[4], 0, 6), // 0=Sunday
  };
}

/**
 * Check if a cron expression matches the current minute.
 */
export function shouldRunNow(expression: string, now?: Date): boolean {
  const parsed = parseCron(expression);
  if (!parsed) return false;

  const d = now ?? new Date();
  return (
    parsed.minutes.has(d.getMinutes()) &&
    parsed.hours.has(d.getHours()) &&
    parsed.daysOfMonth.has(d.getDate()) &&
    parsed.months.has(d.getMonth() + 1) &&
    parsed.daysOfWeek.has(d.getDay())
  );
}

/**
 * Get the next run time for a cron expression (searches up to 366 days ahead).
 */
export function nextRun(expression: string, from?: Date): Date | null {
  const parsed = parseCron(expression);
  if (!parsed) return null;

  const d = from ? new Date(from) : new Date();
  // Start from the next minute
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);

  const maxIterations = 366 * 24 * 60; // ~1 year in minutes
  for (let i = 0; i < maxIterations; i++) {
    if (
      parsed.minutes.has(d.getMinutes()) &&
      parsed.hours.has(d.getHours()) &&
      parsed.daysOfMonth.has(d.getDate()) &&
      parsed.months.has(d.getMonth() + 1) &&
      parsed.daysOfWeek.has(d.getDay())
    ) {
      return new Date(d);
    }
    d.setMinutes(d.getMinutes() + 1);
  }

  return null;
}

/**
 * Return a human-readable description of a cron expression.
 */
export function describeCron(expression: string): string {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return "Invalid cron expression";

  const [minute, hour, dom, month, dow] = fields;

  // Common patterns
  if (expression === "* * * * *") return "Every minute";
  if (minute !== "*" && hour === "*" && dom === "*" && month === "*" && dow === "*") {
    return `Every hour at minute ${minute}`;
  }
  if (minute !== "*" && hour !== "*" && dom === "*" && month === "*" && dow === "*") {
    return `Daily at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }
  if (minute !== "*" && hour !== "*" && dom === "*" && month === "*" && dow !== "*") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayNames = dow.split(",").map((d) => days[parseInt(d)] || d).join(", ");
    return `${dayNames} at ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  }

  return `${minute} ${hour} ${dom} ${month} ${dow}`;
}
