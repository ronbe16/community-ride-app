// All times in PHT (Asia/Manila, UTC+8)
// Update MORNING_START/END and EVENING_START/END when final LTFRB circular is published

export const WINDOWS = {
  morning: { start: 5, end: 10 },   // 5:00 AM – 10:00 AM PHT
  evening: { start: 16, end: 22 },  // 4:00 PM – 10:00 PM PHT
} as const;

function getPhtHour(): number {
  const now = new Date();
  const phtOffset = 8 * 60; // UTC+8 in minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const phtMinutes = (utcMinutes + phtOffset) % (24 * 60);
  return phtMinutes / 60;
}

/**
 * Returns true if the current PHT time falls within a carpool window.
 */
export function isWithinCarpoolWindow(): boolean {
  const phtHour = getPhtHour();
  return (
    (phtHour >= WINDOWS.morning.start && phtHour < WINDOWS.morning.end) ||
    (phtHour >= WINDOWS.evening.start && phtHour < WINDOWS.evening.end)
  );
}

/**
 * Returns a human-readable label for the next window opening.
 * Used in the off-window empty state on the Dashboard.
 */
export function getNextWindowLabel(): string {
  const phtHour = getPhtHour();

  if (phtHour < WINDOWS.morning.start) return '5:00 AM';
  if (phtHour < WINDOWS.evening.start) return '4:00 PM';
  return '5:00 AM tomorrow';
}

/**
 * Returns milliseconds until the next carpool window opens.
 * Used to schedule automatic listener activation.
 */
export function msUntilNextWindow(): number {
  const now = new Date();
  const phtOffset = 8 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const phtMinutes = (utcMinutes + phtOffset) % (24 * 60);
  const phtHour = phtMinutes / 60;

  let nextWindowHourPHT: number;

  if (phtHour < WINDOWS.morning.start) {
    nextWindowHourPHT = WINDOWS.morning.start;
  } else if (phtHour < WINDOWS.evening.start) {
    nextWindowHourPHT = WINDOWS.evening.start;
  } else {
    // After evening window — next is morning tomorrow
    nextWindowHourPHT = WINDOWS.morning.start + 24;
  }

  const minutesUntil = nextWindowHourPHT * 60 - phtMinutes;
  return minutesUntil * 60 * 1000;
}
