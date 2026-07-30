import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useApp } from '../context/AppContext';
import { ROOT_DOMAIN } from '../utils/rootDomain';

export default function Success() {
  const { siteData, template, subdomain, published, theme } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!siteData || !template) navigate('/plantillas', { replace: true });
    else if (!published) navigate('/preview', { replace: true });
  }, [siteData, template, published, navigate]);

  if (!siteData || !template || !published) return null;

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <div className="px-5 sm:px-8 py-5 border-b border-white/5">
        <Logo size="sm" />
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16 text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-3xl mx-auto mb-6">
          🎉
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-balance">
          ¡Felicitaciones! Tu página está publicada.
        </h1>
        <p className="text-ink-300 mb-12 text-balance">
          Ya podés compartir tu subdominio con tus clientes.
        </p>

        <div className="border border-white/10 bg-navy-850 text-left">
          <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-5 border-b border-white/5">
            <div
              className="w-14 h-14 shrink-0"
              style={{ background: `linear-gradient(135deg, ${theme?.accent ?? template.accent}, #14131a)` }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display font-semibold text-lg truncate">
                  {siteData.nombreNegocio}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Publicada
                </span>
              </div>
              <p className="text-sm text-gold-500 mt-0.5">
                {subdomain}.{ROOT_DOMAIN}
              </p>
            </div>
          </div>

          <div className="p-6 grid sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => window.open(`https://${subdomain}.${ROOT_DOMAIN}`, '_blank', 'noopener,noreferrer')}
              className="px-4 py-2.5 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-sm"
            >
              Ver mi página
            </button>
            <button
              type="button"
              onClick={() => navigate('/editor')}
              className="px-4 py-2.5 border border-white/15 hover:bg-white/5 transition-colors text-white font-semibold text-sm"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => navigate('/estadisticas')}
              className="px-4 py-2.5 border border-white/15 hover:bg-white/5 transition-colors text-white font-semibold text-sm"
            >
              Ver estadísticas
            </button>
          </div>
        </div>

        <p className="text-xs text-ink-500 mt-10">
          Prototipo de producto — el pago, el subdominio y el hosting son simulados.
        </p>
      </div>
    </div>
  );
}
