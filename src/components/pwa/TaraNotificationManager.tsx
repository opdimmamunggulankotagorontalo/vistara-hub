import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import {
  ensureTaraPushSubscription,
  getNotificationPermissionState,
} from '../../services/taraNotifications';

export default function TaraNotificationManager() {
  useEffect(() => {
    let updateInterval: number | undefined;

    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (registration && updateInterval === undefined) {
          updateInterval = window.setInterval(() => {
            void registration.update();
          }, 60 * 60 * 1000);
        }
      },
    });

    return () => {
      if (updateInterval !== undefined) {
        window.clearInterval(updateInterval);
      }
      void updateSW;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const syncExistingPermission = async () => {
      if (!active || getNotificationPermissionState() !== 'granted') return;
      try {
        await ensureTaraPushSubscription();
      } catch (error) {
        // Retry the subscription the next time the user returns to the app.
        console.warn('TARA background push subscription sync failed:', error);
      }
    };

    const initialTimer = window.setTimeout(() => {
      void syncExistingPermission();
    }, 1200);

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        void syncExistingPermission();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      active = false;
      window.clearTimeout(initialTimer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  return null;
}
