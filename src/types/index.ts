import { Timestamp } from 'firebase/firestore';

export type UserStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
export type UserRole = 'driver' | 'passenger';
export type TripStatus = 'open' | 'full' | 'departed' | 'cancelled';
export type TripType = 'morning' | 'evening';

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color: string;
  ltfrbPermitNumber?: string;
  ltfrbQrPhotoUrl?: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  mobileNumber: string;
  homeAddress: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  rejectionNote?: string;
  vehicle?: Vehicle;
  idPhotoUrl: string;
  idVerifiedAt?: Timestamp;
  idVerifiedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  fcmToken?: string;
  lastActiveAt: Timestamp;
  deleteAt?: Timestamp;
  joinedTripIds?: string[];
  consentVersion?: string;
  consentAcceptedAt?: Timestamp;
}

export interface Trip {
  id: string;
  driverUid: string;
  driverName: string;
  driverPhotoUrl?: string;
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
