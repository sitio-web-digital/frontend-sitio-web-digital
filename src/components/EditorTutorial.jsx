import { useEffect, useRef, useState } from 'react';
import { XIcon } from './icons';

// Recorrido guiado del editor. La tarjeta con el texto es un modal común y
// corriente, siempre centrado igual que el resto de los modales del editor
// (Widgets, Color, Tipografía, etc.) — antes se calculaba su posición en
// píxeles pegada al control que se explicaba, y con ventanas chicas o textos
// largos terminaba empujada fuera de la pantalla o generando scroll
// horizontal. Lo único que se sigue calculando en base al control es el
// recuadro amarillo que lo resalta (el "spotlight"), que es puramente
// decorativo y va clampado para no poder salirse nunca del viewport.
const BASE_STEPS = [
  {
    target: null,
    title: '¡Bienvenido a tu editor!',
    desc: 'Te mostramos rápido los controles principales. Salís cuando quieras con "Saltar".',
  },
  {
    target: '[data-tour="add-section"]',
    title: 'Agregá bloques a tu página',
    desc: 'Con el "+" sumás una sección nueva. Podés repetir el mismo tipo las veces que quieras.',
    forceVisible: true,
  },
  {
    target: '[data-tour="device-toggle"]',
    title: 'Mirá cómo se ve en cada tamaño',
    desc: 'Cambiá entre Escritorio, Tablet y Celular para revisar tu página.',
  },
  {
    target: '[data-tour="section-controls"]',
    title: 'Editá cada sección',
    desc: 'Pasá el mouse sobre un bloque para reordenarlo, cambiar su distribución o sus colores, o quitarlo.',
    forceVisible: true,
  },
  {
    target: '[data-tour="color-picker"]',
    title: 'Color general de la página',
    desc: 'El acento por default de toda tu página — de tu logo, un preset, o a mano. Cada sección lo puede pisar.',
  },
  {
    target: '[data-tour="font-picker"]',
    title: 'Tipografía general de la página',
    desc: 'La fuente por default de tu página. Importá cualquiera de Google Fonts solo con escribir su nombre.',
  },
  {
    target: '[data-tour="widgets-fab"]',
    title: 'Widgets flotantes',
    desc: 'Activá o desactivá elementos pegados a toda la página, como WhatsApp o el carrito.',
  },
  {
    target: null,
    title: 'Un detalle más',
    desc: 'Si una sección tiene más de una distribución posible, te mostramos las opciones al agregarla.',
  },
];

// Solo para cuentas admin: cómo convertir la página de ejemplo que están
// armando en una plantilla reutilizable — no tiene sentido mostrárselo a un
// usuario común, que no ve ese botón.
const ADMIN_STEP = {
  target: '[data-tour="save-template"]',
  title: 'Guardar como plantilla',
  desc: 'Convertí esta página en una plantilla reutilizable, disponible en la galería y el quiz.',
};

export default function EditorTutorial({ open, isAdmin, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [box, setBox] = useState(null);
  const revealedRef = useRef(null);

  const STEPS = isAdmin
    ? [...BASE_STEPS.slice(0, -1), ADMIN_STEP, BASE_STEPS[BASE_STEPS.length - 1]]
    : BASE_STEPS;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const restoreReveal = () => {
      if (revealedRef.current) {
        revealedRef.current.style.opacity = '';
        revealedRef.current = null;
      }
    };

    const compute = () => {
      restoreReveal();
      const el = step.target ? document.querySelector(step.target) : null;
      if (!el) {
        setBox(null);
        return;
      }
      if (step.forceVisible) {
        el.style.opacity = '1';
        revealedRef.current = el;
      }
      const r = el.getBoundingClientRect();
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const el = step.target ? document.querySelector(step.target) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const t = setTimeout(compute, el ? 260 : 0);
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
      restoreReveal();
    };
  }, [open, stepIndex, step]);

  if (!open) return null;

  // Recuadro que resalta el control (si el paso apunta a uno) — clampado a
  // los bordes del viewport para que nunca pueda generar scroll, ni
  // horizontal ni vertical, sea cual sea la posición real del control.
  let spotStyle = null;
  if (box) {
    const pad = 8;
    const left = Math.max(0, box.left - pad);
    const top = Math.max(0, box.top - pad);
    spotStyle = {
      top,
      left,
      width: Math.max(0, Math.min(box.width + pad * 2, window.innerWidth - left)),
      height: Math.max(0, Math.min(box.height + pad * 2, window.innerHeight - top)),
      boxShadow: '0 0 0 9999px rgba(6,8,15,0.8)',
      outline: '3px solid #FFC107',
      outlineOffset: '2px',
    };
  }

  const next = () => {
    if (isLast) {
      onClose();
      return;
    }
    setStepIndex((i) => i + 1);
  };
  const prev = () => setStepIndex((i) => Math.max(0, i - 1));

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden">
      {spotStyle ? (
        <div className="absolute transition-all duration-300 ease-out pointer-events-none" style={spotStyle} />
      ) : (
        <div className="absolute inset-0 bg-navy-950/85" />
      )}

      {/* Tarjeta: modal común centrado, igual que el resto de los popovers del
          editor — sin ningún cálculo de posición en píxeles, así nunca puede
          quedar fuera de la pantalla ni generar scroll, sea cual sea el
          tamaño de la ventana o el largo del texto. */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-sm max-h-full overflow-y-auto border border-white/10 bg-navy-850 shadow-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-display text-base font-bold text-white">{step.title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar tutorial"
              className="shrink-0 text-ink-500 hover:text-white transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-ink-300 leading-relaxed mb-5">{step.desc}</p>
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-ink-500">
              {stepIndex + 1}/{STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-ink-400 hover:text-white transition-colors px-2 py-2"
              >
                Saltar
              </button>
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={prev}
                  className="text-xs font-semibold text-white border border-white/15 hover:bg-white/5 transition-colors px-3 py-2"
                >
                  Atrás
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="text-xs font-bold text-navy-950 bg-gold-500 hover:bg-gold-400 transition-colors px-3 py-2"
              >
                {isLast ? 'Entendido' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
