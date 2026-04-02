import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip } from '@/types';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'trips'),
      where('status', '==', 'open'),
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
        console.error('Failed to subscribe to trips:', err);
        setLoading(false);
      },
    );

    return unsub;
  }, []);

  return { trips, loading };
}
