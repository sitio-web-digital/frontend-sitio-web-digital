import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import SitePreview from './SitePreview';

const MIN_SCALE = 0.22;
const MAX_SCALE = 0.6;

// Muestra una plantilla en miniatura de verdad: el layout real de escritorio
// (donde cada plantilla se diseñó y donde sus fotos/columnas encajan como
// corresponde) escalado hacia abajo, en vez de forzar ese mismo layout a un
// contenedor angosto — eso último es lo que hacía que el texto se superpusiera
// con las fotos y el conjunto se viera roto.
//
// Tres modos:
// - Fijo (por defecto, `heightClassName` + `scale` fija): todas las tarjetas
//   miden lo mismo entre sí — para una grilla, donde conviene recortar el
//   sobrante antes que tener alturas dispares.
// - `targetHeight` (px): el marco SIEMPRE mide ese alto exacto — la escala se
//   calcula sola para que el contenido lo llene entero, sea cual sea la
//   plantilla (útil para un vistazo rápido de un par de secciones).
// - `viewportHeight` (px): el marco mide como MÁXIMO ese alto, con scroll
//   vertical si el contenido (a la escala fija) es más alto — para mostrar la
//   plantilla COMPLETA. Si el contenido entra en menos alto que eso (la
//   mayoría de las plantillas, a esta escala), el marco se achica a ese
//   tamaño real en vez de dejar un colchón blanco de sobra al final. El
//   scroll se maneja a mano (con la rueda del mouse) en vez de con
//   `overflow-y: auto` nativo: un contenedor con scroll nativo mide el alto
//   SIN escalar de su contenido transformado, así que el "final" del scroll
//   quedaba mucho más abajo que el final visual (ya escalado) del contenido,
//   dejando una pantalla en blanco al llegar abajo. El listener de rueda se
//   agrega a mano (no vía onWheel de React) porque React lo trata como
//   pasivo por default y preventDefault() no alcanza a frenar el scroll de
//   la página de atrás.
export default function MiniSitePreview({
  template,
  siteData,
  theme,
  logoUrl,
  sections,
  widgets,
  scale = 0.4,
  targetHeight,
  viewportHeight,
  heightClassName = 'h-56',
  className = '',
}) {
  const measureRef = useRef(null);
  const containerRef = useRef(null);
  const maxOffsetRef = useRef(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const measuring = !!(targetHeight || viewportHeight);

  useLayoutEffect(() => {
    if (!measuring) return undefined;
    const el = measureRef.current;
    if (!el) return undefined;
    const measure = () => setNaturalHeight(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measuring, template?.id, siteData, sections]);

  useEffect(() => {
    setScrollOffset(0);
  }, [template?.id]);

  useEffect(() => {
    if (!viewportHeight) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (maxOffsetRef.current <= 0) return;
      e.preventDefault();
      setScrollOffset((o) => Math.min(maxOffsetRef.current, Math.max(0, o + e.deltaY)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewportHeight]);

  if (viewportHeight) {
    const widthPct = `${Math.round(100 / scale)}%`;
    const contentHeight = naturalHeight * scale;
    const frameHeight = naturalHeight ? Math.min(viewportHeight, contentHeight) : viewportHeight;
    const maxOffset = Math.max(0, contentHeight - frameHeight);
    maxOffsetRef.current = maxOffset;
    const offset = Math.min(scrollOffset, maxOffset);

    return (
      <div ref={containerRef} className={`overflow-hidden relative bg-white ${className}`} style={{ height: frameHeight }}>
        <div style={{ transform: `translateY(${-offset}px)` }}>
          <div
            ref={measureRef}
            className="origin-top-left pointer-events-none"
            style={{ transform: `scale(${scale})`, width: widthPct }}
          >
            <SitePreview
              template={template}
              siteData={siteData}
              theme={theme}
              logoUrl={logoUrl}
              sections={sections}
              widgets={widgets ?? { whatsappFloating: false }}
            />
          </div>
        </div>
      </div>
    );
  }

  const effectiveScale = targetHeight
    ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, naturalHeight ? targetHeight / naturalHeight : scale))
    : scale;
  const widthPct = `${Math.round(100 / effectiveScale)}%`;

  return (
    <div
      className={`overflow-hidden relative bg-white ${targetHeight ? '' : heightClassName} ${className}`}
      style={targetHeight ? { height: targetHeight } : undefined}
    >
      <div
        ref={measureRef}
        className={`absolute top-0 left-0 origin-top-left pointer-events-none ${targetHeight ? '' : 'right-0 bottom-0'}`}
        style={{ transform: `scale(${effectiveScale})`, width: widthPct }}
      >
        <SitePreview
          template={template}
          siteData={siteData}
          theme={theme}
          logoUrl={logoUrl}
          sections={sections}
          widgets={widgets ?? { whatsappFloating: false }}
        />
      </div>
    </div>
  );
}
