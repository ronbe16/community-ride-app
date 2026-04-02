import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/components/shared/ProtectedLayout';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { PendingApproval } from '@/pages/PendingApproval';
import { Dashboard } from '@/pages/Dashboard';
import { SafetyCard } from '@/pages/SafetyCard';
import { Manifest } from '@/pages/Manifest';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

// Stubs — Antigravity will replace
const PostTrip = () => <div className="p-4 text-muted-foreground">PostTrip — coming soon</div>;
const TermsPage = () => <div className="p-4">Terms — coming soon</div>;
const PrivacyPage = () => <div className="p-4">Privacy — coming soon</div>;
const TripDetail = () => <div className="p-4 text-muted-foreground">TripDetail — coming soon</div>;
const Profile = () => <div className="p-4 text-muted-foreground">Profile — coming soon</div>;
const AdminPanel = () => <div className="p-4 text-muted-foreground">AdminPanel — coming soon</div>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pending" element={<PendingApproval />} />
          <Route path="/safety/:linkId" element={<SafetyCard />} />
          <Route path="/manifest/:manifestId" element={<Manifest />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* Protected app routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/post-trip" element={<PostTrip />} />
            <Route path="/trip/:tripId" element={<TripDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
