import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, onSnapshot, getDoc, updateDoc, addDoc,
  collection, serverTimestamp, arrayUnion, arrayRemove, Timestamp,
} from 'firebase/firestore';
import { uploadPassengerScan } from '@/lib/cloudinary';
import { uploadExchangePhoto } from '@/lib/safety-exchange';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Trip, PassengerEntry, PhotoType } from '@/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { COMMUNITY_NAME, SAFETY_LINK_EXPIRY_HOURS } from '@/constants/app';
import { ninetyDaysFromNow } from '@/lib/retention';

function formatTime(ts: Timestamp) {
  return ts.toDate().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

function formatDatetime(ts: Timestamp) {
  return ts.toDate().toLocaleString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isWithinTwoHours(departureTime: Timestamp): boolean {
  const now = Date.now();
  const departure = departureTime.toDate().getTime();
  return departure - now <= 2 * 60 * 60 * 1000 && departure > now - 60 * 60 * 1000;
}

export function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const { firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [passengers, setPassengers] = useState<PassengerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<PhotoType | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoType = useRef<PhotoType | null>(null);

  useEffect(() => {
    if (!tripId) return;
    const unsubTrip = onSnapshot(
      doc(db, 'trips', tripId),
      (snap) => {
        if (snap.exists()) {
          setTrip({ id: snap.id, ...snap.data() } as Trip);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Failed to subscribe to trip ${tripId}:`, err);
        setLoading(false);
      },
    );
    return unsubTrip;
  }, [tripId]);

  useEffect(() => {
    if (!tripId || !trip) return;
    const isDriver = firebaseUser?.uid === trip.driverUid;
    if (!isDriver) return;

    const unsubPassengers = onSnapshot(
      collection(db, 'trips', tripId, 'passengers'),
      (snap) => {
        setPassengers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as PassengerEntry)));
      },
      (err) => {
        console.error(`Failed to subscribe to passengers for trip ${tripId}:`, err);
      },
    );
    return unsubPassengers;
  }, [tripId, trip, firebaseUser]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!trip) {
    return <p className="text-muted-foreground text-center py-16">Trip not found.</p>;
  }

  const isDriver = firebaseUser?.uid === trip.driverUid;
  const confirmedPassengers = passengers.filter((p) => p.status === 'confirmed');
  const isJoined = userProfile
    ? confirmedPassengers.some((p) => p.uid === firebaseUser?.uid)
    : false;
  const seatsLeft = trip.availableSeats - trip.filledSeats;
  const isFull = seatsLeft <= 0;
  const showExchange = trip.status === 'open' && isWithinTwoHours(trip.departureTime);
  const exchangePhotoCount = trip.exchangePhotos ? Object.keys(trip.exchangePhotos).length : 0;

  async function handleJoin() {
    if (!firebaseUser || !userProfile || !tripId) return;
    setActionLoading(true);
    try {
      await addDoc(collection(db, 'trips', tripId, 'passengers'), {
        uid: firebaseUser.uid,
        fullName: userProfile.fullName,
        mobileNumber: userProfile.mobileNumber,
        joinedAt: serverTimestamp(),
        status: 'confirmed',
      });
      await updateDoc(doc(db, 'trips', tripId), {
        filledSeats: trip.filledSeats + 1,
        status: trip.filledSeats + 1 >= trip.availableSeats ? 'full' : 'open',
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        joinedTripIds: arrayUnion(tripId),
      });
      // Notify driver
      const driverDoc = await getDoc(doc(db, 'users', trip.driverUid));
      if (driverDoc.exists() && driverDoc.data().fcmToken) {
        await addDoc(collection(db, 'pending_notifications'), {
          token: driverDoc.data().fcmToken,
          title: 'New passenger',
          body: `${userProfile.fullName} joined your trip to ${trip.destination}`,
          createdAt: serverTimestamp(),
        }).catch((err: unknown) => {
          console.error('Failed to queue join notification:', err);
        });
      }
      toast({ title: "You're in!", description: `You've joined the trip to ${trip.destination}.` });
    } catch (err: unknown) {
      console.error(`Failed to join trip ${tripId} for user ${firebaseUser.uid}:`, err);
      toast({ title: 'Failed to join', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelSeat() {
    if (!firebaseUser || !tripId) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'trips', tripId, 'passengers', firebaseUser.uid), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'trips', tripId), {
        filledSeats: Math.max(0, trip.filledSeats - 1),
        status: 'open',
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        joinedTripIds: arrayRemove(tripId),
      });
      // Notify driver
      const driverDoc = await getDoc(doc(db, 'users', trip.driverUid));
      if (driverDoc.exists() && driverDoc.data().fcmToken) {
        await addDoc(collection(db, 'pending_notifications'), {
          token: driverDoc.data().fcmToken,
          title: 'Passenger cancelled',
          body: `${userProfile?.fullName} cancelled their seat`,
          createdAt: serverTimestamp(),
        }).catch((err: unknown) => {
          console.error('Failed to queue cancel notification:', err);
        });
      }
      toast({ title: 'Seat cancelled', description: 'Your seat has been cancelled.' });
    } catch (err: unknown) {
      console.error(`Failed to cancel seat for trip ${tripId}, user ${firebaseUser?.uid}:`, err);
      toast({ title: 'Failed to cancel', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleShareDriverInfo() {
    if (!firebaseUser || !tripId) return;
    try {
      // Fetch driver trust signals
      const driverDoc = await getDoc(doc(db, 'users', trip.driverUid));
      const driverData = driverDoc.exists() ? driverDoc.data() : null;

      const expiresAt = Timestamp.fromMillis(
        trip.departureTime.toDate().getTime() + 24 * 60 * 60 * 1000,
      );
      const linkDoc = await addDoc(collection(db, 'safety_links'), {
        type: 'driver_safety_card',
        generatedBy: firebaseUser.uid,
        tripId,
        communityName: COMMUNITY_NAME,
        driver: {
          fullName: trip.driverName,
          vehicle: trip.vehicle,
          tripCount: driverData?.tripCount ?? 0,
          rating: driverData?.rating ?? 0,
          ratingCount: driverData?.ratingCount ?? 0,
        },
        trip: {
          origin: trip.origin,
          destination: trip.destination,
          departureTime: trip.departureTime,
        },
        exchangePhotos: trip.exchangePhotos ?? {},
        expiresAt,
        deleteAt: ninetyDaysFromNow(),
        createdAt: serverTimestamp(),
      });
      const url = `${window.location.origin}/safety/${linkDoc.id}`;
      const shareText = `I'm riding with ${trip.driverName} to ${trip.destination}. Here's their info: ${url}`;
      if (navigator.share) {
        await navigator.share({ title: 'Driver Safety Card', text: shareText, url });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({ title: 'Link copied!', description: 'Share it with a trusted contact.' });
      }
    } catch (err: unknown) {
      console.error(`Failed to generate safety link for trip ${tripId}:`, err);
      toast({ title: 'Failed to generate link', description: 'Please try again.', variant: 'destructive' });
    }
  }

  async function handleShareSafetyLink() {
    await handleShareDriverInfo();
  }

  async function handleGenerateManifest() {
    if (!tripId) return;
    try {
      const expiresAt = Timestamp.fromMillis(
        Date.now() + SAFETY_LINK_EXPIRY_HOURS * 60 * 60 * 1000,
      );
      const manifestDoc = await addDoc(collection(db, 'manifests'), {
        driver: {
          fullName: trip.driverName,
          vehicle: trip.vehicle,
        },
        trip: {
          origin: trip.origin,
          destination: trip.destination,
          departureTime: trip.departureTime,
        },
        passengers: confirmedPassengers.map((p) => ({
          fullName: p.fullName,
          mobileNumber: p.mobileNumber,
          joinedAt: p.joinedAt,
        })),
        communityName: COMMUNITY_NAME,
        generatedAt: serverTimestamp(),
        expiresAt,
      });
      const url = `${window.location.origin}/manifest/${manifestDoc.id}`;
      if (navigator.share) {
        await navigator.share({ title: 'Passenger Manifest', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Manifest link copied!' });
      }
    } catch (err: unknown) {
      console.error(`Failed to generate manifest for trip ${tripId}:`, err);
      toast({ title: 'Failed to generate manifest', description: 'Please try again.', variant: 'destructive' });
    }
  }

  async function handleCancelTrip() {
    if (!tripId) return;
    if (!window.confirm('Cancel this trip? All passengers will be notified.')) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      for (const p of confirmedPassengers) {
        const pDoc = await getDoc(doc(db, 'users', p.uid));
        if (pDoc.exists() && pDoc.data().fcmToken) {
          await addDoc(collection(db, 'pending_notifications'), {
            token: pDoc.data().fcmToken,
            title: 'Trip cancelled',
            body: `Your trip to ${trip.destination} has been cancelled by the driver.`,
            createdAt: serverTimestamp(),
          }).catch((err: unknown) => {
            console.error(`Failed to queue cancellation notification for passenger ${p.uid}:`, err);
          });
        }
      }
      toast({ title: 'Trip cancelled' });
      navigate('/');
    } catch (err: unknown) {
      console.error(`Failed to cancel trip ${tripId}:`, err);
      toast({ title: 'Failed to cancel trip', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleScanPassenger(index: number) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !tripId) return;
      try {
        const url = await uploadPassengerScan(file, tripId, index);
        const passenger = confirmedPassengers[index];
        if (passenger) {
          await updateDoc(doc(db, 'trips', tripId, 'passengers', passenger.uid), {
            boardPhotoUrl: url,
            boardPhotoUploadedAt: serverTimestamp(),
          });
        }
        toast({ title: 'Photo saved' });
      } catch (err: unknown) {
        console.error(`Failed to upload passenger scan for trip ${tripId}, slot ${index}:`, err);
        toast({ title: 'Failed to save photo', description: 'Please try again.', variant: 'destructive' });
      }
    };
    input.click();
  }

  function openCamera(type: PhotoType) {
    pendingPhotoType.current = type;
    cameraInputRef.current?.click();
  }

  async function handleExchangePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const type = pendingPhotoType.current;
    if (!file || !type || !tripId || !firebaseUser) return;
    // Reset so the same type can be re-captured
    e.target.value = '';
    setUploadingPhoto(type);
    try {
      await uploadExchangePhoto(file, tripId, firebaseUser.uid, type);
      toast({ title: 'Photo saved', description: `${type} photo added to your safety link.` });
    } catch (err: unknown) {
      console.error(`Failed to upload exchange photo (${type}) for trip ${tripId}:`, err);
      toast({ title: 'Failed to upload photo', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setUploadingPhoto(null);
    }
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Driver Info Card */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-foreground font-semibold">{trip.driverName}</span>
          {trip.driverRating && trip.driverRating > 0 ? (
            <span className="text-amber-500 text-sm font-medium">⭐ {trip.driverRating.toFixed(1)}</span>
          ) : (
            <span className="text-muted-foreground text-sm">New member</span>
          )}
          {trip.driverTripCount && trip.driverTripCount > 0 ? (
            <span className="text-muted-foreground text-sm">· {trip.driverTripCount} trips</span>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {trip.vehicle.color} {trip.vehicle.make} {trip.vehicle.model}
        </p>
        <p className="text-muted-foreground text-sm">Plate: <span className="font-mono font-bold">{trip.vehicle.plateNumber}</span></p>
        {trip.vehicle.ltfrbPermitNumber && (
          <p className="text-blue-600 text-sm">LTFRB Permit: #{trip.vehicle.ltfrbPermitNumber}</p>
        )}
      </div>

      {/* Trip Details Card */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <p className="text-foreground font-medium">🗺 {trip.origin} → {trip.destination}</p>
        <p className="text-muted-foreground text-sm">🕐 Departs {formatTime(trip.departureTime)}</p>
        <p className="text-muted-foreground text-sm">⏳ Waits {trip.waitingMinutes} minutes</p>
        <p className="text-primary text-sm font-medium">
          💺 {trip.filledSeats} / {trip.availableSeats} seats filled
        </p>
        <p className="text-muted-foreground text-sm">
          💰 {trip.gasContribution ? `₱${trip.gasContribution} / passenger` : 'Discuss with driver'}
        </p>
        {trip.status !== 'open' && trip.status !== 'full' && (
          <div className="bg-destructive/10 border border-destructive/30 text-foreground rounded-lg px-3 py-2 text-sm font-medium capitalize">
            {trip.status}
          </div>
        )}
      </div>

      {/* Passenger Actions (non-driver view) */}
      {!isDriver && trip.status === 'open' && (
        <div className="space-y-2">
          {isJoined ? (
            <>
              <div className="bg-primary-light border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-primary font-semibold">✓ You're in!</p>
              </div>
              <Button
                className="w-full h-12 rounded-xl"
                onClick={handleShareDriverInfo}
                disabled={actionLoading}
              >
                Share Driver Info
              </Button>
              <button
                className="text-destructive text-sm underline w-full text-center"
                onClick={handleCancelSeat}
                disabled={actionLoading}
              >
                Cancel my seat
              </button>
            </>
          ) : isFull ? (
            <div className="bg-muted border border-border rounded-xl p-4 text-center">
              <p className="text-muted-foreground font-medium">Trip is full</p>
            </div>
          ) : (
            <Button
              className="w-full h-14 rounded-xl text-base font-semibold"
              onClick={handleJoin}
              disabled={actionLoading}
            >
              {actionLoading ? 'Joining…' : 'Join this trip'}
            </Button>
          )}
        </div>
      )}

      {/* Optional safety photo exchange — shown when trip departs within 2 hours */}
      {showExchange && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="font-medium text-amber-800 mb-1">Optional safety exchange</div>
          <div className="text-amber-700 text-sm mb-3">
            Take a photo of the driver, their ID, or the plate number.
            Photos are shared with your safety contact and deleted after 24 hours.
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['face', 'id', 'plate'] as PhotoType[]).map((type) => (
              <button
                key={type}
                onClick={() => openCamera(type)}
                disabled={uploadingPhoto === type}
                className="flex flex-col items-center gap-1 bg-white border border-amber-200 rounded-xl p-3 text-xs text-amber-700 disabled:opacity-50"
              >
                <span className="text-2xl">
                  {type === 'face' ? '🤳' : type === 'id' ? '🪪' : '🚗'}
                </span>
                {uploadingPhoto === type ? 'Saving…' : type === 'face' ? 'Face photo' : type === 'id' ? 'ID card' : 'Plate number'}
              </button>
            ))}
          </div>

          {exchangePhotoCount > 0 && (
            <button
              onClick={handleShareSafetyLink}
              className="w-full mt-3 bg-emerald-500 text-white rounded-xl py-2 text-sm font-medium"
            >
              Share safety link to family 🤝
            </button>
          )}

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleExchangePhotoCapture}
          />
        </div>
      )}

      {/* Driver Actions */}
      {isDriver && (
        <div className="space-y-3">
          <h2 className="text-foreground font-semibold">
            Passengers ({confirmedPassengers.length}/{trip.availableSeats})
          </h2>
          {confirmedPassengers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No passengers yet.</p>
          ) : (
            <div className="space-y-2">
              {confirmedPassengers.map((p, i) => (
                <div key={p.uid} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-foreground text-sm font-medium">{p.fullName}</p>
                    <p className="text-muted-foreground text-xs">{p.mobileNumber}</p>
                    <p className="text-muted-foreground text-xs">
                      Joined {p.joinedAt?.toDate ? formatDatetime(p.joinedAt as Timestamp) : '—'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs shrink-0"
                    onClick={() => handleScanPassenger(i)}
                  >
                    📷 Scan
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button className="w-full rounded-xl" onClick={handleGenerateManifest} disabled={actionLoading}>
            Generate Manifest
          </Button>
          <Button
            className="w-full rounded-xl"
            variant="destructive"
            onClick={handleCancelTrip}
            disabled={actionLoading}
          >
            Cancel trip
          </Button>
        </div>
      )}
    </div>
  );
}
