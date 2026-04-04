import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function useNotifications() {
  const { firebaseUser, userProfile } = useAuth();

  useEffect(() => {
    if (!firebaseUser || !userProfile) return;

    Notification.requestPermission().then((permission) => {
      if (permission !== 'granted') return;

      getToken(messaging, { vapidKey: VAPID_KEY }).then((token) => {
        if (token) {
          updateDoc(doc(db, 'users', firebaseUser.uid), { fcmToken: token }).catch((err: unknown) => {
            console.error(`Failed to save FCM token for user ${firebaseUser.uid}:`, err);
          });
        }
      }).catch((err: unknown) => {
        console.error(`Failed to get FCM token for user ${firebaseUser.uid}:`, err);
      });
    }).catch((err: unknown) => {
      console.error('Failed to request notification permission:', err);
    });

    const unsub = onMessage(messaging, (payload) => {
      toast({
        title: payload.notification?.title ?? 'Notification',
        description: payload.notification?.body,
      });
    });

    return unsub;
  }, [firebaseUser, userProfile]);
}
