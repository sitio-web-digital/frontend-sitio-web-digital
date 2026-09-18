import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useApp } from '../context/AppContext';
import { apiListDevOrders, apiClaimDevOrder } from '../api/client';

const ESTADO_INFO = {
  pendiente: { label: 'Pendiente', textClass: 'text-ink-400', dotClass: 'bg-ink-500' },
  en_progreso: { label: 'En progreso', textClass: 'text-gold-400', dotClass: 'bg-gold-500' },
  lista: { label: 'Lista', textClass: 'text-emerald-400', dotClass: 'bg-emerald-400' },
};

const TABS = [
  { id: 'mias', label: 'Mis órdenes' },
  { id: 'disponibles', label: 'Disponibles' },
  { id: 'todas', label: 'Todas' },
];

// Panel del rol "developer" (ver plan de marca blanca): un pool abierto de
// órdenes cargadas por vendedores — cualquier developer puede agarrar
// cualquier "pendiente" (primero que la agarra se la queda, sin asignación
// manual). Una vez agarrada, arma la página con el Gallery/Editor de
// siempre (no hay editor aparte) y la vincula desde ahí.
//
// "Mis órdenes" es la pestaña por default (no "Disponibles"): un developer
// que ya tiene trabajo en curso entra acá sobre todo a seguir con eso, no a
// agarrar una nueva — probado en vivo, 2026-09-18, se pidió puntualmente
// que el pool no sea lo primero que se ve. "Todas" da visibilidad de lo que
// agarró cada developer (quién tomó qué), sin poder tocar nada ajeno.
export default function DevPanel() {
  const { user, authReady, logout, setQuiz, setPendingDevOrder, switchSite, resetAll } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('mias');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role !== 'developer') navigate('/dashboard', { replace: true });
  }, [authReady, user, navigate]);

  const reload = async () => {
    setOrders(await apiListDevOrders());
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user || user.role !== 'developer') return null;

  const claim = async (order) => {
    setClaimingId(order.id);
    setError(null);
    const result = await apiClaimDevOrder(order.id);
    setClaimingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reload();
  };

  // resetAll() ANTES de sembrar el quiz es la parte que importa acá: sin
  // esto, el activeSiteId de lo último que el developer haya armado quedaba
  // pegado (mismo mecanismo que usa Dashboard.jsx > "Crear nueva página" vía
  // startNewSite), y la orden siguiente terminaba guardando sobre ESE mismo
  // sitio en vez de crear uno nuevo — probado en vivo, 2026-09-18: dos
  // órdenes distintas quedaron apuntando al mismo site_id.
  const crearPagina = (order) => {
    resetAll();
    setQuiz({
      nombreNegocio: order.nombreNegocio,
      tipoNegocio: null,
      frase: '',
      whatsapp: order.telefonoCliente,
      logoAccent: null,
    });
    setPendingDevOrder(order);
    navigate('/plantillas');
  };

  // Una orden "lista" ya quedó vinculada a un sitio propio del developer —
  // volver a editarla no pasa por el quiz/plantillas de nuevo, es el mismo
  // switchSite que ya usa Dashboard.jsx para reabrir una página existente.
  // Igual se setea pendingDevOrder, para que "Ver información de la orden"
  // siga disponible al reeditar (el Editor decide solo si además hace
  // falta ofrecer "Vincular a la orden" mirando order.estado).
  const editarPagina = async (order) => {
    if (!order.siteId) return;
    setPendingDevOrder(order);
    await switchSite(order.siteId);
    navigate('/editor');
  };

  const pendientes = orders.filter((o) => o.estado === 'pendiente');
  const mias = orders.filter((o) => o.developerId === user.id);

  return (
    <div className="min-h-screen bg-navy-900 text-white">
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

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Órdenes de desarrollo</h1>
          <p className="text-sm text-ink-400 mt-1">Agarrá una orden pendiente y armá la página en el editor de siempre.</p>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center gap-1 border-b border-white/10">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-gold-500 text-white' : 'border-transparent text-ink-400 hover:text-white'
              }`}
            >
              {t.label}
              {t.id === 'disponibles' && pendientes.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-gold-500 text-navy-950 text-[0.68rem] font-bold leading-none">
                  {pendientes.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-xs text-ink-500">Cargando...</p>
        ) : (
          <>
            {tab === 'mias' &&
              (mias.length === 0 ? (
                <div className="border border-dashed border-white/15 bg-navy-850 p-6 text-center">
                  <p className="text-ink-400 text-sm mb-4">Todavía no agarraste ninguna orden.</p>
                  <button
                    onClick={() => setTab('disponibles')}
                    className="px-5 py-2.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-sm"
                  >
                    Ver disponibles
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {mias.map((o) => {
                    const estado = ESTADO_INFO[o.estado];
                    return (
                      <div
                        key={o.id}
                        className="border border-white/10 bg-navy-850 p-4 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-display font-semibold truncate">{o.nombreNegocio}</p>
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold mt-0.5 ${estado.textClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${estado.dotClass}`} />
                            {estado.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {o.estado === 'en_progreso' && (
                            <button
                              onClick={() => crearPagina(o)}
                              className="px-3 py-2 text-xs font-semibold bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950"
                            >
                              Crear página para esta orden
                            </button>
                          )}
                          {/* No hay link "en vivo" que ofrecer acá: el
                              subdominio lo elige el cliente recién al
                              reclamarla. "Editar" reabre el sitio real en
                              el editor, con "Ver mi página →" para verla
                              armada sin depender de eso. */}
                          {o.estado === 'lista' && (
                            <button
                              onClick={() => editarPagina(o)}
                              className="px-3 py-2 text-xs font-semibold bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

            {tab === 'disponibles' &&
              (pendientes.length === 0 ? (
                <p className="text-xs text-ink-500">No hay órdenes pendientes ahora mismo.</p>
              ) : (
                <div className="space-y-2">
                  {pendientes.map((o) => (
                    <div
                      key={o.id}
                      className="border border-white/10 bg-navy-850 p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-display font-semibold truncate">{o.nombreNegocio}</p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          {o.telefonoCliente}
                          {o.instagram && ` · ${o.instagram}`}
                        </p>
                        {o.info && <p className="text-xs text-ink-400 mt-1 max-w-lg">{o.info}</p>}
                      </div>
                      <button
                        onClick={() => claim(o)}
                        disabled={claimingId === o.id}
                        className="shrink-0 px-3 py-2 text-xs font-semibold bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 disabled:opacity-40"
                      >
                        {claimingId === o.id ? 'Agarrando...' : 'Agarrar'}
                      </button>
                    </div>
                  ))}
                </div>
              ))}

            {tab === 'todas' &&
              (orders.length === 0 ? (
                <p className="text-xs text-ink-500">Todavía no se cargó ninguna orden.</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => {
                    const estado = ESTADO_INFO[o.estado];
                    return (
                      <div
                        key={o.id}
                        className="border border-white/10 bg-navy-850 p-4 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-display font-semibold truncate">{o.nombreNegocio}</p>
                          <p className="text-xs text-ink-500 mt-0.5">Vendedor: {o.vendedorNombre || '—'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${estado.textClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${estado.dotClass}`} />
                            {estado.label}
                          </span>
                          <p className="text-xs text-ink-500 mt-0.5">
                            {o.developerNombre
                              ? o.developerId === user.id
                                ? 'La agarraste vos'
                                : `Agarrada por ${o.developerNombre}`
                              : 'Nadie la agarró todavía'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
