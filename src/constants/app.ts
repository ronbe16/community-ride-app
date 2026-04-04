export const APP_NAME = 'Community Ride';
export const APP_VERSION = '1.0.0';
export const TERMS_VERSION = 'v1.0';
export const PRIVACY_VERSION = 'v1.0';
export const CONSENT_VERSION = `terms-${TERMS_VERSION}-privacy-${PRIVACY_VERSION}`;

export const COMMUNITY_NAME = import.meta.env.VITE_COMMUNITY_NAME || 'Your Village';

export const MAX_TRIPS_PER_DAY = 2;
export const SAFETY_LINK_EXPIRY_HOURS = 48;
export const WAITING_TIME_OPTIONS = [5, 10, 15, 20, 30];
export const MAX_SEATS = 4;

export const TRIP_STATUS = {
  OPEN: 'open',
  FULL: 'full',
  DEPARTED: 'departed',
  CANCELLED: 'cancelled',
} as const;

export const TRIP_TYPE = {
  MORNING: 'morning',
  EVENING: 'evening',
} as const;
