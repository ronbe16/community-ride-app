import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';

export function ProtectedLayout() {
  // const { firebaseUser, loading } = useAuth();

  // TODO: Re-enable auth guard after preview
  // if (loading) return (
  //   <div className="flex items-center justify-center h-screen bg-background">
  //     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  //   </div>
  // );

  // if (!firebaseUser) return <Navigate to="/login" replace />;

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
