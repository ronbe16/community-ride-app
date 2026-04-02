import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { ninetyDaysFromNow } from '@/lib/retention';

interface AuthContextType {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isVerified: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  isAdmin: false,
  isVerified: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminUids, setAdminUids] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load community config (admin UIDs) once
  useEffect(() => {
    getDoc(doc(db, 'community', 'config')).then((snap) => {
      if (snap.exists()) setAdminUids(snap.data().adminUids || []);
    }).catch((err: unknown) => {
      console.error('Failed to load community config:', err);
    });
  }, []);

  // Auth state + real-time user profile listener
  useEffect(() => {
    // Holds the Firestore profile unsubscribe so we can clean it up when the
    // auth user changes or the component unmounts.
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Always tear down the previous profile listener before starting a new one
      unsubProfile?.();
      unsubProfile = undefined;

      setFirebaseUser(user);

      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      unsubProfile = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          if (snap.exists()) {
            setUserProfile({ uid: snap.id, ...snap.data() } as UserProfile);
            // Extend retention window on every login — keeps active users from being purged
            updateDoc(doc(db, 'users', user.uid), {
              deleteAt: ninetyDaysFromNow(),
              lastActiveAt: serverTimestamp(),
            }).catch((err: unknown) => {
              console.error(`Failed to extend retention window for user ${user.uid}:`, err);
            });
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error(`Failed to subscribe to user profile for ${user.uid}:`, err);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, []);

  const isAdmin = firebaseUser ? adminUids.includes(firebaseUser.uid) : false;
  const isVerified = userProfile?.status === 'verified';

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, isAdmin, isVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
