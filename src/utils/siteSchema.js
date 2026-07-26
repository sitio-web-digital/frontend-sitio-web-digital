// Esquema único del sitio: la idea es que TODO lo que hace falta para reconstruir
// la página de un cliente (plantilla elegida, tema, y el contenido de cada sección)
// viva en un solo documento JSON, con la forma "plantilla -> elementos -> cada
// elemento con su distribución (variant) y su propia información". Hoy ese
// documento se guarda en localStorage; el día de mañana el mismo objeto es lo que
// se mandaría a una API real y se guardaría en una base de datos — hydrateSite()
// es exactamente lo que se llamaría después de traerlo de vuelta con un GET.

const STORAGE_KEY = 'sitiowebdigital.site.v1';

// Tipos de sección cuyo contenido no vive "suelto" en el estado de React sino
// en su propio arreglo separado (productos, faqs, testimonios) — para armar el
// JSON, ese arreglo pasa a vivir adentro del elemento que lo usa.
const LIST_CONTENT_BY_TYPE = {
  productos: 'productos',
  faq: 'faqs',
  testimonios: 'testimonios',
  precios: 'planes',
  equipo: 'equipo',
  menu: 'menuItems',
  marcas: 'marcas',
  blog: 'posts',
};

// Arma el documento único a partir de los distintos pedazos de estado de React.
// Cada sección se guarda con su tipo, su distribución (variant), los colores que
// se le hayan puesto, y su propio contenido — nada de esto vive "afuera" del
// elemento al que pertenece.
export function serializeSite({
  templateId,
  siteData,
  theme,
  logoUrl,
  widgets,
  textStyles,
  published,
  sections,
  productos,
  faqs,
  testimonios,
  planes,
  equipo,
  menuItems,
  marcas,
  posts,
}) {
  if (!templateId) return null;

  const listContent = { productos, faqs, testimonios, planes, equipo, menuItems, marcas, posts };

  const sectionsJSON = (sections || []).map((sec) => {
    const { id, type, variant, bgColor, headingColor, textColor, buttonColor, ...rest } = sec;
    const style = { bgColor: bgColor ?? null, headingColor: headingColor ?? null, textColor: textColor ?? null, buttonColor: buttonColor ?? null };

    const listKey = LIST_CONTENT_BY_TYPE[type];
    const data = listKey ? { items: listContent[listKey] || [] } : { ...rest };
    if (type === 'faq') data.imagenes = sec.faqImagenes ?? [];

    return { id, type, variant: variant ?? null, style, data };
  });

  return {
    version: 1,
    templateId,
    siteData: siteData || null,
    theme: theme || null,
    logoUrl: logoUrl || null,
    widgets: widgets || {},
    textStyles: textStyles || {},
    published: !!published,
    sections: sectionsJSON,
  };
}

// Camino inverso: a partir del documento único, arma de nuevo los pedazos de
// estado que necesita React. Esto es lo que se llamaría después de traer el
// JSON guardado desde una API real, cuando el cliente entra a editar su página.
export function hydrateSite(json) {
  if (!json || !json.templateId) return null;

  const sections = (json.sections || []).map((sec) => {
    const { id, type, variant, style, data } = sec;
    const flat = { id, type, variant: variant ?? undefined, ...(style || {}) };
    if (type === 'faq' && data?.imagenes) flat.faqImagenes = data.imagenes;
    if (!LIST_CONTENT_BY_TYPE[type] && data) {
      // Contenido propio de la sección que no es una lista (ej: los textos y
      // campos del formulario de "contacto") vuelve a vivir sobre la sección.
      Object.entries(data).forEach(([k, v]) => {
        flat[k] = v;
      });
    }
    return flat;
  });

  const findItems = (type) => json.sections?.find((s) => s.type === type)?.data?.items ?? [];

  return {
    templateId: json.templateId,
    siteData: json.siteData ?? null,
    theme: json.theme ?? null,
    logoUrl: json.logoUrl ?? null,
    widgets: json.widgets ?? { whatsappFloating: true },
    textStyles: json.textStyles ?? {},
    published: !!json.published,
    sections,
    productos: findItems('productos'),
    faqs: findItems('faq'),
    testimonios: findItems('testimonios'),
    planes: findItems('precios'),
    equipo: findItems('equipo'),
    menuItems: findItems('menu'),
    marcas: findItems('marcas'),
    posts: findItems('blog'),
  };
}

// MOCK: acá "guardamos en la base de datos" — hoy es localStorage, mañana sería
// una llamada real a una API (por ejemplo, POST /sites/:id).
export function saveSiteToStorage(json) {
  try {
    if (!json) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
  } catch {
    // localStorage puede fallar (modo privado, cuota llena, etc) — no debe romper la app.
  }
}

// MOCK: acá "cargamos desde la base de datos" — hoy lee localStorage, mañana
// sería un GET /sites/:id cuando el cliente entra a editar su página guardada.
export function loadSiteFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
