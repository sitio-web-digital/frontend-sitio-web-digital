import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import AuthGate from '../components/AuthGate';
import { useApp } from '../context/AppContext';
import { PLAN } from '../data/mockData';
import { trackEvent } from '../utils/analytics';
import { apiStartSubscription } from '../api/client';
import { ROOT_DOMAIN } from '../utils/rootDomain';

export default function Checkout() {
  const { siteData, template, subdomain, theme, user, login, register, logout, saveSiteToBackend } = useApp();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | processing
  const [error, setError] = useState('');

  useEffect(() => {
    if (!template || !siteData) navigate('/plantillas', { replace: true });
  }, [template, siteData, navigate]);

  if (!template || !siteData) return null;

  // Suscripción real de Mercado Pago (un mismo link de checkout para todas
  // las páginas, ver server/src/utils/mercadopago.js) — antes de mandarlo
  // ahí, la página tiene que existir ya guardada del lado del servidor (si
  // es la primera vez, todavía puede vivir solo en el navegador), para que
  // el backend sepa qué fila marcar como "yendo a pagar ahora" y así poder
  // reconocerla cuando Mercado Pago confirme la suscripción.
  const pagar = async () => {
    if (!subdomain) return;
    setStatus('processing');
    setError('');
    await saveSiteToBackend({ published: false });
    const result = await apiStartSubscription();
    if (!result.ok) {
      setStatus('idle');
      setError(result.error || 'No se pudo iniciar la suscripción. Probá de nuevo en un momento.');
      return;
    }
    trackEvent('funnel', 'checkout_redirigido_mp', {});
    window.location.href = result.checkoutUrl;
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <div className="px-5 sm:px-8 py-5 flex items-center justify-between border-b border-white/5">
        <Logo size="sm" />
        <span className="text-xs text-ink-400">Paso 4 · Publicar tu página</span>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 grid lg:grid-cols-[1fr_400px] gap-10">
        {/* Resumen */}
        <div className="animate-fade-in-up order-2 lg:order-1">
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2 text-balance">
            Estás a un paso de publicar
          </h1>
          <p className="text-ink-300 mb-8 text-balance">
            Con la suscripción activa, tu página queda publicada en tu propio subdominio.
          </p>

          <div className="rounded-2xl border border-white/10 bg-navy-850 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl shrink-0"
                style={{ background: `linear-gradient(135deg, ${theme?.accent ?? template.accent}, #14131a)` }}
              />
              <div className="min-w-0">
                <p className="font-semibold truncate">{siteData.nombreNegocio}</p>
                {subdomain && <p className="text-sm text-gold-500 truncate">{subdomain}.{ROOT_DOMAIN}</p>}
              </div>
            </div>
          </div>

          {!subdomain && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 mb-6 flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-300">
                  Todavía no elegiste tu subdominio
                </p>
                <p className="text-sm text-amber-100/80 mt-1">
                  Lo necesitás antes de publicar — es la dirección donde va a vivir tu página.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="text-sm font-semibold text-amber-300 underline hover:text-amber-200 transition-colors mt-2"
                >
                  Elegirlo en Configuración →
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-navy-850 p-6">
            <p className="text-sm font-semibold text-ink-400 uppercase tracking-wide mb-4">
              Incluye
            </p>
            <ul className="space-y-3">
              {PLAN.beneficios.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-ink-200">
                  <CheckIcon /> {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Panel de pago — redirige al checkout real de Mercado Pago */}
        <div className="order-1 lg:order-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {!user ? (
            <div className="sticky top-8">
              <AuthGate login={login} register={register} />
            </div>
          ) : (
            <div className="rounded-2xl bg-white text-neutral-900 overflow-hidden shadow-2xl sticky top-8">
              <div className="bg-[#009ee3] px-6 py-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MercadoPagoMark />
                  <span className="text-white font-semibold text-sm">Suscripción con Mercado Pago</span>
                </div>
                <span className="text-white/80 text-xs">
                  {user.email} ·{' '}
                  <button onClick={logout} className="underline hover:text-white transition-colors">
                    Salir
                  </button>
                </span>
              </div>

              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">
                  {PLAN.nombre}
                </p>
                <p className="text-4xl font-bold mb-1">
                  ${PLAN.precio.toLocaleString('es-AR')}
                  <span className="text-base font-medium text-neutral-500"> {PLAN.moneda}/{PLAN.ciclo}</span>
                </p>
                <p className="text-sm text-neutral-500 mb-6">Suscripción mensual, cancelás cuando quieras.</p>

                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

                <button
                  onClick={pagar}
                  disabled={status === 'processing' || !subdomain}
                  data-track="checkout_pagar"
                  title={!subdomain ? 'Elegí tu subdominio en Configuración antes de publicar.' : undefined}
                  className={`w-full rounded-xl font-semibold py-3.5 flex items-center justify-center gap-2 transition-colors ${
                    !subdomain
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : 'bg-[#009ee3] hover:bg-[#0090cc] text-white disabled:opacity-80'
                  }`}
                >
                  {status === 'processing' ? (
                    <>
                      <Spinner /> Redirigiendo a Mercado Pago...
                    </>
                  ) : !subdomain ? (
                    'Elegí tu subdominio primero'
                  ) : (
                    `Pagar $${PLAN.precio.toLocaleString('es-AR')}`
                  )}
                </button>
                <p className="text-[11px] text-neutral-400 text-center mt-4 leading-relaxed">
                  Vas a terminar de pagar en Mercado Pago, de forma segura — no pedimos ni
                  guardamos ningún dato de tu tarjeta acá.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5 text-gold-500">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function MercadoPagoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="white" />
      <path d="M7 13.5c1.5 2 3 2.8 5 2.8s3.5-.8 5-2.8" stroke="#009ee3" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8.5" cy="10" r="1.1" fill="#009ee3" />
      <circle cx="15.5" cy="10" r="1.1" fill="#009ee3" />
    </svg>
  );
}
