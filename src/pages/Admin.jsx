import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  SearchIcon,
  PlusIcon,
  XIcon,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshIcon,
  SendIcon,
  GlobeIcon,
} from '../components/icons';
import { useApp } from '../context/AppContext';
import { ROOT_DOMAIN } from '../utils/rootDomain';
import {
  apiAdminSummary,
  apiAdminSubscriptions,
  apiAdminSupportTickets,
  apiAdminListSites,
  apiAdminListUsers,
  apiAdminCreateUser,
  apiAdminSetFreeSubscriptions,
  apiAdminDeleteUser,
  apiAdminSetUserActive,
  apiAdminReassignLeads,
  apiAdminAnalyticsSummary,
  apiAdminListLeads,
  apiAdminListVentas,
  apiDownloadLeadsReport,
  apiDownloadAnalyticsReport,
  apiAdminListCatalogTemplates,
  apiAdminListCatalogRubros,
  apiAdminUpdateTemplate,
  apiAdminDeleteTemplate,
  apiAdminDeleteRubro,
  apiAdminGetSupportUnread,
  apiAdminMarkSupportSeen,
  apiGetTerms,
  apiAdminUpdateTerms,
  apiAdminCancelSubscription,
  apiAdminSendMail,
} from '../api/client';
import { PLAN } from '../data/mockData';
import { CHANGELOG, CURRENT_VERSION } from '../data/changelog';
import SupportThread from '../components/support/SupportThread';

const NAV_ITEMS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'leads', label: 'Leads' },
  { id: 'paginas', label: 'Páginas' },
  { id: 'plantillas', label: 'Plantillas' },
  { id: 'suscripciones', label: 'Suscripciones' },
  { id: 'vendedores', label: 'Vendedores' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'soporte', label: 'Soporte' },
  { id: 'terminos', label: 'Términos y Condiciones' },
  { id: 'versiones', label: 'Versiones' },
];

const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Aviso sonoro de mensaje nuevo de soporte — un beep corto sintetizado, sin
// ningún archivo de audio que embeber. Los navegadores pueden bloquear audio
// antes de la primera interacción del usuario con la página; una vez que el
// admin ya hizo clic en algo (entrar, cambiar de sección, etc.) deja de
// aplicar, así que no hace falta ningún manejo especial para eso acá.
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Sin Web Audio disponible (navegador viejo, política de autoplay,
    // etc.) — el cartel visual que ya existe sigue avisando igual.
  }
}

// Nombres legibles para los data-track que se van agregando en el resto de
// la app (ver src/utils/analytics.js) — si aparece uno que no está acá, se
// muestra el slug tal cual, no se rompe nada.
const CLICK_LABELS = {
  cta_header_creartupagina: 'Header · "Creá tu página"',
  cta_header_login: 'Header · "Iniciar sesión"',
  cta_hero_creartupagina: 'Hero · "Creá tu página gratis"',
  cta_hero_contratarahora: 'Hero · "Contratar ahora"',
  cta_pricing_contratarahora: 'Planes · "Contratar ahora"',
  quiz_continuar: 'Quiz · "Continuar"',
  quiz_atras: 'Quiz · "Atrás"',
  resultado_editar_pagina: 'Resultado · "Editar página"',
  resultado_volver: 'Resultado · "Volver a editar respuestas"',
  checkout_pagar: 'Checkout · "Pagar"',
  dashboard_crear_pagina: 'Dashboard · "Crear nueva página"',
};

export default function Admin() {
  const { user, authReady, logout, startAdminEditSite, setPageLock, setPagePublished } = useApp();
  const navigate = useNavigate();
  const [section, setSection] = useState('resumen');
  const [summary, setSummary] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [sites, setSites] = useState([]);
  const [users, setUsers] = useState([]);
  const [customTemplatesList, setCustomTemplatesList] = useState([]);
  const [customRubrosList, setCustomRubrosList] = useState([]);
  const [error, setError] = useState('');
  const [unreadSupport, setUnreadSupport] = useState({ count: 0, tickets: [] });
  const [supportToast, setSupportToast] = useState(null);
  // "Qué cambió" — se muestra una vez por versión nueva, comparando contra la
  // última que este navegador ya vio (no hace falta nada del lado del
  // servidor, es solo un aviso interno para el equipo, no algo legal como
  // los Términos y Condiciones).
  const [showVersionModal, setShowVersionModal] = useState(false);
  useEffect(() => {
    const lastSeen = localStorage.getItem('sitiowebdigital.lastSeenVersion');
    if (lastSeen !== CURRENT_VERSION) setShowVersionModal(true);
  }, []);
  const dismissVersionModal = () => {
    localStorage.setItem('sitiowebdigital.lastSeenVersion', CURRENT_VERSION);
    setShowVersionModal(false);
  };

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role === 'analytics') {
      navigate('/analytics', { replace: true });
      return;
    }
    if (user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [authReady, user, navigate]);

  // Estos endpoints están protegidos en el backend con requireRole('admin')
  // — una cuenta común que tenga token igual recibe 403, así que ni siquiera
  // llegan a cargar acá si por algún motivo se saltearan el chequeo de arriba.
  useEffect(() => {
    if (user?.role !== 'admin') return;
    Promise.all([
      apiAdminSummary(),
      apiAdminSubscriptions(),
      apiAdminSupportTickets(),
      apiAdminListSites(),
      apiAdminListUsers(),
      apiAdminListCatalogTemplates(),
      apiAdminListCatalogRubros(),
    ])
      .then(([s, subs, t, allSites, allUsers, allCustomTemplates, allCustomRubros]) => {
        setSummary(s);
        setSubscriptions(subs);
        setTickets(t);
        setSites(allSites);
        setUsers(allUsers);
        setCustomTemplatesList(allCustomTemplates);
        setCustomRubrosList(allCustomRubros);
      })
      .catch(() => setError('No se pudo cargar la información de administración.'));
  }, [user]);

  // Sondea cada 10s si hay tickets/respuestas nuevas desde la última vez que
  // este admin entró a Soporte — corre siempre que el panel esté abierto, sin
  // importar en qué sección esté parado, para poder avisarle igual. El aviso
  // (cartel al costado) solo aparece cuando el conteo SUBE respecto del que ya
  // se le mostró, no en cada sondeo mientras los mismos tickets siguen sin ver.
  useEffect(() => {
    if (user?.role !== 'admin') return undefined;
    let cancelado = false;
    const check = async () => {
      const result = await apiAdminGetSupportUnread();
      if (cancelado) return;
      setUnreadSupport((prev) => {
        if (result.count > prev.count) {
          setSupportToast(result);
          playNotificationSound();
        }
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

  // Al entrar a Soporte, se refresca la lista (para traer lo nuevo de una) y
  // se avisa al backend que ya se vio — pero el punto de "nuevo" sobre cada
  // chat puntual se mantiene visible en esta pantalla (no se borra de una,
  // si no nunca se llegaría a ver cuál era el nuevo). Recién el próximo
  // sondeo (10s después) lo refleja limpio, salvo que haya llegado algo más.
  useEffect(() => {
    if (section !== 'soporte' || user?.role !== 'admin') return;
    setSupportToast(null);
    apiAdminMarkSupportSeen();
    apiAdminSupportTickets().then(setTickets);
  }, [section, user]);

  // Botón "Refrescar" de cada sección — una función por recurso en vez de
  // reusar el Promise.all de arriba, para poder traer solo lo que cambió sin
  // recargar el resto de las pestañas que no se están mirando.
  const refreshResumen = () => apiAdminSummary().then(setSummary);
  const refreshSites = () => apiAdminListSites().then(setSites);
  const refreshPlantillas = () =>
    Promise.all([apiAdminListCatalogTemplates(), apiAdminListCatalogRubros()]).then(([t, r]) => {
      setCustomTemplatesList(t);
      setCustomRubrosList(r);
    });
  const refreshSubscriptions = () => apiAdminSubscriptions().then(setSubscriptions);
  const refreshUsers = () => apiAdminListUsers().then(setUsers);
  const refreshTickets = () => apiAdminSupportTickets().then(setTickets);

  const editSite = async (siteId) => {
    const result = await startAdminEditSite(siteId);
    if (result.ok) navigate('/editor');
    else setError(result.error);
  };

  // Pausa/reanuda la edición en tiempo real del cliente sobre esa página —
  // sigue publicada, solo no se puede seguir editando.
  const toggleLock = async (siteId, currentlyLocked) => {
    const result = await setPageLock(siteId, !currentlyLocked);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSites((list) => list.map((s) => (s.id === siteId ? { ...s, locked: !currentlyLocked } : s)));
  };

  // Despublica/republica la página directo (a diferencia de pausar la
  // edición: esto sí la baja de circulación) — el dueño puede seguir
  // editándola mientras tanto.
  const togglePublish = async (siteId, currentlyPublished) => {
    const result = await setPagePublished(siteId, !currentlyPublished);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSites((list) => list.map((s) => (s.id === siteId ? { ...s, published: !currentlyPublished } : s)));
  };

  // Admin > Suscripciones > "Dar de baja": una cuenta gratis (regalada,
  // freeSubscriptions >= 1) nunca tuvo una suscripción real de Mercado Pago
  // detrás, así que alcanza con despublicar (mismo camino que Páginas). Una
  // paga de verdad necesita cancelar en Mercado Pago primero (ver
  // POST /admin/subscriptions/:id/cancel) — despublicar sola no frena el
  // cobro recurrente del lado de ellos.
  const cancelSubscription = async (siteId, isFree) => {
    const result = isFree ? await setPagePublished(siteId, false) : await apiAdminCancelSubscription(siteId);
    if (!result.ok) return result;
    // Se actualiza en vez de sacarla de la lista: queda visible como
    // "Cancelada" para poder recontactar a esa cuenta más adelante, en vez de
    // desaparecer apenas se da de baja.
    setSubscriptions((list) =>
      list.map((s) => (s.id === siteId ? { ...s, published: false, mpStatus: isFree ? s.mpStatus : 'cancelled' } : s))
    );
    return { ok: true };
  };

  const createUser = async (payload) => {
    const result = await apiAdminCreateUser(payload);
    if (!result.ok) return result;
    setUsers((list) => [result.user, ...list]);
    return result;
  };

  const setFreeSubscriptions = async (userId, count) => {
    const result = await apiAdminSetFreeSubscriptions(userId, count);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setUsers((list) => list.map((u) => (u.id === userId ? { ...u, freeSubscriptions: result.freeSubscriptions } : u)));
  };

  const deleteUser = async (userId) => {
    const result = await apiAdminDeleteUser(userId);
    if (!result.ok) return result;
    setUsers((list) => list.filter((u) => u.id !== userId));
    return result;
  };

  const setUserActive = async (userId, active) => {
    const result = await apiAdminSetUserActive(userId, active);
    if (!result.ok) return result;
    setUsers((list) => list.map((u) => (u.id === userId ? { ...u, active: result.active } : u)));
    return result;
  };

  // Al reasignar, esas páginas dejan de contar como "pendingLeads" de quien
  // las tenía y pasan a sumarle a la cuenta destino — se refleja local sin
  // esperar el próximo refresh.
  const reassignLeads = async (userId, toUserId) => {
    const result = await apiAdminReassignLeads(userId, toUserId);
    if (!result.ok) return result;
    setUsers((list) =>
      list.map((u) => {
        if (u.id === userId) return { ...u, pendingLeads: 0 };
        if (u.id === toUserId) return { ...u, pendingLeads: (u.pendingLeads ?? 0) + result.count };
        return u;
      })
    );
    return result;
  };

  const sendMailToUsers = async ({ scope, userId, subject, message }) =>
    apiAdminSendMail({ scope, userId, subject, message });

  // Publica/despublica una plantilla creada por el admin — mientras no esté
  // publicada, no la ve ningún usuario en la galería ni se la recomienda el quiz.
  const toggleTemplatePublished = async (templateId, currentlyPublished) => {
    const result = await apiAdminUpdateTemplate(templateId, { published: !currentlyPublished });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCustomTemplatesList((list) =>
      list.map((t) => (t.id === templateId ? { ...t, published: !currentlyPublished } : t))
    );
  };

  const deleteTemplate = async (templateId) => {
    const result = await apiAdminDeleteTemplate(templateId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCustomTemplatesList((list) => list.filter((t) => t.id !== templateId));
  };

  const deleteRubro = async (rubroId) => {
    const result = await apiAdminDeleteRubro(rubroId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCustomRubrosList((list) => list.filter((r) => r.id !== rubroId));
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <AdminHeader user={user} logout={logout} navigate={navigate} />

      {showVersionModal && (
        <VersionModal
          entry={CHANGELOG[0]}
          onClose={dismissVersionModal}
          onVerTodas={() => {
            dismissVersionModal();
            setSection('versiones');
          }}
        />
      )}

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
          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
          {section === 'resumen' && (
            <ResumenSection summary={summary} tickets={tickets} onRefresh={refreshResumen} />
          )}
          {section === 'analytics' && <AnalyticsSection />}
          {section === 'leads' && <LeadsSection />}
          {section === 'paginas' && (
            <PaginasSection
              sites={sites}
              onEdit={editSite}
              onToggleLock={toggleLock}
              onTogglePublish={togglePublish}
              onRefresh={refreshSites}
            />
          )}
          {section === 'plantillas' && (
            <PlantillasSection
              templates={customTemplatesList}
              rubros={customRubrosList}
              onTogglePublished={toggleTemplatePublished}
              onDeleteTemplate={deleteTemplate}
              onDeleteRubro={deleteRubro}
              onRefresh={refreshPlantillas}
            />
          )}
          {section === 'suscripciones' && (
            <SuscripcionesSection
              subscriptions={subscriptions}
              onCancel={cancelSubscription}
              onRefresh={refreshSubscriptions}
            />
          )}
          {section === 'vendedores' && <VendedoresSection vendedores={users.filter((u) => u.role === 'vendedor')} />}
          {section === 'usuarios' && (
            <UsuariosSection
              users={users}
              onCreate={createUser}
              onSetFreeSubscriptions={setFreeSubscriptions}
              onDelete={deleteUser}
              onSetActive={setUserActive}
              onReassignLeads={reassignLeads}
              onSendMail={sendMailToUsers}
              onRefresh={refreshUsers}
            />
          )}
          {section === 'soporte' && (
            <SoporteSection
              tickets={tickets}
              currentUserId={user.id}
              unreadIds={unreadSupport.tickets.map((t) => t.id)}
              onTicketUpdated={(ticketId, patch) =>
                setTickets((list) => list.map((t) => (t.id === ticketId ? { ...t, ...patch } : t)))
              }
              onRefresh={refreshTickets}
            />
          )}
          {section === 'terminos' && <TerminosSection />}
          {section === 'versiones' && <VersionesSection />}
        </div>
      </div>
    </div>
  );
}

function AdminHeader({ user, logout, navigate }) {
  return (
    <div className="px-5 sm:px-8 py-4 flex items-center justify-between border-b border-white/8">
      <div className="flex items-center gap-2">
        <Logo size="sm" />
        <span className="text-ink-500 font-normal text-sm">· admin</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-ink-400">
        <span className="hidden sm:inline text-ink-500 text-xs">v{CURRENT_VERSION}</span>
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

// Cartel al costado que avisa de tickets/respuestas nuevas de soporte sin
// tener que estar mirando esa sección — aparece solo cuando el conteo sube
// (ver el efecto de sondeo en Admin()), nunca en cada sondeo repetido.
function SupportToast({ data, onVer, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 border border-gold-500/40 bg-navy-850 shadow-2xl p-4 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white">
          {data.count === 1 ? 'Tenés 1 consulta nueva de soporte' : `Tenés ${data.count} consultas nuevas de soporte`}
        </p>
        <button onClick={onClose} className="text-ink-500 hover:text-white transition-colors shrink-0" aria-label="Cerrar">
          ✕
        </button>
      </div>
      {data.tickets?.[0] && (
        <p className="text-xs text-ink-400 mt-1.5 truncate">
          {data.tickets[0].userName || data.tickets[0].userEmail}: {data.tickets[0].asunto}
        </p>
      )}
      <button
        onClick={onVer}
        className="mt-3 w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-sm py-2 transition-colors"
      >
        Ver en Soporte →
      </button>
    </div>
  );
}

function ResumenSection({ summary, tickets, onRefresh }) {
  const ingresoMensual = (summary?.paidSites ?? 0) * PLAN.precio;

  const kpis = [
    { label: 'Cuentas registradas', value: summary?.totalUsers },
    { label: 'Suscripciones activas', value: summary?.publishedSites },
    { label: 'Dadas de baja', value: summary?.cancelledSites },
    {
      label: 'Ingreso mensual estimado',
      value: summary ? `$${ingresoMensual.toLocaleString('es-AR')}` : undefined,
    },
    { label: 'Consultas de soporte', value: summary?.totalTickets },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-balance">Panel de administración</h1>
          <p className="text-ink-400 text-sm mt-1">KPIs generales de SitioWeb Digital.</p>
        </div>
        <RefreshButton onRefresh={onRefresh} />
      </div>

      <StatStrip items={kpis} cols={4} />

      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-3">Últimas consultas</p>
      {tickets.length === 0 ? (
        <p className="text-sm text-ink-400">Todavía no hay consultas de soporte.</p>
      ) : (
        <div className="space-y-2">
          {tickets.slice(0, 3).map((t) => (
            <div key={t.id} className="border border-white/10 bg-navy-850 hover:border-white/20 transition-colors px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold truncate">{t.asunto}</p>
                <span className="text-xs text-ink-500 shrink-0">{t.userEmail}</span>
              </div>
              <p className="text-xs text-ink-500 mt-1 truncate">{t.mensaje}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Franja única de KPIs con divisores internos, en vez de N cajas iguales
// repetidas — mismo componente que Dashboard.jsx > StatStrip (ver ahí el
// comentario sobre el fallback mobile con gap-px).
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

// Embudo de conversión + ranking de clics (ver Admin > Analytics). Los datos
// vienen de analytics_events, armados a partir de los eventos que dispara
// src/utils/analytics.js en toda la app (landing, quiz, checkout, etc.).
// Exportado además de usarse acá adentro: lo reutiliza tal cual la cuenta
// de rol "analytics" en su propio panel acotado (ver AnalyticsHome.jsx).
export function AnalyticsSection() {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('all');

  const fetchAnalytics = () =>
    apiAdminAnalyticsSummary({ period: period === 'all' ? undefined : period }).then(setAnalytics);

  useEffect(() => {
    setAnalytics(null);
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  if (!analytics) {
    return (
      <Panel title="Analytics">
        <p className="text-sm text-ink-400">Cargando datos...</p>
      </Panel>
    );
  }

  const {
    totalSessions,
    funnel,
    topClicks,
    topPages,
    dailySessions,
    weeklySessions,
    monthlySessions,
    hourlyDistribution,
    subscribers,
  } = analytics;
  const primerPaso = funnel[0]?.count || 0;
  const conversionTotal = primerPaso > 0 ? Math.round((funnel[funnel.length - 1].count / primerPaso) * 100) : 0;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-balance">Analytics</h1>
          <p className="text-ink-400 text-sm mt-1">
            De dónde vienen las visitas, en qué parte del embudo se quedan y qué botones tocan más.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodFilter period={period} onChange={setPeriod} />
          <DownloadReportButton
            onDownload={() => apiDownloadAnalyticsReport({ period: period === 'all' ? undefined : period })}
            label="Descargar PDF"
          />
          <RefreshButton onRefresh={fetchAnalytics} />
        </div>
      </div>

      <StatStrip
        items={[
          { label: 'Sesiones registradas', value: totalSessions },
          { label: 'Páginas publicadas (del embudo)', value: funnel[funnel.length - 1]?.count ?? 0 },
          { label: 'Conversión landing → publicada', value: `${conversionTotal}%` },
        ]}
        cols={3}
      />

      {/* Estado actual de suscriptores — no depende del filtro de período de
          arriba, es una foto de ahora (ver GET /admin/analytics/summary). */}
      <StatStrip
        items={[
          { label: 'Suscriptores activos', value: subscribers?.active ?? 0 },
          { label: 'Pausados', value: subscribers?.paused ?? 0 },
          { label: 'Dados de baja', value: subscribers?.cancelled ?? 0 },
        ]}
        cols={3}
      />

      <div className="border border-white/10 bg-navy-850 p-6 mb-6">
        <h2 className="font-display font-semibold mb-0.5">Sesiones por día</h2>
        <p className="text-xs text-ink-400 mb-4">Últimos 14 días</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dailySessions} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sesionesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFC107" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#FFC107" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.15)"
              tick={{ fill: '#6b7590', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
              tickFormatter={(d) => d.slice(5).split('-').reverse().join('/')}
              interval={1}
            />
            <YAxis
              stroke="rgba(255,255,255,0.15)"
              tick={{ fill: '#6b7590', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={28}
              allowDecimals={false}
            />
            <Tooltip content={<DailyTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
            <Area
              type="monotone"
              dataKey="sessions"
              stroke="#FFC107"
              strokeWidth={2}
              fill="url(#sesionesFill)"
              dot={false}
              activeDot={{ r: 4, fill: '#FFC107', stroke: '#0B1120', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="border border-white/10 bg-navy-850 p-6">
          <h2 className="font-display font-semibold mb-0.5">Sesiones por semana</h2>
          <p className="text-xs text-ink-400 mb-4">Últimas 12 semanas</p>
          <SessionsBarChart
            data={weeklySessions}
            dataKeyX="weekStart"
            tickFormatter={(d) => d.slice(5).split('-').reverse().join('/')}
            interval={1}
          />
        </div>

        <div className="border border-white/10 bg-navy-850 p-6">
          <h2 className="font-display font-semibold mb-0.5">Sesiones por mes</h2>
          <p className="text-xs text-ink-400 mb-4">Últimos 12 meses</p>
          <SessionsBarChart
            data={monthlySessions}
            dataKeyX="month"
            tickFormatter={(m) => MES_CORTO[Number(m.slice(5, 7)) - 1] + ' ' + m.slice(2, 4)}
            interval={0}
          />
        </div>
      </div>

      <div className="border border-white/10 bg-navy-850 p-6 mb-6">
        <h2 className="font-display font-semibold mb-0.5">Sesiones por hora del día</h2>
        <p className="text-xs text-ink-400 mb-4">
          Todo el histórico, hora local de Argentina — para saber a qué hora conviene estar disponible para responder.
        </p>
        <SessionsBarChart
          data={hourlyDistribution}
          dataKeyX="hour"
          tickFormatter={(h) => `${h}h`}
          interval={1}
        />
      </div>

      <div className="border border-white/10 bg-navy-850 p-6 mb-6">
        <h2 className="font-display font-semibold mb-0.5">Embudo de conversión</h2>
        <p className="text-xs text-ink-400 mb-5">
          Desde que entran a la landing hasta que publican su página — cada barra muestra qué % llegó respecto del
          paso anterior.
        </p>
        <div className="space-y-3">
          {funnel.map((f, i) => {
            const pctPrimero = primerPaso > 0 ? Math.round((f.count / primerPaso) * 100) : 0;
            const prevCount = i > 0 ? funnel[i - 1].count : f.count;
            const pctPrevio = prevCount > 0 ? Math.round((f.count / prevCount) * 100) : 100;
            return (
              <div key={f.step}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-ink-200 font-medium">{f.label}</span>
                  <span className="text-ink-400">
                    <span className="text-white font-semibold">{f.count}</span>
                    {i > 0 && <span className="ml-1.5 text-ink-500">({pctPrevio}% del paso anterior)</span>}
                  </span>
                </div>
                <div className="h-2.5 bg-navy-900 border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gold-500"
                    style={{ width: `${Math.min(Math.max(pctPrimero, f.count > 0 ? 2 : 0), 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Botones más tocados">
          {topClicks.length === 0 ? (
            <p className="text-sm text-ink-400">Todavía no hay clics registrados.</p>
          ) : (
            <div className="space-y-2">
              {topClicks.map((c) => (
                <div key={c.eventName} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-200 truncate">{CLICK_LABELS[c.eventName] ?? c.eventName}</span>
                  <span className="text-white font-semibold shrink-0">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Páginas más vistas">
          {topPages.length === 0 ? (
            <p className="text-sm text-ink-400">Todavía no hay vistas registradas.</p>
          ) : (
            <div className="space-y-2">
              {topPages.map((p) => (
                <div key={p.path} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-200 font-mono truncate">{p.path}</span>
                  <span className="text-white font-semibold shrink-0">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function DailyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-white/10 bg-navy-950 px-3 py-2 text-xs shadow-xl">
      <p className="text-ink-400 mb-0.5">{label}</p>
      <p className="font-semibold text-white">{payload[0].value} sesiones</p>
    </div>
  );
}

// Barras (no área) para escalas de período discretas — semana, mes, hora —
// donde cada punto es su propio bloque comparable, a diferencia de la serie
// continua de "Sesiones por día".
function SessionsBarChart({ data, dataKeyX, tickFormatter, interval = 0 }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
        <XAxis
          dataKey={dataKeyX}
          stroke="rgba(255,255,255,0.15)"
          tick={{ fill: '#6b7590', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
          tickFormatter={tickFormatter}
          interval={interval}
        />
        <YAxis
          stroke="rgba(255,255,255,0.15)"
          tick={{ fill: '#6b7590', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip
          content={<BarSessionsTooltip tickFormatter={tickFormatter} />}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="sessions" fill="#FFC107" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function BarSessionsTooltip({ active, payload, label, tickFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-white/10 bg-navy-950 px-3 py-2 text-xs shadow-xl">
      <p className="text-ink-400 mb-0.5">{tickFormatter ? tickFormatter(label) : label}</p>
      <p className="font-semibold text-white">{payload[0].value} sesiones</p>
    </div>
  );
}

const LEAD_STEP_LABELS = {
  1: 'Paso 1/4 (nombre)',
  2: 'Paso 2/4 (rubro)',
  3: 'Paso 3/4 (mensaje)',
  4: 'Paso 4/4 (logo)',
  5: 'Vio el resultado',
};

function formatReferrer(referrer) {
  if (!referrer || referrer === 'directo') return 'Directo';
  try {
    return new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return referrer;
  }
}

// Lo que cada visitante va completando en el quiz (ver POST /api/leads),
// aunque nunca lo haya terminado ni se haya registrado — así se ve qué
// rubros y qué necesidades pide la gente en general, no solo quienes
// terminan pagando. `frase` es lo que puso como mensaje/necesidad de su
// negocio; `lastStep` marca hasta dónde llegó.
const LEADS_PAGE_SIZE = 20;

// Exportado por el mismo motivo que AnalyticsSection (ver comentario ahí).
export function LeadsSection() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState('all');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Espera a que se deje de escribir antes de mandar la búsqueda al
  // servidor, para no disparar un pedido por cada letra tipeada.
  useEffect(() => {
    const t = setTimeout(() => setQuery(queryInput.trim()), 350);
    return () => clearTimeout(t);
  }, [queryInput]);

  // Cualquier cambio de filtro vuelve a la página 1 — si no, se puede quedar
  // en una página que ya no existe para el filtro nuevo.
  useEffect(() => {
    setPage(1);
  }, [period, query]);

  const fetchLeads = () =>
    apiAdminListLeads({
      page,
      pageSize: LEADS_PAGE_SIZE,
      period: period === 'all' ? undefined : period,
      q: query || undefined,
    }).then((result) => {
      setLeads(result.leads);
      setTotal(result.total);
      setLoading(false);
    });

  useEffect(() => {
    setLoading(true);
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, period, query]);

  const totalPages = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE));

  return (
    <Panel title="Leads del quiz">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <p className="text-sm text-ink-400 max-w-2xl">
          Lo que cada visitante va completando en el quiz — negocio, rubro, necesidad y teléfono si lo llega a dejar —
          aunque no lo haya terminado ni se haya registrado. La columna "Términos" muestra si esa persona aceptó los
          Términos y Condiciones antes de que guardáramos su dato — sin eso, no deberíamos usarlo.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodFilter period={period} onChange={setPeriod} />
          <DownloadReportButton
            onDownload={() =>
              apiDownloadLeadsReport({ period: period === 'all' ? undefined : period, q: query || undefined })
            }
            label="Descargar PDF"
          />
          <RefreshButton onRefresh={fetchLeads} />
        </div>
      </div>
      <div className="relative mb-4 max-w-sm">
        <SearchIcon className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Buscar por nombre, teléfono, rubro o necesidad..."
          className="w-full border border-white/10 bg-navy-900 pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Cargando...</p>
      ) : leads.length === 0 ? (
        <p className="text-sm text-ink-400">
          {total === 0 && !query && period === 'all'
            ? 'Todavía no hay leads.'
            : 'No encontramos ningún lead con esos filtros.'}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-500 border-b border-white/10">
                  <th className="pb-2 pr-4 font-semibold">Negocio</th>
                  <th className="pb-2 pr-4 font-semibold">Rubro</th>
                  <th className="pb-2 pr-4 font-semibold">Teléfono</th>
                  <th className="pb-2 pr-4 font-semibold">Necesidad</th>
                  <th className="pb-2 pr-4 font-semibold">Progreso</th>
                  <th className="pb-2 pr-4 font-semibold">Fuente</th>
                  <th className="pb-2 pr-4 font-semibold">Términos</th>
                  <th className="pb-2 pr-4 font-semibold">Última actividad</th>
                  <th className="pb-2 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 pr-4 font-semibold">{l.nombreNegocio || '—'}</td>
                    <td className="py-2.5 pr-4 text-ink-300">{l.rubro || '—'}</td>
                    <td className="py-2.5 pr-4 text-ink-300 font-mono">{l.telefono || '—'}</td>
                    <td className="py-2.5 pr-4 text-ink-300 max-w-[220px] truncate" title={l.frase || ''}>
                      {l.frase || '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-400 whitespace-nowrap">
                      {LEAD_STEP_LABELS[l.lastStep] ?? `Paso ${l.lastStep}`}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-500">{formatReferrer(l.referrer)}</td>
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      {l.termsAcceptedAt ? (
                        <span
                          className="text-xs font-semibold text-emerald-400"
                          title={new Date(l.termsAcceptedAt).toLocaleString('es-AR')}
                        >
                          ✓ Aceptó
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-red-400">Sin aceptar</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-500 whitespace-nowrap">
                      {new Date(l.updatedAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 text-right">
                      {l.telefono ? (
                        <a
                          href={`https://wa.me/${l.telefono.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-[0.7rem] inline-block whitespace-nowrap"
                        >
                          Escribir
                        </a>
                      ) : (
                        <span className="text-xs text-ink-500">Sin teléfono</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}
    </Panel>
  );
}

// Plantillas creadas por el admin (se arman desde el editor con "Guardar
// como plantilla", ver Editor.jsx) y los rubros nuevos que se hayan creado
// junto con ellas, además de los 6 de fábrica. Publicar/despublicar decide
// si la ve algún usuario real en la galería o se la recomienda el quiz.
function PlantillasSection({ templates, rubros, onTogglePublished, onDeleteTemplate, onDeleteRubro, onRefresh }) {
  const navigate = useNavigate();
  const { startBlankTemplate, editTemplate } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [editError, setEditError] = useState('');

  const crearDesdeCero = () => {
    startBlankTemplate();
    navigate('/editor');
  };

  const editar = async (id) => {
    setEditingId(id);
    setEditError('');
    const result = await editTemplate(id);
    setEditingId(null);
    if (!result.ok) {
      setEditError(result.error || 'No se pudo abrir esa plantilla.');
      return;
    }
    navigate('/editor');
  };

  return (
    <div className="space-y-6">
      <Panel title="Plantillas creadas por el admin" action={<RefreshButton onRefresh={onRefresh} />}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <p className="text-sm text-ink-400 max-w-2xl">
            Te lleva directo al editor con una página completamente vacía — armala sección por sección con el
            mismo "+" de agregar contenido, y guardala con "Guardar como plantilla" cuando esté lista.
          </p>
          <button
            onClick={crearDesdeCero}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-xs shrink-0 whitespace-nowrap"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Crear nueva plantilla
          </button>
        </div>
        {editError && <p className="text-sm text-red-400 mb-3">{editError}</p>}
        {templates.length === 0 ? (
          <p className="text-sm text-ink-400">
            Todavía no hay ninguna. Tocá "Crear nueva plantilla" arriba y empezá a agregar secciones — después usá
            "Guardar como plantilla" en el editor.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-500 border-b border-white/10">
                  <th className="pb-2 pr-4 font-semibold">Nombre</th>
                  <th className="pb-2 pr-4 font-semibold">Rubros</th>
                  <th className="pb-2 pr-4 font-semibold">Estado</th>
                  <th className="pb-2 pr-4 font-semibold">Creada</th>
                  <th className="pb-2 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 pr-4 font-semibold">{t.nombre}</td>
                    <td className="py-2.5 pr-4 text-ink-300">
                      {(t.rubros || [])
                        .map((rId) => rubros.find((r) => r.id === rId)?.label || rId)
                        .join(', ') || '—'}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          t.published ? 'text-emerald-400' : 'text-ink-400'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${t.published ? 'bg-emerald-400' : 'bg-white/20'}`} />
                        {t.published ? 'Publicada' : 'Borrador'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-500">
                      {new Date(t.createdAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          onClick={() => editar(t.id)}
                          disabled={editingId === t.id}
                          className="px-2 py-1 border border-gold-500/30 hover:bg-gold-500/10 disabled:opacity-50 transition-colors text-[0.7rem] font-semibold text-gold-400"
                        >
                          {editingId === t.id ? 'Abriendo...' : 'Editar'}
                        </button>
                        <button
                          onClick={() => onTogglePublished(t.id, t.published)}
                          className={`px-2 py-1 border transition-colors text-[0.7rem] font-semibold ${
                            t.published
                              ? 'border-red-500/30 hover:bg-red-500/10 text-red-300'
                              : 'border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300'
                          }`}
                        >
                          {t.published ? 'Despublicar' : 'Publicar'}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Borrar la plantilla "${t.nombre}"? No se puede deshacer.`)) {
                              onDeleteTemplate(t.id);
                            }
                          }}
                          className="px-2 py-1 border border-white/15 hover:bg-white/5 transition-colors text-[0.7rem] font-semibold text-white"
                        >
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Rubros creados">
        <p className="text-sm text-ink-400 mb-4">
          Además de los 6 de fábrica (gastronomía, belleza, oficios, comercio, salud, otro) — se crean desde el
          mismo modal de "Guardar como plantilla" en el editor.
        </p>
        {rubros.length === 0 ? (
          <p className="text-sm text-ink-400">Todavía no se creó ningún rubro nuevo.</p>
        ) : (
          <div className="space-y-2">
            {rubros.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 border border-white/10 bg-navy-900 hover:border-white/20 transition-colors px-4 py-2.5">
                <span className="inline-flex items-center gap-2 text-sm">
                  <span className="font-semibold text-white">{r.label}</span>
                  <span
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                    style={{ background: r.accent }}
                  />
                </span>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Borrar el rubro "${r.label}"?`)) onDeleteRubro(r.id);
                  }}
                  className="text-xs font-semibold text-ink-400 hover:text-red-300 transition-colors"
                >
                  Borrar
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

// Cada página publicada es una suscripción de $15.000/mes (el plan es por
// página, no por cuenta — ver Dashboard > Suscripción del lado del usuario).
// Todas las páginas de todas las cuentas, publicadas o no — con buscador
// (por id, email o nombre) y acción para entrar a editarla directamente en
// caso de que alguien necesite ayuda.
function PaginasSection({ sites, onEdit, onToggleLock, onTogglePublish, onRefresh }) {
  const [query, setQuery] = useState('');

  const norm = (v) => (v ?? '').toString().toLowerCase();
  const q = norm(query).trim();
  const filtered = q
    ? sites.filter((s) => norm(s.id).includes(q) || norm(s.email).includes(q) || norm(s.nombre).includes(q))
    : sites;

  return (
    <Panel title="Todas las páginas" action={<RefreshButton onRefresh={onRefresh} />}>
      <div className="relative mb-4 max-w-sm">
        <SearchIcon className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por id, email o nombre..."
          className="w-full border border-white/10 bg-navy-900 pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-400">No encontramos ninguna página con esa búsqueda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-500 border-b border-white/10">
                <th className="pb-2 pr-4 font-semibold">ID</th>
                <th className="pb-2 pr-4 font-semibold">Página</th>
                <th className="pb-2 pr-4 font-semibold">Cuenta</th>
                <th className="pb-2 pr-4 font-semibold">Vendedor</th>
                <th className="pb-2 pr-4 font-semibold">Estado</th>
                <th className="pb-2 pr-4 font-semibold">Edición</th>
                <th className="pb-2 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 pr-4 font-mono text-ink-400">{s.id}</td>
                  <td className="py-2.5 pr-4 font-semibold">{s.nombre || '—'}</td>
                  <td className="py-2.5 pr-4 text-ink-300">
                    {s.email}
                    {(s.freeSubscriptions ?? 0) > 0 && (
                      <span className="ml-2 text-xs font-semibold text-emerald-400">· Gratis</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-ink-400">{s.vendedor || '—'}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        s.published ? 'text-emerald-400' : 'text-ink-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.published ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      {s.published ? 'Publicada' : 'Borrador'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    {s.locked ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        Pausada
                      </span>
                    ) : (
                      <span className="text-xs text-ink-500">Habilitada</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {s.published && s.subdomain && (
                        <button
                          onClick={() => window.open(`https://${s.subdomain}.${ROOT_DOMAIN}`, '_blank', 'noopener,noreferrer')}
                          title="Abre el sitio publicado en una pestaña nueva."
                          className="w-7 h-7 flex items-center justify-center border border-white/15 hover:bg-white/5 transition-colors text-white"
                        >
                          <GlobeIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onTogglePublish(s.id, s.published)}
                        title="Despublica o vuelve a publicar la página — el dueño sigue pudiendo editarla."
                        className={`px-2 py-1 border transition-colors text-[0.7rem] font-semibold ${
                          s.published
                            ? 'border-red-500/30 hover:bg-red-500/10 text-red-300'
                            : 'border-white/15 hover:bg-white/5 text-white'
                        }`}
                      >
                        {s.published ? 'Bloquear' : 'Desbloquear'}
                      </button>
                      <button
                        onClick={() => onToggleLock(s.id, s.locked)}
                        title="Pausa o reanuda la edición — sigue publicada tal cual está."
                        className={`px-2 py-1 border transition-colors text-[0.7rem] font-semibold ${
                          s.locked
                            ? 'border-white/15 hover:bg-white/5 text-white'
                            : 'border-amber-500/30 hover:bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {s.locked ? 'Reanudar edición' : 'Pausar edición'}
                      </button>
                      <button
                        onClick={() => onEdit(s.id)}
                        className="px-2 py-1 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-[0.7rem]"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// Estado real de Mercado Pago (sites.mp_subscription_status) — "pending" es
// la aprobación todavía sin confirmar del lado de ellos, "pending_redirect"
// es nuestro propio estado interno para "recién mandado a pagar, esperando
// el webhook o el sondeo" (ver subscription.js), nunca lo pone MP.
const MP_STATUS_INFO = {
  authorized: { label: 'Autorizada', className: 'text-emerald-400' },
  pending: { label: 'Pendiente', className: 'text-amber-400' },
  pending_redirect: { label: 'Esperando pago', className: 'text-amber-400' },
  paused: { label: 'Pausada', className: 'text-amber-400' },
  cancelled: { label: 'Cancelada', className: 'text-red-400' },
};

function SuscripcionesSection({ subscriptions, onCancel, onRefresh }) {
  // Incluye tanto activas como dadas de baja (ver GET /admin/subscriptions) —
  // el ingreso mensual solo cuenta las que siguen publicadas y no son
  // cuentas de prueba gratis.
  const activas = subscriptions.filter((s) => s.published);
  const bajas = subscriptions.filter((s) => !s.published);
  const total = activas.filter((s) => (s.freeSubscriptions ?? 0) <= 0).length * PLAN.precio;

  return (
    <Panel title="Suscripciones" action={<RefreshButton onRefresh={onRefresh} />}>
      <p className="text-sm text-ink-300 mb-1">
        {PLAN.nombre} — ${PLAN.precio.toLocaleString('es-AR')} {PLAN.moneda}/{PLAN.ciclo} por página publicada.
      </p>
      <p className="font-display text-2xl font-bold mt-2 mb-4">
        ${total.toLocaleString('es-AR')}
        <span className="text-sm font-medium text-ink-400"> {PLAN.moneda}/mes en total</span>
      </p>

      <StatStrip
        items={[
          { label: 'Activas', value: activas.length },
          { label: 'Dadas de baja', value: bajas.length },
        ]}
        cols={2}
      />

      {subscriptions.length === 0 ? (
        <p className="text-sm text-ink-400">Todavía no hay ninguna suscripción, activa ni dada de baja.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-500 border-b border-white/10">
                <th className="pb-2 pr-4 font-semibold">Página</th>
                <th className="pb-2 pr-4 font-semibold">Cuenta</th>
                <th className="pb-2 pr-4 font-semibold">Vendedor</th>
                <th className="pb-2 pr-4 font-semibold">Estado</th>
                <th className="pb-2 pr-4 font-semibold">Próximo cobro</th>
                <th className="pb-2 pr-4 font-semibold text-right">Precio</th>
                <th className="pb-2 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <SuscripcionRow key={s.id} s={s} onCancel={onCancel} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function SuscripcionRow({ s, onCancel }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isFree = (s.freeSubscriptions ?? 0) > 0;
  const mpInfo = MP_STATUS_INFO[s.mpStatus];

  const confirm = async () => {
    setBusy(true);
    setError('');
    const result = await onCancel(s.id, isFree);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || 'No se pudo dar de baja.');
      return;
    }
    setConfirming(false);
  };

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
      <td className="py-2.5 pr-4 font-semibold">{s.nombre || '—'}</td>
      <td className="py-2.5 pr-4 text-ink-300">{s.email}</td>
      <td className="py-2.5 pr-4 text-ink-400">{s.vendedor || '—'}</td>
      <td className="py-2.5 pr-4">
        {!s.published ? (
          <span className="font-semibold text-xs text-red-400">{isFree ? 'Gratis (baja)' : mpInfo?.label || 'Dada de baja'}</span>
        ) : isFree ? (
          <span className="text-emerald-400 font-semibold text-xs">Gratis</span>
        ) : mpInfo ? (
          <span className={`font-semibold text-xs ${mpInfo.className}`}>{mpInfo.label}</span>
        ) : (
          <span className="text-ink-500 text-xs">—</span>
        )}
      </td>
      <td className="py-2.5 pr-4 text-ink-500 text-xs">
        {s.published && s.nextPaymentDate ? new Date(s.nextPaymentDate).toLocaleDateString('es-AR') : '—'}
      </td>
      <td className="py-2.5 pr-4 text-right">
        {isFree ? (
          <span className="text-emerald-400 font-semibold">Gratis (cuenta de prueba)</span>
        ) : (
          <span className="text-ink-200">${PLAN.precio.toLocaleString('es-AR')}/mes</span>
        )}
      </td>
      <td className="py-2.5 text-right">
        {!s.published ? (
          // Ya está de baja — se deja el contacto (mail, nombre de página) visible
          // en la tabla arriba para poder recontactarla, no hay más acción posible acá.
          <span className="text-ink-500 text-xs whitespace-nowrap">
            Baja: {new Date(s.updatedAt).toLocaleDateString('es-AR')}
          </span>
        ) : confirming ? (
          <div className="flex items-center justify-end gap-2">
            {error && <span className="text-xs text-red-400">{error}</span>}
            <button
              disabled={busy}
              onClick={confirm}
              className="px-2 py-1 bg-red-500/15 border border-red-500/30 text-red-300 text-[0.7rem] font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {busy ? 'Dando de baja...' : 'Confirmar'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-2 py-1 border border-white/15 text-[0.7rem] font-semibold hover:bg-white/5 transition-colors"
            >
              Volver
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-xs font-semibold text-ink-400 hover:text-red-300 transition-colors whitespace-nowrap"
          >
            Dar de baja
          </button>
        )}
      </td>
    </tr>
  );
}

const VENTAS_PAGE_SIZE = 20;

// Admin > Vendedores: páginas reclamadas vía un link compartido (rol
// vendedor/admin, ver Dashboard > Compartir), quién la vendió y cuándo —
// mismo patrón de paginado + filtro por período que LeadsSection, más un
// select para filtrar por vendedor puntual.
function VendedoresSection({ vendedores }) {
  const [ventas, setVentas] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState('all');
  const [vendedorId, setVendedorId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [period, vendedorId]);

  const fetchVentas = () =>
    apiAdminListVentas({
      page,
      pageSize: VENTAS_PAGE_SIZE,
      period: period === 'all' ? undefined : period,
      vendedorId: vendedorId || undefined,
    }).then((result) => {
      setVentas(result.ventas);
      setTotal(result.total);
      setLoading(false);
    });

  useEffect(() => {
    setLoading(true);
    fetchVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, period, vendedorId]);

  const totalPages = Math.max(1, Math.ceil(total / VENTAS_PAGE_SIZE));

  return (
    <Panel title="Vendedores">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <p className="text-sm text-ink-400 max-w-2xl">
          Páginas que se armaron y compartieron desde una cuenta vendedor, y que un prospecto ya reclamó — quién la
          vendió y cuándo. Las páginas todavía sin reclamar no aparecen acá.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
            className="border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white outline-none focus:border-gold-500 transition-colors"
          >
            <option value="">Todos los vendedores</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <PeriodFilter period={period} onChange={setPeriod} />
          <RefreshButton onRefresh={fetchVentas} />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Cargando...</p>
      ) : ventas.length === 0 ? (
        <p className="text-sm text-ink-400">
          {total === 0 && !vendedorId && period === 'all'
            ? 'Todavía no se vendió ninguna página compartida.'
            : 'No encontramos ninguna venta con esos filtros.'}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-500 border-b border-white/10">
                  <th className="pb-2 pr-4 font-semibold">Página</th>
                  <th className="pb-2 pr-4 font-semibold">Cliente</th>
                  <th className="pb-2 pr-4 font-semibold">Vendedor</th>
                  <th className="pb-2 pr-4 font-semibold">Fecha vendida</th>
                  <th className="pb-2 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => {
                  const mpInfo = MP_STATUS_INFO[v.mpStatus];
                  return (
                    <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 pr-4 font-semibold">{v.nombre || '—'}</td>
                      <td className="py-2.5 pr-4 text-ink-300">
                        {v.clienteName}
                        <span className="block text-xs text-ink-500">{v.clienteEmail}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-ink-300">
                        {v.vendedorName || '—'}
                        {v.vendedorEmail && <span className="block text-xs text-ink-500">{v.vendedorEmail}</span>}
                      </td>
                      <td className="py-2.5 pr-4 text-ink-500 whitespace-nowrap">
                        {new Date(v.soldAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5">
                        {v.published ? (
                          <span className="text-xs font-semibold text-emerald-400">Publicada</span>
                        ) : mpInfo ? (
                          <span className={`text-xs font-semibold ${mpInfo.className}`}>{mpInfo.label}</span>
                        ) : (
                          <span className="text-xs font-semibold text-ink-400">Sin pagar</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />
        </>
      )}
    </Panel>
  );
}

// Alta de cuentas y gestión de suscripciones gratuitas (cuentas de prueba a
// las que se les regala el servicio) — no cuentan como ingreso en
// Suscripciones/Resumen mientras freeSubscriptions sea >= 1.
const BLANK_MAIL_FORM = { scope: 'all', userId: '', subject: '', message: '' };

function UsuariosSection({ users, onCreate, onSetFreeSubscriptions, onDelete, onSetActive, onReassignLeads, onSendMail, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'usuario', freeSubscriptions: 0 });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [mailOpen, setMailOpen] = useState(false);
  const [mailForm, setMailForm] = useState(BLANK_MAIL_FORM);
  const [mailSaving, setMailSaving] = useState(false);
  const [mailError, setMailError] = useState('');
  const [mailSuccess, setMailSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    const result = await onCreate({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      freeSubscriptions: Number(form.freeSubscriptions) || 0,
    });
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setForm({ name: '', email: '', password: '', role: 'usuario', freeSubscriptions: 0 });
    setShowForm(false);
  };

  const openMail = (userId) => {
    setShowForm(false);
    setMailError('');
    setMailSuccess('');
    setMailForm(userId ? { ...BLANK_MAIL_FORM, scope: 'one', userId } : BLANK_MAIL_FORM);
    setMailOpen(true);
  };

  const submitMail = async (e) => {
    e.preventDefault();
    setMailError('');
    setMailSuccess('');
    setMailSaving(true);
    const result = await onSendMail({
      scope: mailForm.scope,
      userId: mailForm.scope === 'one' ? Number(mailForm.userId) : undefined,
      subject: mailForm.subject,
      message: mailForm.message,
    });
    setMailSaving(false);
    if (!result.ok) {
      setMailError(result.error || 'No se pudo mandar el mail.');
      return;
    }
    setMailSuccess(`Mail enviado a ${result.count} cuenta${result.count === 1 ? '' : 's'}.`);
    setMailForm((f) => ({ ...f, subject: '', message: '' }));
  };

  return (
    <Panel title="Usuarios" action={<RefreshButton onRefresh={onRefresh} />}>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-sm text-ink-400">
          Creá cuentas directo (por ejemplo para clientes de prueba) y asigná suscripciones gratuitas.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setMailOpen(false);
              setShowForm((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-xs"
          >
            {showForm ? <XIcon className="w-3.5 h-3.5" /> : <PlusIcon className="w-3.5 h-3.5" />}
            {showForm ? 'Cancelar' : 'Crear usuario'}
          </button>
          <button
            onClick={() => (mailOpen ? setMailOpen(false) : openMail(null))}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-white/15 hover:bg-white/5 transition-colors text-white font-bold text-xs"
          >
            {mailOpen ? <XIcon className="w-3.5 h-3.5" /> : <SendIcon className="w-3.5 h-3.5" />}
            {mailOpen ? 'Cancelar' : 'Mandar mail'}
          </button>
        </div>
      </div>

      {mailOpen && (
        <form onSubmit={submitMail} className="border border-white/10 bg-navy-900 p-4 mb-5 space-y-3">
          <div>
            <label className="text-xs text-ink-400 block mb-1">Destinatarios</label>
            <select
              value={mailForm.scope}
              onChange={(e) => setMailForm((f) => ({ ...f, scope: e.target.value }))}
              className="w-full sm:w-64 border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white outline-none focus:border-gold-500 transition-colors"
            >
              <option value="all">Todos los usuarios</option>
              <option value="one">Un usuario en particular</option>
            </select>
          </div>
          {mailForm.scope === 'one' && (
            <div>
              <label className="text-xs text-ink-400 block mb-1">Cuenta</label>
              <select
                required
                value={mailForm.userId}
                onChange={(e) => setMailForm((f) => ({ ...f, userId: e.target.value }))}
                className="w-full sm:w-64 border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white outline-none focus:border-gold-500 transition-colors"
              >
                <option value="" disabled>
                  Elegí una cuenta...
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs text-ink-400 block mb-1">Asunto</label>
            <input
              required
              value={mailForm.subject}
              onChange={(e) => setMailForm((f) => ({ ...f, subject: e.target.value }))}
              className="w-full border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white outline-none focus:border-gold-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-ink-400 block mb-1">Mensaje</label>
            <textarea
              required
              rows={5}
              value={mailForm.message}
              onChange={(e) => setMailForm((f) => ({ ...f, message: e.target.value }))}
              className="w-full border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white outline-none focus:border-gold-500 transition-colors resize-y"
            />
          </div>
          {mailError && <p className="text-sm text-red-400">{mailError}</p>}
          {mailSuccess && <p className="text-sm text-emerald-400">{mailSuccess}</p>}
          <button
            type="submit"
            disabled={mailSaving}
            className="px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 transition-colors text-navy-950 font-bold text-xs"
          >
            {mailSaving ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      )}

      {showForm && (
        <form onSubmit={submit} className="border border-white/10 bg-navy-900 p-4 mb-5 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-ink-400 block mb-1">Nombre</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white outline-none focus:border-gold-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-ink-400 block mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white outline-none focus:border-gold-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-ink-400 block mb-1">Contraseña</label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border border-white/10 bg-navy-850 pl-3 pr-9 py-2 text-sm text-white outline-none focus:border-gold-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-0 top-0 h-full px-2.5 text-ink-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-400 block mb-1">Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white outline-none focus:border-gold-500 transition-colors"
            >
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
              <option value="analytics">Analytics (Leads y Analytics nada más)</option>
              <option value="vendedor">Vendedor (crea y comparte páginas)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-ink-400 block mb-1">Suscripciones gratuitas</label>
            <input
              type="number"
              min={0}
              value={form.freeSubscriptions}
              onChange={(e) => setForm((f) => ({ ...f, freeSubscriptions: e.target.value }))}
              className="w-full sm:w-40 border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white outline-none focus:border-gold-500 transition-colors"
            />
            <p className="text-xs text-ink-500 mt-1">
              Con 1 o más, la página que publique esta cuenta no se cobra.
            </p>
          </div>
          {formError && <p className="sm:col-span-2 text-sm text-red-400">{formError}</p>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-60 transition-colors text-navy-950 font-bold text-xs"
            >
              {saving ? 'Creando...' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      )}

      {users.length === 0 ? (
        <p className="text-sm text-ink-400">Todavía no hay cuentas registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-500 border-b border-white/10">
                <th className="pb-2 pr-4 font-semibold">Nombre</th>
                <th className="pb-2 pr-4 font-semibold">Email</th>
                <th className="pb-2 pr-4 font-semibold">Rol</th>
                <th className="pb-2 pr-4 font-semibold">Estado</th>
                <th className="pb-2 pr-4 font-semibold">Alta</th>
                <th className="pb-2 pr-4 font-semibold text-right">Suscripciones gratuitas</th>
                <th className="pb-2 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  u={u}
                  users={users}
                  onSetFreeSubscriptions={onSetFreeSubscriptions}
                  onDelete={onDelete}
                  onSetActive={onSetActive}
                  onReassignLeads={onReassignLeads}
                  onOpenMail={openMail}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function UserRow({ u, users, onSetFreeSubscriptions, onDelete, onSetActive, onReassignLeads, onOpenMail }) {
  const [value, setValue] = useState(u.freeSubscriptions);
  const dirty = Number(value) !== Number(u.freeSubscriptions);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // null = nada abierto | 'confirmar' = deshabilitar sin leads que reasignar
  // | 'reasignar' = tiene leads, hay que elegir a quién se los pasa antes.
  const [disableStep, setDisableStep] = useState(null);
  const [toUserId, setToUserId] = useState('');
  const [disableBusy, setDisableBusy] = useState(false);
  const [disableError, setDisableError] = useState('');
  const otrasCuentas = users.filter((o) => o.id !== u.id && o.active);

  const confirmarEliminar = async () => {
    setDeleting(true);
    setDeleteError('');
    const result = await onDelete(u.id);
    if (!result.ok) {
      setDeleteError(result.error || 'No se pudo eliminar la cuenta.');
      setDeleting(false);
      return;
    }
    // Si salió bien, la fila desaparece de la lista (onDelete ya la sacó del
    // estado en Admin()) — no hace falta tocar nada más acá.
  };

  const abrirDeshabilitar = () => {
    setDisableError('');
    setToUserId('');
    setDisableStep((u.pendingLeads ?? 0) > 0 ? 'reasignar' : 'confirmar');
  };

  const confirmarDeshabilitar = async () => {
    setDisableBusy(true);
    setDisableError('');
    if (disableStep === 'reasignar') {
      if (!toUserId) {
        setDisableError('Elegí a quién le pasás los leads.');
        setDisableBusy(false);
        return;
      }
      const reasignado = await onReassignLeads(u.id, Number(toUserId));
      if (!reasignado.ok) {
        setDisableError(reasignado.error || 'No se pudieron reasignar los leads.');
        setDisableBusy(false);
        return;
      }
    }
    const result = await onSetActive(u.id, false);
    setDisableBusy(false);
    if (!result.ok) {
      setDisableError(result.error || 'No se pudo deshabilitar la cuenta.');
      return;
    }
    setDisableStep(null);
  };

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
      <td className="py-2.5 pr-4 font-semibold">{u.name}</td>
      <td className="py-2.5 pr-4 text-ink-300">{u.email}</td>
      <td className="py-2.5 pr-4">
        <span
          className={`text-xs font-semibold ${
            u.role === 'admin'
              ? 'text-gold-500'
              : u.role === 'analytics'
                ? 'text-sky-400'
                : u.role === 'vendedor'
                  ? 'text-emerald-400'
                  : 'text-ink-400'
          }`}
        >
          {u.role === 'admin' ? 'Admin' : u.role === 'analytics' ? 'Analytics' : u.role === 'vendedor' ? 'Vendedor' : 'Usuario'}
        </span>
      </td>
      <td className="py-2.5 pr-4">
        {u.active ? (
          <span className="text-xs font-semibold text-emerald-400">Activo</span>
        ) : (
          <span className="text-xs font-semibold text-red-400">Deshabilitado</span>
        )}
        {!u.active && (u.pendingLeads ?? 0) > 0 && (
          <span className="block text-[0.65rem] text-ink-500">{u.pendingLeads} leads sin reasignar</span>
        )}
      </td>
      <td className="py-2.5 pr-4 text-ink-500">{new Date(u.createdAt).toLocaleDateString('es-AR')}</td>
      <td className="py-2.5 pr-4 text-right">
        <div className="inline-flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-16 border border-white/10 bg-navy-900 px-2 py-1.5 text-sm text-white text-right outline-none focus:border-gold-500 transition-colors"
          />
          <button
            onClick={() => onSetFreeSubscriptions(u.id, Number(value) || 0)}
            disabled={!dirty}
            className="px-2 py-1 border border-white/15 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[0.7rem] font-semibold text-white"
          >
            Guardar
          </button>
        </div>
      </td>
      <td className="py-2.5 text-right">
        {disableStep ? (
          <div className="inline-flex flex-col items-end gap-1.5 max-w-[220px]">
            {disableStep === 'reasignar' && (
              <>
                <p className="text-[0.7rem] text-ink-400 text-right">
                  Tiene {u.pendingLeads} lead{u.pendingLeads === 1 ? '' : 's'} sin cerrar — elegí a quién se los pasás.
                </p>
                <select
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  className="w-full border border-white/10 bg-navy-900 px-2 py-1.5 text-xs text-white outline-none focus:border-gold-500 transition-colors"
                >
                  <option value="">Elegir cuenta...</option>
                  {otrasCuentas.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.role})
                    </option>
                  ))}
                </select>
              </>
            )}
            {disableError && <span className="text-[0.7rem] text-red-400">{disableError}</span>}
            <div className="inline-flex items-center gap-2">
              <button
                onClick={confirmarDeshabilitar}
                disabled={disableBusy}
                className="px-2 py-1 bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 disabled:opacity-50 transition-colors text-[0.7rem] font-semibold whitespace-nowrap"
              >
                {disableBusy ? 'Un momento...' : disableStep === 'reasignar' ? 'Reasignar y deshabilitar' : 'Confirmar'}
              </button>
              <button
                onClick={() => setDisableStep(null)}
                disabled={disableBusy}
                className="px-2 py-1 border border-white/15 hover:bg-white/5 transition-colors text-[0.7rem] font-semibold text-white"
              >
                Volver
              </button>
            </div>
          </div>
        ) : (
          <>
            {!confirming && (
              <button
                onClick={() => onOpenMail(u.id)}
                className="mr-1.5 px-2 py-1 border border-white/15 hover:bg-white/5 transition-colors text-[0.7rem] font-semibold text-white"
              >
                Mandar mail
              </button>
            )}
            {!confirming && u.role !== 'admin' && (
              <button
                onClick={() => (u.active ? abrirDeshabilitar() : onSetActive(u.id, true))}
                className="mr-1.5 px-2 py-1 border border-white/15 hover:bg-white/5 transition-colors text-[0.7rem] font-semibold text-white"
              >
                {u.active ? 'Deshabilitar' : 'Habilitar'}
              </button>
            )}
            {u.role === 'admin' ? (
              <span className="text-xs text-ink-500 italic">No se puede eliminar</span>
            ) : confirming ? (
              <div className="inline-flex items-center gap-2">
                {deleteError && <span className="text-xs text-red-400">{deleteError}</span>}
                <button
                  onClick={confirmarEliminar}
                  disabled={deleting}
                  className="px-2 py-1 bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 disabled:opacity-50 transition-colors text-[0.7rem] font-semibold"
                >
                  {deleting ? 'Eliminando...' : 'Confirmar'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  className="px-2 py-1 border border-white/15 hover:bg-white/5 transition-colors text-[0.7rem] font-semibold text-white"
                >
                  Volver
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="px-2 py-1 border border-white/15 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-colors text-[0.7rem] font-semibold text-white"
              >
                Eliminar
              </button>
            )}
          </>
        )}
      </td>
    </tr>
  );
}

// Todas las consultas de soporte de todos los usuarios (a diferencia del
// Dashboard del usuario, que solo ve las propias). Al abrir una, el admin
// puede seguir el chat completo y responderle directo a esa cuenta.
function SoporteSection({ tickets, currentUserId, unreadIds = [], onTicketUpdated, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <Panel title="Todas las consultas de soporte" action={<RefreshButton onRefresh={onRefresh} />}>
      {tickets.length === 0 ? (
        <p className="text-sm text-ink-400">Todavía no hay consultas de soporte.</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const isOpen = expandedId === t.id;
            return (
              <div key={t.id} className="border border-white/10 bg-navy-900 hover:border-white/20 transition-colors">
                <button
                  onClick={() => setExpandedId(isOpen ? null : t.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    {unreadIds.includes(t.id) && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-label="Mensaje nuevo" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{t.asunto}</p>
                        <span
                          className={`shrink-0 text-[0.65rem] font-semibold uppercase px-1.5 py-0.5 border rounded ${
                            t.status === 'cerrado'
                              ? 'text-ink-400 bg-white/5 border-white/15'
                              : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25'
                          }`}
                        >
                          {t.status === 'cerrado' ? 'Cerrado' : 'Abierto'}
                        </span>
                      </div>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {t.userName} · {t.userEmail} ·{' '}
                        {new Date(t.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {t.claimedByName && <> · Tomado por {t.claimedByName}</>}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-ink-500 shrink-0">{isOpen ? 'Ocultar' : 'Ver'}</span>
                </button>
                {isOpen && (
                  <SupportThread
                    ticketId={t.id}
                    currentUserId={currentUserId}
                    isAdmin
                    onTicketUpdated={(patch) => onTicketUpdated?.(t.id, patch)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

const CHANGE_TYPE_INFO = {
  nuevo: { label: 'Nuevo', className: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' },
  mejora: { label: 'Mejora', className: 'text-sky-400 bg-sky-400/10 border-sky-400/25' },
  fix: { label: 'Fix', className: 'text-amber-400 bg-amber-400/10 border-amber-400/25' },
};

// Aviso de "qué cambió" al entrar con una versión nueva del front (ver el
// efecto en Admin() que decide cuándo mostrarlo, comparando contra
// localStorage). Es un aviso interno para el equipo, no algo que necesite
// quedar registrado del lado del servidor.
function VersionModal({ entry, onClose, onVerTodas }) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md border border-white/10 bg-navy-850 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-navy-950 border-b border-white/8 px-6 py-4 flex items-center justify-between gap-2">
          <span className="text-white font-semibold text-sm">Novedades de v{entry.version}</span>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-ink-400 hover:text-white transition-colors text-lg leading-none">
            ✕
          </button>
        </div>
        <div className="p-6">
          <ul className="space-y-1.5 mb-5">
            {entry.changes.map((c, i) => {
              const info = CHANGE_TYPE_INFO[c.type] ?? CHANGE_TYPE_INFO.nuevo;
              return (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-300">
                  <span className={`shrink-0 mt-0.5 text-[0.65rem] font-semibold uppercase px-1.5 py-0.5 border rounded ${info.className}`}>
                    {info.label}
                  </span>
                  {c.text}
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={onVerTodas}
              className="flex-1 px-3 py-2.5 border border-white/15 hover:bg-white/5 transition-colors text-sm font-semibold"
            >
              Ver todas las versiones
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Historial de versiones — lee CHANGELOG (src/data/changelog.js), que se
// actualiza a mano cada vez que se hace un cambio o arreglo. Ver también
// VersionModal más arriba, que muestra el mismo tipo de aviso una vez por
// versión nueva.
// Texto legal que ve cualquiera en TermsGate.jsx antes de aceptar (anónimo o
// logueado) — un solo campo de texto plano, sin secciones separadas ni
// formato especial: el admin escribe el documento entero acá mismo, tal
// como se muestra. `updated_at` lo pisa el backend en cada guardado, nunca
// se manda desde acá — así "Última actualización" siempre refleja el
// guardado real, no lo que alguien tipeó.
function TerminosSection() {
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    apiGetTerms().then((result) => {
      setContent(result.content);
      setSavedContent(result.content);
      setUpdatedAt(result.updatedAt);
      setLoading(false);
    });
  }, []);

  const dirty = content !== savedContent;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const result = await apiAdminUpdateTerms(content);
    setBusy(false);
    if (result.ok) {
      setSavedContent(result.content);
      setUpdatedAt(result.updatedAt);
      setStatus({ type: 'ok', msg: 'Términos actualizados.' });
    } else {
      setStatus({ type: 'error', msg: result.error || 'No se pudo guardar.' });
    }
  };

  return (
    <Panel title="Términos y Condiciones">
      {loading ? (
        <p className="text-sm text-ink-400">Cargando...</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block font-mono text-[0.65rem] uppercase tracking-[0.06em] text-ink-500 mb-1.5">
              Texto completo
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={22}
              className="w-full border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors resize-y leading-relaxed"
              placeholder="Escribí acá el texto completo de los Términos y Condiciones..."
            />
          </div>
          {updatedAt && (
            <p className="text-xs text-ink-500">
              Última actualización:{' '}
              {new Date(updatedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })} a
              las {new Date(updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.
            </p>
          )}
          {status && (
            <p className={`text-sm ${status.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>{status.msg}</p>
          )}
          <button
            type="submit"
            disabled={!dirty || busy || !content.trim()}
            className="px-4 py-2.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      )}
    </Panel>
  );
}

function VersionesSection() {
  return (
    <Panel title="Versiones">
      <div className="space-y-6">
        {CHANGELOG.map((entry) => (
          <div key={entry.version} className="border border-white/10 bg-navy-900 hover:border-white/20 transition-colors p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-display font-bold text-white">v{entry.version}</span>
              <span className="text-xs text-ink-500">
                {/* T00:00:00 sin zona (no "Z") para que se interprete en hora local, no UTC — si
                    no, un date-only string como "2026-07-27" corre un día para atrás en
                    cualquier huso horario detrás de UTC. */}
                {new Date(`${entry.date}T00:00:00`).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
            <ul className="space-y-1.5">
              {entry.changes.map((c, i) => {
                const info = CHANGE_TYPE_INFO[c.type] ?? CHANGE_TYPE_INFO.nuevo;
                return (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-300">
                    <span className={`shrink-0 mt-0.5 text-[0.65rem] font-semibold uppercase px-1.5 py-0.5 border rounded ${info.className}`}>
                      {info.label}
                    </span>
                    {c.text}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// Filtro de período compartido por Analytics y Leads — "semana"/"mes" son
// ventanas móviles (últimos 7/30 días), no el calendario, ver periodToSince
// en server/src/utils/period.js. Acota tanto los datos en pantalla como el
// PDF que se descargue (ver DownloadReportButton más abajo).
const PERIOD_OPTIONS = [
  { id: 'all', label: 'Todo' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

function PeriodFilter({ period, onChange }) {
  return (
    <div className="flex items-center border border-white/10 divide-x divide-white/10 shrink-0">
      {PERIOD_OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`px-3 py-2 text-xs font-semibold transition-colors ${
            period === o.id ? 'bg-gold-500 text-navy-950' : 'text-ink-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Paginado de Admin > Leads — botones simples "Anterior/Siguiente" en vez de
// números de página sueltos, porque con paginado del lado del servidor no
// tiene sentido permitir saltar a una página arbitraria sin buscarla primero.
function Pagination({ page, totalPages, total, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-white/10">
      <p className="text-xs text-ink-500">
        {total} en total · página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 border border-white/15 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold text-white"
        >
          ← Anterior
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 border border-white/15 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold text-white"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

// Botón compartido por Analytics y Leads para bajar el PDF armado del lado
// del servidor (ver server/src/routes/reports.js) — descarga autenticada,
// por eso no es un <a href> simple (ver apiDownloadLeadsReport/
// apiDownloadAnalyticsReport en api/client.js).
function DownloadReportButton({ onDownload, label }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setBusy(true);
    setError('');
    const result = await onDownload();
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-2 border border-white/15 hover:bg-white/5 disabled:opacity-50 transition-colors text-xs font-semibold text-white whitespace-nowrap"
      >
        <DownloadIcon className="w-3.5 h-3.5" />
        {busy ? 'Generando...' : label}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

// Botón "Refrescar" de cada sección del admin — trae lo nuevo sin esperar al
// sondeo automático (que solo existe para Soporte) ni recargar la página
// entera. `onRefresh` es la función específica de esa sección (ver
// refreshResumen/refreshSites/etc. en Admin()).
function RefreshButton({ onRefresh }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    await onRefresh();
    setBusy(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      aria-label="Refrescar"
      title="Refrescar"
      className="inline-flex items-center gap-1.5 px-2.5 py-2 border border-white/15 hover:bg-white/5 disabled:opacity-50 transition-colors text-xs font-semibold text-white shrink-0"
    >
      <RefreshIcon className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
    </button>
  );
}

// Título con un tilde de acento en vez de la franja oscura de header que se
// repetía en cada panel (mismo tratamiento que Dashboard.jsx > Panel, para
// que los dos paneles internos se sientan parte del mismo sistema).
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
