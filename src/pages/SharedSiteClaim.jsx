import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import AuthGate from '../components/AuthGate';
import SitePreview from '../components/SitePreview';
import { useApp } from '../context/AppContext';
import { TEMPLATES, getTemplateById } from '../data/mockData';
import { hydrateSite } from '../utils/siteSchema';
import { apiGetSharedSite, apiListCatalogTemplates } from '../api/client';

// Landing de un link compartido por un vendedor (rol vendedor/admin, ver
// Dashboard > Compartir): un prospecto abre esto SIN cuenta, ve la página ya
// armada tal cual va a quedar (mismo <SitePreview> que PublicSite.jsx, solo
// que acá el contenido sale de un fetch público por token en vez de por
// subdominio publicado), y lo único que le falta es crear su cuenta (o
// entrar con una que ya tenía) para pasar directo al pago — ver
// claimSharedSite en AppContext, que transfiere el dueño de la página y
// engancha el mismo flujo de Checkout de siempre.
export default function SharedSiteClaim() {
  const { token } = useParams();
  const { user, claimSharedSite } = useApp();
  const navigate = useNavigate();
  const [state, setState] = useState({
    status: 'loading',
    hydrated: null,
    template: null,
    nombreNegocio: '',
    whiteLabel: false,
  });
  const [claiming, setClaiming] = useState(false);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [siteResult, customTemplates] = await Promise.all([apiGetSharedSite(token), apiListCatalogTemplates()]);
      if (cancelled) return;
      if (!siteResult.ok) {
        setState({ status: 'not-found', hydrated: null, template: null, nombreNegocio: '', whiteLabel: false });
        return;
      }
      const hydrated = hydrateSite(siteResult.site);
      const template = hydrated ? getTemplateById(hydrated.templateId, [...TEMPLATES, ...customTemplates]) : null;
      if (!hydrated || !template) {
        setState({ status: 'not-found', hydrated: null, template: null, nombreNegocio: '', whiteLabel: false });
        return;
      }
      setState({
        status: 'ready',
        hydrated,
        template,
        nombreNegocio: siteResult.nombreNegocio || 'Tu página',
        whiteLabel: Boolean(siteResult.whiteLabel),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Ya hay sesión iniciada (ej. un vendedor probando su propio link, o un
  // cliente que ya tenía cuenta y estaba logueado en este navegador) — no
  // hace falta pedir contraseña de nuevo, ver mode: 'session' en el backend.
  const claimWithSession = async () => {
    setClaiming(true);
    setSessionError('');
    const result = await claimSharedSite(token, 'session');
    setClaiming(false);
    if (!result.ok) {
      setSessionError(result.error);
      return;
    }
    navigate('/checkout');
  };

  const claimViaLogin = async (payload) => {
    const result = await claimSharedSite(token, 'login', payload);
    if (result.ok) navigate('/checkout');
    return result;
  };

  const claimViaRegister = async (payload) => {
    const result = await claimSharedSite(token, 'register', payload);
    if (result.ok) navigate('/checkout');
    return result;
  };

  if (state.status === 'loading') return <div className="min-h-screen bg-navy-900" />;

  if (state.status === 'not-found') {
    return (
      <div className="min-h-screen bg-navy-900 text-white flex items-center justify-center text-center px-6">
        <div>
          <p className="font-display text-2xl font-bold mb-2">Este link ya no está disponible</p>
          <p className="text-ink-400 text-sm">Puede que ya se haya usado, o que esté mal copiado — pedí uno nuevo.</p>
        </div>
      </div>
    );
  }

  const { hydrated, template, nombreNegocio, whiteLabel } = state;

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      {/* Página armada vía el flujo developer-vendedor (marca blanca, ver
          sites.white_label): el cartel de "pagar mantenimiento" reemplaza el
          copy genérico de "confirmá el pago" — el mecanismo de abajo (crear
          cuenta o continuar sesión → claim → /checkout) es exactamente el
          mismo en los dos casos. */}
      {whiteLabel && (
        <div className="px-5 sm:px-8 py-2.5 bg-gold-500 text-navy-950 text-sm font-semibold flex flex-wrap items-center justify-center gap-2 text-center">
          <span>Para seguir usando esta página hay que pagar el mantenimiento.</span>
          <a href="#claim-cta" className="underline underline-offset-2">
            Pagar mantenimiento
          </a>
        </div>
      )}
      <div className="px-5 sm:px-8 py-5 flex items-center justify-between border-b border-white/5">
        <Logo size="sm" />
        <span className="text-xs text-ink-400">Tu página ya está armada</span>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 grid lg:grid-cols-[1fr_400px] gap-10">
        <div className="animate-fade-in-up order-2 lg:order-1">
          <h1 className="font-display text-3xl font-bold tracking-tight mb-2 text-balance">
            {nombreNegocio} ya está lista
          </h1>
          <p className="text-ink-300 mb-6 text-balance">
            {whiteLabel
              ? 'La armamos para vos — mirala tal cual va a quedar. Para seguir usándola, solo falta pagar el mantenimiento.'
              : 'La armamos para vos — mirala tal cual va a quedar. Cuando quieras publicarla, solo falta confirmar el pago.'}
          </p>
          <div className="border border-white/10 bg-navy-850 overflow-hidden">
            <div className="max-h-[70vh] overflow-y-auto">
              <SitePreview
                template={template}
                siteData={hydrated.siteData}
                logoUrl={hydrated.logoUrl}
                theme={hydrated.theme}
                sections={hydrated.sections}
                productos={hydrated.productos}
                faqs={hydrated.faqs}
                testimonios={hydrated.testimonios}
                planes={hydrated.planes}
                equipo={hydrated.equipo}
                menuItems={hydrated.menuItems}
                marcas={hydrated.marcas}
                posts={hydrated.posts}
                widgets={hydrated.widgets}
                textStyles={hydrated.textStyles}
                editable={false}
              />
            </div>
          </div>
        </div>

        <div id="claim-cta" className="order-1 lg:order-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="sticky top-8">
            {user ? (
              <div className="border border-white/10 bg-navy-850 p-6">
                <p className="text-sm text-ink-300 mb-1">Ya iniciaste sesión como</p>
                <p className="font-semibold mb-4 truncate">{user.email}</p>
                {sessionError && <p className="text-sm text-red-400 mb-3">{sessionError}</p>}
                <button
                  type="button"
                  onClick={claimWithSession}
                  disabled={claiming}
                  className="w-full bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold py-3.5 disabled:opacity-50"
                >
                  {claiming ? 'Un momento...' : whiteLabel ? 'Pagar mantenimiento' : 'Continuar con esta cuenta'}
                </button>
              </div>
            ) : (
              <AuthGate
                login={claimViaLogin}
                register={claimViaRegister}
                title={whiteLabel ? 'Creá tu cuenta para pagar el mantenimiento' : 'Creá tu cuenta para publicarla'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
