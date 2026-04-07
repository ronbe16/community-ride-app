import { LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_NAME } from '@/constants/app';

export function AppHeader() {
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err: unknown) {
      console.error('Failed to sign out:', err);
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-app mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
            CR
          </div>
          <span className="font-semibold text-sm text-foreground">{COMMUNITY_NAME}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
