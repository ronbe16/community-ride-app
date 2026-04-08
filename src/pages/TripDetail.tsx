import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, onSnapshot, getDoc, addDoc, setDoc,
  collection, serverTimestamp, arrayUnion, arrayRemove, Timestamp,
  runTransaction, increment, writeBatch, getDocs, query, where, updateDoc,
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
  const [completing, setCompleting] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<PhotoType | null>(null);
  const [isJoinedPassenger, setIsJoinedPassenger] = useState(false);
  const [driverMobile, setDriverMobile] = useState<string | null>(null);
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

  // Subscribe to own passenger doc for non-drivers to detect joined status
  useEffect(() => {
    if (!tripId || !firebaseUser || !trip || firebaseUser.uid === trip.driverUid) return;

    const passengerRef = doc(db, 'trips', tripId, 'passengers', firebaseUser.uid);
    return onSnapshot(
      passengerRef,
      (snap) => {
        setIsJoinedPassenger(snap.exists() && snap.data()?.status === 'confirmed');
      },
      (_err) => {
        setIsJoinedPassenger(false);
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, firebaseUser?.uid, trip?.driverUid]);

  // Fetch driver mobile number for confirmed passengers (Fix 5)
  useEffect(() => {
    if (!trip || !firebaseUser || firebaseUser.uid === trip.driverUid) return;
    if (!isJoinedPassenger) return;
    getDoc(doc(db, 'users', trip.driverUid)).then((snap) => {
      if (snap.exists()) {
        setDriverMobile((snap.data().mobileNumber as string) ?? null);
      }
    }).catch((err: unknown) => {
      console.error(`Failed to fetch driver mobile for trip ${tripId}:`, err);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.driverUid, isJoinedPassenger, firebaseUser?.uid]);

  // Auto-mark trip as departed when departure time passes
  useEffect(() => {
    if (!trip || !tripId) return;
    if (trip.status !== 'open' && trip.status !== 'full') return;

    const departureMs = trip.departureTime.toDate().getTime();
    if (Date.now() > departureMs) {
      updateDoc(doc(db, 'trips', tripId), { status: 'departed' }).catch((err: unknown) => {
        console.error(`Failed to auto-mark trip ${tripId} as departed:`, err);
      });
    }
  }, [trip, tripId]);

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
  const isJoined = isDriver
    ? confirmedPassengers.some((p) => p.uid === firebaseUser?.uid)
    : isJoinedPassenger;
  const seatsLeft = trip.availableSeats - trip.filledSeats;
  const isFull = seatsLeft <= 0 || trip.status === 'full';
  const showExchange = trip.status === 'open' && isWithinTwoHours(trip.departureTime);
  const exchangePhotoCount = trip.exchangePhotos ? Object.keys(trip.exchangePhotos).length : 0;
  const isOngoing = trip.status === 'ongoing' || trip.status === 'completed';

  async function handleJoin() {
    if (!firebaseUser || !userProfile || !tripId) return;
    setActionLoading(true);
    try {
      const passengerRef = doc(db, 'trips', tripId, 'passengers', firebaseUser.uid);
      const existingSnap = await getDoc(passengerRef);
      if (existingSnap.exists() && existingSnap.data()?.status === 'confirmed') {
        toast({ title: "You've already joined this trip" });
        return;
      }

      const tripRef = doc(db, 'trips', tripId);

      await runTransaction(db, async (transaction) => {
        const tripSnap = await transaction.get(tripRef);

        if (!tripSnap.exists()) {
          throw new Error('Trip no longer exists.');
        }

        const tripData = tripSnap.data();

        if (tripData.filledSeats >= tripData.availableSeats) {
          throw new Error('Sorry, this trip is already full.');
        }

        if (tripData.driverUid === firebaseUser.uid) {
          throw new Error('You cannot join your own trip.');
        }

        transaction.update(tripRef, {
          filledSeats: increment(1),
          ...(tripData.filledSeats + 1 >= tripData.availableSeats ? { status: 'full' } : {}),
          updatedAt: serverTimestamp(),
        });

        transaction.set(passengerRef, {
          uid: firebaseUser.uid,
          fullName: userProfile.fullName,
          mobileNumber: userProfile.mobileNumber,
          status: 'confirmed',
          joinedAt: serverTimestamp(),
          deleteAt: ninetyDaysFromNow(),
        });
      });

      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        joinedTripIds: arrayUnion(tripId),
      });

      // Notify driver — secondary write, failures must not surface as join failure (Fix 2)
      try {
        const driverDoc = await getDoc(doc(db, 'users', trip.driverUid));
        if (driverDoc.exists() && driverDoc.data().fcmToken) {
          addDoc(collection(db, 'pending_notifications'), {
            token: driverDoc.data().fcmToken,
            title: 'New passenger',
            body: `${userProfile.fullName} joined your trip to ${trip.destination}`,
            createdAt: serverTimestamp(),
          }).catch((err: unknown) => {
            console.error('Failed to queue join notification:', err);
          });
        }
      } catch (err: unknown) {
        console.error(`Failed to fetch driver doc for join notification (trip ${tripId}):`, err);
      }

      toast({ title: "You're in!", description: `You've joined the trip to ${trip.destination}.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      console.error(`Failed to join trip ${tripId} for user ${firebaseUser.uid}:`, err);
      toast({ title: 'Could not join', description: message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelSeat() {
    if (!firebaseUser || !tripId) return;
    setActionLoading(true);
    try {
      const tripRef = doc(db, 'trips', tripId);
      const passengerRef = doc(db, 'trips', tripId, 'passengers', firebaseUser.uid);

      await runTransaction(db, async (transaction) => {
        const tripSnap = await transaction.get(tripRef);
        if (!tripSnap.exists()) throw new Error('Trip not found.');

        transaction.update(tripRef, {
          filledSeats: increment(-1),
          ...(tripSnap.data().status === 'full' ? { status: 'open' } : {}),
          updatedAt: serverTimestamp(),
        });

        transaction.delete(passengerRef);
      });

      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        joinedTripIds: arrayRemove(tripId),
      });

      // Notify driver
      const driverDoc = await getDoc(doc(db, 'users', trip.driverUid));
      if (driverDoc.exists() && driverDoc.data().fcmToken) {
        addDoc(collection(db, 'pending_notifications'), {
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

  // Fix 4 — Start trip, auto-generate manifest in background
  async function handleStartTrip() {
    if (!firebaseUser || !tripId) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'ongoing',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Background manifest write — keyed by tripId, fire and forget
      const expiresAt = Timestamp.fromMillis(
        Date.now() + SAFETY_LINK_EXPIRY_HOURS * 60 * 60 * 1000,
      );
      setDoc(doc(db, 'manifests', tripId), {
        generatedBy: firebaseUser.uid,
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
      }).catch((err: unknown) => {
        console.error(`Failed to generate manifest for trip ${tripId}:`, err);
      });

      toast({ title: 'Trip started!' });
    } catch (err: unknown) {
      console.error(`Failed to start trip ${tripId}:`, err);
      toast({ title: 'Failed to start trip', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompleteTrip() {
    if (!firebaseUser || !trip || !tripId) return;
    setCompleting(true);

    try {
      const passengersSnap = await getDocs(
        query(
          collection(db, 'trips', tripId, 'passengers'),
          where('status', '==', 'confirmed'),
        ),
      );

      const batch = writeBatch(db);

      batch.update(doc(db, 'trips', tripId), {
        status: 'completed',
        completedAt: serverTimestamp(),
      });

      batch.update(doc(db, 'users', firebaseUser.uid), {
        tripCount: increment(1),
      });

      passengersSnap.docs.forEach((passengerDoc) => {
        const passengerData = passengerDoc.data();
        if (passengerData.uid) {
          batch.update(doc(db, 'users', passengerData.uid), {
            tripCount: increment(1),
          });
        }
      });

      await batch.commit();
      setShowCompletionModal(true);
    } catch (err: unknown) {
      console.error(`Failed to complete trip ${tripId}:`, err);
      toast({
        title: 'Could not complete trip',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCompleting(false);
    }
  }

  // Fix 3 — Unified Trip Safety Card, keyed by tripId (idempotent)
  async function handleShareSafetyCard() {
    if (!firebaseUser || !tripId) return;
    console.log('handleShareSafetyCard: firebaseUser?.uid =', firebaseUser?.uid);
    try {
      const safetyRef = doc(db, 'safety_links', tripId);
      const existing = await getDoc(safetyRef);

      if (!existing.exists()) {
        // For non-drivers: attempt to fetch the passengers list
        let passengersList = confirmedPassengers;
        if (!isDriver) {
          try {
            const passSnap = await getDocs(
              query(collection(db, 'trips', tripId, 'passengers'), where('status', '==', 'confirmed')),
            );
            passengersList = passSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as PassengerEntry));
          } catch (err: unknown) {
            console.error(`Failed to fetch passengers for safety card (trip ${tripId}):`, err);
            passengersList = [];
          }
        }

        const expiresAt = Timestamp.fromMillis(
          trip.departureTime.toDate().getTime() + SAFETY_LINK_EXPIRY_HOURS * 60 * 60 * 1000,
        );

        await setDoc(safetyRef, {
          type: 'trip_safety_card',
          generatedBy: firebaseUser.uid,
          tripId,
          communityName: COMMUNITY_NAME,
          driver: {
            fullName: trip.driverName,
            vehicle: trip.vehicle,
          },
          trip: {
            origin: trip.origin,
            destination: trip.destination,
            departureTime: trip.departureTime,
            waitingMinutes: trip.waitingMinutes,
          },
          passengers: passengersList.map((p) => ({
            firstName: p.fullName.split(' ')[0],
            joinedAt: p.joinedAt,
          })),
          hasExchangePhotos: exchangePhotoCount > 0,
          expiresAt,
          deleteAt: ninetyDaysFromNow(),
          createdAt: serverTimestamp(),
        });
      }

      const url = `${window.location.origin}/safety/${tripId}`;
      const shareText = `Trip safety card: ${trip.driverName} driving ${trip.vehicle.color} ${trip.vehicle.make} ${trip.vehicle.model} to ${trip.destination}. Departure: ${formatTime(trip.departureTime)}.`;
      const shareData = { title: 'Trip Safety Card – Community Ride', text: shareText, url };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        setShareUrl(url);
        setShowShareOptions(true);
      }
    } catch (err: unknown) {
      console.error(`Failed to generate safety card for trip ${tripId}:`, err);
      toast({ title: 'Failed to generate link', description: 'Please try again.', variant: 'destructive' });
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
          addDoc(collection(db, 'pending_notifications'), {
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
          {trip.driverTripCount && trip.driverTripCount > 0 ? (
            <span className="text-muted-foreground text-sm">
              🛺 {trip.driverTripCount} trip{trip.driverTripCount !== 1 ? 's' : ''} completed
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">New member</span>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {trip.vehicle.color} {trip.vehicle.make} {trip.vehicle.model}
        </p>
        <p className="text-muted-foreground text-sm">Plate: <span className="font-mono font-bold">{trip.vehicle.plateNumber}</span></p>
        {trip.vehicle.ltfrbPermitNumber && (
          <p className="text-blue-600 text-sm">LTFRB Permit: #{trip.vehicle.ltfrbPermitNumber}</p>
        )}
        {/* Fix 5 — driver mobile shown to confirmed passengers only */}
        {!isDriver && isJoinedPassenger && driverMobile && (
          <a
            href={`tel:${driverMobile}`}
            className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-1"
          >
            📞 {driverMobile}
          </a>
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

      {/* Fix 4 — View Manifest: visible to driver and confirmed passengers once trip is ongoing/completed */}
      {isOngoing && (isDriver || isJoinedPassenger) && (
        <a
          href={`/manifest/${tripId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors"
        >
          📋 View Manifest
        </a>
      )}

      {/* Passenger Actions (non-driver view) */}
      {!isDriver && (trip.status === 'open' || trip.status === 'full') && (
        <div className="space-y-2">
          {isJoined ? (
            <>
              <div className="bg-primary-light border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-primary font-semibold">✓ You're in!</p>
              </div>
              {/* Fix 3 — Share Safety Card (passenger) */}
              <Button
                className="w-full h-12 rounded-xl"
                onClick={handleShareSafetyCard}
                disabled={actionLoading}
              >
                Share Safety Card
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

      {/* Fix 4 — Complete trip: visible when ongoing or departed */}
      {isDriver && (trip.status === 'ongoing' || trip.status === 'departed') && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
          <p className="font-medium text-emerald-900">Did the trip go smoothly?</p>
          <p className="text-sm text-emerald-700">
            Marking as completed will log this trip for you and your passengers.
          </p>
          <Button
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleCompleteTrip}
            disabled={completing}
          >
            {completing ? 'Completing…' : '✓ Mark trip as completed'}
          </Button>
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
              onClick={handleShareSafetyCard}
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
              {/* Fix 5 — tel: links for each passenger (driver view) */}
              {confirmedPassengers.map((p, i) => (
                <div key={p.uid} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-foreground text-sm font-medium">{p.fullName}</p>
                    <a
                      href={`tel:${p.mobileNumber}`}
                      className="text-primary text-xs font-medium"
                    >
                      📞 {p.mobileNumber}
                    </a>
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

          {(trip.status === 'open' || trip.status === 'full') && (
            <>
              {/* Fix 4 — Start Trip replaces Generate Manifest */}
              <Button
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleStartTrip}
                disabled={actionLoading}
              >
                {actionLoading ? 'Starting…' : '🚀 Start Trip'}
              </Button>
              {/* Fix 3 — Share Safety Card (driver) */}
              <Button
                className="w-full rounded-xl"
                onClick={handleShareSafetyCard}
                disabled={actionLoading}
              >
                Share Safety Card
              </Button>
              <Button
                className="w-full rounded-xl"
                variant="destructive"
                onClick={handleCancelTrip}
                disabled={actionLoading}
              >
                Cancel trip
              </Button>
            </>
          )}
        </div>
      )}

      {/* Trip Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-lg font-semibold text-gray-900">Trip completed!</h3>
              <p className="text-gray-500 text-sm mt-1">
                This trip has been logged for you and your passengers.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800 font-medium">Safety reminder</p>
              <p className="text-sm text-amber-700 mt-1">
                Remind your passengers to let their loved ones know they've arrived safely.
                <span className="italic"> "Pakisabi sa pamilya mo na nakarating ka na." 🙏</span>
              </p>
            </div>

            <Button
              className="w-full rounded-xl"
              onClick={() => {
                setShowCompletionModal(false);
                navigate('/');
              }}
            >
              Back to trips
            </Button>
          </div>
        </div>
      )}

      {/* Share Options Fallback Sheet */}
      {showShareOptions && shareUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 space-y-3">
            <h3 className="font-semibold text-gray-900 text-center">Share safety card</h3>

            <a
              href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=YOUR_FB_APP_ID&redirect_uri=${encodeURIComponent(window.location.origin)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <span className="text-2xl">💬</span>
              <span className="font-medium">Facebook Messenger</span>
            </a>

            <a
              href={`viber://forward?text=${encodeURIComponent(shareUrl)}`}
              className="flex items-center gap-3 w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <span className="text-2xl">📱</span>
              <span className="font-medium">Viber</span>
            </a>

            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl).catch((err: unknown) => {
                  console.error('Failed to copy to clipboard:', err);
                });
                toast({ title: 'Link copied!' });
              }}
              className="flex items-center gap-3 w-full p-4 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <span className="text-2xl">🔗</span>
              <span className="font-medium">Copy link</span>
            </button>

            <button
              onClick={() => setShowShareOptions(false)}
              className="w-full text-gray-500 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
