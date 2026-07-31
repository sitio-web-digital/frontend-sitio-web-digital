import { useEffect, useState } from 'react';
import Logo from './Logo';
import { acceptTerms } from '../utils/analytics';
import { apiGetTerms } from '../api/client';
import { useApp } from '../context/AppContext';

// Términos y condiciones: para una cuenta logueada que YA los aceptó antes
// (users.terms_accepted_at, ver terms.js), no se vuelven a mostrar — se
// revalida contra la base en cada carga (vía el user que ya trae authReady
// de AppContext), nunca alcanza con "ya lo acepté en este navegador antes".
// Para quien todavía no tiene cuenta (anónimo, ej. los leads del quiz) o
// tiene una cuenta que nunca aceptó, se sigue mostrando siempre — cada
// aceptación anónima igual queda registrada del lado del servidor (ver
// acceptTerms() en utils/analytics.js), porque necesitamos poder demostrar
// que esa persona aceptó antes de que le guardáramos cualquier dato.
//
// El texto en sí (antes hardcodeado acá) ahora vive en la base (site_terms,
// ver terms.js) y lo edita un admin como un solo campo de texto plano (Admin
// > Términos y Condiciones) — se pide siempre fresco en cada apertura del
// gate, nunca cacheado, para que una actualización se vea de inmediato.
export default function TermsGate({ children }) {
  const { authReady, user } = useApp();
  const [checked, setChecked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [terms, setTerms] = useState(null);

  useEffect(() => {
    apiGetTerms().then(setTerms);
  }, []);

  // Mientras no sepamos si hay una sesión restaurada (token guardado de una
  // visita anterior), no decidimos todavía si mostrar el gate — evita un
  // parpadeo del modal para alguien que ya lo tiene aceptado.
  if (!authReady) return <>{children}</>;

  const open = !dismissed && !user?.termsAcceptedAt;

  return (
    <>
      {children}
      {open && (
        <div className="fixed inset-0 z-[100] bg-navy-950/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col border border-white/10 bg-navy-850 shadow-2xl">
            <div className="bg-navy-950 border-b border-white/8 px-6 py-4 flex items-center gap-2.5 shrink-0">
              <Logo withWordmark={false} size="sm" />
              <span className="text-white font-semibold text-sm">Términos y Condiciones de uso</span>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-5">
              <p className="text-sm text-ink-400 leading-relaxed">
                Antes de continuar, te pedimos que leas estos términos. Al tocar "Acepto y continúo" confirmás que
                los leíste y estás de acuerdo con ellos.
              </p>
              {terms === null ? (
                <p className="text-sm text-ink-500">Cargando...</p>
              ) : (
                <p className="text-sm text-ink-300 leading-relaxed whitespace-pre-line">{terms.content}</p>
              )}
              {terms?.updatedAt && (
                <p className="text-xs text-ink-500 pt-1">
                  Última actualización:{' '}
                  {new Date(terms.updatedAt).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  .
                </p>
              )}
            </div>

            <div className="border-t border-white/8 px-6 py-4 shrink-0 bg-navy-850">
              <label className="flex items-start gap-2.5 mb-4 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-0.5 accent-gold-500 w-4 h-4 shrink-0"
                />
                <span className="text-sm text-ink-300">
                  He leído y acepto los Términos y Condiciones de SitioWeb Digital.
                </span>
              </label>
              <button
                type="button"
                disabled={!checked || terms === null}
                onClick={() => {
                  acceptTerms();
                  setDismissed(true);
                }}
                className="w-full bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold py-3.5 disabled:opacity-40 disabled:pointer-events-none"
              >
                Acepto y continúo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
