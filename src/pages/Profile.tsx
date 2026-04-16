import { useState, useRef, useEffect } from 'react';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { uploadLtfrbQr } from '@/lib/cloudinary';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { APP_VERSION, LTFRB_PERMIT_URL } from '@/constants/app';

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
  const [ltoRegistrationNumber, setLtoRegistrationNumber] = useState(userProfile?.vehicle?.ltoRegistrationNumber ?? '');
  const [insuranceProvider, setInsuranceProvider] = useState(userProfile?.vehicle?.insuranceProvider ?? '');
  const [insuranceExpiry, setInsuranceExpiry] = useState(userProfile?.vehicle?.insuranceExpiry ?? '');
  const [driverLicenseNumber, setDriverLicenseNumber] = useState(userProfile?.vehicle?.driverLicenseNumber ?? '');
  const [driverLicenseExpiry, setDriverLicenseExpiry] = useState(userProfile?.vehicle?.driverLicenseExpiry ?? '');
  const [uploadingQr, setUploadingQr] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    setLtoRegistrationNumber(userProfile.vehicle.ltoRegistrationNumber ?? '');
    setInsuranceProvider(userProfile.vehicle.insuranceProvider ?? '');
    setInsuranceExpiry(userProfile.vehicle.insuranceExpiry ?? '');
    setDriverLicenseNumber(userProfile.vehicle.driverLicenseNumber ?? '');
    setDriverLicenseExpiry(userProfile.vehicle.driverLicenseExpiry ?? '');
  }, [userProfile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!firebaseUser) return;
    if (!fullName.trim()) {
      toast({ title: 'Full name is required.', variant: 'destructive' });
      return;
    }
    if (!mobileNumber.trim()) {
      toast({ title: 'Mobile number is required.', variant: 'destructive' });
      return;
    }
    if (!homeAddress.trim()) {
      toast({ title: 'Home address is required.', variant: 'destructive' });
      return;
    }
    const cleanMobile = mobileNumber.trim();
    const localDigits = cleanMobile.startsWith('+63')
      ? cleanMobile.slice(3)
      : cleanMobile.replace(/\D/g, '');
    if (!/^9\d{9}$/.test(localDigits)) {
      toast({ title: 'Enter a valid Philippine mobile number (e.g. +639171234567 or 9171234567).', variant: 'destructive' });
      return;
    }
    const normalizedMobile = '+63' + localDigits;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        fullName: fullName.trim(),
        mobileNumber: normalizedMobile,
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
    if (!vehicleMake.trim()) {
      toast({ title: 'Vehicle make is required.', variant: 'destructive' });
      return;
    }
    if (!vehicleModel.trim()) {
      toast({ title: 'Vehicle model is required.', variant: 'destructive' });
      return;
    }
    if (!vehicleYear.trim() || isNaN(Number(vehicleYear))) {
      toast({ title: 'Vehicle year is required.', variant: 'destructive' });
      return;
    }
    if (!plateNumber.trim()) {
      toast({ title: 'Plate number is required.', variant: 'destructive' });
      return;
    }
    if (!vehicleColor.trim()) {
      toast({ title: 'Vehicle color is required.', variant: 'destructive' });
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
          ltoRegistrationNumber: ltoRegistrationNumber.trim() || null,
          insuranceProvider: insuranceProvider.trim() || null,
          insuranceExpiry: insuranceExpiry.trim() || null,
          driverLicenseNumber: driverLicenseNumber.trim() || null,
          driverLicenseExpiry: driverLicenseExpiry.trim() || null,
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

  async function handleDeleteAccount() {
    if (!firebaseUser) return;
    const confirmed = window.confirm(
      'This will permanently delete your account and all personal data. This cannot be undone.'
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), { status: 'deleted' });
      await deleteUser(firebaseUser);
      // AuthContext detects sign-out and redirects to /login
    } catch (err: unknown) {
      console.error(`Failed to delete account for user ${firebaseUser.uid}:`, err);
      toast({ title: 'Could not delete account. Please try again.', variant: 'destructive' });
      setDeleting(false);
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
          <Label htmlFor="fullName">Full name <span className="text-red-500">*</span></Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mobile">Mobile number <span className="text-red-500">*</span></Label>
          <Input
            id="mobile"
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Home address <span className="text-red-500">*</span></Label>
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
          <Label htmlFor="vehicleMake">Make <span className="text-red-500">*</span></Label>
          <Input
            id="vehicleMake"
            value={vehicleMake}
            onChange={(e) => setVehicleMake(e.target.value)}
            placeholder="Toyota"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vehicleModel">Model <span className="text-red-500">*</span></Label>
          <Input
            id="vehicleModel"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            placeholder="Innova"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vehicleYear">Year <span className="text-red-500">*</span></Label>
          <Input
            id="vehicleYear"
            type="number"
            value={vehicleYear}
            onChange={(e) => setVehicleYear(e.target.value)}
            placeholder={String(new Date().getFullYear())}
          />
          {vehicleYear && new Date().getFullYear() - Number(vehicleYear) > 5 && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
              ⚠️ LTFRB draft guidelines require carpool vehicles to be 5 years old or newer
              ({new Date().getFullYear() - 5} or later). Your vehicle ({vehicleYear}) may not qualify
              for the official carpooling permit. You can still use Community Ride for informal HOA carpools.
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="plateNumber">Plate number <span className="text-red-500">*</span></Label>
          <Input
            id="plateNumber"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="ABC 1234"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vehicleColor">Color <span className="text-red-500">*</span></Label>
          <Input
            id="vehicleColor"
            value={vehicleColor}
            onChange={(e) => setVehicleColor(e.target.value)}
            placeholder="White"
          />
        </div>

        {/* LTFRB Compliance Documents sub-section */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-amber-900">🪪 LTFRB Compliance Documents</h3>
            <p className="text-xs text-amber-700 mt-1">
              Ang mga dokumentong ito ay ginagamit para sa LTFRB carpooling compliance.
              Hindi kailangan ngayon, pero kapag lumabas na ang opisyal na circular,
              maaaring maging required ang ilan sa mga ito.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ltfrbPermit" className="text-amber-900">LTFRB Permit Number</Label>
            <Input
              id="ltfrbPermit"
              value={ltfrbPermitNumber}
              onChange={(e) => setLtfrbPermitNumber(e.target.value)}
              placeholder="Enter permit number"
              className="bg-white"
            />
          </div>

          {userProfile?.vehicle && (
            <div className="space-y-1.5">
              <Label className="text-amber-900">LTFRB QR Code Photo</Label>
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
                className="w-full rounded-xl bg-white"
                disabled={uploadingQr}
                onClick={() => ltfrbInputRef.current?.click()}
              >
                {uploadingQr ? 'Uploading…' : userProfile.vehicle.ltfrbQrPhotoUrl ? 'Replace QR photo' : 'Upload QR sticker photo'}
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ltoReg" className="text-amber-900">LTO Registration Number (OR/CR)</Label>
            <Input
              id="ltoReg"
              value={ltoRegistrationNumber}
              onChange={(e) => setLtoRegistrationNumber(e.target.value)}
              placeholder="e.g. 12345678"
              className="bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="insuranceProvider" className="text-amber-900">Insurance Provider</Label>
            <Input
              id="insuranceProvider"
              value={insuranceProvider}
              onChange={(e) => setInsuranceProvider(e.target.value)}
              placeholder='e.g. "Malayan Insurance"'
              className="bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="insuranceExpiry" className="text-amber-900">Insurance Expiry</Label>
            <Input
              id="insuranceExpiry"
              type="date"
              value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="driverLicenseNumber" className="text-amber-900">Driver's License Number</Label>
            <Input
              id="driverLicenseNumber"
              value={driverLicenseNumber}
              onChange={(e) => setDriverLicenseNumber(e.target.value)}
              placeholder="LTO license number"
              className="bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="driverLicenseExpiry" className="text-amber-900">Driver's License Expiry</Label>
            <Input
              id="driverLicenseExpiry"
              type="date"
              value={driverLicenseExpiry}
              onChange={(e) => setDriverLicenseExpiry(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="mt-3 pt-3 border-t border-amber-200">
            <a
              href={LTFRB_PERMIT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 underline"
            >
              Apply for LTFRB Carpooling Permit →
            </a>
            <p className="text-xs text-amber-600 mt-1">
              Official application portal is pending publication of the LTFRB circular.
              Link will be updated when available.
            </p>
          </div>
        </div>

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

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-xl p-4 space-y-3">
        <h2 className="text-red-700 font-medium text-sm">Danger Zone</h2>
        <p className="text-xs text-red-600">
          Deleting your account will permanently remove your personal data from Community Ride.
          This cannot be undone.
        </p>
        <Button
          variant="destructive"
          className="w-full rounded-xl"
          disabled={deleting}
          onClick={handleDeleteAccount}
        >
          {deleting ? 'Deleting…' : 'Delete Account'}
        </Button>
      </div>

      <p className="text-xs text-gray-400 text-center pt-4 pb-8">
        Community Ride v1.0.4b
      </p>
    </div>
  );
}
