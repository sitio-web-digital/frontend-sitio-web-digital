import { useEffect, useMemo, useRef } from 'react';
import SitePreview from '../SitePreview';
import { useApp } from '../../context/AppContext';

// Fondo del hero principal: una "pared" infinita de miniaturas en perspectiva
// y en movimiento lento. Son capturas de verdad de las plantillas reales del
// catálogo (header + hero, con sus fotos/tipografía/íconos propios) — nada
// de wireframes ni bloques de color simulando texto: cada una tiene que
// leerse como el screenshot de un sitio terminado. Ninguna de nuestras
// plantillas usa una marca real (son negocios de ejemplo que armamos
// nosotros), así que se pueden repetir acá sin problema.
const REAL_WIDTH = 1200;

// El recorte real (sin escalar) que deja visible cada miniatura es siempre
// el mismo alto, sin importar el tamaño final del tile (el ancho y el alto
// escalan juntos con `scale`) — por eso alcanza con que el contenido real
// llegue a esta altura para que no quede espacio en blanco abajo. Con
// header + hero solos, algunas plantillas (heroes cortos tipo "minimal" o
// "centro") no llegaban a esta altura y dejaban un hueco vacío; sumando la
// sección siguiente casi siempre alcanza y sobra, igual que una captura de
// pantalla real que corta a mitad de una sección al hacer scroll.
function primerasSecciones(template, n) {
  return (template.sections || []).slice(0, n).map((s, i) => ({ ...s, id: `${s.type}-${i}` }));
}

// Algunas miniaturas (no todas — ver `buildRow`) además scrollean solas
// lentamente para abajo y vuelven, mostrando más de la página real en vez
// de quedarse quietas en el hero — así la pared se siente menos como una
// grilla de fotos fijas y más como sitios de verdad, con algo de vida.
// Necesitan TODAS las secciones reales de esa plantilla (no un recorte
// corto) — si el scroll llega más abajo de lo que hay contenido real
// cargado, se ve fondo vacío a mitad de pantalla, como si la plantilla
// "desapareciera" sin haber llegado a salir del cuadro.
//
// El ciclo (baja, pausa, vuelve arriba) tiene su propio reloj interno,
// independiente de en qué punto de la pared horizontal está esa miniatura
// en ese momento — así que el reinicio del ciclo podía caer con la
// miniatura bien visible en el centro de la pantalla, y se notaba. En vez
// de disimularlo con un fundido a ciegas, un IntersectionObserver detecta
// el instante exacto en que la miniatura termina de salir de la pantalla
// (se mueve todo el tiempo por la fila horizontal) y ahí — solo ahí, que
// es invisible — se reinicia la animación desde el principio. Cuando
// vuelve a entrar en cámara, arranca de nuevo desde arriba de la página.
function Tile({ template, size, autoScroll, scrollDepth, scrollDuration }) {
  const scale = size / REAL_WIDTH;
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!autoScroll) return undefined;
    const el = scrollRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          el.style.animationName = 'none';
          void el.offsetHeight; // fuerza a "olvidar" el punto del ciclo anterior
          el.style.animationName = 'swd-hero-tile-scroll';
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoScroll]);

  return (
    <div
      style={{
        width: size,
        height: size * 0.66,
        flexShrink: 0,
        borderRadius: 8,
        overflow: 'hidden',
        background: 'white',
        boxShadow: '0 14px 30px -10px oklch(0.15 0.02 258 / 0.4)',
        border: '1px solid oklch(1 0 0 / 0.08)',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${100 / scale}%`,
          pointerEvents: 'none',
        }}
      >
        <div
          ref={autoScroll ? scrollRef : undefined}
          className={autoScroll ? 'swd-hero-tile-scroll' : undefined}
          style={
            autoScroll
              ? { '--swd-scroll-depth': `-${scrollDepth}px`, animationDuration: `${scrollDuration}s` }
              : undefined
          }
        >
          <SitePreview
            template={template}
            siteData={template.demo}
            theme={{ accent: template.accent, accentSoft: template.accentSoft }}
            sections={primerasSecciones(template, autoScroll ? (template.sections || []).length : 3)}
            widgets={{ whatsappFloating: false }}
          />
        </div>
      </div>
    </div>
  );
}

// Filas de la pared: cada una cicla las plantillas reales en un orden
// desfasado (no la misma secuencia en cada fila) para que no se repita el
// mismo patrón vertical. Una de cada cuatro miniaturas scrollea sola (ver
// `Tile`) — el patrón de cuál le toca se desfasa por fila (+rowIndex) para
// que no queden siempre alineadas en columna.
function buildRow(rowIndex, count, size, templates) {
  const tiles = [];
  for (let i = 0; i < count; i++) {
    const idx = (i * 3 + rowIndex * 2) % templates.length;
    const autoScroll = (i + rowIndex) % 4 === 0;
    tiles.push({
      key: `${rowIndex}-${i}`,
      template: templates[idx],
      size,
      autoScroll,
      scrollDepth: 460 + ((i * 5 + rowIndex * 7) % 4) * 70,
      scrollDuration: 15 + ((i * 3 + rowIndex) % 5) * 2,
    });
  }
  return tiles;
}

const DEPTH_STYLE = [
  { filter: 'none', opacity: 1 },
  { filter: 'blur(1px)', opacity: 0.8 },
];

function Row({ row }) {
  const depth = DEPTH_STYLE[row.depth];
  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 14, ...depth }}>
      <div
        className={`swd-hero-wall-track swd-hero-wall-${row.dir}`}
        style={{ display: 'flex', gap: 14, width: 'max-content', animationDuration: `${row.duration}s` }}
      >
        {row.tiles.map((t) => (
          <Tile
            key={`a-${t.key}`}
            template={t.template}
            size={t.size}
            autoScroll={t.autoScroll}
            scrollDepth={t.scrollDepth}
            scrollDuration={t.scrollDuration}
          />
        ))}
        {row.tiles.map((t) => (
          <Tile
            key={`b-${t.key}`}
            template={t.template}
            size={t.size}
            autoScroll={t.autoScroll}
            scrollDepth={t.scrollDepth}
            scrollDuration={t.scrollDuration}
          />
        ))}
      </div>
    </div>
  );
}

export default function HeroWall() {
  const { selectableTemplates } = useApp();

  // Las plantillas reales llegan async (fetch al catálogo) — hasta que
  // resuelvan, se muestra solo el fondo oscuro en vez de armar la pared con
  // una lista vacía.
  const rows = useMemo(() => {
    if (!selectableTemplates.length) return null;
    return [
      { tiles: buildRow(0, 7, 190, selectableTemplates), dir: 'left', duration: 55, depth: 0 },
      { tiles: buildRow(1, 6, 165, selectableTemplates), dir: 'right', duration: 48, depth: 1 },
      { tiles: buildRow(2, 7, 190, selectableTemplates), dir: 'left', duration: 60, depth: 0 },
      { tiles: buildRow(3, 6, 165, selectableTemplates), dir: 'right', duration: 50, depth: 1 },
      { tiles: buildRow(4, 7, 190, selectableTemplates), dir: 'left', duration: 52, depth: 0 },
      { tiles: buildRow(5, 6, 165, selectableTemplates), dir: 'right', duration: 58, depth: 1 },
      { tiles: buildRow(6, 7, 190, selectableTemplates), dir: 'left', duration: 54, depth: 0 },
    ];
  }, [selectableTemplates]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'oklch(0.19 0.03 258)' }}>
      {rows && (
        <div
          style={{
            position: 'absolute',
            inset: '-15% -5%',
            transform: 'perspective(1000px) rotateX(24deg) rotate(-5deg) scale(1.3)',
            transformOrigin: 'center',
          }}
        >
          {rows.map((row, i) => (
            <Row key={i} row={row} />
          ))}
        </div>
      )}
      {/* Velo oscuro para que el texto blanco del hero siga siendo legible */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, oklch(0.19 0.03 258 / 0.55) 0%, oklch(0.19 0.03 258 / 0.8) 55%, oklch(0.19 0.03 258 / 0.96) 100%)',
        }}
      />
      <style>{`
        @keyframes swd-hero-wall-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes swd-hero-wall-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .swd-hero-wall-track { animation-timing-function: linear; animation-iteration-count: infinite; }
        .swd-hero-wall-left { animation-name: swd-hero-wall-left; }
        .swd-hero-wall-right { animation-name: swd-hero-wall-right; }
        @keyframes swd-hero-tile-scroll {
          0%, 8% { transform: translateY(0); }
          45%, 55% { transform: translateY(var(--swd-scroll-depth)); }
          92%, 100% { transform: translateY(0); }
        }
        .swd-hero-tile-scroll {
          animation-name: swd-hero-tile-scroll;
          animation-timing-function: cubic-bezier(.65,0,.35,1);
          animation-iteration-count: infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .swd-hero-wall-track { animation: none; }
          .swd-hero-tile-scroll { animation: none; }
        }
      `}</style>
    </div>
  );
}
