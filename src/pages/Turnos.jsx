import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useApp } from '../context/AppContext';
import { ROOT_DOMAIN } from '../utils/rootDomain';

const SECTION_LABELS = {
  reservas: 'Reserva online',
  turnos: 'Turnos con resumen',
  'turno-express': 'Turno express',
};

// Turnos que los visitantes confirmaron desde alguna de las 3 secciones de
// reserva interactivas de esta página (ver TurnoConfirmForm en
// SitePreview.jsx y POST /api/public/sites/:subdomain/bookings) — mismo
// patrón de página que Stats.jsx (activeSiteId + fetch al entrar).
export default function Turnos() {
  const { siteData, template, subdomain, authReady, activeSiteId, getSiteBookings } = useApp();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    if (!authReady) return;
    if (!siteData || !template) navigate('/plantillas', { replace: true });
  }, [authReady, siteData, template, navigate]);

  useEffect(() => {
    if (!activeSiteId) return;
    getSiteBookings(activeSiteId).then(setBookings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSiteId]);

  if (!siteData || !template) return null;

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <div className="px-5 sm:px-8 py-4 flex items-center justify-between border-b border-white/8">
        <Logo size="sm" />
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 border border-white/15 hover:bg-white/5 transition-colors text-sm font-semibold"
        >
          ← Volver al panel
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-12">
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 text-xs text-ink-400 mb-2">
            <span>{subdomain}.{ROOT_DOMAIN}</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-balance">
            Turnos de {siteData.nombreNegocio}
          </h1>
          <p className="text-ink-400 text-sm mt-1">
            Lo que reservaron desde las secciones de turnos de tu página — también te avisamos por mail apenas llega uno.
          </p>
        </div>

        {bookings === null ? (
          <p className="text-sm text-ink-400">Cargando...</p>
        ) : bookings.length === 0 ? (
          <div className="border border-dashed border-white/15 bg-navy-850 p-8 text-center">
            <p className="text-sm text-ink-400">Todavía no reservaron ningún turno.</p>
          </div>
        ) : (
          <div className="border border-white/10 bg-navy-850 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-500 border-b border-white/10">
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Turno</th>
                  <th className="p-4 font-semibold">Sección</th>
                  <th className="p-4 font-semibold">Recibido</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-white/5 last:border-0">
                    <td className="p-4">
                      <p className="font-semibold">{b.nombreCliente}</p>
                      <a
                        href={`tel:${b.telefonoCliente.replace(/\s|-/g, '')}`}
                        className="text-xs text-gold-500 hover:underline"
                      >
                        {b.telefonoCliente}
                      </a>
                    </td>
                    <td className="p-4 text-ink-200 max-w-[280px]">{b.resumen}</td>
                    <td className="p-4 text-ink-400 whitespace-nowrap">{SECTION_LABELS[b.sectionType] ?? b.sectionType}</td>
                    <td className="p-4 text-ink-500 whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
