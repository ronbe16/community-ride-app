import { COMMUNITY_NAME } from '@/constants/app';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TripCard } from '@/components/dashboard/TripCard';
import { useTrips } from '@/hooks/useTrips';
import { useMyTrips } from '@/hooks/useMyTrips';
import { useMyJoinedTrips } from '@/hooks/useMyJoinedTrips';
import { getNextWindowLabel } from '@/lib/carpool-windows';

export function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const firstName = userProfile?.fullName?.split(' ')[0] || 'Neighbor';

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });

  const { trips, loading: tripsLoading, withinWindow } = useTrips();
  const { trips: myTrips } = useMyTrips();
  const { trips: joinedTrips } = useMyJoinedTrips();

  const activeDriverTrip = myTrips.find((t) => t.status === 'open');
  const todayJoinedTrip = joinedTrips[0] ?? null;

  return (
    <div className="space-y-4 pt-4">
      {/* Section 1: Welcome Banner */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-foreground font-semibold">{greeting}, {firstName} 👋</p>
        <p className="text-muted-foreground text-sm">{COMMUNITY_NAME} · {dateStr}</p>
      </div>

      {/* Section 2: Active posted trip */}
      {activeDriverTrip && (
        <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
          <p className="text-foreground font-medium">🛺 Your active trip</p>
          <p className="text-sm text-muted-foreground mt-1">
            {activeDriverTrip.origin} → {activeDriverTrip.destination}
          </p>
          <p className="text-sm text-muted-foreground">
            Departs {activeDriverTrip.departureTime.toDate().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })} · {activeDriverTrip.filledSeats}/{activeDriverTrip.availableSeats} seats filled
          </p>
          <Button size="sm" className="mt-3" onClick={() => navigate(`/trip/${activeDriverTrip.id}`)}>
            View Trip
          </Button>
        </div>
      )}

      {/* Section 3: Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button className="h-14 rounded-xl text-sm font-medium" onClick={() => navigate('/post-trip')}>
          Post a Trip ➕
        </Button>
        <Button variant="outline" className="h-14 rounded-xl text-sm font-medium" onClick={() => navigate('/profile')}>
          My Profile 👤
        </Button>
      </div>

      {/* Section 4: Available Trips */}
      <div>
        <h2 className="text-foreground font-semibold mb-3">Available trips today</h2>

        {!withinWindow ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-3">🌙</div>
            <p className="font-medium text-gray-600">Carpool window is closed</p>
            <p className="text-sm mt-1">
              Next window opens at <span className="font-medium text-emerald-600">{getNextWindowLabel()}</span>
            </p>
            <p className="text-xs mt-3 text-gray-400">
              Morning: 5:00 AM – 10:00 AM · Evening: 4:00 PM – 10:00 PM
            </p>
          </div>
        ) : tripsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : trips.length > 0 ? (
          <div className="space-y-3">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={{
                  id: trip.id,
                  driverName: trip.driverName,
                  driverRating: trip.driverRating,
                  driverTripCount: trip.driverTripCount,
                  vehicle: {
                    color: trip.vehicle.color,
                    make: trip.vehicle.make,
                    model: trip.vehicle.model,
                    plateLastThree: trip.vehicle.plateLastThree,
                  },
                  origin: trip.origin,
                  destination: trip.destination,
                  departureTime: trip.departureTime.toDate().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
                  waitingMinutes: trip.waitingMinutes,
                  seatsLeft: trip.availableSeats - trip.filledSeats,
                  gasContribution: trip.gasContribution,
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No trips posted yet today. Check back later or post your own!
          </p>
        )}
      </div>

      {/* Section 5: My upcoming ride */}
      {todayJoinedTrip && todayJoinedTrip.status === 'open' && (
        <div>
          <h2 className="text-foreground font-semibold mb-3">My ride today</h2>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-foreground font-medium">
              🛺 {todayJoinedTrip.driverName} → {todayJoinedTrip.destination}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Departs {todayJoinedTrip.departureTime.toDate().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })} · {todayJoinedTrip.vehicle.color} {todayJoinedTrip.vehicle.make} {todayJoinedTrip.vehicle.model}
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="rounded-lg text-xs" onClick={() => navigate(`/trip/${todayJoinedTrip.id}`)}>
                View Trip
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-muted-foreground/60 text-xs text-center py-4">
        Community Ride · {COMMUNITY_NAME}
      </p>
    </div>
  );
}
