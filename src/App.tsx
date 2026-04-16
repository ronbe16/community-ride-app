import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/components/shared/ProtectedLayout';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';

const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const SafetyCard = lazy(() => import('@/pages/SafetyCard').then(m => ({ default: m.SafetyCard })));
const Manifest = lazy(() => import('@/pages/Manifest').then(m => ({ default: m.Manifest })));
const PostTrip = lazy(() => import('@/pages/PostTrip').then(m => ({ default: m.PostTrip })));
const TripDetail = lazy(() => import('@/pages/TripDetail').then(m => ({ default: m.TripDetail })));
const Profile = lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })));
const CompleteProfile = lazy(() => import('@/pages/CompleteProfile').then(m => ({ default: m.CompleteProfile })));
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { PwaInstallBanner } from '@/components/shared/PwaInstallBanner';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <PwaInstallBanner />
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
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
        </Suspense>
      </BrowserRouter>
      </ErrorBoundary>
    </AuthProvider>
  );
}
