import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { InstallGuideDialog } from '@/components/shared/InstallGuideDialog';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ninetyDaysFromNow } from '@/lib/retention';
import { APP_NAME, CONSENT_VERSION } from '@/constants/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const googleProvider = new GoogleAuthProvider();

export function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [consent, setConsent] = useState(false);

  const canSubmit = fullName && email && password.length >= 8 && mobile && consent;

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        navigate('/complete-profile', {
          state: { uid: user.uid, fullName: user.displayName || '', email: user.email || '' },
        });
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Google sign-in failed:', err);
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account with this email already exists. Please sign in with your password.');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: '+63' + mobile.trim(),
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
      const message = err instanceof Error ? err.message : 'Registration failed';
      console.error('Registration failed for email', email, ':', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const { isInstallable, install } = usePwaInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 relative">
      <button
        onClick={handleInstallClick}
        className="absolute top-4 right-4 flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        Install App
      </button>
      <div className="w-full max-w-app">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-lg font-bold mx-auto mb-3">
            CR
          </div>
          <h1 className="text-xl font-bold text-foreground">Join {APP_NAME}</h1>
          <p className="text-muted-foreground text-sm mt-1">For Metrocor-B Homes residents only.</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Create your account</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3 text-gray-700 font-medium shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 mb-4"
            >
              <img src="/icons/google.svg" alt="" className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-xs">or continue with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Password (min 8 characters)</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
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
                {loading ? 'Creating account…' : 'Join Now'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
      <InstallGuideDialog open={showInstallGuide} onOpenChange={setShowInstallGuide} />
    </div>
  );
}
