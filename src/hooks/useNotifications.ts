import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function getAndSaveToken(uid: string) {
  getToken(messaging, { vapidKey: VAPID_KEY })
    .then((token) => {
      if (token) {
        updateDoc(doc(db, 'users', uid), { fcmToken: token }).catch((err: unknown) => {
          console.error(`Failed to save FCM token for user ${uid}:`, err);
        });
      }
    })
    .catch((err: unknown) => {
      console.error(`Failed to get FCM token for user ${uid}:`, err);
    });
}

export function useNotifications() {
  const { firebaseUser } = useAuth();

  useEffect(() => {
    if (!firebaseUser) return;

    if (Notification.permission === 'denied') return;

    if (Notification.permission === 'granted') {
      getAndSaveToken(firebaseUser.uid);
    } else {
      Notification.requestPermission()
        .then((permission) => {
          if (permission === 'granted') {
            getAndSaveToken(firebaseUser.uid);
          }
        })
        .catch((err: unknown) => {
          console.error('Failed to request notification permission:', err);
        });
    }

    const unsub = onMessage(messaging, (payload) => {
      toast({
        title: payload.notification?.title ?? 'Notification',
        description: payload.notification?.body,
      });
    });

    return unsub;
  }, [firebaseUser?.uid]);
}
