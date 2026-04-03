import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { useNotifications } from '@/hooks/useNotifications';
import { CONSENT_VERSION } from '@/constants/app';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';

function ReconsentModal({ onAccept }: { onAccept: () => Promise<void> }) {
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAccept() {
    if (!checked) return;
    setSaving(true);
    try {
      await onAccept();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-lg">
        <h2 className="text-foreground font-semibold text-lg">Updated terms</h2>
        <p className="text-muted-foreground text-sm">
          Our Terms of Use and Privacy Policy have been updated. Please review and accept them to continue using Community Ride.
        </p>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Key points:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Trip history is auto-deleted after 90 days</li>
            <li>Accounts inactive for 90 days are deleted</li>
            <li>Safety card links are accessible without login</li>
            <li>Community Ride is a coordination tool, not a transport service</li>
          </ul>
        </div>
        <div className="flex gap-2 text-sm">
          <Link to="/terms" target="_blank" className="text-primary underline">Terms of Use</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/privacy" target="_blank" className="text-primary underline">Privacy Policy</Link>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="consent"
            checked={checked}
            onCheckedChange={(val) => setChecked(val === true)}
          />
          <label htmlFor="consent" className="text-sm text-foreground cursor-pointer">
            I have read and agree to the Terms of Use and Privacy Policy
          </label>
        </div>
        <Button className="w-full" disabled={!checked || saving} onClick={handleAccept}>
          {saving ? 'Saving…' : 'I agree'}
        </Button>
      </div>
    </div>
  );
}

export function ProtectedLayout() {
  const { firebaseUser, userProfile, loading, isAdmin } = useAuth();
  useNotifications();

  // AUTH BYPASS — remove after testing
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen bg-background">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  //     </div>
  //   );
  // }
  // if (!firebaseUser) return <Navigate to="/login" replace />;
  // if (userProfile?.status === 'pending') return <Navigate to="/pending" replace />;

  if (userProfile?.status === 'rejected' || userProfile?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <span className="text-6xl">🚫</span>
        <h1 className="text-xl font-semibold text-foreground mt-4">
          {userProfile.status === 'rejected' ? 'Account not approved' : 'Account suspended'}
        </h1>
        {userProfile.rejectionNote && (
          <p className="text-muted-foreground text-sm mt-2">Reason: {userProfile.rejectionNote}</p>
        )}
        <p className="text-muted-foreground text-sm mt-2">
          Contact your community admin for assistance.
        </p>
      </div>
    );
  }

  async function handleReaccept() {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      consentVersion: CONSENT_VERSION,
      consentAcceptedAt: serverTimestamp(),
    }).catch((err: unknown) => {
      console.error(`Failed to save consent for user ${firebaseUser.uid}:`, err);
      throw err;
    });
  }

  // Re-consent gate — only for verified/non-admin users who have a profile loaded
  if (
    userProfile &&
    !isAdmin &&
    userProfile.consentVersion !== CONSENT_VERSION
  ) {
    return <ReconsentModal onAccept={handleReaccept} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-app mx-auto pb-24 px-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
