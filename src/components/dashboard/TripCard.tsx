import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface TripCardProps {
  trip: {
    id: string;
    driverName: string;
    driverRating?: number;
    driverTripCount?: number;
    vehicle: { color: string; make: string; model: string; plateLastThree: string };
    origin: string;
    destination: string;
    departureTime: string;
    waitingMinutes: number;
    seatsLeft: number;
    gasContribution?: number;
  };
}

export function TripCard({ trip }: TripCardProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-foreground font-medium text-sm">{trip.driverName}</span>
        {trip.driverRating && trip.driverRating > 0 ? (
          <span className="text-amber-500 text-xs">⭐ {trip.driverRating.toFixed(1)}</span>
        ) : (
          <span className="text-muted-foreground text-xs">New member</span>
        )}
        {trip.driverTripCount && trip.driverTripCount > 0 ? (
          <span className="text-muted-foreground text-xs">· {trip.driverTripCount} trips</span>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">
        {trip.vehicle.color} {trip.vehicle.make} {trip.vehicle.model} · Plate: ***{trip.vehicle.plateLastThree}
      </p>
      <p className="text-foreground font-medium text-sm">
        {trip.origin} → {trip.destination}
      </p>
      <p className="text-muted-foreground text-xs">
        🕐 Departs {trip.departureTime} · Waits {trip.waitingMinutes} min
      </p>
      <p className="text-primary text-xs font-medium">
        💺 {trip.seatsLeft} seat{trip.seatsLeft !== 1 ? 's' : ''} left
      </p>
      <p className="text-muted-foreground/60 text-xs">
        {trip.gasContribution ? `Gas: ₱${trip.gasContribution}` : 'Discuss with driver'}
      </p>
      <Button className="w-full rounded-lg mt-1" size="sm" onClick={() => navigate(`/trip/${trip.id}`)}>
        Join Trip
      </Button>
    </div>
  );
}
