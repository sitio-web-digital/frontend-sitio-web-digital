import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  TEMPLATES,
  RUBROS,
  getTemplateById,
  slugify,
  tint,
  SECTION_VARIANTS,
  SECCIONES_UNICAS,
  seedProductos,
  seedFaqs,
  seedTestimonios,
  seedPlanes,
  seedEquipo,
  seedMenu,
  seedMarcas,
  seedPosts,
} from '../data/mockData';
import { serializeSite, hydrateSite, saveSiteToStorage, loadSiteFromStorage } from '../utils/siteSchema';
import {
  apiLogin,
  apiRegister,
  apiMe,
  apiLogoutLocal,
  apiListMySites,
  apiCreateSite,
  apiGetSite,
  apiUpdateSite,
  apiSetSubdomain,
  apiUpdateMe,
  apiListSupportTickets,
  apiCreateSupportTicket,
  apiAdminGetSite,
  apiAdminUpdateSite,
  apiAdminSetSiteLock,
  apiAdminSetSitePublished,
  apiGetSiteStatus,
  apiGetSiteStats,
  apiGetSubscription,
  apiStartSubscription,
  apiPublishFree,
  apiRefreshSubscription,
  apiCancelSubscription,
  apiListCatalogTemplates,
  apiListCatalogRubros,
  apiAdminGetTemplate,
  apiAdminCreateTemplate,
  apiAdminUpdateTemplate,
  apiAdminCreateRubro,
} from '../api/client';
import { extractPalette } from '../utils/extractColor';
import { trackEvent } from '../utils/analytics';

const AppCtx = createContext(null);

// Qué página (de las N que puede tener una cuenta) está cargada en el
// editor/checkout/estadísticas ahora mismo — persistido para sobrevivir un
// refresh de página (ver switchSite/resetAll y el efecto de restauración
// de sesión más abajo).
const ACTIVE_SITE_KEY = 'sitiowebdigital.activeSiteId';

// Se lee una sola vez al cargar el módulo: si el navegador ya tenía un sitio
// guardado (de una sesión anterior), arrancamos con ese contenido en vez de
// una hoja en blanco — así probamos de verdad que el JSON alcanza para
// reconstruir toda la página, tal como pasaría con una API real.
const initialHydrated = hydrateSite(loadSiteFromStorage());

// Teléfono, dirección e Instagram ya no se piden acá: son datos que se cargan
// directo en el editor (Contacto/Sobre nosotros, o la función de cada objeto
// Botón), no una intención elegida al principio del cuestionario. El
// WhatsApp sí se vuelve a pedir (paso 3, "Tu mensaje"): es solo un default
// cómodo para el botón principal del Hero, se puede pisar después por botón.
const initialQuiz = {
  nombreNegocio: '',
  tipoNegocio: null,
  frase: '',
  whatsapp: '',
  logoAccent: null,
};

// Plantilla en blanco (Admin > Plantillas > "Crear nueva plantilla"): a
// diferencia de elegir una de la galería, el admin arranca de una hoja
// completamente vacía (sin secciones) y arma la suya desde cero con el
// mismo "+" que ve cualquier sitio sin contenido. No es una plantilla real
// del catálogo (no vive en TEMPLATES ni en custom_templates) — solo existe
// mientras el admin está armando el borrador, hasta que la guarda.
const BLANK_TEMPLATE_ACCENT = '#9d6400';
const BLANK_TEMPLATE = {
  id: '__blank__',
  rubros: [],
  tags: [],
  nombre: 'Nueva plantilla',
  tagline: '',
  accent: BLANK_TEMPLATE_ACCENT,
  accentSoft: tint(BLANK_TEMPLATE_ACCENT, 88),
};

export function AppProvider({ children }) {
  const [quiz, setQuiz] = useState(initialQuiz);
  const [templateId, setTemplateId] = useState(initialHydrated?.templateId ?? null);
  const [siteData, setSiteData] = useState(initialHydrated?.siteData ?? null);
  const [logoUrl, setLogoUrl] = useState(initialHydrated?.logoUrl ?? null);
  const [published, setPublished] = useState(initialHydrated?.published ?? false);
  // A diferencia del resto del estado del sitio, el subdominio no vive en el
  // JSON de `hydrateSite()` (es identidad de cuenta, no contenido de página)
  // — por eso no puede salir de `initialHydrated` (que es solo localStorage)
  // y arranca en null hasta que se resuelve la sesión contra el servidor.
  const [subdomain, setSubdomain] = useState(null);
  const [theme, setTheme] = useState(initialHydrated?.theme ?? null);
  const [sections, setSections] = useState(initialHydrated?.sections ?? []);
  const [productos, setProductos] = useState(initialHydrated?.productos ?? []);
  const [faqs, setFaqs] = useState(initialHydrated?.faqs ?? []);
  const [testimonios, setTestimonios] = useState(initialHydrated?.testimonios ?? []);
  const [planes, setPlanes] = useState(initialHydrated?.planes ?? []);
  const [equipo, setEquipo] = useState(initialHydrated?.equipo ?? []);
  const [menuItems, setMenuItems] = useState(initialHydrated?.menuItems ?? []);
  const [marcas, setMarcas] = useState(initialHydrated?.marcas ?? []);
  const [posts, setPosts] = useState(initialHydrated?.posts ?? []);
  const [widgets, setWidgets] = useState(initialHydrated?.widgets ?? { whatsappFloating: true });
  const [textStyles, setTextStyles] = useState(initialHydrated?.textStyles ?? {});
  const [user, setUser] = useState(null);
  const [logoPalette, setLogoPalette] = useState([]);
  // Consultas a soporte (Dashboard > Soporte) — se guardan en Postgres
  // (tabla support_tickets, protegida con el mismo token de sesión que el
  // resto de los endpoints) y se cargan al loguearse/recargar, más abajo.
  const [supportTickets, setSupportTickets] = useState([]);
  // Cuando un admin entra a editar la página de otra cuenta (Admin > Páginas),
  // esto guarda de quién es — mientras esté seteado, guardar cambios pega
  // contra esa página puntual (PUT /api/admin/sites/:id) en vez de la propia.
  const [adminEditingSite, setAdminEditingSite] = useState(null);
  // Cuando el admin retoma una plantilla ya creada (Admin > Plantillas >
  // "Editar"), esto guarda sus metadatos (id, nombre, tagline, rubros,
  // published) — mientras esté seteado, "Guardar como plantilla" actualiza
  // esta misma en vez de crear una nueva (ver saveAsTemplate/editTemplate).
  const [editingTemplate, setEditingTemplate] = useState(null);
  // Si soporte bloqueó esta página (Admin > Páginas > Bloquear), el dueño no
  // puede editarla ni guardar cambios — se ignora cuando un admin la está
  // editando (adminEditingSite), que siempre puede seguir trabajando en ella.
  const [siteLocked, setSiteLocked] = useState(false);
  // Todas las páginas de la cuenta logueada (Dashboard) y cuál de ellas está
  // cargada en los slots de arriba (siteData/template/subdomain/etc.) en
  // este momento — null significa "todavía ninguna" (recién entrando a
  // /quiz para armar una nueva). Separado de adminEditingSite a propósito:
  // ese es para que un admin edite la página de OTRA cuenta, esto es para
  // que el dueño elija entre las suyas propias.
  const [mySites, setMySites] = useState([]);
  const [activeSiteId, setActiveSiteId] = useState(null);
  // Mutex para POST /sites: hay dos caminos que pueden intentar crear la
  // página todavía sin id (el autoguardado debounced de abajo y el guardado
  // explícito que hace Checkout.jsx al asignar subdominio) — sin esto, si
  // los dos disparan mientras activeSiteId sigue en null, cada uno crea su
  // propia fila y queda una página duplicada, huérfana y sin subdominio
  // (bug real, confirmado en vivo el 2026-08-09). El segundo que llega
  // espera la MISMA creación en vuelo en vez de arrancar la suya.
  const pendingSiteCreateRef = useRef(null);
  // El que "se sube" a una creación ya en vuelo (en vez de arrancarla) no
  // tiene forma de saber si su propio `json` (puede ser distinto al que
  // arrancó la creación — otro snapshot, otro momento) quedó guardado; un
  // apiUpdateSite de más después no rompe nada, y garantiza que su
  // contenido no se pierda pase lo que pase.
  const createOrJoinSite = async (json) => {
    if (!pendingSiteCreateRef.current) {
      pendingSiteCreateRef.current = apiCreateSite(json).finally(() => {
        pendingSiteCreateRef.current = null;
      });
    }
    const result = await pendingSiteCreateRef.current;
    if (result.ok) await apiUpdateSite(result.id, json);
    return result;
  };
  // Plantillas/rubros creados por el admin (Admin > Plantillas) — se
  // combinan con los de fábrica (TEMPLATES/RUBROS) más abajo, así el resto
  // de la app (quiz, galería, editor) los trata exactamente igual sin tener
  // que saber de dónde vino cada uno. Públicos: se cargan sin sesión
  // iniciada, porque el quiz y la galería los necesitan para cualquier
  // visitante.
  const [customTemplates, setCustomTemplates] = useState([]);
  const [customRubros, setCustomRubros] = useState([]);
  const refreshCatalog = () => {
    apiListCatalogTemplates().then(setCustomTemplates);
    apiListCatalogRubros().then(setCustomRubros);
  };
  useEffect(() => {
    refreshCatalog();
  }, []);
  const templates = useMemo(() => [...TEMPLATES, ...customTemplates], [customTemplates]);
  const rubros = useMemo(() => [...RUBROS, ...customRubros], [customRubros]);
  // Lo que se le OFRECE a quien tiene que elegir plantilla (galería, quiz):
  // fábrica + las creadas desde el editor por el admin, siempre las dos
  // juntas (mismo orden que `templates`, fábrica primero). Antes, apenas
  // existía una plantilla propia, tapaba el catálogo de fábrica entero —
  // eso escondía plantillas de fábrica nuevas (ej. Estudio Lumen) sin que
  // se notara por qué.
  const selectableTemplates = templates;

  // Cada vez que cambia el logo (en el quiz o después, desde el editor) se
  // recalcula automáticamente una paleta de colores a partir de él, para
  // ofrecerla como sugerencia en el editor de color de cualquier sección —
  // no hace falta que cada lugar que sube un logo se acuerde de pedirla.
  useEffect(() => {
    if (!logoUrl) {
      setLogoPalette([]);
      return undefined;
    }
    let cancelled = false;
    extractPalette(logoUrl).then((colors) => {
      if (!cancelled) setLogoPalette(colors || []);
    });
    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  // Fuente y color propios de un texto puntual (párrafo, título, precio, lo que
  // sea) — independiente del color general de la sección. Se guarda por
  // "styleKey" (un id estable por campo, ej. "hero.sobreNosotros" o
  // "producto.<id>.nombre"), no adentro del dato de contenido en sí.
  const setTextStyle = (key, patch) => {
    setTextStyles((prev) => {
      const merged = { ...(prev[key] || {}), ...patch };
      Object.keys(merged).forEach((k) => merged[k] === undefined && delete merged[k]);
      const next = { ...prev };
      if (Object.keys(merged).length === 0) delete next[key];
      else next[key] = merged;
      return next;
    });
  };

  // Historial de deshacer/rehacer (Ctrl+Z / Ctrl+Shift+Z) — snapshots
  // completos del sitio (mismo formato que serializeSite/hydrateSite, ya
  // usado para guardar y para restaurar la página de otra cuenta), no un
  // historial de comandos por función. Todo en refs (no useState) para no
  // generar renders extra en cada snapshot; `historyTick` es el único
  // useState, solo para que los botones deshacer/rehacer sepan si mostrarse
  // habilitados.
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  // Snapshot de referencia contra el que se compara cada cambio; también
  // sirve como "estado actual" al que volver si se hace redo después de un undo.
  const lastSnapshotRef = useRef(null);
  // Snapshot de ANTES de que arrancara la tanda de cambios en curso — es lo
  // que efectivamente se guarda en el historial cuando la tanda se asienta
  // (ver el debounce más abajo): así escribir un párrafo entero cuenta como
  // un solo paso de undo, no uno por tecla.
  const undoBurstBaseRef = useRef(null);
  const undoDebounceTimer = useRef(null);
  // Se prende justo antes de aplicar un snapshot (undo/redo) o de cargar un
  // sitio entero (login, "editar como admin", elegir plantilla) para que ESE
  // cambio de estado no se registre a sí mismo como un paso nuevo de historial.
  const skipHistoryRef = useRef(false);
  const [historyTick, setHistoryTick] = useState(0);

  const clearHistory = () => {
    undoStack.current = [];
    redoStack.current = [];
    undoBurstBaseRef.current = null;
    clearTimeout(undoDebounceTimer.current);
    skipHistoryRef.current = true;
    setHistoryTick((t) => t + 1);
  };

  // Se guarda en el navegador en cada cambio — este es el borrador local, vive
  // ahí siempre, esté o no logueado el usuario. Además, si hay sesión
  // iniciada, el mismo cambio se manda (con un debounce corto) a Postgres —
  // así cualquier edición queda guardada de verdad, esté publicada la página
  // o no, y un admin puede entrar a repararla en Admin > Páginas sin
  // depender de que el dueño se acuerde de tocar "Guardar cambios" a mano.
  const backendAutosaveTimer = useRef(null);
  useEffect(() => {
    const json = serializeSite({
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
    });
    saveSiteToStorage(json);

    // Registrar el paso de historial ANTES de todo lo demás de este efecto —
    // si vino de un undo/redo/carga completa (skipHistoryRef), no se anota
    // como si fuera una edición nueva del usuario. Se compara como STRING
    // (serializeSite devuelve un objeto nuevo en cada llamada, nunca `===`
    // al anterior aunque el contenido sea idéntico) y así también queda listo
    // para guardarse tal cual en los stacks y para JSON.parse en undo/redo.
    const historyJson = json ? JSON.stringify(json) : null;
    if (historyJson === null) {
      // Sin plantilla elegida todavía — nada que versionar.
    } else if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      lastSnapshotRef.current = historyJson;
    } else if (lastSnapshotRef.current === null) {
      lastSnapshotRef.current = historyJson; // primer render: solo fija la base, nada que anotar todavía
    } else if (historyJson !== lastSnapshotRef.current) {
      if (undoBurstBaseRef.current === null) undoBurstBaseRef.current = lastSnapshotRef.current;
      clearTimeout(undoDebounceTimer.current);
      undoDebounceTimer.current = setTimeout(() => {
        undoStack.current.push(undoBurstBaseRef.current);
        if (undoStack.current.length > 50) undoStack.current.shift();
        redoStack.current = [];
        undoBurstBaseRef.current = null;
        lastSnapshotRef.current = historyJson;
        setHistoryTick((t) => t + 1);
      }, 500);
    }

    clearTimeout(backendAutosaveTimer.current);
    // Si soporte bloqueó esta página, no se intenta guardar del lado del
    // dueño — el backend lo rechazaría igual, pero así no se gasta el pedido
    // ni se pisa el estado con un error silencioso en cada cambio.
    //
    // Mientras el admin está armando o editando una plantilla (blanco o ya
    // existente, ver startBlankTemplate/editTemplate), esto NO es su sitio
    // propio — sin este chequeo, cada cambio pisaría en silencio la página
    // real del admin con el contenido de la plantilla.
    const construyendoPlantilla = templateId === BLANK_TEMPLATE.id || !!editingTemplate;
    if (user && json && !construyendoPlantilla && !(siteLocked && !adminEditingSite)) {
      backendAutosaveTimer.current = setTimeout(async () => {
        if (adminEditingSite) {
          apiAdminUpdateSite(adminEditingSite.id, json);
        } else if (activeSiteId) {
          apiUpdateSite(activeSiteId, json);
        } else {
          // Todavía ninguna página creada para esta cuenta (recién viniendo
          // del quiz) — el primer autoguardado es el que la crea de verdad.
          // createOrJoinSite (no apiCreateSite directo) evita crear una
          // segunda fila si Checkout.jsx dispara su propio guardado casi al
          // mismo tiempo (ver el comentario en pendingSiteCreateRef).
          const result = await createOrJoinSite(json);
          if (result.ok) {
            setActiveSiteId(result.id);
            try {
              localStorage.setItem(ACTIVE_SITE_KEY, String(result.id));
            } catch {
              // no-op
            }
          }
        }
      }, 1200);
    }
    return () => clearTimeout(backendAutosaveTimer.current);
  }, [
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
    user,
    adminEditingSite,
    editingTemplate,
    siteLocked,
    activeSiteId,
  ]);

  // Importante: pasar `templates` (fábrica + admin combinadas) — sin esto,
  // una plantilla creada por el admin resolvería mal en cada render (sólo
  // "chooseTemplate" la encontraba al elegirla, pero después cada vez que
  // se recalcula `template` volvía a caer en el catálogo estático).
  //
  // `editingTemplate` cubre el caso de estar reabriendo una plantilla propia
  // todavía sin publicar (ver editTemplate): esa no vive en `templates` (que
  // solo trae las publicadas), así que sin este chequeo el editor la
  // encontraría en el primer render pero la perdería en el siguiente.
  const template =
    templateId === BLANK_TEMPLATE.id
      ? BLANK_TEMPLATE
      : editingTemplate && templateId === editingTemplate.id
        ? editingTemplate
        : templateId
          ? getTemplateById(templateId, templates)
          : null;

  // Al elegir plantilla, el sitio arranca con la disposición ya armada para ese
  // rubro (definida como JSON en cada TEMPLATE.sections: qué elementos trae y con
  // qué distribución) y se personaliza con lo que dijo el usuario en el quiz.
  // Hero, galería, "sobre nosotros" y footer son secciones como cualquier otra: se
  // siembran por default pero el usuario puede sacarlas, moverlas o volver a agregarlas.
  const chooseTemplate = (id) => {
    // Este flujo es para armar el sitio PROPIO de quien la elige (a partir de
    // esa plantilla como punto de partida) — nada que ver con estar editando
    // la plantilla en sí, así que cualquier edición de plantilla en curso
    // queda descartada acá.
    setEditingTemplate(null);
    clearHistory();
    // Busca en fábrica + admin combinadas — una plantilla creada por el
    // admin no existe en el TEMPLATES estático, así que getTemplateById(id)
    // solo (sin la lista combinada) nunca la encontraría.
    const t = getTemplateById(id, templates);
    const now = Date.now();

    const nextSiteData = {
      ...t.demo,
      nombreNegocio: quiz.nombreNegocio?.trim() || t.demo.nombreNegocio,
      rubroLabel: quiz.frase?.trim() || t.demo.rubroLabel,
      whatsapp: quiz.whatsapp?.trim() || t.demo.whatsapp,
    };

    // La plantilla trae su disposición ya armada; el usuario puede sacar o
    // agregar secciones (incluida la galería) después, desde el editor.
    const nextSections = (t.sections || [{ type: 'hero' }, { type: 'sobre-nosotros' }, { type: 'footer' }]).map(
      (s, i) => ({
        ...s,
        id: `${s.type}-${now + i}`,
        type: s.type,
        variant: s.variant ?? SECTION_VARIANTS[s.type]?.[0]?.id,
      })
    );

    setTemplateId(id);
    setSiteData(nextSiteData);
    // Si subió un logo durante el quiz, ya le sugerimos como color de la página el
    // color dominante de ese logo en vez del color por defecto de la plantilla.
    setTheme(
      quiz.logoAccent
        ? { accent: quiz.logoAccent, accentSoft: tint(quiz.logoAccent, 82) }
        : { accent: t.accent, accentSoft: t.accentSoft }
    );
    setSections(nextSections);
    // Las plantillas de gastronomía traen carrito prendido por default (se
    // arma el pedido completo y se manda por WhatsApp desde ahí en vez de
    // consultar producto por producto) — el dueño lo puede apagar después
    // desde el menú de widgets si no lo quiere.
    setWidgets({ whatsappFloating: true, carrito: !!t.rubros?.includes('gastronomia') });
    // Estilos de texto puntuales que trae la plantilla de fábrica (ej. una
    // tipografía distinta para los títulos) — se pisan igual que cualquier
    // otro estilo desde el editor una vez elegida.
    setTextStyles(t.textStyles || {});
    // Si la plantilla trae su propio contenido de ejemplo (t.seeds), se usa ese
    // en vez del genérico — así cada plantilla arranca con productos/planes/
    // equipo que de verdad corresponden a ese negocio, no un placeholder.
    const seeds = t.seeds || {};
    setProductos(nextSections.some((s) => s.type === 'productos') ? seeds.productos ?? seedProductos() : []);
    setFaqs(nextSections.some((s) => s.type === 'faq') ? seeds.faqs ?? seedFaqs(nextSiteData.horarios) : []);
    setTestimonios(nextSections.some((s) => s.type === 'testimonios') ? seeds.testimonios ?? seedTestimonios() : []);
    setPlanes(nextSections.some((s) => s.type === 'precios') ? seeds.planes ?? seedPlanes() : []);
    setEquipo(nextSections.some((s) => s.type === 'equipo') ? seeds.equipo ?? seedEquipo() : []);
    setMenuItems(nextSections.some((s) => s.type === 'menu') ? seeds.menuItems ?? seedMenu() : []);
    setMarcas(nextSections.some((s) => s.type === 'marcas') ? seeds.marcas ?? seedMarcas() : []);
    setPosts(nextSections.some((s) => s.type === 'blog') ? seeds.posts ?? seedPosts() : []);
    // Cada vez que se arranca una página nueva, el tutorial del editor se
    // muestra de nuevo (aunque ya se haya visto en una página anterior).
    try {
      localStorage.removeItem('sitiowebdigital.editorTutorialSeen');
    } catch {
      // localStorage puede fallar (modo privado, cuota llena) — no debe romper la app.
    }
  };

  // Admin > Plantillas > "Crear nueva plantilla": a diferencia de
  // chooseTemplate, no parte de ninguna plantilla existente — arranca con
  // `sections: []` para que en el editor aparezca el mismo botón de
  // "Agregar tu primer elemento" que ve cualquier sitio vacío, y desde ahí
  // arma la plantilla sección por sección.
  const startBlankTemplate = () => {
    setEditingTemplate(null);
    clearHistory();
    setTemplateId(BLANK_TEMPLATE.id);
    // Texto de ejemplo genérico (no de un negocio puntual, a diferencia de
    // las plantillas de fábrica) — sin esto, cada sección que se agrega
    // aparece con los campos vacíos y no se nota dónde hay que tocar para
    // editar. Se reemplaza fácil antes de publicar.
    setSiteData({
      nombreNegocio: 'Nombre de tu negocio',
      rubroLabel: 'Rubro o eslogan corto',
      sobreNosotros:
        'Contá acá de qué se trata tu negocio: hace cuánto existe, qué te diferencia y qué le podés ofrecer a tus clientes.',
      whatsapp: '5491100000000',
      telefono: '011 0000-0000',
      direccion: 'Dirección de tu negocio',
      horarios: 'Lun a Vie, 9 a 18 hs',
      instagram: '@tunegocio',
      galeria: [],
    });
    setTheme({ accent: BLANK_TEMPLATE.accent, accentSoft: BLANK_TEMPLATE.accentSoft });
    setLogoUrl(null);
    setPublished(false);
    setSections([]);
    setWidgets({ whatsappFloating: true });
    setProductos([]);
    setFaqs([]);
    setTestimonios([]);
    setPlanes([]);
    setEquipo([]);
    setMenuItems([]);
    setMarcas([]);
    setPosts([]);
    try {
      localStorage.removeItem('sitiowebdigital.editorTutorialSeen');
    } catch {
      // localStorage puede fallar (modo privado, cuota llena) — no debe romper la app.
    }
  };

  // Admin > Plantillas > "Editar": reabre una plantilla ya guardada (publicada
  // o todavía borrador) con TODO su contenido tal cual quedó, para seguir
  // retocándola — a diferencia de chooseTemplate (que la usa como punto de
  // partida para el sitio de otra persona), esto vuelve a abrir la plantilla
  // EN SÍ. Mientras `editingTemplate` quede seteado, "Guardar como plantilla"
  // actualiza esta misma en vez de crear una nueva (ver saveAsTemplate).
  const editTemplate = async (id) => {
    const result = await apiAdminGetTemplate(id);
    if (!result.ok) return result;
    const t = result.template;
    setEditingTemplate(t);
    setTemplateId(t.id);
    setSiteData({ ...t.demo });
    setTheme({ accent: t.accent, accentSoft: tint(t.accent, 88) });
    const now = Date.now();
    const nextSections = (t.sections || []).map((s, i) => ({
      ...s,
      id: `${s.type}-${now}-${i}`,
      variant: s.variant ?? SECTION_VARIANTS[s.type]?.[0]?.id,
    }));
    setSections(nextSections);
    setLogoUrl(null);
    setWidgets({ whatsappFloating: true, carrito: !!t.rubros?.includes('gastronomia') });
    setTextStyles(t.textStyles || {});
    const seeds = t.seeds || {};
    setProductos(nextSections.some((s) => s.type === 'productos') ? seeds.productos ?? seedProductos() : []);
    setFaqs(nextSections.some((s) => s.type === 'faq') ? seeds.faqs ?? seedFaqs(t.demo?.horarios) : []);
    setTestimonios(nextSections.some((s) => s.type === 'testimonios') ? seeds.testimonios ?? seedTestimonios() : []);
    setPlanes(nextSections.some((s) => s.type === 'precios') ? seeds.planes ?? seedPlanes() : []);
    setEquipo(nextSections.some((s) => s.type === 'equipo') ? seeds.equipo ?? seedEquipo() : []);
    setMenuItems(nextSections.some((s) => s.type === 'menu') ? seeds.menuItems ?? seedMenu() : []);
    setMarcas(nextSections.some((s) => s.type === 'marcas') ? seeds.marcas ?? seedMarcas() : []);
    setPosts(nextSections.some((s) => s.type === 'blog') ? seeds.posts ?? seedPosts() : []);
    try {
      localStorage.removeItem('sitiowebdigital.editorTutorialSeen');
    } catch {
      // localStorage puede fallar (modo privado, cuota llena) — no debe romper la app.
    }
    return { ok: true };
  };

  const updateSiteData = (partial) => {
    setSiteData((prev) => ({ ...prev, ...partial }));
  };

  // Todas estas tocan una sola propiedad de `theme` — se mezclan sobre el
  // valor anterior en vez de reemplazarlo entero, para no pisar sin querer la
  // tipografía global elegida aparte (ver setSiteFont/importGoogleFont).
  const setPalette = (palette) => {
    setTheme((prev) => ({ ...prev, accent: palette.accent, accentSoft: palette.accentSoft }));
  };

  // El usuario elige cualquier color (no solo los presets); el tono de fondo
  // suave se deriva automáticamente aclarando ese mismo color.
  const setCustomColor = (hex) => {
    setTheme((prev) => ({ ...prev, accent: hex, accentSoft: tint(hex, 82) }));
  };

  // Tipografía global del sitio (Editor > botón "Tipografía") — a diferencia
  // del selector de fuente por texto puntual (que vive dentro de cada
  // sección, ver TextStyleCtx en SitePreview), esto cambia la fuente por
  // default de toda la página. Guarda el objeto ya resuelto (no solo un id)
  // para que aplicar el estilo no dependa de volver a buscarlo en ningún
  // catálogo — sirve tanto para una de FONT_OPTIONS como para una importada.
  const setSiteFont = (font) => {
    setTheme((prev) => ({ ...prev, font }));
  };

  // "Importar tipografía": cualquier familia de Google Fonts por nombre, sin
  // necesidad de subir ningún archivo — inyecta su hoja de estilos en el
  // <head> (una sola vez por familia) y la deja elegible junto a las de
  // fábrica. Se guarda en theme.importedFonts para que siga apareciendo en
  // el selector después de recargar, sin tener que reimportarla.
  const importGoogleFont = (nombre) => {
    const limpio = nombre?.trim();
    if (!limpio) return { ok: false, error: 'Escribí el nombre de una tipografía de Google Fonts.' };
    const id = `import-${slugify(limpio)}`;
    const family = `"${limpio}", system-ui, sans-serif`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(limpio).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
    const font = { id, label: limpio, family };
    setTheme((prev) => {
      const yaEstaba = prev?.importedFonts?.some((f) => f.id === id);
      return {
        ...prev,
        importedFonts: yaEstaba ? prev.importedFonts : [...(prev?.importedFonts || []), font],
      };
    });
    return { ok: true, font };
  };

  const addSection = (type, index, variant) => {
    const resolvedVariant = variant ?? SECTION_VARIANTS[type]?.[0]?.id;
    setSections((prev) => {
      // Header y footer son el "marco" de la página (nav de arriba, cierre de
      // abajo): no tiene sentido tener dos. El resto sí se puede repetir —
      // por ejemplo, dos secciones de "Productos o servicios" con distinta
      // disposición para mostrar cosas distintas.
      if (SECCIONES_UNICAS.includes(type) && prev.some((s) => s.type === type)) return prev;
      const next = [...prev];
      const insertAt = index === undefined ? next.length : Math.max(0, Math.min(index, next.length));
      const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      next.splice(insertAt, 0, { id, type, variant: resolvedVariant });
      return next;
    });
    // La página nunca arranca en blanco: para los tipos con lista propia, sembramos ejemplos editables.
    if (type === 'productos') setProductos((prev) => (prev.length ? prev : seedProductos()));
    if (type === 'faq') setFaqs((prev) => (prev.length ? prev : seedFaqs(siteData?.horarios)));
    if (type === 'testimonios') setTestimonios((prev) => (prev.length ? prev : seedTestimonios()));
    if (type === 'precios') setPlanes((prev) => (prev.length ? prev : seedPlanes()));
    if (type === 'equipo') setEquipo((prev) => (prev.length ? prev : seedEquipo()));
    if (type === 'menu') setMenuItems((prev) => (prev.length ? prev : seedMenu()));
    if (type === 'blog') setPosts((prev) => (prev.length ? prev : seedPosts()));
  };

  const removeSection = (id) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  // Regenera recursivamente cualquier campo `id` en objetos anidados (pasos,
  // beneficios, zonas.objetos, etc. — todo lo que viva como array de
  // {id, ...} adentro de una sección) para que la copia no comparta esos ids
  // con el original: los estilos de texto por ítem (negrita/color/fuente) se
  // guardan en textStyles bajo una clave `tipo.<id>.campo`, y si dos secciones
  // comparten el mismo id ahí, tocar el estilo de una tocaría la otra.
  const regenerateNestedIds = (value) => {
    if (Array.isArray(value)) return value.map(regenerateNestedIds);
    if (value && typeof value === 'object') {
      const next = {};
      for (const [k, v] of Object.entries(value)) next[k] = regenerateNestedIds(v);
      if (typeof next.id === 'string') next.id = `${next.id}-${Math.random().toString(36).slice(2, 8)}`;
      return next;
    }
    return value;
  };

  // Duplicar toda una sección (no un ítem suelto de sus listas, ver
  // duplicateListItem) — la copia queda justo después de la original, ya
  // seleccionable para editar. Header/footer quedan afuera por la misma
  // razón que no se pueden agregar dos veces (ver SECCIONES_UNICAS).
  const duplicateSection = (id) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const original = prev[idx];
      if (SECCIONES_UNICAS.includes(original.type)) return prev;
      const copy = { ...regenerateNestedIds(original), id: `${original.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const moveSection = (id, direction) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const swapIdx = idx + direction;
      if (idx === -1 || swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  // Reordena arrastrando: mueve la sección `id` a la posición `toIndex` (índice
  // dentro del arreglo ya sin ese elemento, es decir "el hueco donde se soltó").
  const reorderSection = (id, toIndex) => {
    setSections((prev) => {
      const fromIndex = prev.findIndex((s) => s.id === id);
      if (fromIndex === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      let insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
      insertAt = Math.max(0, Math.min(insertAt, next.length));
      next.splice(insertAt, 0, item);
      return next;
    });
  };

  // Color de fondo y de letra independientes por sección — null/undefined vuelve al color por defecto.
  const setSectionStyle = (id, patch) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addProducto = ({ nombre, precio, desc, duracion, categoria }) => {
    setProductos((prev) => [
      ...prev,
      {
        id: `producto-${Date.now()}`,
        nombre: nombre.trim(),
        precio: Number(precio) || 0,
        desc: desc?.trim(),
        duracion: duracion?.trim() || '',
        categoria: categoria?.trim() || '',
        detalle: '',
        imagenes: [],
      },
    ]);
  };

  const removeProducto = (id) => {
    setProductos((prev) => prev.filter((p) => p.id !== id));
  };

  const updateProducto = (id, patch) => {
    setProductos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const addProductoImagen = (id, url) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, imagenes: [...(p.imagenes || []), url] } : p))
    );
  };

  const removeProductoImagen = (id, index) => {
    setProductos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, imagenes: (p.imagenes || []).filter((_, i) => i !== index) } : p))
    );
  };

  const addFAQ = ({ q, a }) => {
    setFaqs((prev) => [...prev, { id: `faq-${Date.now()}`, q: q.trim(), a: (a ?? '').trim() }]);
  };

  const removeFAQ = (id) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFAQ = (id, patch) => {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const addTestimonio = ({ nombre, texto, rating, avatar }) => {
    setTestimonios((prev) => [
      ...prev,
      {
        id: `testimonio-${Date.now()}`,
        nombre: nombre.trim(),
        texto: (texto ?? '').trim(),
        rating: Number(rating) || 5,
        avatar: avatar || '',
        verificado: false,
      },
    ]);
  };

  const removeTestimonio = (id) => {
    setTestimonios((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTestimonio = (id, patch) => {
    setTestimonios((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  // CRUD genérico para las secciones con lista propia agregadas más
  // recientemente (precios, equipo, menú, marcas, blog) — en vez de repetir
  // addX/removeX/updateX para cada una (como productos/faqs/testimonios,
  // que ya existían antes), un solo set de funciones parametrizado por tipo.
  const LIST_SETTERS = {
    planes: setPlanes,
    equipo: setEquipo,
    menuItems: setMenuItems,
    marcas: setMarcas,
    posts: setPosts,
  };

  const addListItem = (key, item = {}) => {
    LIST_SETTERS[key]?.((prev) => [...prev, { id: `${key}-${Date.now()}`, ...item }]);
  };

  const removeListItem = (key, id) => {
    LIST_SETTERS[key]?.((prev) => prev.filter((it) => it.id !== id));
  };

  const updateListItem = (key, id, patch) => {
    LIST_SETTERS[key]?.((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  // Duplicar/reordenar/ocultar son genéricos para las 8 secciones con lista
  // propia (las 3 "viejas" con CRUD bespoke — productos/faqs/testimonios — y
  // las 5 que ya usan LIST_SETTERS) porque no necesitan la validación
  // puntual que sí tienen addProducto/addFAQ/addTestimonio (trim, defaults,
  // etc.) — clonar, reordenar u ocultar un item existente es la misma
  // operación sin importar la forma de sus campos.
  const ALL_LIST_SETTERS = {
    productos: setProductos,
    faqs: setFaqs,
    testimonios: setTestimonios,
    ...LIST_SETTERS,
  };

  const duplicateListItem = (key, id) => {
    ALL_LIST_SETTERS[key]?.((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: `${key}-${Date.now()}` };
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  };

  // `direction` es -1 (subir) o 1 (bajar) — mismo lenguaje que moveSection.
  const moveListItem = (key, id, direction) => {
    ALL_LIST_SETTERS[key]?.((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      const swapIdx = idx + direction;
      if (idx === -1 || swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  // "oculto" no saca el item de la lista (no se pierden datos ni hay que
  // confirmar nada) — solo lo saltea al renderizar en modo lectura. En el
  // editor sigue visible, atenuado, para poder reactivarlo.
  const toggleListItemOculto = (key, id) => {
    ALL_LIST_SETTERS[key]?.((prev) => prev.map((it) => (it.id === id ? { ...it, oculto: !it.oculto } : it)));
  };

  // Reordenar arrastrando (a diferencia de moveListItem, que solo sube/baja
  // de a un lugar) — mismo mecanismo que reorderSection: mueve el item a la
  // posición `toIndex` dentro del arreglo ya sin ese elemento.
  const reorderListItem = (key, id, toIndex) => {
    ALL_LIST_SETTERS[key]?.((prev) => {
      const fromIndex = prev.findIndex((it) => it.id === id);
      if (fromIndex === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      let insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
      insertAt = Math.max(0, Math.min(insertAt, next.length));
      next.splice(insertAt, 0, item);
      return next;
    });
  };

  // MOCK: acá se simula la conexión con Google/Facebook Reviews — en producción esto
  // llamaría a la API real (Google Places API, Facebook Graph API) con OAuth de por medio.
  // Como no hay backend en este prototipo, "traemos" un lote fijo de reseñas de ejemplo
  // marcadas como verificadas para mostrar cómo se vería el resultado final.
  const connectVerifiedReviews = ({ fuente, negocio }) =>
    new Promise((resolve) => {
      setTimeout(() => {
        const seedByFuente = {
          google: [
            { nombre: 'Lucía Fernández', texto: 'Reserva fácil y atención de diez. Volvería sin dudarlo.', rating: 5 },
            { nombre: 'Martín Alonso', texto: 'Tal cual las fotos, muy prolijos y puntuales.', rating: 5 },
            { nombre: 'Sol Ibáñez', texto: 'Buena relación precio-calidad, lo recomiendo.', rating: 4 },
          ],
          facebook: [
            { nombre: 'Nadia Cruz', texto: 'Excelente trato desde el primer mensaje.', rating: 5 },
            { nombre: 'Federico Paz', texto: 'Todo como se acordó, sin sorpresas.', rating: 5 },
          ],
        };
        const nuevas = (seedByFuente[fuente] || seedByFuente.google).map((t, i) => ({
          id: `testimonio-verificado-${Date.now()}-${i}`,
          nombre: t.nombre,
          texto: t.texto,
          rating: t.rating,
          avatar: `https://i.pravatar.cc/80?img=${60 + i}`,
          verificado: true,
          fuente,
        }));
        setTestimonios((prev) => [...prev, ...nuevas]);
        resolve({ ok: true, negocio, cantidad: nuevas.length });
      }, 900);
    });

  // Aplica al estado de React el sitio que vino de "la base" (login o carga
  // inicial) o de un paso de deshacer/rehacer (`fromHistory`). En el primer
  // caso se corta toda relación con el historial de edición anterior (no
  // tendría sentido poder deshacer hacia la página de OTRA cuenta); en el
  // segundo, `undo`/`redo` ya se encargaron de mover los stacks a mano.
  const applyHydratedSite = (hydrated, { fromHistory = false } = {}) => {
    if (!hydrated) return;
    if (!fromHistory) clearHistory();
    else skipHistoryRef.current = true;
    setTemplateId(hydrated.templateId);
    setSiteData(hydrated.siteData);
    setTheme(hydrated.theme);
    setLogoUrl(hydrated.logoUrl);
    setWidgets(hydrated.widgets);
    setTextStyles(hydrated.textStyles ?? {});
    setPublished(hydrated.published);
    setSections(hydrated.sections);
    setProductos(hydrated.productos);
    setFaqs(hydrated.faqs);
    setTestimonios(hydrated.testimonios);
    setPlanes(hydrated.planes ?? []);
    setEquipo(hydrated.equipo ?? []);
    setMenuItems(hydrated.menuItems ?? []);
    setMarcas(hydrated.marcas ?? []);
    setPosts(hydrated.posts ?? []);
  };

  // Ctrl+Z / Ctrl+Shift+Z (ver Editor.jsx, que engancha el atajo de teclado).
  // Si hay una tanda de cambios recién tipeada sin asentarse todavía (ver el
  // debounce de más arriba), deshacer primero la fuerza a asentarse — si no,
  // el usuario perdería esos cambios sin haberlos podido "deshacer" antes.
  const undo = () => {
    if (undoDebounceTimer.current) {
      clearTimeout(undoDebounceTimer.current);
      if (undoBurstBaseRef.current !== null) {
        undoStack.current.push(undoBurstBaseRef.current);
        undoBurstBaseRef.current = null;
      }
    }
    if (undoStack.current.length === 0) return;
    const previous = undoStack.current.pop();
    redoStack.current.push(lastSnapshotRef.current);
    applyHydratedSite(hydrateSite(JSON.parse(previous)), { fromHistory: true });
    lastSnapshotRef.current = previous;
    setHistoryTick((t) => t + 1);
  };

  const redo = () => {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    undoStack.current.push(lastSnapshotRef.current);
    applyHydratedSite(hydrateSite(JSON.parse(next)), { fromHistory: true });
    lastSnapshotRef.current = next;
    setHistoryTick((t) => t + 1);
  };

  // Admin > Páginas > Editar: carga la página de esa cuenta puntual (no la
  // propia) para trabajarla en el mismo editor, y marca que los próximos
  // guardados van dirigidos a esa página. Devuelve el email del dueño para
  // mostrarlo en el aviso del editor.
  const startAdminEditSite = async (siteId) => {
    const result = await apiAdminGetSite(siteId);
    if (!result) return { ok: false, error: 'No se pudo cargar esa página.' };
    applyHydratedSite(hydrateSite(result.site));
    setSubdomain(result.subdomain ?? null);
    setAdminEditingSite({ id: siteId, ownerEmail: result.ownerEmail, ownerName: result.ownerName });
    return { ok: true };
  };

  // Salir del modo "editando como admin": limpia el borrador que se cargó y
  // vuelve a guardar en la propia cuenta si se sigue editando después.
  const stopAdminEditSite = () => {
    setAdminEditingSite(null);
    resetAll();
  };

  // Cambia cuál de las páginas PROPIAS de la cuenta está cargada en el
  // editor/checkout/estadísticas — mismo patrón que startAdminEditSite, pero
  // para las páginas del propio dueño (una cuenta puede tener varias). Antes
  // de irse, guarda cualquier cambio pendiente de la página que se estaba
  // editando (mismo motivo que logout() ya hace lo mismo más abajo: no
  // perder una edición que todavía no llegó a asentarse por el debounce).
  const switchSite = async (siteId) => {
    await saveSiteToBackend();
    let found = mySites.find((s) => s.id === siteId);
    let siteJson = found?.data;
    let subdomainValue = found?.subdomain ?? null;
    let lockedValue = found?.locked ?? false;
    if (!found) {
      const result = await apiGetSite(siteId);
      if (!result) return { ok: false, error: 'No se pudo cargar esa página.' };
      siteJson = result.site;
      subdomainValue = result.subdomain ?? null;
      lockedValue = result.locked ?? false;
    }
    applyHydratedSite(hydrateSite(siteJson));
    setSubdomain(subdomainValue);
    setSiteLocked(lockedValue);
    setActiveSiteId(siteId);
    try {
      localStorage.setItem(ACTIVE_SITE_KEY, String(siteId));
    } catch {
      // no-op
    }
    return { ok: true };
  };

  // "Crear nueva página" (Dashboard): limpia el borrador de trabajo y
  // desengancha de la página que estaba activa, así el próximo autoguardado
  // crea una página nueva en vez de pisar la que se estaba editando.
  const startNewSite = () => {
    resetAll();
  };

  // Admin > Páginas > Pausar/Reanudar edición: para al dueño en tiempo real
  // (útil mientras soporte está reparando algo puntual) sin bajarla de
  // circulación — sigue publicada, solo no se puede seguir editando.
  const setPageLock = async (siteId, locked) => {
    return apiAdminSetSiteLock(siteId, locked);
  };

  // Admin > Páginas > Bloquear/Desbloquear: despublica la página directo (a
  // diferencia de pausar la edición, esto sí la baja de circulación) — el
  // dueño puede seguir editándola mientras tanto.
  const setPagePublished = async (siteId, published) => {
    return apiAdminSetSitePublished(siteId, published);
  };

  // El editor la llama cada pocos segundos mientras está abierto (ver
  // Editor.jsx) — si soporte pausa la edición o despublica en el medio, esto
  // lo nota sin esperar a que el dueño recargue la pestaña. Implícitamente
  // sobre activeSiteId: el editor siempre llega ahí después de un switchSite.
  const refreshSiteStatus = async () => {
    if (!activeSiteId) return;
    const { locked, published: pub } = await apiGetSiteStatus(activeSiteId);
    setSiteLocked(locked);
    setPublished(pub);
  };

  // Todas las páginas de la cuenta logueada (Dashboard).
  const fetchMySites = async () => {
    const sites = await apiListMySites();
    setMySites(sites);
    return sites;
  };

  // Wrappers de suscripción, implícitamente sobre activeSiteId (Checkout.jsx
  // y Stats.jsx siempre llegan ahí después de un switchSite) — salvo
  // cancelSubscription, que el Dashboard usa sobre una fila que no
  // necesariamente es la que está cargada en el editor.
  const getSubscription = () =>
    activeSiteId ? apiGetSubscription(activeSiteId) : Promise.resolve({ status: 'none', preapprovalId: null, published: false });
  const startSubscription = () => apiStartSubscription(activeSiteId);
  const publishFree = async () => {
    const result = await apiPublishFree(activeSiteId);
    if (result.ok) await refreshUser();
    return result;
  };
  const refreshSubscription = () => apiRefreshSubscription(activeSiteId);
  const cancelSubscription = (siteId) => apiCancelSubscription(siteId);
  const getSiteStats = (siteId) => apiGetSiteStats(siteId ?? activeSiteId);

  // Re-lee `user` del servidor — hace falta después de gastar una página
  // gratis (free_subscriptions bajó del lado del servidor) para que el
  // gate de Checkout quede al día sin tener que volver a loguearse.
  const refreshUser = async () => {
    const fresh = await apiMe();
    if (fresh) setUser(fresh);
  };

  // A cuál de las páginas recién traídas de la cuenta hay que engancharse:
  // la que estaba activa en un refresh anterior (persistida en
  // localStorage), o si no hay ninguna guardada (o ya no existe), la
  // primera de la lista. Devuelve null si la cuenta todavía no tiene
  // ninguna página — arranca en blanco, como hoy.
  const pickSiteToRestore = (sites) => {
    let savedId = null;
    try {
      savedId = Number(localStorage.getItem(ACTIVE_SITE_KEY));
    } catch {
      // no-op
    }
    return sites.find((s) => s.id === savedId) ?? sites[0] ?? null;
  };

  // Login/registro contra la API real (Express y Postgres, ver /server). Al
  // loguearse, si esa cuenta ya tiene páginas guardadas del lado del
  // servidor, las traemos y se carga la última activa (o la primera).
  const login = async ({ email, password }) => {
    const result = await apiLogin({ email, password });
    if (!result.ok) return result;
    // Limpia el borrador de trabajo ANTES de mirar qué páginas tiene esta
    // cuenta — si no, alguien que entra a /login sin haber cerrado sesión
    // antes (sin pasar por logout()) podría heredar en memoria el sitio de
    // la cuenta anterior, y el autoguardado se lo terminaría guardando a la
    // cuenta nueva como si fuera propio.
    resetAll();
    setUser(result.user);
    const sites = await fetchMySites();
    const target = pickSiteToRestore(sites);
    if (target) await switchSite(target.id);
    setSupportTickets(await apiListSupportTickets());
    trackEvent('funnel', 'login_exitoso', {});
    return { ok: true, user: result.user };
  };

  const register = async ({ name, email, password }) => {
    const result = await apiRegister({ name, email, password });
    if (!result.ok) return result;
    // Si ya había otra cuenta logueada (sin pasar por logout antes de crear
    // esta), no le pegamos su sitio a la cuenta nueva — si en cambio venía
    // de una sesión anónima (sin cuenta todavía), el borrador se mantiene a
    // propósito: es el flujo normal de quiz -> editor -> crear cuenta al pagar.
    if (user) resetAll();
    setUser(result.user);
    trackEvent('funnel', 'registro_exitoso', {});
    return { ok: true, user: result.user };
  };

  // Limpia todo el borrador de trabajo, no solo la sesión — si no, si otra
  // cuenta se loguea en la misma pestaña sin recargar la página, heredaría
  // el sitio de la cuenta anterior todavía en memoria y el autoguardado de
  // arriba se lo terminaría guardando como si fuera propio.
  const logout = async () => {
    // Guarda ya mismo antes de limpiar el estado — si no, una edición hecha
    // justo antes de cerrar sesión (todavía dentro del debounce del
    // autoguardado) se perdería en vez de llegar a guardarse.
    await saveSiteToBackend();
    apiLogoutLocal();
    setUser(null);
    setSupportTickets([]);
    setAdminEditingSite(null);
    setMySites([]);
    resetAll();
  };

  // Editar nombre/email desde el panel de usuario (Dashboard > Configuración).
  const updateProfile = async ({ name, email }) => {
    const result = await apiUpdateMe({ name, email });
    if (!result.ok) return result;
    setUser(result.user);
    return { ok: true, user: result.user };
  };

  // Nueva consulta a soporte (Dashboard > Soporte): la guarda en el backend y
  // agrega la respuesta del servidor (con su id/fecha reales) a la lista.
  const addSupportTicket = async (ticket) => {
    const result = await apiCreateSupportTicket(ticket);
    if (!result.ok) return result;
    setSupportTickets((list) => [result.ticket, ...list]);
    return { ok: true, ticket: result.ticket };
  };

  // Al recargar la página, si había un token guardado, recuperamos la sesión y
  // (si esa cuenta tiene una página guardada en el servidor) la traemos también.
  // `authReady` distingue "todavía no sabemos si hay sesión" de "no hay
  // sesión" — sin eso, una página que redirige a /login cuando `!user` lo
  // haría también en el instante inicial de cada recarga, antes de que este
  // efecto llegue a restaurarla.
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    (async () => {
      const restoredUser = await apiMe();
      if (!restoredUser) {
        setAuthReady(true);
        return;
      }
      setUser(restoredUser);
      const sites = await fetchMySites();
      const target = pickSiteToRestore(sites);
      if (target) await switchSite(target.id);
      setSupportTickets(await apiListSupportTickets());
      setAuthReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardado inmediato y explícito (a diferencia del autoguardado debounced
  // de arriba) — se usa para momentos puntuales donde no hay que esperar el
  // debounce: publicar/cancelar la suscripción (Checkout, Dashboard) y el
  // botón "Guardar cambios" del editor. Antes de tener sesión, la página
  // vive solo como borrador local (localStorage, ver más arriba).
  // `overrides` permite forzar valores que se acaban de setear (ej: setPublished(true))
  // pero que React todavía no reflejó en este render — evita guardar un estado viejo.
  const saveSiteToBackend = async (overrides = {}) => {
    if (!user) return { ok: false, error: 'Iniciá sesión para guardar tu página.' };
    // Ver el mismo chequeo en el autoguardado de arriba: armar/editar una
    // plantilla no es tocar el sitio propio, no hay que guardar nada acá.
    if (templateId === BLANK_TEMPLATE.id || editingTemplate) return { ok: true };
    const json = serializeSite({
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
      ...overrides,
    });
    if (!json) return { ok: false, error: 'Todavía no armaste ninguna página.' };
    // Si un admin está editando la página de otra cuenta, el guardado va
    // dirigido a esa página puntual en vez de a la propia (ver Admin > Páginas).
    if (adminEditingSite) return apiAdminUpdateSite(adminEditingSite.id, json);
    if (activeSiteId) {
      const result = await apiUpdateSite(activeSiteId, json);
      return { ...result, id: activeSiteId };
    }
    // Todavía ninguna página propia cargada — este guardado la crea.
    // createOrJoinSite (no apiCreateSite directo) evita crear una segunda
    // fila si el autoguardado debounced de arriba dispara casi al mismo
    // tiempo (ver el comentario en pendingSiteCreateRef).
    const result = await createOrJoinSite(json);
    if (result.ok) {
      setActiveSiteId(result.id);
      try {
        localStorage.setItem(ACTIVE_SITE_KEY, String(result.id));
      } catch {
        // no-op
      }
    }
    return result;
  };

  // Widgets flotantes de la página (por ahora, el botón de WhatsApp) — se pueden
  // prender o apagar desde el menú de widgets del editor.
  const toggleWidget = (key) => {
    setWidgets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Para opciones de widgets que no son on/off (ej: de qué lado va el botón).
  const setWidgetOption = (key, value) => {
    setWidgets((prev) => ({ ...prev, [key]: value }));
  };

  // Elegir/cambiar el subdominio de una página puntual (Dashboard >
  // Configuración de esa fila) — calca updateProfile: pega al backend, y
  // solo si confirma OK actualiza el estado local. Toma el id explícito
  // (no activeSiteId): el Dashboard puede editar el subdominio de una fila
  // que no es la que está cargada en el editor en ese momento, y no hay que
  // pisar ese estado por eso — solo se refleja acá si coincide con la activa.
  const updateSubdomain = async (siteId, value) => {
    const result = await apiSetSubdomain(siteId, value);
    if (!result.ok) return result;
    if (siteId === activeSiteId) setSubdomain(result.subdomain);
    return { ok: true, subdomain: result.subdomain };
  };

  const resetAll = () => {
    clearHistory();
    setQuiz(initialQuiz);
    setTemplateId(null);
    setSiteData(null);
    setSubdomain(null);
    setLogoUrl(null);
    setPublished(false);
    setTheme(null);
    setSections([]);
    setProductos([]);
    setFaqs([]);
    setTestimonios([]);
    setPlanes([]);
    setEquipo([]);
    setMenuItems([]);
    setMarcas([]);
    setPosts([]);
    setSiteLocked(false);
    setEditingTemplate(null);
    setActiveSiteId(null);
    try {
      localStorage.removeItem(ACTIVE_SITE_KEY);
    } catch {
      // no-op
    }
  };

  // Guarda el sitio de ejemplo actual (secciones, contenido, colores) como
  // una plantilla reutilizable — se llama desde el editor con "Guardar como
  // plantilla" (solo lo ve el admin). Mismo formato que las plantillas de
  // fábrica (sections/demo/seeds, ver TEMPLATES en mockData.js), para que
  // se puedan tratar exactamente igual una vez combinadas (ver `templates`).
  const saveAsTemplate = async ({ nombre, tagline, rubros: rubrosElegidos, tags, published }) => {
    if (!template || !siteData) return { ok: false, error: 'No hay ninguna página armada para guardar.' };
    // Las imágenes subidas localmente en el editor quedan como URLs blob:,
    // que solo existen mientras dure esa pestaña/sesión del navegador — si
    // se guardan así en la plantilla, quedan rotas para cualquier otra
    // persona (o incluso para el mismo admin en otra sesión). Se descartan
    // acá (en cualquier parte del contenido, no solo en la galería principal
    // — ej. las fotos de heroOfertas) en vez de guardarlas tal cual.
    const esUrlDurable = (url) => !!url && !url.startsWith('blob:');
    const sinBlobs = (value) => {
      if (typeof value === 'string') return esUrlDurable(value) ? value : undefined;
      if (Array.isArray(value)) return value.map(sinBlobs);
      if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sinBlobs(v)]));
      }
      return value;
    };
    const candidatos = (siteData.galeria || []).filter(esUrlDurable);
    const logoDurable = esUrlDurable(logoUrl) ? logoUrl : undefined;
    const payload = {
      nombre,
      tagline: tagline || '',
      rubros: rubrosElegidos,
      // El modal no pide tags aparte (son un detalle interno para el
      // matching por texto) — si ya tenía unos más específicos que los
      // rubros (ej. cargados a mano al crearla), no hay que perderlos en
      // cada re-guardado solo porque acá no se volvieron a mandar.
      tags: tags?.length ? tags : editingTemplate?.tags?.length ? editingTemplate.tags : rubrosElegidos,
      accent: theme?.accent ?? template.accent,
      // Miniatura para la tarjeta de la galería: la primera foto de la
      // galería del sitio de ejemplo (o el logo si no hay galería) — el
      // admin arma esto con el editor de siempre, no carga una foto aparte.
      image: candidatos[0] || logoDurable,
      imageFallback: candidatos[1] || candidatos[0] || logoDurable,
      // El id de cada sección se vuelve a generar al elegir la plantilla
      // (ver chooseTemplate), así que no tiene sentido guardar los ids de
      // esta sesión de edición puntual.
      sections: sinBlobs(sections.map(({ id: _id, ...rest }) => rest)),
      demo: sinBlobs(siteData),
      seeds: sinBlobs({ productos, faqs, testimonios, planes, equipo, menuItems, marcas, posts }),
      textStyles,
      published: !!published,
    };
    // Si se llegó acá reabriendo una plantilla ya creada (ver editTemplate),
    // esto la actualiza en vez de crear una nueva con el mismo contenido.
    const result = editingTemplate
      ? await apiAdminUpdateTemplate(editingTemplate.id, payload)
      : await apiAdminCreateTemplate(payload);
    if (result.ok) {
      refreshCatalog();
      // A partir de acá, seguir tocando "Guardar como plantilla" en esta
      // misma sesión actualiza esta plantilla en vez de crear una duplicada
      // cada vez.
      setEditingTemplate({ ...(editingTemplate || {}), ...result.template });
      setTemplateId(result.template.id);
    }
    return result;
  };

  // Rubro nuevo desde el modal de "Guardar como plantilla" (cuando el que
  // necesita el admin todavía no existe) — se refresca el catálogo al toque
  // para poder elegirlo en el mismo modal sin recargar la página.
  const createRubro = async (payload) => {
    const result = await apiAdminCreateRubro(payload);
    if (result.ok) refreshCatalog();
    return result;
  };

  // Se recalculan en cada render — `historyTick` cambia (y fuerza un render)
  // cada vez que undo/redo/clearHistory tocan los stacks, así los botones del
  // editor siempre reflejan el estado real de los refs sin exponerlos directo.
  void historyTick;
  const canUndo = undoStack.current.length > 0 || undoBurstBaseRef.current !== null;
  const canRedo = redoStack.current.length > 0;

  const value = {
    quiz,
    setQuiz,
    templates,
    selectableTemplates,
    rubros,
    saveAsTemplate,
    createRubro,
    editingTemplate,
    editTemplate,
    // Cierto mientras el admin está armando (blanco) o retomando (ya
    // existente) una plantilla — Editor.jsx lo usa para saber que "← Atrás"
    // tiene que volver a Admin > Plantillas en vez de al dashboard personal.
    isBuildingTemplate: templateId === BLANK_TEMPLATE.id || !!editingTemplate,
    templateId,
    template,
    chooseTemplate,
    startBlankTemplate,
    undo,
    redo,
    canUndo,
    canRedo,
    siteData,
    updateSiteData,
    logoUrl,
    setLogoUrl,
    logoPalette,
    subdomain,
    published,
    setPublished,
    theme,
    setPalette,
    setCustomColor,
    setSiteFont,
    importGoogleFont,
    sections,
    addSection,
    removeSection,
    duplicateSection,
    moveSection,
    reorderSection,
    setSectionStyle,
    productos,
    addProducto,
    removeProducto,
    updateProducto,
    addProductoImagen,
    removeProductoImagen,
    faqs,
    addFAQ,
    removeFAQ,
    updateFAQ,
    testimonios,
    addTestimonio,
    removeTestimonio,
    updateTestimonio,
    connectVerifiedReviews,
    planes,
    equipo,
    menuItems,
    marcas,
    posts,
    addListItem,
    removeListItem,
    updateListItem,
    duplicateListItem,
    moveListItem,
    toggleListItemOculto,
    reorderListItem,
    widgets,
    toggleWidget,
    setWidgetOption,
    textStyles,
    setTextStyle,
    user,
    authReady,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    updateSubdomain,
    supportTickets,
    addSupportTicket,
    adminEditingSite,
    startAdminEditSite,
    stopAdminEditSite,
    siteLocked,
    setPageLock,
    setPagePublished,
    refreshSiteStatus,
    saveSiteToBackend,
    resetAll,
    // Múltiples páginas por cuenta (ver Dashboard.jsx).
    mySites,
    fetchMySites,
    activeSiteId,
    switchSite,
    startNewSite,
    getSubscription,
    startSubscription,
    publishFree,
    refreshSubscription,
    cancelSubscription,
    getSiteStats,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
