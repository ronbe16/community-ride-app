import { useEffect, useState, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip } from '@/types';
import { isWithinCarpoolWindow, msUntilNextWindow } from '@/lib/carpool-windows';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [withinWindow, setWithinWindow] = useState(isWithinCarpoolWindow());
  const unsubRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startListener() {
    if (unsubRef.current) return; // already listening

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'trips'),
      where('status', '==', 'open'),
      where('departureTime', '>=', Timestamp.fromDate(todayStart)),
      orderBy('departureTime', 'asc'),
    );

    unsubRef.current = onSnapshot(
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
  }

  function stopListener() {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
  }

  function scheduleNextWindowCheck() {
    if (timerRef.current) clearTimeout(timerRef.current);
    const ms = msUntilNextWindow();
    timerRef.current = setTimeout(() => {
      setWithinWindow(true);
    }, ms);
  }

  useEffect(() => {
    if (withinWindow) {
      startListener();
    } else {
      stopListener();
      setLoading(false);
      scheduleNextWindowCheck();
    }

    return () => {
      stopListener();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withinWindow]);

  // Auto-deactivate when window closes mid-session
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const nowInWindow = isWithinCarpoolWindow();
      if (!nowInWindow && withinWindow) {
        setWithinWindow(false);
        setTrips([]);
      }
    }, 60 * 1000); // check every minute

    return () => clearInterval(checkInterval);
  }, [withinWindow]);

  return { trips, loading, withinWindow };
}
