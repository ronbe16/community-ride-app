import { useState, useRef, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { uploadLtfrbQr } from '@/lib/cloudinary';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { APP_VERSION } from '@/constants/app';

export function Profile() {
  const { firebaseUser, userProfile } = useAuth();
  const { toast } = useToast();
  const ltfrbInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(userProfile?.fullName ?? '');
  const [mobileNumber, setMobileNumber] = useState(userProfile?.mobileNumber ?? '');
  const [homeAddress, setHomeAddress] = useState(userProfile?.homeAddress ?? '');
  const [saving, setSaving] = useState(false);

  // Vehicle fields — pre-filled if vehicle already exists
  const [vehicleMake, setVehicleMake] = useState(userProfile?.vehicle?.make ?? '');
  const [vehicleModel, setVehicleModel] = useState(userProfile?.vehicle?.model ?? '');
  const [vehicleYear, setVehicleYear] = useState(userProfile?.vehicle?.year ? String(userProfile.vehicle.year) : '');
  const [plateNumber, setPlateNumber] = useState(userProfile?.vehicle?.plateNumber ?? '');
  const [vehicleColor, setVehicleColor] = useState(userProfile?.vehicle?.color ?? '');
  const [ltfrbPermitNumber, setLtfrbPermitNumber] = useState(userProfile?.vehicle?.ltfrbPermitNumber ?? '');
  const [uploadingQr, setUploadingQr] = useState(false);

  // Sync vehicle fields when userProfile loads from Firestore
  // This handles the race condition where userProfile is null at mount time
  useEffect(() => {
    if (!userProfile?.vehicle) return;
    setVehicleMake(userProfile.vehicle.make ?? '');
    setVehicleModel(userProfile.vehicle.model ?? '');
    setVehicleYear(userProfile.vehicle.year?.toString() ?? '');
    setPlateNumber(userProfile.vehicle.plateNumber ?? '');
    setVehicleColor(userProfile.vehicle.color ?? '');
    setLtfrbPermitNumber(userProfile.vehicle.ltfrbPermitNumber ?? '');
  }, [userProfile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        homeAddress: homeAddress.trim(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Profile updated' });
    } catch (err: unknown) {
      console.error(`Failed to update profile for user ${firebaseUser.uid}:`, err);
      toast({ title: 'Failed to save', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveVehicle(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!vehicleMake || !vehicleModel || !vehicleYear || !plateNumber || !vehicleColor) {
      toast({ title: 'Please fill in all vehicle fields', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        vehicle: {
          make: vehicleMake.trim(),
          model: vehicleModel.trim(),
          year: Number(vehicleYear),
          plateNumber: plateNumber.trim(),
          color: vehicleColor.trim(),
          ltfrbPermitNumber: ltfrbPermitNumber.trim() || null,
          ltfrbQrPhotoUrl: userProfile?.vehicle?.ltfrbQrPhotoUrl ?? null,
        },
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Vehicle info saved' });
    } catch (err: unknown) {
      console.error(`Failed to update vehicle info for user ${firebaseUser.uid}:`, err);
      toast({ title: 'Failed to save', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    setUploadingQr(true);
    try {
      const url = await uploadLtfrbQr(file, firebaseUser.uid);
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        'vehicle.ltfrbQrPhotoUrl': url,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'QR photo uploaded' });
    } catch (err: unknown) {
      console.error(`Failed to upload LTFRB QR for user ${firebaseUser.uid}:`, err);
      toast({ title: 'Failed to upload', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setUploadingQr(false);
    }
  }

  const trustSignal = userProfile
    ? userProfile.ratingCount > 0
      ? `⭐ ${userProfile.rating.toFixed(1)} · ${userProfile.tripCount ?? 0} trip${(userProfile.tripCount ?? 0) === 1 ? '' : 's'}`
      : (userProfile.tripCount ?? 0) > 0
        ? `🚗 ${userProfile.tripCount} trip${userProfile.tripCount === 1 ? '' : 's'} completed`
        : 'New member'
    : '';

  return (
    <div className="space-y-6 pt-4 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground font-semibold text-xl">My profile</h1>
        {trustSignal && (
          <span className="text-sm text-muted-foreground">{trustSignal}</span>
        )}
      </div>

      {/* Account Info */}
      <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h2 className="text-foreground font-medium">Account</h2>

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mobile">Mobile number</Label>
          <Input
            id="mobile"
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Home address</Label>
          <Input
            id="address"
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
            placeholder="Block 5, Lot 12, Phase 2"
          />
        </div>

        <Button type="submit" className="w-full rounded-xl" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </form>

      {/* Vehicle Section — optional, for members who want to post trips */}
      <form onSubmit={handleSaveVehicle} className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div>
          <h2 className="text-foreground font-medium">Vehicle</h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            Fill this in if you plan to post trips as a driver.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vehicleMake">Make</Label>
          <Input
            id="vehicleMake"
            value={vehicleMake}
            onChange={(e) => setVehicleMake(e.target.value)}
            placeholder="Toyota"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vehicleModel">Model</Label>
          <Input
            id="vehicleModel"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            placeholder="Innova"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vehicleYear">Year</Label>
          <Input
            id="vehicleYear"
            type="number"
            value={vehicleYear}
            onChange={(e) => setVehicleYear(e.target.value)}
            placeholder={String(new Date().getFullYear())}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="plateNumber">Plate number</Label>
          <Input
            id="plateNumber"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="ABC 1234"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vehicleColor">Color</Label>
          <Input
            id="vehicleColor"
            value={vehicleColor}
            onChange={(e) => setVehicleColor(e.target.value)}
            placeholder="White"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ltfrbPermit">LTFRB Permit number (optional)</Label>
          <Input
            id="ltfrbPermit"
            value={ltfrbPermitNumber}
            onChange={(e) => setLtfrbPermitNumber(e.target.value)}
            placeholder="Enter permit number"
          />
        </div>

        {userProfile?.vehicle && (
          <div className="space-y-1.5">
            <Label>LTFRB QR sticker photo</Label>
            {userProfile.vehicle.ltfrbQrPhotoUrl && (
              <img
                src={userProfile.vehicle.ltfrbQrPhotoUrl}
                alt="LTFRB QR sticker"
                className="w-32 h-32 object-cover rounded-lg border border-border"
              />
            )}
            <input
              ref={ltfrbInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleQrUpload}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              disabled={uploadingQr}
              onClick={() => ltfrbInputRef.current?.click()}
            >
              {uploadingQr ? 'Uploading…' : userProfile.vehicle.ltfrbQrPhotoUrl ? 'Replace QR photo' : 'Upload QR sticker photo'}
            </Button>
          </div>
        )}

        <Button type="submit" className="w-full rounded-xl" disabled={saving}>
          {saving ? 'Saving…' : 'Save vehicle info'}
        </Button>
      </form>

      {/* Sign Out */}
      <Button
        variant="destructive"
        className="w-full rounded-xl"
        onClick={() => signOut(auth).catch((err: unknown) => {
          console.error('Failed to sign out:', err);
        })}
      >
        Sign out
      </Button>

      <p className="text-xs text-gray-400 text-center pt-4 pb-8">
        Community Ride v{APP_VERSION}
      </p>
    </div>
  );
}
