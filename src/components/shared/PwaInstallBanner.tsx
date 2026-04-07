import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Download, X } from 'lucide-react';

export function PwaInstallBanner() {
  const { isInstallable, isInstalled, isIOS, install, dismiss } = usePwaInstall();

  // Already installed as PWA — show nothing
  if (isInstalled) return null;

  // iOS — Safari doesn't support beforeinstallprompt, show manual instructions
  if (isIOS && !isInstalled) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg p-4 animate-in slide-in-from-bottom-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-emerald-900">Install CommunityRide</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Tap the <strong>Share</strong> button in Safari, then tap <strong>"Add to Home Screen"</strong>
            </p>
          </div>
          <button onClick={dismiss} className="text-emerald-500 hover:text-emerald-700 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Android/Chrome — native install prompt available
  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-primary text-primary-foreground rounded-xl shadow-lg p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <Download className="w-6 h-6 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Install Community Ride</p>
        <p className="text-xs opacity-90">Add to your home screen for quick access</p>
      </div>
      <button
        onClick={install}
        className="bg-white text-primary font-semibold text-sm px-4 py-2 rounded-lg flex-shrink-0"
      >
        Install
      </button>
      <button onClick={dismiss} className="opacity-70 hover:opacity-100 flex-shrink-0">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
