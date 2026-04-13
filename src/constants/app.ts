export const APP_NAME = 'Community Ride';
export const APP_VERSION = '1.0.2';

export interface ChangelogEntry {
  version: string;
  date: string;
  notes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.0.2',
    date: 'April 2026',
    notes: [
      'Fixed trip count not updating on driver profile after completing a trip',
      'Fixed safety exchange photos — all passengers can now independently take photos',
      'Fixed safety card visibility — driver scanning a passenger no longer affects other passengers',
    ],
  },
  {
    version: '1.0.1',
    date: 'April 2026',
    notes: [
      'Fixed tripCount increment silently failing on Complete Trip',
      'Fixed trip documents missing deleteAt field on creation',
      'Added app version display on profile page',
    ],
  },
  {
    version: '1.0.0',
    date: 'April 2026',
    notes: [
      'Beta launch',
    ],
  },
];
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
