import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useApp } from '../context/AppContext';
import { apiListDevOrders, apiClaimDevOrder } from '../api/client';
import { ROOT_DOMAIN } from '../utils/rootDomain';

const ESTADO_INFO = {
  pendiente: { label: 'Pendiente', textClass: 'text-ink-400', dotClass: 'bg-ink-500' },
  en_progreso: { label: 'En progreso', textClass: 'text-gold-400', dotClass: 'bg-gold-500' },
  lista: { label: 'Lista', textClass: 'text-emerald-400', dotClass: 'bg-emerald-400' },
};

// Panel del rol "developer" (ver plan de marca blanca): un pool abierto de
// órdenes cargadas por vendedores — cualquier developer puede agarrar
// cualquier "pendiente" (primero que la agarra se la queda, sin asignación
// manual). Una vez agarrada, arma la página con el Gallery/Editor de
// siempre (no hay editor aparte) y la vincula desde ahí.
export default function DevPanel() {
  const { user, authReady, logout, quiz, setQuiz, setPendingDevOrderId } = useApp();
  const navigate = useNavigate();
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

  const crearPagina = (order) => {
    setQuiz({ ...quiz, nombreNegocio: order.nombreNegocio, whatsapp: order.telefonoCliente });
    setPendingDevOrderId(order.id);
    navigate('/plantillas');
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

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Órdenes de desarrollo</h1>
          <p className="text-sm text-ink-400 mt-1">Agarrá una orden pendiente y armá la página en el editor de siempre.</p>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <section>
          <h2 className="font-display text-base font-bold mb-3 flex items-center gap-2.5">
            <span className="w-1 h-4 bg-gold-500 rounded-full shrink-0" />
            Disponibles
          </h2>
          {loading ? (
            <p className="text-xs text-ink-500">Cargando...</p>
          ) : pendientes.length === 0 ? (
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
          )}
        </section>

        <section>
          <h2 className="font-display text-base font-bold mb-3 flex items-center gap-2.5">
            <span className="w-1 h-4 bg-gold-500 rounded-full shrink-0" />
            Mis órdenes
          </h2>
          {!loading && mias.length === 0 ? (
            <p className="text-xs text-ink-500">Todavía no agarraste ninguna orden.</p>
          ) : (
            <div className="space-y-2">
              {mias.map((o) => {
                const estado = ESTADO_INFO[o.estado];
                return (
                  <div key={o.id} className="border border-white/10 bg-navy-850 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-semibold truncate">{o.nombreNegocio}</p>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold mt-0.5 ${estado.textClass}`}>
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
                      {o.estado === 'lista' && o.subdomain && (
                        <a
                          href={`https://${o.subdomain}.${ROOT_DOMAIN}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-xs font-semibold border border-white/15 hover:bg-white/5 transition-colors"
                        >
                          Ver página
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
