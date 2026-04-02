import { Timestamp } from 'firebase/firestore';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export function ninetyDaysFromNow(): Timestamp {
  return Timestamp.fromMillis(Date.now() + NINETY_DAYS_MS);
}

export function ninetyDaysFrom(date: Date): Timestamp {
  return Timestamp.fromMillis(date.getTime() + NINETY_DAYS_MS);
}
