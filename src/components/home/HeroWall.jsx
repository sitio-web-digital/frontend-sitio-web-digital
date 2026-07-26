import { useMemo } from 'react';
import SitePreview from '../SitePreview';
import { useApp } from '../../context/AppContext';
import { seccionesPropias } from '../quiz/QuizSteps';

// Fondo del hero principal: una "pared" infinita de miniaturas en perspectiva
// y en movimiento lento. Son capturas de verdad de las plantillas reales del
// catálogo (header + hero, con sus fotos/tipografía/íconos propios) — nada
// de wireframes ni bloques de color simulando texto: cada una tiene que
// leerse como el screenshot de un sitio terminado. Ninguna de nuestras
// plantillas usa una marca real (son negocios de ejemplo que armamos
// nosotros), así que se pueden repetir acá sin problema.
const REAL_WIDTH = 1200;

function Tile({ template, size }) {
  const scale = size / REAL_WIDTH;
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
        <SitePreview
          template={template}
          siteData={template.demo}
          theme={{ accent: template.accent, accentSoft: template.accentSoft }}
          sections={seccionesPropias(template, ['header', 'hero'])}
          widgets={{ whatsappFloating: false }}
        />
      </div>
    </div>
  );
}

// Filas de la pared: cada una cicla las plantillas reales en un orden
// desfasado (no la misma secuencia en cada fila) para que no se repita el
// mismo patrón vertical.
function buildRow(rowIndex, count, size, templates) {
  const tiles = [];
  for (let i = 0; i < count; i++) {
    const idx = (i * 3 + rowIndex * 2) % templates.length;
    tiles.push({ key: `${rowIndex}-${i}`, template: templates[idx], size });
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
          <Tile key={`a-${t.key}`} template={t.template} size={t.size} />
        ))}
        {row.tiles.map((t) => (
          <Tile key={`b-${t.key}`} template={t.template} size={t.size} />
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
        @media (prefers-reduced-motion: reduce) {
          .swd-hero-wall-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
