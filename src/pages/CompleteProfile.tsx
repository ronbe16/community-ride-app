import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ninetyDaysFromNow } from '@/lib/retention';
import { APP_NAME, CONSENT_VERSION } from '@/constants/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface LocationState {
  uid: string;
  fullName: string;
  email: string;
}

export function CompleteProfile() {
  const { state } = useLocation() as { state: LocationState };
  const navigate = useNavigate();

  const [mobile, setMobile] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = mobile && consent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state?.uid) return;
    setError('');
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', state.uid), {
        uid: state.uid,
        fullName: state.fullName,
        email: state.email,
        mobileNumber: '+63' + mobile.trim(),
        status: 'verified',
        consentVersion: CONSENT_VERSION,
        consentAcceptedAt: serverTimestamp(),
        deleteAt: ninetyDaysFromNow(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        tripCount: 0,
        rating: 0,
        ratingCount: 0,
      });
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete profile';
      console.error(`Failed to complete profile for user ${state.uid}:`, err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!state?.uid) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-app">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-lg font-bold mx-auto mb-3">
            CR
          </div>
          <h1 className="text-xl font-bold text-foreground">Complete your profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Signed in as <strong>{state.fullName || state.email}</strong></p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Join {APP_NAME}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9171234567"
                    required
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                By joining, you agree to our{' '}
                <Link to="/terms" className="text-primary underline">Terms of Use</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
                Trip history is deleted after 90 days.
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                />
                <label htmlFor="consent" className="text-sm text-foreground cursor-pointer leading-tight">
                  I agree to the Terms of Use and Privacy Policy
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={!canSubmit || loading}>
                {loading ? 'Saving…' : 'Join Now'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
