import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  GlobeIcon,
  TagIcon,
  HelpCircleIcon,
  TrendUpIcon,
  SearchIcon,
  UsersIcon,
  PlusIcon,
  XIcon,
  PhoneCallIcon,
  DownloadIcon,
  LayoutIcon,
  EyeIcon,
  EyeOffIcon,
} from '../components/icons';
import { useApp } from '../context/AppContext';
import {
  apiAdminSummary,
  apiAdminSubscriptions,
  apiAdminSupportTickets,
  apiAdminListSites,
  apiAdminListUsers,
  apiAdminCreateUser,
  apiAdminSetFreeSubscriptions,
  apiAdminDeleteUser,
  apiAdminAnalyticsSummary,
  apiAdminListLeads,
  apiDownloadLeadsReport,
  apiDownloadAnalyticsReport,
  apiAdminListCatalogTemplates,
  apiAdminListCatalogRubros,
  apiAdminUpdateTemplate,
  apiAdminDeleteTemplate,
  apiAdminDeleteRubro,
  apiAdminGetSupportUnread,
  apiAdminMarkSupportSeen,
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
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'soporte', label: 'Soporte' },
  { id: 'versiones', label: 'Versiones' },
];

const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

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
          {section === 'resumen' && <ResumenSection summary={summary} tickets={tickets} />}
          {section === 'analytics' && <AnalyticsSection />}
          {section === 'leads' && <LeadsSection />}
          {section === 'paginas' && (
            <PaginasSection sites={sites} onEdit={editSite} onToggleLock={toggleLock} onTogglePublish={togglePublish} />
          )}
          {section === 'plantillas' && (
            <PlantillasSection
              templates={customTemplatesList}
              rubros={customRubrosList}
              onTogglePublished={toggleTemplatePublished}
              onDeleteTemplate={deleteTemplate}
              onDeleteRubro={deleteRubro}
            />
          )}
          {section === 'suscripciones' && <SuscripcionesSection subscriptions={subscriptions} />}
          {section === 'usuarios' && (
            <UsuariosSection
              users={users}
              onCreate={createUser}
              onSetFreeSubscriptions={setFreeSubscriptions}
              onDelete={deleteUser}
            />
          )}
          {section === 'soporte' && (
            <SoporteSection tickets={tickets} currentUserId={user.id} unreadIds={unreadSupport.tickets.map((t) => t.id)} />
          )}
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
    <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:sticky lg:top-10 -mx-1 px-1 lg:mx-0 lg:px-0">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`shrink-0 flex items-center gap-2 text-left px-3.5 py-2.5 text-sm font-semibold border-l-2 transition-colors ${
            section === item.id
              ? 'border-gold-500 bg-white/5 text-white'
              : 'border-transparent text-ink-400 hover:text-white hover:bg-white/5'
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

function ResumenSection({ summary, tickets }) {
  const ingresoMensual = (summary?.paidSites ?? 0) * PLAN.precio;

  const kpis = [
    { label: 'Cuentas registradas', value: summary?.totalUsers, icon: GlobeIcon },
    { label: 'Suscripciones activas', value: summary?.publishedSites, icon: TrendUpIcon },
    {
      label: 'Ingreso mensual estimado',
      value: summary ? `$${ingresoMensual.toLocaleString('es-AR')}` : undefined,
      icon: TagIcon,
    },
    { label: 'Consultas de soporte', value: summary?.totalTickets, icon: HelpCircleIcon },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">Panel de administración</h1>
        <p className="text-ink-400 text-sm mt-1">KPIs generales de SitioWeb Digital.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="border border-white/10 bg-navy-850 p-4">
            <div className="flex items-center justify-between mb-2">
              <k.icon className="w-4 h-4 text-gold-500" />
            </div>
            <p className="font-display text-2xl font-bold">{k.value ?? '—'}</p>
            <p className="text-xs text-ink-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-3">Últimas consultas</p>
      {tickets.length === 0 ? (
        <p className="text-sm text-ink-400">Todavía no hay consultas de soporte.</p>
      ) : (
        <div className="space-y-2">
          {tickets.slice(0, 3).map((t) => (
            <div key={t.id} className="border border-white/10 bg-navy-850 px-4 py-3">
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

// Embudo de conversión + ranking de clics (ver Admin > Analytics). Los datos
// vienen de analytics_events, armados a partir de los eventos que dispara
// src/utils/analytics.js en toda la app (landing, quiz, checkout, etc.).
// Exportado además de usarse acá adentro: lo reutiliza tal cual la cuenta
// de rol "analytics" en su propio panel acotado (ver AnalyticsHome.jsx).
export function AnalyticsSection() {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    setAnalytics(null);
    apiAdminAnalyticsSummary({ period: period === 'all' ? undefined : period }).then(setAnalytics);
  }, [period]);

  if (!analytics) {
    return (
      <Panel icon={<TrendUpIcon className="w-4 h-4 text-gold-500" />} title="Analytics">
        <p className="text-sm text-ink-400">Cargando datos...</p>
      </Panel>
    );
  }

  const { totalSessions, funnel, topClicks, topPages, dailySessions, weeklySessions, monthlySessions, hourlyDistribution } =
    analytics;
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
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="border border-white/10 bg-navy-850 p-4">
          <p className="font-display text-2xl font-bold">{totalSessions}</p>
          <p className="text-xs text-ink-400 mt-0.5">Sesiones registradas</p>
        </div>
        <div className="border border-white/10 bg-navy-850 p-4">
          <p className="font-display text-2xl font-bold">{funnel[funnel.length - 1]?.count ?? 0}</p>
          <p className="text-xs text-ink-400 mt-0.5">Páginas publicadas (del embudo)</p>
        </div>
        <div className="border border-white/10 bg-navy-850 p-4">
          <p className="font-display text-2xl font-bold">{conversionTotal}%</p>
          <p className="text-xs text-ink-400 mt-0.5">Conversión landing → publicada</p>
        </div>
      </div>

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
        <Panel icon={<TrendUpIcon className="w-4 h-4 text-gold-500" />} title="Botones más tocados">
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

        <Panel icon={<GlobeIcon className="w-4 h-4 text-gold-500" />} title="Páginas más vistas">
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

  useEffect(() => {
    setLoading(true);
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
  }, [page, period, query]);

  const totalPages = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE));

  return (
    <Panel icon={<PhoneCallIcon className="w-4 h-4 text-gold-500" />} title="Leads del quiz">
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
                  <tr key={l.id} className="border-b border-white/5">
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
                          className="px-3 py-1.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-xs inline-block whitespace-nowrap"
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
function PlantillasSection({ templates, rubros, onTogglePublished, onDeleteTemplate, onDeleteRubro }) {
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
      <Panel icon={<LayoutIcon className="w-4 h-4 text-gold-500" />} title="Plantillas creadas por el admin">
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
                  <tr key={t.id} className="border-b border-white/5">
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
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => editar(t.id)}
                          disabled={editingId === t.id}
                          className="px-3 py-1.5 border border-gold-500/30 hover:bg-gold-500/10 disabled:opacity-50 transition-colors text-xs font-semibold text-gold-400"
                        >
                          {editingId === t.id ? 'Abriendo...' : 'Editar'}
                        </button>
                        <button
                          onClick={() => onTogglePublished(t.id, t.published)}
                          className={`px-3 py-1.5 border transition-colors text-xs font-semibold ${
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
                          className="px-3 py-1.5 border border-white/15 hover:bg-white/5 transition-colors text-xs font-semibold text-white"
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

      <Panel icon={<TagIcon className="w-4 h-4 text-gold-500" />} title="Rubros creados">
        <p className="text-sm text-ink-400 mb-4">
          Además de los 6 de fábrica (gastronomía, belleza, oficios, comercio, salud, otro) — se crean desde el
          mismo modal de "Guardar como plantilla" en el editor.
        </p>
        {rubros.length === 0 ? (
          <p className="text-sm text-ink-400">Todavía no se creó ningún rubro nuevo.</p>
        ) : (
          <div className="space-y-2">
            {rubros.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 border border-white/10 bg-navy-900 px-4 py-2.5">
                <span className="inline-flex items-center gap-2 text-sm">
                  <span>{r.icon}</span>
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
function PaginasSection({ sites, onEdit, onToggleLock, onTogglePublish }) {
  const [query, setQuery] = useState('');

  const norm = (v) => (v ?? '').toString().toLowerCase();
  const q = norm(query).trim();
  const filtered = q
    ? sites.filter((s) => norm(s.id).includes(q) || norm(s.email).includes(q) || norm(s.nombre).includes(q))
    : sites;

  return (
    <Panel icon={<GlobeIcon className="w-4 h-4 text-gold-500" />} title="Todas las páginas">
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
                <th className="pb-2 pr-4 font-semibold">Estado</th>
                <th className="pb-2 pr-4 font-semibold">Edición</th>
                <th className="pb-2 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="py-2.5 pr-4 font-mono text-ink-400">{s.id}</td>
                  <td className="py-2.5 pr-4 font-semibold">{s.nombre || '—'}</td>
                  <td className="py-2.5 pr-4 text-ink-300">
                    {s.email}
                    {(s.freeSubscriptions ?? 0) > 0 && (
                      <span className="ml-2 text-xs font-semibold text-emerald-400">· Gratis</span>
                    )}
                  </td>
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
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => onTogglePublish(s.id, s.published)}
                        title="Despublica o vuelve a publicar la página — el dueño sigue pudiendo editarla."
                        className={`px-3 py-1.5 border transition-colors text-xs font-semibold ${
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
                        className={`px-3 py-1.5 border transition-colors text-xs font-semibold ${
                          s.locked
                            ? 'border-white/15 hover:bg-white/5 text-white'
                            : 'border-amber-500/30 hover:bg-amber-500/10 text-amber-300'
                        }`}
                      >
                        {s.locked ? 'Reanudar edición' : 'Pausar edición'}
                      </button>
                      <button
                        onClick={() => onEdit(s.id)}
                        className="px-3 py-1.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-xs"
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

function SuscripcionesSection({ subscriptions }) {
  const total = subscriptions.filter((s) => (s.freeSubscriptions ?? 0) <= 0).length * PLAN.precio;

  return (
    <Panel icon={<TagIcon className="w-4 h-4 text-gold-500" />} title="Suscripciones activas">
      <p className="text-sm text-ink-300 mb-1">
        {PLAN.nombre} — ${PLAN.precio.toLocaleString('es-AR')} {PLAN.moneda}/{PLAN.ciclo} por página publicada.
      </p>
      <p className="font-display text-2xl font-bold mt-2 mb-6">
        ${total.toLocaleString('es-AR')}
        <span className="text-sm font-medium text-ink-400"> {PLAN.moneda}/mes en total</span>
      </p>

      {subscriptions.length === 0 ? (
        <p className="text-sm text-ink-400">Todavía no hay páginas publicadas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-500 border-b border-white/10">
                <th className="pb-2 pr-4 font-semibold">Página</th>
                <th className="pb-2 pr-4 font-semibold">Cuenta</th>
                <th className="pb-2 pr-4 font-semibold">Desde</th>
                <th className="pb-2 font-semibold text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => {
                const isFree = (s.freeSubscriptions ?? 0) > 0;
                return (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="py-2.5 pr-4 font-semibold">{s.nombre || '—'}</td>
                    <td className="py-2.5 pr-4 text-ink-300">{s.email}</td>
                    <td className="py-2.5 pr-4 text-ink-500">
                      {new Date(s.updatedAt).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-2.5 text-right">
                      {isFree ? (
                        <span className="text-emerald-400 font-semibold">Gratis (cuenta de prueba)</span>
                      ) : (
                        <span className="text-ink-200">${PLAN.precio.toLocaleString('es-AR')}/mes</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// Alta de cuentas y gestión de suscripciones gratuitas (cuentas de prueba a
// las que se les regala el servicio) — no cuentan como ingreso en
// Suscripciones/Resumen mientras freeSubscriptions sea >= 1.
function UsuariosSection({ users, onCreate, onSetFreeSubscriptions, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'usuario', freeSubscriptions: 0 });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <Panel icon={<UsersIcon className="w-4 h-4 text-gold-500" />} title="Usuarios">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-400">
          Creá cuentas directo (por ejemplo para clientes de prueba) y asigná suscripciones gratuitas.
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-xs"
        >
          {showForm ? <XIcon className="w-3.5 h-3.5" /> : <PlusIcon className="w-3.5 h-3.5" />}
          {showForm ? 'Cancelar' : 'Crear usuario'}
        </button>
      </div>

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
                <th className="pb-2 pr-4 font-semibold">Alta</th>
                <th className="pb-2 pr-4 font-semibold text-right">Suscripciones gratuitas</th>
                <th className="pb-2 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRow key={u.id} u={u} onSetFreeSubscriptions={onSetFreeSubscriptions} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function UserRow({ u, onSetFreeSubscriptions, onDelete }) {
  const [value, setValue] = useState(u.freeSubscriptions);
  const dirty = Number(value) !== Number(u.freeSubscriptions);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  return (
    <tr className="border-b border-white/5">
      <td className="py-2.5 pr-4 font-semibold">{u.name}</td>
      <td className="py-2.5 pr-4 text-ink-300">{u.email}</td>
      <td className="py-2.5 pr-4">
        <span
          className={`text-xs font-semibold ${
            u.role === 'admin' ? 'text-gold-500' : u.role === 'analytics' ? 'text-sky-400' : 'text-ink-400'
          }`}
        >
          {u.role === 'admin' ? 'Admin' : u.role === 'analytics' ? 'Analytics' : 'Usuario'}
        </span>
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
            className="px-2.5 py-1.5 border border-white/15 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold text-white"
          >
            Guardar
          </button>
        </div>
      </td>
      <td className="py-2.5 text-right">
        {u.role === 'admin' ? (
          <span className="text-xs text-ink-500 italic">No se puede eliminar</span>
        ) : confirming ? (
          <div className="inline-flex items-center gap-2">
            {deleteError && <span className="text-xs text-red-400">{deleteError}</span>}
            <button
              onClick={confirmarEliminar}
              disabled={deleting}
              className="px-2.5 py-1.5 bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 disabled:opacity-50 transition-colors text-xs font-semibold"
            >
              {deleting ? 'Eliminando...' : 'Confirmar'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="px-2.5 py-1.5 border border-white/15 hover:bg-white/5 transition-colors text-xs font-semibold text-white"
            >
              Volver
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="px-2.5 py-1.5 border border-white/15 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-colors text-xs font-semibold text-white"
          >
            Eliminar
          </button>
        )}
      </td>
    </tr>
  );
}

// Todas las consultas de soporte de todos los usuarios (a diferencia del
// Dashboard del usuario, que solo ve las propias). Al abrir una, el admin
// puede seguir el chat completo y responderle directo a esa cuenta.
function SoporteSection({ tickets, currentUserId, unreadIds = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <Panel icon={<HelpCircleIcon className="w-4 h-4 text-gold-500" />} title="Todas las consultas de soporte">
      {tickets.length === 0 ? (
        <p className="text-sm text-ink-400">Todavía no hay consultas de soporte.</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const isOpen = expandedId === t.id;
            return (
              <div key={t.id} className="border border-white/10 bg-navy-900">
                <button
                  onClick={() => setExpandedId(isOpen ? null : t.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    {unreadIds.includes(t.id) && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-label="Mensaje nuevo" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{t.asunto}</p>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {t.userName} · {t.userEmail} ·{' '}
                        {new Date(t.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-ink-500 shrink-0">{isOpen ? 'Ocultar' : 'Ver'}</span>
                </button>
                {isOpen && <SupportThread ticketId={t.id} currentUserId={currentUserId} />}
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
function VersionesSection() {
  return (
    <Panel icon={<LayoutIcon className="w-4 h-4 text-gold-500" />} title="Versiones">
      <div className="space-y-6">
        {CHANGELOG.map((entry) => (
          <div key={entry.version} className="border border-white/10 bg-navy-900 p-4">
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

function Panel({ icon, title, children }) {
  return (
    <div className="border border-white/10 bg-navy-850 overflow-hidden">
      <div className="bg-navy-950 border-b border-white/8 px-5 py-3.5 flex items-center gap-2">
        {icon}
        <span className="text-white font-semibold text-sm">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
