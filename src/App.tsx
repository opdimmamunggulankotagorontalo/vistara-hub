import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { MotionProvider, useMotionSystem } from './components/motion/MotionProvider';
import { LoadingState } from './components/ui';

// Eager primary landing route for instant first paint
import Beranda from './pages/Beranda';

// Lazy-loaded feature routes for smaller initial JS bundle
const Tentang = lazy(() => import('./pages/Tentang'));
const ProgramKerja = lazy(() => import('./pages/ProgramKerja'));
const ProgramKerjaDetail = lazy(() => import('./pages/ProgramKerja/detail'));
const Aspirasi = lazy(() => import('./pages/Aspirasi'));
const Berita = lazy(() => import('./pages/Berita'));
const BeritaDetail = lazy(() => import('./pages/Berita/detail'));
const Galeri = lazy(() => import('./pages/Galeri'));
const GaleriDetail = lazy(() => import('./pages/Galeri/detail'));
const Event = lazy(() => import('./pages/Event'));
const Prestasi = lazy(() => import('./pages/Prestasi'));
const PrestasiDetail = lazy(() => import('./pages/Prestasi/detail'));
const Arsip = lazy(() => import('./pages/Arsip'));
const Kontak = lazy(() => import('./pages/Kontak'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * ScrollToTop ensures scroll position resets cleanly on every route change
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  const { scrollToTop } = useMotionSystem();

  useEffect(() => {
    scrollToTop(true);
  }, [pathname, scrollToTop]);

  return null;
}

function PublicLayoutRoutes() {
  return (
    <Layout>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          {/* Default redirect to /beranda */}
          <Route path="/" element={<Navigate to="/beranda" replace />} />

          {/* Primary Route: Beranda (Homepage / Public Dashboard) */}
          <Route path="/beranda" element={<Beranda />} />

          {/* Core Feature Pages */}
          <Route path="/beranda/tentang" element={<Tentang />} />

          {/* Program Kerja + Detail */}
          <Route path="/beranda/program-kerja" element={<ProgramKerja />} />
          <Route path="/beranda/program-kerja/:slug" element={<ProgramKerjaDetail />} />

          {/* Suara Aspirasi */}
          <Route path="/beranda/aspirasi" element={<Aspirasi />} />

          {/* Berita + Detail */}
          <Route path="/beranda/berita" element={<Berita />} />
          <Route path="/beranda/berita/:slug" element={<BeritaDetail />} />

          {/* Galeri + Detail */}
          <Route path="/beranda/galeri" element={<Galeri />} />
          <Route path="/beranda/galeri/:slug" element={<GaleriDetail />} />

          {/* Agenda Event */}
          <Route path="/beranda/event" element={<Event />} />

          {/* Hall of Fame Prestasi + Detail */}
          <Route path="/beranda/prestasi" element={<Prestasi />} />
          <Route path="/beranda/prestasi/:slug" element={<PrestasiDetail />} />

          {/* Pusat Arsip & Dokumen */}
          <Route path="/beranda/arsip" element={<Arsip />} />

          {/* Kontak & Sekretariat */}
          <Route path="/beranda/kontak" element={<Kontak />} />

          {/* 404 Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  return (
    <MotionProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<LoadingState />}>
                <Admin />
              </Suspense>
            }
          />
          <Route path="/*" element={<PublicLayoutRoutes />} />
        </Routes>
      </BrowserRouter>
    </MotionProvider>
  );
}
