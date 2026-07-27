// Telemetría de producto (Admin > Analytics): vistas de página, pasos del
// quiz y clics en botones clave, para armar el embudo de conversión y el
// ranking de clics. Nunca debe afectar la experiencia real — cualquier
// falla de red al mandar un evento se descarta en silencio.
import { apiTrackEvent, apiSaveLead, apiAcceptTerms } from '../api/client';

const SESSION_KEY = 'sitiowebdigital.analyticsSession';

function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'sin-storage';
  }
}

function currentPath() {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

export function trackEvent(eventType, eventName, metadata = {}, path) {
  try {
    apiTrackEvent({
      sessionId: getSessionId(),
      eventType,
      eventName,
      path: path ?? currentPath(),
      metadata,
    }).catch(() => {});
  } catch {
    // no-op: la analítica nunca debe romper la interacción del usuario
  }
}

export function trackPageView(path, metadata = {}) {
  trackEvent('page_view', 'view', metadata, path);
}

// Lo que va completando en el quiz vale aunque nunca lo termine ni se
// registre (ver Quiz.jsx) — `sessionId` identifica CADA pasada por el quiz
// (no el sessionId de analytics, que dura toda la visita entera): si no se
// pasa uno explícito, el backend actualiza el mismo lead cada vez que se
// llama a esta función en vez de crear uno por cada tecla; Quiz.jsx pasa un
// id propio, generado de nuevo cada vez que se entra al quiz, para que dos
// pasadas distintas (dos negocios distintos) no se pisen entre sí.
// `referrer` se completa solo (de dónde vino esa visita).
export function saveLead({ sessionId, nombreNegocio, telefono, rubro, frase, lastStep }) {
  try {
    apiSaveLead({
      sessionId: sessionId || getSessionId(),
      nombreNegocio,
      telefono,
      rubro,
      frase,
      lastStep,
      referrer: document.referrer || 'directo',
      // El id persistente del navegador (no el de este lead puntual) — el
      // backend lo usa para probar que esta persona aceptó los términos
      // antes de que le guardáramos cualquier dato (ver TermsGate.jsx).
      analyticsSessionId: getSessionId(),
    }).catch(() => {});
  } catch {
    // no-op
  }
}

// Se llama al tocar "Acepto y continúo" en TermsGate — deja una prueba de
// que esta sesión anónima aceptó los términos, con fecha, para poder
// demostrarlo si más adelante guardamos algún dato suyo (ver saveLead).
export function acceptTerms() {
  try {
    apiAcceptTerms({ sessionId: getSessionId() }).catch(() => {});
  } catch {
    // no-op
  }
}

// Clasificación gruesa del origen de una visita a partir de document.referrer
// — la usa PublicSite.jsx para la "Fuente de tráfico" real de Estadísticas.
// Ojo: varias apps (Instagram, WhatsApp) recortan el referrer desde su
// navegador interno, así que esas visitas suelen caer en 'directo' aunque
// hayan venido de ahí — es una limitación real del navegador, no algo que se
// pueda evitar del lado nuestro.
export function classifyReferrer(referrer) {
  if (!referrer) return 'directo';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('google')) return 'google';
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'whatsapp';
    if (host.includes(window.location.hostname)) return 'directo';
    return 'otro';
  } catch {
    return 'directo';
  }
}

// Delegación por atributo `data-track` — sirve tanto para botones en JSX
// como para los fragmentos de HTML crudo de la Home (dangerouslySetInnerHTML,
// ver src/pages/home-*.html), sin tener que cablear un onClick en cada uno.
let clickTrackingInitialized = false;
export function initClickTracking() {
  if (clickTrackingInitialized || typeof document === 'undefined') return;
  clickTrackingInitialized = true;
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (el) trackEvent('click', el.dataset.track, {});
  });
}
