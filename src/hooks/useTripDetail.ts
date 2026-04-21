import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, collection, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDocWithRetry } from '@/lib/firestore-utils';
import { Trip, PassengerEntry } from '@/types';

interface UseTripDetailResult {
  trip: Trip | null;
  passengers: PassengerEntry[];
  loading: boolean;
  isJoinedPassenger: boolean;
  driverMobile: string | null;
  boardScanUrl: string | null;
}

export function useTripDetail(tripId: string | undefined, firebaseUser: User | null): UseTripDetailResult {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [passengers, setPassengers] = useState<PassengerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoinedPassenger, setIsJoinedPassenger] = useState(false);
  const [driverMobile, setDriverMobile] = useState<string | null>(null);
  const [boardScanUrl, setBoardScanUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    const unsubTrip = onSnapshot(
      doc(db, 'trips', tripId),
      (snap) => {
        if (snap.exists()) {
          setTrip({ id: snap.id, ...snap.data() } as Trip);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Failed to subscribe to trip ${tripId}:`, err);
        setLoading(false);
      },
    );
    return unsubTrip;
  }, [tripId]);

  useEffect(() => {
    if (!tripId || !trip) return;
    const isDriver = firebaseUser?.uid === trip.driverUid;
    if (!isDriver) return;

    const unsubPassengers = onSnapshot(
      collection(db, 'trips', tripId, 'passengers'),
      (snap) => {
        setPassengers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as PassengerEntry)));
      },
      (err) => {
        console.error(`Failed to subscribe to passengers for trip ${tripId}:`, err);
      },
    );
    return unsubPassengers;
  }, [tripId, trip, firebaseUser]);

  useEffect(() => {
    if (!tripId || !firebaseUser?.uid) return;

    const passengerRef = doc(db, 'trips', tripId, 'passengers', firebaseUser.uid);
    const unsub = onSnapshot(
      passengerRef,
      (snap) => {
        setIsJoinedPassenger(snap.exists() && snap.data()?.status === 'confirmed');
        setBoardScanUrl(snap.exists() ? (snap.data()?.boardPhotoUrl as string | null) ?? null : null);
      },
      (err: unknown) => {
        console.error(`Failed to subscribe to passenger join status for trip ${tripId}:`, err);
        setIsJoinedPassenger(false);
        setBoardScanUrl(null);
      },
    );
    return () => unsub();
  }, [tripId, firebaseUser?.uid]);

  useEffect(() => {
    if (!isJoinedPassenger || !trip?.driverUid) return;
    getDocWithRetry(doc(db, 'users', trip.driverUid)).then((snap) => {
      if (snap.exists()) {
        setDriverMobile((snap.data().mobileNumber as string) ?? null);
      }
    }).catch((err: unknown) => {
      console.error(`Failed to fetch driver mobile for trip ${tripId}:`, err);
    });
  }, [isJoinedPassenger, trip?.driverUid]);

  useEffect(() => {
    if (!trip || !tripId) return;
    const isDriver = firebaseUser?.uid === trip.driverUid;
    if (!isDriver) return;
    if (trip.status !== 'open' && trip.status !== 'full') return;

    const departureMs = trip.departureTime.toDate().getTime();
    if (Date.now() > departureMs) {
      updateDoc(doc(db, 'trips', tripId), { status: 'departed' }).catch((err: unknown) => {
        console.error(`Failed to auto-mark trip ${tripId} as departed:`, err);
      });
    }
  }, [trip, tripId, firebaseUser?.uid]);

  return { trip, passengers, loading, isJoinedPassenger, driverMobile, boardScanUrl };
}
