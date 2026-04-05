import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/components/shared/ProtectedLayout';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { SafetyCard } from '@/pages/SafetyCard';
import { Manifest } from '@/pages/Manifest';
import { PostTrip } from '@/pages/PostTrip';
import { TripDetail } from '@/pages/TripDetail';
import { Profile } from '@/pages/Profile';
import { CompleteProfile } from '@/pages/CompleteProfile';
import { TermsPage } from '@/pages/TermsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { PwaInstallBanner } from '@/components/shared/PwaInstallBanner';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <PwaInstallBanner />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/safety/:linkId" element={<SafetyCard />} />
          <Route path="/manifest/:manifestId" element={<Manifest />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Protected app routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/post-trip" element={<PostTrip />} />
            <Route path="/trip/:tripId" element={<TripDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
