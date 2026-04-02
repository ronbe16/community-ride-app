import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { COMMUNITY_NAME, ADMIN_EMAIL } from '@/constants/app';

export function PendingApproval() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <span className="text-6xl text-primary">⏳</span>
      <h1 className="text-xl font-semibold text-foreground mt-4">Waiting for approval</h1>
      <p className="text-muted-foreground text-center text-sm mt-2">
        Your ID is being reviewed by the {COMMUNITY_NAME} admin. You'll receive a notification once you're approved — usually within 24 hours.
      </p>
      {ADMIN_EMAIL && (
        <p className="text-muted-foreground/60 text-xs mt-4">
          Questions? Message {ADMIN_EMAIL}
        </p>
      )}
      <button
        onClick={() => signOut(auth)}
        className="text-destructive text-sm mt-8 underline"
      >
        Sign out
      </button>
    </div>
  );
}
