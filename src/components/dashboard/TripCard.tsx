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
  const isFull = trip.seatsLeft <= 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-foreground font-medium text-sm">{trip.driverName}</span>
        {trip.driverTripCount && trip.driverTripCount > 0 ? (
          <span className="text-muted-foreground text-xs">
            🛺 {trip.driverTripCount} trip{trip.driverTripCount !== 1 ? 's' : ''} completed
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">New member</span>
        )}
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
      <p className={`text-xs font-medium ${isFull ? 'text-muted-foreground' : 'text-primary'}`}>
        💺 {isFull ? 'Trip full' : `${trip.seatsLeft} seat${trip.seatsLeft !== 1 ? 's' : ''} left`}
      </p>
      <p className="text-muted-foreground/60 text-xs">
        {trip.gasContribution ? `Gas: ₱${trip.gasContribution}` : 'Discuss with driver'}
      </p>
      <Button
        className={`w-full rounded-lg mt-1 ${isFull ? 'bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-not-allowed' : ''}`}
        size="sm"
        disabled={isFull}
        onClick={() => navigate(`/trip/${trip.id}`)}
      >
        {isFull ? 'Trip Full' : 'Join Trip'}
      </Button>
    </div>
  );
}
