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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { SafetyExchangePanel } from '@/components/trip/SafetyExchangePanel';
import { DriverPassengerList } from '@/components/trip/DriverPassengerList';
import { useTripDetail } from '@/hooks/useTripDetail';
import { COMMUNITY_NAME, SAFETY_LINK_EXPIRY_HOURS } from '@/constants/app';
import { ninetyDaysFromNow } from '@/lib/retention';

function formatTime(ts: Timestamp) {
  return ts.toDate().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
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

  const { trip, passengers, loading, isJoinedPassenger, driverMobile, boardScanUrl } = useTripDetail(tripId, firebaseUser);

  const [actionLoading, setActionLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<PhotoType | null>(null);
  const [scanPreviews, setScanPreviews] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewType, setPreviewType] = useState<PhotoType | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pendingPhotoType = useRef<PhotoType | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const pendingScanIndex = useRef<number>(-1);

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
  const showExchange = (trip.status === 'open' || trip.status === 'full') && isWithinTwoHours(trip.departureTime);
  const exchangePhotoCount = trip.exchangePhotos ? Object.keys(trip.exchangePhotos).length : 0;
  const allExchangePhotos = trip.exchangePhotos ? Object.values(trip.exchangePhotos) : [];
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

      // Block joining if passenger already has an ongoing ride
      const ongoingRideSnap = await getDocs(query(
        collection(db, 'trips'),
        where('passengerUids', 'array-contains', firebaseUser.uid),
        where('status', '==', 'ongoing'),
      ));
      if (!ongoingRideSnap.empty) {
        toast({ title: 'You already have an ongoing ride', description: 'Complete your current ride first.', variant: 'destructive' });
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
          passengerUids: arrayUnion(firebaseUser.uid),
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

        transaction.update(doc(db, 'users', firebaseUser.uid), {
          joinedTripIds: arrayUnion(tripId),
        });
      });

      // Notify driver — fire-and-forget so join UI is unblocked immediately
      getDoc(doc(db, 'users', trip.driverUid)).then((driverDoc) => {
        if (driverDoc.exists() && driverDoc.data().fcmToken) {
          addDoc(collection(db, 'pending_notifications'), {
            token: driverDoc.data().fcmToken,
            title: 'New passenger',
            body: `${userProfile.fullName} joined your trip to ${trip.destination}`,
            createdAt: serverTimestamp(),
            deleteAt: ninetyDaysFromNow(),
          }).catch((err: unknown) => {
            console.error('Failed to queue join notification:', err);
          });
        }
      }).catch((err: unknown) => {
        console.error(`Failed to fetch driver doc for join notification (trip ${tripId}):`, err);
      });

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
    if (
      trip?.status === 'cancelled' ||
      trip?.status === 'completed' ||
      trip?.status === 'ongoing' ||
      trip?.status === 'departed'
    ) return;
    setActionLoading(true);
    try {
      const tripRef = doc(db, 'trips', tripId);
      const passengerRef = doc(db, 'trips', tripId, 'passengers', firebaseUser.uid);

      await runTransaction(db, async (transaction) => {
        const tripSnap = await transaction.get(tripRef);
        if (!tripSnap.exists()) throw new Error('Trip not found.');

        transaction.update(tripRef, {
          filledSeats: increment(-1),
          passengerUids: arrayRemove(firebaseUser.uid),
          ...(tripSnap.data().status === 'full' ? { status: 'open' } : {}),
          updatedAt: serverTimestamp(),
        });

        transaction.delete(passengerRef);

        transaction.update(doc(db, 'users', firebaseUser.uid), {
          joinedTripIds: arrayRemove(tripId),
        });
      });

      // Notify driver
      const driverDoc = await getDoc(doc(db, 'users', trip.driverUid));
      if (driverDoc.exists() && driverDoc.data().fcmToken) {
        addDoc(collection(db, 'pending_notifications'), {
          token: driverDoc.data().fcmToken,
          title: 'Passenger cancelled',
          body: `${userProfile?.fullName} cancelled their seat`,
          createdAt: serverTimestamp(),
          deleteAt: ninetyDaysFromNow(),
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

      const expiresAt = Timestamp.fromMillis(
        Date.now() + SAFETY_LINK_EXPIRY_HOURS * 60 * 60 * 1000,
      );
      try {
        await setDoc(doc(db, 'manifests', tripId), {
          generatedBy: firebaseUser.uid,
          driver: {
            fullName: userProfile?.fullName ?? trip.driverName,
            mobileNumber: userProfile?.mobileNumber ?? null,
            driverLicenseNumber: userProfile?.vehicle?.driverLicenseNumber ?? null,
            driverLicenseExpiry: userProfile?.vehicle?.driverLicenseExpiry ?? null,
            vehicle: {
              make: trip.vehicle.make,
              model: trip.vehicle.model,
              year: userProfile?.vehicle?.year ?? null,
              color: trip.vehicle.color,
              plateNumber: trip.vehicle.plateNumber,
              ltfrbPermitNumber: userProfile?.vehicle?.ltfrbPermitNumber ?? null,
              ltoRegistrationNumber: userProfile?.vehicle?.ltoRegistrationNumber ?? null,
              insuranceProvider: userProfile?.vehicle?.insuranceProvider ?? null,
              insuranceExpiry: userProfile?.vehicle?.insuranceExpiry ?? null,
              ltfrbQrPhotoUrl: userProfile?.vehicle?.ltfrbQrPhotoUrl ?? null,
            },
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
          deleteAt: ninetyDaysFromNow(),
        });
      } catch (err: unknown) {
        console.error(`Failed to generate manifest for trip ${tripId}:`, err);
        toast({
          title: 'Manifest not generated',
          description: 'Trip is started, but the passenger manifest could not be saved. Please try sharing it again.',
          variant: 'destructive',
        });
      }

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
      const batch = writeBatch(db);
      batch.update(doc(db, 'trips', tripId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users', firebaseUser.uid), {
        tripCount: increment(1),
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

  // Always overwrite — photos may have been added since last share
  async function handleShareSafetyCard() {
    if (!firebaseUser || !tripId) return;
    try {
      // For non-drivers: fetch the live passengers list since they don't subscribe to it
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

      // Always overwrite with latest data — no existence check
      await setDoc(doc(db, 'safety_links', `${tripId}_${firebaseUser.uid}`), {
        type: 'trip_safety_card',
        generatedBy: firebaseUser.uid,
        tripId,
        communityName: COMMUNITY_NAME,
        driver: {
          fullName: trip.driverName,
          mobileNumber: isDriver ? (userProfile?.mobileNumber ?? null) : (driverMobile ?? null),
          tripCount: trip.driverTripCount ?? 0,
          vehicle: trip.vehicle,
        },
        trip: {
          origin: trip.origin,
          destination: trip.destination,
          departureTime: trip.departureTime,
          waitingMinutes: trip.waitingMinutes,
        },
        passengers: passengersList.map((p) => {
          const pPhotos = allExchangePhotos.filter((photo) => photo.uploadedBy === p.uid);
          return {
            fullName: p.fullName,
            joinedAt: p.joinedAt,
            facePhotoUrl: pPhotos.find((photo) => photo.type === 'face')?.url ?? null,
            idPhotoUrl: pPhotos.find((photo) => photo.type === 'id')?.url ?? null,
            platePhotoUrl: pPhotos.find((photo) => photo.type === 'plate')?.url ?? null,
            boardScanUrl: p.boardPhotoUrl ?? null,
          };
        }),
        expiresAt,
        deleteAt: ninetyDaysFromNow(),
        createdAt: serverTimestamp(),
      }, { merge: false });

      const shareUrl = `${window.location.origin}/safety/${tripId}_${firebaseUser.uid}`;
      const shareData = {
        title: 'Community Ride — Trip Safety Card',
        text: `Safety card for trip from ${trip.origin} to ${trip.destination}.`,
        url: shareUrl,
      };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: 'Link copied to clipboard!' });
      }
    } catch (err: unknown) {
      console.error(`Failed to generate safety card for trip ${tripId}:`, err);
      toast({ title: 'Failed to generate link', description: 'Please try again.', variant: 'destructive' });
    }
  }

  async function handleShareManifest() {
    if (!tripId || !trip) return;
    const manifestUrl = `${window.location.origin}/manifest/${tripId}`;
    const shareData = {
      title: 'Community Ride — Passenger Manifest',
      text: `LTFRB Passenger Manifest for trip from ${trip.origin} to ${trip.destination}.`,
      url: manifestUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(manifestUrl);
        toast({ title: 'Manifest link copied!' });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error(`Failed to share manifest for trip ${tripId}:`, err);
      }
    }
  }

  async function handleCancelTrip() {
    if (!tripId) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      await Promise.all(confirmedPassengers.map(async (p) => {
        // Fire-and-forget: remove trip from passenger's joinedTripIds
        updateDoc(doc(db, 'users', p.uid), {
          joinedTripIds: arrayRemove(tripId),
        }).catch((err: unknown) => {
          console.error(`Failed to remove cancelled trip ${tripId} from passenger ${p.uid} joinedTripIds:`, err);
        });

        // Fetch token and notify in the same async chain
        try {
          const pDoc = await getDoc(doc(db, 'users', p.uid));
          if (pDoc.exists() && pDoc.data().fcmToken) {
            addDoc(collection(db, 'pending_notifications'), {
              token: pDoc.data().fcmToken,
              title: 'Trip cancelled',
              body: `Your trip to ${trip.destination} has been cancelled by the driver.`,
              createdAt: serverTimestamp(),
              deleteAt: ninetyDaysFromNow(),
            }).catch((err: unknown) => {
              console.error(`Failed to queue cancellation notification for passenger ${p.uid}:`, err);
            });
          }
        } catch (err: unknown) {
          console.error(`Failed to fetch user doc for cancellation notification (passenger ${p.uid}):`, err);
        }
      }));
      toast({ title: 'Trip cancelled' });
      navigate('/');
    } catch (err: unknown) {
      console.error(`Failed to cancel trip ${tripId}:`, err);
      toast({ title: 'Failed to cancel trip', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  function handleScanPassenger(index: number) {
    pendingScanIndex.current = index;
    scanInputRef.current?.click();
  }

  async function handleScanCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const index = pendingScanIndex.current;
    e.target.value = '';
    if (!file || !tripId || index < 0) return;
    try {
      const url = await uploadPassengerScan(file, tripId, index);
      const passenger = confirmedPassengers[index];
      if (passenger) {
        await updateDoc(doc(db, 'trips', tripId, 'passengers', passenger.uid), {
          boardPhotoUrl: url,
          boardPhotoUploadedAt: serverTimestamp(),
        });
        setScanPreviews((prev) => ({ ...prev, [passenger.uid]: url }));
      }
      toast({ title: 'Photo saved' });
    } catch (err: unknown) {
      console.error(`Failed to upload passenger scan for trip ${tripId}, slot ${index}:`, err);
      toast({ title: 'Failed to save photo', description: 'Please try again.', variant: 'destructive' });
    }
  }

  function openCamera(type: PhotoType) {
    pendingPhotoType.current = type;
    cameraInputRef.current?.click();
  }

  function handleExchangePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const type = pendingPhotoType.current;
    if (!file || !type) return;
    e.target.value = '';
    const objectUrl = URL.createObjectURL(file);
    setPreviewFile(file);
    setPreviewType(type);
    setPreviewObjectUrl(objectUrl);
  }

  async function handleConfirmUpload() {
    if (!previewFile || !previewType || !tripId || !firebaseUser) return;
    const file = previewFile;
    const type = previewType;
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    setPreviewFile(null);
    setPreviewType(null);
    setPreviewObjectUrl(null);
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

  function handleRetakePhoto() {
    const type = previewType;
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    setPreviewFile(null);
    setPreviewType(null);
    setPreviewObjectUrl(null);
    if (type) {
      pendingPhotoType.current = type;
      cameraInputRef.current?.click();
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

      {/* View Manifest + Share Manifest: driver and confirmed passengers once ongoing/completed */}
      {isOngoing && (isDriver || isJoinedPassenger) && (
        <div className="flex gap-2">
          <a
            href={`/manifest/${tripId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            📋 View Manifest
          </a>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl"
            onClick={handleShareManifest}
          >
            Share Manifest
          </Button>
        </div>
      )}

      {/* Share Safety Card — always visible for driver or confirmed passenger */}
      {(isDriver || isJoinedPassenger) && (
        <Button
          variant="outline"
          className="w-full h-11 rounded-xl"
          onClick={handleShareSafetyCard}
        >
          {copied ? '✓ Copied!' : 'Share Safety Card'}
        </Button>
      )}

      {/* Passenger Actions (non-driver view) */}
      {!isDriver && (trip.status === 'open' || trip.status === 'full') && (
        <div className="space-y-2">
          {isJoined ? (
            <>
              <div className="bg-primary-light border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-primary font-semibold">✓ You're in!</p>
              </div>
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
      {isJoinedPassenger && showExchange && firebaseUser && (
        <SafetyExchangePanel
          allExchangePhotos={allExchangePhotos}
          currentUserUid={firebaseUser.uid}
          uploadingPhoto={uploadingPhoto}
          boardScanUrl={boardScanUrl}
          exchangePhotoCount={exchangePhotoCount}
          cameraInputRef={cameraInputRef}
          previewObjectUrl={previewObjectUrl}
          previewType={previewType}
          onOpenCamera={openCamera}
          onExchangePhotoCapture={handleExchangePhotoCapture}
          onShareSafetyCard={handleShareSafetyCard}
          onRetakePhoto={handleRetakePhoto}
          onConfirmUpload={handleConfirmUpload}
        />
      )}

      {/* Driver Actions */}
      {isDriver && (
        <DriverPassengerList
          passengers={confirmedPassengers}
          availableSeats={trip.availableSeats}
          tripStatus={trip.status}
          allExchangePhotos={allExchangePhotos}
          scanPreviews={scanPreviews}
          actionLoading={actionLoading}
          onScanPassenger={handleScanPassenger}
          onStartTrip={handleStartTrip}
          onCancelTrip={() => setShowCancelConfirm(true)}
        />
      )}

      {/* Always-mounted input for driver passenger scan (used by handleScanPassenger) */}
      <input
        ref={scanInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Scan passenger boarding photo"
        className="hidden"
        onChange={handleScanCapture}
      />

      {/* Trip Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="max-w-sm p-6 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <DialogTitle className="text-lg font-semibold text-gray-900">Trip completed!</DialogTitle>
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this trip?</AlertDialogTitle>
            <AlertDialogDescription>All passengers will be notified.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep trip</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelTrip}>Cancel trip</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
