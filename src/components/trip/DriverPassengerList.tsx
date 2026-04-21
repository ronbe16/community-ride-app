import { Timestamp } from 'firebase/firestore';
import { ExchangePhoto, PassengerEntry } from '@/types';
import { Button } from '@/components/ui/button';

function formatDatetime(ts: Timestamp) {
  return ts.toDate().toLocaleString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface DriverPassengerListProps {
  passengers: PassengerEntry[];
  availableSeats: number;
  tripStatus: string;
  allExchangePhotos: ExchangePhoto[];
  scanPreviews: Record<string, string>;
  actionLoading: boolean;
  onScanPassenger: (index: number) => void;
  onStartTrip: () => void;
  onCancelTrip: () => void;
}

export function DriverPassengerList({
  passengers,
  availableSeats,
  tripStatus,
  allExchangePhotos,
  scanPreviews,
  actionLoading,
  onScanPassenger,
  onStartTrip,
  onCancelTrip,
}: DriverPassengerListProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-foreground font-semibold">
        Passengers ({passengers.length}/{availableSeats})
      </h2>
      {passengers.length === 0 ? (
        <p className="text-muted-foreground text-sm">No passengers yet.</p>
      ) : (
        <div className="space-y-2">
          {passengers.map((p, i) => {
            const pPhotos = allExchangePhotos.filter((photo) => photo.uploadedBy === p.uid);
            const facePhotoUrl = pPhotos.find((ph) => ph.type === 'face')?.url;
            const idPhotoUrl = pPhotos.find((ph) => ph.type === 'id')?.url;
            const platePhotoUrl = pPhotos.find((ph) => ph.type === 'plate')?.url;
            return (
              <div key={p.uid} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-foreground text-sm font-medium">{p.fullName}</p>
                    <a
                      href={`tel:${p.mobileNumber}`}
                      className="text-primary text-xs font-medium"
                    >
                      📞 {p.mobileNumber}
                    </a>
                    <p className="text-muted-foreground text-xs">
                      Joined {p.joinedAt?.toDate ? formatDatetime(p.joinedAt as Timestamp) : '—'}
                    </p>
                  </div>
                  {(scanPreviews[p.uid] ?? p.boardPhotoUrl) ? (
                    <div style={{ position: 'relative', width: 56, height: 56 }}>
                      <img
                        src={scanPreviews[p.uid] ?? p.boardPhotoUrl}
                        alt="Board scan"
                        style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,180,0,0.35)',
                        borderRadius: 8, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 20,
                      }}>✓</div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs shrink-0"
                      onClick={() => onScanPassenger(i)}
                    >
                      📷 Scan
                    </Button>
                  )}
                </div>
                {(facePhotoUrl || idPhotoUrl || platePhotoUrl) && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-1">Photos this passenger took of you</div>
                    <div className="flex gap-2">
                      {facePhotoUrl && (
                        <div className="flex flex-col items-center gap-0.5">
                          <img src={facePhotoUrl} alt={`Face photo taken by ${p.fullName}`} className="w-12 h-12 object-cover rounded-lg" />
                          <span className="text-xs text-gray-400">Face</span>
                        </div>
                      )}
                      {idPhotoUrl && (
                        <div className="flex flex-col items-center gap-0.5">
                          <img src={idPhotoUrl} alt={`ID photo taken by ${p.fullName}`} className="w-12 h-12 object-cover rounded-lg" />
                          <span className="text-xs text-gray-400">ID</span>
                        </div>
                      )}
                      {platePhotoUrl && (
                        <div className="flex flex-col items-center gap-0.5">
                          <img src={platePhotoUrl} alt={`Plate photo taken by ${p.fullName}`} className="w-12 h-12 object-cover rounded-lg" />
                          <span className="text-xs text-gray-400">Plate</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(tripStatus === 'open' || tripStatus === 'full') && (
        <>
          <Button
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onStartTrip}
            disabled={actionLoading}
          >
            {actionLoading ? 'Starting…' : '🚀 Start Trip'}
          </Button>
          <Button
            className="w-full rounded-xl"
            variant="destructive"
            onClick={onCancelTrip}
            disabled={actionLoading}
          >
            Cancel trip
          </Button>
        </>
      )}
    </div>
  );
}
