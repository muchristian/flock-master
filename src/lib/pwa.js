// Service-worker registration + update lifecycle hooks for the PWA shell.
// Kept framework-agnostic: it emits DOM events the UI can subscribe to.

const UPDATE_EVENT = 'flockmaster:update-available';
const READY_EVENT = 'flockmaster:sw-ready';

let waitingWorker = null;

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // Only enable the SW for the production build. In dev, Vite serves modules
  // that must not be cached, so we skip registration to avoid stale HMR.
  if (import.meta.env.DEV) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // If a worker is already waiting (e.g. updated while tab was open),
      // surface it so the user can refresh into the new version.
      if (registration.waiting) {
        waitingWorker = registration.waiting;
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
      }

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorker = installing;
            window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
          }
        });
      });

      window.dispatchEvent(new CustomEvent(READY_EVENT, { detail: registration }));
    } catch (error) {
      console.warn('Service worker registration failed', error);
    }
  });

  // When a new worker takes control, reload once so the page runs the update.
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// Ask the waiting worker to activate now; the page reloads on controllerchange.
export function applyUpdate() {
  if (waitingWorker) {
    waitingWorker.postMessage('SKIP_WAITING');
  } else {
    window.location.reload();
  }
}

export const PWA_EVENTS = { UPDATE_EVENT, READY_EVENT };
