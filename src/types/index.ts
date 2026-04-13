import { Timestamp } from 'firebase/firestore';

export type TripStatus = 'open' | 'full' | 'ongoing' | 'departed' | 'completed' | 'cancelled';
export type TripType = 'morning' | 'evening';
export type PhotoType = 'face' | 'id' | 'plate';

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color: string;
  ltfrbPermitNumber?: string | null;
  ltfrbQrPhotoUrl?: string | null;
  ltoRegistrationNumber?: string | null;
  insuranceProvider?: string | null;
  insuranceExpiry?: string | null;
  driverLicenseNumber?: string | null;
  driverLicenseExpiry?: string | null;
}

export interface ExchangePhoto {
  url: string;
  publicId: string;
  type: PhotoType;
  uploadedBy: string;
  uploadedAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  homeAddress?: string;
  vehicle?: Vehicle;
  tripCount: number;
  rating: number;
  ratingCount: number;
  consentVersion?: string;
  consentAcceptedAt?: Timestamp;
  deleteAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  fcmToken?: string;
  lastActiveAt: Timestamp;
  joinedTripIds?: string[];
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionNote?: string;
  isHoaMember?: boolean;
  communityName?: string;
}

export interface Trip {
  id: string;
  driverUid: string;
  driverName: string;
  driverPhotoUrl?: string;
  driverRating?: number;
  driverTripCount?: number;
  vehicle: {
    make: string;
    model: string;
    color: string;
    plateLastThree: string;
    plateNumber: string;
    ltfrbPermitNumber?: string;
  };
  origin: string;
  destination: string;
  departureTime: Timestamp;
  waitingMinutes: number;
  availableSeats: number;
  filledSeats: number;
  gasContribution?: number;
  status: TripStatus;
  tripType: TripType;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  manifestLinkId?: string;
  exchangePhotos?: Record<string, ExchangePhoto>;
}

export interface ConsentRecord {
  version: string;
  acceptedAt: Timestamp;
}

export interface PassengerEntry {
  uid: string;
  fullName: string;
  mobileNumber: string;
  joinedAt: Timestamp;
  status: 'confirmed' | 'cancelled';
  cancelledAt?: Timestamp;
  boardPhotoUrl?: string;
  boardPhotoUploadedAt?: Timestamp;
}

export interface Rating {
  tripId: string;
  fromUid: string;
  toUid: string;
  stars: number;
  createdAt: Timestamp;
  deleteAt: Timestamp;
}
