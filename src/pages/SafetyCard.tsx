import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COMMUNITY_NAME } from '@/constants/app';

interface SafetyLinkData {
  communityName: string;
  driver: {
    fullName: string;
    mobileNumber?: string;
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
  passengers?: Array<{
    fullName: string;
    facePhotoUrl?: string | null;
    idPhotoUrl?: string | null;
    platePhotoUrl?: string | null;
    boardScanUrl?: string | null;
  }>;
  exchangePhotos?: {
    faceUrl: string | null;
    idUrl: string | null;
    plateUrl: string | null;
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

  // Prevent search engine indexing — safety card links contain PII
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

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
        <div className="text-gray-500 text-sm mt-1">
          {(data.driver.tripCount ?? 0) > 0
            ? `${data.driver.tripCount} trips completed`
            : 'New member'}
        </div>
        {data.driver.mobileNumber && (
          <a
            href={`tel:${data.driver.mobileNumber}`}
            className="text-emerald-600 text-sm mt-1 block"
          >
            📞 {data.driver.mobileNumber}
          </a>
        )}
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
        {data.driver.vehicle.ltfrbPermitNumber && (
          <div className="text-xs text-emerald-700 mt-1">
            🛡 LTFRB Permit: {data.driver.vehicle.ltfrbPermitNumber}
          </div>
        )}
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

      {/* Safety photos */}
      {(data.passengers?.some((p) => p.facePhotoUrl || p.idPhotoUrl || p.platePhotoUrl || p.boardScanUrl) ||
        (!data.passengers && (data.exchangePhotos?.faceUrl || data.exchangePhotos?.idUrl || data.exchangePhotos?.plateUrl))) && (
        <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-white">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Safety Verification Photos</div>
          <p className="text-xs text-gray-400 mb-3">
            Shared for trip safety. Deleted 24 hours after departure.
          </p>
          {/* Per-passenger photos (new format) */}
          {data.passengers && data.passengers.map((passenger, idx) => {
            const hasPhotos = passenger.facePhotoUrl || passenger.idPhotoUrl || passenger.platePhotoUrl || passenger.boardScanUrl;
            if (!hasPhotos) return null;
            return (
              <div key={idx} className="mb-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">{passenger.fullName}</div>
                <div className="flex gap-3 flex-wrap">
                  {passenger.facePhotoUrl && (
                    <div className="flex flex-col items-center gap-0.5">
                      <img src={passenger.facePhotoUrl} alt={`Face photo of ${passenger.fullName}`} className="w-16 h-16 object-cover rounded-lg" />
                      <span className="text-xs text-gray-400">Face</span>
                    </div>
                  )}
                  {passenger.idPhotoUrl && (
                    <div className="flex flex-col items-center gap-0.5">
                      <img src={passenger.idPhotoUrl} alt={`ID photo of ${passenger.fullName}`} className="w-16 h-16 object-cover rounded-lg" />
                      <span className="text-xs text-gray-400">ID</span>
                    </div>
                  )}
                  {passenger.platePhotoUrl && (
                    <div className="flex flex-col items-center gap-0.5">
                      <img src={passenger.platePhotoUrl} alt={`License plate photo submitted by ${passenger.fullName}`} className="w-16 h-16 object-cover rounded-lg" />
                      <span className="text-xs text-gray-400">Plate</span>
                    </div>
                  )}
                  {passenger.boardScanUrl && (
                    <div className="flex flex-col items-center gap-0.5">
                      <img src={passenger.boardScanUrl} alt={`Boarding scan for ${passenger.fullName}`} className="w-16 h-16 object-cover rounded-lg" />
                      <span className="text-xs text-gray-400">Boarding Scan</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {/* Fallback for old safety cards without per-passenger structure */}
          {!data.passengers && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {data.exchangePhotos?.faceUrl && (
                <img src={data.exchangePhotos.faceUrl} alt="Face photo" style={{ width: 120, borderRadius: 8 }} />
              )}
              {data.exchangePhotos?.idUrl && (
                <img src={data.exchangePhotos.idUrl} alt="ID card" style={{ width: 120, borderRadius: 8 }} />
              )}
              {data.exchangePhotos?.plateUrl && (
                <img src={data.exchangePhotos.plateUrl} alt="Plate number" style={{ width: 120, borderRadius: 8 }} />
              )}
            </div>
          )}
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
