import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, addDoc, getDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile, Trip } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

function timeAgo(ts: Timestamp): string {
  const diff = Date.now() - ts.toDate().getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Tab 1: Pending Verifications ────────────────────────────────────────────

function PendingTab() {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [idPhotoUrls, setIdPhotoUrls] = useState<Record<string, string>>({});
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [rejectUid, setRejectUid] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile))),
      (err) => console.error('Failed to subscribe to pending users:', err),
    );
    return unsub;
  }, []);

  async function loadIdPhoto(uid: string) {
    if (idPhotoUrls[uid]) {
      setViewingId(uid);
      return;
    }
    try {
      const url = await getDownloadURL(ref(storage, `id-photos/${uid}/id.jpg`));
      setIdPhotoUrls((prev) => ({ ...prev, [uid]: url }));
      setViewingId(uid);
    } catch (err: unknown) {
      console.error(`Failed to load ID photo for user ${uid}:`, err);
      toast({ title: 'Failed to load ID photo', variant: 'destructive' });
    }
  }

  async function handleApprove(uid: string) {
    if (!firebaseUser) return;
    setProcessing(uid);
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'verified',
        idVerifiedAt: serverTimestamp(),
        idVerifiedBy: firebaseUser.uid,
        updatedAt: serverTimestamp(),
      });
      // Notify the user
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data().fcmToken) {
        addDoc(collection(db, 'pending_notifications'), {
          token: userDoc.data().fcmToken,
          title: "You're verified!",
          body: "You can now join or post trips.",
          createdAt: serverTimestamp(),
        }).catch((err: unknown) => {
          console.error(`Failed to queue approval notification for user ${uid}:`, err);
        });
      }
      toast({ title: 'User approved' });
    } catch (err: unknown) {
      console.error(`Failed to approve user ${uid}:`, err);
      toast({ title: 'Failed to approve', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(uid: string) {
    if (!rejectNote.trim()) {
      toast({ title: 'Please enter a rejection reason', variant: 'destructive' });
      return;
    }
    setProcessing(uid);
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'rejected',
        rejectionNote: rejectNote.trim(),
        updatedAt: serverTimestamp(),
      });
      // Notify the user
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data().fcmToken) {
        addDoc(collection(db, 'pending_notifications'), {
          token: userDoc.data().fcmToken,
          title: "ID not approved",
          body: "Your ID wasn't approved. Open the app to learn more.",
          createdAt: serverTimestamp(),
        }).catch((err: unknown) => {
          console.error(`Failed to queue rejection notification for user ${uid}:`, err);
        });
      }
      setRejectUid(null);
      setRejectNote('');
      toast({ title: 'User rejected' });
    } catch (err: unknown) {
      console.error(`Failed to reject user ${uid}:`, err);
      toast({ title: 'Failed to reject', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-3">
      {users.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">No pending verifications.</p>
      )}
      {users.map((u) => (
        <div key={u.uid} className="bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{u.fullName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${u.role === 'driver' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              {u.role}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo(u.createdAt)}</span>
          </div>
          <p className="text-sm text-muted-foreground">{u.homeAddress}</p>
          <p className="text-sm text-muted-foreground">Mobile: {u.mobileNumber}</p>

          <div className="flex gap-2 flex-wrap pt-1">
            <Button size="sm" variant="outline" onClick={() => loadIdPhoto(u.uid)}>
              View ID
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={processing === u.uid}
              onClick={() => handleApprove(u.uid)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={processing === u.uid}
              onClick={() => { setRejectUid(u.uid); setRejectNote(''); }}
            >
              Reject
            </Button>
          </div>

          {/* Rejection note input */}
          {rejectUid === u.uid && (
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Reason for rejection (shown to user)"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="text-sm"
              />
              <Button
                size="sm"
                variant="destructive"
                disabled={processing === u.uid}
                onClick={() => handleReject(u.uid)}
              >
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRejectUid(null)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* ID Photo Modal */}
      {viewingId && idPhotoUrls[viewingId] && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingId(null)}
        >
          <img
            src={idPhotoUrls[viewingId]}
            alt="ID Photo"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// ── Tab 2: All Users ─────────────────────────────────────────────────────────

function AllUsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc')),
      (snap) => setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile))),
      (err) => console.error('Failed to subscribe to all users:', err),
    );
    return unsub;
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.mobileNumber.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-3">
      <Input placeholder="Search by name or mobile…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="flex gap-2">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm border border-border rounded-lg px-2 py-1 bg-card text-foreground"
        >
          <option value="all">All roles</option>
          <option value="driver">Driver</option>
          <option value="passenger">Passenger</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-border rounded-lg px-2 py-1 bg-card text-foreground"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      {filtered.map((u) => (
        <div key={u.uid} className="bg-card border border-border rounded-xl p-3 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground text-sm">{u.fullName}</span>
            <span className="text-xs text-muted-foreground capitalize">{u.role}</span>
            <span className="text-xs text-muted-foreground capitalize">· {u.status}</span>
          </div>
          <p className="text-xs text-muted-foreground">{u.mobileNumber} · {u.email}</p>
          <p className="text-xs text-muted-foreground">{u.homeAddress}</p>
        </div>
      ))}
      {filtered.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">No users found.</p>
      )}
    </div>
  );
}

// ── Tab 3: Active Trips ───────────────────────────────────────────────────────

function ActiveTripsTab() {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const q = query(
      collection(db, 'trips'),
      where('departureTime', '>=', Timestamp.fromDate(todayStart)),
      orderBy('departureTime', 'asc'),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip))),
      (err) => console.error('Failed to subscribe to active trips:', err),
    );
    return unsub;
  }, []);

  async function handleCancelTrip(tripId: string) {
    if (!window.confirm('Cancel this trip?')) return;
    try {
      await updateDoc(doc(db, 'trips', tripId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Trip cancelled' });
    } catch (err: unknown) {
      console.error(`Failed to cancel trip ${tripId}:`, err);
      toast({ title: 'Failed to cancel trip', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-3">
      {trips.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">No trips today.</p>
      )}
      {trips.map((t) => (
        <div key={t.id} className="bg-card border border-border rounded-xl p-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground text-sm">{t.driverName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              t.status === 'open' ? 'bg-green-50 text-green-700 border-green-200' :
              t.status === 'full' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {t.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{t.origin} → {t.destination}</p>
          <p className="text-xs text-muted-foreground">
            {t.departureTime.toDate().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })} · {t.filledSeats}/{t.availableSeats} seats
          </p>
          {t.status !== 'cancelled' && (
            <Button
              size="sm"
              variant="destructive"
              className="mt-1 text-xs"
              onClick={() => handleCancelTrip(t.id)}
            >
              Cancel trip
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main AdminPanel ───────────────────────────────────────────────────────────

export function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState<'pending' | 'users' | 'trips'>('pending');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('status', '==', 'pending'));
    const unsub = onSnapshot(
      q,
      (snap) => setPendingCount(snap.size),
      (err) => console.error('Failed to subscribe to pending count:', err),
    );
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const tabs: { key: 'pending' | 'users' | 'trips'; label: string }[] = [
    { key: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { key: 'users', label: 'All Users' },
    { key: 'trips', label: 'Active Trips' },
  ];

  return (
    <div className="space-y-4 pt-4">
      <h1 className="text-foreground font-semibold text-xl">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pending' && <PendingTab />}
      {tab === 'users' && <AllUsersTab />}
      {tab === 'trips' && <ActiveTripsTab />}
    </div>
  );
}
