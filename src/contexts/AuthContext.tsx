import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, serverTimestamp, FirestoreError } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { ninetyDaysFromNow } from '@/lib/retention';

interface AuthContextType {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  profileLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    let cancelled = false;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      unsubProfile?.();
      unsubProfile = undefined;

      setFirebaseUser(user);

      if (!user) {
        setUserProfile(null);
        setLoading(false);
        setProfileLoading(false);
        return;
      }

      // Auth is resolved — unblock protected routes immediately
      setLoading(false);
      setProfileLoading(true);

      // Write ONCE on login — outside the snapshot to prevent an infinite write loop
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          deleteAt: ninetyDaysFromNow(),
          lastActiveAt: serverTimestamp(),
        });
      } catch (e: unknown) {
        // doc may not exist yet for new SSO users — safe to ignore
        if (!(e instanceof FirestoreError && e.code === 'not-found')) {
          console.error(`Failed to extend retention window for user ${user.uid}:`, e);
        }
      }

      if (cancelled) return;

      unsubProfile = onSnapshot(
        doc(db, 'users', user.uid),
        (snap) => {
          if (snap.exists()) {
            setUserProfile({ uid: snap.id, ...snap.data() } as UserProfile);
          } else {
            setUserProfile(null);
          }
          setProfileLoading(false);
        },
        (err) => {
          console.error(`Failed to subscribe to user profile for ${user.uid}:`, err);
          setProfileLoading(false);
        },
      );
    });

    return () => {
      cancelled = true;
      unsubAuth();
      unsubProfile?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, profileLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
