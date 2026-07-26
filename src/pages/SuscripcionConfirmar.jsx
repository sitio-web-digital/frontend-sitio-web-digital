import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useApp } from '../context/AppContext';
import { apiGetSubscription, apiRefreshSubscription } from '../api/client';
import { trackEvent } from '../utils/analytics';

const POLL_MS = 3000;

// A esta pantalla vuelve quien terminó de pagar en Mercado Pago (es el
// back_url configurado en el plan — ver server/src/utils/mercadopago.js).
// Como el pago pasa por fuera de nuestra web, no hay forma de saber el
// resultado ahí mismo: acá se sondea nuestro propio backend hasta que el
// webhook (o el respaldo manual de abajo) confirme que la suscripción quedó
// autorizada, recién ahí se marca la página como publicada de verdad.
export default function SuscripcionConfirmar() {
  const { user, authReady, refreshSiteStatus } = useApp();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    let cancelado = false;
    const check = async () => {
      const sub = await apiGetSubscription();
      if (cancelado) return;
      if (sub.status === 'authorized') {
        await refreshSiteStatus();
        trackEvent('funnel', 'pagina_publicada', {});
        navigate('/exito', { replace: true });
        return;
      }
      setTries((t) => t + 1);
    };
    check();
    const interval = setInterval(check, POLL_MS);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [authReady, user, navigate, refreshSiteStatus]);

  // Respaldo mientras no haya webhook andando (sin DNS pública todavía): le
  // pide al backend que busque directo en Mercado Pago, en vez de esperar a
  // que llegue el aviso solo.
  const revisarAhora = async () => {
    setChecking(true);
    await apiRefreshSubscription();
    const fresh = await apiGetSubscription();
    setChecking(false);
    if (fresh.status === 'authorized') {
      await refreshSiteStatus();
      trackEvent('funnel', 'pagina_publicada', {});
      navigate('/exito', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white flex items-center justify-center px-5">
      <div className="max-w-md text-center animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>
        <div className="w-14 h-14 mx-auto rounded-full border-4 border-white/10 border-t-gold-500 animate-spin mb-6" />
        <h1 className="font-display text-2xl font-bold tracking-tight mb-2 text-balance">
          Confirmando tu suscripción...
        </h1>
        <p className="text-ink-400 text-sm mb-8">
          Esto puede tardar unos segundos. No cierres esta pestaña.
        </p>
        {tries >= 3 && (
          <button
            onClick={revisarAhora}
            disabled={checking}
            className="text-sm font-semibold text-gold-500 hover:text-gold-400 transition-colors underline disabled:opacity-50"
          >
            {checking ? 'Revisando...' : 'Ya pagué, revisar de nuevo'}
          </button>
        )}
      </div>
    </div>
  );
}
