import { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadIdPhoto } from '@/lib/cloudinary';
import { ninetyDaysFromNow } from '@/lib/retention';
import { APP_NAME, CONSENT_VERSION, VEHICLE_MAX_AGE_YEARS } from '@/constants/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { UserRole } from '@/types';

type Step = 1 | 2 | 3 | 4;

interface LocationState {
  uid: string;
  fullName: string;
  email: string;
}

export function CompleteProfile() {
  const { state } = useLocation() as { state: LocationState };
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 — contact + role
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);

  // Step 2 — vehicle (driver only)
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [ltfrbPermit, setLtfrbPermit] = useState('');

  // Step 3 — ID photo
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);

  // Step 4 — consent
  const [consent, setConsent] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearWarning = vehicleYear && Number(vehicleYear) < currentYear - VEHICLE_MAX_AGE_YEARS;

  const canProceedStep1 = mobile && address && role;
  const canProceedStep2 =
    role === 'passenger' || (vehicleMake && vehicleModel && vehicleYear && plateNumber && vehicleColor);

  const handleNext = () => {
    if (step === 1 && role === 'passenger') {
      setStep(3);
    } else {
      setStep((s) => Math.min(s + 1, 4) as Step);
    }
  };

  const handleBack = () => {
    if (step === 3 && role === 'passenger') {
      setStep(1);
    } else {
      setStep((s) => Math.max(s - 1, 1) as Step);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setIdPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!idPhotoFile || !state) return;
    setError('');
    setLoading(true);
    try {
      const idPhotoUrl = await uploadIdPhoto(idPhotoFile, state.uid);
      await setDoc(doc(db, 'users', state.uid), {
        uid: state.uid,
        fullName: state.fullName,
        email: state.email,
        mobileNumber: mobile.trim(),
        homeAddress: address.trim(),
        role,
        vehicle: role === 'driver' ? {
          make: vehicleMake.trim(),
          model: vehicleModel.trim(),
          year: Number(vehicleYear),
          plateNumber: plateNumber.trim(),
          color: vehicleColor.trim(),
          ltfrbPermitNumber: ltfrbPermit.trim() || null,
          ltfrbQrPhotoUrl: null,
        } : null,
        status: 'pending',
        idPhotoUrl,
        consentVersion: CONSENT_VERSION,
        consentAcceptedAt: serverTimestamp(),
        deleteAt: ninetyDaysFromNow(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      });
      navigate('/pending');
    } catch (err: any) {
      console.error(`Failed to complete profile for user ${state.uid}:`, err);
      setError(err.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  if (!state?.uid) {
    navigate('/login', { replace: true });
    return null;
  }

  const stepCount = role === 'driver' ? 4 : 3;
  const displayStep = step === 1 ? 1 : step === 2 ? 2 : step === 3 ? (role === 'passenger' ? 2 : 3) : (role === 'passenger' ? 3 : 4);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-app">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-lg font-bold mx-auto mb-3">
            CR
          </div>
          <h1 className="text-xl font-bold text-foreground">Complete your profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {displayStep} of {stepCount}</p>
          <p className="text-muted-foreground text-sm mt-1">Signed in as <strong>{state.fullName || state.email}</strong></p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {step === 1 && 'Contact & Role'}
              {step === 2 && 'Vehicle Information'}
              {step === 3 && 'ID Verification'}
              {step === 4 && 'Terms & Consent'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={state.fullName} readOnly className="bg-muted text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={state.email} readOnly className="bg-muted text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">+63</span>
                    <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="9171234567" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Your address within the village</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Block 5, Lot 12, Phase 2" />
                </div>
                <div className="space-y-2">
                  <Label>I want to...</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('passenger')}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        role === 'passenger'
                          ? 'border-primary bg-primary-light text-foreground'
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      <span className="text-2xl block mb-1">🚗</span>
                      <span className="text-sm font-medium">I need rides</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('driver')}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        role === 'driver'
                          ? 'border-primary bg-primary-light text-foreground'
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      <span className="text-2xl block mb-1">🛺</span>
                      <span className="text-sm font-medium">I can drive</span>
                    </button>
                  </div>
                </div>
                <Button onClick={handleNext} className="w-full" disabled={!canProceedStep1}>
                  Next
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Vehicle Make</Label>
                  <Input value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} placeholder="Toyota" />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Model</Label>
                  <Input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="Innova" />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Year</Label>
                  <Input type="number" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} placeholder={String(currentYear)} />
                  {yearWarning && (
                    <p className="text-warning text-xs">⚠️ Vehicle is older than {VEHICLE_MAX_AGE_YEARS} years</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Plate Number</Label>
                  <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="ABC 1234" />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} placeholder="White" />
                </div>
                <div className="space-y-2">
                  <Label>LTFRB Carpooling Special Permit (optional)</Label>
                  <Input value={ltfrbPermit} onChange={(e) => setLtfrbPermit(e.target.value)} placeholder="Enter permit number" />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button onClick={handleNext} className="flex-1" disabled={!canProceedStep2}>Next</Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="text-center space-y-3">
                  <p className="text-sm text-foreground font-medium">Upload a photo of your government ID</p>
                  <p className="text-xs text-muted-foreground">
                    Our community admin will review this before activating your account.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Accepted: PhilSys, Driver's License, Passport, SSS/GSIS, Voter's ID, PRC ID
                  </div>
                </div>

                {idPhoto ? (
                  <div className="relative">
                    <img src={idPhoto} alt="ID Preview" className="w-full rounded-xl border border-border" />
                    <button
                      onClick={() => { setIdPhoto(null); setIdPhotoFile(null); }}
                      className="absolute top-2 right-2 bg-card rounded-full w-8 h-8 flex items-center justify-center text-destructive shadow-sm border border-border"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-12 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary transition-colors"
                  >
                    <span className="text-3xl block mb-2">📷</span>
                    <span className="text-sm">Tap to capture or upload</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button onClick={handleNext} className="flex-1" disabled={!idPhoto}>Next</Button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    By registering, you agree to our{' '}
                    <Link to="/terms" className="text-primary underline">Terms of Use</Link> and{' '}
                    <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
                  </p>
                  <p>
                    Your data is stored locally within this community's database. Trip history is automatically deleted after 90 days. ID photos are visible only to the community admin.
                  </p>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked === true)}
                  />
                  <label htmlFor="consent" className="text-sm text-foreground cursor-pointer leading-tight">
                    I have read and agree to the Terms of Use and Privacy Policy
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button onClick={handleSubmit} className="flex-1" disabled={!consent || loading}>
                    {loading ? 'Saving...' : 'Complete Registration'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
