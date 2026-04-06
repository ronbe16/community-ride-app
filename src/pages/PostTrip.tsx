import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MAX_TRIPS_PER_DAY, MAX_SEATS, WAITING_TIME_OPTIONS } from '@/constants/app';

function isPeakHour(hour: number): boolean {
  return (hour >= 6 && hour < 9) || (hour >= 17 && hour < 21);
}

function tripTypeFromHour(hour: number): 'morning' | 'evening' {
  return hour < 12 ? 'morning' : 'evening';
}

export function PostTrip() {
  const { firebaseUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [waitingMinutes, setWaitingMinutes] = useState<number>(10);
  const [availableSeats, setAvailableSeats] = useState(2);
  const [gasContribution, setGasContribution] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Require vehicle info to post a trip
  if (!userProfile?.vehicle?.plateNumber) {
    return (
      <div className="space-y-4 pt-4 text-center px-4">
        <span className="text-5xl block">🛺</span>
        <h2 className="text-foreground font-semibold text-lg">Add your vehicle first</h2>
        <p className="text-muted-foreground text-sm">
          Go to your profile and fill in your vehicle details before posting a trip.
        </p>
      </div>
    );
  }

  const departureHour = departureTime ? parseInt(departureTime.split(':')[0], 10) : -1;
  const showPeakWarning = departureTime !== '' && !isPeakHour(departureHour);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser || !userProfile) return;
    if (!origin.trim() || !destination.trim() || !departureTime) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Check daily trip limit
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const existingQ = query(
        collection(db, 'trips'),
        where('driverUid', '==', firebaseUser.uid),
        where('departureTime', '>=', Timestamp.fromDate(todayStart)),
        where('departureTime', '<=', Timestamp.fromDate(todayEnd)),
      );
      const existingSnap = await getDocs(existingQ);
      if (existingSnap.size >= MAX_TRIPS_PER_DAY) {
        toast({
          title: 'Daily limit reached',
          description: `You've reached the maximum ${MAX_TRIPS_PER_DAY} trips for today (per LTFRB guidelines).`,
          variant: 'destructive',
        });
        return;
      }

      // Build departure Timestamp from today's date + chosen time
      const [hours, minutes] = departureTime.split(':').map(Number);
      const departureDate = new Date();
      departureDate.setHours(hours, minutes, 0, 0);
      const tripType = tripTypeFromHour(hours);

      const gas = gasContribution.trim() !== '' ? parseFloat(gasContribution) : undefined;

      const docRef = await addDoc(collection(db, 'trips'), {
        driverUid: firebaseUser.uid,
        driverName: userProfile.fullName,
        vehicle: {
          make: userProfile.vehicle?.make ?? '',
          model: userProfile.vehicle?.model ?? '',
          color: userProfile.vehicle?.color ?? '',
          plateNumber: userProfile.vehicle?.plateNumber ?? '',
          plateLastThree: userProfile.vehicle?.plateNumber?.slice(-3) ?? '',
          ltfrbPermitNumber: userProfile.vehicle?.ltfrbPermitNumber ?? null,
        },
        origin: origin.trim(),
        destination: destination.trim(),
        departureTime: Timestamp.fromDate(departureDate),
        waitingMinutes,
        availableSeats,
        filledSeats: 0,
        gasContribution: gas ?? null,
        status: 'open',
        tripType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Notify passengers topic — processed by a scheduled Firebase Function
      addDoc(collection(db, 'pending_notifications'), {
        topic: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}_passengers`,
        title: 'New trip available',
        body: `${origin.trim()} → ${destination.trim()} at ${departureTime}`,
        createdAt: serverTimestamp(),
      }).catch((err: unknown) => {
        console.error('Failed to queue new-trip notification:', err);
      });

      toast({ title: 'Trip posted!', description: 'Passengers can now find and join your trip.' });
      navigate(`/trip/${docRef.id}`);
    } catch (err: unknown) {
      console.error(`Failed to post trip for driver ${firebaseUser.uid}:`, err);
      toast({ title: 'Failed to post trip', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pt-4">
      <h1 className="text-foreground font-semibold text-xl">Post a trip</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Origin */}
        <div className="space-y-1.5">
          <Label htmlFor="origin">Pickup point</Label>
          <Input
            id="origin"
            placeholder="e.g. Main gate, Block 3"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Where will passengers meet you?</p>
        </div>

        {/* Destination */}
        <div className="space-y-1.5">
          <Label htmlFor="destination">Destination</Label>
          <Input
            id="destination"
            placeholder="e.g. Ayala MRT Station, BGC"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>

        {/* Departure Time */}
        <div className="space-y-1.5">
          <Label htmlFor="departureTime">Departure time</Label>
          <Input
            id="departureTime"
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
          />
          {showPeakWarning && (
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-2 text-xs text-foreground">
              Note: LTFRB carpooling is allowed during peak hours only (6–9 AM, 5–9 PM).
            </div>
          )}
        </div>

        {/* Waiting Time */}
        <div className="space-y-1.5">
          <Label>How long will you wait?</Label>
          <Select
            value={String(waitingMinutes)}
            onValueChange={(v) => setWaitingMinutes(parseInt(v, 10))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WAITING_TIME_OPTIONS.map((m) => (
                <SelectItem key={m} value={String(m)}>{m} min</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Available Seats */}
        <div className="space-y-1.5">
          <Label>Available seats</Label>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-10 h-10 rounded-lg text-lg"
              onClick={() => setAvailableSeats((s) => Math.max(1, s - 1))}
            >
              −
            </Button>
            <span className="text-foreground font-semibold text-xl w-6 text-center">{availableSeats}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-10 h-10 rounded-lg text-lg"
              onClick={() => setAvailableSeats((s) => Math.min(MAX_SEATS, s + 1))}
            >
              +
            </Button>
          </div>
        </div>

        {/* Gas Contribution */}
        <div className="space-y-1.5">
          <Label htmlFor="gas">Gas contribution per passenger (₱) <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            id="gas"
            type="number"
            min="0"
            placeholder="Leave blank to discuss with passengers"
            value={gasContribution}
            onChange={(e) => setGasContribution(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Per LTFRB guidelines, this should cover fuel and maintenance costs only.
          </p>
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post trip'}
        </Button>
      </form>
    </div>
  );
}
