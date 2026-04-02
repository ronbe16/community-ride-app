import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COMMUNITY_NAME } from '@/constants/app';

interface SafetyLinkData {
  communityName: string;
  driver: {
    fullName: string;
    vehicle: {
      color: string;
      make: string;
      model: string;
      year?: number;
      plateNumber: string;
      ltfrbPermitNumber?: string;
    };
  };
  trip: {
    origin: string;
    destination: string;
    departureTime: { toDate: () => Date };
  };
  expiresAt: { toDate: () => Date };
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );
}

function ExpiredScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <span className="text-5xl">⏰</span>
      <h1 className="text-xl font-semibold text-gray-900 mt-4">Link expired</h1>
      <p className="text-gray-500 text-sm mt-2">
        This safety card link has expired. Ask the passenger to share a new one.
      </p>
    </div>
  );
}

export function SafetyCard() {
  const { linkId } = useParams<{ linkId: string }>();
  const [data, setData] = useState<SafetyLinkData | null>(null);
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!linkId) {
      setLoading(false);
      return;
    }
    getDoc(doc(db, 'safety_links', linkId)).then((snap) => {
      if (!snap.exists()) {
        setLoading(false);
        return;
      }
      const d = snap.data() as SafetyLinkData;
      if (d.expiresAt.toDate() < new Date()) {
        setExpired(true);
      } else {
        setData(d);
      }
      setLoading(false);
    }).catch((err: unknown) => {
      console.error(`Failed to load safety link ${linkId}:`, err);
      setLoading(false);
    });
  }, [linkId]);

  if (loading) return <LoadingScreen />;
  if (!data || expired) return <ExpiredScreen />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-[480px] mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-emerald-600 font-bold text-lg">🗺 Driver Safety Card</div>
        <div className="text-gray-500 text-sm">{data.communityName || COMMUNITY_NAME}</div>
      </div>

      {/* Driver info */}
      <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-white">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Driver</div>
        <div className="font-bold text-gray-900 text-lg">{data.driver.fullName}</div>
        <div className="text-emerald-600 text-sm font-medium">✓ Community Verified</div>
        {data.driver.vehicle.ltfrbPermitNumber && (
          <div className="text-blue-600 text-sm">✓ LTFRB Permit #{data.driver.vehicle.ltfrbPermitNumber}</div>
        )}
      </div>

      {/* Vehicle info */}
      <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-white">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Vehicle</div>
        <div className="font-semibold text-gray-900">
          {data.driver.vehicle.color} {data.driver.vehicle.make} {data.driver.vehicle.model}
          {data.driver.vehicle.year ? ` (${data.driver.vehicle.year})` : ''}
        </div>
        <div className="text-gray-600">
          Plate: <span className="font-mono font-bold">{data.driver.vehicle.plateNumber}</span>
        </div>
      </div>

      {/* Trip info */}
      <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-white">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Trip</div>
        <div className="text-gray-900 font-medium">
          {data.trip.origin} → {data.trip.destination}
        </div>
        <div className="text-gray-500 text-sm mt-1">
          Departs: {data.trip.departureTime.toDate().toLocaleString('en-PH', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </div>
      </div>

      {/* Expiry notice */}
      <div className="text-center text-gray-400 text-xs mb-4">
        This link expires 48 hours after departure
      </div>

      {/* Footer */}
      <div className="text-center text-gray-400 text-xs border-t border-gray-200 pt-4">
        Community Ride · {data.communityName || COMMUNITY_NAME}
      </div>
    </div>
  );
}
