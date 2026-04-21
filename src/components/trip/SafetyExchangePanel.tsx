import { RefObject, ChangeEvent } from 'react';
import { ExchangePhoto, PhotoType } from '@/types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface SafetyExchangePanelProps {
  allExchangePhotos: ExchangePhoto[];
  currentUserUid: string;
  uploadingPhoto: PhotoType | null;
  boardScanUrl: string | null;
  exchangePhotoCount: number;
  cameraInputRef: RefObject<HTMLInputElement>;
  previewObjectUrl: string | null;
  previewType: PhotoType | null;
  onOpenCamera: (type: PhotoType) => void;
  onExchangePhotoCapture: (e: ChangeEvent<HTMLInputElement>) => void;
  onShareSafetyCard: () => void;
  onRetakePhoto: () => void;
  onConfirmUpload: () => void;
}

export function SafetyExchangePanel({
  allExchangePhotos,
  currentUserUid,
  uploadingPhoto,
  boardScanUrl,
  exchangePhotoCount,
  cameraInputRef,
  previewObjectUrl,
  previewType,
  onOpenCamera,
  onExchangePhotoCapture,
  onShareSafetyCard,
  onRetakePhoto,
  onConfirmUpload,
}: SafetyExchangePanelProps) {
  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="font-medium text-amber-800 mb-1">Optional safety exchange</div>
        <div className="text-amber-700 text-sm mb-3">
          Take a photo of the driver, their ID, or the plate number.
          Photos are shared with your safety contact and deleted after 24 hours.
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['face', 'id', 'plate'] as PhotoType[]).map((type) => {
            const photoUrl = allExchangePhotos.find((p) => p.type === type && p.uploadedBy === currentUserUid)?.url ?? null;
            if (photoUrl) {
              return (
                <div key={type} style={{ position: 'relative', width: 80, height: 80 }}>
                  <img src={photoUrl} alt={`${type} photo`} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,180,0,0.35)',
                    borderRadius: 8, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 24,
                  }}>✓</div>
                </div>
              );
            }
            return (
              <button
                key={type}
                type="button"
                aria-label={`Take ${type === 'face' ? 'face' : type === 'id' ? 'ID card' : 'license plate'} photo`}
                onClick={() => onOpenCamera(type)}
                disabled={uploadingPhoto === type}
                className="flex flex-col items-center gap-1 bg-white border border-amber-200 rounded-xl p-3 text-xs text-amber-700 disabled:opacity-50"
              >
                <span className="text-2xl">
                  {type === 'face' ? '🤳' : type === 'id' ? '🪪' : '🚗'}
                </span>
                {uploadingPhoto === type ? 'Saving…' : type === 'face' ? 'Face photo' : type === 'id' ? 'ID card' : 'Plate number'}
              </button>
            );
          })}
        </div>

        {boardScanUrl && (
          <div className="mt-3">
            <div className="text-xs text-amber-700 font-medium mb-1">
              Driver's boarding scan of you
            </div>
            <div className="relative w-14 h-14">
              <img src={boardScanUrl} alt="Driver's boarding scan of you" className="w-14 h-14 object-cover rounded-lg" />
            </div>
          </div>
        )}

        {exchangePhotoCount > 0 && (
          <button
            onClick={onShareSafetyCard}
            className="w-full mt-3 bg-emerald-500 text-white rounded-xl py-2 text-sm font-medium"
          >
            Share safety link to family 🤝
          </button>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onExchangePhotoCapture}
        />
      </div>

      <Dialog open={!!(previewObjectUrl && previewType)} onOpenChange={(open) => { if (!open) onRetakePhoto(); }}>
        <DialogContent className="max-w-xs p-4 space-y-4">
          <DialogTitle className="font-medium text-center text-gray-800">Confirm photo?</DialogTitle>
          {previewObjectUrl && (
            <img src={previewObjectUrl} alt="Preview" className="w-full rounded-xl object-cover" style={{ maxHeight: 300 }} />
          )}
          <div className="flex gap-3">
            <button
              onClick={onRetakePhoto}
              className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
            >
              Retake
            </button>
            <button
              onClick={onConfirmUpload}
              className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium"
            >
              Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
