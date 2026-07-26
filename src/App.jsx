import { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import TermsGate from './components/TermsGate';
import Landing from './pages/Landing';
import Quiz from './pages/Quiz';
import Gallery from './pages/Gallery';
import Editor from './pages/Editor';
import SubdomainPreview from './pages/SubdomainPreview';
import Checkout from './pages/Checkout';
import SuscripcionConfirmar from './pages/SuscripcionConfirmar';
import Success from './pages/Success';
import Stats from './pages/Stats';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import AnalyticsHome from './pages/AnalyticsHome';
import PublicSite from './pages/PublicSite';
import { initClickTracking, trackPageView } from './utils/analytics';

// Subdominio "real" detectado por hostname (producción, una vez que la DNS
// esté apuntada a mano — ver charla sobre publicar páginas) o simulado con
// ?site=<subdominio> (desarrollo local, o para probar puntualmente en
// cualquier entorno) — devuelve null si esta carga es del panel/SaaS en sí
// (sitiowebdigital.com.ar, localhost, o cualquier otro host), no la página
// en vivo de un cliente.
const ROOT_DOMAIN = 'sitiowebdigital.com.ar';

function detectPublicSubdomain() {
  const forced = new URLSearchParams(window.location.search).get('site');
  if (forced) return forced.toLowerCase();

  const host = window.location.hostname;
  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}` || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }
  return host.endsWith(`.${ROOT_DOMAIN}`) ? host.slice(0, -(ROOT_DOMAIN.length + 1)) : null;
}

// Registra una vista de página por cada cambio de ruta (embudo de
// conversión, ver Admin > Analytics). Cuando un admin entra a editar la
// página de otra cuenta, marcamos esa vista de /editor como tal para no
// contarla como si fuera un cliente real avanzando en el embudo.
function RouteTracker() {
  const location = useLocation();
  const { adminEditingSite } = useApp();

  useEffect(() => {
    trackPageView(location.pathname, adminEditingSite ? { admin: true } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
}

export default function App() {
  const publicSubdomain = detectPublicSubdomain();

  useEffect(() => {
    if (publicSubdomain) return;
    initClickTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Un visitante real a la página de un cliente nunca debe ver el gate de
  // términos del SaaS (es para quien construye páginas, no para el cliente
  // final de una panadería) ni el HashRouter del panel — por eso esta rama
  // corta ANTES de montar cualquiera de los dos, en vez de agregar una ruta
  // más adentro del router.
  if (publicSubdomain) return <PublicSite subdomain={publicSubdomain} />;

  return (
    <AppProvider>
      <TermsGate>
        <HashRouter>
          <RouteTracker />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/plantillas" element={<Gallery />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/preview" element={<SubdomainPreview />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/suscripcion/confirmar" element={<SuscripcionConfirmar />} />
            <Route path="/exito" element={<Success />} />
            <Route path="/estadisticas" element={<Stats />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/analytics" element={<AnalyticsHome />} />
          </Routes>
        </HashRouter>
      </TermsGate>
    </AppProvider>
  );
}
