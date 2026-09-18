import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SitePreview from '../components/SitePreview';
import Logo from '../components/Logo';
import SupportTicketList from '../components/support/SupportTicketList';
import NewTicketModal from '../components/support/NewTicketModal';
import SupportToast from '../components/support/SupportToast';
import { MenuIcon, ChevronDownIcon } from '../components/icons';
import { useApp } from '../context/AppContext';
import { PLAN, slugify, getTemplateById } from '../data/mockData';
import { hydrateSite } from '../utils/siteSchema';
import {
  apiGetSupportUnread,
  apiMarkSupportSeen,
  apiRefreshSubscription,
  apiUnpublishSite,
  apiListDevOrders,
  apiCreateDevOrder,
  apiShareDevOrder,
  apiUpdateDevOrderVenta,
} from '../api/client';
import { ROOT_DOMAIN } from '../utils/rootDomain';
import { uploadImage } from '../utils/uploadImage';
import { validateImageFile } from '../utils/imageValidation';

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

// Código corto para identificar cada página en la tabla (más fácil de leer
// en voz alta que el id crudo) — se deriva de forma estable del id real de
// cada página, así no cambia entre renders.
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
    setPublished,
    supportTickets,
    addSupportTicket,
    templates,
    mySites,
    fetchMySites,
    switchSite,
    startNewSite,
    cancelSubscription,
    shareSite,
  } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // El mail de "orden lista" (ver sendDevOrderReadyEmail en el backend)
  // linkea directo a ?tab=ordenes — sin esto, quien lo abre cae siempre en
  // Resumen y tiene que ir a buscar la pestaña a mano.
  const [section, setSection] = useState(searchParams.get('tab') === 'ordenes' ? 'ordenes' : 'resumen');
  // El modal vive afuera del contenedor con `animate-fade-in-up`: esa clase
  // deja un `transform` (aunque sea "sin desplazamiento") aplicado al
  // terminar la animación, y eso arma un nuevo contenedor para todo lo que
  // esté `fixed` adentro — el modal quedaba centrado contra ese div en vez
  // de contra la ventana entera.
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [unreadSupport, setUnreadSupport] = useState({ count: 0, tickets: [] });
  const [supportToast, setSupportToast] = useState(null);
  const [ordenesNuevas, setOrdenesNuevas] = useState(0);
  const [ordenToast, setOrdenToast] = useState(null);
  // Qué órdenes "lista sin compartir" ya vio el vendedor — sin esto, la
  // insignia/aviso seguían mostrando el mismo conteo aunque ya hubiera
  // entrado a "Mis órdenes" y las tuviera a la vista (probado en vivo,
  // 2026-09-18). No hay campo en el backend para esto (a diferencia de
  // soporte, que sí tiene support_last_seen_at) — alcanza con recordarlo acá
  // nomás: una orden recién SIGUE contando como pendiente de compartir hasta
  // que de verdad se comparte, esto solo apaga el AVISO una vez que ya se
  // vio la lista.
  const dismissedOrderIdsRef = useRef(new Set());

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

  // Mismo mecanismo que el sondeo de soporte de arriba, para "órdenes
  // listas que todavía no compartiste" (estado === 'lista' sin share_token
  // — el token ya indica de por sí si se compartió alguna vez, no hace
  // falta un flag nuevo). Corre siempre que el Dashboard esté abierto, no
  // solo parado en "Mis órdenes", para que la insignia y el aviso avisen
  // igual desde Resumen.
  useEffect(() => {
    if (!user || (user.role !== 'vendedor' && user.role !== 'admin')) return undefined;
    let cancelado = false;
    const check = async () => {
      const orders = await apiListDevOrders();
      if (cancelado) return;
      const sinCompartir = orders
        .filter((o) => o.estado === 'lista' && !o.shareToken)
        .filter((o) => !dismissedOrderIdsRef.current.has(o.id));
      setOrdenesNuevas((prev) => {
        if (sinCompartir.length > prev) setOrdenToast(sinCompartir);
        return sinCompartir.length;
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

  // Al entrar a "Mis órdenes" se apaga la insignia/aviso — trae la lista
  // fresca (no confía en lo último que haya traído el sondeo, que puede
  // tener hasta 10s de desfasaje) y marca esas órdenes como ya vistas, así
  // el próximo sondeo no las vuelve a contar. Una orden nueva de verdad
  // (una distinta, no vista todavía) sigue avisando igual.
  useEffect(() => {
    if (section !== 'ordenes' || !user || (user.role !== 'vendedor' && user.role !== 'admin')) return;
    setOrdenToast(null);
    apiListDevOrders().then((orders) => {
      orders
        .filter((o) => o.estado === 'lista' && !o.shareToken)
        .forEach((o) => dismissedOrderIdsRef.current.add(o.id));
      setOrdenesNuevas(0);
    });
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

  // Todas las páginas de la cuenta — se trae al entrar y se vuelve a
  // sondear cada 10s mientras el Dashboard está abierto (mismo motivo que
  // antes: si el webhook confirma un pago o soporte cancela algo del otro
  // lado, se nota sin tener que recargar). GET /api/sites ya trae el estado
  // real de Mercado Pago y los totales de visitas/WhatsApp de cada una, así
  // que no hace falta un sondeo aparte por fila.
  //
  // Además: por cada página que quede "pending"/"pending_redirect" (mandada
  // a pagar pero sin confirmación todavía), se pide un refresh puntual
  // contra Mercado Pago (mismo POST /subscription/:id/refresh que ya usa
  // SuscripcionConfirmar.jsx) — el webhook de Mercado Pago puede no llegar
  // nunca o tardar (probado en vivo, 2026-08-08: pagos ya autorizados en
  // Mercado Pago se quedaban sin aplicar en nuestra base porque el aviso
  // real no llegaba, a pesar de tener la config correcta del lado de MP),
  // así que el Dashboard no depende de él — en el peor caso, una página
  // recién pagada queda publicada sola dentro de los próximos 10s de estar
  // mirando esta pantalla, sin que el usuario tenga que hacer nada.
  useEffect(() => {
    if (!user) return undefined;
    let cancelado = false;
    const syncPendientes = async () => {
      const sites = await fetchMySites();
      if (cancelado) return;
      const pendientes = (sites || []).filter((s) => s.mpStatus === 'pending' || s.mpStatus === 'pending_redirect');
      if (pendientes.length === 0) return;
      await Promise.all(pendientes.map((s) => apiRefreshSubscription(s.id)));
      if (!cancelado) fetchMySites();
    };
    syncPendientes();
    const interval = setInterval(syncPendientes, 10000);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const pages = useMemo(
    () =>
      mySites.map((s) => {
        const hydrated = hydrateSite(s.data);
        const tmpl = hydrated?.templateId ? getTemplateById(hydrated.templateId, templates) : null;
        return {
          id: s.id,
          nombreNegocio: hydrated?.siteData?.nombreNegocio || '(sin nombre)',
          subdomain: s.subdomain,
          status: s.published ? 'publicada' : 'borrador',
          mpStatus: s.mpStatus,
          nextPaymentDate: s.nextPaymentDate,
          locked: s.locked,
          template: tmpl,
          siteData: hydrated?.siteData,
          theme: hydrated?.theme,
          logoUrl: hydrated?.logoUrl,
          kpis: { visitas: s.totalVisitas, whatsapp: s.totalWhatsapp },
          codigo: codigoPagina(String(s.id)),
        };
      }),
    [mySites, templates]
  );

  if (!user) return null;

  const primerNombre = user.name?.split(' ')[0] || user.email;
  const isVendedor = user.role === 'vendedor' || user.role === 'admin';
  // Un vendedor ya no arma páginas propias — solo carga órdenes de
  // desarrollo para que un developer las arme (ver OrdenesSection). Un
  // admin sigue pudiendo crear páginas directo, igual que un usuario común.
  const canCreateSites = user.role !== 'vendedor';
  // Suscripción es sobre PAGAR una página propia — sin poder armar ni
  // publicar páginas, un vendedor no tiene nada que hacer ahí (a diferencia
  // de admin, que sigue pudiendo tener sus propias páginas).
  const baseNavItems = user.role === 'vendedor' ? NAV_ITEMS.filter((i) => i.id !== 'suscripcion') : NAV_ITEMS;
  const navItems = isVendedor ? [...baseNavItems, { id: 'ordenes', label: 'Mis órdenes' }] : baseNavItems;

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
      {ordenToast && (
        <OrdenToast
          orders={ordenToast}
          onVer={() => setSection('ordenes')}
          onClose={() => setOrdenToast(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 grid lg:grid-cols-[200px_1fr] gap-8 items-start">
        <SideNav
          items={navItems}
          section={section}
          onChange={setSection}
          badges={{ soporte: unreadSupport.count, ordenes: ordenesNuevas }}
        />

        <div className="min-w-0 animate-fade-in-up">
          {section === 'resumen' && (
            <ResumenSection
              primerNombre={primerNombre}
              pages={pages}
              navigate={navigate}
              updateSubdomain={updateSubdomain}
              switchSite={switchSite}
              startNewSite={startNewSite}
              isFree={(user.freeSubscriptions ?? 0) > 0}
              canShare={user.role === 'vendedor' || user.role === 'admin'}
              canCreate={canCreateSites}
              shareSite={shareSite}
              onGoToOrdenes={() => setSection('ordenes')}
            />
          )}
          {section === 'suscripcion' && (
            <SubscriptionSection
              pages={pages}
              setPublished={setPublished}
              switchSite={switchSite}
              startNewSite={startNewSite}
              cancelSubscription={cancelSubscription}
              onChanged={fetchMySites}
              navigate={navigate}
              freeSubscriptions={user.freeSubscriptions ?? 0}
              canCreate={canCreateSites}
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
          {section === 'ordenes' && isVendedor && <OrdenesSection />}
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
      {/* Cuenta de marca blanca (ver users.white_label): reclamó una página
          armada vía el flujo developer-vendedor, así que su panel no debe
          mostrar el nombre "SitioWeb Digital" en ningún lado. */}
      {/* <span/> en vez de nada: este header es justify-between con el bloque
          de cuenta/cerrar-sesión como único otro hijo — sin un segundo nodo
          acá, ese bloque se corre a la izquierda en vez de quedarse a la
          derecha (probado en vivo, 2026-09-18). */}
      {user.whiteLabel ? <span /> : <Logo size="sm" />}
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

// `badges` es un mapa {itemId: número} en vez de un solo `unreadCount` fijo
// a "soporte" — Mis órdenes (vendedor) necesita su propia insignia (órdenes
// listas sin compartir) sin pisar la de soporte, y así cualquier pestaña
// nueva puede sumar la suya sin tocar este componente de nuevo.
//
// En celular es un desplegable tipo hamburguesa (botón con la pestaña
// actual + ícono, se abre una lista) en vez de la tira horizontal con
// scroll que había antes — probado en vivo, 2026-09-18: con 5-6 pestañas no
// se veían todas de entrada y había que scrollear para encontrar la que
// hacía falta, poco claro en un panel que se usa parado en la calle. El
// sidebar vertical de escritorio no cambia.
function SideNav({ items = NAV_ITEMS, section, onChange, badges = {} }) {
  const [open, setOpen] = useState(false);
  const current = items.find((i) => i.id === section) ?? items[0];
  const totalBadge = items.reduce((acc, i) => acc + (badges[i.id] ?? 0), 0);

  const select = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    // min-w-0: sin esto, este div (ítem de un grid de una sola columna en
    // celular) no se achica por debajo del ancho que pide su contenido —
    // un hijo con posición absoluta/contenido ancho podía agrandar la
    // GRILLA ENTERA de la página en vez de quedar contenido. Bug real,
    // confirmado en vivo 2026-09-18 (window.innerWidth pasaba de 390 a 617
    // apenas cargaba el Dashboard) — clásico de CSS grid/flex, min-
    // width:auto por default.
    <div className="relative lg:static min-w-0">
      {/* Celular: botón hamburguesa con la sección actual */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="lg:hidden w-full flex items-center justify-between gap-2 px-4 py-3 bg-navy-850 border border-white/10 rounded-lg text-sm font-semibold text-white"
        aria-expanded={open}
        aria-label="Abrir menú"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <MenuIcon className="w-4 h-4 shrink-0 text-gold-500" />
          <span className="truncate">{current.label}</span>
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {totalBadge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-white text-[0.68rem] font-bold leading-none">
              {totalBadge > 9 ? '9+' : totalBadge}
            </span>
          )}
          <ChevronDownIcon className={`w-4 h-4 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <>
          {/* Fondo para cerrar tocando afuera — no bloquea el resto de la
              pantalla (sin overlay oscuro), solo captura el primer toque. */}
          <div className="lg:hidden fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="lg:hidden absolute z-20 top-full left-0 right-0 mt-1.5 bg-navy-850 border border-white/10 rounded-lg shadow-2xl overflow-hidden">
            {items.map((item) => {
              const badge = badges[item.id] ?? 0;
              return (
                <button
                  key={item.id}
                  onClick={() => select(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-left border-b border-white/5 last:border-b-0 transition-colors ${
                    section === item.id ? 'bg-gold-500 text-navy-950' : 'text-ink-300 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                  {badge > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-white text-[0.68rem] font-bold leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Escritorio: sidebar vertical de siempre */}
      <nav className="hidden lg:flex lg:flex-col gap-1 lg:sticky lg:top-10 lg:bg-black/20 lg:border lg:border-white/5 lg:rounded-xl lg:p-1.5">
        {items.map((item) => {
          const badge = badges[item.id] ?? 0;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex items-center gap-2 text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                section === item.id
                  ? 'bg-gold-500 text-navy-950 shadow-[0_2px_14px_-4px_rgba(255,193,7,0.5)]'
                  : 'text-ink-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
              {badge > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-white text-[0.68rem] font-bold leading-none">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function OrdenToast({ orders, onVer, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 border border-gold-500/40 bg-navy-850 shadow-2xl p-4 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white">
          {orders.length === 1
            ? `${orders[0].nombreNegocio} ya está lista`
            : `${orders.length} órdenes están listas para compartir`}
        </p>
        <button onClick={onClose} className="text-ink-500 hover:text-white transition-colors shrink-0" aria-label="Cerrar">
          ✕
        </button>
      </div>
      <p className="text-xs text-ink-400 mt-1.5">Todavía no le mandaste el link al cliente.</p>
      <button
        onClick={onVer}
        className="mt-3 w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-sm py-2 transition-colors"
      >
        Ver en Mis órdenes →
      </button>
    </div>
  );
}

// KPIs primero (arriba de todo, antes de la lista de páginas): son agregados
// de las páginas publicadas, mismos íconos que /estadisticas para que se
// sienta el mismo dato en los dos lugares.
function ResumenSection({
  primerNombre,
  pages,
  navigate,
  updateSubdomain,
  switchSite,
  startNewSite,
  isFree,
  canShare,
  canCreate,
  shareSite,
  onGoToOrdenes,
}) {
  // Un vendedor no tiene páginas propias que mirar — mostrarle "Páginas
  // activas"/"Visitas totales"/"Clics en WhatsApp" (métricas de tráfico de
  // una página que ni arma ni publica) es el mismo Resumen que ve un
  // cliente común, sin que le sirva de nada. Lo que sí le interesa es su
  // propia actividad de ventas — ver ResumenVendedor más abajo.
  if (!canCreate) return <ResumenVendedor primerNombre={primerNombre} onGoToOrdenes={onGoToOrdenes} />;

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
        {canCreate && (
          <button
            onClick={() => {
              startNewSite();
              navigate('/quiz');
            }}
            data-track="dashboard_crear_pagina"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-xs"
          >
            Crear nueva página
          </button>
        )}
      </div>
      <div className="space-y-3">
        {pages.map((p) => (
          <PageRow
            key={p.id}
            page={p}
            navigate={navigate}
            updateSubdomain={updateSubdomain}
            switchSite={switchSite}
            isFree={isFree}
            canShare={canShare}
            shareSite={shareSite}
            readOnly={!canCreate}
          />
        ))}
        {pages.length === 0 && (
          <div className="border border-dashed border-white/15 bg-navy-850 p-6 text-center">
            {canCreate ? (
              <>
                <p className="text-ink-400 text-sm mb-4">Todavía no tenés una página propia.</p>
                <button
                  onClick={() => {
                    startNewSite();
                    navigate('/quiz');
                  }}
                  className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-sm"
                >
                  Crear mi página web
                </button>
              </>
            ) : (
              <p className="text-ink-400 text-sm">
                Todavía no tenés páginas propias — cargá una orden de desarrollo en "Mis órdenes" para que un
                developer arme una.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Resumen del vendedor: actividad de ventas (órdenes/páginas vendidas,
// monto, cuotas en cobro) en vez de tráfico de páginas — ver el porqué en
// ResumenSection. Trae sus propios datos (mismo criterio que OrdenesSection
// y el sondeo de notificaciones: GET /api/dev-orders ya devuelve solo las
// del vendedor logueado, sin filtro server-side aparte que armar).
function ResumenVendedor({ primerNombre, onGoToOrdenes }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiListDevOrders().then((o) => {
      setOrders(o);
      setLoading(false);
    });
  }, []);

  const vendidas = orders.filter((o) => o.vendida);
  const montoTotal = vendidas.reduce((acc, o) => acc + Number(o.montoTotal || 0), 0);
  const enCobro = vendidas.filter((o) => (o.cuotaActual ?? 0) < (o.cantidadCuotas ?? 0)).length;

  const kpis = [
    { label: 'Órdenes cargadas', value: loading ? '—' : String(orders.length) },
    { label: 'Páginas vendidas', value: loading ? '—' : String(vendidas.length) },
    { label: 'Monto total vendido', value: loading ? '—' : `$${montoTotal.toLocaleString('es-AR')}` },
    { label: 'En cobro', value: loading ? '—' : String(enCobro) },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">Hola, {primerNombre}</h1>
        <p className="text-ink-400 text-sm mt-1">Así viene tu actividad de ventas.</p>
      </div>

      <StatStrip items={kpis} cols={4} />

      <div className="border border-dashed border-white/15 bg-navy-850 p-6 text-center">
        <p className="text-ink-400 text-sm mb-4">
          {orders.length === 0
            ? 'Todavía no cargaste ninguna orden de desarrollo.'
            : 'Cargá una orden nueva o seguí el estado de las que ya tenés.'}
        </p>
        <button
          onClick={onGoToOrdenes}
          className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-sm"
        >
          Ir a Mis órdenes
        </button>
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

function PageRow({ page, navigate, updateSubdomain, switchSite, isFree, canShare, shareSite, readOnly = false }) {
  const status = STATUS_INFO[page.status];
  const proximoCobro =
    page.status === 'publicada' && !isFree && page.mpStatus === 'authorized' && page.nextPaymentDate
      ? new Date(page.nextPaymentDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;
  const [shareLink, setShareLink] = useState('');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    setCopied(false);
    const result = await shareSite(page.id);
    setSharing(false);
    if (!result.ok) return;
    setShareLink(`${window.location.origin}/#/compartida/${result.shareToken}`);
  };

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
            {/* Un vendedor no arma ni publica páginas (ver readOnly más
                abajo) — tampoco tiene por qué poder cambiarle el dominio a
                una que sea dueño por herencia de antes de esa regla. */}
            {!readOnly && <DomainEditor page={page} updateSubdomain={updateSubdomain} />}
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
          {readOnly ? (
            // Un vendedor no arma ni publica páginas (ver canCreateSites) —
            // si de todos modos es dueño de una (herencia de antes de esta
            // regla, o un caso raro), acá solo puede mirarla, nunca tocarla.
            page.status === 'publicada' && (
              <RowButton
                onClick={() => window.open(`https://${page.subdomain}.${ROOT_DOMAIN}`, '_blank', 'noopener,noreferrer')}
                primary
              >
                Ver
              </RowButton>
            )
          ) : page.status === 'publicada' ? (
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
                <RowButton
                  onClick={async () => {
                    await switchSite(page.id);
                    navigate('/editor');
                  }}
                >
                  Editar
                </RowButton>
              )}
              <RowButton
                onClick={async () => {
                  await switchSite(page.id);
                  navigate('/estadisticas');
                }}
              >
                Estadísticas
              </RowButton>
              <RowButton
                onClick={async () => {
                  await switchSite(page.id);
                  navigate('/turnos');
                }}
              >
                Turnos
              </RowButton>
            </>
          ) : (
            <>
              <RowButton
                onClick={async () => {
                  await switchSite(page.id);
                  navigate('/checkout');
                }}
                primary
              >
                Publicar
              </RowButton>
              {page.locked ? (
                <span className="px-3 py-2 text-xs font-semibold text-ink-500 italic">Edición pausada</span>
              ) : (
                <RowButton
                  onClick={async () => {
                    await switchSite(page.id);
                    navigate('/editor');
                  }}
                >
                  Editar
                </RowButton>
              )}
              {canShare && (
                <RowButton onClick={handleShare}>{sharing ? 'Generando...' : 'Compartir'}</RowButton>
              )}
            </>
          )}
        </div>
      </div>

      {shareLink && (
        <div className="w-full sm:ml-44 border border-gold-500/30 bg-gold-500/5 p-3 flex flex-wrap items-center gap-2">
          <p className="text-xs text-ink-300 shrink-0">
            Link para el prospecto — al abrirlo ve la página armada y solo le falta pagar:
          </p>
          <input
            readOnly
            value={shareLink}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-[200px] bg-navy-900 border border-white/10 px-2 py-1.5 text-xs text-gold-400 outline-none"
          />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(shareLink);
              setCopied(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
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
function SubscriptionSection({
  pages,
  setPublished,
  switchSite,
  startNewSite,
  cancelSubscription,
  onChanged,
  navigate,
  freeSubscriptions,
  canCreate,
}) {
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
            switchSite={switchSite}
            cancelSubscription={cancelSubscription}
            onChanged={onChanged}
            navigate={navigate}
            isFree={isFree}
          />
        ))}
      </div>

      {pages.length === 0 && canCreate && <p className="text-xs text-ink-500 mt-4">Creá tu página para activar un plan.</p>}

      {canCreate && (
        <button
          onClick={() => {
            startNewSite();
            navigate('/quiz');
          }}
          data-track="dashboard_crear_pagina"
          className="inline-flex items-center gap-1.5 mt-5 px-3 py-1.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-xs"
        >
          Crear nueva página
        </button>
      )}
    </Panel>
  );
}

function SubscriptionRow({ page, setPublished, switchSite, cancelSubscription, onChanged, navigate, isFree }) {
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
      // despublicar. Esta fila puede no ser la que está cargada en el
      // editor ahora mismo — hay que engancharse a ELLA primero. El
      // despublicado pasa por un endpoint dedicado (no por el guardado
      // general del editor), para no arriesgar que un autoguardado con
      // estado viejo en memoria pise una suscripción paga (ver
      // POST /sites/:id/unpublish).
      await switchSite(page.id);
      const result = await apiUnpublishSite(page.id);
      if (!result.ok) {
        setError(result.error || 'No se pudo despublicar la página. Probá de nuevo.');
        setBusy(false);
        return;
      }
      setPublished(false);
    } else {
      const result = await cancelSubscription(page.id);
      if (!result.ok) {
        setError(result.error || 'No se pudo cancelar la suscripción. Probá de nuevo.');
        setBusy(false);
        return;
      }
    }
    await onChanged?.();
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
            <RowButton
              onClick={async () => {
                await switchSite(page.id);
                navigate('/checkout');
              }}
              primary
            >
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
    const result = await updateSubdomain(page.id, value.trim());
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

const ORDEN_ESTADO_INFO = {
  pendiente: { label: 'Pendiente', textClass: 'text-ink-400', dotClass: 'bg-ink-500' },
  en_progreso: { label: 'En progreso', textClass: 'text-gold-400', dotClass: 'bg-gold-500' },
  lista: { label: 'Lista', textClass: 'text-emerald-400', dotClass: 'bg-emerald-400' },
};

// Vista del vendedor sobre el flujo developer: cargar una orden de
// desarrollo (el developer la agarra y arma la página aparte, ver
// DevPanel.jsx) y, una vez "lista", compartirla y llevar el registro manual
// de la venta (cuotas) — no reemplaza el "Compartir" de páginas propias en
// ResumenSection, es un circuito paralelo para páginas que arma otra
// persona.
const ORDENES_FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'en_progreso', label: 'En progreso' },
  { id: 'lista', label: 'Lista' },
];

function OrdenesSection() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');

  const reload = async () => {
    setOrders(await apiListDevOrders());
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtro en el cliente, no un fetch nuevo por letra — GET /api/dev-orders
  // ya trae todas las del vendedor de una, y la cantidad típica (decenas,
  // no miles) no justifica ida y vuelta al servidor por cada tecla.
  const ordersFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return orders.filter((o) => {
      if (filtroEstado !== 'todas' && o.estado !== filtroEstado) return false;
      if (!q) return true;
      return o.nombreNegocio?.toLowerCase().includes(q) || o.telefonoCliente?.toLowerCase().includes(q);
    });
  }, [orders, busqueda, filtroEstado]);

  const nuevaOrdenBtn = (
    <button
      onClick={() => setFormOpen(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-xs"
    >
      + Nueva orden
    </button>
  );

  return (
    <div className="space-y-5">
      <Panel title="Mis órdenes" action={nuevaOrdenBtn}>
        {orders.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por negocio o teléfono..."
              className="flex-1 min-w-0 border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
            />
            <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {ORDENES_FILTROS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroEstado(f.id)}
                  className={`shrink-0 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    filtroEstado === f.id
                      ? 'bg-gold-500 text-navy-950'
                      : 'bg-white/5 text-ink-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-xs text-ink-500">Cargando...</p>
        ) : orders.length === 0 ? (
          <div className="border border-dashed border-white/15 bg-navy-900 p-6 text-center">
            <p className="text-ink-400 text-sm mb-4">Todavía no cargaste ninguna orden.</p>
            <button
              onClick={() => setFormOpen(true)}
              className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-sm"
            >
              Cargar la primera
            </button>
          </div>
        ) : ordersFiltradas.length === 0 ? (
          <p className="text-xs text-ink-500">Ninguna orden coincide con la búsqueda/filtro.</p>
        ) : (
          <div className="space-y-2">
            {ordersFiltradas.map((o) => (
              <OrdenRow key={o.id} order={o} onChanged={reload} />
            ))}
          </div>
        )}
      </Panel>

      {/* Portal a document.body: esta sección vive adentro del contenedor
          con animate-fade-in-up del Dashboard, y un transform en un
          ancestro (aunque la animación ya haya terminado) arma un nuevo
          containing block para todo lo `fixed` adentro — el modal quedaba
          centrado contra ESE div en vez de contra la ventana entera (mismo
          bug que ya se había arreglado una vez para NewTicketModal,
          sacándolo del árbol en vez de anidarlo acá). El portal evita tener
          que repetir esa solución (sacar el estado a Dashboard) de nuevo. */}
      {formOpen &&
        createPortal(
          <NewOrdenModal
            onClose={() => setFormOpen(false)}
            onCreated={() => {
              setFormOpen(false);
              reload();
            }}
          />,
          document.body
        )}
    </div>
  );
}

// Antes eran 5 campos (Instagram y "otras redes sociales" por separado) —
// probado en vivo, 2026-09-18: ese segundo campo nunca se mostraba en
// ningún lado (ni DevPanel ni Admin lo leen), así que era carga sin
// ningún uso después. Se unifican en un solo campo de texto libre.
function NewOrdenModal({ onClose, onCreated }) {
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [redes, setRedes] = useState('');
  const [info, setInfo] = useState('');
  const [paletaColores, setPaletaColores] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onLogoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!(await validateImageFile(file, 'logo'))) return;
    setUploadingLogo(true);
    setLogoUrl(await uploadImage(file));
    setUploadingLogo(false);
  };

  // La venta (o una seña ya cobrada) a veces se cierra ANTES de mandarle la
  // orden al developer, no después — sin esto había que crear la orden y
  // después ir a buscarla en la lista para cargar algo que el vendedor ya
  // sabía al momento de cargarla. Colapsado por default porque la mayoría
  // de las veces no aplica.
  const [senaOpen, setSenaOpen] = useState(false);
  const [vendida, setVendida] = useState(false);
  const [montoTotal, setMontoTotal] = useState('');
  const [cantidadCuotas, setCantidadCuotas] = useState('');
  const [cuotaActual, setCuotaActual] = useState('');
  const [proximaCuota, setProximaCuota] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!nombreNegocio.trim() || !telefonoCliente.trim()) return;
    setBusy(true);
    setError('');
    const result = await apiCreateDevOrder({
      nombreNegocio: nombreNegocio.trim(),
      telefonoCliente: telefonoCliente.trim(),
      instagram: redes.trim(),
      info: info.trim(),
      paletaColores: paletaColores.trim(),
      logoUrl,
    });
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    // Solo pega el PATCH si de verdad cargó algo de la seña/venta — no tiene
    // sentido un segundo request vacío para el caso común (sin seña).
    if (senaOpen && (vendida || montoTotal || cantidadCuotas || proximaCuota)) {
      await apiUpdateDevOrderVenta(result.id, {
        vendida,
        montoTotal,
        cantidadCuotas,
        cuotaActual: cuotaActual || 0,
        proximaCuota,
      });
    }
    setBusy(false);
    onCreated();
  };

  const inputClass =
    'w-full border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors';
  const labelClass = 'block font-mono text-[0.65rem] uppercase tracking-[0.06em] text-ink-500 mb-1.5';

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-white/10 bg-navy-850 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-navy-950 border-b border-white/8 px-6 py-4 flex items-center justify-between gap-2">
          <span className="text-white font-semibold text-sm">Nueva orden de desarrollo</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-ink-400 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-3">
          <div>
            <label className={labelClass}>Nombre del negocio</label>
            <input
              required
              autoFocus
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              maxLength={80}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Teléfono del cliente</label>
            <input
              required
              value={telefonoCliente}
              onChange={(e) => setTelefonoCliente(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Redes sociales <span className="text-ink-500 normal-case">(opcional)</span>
            </label>
            <input
              value={redes}
              onChange={(e) => setRedes(e.target.value)}
              placeholder="Instagram, Facebook..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Paleta de colores <span className="text-ink-500 normal-case">(opcional)</span>
            </label>
            <input
              value={paletaColores}
              onChange={(e) => setPaletaColores(e.target.value)}
              placeholder="Ej: verde y blanco, o algún código de color"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Logo del cliente <span className="text-ink-500 normal-case">(opcional)</span>
            </label>
            {logoUrl ? (
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain bg-white border border-white/10" />
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="text-xs font-semibold text-ink-400 hover:text-red-300 transition-colors"
                >
                  Sacar
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-dashed border-white/20 hover:border-gold-500/60 transition-colors cursor-pointer text-sm text-ink-400">
                {uploadingLogo ? 'Subiendo...' : 'Subir archivo'}
                <input type="file" accept="image/*" className="hidden" onChange={onLogoFile} disabled={uploadingLogo} />
              </label>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Info importante para el developer <span className="text-ink-500 normal-case">(opcional)</span>
            </label>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              rows={3}
              placeholder="Referentes, algo que no tenga que preguntar..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <button
            type="button"
            onClick={() => setSenaOpen((v) => !v)}
            className="text-xs font-semibold text-gold-400 hover:text-gold-300 transition-colors"
          >
            {senaOpen ? '− Ocultar venta / seña' : '+ ¿Ya tenés una seña o algo acordado?'}
          </button>

          {senaOpen && (
            <div className="space-y-3 border-t border-white/10 pt-3">
              <label className="flex items-center gap-2 text-sm text-ink-200">
                <input
                  type="checkbox"
                  checked={vendida}
                  onChange={(e) => setVendida(e.target.checked)}
                  className="w-4 h-4"
                />
                Vendida
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Monto total</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={montoTotal}
                    onChange={(e) => setMontoTotal(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cant. cuotas</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={cantidadCuotas}
                    onChange={(e) => setCantidadCuotas(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cuota actual</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={cuotaActual}
                    onChange={(e) => setCuotaActual(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Próxima cuota</label>
                  <input
                    type="date"
                    value={proximaCuota}
                    onChange={(e) => setProximaCuota(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={!nombreNegocio.trim() || !telefonoCliente.trim() || busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold py-3 disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? 'Cargando...' : 'Cargar orden'}
          </button>
        </form>
      </div>
    </div>
  );
}

function OrdenRow({ order, onChanged }) {
  const estado = ORDEN_ESTADO_INFO[order.estado];
  const [shareLink, setShareLink] = useState('');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // El formulario de venta arranca CERRADO — un vendedor a pie de calle abre
  // esto en el celular con varias órdenes en la lista, y tener las 4 cajas
  // de cuotas siempre desplegadas en cada una (probado en vivo, 2026-09-18:
  // en una pantalla angosta los inputs de ancho fijo se amontonaban y las
  // etiquetas quedaban lejos de su campo) hacía difícil encontrar el botón
  // "Compartir" entre tanto campo. Cerrado muestra solo un resumen de una
  // línea; "Cargar venta"/"Editar venta" abre el formulario recién cuando
  // hace falta tocarlo.
  const [ventaOpen, setVentaOpen] = useState(false);
  const [vendida, setVendida] = useState(order.vendida);
  const [montoTotal, setMontoTotal] = useState(order.montoTotal ?? '');
  const [cantidadCuotas, setCantidadCuotas] = useState(order.cantidadCuotas ?? '');
  const [cuotaActual, setCuotaActual] = useState(order.cuotaActual ?? 0);
  const [proximaCuota, setProximaCuota] = useState(order.proximaCuota ? order.proximaCuota.slice(0, 10) : '');
  const [ventaBusy, setVentaBusy] = useState(false);
  const [ventaStatus, setVentaStatus] = useState(null);
  // Monto y cuotas quedan fijos una vez cargados — pedido explícito: es un
  // registro histórico, no algo que se pueda ir ajustando con el tiempo. El
  // servidor ya lo hace cumplir (ver devOrders.js PATCH /:id/venta); esto
  // solo evita mostrar campos editables que el guardado va a ignorar.
  const locked = order.vendida && order.montoTotal != null;

  const handleShare = async () => {
    setSharing(true);
    const result = await apiShareDevOrder(order.id);
    setSharing(false);
    if (!result.ok) return;
    setShareLink(`${window.location.origin}/#/compartida/${result.shareToken}`);
  };

  const saveVenta = async () => {
    setVentaBusy(true);
    setVentaStatus(null);
    const result = await apiUpdateDevOrderVenta(order.id, {
      vendida,
      montoTotal,
      cantidadCuotas,
      cuotaActual,
      proximaCuota,
    });
    setVentaBusy(false);
    setVentaStatus(result.ok ? { type: 'ok', msg: 'Guardado.' } : { type: 'error', msg: result.error });
    if (result.ok) onChanged();
  };

  const inputClass =
    'w-full border border-white/10 bg-navy-900 px-3 py-2.5 text-sm text-white outline-none focus:border-gold-500';
  const labelClass = 'block font-mono text-[0.6rem] uppercase tracking-[0.06em] text-ink-500 mb-1';

  return (
    <div className="border border-white/10 bg-navy-850 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display font-semibold truncate">{order.nombreNegocio}</p>
          <p className="text-xs text-ink-500 mt-0.5">{order.telefonoCliente}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 ${estado.textClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${estado.dotClass}`} />
          {estado.label}
          {order.developerNombre && ` · ${order.developerNombre}`}
        </span>
      </div>

      {/* Fila propia para Compartida/Nuevo + el estado del mantenimiento —
          antes compartía renglón con "Lista · [developer]" en un
          contenedor shrink-0 sin wrap, y con "Falta que paguen el
          mantenimiento" (texto largo) se superponían/rompían el layout.
          Probado en vivo, 2026-09-18. share_token ya indica de por sí si
          se compartió alguna vez, no hace falta un flag nuevo. */}
      {order.estado === 'lista' && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          {order.shareToken ? (
            <>
              <span className="text-[0.65rem] font-semibold text-ink-500 uppercase tracking-wide">Compartida</span>
              {/* Una vez compartida, lo que falta es que el cliente pague el
                  mantenimiento (reclama + arranca la suscripción real de
                  Mercado Pago, ver publicSites.js claim + subscription.js
                  start) — order.published/mpStatus vienen del sitio
                  vinculado, no hace falta nada nuevo para saberlo. */}
              {order.published ? (
                <span className="text-[0.65rem] font-semibold text-emerald-400 uppercase tracking-wide">
                  Mantenimiento pagado
                </span>
              ) : order.mpStatus === 'pending' || order.mpStatus === 'pending_redirect' ? (
                <span className="text-[0.65rem] font-semibold text-amber-400 uppercase tracking-wide">
                  Pago en proceso
                </span>
              ) : (
                <span className="text-[0.65rem] font-semibold text-ink-400 uppercase tracking-wide">
                  Falta que paguen el mantenimiento
                </span>
              )}
            </>
          ) : (
            <span className="px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide bg-red-500 text-white rounded">
              Nuevo
            </span>
          )}
        </div>
      )}

      {/* La venta (o una seña ya cobrada) puede negociarse ANTES de que el
          developer termine la página — este bloque ya no depende de
          estado === 'lista', solo "Compartir" (que sí necesita el sitio
          armado) queda condicionado a eso. */}
      <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
        {/* No hay un link "en vivo" para mostrar acá todavía — este sitio
            recién tiene subdominio y queda publicado cuando el CLIENTE lo
            reclama y paga (ver publicSites.js claim + subscription.js).
            El link de "Compartir" de acá abajo ya arma la vista previa
            real (mismo /#/compartida que ve el cliente), así que "Abrir"
            apunta ahí en vez de a un subdominio que todavía no existe. */}
        <div className="flex flex-wrap items-center gap-2">
          {order.estado === 'lista' && (
            <RowButton onClick={handleShare} primary>
              {sharing ? 'Generando...' : 'Compartir'}
            </RowButton>
          )}
          <RowButton onClick={() => setVentaOpen((v) => !v)}>
            {ventaOpen ? 'Cerrar' : locked ? 'Actualizar cuota' : vendida ? 'Editar venta' : 'Cargar venta / seña'}
          </RowButton>
        </div>

          {shareLink && (
            <div className="border border-gold-500/30 bg-gold-500/5 p-3 flex flex-wrap items-center gap-2">
              <input
                readOnly
                value={shareLink}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-[200px] bg-navy-900 border border-white/10 px-2 py-1.5 text-xs text-gold-400 outline-none"
              />
              <button
                type="button"
                onClick={() => window.open(shareLink, '_blank', 'noopener,noreferrer')}
                className="px-3 py-1.5 text-xs font-semibold border border-white/15 hover:bg-white/5 transition-colors text-white"
              >
                Abrir
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(shareLink);
                  setCopied(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950"
              >
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          )}

          {/* Resumen de una línea, siempre visible aunque el formulario esté
              cerrado — para chequear de un vistazo sin tener que abrir nada. */}
          {!ventaOpen && (
            <p className="text-xs text-ink-400">
              {vendida ? (
                <>
                  <span className="text-emerald-400 font-semibold">Vendida</span> · $
                  {Number(montoTotal || 0).toLocaleString('es-AR')} · cuota {cuotaActual || 0}
                  {cantidadCuotas ? `/${cantidadCuotas}` : ''}
                  {proximaCuota &&
                    ` · próxima ${new Date(proximaCuota).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                </>
              ) : (
                'Todavía no se cargó la venta.'
              )}
            </p>
          )}

          {ventaOpen && (
            <div className="space-y-3 max-w-sm">
              {locked ? (
                <p className="text-xs text-ink-500">
                  <span className="text-emerald-400 font-semibold">Vendida</span> · monto y cuotas ya quedaron
                  registrados — de acá en más solo se actualiza en qué cuota va.
                </p>
              ) : (
                <label className="flex items-center gap-2 text-sm text-ink-200">
                  <input
                    type="checkbox"
                    checked={vendida}
                    onChange={(e) => setVendida(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Vendida
                </label>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Monto total</label>
                  {locked ? (
                    <p className="px-3 py-2.5 text-sm text-ink-300">${Number(montoTotal || 0).toLocaleString('es-AR')}</p>
                  ) : (
                    <input
                      type="number"
                      inputMode="numeric"
                      value={montoTotal}
                      onChange={(e) => setMontoTotal(e.target.value)}
                      className={inputClass}
                    />
                  )}
                </div>
                <div>
                  <label className={labelClass}>Cant. cuotas</label>
                  {locked ? (
                    <p className="px-3 py-2.5 text-sm text-ink-300">{cantidadCuotas || '—'}</p>
                  ) : (
                    <input
                      type="number"
                      inputMode="numeric"
                      value={cantidadCuotas}
                      onChange={(e) => setCantidadCuotas(e.target.value)}
                      className={inputClass}
                    />
                  )}
                </div>
                <div>
                  <label className={labelClass}>Cuota actual</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={cuotaActual}
                    onChange={(e) => setCuotaActual(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Próxima cuota</label>
                  <input
                    type="date"
                    value={proximaCuota}
                    onChange={(e) => setProximaCuota(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                onClick={saveVenta}
                disabled={ventaBusy}
                className="w-full px-4 py-2.5 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 transition-colors text-navy-950 font-bold text-sm"
              >
                {ventaBusy ? 'Guardando...' : 'Guardar venta'}
              </button>
              {ventaStatus && (
                <p className={`text-xs ${ventaStatus.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {ventaStatus.msg}
                </p>
              )}
            </div>
          )}
      </div>
    </div>
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
