import { useEffect, useState } from 'react';
import type { AdminSession } from '../../types';
import {
  getStoredAdminSession,
  logoutAdminSession,
  verifyAdminSession,
} from '../../services/dataClient';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import ForcePasswordChange from './ForcePasswordChange';

export default function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(() =>
    getStoredAdminSession()
  );

  useEffect(() => {
    let active = true;
    if (getStoredAdminSession()) {
      void verifyAdminSession().then((verified) => {
        if (active) setSession(verified);
      });
    }
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    void logoutAdminSession();
    setSession(null);
  };

  if (!session) {
    return <AdminLogin onSuccess={setSession} />;
  }

  if (session.mustChangePassword) {
    return (
      <ForcePasswordChange
        session={session}
        mode="forced"
        onSuccess={setSession}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <AdminDashboard
      session={session}
      onSessionUpdate={setSession}
      onLogout={handleLogout}
    />
  );
}
