import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Trips', icon: '🛺' },
  { path: '/post-trip', label: 'Post Trip', icon: '➕', driverOnly: true },
  { path: '/profile', label: 'Profile', icon: '👤' },
  { path: '/admin', label: 'Admin', icon: '🔑', adminOnly: true },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, userProfile } = useAuth();

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.driverOnly && userProfile?.role !== 'driver') return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
      <div className="max-w-app mx-auto flex">
        {visibleItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
              location.pathname === item.path
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
