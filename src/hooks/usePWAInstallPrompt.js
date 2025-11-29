import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pwaInstalled';

export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasInstalled, setHasInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const storedFlag = localStorage.getItem(STORAGE_KEY) === 'true';
    setHasInstalled(storedFlag);
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const checkDisplayMode = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      setIsStandalone(standalone);
    };

    checkDisplayMode();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkDisplayMode);

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      setHasInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', checkDisplayMode);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, 'true');
      setHasInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  const shouldShowInstallPrompt = !hasInstalled && !isStandalone;

  return {
    shouldShowInstallPrompt,
    promptInstall,
    isIOS,
    hasNativePrompt: !!deferredPrompt
  };
}
