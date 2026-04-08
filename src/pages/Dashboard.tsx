import { COMMUNITY_NAME } from '@/constants/app';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { TripCard } from '@/components/dashboard/TripCard';
import { useTrips } from '@/hooks/useTrips';
import { useMyTrips } from '@/hooks/useMyTrips';
import { useMyJoinedTrips } from '@/hooks/useMyJoinedTrips';

export function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const firstName = userProfile?.fullName?.split(' ')[0] || 'Neighbor';

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });

  const { trips, loading: tripsLoading } = useTrips();
  const { trips: myTrips } = useMyTrips();
  const { trips: joinedTrips } = useMyJoinedTrips();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const activeDriverTrips = myTrips.filter((t) => t.status === 'open' || t.status === 'full');
  const joinedTripIds = new Set(joinedTrips.map((t) => t.id));
  const todayJoinedTrip = joinedTrips.find(
    (t) =>
      (t.status === 'open' || t.status === 'full') &&
      t.departureTime.toDate() >= todayStart,
  ) ?? null;

  const openTrips = trips.filter((t) => t.status === 'open');
  const fullTrips = trips.filter((t) => t.status === 'full');

  return (
    <div className="space-y-4 pt-4">
      {/* Section 1: Welcome Banner */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-foreground font-semibold">{greeting}, {firstName} 👋</p>
        <p className="text-muted-foreground text-sm">{COMMUNITY_NAME} · {dateStr}</p>
      </div>

      {/* Section 2: My ride today (passenger's joined trip) */}
      {todayJoinedTrip && (
        <div className="rounded-xl p-4" style={{ backgroundColor: '#FFDE00' }}>
          <p className="font-medium" style={{ color: '#1a1a1a' }}>🎫 Your ride today</p>
          <p className="text-sm mt-1" style={{ color: '#1a1a1a' }}>
            {todayJoinedTrip.driverName} → {todayJoinedTrip.destination}
          </p>
          <p className="text-sm" style={{ color: '#1a1a1a' }}>
            Departs {todayJoinedTrip.departureTime.toDate().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })} · {todayJoinedTrip.vehicle.color} {todayJoinedTrip.vehicle.make} {todayJoinedTrip.vehicle.model}
          </p>
          <Button
            size="sm"
            className="mt-3 bg-black/10 text-black hover:bg-black/20 border-0"
            onClick={() => navigate(`/trip/${todayJoinedTrip.id}`)}
          >
            View Trip
          </Button>
        </div>
      )}

      {/* Section 3: Driver's active posted trips */}
      {activeDriverTrips.length > 0 && (
        <div className="bg-primary-light border border-primary/20 rounded-xl p-4 space-y-3">
          <p className="text-foreground font-medium">
            🛺 Your active trip{activeDriverTrips.length > 1 ? 's' : ''}
          </p>
          {activeDriverTrips.map((t) => (
            <div key={t.id} className="border-t border-primary/10 pt-3 first:border-0 first:pt-0">
              <p className="text-sm text-muted-foreground">
                {t.origin} → {t.destination}
              </p>
              <p className="text-sm text-muted-foreground">
                Departs {t.departureTime.toDate().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })} · {t.filledSeats}/{t.availableSeats} seats filled
                {t.status === 'full' && <span className="ml-2 text-xs text-blue-600 font-medium">Full</span>}
              </p>
              <Button size="sm" className="mt-2" onClick={() => navigate(`/trip/${t.id}`)}>
                View Trip
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Section 4: Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button className="h-14 rounded-xl text-sm font-medium" onClick={() => navigate('/post-trip')}>
          Post a Trip ➕
        </Button>
        <Button variant="outline" className="h-14 rounded-xl text-sm font-medium" onClick={() => navigate('/profile')}>
          My Profile 👤
        </Button>
      </div>

      {/* Section 5: Available Trips (open) */}
      <div>
        <h2 className="text-foreground font-semibold mb-3">Available trips today</h2>
        {tripsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : openTrips.length > 0 ? (
          <div className="space-y-3">
            {openTrips.map((trip) => (
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
                  status: trip.status,
                }}
                alreadyJoined={joinedTripIds.has(trip.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8 text-sm">
            No trips posted yet today. Check back later or post your own!
          </p>
        )}
      </div>

      {/* Section 6: Full / Ongoing Trips */}
      {!tripsLoading && fullTrips.length > 0 && (
        <div>
          <h2 className="text-foreground font-semibold mb-3">Full trips / Ongoing</h2>
          <div className="space-y-3">
            {fullTrips.map((trip) => (
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
                  status: trip.status,
                }}
                alreadyJoined={joinedTripIds.has(trip.id)}
              />
            ))}
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
