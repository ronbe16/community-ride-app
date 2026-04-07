import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('pwa-install-dismissed') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Detect iOS — Safari doesn't support beforeinstallprompt
    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    // Detect if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('pwa-install-dismissed', '1');
    } catch {}
  };

  return {
    isInstallable: isInstallable && !dismissed,
    isInstalled,
    isIOS,
    install,
    dismiss,
  };
}
