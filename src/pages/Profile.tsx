import { useState, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Awaiting approval', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  verified: { label: 'Verified ✓', className: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Not approved', className: 'bg-red-50 text-red-700 border-red-200' },
  suspended: { label: 'Suspended', className: 'bg-red-50 text-red-700 border-red-200' },
};

export function Profile() {
  const { firebaseUser, userProfile } = useAuth();
  const { toast } = useToast();
  const ltfrbInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(userProfile?.fullName ?? '');
  const [mobileNumber, setMobileNumber] = useState(userProfile?.mobileNumber ?? '');
  const [homeAddress, setHomeAddress] = useState(userProfile?.homeAddress ?? '');
  const [ltfrbPermitNumber, setLtfrbPermitNumber] = useState(userProfile?.vehicle?.ltfrbPermitNumber ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

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
    if (!firebaseUser || !userProfile?.vehicle) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        'vehicle.ltfrbPermitNumber': ltfrbPermitNumber.trim() || null,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Vehicle info updated' });
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
      const storageRef = ref(storage, `ltfrb-qr/${firebaseUser.uid}/qr.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
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

  const statusInfo = userProfile?.status ? STATUS_LABELS[userProfile.status] : null;

  return (
    <div className="space-y-6 pt-4 pb-8">
      <h1 className="text-foreground font-semibold text-xl">My profile</h1>

      {/* Account Info */}
      <form onSubmit={handleSaveProfile} className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h2 className="text-foreground font-medium">Account</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Role:</span>
          <span className="bg-primary-light text-primary text-xs px-2 py-0.5 rounded-full capitalize">
            {userProfile?.role ?? '—'}
          </span>
          {statusInfo && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          )}
        </div>

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
          />
        </div>

        <Button type="submit" className="w-full rounded-xl" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </form>

      {/* Driver Section */}
      {userProfile?.role === 'driver' && userProfile.vehicle && (
        <form onSubmit={handleSaveVehicle} className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="text-foreground font-medium">Vehicle</h2>

          <div className="text-sm text-muted-foreground space-y-0.5">
            <p>{userProfile.vehicle.color} {userProfile.vehicle.make} {userProfile.vehicle.model}</p>
            <p>Plate: <span className="font-mono font-bold">{userProfile.vehicle.plateNumber}</span></p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ltfrbPermit">LTFRB Permit number</Label>
            <Input
              id="ltfrbPermit"
              placeholder="e.g. 12345678"
              value={ltfrbPermitNumber}
              onChange={(e) => setLtfrbPermitNumber(e.target.value)}
            />
          </div>

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

          <Button type="submit" className="w-full rounded-xl" disabled={saving}>
            {saving ? 'Saving…' : 'Save vehicle info'}
          </Button>
        </form>
      )}

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
    </div>
  );
}
