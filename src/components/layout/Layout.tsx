import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CustomCursor from '../motion/CustomCursor';
import ScrollProgressBar from '../motion/ScrollProgressBar';
import { PageTransition } from '../motion/MotionPrimitives';
import { OfflineIndicator, PWAInstallBanner } from '../pwa/PWAInstallBanner';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ScrollProgressBar />
      <CustomCursor />
      <Navbar />
      <OfflineIndicator />
      <main
        role="main"
        style={{
          flex: 1,
          paddingTop: 'var(--nav-height)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PageTransition routeKey={location.pathname}>{children}</PageTransition>
      </main>
      <Footer />
      <PWAInstallBanner />
    </div>
  );
}
