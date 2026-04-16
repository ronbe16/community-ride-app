import { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip } from '@/types';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (unsubRef.current) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'trips'),
      where('status', 'in', ['open', 'full', 'ongoing', 'completed']),
      where('departureTime', '>=', Timestamp.fromDate(todayStart)),
      orderBy('departureTime', 'asc'),
      limit(50),
    );

    unsubRef.current = onSnapshot(
      q,
      (snap) => {
        setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip)));
        setLoading(false);
      },
      (err) => {
        const indexUrl = /https:\/\/console\.firebase\.google\.com\S+/.exec(err.message)?.[0];
        if (indexUrl) {
          console.error('Missing Firestore composite index for trips query. Create it here:', indexUrl);
        } else {
          console.error('Failed to subscribe to trips:', err);
        }
        setLoading(false);
      },
    );

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, []);

  return { trips, loading };
}
