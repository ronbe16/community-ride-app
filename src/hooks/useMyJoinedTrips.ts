import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function useMyJoinedTrips() {
  const { firebaseUser, userProfile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser || !userProfile) {
      setTrips([]);
      setLoading(false);
      return;
    }

    // Listen to user doc for joinedTripIds changes
    const unsubUser = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      async (userSnap) => {
        if (!userSnap.exists()) {
          setTrips([]);
          setLoading(false);
          return;
        }

        const joinedTripIds: string[] = userSnap.data().joinedTripIds ?? [];

        if (joinedTripIds.length === 0) {
          setTrips([]);
          setLoading(false);
          return;
        }

        try {
          const CHUNK_SIZE = 30;
          const chunks: string[][] = [];
          for (let i = 0; i < joinedTripIds.length; i += CHUNK_SIZE) {
            chunks.push(joinedTripIds.slice(i, i + CHUNK_SIZE));
          }
          const snapshots = await Promise.all(
            chunks.map((chunk) =>
              getDocs(query(collection(db, 'trips'), where(documentId(), 'in', chunk)))
            )
          );
          const tripDocs = snapshots.flatMap((snap) => snap.docs);
          setTrips(tripDocs.filter((d) => d.exists()).map((d) => ({ id: d.id, ...d.data() } as Trip)));
        } catch (err) {
          console.error(`Failed to fetch joined trips for user ${firebaseUser.uid}:`, err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(`Failed to subscribe to user doc for joined trips (${firebaseUser.uid}):`, err);
        setLoading(false);
      },
    );

    return unsubUser;
  }, [firebaseUser, userProfile]);

  return { trips, loading };
}
