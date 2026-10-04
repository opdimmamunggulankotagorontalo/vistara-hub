import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Pages
import Beranda from './pages/Beranda';
import Tentang from './pages/Tentang';
import ProgramKerja from './pages/ProgramKerja';
import ProgramKerjaDetail from './pages/ProgramKerja/detail';
import Aspirasi from './pages/Aspirasi';
import Berita from './pages/Berita';
import BeritaDetail from './pages/Berita/detail';
import Galeri from './pages/Galeri';
import GaleriDetail from './pages/Galeri/detail';
import Event from './pages/Event';
import Prestasi from './pages/Prestasi';
import PrestasiDetail from './pages/Prestasi/detail';
import Arsip from './pages/Arsip';
import Kontak from './pages/Kontak';
import NotFound from './pages/NotFound';

/**
 * ScrollToTop ensures scroll position resets to top on every route change
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
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
      </Layout>
    </BrowserRouter>
  );
}
