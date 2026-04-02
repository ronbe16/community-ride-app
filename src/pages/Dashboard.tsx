import { COMMUNITY_NAME } from '@/constants/app';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TripCard } from '@/components/dashboard/TripCard';
import { StatusAlert } from '@/components/dashboard/StatusAlert';

// Mock data for visual approval
const mockTrips = [
  {
    id: '1',
    driverName: 'Maria Santos',
    verified: true,
    vehicle: { color: 'White', make: 'Toyota', model: 'Innova', plateLastThree: '789' },
    origin: 'Phase 1 Gate',
    destination: 'SM City Fairview',
    departureTime: '7:30 AM',
    waitingMinutes: 10,
    seatsLeft: 2,
    gasContribution: 50,
  },
  {
    id: '2',
    driverName: 'Pedro Reyes',
    verified: true,
    vehicle: { color: 'Silver', make: 'Honda', model: 'City', plateLastThree: '456' },
    origin: 'Clubhouse',
    destination: 'Trinoma Mall',
    departureTime: '8:00 AM',
    waitingMinutes: 15,
    seatsLeft: 1,
    gasContribution: undefined,
  },
];

export function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const isDriver = userProfile?.role === 'driver';
  const firstName = userProfile?.fullName?.split(' ')[0] || 'Neighbor';
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-4 pt-4">
      {/* Section 1: Welcome Banner */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-foreground font-semibold">{greeting}, {firstName} 👋</p>
        <p className="text-muted-foreground text-sm">{COMMUNITY_NAME} · {dateStr}</p>
      </div>

      {/* Section 2: Status Alert */}
      <StatusAlert status={userProfile?.status} rejectionNote={userProfile?.rejectionNote} />

      {/* Section 3: Active Trip (driver only stub) */}
      {isDriver && (
        <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
          <p className="text-foreground font-medium">🛺 Your active trip</p>
          <p className="text-sm text-muted-foreground mt-1">Phase 1 Gate → SM City Fairview</p>
          <p className="text-sm text-muted-foreground">Departs 7:30 AM · 1/3 seats filled</p>
          <Button size="sm" className="mt-3" onClick={() => navigate('/trip/demo')}>
            View Trip
          </Button>
        </div>
      )}

      {/* Section 4: Quick Action Buttons */}
      <div className={`grid gap-3 ${isDriver ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {isDriver ? (
          <>
            <Button className="h-14 rounded-xl text-sm font-medium" onClick={() => navigate('/post-trip')}>
              Post a Trip ➕
            </Button>
            <Button variant="outline" className="h-14 rounded-xl text-sm font-medium" onClick={() => navigate('/profile')}>
              My Profile 👤
            </Button>
          </>
        ) : (
          <Button className="h-14 rounded-xl text-sm font-medium w-full">
            Find a Ride 🔍
          </Button>
        )}
      </div>

      {/* Section 5: Available Trips */}
      <div>
        <h2 className="text-foreground font-semibold mb-3">Available trips today</h2>
        {mockTrips.length > 0 ? (
          <div className="space-y-3">
            {mockTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No trips posted yet today. Check back later or post your own!
          </p>
        )}
      </div>

      {/* Section 6: My Upcoming Rides */}
      <div>
        <h2 className="text-foreground font-semibold mb-3">My ride today</h2>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground font-medium">🛺 Maria Santos → SM City Fairview</p>
          <p className="text-xs text-muted-foreground mt-1">Departs 7:30 AM · White Toyota Innova</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="rounded-lg text-xs">Share Driver Info</Button>
            <button className="text-destructive text-xs underline">Cancel seat</button>
          </div>
        </div>
      </div>

      {/* Section 7: Footer */}
      <p className="text-muted-foreground/60 text-xs text-center py-4">
        Community Ride · {COMMUNITY_NAME}
      </p>
    </div>
  );
}
