import { useEffect, useMemo, useState } from 'react';
import SitePreview from '../SitePreview';
import { useApp } from '../../context/AppContext';
import { seccionesPropias } from '../quiz/QuizSteps';

// Cuatro plantillas reales del catálogo (no las de fábrica), elegidas para
// que se vea variedad de rubro de un vistazo: automotor, gastronomía,
// comercio y oficios.
const CARD_TEMPLATE_IDS = ['motor-sur', 'dulce-horno', 'casa-nogal', 'chispa-electricistas'];

const DEPTH_STYLES = [
  { transform: 'translate(0px, 0px) scale(1) rotate(0deg)', zIndex: 5, opacity: 1, shadow: '0 30px 60px -14px' },
  { transform: 'translate(22px, 22px) scale(0.94) rotate(2.5deg)', zIndex: 4, opacity: 0.9, shadow: '0 20px 40px -14px' },
  { transform: 'translate(38px, 40px) scale(0.88) rotate(4.5deg)', zIndex: 3, opacity: 0.7, shadow: '0 14px 30px -14px' },
  { transform: 'translate(50px, 54px) scale(0.82) rotate(6deg)', zIndex: 2, opacity: 0.45, shadow: '0 10px 24px -14px' },
];

function TemplateCapture({ template }) {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <div style={{ transform: 'scale(0.72)', transformOrigin: 'top left', width: '138.9%', height: '138.9%' }}>
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

export default function HeroDeck() {
  const { selectableTemplates } = useApp();
  // Las plantillas propias llegan async (fetch al catálogo real) — hasta que
  // resuelvan, `selectableTemplates` puede no tener todavía estos ids y
  // getTemplateById() caería en la primera plantilla de fábrica como
  // respaldo (un flash de la plantilla equivocada). Mientras tanto no se
  // muestra nada, en vez de una equivocada.
  const cards = useMemo(() => {
    const found = CARD_TEMPLATE_IDS.map((id) => selectableTemplates.find((t) => t.id === id)).filter(Boolean);
    return found.length === CARD_TEMPLATE_IDS.length
      ? found.map((template) => ({ key: template.id, template }))
      : null;
  }, [selectableTemplates]);

  const [order, setOrder] = useState([0, 1, 2, 3]);

  useEffect(() => {
    const id = setInterval(() => {
      setOrder((prev) => [...prev.slice(1), prev[0]]);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const bringToFront = (cardIndex) => {
    setOrder((prev) => [cardIndex, ...prev.filter((i) => i !== cardIndex)]);
  };

  if (!cards) return <div style={{ aspectRatio: '904 / 540' }} />;

  return (
    <div style={{ position: 'relative', padding: '1.5rem 0 2.5rem' }}>
      <div style={{ position: 'relative', aspectRatio: '904 / 540' }}>
        {order.map((cardIndex, depth) => {
          const card = cards[cardIndex];
          const d = DEPTH_STYLES[depth];
          return (
            <div
              key={card.key}
              onClick={() => bringToFront(cardIndex)}
              style={{
                position: 'absolute',
                inset: 0,
                transform: d.transform,
                zIndex: d.zIndex,
                opacity: d.opacity,
                transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1), opacity 0.7s',
                cursor: 'pointer',
                background: 'oklch(0.25 0.035 258)',
                boxShadow: `oklch(0.15 0.025 258 / 0.75) ${d.shadow}`,
                border: '1px solid oklch(0.97 0.008 95 / 0.1)',
              }}
            >
              <TemplateCapture template={card.template} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
        {cards.map((card, i) => (
          <div
            key={card.key}
            onClick={() => bringToFront(i)}
            style={{
              height: 6,
              width: order[0] === i ? 22 : 6,
              borderRadius: 3,
              cursor: 'pointer',
              transition: '0.3s',
              background: order[0] === i ? 'oklch(0.8 0.15 86)' : 'oklch(0.97 0.008 95 / 0.25)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
