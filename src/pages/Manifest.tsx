import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COMMUNITY_NAME } from '@/constants/app';

interface ManifestPassenger {
  fullName: string;
  mobileNumber: string;
  joinedAt: { toDate: () => Date };
}

interface ManifestData {
  driver: {
    fullName: string;
    mobileNumber?: string;
    driverLicenseNumber?: string;
    driverLicenseExpiry?: string;
    vehicle: {
      color: string;
      make: string;
      model: string;
      year?: number;
      plateNumber: string;
      ltfrbPermitNumber?: string;
      ltoRegistrationNumber?: string;
      insuranceProvider?: string;
      insuranceExpiry?: string;
    };
  };
  trip: {
    origin: string;
    destination: string;
    departureTime: { toDate: () => Date };
  };
  passengers: ManifestPassenger[];
  communityName: string;
  generatedAt: { toDate: () => Date };
  expiresAt: { toDate: () => Date };
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
    </div>
  );
}

function NotFoundScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Manifest not found</h1>
      <p className="text-gray-500 text-sm mt-2">This link may have expired or been removed.</p>
    </div>
  );
}

function formatDatetime(d: Date) {
  return d.toLocaleString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function Manifest() {
  const { manifestId } = useParams<{ manifestId: string }>();
  const [data, setData] = useState<ManifestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!manifestId) {
      setLoading(false);
      return;
    }
    getDoc(doc(db, 'manifests', manifestId)).then((snap) => {
      if (snap.exists()) {
        setData(snap.data() as ManifestData);
      }
      setLoading(false);
    }).catch((err: unknown) => {
      console.error(`Failed to load manifest ${manifestId}:`, err);
      setLoading(false);
    });
  }, [manifestId]);

  if (loading) return <LoadingScreen />;
  if (!data) return <NotFoundScreen />;

  const communityName = data.communityName || COMMUNITY_NAME;

  return (
    <div className="min-h-screen bg-white p-4 max-w-[480px] mx-auto font-mono text-sm print:p-2">
      {/* Print button — hidden during print */}
      <div className="text-right mb-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg"
        >
          Print
        </button>
      </div>

      {/* Manifest table */}
      <div className="border border-gray-400 rounded-none overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-400 p-3 text-center">
          <p className="font-bold text-sm">LTFRB CARPOOLING PROGRAM</p>
          <p className="font-bold text-sm">PASSENGER MANIFEST</p>
        </div>

        {/* Vehicle */}
        <div className="border-b border-gray-400 p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vehicle</p>
          <p className="font-semibold">
            {data.driver.vehicle.color} {data.driver.vehicle.make} {data.driver.vehicle.model}
            {data.driver.vehicle.year ? ` (${data.driver.vehicle.year})` : ''}
          </p>
          <p>Plate: <span className="font-bold">{data.driver.vehicle.plateNumber}</span></p>
          {data.driver.vehicle.ltoRegistrationNumber && (
            <p>LTO OR/CR: {data.driver.vehicle.ltoRegistrationNumber}</p>
          )}
          {data.driver.vehicle.insuranceProvider && (
            <p>Insurance: {data.driver.vehicle.insuranceProvider}
              {data.driver.vehicle.insuranceExpiry && ` (expires ${data.driver.vehicle.insuranceExpiry})`}
            </p>
          )}
          {data.driver.vehicle.ltfrbPermitNumber && (
            <p>LTFRB Permit: <strong>{data.driver.vehicle.ltfrbPermitNumber}</strong></p>
          )}
        </div>

        {/* Driver */}
        <div className="border-b border-gray-400 p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Driver</p>
          <p className="font-semibold">{data.driver.fullName}</p>
          {data.driver.driverLicenseNumber && (
            <p>License No.: {data.driver.driverLicenseNumber}
              {data.driver.driverLicenseExpiry && ` (expires ${data.driver.driverLicenseExpiry})`}
            </p>
          )}
          {data.driver.mobileNumber && (
            <p>Mobile: {data.driver.mobileNumber}</p>
          )}
        </div>

        {/* Route */}
        <div className="border-b border-gray-400 p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Route</p>
          <p>From: {data.trip.origin}</p>
          <p>To: {data.trip.destination}</p>
          <p>Departure: {formatDatetime(data.trip.departureTime.toDate())}</p>
        </div>

        {/* Passengers */}
        <div className="border-b border-gray-400 p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Passengers ({data.passengers.length})
          </p>
          {data.passengers.length === 0 ? (
            <p className="text-gray-400">No passengers recorded.</p>
          ) : (
            <ol className="space-y-1 list-decimal list-inside">
              {data.passengers.map((p, i) => (
                <li key={i}>
                  <span className="font-semibold">{p.fullName}</span>
                  {' · '}{p.mobileNumber}
                  {' · '}{p.joinedAt?.toDate ? formatDatetime(p.joinedAt.toDate()) : '—'}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Metadata */}
        <div className="border-b border-gray-400 p-3 text-xs text-gray-500">
          <p>Generated: {data.generatedAt?.toDate ? formatDatetime(data.generatedAt.toDate()) : '—'}</p>
          <p>Valid until: {data.expiresAt?.toDate ? formatDatetime(data.expiresAt.toDate()) : '—'}</p>
        </div>

        {/* Footer */}
        <div className="p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">
            All listed passengers are verified members of {communityName}.
          </p>
          <p className="font-bold">{communityName}</p>
          <p className="text-xs text-gray-500">Community Ride · {communityName}</p>
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:p-2 { padding: 0.5rem !important; }
        }
      `}</style>
    </div>
  );
}
