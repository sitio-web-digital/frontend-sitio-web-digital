import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getTemplateById, recomendarPlantillaPorTags, recomendarPlantillaPorTexto, tint } from '../data/mockData';

// Logo provisorio: se muestra en la vista previa mientras completan el
// formulario, hasta que suban el suyo — un ícono genérico de "imagen todavía
// sin cargar", no las iniciales del negocio (eso se veía como un logo roto
// antes de tener uno real).
const PLACEHOLDER_LOGO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="6" fill="#ffffff" fill-opacity="0.16"/>
      <circle cx="8.5" cy="8.5" r="1.8" fill="#ffffff" fill-opacity="0.65"/>
      <path d="M4 17.2l5-5.6 3.4 3.4L16 10l4 5.6V18a1 1 0 01-1 1H5a1 1 0 01-1-1v-0.8z" fill="#ffffff" fill-opacity="0.65"/>
    </svg>`
  );

// Espera a que haya una pausa real al tipear antes de reflejar el valor —
// sin esto, la vista previa recalculaba la plantilla recomendada (y
// redibujaba el nombre del negocio) en CADA letra, lo que además de generar
// parpadeo hacía que a mitad de palabra ("pan...") el matching probara y
// descartara plantillas de rubros que no tienen nada que ver, antes de
// asentarse en la palabra completa.
function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Estado derivado del quiz en curso, compartido entre /quiz y el widget de
// demo en vivo de la Home: la plantilla "de ejemplo" a mostrar en la vista
// previa, su tema de color y los datos de sitio — misma lógica en los dos
// lugares, para que el negocio elegido en la Home se sienta continuo si
// después entra a /quiz.
//
// El rubro se escribe libre (sin elegir de una lista fija): a medida que se
// tipea, se busca ese texto contra el catálogo de tipos de negocio para
// sugerir una plantilla acorde (con sus propias imágenes) — si no matchea
// nada todavía, se muestra una plantilla por defecto.
export function useDraftPreview(templateOverride) {
  const { quiz, logoUrl, selectableTemplates } = useApp();
  // El input de cada paso sigue leyendo/escribiendo `quiz.*` directo (cero
  // demora ahí) — lo que se debounca es solo lo que alimenta a la vista
  // previa en miniatura, para que no se redibuje en cada tecla.
  const nombreNegocio = useDebounced(quiz.nombreNegocio);
  const tipoNegocio = useDebounced(quiz.tipoNegocio);
  const frase = useDebounced(quiz.frase);
  const whatsapp = useDebounced(quiz.whatsapp);
  const rubroTexto = tipoNegocio?.trim() || null;

  // El logo subido queda guardado como URL de blob, que deja de servir en
  // cuanto se recarga la página — si eso pasa, `logoUrl` sigue con un valor
  // (no es null) pero la imagen ya no carga. Sin este chequeo, ese link roto
  // tapa el logo provisorio en vez de mostrarlo.
  const [logoBroken, setLogoBroken] = useState(false);
  useEffect(() => {
    if (!logoUrl) {
      setLogoBroken(false);
      return undefined;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => !cancelled && setLogoBroken(false);
    img.onerror = () => !cancelled && setLogoBroken(true);
    img.src = logoUrl;
    return () => {
      cancelled = true;
    };
  }, [logoUrl]);
  const previewLogoUrl = logoUrl && !logoBroken ? logoUrl : PLACEHOLDER_LOGO;

  const draftTemplate = useMemo(() => {
    if (templateOverride) return getTemplateById(templateOverride, selectableTemplates);
    return (
      recomendarPlantillaPorTexto(rubroTexto, selectableTemplates) ||
      recomendarPlantillaPorTags([], selectableTemplates)
    );
  }, [templateOverride, rubroTexto, selectableTemplates]);
  const draftTheme = useMemo(
    () =>
      quiz.logoAccent
        ? { accent: quiz.logoAccent, accentSoft: tint(quiz.logoAccent, 82) }
        : { accent: draftTemplate.accent, accentSoft: draftTemplate.accentSoft },
    [quiz.logoAccent, draftTemplate]
  );
  // rubroLabel es el "eyebrow" chiquito arriba del nombre (lo llena el rubro
  // del paso 2); sobreNosotros es el párrafo debajo del nombre (lo llena la
  // frase de portada del paso 3) — son dos campos distintos del Hero, antes
  // la frase pisaba por error el mismo campo que ya usaba el rubro.
  const draftSiteData = useMemo(
    () => ({
      ...draftTemplate.demo,
      nombreNegocio: nombreNegocio?.trim() || draftTemplate.demo.nombreNegocio,
      rubroLabel: rubroTexto || draftTemplate.demo.rubroLabel,
      sobreNosotros: frase?.trim() || draftTemplate.demo.sobreNosotros,
      whatsapp: whatsapp?.trim() || draftTemplate.demo.whatsapp,
    }),
    [draftTemplate, nombreNegocio, frase, whatsapp, rubroTexto]
  );

  return { rubroTexto, draftTemplate, draftTheme, draftSiteData, previewLogoUrl };
}
