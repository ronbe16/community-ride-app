import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COMMUNITY_NAME } from '@/constants/app';
import { ExchangePhoto } from '@/types';

interface SafetyLinkData {
  communityName: string;
  driver: {
    fullName: string;
    tripCount: number;
    rating: number;
    ratingCount: number;
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
  exchangePhotos?: Record<string, ExchangePhoto>;
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

  const exchangePhotos = data.exchangePhotos ? Object.values(data.exchangePhotos) : [];

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
        <div className="flex items-center gap-2 mt-1">
          {data.driver.rating > 0 ? (
            <span className="text-amber-500 text-sm font-medium">⭐ {data.driver.rating.toFixed(1)}</span>
          ) : (
            <span className="text-gray-400 text-sm">New member</span>
          )}
          {data.driver.tripCount > 0 && (
            <span className="text-gray-400 text-sm">· {data.driver.tripCount} trips</span>
          )}
        </div>
        {data.driver.vehicle.ltfrbPermitNumber && (
          <div className="text-blue-600 text-sm mt-1">✓ LTFRB Permit #{data.driver.vehicle.ltfrbPermitNumber}</div>
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

      {/* Exchange photos */}
      {exchangePhotos.length > 0 && (
        <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-white">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Safety photos (deleted 24hrs after trip)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {exchangePhotos.map((photo) => (
              <div key={photo.publicId}>
                <div className="aspect-square">
                  <img
                    src={photo.url}
                    alt={photo.type}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="text-xs text-gray-400 text-center mt-1 capitalize">
                  {photo.type}
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-2 text-center">
            These photos are automatically deleted 24 hours after the trip
          </div>
        </div>
      )}

      {/* Expiry notice */}
      <div className="text-center text-gray-400 text-xs mb-4">
        This link expires 24 hours after departure
      </div>

      {/* Footer */}
      <div className="text-center text-gray-400 text-xs border-t border-gray-200 pt-4">
        Community Ride · {data.communityName || COMMUNITY_NAME}
      </div>
    </div>
  );
}
