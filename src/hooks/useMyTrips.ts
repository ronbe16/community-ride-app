import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useMyTrips() {
  const { firebaseUser } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setTrips([]);
      setLoading(false);
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'trips'),
      where('driverUid', '==', firebaseUser.uid),
      where('status', 'in', ['open', 'full']),
      where('departureTime', '>=', Timestamp.fromDate(todayStart)),
      orderBy('departureTime', 'asc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip)));
        setLoading(false);
      },
      (err) => {
        console.error(`Failed to subscribe to trips for driver ${firebaseUser.uid}:`, err);
        setLoading(false);
      },
    );

    return unsub;
  }, [firebaseUser]);

  return { trips, loading };
}
