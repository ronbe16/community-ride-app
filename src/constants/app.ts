export const APP_NAME = 'Community Ride';
export const APP_VERSION = '1.0.0';
export const TERMS_VERSION = 'v1.0';
export const PRIVACY_VERSION = 'v1.0';
export const CONSENT_VERSION = `terms-${TERMS_VERSION}-privacy-${PRIVACY_VERSION}`;

export const COMMUNITY_NAME = import.meta.env.VITE_COMMUNITY_NAME || 'Your Village';
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

export const MAX_TRIPS_PER_DAY = 2;
export const VEHICLE_MAX_AGE_YEARS = 5;
export const SAFETY_LINK_EXPIRY_HOURS = 48;
export const PASSENGER_SCAN_RETENTION_DAYS = 7;
export const WAITING_TIME_OPTIONS = [5, 10, 15, 20, 30];
export const MAX_SEATS = 4;

export const USER_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
} as const;

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

export const USER_ROLE = {
  DRIVER: 'driver',
  PASSENGER: 'passenger',
} as const;
