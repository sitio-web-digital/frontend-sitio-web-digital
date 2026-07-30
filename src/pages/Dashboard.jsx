import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SitePreview from '../components/SitePreview';
import Logo from '../components/Logo';
import SupportTicketList from '../components/support/SupportTicketList';
import NewTicketModal from '../components/support/NewTicketModal';
import SupportToast from '../components/support/SupportToast';
import { useApp } from '../context/AppContext';
import { PLAN, slugify } from '../data/mockData';
import {
  apiGetSubscription,
  apiCancelSubscription,
  apiGetSupportUnread,
  apiMarkSupportSeen,
  apiGetSiteStats,
} from '../api/client';
import { ROOT_DOMAIN } from '../utils/rootDomain';

const PREVIEW_SECTIONS = [
  { id: 'header', type: 'header' },
  { id: 'hero', type: 'hero' },
];

const NAV_ITEMS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'suscripcion', label: 'Suscripción' },
  { id: 'soporte', label: 'Soporte' },
  { id: 'cuenta', label: 'Configuración' },
];

// Código corto para identificar cada página en la tabla — no es un ID real
// de backend todavía (el backend guarda una sola página por cuenta), pero se
// deriva de forma estable del id de cada página para que no cambie entre renders.
function codigoPagina(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return `SW-${hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`;
}

const STATUS_INFO = {
  publicada: { label: 'Publicada', dotClass: 'bg-emerald-400', textClass: 'text-emerald-400' },
  borrador: { label: 'Borrador sin publicar', dotClass: 'bg-white/25', textClass: 'text-ink-400' },
  incompleta: { label: 'Sin terminar de editar', dotClass: 'bg-amber-400', textClass: 'text-amber-400' },
};

export default function Dashboard() {
  const {
    user,
    authReady,
    logout,
    updateProfile,
    updateSubdomain,
    template,
    siteData,
    subdomain,
    published,
    theme,
    logoUrl,
    setPublished,
    saveSiteToBackend,
    supportTickets,
    addSupportTicket,
    siteLocked,
  } = useApp();
  const navigate = useNavigate();
  const [section, setSection] = useState('resumen');
  // El modal vive afuera del contenedor con `animate-fade-in-up`: esa clase
  // deja un `transform` (aunque sea "sin desplazamiento") aplicado al
  // terminar la animación, y eso arma un nuevo contenedor para todo lo que
  // esté `fixed` adentro — el modal quedaba centrado contra ese div en vez
  // de contra la ventana entera.
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [unreadSupport, setUnreadSupport] = useState({ count: 0, tickets: [] });
  const [supportToast, setSupportToast] = useState(null);

  // Sondea cada 10s si soporte respondió algo nuevo — corre siempre que el
  // Dashboard esté abierto, sin importar en qué sección esté parado, para
  // poder avisar igual. El cartel solo aparece cuando el conteo SUBE
  // respecto del que ya se mostró, no en cada sondeo repetido.
  useEffect(() => {
    if (!user) return undefined;
    let cancelado = false;
    const check = async () => {
      const result = await apiGetSupportUnread();
      if (cancelado) return;
      setUnreadSupport((prev) => {
        if (result.count > prev.count) setSupportToast(result);
        return result;
      });
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [user]);

  // Al entrar a Soporte se avisa al backend que ya se vio, pero el punto de
  // "nuevo" sobre el chat puntual se mantiene visible en esta pantalla —
  // recién el próximo sondeo (10s después) lo refleja limpio.
  useEffect(() => {
    if (section !== 'soporte' || !user) return;
    setSupportToast(null);
    apiMarkSupportSeen();
  }, [section, user]);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role === 'admin') navigate('/admin', { replace: true });
    if (user.role === 'analytics') navigate('/analytics', { replace: true });
  }, [authReady, user, navigate]);

  const hasSite = !!(template && siteData);

  // Estado real de la suscripción de Mercado Pago (no solo el `published`
  // local) — se sondea mientras el Dashboard está abierto, para que si el
  // webhook confirma el pago (o si soporte cancela algo del otro lado)
  // se note sin tener que recargar la página.
  const [mpSubscription, setMpSubscription] = useState({ status: 'none' });
  useEffect(() => {
    if (!user || !hasSite) return undefined;
    let cancelado = false;
    const check = async () => {
      const sub = await apiGetSubscription();
      if (!cancelado) setMpSubscription(sub);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [user, hasSite]);

  // KPIs reales de la página publicada (visitas y clics de WhatsApp de
  // verdad, ver server/src/routes/sites.js > GET /me/stats) — antes
  // hardcodeado. Se sondea igual que la suscripción, para que una visita
  // recién llegada se refleje sin recargar.
  const [siteStats, setSiteStats] = useState({ totalVisitas: 0, totalWhatsapp: 0 });
  useEffect(() => {
    if (!user || !hasSite) return undefined;
    let cancelado = false;
    const check = async () => {
      const stats = await apiGetSiteStats();
      if (!cancelado) setSiteStats(stats);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [user, hasSite]);

  // El backend hoy guarda una sola página por cuenta — cuando soporte
  // varias, esta lista pasa a traerlas todas en vez de armar solo esta.
  const pages = useMemo(() => {
    const real = hasSite
      ? [
          {
            id: 'real',
            nombreNegocio: siteData.nombreNegocio,
            subdomain,
            status: published ? 'publicada' : 'borrador',
            mpStatus: mpSubscription.status,
            nextPaymentDate: mpSubscription.nextPaymentDate,
            locked: siteLocked,
            template,
            siteData,
            theme,
            logoUrl,
            kpis: { visitas: siteStats.totalVisitas, whatsapp: siteStats.totalWhatsapp },
          },
        ]
      : [];
    return real.map((p) => ({ ...p, codigo: codigoPagina(p.id) }));
  }, [hasSite, siteData, subdomain, published, siteLocked, template, theme, logoUrl, mpSubscription, siteStats]);

  if (!user) return null;

  const primerNombre = user.name?.split(' ')[0] || user.email;

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <DashboardHeader user={user} logout={logout} navigate={navigate} />

      {supportToast && (
        <SupportToast
          data={supportToast}
          onVer={() => setSection('soporte')}
          onClose={() => setSupportToast(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 grid lg:grid-cols-[200px_1fr] gap-8 items-start">
        <SideNav section={section} onChange={setSection} unreadCount={unreadSupport.count} />

        <div className="min-w-0 animate-fade-in-up">
          {section === 'resumen' && (
            <ResumenSection
              primerNombre={primerNombre}
              pages={pages}
              navigate={navigate}
              updateSubdomain={updateSubdomain}
              isFree={(user.freeSubscriptions ?? 0) > 0}
            />
          )}
          {section === 'suscripcion' && (
            <SubscriptionSection
              pages={pages}
              hasSite={hasSite}
              setPublished={setPublished}
              saveSiteToBackend={saveSiteToBackend}
              navigate={navigate}
              freeSubscriptions={user.freeSubscriptions ?? 0}
            />
          )}
          {section === 'soporte' && (
            <SoporteSection
              tickets={supportTickets}
              onOpenNew={() => setNewTicketOpen(true)}
              currentUserId={user.id}
              unreadIds={unreadSupport.tickets.map((t) => t.id)}
            />
          )}
          {section === 'cuenta' && (
            <div className="space-y-6">
              <SettingsSection user={user} updateProfile={updateProfile} />
            </div>
          )}
        </div>
      </div>

      {newTicketOpen && (
        <NewTicketModal
          onClose={() => setNewTicketOpen(false)}
          onSubmit={async (ticket) => {
            const result = await addSupportTicket(ticket);
            if (result.ok) setNewTicketOpen(false);
            return result;
          }}
        />
      )}
    </div>
  );
}

function DashboardHeader({ user, logout, navigate }) {
  return (
    <div className="px-5 sm:px-8 py-4 flex items-center justify-between border-b border-white/8">
      <Logo size="sm" />
      <div className="flex items-center gap-4 text-sm text-ink-400">
        <span className="hidden sm:inline">{user.email}</span>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function SideNav({ section, onChange, unreadCount = 0 }) {
  return (
    <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:sticky lg:top-10 -mx-1 px-1 lg:mx-0 lg:p-1.5 lg:bg-black/20 lg:border lg:border-white/5 lg:rounded-xl">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`shrink-0 flex items-center gap-2 text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            section === item.id
              ? 'bg-gold-500 text-navy-950 shadow-[0_2px_14px_-4px_rgba(255,193,7,0.5)]'
              : 'text-ink-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {item.label}
          {item.id === 'soporte' && unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-white text-[0.68rem] font-bold leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}

// KPIs primero (arriba de todo, antes de la lista de páginas): son agregados
// de las páginas publicadas, mismos íconos que /estadisticas para que se
// sienta el mismo dato en los dos lugares.
function ResumenSection({ primerNombre, pages, navigate, updateSubdomain, isFree }) {
  const publicadas = pages.filter((p) => p.status === 'publicada');
  const visitas = publicadas.reduce((acc, p) => acc + p.kpis.visitas, 0);
  const whatsapp = publicadas.reduce((acc, p) => acc + p.kpis.whatsapp, 0);

  const kpis = [
    { label: 'Páginas activas', value: String(publicadas.length) },
    { label: 'Visitas totales', value: visitas.toLocaleString('es-AR') },
    { label: 'Clics en WhatsApp', value: whatsapp.toLocaleString('es-AR') },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">Hola, {primerNombre}</h1>
        <p className="text-ink-400 text-sm mt-1">Así vienen tus páginas.</p>
      </div>

      <StatStrip items={kpis} cols={3} />

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Tus páginas</p>
        <button
          onClick={() => navigate('/quiz')}
          data-track="dashboard_crear_pagina"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-xs"
        >
          Crear nueva página
        </button>
      </div>
      <div className="space-y-3">
        {pages.map((p) => (
          <PageRow key={p.id} page={p} navigate={navigate} updateSubdomain={updateSubdomain} isFree={isFree} />
        ))}
        {pages.length === 0 && (
          <div className="border border-dashed border-white/15 bg-navy-850 p-6 text-center">
            <p className="text-ink-400 text-sm mb-4">Todavía no tenés una página propia.</p>
            <button
              onClick={() => navigate('/quiz')}
              className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-sm"
            >
              Crear mi página web
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Franja única de KPIs con divisores internos, en vez de N cajas iguales
// repetidas — mismo dato, se lee de un vistazo en vez de escanear tarjetas
// sueltas. En mobile se cae a un grid de celdas separadas por líneas finas
// (truco del gap-px + fondo del contenedor) porque el cálculo de qué borde va
// a la izquierda/arriba solo da bien cuando las columnas visibles son `cols`.
function StatStrip({ items, cols = 3 }) {
  const colsClass = cols === 4 ? 'sm:grid-cols-4' : cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
  return (
    <div className={`grid grid-cols-2 ${colsClass} gap-px sm:gap-0 bg-white/10 sm:bg-transparent sm:border sm:border-white/10 mb-8`}>
      {items.map((k, i) => (
        <div
          key={k.label}
          className={`bg-navy-850 px-5 py-4 ${i % cols !== 0 ? 'sm:border-l sm:border-white/10' : ''} ${
            i >= cols ? 'sm:border-t sm:border-white/10' : ''
          }`}
        >
          <p className="font-display text-2xl font-bold tabular-nums">{k.value ?? '—'}</p>
          <p className="text-xs text-ink-400 mt-1">{k.label}</p>
        </div>
      ))}
    </div>
  );
}

function PageRow({ page, navigate, updateSubdomain, isFree }) {
  const status = STATUS_INFO[page.status];
  const proximoCobro =
    page.status === 'publicada' && !isFree && page.mpStatus === 'authorized' && page.nextPaymentDate
      ? new Date(page.nextPaymentDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;

  return (
    <div className="border border-white/10 bg-navy-850 hover:border-white/20 transition-colors flex flex-col sm:flex-row gap-4 p-4">
      <div className="w-full sm:w-40 h-24 shrink-0 overflow-hidden relative bg-white border border-white/10">
        <div className="absolute inset-0 origin-top-left scale-[0.3] w-[333%] pointer-events-none">
          <SitePreview
            template={page.template}
            siteData={page.siteData}
            theme={page.theme}
            logoUrl={page.logoUrl}
            sections={PREVIEW_SECTIONS}
            widgets={{ whatsappFloating: false }}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-semibold truncate">{page.nombreNegocio}</p>
            <span className="text-[10px] font-mono text-ink-500">{page.codigo}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            <p className="text-xs text-gold-500 truncate">
              {page.subdomain ? `${page.subdomain}.${ROOT_DOMAIN}` : 'Todavía no elegiste un subdominio'}
            </p>
            <DomainEditor page={page} updateSubdomain={updateSubdomain} />
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${status.textClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
              {status.label}
            </span>
            {page.locked && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-300">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Edición pausada por soporte
              </span>
            )}
            {proximoCobro && (
              <span className="text-xs text-ink-400">Próximo cobro: {proximoCobro} · ${PLAN.precio.toLocaleString('es-AR')}/mes</span>
            )}
          </div>
          <p className="text-xs text-ink-500 mt-1.5">
            {page.kpis.visitas.toLocaleString('es-AR')} visitas · {page.kpis.whatsapp.toLocaleString('es-AR')} clics
            WhatsApp
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {page.status === 'publicada' ? (
            <>
              <RowButton
                onClick={() => window.open(`https://${page.subdomain}.${ROOT_DOMAIN}`, '_blank', 'noopener,noreferrer')}
                primary
              >
                Ver
              </RowButton>
              {page.locked ? (
                <span className="px-3 py-2 text-xs font-semibold text-ink-500 italic">Edición pausada</span>
              ) : (
                <RowButton onClick={() => navigate('/editor')}>Editar</RowButton>
              )}
              <RowButton onClick={() => navigate('/estadisticas')}>Estadísticas</RowButton>
            </>
          ) : (
            <>
              <RowButton onClick={() => navigate('/checkout')} primary>
                Publicar
              </RowButton>
              {page.locked ? (
                <span className="px-3 py-2 text-xs font-semibold text-ink-500 italic">Edición pausada</span>
              ) : (
                <RowButton onClick={() => navigate('/editor')}>Editar</RowButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RowButton({ children, onClick, primary = false }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-semibold transition-colors ${
        primary
          ? 'bg-gold-500 hover:bg-gold-400 text-navy-950'
          : 'border border-white/15 hover:bg-white/5 text-white'
      }`}
    >
      {children}
    </button>
  );
}

// El plan es por página: cada página publicada tiene su propia suscripción
// de $15.000/mes — no es un único plan por cuenta. "Cancelar" acá sólo
// despublica esa página (sin pasarela de pago real detrás, ver Checkout.jsx).
function SubscriptionSection({ pages, hasSite, setPublished, saveSiteToBackend, navigate, freeSubscriptions }) {
  const isFree = (freeSubscriptions ?? 0) > 0;
  const publicadas = pages.filter((p) => p.status === 'publicada');
  const total = isFree ? 0 : publicadas.length * PLAN.precio;

  return (
    <Panel title="Suscripción">
      <p className="text-sm text-ink-300 mb-1">
        {PLAN.nombre} — ${PLAN.precio.toLocaleString('es-AR')} {PLAN.moneda}/{PLAN.ciclo} por página publicada.
      </p>
      {isFree ? (
        <p className="font-display text-2xl font-bold mt-2 text-emerald-400">Gratis (cuenta de prueba)</p>
      ) : (
        <p className="font-display text-2xl font-bold mt-2">
          ${total.toLocaleString('es-AR')}
          <span className="text-sm font-medium text-ink-400"> {PLAN.moneda}/mes en total</span>
        </p>
      )}
      <p className="text-xs text-ink-500 mt-1">
        {publicadas.length === 0
          ? 'Ninguna página publicada todavía.'
          : `${publicadas.length} página${publicadas.length > 1 ? 's' : ''} publicada${publicadas.length > 1 ? 's' : ''}.`}
      </p>

      <ul className="space-y-2 mt-4 mb-6 max-w-sm">
        {PLAN.beneficios.map((b) => (
          <li key={b} className="flex items-start gap-2 text-xs text-ink-300">
            <span className="text-gold-500 mt-0.5 shrink-0">✓</span> {b}
          </li>
        ))}
      </ul>

      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-3">Por página</p>
      <div className="space-y-2">
        {pages.map((p) => (
          <SubscriptionRow
            key={p.id}
            page={p}
            setPublished={setPublished}
            saveSiteToBackend={saveSiteToBackend}
            navigate={navigate}
            isFree={isFree}
          />
        ))}
      </div>

      {!hasSite && <p className="text-xs text-ink-500 mt-4">Creá tu página para activar un plan.</p>}

      <button
        onClick={() => navigate('/quiz')}
        data-track="dashboard_crear_pagina"
        className="inline-flex items-center gap-1.5 mt-5 px-3 py-1.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-xs"
      >
        Crear nueva página
      </button>
    </Panel>
  );
}

function SubscriptionRow({ page, setPublished, saveSiteToBackend, navigate, isFree }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const status = STATUS_INFO[page.status];

  const cancelar = async () => {
    setBusy(true);
    setError('');
    if (isFree) {
      // Cuenta de prueba (free_subscriptions, la regala un admin) — nunca
      // hubo una suscripción real de Mercado Pago detrás, alcanza con
      // despublicar.
      setPublished(false);
      await saveSiteToBackend({ published: false });
    } else {
      const result = await apiCancelSubscription();
      if (!result.ok) {
        setError(result.error || 'No se pudo cancelar la suscripción. Probá de nuevo.');
        setBusy(false);
        return;
      }
      setPublished(false);
    }
    setBusy(false);
    setConfirming(false);
  };

  return (
    <div className="border border-white/10 bg-navy-900 hover:border-white/20 transition-colors px-4 py-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate">{page.nombreNegocio}</p>
            <span className="text-[10px] font-mono text-ink-500">{page.codigo}</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold mt-1 ${status.textClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
            {status.label}
          </span>
          {page.status !== 'publicada' && page.mpStatus === 'pending_redirect' && (
            <p className="text-xs text-amber-400 mt-1">Esperando la confirmación del pago...</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-sm font-semibold ${page.status === 'publicada' && isFree ? 'text-emerald-400' : ''}`}>
            {page.status !== 'publicada'
              ? 'Sin cargo'
              : isFree
                ? 'Gratis (cuenta de prueba)'
                : `$${PLAN.precio.toLocaleString('es-AR')}/mes`}
          </span>
          {page.status === 'publicada' ? (
            <button
              onClick={() => setConfirming(true)}
              className="text-xs font-semibold text-ink-400 hover:text-red-300 transition-colors"
            >
              Cancelar
            </button>
          ) : (
            <RowButton onClick={() => navigate('/checkout')} primary>
              Publicar
            </RowButton>
          )}
        </div>
      </div>

      {confirming && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
          <p className="text-xs text-ink-400">¿Seguro que querés cancelar? Esta página deja de estar publicada.</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={cancelar}
              className="flex-1 px-3 py-2 bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-50"
            >
              {busy ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 px-3 py-2 border border-white/15 text-xs font-semibold hover:bg-white/5 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Lista de consultas ya enviadas (más nueva primero) + botón para abrir el
// modal y armar una nueva en paralelo. Al abrir una, se ve el chat completo
// (mensaje inicial + réplicas) y se puede seguir respondiendo ahí mismo.
function SoporteSection({ tickets, onOpenNew, currentUserId, unreadIds = [] }) {
  return (
    <Panel
      title="Soporte"
      action={
        <button
          onClick={onOpenNew}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-xs"
        >
          Nueva consulta
        </button>
      }
    >
      <SupportTicketList tickets={tickets} currentUserId={currentUserId} unreadIds={unreadIds} />
    </Panel>
  );
}

function SettingsSection({ user, updateProfile }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const dirty = name.trim() !== (user.name || '') || email.trim() !== (user.email || '');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const result = await updateProfile({ name, email });
    setBusy(false);
    setStatus(result.ok ? { type: 'ok', msg: 'Datos actualizados.' } : { type: 'error', msg: result.error });
  };

  return (
    <Panel title="Configuración de la cuenta">
      <form onSubmit={submit} className="space-y-3 max-w-sm">
        <div>
          <label className="block font-mono text-[0.65rem] uppercase tracking-[0.06em] text-ink-500 mb-1.5">
            Nombre
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-500 transition-colors"
          />
        </div>
        <div>
          <label className="block font-mono text-[0.65rem] uppercase tracking-[0.06em] text-ink-500 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-white outline-none focus:border-gold-500 transition-colors"
          />
        </div>
        {status && (
          <p className={`text-xs ${status.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{status.msg}</p>
        )}
        <button
          type="submit"
          disabled={!dirty || busy}
          className="w-full px-4 py-2.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-sm disabled:opacity-40 disabled:pointer-events-none"
        >
          {busy ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </Panel>
  );
}

// Elegir/cambiar el dominio de ESTA página puntual — vive en su fila
// (PageRow), no en una pestaña de "Configuración" genérica, porque no es un
// dato de perfil de la cuenta sino la identidad pública de esa página
// específica (lo que resuelve GET /api/public/sites/:subdomain). El día que
// una cuenta pueda tener más de una página, cada una va a seguir editando
// su propio dominio acá mismo, en su propia fila — por eso no vive en un
// lugar único por cuenta.
function DomainEditor({ page, updateSubdomain }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(page.subdomain || slugify(page.nombreNegocio || ''));
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const dirty = value.trim() !== (page.subdomain || '');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const result = await updateSubdomain(value.trim());
    setBusy(false);
    if (result.ok) {
      setStatus(null);
      setEditing(false);
    } else {
      setStatus({ type: 'error', msg: result.error });
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(page.subdomain || slugify(page.nombreNegocio || ''));
          setStatus(null);
          setEditing(true);
        }}
        disabled={page.locked}
        className="text-xs font-semibold text-ink-500 hover:text-white underline decoration-dotted underline-offset-2 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        Cambiar dominio
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <div className="flex items-center border border-white/10 bg-navy-900 focus-within:border-gold-500 transition-colors">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase())}
          maxLength={30}
          className="min-w-0 w-28 bg-transparent px-2.5 py-1.5 text-xs text-white outline-none"
        />
        <span className="pr-2.5 text-xs text-ink-500 whitespace-nowrap">.{ROOT_DOMAIN}</span>
      </div>
      <button
        type="submit"
        disabled={!dirty || busy || !value.trim()}
        className="px-2.5 py-1.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 transition-colors text-navy-950 font-bold text-xs"
      >
        {busy ? 'Guardando...' : 'Guardar'}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="px-2.5 py-1.5 border border-white/15 hover:bg-white/5 transition-colors text-xs font-semibold text-white"
      >
        Cancelar
      </button>
      {status && <p className="w-full text-xs text-red-400">{status.msg}</p>}
    </form>
  );
}

// Chrome compartido por las secciones de Suscripción/Configuración: título
// con un tilde de acento en vez de la franja oscura de header que se repetía
// en cada panel — mismo borde, menos "plantilla de admin genérica".
function Panel({ title, action, children }) {
  return (
    <section className="border border-white/10 bg-navy-850">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <h2 className="font-display text-base font-bold text-white flex items-center gap-2.5">
          <span className="w-1 h-4 bg-gold-500 rounded-full shrink-0" />
          {title}
        </h2>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}
