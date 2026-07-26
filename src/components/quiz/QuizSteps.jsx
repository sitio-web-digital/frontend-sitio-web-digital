import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../Logo';
import Button from '../Button';
import MiniSitePreview from '../MiniSitePreview';
import { PencilIcon } from '../icons';
import { useApp } from '../../context/AppContext';
import { validateImageFile } from '../../utils/imageValidation';
import { uploadImage } from '../../utils/uploadImage';
import { trackEvent } from '../../utils/analytics';
import { slugify } from '../../data/mockData';
import { apiCheckSubdomainAvailability } from '../../api/client';

// Las secciones que trae CADA plantilla ya definen su propia variante (hero
// "split", "centro", "fondo", "ofertas", etc.) más los campos propios de esa
// variante (heroImagen, heroCaption, botones...) — antes acá se armaba un
// objeto de sección nuevo y vacío (solo { type: 'hero' }), que perdía toda
// esa configuración y hacía que CUALQUIER plantilla se viera con el layout
// genérico por defecto, todas iguales entre sí. Filtra las secciones reales
// de la plantilla en vez de inventar unas nuevas.
export function seccionesPropias(template, tipos) {
  return (template.sections || [])
    .filter((s) => tipos.includes(s.type))
    .map((s, i) => ({ ...s, id: `${s.type}-${i}` }));
}

// La página completa de la plantilla, tal cual la trae armada — para las
// vistas previas en vivo del quiz, donde tiene que poder verse (scrolleando)
// todo lo que trae esa plantilla, no solo el header y el hero.
export function todasLasSecciones(template) {
  return seccionesPropias(template, (template.sections || []).map((s) => s.type));
}

const LOADING_MESSAGES = [
  'Cargando plantilla adecuada...',
  'Cargando paleta de colores...',
  'Modificando secciones...',
  'Acomodando tu contenido...',
  'Ya casi está...',
];

// Navegador de pasos vertical: un punto por paso (completado = tilde, actual
// = relleno, pendiente = solo el número), unidos por una línea.
export function StepDots({ step, total }) {
  return (
    <div className="hidden sm:flex w-[60px] shrink-0 flex-col items-center justify-center border-r border-white/8 bg-navy-950/60">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className="flex flex-col items-center">
          {n > 1 && <div className={`w-px h-7 ${n <= step ? 'bg-gold-500' : 'bg-white/10'}`} />}
          <div
            className={`w-[26px] h-[26px] rounded-full flex items-center justify-center font-mono text-xs font-bold border ${
              n < step
                ? 'bg-gold-500/15 text-gold-500 border-gold-500'
                : n === step
                  ? 'bg-gold-500 text-navy-950 border-gold-500'
                  : 'bg-transparent text-ink-500 border-white/15'
            }`}
          >
            {n < step ? '✓' : n}
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuestionTitle({ eyebrow, children }) {
  return (
    <div className="mb-6">
      <span className="font-mono text-[0.72rem] tracking-[0.14em] uppercase text-gold-500">{eyebrow}</span>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-balance">
        {children}
      </h1>
    </div>
  );
}

const NOMBRE_MAX = 40;
const RUBRO_MAX = 40;
const FRASE_MAX = 70;
const WHATSAPP_MAX = 18;

// Pequeño contador "12/40" al lado del texto de ayuda de un campo — reusado
// en los 3 inputs de texto libre del quiz para que quede claro el límite
// mientras se escribe, en vez de dejar que se pueda tipear cualquier cosa.
function FieldFooter({ helper, length, max }) {
  return (
    <div className="flex items-center justify-between gap-3 mt-4">
      <p className="text-sm text-ink-500">{helper}</p>
      <span className="text-[11px] font-mono text-ink-500 shrink-0">
        {length}/{max}
      </span>
    </div>
  );
}

// Solo dígitos, espacios y los símbolos habituales de un teléfono (+, -,
// paréntesis) — filtra letras y demás caracteres al tipear, para que ese
// campo no termine con texto que no sea un teléfono.
const sanitizeWhatsapp = (text) => text.replace(/[^0-9+\-\s()]/g, '');

// Paso 1: nombre del negocio.
export function StepNegocio({ value, onChange, onEnter }) {
  return (
    <div>
      <QuestionTitle eyebrow="Paso 1 de 4">Nombre de tu negocio</QuestionTitle>
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        placeholder="Ej: Panadería del Centro"
        maxLength={NOMBRE_MAX}
        className="w-full border border-white/10 bg-navy-850 px-4 py-3.5 text-[1.05rem] text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
      />
      <FieldFooter
        helper="Podés cambiarlo más adelante, esto es solo para armar tu página."
        length={value?.length || 0}
        max={NOMBRE_MAX}
      />
      <SubdominioSugerido nombreNegocio={value} />
    </div>
  );
}

// Adelanto de la dirección de tu página en base al nombre — espacios pasan a
// guion medio y se saca todo lo demás (mismo slugify() que ya usa Dashboard >
// Configuración, donde se termina de elegir de verdad). Chequea contra el
// servidor si ese subdominio en particular ya está en uso, para que no llegue
// como sorpresa recién en el checkout.
function SubdominioSugerido({ nombreNegocio }) {
  const slug = slugify(nombreNegocio);
  const tieneNombre = !!nombreNegocio?.trim();
  const [estado, setEstado] = useState('idle'); // idle | checking | available | taken

  useEffect(() => {
    if (!tieneNombre || slug === 'tunegocio') {
      setEstado('idle');
      return undefined;
    }
    let cancelado = false;
    setEstado('checking');
    const t = setTimeout(async () => {
      const { available } = await apiCheckSubdomainAvailability(slug);
      if (!cancelado) setEstado(available ? 'available' : 'taken');
    }, 450);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [slug, tieneNombre]);

  if (!tieneNombre) return null;

  return (
    <div className="mt-3 text-xs">
      <p className="font-mono break-all leading-relaxed">
        <span className="text-white">{slug}</span>
        <span className="text-ink-500">.sitiowebdigital.com.ar</span>
      </p>
      {estado === 'checking' && <p className="text-ink-500 mt-1">Comprobando disponibilidad…</p>}
      {estado === 'available' && <p className="text-green-400 font-semibold mt-1">✓ Disponible</p>}
      {estado === 'taken' && <p className="text-amber-400 font-semibold mt-1">Ocupado — se puede ajustar después</p>}
    </div>
  );
}

// Paso 2: rubro, en texto libre (sin elegir de una lista fija).
export function StepRubro({ value, onChange, onEnter }) {
  return (
    <div>
      <QuestionTitle eyebrow="Paso 2 de 4">¿A qué te dedicás?</QuestionTitle>
      <input
        autoFocus
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter()}
        placeholder="Ej: Peluquería, plomero, cafetería..."
        maxLength={RUBRO_MAX}
        className="w-full border border-white/10 bg-navy-850 px-4 py-3.5 text-[1.05rem] text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
      />
      <FieldFooter
        helper="Nos ayuda a sugerirte una plantilla y textos más a medida."
        length={value?.length || 0}
        max={RUBRO_MAX}
      />
      <p className="text-xs text-ink-500 mt-4">
        Tranquilo — todo lo que vayas completando queda en tu página final, y después podés cambiarlo cuando quieras.
      </p>
    </div>
  );
}

// Paso 3: frase de portada (el titular del Hero) + WhatsApp, para el botón
// principal de contacto — ambos opcionales, se pueden cargar después.
export function StepMensaje({ frase, whatsapp, onFraseChange, onWhatsappChange }) {
  return (
    <div>
      <QuestionTitle eyebrow="Paso 3 de 4">Tu mensaje</QuestionTitle>
      <label className="block font-mono text-[0.7rem] uppercase tracking-[0.06em] text-ink-500 mb-2">
        Frase de portada
      </label>
      <input
        autoFocus
        type="text"
        value={frase}
        onChange={(e) => onFraseChange(e.target.value)}
        placeholder="Ej: Hacemos realidad tu hogar"
        maxLength={FRASE_MAX}
        className="w-full border border-white/10 bg-navy-850 px-4 py-3.5 text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
      />
      <p className="text-[11px] font-mono text-ink-500 text-right mt-1.5 mb-4">
        {frase?.length || 0}/{FRASE_MAX}
      </p>
      <label className="block font-mono text-[0.7rem] uppercase tracking-[0.06em] text-ink-500 mb-2">
        Tu WhatsApp — para el botón de contacto
      </label>
      <input
        type="tel"
        value={whatsapp}
        onChange={(e) => onWhatsappChange(sanitizeWhatsapp(e.target.value))}
        placeholder="Ej: 11 4567-8901"
        maxLength={WHATSAPP_MAX}
        className="w-full border border-white/10 bg-navy-850 px-4 py-3.5 text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
      />
      <p className="text-sm text-ink-500 mt-3">
        Los dos son opcionales, los podés cargar o cambiar después desde el editor.
      </p>
    </div>
  );
}

export function StepLogo({ logoUrl, onLogoChange }) {
  // El logo puede venir de un blob: URL de una sesión anterior (por ejemplo,
  // si quedó guardado en el quiz y se recargó la página) — esos links dejan
  // de servir la imagen, así que sin este chequeo el campo queda mostrando
  // el ícono de "imagen rota" del navegador en vez del "+" para cargar una.
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [logoUrl]);
  const showLogo = logoUrl && !broken;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!(await validateImageFile(file, 'logo'))) return;
    // Si todavía no hay cuenta (normal acá, antes de crearla) no hay dónde
    // subirlo — uploadImage() se guarda el blob: local como respaldo en ese
    // caso, y sigue funcionando igual que antes para esa sesión.
    onLogoChange(await uploadImage(file));
  };

  return (
    <div>
      <QuestionTitle eyebrow="Paso 4 de 4">
        Subí tu logo <span className="text-ink-400 font-normal text-lg">(opcional)</span>
      </QuestionTitle>
      <label className="group/logo relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/15 bg-navy-850 py-10 w-24 cursor-pointer hover:border-gold-500/60 hover:bg-navy-800 transition-colors">
        {showLogo ? (
          <>
            <img
              src={logoUrl}
              alt="Logo"
              onError={() => setBroken(true)}
              className="absolute inset-0 w-full h-full object-cover border-2 border-white/10"
            />
            <span className="absolute inset-0 bg-black/0 group-hover/logo:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/logo:opacity-100">
              <PencilIcon className="w-5 h-5 text-white" />
            </span>
          </>
        ) : (
          <span className="text-ink-400 text-xl">+</span>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>
      <p className="text-sm text-ink-500 mt-3">
        {showLogo
          ? 'Buenísimo. Vamos a usar los colores de tu logo para sugerirte una paleta.'
          : 'Si no lo tenés a mano, podés agregarlo más adelante desde el editor.'}
      </p>
    </div>
  );
}

// Spinner de "rayos" girando (8 tics que se van desvaneciendo) alrededor del
// logo del emprendimiento — para la espera ceremonial previa al editor. El
// logo va sobre su propio círculo de fondo, más chico que el radio interno de
// los tics, para que quede un espacio limpio entre ambos y no se superpongan.
export function SunburstSpinner({ logoUrl }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [logoUrl]);
  const showLogo = logoUrl && !broken;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className="absolute top-1/2 left-1/2 w-[5px] h-4 rounded-sm bg-gold-500"
          style={{
            transformOrigin: '2.5px 48px',
            transform: `translate(-2.5px, -48px) rotate(${i * 45}deg)`,
            animation: 'swdTick 1.2s linear infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <div className="w-14 h-14 rounded-full bg-navy-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
        {showLogo ? (
          <img src={logoUrl} alt="Logo" onError={() => setBroken(true)} className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <Logo withWordmark={false} size="md" frame={false} />
        )}
      </div>
    </div>
  );
}

// Entre el quiz y el editor: se muestra la plantilla recomendada (ya con el
// nombre/frase/WhatsApp completados) del lado derecho, lista para editar; del
// lado izquierdo, el resto de las plantillas agrupadas por rubro, cada una
// con una miniatura viva de SU PROPIO contenido y estructura de ejemplo (no
// lo que se completó en el quiz) — para elegir entre ellas hace falta ver
// cómo es cada una de verdad, no todas con el mismo nombre pisado encima.
// Recién al tocar "Editar página" se carga el editor real, y ahí sí se le
// aplica el nombre/frase/WhatsApp a la que haya quedado elegida.
// Comparte esta misma pantalla /quiz y el widget de demo en vivo de la Home.
export function ResultadoScreen({ quiz, rubroTexto, template, siteData, theme, logoUrl, onSelectTemplate, onEditar, onBack }) {
  const { selectableTemplates, rubros } = useApp();
  // Ya no se saca del listado a la que está elegida (antes desaparecía de acá
  // y saltaba al panel de al lado, un cambio muy brusco) — se queda en su
  // lugar, marcada como elegida, y el panel de al lado se actualiza solo.
  const gruposPorRubro = rubros.map((r) => ({
    rubro: r,
    templates: selectableTemplates.filter((t) => t.rubros?.includes(r.id)),
  })).filter((g) => g.templates.length > 0);

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col">
      <div className="px-5 sm:px-8 py-5 flex items-center justify-between border-b border-white/5">
        <Logo size="sm" />
        <button
          onClick={onBack}
          data-track="resultado_volver"
          className="text-xs text-ink-400 hover:text-white transition-colors"
        >
          ← Volver a editar mis respuestas
        </button>
      </div>

      <div className="flex-1 px-5 sm:px-8 py-12">
        <div className="text-center max-w-lg mx-auto mb-10 animate-fade-in-up">
          <span className="text-xs font-semibold uppercase tracking-wide text-gold-500">
            Así va quedando tu página
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-2 text-balance">
            {quiz.nombreNegocio?.trim() ? `¡Buenísimo, ${quiz.nombreNegocio}!` : '¡Ya está lista tu vista previa!'}
          </h1>
          {rubroTexto && (
            <p className="text-ink-400 mt-2 text-balance">
              Armamos esta plantilla pensando en negocios de{' '}
              <span className="text-white font-semibold">{rubroTexto.toLowerCase()}</span>.
            </p>
          )}
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_360px] gap-10 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-6">
              Otras plantillas que también te pueden servir
            </p>
            {gruposPorRubro.map((g) => (
              <div key={g.rubro.id} className="mb-10 last:mb-0">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4 pb-2 border-b border-white/10">
                  {g.rubro.label}
                </h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {g.templates.map((t) => (
                    <OtraPlantillaCard
                      key={t.id}
                      template={t}
                      elegida={t.id === template.id}
                      onSelect={() => onSelectTemplate(t.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:sticky lg:top-10">
            <p className="font-mono text-[0.7rem] tracking-[0.12em] uppercase text-gold-500 mb-3">
              Tu plantilla recomendada
            </p>
            <div key={template.id} className="border border-gold-500/40 bg-navy-850 overflow-hidden animate-fade-in-up">
              <MiniSitePreview
                template={template}
                siteData={siteData}
                theme={theme}
                logoUrl={logoUrl}
                sections={todasLasSecciones(template)}
                viewportHeight={360}
              />
            </div>
            <Button onClick={onEditar} data-track="resultado_editar_pagina" size="lg" className="w-full mt-4">
              Editar página →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Miniatura viva de una plantilla alternativa: la página completa real de
// ESA plantilla (todas sus secciones, no solo header+hero), con su propio
// contenido de ejemplo (no lo que se completó en el quiz) — para elegir hace
// falta ver cómo es cada plantilla de verdad, no una versión genérica con el
// nombre pisado ni un recorte de solo la portada.
function OtraPlantillaCard({ template: t, elegida, onSelect }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      className={`group text-left border overflow-hidden transition-all cursor-pointer ${
        elegida
          ? 'border-gold-500 bg-navy-850'
          : 'border-white/10 bg-navy-850 hover:border-gold-500/60 hover:-translate-y-0.5'
      }`}
    >
      <div className="relative">
        <MiniSitePreview
          template={t}
          siteData={t.demo}
          theme={{ accent: t.accent, accentSoft: t.accentSoft }}
          sections={todasLasSecciones(t)}
          viewportHeight={320}
        />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
        {elegida && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-semibold bg-gold-500 text-navy-950 px-2.5 py-1">
            ✓ Elegida
          </span>
        )}
      </div>
      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{t.nombre}</p>
          <p className="text-xs text-ink-500 truncate mt-0.5">{t.tagline}</p>
        </div>
        {!elegida && (
          <span className="shrink-0 text-xs font-semibold text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Elegir →
          </span>
        )}
      </div>
    </div>
  );
}

// Antes de entrar al editor de verdad, mostramos mensajes de carga que van
// pasando solos (más largo a propósito que un loading instantáneo) para que
// se sienta que la página se está armando en base a lo que eligió. Comparte
// esta misma pantalla /quiz y el widget de demo en vivo de la Home.
export function BuscandoPlantillaScreen({ templateId }) {
  const { quiz, chooseTemplate, logoUrl } = useApp();
  const navigate = useNavigate();
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    // Acá se confirma qué plantilla eligió (la recomendada o una de "otras
    // plantillas") — es el último paso del quiz antes de entrar al editor.
    trackEvent('funnel', 'quiz_completado', { templateId });

    const stepMs = 650;

    const interval = setInterval(() => {
      setMsgIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, stepMs);

    const t = setTimeout(() => {
      chooseTemplate(templateId);
      navigate('/editor');
    }, stepMs * LOADING_MESSAGES.length + 200);

    return () => {
      clearInterval(interval);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col items-center justify-center gap-7 px-6">
      <SunburstSpinner logoUrl={logoUrl} />
      <div key={msgIndex} className="text-center max-w-sm animate-fade-in-up">
        <p className="font-display text-lg font-bold text-balance">{LOADING_MESSAGES[msgIndex]}</p>
        <p className="text-sm text-ink-500 mt-1">
          {quiz.nombreNegocio?.trim() ? `Ya casi está, ${quiz.nombreNegocio}.` : 'Ya casi está.'}
        </p>
      </div>
    </div>
  );
}
