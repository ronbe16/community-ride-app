import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useHasOngoingRide(uid: string | undefined) {
  const [hasOngoingRide, setHasOngoingRide] = useState(false);
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'trips'),
      where('passengerUids', 'array-contains', uid),
      where('status', '==', 'ongoing'),
    );
    return onSnapshot(
      q,
      (snap) => { setHasOngoingRide(!snap.empty); },
      (err: unknown) => { console.error(`Failed to subscribe to ongoing ride for ${uid}:`, err); },
    );
  }, [uid]);
  return hasOngoingRide;
}
