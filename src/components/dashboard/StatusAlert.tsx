import { ADMIN_EMAIL } from '@/constants/app';
import type { UserStatus } from '@/types';

interface StatusAlertProps {
  status?: UserStatus;
  rejectionNote?: string;
}

export function StatusAlert({ status, rejectionNote }: StatusAlertProps) {
  if (!status || status === 'verified') return null;

  if (status === 'pending') {
    return (
      <div className="bg-warning/10 border border-warning/30 text-foreground rounded-xl p-3 text-sm">
        ⏳ Your account is pending approval
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="bg-destructive/10 border border-destructive/30 text-foreground rounded-xl p-3 text-sm">
        <p>❌ Your account was not approved.{rejectionNote && ` Reason: ${rejectionNote}`}</p>
        {ADMIN_EMAIL && (
          <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary text-xs underline mt-1 inline-block">
            Contact admin
          </a>
        )}
      </div>
    );
  }

  if (status === 'suspended') {
    return (
      <div className="bg-destructive/10 border border-destructive/30 text-foreground rounded-xl p-3 text-sm">
        🚫 Your account has been suspended.{' '}
        {ADMIN_EMAIL && (
          <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary text-xs underline">Contact admin</a>
        )}
      </div>
    );
  }

  return null;
}
