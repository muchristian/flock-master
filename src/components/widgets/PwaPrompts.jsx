import { useEffect, useState } from 'react';
import { applyUpdate, PWA_EVENTS } from '../../lib/pwa.js';

// Handles the two PWA lifecycle prompts:
//  1. "Install app" — appears when the browser fires beforeinstallprompt.
//  2. "Update available" — appears when a new service worker is waiting.
export default function PwaPrompts() {
  const [installEvent, setInstallEvent] = useState(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const onInstalled = () => setInstallEvent(null);
    const onUpdate = () => setUpdateReady(true);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener(PWA_EVENTS.UPDATE_EVENT, onUpdate);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener(PWA_EVENTS.UPDATE_EVENT, onUpdate);
    };
  }, []);

  const promptInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    try {
      await installEvent.userChoice;
    } finally {
      setInstallEvent(null);
    }
  };

  // Update banner takes priority over the install prompt.
  if (updateReady) {
    return (
      <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg dark:border-emerald-800 dark:bg-neutral-900">
        <i className="fa-solid fa-arrows-rotate text-emerald-600" />
        <p className="flex-1 text-sm text-content">A new version is available.</p>
        <button
          onClick={applyUpdate}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
        >
          Refresh
        </button>
        <button
          onClick={() => setUpdateReady(false)}
          className="text-content-faint hover:text-content"
          aria-label="Dismiss"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
    );
  }

  if (installEvent && !dismissed) {
    return (
      <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 shadow-lg dark:bg-neutral-900">
        <img src="/icons/icon-192.png" alt="" className="h-9 w-9 rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-content">Install FlockMaster</p>
          <p className="text-xs text-content-muted">Use it offline, right from your home screen.</p>
        </div>
        <button
          onClick={promptInstall}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-content-faint hover:text-content"
          aria-label="Dismiss"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
    );
  }

  return null;
}
