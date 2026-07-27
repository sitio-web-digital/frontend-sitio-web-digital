import { useState } from 'react';
import Logo from './Logo';
import { acceptTerms } from '../utils/analytics';
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
const SECCIONES = [
  {
    titulo: '1. Objeto',
    texto:
      'Estos Términos y Condiciones regulan el acceso y uso de la plataforma "SitioWeb Digital" (en adelante, "la Plataforma"), un servicio que permite a comercios y profesionales crear, personalizar y publicar sitios web propios a partir de plantillas prediseñadas. El uso de la Plataforma implica la aceptación plena de estos términos.',
  },
  {
    titulo: '2. Aceptación de los términos',
    texto:
      'Al acceder, registrarte o utilizar cualquier funcionalidad de la Plataforma, aceptás quedar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguno de sus puntos, debés abstenerte de utilizar el servicio.',
  },
  {
    titulo: '3. Descripción del servicio',
    texto:
      'SitioWeb Digital ofrece un asistente guiado y un editor visual para armar un sitio web a partir de plantillas, con secciones personalizables (galería, productos, testimonios, preguntas frecuentes, contacto, entre otras). El servicio se presta bajo la modalidad de suscripción, según el plan vigente al momento de la contratación.',
  },
  {
    titulo: '4. Registro y cuenta de usuario',
    texto:
      'Para publicar y administrar tu sitio necesitás crear una cuenta con un correo electrónico válido. Sos responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta. Debés notificarnos de inmediato ante cualquier uso no autorizado.',
  },
  {
    titulo: '5. Contenido cargado por el usuario',
    texto:
      'Sos el único responsable del contenido que subís a tu sitio (textos, imágenes, precios, datos de contacto, logo, etc.). Declarás contar con los derechos necesarios sobre ese contenido y te comprometés a no publicar material ilícito, difamatorio, que infrinja derechos de terceros o que viole normativa vigente. Nos reservamos el derecho de suspender un sitio que incumpla esta cláusula.',
  },
  {
    titulo: '6. Suscripción, pagos y cancelación',
    texto:
      'El acceso a la publicación del sitio requiere una suscripción activa, con cobro recurrente según el ciclo elegido. Podés cancelar en cualquier momento desde tu panel; la cancelación tendrá efecto al finalizar el período ya abonado. Los pagos se procesan a través de la pasarela de pago habilitada en cada momento.',
  },
  {
    titulo: '7. Propiedad intelectual',
    texto:
      'Las plantillas, el software, el diseño y la marca "SitioWeb Digital" están protegidos por la normativa de propiedad intelectual vigente. Se te otorga una licencia de uso limitada, no exclusiva e intransferible sobre las plantillas, exclusivamente para operar tu propio sitio dentro de la Plataforma.',
  },
  {
    titulo: '8. Disponibilidad del servicio',
    texto:
      'Trabajamos para mantener la Plataforma disponible de forma continua, pero no garantizamos un funcionamiento ininterrumpido o libre de errores. Podemos realizar tareas de mantenimiento, actualizar funcionalidades o modificar el servicio, procurando el menor impacto posible para los usuarios.',
  },
  {
    titulo: '9. Limitación de responsabilidad',
    texto:
      'En la medida permitida por la ley, SitioWeb Digital no será responsable por daños indirectos, lucro cesante o pérdida de datos derivados del uso o la imposibilidad de uso de la Plataforma. El servicio se brinda "tal cual", sin garantías de que se ajuste a un fin específico.',
  },
  {
    titulo: '10. Datos personales',
    texto:
      'Los datos que nos proporciones (nombre, correo, teléfono, datos del negocio) se utilizan exclusivamente para prestar el servicio y comunicarnos con vos. No compartimos tus datos con terceros salvo obligación legal o para procesar el pago de tu suscripción.',
  },
  {
    titulo: '11. Modificación de estos términos',
    texto:
      'Podemos actualizar estos Términos y Condiciones en cualquier momento. Los cambios relevantes se informarán dentro de la Plataforma. El uso continuado del servicio luego de una actualización implica la aceptación de los nuevos términos.',
  },
  {
    titulo: '12. Ley aplicable y contacto',
    texto:
      'Estos términos se rigen por las leyes de la República Argentina. Ante cualquier consulta, podés escribirnos a hola@sitiowebdigital.com.ar.',
  },
];

export default function TermsGate({ children }) {
  const { authReady, user } = useApp();
  const [checked, setChecked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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
              {SECCIONES.map((s) => (
                <div key={s.titulo}>
                  <h3 className="font-display font-bold text-white text-[0.95rem] mb-1.5">{s.titulo}</h3>
                  <p className="text-sm text-ink-300 leading-relaxed">{s.texto}</p>
                </div>
              ))}
              <p className="text-xs text-ink-500 pt-1">Última actualización: 22 de julio de 2026.</p>
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
                disabled={!checked}
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
