import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import {
  fetchBerita,
  fetchCustomNotifications,
  fetchEvents,
  subscribeToTableChanges,
} from '../../services/dataClient';
import {
  evaluateDailyAndHolidayNotification,
  syncCustomTaraNotifications,
  syncNewContentNotifications,
} from '../../services/taraNotifications';

export default function TaraNotificationManager() {
  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          setInterval(() => {
            void registration.update();
          }, 60 * 60 * 1000);
        }
      },
    });
    return () => {
      void updateSW;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const runSync = async () => {
      if (!active) return;
      try {
        await evaluateDailyAndHolidayNotification();
        const [customItems, events, berita] = await Promise.all([
          fetchCustomNotifications(false),
          fetchEvents(),
          fetchBerita(),
        ]);
        if (!active) return;
        await syncCustomTaraNotifications(customItems);
        await syncNewContentNotifications({ events, berita });
      } catch {
        // ignore transient network errors
      }
    };

    const initialTimer = window.setTimeout(() => {
      void runSync();
    }, 1800);

    const intervalId = window.setInterval(() => {
      void runSync();
    }, 5 * 60 * 1000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void runSync();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    const unsub = subscribeToTableChanges(['custom_notifications', 'events', 'berita'], () => {
      void runSync();
    });

    return () => {
      active = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      unsub();
    };
  }, []);

  return null;
}
