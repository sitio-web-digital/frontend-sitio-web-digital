import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  PencilIcon,
  PlusIcon,
  XIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  DragHandleIcon,
  PaletteIcon,
  LayoutIcon,
  CheckBadgeIcon,
  StarIcon,
  PhoneCallIcon,
  PinIcon,
  HelpCircleIcon,
  ClockIcon,
  TagIcon,
  SparkIcon,
  CompassIcon,
  RocketIcon,
  ForkKnifeIcon,
  ScissorsIcon,
  WrenchIcon,
  ShoppingBagIcon,
  HeartPulseIcon,
  TrendUpIcon,
  LockIcon,
  MenuIcon,
  LinkIcon,
  SmileIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CalendarIcon,
  SendIcon,
  TrashIcon,
  CartIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  CardIcon,
  BoltIcon,
  ClipboardIcon,
  LightbulbIcon,
  UrgentBoltIcon,
  EyeIcon,
  EyeOffIcon,
  CopyIcon,
  TypeIcon,
  AlignLeftIcon,
} from './icons';
import {
  SECCIONES_CATALOGO,
  SECCIONES_UNICAS,
  SECTION_VARIANTS,
  OBJECT_TYPES,
  FONT_OPTIONS,
  ICON_LIBRARY,
  BUTTON_FUNCTIONS,
  MEDIA_ANIMATIONS,
  TEXT_ANIMATIONS,
  getTemplatePalette,
  slugify,
} from '../data/mockData';
import { validateImageFile, validateImageFiles } from '../utils/imageValidation';
import { uploadImage } from '../utils/uploadImage';
import { useCart } from '../hooks/useCart';

// Variants de motion/react para cada animación de texto — se reproducen una
// sola vez al entrar en pantalla (`whileInView`), solo en el sitio publicado.
const TEXT_ANIM_VARIANTS = {
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  subir: { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } },
  lateral: { hidden: { opacity: 0, x: -18 }, visible: { opacity: 1, x: 0 } },
};

const waLink = (whatsapp, nombre, mensaje) =>
  `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje || `Hola! Vi tu página de ${nombre} y quería consultarte.`)}`;

const catalogLabel = (type) => SECCIONES_CATALOGO.find((c) => c.id === type)?.label || type;

// Cuando hay más de una sección del mismo tipo en la página (ver
// SECCIONES_UNICAS), le suma un número de orden al nombre — así se puede
// distinguir "Productos o servicios 1" de "Productos o servicios 2" al
// elegir a cuál debe apuntar un botón o un link del menú del header.
const seccionLabelConNumero = (allSections, sec) => {
  const base = catalogLabel(sec.type);
  const mismoTipo = allSections.filter((s) => s.type === sec.type);
  if (mismoTipo.length <= 1) return base;
  const numero = mismoTipo.findIndex((s) => s.id === sec.id) + 1;
  return `${base} ${numero}`;
};

const fontFamilyById = (id) => FONT_OPTIONS.find((f) => f.id === id)?.family;

// Convierte un override de textStyles (color, fuente, negrita, cursiva,
// subrayado, tachado) en un objeto style de React. El link e ícono se
// resuelven aparte (afectan el markup, no solo el CSS).
const textStyleToCss = (override) => {
  if (!override) return undefined;
  const decorations = [override.underline && 'underline', override.strikethrough && 'line-through']
    .filter(Boolean)
    .join(' ');
  return {
    ...(override.color ? { color: override.color } : {}),
    ...(override.fontFamily ? { fontFamily: fontFamilyById(override.fontFamily) } : {}),
    ...(override.bold ? { fontWeight: 700 } : {}),
    ...(override.italic ? { fontStyle: 'italic' } : {}),
    ...(decorations ? { textDecoration: decorations } : {}),
  };
};

// Mismos SVG propios (sin copyright) que ya se usan en el resto del sitio —
// acá quedan disponibles para elegir en FAQ, testimonios y "Sobre nosotros".
const ICON_COMPONENTS = {
  star: StarIcon,
  heart: HeartPulseIcon,
  check: CheckBadgeIcon,
  clock: ClockIcon,
  pin: PinIcon,
  phone: PhoneCallIcon,
  tag: TagIcon,
  spark: SparkIcon,
  compass: CompassIcon,
  rocket: RocketIcon,
  fork: ForkKnifeIcon,
  scissors: ScissorsIcon,
  wrench: WrenchIcon,
  bag: ShoppingBagIcon,
  trend: TrendUpIcon,
  lock: LockIcon,
};

// Contexto local (no cruza a otros archivos) para que cada <Editable/> pueda
// leer y guardar su propio estilo de fuente/color sin tener que pasarlo a mano
// por cada componente intermedio — solo necesita declarar su `styleKey`.
const TextStyleCtx = createContext({ textStyles: {}, onSetTextStyle: () => {} });

// Texto de ayuda específico de cada tipo de sección — lo que explica el botón
// de tutorial (?) en la barra de controles de cada bloque.
const SECTION_HELP = {
  header: {
    title: 'Header con menú',
    tips: [
      'Agregá botones de menú con "Agregar ruta", en la propia sección.',
      'Un botón puede llevar a otra sección de esta misma página (hace scroll directo).',
      'También podés crear una ruta a una página nueva — el botón queda creado, pero poder armar esa página es una función que llega más adelante.',
      'Pasá el mouse sobre un botón del menú y tocá la X para sacarlo.',
    ],
  },
  hero: {
    title: 'Portada (Hero)',
    tips: [
      'Tocá el logo, el nombre, la descripción o los botones para editarlos directamente ahí mismo.',
      'Con el botón de Distribución elegís entre centrado, imagen + texto o minimalista.',
    ],
  },
  galeria: {
    title: 'Galería de fotos',
    tips: [
      'Con Distribución elegís entre grilla o carrusel.',
      'Tocá cualquier foto para reemplazarla, o "Agregar" para sumar más.',
      '"Fotos aleatorias" prueba otra combinación de fotos de ejemplo.',
    ],
  },
  productos: {
    title: 'Productos o servicios',
    tips: [
      'Con Distribución elegís filas de 3, 4 o 5 columnas.',
      'Cada producto tiene nombre, precio, descripción y sus propias fotos.',
      'Usá "Agregar" para sumar productos nuevos.',
    ],
  },
  testimonios: {
    title: 'Testimonios',
    tips: [
      'Con Distribución elegís entre tarjetas, carrusel, reseña destacada o fila con scroll.',
      '"Conectar reseñas verificadas" simula traer reseñas de Google o Facebook.',
      'También podés cargar testimonios a mano: nombre, comentario y puntaje.',
    ],
  },
  faq: {
    title: 'Preguntas frecuentes',
    tips: [
      'Con Distribución elegís entre lista centrada o imagen + preguntas.',
      'Agregá o quitá preguntas y respuestas cuando quieras.',
    ],
  },
  contacto: {
    title: 'Formulario de contacto',
    tips: [
      'Con Distribución elegís entre formulario centrado, imagen + formulario, formulario + mapa, o directo a WhatsApp sin formulario.',
      'Editá el título, los textos de los campos, y sumá campos propios al formulario.',
    ],
  },
  marquee: {
    title: 'Menciones / marquee',
    tips: [
      'Agregá medios, premios o clientes con los que trabajaste — se muestran en movimiento continuo.',
      'En el editor se ven quietos para poder tocarlos; el movimiento solo corre en el sitio publicado.',
    ],
  },
  series: {
    title: 'Series / colecciones',
    tips: [
      'Cada tab es una serie o colección propia, con su foto, título, descripción, año y formato.',
      'Tocá un tab para editarlo — el mismo click lo deja activo para ver el cambio al toque.',
    ],
  },
  archivo: {
    title: 'Archivo con zoom',
    tips: [
      'Tocá una foto para cambiarla; usá los botones ↔/↕ para que ocupe más columnas o filas en la grilla.',
      'En el sitio publicado, tocar una foto la amplía en pantalla completa.',
    ],
  },
  'sobre-nosotros': {
    title: 'Sobre nosotros',
    tips: [
      'Tocá la descripción, horarios, dirección o Instagram para editarlos.',
      'Estos mismos datos se muestran también en otras secciones, como el Hero.',
    ],
  },
  footer: {
    title: 'Pie de página',
    tips: ['Solo tiene el color como configuración — el texto se arma solo con el nombre de tu negocio.'],
  },
};

export default function SitePreview({
  template,
  siteData,
  logoUrl,
  logoPalette = [],
  theme,
  sections = [],
  productos = [],
  faqs = [],
  editable = false,
  onUpdateField,
  onLogoChange,
  onAddSection,
  onRemoveSection,
  onMoveSection,
  onAddProducto,
  onRemoveProducto,
  onUpdateProducto,
  onAddProductoImagen,
  onRemoveProductoImagen,
  onAddFAQ,
  onRemoveFAQ,
  onUpdateFAQ,
  testimonios = [],
  onAddTestimonio,
  onRemoveTestimonio,
  onUpdateTestimonio,
  onConnectVerifiedReviews,
  planes = [],
  equipo = [],
  menuItems = [],
  marcas = [],
  posts = [],
  onAddListItem,
  onRemoveListItem,
  onUpdateListItem,
  onDuplicateListItem,
  onMoveListItem,
  onToggleListItemOculto,
  onShuffleGallery,
  onReorderSection,
  onSetSectionStyle,
  widgets = {},
  textStyles = {},
  onSetTextStyle,
  raised = false,
}) {
  // Los hooks van antes que el `return null` de abajo: si no, el orden de
  // hooks cambiaría entre renders según `template`/`siteData` estén cargados
  // o no, lo cual rompe las reglas de React.
  const [savedKey, setSavedKey] = useState(0);
  // Arrastrar para reordenar: se activa solo desde el ícono de "agarrar" (no toda
  // la sección), así no interfiere con la edición de texto ni la selección.
  const sectionRefs = useRef({});
  const [dragState, setDragState] = useState(null); // { id, overIndex }
  const [cartOpen, setCartOpen] = useState(false);
  // El carrito es del VISITANTE, no contenido del dueño — no se guarda en el
  // sitio ni se manda al servidor (ver useCart). La clave lo separa por
  // negocio para no mezclar pedidos si en la misma sesión se mira más de un
  // sitio (ej. la galería de plantillas de ejemplo).
  const cart = useCart(template && siteData ? `${template.id}-${slugify(siteData.nombreNegocio || '')}` : null);

  // Algunas plantillas (ej. Estudio Lumen) traen su propia tipografía además
  // de su propia paleta — se inyecta la hoja de Google Fonts una sola vez por
  // plantilla (mismo patrón que importGoogleFont en AppContext) y se pisan
  // las variables --font-serif/--font-mono/--font-editorial en el wrapper de
  // acá abajo, así todas las clases font-serif/font-mono ya existentes en
  // cada sección heredan la fuente propia de la plantilla sin tocar el resto
  // de la app (esas variables son globales por default, ver src/index.css).
  const fontsOverride = template?.paletteOverride?.fonts;
  useEffect(() => {
    if (!fontsOverride?.googleFontsHref) return;
    const id = `tpl-fonts-${template.id}`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = fontsOverride.googleFontsHref;
      document.head.appendChild(link);
    }
  }, [template?.id, fontsOverride?.googleFontsHref]);

  if (!template || !siteData) return null;
  const accent = theme?.accent ?? template.accent;
  // Escala neutra ink/inkSoft/bg/line — a diferencia de accent/accentSoft, no
  // la pisa el selector de color: se deriva del rubro Y del acento PROPIO de
  // esta plantilla (no el elegido en el selector), para que dos plantillas
  // del mismo rubro no terminen con el mismo fondo/bordes.
  const palette = getTemplatePalette(template);
  const {
    nombreNegocio,
    rubroLabel,
    sobreNosotros,
    whatsapp,
    telefono,
    direccion,
    horarios,
    instagram,
    galeria,
  } = siteData;

  const hasSection = (type) => sections.some((s) => s.type === type);
  const field = (name) => (value) => {
    onUpdateField?.(name, value);
    setSavedKey((k) => k + 1);
  };

  const computeOverIndex = (clientY) => {
    let idx = sections.length;
    for (let i = 0; i < sections.length; i++) {
      const el = sectionRefs.current[sections[i].id];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        idx = i;
        break;
      }
    }
    return idx;
  };

  const startDrag = (id) => (e) => {
    e.preventDefault();
    setDragState({ id, overIndex: sections.findIndex((s) => s.id === id) });
    // Sin esto, arrastrar el mouse por encima de los textos de la página selecciona
    // texto en vez de solo mover la sección.
    document.body.style.userSelect = 'none';

    const onMove = (ev) => {
      setDragState((prev) => (prev ? { ...prev, overIndex: computeOverIndex(ev.clientY) } : prev));
    };
    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.userSelect = '';
      onReorderSection?.(id, computeOverIndex(ev.clientY));
      setDragState(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // Base de la página entera, detrás de todas las secciones — normalmente no
  // se nota (cada sección cubre su propio fondo), pero puede asomar en algún
  // borde o transición. Sin una sección propia que lo defina, esto usaba
  // siempre el fondo automático del rubro/acento sin ninguna forma de
  // pisarlo — ahora, si la primera sección tiene su propio color puesto a
  // mano, la página entera arranca de ese mismo tono en vez de mezclarlos.
  const wrapperBg = sections[0]?.bgColor || palette.bg;

  return (
    <TextStyleCtx.Provider value={{ textStyles, onSetTextStyle }}>
    <div
      className="@container font-editorial"
      style={{
        background: wrapperBg,
        color: palette.ink,
        fontFamily: theme?.font?.family || undefined,
        ...(fontsOverride
          ? {
              '--font-serif': fontsOverride.serif,
              '--font-mono': fontsOverride.mono,
              '--font-editorial': fontsOverride.editorial,
            }
          : {}),
      }}
    >
      {/* Zona reordenable: "+" entre cada bloque para insertar exactamente ahí,
          o (mientras se arrastra una sección) una línea que marca dónde caería */}
      {editable && sections.length === 0 && (
        <InsertionPoint
          prominent
          disponibles={SECCIONES_CATALOGO}
          onAdd={(type, variant) => onAddSection?.(type, 0, variant)}
        />
      )}
      {editable && sections.length > 0 && (
        <Gap
          dragging={!!dragState}
          isTarget={dragState?.overIndex === 0}
          disponibles={SECCIONES_CATALOGO.filter((c) => !SECCIONES_UNICAS.includes(c.id) || !hasSection(c.id))}
          onAdd={(type, variant) => onAddSection?.(type, 0, variant)}
          topEdge
        />
      )}
      {sections.map((sec, i) => (
        <div
          key={sec.id}
          id={sec.id}
          ref={(el) => {
            sectionRefs.current[sec.id] = el;
          }}
          style={{ opacity: dragState?.id === sec.id ? 0.35 : 1, color: sec.textColor || undefined }}
        >
          <SectionShell
            editable={editable}
            isFirst={i === 0}
            isLast={i === sections.length - 1}
            onMoveUp={() => onMoveSection?.(sec.id, -1)}
            onMoveDown={() => onMoveSection?.(sec.id, 1)}
            onRemove={() => onRemoveSection?.(sec.id)}
            onDragStart={startDrag(sec.id)}
            type={sec.type}
            variant={sec.variant}
            bgColor={sec.bgColor}
            headingColor={sec.headingColor}
            textColor={sec.textColor}
            buttonColor={sec.buttonColor}
            hasHeading={!['footer', 'header', 'cta'].includes(sec.type)}
            hasButton={['productos', 'contacto', 'precios', 'cta'].includes(sec.type)}
            onSetStyle={(patch) => onSetSectionStyle?.(sec.id, patch)}
            logoPalette={logoPalette}
          >
            {sec.type === 'header' && (
              <SeccionHeader
                variant={sec.variant}
                palette={palette}
                accent={accent}
                logoUrl={logoUrl}
                onLogoChange={onLogoChange}
                nombreNegocio={nombreNegocio}
                onUpdateNombre={field('nombreNegocio')}
                editable={editable}
                rutas={sec.rutas ?? []}
                onUpdateRutas={(rutas) => onSetSectionStyle?.(sec.id, { rutas })}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
                bgColor={sec.bgColor}
                textColor={sec.textColor}
                sticky={sec.sticky}
              />
            )}
            {sec.type === 'hero' && (
              <SeccionHero
                variant={sec.variant}
                palette={palette}
                caption={sec.heroCaption}
                onUpdateCaption={(v) => onSetSectionStyle?.(sec.id, { heroCaption: v })}
                nombreNegocio={nombreNegocio}
                rubroLabel={rubroLabel}
                sobreNosotros={sobreNosotros}
                whatsapp={whatsapp}
                telefono={telefono}
                logoUrl={logoUrl}
                onLogoChange={onLogoChange}
                editable={editable}
                field={field}
                accent={accent}
                galeria={galeria}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                botones={sec.botones ?? {}}
                onUpdateBotones={(botones) => onSetSectionStyle?.(sec.id, { botones })}
                heroOfertas={sec.heroOfertas ?? []}
                onUpdateHeroOfertas={(heroOfertas) => onSetSectionStyle?.(sec.id, { heroOfertas })}
                heroImagen={sec.heroImagen}
                onUpdateHeroImagen={(v) => onSetSectionStyle?.(sec.id, { heroImagen: v })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                imagenFiltro={sec.imagenFiltro}
                stats={sec.stats ?? []}
                ofertasEtiquetaSuperior={sec.ofertasEtiquetaSuperior}
                ofertasVelocidad={sec.ofertasVelocidad}
                fechaEvento={sec.fechaEvento}
                onUpdateFechaEvento={(v) => onSetSectionStyle?.(sec.id, { fechaEvento: v })}
                fechaEventoLabel={sec.fechaEventoLabel}
                onUpdateFechaEventoLabel={(v) => onSetSectionStyle?.(sec.id, { fechaEventoLabel: v })}
                destacado={sec.destacado}
                onUpdateDestacado={(v) => onSetSectionStyle?.(sec.id, { destacado: v })}
                destacadoEtiqueta={sec.destacadoEtiqueta}
                onUpdateDestacadoEtiqueta={(v) => onSetSectionStyle?.(sec.id, { destacadoEtiqueta: v })}
                zonas={sec.zonas}
                onUpdateZonas={(zonas) => onSetSectionStyle?.(sec.id, { zonas })}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
              />
            )}
            {sec.type === 'hero-barberia' && (
              <SeccionHeroBarberia
                rubroLabel={sec.rubroLabel}
                onUpdateRubroLabel={(v) => onSetSectionStyle?.(sec.id, { rubroLabel: v })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                heroImagen={sec.heroImagen}
                onUpdateHeroImagen={(v) => onSetSectionStyle?.(sec.id, { heroImagen: v })}
                caption={sec.caption}
                onUpdateCaption={(v) => onSetSectionStyle?.(sec.id, { caption: v })}
                stats={sec.stats ?? []}
                botones={sec.botones ?? {}}
                onUpdateBotones={(botones) => onSetSectionStyle?.(sec.id, { botones })}
                whatsapp={whatsapp}
                telefono={telefono}
                nombreNegocio={nombreNegocio}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'sobre-nosotros' && (
              <SeccionSobreNosotros
                variant={sec.variant}
                palette={palette}
                accent={accent}
                quote={sec.quote}
                onUpdateQuote={(v) => onSetSectionStyle?.(sec.id, { quote: v })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                sobreNosotros={sobreNosotros}
                instagram={instagram}
                horarios={horarios}
                direccion={direccion}
                telefono={telefono}
                editable={editable}
                field={field}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                galeria={galeria}
                imagen={sec.imagen}
                onUpdateImagen={(v) => onSetSectionStyle?.(sec.id, { imagen: v })}
                firma={sec.firma}
                onUpdateFirma={(v) => onSetSectionStyle?.(sec.id, { firma: v })}
              />
            )}
            {sec.type === 'footer' && (
              <SeccionFooter
                variant={sec.variant}
                palette={palette}
                accent={accent}
                nombreNegocio={nombreNegocio}
                whatsapp={whatsapp}
                instagram={instagram}
                bgColor={sec.bgColor}
                textColor={sec.textColor}
                editable={editable}
                botones={sec.botones ?? {}}
                onUpdateBotones={(botones) => onSetSectionStyle?.(sec.id, { botones })}
                bajada={sec.bajada}
                onUpdateBajada={(v) => onSetSectionStyle?.(sec.id, { bajada: v })}
                mediosPago={sec.mediosPago ?? []}
                onUpdateMediosPago={(mediosPago) => onSetSectionStyle?.(sec.id, { mediosPago })}
                contactoLineas={sec.contactoLineas ?? []}
                onUpdateContactoLineas={(contactoLineas) => onSetSectionStyle?.(sec.id, { contactoLineas })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                hashtag={sec.hashtag}
                onUpdateHashtag={(v) => onSetSectionStyle?.(sec.id, { hashtag: v })}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
              />
            )}
            {sec.type === 'footer-barberia' && (
              <SeccionFooterBarberia
                nombreNegocio={nombreNegocio}
                whatsapp={whatsapp}
                instagram={instagram}
                editable={editable}
                bgColor={sec.bgColor}
                textColor={sec.textColor}
                palette={palette}
                botones={sec.botones ?? {}}
                onUpdateBotones={(botones) => onSetSectionStyle?.(sec.id, { botones })}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
              />
            )}
            {sec.type === 'productos' && (
              <SeccionProductos
                accent={accent}
                palette={palette}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                buttonColor={sec.buttonColor}
                variant={sec.variant}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                productos={productos}
                editable={editable}
                onAddProducto={onAddProducto}
                onRemoveProducto={onRemoveProducto}
                onUpdateProducto={onUpdateProducto}
                onAddProductoImagen={onAddProductoImagen}
                onRemoveProductoImagen={onRemoveProductoImagen}
                onDuplicateProducto={(id) => onDuplicateListItem?.('productos', id)}
                onMoveProducto={(id, dir) => onMoveListItem?.('productos', id, dir)}
                onToggleOcultoProducto={(id) => onToggleListItemOculto?.('productos', id)}
                nombreNegocio={nombreNegocio}
                whatsapp={whatsapp}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
                cartEnabled={widgets.carrito === true}
                onAddToCart={cart.addItem}
                disclaimer={sec.disclaimer}
                onUpdateDisclaimer={(v) => onSetSectionStyle?.(sec.id, { disclaimer: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
              />
            )}
            {sec.type === 'galeria' && (
              <SeccionGaleria
                images={galeria ?? []}
                variant={sec.variant}
                palette={palette}
                accent={accent}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                onShuffle={onShuffleGallery}
                onReplace={(idx, url) => field('galeria')((galeria ?? []).map((g, i) => (i === idx ? url : g)))}
                onAddMany={(urls) => field('galeria')([...(galeria ?? []), ...urls])}
                onRemove={(idx) => field('galeria')((galeria ?? []).filter((_, i) => i !== idx))}
                mediaVariant={sec.mediaVariant}
                onChangeMediaVariant={(v) => onSetSectionStyle?.(sec.id, { mediaVariant: v })}
              />
            )}
            {sec.type === 'testimonios' && (
              <SeccionTestimonios
                testimonios={testimonios}
                variant={sec.variant}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                accent={accent}
                palette={palette}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                editable={editable}
                onAddTestimonio={onAddTestimonio}
                onRemoveTestimonio={onRemoveTestimonio}
                onUpdateTestimonio={onUpdateTestimonio}
                onDuplicateTestimonio={(id) => onDuplicateListItem?.('testimonios', id)}
                onMoveTestimonio={(id, dir) => onMoveListItem?.('testimonios', id, dir)}
                onToggleOcultoTestimonio={(id) => onToggleListItemOculto?.('testimonios', id)}
                onConnectVerifiedReviews={onConnectVerifiedReviews}
              />
            )}
            {sec.type === 'faq' && (
              <SeccionFAQ
                faqs={faqs}
                accent={accent}
                palette={palette}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                editable={editable}
                variant={sec.variant}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                imagenes={sec.faqImagenes ?? []}
                onAddFAQ={onAddFAQ}
                onRemoveFAQ={onRemoveFAQ}
                onUpdateFAQ={onUpdateFAQ}
                onDuplicateFAQ={(id) => onDuplicateListItem?.('faqs', id)}
                onMoveFAQ={(id, dir) => onMoveListItem?.('faqs', id, dir)}
                onToggleOcultoFAQ={(id) => onToggleListItemOculto?.('faqs', id)}
                onAddFaqImagenes={(urls) => onSetSectionStyle?.(sec.id, { faqImagenes: [...(sec.faqImagenes ?? []), ...urls] })}
                onRemoveFaqImagen={(i) =>
                  onSetSectionStyle?.(sec.id, { faqImagenes: (sec.faqImagenes ?? []).filter((_, idx) => idx !== i) })
                }
                onReplaceFaqImagen={(i, url) =>
                  onSetSectionStyle?.(sec.id, {
                    faqImagenes: (sec.faqImagenes ?? []).map((g, idx) => (idx === i ? url : g)),
                  })
                }
                mediaVariant={sec.mediaVariant}
                onChangeMediaVariant={(v) => onSetSectionStyle?.(sec.id, { mediaVariant: v })}
              />
            )}
            {sec.type === 'comparador' && (
              <SeccionComparador
                modelos={sec.modelos ?? []}
                onUpdate={(modelos) => onSetSectionStyle?.(sec.id, { modelos })}
                campos={sec.campos ?? []}
                onUpdateCampos={(campos) => onSetSectionStyle?.(sec.id, { campos })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'canje' && (
              <SeccionCanje
                modelos={sec.modelos ?? []}
                onUpdate={(modelos) => onSetSectionStyle?.(sec.id, { modelos })}
                condiciones={sec.condiciones ?? []}
                onUpdateCondiciones={(condiciones) => onSetSectionStyle?.(sec.id, { condiciones })}
                perks={sec.perks ?? []}
                onUpdatePerks={(perks) => onSetSectionStyle?.(sec.id, { perks })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
                whatsapp={whatsapp}
                nombreNegocio={nombreNegocio}
                botones={sec.botones ?? {}}
                onUpdateBotones={(botones) => onSetSectionStyle?.(sec.id, { botones })}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
              />
            )}
            {sec.type === 'sucursales' && (
              <SeccionSucursales
                sucursales={sec.sucursales ?? []}
                onUpdate={(sucursales) => onSetSectionStyle?.(sec.id, { sucursales })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'cronograma' && (
              <SeccionCronograma
                variant={sec.variant}
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                imagen={sec.imagen}
                onUpdateImagen={(v) => onSetSectionStyle?.(sec.id, { imagen: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'lugares' && (
              <SeccionLugares
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'dresscode' && (
              <SeccionDressCode
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                notas={sec.notas ?? []}
                onUpdateNotas={(notas) => onSetSectionStyle?.(sec.id, { notas })}
                paletaColores={sec.paletaColores ?? []}
                onUpdatePaletaColores={(paletaColores) => onSetSectionStyle?.(sec.id, { paletaColores })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'rsvp' && (
              <SeccionRSVP
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                menuOptions={sec.menuOptions ?? []}
                onUpdateMenuOptions={(menuOptions) => onSetSectionStyle?.(sec.id, { menuOptions })}
                mensajeConfirmado={sec.mensajeConfirmado}
                onUpdateMensajeConfirmado={(v) => onSetSectionStyle?.(sec.id, { mensajeConfirmado: v })}
                mensajeDeclinado={sec.mensajeDeclinado}
                onUpdateMensajeDeclinado={(v) => onSetSectionStyle?.(sec.id, { mensajeDeclinado: v })}
                companionMode={sec.companionMode}
                extraPregunta={sec.extraPregunta}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'playlist' && (
              <SeccionPlaylist
                canciones={sec.canciones ?? []}
                onUpdate={(canciones) => onSetSectionStyle?.(sec.id, { canciones })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'regalos' && (
              <SeccionRegalos
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'historia' && (
              <SeccionHistoria
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'hospedaje' && (
              <SeccionHospedaje
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'libro-mensajes' && (
              <SeccionLibroDeMensajes
                mensajes={sec.mensajes ?? []}
                onUpdate={(mensajes) => onSetSectionStyle?.(sec.id, { mensajes })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'catalogo-libros' && (
              <SeccionCatalogoLibros
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                onAdd={(item) => onSetSectionStyle?.(sec.id, { items: [...(sec.items ?? []), item] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { items: (sec.items ?? []).filter((it) => it.id !== id) })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'recomendados' && (
              <SeccionRecomendados
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                onAdd={(item) => onSetSectionStyle?.(sec.id, { items: [...(sec.items ?? []), item] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { items: (sec.items ?? []).filter((it) => it.id !== id) })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'club-lectura' && (
              <SeccionClubLectura
                imagen={sec.imagen}
                onUpdateImagen={(v) => onSetSectionStyle?.(sec.id, { imagen: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                datos={sec.datos ?? []}
                onUpdateDatos={(datos) => onSetSectionStyle?.(sec.id, { datos })}
                etiquetaUnido={sec.etiquetaUnido}
                etiquetaSinUnir={sec.etiquetaSinUnir}
                notaUnido={sec.notaUnido}
                notaSinUnir={sec.notaSinUnir}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                palette={palette}
              />
            )}
            {sec.type === 'firmas-eventos' && (
              <SeccionFirmasEventos
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                onAdd={(item) => onSetSectionStyle?.(sec.id, { items: [...(sec.items ?? []), item] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { items: (sec.items ?? []).filter((it) => it.id !== id) })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                nota={sec.nota}
                onUpdateNota={(v) => onSetSectionStyle?.(sec.id, { nota: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'pedidos-especiales' && (
              <SeccionPedidosEspeciales
                pasos={sec.pasos ?? []}
                onUpdatePasos={(pasos) => onSetSectionStyle?.(sec.id, { pasos })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                mensajeConfirmado={sec.mensajeConfirmado}
                onUpdateMensajeConfirmado={(v) => onSetSectionStyle?.(sec.id, { mensajeConfirmado: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'visitanos-boletin' && (
              <SeccionVisitanosBoletin
                filas={sec.filas ?? []}
                onUpdateFilas={(filas) => onSetSectionStyle?.(sec.id, { filas })}
                eyebrowContacto={sec.eyebrowContacto}
                onUpdateEyebrowContacto={(v) => onSetSectionStyle?.(sec.id, { eyebrowContacto: v })}
                eyebrowBoletin={sec.eyebrowBoletin}
                onUpdateEyebrowBoletin={(v) => onSetSectionStyle?.(sec.id, { eyebrowBoletin: v })}
                descripcionBoletin={sec.descripcionBoletin}
                onUpdateDescripcionBoletin={(v) => onSetSectionStyle?.(sec.id, { descripcionBoletin: v })}
                mensajeSuscripto={sec.mensajeSuscripto}
                onUpdateMensajeSuscripto={(v) => onSetSectionStyle?.(sec.id, { mensajeSuscripto: v })}
                editable={editable}
                bgColor={sec.bgColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'ciclo-trabajo' && (
              <SeccionCicloTrabajo
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                onAdd={(item) => onSetSectionStyle?.(sec.id, { items: [...(sec.items ?? []), item] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { items: (sec.items ?? []).filter((it) => it.id !== id) })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'catalogo-insumos' && (
              <SeccionCatalogoInsumos
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                onAdd={(item) => onSetSectionStyle?.(sec.id, { items: [...(sec.items ?? []), item] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { items: (sec.items ?? []).filter((it) => it.id !== id) })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                palette={palette}
              />
            )}
            {sec.type === 'cotizador' && (
              <SeccionCotizador
                opciones={sec.opciones ?? []}
                onUpdate={(opciones) => onSetSectionStyle?.(sec.id, { opciones })}
                onAdd={(opt) => onSetSectionStyle?.(sec.id, { opciones: [...(sec.opciones ?? []), opt] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { opciones: (sec.opciones ?? []).filter((o) => o.id !== id) })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                cantidadLabel={sec.cantidadLabel}
                onUpdateCantidadLabel={(v) => onSetSectionStyle?.(sec.id, { cantidadLabel: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'ensayos' && (
              <SeccionEnsayos
                columnas={sec.columnas ?? []}
                onUpdateColumnas={(columnas) => onSetSectionStyle?.(sec.id, { columnas })}
                filas={sec.filas ?? []}
                onUpdate={(filas) => onSetSectionStyle?.(sec.id, { filas })}
                onAdd={(fila) => onSetSectionStyle?.(sec.id, { filas: [...(sec.filas ?? []), fila] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { filas: (sec.filas ?? []).filter((f) => f.id !== id) })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                nota={sec.nota}
                onUpdateNota={(v) => onSetSectionStyle?.(sec.id, { nota: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                palette={palette}
              />
            )}
            {sec.type === 'zonas-tecnicas' && (
              <SeccionZonasTecnicas
                zonas={sec.zonas ?? []}
                onUpdate={(zonas) => onSetSectionStyle?.(sec.id, { zonas })}
                onAdd={(zona) => onSetSectionStyle?.(sec.id, { zonas: [...(sec.zonas ?? []), zona] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { zonas: (sec.zonas ?? []).filter((z) => z.id !== id) })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                imagen={sec.imagen}
                onUpdateImagen={(v) => onSetSectionStyle?.(sec.id, { imagen: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                palette={palette}
              />
            )}
            {sec.type === 'escalas-volumen' && (
              <SeccionEscalasVolumen
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                onAdd={(item) => onSetSectionStyle?.(sec.id, { items: [...(sec.items ?? []), item] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { items: (sec.items ?? []).filter((it) => it.id !== id) })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'pedido-mayorista' && (
              <SeccionPedidoMayorista
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                onAdd={(item) => onSetSectionStyle?.(sec.id, { items: [...(sec.items ?? []), item] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { items: (sec.items ?? []).filter((it) => it.id !== id) })}
                tiers={sec.tiers ?? []}
                onUpdateTiers={(tiers) => onSetSectionStyle?.(sec.id, { tiers })}
                montoMinimo={sec.montoMinimo ?? 0}
                onUpdateMontoMinimo={(v) => onSetSectionStyle?.(sec.id, { montoMinimo: v })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'logistica-zonas' && (
              <SeccionLogisticaZonas
                zonas={sec.zonas ?? []}
                onUpdate={(zonas) => onSetSectionStyle?.(sec.id, { zonas })}
                onAdd={(zona) => onSetSectionStyle?.(sec.id, { zonas: [...(sec.zonas ?? []), zona] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { zonas: (sec.zonas ?? []).filter((z) => z.id !== id) })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                imagen={sec.imagen}
                onUpdateImagen={(v) => onSetSectionStyle?.(sec.id, { imagen: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                palette={palette}
              />
            )}
            {sec.type === 'condiciones' && (
              <SeccionCondiciones
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                onAdd={(item) => onSetSectionStyle?.(sec.id, { items: [...(sec.items ?? []), item] })}
                onRemove={(id) => onSetSectionStyle?.(sec.id, { items: (sec.items ?? []).filter((it) => it.id !== id) })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'proceso-taller' && (
              <SeccionProcesoTaller
                pasos={sec.pasos ?? []}
                onAddPaso={(p) => onSetSectionStyle?.(sec.id, { pasos: [...(sec.pasos ?? []), p] })}
                onRemovePaso={(id) => onSetSectionStyle?.(sec.id, { pasos: (sec.pasos ?? []).filter((p) => p.id !== id) })}
                onUpdatePaso={(id, patch) =>
                  onSetSectionStyle?.(sec.id, { pasos: (sec.pasos ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)) })
                }
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'artesanas' && (
              <SeccionArtesanas
                artesanas={sec.artesanas ?? []}
                onAddArtesana={(a) => onSetSectionStyle?.(sec.id, { artesanas: [...(sec.artesanas ?? []), a] })}
                onRemoveArtesana={(id) =>
                  onSetSectionStyle?.(sec.id, { artesanas: (sec.artesanas ?? []).filter((a) => a.id !== id) })
                }
                onUpdateArtesana={(id, patch) =>
                  onSetSectionStyle?.(sec.id, {
                    artesanas: (sec.artesanas ?? []).map((a) => (a.id === id ? { ...a, ...patch } : a)),
                  })
                }
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                palette={palette}
              />
            )}
            {sec.type === 'ferias' && (
              <SeccionFerias
                ferias={sec.ferias ?? []}
                onAddFeria={(f) => onSetSectionStyle?.(sec.id, { ferias: [...(sec.ferias ?? []), f] })}
                onRemoveFeria={(id) => onSetSectionStyle?.(sec.id, { ferias: (sec.ferias ?? []).filter((f) => f.id !== id) })}
                onUpdateFeria={(id, patch) =>
                  onSetSectionStyle?.(sec.id, { ferias: (sec.ferias ?? []).map((f) => (f.id === id ? { ...f, ...patch } : f)) })
                }
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                subtitulo={sec.subtitulo}
                onUpdateSubtitulo={(v) => onSetSectionStyle?.(sec.id, { subtitulo: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'turnos' && (
              <SeccionTurnos
                barberos={sec.barberos ?? []}
                onAddBarbero={(b) => onSetSectionStyle?.(sec.id, { barberos: [...(sec.barberos ?? []), b] })}
                onRemoveBarbero={(id) =>
                  onSetSectionStyle?.(sec.id, { barberos: (sec.barberos ?? []).filter((b) => b.id !== id) })
                }
                onUpdateBarbero={(id, patch) =>
                  onSetSectionStyle?.(sec.id, {
                    barberos: (sec.barberos ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
                  })
                }
                servicios={sec.servicios ?? []}
                onAddServicio={(sv) => onSetSectionStyle?.(sec.id, { servicios: [...(sec.servicios ?? []), sv] })}
                onRemoveServicio={(id) =>
                  onSetSectionStyle?.(sec.id, { servicios: (sec.servicios ?? []).filter((sv) => sv.id !== id) })
                }
                onUpdateServicio={(id, patch) =>
                  onSetSectionStyle?.(sec.id, {
                    servicios: (sec.servicios ?? []).map((sv) => (sv.id === id ? { ...sv, ...patch } : sv)),
                  })
                }
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                whatsapp={whatsapp}
                nombreNegocio={nombreNegocio}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'precios-barberia' && (
              <SeccionPreciosBarberia
                servicios={sec.servicios ?? []}
                onAddServicio={(sv) => onSetSectionStyle?.(sec.id, { servicios: [...(sec.servicios ?? []), sv] })}
                onRemoveServicio={(id) =>
                  onSetSectionStyle?.(sec.id, { servicios: (sec.servicios ?? []).filter((sv) => sv.id !== id) })
                }
                onUpdateServicio={(id, patch) =>
                  onSetSectionStyle?.(sec.id, {
                    servicios: (sec.servicios ?? []).map((sv) => (sv.id === id ? { ...sv, ...patch } : sv)),
                  })
                }
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                nota={sec.nota}
                onUpdateNota={(v) => onSetSectionStyle?.(sec.id, { nota: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'barberos' && (
              <SeccionBarberos
                barberos={sec.barberos ?? []}
                onAddBarbero={(b) => onSetSectionStyle?.(sec.id, { barberos: [...(sec.barberos ?? []), b] })}
                onRemoveBarbero={(id) =>
                  onSetSectionStyle?.(sec.id, { barberos: (sec.barberos ?? []).filter((b) => b.id !== id) })
                }
                onUpdateBarbero={(id, patch) =>
                  onSetSectionStyle?.(sec.id, {
                    barberos: (sec.barberos ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
                  })
                }
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'reviews-barberia' && (
              <SeccionReviewsBarberia
                reviews={sec.reviews ?? []}
                onAddReview={(r) => onSetSectionStyle?.(sec.id, { reviews: [...(sec.reviews ?? []), r] })}
                onRemoveReview={(id) => onSetSectionStyle?.(sec.id, { reviews: (sec.reviews ?? []).filter((r) => r.id !== id) })}
                onUpdateReview={(id, patch) =>
                  onSetSectionStyle?.(sec.id, { reviews: (sec.reviews ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)) })
                }
                editable={editable}
                bgColor={sec.bgColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'citas-rotativas' && (
              <SeccionCitasRotativas
                citas={sec.citas ?? []}
                onAddCita={(c) => onSetSectionStyle?.(sec.id, { citas: [...(sec.citas ?? []), c] })}
                onRemoveCita={(id) => onSetSectionStyle?.(sec.id, { citas: (sec.citas ?? []).filter((c) => c.id !== id) })}
                onUpdateCita={(id, patch) =>
                  onSetSectionStyle?.(sec.id, { citas: (sec.citas ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)) })
                }
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'visita-taller' && (
              <SeccionVisitaTaller
                filas={sec.filas ?? []}
                onAddFila={(f) => onSetSectionStyle?.(sec.id, { filas: [...(sec.filas ?? []), f] })}
                onRemoveFila={(id) => onSetSectionStyle?.(sec.id, { filas: (sec.filas ?? []).filter((f) => f.id !== id) })}
                onUpdateFila={(id, patch) =>
                  onSetSectionStyle?.(sec.id, { filas: (sec.filas ?? []).map((f) => (f.id === id ? { ...f, ...patch } : f)) })
                }
                imagen={sec.imagen}
                onUpdateImagen={(v) => onSetSectionStyle?.(sec.id, { imagen: v })}
                mapaSimulado={sec.mapaSimulado}
                imagenPrimero={sec.imagenPrimero}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'contacto' && (
              <SeccionContacto
                accent={accent}
                palette={palette}
                horarios={horarios}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                buttonColor={sec.buttonColor}
                editable={editable}
                variant={sec.variant}
                titulo={sec.contactoTitulo}
                subtitulo={sec.contactoSubtitulo}
                placeholderNombre={sec.contactoPlaceholderNombre}
                placeholderEmail={sec.contactoPlaceholderEmail}
                placeholderMensaje={sec.contactoPlaceholderMensaje}
                textoBoton={sec.contactoTextoBoton}
                textoGracias={sec.contactoTextoGracias}
                camposExtra={sec.contactoCamposExtra ?? []}
                imagenUrl={sec.contactoImagenUrl}
                direccion={direccion}
                telefono={telefono}
                whatsapp={whatsapp}
                nombreNegocio={nombreNegocio}
                botones={sec.botones ?? {}}
                onUpdateBotones={(botones) => onSetSectionStyle?.(sec.id, { botones })}
                onUpdateContacto={(patch) => onSetSectionStyle?.(sec.id, patch)}
                onUpdateHorarios={field('horarios')}
                onUpdateDireccion={field('direccion')}
                onUpdateTelefono={field('telefono')}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
              />
            )}
            {sec.type === 'precios' && (
              <SeccionPrecios
                accent={accent}
                palette={palette}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                buttonColor={sec.buttonColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                planes={planes}
                editable={editable}
                onAddPlan={(item) => onAddListItem?.('planes', item)}
                onRemovePlan={(id) => onRemoveListItem?.('planes', id)}
                onUpdatePlan={(id, patch) => onUpdateListItem?.('planes', id, patch)}
                onDuplicatePlan={(id) => onDuplicateListItem?.('planes', id)}
                onMovePlan={(id, dir) => onMoveListItem?.('planes', id, dir)}
                onToggleOcultoPlan={(id) => onToggleListItemOculto?.('planes', id)}
                nombreNegocio={nombreNegocio}
                whatsapp={whatsapp}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
              />
            )}
            {sec.type === 'equipo' && (
              <SeccionEquipo
                equipo={equipo}
                variant={sec.variant}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                onAddMember={(item) => onAddListItem?.('equipo', item)}
                onRemoveMember={(id) => onRemoveListItem?.('equipo', id)}
                onUpdateMember={(id, patch) => onUpdateListItem?.('equipo', id, patch)}
                onDuplicateMember={(id) => onDuplicateListItem?.('equipo', id)}
                onMoveMember={(id, dir) => onMoveListItem?.('equipo', id, dir)}
                onToggleOcultoMember={(id) => onToggleListItemOculto?.('equipo', id)}
              />
            )}
            {sec.type === 'cta' && (
              <SeccionCTA
                variant={sec.variant}
                palette={palette}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                subtitulo={sec.subtitulo}
                onUpdateSubtitulo={(v) => onSetSectionStyle?.(sec.id, { subtitulo: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                buttonColor={sec.buttonColor}
                accent={accent}
                botones={sec.botones ?? {}}
                onUpdateBotones={(botones) => onSetSectionStyle?.(sec.id, { botones })}
                nombreNegocio={nombreNegocio}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
                whatsapp={whatsapp}
                imagenFondo={sec.imagenFondo}
                onUpdateImagenFondo={(url) => onSetSectionStyle?.(sec.id, { imagenFondo: url })}
              />
            )}
            {sec.type === 'menu' && (
              <SeccionMenu
                menuItems={menuItems}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                accent={accent}
                palette={palette}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                onAddItem={(item) => onAddListItem?.('menuItems', item)}
                onRemoveItem={(id) => onRemoveListItem?.('menuItems', id)}
                onUpdateItem={(id, patch) => onUpdateListItem?.('menuItems', id, patch)}
                onDuplicateItem={(id) => onDuplicateListItem?.('menuItems', id)}
                onToggleOcultoItem={(id) => onToggleListItemOculto?.('menuItems', id)}
              />
            )}
            {sec.type === 'marcas' && (
              <SeccionMarcas
                marcas={marcas}
                palette={palette}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                onAddLogos={(urls) => urls.forEach((url) => onAddListItem?.('marcas', { imagen: url }))}
                onRemoveLogo={(id) => onRemoveListItem?.('marcas', id)}
                onDuplicateLogo={(id) => onDuplicateListItem?.('marcas', id)}
                onToggleOcultoLogo={(id) => onToggleListItemOculto?.('marcas', id)}
              />
            )}
            {sec.type === 'mapa' && (
              <SeccionMapa
                direccion={direccion}
                palette={palette}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                onUpdateDireccion={field('direccion')}
              />
            )}
            {sec.type === 'blog' && (
              <SeccionBlog
                posts={posts}
                variant={sec.variant}
                palette={palette}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                onAddPost={(item) => onAddListItem?.('posts', item)}
                onRemovePost={(id) => onRemoveListItem?.('posts', id)}
                onUpdatePost={(id, patch) => onUpdateListItem?.('posts', id, patch)}
                onDuplicatePost={(id) => onDuplicateListItem?.('posts', id)}
                onMovePost={(id, dir) => onMoveListItem?.('posts', id, dir)}
                onToggleOcultoPost={(id) => onToggleListItemOculto?.('posts', id)}
              />
            )}
            {sec.type === 'categorias' && (
              <SeccionCategorias
                categorias={sec.categorias ?? []}
                onUpdate={(categorias) => onSetSectionStyle?.(sec.id, { categorias })}
                palette={palette}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
              />
            )}
            {sec.type === 'pasos' && (
              <SeccionPasos
                pasos={sec.pasos ?? []}
                onUpdate={(pasos) => onSetSectionStyle?.(sec.id, { pasos })}
                variant={sec.variant}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                nombreNegocio={nombreNegocio}
                whatsapp={whatsapp}
                botones={sec.botones ?? {}}
                onUpdateBotones={(botones) => onSetSectionStyle?.(sec.id, { botones })}
                descripcion={sec.descripcion}
                onUpdateDescripcion={(v) => onSetSectionStyle?.(sec.id, { descripcion: v })}
                imagen={sec.imagen}
                onUpdateImagen={(v) => onSetSectionStyle?.(sec.id, { imagen: v })}
                specs={sec.specs ?? []}
                onUpdateSpecs={(specs) => onSetSectionStyle?.(sec.id, { specs })}
                notaTitulo={sec.notaTitulo}
                onUpdateNotaTitulo={(v) => onSetSectionStyle?.(sec.id, { notaTitulo: v })}
                notaTexto={sec.notaTexto}
                onUpdateNotaTexto={(v) => onSetSectionStyle?.(sec.id, { notaTexto: v })}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
              />
            )}
            {sec.type === 'reservas' && (
              <SeccionReservas
                servicios={sec.servicios ?? []}
                onUpdate={(servicios) => onSetSectionStyle?.(sec.id, { servicios })}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                textColor={sec.textColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                itemsLabel={sec.itemsLabel}
                itemPlaceholder={sec.itemPlaceholder}
                addLabel={sec.addLabel}
                confirmLabel={sec.confirmLabel}
              />
            )}
            {sec.type === 'areas' && (
              <SeccionAreas
                areas={sec.areas ?? []}
                onUpdate={(areas) => onSetSectionStyle?.(sec.id, { areas })}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
              />
            )}
            {sec.type === 'pagos' && (
              <SeccionPagos
                metodos={sec.metodos ?? []}
                onUpdate={(metodos) => onSetSectionStyle?.(sec.id, { metodos })}
                palette={palette}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
              />
            )}
            {sec.type === 'financiacion' && (
              <SeccionFinanciacion
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                desc={sec.desc}
                onUpdateDesc={(v) => onSetSectionStyle?.(sec.id, { desc: v })}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                textColor={sec.textColor}
                nombreNegocio={nombreNegocio}
                whatsapp={whatsapp}
                botones={sec.botones ?? {}}
                onUpdateBotones={(botones) => onSetSectionStyle?.(sec.id, { botones })}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
              />
            )}
            {sec.type === 'beneficios' && (
              <SeccionBeneficios
                variant={sec.variant}
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
              />
            )}
            {sec.type === 'marquee' && (
              <SeccionMarquee
                mensajes={sec.mensajes ?? []}
                onUpdate={(mensajes) => onSetSectionStyle?.(sec.id, { mensajes })}
                editable={editable}
                bgColor={sec.bgColor}
                textColor={sec.textColor}
                palette={palette}
                separador={sec.separador}
                velocidad={sec.velocidad}
                fuente={sec.fuente}
              />
            )}
            {sec.type === 'series' && (
              <SeccionSeries
                variant={sec.variant}
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                textColor={sec.textColor}
                accent={accent}
                palette={palette}
              />
            )}
            {sec.type === 'archivo' && (
              <SeccionArchivo
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                subtitulo={sec.subtitulo}
                onUpdateSubtitulo={(v) => onSetSectionStyle?.(sec.id, { subtitulo: v })}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                palette={palette}
                accent={accent}
              />
            )}
            {sec.type === 'estadisticas' && (
              <SeccionEstadisticas
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                textColor={sec.textColor}
              />
            )}
            {sec.type === 'vidriera' && (
              <SeccionVidriera
                items={sec.items ?? []}
                onUpdate={(items) => onSetSectionStyle?.(sec.id, { items })}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                nombreNegocio={nombreNegocio}
                whatsapp={whatsapp}
                botones={sec.botones ?? {}}
                onUpdateBotones={(botones) => onSetSectionStyle?.(sec.id, { botones })}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
              />
            )}
            {sec.type === 'antes-despues' && (
              <SeccionAntesDespues
                antesImagen={sec.antesImagen}
                onUpdateAntesImagen={(v) => onSetSectionStyle?.(sec.id, { antesImagen: v })}
                despuesImagen={sec.despuesImagen}
                onUpdateDespuesImagen={(v) => onSetSectionStyle?.(sec.id, { despuesImagen: v })}
                antesLabel={sec.antesLabel}
                onUpdateAntesLabel={(v) => onSetSectionStyle?.(sec.id, { antesLabel: v })}
                despuesLabel={sec.despuesLabel}
                onUpdateDespuesLabel={(v) => onSetSectionStyle?.(sec.id, { despuesLabel: v })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                headingColor={sec.headingColor}
              />
            )}
            {sec.type === 'materiales' && (
              <SeccionMateriales
                materiales={sec.materiales ?? []}
                onUpdate={(materiales) => onSetSectionStyle?.(sec.id, { materiales })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                desc={sec.desc}
                onUpdateDesc={(v) => onSetSectionStyle?.(sec.id, { desc: v })}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                textColor={sec.textColor}
                headingColor={sec.headingColor}
              />
            )}
            {sec.type === 'anuncio' && (
              <SeccionAnuncio
                mensaje={sec.mensaje}
                onUpdateMensaje={(v) => onSetSectionStyle?.(sec.id, { mensaje: v })}
                telefono={telefono}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                textColor={sec.textColor}
              />
            )}
            {sec.type === 'zonas' && (
              <SeccionZonas
                variant={sec.variant}
                zonas={sec.zonas ?? []}
                onUpdate={(zonas) => onSetSectionStyle?.(sec.id, { zonas })}
                titulo={sec.titulo}
                onUpdateTitulo={(v) => onSetSectionStyle?.(sec.id, { titulo: v })}
                eyebrow={sec.eyebrow}
                onUpdateEyebrow={(v) => onSetSectionStyle?.(sec.id, { eyebrow: v })}
                palette={palette}
                accent={accent}
                editable={editable}
                bgColor={sec.bgColor}
                textColor={sec.textColor}
                headingColor={sec.headingColor}
              />
            )}
          </SectionShell>
          {editable && (
            <Gap
              dragging={!!dragState}
              isTarget={dragState?.overIndex === i + 1}
              disponibles={SECCIONES_CATALOGO.filter((c) => !SECCIONES_UNICAS.includes(c.id) || !hasSection(c.id))}
              onAdd={(type, variant) => onAddSection?.(type, i + 1, variant)}
              last={i === sections.length - 1}
            />
          )}
        </div>
      ))}

      {/* Botón flotante de WhatsApp — sigue pegado a la pantalla mientras se scrollea */}
      {widgets.whatsappFloating !== false && (whatsapp || editable) && (
        <FloatingWhatsApp
          whatsapp={whatsapp}
          nombreNegocio={nombreNegocio}
          raised={raised}
          position={widgets.whatsappPosition}
          editable={editable}
          onChangeNumber={field('whatsapp')}
        />
      )}

      {/* Carrito de compras (plantillas de gastronomía) — acumula productos y
          manda el pedido completo por WhatsApp, sin pasarela de pago. Siempre
          del lado derecho para no pisarse con el botón de WhatsApp. */}
      {widgets.carrito === true && (
        <FloatingCart cart={cart} open={cartOpen} onToggle={() => setCartOpen((v) => !v)} raised={raised} whatsapp={whatsapp} nombreNegocio={nombreNegocio} />
      )}

      {/* Confirmación breve al guardar un cambio en modo edición */}
      {editable && savedKey > 0 && <SavedToast key={savedKey} />}
    </div>
    </TextStyleCtx.Provider>
  );
}

// El número ya no lo carga el cuestionario inicial, así que en modo edición el
// widget siempre se muestra (aunque todavía no tenga número) con su propio
// mini editor flotante — igual que cualquier objeto Botón, pero acá no hay
// función para elegir: este widget es siempre WhatsApp.
function FloatingWhatsApp({ whatsapp, nombreNegocio, raised, position = 'left', editable, onChangeNumber }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(whatsapp ?? '');

  const wrapperClass = `fixed z-40 transition-[bottom] duration-300 ${position === 'right' ? 'right-5' : 'left-5'} ${
    raised ? 'bottom-28' : 'bottom-5'
  }`;

  if (editable) {
    return (
      <div className={wrapperClass}>
        <button
          type="button"
          onClick={() => {
            setDraft(whatsapp ?? '');
            setEditing((v) => !v);
          }}
          aria-label="Configurar el número de WhatsApp del widget flotante"
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-105 transition-transform"
        >
          <WhatsAppIcon className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-navy-950 text-white flex items-center justify-center">
            <PencilIcon className="w-2.5 h-2.5" />
          </span>
        </button>
        {editing && (
          <div
            className={`absolute bottom-full mb-2 w-64 rounded-xl bg-white text-neutral-900 shadow-xl p-3 text-left ${
              position === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            <label className="block text-xs font-semibold text-neutral-500 mb-1.5">
              Número de WhatsApp (con código de país)
            </label>
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="5491122223333"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 mb-2"
            />
            <button
              type="button"
              onClick={() => {
                onChangeNumber?.(draft);
                setEditing(false);
              }}
              className="w-full rounded-lg bg-[#25D366] text-white text-sm font-semibold py-2"
            >
              Guardar
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!whatsapp) return null;

  return (
    <a href={waLink(whatsapp, nombreNegocio)} target="_blank" rel="noreferrer" aria-label="Escribinos por WhatsApp" className={`group ${wrapperClass}`}>
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-70 animate-ping" />
      <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-2xl group-hover:scale-105 transition-transform">
        <WhatsAppIcon className="w-7 h-7" />
      </span>
    </a>
  );
}

// Botón flotante del carrito + panel con el pedido — sin pasarela de pago:
// solo acumula lo que se va agregando y arma un único mensaje de WhatsApp
// con todo el detalle al tocar "Comprar por WhatsApp" (mismo `waLink` que
// usa el resto de los botones de la página, ver arriba).
function FloatingCart({ cart, open, onToggle, raised, whatsapp, nombreNegocio }) {
  const wrapperClass = `fixed z-40 transition-[bottom] duration-300 right-5 ${raised ? 'bottom-28' : 'bottom-5'}`;

  const enviarPedido = () => {
    if (cart.items.length === 0 || !whatsapp) return;
    const lineas = cart.items.map(
      (i) =>
        `${i.cantidad}x ${i.nombre} - $${i.precio.toLocaleString('es-AR')} c/u = $${(i.precio * i.cantidad).toLocaleString('es-AR')}`
    );
    const mensaje = `Hola! Quiero hacer este pedido:\n\n${lineas.join('\n')}\n\nTotal: $${cart.total.toLocaleString('es-AR')}`;
    window.open(waLink(whatsapp, nombreNegocio, mensaje), '_blank', 'noopener,noreferrer');
    cart.clear();
    onToggle();
  };

  return (
    <>
      <div className={wrapperClass}>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Ver carrito de compras"
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-navy-950 text-white shadow-2xl hover:scale-105 transition-transform"
        >
          <CartIcon className="w-6 h-6" />
          {cart.count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
              {cart.count}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-black/50"
          onClick={onToggle}
        >
          <div
            className="w-full sm:w-96 sm:mr-5 max-h-[85vh] bg-white text-neutral-900 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
              <p className="font-semibold">Tu pedido</p>
              <button
                type="button"
                onClick={onToggle}
                aria-label="Cerrar carrito"
                className="text-neutral-400 hover:text-neutral-700"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.items.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">Todavía no agregaste nada al carrito.</p>
              ) : (
                <div className="space-y-4">
                  {cart.items.map((i) => (
                    <div key={i.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{i.nombre}</p>
                        <p className="text-xs text-neutral-400">${i.precio.toLocaleString('es-AR')} c/u</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => cart.decrement(i.id)}
                          aria-label="Restar"
                          className="w-6 h-6 border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm">{i.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => cart.increment(i.id)}
                          aria-label="Sumar"
                          className="w-6 h-6 border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => cart.removeItem(i.id)}
                          aria-label={`Quitar ${i.nombre}`}
                          className="text-neutral-300 hover:text-red-500 ml-1"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="px-5 py-4 border-t border-neutral-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-neutral-500">Total</span>
                  <span className="font-bold text-lg">${cart.total.toLocaleString('es-AR')}</span>
                </div>
                <button
                  type="button"
                  onClick={enviarPedido}
                  disabled={!whatsapp}
                  className="w-full rounded-xl bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-semibold py-3 flex items-center justify-center gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4" /> Comprar por WhatsApp
                </button>
                {!whatsapp && (
                  <p className="text-xs text-neutral-400 text-center mt-2">
                    Cargá un número de WhatsApp para poder enviar el pedido.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SavedToast() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div
        className="flex items-center gap-2 rounded-full bg-navy-950 text-white text-xs font-semibold px-4 py-2 shadow-xl"
        style={{ animation: 'toast-in-out 1.6s ease-out forwards' }}
      >
        <CheckIconSmall /> Guardado
      </div>
    </div>
  );
}

function CheckIconSmall() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Envoltorio que agrega controles flotantes (arrastrar/subir/bajar/color/quitar) sobre
// una sección opcional cuando estamos en modo edición — nada de esto se ve en la página publicada.
function SectionShell({
  editable,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onDragStart,
  type,
  variant,
  bgColor,
  headingColor,
  textColor,
  buttonColor,
  hasHeading = true,
  hasButton,
  onSetStyle,
  logoPalette = [],
  children,
}) {
  const toolbarRef = useRef(null);
  // Un solo estado para los 3 popovers (en vez de 3 booleanos): más simple de
  // mantener mutuamente excluyentes, y le da a cada popover un ancla estable
  // (`toolbarRef`) para posicionarse con `position:fixed` — así ninguno queda
  // recortado por el `overflow-hidden` de la tarjeta del editor, ni se corta
  // contra el borde inferior de la pantalla cuando la sección está muy abajo.
  const [openPanel, setOpenPanel] = useState(null); // null | 'help' | 'variant' | 'color'
  const variantes = SECTION_VARIANTS[type];
  if (!editable) return children;
  // Header y footer son secciones angostas: su propio contenido (logo, menú)
  // ya ocupa las esquinas, así que ahí la barra de controles se centra arriba
  // en vez de ir a la derecha — sin agregarle alto a la sección para hacerle lugar.
  const compact = type === 'header' || type === 'footer';
  const togglePanel = (panel) => () => setOpenPanel((current) => (current === panel ? null : panel));
  const closePanel = () => setOpenPanel(null);
  return (
    <div className="relative group/section">
      {children}
      <div
        ref={toolbarRef}
        data-tour="section-controls"
        className={`absolute top-2 flex items-center gap-1 rounded-full bg-navy-950/90 backdrop-blur px-1.5 py-1 opacity-0 pointer-events-none group-hover/section:opacity-100 group-hover/section:pointer-events-auto transition-opacity shadow-lg ${
          compact ? 'left-1/2 -translate-x-1/2' : 'right-3 @lg:right-6'
        }`}
      >
        <button
          type="button"
          onClick={togglePanel('help')}
          aria-label="Cómo usar esta sección"
          title="Cómo usar esta sección"
          className="text-white/70 hover:text-white transition-colors p-1.5"
        >
          <HelpCircleIcon className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-white/15" />
        <button
          type="button"
          onPointerDown={onDragStart}
          aria-label="Arrastrar para reordenar"
          title="Arrastrar para reordenar"
          className="text-white/70 hover:text-white transition-colors p-1.5 cursor-grab active:cursor-grabbing touch-none"
        >
          <DragHandleIcon className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-white/15" />
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label="Subir sección"
          className="text-white/70 hover:text-white disabled:opacity-25 transition-colors p-1.5"
        >
          <ChevronUpIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label="Bajar sección"
          className="text-white/70 hover:text-white disabled:opacity-25 transition-colors p-1.5"
        >
          <ChevronDownIcon className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-white/15" />
        {variantes && variantes.length > 1 && (
          <>
            <button
              type="button"
              onClick={togglePanel('variant')}
              aria-label="Distribución de la sección"
              title="Distribución de la sección"
              className="text-white/70 hover:text-white transition-colors p-1.5"
            >
              <LayoutIcon className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-white/15" />
          </>
        )}
        <button
          type="button"
          onClick={togglePanel('color')}
          aria-label="Color de la sección"
          title="Color de la sección"
          className="text-white/70 hover:text-white transition-colors p-1.5"
        >
          <PaletteIcon className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-white/15" />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Quitar sección"
          className="text-white/70 hover:text-red-400 transition-colors p-1.5"
        >
          <XIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      {openPanel === 'variant' && (
        <SectionVariantPicker
          type={type}
          variant={variant}
          anchorRef={toolbarRef}
          align={compact ? 'center' : 'end'}
          onChange={(v) => {
            onSetStyle?.({ variant: v });
            closePanel();
          }}
          onClose={closePanel}
        />
      )}
      {openPanel === 'color' && (
        <SectionColorPicker
          bgColor={bgColor}
          headingColor={headingColor}
          textColor={textColor}
          buttonColor={buttonColor}
          hasHeading={hasHeading}
          hasButton={hasButton}
          anchorRef={toolbarRef}
          align={compact ? 'center' : 'end'}
          onChange={(patch) => onSetStyle?.(patch)}
          onClose={closePanel}
          logoPalette={logoPalette}
        />
      )}
      {openPanel === 'help' && (
        <SectionHelpPopover type={type} anchorRef={toolbarRef} align={compact ? 'center' : 'end'} onClose={closePanel} />
      )}
    </div>
  );
}

// Barra de acciones para UN ítem dentro de una lista (producto, testimonio,
// integrante del equipo, etc.) — subir, bajar, duplicar, ocultar y quitar.
// `variant="overlay"` es una píldora oscura semitransparente para tarjetas
// con foto de fondo (mismo lenguaje que la barra de SectionShell, pero a
// escala de ítem); `variant="inline"` es una fila de íconos sueltos sin
// fondo, para tarjetas de solo texto que ya usan `opacity-40 hover:opacity-100`.
function ItemToolbar({
  variant = 'overlay',
  oculto,
  canMoveUp = true,
  canMoveDown = true,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onToggleOculto,
  onRemove,
  removeLabel = 'Quitar',
  color,
  className = '',
}) {
  const isOverlay = variant === 'overlay';
  const btnClass = isOverlay
    ? 'w-6 h-6 flex items-center justify-center text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none'
    : 'w-6 h-6 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity disabled:opacity-10 disabled:pointer-events-none';
  return (
    <div
      className={`flex items-center shrink-0 ${isOverlay ? 'gap-0.5 rounded-full bg-navy-950/80 backdrop-blur px-1 py-0.5' : 'gap-0.5'} ${className}`}
      style={isOverlay ? undefined : { color: color || 'currentColor' }}
    >
      {onMoveUp && (
        <button type="button" onClick={onMoveUp} disabled={!canMoveUp} aria-label="Mover arriba" title="Mover arriba" className={btnClass}>
          <ChevronUpIcon className="w-3 h-3" />
        </button>
      )}
      {onMoveDown && (
        <button type="button" onClick={onMoveDown} disabled={!canMoveDown} aria-label="Mover abajo" title="Mover abajo" className={btnClass}>
          <ChevronDownIcon className="w-3 h-3" />
        </button>
      )}
      {onDuplicate && (
        <button type="button" onClick={onDuplicate} aria-label="Duplicar" title="Duplicar" className={btnClass}>
          <CopyIcon className="w-3 h-3" />
        </button>
      )}
      {onToggleOculto && (
        <button
          type="button"
          onClick={onToggleOculto}
          aria-label={oculto ? 'Mostrar en la página' : 'Ocultar de la página'}
          title={oculto ? 'Mostrar en la página' : 'Ocultar de la página'}
          className={btnClass}
        >
          {oculto ? <EyeOffIcon className="w-3 h-3" /> : <EyeIcon className="w-3 h-3" />}
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          title={removeLabel}
          className={`${btnClass} hover:text-red-400`}
        >
          <XIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Resuelve por nombre el ícono de cada tipo de objeto (ver OBJECT_TYPES en
// mockData.js) — mismo patrón que ICON_COMPONENTS, pero con las claves en
// PascalCase porque acá no son elegibles por el usuario, solo decoran el
// menú de "Agregar objeto".
const OBJECT_TYPE_ICON_COMPONENTS = { TypeIcon, AlignLeftIcon, LinkIcon, ImageIcon, TagIcon };

function defaultObjetoData(tipo) {
  switch (tipo) {
    case 'titulo':
      return { texto: 'Título' };
    case 'texto':
      return { texto: 'Escribí un texto breve.' };
    case 'badge':
      return { texto: 'Etiqueta' };
    case 'boton':
      return { label: 'Botón', funcion: 'whatsapp' };
    case 'imagen':
      return { src: '' };
    default:
      return {};
  }
}

// Un objeto individual dentro de una Zona — cada `tipo` envuelve un
// componente que YA existe (Editable, ButtonObject, el mismo flujo de
// subida de foto que usa el Hero clásico) en vez de reinventar el campo:
// la ganancia de Zonas+Objetos es la composición, no un editor de texto
// nuevo.
function ObjectRenderer({
  objeto,
  editable,
  onUpdate,
  palette = {},
  accent,
  headingColor,
  textColor,
  seccionesDisponibles = [],
  nombreNegocio,
  whatsapp,
  telefono,
}) {
  const handleImagen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) onUpdate({ src: await uploadImage(file) });
  };

  if (objeto.tipo === 'titulo') {
    return (
      <Editable
        editable={editable}
        value={objeto.texto}
        onChange={(v) => onUpdate({ texto: v })}
        tag="h1"
        block
        multiline
        styleKey={`objeto.${objeto.id}.texto`}
        placeholder="Título"
        style={{ color: headingColor || palette.ink }}
        className="font-serif text-4xl @lg:text-5xl leading-[1.05] tracking-tight"
        maxLength={80}
      />
    );
  }
  if (objeto.tipo === 'texto') {
    return (
      <Editable
        editable={editable}
        value={objeto.texto}
        onChange={(v) => onUpdate({ texto: v })}
        tag="p"
        block
        multiline
        styleKey={`objeto.${objeto.id}.texto`}
        placeholder="Texto"
        style={{ color: textColor || palette.inkSoft }}
        className="text-base leading-relaxed"
        maxLength={220}
      />
    );
  }
  if (objeto.tipo === 'badge') {
    return (
      <Editable
        editable={editable}
        value={objeto.texto}
        onChange={(v) => onUpdate({ texto: v })}
        tag="span"
        block
        styleKey={`objeto.${objeto.id}.texto`}
        placeholder="Etiqueta"
        style={{ color: accent }}
        className="font-mono text-xs uppercase tracking-[0.16em]"
        maxLength={40}
      />
    );
  }
  if (objeto.tipo === 'boton') {
    return (
      <ButtonObject
        value={objeto}
        onChange={onUpdate}
        editable={editable}
        seccionesDisponibles={seccionesDisponibles}
        nombreNegocio={nombreNegocio}
        defaultColor={palette.inkHex || '#171717'}
        defaultLabel="Botón"
        defaultFuncion="whatsapp"
        defaultTarget={whatsapp || telefono}
      />
    );
  }
  if (objeto.tipo === 'imagen') {
    return (
      <label
        className={`relative block w-full aspect-[4/5] bg-black/5 overflow-hidden group/imgobj ${editable ? 'cursor-pointer' : ''}`}
        title={editable ? 'Cambiar foto' : undefined}
      >
        {objeto.src ? (
          <img src={objeto.src} alt="" className="w-full h-full object-cover" style={{ filter: 'grayscale(0.15) contrast(1.05)' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-center px-4" style={{ color: palette.inkSoft }}>
            {editable ? 'Subí una foto' : ''}
          </div>
        )}
        {editable && (
          <>
            <span className="absolute inset-0 bg-black/0 group-hover/imgobj:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/imgobj:opacity-100">
              <span className="text-white text-xs font-semibold">Cambiar foto</span>
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />
          </>
        )}
      </label>
    );
  }
  return null;
}

// Botón "+ Agregar objeto" con menú de tipos permitidos — mismo patrón que
// AgregarRutaButton (botón punteado + popover que se cierra clickeando afuera).
function AddObjectButton({ allowedTypes = [], onAdd, fullWidth = true }) {
  const [open, setOpen] = useState(false);
  const options = allowedTypes.map((tipo) => ({ tipo, ...OBJECT_TYPES[tipo] })).filter((o) => o.label);
  if (options.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-dashed border-black/20 text-neutral-500 hover:border-gold-500 hover:text-gold-600 px-3.5 py-2 text-sm font-semibold transition-colors ${
          fullWidth ? 'w-full' : ''
        }`}
      >
        <PlusIcon className="w-3.5 h-3.5" /> Agregar objeto
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-1 left-0 w-48 rounded-xl border border-neutral-200 bg-white shadow-xl p-1.5">
            {options.map((o) => {
              const Icon = OBJECT_TYPE_ICON_COMPONENTS[o.icon];
              return (
                <button
                  key={o.tipo}
                  type="button"
                  onClick={() => {
                    onAdd(o.tipo);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  {Icon && <Icon className="w-4 h-4 text-neutral-400 shrink-0" />}
                  {o.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Una Zona: lista ordenable de Objetos con límites propios (qué tipos entran
// y cuántos como máximo) — nunca posicionamiento libre. Este componente es
// el que evita la duplicación de código a futuro: cualquier sección que
// adopte Zonas reusa el mismo renderer, solo cambian `allowedTypes`/`maxObjetos`.
function ZoneRenderer({
  objetos = [],
  onChange,
  allowedTypes = [],
  maxObjetos = 8,
  editable,
  palette = {},
  accent,
  headingColor,
  textColor,
  seccionesDisponibles = [],
  nombreNegocio,
  whatsapp,
  telefono,
  className = '',
}) {
  const update = (id, patch) => onChange(objetos.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const remove = (id) => onChange(objetos.filter((o) => o.id !== id));
  const duplicate = (id) => {
    const idx = objetos.findIndex((o) => o.id === id);
    if (idx === -1) return;
    const copy = { ...objetos[idx], id: `objeto-${Date.now()}` };
    onChange([...objetos.slice(0, idx + 1), copy, ...objetos.slice(idx + 1)]);
  };
  const move = (id, direction) => {
    const idx = objetos.findIndex((o) => o.id === id);
    const swapIdx = idx + direction;
    if (idx === -1 || swapIdx < 0 || swapIdx >= objetos.length) return;
    const next = [...objetos];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    onChange(next);
  };
  const toggleOculto = (id) => update(id, { oculto: !objetos.find((o) => o.id === id)?.oculto });
  const add = (tipo) => onChange([...objetos, { id: `objeto-${Date.now()}`, tipo, ...defaultObjetoData(tipo) }]);

  const visibles = editable ? objetos : objetos.filter((o) => !o.oculto);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {visibles.map((o, i, arr) => (
        <div key={o.id} className={`relative group/objeto ${o.oculto ? 'opacity-40' : ''}`}>
          <ObjectRenderer
            objeto={o}
            editable={editable}
            onUpdate={(patch) => update(o.id, patch)}
            palette={palette}
            accent={accent}
            headingColor={headingColor}
            textColor={textColor}
            seccionesDisponibles={seccionesDisponibles}
            nombreNegocio={nombreNegocio}
            whatsapp={whatsapp}
            telefono={telefono}
          />
          {editable && (
            <div className="absolute -top-2 -right-2 opacity-0 group-hover/objeto:opacity-100 transition-opacity">
              <ItemToolbar
                variant="overlay"
                oculto={o.oculto}
                canMoveUp={i > 0}
                canMoveDown={i < arr.length - 1}
                onMoveUp={() => move(o.id, -1)}
                onMoveDown={() => move(o.id, 1)}
                onDuplicate={() => duplicate(o.id)}
                onToggleOculto={() => toggleOculto(o.id)}
                onRemove={() => remove(o.id)}
                removeLabel={`Quitar ${OBJECT_TYPES[o.tipo]?.label?.toLowerCase() || 'objeto'}`}
              />
            </div>
          )}
        </div>
      ))}
      {editable && objetos.length < maxObjetos && <AddObjectButton allowedTypes={allowedTypes} onAdd={add} />}
    </div>
  );
}

const BG_SWATCHES = [
  { label: 'Blanco', value: '#ffffff' },
  { label: 'Gris claro', value: '#f5f5f4' },
  { label: 'Coral', value: '#ffe4e0' },
  { label: 'Rosa', value: '#fce4f1' },
  { label: 'Azul', value: '#e0edff' },
  { label: 'Violeta', value: '#ede4ff' },
  { label: 'Verde', value: '#e0f5e8' },
  { label: 'Dorado', value: '#fff3d6' },
];

const TEXT_SWATCHES = [
  { label: 'Oscuro', value: '#1a1a1a' },
  { label: 'Blanco', value: '#ffffff' },
];

const BUTTON_SWATCHES = [
  { label: 'Navy', value: '#0b1120' },
  { label: 'Coral', value: '#ff6b57' },
  { label: 'Dorado', value: '#f5b400' },
  { label: 'Azul', value: '#2563eb' },
  { label: 'Violeta', value: '#7c3aed' },
  { label: 'Verde', value: '#16a34a' },
];

// Una fila del popover: título, botón "Restablecer" opcional, swatches + rueda de color libre.
// `logoSwatches` (opcional) son los colores sacados del logo — se muestran
// aparte, con un borde dorado, para que se note que son "los tuyos".
function ColorRow({ label, value, swatches, logoSwatches = [], defaultValue, onPick, onReset }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
        {value && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            Restablecer
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {swatches.map((s) => (
          <button
            key={s.value}
            type="button"
            title={s.label}
            aria-label={s.label}
            onClick={() => onPick(s.value)}
            className={`w-7 h-7 rounded-full border border-black/10 shrink-0 transition-transform hover:scale-110 ${
              value === s.value ? 'ring-2 ring-offset-1 ring-neutral-900' : ''
            }`}
            style={{ background: s.value }}
          />
        ))}
        {logoSwatches.length > 0 && <div className="w-px self-stretch bg-neutral-200 mx-0.5" />}
        {logoSwatches.map((s) => (
          <button
            key={s.value}
            type="button"
            title={s.label}
            aria-label={s.label}
            onClick={() => onPick(s.value)}
            className={`w-7 h-7 rounded-full border-2 border-gold-400 shrink-0 transition-transform hover:scale-110 ${
              value === s.value ? 'ring-2 ring-offset-1 ring-neutral-900' : ''
            }`}
            style={{ background: s.value }}
          />
        ))}
        <label
          title="Elegir cualquier color"
          className="relative w-7 h-7 rounded-full shrink-0 cursor-pointer hover:scale-110 transition-transform bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]"
        >
          <input
            type="color"
            value={value ?? defaultValue}
            onChange={(e) => onPick(e.target.value)}
            aria-label={`${label} personalizado`}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}

// Popover posicionado con `position:fixed` a partir del rectángulo real del
// elemento ancla (medido con `getBoundingClientRect`), no con CSS `absolute`.
// Así nunca queda recortado por el `overflow-hidden` de la tarjeta del
// editor, y si no entra hacia abajo (por ejemplo, una sección muy abajo en
// la página, como el footer) se abre hacia arriba automáticamente — se mide
// su propio alto ya renderizado antes de decidir, con `useLayoutEffect` para
// que no haya parpadeo.
function FixedPopover({ anchorRef, align = 'end', gap = 8, className = '', onClose, children }) {
  const panelRef = useRef(null);
  const [style, setStyle] = useState({ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden' });

  useLayoutEffect(() => {
    const anchor = anchorRef?.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    const anchorRect = anchor.getBoundingClientRect();
    const rect = panel.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - anchorRect.bottom - gap;
    const spaceAbove = anchorRect.top - gap;
    const openUp = rect.height > spaceBelow && spaceAbove > spaceBelow;
    const top = openUp ? Math.max(8, anchorRect.top - rect.height - gap) : anchorRect.bottom + gap;
    const maxHeight = Math.max(140, (openUp ? spaceAbove : spaceBelow) - 8);

    let left =
      align === 'center' ? anchorRect.left + anchorRect.width / 2 - rect.width / 2 : anchorRect.right - rect.width;
    left = Math.min(Math.max(left, 8), Math.max(8, vw - rect.width - 8));

    setStyle({ position: 'fixed', top, left, maxHeight, visibility: 'visible' });
  }, [anchorRef, align, gap]);

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div ref={panelRef} style={style} className={`z-40 overflow-y-auto ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </>
  );
}

// Popover con la distribución interna de la sección, anclado a su propio botón
// (separado del de colores para que no comparta scroll con las filas de color).
// Cambiar de acá no toca ni los colores ni el contenido ya cargado — solo el
// `variant`, que es lo único que decide cómo se acomoda el contenido existente.
function SectionVariantPicker({ type, variant, onChange, onClose, anchorRef, align }) {
  const variantes = SECTION_VARIANTS[type] ?? [];
  // Algunos tipos de sección (hoy, "productos") juntan distribuciones para
  // usos bastante distintos entre sí — mostrar precios, listar servicios sin
  // foto, o un catálogo de productos con foto — bajo el mismo `type`. Sin
  // agrupar, las 9 opciones se ven como una sola grilla pareja y no queda
  // claro cuál conviene para cada caso. Si ninguna variante declaró `group`,
  // se muestra la grilla plana de siempre (el resto de los tipos de sección).
  const hasGroups = variantes.some((v) => v.group);
  const grupos = variantes.reduce((acc, v) => {
    const g = v.group || '';
    (acc[g] ||= []).push(v);
    return acc;
  }, {});

  const grid = (items) => (
    <div className="grid grid-cols-2 gap-2">
      {items.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(v.id)}
          aria-label={v.label}
          className={`rounded-lg border transition-colors p-2 text-center ${
            v.id === variant
              ? 'border-gold-500 bg-gold-500/5'
              : 'border-neutral-200 hover:border-gold-500 hover:bg-gold-500/5'
          }`}
        >
          <div className="h-12 rounded-md bg-neutral-50 border border-neutral-100 mb-1.5 p-2 flex items-center justify-center overflow-hidden">
            <VariantSkeleton kind={v.skeleton} />
          </div>
          <span className="text-[11px] font-semibold text-neutral-700">{v.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <FixedPopover
      anchorRef={anchorRef}
      align={align}
      onClose={onClose}
      className="w-64 rounded-xl border border-neutral-200 bg-white shadow-xl p-3 text-left"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2 px-1">Distribución</p>
      {hasGroups
        ? Object.entries(grupos).map(([g, items], i) => (
            <div key={g || 'sin-grupo'} className={i > 0 ? 'mt-3' : ''}>
              {g && <p className="text-[10px] font-bold uppercase tracking-wide text-gold-600 mb-1.5 px-1">{g}</p>}
              {grid(items)}
            </div>
          ))
        : grid(variantes)}
    </FixedPopover>
  );
}

// Popover del botón "?" de cada sección: qué hace y cómo se configura ESE tipo
// de sección en particular — no un tutorial general, sino uno acotado a lo que
// esa sección puntual tiene de especial.
function SectionHelpPopover({ type, onClose, anchorRef, align }) {
  const help = SECTION_HELP[type];
  return (
    <FixedPopover
      anchorRef={anchorRef}
      align={align}
      onClose={onClose}
      className="w-72 rounded-xl border border-neutral-200 bg-white shadow-xl p-4 text-left"
    >
      <p className="text-sm font-bold text-neutral-800 mb-2">{help?.title ?? 'Esta sección'}</p>
      <ul className="space-y-1.5">
        {(help?.tips ?? ['Tocá cualquier texto, foto o botón de esta sección para editarlo directamente.']).map(
          (tip) => (
            <li key={tip} className="text-xs text-neutral-500 leading-relaxed flex gap-1.5">
              <span className="text-gold-500 shrink-0">•</span>
              {tip}
            </li>
          )
        )}
      </ul>
    </FixedPopover>
  );
}

// Popover anclado al botón de paleta de una sección: fondo, título, texto y botones,
// cada uno independiente, con opción de volver al color por defecto de la plantilla.
function SectionColorPicker({
  bgColor,
  headingColor,
  textColor,
  buttonColor,
  hasHeading = true,
  hasButton,
  onChange,
  onClose,
  anchorRef,
  align,
  logoPalette = [],
}) {
  // Los colores del logo se ofrecen como swatches extra en Fondo y Botones —
  // ahí es donde de verdad conviene usar un color de marca. En Título/Texto
  // se dejan solo oscuro/blanco fijos, para no arriesgar la legibilidad con
  // un tono al azar sacado del logo.
  const logoSwatches = logoPalette.map((hex, i) => ({ label: `Color ${i + 1} de tu logo`, value: hex }));

  return (
    <FixedPopover
      anchorRef={anchorRef}
      align={align}
      onClose={onClose}
      className="w-64 rounded-xl border border-neutral-200 bg-white shadow-xl p-4 text-left"
    >
      <ColorRow
        label="Fondo"
        value={bgColor}
        swatches={BG_SWATCHES}
        logoSwatches={logoSwatches}
        defaultValue="#ffffff"
        onPick={(v) => onChange({ bgColor: v })}
        onReset={() => onChange({ bgColor: undefined })}
      />
      {hasHeading && (
        <ColorRow
          label="Título"
          value={headingColor}
          swatches={TEXT_SWATCHES}
          defaultValue="#1a1a1a"
          onPick={(v) => onChange({ headingColor: v })}
          onReset={() => onChange({ headingColor: undefined })}
        />
      )}
      <ColorRow
        label="Texto"
        value={textColor}
        swatches={TEXT_SWATCHES}
        defaultValue="#1a1a1a"
        onPick={(v) => onChange({ textColor: v })}
        onReset={() => onChange({ textColor: undefined })}
      />
      {hasButton && (
        <ColorRow
          label="Botones"
          value={buttonColor}
          swatches={BUTTON_SWATCHES}
          logoSwatches={logoSwatches}
          defaultValue="#f5b400"
          onPick={(v) => onChange({ buttonColor: v })}
          onReset={() => onChange({ buttonColor: undefined })}
        />
      )}
    </FixedPopover>
  );
}

// Qué ícono representa cada función del catálogo BUTTON_FUNCTIONS — WhatsAppIcon
// está definida más abajo en este mismo archivo, pero al ser `function` queda
// disponible acá igual (hoisting).
const BUTTON_FUNCTION_ICONS = {
  whatsapp: WhatsAppIcon,
  llamar: PhoneCallIcon,
  agendar: CalendarIcon,
  seccion: CompassIcon,
  pagina: MenuIcon,
  email: SendIcon,
  enlace: LinkIcon,
};

// En modo edición un slot de botón siempre se muestra (para poder configurarlo).
// En modo lectura (sitio publicado) se oculta si su función necesita un dato
// (teléfono, email, url, sección) que todavía no se cargó — mejor que mostrar
// un botón que no hace nada.
function buttonSlotVisible(editable, value, defaultFuncion, defaultTarget) {
  if (editable) return true;
  const funcionId = value?.funcion || defaultFuncion;
  const funcion = BUTTON_FUNCTIONS.find((f) => f.id === funcionId) || BUTTON_FUNCTIONS[0];
  if (funcion.target === null || funcion.target === 'page') return true;
  const effectiveTarget = value?.target || (funcionId === defaultFuncion ? defaultTarget : undefined);
  return !!effectiveTarget;
}

// Elige texto blanco o negro según qué tan clara es la de fondo — así un botón
// con color personalizado sigue siendo legible sin tener que pedirle al usuario
// que también elija el color del texto.
function readableTextColor(hex) {
  if (!hex) return '#0b1120';
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((ch) => ch + ch).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return '#0b1120';
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0b1120' : '#ffffff';
}

// Popover de función: elegir QUÉ hace el botón (con su propio ícono + descripción,
// como un mini-catálogo) y, si esa función necesita un dato extra (teléfono,
// email, url, sección propia), pedirlo ahí mismo debajo de la opción elegida.
function ButtonFunctionPicker({ value, onChange, onClose, anchorRef, align, seccionesDisponibles = [] }) {
  const current = value.funcion || BUTTON_FUNCTIONS[0].id;
  return (
    <FixedPopover
      anchorRef={anchorRef}
      align={align}
      onClose={onClose}
      className="w-72 rounded-xl border border-neutral-200 bg-white shadow-xl p-2 text-left"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-1.5 px-2">Función del botón</p>
      <div className="space-y-1">
        {BUTTON_FUNCTIONS.map((f) => {
          const selected = f.id === current;
          const Icon = BUTTON_FUNCTION_ICONS[f.id] || LinkIcon;
          return (
            <div key={f.id}>
              <button
                type="button"
                onClick={() => onChange({ funcion: f.id, target: f.id === current ? value.target : undefined })}
                className={`w-full flex items-start gap-2.5 text-left px-2.5 py-2 rounded-lg transition-colors ${
                  selected ? 'bg-gold-500/10' : 'hover:bg-neutral-100'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    selected ? 'bg-gold-500 text-navy-950' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-neutral-800">{f.label}</span>
                  <span className="block text-[11px] text-neutral-400 leading-snug">{f.desc}</span>
                </span>
              </button>
              {selected && (f.target === 'phone' || f.target === 'email' || f.target === 'url') && (
                <input
                  autoFocus
                  type={f.target === 'phone' ? 'tel' : f.target === 'email' ? 'email' : 'url'}
                  value={value.target ?? ''}
                  onChange={(e) => onChange({ target: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full mt-1 mb-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-gold-500"
                />
              )}
              {selected && f.target === 'section' && (
                <div className="flex flex-wrap gap-1.5 px-1 mt-1 mb-1.5">
                  {seccionesDisponibles.length === 0 ? (
                    <span className="text-[11px] text-neutral-400 px-1">No hay otras secciones todavía.</span>
                  ) : (
                    seccionesDisponibles.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onChange({ target: s.id })}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                          value.target === s.id
                            ? 'bg-gold-500 border-gold-500 text-navy-950'
                            : 'border-neutral-200 text-neutral-500 hover:border-gold-500'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))
                  )}
                </div>
              )}
              {selected && f.target === 'page' && (
                <p className="text-[11px] text-neutral-400 px-3 mt-1 mb-1.5 leading-snug">
                  Crear páginas nuevas todavía no está disponible — este botón queda deshabilitado por ahora.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </FixedPopover>
  );
}

// El botón ya renderizado (modo lectura / sitio publicado): resuelve la función
// elegida en un href real cuando corresponde, o intercepta el click cuando la
// función abre algo en la misma página (sección propia, modal de agendar) en
// vez de navegar — nunca un `href="#id"` real, que rompería el ruteo por hash
// de la app (HashRouter usa el fragmento para la ruta, no para anclas).
function ButtonObjectLink({ funcion, target, label, color, size, className, nombreNegocio, waMessage, outline }) {
  const [agendarOpen, setAgendarOpen] = useState(false);
  const disabled = funcion.id === 'pagina';
  const Icon = BUTTON_FUNCTION_ICONS[funcion.id] || LinkIcon;
  const externalBlank = funcion.id === 'whatsapp' || funcion.id === 'enlace';
  // whatsapp/llamar/email/enlace necesitan un dato (número, mail, url) para
  // funcionar; si todavía no se cargó, el botón no debe navegar a ningún
  // lado — con HashRouter, dejar pasar un `href="#"` navegaría al inicio.
  const needsTarget = ['whatsapp', 'llamar', 'email', 'enlace'].includes(funcion.id);
  const missingTarget = needsTarget && !target;

  let href = '#';
  if (funcion.id === 'whatsapp' && target) href = waLink(target, nombreNegocio, waMessage);
  else if (funcion.id === 'llamar' && target) href = `tel:${target.replace(/\s|-/g, '')}`;
  else if (funcion.id === 'email' && target) href = `mailto:${target}`;
  else if (funcion.id === 'enlace' && target) href = target;

  const handleClick = (e) => {
    if (disabled || missingTarget) {
      e.preventDefault();
      return;
    }
    if (funcion.id === 'agendar') {
      e.preventDefault();
      setAgendarOpen(true);
      return;
    }
    if (funcion.id === 'seccion') {
      e.preventDefault();
      if (target) document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <a
        href={href}
        target={externalBlank ? '_blank' : undefined}
        rel={externalBlank ? 'noreferrer' : undefined}
        aria-disabled={disabled || missingTarget}
        onClick={handleClick}
        className={`inline-flex items-center gap-2 font-semibold transition ${
          disabled || missingTarget ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
        } ${size === 'sm' ? 'px-4 py-2 text-xs' : 'px-5 py-3 text-sm'} ${className}`}
        style={
          outline
            ? { background: 'transparent', color, border: `1px solid ${color}` }
            : { background: color, color: readableTextColor(color) }
        }
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </a>
      {funcion.id === 'agendar' && agendarOpen && (
        <AgendarCitaModal nombreNegocio={nombreNegocio} onClose={() => setAgendarOpen(false)} />
      )}
    </>
  );
}

// Objeto Botón: reutilizable en cualquier sección (Hero, footer, Productos...).
// Guarda su propia función, el dato que esa función necesita y un color
// opcional — todo elegido acá adentro del editor, no en el cuestionario
// inicial. El menú usa el mismo `FixedPopover` que el resto de los objetos y
// secciones, para que el estilo de edición sea consistente en todos lados.
function ButtonObject({
  value,
  onChange,
  editable,
  seccionesDisponibles = [],
  nombreNegocio,
  defaultColor = '#f5b400',
  defaultLabel = 'Escribinos',
  defaultFuncion = 'whatsapp',
  // Dato de respaldo (ej: el WhatsApp del negocio) que se usa mientras el
  // botón no tenga su propio target cargado — no pisa lo que el usuario haya
  // configurado puntualmente para este botón, solo cubre el estado inicial.
  defaultTarget,
  // Mensaje de WhatsApp propio de este botón (ej: menciona el producto al
  // que pertenece) — si no se pasa, usa el genérico de `waLink`.
  waMessage,
  size = 'md',
  className = '',
  outline = false,
}) {
  const v = value || {};
  const funcionId = v.funcion || defaultFuncion;
  const funcion = BUTTON_FUNCTIONS.find((f) => f.id === funcionId) || BUTTON_FUNCTIONS[0];
  const color = v.color || defaultColor;
  const label = v.label ?? defaultLabel;
  const effectiveTarget = v.target || (funcionId === defaultFuncion ? defaultTarget : undefined);
  const toolbarRef = useRef(null);
  const [openPanel, setOpenPanel] = useState(null); // null | 'funcion' | 'color'
  const Icon = BUTTON_FUNCTION_ICONS[funcion.id] || LinkIcon;
  const disabled = funcion.id === 'pagina';
  // El menú de función/color se ocultaba apenas el mouse salía del botón —
  // demasiado poco tiempo para llegar a él o para operar el popover que abre.
  // Con un `hovered` propio (en vez de CSS `group-hover` puro) se puede dar
  // un margen antes de esconderlo, y ese margen se cancela si el mouse vuelve.
  const [hovered, setHovered] = useState(false);
  const hideTimer = useRef(null);
  const showToolbar = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setHovered(true);
  };
  const scheduleHideToolbar = () => {
    hideTimer.current = setTimeout(() => setHovered(false), 900);
  };
  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  if (!editable) {
    return (
      <ButtonObjectLink
        funcion={funcion}
        target={effectiveTarget}
        label={label}
        color={color}
        size={size}
        className={className}
        nombreNegocio={nombreNegocio}
        waMessage={waMessage}
        outline={outline}
      />
    );
  }

  const togglePanel = (panel) => () => setOpenPanel((c) => (c === panel ? null : panel));
  const closePanel = () => setOpenPanel(null);
  // Si el usuario nunca escribió una etiqueta propia, al cambiar de función
  // conviene sugerir una nueva acorde (ej: pasar de "Escribinos por WhatsApp"
  // a "Agendar cita") en vez de dejar el texto viejo pegado a una función que
  // ya no es la que dice. Si ya la había editado a mano, se respeta tal cual.
  const handleFunctionChange = (patch) => {
    const next = { ...patch };
    if (patch.funcion && patch.funcion !== funcion.id && !v.label) {
      next.label = BUTTON_FUNCTIONS.find((f) => f.id === patch.funcion)?.label;
    }
    onChange(next);
  };

  const toolbarVisible = hovered || !!openPanel;

  return (
    <span className="relative inline-flex" onMouseEnter={showToolbar} onMouseLeave={scheduleHideToolbar}>
      <span
        className={`inline-flex items-center gap-2 font-semibold ${
          disabled ? 'opacity-50' : ''
        } ${size === 'sm' ? 'px-4 py-2 text-xs' : 'px-5 py-3 text-sm'} ${className}`}
        style={
          outline
            ? { background: 'transparent', color, border: `1px solid ${color}` }
            : { background: color, color: readableTextColor(color) }
        }
      >
        <Icon className="w-4 h-4 shrink-0" />
        <Editable
          editable
          value={label}
          onChange={(next) => onChange({ label: next })}
          tag="span"
          className="cursor-text"
          style={{ color: outline ? color : readableTextColor(color) }}
          maxLength={30}
        />
      </span>
      <div
        ref={toolbarRef}
        className={`absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 rounded-full bg-navy-950/90 backdrop-blur px-1.5 py-1 transition-opacity shadow-lg z-10 ${
          toolbarVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={togglePanel('funcion')}
          aria-label="Función del botón"
          title="Función del botón"
          className="text-white/70 hover:text-white transition-colors p-1.5"
        >
          <WrenchIcon className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-white/15" />
        <button
          type="button"
          onClick={togglePanel('color')}
          aria-label="Color del botón"
          title="Color del botón"
          className="text-white/70 hover:text-white transition-colors p-1.5"
        >
          <PaletteIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      {openPanel === 'funcion' && (
        <ButtonFunctionPicker
          value={{ funcion: funcion.id, target: v.target }}
          onChange={handleFunctionChange}
          onClose={closePanel}
          anchorRef={toolbarRef}
          align="center"
          seccionesDisponibles={seccionesDisponibles}
        />
      )}
      {openPanel === 'color' && (
        <FixedPopover
          anchorRef={toolbarRef}
          align="center"
          onClose={closePanel}
          className="w-56 rounded-xl border border-neutral-200 bg-white shadow-xl p-3 text-left"
        >
          <ColorRow
            label="Color del botón"
            value={v.color}
            swatches={BUTTON_SWATCHES}
            defaultValue={defaultColor}
            onPick={(c) => onChange({ color: c })}
            onReset={() => onChange({ color: undefined })}
          />
        </FixedPopover>
      )}
    </span>
  );
}

// Modal simulado de "Agendar cita": ningún backend real todavía, solo junta
// los datos y muestra una confirmación — mismo patrón mockeado que ya usa el
// formulario de Contacto.
function AgendarCitaModal({ nombreNegocio, onClose }) {
  const [form, setForm] = useState({ nombre: '', telefono: '', fecha: '', horario: '', mensaje: '' });
  const [enviado, setEnviado] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {enviado ? (
          <div className="text-center py-4">
            <span className="inline-flex w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mb-3">
              <CheckBadgeIcon className="w-6 h-6" />
            </span>
            <p className="font-display text-lg font-bold text-neutral-900">¡Listo!</p>
            <p className="text-sm text-neutral-500 mt-1">
              {nombreNegocio ? `${nombreNegocio} te va a` : 'Te vamos a'} contactar para confirmar tu cita.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 text-sm font-semibold text-gold-600 hover:text-gold-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEnviado(true);
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-lg font-bold text-neutral-900">Agendar una cita</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                required
                value={form.nombre}
                onChange={set('nombre')}
                placeholder="Tu nombre"
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-gold-500"
              />
              <input
                required
                type="tel"
                value={form.telefono}
                onChange={set('telefono')}
                placeholder="Tu teléfono"
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-gold-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="date"
                  value={form.fecha}
                  onChange={set('fecha')}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-gold-500"
                />
                <input
                  type="time"
                  value={form.horario}
                  onChange={set('horario')}
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-gold-500"
                />
              </div>
              <textarea
                rows={2}
                value={form.mensaje}
                onChange={set('mensaje')}
                placeholder="Contanos algo más (opcional)"
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-gold-500 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full mt-4 rounded-full bg-gold-500 text-navy-950 font-semibold py-2.5 text-sm hover:brightness-105 transition"
            >
              Confirmar cita
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Franja invisible entre bloques — al pasar el mouse aparece una línea + un "+"
// que abre un popover chico ahí mismo. La sección elegida se inserta en esa
// posición exacta, sin tener que reordenar después. Mientras se arrastra una
// sección, el "+" se oculta y en su lugar se marca con una línea dorada el
// hueco exacto donde va a caer.
function Gap({ dragging, isTarget, disponibles, onAdd, topEdge = false, last = false }) {
  if (dragging) {
    return (
      <div className="relative py-2 -my-2 z-10">
        <div
          className={`h-0.5 mx-6 rounded-full transition-colors ${isTarget ? 'bg-gold-500' : 'bg-transparent'}`}
        />
      </div>
    );
  }
  return <InsertionPoint disponibles={disponibles} onAdd={onAdd} topEdge={topEdge} last={last} />;
}

// Esqueletos chicos (puros divs) que muestran cómo se ve cada disposición interna
// antes de elegirla — nada de contenido real, solo la forma general del layout.
function VariantSkeleton({ kind }) {
  const bar = 'bg-neutral-300 rounded-sm';
  const box = 'bg-neutral-300 rounded';
  if (kind === 'grid4') {
    return (
      <div className="grid grid-cols-4 gap-1 w-full h-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${box} aspect-square`} />
        ))}
      </div>
    );
  }
  if (kind === 'grid3') {
    return (
      <div className="grid grid-cols-3 gap-1.5 w-full h-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-neutral-300" />
            <div className={`${bar} h-1 w-full`} />
            <div className={`${bar} h-1 w-2/3`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'carousel') {
    return (
      <div className="flex items-center justify-center gap-1.5 w-full h-full">
        <div className="w-2 h-2 rounded-full bg-neutral-300 shrink-0" />
        <div className={`${box} flex-1 h-full`} />
        <div className="w-2 h-2 rounded-full bg-neutral-300 shrink-0" />
      </div>
    );
  }
  if (kind === 'centered') {
    return (
      <div className="flex flex-col items-center gap-1 w-full h-full justify-center">
        <div className={`${bar} w-1/2 h-1.5`} />
        <div className={`${bar} w-2/3 h-1`} />
        <div className={`${bar} w-full h-2 mt-1`} />
        <div className={`${bar} w-full h-2`} />
      </div>
    );
  }
  if (kind === 'split') {
    return (
      <div className="grid grid-cols-2 gap-1.5 w-full h-full">
        <div className={`${box} h-full`} />
        <div className="flex flex-col gap-1 justify-center">
          <div className={`${bar} h-1.5`} />
          <div className={`${bar} h-1.5`} />
          <div className={`${bar} h-1.5 w-2/3`} />
        </div>
      </div>
    );
  }
  if (kind === 'heroDuo') {
    return (
      <div className="grid grid-cols-2 gap-1.5 w-full h-full">
        <div className="flex flex-col gap-1 justify-center">
          <div className={`${bar} h-1.5`} />
          <div className={`${bar} h-1.5`} />
          <div className={`${bar} h-1.5 w-2/3`} />
        </div>
        <div className="grid grid-cols-2 gap-1 h-full">
          <div className={`${box} h-full`} />
          <div className={`${box} h-full`} />
        </div>
      </div>
    );
  }
  if (kind === 'heroCentro') {
    return (
      <div className="flex flex-col items-center gap-1 w-full h-full justify-center">
        <div className={`${bar} w-1/3 h-1`} />
        <div className={`${bar} w-2/3 h-1.5 mt-0.5`} />
        <div className="flex gap-1 mt-1">
          <div className={`${bar} w-4 h-1.5`} />
          <div className={`${bar} w-4 h-1.5`} />
        </div>
      </div>
    );
  }
  if (kind === 'heroVidriera') {
    return (
      <div className="grid grid-cols-2 gap-1.5 w-full h-full">
        <div className="flex flex-col gap-1 justify-center">
          <div className={`${bar} h-1.5`} />
          <div className={`${bar} h-1.5`} />
          <div className={`${bar} h-1.5 w-2/3`} />
        </div>
        <div className={`${box} h-full relative flex items-end justify-center pb-1`}>
          <div className="flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-white" />
            <div className="w-1 h-1 rounded-full bg-white/50" />
            <div className="w-1 h-1 rounded-full bg-white/50" />
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'heroMinimal') {
    return (
      <div className="flex flex-col gap-1 w-full h-full justify-center items-start pl-1">
        <div className={`${bar} w-1/3 h-1`} />
        <div className={`${bar} w-2/3 h-1.5 mt-0.5`} />
        <div className="flex gap-1 mt-1">
          <div className={`${bar} w-4 h-1.5`} />
          <div className={`${bar} w-4 h-1.5`} />
        </div>
      </div>
    );
  }
  if (kind === 'navLeft') {
    return (
      <div className="flex items-center justify-between w-full h-full">
        <div className={`${box} w-3 h-3 shrink-0`} />
        <div className="flex gap-1">
          <div className={`${bar} w-3 h-1.5`} />
          <div className={`${bar} w-3 h-1.5`} />
          <div className={`${bar} w-3 h-1.5`} />
        </div>
      </div>
    );
  }
  if (kind === 'navCenter') {
    return (
      <div className="flex flex-col items-center gap-1.5 w-full h-full justify-center">
        <div className={`${box} w-3 h-3`} />
        <div className="flex gap-1">
          <div className={`${bar} w-3 h-1.5`} />
          <div className={`${bar} w-3 h-1.5`} />
          <div className={`${bar} w-3 h-1.5`} />
        </div>
      </div>
    );
  }
  if (kind === 'navSplit') {
    return (
      <div className="flex items-center justify-between w-full h-full">
        <div className={`${bar} w-3 h-1.5`} />
        <div className={`${box} w-3 h-3 shrink-0`} />
        <div className={`${bar} w-3 h-1.5`} />
      </div>
    );
  }
  if (kind === 'aboutCentered') {
    return (
      <div className="flex flex-col items-center gap-1 w-full h-full justify-center">
        <div className={`${bar} w-2/3 h-1.5`} />
        <div className={`${bar} w-full h-1`} />
        <div className="flex gap-1 mt-1">
          <div className={`${bar} w-3 h-1`} />
          <div className={`${bar} w-3 h-1`} />
          <div className={`${bar} w-3 h-1`} />
        </div>
      </div>
    );
  }
  if (kind === 'grid3col' || kind === 'grid4col' || kind === 'grid5col') {
    const cols = kind === 'grid3col' ? 3 : kind === 'grid4col' ? 4 : 5;
    return (
      <div className={`grid gap-1 w-full h-full`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <div className={`${box} aspect-square`} />
            <div className={`${bar} h-1`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'mediaEstatica') {
    return (
      <div className={`${box} w-full h-full flex items-center justify-center`}>
        <div className="w-4 h-4 rounded-full bg-white/50" />
      </div>
    );
  }
  if (kind === 'mediaManual') {
    return (
      <div className="flex items-center justify-center gap-1.5 w-full h-full">
        <div className="w-2.5 h-2.5 rounded-full border border-neutral-400 flex items-center justify-center shrink-0">
          <div className="w-1 h-1 rounded-full bg-neutral-400" />
        </div>
        <div className={`${box} flex-1 h-full`} />
        <div className="w-2.5 h-2.5 rounded-full border border-neutral-400 flex items-center justify-center shrink-0">
          <div className="w-1 h-1 rounded-full bg-neutral-400" />
        </div>
      </div>
    );
  }
  if (kind === 'mediaAuto') {
    return (
      <div className="relative w-full h-full">
        <div className={`${box} w-full h-full`} />
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white border border-neutral-300 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full border border-t-transparent border-neutral-400" />
        </div>
      </div>
    );
  }
  if (kind === 'mediaZoom') {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className={`${box} w-3/4 h-3/4`} />
        <div className="absolute inset-0 border border-dashed border-neutral-300 rounded-sm m-0.5" />
      </div>
    );
  }
  if (kind === 'heroFondo') {
    return (
      <div className={`relative w-full h-full ${box} flex flex-col items-center justify-center gap-1`}>
        <div className="absolute inset-0 bg-neutral-400/40 rounded-sm" />
        <div className="relative bg-white/70 w-1/2 h-1 rounded-sm" />
        <div className="relative bg-white/70 w-2/3 h-1.5 rounded-sm mt-0.5" />
      </div>
    );
  }
  if (kind === 'masonry') {
    return (
      <div className="grid grid-cols-3 gap-1 w-full h-full">
        <div className={`${box} row-span-2`} />
        <div className={box} />
        <div className={box} />
        <div className={`${box} row-span-2`} />
        <div className={box} />
      </div>
    );
  }
  if (kind === 'destacado') {
    return (
      <div className="flex flex-col items-center gap-1 w-full h-full justify-center px-1">
        <div className={`${bar} w-1/2 h-1`} />
        <div className={`${bar} w-full h-1.5 mt-0.5`} />
        <div className={`${bar} w-2/3 h-1.5`} />
        <div className="w-3.5 h-3.5 rounded-full bg-neutral-300 mt-1" />
      </div>
    );
  }
  if (kind === 'contactoMapa') {
    return (
      <div className="grid grid-cols-2 gap-1.5 w-full h-full">
        <div className="flex flex-col gap-1 justify-center">
          <div className={`${bar} h-1.5`} />
          <div className={`${bar} h-1.5`} />
          <div className={`${bar} h-1.5 w-2/3`} />
        </div>
        <div className={`${box} h-full`} />
      </div>
    );
  }
  if (kind === 'productosLista') {
    return (
      <div className="flex flex-col gap-1 w-full h-full justify-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`${box} w-3 h-3 shrink-0`} />
            <div className={`${bar} h-1 flex-1`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'productosFila') {
    return (
      <div className="flex flex-col gap-1.5 w-full h-full justify-center">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`${box} w-4 h-4 shrink-0`} />
            <div className={`${bar} h-1 flex-1`} />
            <div className={`${bar} h-1 w-2`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'productosBento') {
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-1 w-full h-full">
        <div className={`${box} col-span-2 row-span-2`} />
        <div className={`${box}`} />
        <div className={`${box}`} />
      </div>
    );
  }
  if (kind === 'footerNewsletter') {
    return (
      <div className="flex flex-col gap-1 w-full h-full justify-center">
        <div className={`${bar} w-1/2 h-1.5`} />
        <div className="flex gap-1 mt-1">
          <div className={`${box} h-2 flex-1`} />
          <div className={`${box} h-2 w-3`} />
        </div>
      </div>
    );
  }
  if (kind === 'categoriasScroll') {
    return (
      <div className="flex gap-1 w-full h-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`${box} flex-1 h-full`} />
        ))}
      </div>
    );
  }
  if (kind === 'pasosNumerados') {
    return (
      <div className="flex flex-col gap-1 w-full h-full justify-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full border border-neutral-400 shrink-0" />
            <div className={`${bar} h-1 flex-1`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'productosServicios') {
    return (
      <div className="grid grid-cols-2 gap-1 w-full h-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-neutral-300 rounded-sm flex flex-col justify-center gap-0.5 px-1">
            <div className={`${bar} h-1 w-3/4`} />
            <div className={`${bar} h-1 w-1/2`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'productosCatalogo') {
    return (
      <div className="flex flex-col gap-1 w-full h-full">
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full ${i === 0 ? 'bg-neutral-400 w-4' : 'bg-neutral-300 w-3'}`} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 flex-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={box} />
          ))}
        </div>
      </div>
    );
  }
  if (kind === 'pasosTimeline') {
    return (
      <div className="flex flex-col items-start gap-1 w-full h-full justify-center pl-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full border border-neutral-400 shrink-0" />
            <div className={`${bar} h-1 w-10`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'financiacionSimulador') {
    return (
      <div className={`${box} grid grid-cols-[1fr_0.7fr] gap-1.5 w-full h-full p-1`} style={{ background: '#1c1f26' }}>
        <div className="flex flex-col gap-1 justify-center">
          <div className="bg-neutral-500 h-1 w-1/2" />
          <div className="flex gap-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-neutral-500 h-1.5 w-3" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-0.5 justify-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-neutral-600 h-1" />
          ))}
        </div>
      </div>
    );
  }
  if (kind === 'beneficiosFila') {
    return (
      <div className="flex gap-1.5 w-full h-full items-center justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <div className="w-2.5 h-2.5 rounded-full border border-neutral-400" />
            <div className={`${bar} h-1 w-full`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'beneficiosGrid') {
    return (
      <div className="grid grid-cols-2 gap-1 w-full h-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-neutral-300 rounded-sm flex flex-col justify-center gap-0.5 p-1">
            <div className="w-2 h-2 rounded-full border border-neutral-400" />
            <div className={`${bar} h-1 w-3/4`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'testimoniosScroll') {
    return (
      <div className="flex gap-1 w-full h-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-neutral-300 rounded-sm flex-1 flex flex-col justify-center gap-0.5 p-1.5">
            <div className={`${bar} h-1 w-full`} />
            <div className={`${bar} h-1 w-2/3`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'contactoDirecto') {
    return (
      <div className="grid grid-cols-2 gap-1.5 w-full h-full items-center">
        <div className="flex flex-col gap-1">
          <div className={`${bar} h-1.5 w-full`} />
          <div className={`${bar} h-1.5 w-4/5`} />
          <div className="h-2 w-2/3 mt-0.5" style={{ background: '#c9a227' }} />
        </div>
        <div className="flex flex-col gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${bar} h-1 w-full`} />
          ))}
        </div>
      </div>
    );
  }
  if (kind === 'pasosSticky') {
    return (
      <div className="grid grid-cols-[0.7fr_1fr] gap-1.5 w-full h-full">
        <div className={box} />
        <div className="flex flex-col gap-1 justify-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={`${bar} h-1.5 w-1.5`} />
              <div className={`${bar} h-1 flex-1`} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === 'marqueeScroll') {
    return (
      <div className="flex gap-1.5 w-full h-full items-center overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${bar} h-1.5 w-8 shrink-0`} />
        ))}
      </div>
    );
  }
  if (kind === 'seriesTabs') {
    return (
      <div className="flex flex-col gap-1 w-full h-full">
        <div className="flex gap-0.5 justify-end">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`h-1.5 w-3 ${i === 0 ? 'bg-neutral-400' : 'bg-neutral-300'}`} />
          ))}
        </div>
        <div className="grid grid-cols-[1.3fr_1fr] gap-1 flex-1">
          <div className={box} />
          <div className="flex flex-col gap-1 justify-center">
            <div className={`${bar} h-1 w-full`} />
            <div className={`${bar} h-1 w-2/3`} />
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'archivoBento') {
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-1 w-full h-full">
        <div className={`${box} col-span-2 row-span-2`} />
        <div className={box} />
        <div className={box} />
      </div>
    );
  }
  if (kind === 'productosTarifario') {
    return (
      <div className="flex flex-col gap-1.5 w-full h-full justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between border-b border-neutral-200 pb-1">
            <div className={`${bar} h-1 w-2/3`} />
            <div className={`${bar} h-1 w-6`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'anuncioSimple') {
    return (
      <div className="flex items-center justify-center gap-1.5 w-full h-full">
        <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
        <div className={`${bar} h-1 w-3/4`} />
      </div>
    );
  }
  if (kind === 'zonasLista') {
    return (
      <div className="grid grid-cols-2 gap-1 w-full h-full items-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full border border-neutral-400 shrink-0" />
            <div className={`${bar} h-1 flex-1`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'zonasChips') {
    return (
      <div className="flex flex-wrap gap-1 w-full h-full items-center content-center">
        {['w-6', 'w-4', 'w-5', 'w-3.5', 'w-4'].map((w, i) => (
          <div key={i} className={`h-2.5 rounded-full border border-neutral-400 ${w}`} />
        ))}
      </div>
    );
  }
  if (kind === 'galeriaBento') {
    return (
      <div className="grid grid-cols-3 grid-rows-2 gap-1 w-full h-full">
        <div className={`${box} col-span-2 row-span-2`} />
        <div className={box} />
        <div className={box} />
      </div>
    );
  }
  if (kind === 'antesDespues') {
    return (
      <div className="grid grid-cols-2 gap-1 w-full h-full">
        <div className={`${box} relative`}>
          <div className="absolute top-0.5 left-0.5 w-3 h-1 bg-neutral-500" />
        </div>
        <div className={`${box} relative`}>
          <div className="absolute top-0.5 right-0.5 w-3 h-1 bg-neutral-500" />
        </div>
      </div>
    );
  }
  if (kind === 'materialesMuestras') {
    return (
      <div className="flex flex-col gap-1 w-full h-full justify-center">
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${box} w-4 h-4 ${i === 0 ? 'ring-1 ring-neutral-500' : ''}`} />
          ))}
        </div>
        <div className={`${bar} h-1 w-1/2 mt-1`} />
        <div className={`${bar} h-1 w-full`} />
      </div>
    );
  }
  if (kind === 'estadisticasFila') {
    return (
      <div className={`${box} flex items-center justify-around w-full h-full`} style={{ background: '#1c1f26' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="bg-neutral-400 h-2 w-4" />
            <div className={`${bar} h-1 w-5`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'vidrieraRotativa') {
    return (
      <div className="flex flex-col gap-1 w-full h-full items-center">
        <div className={`${box} flex-1 w-2/3 relative`}>
          <div className="absolute bottom-0.5 left-0.5 flex gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        </div>
        <div className={`${bar} h-1.5 w-1/2`} />
      </div>
    );
  }
  if (kind === 'pagosFila') {
    return (
      <div className="flex flex-wrap gap-1 w-full h-full items-center justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-neutral-300 rounded-sm h-2.5 w-7" />
        ))}
      </div>
    );
  }
  if (kind === 'equipoRetrato') {
    return (
      <div className="grid grid-cols-3 gap-1 w-full h-full">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <div className="h-0.5 w-full bg-neutral-400" />
            <div className={`${box} flex-1`} />
            <div className={`${bar} h-1 w-3/4 mt-0.5`} />
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'areasListaDetalle') {
    return (
      <div className="grid grid-cols-[0.7fr_1fr] gap-1.5 w-full h-full">
        <div className="flex flex-col gap-1 justify-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${bar} h-1`} />
          ))}
        </div>
        <div className={`${box} h-full`} />
      </div>
    );
  }
  if (kind === 'reservasCalendario') {
    return (
      <div className="grid grid-cols-[1.2fr_1fr] gap-1.5 w-full h-full">
        <div className="grid grid-cols-4 grid-rows-2 gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`${box} ${i === 5 ? 'bg-neutral-400' : ''}`} />
          ))}
        </div>
        <div className="flex flex-col gap-1 justify-center">
          <div className={`${bar} h-1.5`} />
          <div className={`${bar} h-1.5 w-2/3`} />
          <div className={`${box} h-2 mt-0.5`} />
        </div>
      </div>
    );
  }
  return <div className={`${box} w-full h-full`} />;
}

// Agregar una sección es de dos pasos cuando tiene más de una disposición posible:
// 1) elegir el tipo de sección, 2) elegir cómo se acomoda por dentro (con esqueletos).
// `prominent` se usa cuando la página quedó sin ninguna sección: en vez del "+"
// chiquito que solo aparece al pasar el mouse, muestra un botón grande y siempre
// visible para que quede clarísimo cómo volver a cargar elementos.
const VARIANT_HINT_KEY = 'sitiowebdigital.variantHintSeen';

function InsertionPoint({ disponibles, onAdd, prominent = false, topEdge = false, last = false }) {
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pickedType, setPickedType] = useState(null);
  const [showVariantHint, setShowVariantHint] = useState(() => {
    try {
      return localStorage.getItem(VARIANT_HINT_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const dismissVariantHint = () => {
    setShowVariantHint(false);
    try {
      localStorage.setItem(VARIANT_HINT_KEY, '1');
    } catch {
      // localStorage puede fallar (modo privado, cuota llena) — no debe romper el editor.
    }
  };

  const close = () => {
    setOpen(false);
    setPickedType(null);
  };

  const chooseType = (typeId) => {
    const variants = SECTION_VARIANTS[typeId];
    if (variants && variants.length > 1) {
      setPickedType(typeId);
    } else {
      onAdd(typeId, variants?.[0]?.id);
      close();
    }
  };

  const pickedMeta = disponibles.find((c) => c.id === pickedType);

  return (
    <div className={prominent ? 'relative flex justify-center py-16 px-6 bg-neutral-50' : 'relative group/insert py-2 -my-2 z-10'}>
      {!prominent && (
        <div className="h-px mx-6 bg-transparent group-hover/insert:bg-neutral-300 transition-colors" />
      )}
      {prominent ? (
        <button
          ref={btnRef}
          type="button"
          data-tour="add-section"
          onClick={() => setOpen((v) => !v)}
          aria-label="Agregar tu primer elemento"
          className={`group/prominent flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed transition-colors px-12 py-8 ${
            open ? 'border-gold-500 bg-gold-500/5' : 'border-black/15 hover:border-gold-500/50 hover:bg-white'
          }`}
        >
          <span
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              open ? 'bg-gold-500 text-navy-950' : 'bg-white text-neutral-400 border border-black/10 group-hover/prominent:text-gold-600 group-hover/prominent:border-gold-500/40'
            }`}
          >
            <PlusIcon className="w-5 h-5" />
          </span>
          <span className="text-sm font-semibold text-neutral-700">Agregar tu primer elemento</span>
        </button>
      ) : (
        <button
          ref={btnRef}
          type="button"
          data-tour="add-section"
          onClick={() => setOpen((v) => !v)}
          aria-label="Agregar sección acá"
          className={`absolute left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white border border-neutral-200 shadow-md flex items-center justify-center text-neutral-400 transition-all ${
            topEdge ? 'top-1.5' : last ? 'bottom-1.5' : 'top-1/2 -translate-y-1/2'
          } ${
            open ? 'opacity-100 bg-gold-500 text-navy-950 border-gold-500' : 'opacity-0 group-hover/insert:opacity-100 hover:bg-gold-500 hover:text-navy-950 hover:border-gold-500'
          }`}
        >
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
      )}
      {open && !pickedType && (
        <FixedPopover anchorRef={btnRef} align="center" onClose={close} className="w-56 rounded-xl border border-neutral-200 bg-white shadow-xl p-1.5 text-left">
          {disponibles.length === 0 ? (
            <p className="text-xs text-neutral-400 px-3 py-2.5">Ya agregaste todas las secciones.</p>
          ) : (
            disponibles.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => chooseType(c.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <span className="block text-sm font-semibold text-neutral-800">{c.label}</span>
                <span className="block text-xs text-neutral-400">{c.desc}</span>
              </button>
            ))
          )}
        </FixedPopover>
      )}
      {open && pickedType && (
        <FixedPopover anchorRef={btnRef} align="center" onClose={close} className="w-72 rounded-xl border border-neutral-200 bg-white shadow-xl p-3 text-left">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => setPickedType(null)}
              aria-label="Volver"
              className="text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
              {pickedMeta?.label} · elegí la disposición
            </p>
          </div>
          {showVariantHint && (
            <div className="mb-2.5 rounded-lg bg-gold-500/10 border border-gold-500/25 px-2.5 py-2 flex items-start gap-2">
              <p className="text-[11px] text-neutral-600 leading-snug flex-1">
                Esta es la <strong>distribución</strong>: cómo se acomoda el contenido por dentro. Elegí la que
                más te guste — después la podés cambiar sacando y volviendo a agregar la sección.
              </p>
              <button
                type="button"
                onClick={dismissVariantHint}
                aria-label="Cerrar"
                className="text-neutral-400 hover:text-neutral-700 transition-colors shrink-0"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {SECTION_VARIANTS[pickedType].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onAdd(pickedType, v.id);
                  dismissVariantHint();
                  close();
                }}
                aria-label={v.label}
                className="rounded-lg border border-neutral-200 hover:border-gold-500 hover:bg-gold-500/5 transition-colors p-2 text-center"
              >
                <div className="h-14 rounded-md bg-neutral-50 border border-neutral-100 mb-1.5 p-2 flex items-center justify-center overflow-hidden">
                  <VariantSkeleton kind={v.skeleton} />
                </div>
                <span className="text-xs font-semibold text-neutral-700">{v.label}</span>
              </button>
            ))}
          </div>
        </FixedPopover>
      )}
    </div>
  );
}

// Para los pocos lugares que muestran texto sin pasar por <Editable/> en modo
// lectura (ej: la respuesta de FAQ cerrada, que se arma con su propio grid de
// altura animada) — aplica el mismo estilo por texto sin duplicar la lógica.
function RichText({ styleKey, tag: Tag = 'span', className = '', style: baseStyle, children }) {
  const { textStyles } = useContext(TextStyleCtx);
  const override = styleKey ? textStyles[styleKey] : null;
  const style = { ...baseStyle, ...textStyleToCss(override) };
  const Icon = override?.icon ? ICON_COMPONENTS[override.icon] : null;
  const content = (
    <>
      {Icon && <Icon className="inline-block w-[0.9em] h-[0.9em] mr-1.5 -mt-0.5 align-middle" aria-hidden="true" />}
      {children}
    </>
  );
  const inner = override?.link ? (
    <a href={override.link} target="_blank" rel="noreferrer" className="underline decoration-1 underline-offset-2">
      {content}
    </a>
  ) : (
    content
  );
  if (override?.anim && TEXT_ANIM_VARIANTS[override.anim]) {
    return (
      <AnimatedTag tag={Tag} anim={override.anim} className={className} style={style}>
        {inner}
      </AnimatedTag>
    );
  }
  return (
    <Tag className={className} style={style}>
      {inner}
    </Tag>
  );
}

// Envoltorio de motion/react para cualquier tag: reproduce la animación
// elegida una sola vez, cuando el texto entra en pantalla al scrollear.
function AnimatedTag({ tag, anim, className, style, children, ...rest }) {
  const MotionTag = motion[tag] ?? motion.span;
  return (
    <MotionTag
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={TEXT_ANIM_VARIANTS[anim]}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

// Envoltorio genérico de scroll-reveal (mismo mecanismo que AnimatedTag: una
// sola vez, con whileInView) para bloques enteros, no solo texto — usado por
// las secciones que quedan con un fade + subida al entrar en pantalla
// (Series, Archivo, Proceso, Sesiones). `delay` en segundos para escalonar
// varios elementos del mismo grupo (0, 0.08, 0.16...).
function Reveal({ as = 'div', delay = 0, className = '', style, children }) {
  const MotionTag = motion[as] ?? motion.div;
  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </MotionTag>
  );
}

// Grilla de íconos para elegir — todos SVG propios del sitio, sin ningún ícono
// de terceros ni de una fuente con copyright.
function IconPicker({ value, onChange, onClose, library = ICON_LIBRARY, components = ICON_COMPONENTS }) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className="absolute z-40 top-full mt-1.5 left-0 w-52 rounded-xl border border-neutral-200 bg-white shadow-xl p-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              onClose();
            }}
            aria-label="Sin ícono"
            title="Sin ícono"
            className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-semibold transition-colors ${
              !value ? 'border-gold-500 bg-gold-500/10 text-gold-600' : 'border-neutral-200 text-neutral-400 hover:border-neutral-400'
            }`}
          >
            —
          </button>
          {library.map((ic) => {
            const Icon = components[ic.id];
            return (
              <button
                key={ic.id}
                type="button"
                onClick={() => {
                  onChange(ic.id);
                  onClose();
                }}
                aria-label={ic.label}
                title={ic.label}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                  value === ic.id
                    ? 'border-gold-500 bg-gold-500/10 text-gold-600'
                    : 'border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// Botón que muestra el ícono elegido (o un "+" punteado si no hay ninguno) y
// abre el selector — se usa en FAQ, testimonios y los datos de "Sobre nosotros".
function IconSlot({
  editable,
  value,
  onChange,
  size = 'w-8 h-8',
  iconSize = 'w-4 h-4',
  library = ICON_LIBRARY,
  components = ICON_COMPONENTS,
}) {
  const [open, setOpen] = useState(false);
  const Icon = value ? components[value] : null;

  if (!editable) {
    return Icon ? (
      <span className={`${size} rounded-lg flex items-center justify-center shrink-0`}>
        <Icon className={iconSize} />
      </span>
    ) : null;
  }

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Elegir ícono"
        title="Elegir ícono"
        className={`${size} rounded-lg border border-dashed flex items-center justify-center transition-colors ${
          Icon ? 'border-transparent hover:border-black/20' : 'border-black/20 text-neutral-400 hover:border-gold-500 hover:text-gold-600'
        }`}
      >
        {Icon ? <Icon className={iconSize} /> : <PlusIcon className="w-3 h-3" />}
      </button>
      {open && (
        <IconPicker
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
          library={library}
          components={components}
        />
      )}
    </span>
  );
}

const TEXT_STYLE_SWATCHES = ['#1a1a1a', '#ffffff', '#525252', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed'];

// Botón que abre un submenú al pasar el cursor por encima (no al hacer
// click) — igual que "Color" en el minimenú de texto de Notion. El panel es
// hijo del mismo contenedor con onMouseEnter/onMouseLeave, así que el
// puntero puede bajar del botón al panel sin que se cierre en el camino.
function HoverFlyout({ trigger, children, align = 'left', panelClassName = 'w-44' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        className="flex items-center gap-0.5 h-7 px-1.5 rounded-md text-ink-200 hover:bg-white/10 hover:text-white transition-colors"
      >
        {trigger}
        <ChevronDownIcon className="w-2.5 h-2.5 opacity-50" />
      </button>
      {open && (
        <div
          className={`absolute top-full pt-1.5 z-50 ${align === 'right' ? 'right-0' : 'left-0'}`}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div
            className={`${panelClassName} max-h-60 overflow-y-auto whitespace-normal rounded-lg border border-white/10 bg-navy-950 shadow-xl py-1.5`}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// Minimenú de formato que aparece arriba del campo mientras se está editando
// un texto — solo si ese texto declaró un `styleKey`. Inspirado en el
// minimenú de selección de texto de Notion: una fila de botones (fuente,
// color, negrita, cursiva, subrayado, tachado, enlace, ícono) donde "Fuente"
// y "Color" abren un submenú al pasar el cursor por encima. Como el resto
// del sistema, aplica al campo completo (no hay negrita/color parcial
// dentro de un mismo párrafo).
//
// Posicionado con `position:fixed` a partir del rect real del campo (mismo
// mecanismo que FixedPopover, ver su comentario) en vez de `absolute
// bottom-full`: en secciones cortas ancladas arriba de todo (Header, franja
// de aviso) no había aire arriba del campo, y el menú quedaba recortado por
// el `overflow-hidden` del marco del editor — acá se mide el alto ya
// renderizado y, si no entra arriba, se abre hacia abajo.
function TextStyleToolbar({ styleKey, anchorEl }) {
  const { textStyles, onSetTextStyle } = useContext(TextStyleCtx);
  const current = textStyles[styleKey] || {};
  const [iconOpen, setIconOpen] = useState(false);
  const toolbarRef = useRef(null);
  const [posStyle, setPosStyle] = useState({ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden' });

  // `anchorEl` es un nodo del DOM en estado (no un ref "crudo"): el span
  // ancla es PADRE de esta toolbar en el árbol, y React comita refs/layout
  // effects de abajo hacia arriba (hijos antes que padres) — con un ref
  // crudo, este efecto corría antes de que el ref del padre se asignara y
  // nunca se repetía (la dependencia era el objeto ref, que nunca cambia de
  // identidad). Al recibir el nodo ya resuelto como prop, la dependencia sí
  // cambia de null al nodo real y el efecto se vuelve a correr.
  useLayoutEffect(() => {
    const anchor = anchorEl;
    const panel = toolbarRef.current;
    if (!anchor || !panel) return;
    const anchorRect = anchor.getBoundingClientRect();
    const rect = panel.getBoundingClientRect();
    const gap = 6;
    const spaceAbove = anchorRect.top - gap;
    const openBelow = rect.height > spaceAbove;
    const top = openBelow ? anchorRect.bottom + gap : Math.max(8, anchorRect.top - rect.height - gap);
    const left = Math.min(Math.max(anchorRect.left, 8), Math.max(8, window.innerWidth - rect.width - 8));
    setPosStyle({ position: 'fixed', top, left, visibility: 'visible' });
  }, [anchorEl]);
  const hasOverride = !!(
    current.fontFamily ||
    current.color ||
    current.bold ||
    current.italic ||
    current.underline ||
    current.strikethrough ||
    current.link ||
    current.icon ||
    current.anim
  );

  // onMouseDown con preventDefault: evita que el click le saque el foco al
  // input/textarea que se está editando (si no, el onBlur cierra la edición).
  const guard = (fn) => (e) => {
    e.preventDefault();
    fn();
  };
  const toggle = (key) => guard(() => onSetTextStyle?.(styleKey, { [key]: !current[key] }));

  const setLink = guard(() => {
    const next = window.prompt('Enlace (URL):', current.link || '');
    if (next === null) return;
    onSetTextStyle?.(styleKey, { link: next.trim() ? next.trim() : undefined });
  });

  const CurrentIcon = current.icon ? ICON_COMPONENTS[current.icon] : null;
  const toggleBtn = (active) =>
    `w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
      active ? 'bg-gold-500/20 text-gold-400' : 'text-ink-300 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div
      ref={toolbarRef}
      style={posStyle}
      className="z-40 flex items-center gap-0.5 whitespace-nowrap rounded-lg border border-white/10 bg-navy-950 shadow-xl px-1 py-1"
      onMouseDown={(e) => e.preventDefault()}
    >
      <HoverFlyout
        trigger={
          <span className="text-[11px]" style={current.fontFamily ? { fontFamily: fontFamilyById(current.fontFamily) } : undefined}>
            Aa
          </span>
        }
      >
        <button
          type="button"
          onMouseDown={guard(() => onSetTextStyle?.(styleKey, { fontFamily: undefined }))}
          className={`block w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/10 ${
            !current.fontFamily ? 'text-gold-500' : 'text-ink-300'
          }`}
        >
          Por defecto
        </button>
        {FONT_OPTIONS.map((f) => (
          <button
            key={f.id}
            type="button"
            onMouseDown={guard(() => onSetTextStyle?.(styleKey, { fontFamily: f.id }))}
            className={`block w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-white/10 ${
              current.fontFamily === f.id ? 'text-gold-500' : 'text-white'
            }`}
            style={{ fontFamily: f.family }}
          >
            {f.label}
          </button>
        ))}
      </HoverFlyout>

      <HoverFlyout
        panelClassName="w-40"
        trigger={
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/30 inline-block"
            style={{ background: current.color || '#ffffff' }}
          />
        }
      >
        <div className="px-2 py-1">
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {TEXT_STYLE_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onMouseDown={guard(() => onSetTextStyle?.(styleKey, { color: c }))}
                aria-label={`Color ${c}`}
                className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${
                  current.color === c ? 'border-gold-500 ring-1 ring-gold-500' : 'border-white/25'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-[11px] text-ink-300 cursor-pointer px-1">
            <span className="relative w-5 h-5 rounded-full border border-white/25 bg-[conic-gradient(from_0deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)] shrink-0">
              <input
                type="color"
                value={current.color ?? '#000000'}
                onChange={(e) => onSetTextStyle?.(styleKey, { color: e.target.value })}
                aria-label="Color personalizado"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </span>
            Personalizado
          </label>
        </div>
      </HoverFlyout>

      <div className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />

      <button type="button" onMouseDown={toggle('bold')} title="Negrita" aria-pressed={!!current.bold} className={toggleBtn(!!current.bold)}>
        <BoldIcon className="w-3.5 h-3.5" />
      </button>
      <button type="button" onMouseDown={toggle('italic')} title="Cursiva" aria-pressed={!!current.italic} className={toggleBtn(!!current.italic)}>
        <ItalicIcon className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={toggle('underline')}
        title="Subrayado"
        aria-pressed={!!current.underline}
        className={toggleBtn(!!current.underline)}
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={toggle('strikethrough')}
        title="Tachado"
        aria-pressed={!!current.strikethrough}
        className={toggleBtn(!!current.strikethrough)}
      >
        <StrikethroughIcon className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />

      <button type="button" onMouseDown={setLink} title="Añadir enlace" aria-pressed={!!current.link} className={toggleBtn(!!current.link)}>
        <LinkIcon className="w-3.5 h-3.5" />
      </button>

      <div className="relative shrink-0">
        <button
          type="button"
          onMouseDown={guard(() => setIconOpen((v) => !v))}
          title="Agregar ícono"
          aria-pressed={!!current.icon}
          className={toggleBtn(!!current.icon)}
        >
          {CurrentIcon ? <CurrentIcon className="w-3.5 h-3.5" /> : <SmileIcon className="w-3.5 h-3.5" />}
        </button>
        {iconOpen && (
          <IconPicker
            value={current.icon}
            onChange={(id) => onSetTextStyle?.(styleKey, { icon: id })}
            onClose={() => setIconOpen(false)}
          />
        )}
      </div>

      <div className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />

      <HoverFlyout
        panelClassName="w-56"
        align="right"
        trigger={<SparkIcon className={`w-3.5 h-3.5 ${current.anim ? 'text-gold-400' : 'text-ink-300'}`} />}
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-ink-500 px-3 pt-1 pb-1.5">
          Animación al aparecer
        </p>
        <button
          type="button"
          onMouseDown={guard(() => onSetTextStyle?.(styleKey, { anim: undefined }))}
          className={`block w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/10 ${
            !current.anim ? 'text-gold-500' : 'text-ink-300'
          }`}
        >
          Ninguna
        </button>
        <div className="grid grid-cols-3 gap-1.5 px-2 pb-2 pt-1">
          {TEXT_ANIMATIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onMouseDown={guard(() => onSetTextStyle?.(styleKey, { anim: a.id }))}
              title={a.label}
              className={`rounded-md border p-1.5 flex flex-col items-center gap-1 transition-colors ${
                current.anim === a.id ? 'border-gold-500 bg-gold-500/10' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <span className="w-full h-6 rounded bg-white/5 flex items-center justify-center overflow-hidden">
                <span className={`text-[10px] font-bold text-white ${a.previewClass}`}>Aa</span>
              </span>
              <span className="text-[9px] text-ink-400 leading-tight text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </HoverFlyout>

      {hasOverride && (
        <>
          <div className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />
          <button
            type="button"
            onMouseDown={guard(() =>
              onSetTextStyle?.(styleKey, {
                fontFamily: undefined,
                color: undefined,
                bold: undefined,
                italic: undefined,
                underline: undefined,
                strikethrough: undefined,
                link: undefined,
                icon: undefined,
                anim: undefined,
              })
            )}
            title="Restablecer formato"
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-ink-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <XIcon className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}

function Editable({
  editable,
  value,
  onChange,
  tag: Tag = 'span',
  className = '',
  multiline = false,
  placeholder = '',
  prefix = '',
  suffix = '',
  style,
  href,
  block = false,
  type = 'text',
  format,
  styleKey,
  maxLength,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [editAnchorEl, setEditAnchorEl] = useState(null);
  // Todo texto editable tiene un tope de caracteres — si el que llama no pasó
  // uno puntual, se usa un default razonable según sea de una línea o un
  // párrafo, así ninguna sección se puede llenar de texto interminable.
  const effectiveMaxLength = type === 'number' ? undefined : maxLength ?? (multiline ? 400 : 60);
  const { textStyles } = useContext(TextStyleCtx);
  const override = styleKey ? textStyles[styleKey] : null;
  const mergedStyle = override ? { ...style, ...textStyleToCss(override) } : style;
  // El href explícito (pasado por la sección) siempre gana sobre el link
  // agregado desde el minimenú de formato de texto.
  const effectiveHref = href || override?.link;
  const DisplayTag = effectiveHref ? 'a' : Tag;
  const linkProps = effectiveHref ? { href: effectiveHref, target: '_blank', rel: 'noreferrer' } : {};
  const isEmpty = value === undefined || value === null || value === '';
  const display = format ? format(value) : value;
  const Icon = override?.icon ? ICON_COMPONENTS[override.icon] : null;
  const iconNode = Icon ? (
    <Icon className="inline-block w-[0.9em] h-[0.9em] mr-1.5 -mt-0.5 align-middle" aria-hidden="true" />
  ) : null;

  if (!editable) {
    if (isEmpty) return null;
    const readContent = (
      <>
        {iconNode}
        {prefix}
        {display}
        {suffix}
      </>
    );
    if (override?.anim && TEXT_ANIM_VARIANTS[override.anim]) {
      return (
        <AnimatedTag tag={DisplayTag} anim={override.anim} className={className} style={mergedStyle} {...linkProps}>
          {readContent}
        </AnimatedTag>
      );
    }
    return (
      <DisplayTag className={className} style={mergedStyle} {...linkProps}>
        {readContent}
      </DisplayTag>
    );
  }

  if (editing) {
    const commit = () => {
      setEditing(false);
      if (draft !== value) onChange?.(draft);
    };
    const commonProps = {
      autoFocus: true,
      value: draft,
      onChange: (e) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e) => {
        if (e.key === 'Enter' && !multiline) {
          e.preventDefault();
          commit();
        }
        if (e.key === 'Escape') {
          setDraft(value ?? '');
          setEditing(false);
        }
      },
      placeholder,
      maxLength: effectiveMaxLength,
      className: `${className} bg-black/5 outline outline-2 outline-current/40 rounded-md px-2 -mx-2 w-full max-w-full ${block ? 'block' : ''}`,
      style: mergedStyle,
    };
    // Siempre en bloque mientras se edita (aunque el texto en modo lectura sea
    // inline) — evita que el input, con w-full, quede adentro de un contenedor
    // que se encoge a su contenido y termine con un ancho circular/impredecible.
    return (
      <span ref={setEditAnchorEl} className="relative block w-full">
        {styleKey && <TextStyleToolbar styleKey={styleKey} anchorEl={editAnchorEl} />}
        {multiline ? <textarea rows={3} {...commonProps} /> : <input type={type} {...commonProps} />}
      </span>
    );
  }

  const Wrapper = block ? 'div' : 'span';
  return (
    <Wrapper className={`relative group/edit max-w-full ${block ? '' : 'inline-block align-top'}`}>
      <DisplayTag
        {...linkProps}
        onClick={(e) => {
          e.preventDefault();
          setDraft(value ?? '');
          setEditing(true);
        }}
        title="Tocá para editar"
        style={mergedStyle}
        className={`${className} cursor-text rounded-md px-2 -mx-2 transition-colors group-hover/edit:bg-current/[0.06] group-hover/edit:outline group-hover/edit:outline-2 group-hover/edit:outline-dashed group-hover/edit:outline-current/30`}
      >
        {!isEmpty ? (
          <>
            {iconNode}
            {prefix}
            {display}
            {suffix}
          </>
        ) : (
          <span className="opacity-50">{placeholder}</span>
        )}
      </DisplayTag>
      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gold-500 text-navy-950 flex items-center justify-center opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none">
        <PencilIcon className="w-2.5 h-2.5" />
      </span>
    </Wrapper>
  );
}

// Una ruta del menú, ya sea ancla a una sección o (a futuro) a una página
// nueva — texto plano, nunca un botón/pill, siguiendo el lenguaje editorial.
function RutaPill({ r, editable, onGoTo, onRemove, palette }) {
  return (
    <div className="relative group/ruta">
      <button
        type="button"
        onClick={onGoTo}
        className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-70"
        style={{ color: palette?.ink }}
      >
        {r.label}
        {r.tipo === 'url' && <span className="text-xs opacity-60">↗</span>}
      </button>
      {editable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${r.label}`}
          className="absolute -top-1.5 -right-2.5 w-3.5 h-3.5 text-white flex items-center justify-center opacity-0 group-hover/ruta:opacity-100 transition-opacity"
          style={{ background: palette?.ink }}
        >
          <XIcon className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

// El botón + formulario para sumar una ruta nueva — reutilizado en el nav de
// escritorio y adentro del menú hamburguesa en mobile.
function AgregarRutaButton({ seccionesDisponibles, onAdd, fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [tipo, setTipo] = useState('seccion');
  const [targetId, setTargetId] = useState(seccionesDisponibles[0]?.id ?? '');
  const [url, setUrl] = useState('');

  const submit = () => {
    const text = label.trim();
    if (!text) return;
    if (tipo === 'seccion') {
      onAdd({ id: `ruta-${Date.now()}`, label: text, tipo: 'seccion', targetId });
    } else {
      const rawUrl = url.trim();
      if (!rawUrl) return;
      const fullUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      onAdd({ id: `ruta-${Date.now()}`, label: text, tipo: 'url', url: fullUrl });
    }
    setLabel('');
    setUrl('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-dashed border-black/20 text-neutral-500 hover:border-gold-500 hover:text-gold-600 px-3.5 py-2 text-sm font-semibold transition-colors ${
          fullWidth ? 'w-full' : ''
        }`}
      >
        <PlusIcon className="w-3.5 h-3.5" /> Agregar ruta
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className={`absolute top-full mt-2 w-72 rounded-xl border border-neutral-200 bg-white shadow-xl p-3.5 text-left z-40 ${
              fullWidth ? 'left-0' : 'right-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">Nueva ruta</p>
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Texto del botón (ej: Contacto)"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm mb-2.5 outline-none focus:border-gold-500"
            />
            <div className="flex gap-1.5 mb-2.5">
              <button
                type="button"
                onClick={() => setTipo('seccion')}
                className={`flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
                  tipo === 'seccion' ? 'bg-gold-500 text-navy-950' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                Sección de esta página
              </button>
              <button
                type="button"
                onClick={() => setTipo('url')}
                className={`flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${
                  tipo === 'url' ? 'bg-gold-500 text-navy-950' : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                URL externa
              </button>
            </div>

            {tipo === 'seccion' ? (
              seccionesDisponibles.length === 0 ? (
                <p className="text-xs text-neutral-400 mb-3">Agregá otra sección primero para poder linkearla.</p>
              ) : (
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm mb-3 outline-none focus:border-gold-500"
                >
                  {seccionesDisponibles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )
            ) : (
              <div className="mb-3">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="ej: https://wa.me/5491122334455"
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-gold-500 font-mono"
                />
              </div>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={!label.trim() || (tipo === 'seccion' ? !targetId : !url.trim())}
              className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 transition-colors"
            >
              Agregar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Header con logo + menú de rutas. Cada ruta lleva a una sección de esta misma
// página (ancla con scroll suave) o a una URL externa (se abre en una pestaña
// nueva). El menú se convierte en hamburguesa cuando el contenedor es angosto
// (celular, o la vista "Celular" del editor).
function SeccionHeader({
  variant = 'clasico',
  logoUrl,
  onLogoChange,
  nombreNegocio,
  onUpdateNombre,
  editable,
  rutas,
  onUpdateRutas,
  seccionesDisponibles,
  bgColor,
  textColor,
  accent,
  palette,
  sticky = false,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const list = rutas || [];

  const addRuta = (nueva) => onUpdateRutas([...list, nueva]);
  const removeRuta = (id) => onUpdateRutas(list.filter((r) => r.id !== id));
  const goTo = (r) => {
    if (r.tipo === 'seccion') {
      document.getElementById(r.targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (r.tipo === 'url' && r.url) {
      window.open(r.url, '_blank', 'noopener,noreferrer');
    }
    setMobileOpen(false);
  };

  const logoImg = editable ? (
    <label className="group/logo relative cursor-pointer shrink-0" title="Tocá para cambiar el logo">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="w-9 h-9 object-cover" />
      ) : (
        <div
          className="w-9 h-9 flex items-center justify-center font-serif italic text-lg text-white"
          style={{ background: accent }}
        >
          {initials(nombreNegocio)}
        </div>
      )}
      <span className="absolute inset-0 bg-black/0 group-hover/logo:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/logo:opacity-100">
        <PencilIcon className="w-3.5 h-3.5 text-white" />
      </span>
      <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
    </label>
  ) : logoUrl ? (
    <img src={logoUrl} alt="Logo" className="w-9 h-9 object-cover shrink-0" />
  ) : (
    <div
      className="w-9 h-9 flex items-center justify-center font-serif italic text-lg text-white shrink-0"
      style={{ background: accent }}
    >
      {initials(nombreNegocio)}
    </div>
  );

  const logoBlock = (
    <div className="flex items-center gap-3 min-w-0">
      {logoImg}
      <Editable
        editable={editable}
        value={nombreNegocio}
        onChange={onUpdateNombre}
        tag="span"
        styleKey="header.nombreNegocio"
        style={{ color: textColor || palette?.ink }}
        className="font-serif italic text-lg truncate"
      />
    </div>
  );

  const pills = (items, extra) => (
    <>
      {items.map((r) => (
        <RutaPill key={r.id} r={r} editable={editable} onGoTo={() => goTo(r)} onRemove={() => removeRuta(r.id)} palette={palette} />
      ))}
      {extra}
    </>
  );

  const hamburger = (
    <div className="relative flex @lg:hidden">
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Abrir menú"
        className="w-9 h-9 border flex items-center justify-center transition-colors shrink-0"
        style={{ borderColor: palette?.line, color: palette?.ink }}
      >
        <MenuIcon className="w-4 h-4" />
      </button>
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMobileOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-64 border shadow-xl p-2 z-40 text-left"
            style={{ background: palette?.bg, borderColor: palette?.line }}
            onClick={(e) => e.stopPropagation()}
          >
            {list.length === 0 && (
              <p className="text-xs px-2 py-2" style={{ color: palette?.inkSoft }}>
                Todavía no hay botones de menú.
              </p>
            )}
            {list.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => goTo(r)}
                  className="flex-1 text-left text-sm font-medium flex items-center gap-1.5"
                  style={{ color: palette?.ink }}
                >
                  {r.label}
                  {r.tipo === 'url' && <span className="text-xs opacity-60">↗</span>}
                </button>
                {editable && (
                  <button
                    type="button"
                    onClick={() => removeRuta(r.id)}
                    aria-label={`Quitar ${r.label}`}
                    className="transition-colors shrink-0 opacity-40 hover:opacity-100"
                    style={{ color: palette?.ink }}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {editable && (
              <div className="pt-1.5 mt-1.5 border-t" style={{ borderColor: palette?.line }}>
                <AgregarRutaButton seccionesDisponibles={seccionesDisponibles} onAdd={addRuta} fullWidth />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (variant === 'centrado') {
    return (
      <header
        className="relative flex flex-col items-center gap-3 px-6 @lg:px-10 py-5 text-center border-b"
        style={{ background: bgColor || palette?.bg, color: textColor || palette?.ink, borderColor: palette?.line }}
      >
        <div className="w-full flex items-center justify-between @lg:hidden">
          <span />
          {hamburger}
        </div>
        {logoBlock}
        <nav className="hidden @lg:flex flex-wrap items-center justify-center gap-5">
          {pills(list, editable && <AgregarRutaButton seccionesDisponibles={seccionesDisponibles} onAdd={addRuta} />)}
        </nav>
      </header>
    );
  }

  if (variant === 'lados') {
    const half = Math.ceil(list.length / 2);
    const left = list.slice(0, half);
    const right = list.slice(half);
    return (
      <header
        className="relative flex items-center justify-between gap-4 px-6 @lg:px-10 py-4 border-b"
        style={{ background: bgColor || palette?.bg, color: textColor || palette?.ink, borderColor: palette?.line }}
      >
        <nav className="hidden @lg:flex flex-1 items-center gap-5">{pills(left)}</nav>
        {logoBlock}
        <nav className="hidden @lg:flex flex-1 items-center justify-end gap-5">
          {pills(right, editable && <AgregarRutaButton seccionesDisponibles={seccionesDisponibles} onAdd={addRuta} />)}
        </nav>
        {hamburger}
      </header>
    );
  }

  // Variante "clasico" — logo a la izquierda, menú a la derecha.
  return (
    <header
      className={`${sticky ? 'sticky top-0 z-40 backdrop-blur-md' : 'relative'} flex items-center justify-between gap-4 px-6 @lg:px-10 py-4 border-b`}
      style={{ background: bgColor || palette?.bg, color: textColor || palette?.ink, borderColor: palette?.line }}
    >
      {logoBlock}
      <div className="hidden @lg:flex items-center gap-6">
        <nav className="flex flex-wrap items-center gap-5">
          {pills(list, editable && <AgregarRutaButton seccionesDisponibles={seccionesDisponibles} onAdd={addRuta} />)}
        </nav>
      </div>
      {hamburger}
    </header>
  );
}

// Solo 2 botones (no 3): uno sólido (ink, la acción principal) y uno con
// borde (ink, secundario) — nunca de a 3, y nunca coloreados con el acento
// (el acento se reserva para eyebrows, precios y la banda de CTA).
const HERO_BUTTON_SLOTS = [
  { key: 'primary', defaultFuncion: 'whatsapp', defaultLabel: 'Escribinos por WhatsApp', targetField: 'whatsapp' },
  { key: 'secondary', defaultFuncion: 'seccion', defaultLabel: 'Ver más' },
];

// Panel de la variante "Vidriera rotativa" del Hero: en vez de una sola foto
// fija, rota sola entre varias ofertas (foto + etiqueta + nombre + precio),
// como una vidriera de local. En modo edición no rota — se ve y se completa
// una oferta por vez, eligiéndola con los puntitos de abajo, para no estar
// completando un campo que se mueve solo.
function HeroOfertasPanel({ ofertas = [], onUpdate, editable, accent, palette = {}, bgColor, etiquetaSuperior, velocidad = 2600 }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [editIndex, setEditIndex] = useState(0);

  useEffect(() => {
    if (editable || ofertas.length <= 1) return undefined;
    const t = setInterval(() => setActiveIndex((i) => (i + 1) % ofertas.length), velocidad);
    return () => clearInterval(t);
  }, [editable, ofertas.length, velocidad]);

  useEffect(() => {
    setEditIndex((i) => Math.min(i, Math.max(0, ofertas.length - 1)));
  }, [ofertas.length]);

  const update = (id, patch) => onUpdate?.(ofertas.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const remove = (id) => onUpdate?.(ofertas.filter((o) => o.id !== id));
  const addSlide = async (file) => {
    if (!(await validateImageFile(file, 'hero'))) return;
    const img = await uploadImage(file);
    onUpdate?.([...ofertas, { id: `oferta-${Date.now()}`, img, badge: 'Oferta', nombre: 'Producto', precio: '$0' }]);
    setEditIndex(ofertas.length);
  };
  const replaceImg = async (id, file) => {
    if (!(await validateImageFile(file, 'hero'))) return;
    update(id, { img: await uploadImage(file) });
  };
  const fileInput = (onPick) => (
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) onPick(file);
      }}
    />
  );

  if (!editable) {
    if (ofertas.length === 0) return null;
    const active = ofertas[activeIndex];
    return (
      <div className="relative aspect-[4/5] overflow-hidden" style={{ background: bgColor || palette.bg }}>
        {active?.glow && (
          <div
            className="absolute inset-0 transition-[background] duration-1000"
            style={{ background: `radial-gradient(circle at 50% 44%, ${active.glow} 0%, rgba(255,255,255,0) 64%)` }}
          />
        )}
        {ofertas.map((o, i) => (
          <img
            key={o.id}
            src={o.img || undefined}
            alt={o.nombre || ''}
            className="absolute left-1/2 top-1/2 h-[70%] w-auto -translate-x-1/2 -translate-y-1/2 object-contain transition-all duration-700 ease-in-out"
            style={{
              opacity: i === activeIndex ? 1 : 0,
              transform: `translate(-50%, -50%) scale(${i === activeIndex ? 1 : 0.92})`,
              display: o.img ? 'block' : 'none',
              filter: 'drop-shadow(0 22px 30px rgba(16,20,24,0.25))',
            }}
          />
        ))}
        {active?.badge && (
          <span
            className="absolute top-3 right-3 px-2.5 py-1.5 text-sm font-bold text-white"
            style={{ background: accent }}
          >
            {active.badge}
          </span>
        )}
        {(active?.nombre || active?.precio) && (
          <div className="absolute bottom-3 left-3 bg-white px-4 py-3 shadow-lg" style={{ background: palette.bg === '#ffffff' ? '#fff' : palette.bg }}>
            {etiquetaSuperior && (
              <div className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: palette.inkSoft }}>
                {etiquetaSuperior}
              </div>
            )}
            {active.nombre && (
              <div className="font-serif font-bold text-sm mb-0.5" style={{ color: palette.ink }}>
                {active.nombre}
              </div>
            )}
            <div className="flex items-baseline gap-2">
              {active.precio && (
                <span className="font-mono font-semibold text-sm" style={{ color: accent }}>
                  {active.precio}
                </span>
              )}
              {active.precioAnterior && (
                <span className="font-mono text-xs line-through" style={{ color: palette.inkSoft }}>
                  {active.precioAnterior}
                </span>
              )}
            </div>
          </div>
        )}
        {ofertas.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {ofertas.map((_, i) => (
              <span
                key={i}
                className="h-[5px] transition-all"
                style={{ width: i === activeIndex ? 20 : 5, background: i === activeIndex ? palette.ink : palette.line }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const current = ofertas[editIndex];
  return (
    <div>
      <div className="relative aspect-[4/5] border-2 border-dashed overflow-hidden" style={{ borderColor: palette.line, background: bgColor || palette.bg }}>
        {current ? (
          <>
            <label className="absolute inset-0 cursor-pointer group/img">
              {current.img ? (
                <img src={current.img} alt="" className="w-full h-full object-contain p-6" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ color: palette.inkSoft }}
                >
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <span className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                <span className="text-white text-xs font-semibold">Cambiar foto</span>
              </span>
              {fileInput((file) => replaceImg(current.id, file))}
            </label>
            <div className="absolute top-3 left-3">
              <Editable
                editable
                value={current.badge}
                onChange={(v) => update(current.id, { badge: v })}
                placeholder="Oferta (ej: 2x1 los martes)"
                maxLength={30}
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ background: accent }}
              />
            </div>
            <div className="absolute bottom-3 right-3 text-right">
              <Editable
                editable
                value={current.nombre}
                onChange={(v) => update(current.id, { nombre: v })}
                placeholder="Nombre"
                maxLength={40}
                block
                className="font-serif text-lg"
                style={{ color: palette.ink }}
              />
              <Editable
                editable
                value={current.precio}
                onChange={(v) => update(current.id, { precio: v })}
                placeholder="$0"
                maxLength={12}
                block
                className="font-mono font-bold"
                style={{ color: accent }}
              />
              <Editable
                editable
                value={current.precioAnterior}
                onChange={(v) => update(current.id, { precioAnterior: v })}
                placeholder="Precio anterior (opcional)"
                maxLength={12}
                block
                className="font-mono text-xs line-through"
                style={{ color: palette.inkSoft }}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(current.id)}
              aria-label="Quitar esta oferta"
              className="absolute top-3 right-3 w-6 h-6 bg-black/60 text-white flex items-center justify-center"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer text-sm text-center px-4" style={{ color: palette.inkSoft }}>
            <PlusIcon className="w-5 h-5" />
            Agregá la primera oferta
            {fileInput(addSlide)}
          </label>
        )}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {ofertas.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setEditIndex(i)}
            aria-label={`Editar oferta ${i + 1}`}
            className="w-2 h-2 rounded-full"
            style={{ background: i === editIndex ? accent : palette.line }}
          />
        ))}
        <label
          className="w-5 h-5 border border-dashed flex items-center justify-center cursor-pointer ml-1"
          style={{ borderColor: palette.line, color: palette.inkSoft }}
        >
          <PlusIcon className="w-3 h-3" />
          {fileInput(addSlide)}
        </label>
      </div>
    </div>
  );
}

// Cuenta regresiva en vivo hasta una fecha — usada por la variante "Cuenta
// regresiva" del Hero. Corre con un intervalo propio (no depende de que el
// resto de la página se vuelva a renderizar) y no rompe si todavía no hay
// fecha cargada (muestra un placeholder fijo en vez de romper el cálculo).
function CountdownBoxes({ fechaEvento, accent, palette = {} }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = fechaEvento ? new Date(fechaEvento).getTime() : null;
  const valid = target && !Number.isNaN(target);
  const diff = valid ? Math.max(0, target - now) : 0;
  const pad = (n) => String(n).padStart(2, '0');
  const items = valid
    ? [
        { value: Math.floor(diff / 86400000), label: 'Días' },
        { value: pad(Math.floor((diff % 86400000) / 3600000)), label: 'Horas' },
        { value: pad(Math.floor((diff % 3600000) / 60000)), label: 'Min' },
        { value: pad(Math.floor((diff % 60000) / 1000)), label: 'Seg' },
      ]
    : [
        { value: '—', label: 'Días' },
        { value: '—', label: 'Horas' },
        { value: '—', label: 'Min' },
        { value: '—', label: 'Seg' },
      ];

  return (
    <div className="flex justify-center gap-3 @lg:gap-5 mb-9 flex-wrap">
      {items.map((it, i) => (
        <div
          key={i}
          className="min-w-[62px] @lg:min-w-[84px] border px-3 py-3.5"
          style={{ borderColor: palette.line, background: 'rgba(255,255,255,0.72)' }}
        >
          <div className="font-serif text-2xl @lg:text-3xl leading-none" style={{ color: accent }}>
            {it.value}
          </div>
          <div className="text-[10px] uppercase tracking-wide mt-1.5" style={{ color: palette.inkSoft }}>
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// Set inicial de la variante "zonas" — nunca una zona vacía la primera vez
// que se elige esta distribución. Los ids son fijos (no `Date.now()`) porque
// se usan una sola vez, al armar el default; una vez guardados en la sección
// pasan a vivir en `sec.zonas` como cualquier otro objeto.
const DEFAULT_ZONA_HERO_IZQUIERDA = [
  { id: 'zona-hero-1', tipo: 'badge', texto: 'Categoría · desde cuándo' },
  { id: 'zona-hero-2', tipo: 'titulo', texto: 'Título grande de tu negocio' },
  { id: 'zona-hero-3', tipo: 'texto', texto: 'Una descripción breve de lo que ofrecés.' },
  { id: 'zona-hero-4', tipo: 'boton', label: 'Escribinos', funcion: 'whatsapp' },
];
const DEFAULT_ZONA_HERO_DERECHA = [{ id: 'zona-hero-5', tipo: 'imagen', src: '' }];

function SeccionHero({
  variant = 'centrado',
  nombreNegocio,
  rubroLabel,
  sobreNosotros,
  whatsapp,
  telefono,
  editable,
  field,
  accent,
  palette = {},
  galeria,
  caption,
  onUpdateCaption,
  bgColor,
  headingColor,
  textColor,
  botones: botonesData = {},
  onUpdateBotones,
  heroOfertas = [],
  onUpdateHeroOfertas,
  heroImagen,
  onUpdateHeroImagen,
  titulo,
  onUpdateTitulo,
  descripcion,
  onUpdateDescripcion,
  seccionesDisponibles = [],
  imagenFiltro,
  stats = [],
  ofertasEtiquetaSuperior,
  ofertasVelocidad,
  fechaEvento,
  onUpdateFechaEvento,
  fechaEventoLabel,
  onUpdateFechaEventoLabel,
  destacado,
  onUpdateDestacado,
  destacadoEtiqueta,
  onUpdateDestacadoEtiqueta,
  zonas,
  onUpdateZonas,
}) {
  const heroTargetDefaults = { whatsapp, telefono };
  const inkHex = palette.inkHex || '#171717';

  // Los botones del Hero son objetos Botón con función editable (por defecto
  // WhatsApp / Ir a una sección), cada uno configurable desde su propio menú.
  const botones = (alignClass = 'justify-start') => (
    <div className={`flex flex-wrap items-center gap-3 ${alignClass}`}>
      {HERO_BUTTON_SLOTS.map((slot, idx) => {
        const v = botonesData[slot.key];
        const defaultTarget = slot.targetField ? heroTargetDefaults[slot.targetField] : undefined;
        if (!buttonSlotVisible(editable, v, slot.defaultFuncion, defaultTarget)) return null;
        return (
          <ButtonObject
            key={slot.key}
            value={v}
            onChange={(patch) =>
              onUpdateBotones?.({ ...botonesData, [slot.key]: { ...(botonesData[slot.key] || {}), ...patch } })
            }
            editable={editable}
            seccionesDisponibles={seccionesDisponibles}
            nombreNegocio={nombreNegocio}
            defaultFuncion={slot.defaultFuncion}
            defaultLabel={slot.defaultLabel}
            defaultColor={inkHex}
            defaultTarget={defaultTarget}
            outline={idx > 0}
          />
        );
      })}
    </div>
  );

  const eyebrow = (align = 'text-left') => (
    <Editable
      editable={editable}
      value={rubroLabel}
      onChange={field('rubroLabel')}
      tag="span"
      block
      styleKey="hero.rubroLabel"
      style={{ color: accent }}
      className={`font-mono text-xs uppercase tracking-[0.16em] mb-3 ${align}`}
    />
  );

  const heading = (size = 'text-4xl @lg:text-6xl') => (
    <Editable
      editable={editable}
      value={titulo ?? nombreNegocio}
      onChange={onUpdateTitulo || field('nombreNegocio')}
      tag="h1"
      block
      styleKey="hero.nombreNegocio"
      placeholder="Nombre del negocio"
      style={{ color: headingColor || palette.ink }}
      className={`font-serif ${size} leading-[1.05] tracking-tight mb-5 text-balance`}
    />
  );

  const paragraph = (extra = '') => (
    <Editable
      editable={editable}
      value={descripcion ?? sobreNosotros}
      onChange={onUpdateDescripcion || field('sobreNosotros')}
      tag="p"
      multiline
      block
      styleKey="hero.sobreNosotros"
      style={{ color: textColor || palette.inkSoft }}
      className={`text-base @lg:text-lg leading-relaxed mb-8 text-balance ${extra}`}
    />
  );

  const captionBox = () =>
    (caption || editable) && (
      <div
        className="absolute left-0 bottom-0 px-4 py-2.5 border-t border-r"
        style={{ background: palette.bg, borderColor: palette.line }}
      >
        <Editable
          editable={editable}
          value={caption}
          onChange={onUpdateCaption}
          tag="span"
          placeholder="Frase corta (ej: Agenda abierta esta semana)"
          maxLength={60}
          style={{ color: palette.ink }}
          className="font-mono text-xs @lg:text-sm"
        />
      </div>
    );

  // Si esta sección tiene su propia foto puesta a mano (heroImagen), esa
  // gana — si no, sigue mostrando la primera de la galería como hacía
  // siempre (mismo patrón que SeccionSobreNosotros > imagen).
  const handleHeroImagen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) onUpdateHeroImagen?.(await uploadImage(file));
  };

  const imagePanel = (heroImg) => (
    <div className="relative aspect-[4/5] bg-black/5 overflow-hidden group/hero">
      <label
        className={`absolute inset-0 ${editable ? 'cursor-pointer' : ''}`}
        title={editable ? 'Cambiar foto' : undefined}
      >
        {heroImg ? (
          <img src={heroImg} alt="" className="w-full h-full object-cover" style={{ filter: 'grayscale(0.15) contrast(1.05)' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-center px-4" style={{ color: palette.inkSoft }}>
            Agregá fotos en tu galería
          </div>
        )}
        {editable && (
          <>
            <span className="absolute inset-0 bg-black/0 group-hover/hero:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/hero:opacity-100">
              <span className="text-white text-xs font-semibold">Cambiar foto</span>
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleHeroImagen} />
          </>
        )}
      </label>
      {captionBox()}
    </div>
  );

  // "Armá el tuyo" — primera sección con Zonas + Objetos (ver ZoneRenderer):
  // en vez de campos fijos, cada mitad es una lista de objetos que el usuario
  // arma y ordena, dentro de límites por zona. Arranca con un set default la
  // primera vez que se elige esta distribución (nunca una zona vacía).
  if (variant === 'zonas') {
    const zonasData = zonas || {};
    const izquierda = zonasData.izquierda?.objetos ?? DEFAULT_ZONA_HERO_IZQUIERDA;
    const derecha = zonasData.derecha?.objetos ?? DEFAULT_ZONA_HERO_DERECHA;
    const updateZona = (key, objetos) => onUpdateZonas?.({ ...zonasData, [key]: { objetos } });
    return (
      <section className="px-6 @lg:px-10 py-16 @lg:py-24" style={{ background: bgColor || palette.bg }}>
        <div className="max-w-6xl mx-auto grid @lg:grid-cols-[1.15fr_0.85fr] gap-10 @lg:gap-16 items-center">
          <ZoneRenderer
            objetos={izquierda}
            onChange={(next) => updateZona('izquierda', next)}
            allowedTypes={['badge', 'titulo', 'texto', 'boton']}
            maxObjetos={6}
            editable={editable}
            palette={palette}
            accent={accent}
            headingColor={headingColor}
            textColor={textColor}
            seccionesDisponibles={seccionesDisponibles}
            nombreNegocio={nombreNegocio}
            whatsapp={whatsapp}
            telefono={telefono}
          />
          <ZoneRenderer
            objetos={derecha}
            onChange={(next) => updateZona('derecha', next)}
            allowedTypes={['imagen']}
            maxObjetos={1}
            editable={editable}
            palette={palette}
            accent={accent}
          />
        </div>
      </section>
    );
  }

  // Dos fotos — texto a la izquierda, dos fotos fijas lado a lado a la
  // derecha (las dos primeras de la galería) en vez de una sola imagen
  // grande. Para negocios que quieren mostrar variedad de entrada sin
  // necesitar que roten solas (ver variante "ofertas" para eso).
  if (variant === 'duo') {
    const img1 = galeria?.[0];
    const img2 = galeria?.[1];
    const fotoSlot = (img) => (
      <div className="relative aspect-[3/4] bg-black/5 overflow-hidden">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" style={{ filter: 'grayscale(0.15) contrast(1.05)' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-center px-2" style={{ color: palette.inkSoft }}>
            Agregá fotos en tu galería
          </div>
        )}
      </div>
    );
    return (
      <section className="relative px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
        <div className="max-w-6xl mx-auto grid @lg:grid-cols-2 gap-10 @lg:gap-16 items-center">
          <div>
            {eyebrow()}
            {heading()}
            {paragraph()}
            {botones()}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="mt-8">{fotoSlot(img1)}</div>
            {fotoSlot(img2)}
          </div>
        </div>
      </section>
    );
  }

  // Una foto a cada lado, texto centrado con estadísticas abajo — para
  // talleres colectivos o negocios con más de un oficio en un mismo rubro,
  // donde conviene mostrar dos fotos bien distintas flanqueando el mensaje en
  // vez de una sola imagen protagonista (a diferencia de "duo", que agrupa
  // las dos fotos juntas de un mismo lado). Las fotos se editan desde la
  // sección Galería, igual que en "duo" — acá solo se muestran.
  if (variant === 'flanqueada') {
    const img1 = galeria?.[0];
    const img2 = galeria?.[1];
    const fotoSlot = (img) => (
      <div className="relative aspect-[3/4] bg-black/5 overflow-hidden">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" style={{ filter: 'grayscale(0.1) contrast(1.03)' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-center px-2" style={{ color: palette.inkSoft }}>
            Agregá fotos en tu galería
          </div>
        )}
      </div>
    );
    return (
      <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
        <div className="max-w-6xl mx-auto grid @lg:grid-cols-[1fr_1.15fr_1fr] gap-6 @lg:gap-8 items-end">
          {fotoSlot(img1)}
          <div>
            {eyebrow()}
            {heading('text-4xl @lg:text-6xl leading-[0.98]')}
            {paragraph()}
            {botones()}
            {stats.length > 0 && (
              <div className="flex gap-7 border-t pt-4 mt-7" style={{ borderColor: palette.line }}>
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="font-serif text-2xl leading-none" style={{ color: headingColor || palette.ink }}>
                      {s.value}
                    </div>
                    <div className="font-mono text-[0.65rem] uppercase tracking-wide mt-1" style={{ color: palette.inkSoft }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {fotoSlot(img2)}
        </div>
      </section>
    );
  }

  // Vidriera rotativa — texto a la izquierda, panel de ofertas girando solo a
  // la derecha (ver HeroOfertasPanel). Pensada para negocios con varios
  // productos/promos que quieren mostrar de a uno sin ocupar más lugar.
  if (variant === 'ofertas') {
    return (
      <section className="relative px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
        <div className="max-w-6xl mx-auto grid @lg:grid-cols-[1.1fr_0.9fr] gap-10 @lg:gap-16 items-center">
          <div>
            {eyebrow()}
            {heading()}
            {paragraph()}
            {botones()}
            {stats.length > 0 && (
              <div className="grid grid-cols-3 gap-4 border-t pt-5 mt-7" style={{ borderColor: palette.line }}>
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="font-serif font-bold text-lg leading-tight" style={{ color: headingColor || palette.ink }}>
                      {s.value}
                    </div>
                    <div className="text-xs" style={{ color: palette.inkSoft }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <HeroOfertasPanel
            ofertas={heroOfertas}
            onUpdate={onUpdateHeroOfertas}
            editable={editable}
            accent={accent}
            palette={palette}
            bgColor={bgColor}
            etiquetaSuperior={ofertasEtiquetaSuperior}
            velocidad={ofertasVelocidad}
          />
        </div>
      </section>
    );
  }

  // Tres columnas: texto+CTAs, una foto fija, y una tarjeta flotante con UN
  // producto destacado (foto, título, autor, precio, stock) — a diferencia
  // de "ofertas" (que rota sola entre varias), acá es un solo ítem fijo que
  // el dueño elige a mano, pensado para catálogos (librerías, tiendas).
  if (variant === 'destacado') {
    const d = destacado || {};
    const handleHeroDestacadoImg = async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file && (await validateImageFile(file, 'hero'))) onUpdateDestacado?.({ ...d, imagen: await uploadImage(file) });
    };
    const set = (key) => (v) => onUpdateDestacado?.({ ...d, [key]: v });
    return (
      <section className="relative px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
        <div className="max-w-6xl mx-auto grid @lg:grid-cols-[1.05fr_0.75fr_0.7fr] gap-8 @lg:gap-10 items-end">
          <div>
            {eyebrow()}
            {heading('text-4xl @lg:text-6xl')}
            {paragraph()}
            {botones()}
          </div>
          <div className="relative aspect-[3/4] bg-black/5 overflow-hidden group/hero">
            <label className={`absolute inset-0 ${editable ? 'cursor-pointer' : ''}`} title={editable ? 'Cambiar foto' : undefined}>
              {heroImagen || galeria?.[0] ? (
                <img src={heroImagen || galeria[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-center px-4" style={{ color: palette.inkSoft }}>
                  Agregá fotos en tu galería
                </div>
              )}
              {editable && (
                <>
                  <span className="absolute inset-0 bg-black/0 group-hover/hero:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/hero:opacity-100">
                    <span className="text-white text-xs font-semibold">Cambiar foto</span>
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleHeroImagen} />
                </>
              )}
            </label>
          </div>
          <div className="border p-5" style={{ borderColor: palette.line, background: palette.bg }}>
            <Editable
              editable={editable}
              value={destacadoEtiqueta}
              onChange={onUpdateDestacadoEtiqueta}
              tag="div"
              block
              styleKey="hero.destacadoEtiqueta"
              placeholder="Etiqueta (ej: Lo de esta semana)"
              style={{ color: accent }}
              className="font-mono text-[11px] uppercase tracking-wide mb-3.5"
              maxLength={40}
            />
            <label className={`group/dimg relative block aspect-[2/3] bg-black/5 overflow-hidden mb-3.5 ${editable ? 'cursor-pointer' : ''}`}>
              {d.imagen ? (
                <img src={d.imagen} alt={d.titulo || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-center px-2" style={{ color: palette.inkSoft }}>
                  Foto del producto
                </div>
              )}
              {editable && (
                <>
                  <span className="absolute inset-0 bg-black/0 group-hover/dimg:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/dimg:opacity-100">
                    <PencilIcon className="w-4 h-4 text-white" />
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleHeroDestacadoImg} />
                </>
              )}
            </label>
            <Editable
              editable={editable}
              value={d.titulo}
              onChange={set('titulo')}
              tag="div"
              block
              placeholder="Título"
              style={{ color: palette.ink }}
              className="font-serif text-lg leading-tight mb-1"
              maxLength={60}
            />
            <Editable
              editable={editable}
              value={d.autor}
              onChange={set('autor')}
              tag="div"
              block
              placeholder="Autor"
              style={{ color: palette.inkSoft }}
              className="text-sm mb-2.5"
              maxLength={50}
            />
            <div className="flex items-center justify-between gap-3 pt-2.5 border-t" style={{ borderColor: palette.line }}>
              <Editable
                editable={editable}
                value={d.precio}
                onChange={set('precio')}
                tag="span"
                placeholder="$0"
                style={{ color: palette.ink }}
                className="font-mono font-bold text-sm"
                maxLength={20}
              />
              <Editable
                editable={editable}
                value={d.disponibilidad}
                onChange={set('disponibilidad')}
                tag="span"
                placeholder="En stock"
                style={{ color: '#3f6b6b' }}
                className="font-mono text-xs"
                maxLength={20}
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Imagen a la izquierda, texto a la derecha — variedad respecto al default.
  if (variant === 'split') {
    const heroImg = heroImagen || galeria?.[0];
    return (
      <section className="relative px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
        <div className="max-w-6xl mx-auto grid @lg:grid-cols-[0.9fr_1.1fr] gap-10 @lg:gap-16 items-end">
          {imagePanel(heroImg)}
          <div>
            {eyebrow()}
            {heading('text-3xl @lg:text-5xl')}
            {paragraph()}
            {botones()}
            {stats.length > 0 && (
              <div className="flex gap-8 border-t pt-5 mt-7" style={{ borderColor: palette.line }}>
                {stats.map((s, i) => (
                  <div key={i}>
                    <div className="font-serif font-bold text-lg leading-tight" style={{ color: headingColor || palette.ink }}>
                      {s.value}
                    </div>
                    <div className="text-xs" style={{ color: palette.inkSoft }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Minimalista — sin foto, mucho aire, para rubros que todavía no tienen
  // fotos propias que mostrar.
  if (variant === 'minimal') {
    return (
      <section className="relative px-6 @lg:px-10 py-16 @lg:py-24" style={{ background: bgColor || palette.bg }}>
        <div className="max-w-2xl mx-auto @lg:mx-0">
          {eyebrow()}
          {heading('text-4xl @lg:text-6xl')}
          {paragraph()}
          {botones()}
        </div>
      </section>
    );
  }

  // Todo centrado de verdad (a diferencia de "centrado", que pese al nombre
  // es un grid asimétrico texto+imagen) — sin foto, con dos manchas de color
  // decorativas de fondo. Para rubros hogareños/artesanales que no quieren
  // abrir con una foto (pastelerías, marcas personales).
  if (variant === 'centro') {
    return (
      <section className="relative overflow-hidden px-6 @lg:px-10 py-20 @lg:py-28" style={{ background: bgColor || palette.bg }}>
        <div
          className="absolute -top-10 -left-10 w-40 h-40 rounded-full blur-2xl opacity-60 pointer-events-none"
          style={{ background: accent }}
        />
        <div
          className="absolute top-40 -right-10 w-48 h-48 rounded-full blur-2xl opacity-40 pointer-events-none"
          style={{ background: accent }}
        />
        <div className="relative max-w-2xl mx-auto text-center">
          {eyebrow('text-center')}
          {heading('text-4xl @lg:text-6xl')}
          {paragraph('text-center mx-auto')}
          {botones('justify-center')}
        </div>
      </section>
    );
  }

  // Imagen de fondo a sangre, texto encima con velo oscuro — para rubros que
  // quieren abrir con una foto grande (locales, obras, viandas).
  // Cuenta regresiva — pensada para eventos con fecha fija (cumpleaños de
  // 15, casamientos, aniversarios): foto de fondo con velo claro, nombre
  // grande centrado, una fecha con líneas doradas a los costados, y una
  // cuenta regresiva que corre sola en vivo (días/horas/min/seg) hasta
  // `fechaEvento`. A diferencia del resto de variantes del Hero (pensadas
  // para negocios), acá todo queda centrado y sobre fondo claro con velo,
  // no oscuro a sangre.
  if (variant === 'cuenta-regresiva') {
    const heroImg = heroImagen || galeria?.[0];
    return (
      <section className="relative overflow-hidden px-6 @lg:px-10 py-20 @lg:py-28 text-center" style={{ background: palette.bg }}>
        {heroImg && (
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${palette.bg}cc, ${palette.bg}8c 45%, ${palette.bg}f0)`,
          }}
        />
        <div className="relative max-w-2xl mx-auto">
          {eyebrow('text-center justify-center')}
          {heading('text-5xl @lg:text-7xl text-center mx-auto')}
          <div className="flex items-center justify-center gap-4 mb-7">
            <span className="h-px flex-1 max-w-16" style={{ background: '#c0a05c' }} />
            <Editable
              editable={editable}
              value={fechaEventoLabel}
              onChange={onUpdateFechaEventoLabel}
              tag="span"
              styleKey="hero.fechaEventoLabel"
              placeholder="Sábado 14 de noviembre · 2026"
              style={{ color: textColor || palette.inkSoft }}
              className="font-serif tracking-[0.22em] text-sm @lg:text-base"
              maxLength={60}
            />
            <span className="h-px flex-1 max-w-16" style={{ background: '#c0a05c' }} />
          </div>
          {editable && (
            <div className="mb-6 flex items-center justify-center gap-2">
              <label className="text-xs" style={{ color: palette.inkSoft }}>
                Fecha y hora del evento:
              </label>
              <input
                type="datetime-local"
                value={fechaEvento ? fechaEvento.slice(0, 16) : ''}
                onChange={(e) => onUpdateFechaEvento?.(e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="border px-2 py-1 text-xs"
                style={{ borderColor: palette.line, color: palette.ink }}
              />
            </div>
          )}
          <CountdownBoxes fechaEvento={fechaEvento} accent={accent} palette={palette} />
          {botones('justify-center')}
        </div>
      </section>
    );
  }

  if (variant === 'fondo') {
    const heroImg = heroImagen || galeria?.[0];
    const easeLumen = [0.16, 1, 0.3, 1];
    return (
      <section className="relative overflow-hidden px-6 @lg:px-10 py-20 @lg:py-32">
        {heroImg ? (
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.72) 0%, rgba(0,0,0,.4) 60%, rgba(0,0,0,.15) 100%), url(${heroImg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: imagenFiltro || undefined,
            }}
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.2, ease: easeLumen }}
          />
        ) : (
          <div className="absolute inset-0" style={{ background: palette.ink }} />
        )}
        <div className="relative max-w-2xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.2 }}>
            <Editable
              editable={editable}
              value={rubroLabel}
              onChange={field('rubroLabel')}
              tag="span"
              block
              styleKey="hero.rubroLabel"
              style={{ color: accent }}
              className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: easeLumen, delay: 0.35 }}
          >
            <Editable
              editable={editable}
              value={titulo ?? nombreNegocio}
              onChange={onUpdateTitulo || field('nombreNegocio')}
              tag="h1"
              block
              styleKey="hero.nombreNegocio"
              placeholder="Nombre del negocio"
              style={{ color: headingColor || '#ffffff' }}
              className="font-serif text-4xl @lg:text-6xl leading-[1.05] tracking-tight mb-5 text-balance"
            />
          </motion.div>
          <Editable
            editable={editable}
            value={descripcion ?? sobreNosotros}
            onChange={onUpdateDescripcion || field('sobreNosotros')}
            tag="p"
            multiline
            block
            styleKey="hero.sobreNosotros"
            style={{ color: textColor || 'rgba(255,255,255,0.82)' }}
            className="text-base @lg:text-lg leading-relaxed mb-8 text-balance"
          />
          <motion.div
            className="flex flex-wrap items-center gap-x-6 gap-y-3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: easeLumen, delay: 0.55 }}
          >
            <div className="flex flex-wrap items-center gap-3">
              {HERO_BUTTON_SLOTS.map((slot, idx) => {
                const v = botonesData[slot.key];
                const defaultTarget = slot.targetField ? heroTargetDefaults[slot.targetField] : undefined;
                if (!buttonSlotVisible(editable, v, slot.defaultFuncion, defaultTarget)) return null;
                return (
                  <ButtonObject
                    key={slot.key}
                    value={v}
                    onChange={(patch) =>
                      onUpdateBotones?.({ ...botonesData, [slot.key]: { ...(botonesData[slot.key] || {}), ...patch } })
                    }
                    editable={editable}
                    seccionesDisponibles={seccionesDisponibles}
                    nombreNegocio={nombreNegocio}
                    defaultFuncion={slot.defaultFuncion}
                    defaultLabel={slot.defaultLabel}
                    defaultColor={idx === 0 ? accent : '#ffffff'}
                    defaultTarget={defaultTarget}
                    outline={idx > 0}
                  />
                );
              })}
            </div>
            <Editable
              editable={editable}
              value={caption}
              onChange={onUpdateCaption}
              tag="span"
              placeholder="Frase corta (ej: 14 años · 400+ sesiones)"
              maxLength={60}
              style={{ color: 'rgba(255,255,255,0.55)' }}
              className="font-mono text-xs @lg:text-sm"
            />
          </motion.div>
          {editable && (
            <label className="inline-flex items-center gap-1.5 mt-5 bg-black/40 hover:bg-black/60 transition-colors text-white text-xs font-semibold px-3 py-1.5 cursor-pointer">
              <ImageIcon className="w-3.5 h-3.5" /> {heroImg ? 'Cambiar fondo' : 'Agregar foto de fondo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleHeroImagen} />
            </label>
          )}
        </div>
      </section>
    );
  }

  // Variante "centrado" (default): grid asimétrico texto+imagen — el estándar
  // editorial de la plantilla, nunca centrado de verdad.
  const heroImg = heroImagen || galeria?.[0];
  return (
    <section className="relative px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-6xl mx-auto grid @lg:grid-cols-[1.1fr_0.9fr] gap-10 @lg:gap-16 items-end">
        <div>
          {eyebrow()}
          {heading()}
          {paragraph()}
          {botones()}
        </div>
        {imagePanel(heroImg)}
      </div>
    </section>
  );
}

// Hero bespoke: texto 1.15fr a la izquierda (eyebrow + título grande en
// mayúsculas + descripción + botones + fila de stats) y una sola foto fija
// 0.85fr a la derecha con una franja "Hoy · turnos libres" superpuesta abajo
// — a diferencia de SeccionHero (ninguna de sus variantes tiene esa franja
// superpuesta ni el título en mayúsculas de punta a punta), pensado para el
// estilo "barbería clásica" bien tipográfico.
function SeccionHeroBarberia({
  rubroLabel,
  onUpdateRubroLabel,
  titulo,
  onUpdateTitulo,
  descripcion,
  onUpdateDescripcion,
  heroImagen,
  onUpdateHeroImagen,
  caption,
  onUpdateCaption,
  stats = [],
  botones: botonesData = {},
  onUpdateBotones,
  whatsapp,
  telefono,
  nombreNegocio,
  seccionesDisponibles = [],
  editable,
  bgColor,
  headingColor,
  textColor,
  accent,
  palette = {},
}) {
  const handleImagen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) onUpdateHeroImagen?.(await uploadImage(file));
  };

  return (
    <section className="px-6 @lg:px-10 py-16 @lg:py-24" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-6xl mx-auto grid @lg:grid-cols-[1.15fr_0.85fr] gap-10 @lg:gap-16 items-center">
        <div>
          <Editable
            editable={editable}
            value={rubroLabel}
            onChange={onUpdateRubroLabel}
            tag="span"
            block
            styleKey="hero-barberia.rubroLabel"
            placeholder="Categoría · desde cuándo"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.2em] mb-4"
            maxLength={60}
          />
          <Editable
            editable={editable}
            value={titulo}
            onChange={onUpdateTitulo}
            tag="h1"
            block
            multiline
            styleKey="hero-barberia.titulo"
            placeholder="Título grande"
            style={{ color: headingColor || palette.ink, lineHeight: 0.9 }}
            className="font-serif uppercase text-5xl @lg:text-7xl tracking-tight mb-5"
            maxLength={80}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            styleKey="hero-barberia.descripcion"
            placeholder="Descripción breve"
            style={{ color: textColor || palette.inkSoft }}
            className="text-base leading-relaxed max-w-lg mb-7"
            maxLength={220}
          />
          <div className="flex flex-wrap gap-3 mb-8">
            <ButtonObject
              value={botonesData.primary}
              onChange={(patch) => onUpdateBotones?.({ ...botonesData, primary: { ...(botonesData.primary || {}), ...patch } })}
              editable={editable}
              seccionesDisponibles={seccionesDisponibles}
              nombreNegocio={nombreNegocio}
              defaultFuncion="whatsapp"
              defaultLabel="Reservar turno"
              defaultColor={accent}
              defaultTarget={whatsapp || telefono}
            />
            <ButtonObject
              value={botonesData.secondary}
              onChange={(patch) => onUpdateBotones?.({ ...botonesData, secondary: { ...(botonesData.secondary || {}), ...patch } })}
              editable={editable}
              seccionesDisponibles={seccionesDisponibles}
              nombreNegocio={nombreNegocio}
              defaultFuncion="seccion"
              defaultLabel="Ver precios"
              defaultColor={accent}
              outline
            />
          </div>
          {(stats.length > 0 || editable) && (
            <div className="flex gap-8 border-t pt-5" style={{ borderColor: palette.line }}>
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="font-serif text-2xl leading-none" style={{ color: accent }}>
                    {s.value}
                  </div>
                  <div className="font-mono text-[0.65rem] uppercase tracking-wide mt-1.5" style={{ color: palette.inkSoft }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <label
            className={`relative block w-full aspect-[4/5] bg-black/10 overflow-hidden ${editable ? 'cursor-pointer' : ''}`}
            title={editable ? 'Cambiar foto' : undefined}
          >
            {heroImagen ? (
              <img src={heroImagen} alt={nombreNegocio} className="w-full h-full object-cover" style={{ filter: 'grayscale(0.25) contrast(1.08)' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8" style={{ color: palette.inkSoft }} />
              </div>
            )}
            {editable && <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />}
          </label>
          <div
            className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: `${palette.bg}e6` }}
          >
            <span className="font-mono text-xs uppercase tracking-wide" style={{ color: palette.inkSoft }}>
              Hoy
            </span>
            <Editable
              editable={editable}
              value={caption}
              onChange={onUpdateCaption}
              tag="span"
              placeholder="X turnos libres"
              style={{ color: accent }}
              className="font-mono text-sm"
              maxLength={40}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// "Sobre nosotros" en el nuevo lenguaje editorial es foto + frase distintiva
// (quote en serif itálica) + texto de cuerpo — los datos de horarios/dirección/
// teléfono ya no viven acá, son responsabilidad exclusiva de Contacto.
function SeccionSobreNosotros({
  variant = 'split',
  titulo,
  onUpdateTitulo,
  quote,
  onUpdateQuote,
  sobreNosotros,
  editable,
  field,
  accent,
  palette = {},
  bgColor,
  headingColor,
  textColor,
  galeria,
  imagen,
  onUpdateImagen,
  firma,
  onUpdateFirma,
}) {
  const fondo = variant === 'fondo';
  // Si esta sección tiene su propia foto puesta a mano, esa gana — si no,
  // sigue mostrando la primera de la galería como hacía siempre (así ningún
  // sitio ya armado cambia por este agregado).
  const heroImg = imagen || galeria?.[0];
  const handleImagen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) onUpdateImagen?.(await uploadImage(file));
  };

  const eyebrow = (color) => (
    <Editable
      editable={editable}
      value={titulo ?? 'Sobre nosotros'}
      onChange={onUpdateTitulo}
      tag="span"
      block
      styleKey="sobrenosotros.titulo"
      style={{ color: headingColor || color }}
      className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
      maxLength={40}
    />
  );

  const quoteBlock = (color) => (
    <Editable
      editable={editable}
      value={quote}
      onChange={onUpdateQuote}
      tag="p"
      multiline
      block
      styleKey="sobrenosotros.quote"
      placeholder="Una frase corta que resuma cómo trabajás"
      style={{ color: color }}
      className="font-serif italic text-2xl @lg:text-3xl leading-snug mb-5 text-balance"
      maxLength={140}
    />
  );

  const bodyBlock = (color) => (
    <Editable
      editable={editable}
      value={sobreNosotros}
      onChange={field('sobreNosotros')}
      tag="p"
      multiline
      block
      styleKey="sobreNosotros.descripcion"
      placeholder="Contá de qué se trata tu negocio"
      style={{ color }}
      className="text-[15px] leading-relaxed"
    />
  );

  const firmaBlock = (color) =>
    (firma || editable) && (
      <Editable
        editable={editable}
        value={firma}
        onChange={onUpdateFirma}
        tag="p"
        block
        styleKey="sobrenosotros.firma"
        placeholder="Firma (opcional, ej: tu nombre)"
        style={{ color }}
        className="font-serif text-2xl mt-5"
        maxLength={40}
      />
    );

  if (fondo) {
    const fondoStyle = heroImg
      ? {
          backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.75), rgba(0,0,0,.35)), url(${heroImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : { background: palette.ink };
    return (
      <section className="relative px-6 @lg:px-10 py-16 @lg:py-24 overflow-hidden" style={fondoStyle}>
        <div className="max-w-2xl mx-auto text-center">
          {eyebrow(accent)}
          {quoteBlock('#ffffff')}
          {bodyBlock('rgba(255,255,255,0.82)')}
          {firmaBlock('#ffffff')}
        </div>
      </section>
    );
  }

  // "split" (default): foto vertical 3:4 de un lado, texto del otro.
  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-6xl mx-auto grid @lg:grid-cols-[0.85fr_1.15fr] gap-10 @lg:gap-16 items-center">
        <label
          className={`relative block aspect-[3/4] bg-black/5 overflow-hidden group/about ${editable ? 'cursor-pointer' : ''}`}
          title={editable ? 'Cambiar foto' : undefined}
        >
          {heroImg ? (
            <img src={heroImg} alt="" className="w-full h-full object-cover" style={{ filter: 'grayscale(0.15) contrast(1.05)' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-center px-4" style={{ color: palette.inkSoft }}>
              Agregá una foto en tu galería
            </div>
          )}
          {editable && (
            <>
              <span className="absolute inset-0 bg-black/0 group-hover/about:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/about:opacity-100">
                <span className="text-white text-xs font-semibold">Cambiar foto</span>
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />
            </>
          )}
        </label>
        <div>
          {eyebrow(accent)}
          {quoteBlock(headingColor || palette.ink)}
          {bodyBlock(textColor || palette.inkSoft)}
          {firmaBlock(accent)}
        </div>
      </div>
    </section>
  );
}

const FOOTER_BUTTON_SLOTS = [
  { key: 'primary', defaultFuncion: 'whatsapp', defaultLabel: 'WhatsApp' },
  { key: 'secondary', defaultFuncion: 'enlace', defaultLabel: 'Instagram' },
];

// Wordmark + (opcional) links sociales en texto plano + crédito — siempre con
// una línea/borde arriba que separa del contenido, nunca una card oscura con
// sombra.
function SeccionFooter({
  variant = 'simple',
  nombreNegocio,
  whatsapp,
  instagram,
  accent,
  bgColor,
  textColor,
  editable,
  palette = {},
  botones: botonesData = {},
  onUpdateBotones,
  bajada,
  onUpdateBajada,
  seccionesDisponibles = [],
  mediosPago = [],
  onUpdateMediosPago,
  contactoLineas = [],
  onUpdateContactoLineas,
  titulo,
  onUpdateTitulo,
  hashtag,
  onUpdateHashtag,
}) {
  const footerTargetDefaults = {
    primary: whatsapp,
    secondary: instagram ? `https://instagram.com/${instagram.replace('@', '')}` : undefined,
  };

  const links = (
    <div className="flex items-center gap-5">
      {FOOTER_BUTTON_SLOTS.map((slot) => {
        const v = botonesData[slot.key];
        const defaultTarget = footerTargetDefaults[slot.key];
        if (!buttonSlotVisible(editable, v, slot.defaultFuncion, defaultTarget)) return null;
        return (
          <ButtonObject
            key={slot.key}
            value={v}
            onChange={(patch) =>
              onUpdateBotones?.({ ...botonesData, [slot.key]: { ...(botonesData[slot.key] || {}), ...patch } })
            }
            editable={editable}
            seccionesDisponibles={seccionesDisponibles}
            nombreNegocio={nombreNegocio}
            defaultFuncion={slot.defaultFuncion}
            defaultLabel={slot.defaultLabel}
            defaultColor={palette.inkHex || '#171717'}
            defaultTarget={defaultTarget}
            outline
            size="sm"
            className="!px-0 !py-0 !border-0"
          />
        );
      })}
    </div>
  );

  const wordmark = (
    <span className="font-serif italic text-lg" style={{ color: textColor || palette.ink }}>
      {nombreNegocio}
    </span>
  );

  const credito = (
    <span className="font-mono text-xs" style={{ color: textColor || palette.inkSoft }}>
      Sitio creado con SitioWeb Digital
    </span>
  );

  // "tienda" — 3 columnas (marca, medios de pago, contacto) sobre franja
  // oscura, pensada para negocios de venta de productos con varios medios de
  // pago para mostrar — a diferencia de "columnas" (una sola fila).
  if (variant === 'tienda') {
    const addMedioPago = () => {
      const v = window.prompt('Medio de pago (ej: Visa)');
      if (v?.trim()) onUpdateMediosPago?.([...mediosPago, v.trim()]);
    };
    const addContactoLinea = () => {
      const v = window.prompt('Línea de contacto (ej: 011 4444-5555)');
      if (v?.trim()) onUpdateContactoLineas?.([...contactoLineas, v.trim()]);
    };
    return (
      <footer className="px-6 @lg:px-10 pt-8 @lg:pt-11 pb-6 border-t" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
        <div className="max-w-6xl mx-auto grid @lg:grid-cols-3 gap-8 pb-7 border-b" style={{ borderColor: palette.line }}>
          <div>
            {wordmark}
            <Editable
              editable={editable}
              value={bajada}
              onChange={onUpdateBajada}
              tag="p"
              multiline
              styleKey="footer.bajada"
              placeholder="Bajada corta (opcional)"
              style={{ color: textColor || palette.inkSoft }}
              className="text-sm mt-3 max-w-xs"
              maxLength={140}
            />
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-wide mb-3" style={{ color: accent || palette.inkSoft }}>
              Medios de pago
            </div>
            <div className="flex flex-wrap gap-1.5">
              {mediosPago.map((pm, i) => (
                <span
                  key={i}
                  className="relative group/pago text-xs border px-2.5 py-1"
                  style={{ borderColor: palette.line, color: textColor || palette.inkSoft }}
                >
                  {pm}
                  {editable && (
                    <button
                      type="button"
                      onClick={() => onUpdateMediosPago?.(mediosPago.filter((_, mi) => mi !== i))}
                      aria-label={`Quitar ${pm}`}
                      className="ml-1 opacity-50 hover:opacity-100"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={addMedioPago}
                  className="text-xs border-2 border-dashed px-2.5 py-1"
                  style={{ borderColor: palette.line, color: palette.inkSoft }}
                >
                  + Agregar
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase tracking-wide mb-3" style={{ color: accent || palette.inkSoft }}>
              Contacto
            </div>
            <div className="flex flex-col gap-1.5 text-sm" style={{ color: textColor || palette.inkSoft }}>
              {contactoLineas.map((linea, i) => (
                <div key={i} className="relative group/linea flex items-center gap-2">
                  <Editable
                    editable={editable}
                    value={linea}
                    onChange={(v) => onUpdateContactoLineas?.(contactoLineas.map((l, li) => (li === i ? v : l)))}
                    tag="span"
                    placeholder="Línea de contacto"
                    maxLength={60}
                  />
                  {editable && (
                    <button
                      type="button"
                      onClick={() => onUpdateContactoLineas?.(contactoLineas.filter((_, li) => li !== i))}
                      aria-label="Quitar línea"
                      className="opacity-40 hover:opacity-100"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={addContactoLinea}
                  className="text-xs underline decoration-dotted opacity-60 hover:opacity-100 self-start mt-1"
                >
                  + Agregar línea
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 pt-5">
          {links}
          {credito}
        </div>
      </footer>
    );
  }

  if (variant === 'columnas') {
    return (
      <footer
        className="px-6 @lg:px-10 py-8 border-t"
        style={{ background: bgColor || palette.bg, borderColor: palette.line }}
      >
        <div className="max-w-6xl mx-auto flex flex-col @lg:flex-row items-center justify-between gap-4">
          {wordmark}
          {links}
          {credito}
        </div>
      </footer>
    );
  }

  // Con formulario de newsletter — foco puesto en sumar contactos para
  // avisos de novedades/descuentos, no en los links de siempre (WhatsApp,
  // Instagram), que acá quedan afuera. El formulario es solo visual (no
  // hay todavía un servicio real de newsletter conectado del otro lado).
  if (variant === 'newsletter') {
    return (
      <footer
        className="px-6 @lg:px-10 py-10 @lg:py-14 border-t"
        style={{ background: bgColor || palette.bg, borderColor: palette.line }}
      >
        <div className="max-w-6xl mx-auto grid @lg:grid-cols-2 gap-8 items-center mb-6">
          <div>
            <p className="font-serif italic text-xl mb-1.5" style={{ color: textColor || palette.ink }}>
              {nombreNegocio}
            </p>
            <Editable
              editable={editable}
              value={bajada ?? 'Sumate para enterarte de novedades.'}
              onChange={onUpdateBajada}
              tag="p"
              multiline
              styleKey="footer.bajada"
              placeholder="Bajada corta (ej: sumate para enterarte de novedades)"
              style={{ color: textColor || palette.inkSoft }}
              className="text-sm max-w-sm"
              maxLength={140}
            />
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 @lg:justify-self-end w-full @lg:max-w-sm">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 min-w-0 border px-4 py-2.5 text-sm bg-transparent outline-none"
              style={{ borderColor: palette.line, color: palette.ink }}
            />
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold shrink-0"
              style={{ background: palette.inkHex || '#171717', color: '#ffffff' }}
            >
              Sumarme
            </button>
          </form>
        </div>
        <div className="max-w-6xl mx-auto pt-4 border-t" style={{ borderColor: palette.line }}>
          {credito}
        </div>
      </footer>
    );
  }

  // "evento" — pensada para invitaciones (XV, casamientos): un cierre grande
  // y personal ("Nos vemos ahí") en vez de la marca del negocio, un hashtag
  // del evento, y 3 links de acción (a diferencia de los 2 fijos del resto
  // de variantes, acá "Confirmar asistencia" y "Cómo llegar" son atajos a
  // otras secciones de la misma página, además del WhatsApp de siempre).
  if (variant === 'evento') {
    const eventoSlots = [
      { key: 'confirmar', defaultFuncion: 'seccion', defaultLabel: 'Confirmar asistencia' },
      { key: 'llegar', defaultFuncion: 'seccion', defaultLabel: 'Cómo llegar' },
      { key: 'whatsapp', defaultFuncion: 'whatsapp', defaultLabel: 'Escribir por WhatsApp' },
    ];
    return (
      <footer className="px-6 @lg:px-10 py-14 @lg:py-16 text-center" style={{ background: bgColor || palette.inkHex || '#171717', color: textColor || '#ffffff' }}>
        <Editable
          editable={editable}
          value={titulo ?? 'Nos vemos ahí'}
          onChange={onUpdateTitulo}
          tag="p"
          block
          styleKey="footer.evento.titulo"
          style={{ color: textColor || '#ffffff' }}
          className="font-serif text-4xl @lg:text-6xl mb-2.5 text-balance"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={hashtag}
          onChange={onUpdateHashtag}
          tag="p"
          block
          placeholder="#Hashtag"
          style={{ color: accent }}
          className="font-serif tracking-[0.22em] text-base mb-8"
          maxLength={30}
        />
        <div className="flex flex-wrap justify-center gap-6 text-sm mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {eventoSlots.map((slot) => {
            const v = botonesData[slot.key];
            const defaultTarget = slot.key === 'whatsapp' ? whatsapp : undefined;
            if (!buttonSlotVisible(editable, v, slot.defaultFuncion, defaultTarget)) return null;
            return (
              <ButtonObject
                key={slot.key}
                value={v}
                onChange={(patch) => onUpdateBotones?.({ ...botonesData, [slot.key]: { ...(botonesData[slot.key] || {}), ...patch } })}
                editable={editable}
                seccionesDisponibles={seccionesDisponibles}
                nombreNegocio={nombreNegocio}
                defaultFuncion={slot.defaultFuncion}
                defaultLabel={slot.defaultLabel}
                defaultColor="rgba(255,255,255,0.65)"
                defaultTarget={defaultTarget}
                outline
                size="sm"
                className="!px-0 !py-0 !border-0"
              />
            );
          })}
        </div>
        <p className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Sitio creado con SitioWeb Digital
        </p>
      </footer>
    );
  }

  if (variant === 'minimal') {
    return (
      <footer
        className="px-6 @lg:px-10 py-6 text-center border-t"
        style={{ background: bgColor || palette.bg, borderColor: palette.line }}
      >
        <div className="flex items-center justify-center gap-5 mb-4 flex-wrap">{links}</div>
        <p className="font-mono text-xs" style={{ color: textColor || palette.inkSoft }}>
          {nombreNegocio} — Sitio creado con SitioWeb Digital
        </p>
      </footer>
    );
  }

  // El nombre del negocio ocupa casi todo el ancho, gigante — pensado para
  // marcas con un nombre corto que quieren un cierre editorial/con carácter
  // en vez de un footer chico y discreto como el resto de las variantes.
  if (variant === 'gigante') {
    return (
      <footer className="border-t overflow-hidden" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
        <div className="px-6 @lg:px-10 py-8 @lg:py-12">
          <p
            className="font-serif leading-[0.9] tracking-tight mb-7"
            style={{ color: palette.line, fontSize: 'clamp(2.5rem,10vw,7rem)' }}
          >
            {nombreNegocio}
          </p>
          <div className="flex flex-wrap justify-between items-center gap-4 border-t pt-5" style={{ borderColor: palette.line }}>
            {links}
            {credito}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className="px-6 @lg:px-10 py-8 text-center border-t"
      style={{ background: bgColor || palette.bg, borderColor: palette.line }}
    >
      <p className="font-serif italic text-lg mb-1" style={{ color: textColor || palette.ink }}>
        {nombreNegocio}
      </p>
      <p className="font-mono text-xs" style={{ color: textColor || palette.inkSoft }}>
        Sitio creado con SitioWeb Digital
      </p>
    </footer>
  );
}

// Popover para elegir la animación del objeto Imagen — mismo esquema visual
// que el selector de distribuciones de una sección (esqueletos + label), pero
// acotado a un objeto imagen puntual dentro de la sección.
function MediaAnimationPicker({ value, onChange, onClose, anchorRef }) {
  return (
    <FixedPopover
      anchorRef={anchorRef}
      align="center"
      onClose={onClose}
      className="w-64 rounded-xl border border-neutral-200 bg-white shadow-xl p-3 text-left"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2 px-1">Animación de la foto</p>
      <div className="grid grid-cols-2 gap-2">
        {MEDIA_ANIMATIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onChange(a.id)}
            aria-label={a.label}
            title={a.desc}
            className={`rounded-lg border transition-colors p-2 text-center ${
              a.id === value
                ? 'border-gold-500 bg-gold-500/5'
                : 'border-neutral-200 hover:border-gold-500 hover:bg-gold-500/5'
            }`}
          >
            <div className="h-12 rounded-md bg-neutral-50 border border-neutral-100 mb-1.5 p-2 flex items-center justify-center overflow-hidden">
              <VariantSkeleton kind={a.skeleton} />
            </div>
            <span className="text-[11px] font-semibold text-neutral-700">{a.label}</span>
          </button>
        ))}
      </div>
    </FixedPopover>
  );
}

// Objeto Imagen: reemplaza los 3 carruseles que antes vivían copiados por
// separado en Productos, Galería y FAQ. Además de cargar/quitar fotos, deja
// elegir su "animación" (estática, carrusel manual, automático, o zoom suave)
// desde el mismo tipo de selector de esqueletos que usan las distribuciones.
function MediaCarousel({
  images = [],
  editable,
  onAddImages,
  onRemoveImage,
  onReplaceImage,
  mediaVariant = 'manual',
  onChangeMediaVariant,
  aspect = 'aspect-video',
  rounded = '',
  emptyLabel = 'Agregar fotos',
  limitKey = 'galeria',
}) {
  const [idx, setIdx] = useState(0);
  const [animOpen, setAnimOpen] = useState(false);
  const toolbarRef = useRef(null);
  const current = Math.min(idx, Math.max(images.length - 1, 0));
  const isAuto = mediaVariant === 'auto';
  const isZoom = mediaVariant === 'zoom';
  const isEstatica = mediaVariant === 'estatica';

  // Carrusel automático: avanza sola cada 3.5s mientras haya más de una foto.
  useEffect(() => {
    if (!isAuto || images.length < 2) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 3500);
    return () => clearInterval(t);
  }, [isAuto, images.length]);

  // MOCK: las fotos se guardan como blob URLs locales — en producción se subirían
  // a un storage real (S3, etc) y acá se guardaría la URL pública resultante.
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const ok = await validateImageFiles(files, limitKey);
    if (ok.length) onAddImages?.(ok);
  };
  const handleReplace = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (await validateImageFile(file, limitKey)) onReplaceImage?.(current, file);
  };

  if (images.length === 0) {
    if (!editable) return null;
    return (
      <label
        className={`flex flex-col items-center justify-center gap-1.5 ${aspect} ${rounded} bg-neutral-100 border-2 border-dashed border-black/15 text-neutral-400 cursor-pointer hover:bg-neutral-200/60 hover:text-neutral-500 transition-colors`}
      >
        <ImageIcon className="w-6 h-6" />
        <span className="text-xs font-semibold">{emptyLabel}</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </label>
    );
  }

  const showNav = !isEstatica && images.length > 1;

  return (
    <div className={`relative ${aspect} ${rounded} bg-neutral-100 overflow-hidden group/media`}>
      <img
        key={isZoom ? current : undefined}
        src={images[current]}
        alt=""
        className={`w-full h-full object-cover ${isZoom ? 'animate-kenburns' : ''}`}
      />
      {editable && (
        <div
          ref={toolbarRef}
          className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover/media:opacity-100 transition-opacity"
        >
          {onChangeMediaVariant && (
            <button
              type="button"
              onClick={() => setAnimOpen((v) => !v)}
              title="Animación de la foto"
              aria-label="Animación de la foto"
              className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <SparkIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {onReplaceImage && (
            <label
              title="Cambiar esta foto"
              className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
            >
              <PencilIcon className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleReplace} />
            </label>
          )}
          <label
            title="Agregar más fotos"
            className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </label>
          <button
            type="button"
            onClick={() => onRemoveImage?.(current)}
            aria-label="Quitar esta foto"
            className="w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {showNav && (
        <>
          <button
            type="button"
            onClick={() => setIdx((current - 1 + images.length) % images.length)}
            aria-label="Foto anterior"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIdx((current + 1) % images.length)}
            aria-label="Foto siguiente"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
      {animOpen && onChangeMediaVariant && (
        <MediaAnimationPicker
          value={mediaVariant}
          onChange={(v) => {
            onChangeMediaVariant(v);
            setAnimOpen(false);
          }}
          onClose={() => setAnimOpen(false)}
          anchorRef={toolbarRef}
        />
      )}
    </div>
  );
}

// Galería de fotos con dos disposiciones: grilla (todas visibles) o carrusel.
// En modo edición cada foto se puede reemplazar por una propia, quitar, o sumar nuevas.
function SeccionGaleria({
  images = [],
  variant = 'grid',
  titulo,
  onUpdateTitulo,
  editable,
  bgColor,
  headingColor,
  palette = {},
  onShuffle,
  onReplace,
  onAddMany,
  onRemove,
  mediaVariant,
  onChangeMediaVariant,
}) {
  // MOCK: las fotos propias se guardan como blob URLs locales — en producción se
  // subirían a un storage real (S3, etc) y acá se guardaría la URL pública.
  const handleReplace = (i) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (await validateImageFile(file, 'galeria')) onReplace?.(i, await uploadImage(file));
  };
  const handleAddFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const ok = await validateImageFiles(files, 'galeria');
    if (ok.length) onAddMany?.(await Promise.all(ok.map(uploadImage)));
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20 border-b" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 mb-8 pb-6 border-b" style={{ borderColor: palette.line }}>
        <Editable
          editable={editable}
          value={titulo ?? 'Nuestro trabajo'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="galeria.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif italic text-2xl @lg:text-3xl"
          maxLength={70}
        />
        {editable && images.length > 0 && (
          <button
            type="button"
            onClick={onShuffle}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide border px-3 py-1.5 transition-colors shrink-0"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            Fotos aleatorias
          </button>
        )}
      </div>

      {variant === 'carousel' ? (
        <div className="max-w-2xl mx-auto">
          <MediaCarousel
            images={images}
            editable={editable}
            onAddImages={async (files) => onAddMany?.(await Promise.all(files.map(uploadImage)))}
            onRemoveImage={(i) => onRemove?.(i)}
            onReplaceImage={async (i, file) => onReplace?.(i, await uploadImage(file))}
            mediaVariant={mediaVariant}
            onChangeMediaVariant={onChangeMediaVariant}
            aspect="aspect-video"
            rounded="rounded-xl"
            emptyLabel="Sin fotos todavía"
            limitKey="galeria"
          />
          {editable && images.length > 0 && (
            <label className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-black/15 py-2.5 text-sm font-semibold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-600 cursor-pointer transition-colors">
              <PlusIcon className="w-3.5 h-3.5" /> Agregar fotos
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddFiles} />
            </label>
          )}
        </div>
      ) : variant === 'scroll' ? (
        <div className="max-w-6xl mx-auto -mx-6 @lg:mx-0 px-6 @lg:px-0">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-3">
            {images.map((img, i) => (
              <div key={i} className="relative shrink-0 snap-center w-[230px] @lg:w-[300px] aspect-[3/4] bg-black/5 overflow-hidden group/scrollimg">
                <img src={img} alt="" className="w-full h-full object-cover" />
                {editable && (
                  <>
                    <label className="absolute inset-0 bg-black/0 group-hover/scrollimg:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/scrollimg:opacity-100 cursor-pointer">
                      <span className="text-white text-xs font-semibold">Cambiar</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleReplace(i)} />
                    </label>
                    <button
                      type="button"
                      onClick={() => onRemove?.(i)}
                      aria-label="Quitar foto"
                      className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white flex items-center justify-center"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {editable && (
              <label className="shrink-0 w-[230px] @lg:w-[300px] aspect-[3/4] border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-sm font-semibold cursor-pointer" style={{ borderColor: palette.line, color: palette.inkSoft }}>
                <PlusIcon className="w-4 h-4" /> Agregar fotos
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddFiles} />
              </label>
            )}
          </div>
        </div>
      ) : variant === 'masonry' ? (
        <div className="max-w-4xl mx-auto columns-2 @lg:columns-3 gap-3 @lg:gap-4">
          {images.map((src, i) => (
            <div
              key={i}
              className={`relative mb-3 @lg:mb-4 break-inside-avoid overflow-hidden bg-black/5 group/gitem ${
                MASONRY_ASPECTS[i % MASONRY_ASPECTS.length]
              }`}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                style={{ filter: 'grayscale(0.15) contrast(1.05)' }}
              />
              {editable && (
                <>
                  <label
                    title="Cambiar esta foto"
                    className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors opacity-0 group-hover/gitem:opacity-100"
                  >
                    <PencilIcon className="w-3 h-3" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleReplace(i)} />
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemove?.(i)}
                    aria-label="Quitar esta foto"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover/gitem:opacity-100"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
          {editable && (
            <label
              className="mb-3 @lg:mb-4 break-inside-avoid aspect-square border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-5 h-5" />
              <span className="text-xs font-semibold">Agregar</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddFiles} />
            </label>
          )}
        </div>
      ) : variant === 'bento' ? (
        <div className="max-w-4xl mx-auto grid grid-cols-2 @lg:grid-cols-3 auto-rows-[140px] @lg:auto-rows-[180px] gap-3 @lg:gap-4">
          {images.map((src, i) => (
            <div
              key={i}
              className={`relative overflow-hidden bg-black/5 group/gitem ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                style={{ filter: 'grayscale(0.15) contrast(1.05)' }}
              />
              {editable && (
                <>
                  <label
                    title="Cambiar esta foto"
                    className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors opacity-0 group-hover/gitem:opacity-100"
                  >
                    <PencilIcon className="w-3 h-3" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleReplace(i)} />
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemove?.(i)}
                    aria-label="Quitar esta foto"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover/gitem:opacity-100"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
          {editable && (
            <label
              className="aspect-square border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-5 h-5" />
              <span className="text-xs font-semibold">Agregar</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddFiles} />
            </label>
          )}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-2 @lg:grid-cols-4 gap-3 @lg:gap-4">
          {images.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden bg-black/5 group/gitem">
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                style={{ filter: 'grayscale(0.15) contrast(1.05)' }}
              />
              {editable && (
                <>
                  <label
                    title="Cambiar esta foto"
                    className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors opacity-0 group-hover/gitem:opacity-100"
                  >
                    <PencilIcon className="w-3 h-3" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleReplace(i)} />
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemove?.(i)}
                    aria-label="Quitar esta foto"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors opacity-0 group-hover/gitem:opacity-100"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
          {editable && (
            <label
              className="aspect-square border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-5 h-5" />
              <span className="text-xs font-semibold">Agregar</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddFiles} />
            </label>
          )}
        </div>
      )}
    </section>
  );
}

// Alterna proporciones para que el masonry no quede parejo como una grilla —
// nada de medir la imagen real, solo variedad visual predecible por índice.
const MASONRY_ASPECTS = ['aspect-square', 'aspect-[3/4]', 'aspect-[4/3]', 'aspect-[3/4]', 'aspect-square'];

const PRODUCTOS_GRID_COLS = {
  'grid-3': '@lg:grid-cols-3',
  'grid-4': '@lg:grid-cols-4',
  'grid-5': '@lg:grid-cols-5',
};

function SeccionProductos({
  accent,
  palette = {},
  bgColor,
  headingColor,
  buttonColor,
  variant = 'grid-3',
  titulo,
  onUpdateTitulo,
  productos = [],
  editable = false,
  onAddProducto,
  onRemoveProducto,
  onUpdateProducto,
  onAddProductoImagen,
  onRemoveProductoImagen,
  onDuplicateProducto,
  onMoveProducto,
  onToggleOcultoProducto,
  nombreNegocio,
  whatsapp,
  seccionesDisponibles = [],
  cartEnabled = false,
  onAddToCart,
  disclaimer,
  onUpdateDisclaimer,
  eyebrow,
  onUpdateEyebrow,
}) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [duracion, setDuracion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');
  const btnColor = buttonColor || palette.inkHex || '#171717';

  const submit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onAddProducto?.({ nombre, precio, duracion, categoria });
    setNombre('');
    setPrecio('');
    setDuracion('');
    setCategoria('');
  };

  const categorias = Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean)));
  const productosVisibles = editable ? productos : productos.filter((p) => !p.oculto);
  const productosFiltrados =
    categoriaFiltro === 'Todos' ? productosVisibles : productosVisibles.filter((p) => p.categoria === categoriaFiltro);

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto flex items-baseline justify-between gap-3 mb-8 pb-5 border-b" style={{ borderColor: palette.line }}>
        <div>
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="productos.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Productos y servicios'}
            onChange={onUpdateTitulo}
            tag="h2"
            styleKey="productos.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif italic text-2xl @lg:text-3xl"
            maxLength={70}
          />
        </div>
        <span className="font-mono text-xs" style={{ color: palette.inkSoft }}>
          {productos.length} destacado{productos.length === 1 ? '' : 's'}
        </span>
      </div>
      {productos.length === 0 && !editable ? (
        <p className="text-center text-sm max-w-sm mx-auto" style={{ color: palette.inkSoft }}>
          Todavía no cargaste productos o servicios.
        </p>
      ) : variant === 'bento' ? (
        <div className="max-w-5xl mx-auto grid grid-cols-2 @lg:grid-cols-3 auto-rows-[140px] @lg:auto-rows-[180px] gap-3 @lg:gap-4">
          {(editable ? productos : productos.filter((p) => !p.oculto)).map((p, i, arr) => (
            <div
              key={p.id}
              className={`relative overflow-hidden group/bento ${i === 0 ? 'col-span-2 row-span-2' : ''} ${
                p.oculto ? 'opacity-40' : ''
              }`}
              style={{ background: 'rgba(0,0,0,0.05)' }}
            >
              <label className={`absolute inset-0 ${editable ? 'cursor-pointer' : ''}`} title={editable ? 'Cambiar foto' : undefined}>
                {p.imagenes?.[0] ? (
                  <img
                    src={p.imagenes[0]}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ filter: 'grayscale(0.1) contrast(1.05)' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: palette.inkSoft }}>
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                {editable && (
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file && (await validateImageFile(file, 'productos'))) {
                        onAddProductoImagen?.(p.id, await uploadImage(file));
                      }
                    }}
                  />
                )}
              </label>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent 50%)' }}
              />
              <div className="absolute left-4 right-4 bottom-3 flex items-end justify-between gap-2">
                <Editable
                  editable={editable}
                  value={p.nombre}
                  onChange={(v) => onUpdateProducto?.(p.id, { nombre: v })}
                  tag="p"
                  styleKey={`producto.${p.id}.nombre`}
                  placeholder="Nombre del producto"
                  style={{ color: '#ffffff' }}
                  className="font-serif italic text-base @lg:text-lg"
                  maxLength={60}
                />
                <Editable
                  editable={editable}
                  value={p.precio}
                  onChange={(v) => onUpdateProducto?.(p.id, { precio: Number(v) || 0 })}
                  tag="p"
                  type="number"
                  styleKey={`producto.${p.id}.precio`}
                  format={(v) => `$${Number(v || 0).toLocaleString('es-AR')}`}
                  style={{ color: '#ffffff' }}
                  className="font-mono font-bold text-sm whitespace-nowrap"
                />
              </div>
              {editable && (
                <div className="absolute top-2 right-2 opacity-0 group-hover/bento:opacity-100 transition-opacity">
                  <ItemToolbar
                    variant="overlay"
                    oculto={p.oculto}
                    canMoveUp={i > 0}
                    canMoveDown={i < arr.length - 1}
                    onMoveUp={() => onMoveProducto?.(p.id, -1)}
                    onMoveDown={() => onMoveProducto?.(p.id, 1)}
                    onDuplicate={() => onDuplicateProducto?.(p.id)}
                    onToggleOculto={() => onToggleOcultoProducto?.(p.id)}
                    onRemove={() => onRemoveProducto?.(p.id)}
                    removeLabel={`Quitar ${p.nombre}`}
                  />
                </div>
              )}
            </div>
          ))}
          {editable && (
            <form
              onSubmit={submit}
              className="border-2 border-dashed p-4 flex flex-col gap-2 justify-center"
              style={{ borderColor: palette.line }}
            >
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del producto"
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                type="number"
                min="0"
                placeholder="Precio"
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 text-white shrink-0"
                style={{ background: btnColor }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar
              </button>
            </form>
          )}
        </div>
      ) : variant === 'fila' ? (
        <div className="max-w-3xl mx-auto flex flex-col">
          {(editable ? productos : productos.filter((p) => !p.oculto)).map((p, i, arr) => (
            <div
              key={p.id}
              className={`flex items-center gap-5 py-5 border-b ${p.oculto ? 'opacity-40' : ''}`}
              style={{ borderColor: palette.line }}
            >
              <label
                className={`relative shrink-0 w-24 h-24 @lg:w-28 @lg:h-28 bg-black/5 flex items-center justify-center ${
                  editable ? 'cursor-pointer' : ''
                }`}
                title={editable ? 'Cambiar foto' : undefined}
              >
                {p.imagenes?.[0] ? (
                  <img
                    src={p.imagenes[0]}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ filter: 'grayscale(0.15) contrast(1.05)' }}
                  />
                ) : (
                  <ImageIcon className="w-5 h-5" style={{ color: palette.inkSoft }} />
                )}
                {editable && (
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file && (await validateImageFile(file, 'productos'))) {
                        onAddProductoImagen?.(p.id, await uploadImage(file));
                      }
                    }}
                  />
                )}
              </label>
              <div className="min-w-0 flex-1">
                <Editable
                  editable={editable}
                  value={p.nombre}
                  onChange={(v) => onUpdateProducto?.(p.id, { nombre: v })}
                  tag="p"
                  block
                  styleKey={`producto.${p.id}.nombre`}
                  placeholder="Nombre del producto"
                  style={{ color: palette.ink }}
                  className="font-serif text-lg @lg:text-xl mb-1"
                  maxLength={60}
                />
                <Editable
                  editable={editable}
                  value={p.desc}
                  onChange={(v) => onUpdateProducto?.(p.id, { desc: v })}
                  tag="p"
                  block
                  multiline
                  styleKey={`producto.${p.id}.desc`}
                  placeholder="Descripción corta"
                  style={{ color: palette.inkSoft }}
                  className="text-sm"
                  maxLength={140}
                />
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <Editable
                  editable={editable}
                  value={p.precio}
                  onChange={(v) => onUpdateProducto?.(p.id, { precio: Number(v) || 0 })}
                  tag="p"
                  type="number"
                  styleKey={`producto.${p.id}.precio`}
                  format={(v) => `$${Number(v || 0).toLocaleString('es-AR')}`}
                  style={{ color: accent }}
                  className="font-mono font-bold text-base @lg:text-lg whitespace-nowrap"
                />
                {editable && (
                  <ItemToolbar
                    variant="inline"
                    color={palette.ink}
                    oculto={p.oculto}
                    canMoveUp={i > 0}
                    canMoveDown={i < arr.length - 1}
                    onMoveUp={() => onMoveProducto?.(p.id, -1)}
                    onMoveDown={() => onMoveProducto?.(p.id, 1)}
                    onDuplicate={() => onDuplicateProducto?.(p.id)}
                    onToggleOculto={() => onToggleOcultoProducto?.(p.id)}
                    onRemove={() => onRemoveProducto?.(p.id)}
                    removeLabel={`Quitar ${p.nombre}`}
                  />
                )}
              </div>
            </div>
          ))}
          {editable && (
            <form
              onSubmit={submit}
              className="flex flex-wrap gap-2 items-center py-4 border-b border-dashed"
              style={{ borderColor: palette.line }}
            >
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del producto"
                className="flex-1 min-w-[160px] border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                type="number"
                min="0"
                placeholder="Precio"
                className="w-28 border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 text-white shrink-0"
                style={{ background: btnColor }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar
              </button>
            </form>
          )}
        </div>
      ) : variant === 'lista' ? (
        <div className="max-w-5xl mx-auto grid @lg:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-0">
          {(editable ? productos : productos.filter((p) => !p.oculto)).map((p, i, arr) => (
            <div
              key={p.id}
              className={`relative border-r border-b pr-7 pb-7 mr-7 mb-7 ${p.oculto ? 'opacity-40' : ''}`}
              style={{ borderColor: palette.line }}
            >
              {editable && (
                <div className="absolute top-0 right-0">
                  <ItemToolbar
                    variant="inline"
                    color={palette.ink}
                    oculto={p.oculto}
                    canMoveUp={i > 0}
                    canMoveDown={i < arr.length - 1}
                    onMoveUp={() => onMoveProducto?.(p.id, -1)}
                    onMoveDown={() => onMoveProducto?.(p.id, 1)}
                    onDuplicate={() => onDuplicateProducto?.(p.id)}
                    onToggleOculto={() => onToggleOcultoProducto?.(p.id)}
                    onRemove={() => onRemoveProducto?.(p.id)}
                    removeLabel={`Quitar ${p.nombre}`}
                  />
                </div>
              )}
              <label
                className={`relative block w-full aspect-square bg-black/5 mb-4 flex items-center justify-center ${
                  editable ? 'cursor-pointer' : ''
                }`}
                title={editable ? 'Cambiar foto' : undefined}
              >
                {p.imagenes?.[0] ? (
                  <img
                    src={p.imagenes[0]}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ filter: 'grayscale(0.15) contrast(1.05)' }}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6" style={{ color: palette.inkSoft }} />
                )}
                {editable && (
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file && (await validateImageFile(file, 'productos'))) {
                        onAddProductoImagen?.(p.id, await uploadImage(file));
                      }
                    }}
                  />
                )}
              </label>
              <Editable
                editable={editable}
                value={p.nombre}
                onChange={(v) => onUpdateProducto?.(p.id, { nombre: v })}
                tag="p"
                block
                styleKey={`producto.${p.id}.nombre`}
                placeholder="Nombre del producto"
                style={{ color: palette.ink }}
                className="font-serif text-xl mb-1"
                maxLength={60}
              />
              <Editable
                editable={editable}
                value={p.desc}
                onChange={(v) => onUpdateProducto?.(p.id, { desc: v })}
                tag="p"
                block
                multiline
                styleKey={`producto.${p.id}.desc`}
                placeholder="Descripción corta"
                style={{ color: palette.inkSoft }}
                className="text-sm mb-2.5"
                maxLength={140}
              />
              <Editable
                editable={editable}
                value={p.precio}
                onChange={(v) => onUpdateProducto?.(p.id, { precio: Number(v) || 0 })}
                tag="p"
                type="number"
                styleKey={`producto.${p.id}.precio`}
                format={(v) => `$${Number(v || 0).toLocaleString('es-AR')}`}
                style={{ color: accent }}
                className="font-mono font-bold text-base"
              />
            </div>
          ))}
          {editable && (
            <form
              onSubmit={submit}
              className="border-2 border-dashed p-4 flex flex-col gap-2 justify-center"
              style={{ borderColor: palette.line }}
            >
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del producto"
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                type="number"
                min="0"
                placeholder="Precio"
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 text-white shrink-0"
                style={{ background: btnColor }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar
              </button>
            </form>
          )}
        </div>
      ) : variant === 'servicios' ? (
        <div className="max-w-5xl mx-auto grid grid-cols-2 @lg:grid-cols-4 gap-4">
          {(editable ? productos : productos.filter((p) => !p.oculto)).map((p, i, arr) => (
            <div
              key={p.id}
              className={`relative border p-5 flex flex-col gap-1 ${p.oculto ? 'opacity-40' : ''}`}
              style={{ borderColor: palette.line }}
            >
              {editable && (
                <div className="absolute top-2 right-2">
                  <ItemToolbar
                    variant="inline"
                    color={palette.ink}
                    oculto={p.oculto}
                    canMoveUp={i > 0}
                    canMoveDown={i < arr.length - 1}
                    onMoveUp={() => onMoveProducto?.(p.id, -1)}
                    onMoveDown={() => onMoveProducto?.(p.id, 1)}
                    onDuplicate={() => onDuplicateProducto?.(p.id)}
                    onToggleOculto={() => onToggleOcultoProducto?.(p.id)}
                    onRemove={() => onRemoveProducto?.(p.id)}
                    removeLabel={`Quitar ${p.nombre}`}
                  />
                </div>
              )}
              <Editable
                editable={editable}
                value={p.nombre}
                onChange={(v) => onUpdateProducto?.(p.id, { nombre: v })}
                tag="p"
                block
                styleKey={`producto.${p.id}.nombre`}
                placeholder="Nombre del servicio"
                style={{ color: palette.ink }}
                className="font-serif text-base leading-snug pr-4"
                maxLength={60}
              />
              <Editable
                editable={editable}
                value={p.duracion}
                onChange={(v) => onUpdateProducto?.(p.id, { duracion: v })}
                tag="p"
                block
                styleKey={`producto.${p.id}.duracion`}
                placeholder="Duración (ej: 45 min)"
                style={{ color: palette.inkSoft }}
                className="text-xs"
                maxLength={30}
              />
              <Editable
                editable={editable}
                value={p.precio}
                onChange={(v) => onUpdateProducto?.(p.id, { precio: Number(v) || 0 })}
                tag="p"
                type="number"
                styleKey={`producto.${p.id}.precio`}
                format={(v) => `$${Number(v || 0).toLocaleString('es-AR')}`}
                style={{ color: accent }}
                className="font-mono font-bold text-sm mt-2"
              />
            </div>
          ))}
          {editable && (
            <form
              onSubmit={submit}
              className="border-2 border-dashed p-4 flex flex-col gap-2 justify-center"
              style={{ borderColor: palette.line }}
            >
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del servicio"
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <input
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                placeholder="Duración (ej: 45 min)"
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                type="number"
                min="0"
                placeholder="Precio"
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 text-white shrink-0"
                style={{ background: btnColor }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar
              </button>
            </form>
          )}
        </div>
      ) : variant === 'destacada' ? (
        <div className="max-w-5xl mx-auto">
          {categorias.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-8">
              {['Todos', ...categorias].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoriaFiltro(c)}
                  className="font-mono text-xs uppercase tracking-wide px-3 py-1.5 border transition-colors"
                  style={
                    categoriaFiltro === c
                      ? { borderColor: accent, background: accent, color: palette.bg }
                      : { borderColor: palette.line, color: palette.inkSoft }
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          {(() => {
            const featured = productosFiltrados[0];
            const rest = productosFiltrados.slice(1, 5);
            if (!featured) return null;
            const gridCols =
              rest.length >= 4
                ? '1.5fr 1fr 1fr'
                : rest.length === 3
                  ? 'repeat(4,1fr)'
                  : rest.length === 2
                    ? '1.3fr 1fr 1fr'
                    : rest.length === 1
                      ? '1.2fr 1fr'
                      : '1fr';
            return (
              <div className="grid gap-5" style={{ gridTemplateColumns: gridCols }}>
                <div className="flex flex-col" style={{ gridRow: rest.length >= 4 ? 'span 2' : 'auto' }}>
                  <label
                    className={`relative block w-full flex-1 min-h-[300px] max-h-[520px] bg-black/5 overflow-hidden ${editable ? 'cursor-pointer' : ''}`}
                    title={editable ? 'Cambiar foto' : undefined}
                  >
                    {featured.imagenes?.[0] ? (
                      <img
                        src={featured.imagenes[0]}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ filter: 'grayscale(0.1) contrast(1.03)' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6" style={{ color: palette.inkSoft }} />
                      </div>
                    )}
                    {editable && (
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (file && (await validateImageFile(file, 'productos'))) {
                            onAddProductoImagen?.(featured.id, await uploadImage(file));
                          }
                        }}
                      />
                    )}
                  </label>
                  <div className="pt-4 relative">
                    {editable && (
                      <div className="absolute top-3 right-0">
                        <ItemToolbar
                          variant="inline"
                          color={palette.ink}
                          oculto={featured.oculto}
                          onDuplicate={() => onDuplicateProducto?.(featured.id)}
                          onToggleOculto={() => onToggleOcultoProducto?.(featured.id)}
                          onRemove={() => onRemoveProducto?.(featured.id)}
                          removeLabel={`Quitar ${featured.nombre}`}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: accent }}>
                        Pieza destacada ·
                      </span>
                      <Editable
                        editable={editable}
                        value={featured.categoria}
                        onChange={(v) => onUpdateProducto?.(featured.id, { categoria: v })}
                        tag="span"
                        placeholder="Material"
                        style={{ color: accent }}
                        className="font-mono text-[10px] uppercase"
                        maxLength={30}
                      />
                    </div>
                    <Editable
                      editable={editable}
                      value={featured.nombre}
                      onChange={(v) => onUpdateProducto?.(featured.id, { nombre: v })}
                      tag="p"
                      block
                      styleKey={`producto.${featured.id}.nombre`}
                      placeholder="Nombre de la pieza"
                      style={{ color: palette.ink }}
                      className="font-serif text-xl mb-1"
                      maxLength={60}
                    />
                    <Editable
                      editable={editable}
                      value={featured.desc}
                      onChange={(v) => onUpdateProducto?.(featured.id, { desc: v })}
                      tag="p"
                      block
                      multiline
                      styleKey={`producto.${featured.id}.desc`}
                      placeholder="Descripción de la pieza"
                      style={{ color: palette.inkSoft }}
                      className="text-sm leading-relaxed mb-2 max-w-[34ch]"
                      maxLength={160}
                    />
                    <div className="flex items-baseline gap-2.5">
                      <Editable
                        editable={editable}
                        value={featured.precio}
                        onChange={(v) => onUpdateProducto?.(featured.id, { precio: v })}
                        tag="span"
                        placeholder="Precio"
                        style={{ color: palette.ink }}
                        className="font-mono font-bold text-base"
                        maxLength={20}
                      />
                      <Editable
                        editable={editable}
                        value={featured.etiqueta}
                        onChange={(v) => onUpdateProducto?.(featured.id, { etiqueta: v })}
                        tag="span"
                        placeholder="Stock (ej: 3 disponibles)"
                        style={{ color: palette.inkSoft }}
                        className="font-mono text-xs"
                        maxLength={30}
                      />
                    </div>
                  </div>
                </div>
                {rest.map((p) => (
                  <div key={p.id} className="relative flex flex-col">
                    {editable && (
                      <div className="absolute top-2 right-2 z-10">
                        <ItemToolbar
                          variant="overlay"
                          oculto={p.oculto}
                          onDuplicate={() => onDuplicateProducto?.(p.id)}
                          onToggleOculto={() => onToggleOcultoProducto?.(p.id)}
                          onRemove={() => onRemoveProducto?.(p.id)}
                          removeLabel={`Quitar ${p.nombre}`}
                        />
                      </div>
                    )}
                    <label
                      className={`relative block w-full aspect-square bg-black/5 mb-3 overflow-hidden ${editable ? 'cursor-pointer' : ''}`}
                      title={editable ? 'Cambiar foto' : undefined}
                    >
                      {p.imagenes?.[0] ? (
                        <img
                          src={p.imagenes[0]}
                          alt=""
                          className="w-full h-full object-cover"
                          style={{ filter: 'grayscale(0.1) contrast(1.03)' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-5 h-5" style={{ color: palette.inkSoft }} />
                        </div>
                      )}
                      {editable && (
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (file && (await validateImageFile(file, 'productos'))) {
                              onAddProductoImagen?.(p.id, await uploadImage(file));
                            }
                          }}
                        />
                      )}
                    </label>
                    <Editable
                      editable={editable}
                      value={p.categoria}
                      onChange={(v) => onUpdateProducto?.(p.id, { categoria: v })}
                      tag="span"
                      placeholder="Material"
                      style={{ color: palette.inkSoft }}
                      className="font-mono text-[10px] uppercase tracking-wide mb-1"
                      maxLength={30}
                    />
                    <Editable
                      editable={editable}
                      value={p.nombre}
                      onChange={(v) => onUpdateProducto?.(p.id, { nombre: v })}
                      tag="p"
                      block
                      styleKey={`producto.${p.id}.nombre`}
                      placeholder="Nombre"
                      style={{ color: palette.ink }}
                      className="font-serif text-[1.05rem] mb-1"
                      maxLength={50}
                    />
                    <Editable
                      editable={editable}
                      value={p.precio}
                      onChange={(v) => onUpdateProducto?.(p.id, { precio: v })}
                      tag="span"
                      placeholder="Precio"
                      style={{ color: accent }}
                      className="font-mono font-bold text-sm"
                      maxLength={20}
                    />
                  </div>
                ))}
              </div>
            );
          })()}
          {editable && (
            <form onSubmit={submit} className="mt-8 flex flex-wrap gap-2">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la pieza"
                className="flex-1 min-w-[10rem] border px-3 py-2 text-sm bg-transparent outline-none"
                style={{ borderColor: palette.line, color: palette.ink }}
              />
              <input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Material"
                className="w-32 border px-3 py-2 text-sm bg-transparent outline-none"
                style={{ borderColor: palette.line, color: palette.ink }}
              />
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Precio"
                className="w-28 border px-3 py-2 text-sm bg-transparent outline-none"
                style={{ borderColor: palette.line, color: palette.ink }}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 text-white shrink-0"
                style={{ background: btnColor }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar
              </button>
            </form>
          )}
        </div>
      ) : variant === 'catalogo' ? (
        <div className="max-w-5xl mx-auto">
          {categorias.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {['Todos', ...categorias].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoriaFiltro(c)}
                  className="text-xs font-semibold px-3 py-1.5 border rounded-full transition-colors"
                  style={
                    categoriaFiltro === c
                      ? { background: palette.inkHex || '#171717', borderColor: palette.inkHex || '#171717', color: palette.bg }
                      : { borderColor: palette.line, color: palette.inkSoft }
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 @lg:grid-cols-4 gap-x-5 gap-y-8">
            {productosFiltrados.map((p, i, arr) => (
              <div key={p.id} className={`relative flex flex-col text-left ${p.oculto ? 'opacity-40' : ''}`}>
                {editable && (
                  <div className="absolute top-2 right-2 z-10">
                    <ItemToolbar
                      variant="overlay"
                      oculto={p.oculto}
                      canMoveUp={i > 0}
                      canMoveDown={i < arr.length - 1}
                      onMoveUp={() => onMoveProducto?.(p.id, -1)}
                      onMoveDown={() => onMoveProducto?.(p.id, 1)}
                      onDuplicate={() => onDuplicateProducto?.(p.id)}
                      onToggleOculto={() => onToggleOcultoProducto?.(p.id)}
                      onRemove={() => onRemoveProducto?.(p.id)}
                      removeLabel={`Quitar ${p.nombre}`}
                    />
                  </div>
                )}
                <label
                  className={`relative block w-full aspect-square bg-black/5 mb-3 flex items-center justify-center overflow-hidden ${
                    editable ? 'cursor-pointer' : ''
                  }`}
                  title={editable ? 'Cambiar foto' : undefined}
                >
                  {p.imagenes?.[0] ? (
                    <img
                      src={p.imagenes[0]}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ filter: 'grayscale(0.15) contrast(1.05)' }}
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6" style={{ color: palette.inkSoft }} />
                  )}
                  {p.etiqueta && (
                    <span
                      className="absolute top-2 left-2 font-mono text-[10px] uppercase tracking-wide px-2 py-1 text-white"
                      style={{ background: p.etiquetaColor || accent }}
                    >
                      {p.etiqueta}
                    </span>
                  )}
                  {p.disponible !== undefined && (
                    <span
                      className="absolute top-2 right-2 font-mono text-[10px] uppercase tracking-wide px-2 py-1"
                      style={
                        p.disponible
                          ? { background: accent, color: palette.bg }
                          : { background: 'rgba(0,0,0,0.75)', color: 'rgba(255,255,255,0.7)' }
                      }
                    >
                      {p.disponible ? 'Disponible' : 'Reservado'}
                    </span>
                  )}
                  {editable && (
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file && (await validateImageFile(file, 'productos'))) {
                          onAddProductoImagen?.(p.id, await uploadImage(file));
                        }
                      }}
                    />
                  )}
                </label>
                {editable && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                    <Editable
                      editable={editable}
                      value={p.etiqueta}
                      onChange={(v) => onUpdateProducto?.(p.id, { etiqueta: v })}
                      tag="span"
                      placeholder="Etiqueta (ej: Nuevo, Oferta)"
                      style={{ color: p.etiquetaColor || accent }}
                      className="text-[10px] font-mono uppercase"
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateProducto?.(p.id, { disponible: p.disponible === undefined ? true : p.disponible ? false : undefined })
                      }
                      className="text-[10px] underline decoration-dotted opacity-60 hover:opacity-100 transition-opacity"
                    >
                      {p.disponible === undefined ? 'Agregar estado' : p.disponible ? 'Disponible → Reservado' : 'Quitar estado'}
                    </button>
                  </div>
                )}
                {editable && (
                  <Editable
                    editable={editable}
                    value={p.categoria}
                    onChange={(v) => onUpdateProducto?.(p.id, { categoria: v })}
                    tag="p"
                    block
                    styleKey={`producto.${p.id}.categoria`}
                    placeholder="Categoría"
                    style={{ color: accent }}
                    className="font-mono text-[10px] uppercase tracking-wide mb-1"
                    maxLength={30}
                  />
                )}
                <Editable
                  editable={editable}
                  value={p.nombre}
                  onChange={(v) => onUpdateProducto?.(p.id, { nombre: v })}
                  tag="p"
                  block
                  styleKey={`producto.${p.id}.nombre`}
                  placeholder="Nombre del producto"
                  style={{ color: palette.ink }}
                  className="font-serif text-base leading-snug mb-1"
                  maxLength={60}
                />
                <Editable
                  editable={editable}
                  value={p.desc}
                  onChange={(v) => onUpdateProducto?.(p.id, { desc: v })}
                  tag="p"
                  block
                  multiline
                  styleKey={`producto.${p.id}.desc`}
                  placeholder="Descripción corta"
                  style={{ color: palette.inkSoft }}
                  className="text-xs mb-2"
                  maxLength={140}
                />
                <div className="flex items-center justify-between gap-2 mt-1">
                  <Editable
                    editable={editable}
                    value={p.precio}
                    onChange={(v) => onUpdateProducto?.(p.id, { precio: Number(v) || 0 })}
                    tag="p"
                    type="number"
                    styleKey={`producto.${p.id}.precio`}
                    format={(v) => `$${Number(v || 0).toLocaleString('es-AR')}`}
                    style={{ color: accent }}
                    className="font-mono font-bold text-sm"
                  />
                  {buttonSlotVisible(editable, p.boton, 'whatsapp', whatsapp) && (
                    <ButtonObject
                      value={p.boton}
                      onChange={(patch) => onUpdateProducto?.(p.id, { boton: { ...(p.boton || {}), ...patch } })}
                      editable={editable}
                      seccionesDisponibles={seccionesDisponibles}
                      nombreNegocio={nombreNegocio}
                      defaultFuncion="whatsapp"
                      defaultLabel="Consultar"
                      defaultColor={btnColor}
                      defaultTarget={whatsapp}
                      size="sm"
                      waMessage={
                        p.nombre
                          ? `Hola! Quiero consultar por "${p.nombre}"${
                              p.precio ? ` ($${Number(p.precio).toLocaleString('es-AR')})` : ''
                            }.`
                          : undefined
                      }
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          {editable && (
            <form onSubmit={submit} className="mt-8 border-2 border-dashed p-4 flex flex-wrap gap-2 items-center" style={{ borderColor: palette.line }}>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del producto"
                className="flex-1 min-w-[160px] border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <input
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Categoría"
                className="w-32 border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                type="number"
                min="0"
                placeholder="Precio"
                className="w-28 border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 text-white shrink-0"
                style={{ background: btnColor }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar
              </button>
            </form>
          )}
        </div>
      ) : variant === 'tarifario' ? (
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col">
            {(editable ? productos : productos.filter((p) => !p.oculto)).map((p, i, arr) => {
              // En modo lectura (página ya publicada), tocar la fila manda al
              // WhatsApp del negocio con el nombre del servicio ya cargado en
              // el mensaje — así se sigue la charla puntual por ese ítem, sin
              // tener que escribir de cero. Mientras se edita, la fila no es
              // un link (si no, tocarla para editar el texto abriría WhatsApp
              // en vez de dejar escribir).
              const RowTag = !editable && whatsapp ? 'a' : 'div';
              const rowLinkProps =
                !editable && whatsapp
                  ? {
                      href: waLink(whatsapp, nombreNegocio, `Hola! Quiero consultar por "${p.nombre}".`),
                      target: '_blank',
                      rel: 'noreferrer',
                    }
                  : {};
              return (
                <RowTag
                  key={p.id}
                  {...rowLinkProps}
                  className={`relative flex items-baseline justify-between gap-4 py-3.5 px-2 -mx-2 border-b no-underline transition-colors ${
                    !editable && whatsapp ? 'hover:bg-current/[0.04]' : ''
                  } ${p.oculto ? 'opacity-40' : ''}`}
                  style={{ borderColor: palette.line, color: palette.ink }}
                >
                  <Editable
                    editable={editable}
                    value={p.nombre}
                    onChange={(v) => onUpdateProducto?.(p.id, { nombre: v })}
                    tag="span"
                    styleKey={`producto.${p.id}.nombre`}
                    placeholder="Nombre del servicio"
                    style={{ color: palette.ink }}
                    className="text-sm @lg:text-base"
                    maxLength={60}
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <Editable
                      editable={editable}
                      value={p.desc}
                      onChange={(v) => onUpdateProducto?.(p.id, { desc: v })}
                      tag="span"
                      styleKey={`producto.${p.id}.desc`}
                      placeholder="desde"
                      style={{ color: palette.inkSoft }}
                      className="font-mono text-xs uppercase"
                      maxLength={20}
                    />
                    <Editable
                      editable={editable}
                      value={p.precio}
                      onChange={(v) => onUpdateProducto?.(p.id, { precio: Number(v) || 0 })}
                      tag="span"
                      type="number"
                      styleKey={`producto.${p.id}.precio`}
                      format={(v) => `$${Number(v || 0).toLocaleString('es-AR')}`}
                      style={{ color: accent }}
                      className="font-mono font-bold text-sm @lg:text-base"
                    />
                    {editable && (
                      <ItemToolbar
                        variant="inline"
                        color={palette.ink}
                        oculto={p.oculto}
                        canMoveUp={i > 0}
                        canMoveDown={i < arr.length - 1}
                        onMoveUp={() => onMoveProducto?.(p.id, -1)}
                        onMoveDown={() => onMoveProducto?.(p.id, 1)}
                        onDuplicate={() => onDuplicateProducto?.(p.id)}
                        onToggleOculto={() => onToggleOcultoProducto?.(p.id)}
                        onRemove={() => onRemoveProducto?.(p.id)}
                        removeLabel={`Quitar ${p.nombre}`}
                      />
                    )}
                  </div>
                </RowTag>
              );
            })}
          </div>
          {editable && (
            <form onSubmit={submit} className="mt-6 border-2 border-dashed p-4 flex flex-wrap gap-2 items-center" style={{ borderColor: palette.line }}>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del servicio"
                className="flex-1 min-w-[160px] border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <input
                value={duracion}
                onChange={(e) => setDuracion(e.target.value)}
                placeholder="desde (opcional)"
                className="w-32 border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                type="number"
                min="0"
                placeholder="Precio"
                className="w-28 border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 text-white shrink-0"
                style={{ background: btnColor }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar
              </button>
            </form>
          )}
          <Editable
            editable={editable}
            value={disclaimer}
            onChange={onUpdateDisclaimer}
            tag="p"
            block
            multiline
            styleKey="productos.disclaimer"
            placeholder="Aclaración (ej: Precios de referencia. El valor final se confirma tras la visita técnica.)"
            style={{ color: palette.inkSoft }}
            className="text-xs mt-4"
            maxLength={140}
          />
        </div>
      ) : (
        <div className={`max-w-5xl mx-auto grid ${PRODUCTOS_GRID_COLS[variant] || PRODUCTOS_GRID_COLS['grid-3']} gap-5`}>
          {(editable ? productos : productos.filter((p) => !p.oculto)).map((p, i, arr) => (
            <div
              key={p.id}
              className={`relative border flex flex-col text-left ${p.oculto ? 'opacity-40' : ''}`}
              style={{ borderColor: palette.line }}
            >
              {editable && (
                <div className="absolute top-2 right-2 z-10">
                  <ItemToolbar
                    variant="overlay"
                    oculto={p.oculto}
                    canMoveUp={i > 0}
                    canMoveDown={i < arr.length - 1}
                    onMoveUp={() => onMoveProducto?.(p.id, -1)}
                    onMoveDown={() => onMoveProducto?.(p.id, 1)}
                    onDuplicate={() => onDuplicateProducto?.(p.id)}
                    onToggleOculto={() => onToggleOcultoProducto?.(p.id)}
                    onRemove={() => onRemoveProducto?.(p.id)}
                    removeLabel={`Quitar ${p.nombre}`}
                  />
                </div>
              )}
              <MediaCarousel
                images={p.imagenes}
                editable={editable}
                onAddImages={async (files) => {
                  const urls = await Promise.all(files.map(uploadImage));
                  urls.forEach((url) => onAddProductoImagen?.(p.id, url));
                }}
                onRemoveImage={(imgIdx) => onRemoveProductoImagen?.(p.id, imgIdx)}
                mediaVariant={p.mediaVariant}
                onChangeMediaVariant={(v) => onUpdateProducto?.(p.id, { mediaVariant: v })}
                limitKey="productos"
              />
              <div className="p-5 flex flex-col flex-1">
                <Editable
                  editable={editable}
                  value={p.nombre}
                  onChange={(v) => onUpdateProducto?.(p.id, { nombre: v })}
                  tag="p"
                  block
                  styleKey={`producto.${p.id}.nombre`}
                  placeholder="Nombre del producto"
                  style={{ color: palette.ink }}
                  className="font-serif text-xl mb-1"
                />
                <Editable
                  editable={editable}
                  value={p.desc}
                  onChange={(v) => onUpdateProducto?.(p.id, { desc: v })}
                  tag="p"
                  block
                  multiline
                  styleKey={`producto.${p.id}.desc`}
                  placeholder="Descripción corta"
                  style={{ color: palette.inkSoft }}
                  className="text-sm mb-3"
                />
                <Editable
                  editable={editable}
                  value={p.detalle}
                  onChange={(v) => onUpdateProducto?.(p.id, { detalle: v })}
                  tag="p"
                  block
                  multiline
                  styleKey={`producto.${p.id}.detalle`}
                  placeholder="Más info: ingredientes, medidas, materiales..."
                  style={{ color: palette.inkSoft, background: palette.bg }}
                  className="text-xs px-2.5 py-2 mb-3 leading-relaxed border"
                />
                <div className="mt-auto">
                  <Editable
                    editable={editable}
                    value={p.precio}
                    onChange={(v) => onUpdateProducto?.(p.id, { precio: Number(v) || 0 })}
                    tag="p"
                    block
                    type="number"
                    styleKey={`producto.${p.id}.precio`}
                    format={(v) => `$${Number(v || 0).toLocaleString('es-AR')}`}
                    style={{ color: accent }}
                    className="font-mono text-xl font-bold mb-4"
                  />
                  {cartEnabled ? (
                    <button
                      type="button"
                      disabled={editable}
                      onClick={() => onAddToCart?.(p)}
                      className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 px-4 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      style={{ background: btnColor }}
                    >
                      <CartIcon className="w-4 h-4" /> Agregar al carrito
                    </button>
                  ) : (
                    buttonSlotVisible(editable, p.boton, 'whatsapp', whatsapp) && (
                      <ButtonObject
                        value={p.boton}
                        onChange={(patch) => onUpdateProducto?.(p.id, { boton: { ...(p.boton || {}), ...patch } })}
                        editable={editable}
                        seccionesDisponibles={seccionesDisponibles}
                        nombreNegocio={nombreNegocio}
                        defaultFuncion="whatsapp"
                        defaultLabel="Consultar"
                        defaultColor={btnColor}
                        defaultTarget={whatsapp}
                        waMessage={
                          p.nombre
                            ? `Hola! Quiero consultar por "${p.nombre}"${
                                p.precio ? ` ($${Number(p.precio).toLocaleString('es-AR')})` : ''
                              }.`
                            : undefined
                        }
                        className="w-full justify-center"
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          ))}

          {editable && (
            <form
              onSubmit={submit}
              className="border-2 border-dashed p-5 flex flex-col justify-center gap-2"
              style={{ borderColor: palette.line }}
            >
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del producto"
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <input
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                type="number"
                min="0"
                placeholder="Precio"
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 text-white mt-1"
                style={{ background: btnColor }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

// Catálogo con buscador + filtro por rubro/género + grilla de fichas, cada una
// con su badge de stock — a diferencia de "Productos" (que no busca ni
// filtra), acá el visitante puede buscar por título/autor/género en vivo. Las
// pestañas de género se arman solas a partir de los géneros que ya tienen los
// libros cargados (no hace falta una lista aparte para mantener sincronizada).
function SeccionCatalogoLibros({
  items = [],
  onUpdate,
  onRemove,
  onAdd,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('Todos');

  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const genres = ['Todos', ...Array.from(new Set(items.map((b) => b.genero).filter(Boolean)))];
  const q = norm(query);
  const results = items.filter((b) => {
    const byGenre = genre === 'Todos' || b.genero === genre;
    const byQuery = q === '' || norm(b.titulo).includes(q) || norm(b.autor).includes(q) || norm(b.genero).includes(q);
    return byGenre && byQuery;
  });

  const update = (id, patch) => onUpdate?.(items.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id) => onRemove?.(id);
  const add = () =>
    onAdd?.({ id: `libro-${Date.now()}`, titulo: 'Nuevo libro', autor: 'Autor', genero: 'Sin género', precio: '$0', stock: 'En stock', stockColor: '#3f6b6b', img: '' });

  const handleImg = (id) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'productos'))) update(id, { img: await uploadImage(file) });
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <Reveal className="flex flex-wrap items-end justify-between gap-5 mb-7" as="div">
          <div>
            <Editable
              editable={editable}
              value={eyebrow}
              onChange={onUpdateEyebrow}
              tag="span"
              block
              styleKey="catalogolibros.eyebrow"
              placeholder="Eyebrow (opcional)"
              style={{ color: accent }}
              className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
              maxLength={40}
            />
            <Editable
              editable={editable}
              value={titulo ?? 'Buscá tu próxima lectura'}
              onChange={onUpdateTitulo}
              tag="h2"
              block
              styleKey="catalogolibros.titulo"
              style={{ color: headingColor || palette.ink }}
              className="font-serif text-2xl @lg:text-3xl"
              maxLength={70}
            />
          </div>
          <div className="flex items-stretch border min-w-[min(100%,320px)]" style={{ borderColor: palette.line, background: palette.bg }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Título, autor o tema..."
              className="flex-1 min-w-0 bg-transparent border-none outline-none px-3.5 py-2.5 text-sm"
              style={{ color: palette.ink }}
            />
            <div
              className="flex items-center px-3.5 font-mono text-xs border-l"
              style={{ color: palette.inkSoft, borderColor: palette.line }}
            >
              {results.length} de {items.length}
            </div>
          </div>
        </Reveal>

        <div className="flex flex-wrap gap-2 mb-8">
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenre(g)}
              className="border text-sm px-3.5 py-2 transition-colors"
              style={
                genre === g
                  ? { borderColor: palette.ink, background: palette.ink, color: palette.bg }
                  : { borderColor: palette.line, color: palette.ink, background: 'transparent' }
              }
            >
              {g}
            </button>
          ))}
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 @sm:grid-cols-3 @lg:grid-cols-5 gap-5">
            {results.map((b, i) => (
              <Reveal key={b.id} delay={Math.min(i * 0.06, 0.3)} className="relative" style={{ background: palette.bg, border: `1px solid ${palette.line}` }}>
                {editable && (
                  <button
                    type="button"
                    onClick={() => remove(b.id)}
                    aria-label={`Quitar ${b.titulo}`}
                    className="absolute top-2 right-2 z-10 opacity-50 hover:opacity-100 bg-black/40 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
                <label className={`group/bimg relative block aspect-[2/3] bg-black/5 overflow-hidden ${editable ? 'cursor-pointer' : ''}`}>
                  {b.img ? (
                    <img src={b.img} alt={b.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-center px-2" style={{ color: palette.inkSoft }}>
                      Foto
                    </div>
                  )}
                  {editable && (
                    <>
                      <span className="absolute inset-0 bg-black/0 group-hover/bimg:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/bimg:opacity-100">
                        <PencilIcon className="w-4 h-4 text-white" />
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImg(b.id)} />
                    </>
                  )}
                </label>
                <div className="p-3.5">
                  <Editable
                    editable={editable}
                    value={b.genero}
                    onChange={(v) => update(b.id, { genero: v })}
                    tag="div"
                    placeholder="Género"
                    style={{ color: '#3f6b6b' }}
                    className="font-mono text-[10px] uppercase tracking-wide mb-1.5"
                    maxLength={30}
                  />
                  <Editable
                    editable={editable}
                    value={b.titulo}
                    onChange={(v) => update(b.id, { titulo: v })}
                    tag="div"
                    block
                    placeholder="Título"
                    style={{ color: palette.ink }}
                    className="font-serif text-[15px] leading-snug mb-0.5"
                    maxLength={60}
                  />
                  <Editable
                    editable={editable}
                    value={b.autor}
                    onChange={(v) => update(b.id, { autor: v })}
                    tag="div"
                    placeholder="Autor"
                    style={{ color: palette.inkSoft }}
                    className="text-xs mb-2.5"
                    maxLength={50}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <Editable
                      editable={editable}
                      value={b.precio}
                      onChange={(v) => update(b.id, { precio: v })}
                      tag="span"
                      placeholder="$0"
                      style={{ color: palette.ink }}
                      className="font-mono font-bold text-sm"
                      maxLength={20}
                    />
                    <Editable
                      editable={editable}
                      value={b.stock}
                      onChange={(v) => update(b.id, { stock: v })}
                      tag="span"
                      placeholder="En stock"
                      style={{ color: b.stockColor || '#3f6b6b' }}
                      className="font-mono text-[11px]"
                      maxLength={20}
                    />
                  </div>
                </div>
              </Reveal>
            ))}
            {editable && (
              <button
                type="button"
                onClick={add}
                className="border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-10 text-sm font-semibold min-h-[220px]"
                style={{ borderColor: palette.line, color: palette.inkSoft }}
              >
                <PlusIcon className="w-4 h-4" /> Agregar
              </button>
            )}
          </div>
        ) : (
          <div className="border border-dashed text-center px-7 py-9" style={{ borderColor: palette.line, background: palette.bg }}>
            <div className="font-serif italic text-xl mb-2.5" style={{ color: palette.ink }}>
              No lo tenemos en góndola
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-md mx-auto" style={{ color: palette.inkSoft }}>
              Pero podemos pedirlo a la editorial. Dejanos el título en pedidos especiales y te avisamos cuando llega.
            </p>
            <a
              href="#pedidos"
              className="inline-block font-semibold text-sm px-5 py-3"
              style={{ background: accent, color: '#fff' }}
            >
              Encargar este libro
            </a>
            {editable && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={add}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-2.5 border-2 border-dashed"
                  style={{ borderColor: palette.line, color: palette.inkSoft }}
                >
                  <PlusIcon className="w-3 h-3" /> Agregar libro
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Una reseña: nombre, foto, estrellas y comentario editables ahí mismo, con el
// badge de "verificada" cuando vino de la conexión con Google/Facebook.
// Iniciales en badge cuadrado (nunca foto de avatar) — coherente con el resto
// del sistema (logo, equipo): la marca no muestra fotos de perfil de terceros.
function TestimonioCard({
  t,
  editable,
  onUpdate,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onToggleOculto,
  accent,
  palette = {},
}) {
  return (
    <div
      className={`relative border p-6 text-left h-full flex flex-col ${t.oculto ? 'opacity-40' : ''}`}
      style={{ borderColor: palette.line }}
    >
      {editable && (
        <div className="absolute top-3 right-3">
          <ItemToolbar
            variant="inline"
            color={palette.ink}
            oculto={t.oculto}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onDuplicate={onDuplicate}
            onToggleOculto={onToggleOculto}
            onRemove={onRemove}
            removeLabel={`Quitar testimonio de ${t.nombre}`}
          />
        </div>
      )}
      {t.metric && (
        <div className="font-serif font-bold text-2xl leading-none mb-3" style={{ color: accent }}>
          {t.metric}
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-8 h-8 shrink-0 flex items-center justify-center font-mono text-xs font-bold"
          style={{ background: accent, color: palette.bg }}
        >
          {initials(t.nombre)}
        </div>
        <div className="min-w-0 flex-1">
          <Editable
            editable={editable}
            value={t.nombre}
            onChange={(v) => onUpdate?.({ nombre: v })}
            tag="p"
            block
            styleKey={`testimonio.${t.id}.nombre`}
            style={{ color: palette.ink }}
            className="font-serif font-semibold truncate"
          />
          {editable ? (
            <div className="flex items-center gap-0.5 mt-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => onUpdate?.({ rating: n })} aria-label={`${n} estrellas`}>
                  <StarIcon className={`w-3 h-3 ${n <= t.rating ? 'opacity-100' : 'opacity-20'}`} style={{ color: accent }} />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: palette.inkSoft }}>
              {t.verificado ? `Reseña verificada${t.fuente ? ` · ${t.fuente === 'facebook' ? 'Facebook' : 'Google'}` : ''}` : 'Cliente'}
            </p>
          )}
          <Editable
            editable={editable}
            value={t.cargo}
            onChange={(v) => onUpdate?.({ cargo: v })}
            tag="p"
            block
            placeholder="Cargo o contexto (opcional, ej: Directora de arte)"
            style={{ color: palette.inkSoft }}
            className="font-mono text-xs mt-0.5"
            maxLength={40}
          />
        </div>
      </div>
      <Editable
        editable={editable}
        value={t.texto}
        onChange={(v) => onUpdate?.({ texto: v })}
        tag="p"
        block
        multiline
        styleKey={`testimonio.${t.id}.texto`}
        placeholder="Escribí el comentario del cliente"
        prefix={editable ? '' : '"'}
        suffix={editable ? '' : '"'}
        style={{ color: palette.ink }}
        className="font-serif italic text-lg leading-snug flex-1"
      />
    </div>
  );
}

// Formulario chico para cargar un testimonio propio a mano.
function TestimonioForm({ onAdd, accent }) {
  const [nombre, setNombre] = useState('');
  const [texto, setTexto] = useState('');
  const [rating, setRating] = useState(5);

  const submit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onAdd?.({ nombre, texto, rating });
    setNombre('');
    setTexto('');
    setRating(5);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border-2 border-dashed border-black/15 p-5 flex flex-col justify-center gap-2 h-full"
    >
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre del cliente"
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
      />
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Qué dijo sobre tu negocio"
        rows={2}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 resize-none"
      />
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} estrellas`}>
            <StarIcon className={`w-4 h-4 ${n <= rating ? 'text-amber-500' : 'text-neutral-300'}`} />
          </button>
        ))}
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold py-2 text-white mt-1"
        style={{ background: accent }}
      >
        <PlusIcon className="w-3.5 h-3.5" /> Agregar testimonio
      </button>
    </form>
  );
}

// MOCK: simula conectar con Google/Facebook Reviews (sin backend real ni OAuth acá) —
// pide un "nombre de negocio", simula una búsqueda y trae reseñas de ejemplo verificadas.
function ConectarResenasModal({ onConnect, onClose }) {
  const [fuente, setFuente] = useState('google');
  const [negocio, setNegocio] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!negocio.trim()) return;
    setLoading(true);
    const res = await onConnect?.({ fuente, negocio });
    setLoading(false);
    setDone(res);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-neutral-900">Reseñas verificadas</h3>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        {done ? (
          <div className="text-center py-4">
            <CheckBadgeIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-800">¡Listo! Conectamos tu cuenta.</p>
            <p className="text-xs text-neutral-500 mt-1">
              Trajimos {done.cantidad} reseñas verificadas de {done.negocio}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full bg-neutral-900 text-white text-sm font-semibold py-2.5"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs text-neutral-500">
              Conectá tu perfil de Google o Facebook y traemos automáticamente tus reseñas ya
              verificadas por esa plataforma, con la marca de verificado incluida.
            </p>
            <div className="flex items-center gap-2">
              {[
                { id: 'google', label: 'Google' },
                { id: 'facebook', label: 'Facebook' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFuente(f.id)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors ${
                    fuente === f.id
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              autoFocus
              value={negocio}
              onChange={(e) => setNegocio(e.target.value)}
              placeholder="Nombre de tu negocio"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-neutral-900 text-white text-sm font-semibold py-2.5 disabled:opacity-50"
            >
              {loading ? 'Conectando...' : 'Buscar y conectar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Catálogo técnico filtrable por tipo/rubro: ficha con encabezado
// tipo+stock, nombre+fórmula, una sub-lista de specs clave/valor, y un
// pie con precio+unidad — a diferencia de "Catálogo con buscador" (que
// tiene foto y buscador de texto), acá no hay fotos y en cambio cada
// ficha muestra sus datos técnicos.
function SeccionCatalogoInsumos({
  items = [],
  onUpdate,
  onRemove,
  onAdd,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  palette = {},
}) {
  const [tipo, setTipo] = useState('Todos');

  const tipos = ['Todos', ...Array.from(new Set(items.map((p) => p.tipo).filter(Boolean)))];
  const results = tipo === 'Todos' ? items : items.filter((p) => p.tipo === tipo);

  const update = (id, patch) => onUpdate?.(items.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id) => onRemove?.(id);
  const add = () =>
    onAdd?.({
      id: `insumo-${Date.now()}`,
      tipo: 'Sin tipo',
      nombre: 'Nuevo insumo',
      formula: '',
      precio: '$0',
      unidad: 'por unidad',
      stock: 'Disponible',
      stockColor: '#3f6b2b',
      specs: [{ k: 'Dato', v: 'Valor' }],
    });

  const updateSpec = (id, idx, patch) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    update(id, { specs: it.specs.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  };
  const removeSpec = (id, idx) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    update(id, { specs: it.specs.filter((_, i) => i !== idx) });
  };
  const addSpec = (id) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    update(id, { specs: [...(it.specs || []), { k: 'Dato', v: 'Valor' }] });
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <Reveal className="flex flex-wrap items-end justify-between gap-5 mb-7">
          <div>
            <Editable
              editable={editable}
              value={eyebrow}
              onChange={onUpdateEyebrow}
              tag="span"
              block
              styleKey="catalogoinsumos.eyebrow"
              placeholder="Eyebrow (opcional)"
              style={{ color: '#3f6b2b' }}
              className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
              maxLength={40}
            />
            <Editable
              editable={editable}
              value={titulo ?? 'Insumos con respaldo'}
              onChange={onUpdateTitulo}
              tag="h2"
              block
              styleKey="catalogoinsumos.titulo"
              style={{ color: headingColor || palette.ink }}
              className="font-serif text-2xl @lg:text-3xl"
              maxLength={70}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {tipos.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className="border text-sm px-3.5 py-2 transition-colors"
                style={
                  tipo === t
                    ? { borderColor: palette.ink, background: palette.ink, color: palette.bg }
                    : { borderColor: palette.line, color: palette.ink, background: 'transparent' }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid @sm:grid-cols-2 @lg:grid-cols-4 gap-5">
          {results.map((p, i) => (
            <Reveal
              key={p.id}
              delay={Math.min(i * 0.06, 0.3)}
              className="relative flex flex-col"
              style={{ background: palette.bg, border: `1px solid ${palette.line}` }}
            >
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label={`Quitar ${p.nombre}`}
                  className="absolute top-2 right-2 z-10 opacity-50 hover:opacity-100 bg-black/40 text-white rounded-full w-5 h-5 flex items-center justify-center"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              )}
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b" style={{ borderColor: palette.line }}>
                <Editable
                  editable={editable}
                  value={p.tipo}
                  onChange={(v) => update(p.id, { tipo: v })}
                  tag="span"
                  placeholder="Tipo"
                  style={{ color: palette.inkSoft }}
                  className="font-mono text-[10px] uppercase tracking-wide"
                  maxLength={30}
                />
                <Editable
                  editable={editable}
                  value={p.stock}
                  onChange={(v) => update(p.id, { stock: v })}
                  tag="span"
                  placeholder="Disponible"
                  style={{ color: p.stockColor || '#3f6b2b' }}
                  className="font-mono text-[10px]"
                  maxLength={20}
                />
              </div>
              <div className="px-4 py-4 flex-1">
                <Editable
                  editable={editable}
                  value={p.nombre}
                  onChange={(v) => update(p.id, { nombre: v })}
                  tag="div"
                  block
                  placeholder="Nombre"
                  style={{ color: palette.ink }}
                  className="font-semibold text-[15px] mb-1"
                  maxLength={50}
                />
                <Editable
                  editable={editable}
                  value={p.formula}
                  onChange={(v) => update(p.id, { formula: v })}
                  tag="div"
                  block
                  placeholder="Fórmula o descripción"
                  style={{ color: palette.inkSoft }}
                  className="text-xs mb-3"
                  maxLength={60}
                />
                <div className="flex flex-col gap-1.5 pt-3" style={{ borderTop: `1px dashed ${palette.line}` }}>
                  {(p.specs || []).map((sp, idx) => (
                    <div key={idx} className="relative flex justify-between gap-2 pr-4">
                      <Editable
                        editable={editable}
                        value={sp.k}
                        onChange={(v) => updateSpec(p.id, idx, { k: v })}
                        tag="span"
                        placeholder="Dato"
                        style={{ color: palette.inkSoft }}
                        className="font-mono text-[11px]"
                        maxLength={20}
                      />
                      <Editable
                        editable={editable}
                        value={sp.v}
                        onChange={(v) => updateSpec(p.id, idx, { v })}
                        tag="span"
                        placeholder="Valor"
                        style={{ color: palette.ink }}
                        className="font-mono text-[11px] text-right"
                        maxLength={30}
                      />
                      {editable && (
                        <button
                          type="button"
                          onClick={() => removeSpec(p.id, idx)}
                          aria-label="Quitar dato"
                          className="absolute right-0 opacity-40 hover:opacity-100"
                          style={{ color: palette.ink }}
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <button
                      type="button"
                      onClick={() => addSpec(p.id)}
                      className="text-[11px] font-semibold underline decoration-dotted self-start"
                      style={{ color: palette.inkSoft }}
                    >
                      + Agregar dato
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-4 py-3" style={{ background: palette.line + '30', borderTop: `1px solid ${palette.line}` }}>
                <Editable
                  editable={editable}
                  value={p.precio}
                  onChange={(v) => update(p.id, { precio: v })}
                  tag="span"
                  placeholder="$0"
                  style={{ color: palette.ink }}
                  className="font-semibold text-sm"
                  maxLength={20}
                />
                <Editable
                  editable={editable}
                  value={p.unidad}
                  onChange={(v) => update(p.id, { unidad: v })}
                  tag="span"
                  placeholder="por unidad"
                  style={{ color: '#3f6b2b' }}
                  className="font-mono text-[11px]"
                  maxLength={20}
                />
              </div>
            </Reveal>
          ))}
          {editable && (
            <button
              type="button"
              onClick={add}
              className="border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-10 text-sm font-semibold min-h-[220px]"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-4 h-4" /> Agregar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// Catálogo con buscador + tabs de categoría + tabla de productos con
// contador +/− por fila, más un carrito lateral fijo (líneas, subtotal,
// descuento por volumen ya aplicado según los umbrales de "tiers", y un
// mensaje de mínimo de compra) — a diferencia de "Catálogo con buscador"
// (que es solo lectura, sin carrito) o "Pedidos especiales" (que es UN
// pedido puntual por formulario), acá el visitante arma un pedido de
// varios productos a la vez y ve el total con descuento en vivo. El
// carrito es ephemeral de la sesión del visitante, no hay backend de
// pedidos real conectado del otro lado — el envío solo confirma en
// pantalla, el vendedor real lo recibe por WhatsApp/otro canal aparte.
function SeccionPedidoMayorista({
  items = [],
  onUpdate,
  onRemove,
  onAdd,
  tiers = [],
  onUpdateTiers,
  montoMinimo = 0,
  onUpdateMontoMinimo,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [cart, setCart] = useState({});
  const [orderSent, setOrderSent] = useState(false);

  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const categorias = ['Todas', ...Array.from(new Set(items.map((p) => p.categoria).filter(Boolean)))];
  const q = norm(query);
  const shown = items.filter((p) => {
    const byCat = categoria === 'Todas' || p.categoria === categoria;
    const byQ = q === '' || norm(p.nombre).includes(q) || norm(p.sku).includes(q);
    return byCat && byQ;
  });

  const bump = (id, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      const v = Math.max(0, (next[id] || 0) + delta);
      if (v === 0) delete next[id];
      else next[id] = v;
      return next;
    });
    setOrderSent(false);
  };

  const money = (n) => '$' + Math.round(n).toLocaleString('es-AR');

  let totalBultos = 0;
  let subtotal = 0;
  const cartLines = [];
  Object.entries(cart).forEach(([id, qty]) => {
    const p = items.find((x) => x.id === id);
    if (!p) return;
    totalBultos += qty;
    subtotal += qty * (p.precio || 0);
    cartLines.push({ id, label: `${qty} × ${p.nombre}`, value: money(qty * (p.precio || 0)) });
  });

  const sortedTiers = [...tiers].sort((a, b) => (a.umbral || 0) - (b.umbral || 0));
  let tier = null;
  for (const t of sortedTiers) {
    if (totalBultos >= (t.umbral || 0)) tier = t;
  }
  const discountPct = tier?.descuento || 0;
  const discount = (subtotal * discountPct) / 100;
  const total = subtotal - discount;
  const reached = total >= montoMinimo;
  const missing = montoMinimo - total;

  const updateItem = (id, patch) => onUpdate?.(items.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removeItem = (id) => onRemove?.(id);
  const addItem = () =>
    onAdd?.({ id: `prod-${Date.now()}`, sku: 'SKU-000', nombre: 'Nuevo producto', categoria: 'Sin categoría', unidad: 'Bulto x 1', precio: 0, stockN: 0 });

  const updateTier = (id, patch) => onUpdateTiers?.(tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const removeTier = (id) => onUpdateTiers?.(tiers.filter((t) => t.id !== id));
  const addTier = () => onUpdateTiers?.([...tiers, { id: `nivel-${Date.now()}`, umbral: 0, descuento: 0, etiqueta: 'Nuevo nivel' }]);

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-6xl mx-auto">
        <Reveal className="flex flex-wrap items-end justify-between gap-5 mb-6">
          <div>
            <Editable
              editable={editable}
              value={eyebrow}
              onChange={onUpdateEyebrow}
              tag="span"
              block
              styleKey="pedidomayorista.eyebrow"
              placeholder="Eyebrow (opcional)"
              style={{ color: '#2a4d9b' }}
              className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
              maxLength={40}
            />
            <Editable
              editable={editable}
              value={titulo ?? 'Armá tu pedido'}
              onChange={onUpdateTitulo}
              tag="h2"
              block
              styleKey="pedidomayorista.titulo"
              style={{ color: headingColor || palette.ink }}
              className="font-serif text-2xl @lg:text-3xl"
              maxLength={70}
            />
          </div>
          <div className="flex items-stretch border min-w-[min(100%,300px)]" style={{ borderColor: palette.line, background: palette.bg }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por producto o SKU..."
              className="flex-1 min-w-0 bg-transparent border-none outline-none px-3.5 py-2.5 text-sm"
              style={{ color: palette.ink }}
            />
            <div className="flex items-center px-3.5 font-mono text-xs border-l" style={{ color: palette.inkSoft, borderColor: palette.line }}>
              {shown.length}/{items.length}
            </div>
          </div>
        </Reveal>

        <div className="flex flex-wrap gap-2 mb-7">
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              className="border text-sm px-3.5 py-2 transition-colors"
              style={
                categoria === c
                  ? { borderColor: palette.ink, background: palette.ink, color: palette.bg }
                  : { borderColor: palette.line, color: palette.ink, background: 'transparent' }
              }
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid @lg:grid-cols-[1.6fr_1fr] gap-6 @lg:gap-9 items-start">
          <div className="overflow-x-auto">
            <div className="min-w-[560px] border" style={{ borderColor: palette.line, background: palette.bg }}>
              <div
                className="grid text-[11px] font-mono uppercase tracking-wide"
                style={{ gridTemplateColumns: '1.7fr 0.85fr 0.85fr 1.05fr', background: palette.inkHex || palette.ink, color: palette.bg }}
              >
                <div className="px-4 py-3">Producto</div>
                <div className="px-4 py-3 text-right">Precio bulto</div>
                <div className="px-4 py-3 text-right">Stock</div>
                <div className="px-4 py-3 text-right">Cantidad</div>
              </div>
              {shown.map((p) => {
                const qty = cart[p.id] || 0;
                const stockColor = p.stockN <= 25 ? accent : '#1f7a4d';
                return (
                  <div
                    key={p.id}
                    className="relative grid items-center border-t"
                    style={{ gridTemplateColumns: '1.7fr 0.85fr 0.85fr 1.05fr', borderColor: palette.line, background: qty > 0 ? (palette.accentSoft ?? '#fff6f1') : palette.bg }}
                  >
                    <div className="px-4 py-3">
                      <Editable
                        editable={editable}
                        value={p.nombre}
                        onChange={(v) => updateItem(p.id, { nombre: v })}
                        tag="div"
                        block
                        placeholder="Nombre"
                        style={{ color: palette.ink }}
                        className="text-sm font-medium leading-tight"
                        maxLength={60}
                      />
                      <div className="font-mono text-[11px] mt-0.5" style={{ color: palette.inkSoft }}>
                        <Editable editable={editable} value={p.sku} onChange={(v) => updateItem(p.id, { sku: v })} tag="span" placeholder="SKU" maxLength={20} /> ·{' '}
                        <Editable editable={editable} value={p.unidad} onChange={(v) => updateItem(p.id, { unidad: v })} tag="span" placeholder="Bulto x 1" maxLength={20} />
                      </div>
                    </div>
                    <div className="px-4 py-3 text-right">
                      <Editable
                        editable={editable}
                        value={p.precio}
                        onChange={(v) => updateItem(p.id, { precio: Number(v) || 0 })}
                        tag="div"
                        type="number"
                        format={(v) => money(v)}
                        style={{ color: palette.ink }}
                        className="font-mono text-sm font-semibold"
                      />
                    </div>
                    <div className="px-4 py-3 text-right font-mono text-xs" style={{ color: stockColor }}>
                      {editable ? (
                        <Editable editable value={p.stockN} onChange={(v) => updateItem(p.id, { stockN: Number(v) || 0 })} tag="span" type="number" style={{ color: stockColor }} />
                      ) : (
                        p.stockN
                      )}{' '}
                      bultos
                    </div>
                    <div className="px-4 py-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => bump(p.id, -1)}
                        aria-label="Restar"
                        className="w-7 h-7 border flex items-center justify-center font-mono"
                        style={{ borderColor: palette.line, color: palette.inkSoft, background: palette.bg }}
                      >
                        −
                      </button>
                      <span className="font-mono text-sm font-semibold min-w-[1.6rem] text-center">{qty}</span>
                      <button
                        type="button"
                        onClick={() => bump(p.id, 1)}
                        aria-label="Sumar"
                        className="w-7 h-7 flex items-center justify-center font-mono"
                        style={{ background: accent, color: '#fff' }}
                      >
                        +
                      </button>
                    </div>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => removeItem(p.id)}
                        aria-label={`Quitar ${p.nombre}`}
                        className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
                        style={{ color: palette.ink }}
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {editable && (
              <button
                type="button"
                onClick={addItem}
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-2.5 border-2 border-dashed"
                style={{ borderColor: palette.line, color: palette.inkSoft }}
              >
                <PlusIcon className="w-3 h-3" /> Agregar producto
              </button>
            )}
          </div>

          <div className="border" style={{ borderColor: palette.line, background: palette.bg }}>
            <div className="px-5 py-3.5 font-semibold text-sm uppercase tracking-wide" style={{ background: palette.inkHex || palette.ink, color: palette.bg }}>
              Tu pedido
            </div>
            <div className="p-5">
              {totalBultos === 0 ? (
                <p className="text-sm leading-relaxed mb-2" style={{ color: palette.inkSoft }}>
                  Todavía no cargaste bultos. Usá los botones + de la tabla para armar el pedido y ver el descuento por volumen.
                </p>
              ) : (
                <div>
                  <div className="flex flex-col gap-2.5 mb-4 max-h-[220px] overflow-y-auto">
                    {cartLines.map((l) => (
                      <div key={l.id} className="flex justify-between gap-3 text-sm pb-2.5 border-b" style={{ borderColor: palette.line }}>
                        <span style={{ color: palette.inkSoft }}>{l.label}</span>
                        <span className="font-mono whitespace-nowrap">{l.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 pt-3.5" style={{ borderTop: `1px dashed ${palette.line}` }}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span style={{ color: palette.inkSoft }}>Bultos totales</span>
                      <span className="font-mono font-semibold">{totalBultos}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span style={{ color: palette.inkSoft }}>Subtotal</span>
                      <span className="font-mono font-semibold">{money(subtotal)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span style={{ color: accent }}>{tier?.etiqueta || 'Sin descuento'}</span>
                      <span className="font-mono font-semibold" style={{ color: accent }}>
                        {discount > 0 ? `− ${money(discount)}` : '$0'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-sm">
                      <span style={{ color: palette.ink }}>Total sin IVA</span>
                      <span className="font-mono font-semibold" style={{ color: palette.ink }}>
                        {money(total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div
                className="px-4 py-3.5 mt-4 text-xs font-mono leading-relaxed"
                style={{ background: reached ? '#eaf6ef' : '#f6f7f9', border: `1px solid ${reached ? '#bfe3cd' : '#e2e5eb'}`, color: reached ? '#1f7a4d' : palette.inkSoft }}
              >
                {totalBultos === 0
                  ? `Pedido mínimo: ${money(montoMinimo)} + IVA.`
                  : reached
                    ? `✓ Superás el mínimo de ${money(montoMinimo)}. Podés enviar el pedido.`
                    : `Te faltan ${money(missing)} para alcanzar el mínimo de ${money(montoMinimo)}.`}
              </div>
              <button
                type="button"
                onClick={() => reached && setOrderSent(true)}
                className="w-full text-center text-sm font-semibold py-3 mt-4 transition-colors"
                style={{ background: reached ? accent : palette.line, color: '#fff' }}
              >
                {reached ? 'Enviar pedido al vendedor' : 'Completá el mínimo para enviar'}
              </button>
              {orderSent && (
                <p className="font-mono text-xs mt-3.5 leading-relaxed" style={{ color: '#1f7a4d' }}>
                  ✓ Pedido enviado. Un vendedor te confirma stock y fecha de entrega hoy mismo.
                </p>
              )}
            </div>
          </div>
        </div>

        {editable && (
          <div className="mt-8 pt-6 border-t" style={{ borderColor: palette.line }}>
            <div className="font-mono text-[11px] uppercase tracking-wide mb-3" style={{ color: palette.inkSoft }}>
              Escalas de descuento (umbral en bultos totales del pedido)
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {sortedTiers.map((t) => (
                <div key={t.id} className="relative border p-2.5 flex flex-col gap-1 min-w-[160px]" style={{ borderColor: palette.line }}>
                  <button
                    type="button"
                    onClick={() => removeTier(t.id)}
                    aria-label="Quitar nivel"
                    className="absolute top-1 right-1 opacity-50 hover:opacity-100"
                    style={{ color: palette.ink }}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                  <Editable editable value={t.etiqueta} onChange={(v) => updateTier(t.id, { etiqueta: v })} tag="span" className="text-xs font-semibold pr-3" style={{ color: palette.ink }} maxLength={30} />
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={t.umbral ?? 0}
                      onChange={(e) => updateTier(t.id, { umbral: Number(e.target.value) || 0 })}
                      placeholder="Bultos desde"
                      className="w-full border px-1.5 py-1 text-xs"
                      style={{ borderColor: palette.line, color: palette.ink }}
                    />
                    <input
                      type="number"
                      value={t.descuento ?? 0}
                      onChange={(e) => updateTier(t.id, { descuento: Number(e.target.value) || 0 })}
                      placeholder="% off"
                      className="w-full border px-1.5 py-1 text-xs"
                      style={{ borderColor: palette.line, color: palette.ink }}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addTier}
                className="border-2 border-dashed flex items-center justify-center px-3 text-xs font-semibold min-w-[90px]"
                style={{ borderColor: palette.line, color: palette.inkSoft }}
              >
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <label className="block font-mono text-[11px] uppercase tracking-wide mb-1.5" style={{ color: palette.inkSoft }}>
              Monto mínimo de pedido (sin IVA)
            </label>
            <input
              type="number"
              value={montoMinimo}
              onChange={(e) => onUpdateMontoMinimo?.(Number(e.target.value) || 0)}
              className="border px-3 py-2 text-sm w-48"
              style={{ borderColor: palette.line, color: palette.ink }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function SeccionTestimonios({
  testimonios = [],
  variant = 'grid',
  titulo,
  onUpdateTitulo,
  accent,
  palette = {},
  bgColor,
  headingColor,
  editable = false,
  onAddTestimonio,
  onRemoveTestimonio,
  onUpdateTestimonio,
  onDuplicateTestimonio,
  onMoveTestimonio,
  onToggleOcultoTestimonio,
  onConnectVerifiedReviews,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const current = Math.min(idx, Math.max(testimonios.length - 1, 0));

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 mb-8 pb-6 border-b" style={{ borderColor: palette.line }}>
        <Editable
          editable={editable}
          value={titulo ?? 'Lo que dicen nuestros clientes'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="testimonios.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif italic text-2xl @lg:text-3xl"
          maxLength={70}
        />
        {editable && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide border px-3 py-1.5 transition-colors shrink-0"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <CheckBadgeIcon className="w-3.5 h-3.5" /> Conectar verificadas
          </button>
        )}
      </div>

      {testimonios.length === 0 && !editable ? (
        <p className="text-center text-sm text-neutral-500 max-w-sm mx-auto">
          Todavía no cargaste testimonios de clientes.
        </p>
      ) : variant === 'carousel' ? (
        <div className="max-w-xl mx-auto">
          {testimonios.length > 0 && (
            <div className="relative">
              <TestimonioCard
                t={testimonios[current]}
                editable={editable}
                accent={accent}
                palette={palette}
                onUpdate={(patch) => onUpdateTestimonio?.(testimonios[current].id, patch)}
                onDuplicate={() => onDuplicateTestimonio?.(testimonios[current].id)}
                onToggleOculto={() => onToggleOcultoTestimonio?.(testimonios[current].id)}
                onRemove={() => {
                  onRemoveTestimonio?.(testimonios[current].id);
                  setIdx(0);
                }}
              />
              {testimonios.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setIdx((current - 1 + testimonios.length) % testimonios.length)}
                    aria-label="Testimonio anterior"
                    className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-neutral-200 shadow-md flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdx((current + 1) % testimonios.length)}
                    aria-label="Testimonio siguiente"
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-neutral-200 shadow-md flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                  <div className="flex items-center justify-center gap-1.5 mt-4">
                    {testimonios.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setIdx(i)}
                        aria-label={`Ver testimonio ${i + 1}`}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === current ? 'bg-neutral-800' : 'bg-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {editable && (
            <div className="mt-5">
              <TestimonioForm accent={accent} onAdd={(t) => onAddTestimonio?.(t)} />
            </div>
          )}
        </div>
      ) : variant === 'destacado' ? (
        <div className="max-w-2xl mx-auto text-center">
          {testimonios.length > 0 && (
            <div className="relative">
              <Editable
                editable={editable}
                value={testimonios[current].texto}
                onChange={(v) => onUpdateTestimonio?.(testimonios[current].id, { texto: v })}
                tag="p"
                block
                multiline
                styleKey={`testimonio.${testimonios[current].id}.texto`}
                placeholder="Lo que dijo tu cliente"
                style={{ color: palette.ink }}
                className="font-serif italic text-2xl @lg:text-3xl leading-snug mb-6 text-balance"
              />
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-8 h-8 flex items-center justify-center font-mono text-xs font-bold shrink-0"
                  style={{ background: accent, color: palette.bg }}
                >
                  {initials(testimonios[current].nombre)}
                </div>
                <Editable
                  editable={editable}
                  value={testimonios[current].nombre}
                  onChange={(v) => onUpdateTestimonio?.(testimonios[current].id, { nombre: v })}
                  tag="span"
                  styleKey={`testimonio.${testimonios[current].id}.nombre`}
                  style={{ color: palette.ink }}
                  className="font-semibold"
                  maxLength={50}
                />
              </div>
              {editable && (
                <button
                  type="button"
                  onClick={() => onRemoveTestimonio?.(testimonios[current].id)}
                  aria-label="Quitar testimonio"
                  className="absolute -top-2 right-0 text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
              {testimonios.length > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIdx((current - 1 + testimonios.length) % testimonios.length)}
                    aria-label="Testimonio anterior"
                    className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdx((current + 1) % testimonios.length)}
                    aria-label="Testimonio siguiente"
                    className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
          {editable && (
            <div className="mt-6">
              <TestimonioForm accent={accent} onAdd={(t) => onAddTestimonio?.(t)} />
            </div>
          )}
        </div>
      ) : variant === 'scroll' ? (
        <div className="max-w-6xl mx-auto -mx-6 @lg:mx-0 px-6 @lg:px-0">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-3">
            {(editable ? testimonios : testimonios.filter((t) => !t.oculto)).map((t, i, arr) => (
              <div key={t.id} className="shrink-0 snap-start w-[280px]">
                <TestimonioCard
                  t={t}
                  editable={editable}
                  accent={accent}
                  palette={palette}
                  onUpdate={(patch) => onUpdateTestimonio?.(t.id, patch)}
                  onDuplicate={() => onDuplicateTestimonio?.(t.id)}
                  onMoveUp={() => onMoveTestimonio?.(t.id, -1)}
                  onMoveDown={() => onMoveTestimonio?.(t.id, 1)}
                  canMoveUp={i > 0}
                  canMoveDown={i < arr.length - 1}
                  onToggleOculto={() => onToggleOcultoTestimonio?.(t.id)}
                  onRemove={() => onRemoveTestimonio?.(t.id)}
                />
              </div>
            ))}
            {editable && (
              <div className="shrink-0 w-[280px]">
                <TestimonioForm accent={accent} onAdd={(t) => onAddTestimonio?.(t)} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid @lg:grid-cols-3 gap-5">
          {(editable ? testimonios : testimonios.filter((t) => !t.oculto)).map((t, i, arr) => (
            <TestimonioCard
              key={t.id}
              t={t}
              editable={editable}
              accent={accent}
              palette={palette}
              onUpdate={(patch) => onUpdateTestimonio?.(t.id, patch)}
              onDuplicate={() => onDuplicateTestimonio?.(t.id)}
              onMoveUp={() => onMoveTestimonio?.(t.id, -1)}
              onMoveDown={() => onMoveTestimonio?.(t.id, 1)}
              canMoveUp={i > 0}
              canMoveDown={i < arr.length - 1}
              onToggleOculto={() => onToggleOcultoTestimonio?.(t.id)}
              onRemove={() => onRemoveTestimonio?.(t.id)}
            />
          ))}
          {editable && <TestimonioForm accent={accent} onAdd={(t) => onAddTestimonio?.(t)} />}
        </div>
      )}

      {modalOpen && (
        <ConectarResenasModal onConnect={onConnectVerifiedReviews} onClose={() => setModalOpen(false)} />
      )}
    </section>
  );
}

// La lista de preguntas en sí (acordeón), reutilizada por las dos disposiciones de FAQ.
function FAQList({
  faqs,
  accent,
  palette = {},
  editable,
  onAddFAQ,
  onRemoveFAQ,
  onUpdateFAQ,
  onDuplicateFAQ,
  onMoveFAQ,
  onToggleOcultoFAQ,
}) {
  const [openId, setOpenId] = useState(faqs[0]?.id ?? null);
  const [draftQ, setDraftQ] = useState('');
  const [draftA, setDraftA] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!draftQ.trim()) return;
    onAddFAQ?.({ q: draftQ, a: draftA });
    setDraftQ('');
    setDraftA('');
  };

  return (
    <div>
      <div>
        {faqs.length === 0 && !editable && (
          <p className="text-center text-sm py-6" style={{ color: palette.inkSoft }}>
            Todavía no cargaste preguntas frecuentes.
          </p>
        )}
        {(editable ? faqs : faqs.filter((f) => !f.oculto)).map((item, i, arr) => {
          const isOpen = editable || openId === item.id;
          const Row = editable ? 'div' : 'button';
          return (
            <div
              key={item.id}
              className={`relative group/faq-item border-b ${item.oculto ? 'opacity-40' : ''}`}
              style={{ borderColor: palette.line }}
            >
              <Row
                type={editable ? undefined : 'button'}
                onClick={editable ? undefined : () => setOpenId(openId === item.id ? null : item.id)}
                className="w-full flex items-center gap-4 py-4 text-left"
              >
                <span className="font-mono text-lg w-6 shrink-0" style={{ color: accent }}>
                  {isOpen ? '−' : '+'}
                </span>
                {(item.icon || editable) && (
                  <IconSlot
                    editable={editable}
                    value={item.icon}
                    onChange={(icon) => onUpdateFAQ?.(item.id, { icon })}
                    size="w-7 h-7"
                    iconSize="w-3.5 h-3.5"
                  />
                )}
                <Editable
                  editable={editable}
                  value={item.q}
                  onChange={(v) => onUpdateFAQ?.(item.id, { q: v })}
                  tag="span"
                  styleKey={`faq.${item.id}.q`}
                  placeholder="Escribí la pregunta"
                  style={{ color: palette.ink }}
                  className="flex-1 font-semibold text-sm @lg:text-base"
                />
              </Row>
              {editable ? (
                <Editable
                  editable
                  value={item.a}
                  onChange={(v) => onUpdateFAQ?.(item.id, { a: v })}
                  tag="p"
                  multiline
                  block
                  styleKey={`faq.${item.id}.a`}
                  placeholder="Escribí la respuesta"
                  style={{ color: palette.inkSoft }}
                  className="text-sm leading-relaxed pb-4 ml-10"
                />
              ) : (
                <div
                  className="grid transition-[grid-template-rows] duration-300"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <RichText styleKey={`faq.${item.id}.a`} tag="p" className="text-sm pb-4 ml-10 leading-relaxed max-w-md" style={{ color: palette.inkSoft }}>
                      {item.a}
                    </RichText>
                  </div>
                </div>
              )}
              {editable && (
                <div className="absolute top-3 right-0 opacity-0 group-hover/faq-item:opacity-100 transition-opacity">
                  <ItemToolbar
                    variant="inline"
                    color={palette.ink}
                    oculto={item.oculto}
                    canMoveUp={i > 0}
                    canMoveDown={i < arr.length - 1}
                    onMoveUp={() => onMoveFAQ?.(item.id, -1)}
                    onMoveDown={() => onMoveFAQ?.(item.id, 1)}
                    onDuplicate={() => onDuplicateFAQ?.(item.id)}
                    onToggleOculto={() => onToggleOcultoFAQ?.(item.id)}
                    onRemove={() => onRemoveFAQ?.(item.id)}
                    removeLabel="Quitar pregunta"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {editable && (
        <form onSubmit={submit} className="mt-4 border-2 border-dashed p-4 flex flex-col gap-2" style={{ borderColor: palette.line }}>
          <input
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="Nueva pregunta"
            className="w-full border px-3 py-2 text-sm outline-none"
            style={{ borderColor: palette.line }}
          />
          <textarea
            value={draftA}
            onChange={(e) => setDraftA(e.target.value)}
            placeholder="Respuesta"
            rows={2}
            className="w-full border px-3 py-2 text-sm outline-none resize-none"
            style={{ borderColor: palette.line }}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 self-start text-sm font-semibold py-2 px-5 text-white mt-1"
            style={{ background: palette.inkHex || '#171717' }}
          >
            <PlusIcon className="w-3.5 h-3.5" /> Agregar pregunta
          </button>
        </form>
      )}
    </div>
  );
}

// Recomendaciones del staff: ficha con foto chica del libro + nota escrita
// por quien lo leyó + badge con sus iniciales — a diferencia de "Equipo"
// (que muestra a las personas), acá el protagonista es el libro y la persona
// es solo la firma de la nota.
function SeccionRecomendados({
  items = [],
  onUpdate,
  onRemove,
  onAdd,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onRemove?.(id);
  const add = () =>
    onAdd?.({ id: `pick-${Date.now()}`, titulo: 'Título del libro', autor: 'Autor', nota: 'Por qué lo recomendamos.', staff: 'Nombre, rol', img: '' });

  const handleImg = (id) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'equipo'))) update(id, { img: await uploadImage(file) });
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <Reveal className="max-w-xl mx-auto text-center mb-10">
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="recomendados.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Lo que estamos leyendo'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="recomendados.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl mb-3"
            maxLength={70}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            placeholder="Bajada (opcional)"
            style={{ color: palette.inkSoft }}
            className="text-sm leading-relaxed"
            maxLength={160}
          />
        </Reveal>
        <div className="grid @sm:grid-cols-2 @lg:grid-cols-3 gap-7">
          {items.map((it, i) => (
            <Reveal key={it.id} delay={Math.min(i * 0.08, 0.4)} className="relative grid gap-5" style={{ gridTemplateColumns: 'auto 1fr' }}>
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label={`Quitar ${it.titulo}`}
                  className="absolute top-0 right-0 opacity-40 hover:opacity-100"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <label className={`group/pimg relative block w-24 aspect-[2/3] bg-black/5 overflow-hidden shrink-0 ${editable ? 'cursor-pointer' : ''}`}>
                {it.img ? (
                  <img src={it.img} alt={it.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-center px-1" style={{ color: palette.inkSoft }}>
                    Foto
                  </div>
                )}
                {editable && (
                  <>
                    <span className="absolute inset-0 bg-black/0 group-hover/pimg:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/pimg:opacity-100">
                      <PencilIcon className="w-3.5 h-3.5 text-white" />
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImg(it.id)} />
                  </>
                )}
              </label>
              <div className="pr-5">
                <Editable
                  editable={editable}
                  value={it.titulo}
                  onChange={(v) => update(it.id, { titulo: v })}
                  tag="div"
                  block
                  placeholder="Título"
                  style={{ color: palette.ink }}
                  className="font-serif text-[17px] leading-snug mb-0.5"
                  maxLength={60}
                />
                <Editable
                  editable={editable}
                  value={it.autor}
                  onChange={(v) => update(it.id, { autor: v })}
                  tag="div"
                  placeholder="Autor"
                  style={{ color: palette.inkSoft }}
                  className="text-xs mb-3"
                  maxLength={50}
                />
                <div className="p-3 mb-2.5" style={{ background: bgColor ? 'rgba(0,0,0,0.03)' : palette.line + '40', borderLeft: `2px solid ${accent}` }}>
                  <Editable
                    editable={editable}
                    value={it.nota}
                    onChange={(v) => update(it.id, { nota: v })}
                    tag="p"
                    block
                    multiline
                    placeholder="Nota de quien lo leyó"
                    style={{ color: palette.ink }}
                    className="font-mono text-xs leading-relaxed"
                    maxLength={280}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-5.5 h-5.5 shrink-0 flex items-center justify-center font-mono text-[10px] font-bold"
                    style={{ background: '#3f6b6b', color: '#fff' }}
                  >
                    {initials(it.staff)}
                  </span>
                  <Editable
                    editable={editable}
                    value={it.staff}
                    onChange={(v) => update(it.id, { staff: v })}
                    tag="span"
                    placeholder="Nombre, rol"
                    style={{ color: palette.inkSoft }}
                    className="text-xs"
                    maxLength={50}
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        {editable && (
          <button
            type="button"
            onClick={add}
            className="mt-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-2.5 border-2 border-dashed"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-3 h-3" /> Agregar recomendación
          </button>
        )}
      </div>
    </section>
  );
}

function SeccionFAQ({
  faqs = [],
  accent,
  palette = {},
  bgColor,
  headingColor,
  editable = false,
  variant = 'lista',
  titulo,
  onUpdateTitulo,
  imagenes = [],
  onAddFAQ,
  onRemoveFAQ,
  onUpdateFAQ,
  onDuplicateFAQ,
  onMoveFAQ,
  onToggleOcultoFAQ,
  onAddFaqImagenes,
  onRemoveFaqImagen,
  onReplaceFaqImagen,
  mediaVariant,
  onChangeMediaVariant,
}) {
  const listProps = {
    faqs,
    accent,
    palette,
    editable,
    onAddFAQ,
    onRemoveFAQ,
    onUpdateFAQ,
    onDuplicateFAQ,
    onMoveFAQ,
    onToggleOcultoFAQ,
  };
  const heading = (className) => (
    <Editable
      editable={editable}
      value={titulo ?? 'Preguntas frecuentes'}
      onChange={onUpdateTitulo}
      tag="h2"
      styleKey="faq.titulo"
      style={{ color: headingColor || palette.ink }}
      className={className}
      maxLength={70}
    />
  );

  if (variant === 'imagen-lista') {
    return (
      <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
        <div className="max-w-4xl mx-auto grid @lg:grid-cols-2 gap-8 @lg:gap-12 items-center">
          <div>
            <MediaCarousel
              images={imagenes}
              editable={editable}
              onAddImages={async (files) => onAddFaqImagenes?.(await Promise.all(files.map(uploadImage)))}
              onRemoveImage={(i) => onRemoveFaqImagen?.(i)}
              onReplaceImage={async (i, file) => onReplaceFaqImagen?.(i, await uploadImage(file))}
              mediaVariant={mediaVariant}
              onChangeMediaVariant={onChangeMediaVariant}
              aspect="aspect-square @lg:aspect-[4/5]"
              limitKey="faq"
            />
          </div>
          <div>
            {heading('font-serif italic text-2xl @lg:text-3xl mb-6')}
            <FAQList {...listProps} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-2xl mx-auto">
        <div className="pb-6 mb-6 border-b" style={{ borderColor: palette.line }}>
          {heading('font-serif italic text-2xl @lg:text-3xl')}
        </div>
        <FAQList {...listProps} />
      </div>
    </section>
  );
}

// Etiqueta chica arriba de un campo del formulario — el mismo texto que se edita ahí
// es el placeholder real que ve quien completa el formulario en la página publicada.
function CampoFormulario({
  editable,
  value,
  defaultValue,
  onChange,
  multiline = false,
  type = 'text',
  removable = false,
  tipo,
  onTipoChange,
  onRemove,
  styleKey,
}) {
  return (
    <div>
      {editable && (
        <div className="flex items-center gap-2 mb-1">
          <Editable
            editable
            value={value ?? defaultValue}
            onChange={onChange}
            tag="label"
            styleKey={styleKey}
            className="block text-xs font-semibold text-neutral-400"
          />
          {removable && (
            <>
              <select
                value={tipo}
                onChange={(e) => onTipoChange?.(e.target.value)}
                aria-label="Tipo de campo"
                className="text-[11px] border border-neutral-200 rounded px-1 py-0.5 text-neutral-500 outline-none"
              >
                <option value="text">Texto</option>
                <option value="email">Email</option>
                <option value="tel">Teléfono</option>
                <option value="textarea">Párrafo</option>
              </select>
              <button
                type="button"
                onClick={onRemove}
                aria-label="Quitar campo"
                className="text-neutral-300 hover:text-red-500 transition-colors shrink-0"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}
      {multiline ? (
        <textarea
          required
          placeholder={value ?? defaultValue}
          rows={3}
          className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-black/30 resize-none"
        />
      ) : (
        <input
          required
          type={type}
          placeholder={value ?? defaultValue}
          className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-black/30"
        />
      )}
    </div>
  );
}

// El texto del botón se edita con un popover chico (como el de WhatsApp) en vez de
// anidar un campo editable adentro del <button type="submit">, que rompería el envío.
function BotonEnviar({ editable, value, defaultValue, onChange, btnColor }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? defaultValue);

  if (!editable) {
    return (
      <button type="submit" className="w-full text-sm font-semibold py-3 text-white" style={{ background: btnColor }}>
        {value ?? defaultValue}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setDraft(value ?? defaultValue);
          setEditing((v) => !v);
        }}
        className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-3 text-white"
        style={{ background: btnColor }}
      >
        {value ?? defaultValue}
        <PencilIcon className="w-3.5 h-3.5 opacity-80" />
      </button>
      {editing && (
        <div className="absolute z-10 top-full mt-2 left-1/2 -translate-x-1/2 w-56 rounded-xl bg-white text-neutral-900 shadow-xl p-3 text-left">
          <label className="block text-xs font-semibold text-neutral-500 mb-1.5">Texto del botón</label>
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 mb-2"
          />
          <button
            type="button"
            onClick={() => {
              onChange?.(draft);
              setEditing(false);
            }}
            className="w-full rounded-lg text-white text-sm font-semibold py-2"
            style={{ background: btnColor }}
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

// El formulario en sí (campos fijos + los que agregue el dueño del negocio + botón),
// reutilizado tanto en la variante centrada como en la de imagen + formulario.
function ContactoForm({
  editable,
  placeholderNombre,
  placeholderEmail,
  placeholderMensaje,
  textoBoton,
  textoGracias,
  camposExtra,
  btnColor,
  set,
  onUpdateContacto,
}) {
  const [enviado, setEnviado] = useState(false);

  const addCampoExtra = () => {
    const nuevo = { id: `campo-${Date.now()}`, label: 'Nuevo campo', tipo: 'text' };
    onUpdateContacto?.({ contactoCamposExtra: [...camposExtra, nuevo] });
  };
  const updateCampoExtra = (id, patch) => {
    onUpdateContacto?.({ contactoCamposExtra: camposExtra.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  };
  const removeCampoExtra = (id) => {
    onUpdateContacto?.({ contactoCamposExtra: camposExtra.filter((c) => c.id !== id) });
  };

  if (enviado) {
    return (
      <Editable
        editable={editable}
        value={textoGracias ?? '¡Gracias! Te vamos a contactar a la brevedad.'}
        onChange={set('contactoTextoGracias')}
        tag="div"
        block
        multiline
        styleKey="contacto.textoGracias"
        className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium py-4 px-5"
      />
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setEnviado(true);
      }}
      className="space-y-3 text-left"
    >
      <CampoFormulario
        editable={editable}
        value={placeholderNombre}
        defaultValue="Tu nombre"
        onChange={set('contactoPlaceholderNombre')}
        styleKey="contacto.placeholderNombre"
      />
      <CampoFormulario
        editable={editable}
        value={placeholderEmail}
        defaultValue="Tu email"
        onChange={set('contactoPlaceholderEmail')}
        type="email"
        styleKey="contacto.placeholderEmail"
      />
      <CampoFormulario
        editable={editable}
        value={placeholderMensaje}
        defaultValue="Tu mensaje"
        onChange={set('contactoPlaceholderMensaje')}
        multiline
        styleKey="contacto.placeholderMensaje"
      />
      {camposExtra.map((c) => (
        <CampoFormulario
          key={c.id}
          editable={editable}
          value={c.label}
          defaultValue={c.label}
          onChange={(v) => updateCampoExtra(c.id, { label: v })}
          type={c.tipo === 'textarea' ? 'text' : c.tipo}
          multiline={c.tipo === 'textarea'}
          removable
          tipo={c.tipo}
          onTipoChange={(t) => updateCampoExtra(c.id, { tipo: t })}
          onRemove={() => removeCampoExtra(c.id)}
          styleKey={`contacto.campoExtra.${c.id}`}
        />
      ))}
      {editable && (
        <button
          type="button"
          onClick={addCampoExtra}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-black/15 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 text-xs font-semibold py-2 transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" /> Agregar campo
        </button>
      )}
      <BotonEnviar
        editable={editable}
        value={textoBoton}
        defaultValue="Enviar mensaje"
        onChange={set('contactoTextoBoton')}
        btnColor={btnColor}
      />
    </form>
  );
}

// Sección oscura de club/comunidad: foto + texto + una fila de datos clave
// (próximo encuentro, dónde, cuánto) + un botón de "anotarme" que alterna
// entre dos estados (como el "¿Venís?" de RSVP, pero de un solo toque, sin
// formulario) — ephemeral en la sesión del visitante, no hay backend de
// inscripciones real.
function SeccionClubLectura({
  imagen,
  onUpdateImagen,
  eyebrow,
  onUpdateEyebrow,
  titulo,
  onUpdateTitulo,
  descripcion,
  onUpdateDescripcion,
  datos = [],
  onUpdateDatos,
  etiquetaUnido,
  etiquetaSinUnir,
  notaUnido,
  notaSinUnir,
  editable,
  bgColor,
  headingColor,
  textColor,
  palette = {},
}) {
  const [joined, setJoined] = useState(false);

  const handleImg = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) onUpdateImagen?.(await uploadImage(file));
  };

  const updateDato = (id, patch) => onUpdateDatos?.(datos.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const removeDato = (id) => onUpdateDatos?.(datos.filter((d) => d.id !== id));
  const addDato = () => onUpdateDatos?.([...datos, { id: `dato-${Date.now()}`, label: 'Dato', valor: 'Valor' }]);

  const suave = textColor || 'rgba(244,239,228,0.7)';

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.ink, color: textColor || palette.bg }}>
      <div className="max-w-5xl mx-auto grid @lg:grid-cols-[0.9fr_1.1fr] gap-8 @lg:gap-12 items-center">
        <Reveal as="label" className={`group/cimg relative block aspect-[4/3] bg-black/20 overflow-hidden ${editable ? 'cursor-pointer' : ''}`}>
          {imagen ? (
            <img src={imagen} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-center px-4" style={{ color: suave }}>
              Agregá una foto
            </div>
          )}
          {editable && (
            <>
              <span className="absolute inset-0 bg-black/0 group-hover/cimg:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/cimg:opacity-100">
                <PencilIcon className="w-4 h-4 text-white" />
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImg} />
            </>
          )}
        </Reveal>
        <Reveal delay={0.12}>
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="clublectura.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: '#e0a37f' }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={60}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Club de lectura'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="clublectura.titulo"
            style={{ color: headingColor || textColor || palette.bg }}
            className="font-serif text-2xl @lg:text-3xl mb-3"
            maxLength={90}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            placeholder="Descripción del club"
            style={{ color: suave }}
            className="text-sm leading-relaxed mb-6 max-w-md"
            maxLength={280}
          />
          <div
            className="grid gap-4 mb-6 py-4"
            style={{ gridTemplateColumns: `repeat(${Math.max(datos.length, 1)}, minmax(120px, 1fr))`, borderTop: '1px solid rgba(244,239,228,0.18)', borderBottom: '1px solid rgba(244,239,228,0.18)' }}
          >
            {datos.map((d) => (
              <div key={d.id} className="relative">
                {editable && (
                  <button
                    type="button"
                    onClick={() => removeDato(d.id)}
                    aria-label="Quitar"
                    className="absolute -top-1 -right-1 opacity-50 hover:opacity-100"
                    style={{ color: textColor || palette.bg }}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
                <Editable
                  editable={editable}
                  value={d.label}
                  onChange={(v) => updateDato(d.id, { label: v })}
                  tag="div"
                  placeholder="Dato"
                  style={{ color: 'rgba(244,239,228,0.5)' }}
                  className="font-mono text-[10px] uppercase tracking-wide mb-1"
                  maxLength={30}
                />
                <Editable
                  editable={editable}
                  value={d.valor}
                  onChange={(v) => updateDato(d.id, { valor: v })}
                  tag="div"
                  block
                  placeholder="Valor"
                  style={{ color: textColor || palette.bg }}
                  className="text-sm font-medium"
                  maxLength={60}
                />
              </div>
            ))}
            {editable && (
              <button
                type="button"
                onClick={addDato}
                className="text-xs font-semibold underline decoration-dotted self-start"
                style={{ color: suave }}
              >
                + Agregar dato
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setJoined((v) => !v)}
              className="font-semibold text-sm px-6 py-3 border transition-colors"
              style={
                joined
                  ? { background: '#e0a37f', color: palette.ink, borderColor: '#e0a37f' }
                  : { background: 'transparent', color: textColor || palette.bg, borderColor: '#e0a37f' }
              }
            >
              {joined ? (etiquetaUnido || '✓ Estás anotado') : (etiquetaSinUnir || 'Anotarme al encuentro')}
            </button>
            <span className="font-mono text-xs" style={{ color: suave }}>
              {joined ? (notaUnido || 'Te esperamos') : (notaSinUnir || 'Quedan lugares')}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Compara dos productos lado a lado eligiéndolos de dos selects — pensada
// para catálogos de electrónica/tecnología donde el cliente duda entre dos
// modelos puntuales. Cada modelo trae sus specs como pares clave/valor;
// "campos" define qué claves se muestran y en qué orden. La fila de precio
// resalta el modelo más barato usando el precioNum numérico de cada modelo
// (el texto mostrado sigue siendo el de specs.precio, ya formateado).
function SeccionComparador({
  modelos = [],
  onUpdate,
  campos = [],
  onUpdateCampos,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(Math.min(1, modelos.length - 1));

  const updateModelo = (id, patch) => onUpdate?.(modelos.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const updateSpec = (id, key, value) =>
    updateModelo(id, { specs: { ...(modelos.find((m) => m.id === id)?.specs || {}), [key]: value } });
  const removeModelo = (id) => onUpdate?.(modelos.filter((m) => m.id !== id));
  const addModelo = () =>
    onUpdate?.([...modelos, { id: `modelo-${Date.now()}`, nombre: 'Nuevo modelo', precioNum: 0, specs: {} }]);

  const addCampo = () => {
    const label = window.prompt('Nombre de la especificación (ej: Batería)');
    if (!label?.trim()) return;
    const key = `campo-${Date.now()}`;
    onUpdateCampos?.([...campos, { key, label: label.trim() }]);
  };
  const removeCampo = (key) => onUpdateCampos?.(campos.filter((c) => c.key !== key));

  const a = modelos[Math.min(idxA, modelos.length - 1)];
  const b = modelos[Math.min(idxB, modelos.length - 1)];

  const Select = ({ value, onChange }) => (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full border px-3 py-2.5 text-sm font-semibold outline-none bg-white"
      style={{ borderColor: palette.line, color: palette.ink }}
    >
      {modelos.map((m, i) => (
        <option key={m.id} value={i}>
          {m.nombre}
        </option>
      ))}
    </select>
  );

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="comparador.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Comparar productos'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="comparador.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl mb-2"
            maxLength={70}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            placeholder="Bajada (opcional)"
            style={{ color: palette.inkSoft }}
            className="text-sm max-w-lg"
            maxLength={160}
          />
        </div>

        {modelos.length < 2 ? (
          <p className="text-sm" style={{ color: palette.inkSoft }}>
            Agregá al menos dos modelos para poder compararlos.
          </p>
        ) : (
          <div className="border overflow-x-auto" style={{ borderColor: palette.line }}>
            <div className="grid grid-cols-[1.1fr_1fr_1fr] min-w-[560px]">
              <div className="p-3 @lg:p-4 font-mono text-[11px] uppercase tracking-wide flex items-center" style={{ background: palette.bg, color: palette.inkSoft, borderBottom: `1px solid ${palette.line}` }}>
                Especificación
              </div>
              <div className="p-2.5 @lg:p-3" style={{ background: palette.bg, borderBottom: `1px solid ${palette.line}`, borderLeft: `1px solid ${palette.line}` }}>
                <Select value={idxA} onChange={setIdxA} />
              </div>
              <div className="p-2.5 @lg:p-3" style={{ background: palette.bg, borderBottom: `1px solid ${palette.line}`, borderLeft: `1px solid ${palette.line}` }}>
                <Select value={idxB} onChange={setIdxB} />
              </div>
              {campos.map((c, i) => {
                const av = a?.specs?.[c.key] ?? '';
                const bv = b?.specs?.[c.key] ?? '';
                let winnerA = false;
                let winnerB = false;
                if (c.key === 'precio' && a && b) {
                  if ((a.precioNum ?? 0) < (b.precioNum ?? 0)) winnerA = true;
                  else if ((b.precioNum ?? 0) < (a.precioNum ?? 0)) winnerB = true;
                }
                return (
                  <div className="contents" key={c.key}>
                    <div
                      className="relative p-3 @lg:p-4 text-sm font-medium flex items-center"
                      style={{ color: palette.inkSoft, background: i % 2 === 0 ? palette.bg : 'transparent', borderBottom: `1px solid ${palette.line}` }}
                    >
                      {editable ? (
                        <Editable
                          editable
                          value={c.label}
                          onChange={(v) => onUpdateCampos?.(campos.map((cc) => (cc.key === c.key ? { ...cc, label: v } : cc)))}
                          tag="span"
                          maxLength={30}
                        />
                      ) : (
                        c.label
                      )}
                      {editable && (
                        <button
                          type="button"
                          onClick={() => removeCampo(c.key)}
                          aria-label={`Quitar ${c.label}`}
                          className="absolute top-1/2 right-2 -translate-y-1/2 opacity-40 hover:opacity-100"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {[
                      { m: a, v: av, win: winnerA },
                      { m: b, v: bv, win: winnerB },
                    ].map(({ m, v, win }, colI) => (
                      <div
                        key={colI}
                        className="p-3 @lg:p-4 text-sm"
                        style={{
                          borderBottom: `1px solid ${palette.line}`,
                          borderLeft: `1px solid ${palette.line}`,
                          background: i % 2 === 0 ? palette.bg : 'transparent',
                          fontWeight: win ? 700 : 500,
                          color: win ? accent : palette.ink,
                        }}
                      >
                        {editable ? (
                          <Editable editable value={v} onChange={(nv) => m && updateSpec(m.id, c.key, nv)} tag="span" maxLength={40} />
                        ) : (
                          v
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {editable && (
          <div className="mt-6 space-y-5">
            <button
              type="button"
              onClick={addCampo}
              className="text-xs font-semibold underline decoration-dotted"
              style={{ color: palette.inkSoft }}
            >
              + Agregar especificación
            </button>
            <div className="flex flex-wrap gap-2">
              {modelos.map((m) => (
                <div key={m.id} className="relative border p-3 flex flex-col gap-1.5 min-w-[160px]" style={{ borderColor: palette.line }}>
                  <button
                    type="button"
                    onClick={() => removeModelo(m.id)}
                    aria-label={`Quitar ${m.nombre}`}
                    className="absolute top-1.5 right-1.5 opacity-40 hover:opacity-100"
                    style={{ color: palette.ink }}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                  <Editable
                    editable
                    value={m.nombre}
                    onChange={(v) => updateModelo(m.id, { nombre: v })}
                    tag="span"
                    className="font-semibold text-sm pr-4"
                    style={{ color: palette.ink }}
                    maxLength={40}
                  />
                  <label className="text-[10px] font-mono uppercase" style={{ color: palette.inkSoft }}>
                    Precio (número, para saber cuál es más barato)
                    <input
                      type="number"
                      value={m.precioNum ?? 0}
                      onChange={(e) => updateModelo(m.id, { precioNum: Number(e.target.value) || 0 })}
                      className="block w-full border px-2 py-1 mt-1 text-xs"
                      style={{ borderColor: palette.line, color: palette.ink }}
                    />
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={addModelo}
                className="border-2 border-dashed flex items-center justify-center gap-1.5 px-4 text-sm font-semibold min-w-[140px]"
                style={{ borderColor: palette.line, color: palette.inkSoft }}
              >
                <PlusIcon className="w-4 h-4" /> Agregar modelo
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Agenda de firmas/presentaciones/talleres: día y mes grandes + título +
// detalle + horario — a diferencia de Cronograma (que ordena los momentos de
// UN evento propio con línea de tiempo), acá cada fila es un evento
// INDEPENDIENTE con su propia fecha en el calendario del negocio.
function SeccionFirmasEventos({
  items = [],
  onUpdate,
  onRemove,
  onAdd,
  titulo,
  onUpdateTitulo,
  nota,
  onUpdateNota,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onRemove?.(id);
  const add = () => onAdd?.({ id: `evt-${Date.now()}`, dia: '01', mes: 'Ene', titulo: 'Nuevo evento', detalle: '', hora: '19:00' });

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-4xl mx-auto">
        <Reveal
          className="mb-8 border-b pb-5 flex flex-wrap items-baseline justify-between gap-4"
          style={{ borderColor: palette.line }}
        >
          <Editable
            editable={editable}
            value={titulo ?? 'Firmas y presentaciones'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="firmaseventos.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl"
            maxLength={70}
          />
          <Editable
            editable={editable}
            value={nota}
            onChange={onUpdateNota}
            tag="span"
            placeholder="Entrada libre · Se sugiere reservar"
            style={{ color: palette.inkSoft }}
            className="font-mono text-xs"
            maxLength={60}
          />
        </Reveal>
        <div>
          {items.map((it, i) => (
            <Reveal
              key={it.id}
              delay={Math.min(i * 0.08, 0.4)}
              className="relative grid gap-5 items-center py-5 border-b"
              style={{ gridTemplateColumns: 'auto 1fr auto', borderColor: palette.line }}
            >
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label="Quitar"
                  className="absolute top-2 right-0 opacity-40 hover:opacity-100"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="text-center min-w-[3.6rem]">
                <Editable
                  editable={editable}
                  value={it.dia}
                  onChange={(v) => update(it.id, { dia: v })}
                  tag="div"
                  placeholder="01"
                  style={{ color: palette.ink }}
                  className="font-serif text-3xl leading-none"
                  maxLength={4}
                />
                <Editable
                  editable={editable}
                  value={it.mes}
                  onChange={(v) => update(it.id, { mes: v })}
                  tag="div"
                  placeholder="Mes"
                  style={{ color: accent }}
                  className="font-mono text-[10px] uppercase tracking-wide mt-1"
                  maxLength={10}
                />
              </div>
              <div className="pr-5">
                <Editable
                  editable={editable}
                  value={it.titulo}
                  onChange={(v) => update(it.id, { titulo: v })}
                  tag="div"
                  block
                  placeholder="Título del evento"
                  style={{ color: palette.ink }}
                  className="font-semibold text-base mb-1"
                  maxLength={80}
                />
                <Editable
                  editable={editable}
                  value={it.detalle}
                  onChange={(v) => update(it.id, { detalle: v })}
                  tag="div"
                  block
                  multiline
                  placeholder="Detalle breve"
                  style={{ color: palette.inkSoft }}
                  className="text-sm"
                  maxLength={140}
                />
              </div>
              <Editable
                editable={editable}
                value={it.hora}
                onChange={(v) => update(it.id, { hora: v })}
                tag="div"
                placeholder="19:00"
                style={{ color: '#3f6b6b' }}
                className="font-mono text-sm text-right"
                maxLength={10}
              />
            </Reveal>
          ))}
        </div>
        {editable && (
          <button
            type="button"
            onClick={add}
            className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-2.5 border-2 border-dashed"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-3 h-3" /> Agregar evento
          </button>
        )}
      </div>
    </section>
  );
}

// Cotizador rápido: el visitante elige una opción (cultivo, servicio, lo que
// sea) y escribe una cantidad (hectáreas, metros, lo que corresponda), y ve
// al instante una cotización con varias filas de detalle + un total — a
// diferencia de "Plan canje" (que combina DOS selects fijos con una fórmula
// única), acá es UNA opción + una cantidad libre, con una fórmula propia por
// opción (dosis/precio/extra), pensado para insumos por hectárea.
function SeccionCotizador({
  opciones = [],
  onUpdate,
  onRemove,
  onAdd,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  cantidadLabel,
  onUpdateCantidadLabel,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const [optIdx, setOptIdx] = useState(0);
  const [cantidad, setCantidad] = useState('250');

  const opt = opciones[Math.min(optIdx, Math.max(opciones.length - 1, 0))];
  const qty = Math.max(0, parseFloat(String(cantidad).replace(',', '.')) || 0);
  const costoUnitario = opt ? (opt.dosis || 0) * (opt.precioUnitario || 0) + (opt.extra || 0) : 0;
  const total = costoUnitario * qty;

  const update = (id, patch) => onUpdate?.(opciones.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const remove = (id) => onRemove?.(id);
  const add = () =>
    onAdd?.({ id: `opt-${Date.now()}`, label: 'Nueva opción', dosis: 1, dosisUnidad: 'kg/ha', producto: 'Producto sugerido', precioUnitario: 0, precioUnidad: 'kg', extra: 0 });

  const money = (n) => '$' + Math.round(n).toLocaleString('es-AR');

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto grid @lg:grid-cols-2 gap-8 @lg:gap-12 items-start">
        <Reveal>
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="cotizador.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: '#3f6b2b' }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Calculá tu planteo en 30 segundos'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="cotizador.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl mb-4"
            maxLength={90}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            placeholder="Descripción breve"
            style={{ color: palette.inkSoft }}
            className="text-sm leading-relaxed mb-6 max-w-md"
            maxLength={220}
          />
          <div className="flex flex-col gap-5">
            <div>
              {editable ? (
                <div className="flex flex-wrap gap-2 mb-1">
                  {opciones.map((o) => (
                    <div key={o.id} className="relative border p-2.5 flex flex-col gap-1 min-w-[140px]" style={{ borderColor: palette.line }}>
                      {editable && (
                        <button
                          type="button"
                          onClick={() => remove(o.id)}
                          aria-label={`Quitar ${o.label}`}
                          className="absolute top-1 right-1 opacity-50 hover:opacity-100"
                          style={{ color: palette.ink }}
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      )}
                      <Editable
                        editable
                        value={o.label}
                        onChange={(v) => update(o.id, { label: v })}
                        tag="span"
                        className="text-xs font-semibold pr-3"
                        style={{ color: palette.ink }}
                        maxLength={20}
                      />
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={o.dosis ?? 0}
                          onChange={(e) => update(o.id, { dosis: Number(e.target.value) || 0 })}
                          placeholder="Dosis"
                          className="w-full border px-1.5 py-1 text-xs"
                          style={{ borderColor: palette.line, color: palette.ink }}
                        />
                        <input
                          type="number"
                          value={o.precioUnitario ?? 0}
                          onChange={(e) => update(o.id, { precioUnitario: Number(e.target.value) || 0 })}
                          placeholder="Precio"
                          className="w-full border px-1.5 py-1 text-xs"
                          style={{ borderColor: palette.line, color: palette.ink }}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={add}
                    className="border-2 border-dashed flex items-center justify-center px-3 text-xs font-semibold min-w-[90px]"
                    style={{ borderColor: palette.line, color: palette.inkSoft }}
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <label className="block font-mono text-xs uppercase tracking-wide mb-2" style={{ color: palette.inkSoft }}>
                    {opciones[0]?.categoria || 'Opción'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {opciones.map((o, i) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setOptIdx(i)}
                        className="border text-sm px-4 py-2.5 font-semibold transition-colors"
                        style={
                          i === optIdx
                            ? { borderColor: '#3f6b2b', background: '#e8efe0', color: '#3f6b2b' }
                            : { borderColor: palette.line, color: palette.ink, background: palette.bg }
                        }
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div>
              <Editable
                editable={editable}
                value={cantidadLabel}
                onChange={onUpdateCantidadLabel}
                tag="label"
                block
                placeholder="Superficie a tratar (hectáreas)"
                style={{ color: palette.inkSoft }}
                className="font-mono text-xs uppercase tracking-wide mb-2"
                maxLength={60}
              />
              <input
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value.replace(/[^0-9.,]/g, ''))}
                placeholder="Ej: 250"
                className="w-full box-border border px-4 py-3 text-base font-mono outline-none"
                style={{ borderColor: palette.line, background: palette.bg, color: palette.ink }}
              />
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.12} className="p-6 @lg:p-8" style={{ background: palette.inkHex || '#171717', color: '#f6f6f1' }}>
          <div className="font-mono text-[11px] uppercase tracking-wide mb-5" style={{ color: '#e0b968' }}>
            Estimación — {opt?.label || '—'}
          </div>
          <div className="flex flex-col gap-3 mb-6">
            {[
              { label: 'Planteo sugerido', value: opt?.producto || '—' },
              { label: 'Dosis recomendada', value: opt ? `${(opt.dosis || 0).toLocaleString('es-AR')} ${opt.dosisUnidad || ''}` : '—' },
              { label: 'Superficie', value: `${qty.toLocaleString('es-AR')} ${opciones[0]?.cantidadUnidad || 'ha'}` },
              { label: 'Volumen total', value: opt ? `${((opt.dosis || 0) * qty).toLocaleString('es-AR', { maximumFractionDigits: 1 })} ${(opt.dosisUnidad || '').replace('/ha', '')}` : '—' },
            ].map((r) => (
              <div key={r.label} className="flex justify-between gap-3 pb-3 border-b" style={{ borderColor: 'rgba(246,246,241,0.14)' }}>
                <span className="text-sm" style={{ color: 'rgba(246,246,241,0.65)' }}>
                  {r.label}
                </span>
                <span className="font-mono text-sm text-right">{r.value}</span>
              </div>
            ))}
          </div>
          <div className="p-5 mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="font-mono text-[10px] uppercase tracking-wide mb-2" style={{ color: 'rgba(246,246,241,0.55)' }}>
              Costo estimado total
            </div>
            <div className="font-serif font-bold text-3xl leading-none" style={{ color: '#a3c77e' }}>
              {money(total)}
            </div>
            <div className="font-mono text-xs mt-2" style={{ color: 'rgba(246,246,241,0.6)' }}>
              {money(costoUnitario)} por {opciones[0]?.cantidadUnidad || 'ha'} · precio de {opt?.precioUnidad || 'unidad'}: {money(opt?.precioUnitario || 0)}
            </div>
          </div>
          <a
            href="#/whatsapp"
            className="block text-center font-semibold text-sm py-3.5"
            style={{ background: accent, color: palette.inkHex || '#171717' }}
          >
            Pedir cotización formal
          </a>
        </Reveal>
      </div>
    </section>
  );
}

// Calculadora de plan canje: el visitante elige un modelo propio y su estado
// de conservación, y ve al instante cuánto se le tomaría a cuenta de una
// compra nueva (valorBase del modelo × el factor del estado, redondeado al
// millar). El cálculo es solo orientativo, se aclara que se confirma en el
// local — no hay ninguna tasación real conectada del otro lado.
function SeccionCanje({
  modelos = [],
  onUpdate,
  condiciones = [],
  onUpdateCondiciones,
  perks = [],
  onUpdatePerks,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
  whatsapp,
  nombreNegocio,
  botones: botonesData = {},
  onUpdateBotones,
  seccionesDisponibles = [],
}) {
  const [modeloIdx, setModeloIdx] = useState(0);
  const [condIdx, setCondIdx] = useState(0);

  const modelo = modelos[Math.min(modeloIdx, Math.max(modelos.length - 1, 0))];
  const condicion = condiciones[Math.min(condIdx, Math.max(condiciones.length - 1, 0))];
  const valor = modelo && condicion ? Math.round(((modelo.valorBase || 0) * (condicion.factor ?? 1)) / 1000) * 1000 : 0;

  const updateModelo = (id, patch) => onUpdate?.(modelos.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const addModelo = () => onUpdate?.([...modelos, { id: `canje-modelo-${Date.now()}`, nombre: 'Modelo', valorBase: 0 }]);
  const removeModelo = (id) => onUpdate?.(modelos.filter((m) => m.id !== id));

  const updateCond = (id, patch) => onUpdateCondiciones?.(condiciones.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addCond = () =>
    onUpdateCondiciones?.([...condiciones, { id: `cond-${Date.now()}`, label: 'Estado', hint: '', factor: 1 }]);
  const removeCond = (id) => onUpdateCondiciones?.(condiciones.filter((c) => c.id !== id));

  const updatePerk = (i, v) => onUpdatePerks?.(perks.map((p, pi) => (pi === i ? v : p)));
  const addPerk = () => onUpdatePerks?.([...perks, 'Nuevo beneficio']);
  const removePerk = (i) => onUpdatePerks?.(perks.filter((_, pi) => pi !== i));

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto grid @lg:grid-cols-2 gap-8 @lg:gap-12 items-start">
        <div>
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="canje.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Plan canje'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="canje.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl mb-4"
            maxLength={70}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            placeholder="Descripción del plan canje"
            style={{ color: palette.inkSoft }}
            className="text-sm leading-relaxed mb-6"
            maxLength={220}
          />
          <div className="flex flex-col gap-2.5">
            {perks.map((p, i) => (
              <div key={i} className="relative flex gap-2.5 items-start text-sm" style={{ color: palette.inkSoft }}>
                <span className="font-bold shrink-0" style={{ color: accent }}>
                  ✓
                </span>
                <Editable
                  editable={editable}
                  value={p}
                  onChange={(v) => updatePerk(i, v)}
                  tag="span"
                  block
                  multiline
                  maxLength={100}
                />
                {editable && (
                  <button type="button" onClick={() => removePerk(i)} aria-label="Quitar" className="opacity-40 hover:opacity-100 shrink-0">
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {editable && (
              <button
                type="button"
                onClick={addPerk}
                className="text-xs font-semibold underline decoration-dotted self-start"
                style={{ color: palette.inkSoft }}
              >
                + Agregar beneficio
              </button>
            )}
          </div>
        </div>

        <div className="p-6 @lg:p-8" style={{ background: palette.inkHex || '#171717' }}>
          <p className="font-serif text-lg mb-5" style={{ color: '#ffffff' }}>
            Cotizá tu usado
          </p>
          <label className="block font-mono text-[10px] uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Tu equipo actual
          </label>
          {editable ? (
            <div className="flex flex-wrap gap-2 mb-5">
              {modelos.map((m) => (
                <div key={m.id} className="relative border p-2.5 flex flex-col gap-1 min-w-[130px]" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <button
                    type="button"
                    onClick={() => removeModelo(m.id)}
                    aria-label={`Quitar ${m.nombre}`}
                    className="absolute top-1 right-1 opacity-50 hover:opacity-100"
                    style={{ color: '#fff' }}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                  <Editable
                    editable
                    value={m.nombre}
                    onChange={(v) => updateModelo(m.id, { nombre: v })}
                    tag="span"
                    className="text-xs font-semibold pr-3"
                    style={{ color: '#fff' }}
                    maxLength={30}
                  />
                  <input
                    type="number"
                    value={m.valorBase ?? 0}
                    onChange={(e) => updateModelo(m.id, { valorBase: Number(e.target.value) || 0 })}
                    placeholder="Valor base"
                    className="w-full border px-1.5 py-1 text-xs bg-transparent"
                    style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addModelo}
                className="border-2 border-dashed flex items-center justify-center px-3 text-xs font-semibold min-w-[100px]"
                style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.7)' }}
              >
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <select
              value={modeloIdx}
              onChange={(e) => setModeloIdx(Number(e.target.value))}
              className="w-full box-border border px-3 py-2.5 text-sm mb-5 outline-none"
              style={{ background: '#1b2126', borderColor: 'rgba(255,255,255,0.18)', color: '#f3f5f6' }}
            >
              {modelos.map((m, i) => (
                <option key={m.id} value={i}>
                  {m.nombre}
                </option>
              ))}
            </select>
          )}

          <label className="block font-mono text-[10px] uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Estado
          </label>
          <div className={`grid gap-2 mb-7 ${editable ? '' : 'grid-cols-3'}`}>
            {condiciones.map((c, i) => (
              <div
                key={c.id}
                onClick={() => !editable && setCondIdx(i)}
                className={`relative text-center p-2.5 border transition-all ${editable ? 'flex items-center gap-2' : ''} ${!editable ? 'cursor-pointer' : ''}`}
                style={
                  i === condIdx
                    ? { borderColor: '#00d4c8', background: 'rgba(0,212,200,0.12)', color: '#00d4c8' }
                    : { borderColor: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.75)' }
                }
              >
                {editable ? (
                  <>
                    <Editable editable value={c.label} onChange={(v) => updateCond(c.id, { label: v })} tag="span" className="text-sm font-semibold" maxLength={20} />
                    <Editable editable value={c.hint} onChange={(v) => updateCond(c.id, { hint: v })} tag="span" placeholder="Pista" className="text-xs opacity-70" maxLength={30} />
                    <input
                      type="number"
                      step="0.01"
                      value={c.factor ?? 1}
                      onChange={(e) => updateCond(c.id, { factor: Number(e.target.value) })}
                      title="Factor (1 = 100% del valor base)"
                      className="w-16 border px-1 py-0.5 text-xs bg-transparent ml-auto"
                      style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                    />
                    <button type="button" onClick={() => removeCond(c.id)} aria-label="Quitar" className="opacity-50 hover:opacity-100">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-sm">{c.label}</div>
                    <div className="font-mono text-[10px] opacity-70 mt-0.5">{c.hint}</div>
                  </>
                )}
              </div>
            ))}
            {editable && (
              <button
                type="button"
                onClick={addCond}
                className="text-xs font-semibold underline decoration-dotted self-start"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                + Agregar estado
              </button>
            )}
          </div>

          <div className="border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <div className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Te tomamos hasta
            </div>
            <div className="font-serif font-bold text-3xl @lg:text-4xl" style={{ color: '#00d4c8' }}>
              ${valor.toLocaleString('es-AR')}
            </div>
            <div className="mt-5">
              <ButtonObject
                value={botonesData.primary}
                onChange={(patch) => onUpdateBotones?.({ ...botonesData, primary: { ...(botonesData.primary || {}), ...patch } })}
                editable={editable}
                seccionesDisponibles={seccionesDisponibles}
                nombreNegocio={nombreNegocio}
                defaultFuncion="whatsapp"
                defaultLabel="Coordinar el canje →"
                defaultColor="#00918c"
                defaultTarget={whatsapp}
                waMessage={modelo ? `Hola! Quiero coordinar el plan canje de mi ${modelo.nombre}.` : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Encargo especial: pasos numerados a la izquierda (cómo funciona) + un
// formulario simple (título/autor/whatsapp) a la derecha con pantalla de
// confirmado — mismo patrón ephemeral-solo-en-sesión que RSVP/Playlist, para
// negocios que "consiguen" lo que no tienen en el momento.
function SeccionPedidosEspeciales({
  pasos = [],
  onUpdatePasos,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  mensajeConfirmado,
  onUpdateMensajeConfirmado,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const [tituloLibro, setTituloLibro] = useState('');
  const [autor, setAutor] = useState('');
  const [telefono, setTelefono] = useState('');
  const [sent, setSent] = useState(false);
  const [sentTitulo, setSentTitulo] = useState('');

  const updatePaso = (id, patch) => onUpdatePasos?.(pasos.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePaso = (id) => onUpdatePasos?.(pasos.filter((p) => p.id !== id));
  const addPaso = () => onUpdatePasos?.([...pasos, { id: `paso-${Date.now()}`, texto: 'Nuevo paso' }]);

  const valid = tituloLibro.trim().length > 1 && telefono.trim().length > 5;
  const reset = () => {
    setSent(false);
    setTituloLibro('');
    setAutor('');
    setTelefono('');
  };
  const send = () => {
    if (!valid) return;
    setSentTitulo(tituloLibro.trim());
    setSent(true);
  };

  return (
    <section id="pedidos" className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto grid @lg:grid-cols-2 gap-8 @lg:gap-12 items-start">
        <Reveal>
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="pedidosespeciales.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Si no lo tenemos, lo conseguimos'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="pedidosespeciales.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl mb-4"
            maxLength={80}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            placeholder="Descripción breve"
            style={{ color: palette.inkSoft }}
            className="text-sm leading-relaxed mb-6 max-w-md"
            maxLength={220}
          />
          <div className="flex flex-col gap-3">
            {pasos.map((p, i) => (
              <div key={p.id} className="relative grid gap-3 items-baseline" style={{ gridTemplateColumns: 'auto 1fr' }}>
                <span className="font-mono text-xs font-bold" style={{ color: accent }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Editable
                  editable={editable}
                  value={p.texto}
                  onChange={(v) => updatePaso(p.id, { texto: v })}
                  tag="span"
                  block
                  placeholder="Paso"
                  style={{ color: palette.ink }}
                  className="text-sm leading-relaxed pr-5"
                  maxLength={140}
                />
                {editable && (
                  <button
                    type="button"
                    onClick={() => removePaso(p.id)}
                    aria-label="Quitar"
                    className="absolute top-0 right-0 opacity-40 hover:opacity-100"
                    style={{ color: palette.ink }}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {editable && (
              <button
                type="button"
                onClick={addPaso}
                className="text-xs font-semibold underline decoration-dotted self-start"
                style={{ color: palette.inkSoft }}
              >
                + Agregar paso
              </button>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.12} className="border p-6 @lg:p-8" style={{ borderColor: palette.line, background: palette.bg }}>
          {sent ? (
            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto mb-4 border flex items-center justify-center font-serif text-lg"
                style={{ borderColor: '#3f6b6b', color: '#3f6b6b' }}
              >
                ✓
              </div>
              <div className="font-serif text-xl mb-2.5" style={{ color: palette.ink }}>
                Pedido anotado
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: palette.inkSoft }}>
                {(mensajeConfirmado || 'Anotamos "{titulo}". Te escribimos por WhatsApp en menos de 24 hs con precio y fecha estimada de llegada.').replace('{titulo}', sentTitulo)}
              </p>
              <button type="button" onClick={reset} className="text-xs uppercase tracking-wide border-b" style={{ color: accent, borderColor: palette.line }}>
                Encargar otro libro
              </button>
              {editable && (
                <div className="mt-6 pt-5 border-t text-left" style={{ borderColor: palette.line }}>
                  <label className="block text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: palette.inkSoft }}>
                    Mensaje de confirmación (usá {'{titulo}'})
                  </label>
                  <textarea
                    value={mensajeConfirmado || ''}
                    onChange={(e) => onUpdateMensajeConfirmado?.(e.target.value)}
                    rows={2}
                    className="w-full border px-2.5 py-2 text-xs"
                    style={{ borderColor: palette.line, color: palette.ink }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wide mb-2" style={{ color: palette.inkSoft }}>
                Título del libro
              </label>
              <input
                value={tituloLibro}
                onChange={(e) => setTituloLibro(e.target.value)}
                placeholder="Ej: Los siete locos"
                className="w-full box-border border px-3.5 py-2.5 text-sm outline-none mb-5"
                style={{ borderColor: palette.line, background: palette.bg, color: palette.ink }}
              />
              <label className="block font-mono text-[11px] uppercase tracking-wide mb-2" style={{ color: palette.inkSoft }}>
                Autor o editorial (opcional)
              </label>
              <input
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                placeholder="Ej: Roberto Arlt"
                className="w-full box-border border px-3.5 py-2.5 text-sm outline-none mb-5"
                style={{ borderColor: palette.line, background: palette.bg, color: palette.ink }}
              />
              <label className="block font-mono text-[11px] uppercase tracking-wide mb-2" style={{ color: palette.inkSoft }}>
                Tu WhatsApp
              </label>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 11 5555-1234"
                className="w-full box-border border px-3.5 py-2.5 text-sm outline-none mb-6"
                style={{ borderColor: palette.line, background: palette.bg, color: palette.ink }}
              />
              <button
                type="button"
                onClick={send}
                className="w-full text-center text-sm font-semibold py-3 transition-colors"
                style={{ background: valid ? accent : palette.line, color: '#fff' }}
              >
                Enviar pedido
              </button>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// Tabla de resultados con scroll horizontal en pantallas chicas — filas de
// datos comparables (campaña/tratamiento/rendimiento/testigo/diferencia),
// pensada para mostrar ensayos, mediciones o cualquier tabla de resultados
// reales, a diferencia de "Comparador" (que enfrenta solo DOS productos
// elegidos con selects, no una lista abierta de filas).
function SeccionEnsayos({
  columnas = [],
  onUpdateColumnas,
  filas = [],
  onUpdate,
  onRemove,
  onAdd,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  nota,
  onUpdateNota,
  editable,
  bgColor,
  headingColor,
  palette = {},
}) {
  const updateCol = (idx, value) => onUpdateColumnas?.(columnas.map((c, i) => (i === idx ? value : c)));
  const updateCell = (id, idx, value) => {
    const row = filas.find((r) => r.id === id);
    if (!row) return;
    onUpdate?.(filas.map((r) => (r.id === id ? { ...r, cells: r.cells.map((c, i) => (i === idx ? value : c)) } : r)));
  };
  const removeRow = (id) => onRemove?.(id);
  const addRow = () => onAdd?.({ id: `fila-${Date.now()}`, cells: columnas.map(() => '—') });

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Editable
              editable={editable}
              value={eyebrow}
              onChange={onUpdateEyebrow}
              tag="span"
              block
              styleKey="ensayos.eyebrow"
              placeholder="Eyebrow (opcional)"
              style={{ color: '#3f6b2b' }}
              className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
              maxLength={40}
            />
            <Editable
              editable={editable}
              value={titulo ?? 'Resultados de la última campaña'}
              onChange={onUpdateTitulo}
              tag="h2"
              block
              styleKey="ensayos.titulo"
              style={{ color: headingColor || palette.ink }}
              className="font-serif text-2xl @lg:text-3xl"
              maxLength={80}
            />
          </div>
          <Editable
            editable={editable}
            value={nota}
            onChange={onUpdateNota}
            tag="span"
            block
            placeholder="Nota breve (opcional)"
            style={{ color: palette.inkSoft }}
            className="font-mono text-xs max-w-xs"
            maxLength={140}
          />
        </Reveal>
        <Reveal delay={0.1} className="overflow-x-auto">
          <div className="min-w-[640px] border" style={{ borderColor: palette.line, background: palette.bg }}>
            <div
              className="grid"
              style={{ gridTemplateColumns: `repeat(${Math.max(columnas.length, 1)}, 1fr)`, background: palette.ink, color: palette.bg }}
            >
              {columnas.map((c, idx) => (
                <Editable
                  key={idx}
                  editable={editable}
                  value={c}
                  onChange={(v) => updateCol(idx, v)}
                  tag="div"
                  placeholder="Columna"
                  className="font-mono text-[11px] uppercase tracking-wide px-4 py-3"
                  maxLength={30}
                />
              ))}
            </div>
            {filas.map((row) => (
              <div
                key={row.id}
                className="relative grid items-center border-t"
                style={{ gridTemplateColumns: `repeat(${Math.max(columnas.length, 1)}, 1fr)`, borderColor: palette.line }}
              >
                {row.cells.map((cell, idx) => (
                  <Editable
                    key={idx}
                    editable={editable}
                    value={cell}
                    onChange={(v) => updateCell(row.id, idx, v)}
                    tag="div"
                    className="text-sm px-4 py-3"
                    style={{ color: idx === row.cells.length - 1 ? '#3f6b2b' : palette.ink }}
                    maxLength={40}
                  />
                ))}
                {editable && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    aria-label="Quitar fila"
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
                    style={{ color: palette.ink }}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Reveal>
        {editable && (
          <button
            type="button"
            onClick={addRow}
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-2.5 border-2 border-dashed"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-3 h-3" /> Agregar fila
          </button>
        )}
      </div>
    </section>
  );
}

// Texto + foto a la izquierda, tabla de zonas de reparto a la derecha (zona,
// días, mínimo, flete — el flete se colorea verde cuando es gratis) — a
// diferencia de "Tabla de resultados" (columnas libres, siempre la última en
// el mismo color), acá las columnas son fijas y el color del flete depende
// de un dato propio de cada fila (si es gratis o no), no de la posición.
function SeccionLogisticaZonas({
  zonas = [],
  onUpdate,
  onRemove,
  onAdd,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  imagen,
  onUpdateImagen,
  editable,
  bgColor,
  headingColor,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(zonas.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  const remove = (id) => onRemove?.(id);
  const add = () => onAdd?.({ id: `zona-${Date.now()}`, zona: 'Nueva zona', dias: 'Días', minimo: '$0', flete: 'A convenir', gratis: false });

  const handleImagen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) onUpdateImagen?.(await uploadImage(file));
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto grid @lg:grid-cols-[0.85fr_1.15fr] gap-8 @lg:gap-12 items-start">
        <Reveal>
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="logisticazonas.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: '#2a4d9b' }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Días de reparto por zona'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="logisticazonas.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl mb-4"
            maxLength={80}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            placeholder="Descripción breve"
            style={{ color: palette.inkSoft }}
            className="text-sm leading-relaxed mb-6 max-w-md"
            maxLength={200}
          />
          <label className={`group/limg relative block aspect-[4/3] bg-black/5 overflow-hidden ${editable ? 'cursor-pointer' : ''}`}>
            {imagen ? (
              <img src={imagen} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-center px-4" style={{ color: palette.inkSoft }}>
                Agregá una foto
              </div>
            )}
            {editable && (
              <>
                <span className="absolute inset-0 bg-black/0 group-hover/limg:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/limg:opacity-100">
                  <PencilIcon className="w-4 h-4 text-white" />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />
              </>
            )}
          </label>
        </Reveal>
        <Reveal delay={0.12} className="overflow-x-auto">
          <div className="min-w-[520px] border" style={{ borderColor: palette.line, background: palette.bg }}>
            <div
              className="grid text-[11px] font-mono uppercase tracking-wide"
              style={{ gridTemplateColumns: '1.3fr 1fr 0.9fr 0.9fr', background: '#2a4d9b', color: '#fff' }}
            >
              <div className="px-4 py-3">Zona</div>
              <div className="px-4 py-3">Días de reparto</div>
              <div className="px-4 py-3 text-right">Mínimo</div>
              <div className="px-4 py-3 text-right">Flete</div>
            </div>
            {zonas.map((z) => (
              <div
                key={z.id}
                className="relative grid items-center border-t"
                style={{ gridTemplateColumns: '1.3fr 1fr 0.9fr 0.9fr', borderColor: palette.line }}
              >
                <Editable
                  editable={editable}
                  value={z.zona}
                  onChange={(v) => update(z.id, { zona: v })}
                  tag="div"
                  className="text-sm font-medium px-4 py-3"
                  maxLength={30}
                />
                <Editable
                  editable={editable}
                  value={z.dias}
                  onChange={(v) => update(z.id, { dias: v })}
                  tag="div"
                  className="font-mono text-xs px-4 py-3"
                  style={{ color: palette.inkSoft }}
                  maxLength={30}
                />
                <Editable
                  editable={editable}
                  value={z.minimo}
                  onChange={(v) => update(z.id, { minimo: v })}
                  tag="div"
                  className="font-mono text-xs px-4 py-3 text-right"
                  maxLength={20}
                />
                <div className="flex items-center justify-end gap-1.5 px-4 py-3">
                  <Editable
                    editable={editable}
                    value={z.flete}
                    onChange={(v) => update(z.id, { flete: v })}
                    tag="span"
                    className="font-mono text-xs text-right"
                    style={{ color: z.gratis ? '#1f7a4d' : palette.ink }}
                    maxLength={20}
                  />
                  {editable && (
                    <button
                      type="button"
                      onClick={() => update(z.id, { gratis: !z.gratis })}
                      aria-label="Alternar gratis"
                      className="shrink-0"
                      title="Marcar como flete gratis"
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5" style={{ color: z.gratis ? '#1f7a4d' : palette.line }} />
                    </button>
                  )}
                </div>
                {editable && (
                  <button
                    type="button"
                    onClick={() => remove(z.id)}
                    aria-label="Quitar zona"
                    className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
                    style={{ color: palette.ink }}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      {editable && (
        <div className="max-w-5xl mx-auto mt-4">
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-2.5 border-2 border-dashed"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-3 h-3" /> Agregar zona
          </button>
        </div>
      )}
    </section>
  );
}

// Selector de sucursales: lista clickeable a la izquierda (nombre + ciudad +
// abierto/cerrado), panel con mapa simulado + datos de la sucursal activa a
// la derecha — mismo patrón de switcher que Series/Estilos, pero con datos
// de local físico (dirección/horario/teléfono) en vez de foto+descripción.
function SeccionSucursales({
  sucursales = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const [active, setActive] = useState(0);
  const activeIndex = Math.min(active, Math.max(sucursales.length - 1, 0));
  const current = sucursales[activeIndex];

  const update = (id, patch) => onUpdate?.(sucursales.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id) => onUpdate?.(sucursales.filter((s) => s.id !== id));
  const add = () =>
    onUpdate?.([
      ...sucursales,
      { id: `sucursal-${Date.now()}`, nombre: 'Nueva sucursal', ciudad: '', abierto: true, direccion: '', horarios: '', telefono: '' },
    ]);

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="sucursales.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Nuestras sucursales'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="sucursales.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl"
            maxLength={70}
          />
        </div>

        {sucursales.length === 0 && !editable ? (
          <p className="text-sm" style={{ color: palette.inkSoft }}>
            Todavía no cargaste sucursales.
          </p>
        ) : (
          <div className="grid @lg:grid-cols-[0.85fr_1.15fr] gap-8 @lg:gap-10 items-start">
            <div className="flex flex-col border-t" style={{ borderColor: palette.line }}>
              {sucursales.map((s, i) => (
                <div
                  key={s.id}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className="relative cursor-pointer px-3 py-4 border-b border-l-[3px] transition-colors"
                  style={{
                    borderBottomColor: palette.line,
                    borderLeftColor: i === activeIndex ? accent : 'transparent',
                    background: i === activeIndex ? (palette.accentSoft || 'rgba(0,0,0,0.04)') : 'transparent',
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <Editable
                      editable={editable}
                      value={s.nombre}
                      onChange={(v) => update(s.id, { nombre: v })}
                      tag="span"
                      placeholder="Nombre de la sucursal"
                      style={{ color: i === activeIndex ? accent : palette.ink }}
                      className="font-serif font-semibold"
                      maxLength={40}
                    />
                    {editable ? (
                      <button
                        type="button"
                        onClick={() => update(s.id, { abierto: !s.abierto })}
                        className="font-mono text-[10px] uppercase shrink-0 underline decoration-dotted"
                        style={{ color: s.abierto ? accent : palette.inkSoft }}
                      >
                        {s.abierto ? 'Abierto' : 'Cerrado'}
                      </button>
                    ) : (
                      <span
                        className="font-mono text-[10px] uppercase shrink-0"
                        style={{ color: s.abierto ? accent : palette.inkSoft }}
                      >
                        {s.abierto ? 'Abierto ahora' : 'Cerrado'}
                      </span>
                    )}
                  </div>
                  <Editable
                    editable={editable}
                    value={s.ciudad}
                    onChange={(v) => update(s.id, { ciudad: v })}
                    tag="p"
                    placeholder="Ciudad"
                    style={{ color: palette.inkSoft }}
                    className="text-sm mt-0.5"
                    maxLength={30}
                  />
                  {editable && (
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      aria-label={`Quitar ${s.nombre}`}
                      className="absolute top-3 right-2 opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: palette.ink }}
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={add}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-3 border-2 border-dashed mt-2"
                  style={{ borderColor: palette.line, color: palette.inkSoft }}
                >
                  <PlusIcon className="w-3 h-3" /> Agregar sucursal
                </button>
              )}
            </div>
            <div className="border" style={{ borderColor: palette.line }}>
              <div className="h-[200px] @lg:h-[240px] flex items-center justify-center" style={{ background: palette.line }}>
                <span className="font-mono text-xs uppercase tracking-wide" style={{ color: palette.inkSoft }}>
                  Mapa (simulado)
                </span>
              </div>
              {current && (
                <div className="p-6 grid grid-cols-1 @sm:grid-cols-3 gap-5">
                  {[
                    { label: 'Dirección', key: 'direccion', maxLength: 100 },
                    { label: 'Horarios', key: 'horarios', maxLength: 60 },
                    { label: 'Teléfono', key: 'telefono', maxLength: 30 },
                  ].map((f) => (
                    <div key={f.key}>
                      <p className="font-mono text-[10px] uppercase tracking-wide mb-1" style={{ color: palette.inkSoft }}>
                        {f.label}
                      </p>
                      <Editable
                        editable={editable}
                        value={current[f.key]}
                        onChange={(v) => update(current.id, { [f.key]: v })}
                        tag="p"
                        block
                        placeholder="—"
                        style={{ color: palette.ink }}
                        className="text-sm"
                        maxLength={f.maxLength}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Selector de zonas con botones (no lista con abierto/cerrado como
// "Sucursales") + panel de la zona activa: iniciales del técnico + nombre +
// especialidad + una lista libre de datos ("facts"), más una foto real de
// la zona debajo (no un mapa simulado) — pensado para negocios con un
// referente humano por zona (técnico, asesor, repartidor).
function SeccionZonasTecnicas({
  zonas = [],
  onUpdate,
  onRemove,
  onAdd,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  imagen,
  onUpdateImagen,
  editable,
  bgColor,
  headingColor,
  palette = {},
}) {
  const [active, setActive] = useState(0);
  const activeIndex = Math.min(active, Math.max(zonas.length - 1, 0));
  const zona = zonas[activeIndex];

  const update = (id, patch) => onUpdate?.(zonas.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  const remove = (id) => onRemove?.(id);
  const add = () =>
    onAdd?.({ id: `zona-${Date.now()}`, label: 'Nueva zona', tech: 'Nombre y apellido', specialty: 'Especialidad', facts: [{ k: 'Dato', v: 'Valor' }] });

  const updateFact = (id, idx, patch) => {
    const z = zonas.find((x) => x.id === id);
    if (!z) return;
    update(id, { facts: z.facts.map((f, i) => (i === idx ? { ...f, ...patch } : f)) });
  };
  const removeFact = (id, idx) => {
    const z = zonas.find((x) => x.id === id);
    if (!z) return;
    update(id, { facts: z.facts.filter((_, i) => i !== idx) });
  };
  const addFact = (id) => {
    const z = zonas.find((x) => x.id === id);
    if (!z) return;
    update(id, { facts: [...(z.facts || []), { k: 'Dato', v: 'Valor' }] });
  };

  const handleImagen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) onUpdateImagen?.(await uploadImage(file));
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto grid @lg:grid-cols-[0.85fr_1.15fr] gap-8 @lg:gap-12 items-start">
        <Reveal>
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="zonastecnicas.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: '#3f6b2b' }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Un técnico por zona'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="zonastecnicas.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl mb-4"
            maxLength={80}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            placeholder="Descripción breve"
            style={{ color: palette.inkSoft }}
            className="text-sm leading-relaxed mb-6 max-w-md"
            maxLength={200}
          />
          <div className="flex flex-wrap gap-2">
            {zonas.map((z, i) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setActive(i)}
                className="border text-sm px-3.5 py-2 transition-colors"
                style={
                  i === activeIndex
                    ? { borderColor: '#3f6b2b', background: '#e8efe0', color: '#3f6b2b' }
                    : { borderColor: palette.line, color: palette.ink, background: palette.bg }
                }
              >
                {z.label}
              </button>
            ))}
            {editable && (
              <button
                type="button"
                onClick={add}
                className="border-2 border-dashed flex items-center justify-center px-3 text-sm"
                style={{ borderColor: palette.line, color: palette.inkSoft }}
              >
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.12} className="flex flex-col gap-5">
          {zona && (
            <div className="relative border p-6 grid grid-cols-[auto_1fr] gap-5 items-start" style={{ borderColor: palette.line, background: palette.bg }}>
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(zona.id)}
                  aria-label={`Quitar ${zona.label}`}
                  className="absolute top-2 right-2 opacity-40 hover:opacity-100"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <div
                className="w-14 h-14 flex items-center justify-center font-serif font-semibold text-lg shrink-0"
                style={{ background: '#3f6b2b', color: '#fff' }}
              >
                {initials(zona.tech.split(' ').slice(-2).join(' '))}
              </div>
              <div>
                <Editable
                  editable={editable}
                  value={zona.tech}
                  onChange={(v) => update(zona.id, { tech: v })}
                  tag="div"
                  block
                  placeholder="Nombre del técnico"
                  style={{ color: palette.ink }}
                  className="font-semibold text-lg mb-0.5"
                  maxLength={50}
                />
                <Editable
                  editable={editable}
                  value={zona.specialty}
                  onChange={(v) => update(zona.id, { specialty: v })}
                  tag="div"
                  block
                  placeholder="Especialidad"
                  style={{ color: '#3f6b2b' }}
                  className="font-mono text-xs mb-4"
                  maxLength={70}
                />
                <div className="grid grid-cols-1 @sm:grid-cols-3 gap-4">
                  {(zona.facts || []).map((f, idx) => (
                    <div key={idx} className="relative">
                      <Editable
                        editable={editable}
                        value={f.k}
                        onChange={(v) => updateFact(zona.id, idx, { k: v })}
                        tag="div"
                        placeholder="Dato"
                        style={{ color: palette.inkSoft }}
                        className="font-mono text-[10px] uppercase tracking-wide mb-1"
                        maxLength={20}
                      />
                      <Editable
                        editable={editable}
                        value={f.v}
                        onChange={(v) => updateFact(zona.id, idx, { v })}
                        tag="div"
                        block
                        placeholder="Valor"
                        style={{ color: palette.ink }}
                        className="text-sm"
                        maxLength={60}
                      />
                      {editable && (
                        <button
                          type="button"
                          onClick={() => removeFact(zona.id, idx)}
                          aria-label="Quitar dato"
                          className="absolute -top-1 -right-1 opacity-40 hover:opacity-100"
                          style={{ color: palette.ink }}
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <button
                      type="button"
                      onClick={() => addFact(zona.id)}
                      className="text-xs font-semibold underline decoration-dotted self-start"
                      style={{ color: palette.inkSoft }}
                    >
                      + Agregar dato
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          <label className={`group/zimg relative block aspect-[16/7] bg-black/5 overflow-hidden ${editable ? 'cursor-pointer' : ''}`}>
            {imagen ? (
              <img src={imagen} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-center px-4" style={{ color: palette.inkSoft }}>
                Agregá una foto
              </div>
            )}
            {editable && (
              <>
                <span className="absolute inset-0 bg-black/0 group-hover/zimg:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/zimg:opacity-100">
                  <PencilIcon className="w-4 h-4 text-white" />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />
              </>
            )}
          </label>
        </Reveal>
      </div>
    </section>
  );
}

// Línea de tiempo vertical (hora + punto + línea conectora + título/desc) —
// pensada para el orden de una fiesta o evento con horarios fijos, a
// diferencia de "Pasos" (que numera pasos de un proceso, sin hora).
function SeccionCronograma({
  variant = 'linea',
  items = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  imagen,
  onUpdateImagen,
  editable,
  bgColor,
  headingColor,
  textColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onUpdate?.(items.filter((it) => it.id !== id));
  const add = () => onUpdate?.([...items, { id: `cron-${Date.now()}`, time: '00:00', title: 'Nuevo momento', desc: '' }]);

  const rows = (withDots) => (
    <>
      {items.map((it, i) => (
        <Reveal
          key={it.id}
          delay={Math.min(i * 0.08, 0.4)}
          className="relative grid gap-5"
          style={withDots ? { gridTemplateColumns: 'auto auto 1fr' } : { gridTemplateColumns: 'auto 1fr' }}
        >
          <Editable
            editable={editable}
            value={it.time}
            onChange={(v) => update(it.id, { time: v })}
            tag="span"
            placeholder="00:00"
            style={{ color: accent }}
            className={`font-serif text-lg min-w-[3.4rem] ${withDots ? 'text-right pt-0.5' : ''}`}
            maxLength={10}
          />
          {withDots && (
            <div className="flex flex-col items-center self-stretch">
              <span className="w-2.5 h-2.5 rounded-full border mt-1.5" style={{ background: i === 0 ? accent : palette.bg, borderColor: accent }} />
              {i < items.length - 1 && <span className="flex-1 w-px min-h-10" style={{ background: palette.line }} />}
            </div>
          )}
          <div className={`relative ${withDots ? 'pb-8' : 'pb-6 border-b'}`} style={withDots ? undefined : { borderColor: palette.line }}>
            {editable && (
              <button
                type="button"
                onClick={() => remove(it.id)}
                aria-label="Quitar"
                className="absolute top-0 right-0 opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: palette.ink }}
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <Editable
              editable={editable}
              value={it.title}
              onChange={(v) => update(it.id, { title: v })}
              tag="p"
              block
              placeholder="Título del momento"
              style={{ color: palette.ink }}
              className="font-medium text-[15px] mb-1 pr-4"
              maxLength={60}
            />
            <Editable
              editable={editable}
              value={it.desc}
              onChange={(v) => update(it.id, { desc: v })}
              tag="p"
              block
              multiline
              placeholder="Descripción breve"
              style={{ color: palette.inkSoft }}
              className="text-sm leading-relaxed max-w-[28rem]"
              maxLength={160}
            />
          </div>
        </Reveal>
      ))}
      {editable && (
        <button
          type="button"
          onClick={add}
          className={`inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-2 border-2 border-dashed ${withDots ? 'ml-[4.7rem]' : 'mt-2'}`}
          style={{ borderColor: palette.line, color: palette.inkSoft }}
        >
          <PlusIcon className="w-3 h-3" /> Agregar momento
        </button>
      )}
    </>
  );

  // "sticky" — columna izquierda fija (eyebrow + título + bajada + foto)
  // mientras se scrollea la derecha (filas simples hora/título/desc, sin
  // punto ni línea conectora) — pensada para el día del evento en sí, con
  // contexto propio a un lado, a diferencia de "linea" (timeline sola).
  if (variant === 'sticky') {
    const handleImagen = async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file && (await validateImageFile(file, 'galeria'))) onUpdateImagen?.(await uploadImage(file));
    };
    return (
      <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
        <div className="max-w-4xl mx-auto grid @lg:grid-cols-[0.9fr_1.1fr] gap-10 @lg:gap-14 items-start">
          <Reveal className="@lg:sticky @lg:top-20">
            <Editable
              editable={editable}
              value={eyebrow}
              onChange={onUpdateEyebrow}
              tag="span"
              block
              styleKey="cronograma.eyebrow"
              placeholder="Eyebrow (opcional)"
              style={{ color: accent }}
              className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
              maxLength={40}
            />
            <Editable
              editable={editable}
              value={titulo ?? 'Cómo va a ser'}
              onChange={onUpdateTitulo}
              tag="h2"
              block
              styleKey="cronograma.titulo"
              style={{ color: headingColor || palette.ink }}
              className="font-serif text-2xl @lg:text-3xl mb-4"
              maxLength={70}
            />
            <Editable
              editable={editable}
              value={descripcion}
              onChange={onUpdateDescripcion}
              tag="p"
              block
              multiline
              placeholder="Bajada (opcional)"
              style={{ color: textColor || palette.inkSoft }}
              className="text-sm leading-relaxed mb-6"
              maxLength={160}
            />
            <label
              className={`relative block aspect-[4/3] bg-black/5 overflow-hidden group/cronoimg ${editable ? 'cursor-pointer' : ''}`}
              title={editable ? 'Cambiar foto' : undefined}
            >
              {imagen ? (
                <img src={imagen} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-center px-4" style={{ color: palette.inkSoft }}>
                  Agregá una foto
                </div>
              )}
              {editable && (
                <>
                  <span className="absolute inset-0 bg-black/0 group-hover/cronoimg:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/cronoimg:opacity-100">
                    <span className="text-white text-xs font-semibold">Cambiar foto</span>
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />
                </>
              )}
            </label>
          </Reveal>
          <div>{rows(false)}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <Reveal className="max-w-xl mx-auto text-center mb-10">
        <Editable
          editable={editable}
          value={eyebrow}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="cronograma.eyebrow"
          placeholder="Eyebrow (opcional)"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Cronograma'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="cronograma.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif text-2xl @lg:text-3xl mb-3"
          maxLength={70}
        />
        <Editable
          editable={editable}
          value={descripcion}
          onChange={onUpdateDescripcion}
          tag="p"
          block
          multiline
          placeholder="Bajada (opcional)"
          style={{ color: palette.inkSoft }}
          className="text-sm"
          maxLength={140}
        />
      </Reveal>
      <div className="max-w-xl mx-auto">{rows(true)}</div>
    </section>
  );
}

// Tarjetas de lugares físicos con foto, tipo, nombre, dirección y hora —
// pensada para eventos con más de un lugar (ceremonia + fiesta), a
// diferencia de "Sucursales" (que es para varios locales de un negocio, con
// selector y mapa único). Acá cada lugar es autosuficiente, sin selector.
function SeccionLugares({
  items = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onUpdate?.(items.filter((it) => it.id !== id));
  const add = () =>
    onUpdate?.([...items, { id: `lugar-${Date.now()}`, kind: 'Lugar', nombre: 'Nuevo lugar', direccion: '', hora: '', imagen: '' }]);

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <Reveal className="max-w-xl mx-auto text-center mb-9">
        <Editable
          editable={editable}
          value={eyebrow}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="lugares.eyebrow"
          placeholder="Eyebrow (opcional)"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Dónde'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="lugares.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif text-2xl @lg:text-3xl"
          maxLength={70}
        />
      </Reveal>
      <div className="max-w-4xl mx-auto grid @lg:grid-cols-2 gap-6">
        {items.map((it, i) => (
          <Reveal key={it.id} delay={Math.min(i * 0.08, 0.4)} className="relative border" style={{ borderColor: palette.line, background: palette.bg }}>
            {editable && (
              <button
                type="button"
                onClick={() => remove(it.id)}
                aria-label={`Quitar ${it.nombre}`}
                className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/50 text-white flex items-center justify-center"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <label
              className={`relative block aspect-[16/10] bg-black/5 overflow-hidden ${editable ? 'cursor-pointer' : ''}`}
              title={editable ? 'Cambiar foto' : undefined}
            >
              {it.imagen ? (
                <img src={it.imagen} alt={it.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: palette.inkSoft }}>
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              {editable && (
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file && (await validateImageFile(file, 'galeria'))) update(it.id, { imagen: await uploadImage(file) });
                  }}
                />
              )}
            </label>
            <div className="p-5">
              <Editable
                editable={editable}
                value={it.kind}
                onChange={(v) => update(it.id, { kind: v })}
                tag="span"
                block
                placeholder="Tipo (ej: Misa, Salón)"
                style={{ color: accent }}
                className="font-mono text-[11px] uppercase tracking-wide mb-1.5"
                maxLength={20}
              />
              <Editable
                editable={editable}
                value={it.nombre}
                onChange={(v) => update(it.id, { nombre: v })}
                tag="p"
                block
                placeholder="Nombre del lugar"
                style={{ color: palette.ink }}
                className="font-serif text-xl mb-1.5"
                maxLength={60}
              />
              <Editable
                editable={editable}
                value={it.direccion}
                onChange={(v) => update(it.id, { direccion: v })}
                tag="p"
                block
                placeholder="Dirección"
                style={{ color: palette.inkSoft }}
                className="text-sm mb-3"
                maxLength={100}
              />
              <div className="flex items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: palette.line }}>
                <Editable
                  editable={editable}
                  value={it.hora}
                  onChange={(v) => update(it.id, { hora: v })}
                  tag="span"
                  placeholder="19:00 hs"
                  style={{ color: palette.ink }}
                  className="font-serif text-base"
                  maxLength={20}
                />
                {it.direccion && !editable && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(it.direccion)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs uppercase tracking-wide border-b"
                    style={{ color: accent, borderColor: palette.line }}
                  >
                    Cómo llegar
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        ))}
        {editable && (
          <button
            type="button"
            onClick={add}
            className="border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-10 text-sm font-semibold"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-4 h-4" /> Agregar lugar
          </button>
        )}
      </div>
    </section>
  );
}

// Dress code / código de vestimenta: columna de texto + checklist de
// sí/no, más una paleta de colores sugerida (swatches) al lado — pensada
// para eventos formales donde importa aclarar qué ponerse.
function SeccionDressCode({
  eyebrow,
  onUpdateEyebrow,
  titulo,
  onUpdateTitulo,
  descripcion,
  onUpdateDescripcion,
  notas = [],
  onUpdateNotas,
  paletaColores = [],
  onUpdatePaletaColores,
  editable,
  bgColor,
  headingColor,
  textColor,
  accent,
  palette = {},
}) {
  const updateNota = (id, patch) => onUpdateNotas?.(notas.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  const removeNota = (id) => onUpdateNotas?.(notas.filter((n) => n.id !== id));
  const addNota = () => onUpdateNotas?.([...notas, { id: `nota-${Date.now()}`, positivo: true, texto: 'Nueva nota' }]);

  const updateColor = (id, patch) => onUpdatePaletaColores?.(paletaColores.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeColor = (id) => onUpdatePaletaColores?.(paletaColores.filter((c) => c.id !== id));
  const addColor = () => onUpdatePaletaColores?.([...paletaColores, { id: `color-${Date.now()}`, nombre: 'Color', hex: '#a8577a' }]);

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.ink }}>
      <div className="max-w-5xl mx-auto grid @lg:grid-cols-[1.05fr_0.95fr] gap-10 @lg:gap-14 items-center">
        <Reveal>
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="dresscode.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: '#c0a05c' }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Dress code'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="dresscode.titulo"
            style={{ color: headingColor || textColor || '#ffffff' }}
            className="font-serif text-2xl @lg:text-3xl mb-4"
            maxLength={80}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            placeholder="Descripción del dress code"
            style={{ color: 'rgba(255,255,255,0.7)' }}
            className="text-sm leading-relaxed mb-7 max-w-md"
            maxLength={220}
          />
          <div className="flex flex-col gap-3">
            {notas.map((n) => (
              <div key={n.id} className="relative grid gap-3 items-baseline" style={{ gridTemplateColumns: 'auto 1fr' }}>
                {editable ? (
                  <button
                    type="button"
                    onClick={() => updateNota(n.id, { positivo: !n.positivo })}
                    className="font-serif text-lg"
                    style={{ color: n.positivo ? '#c0a05c' : accent }}
                  >
                    {n.positivo ? '✓' : '✕'}
                  </button>
                ) : (
                  <span className="font-serif text-lg" style={{ color: n.positivo ? '#c0a05c' : accent }}>
                    {n.positivo ? '✓' : '✕'}
                  </span>
                )}
                <Editable
                  editable={editable}
                  value={n.texto}
                  onChange={(v) => updateNota(n.id, { texto: v })}
                  tag="span"
                  block
                  placeholder="Nota"
                  style={{ color: 'rgba(255,255,255,0.82)' }}
                  className="text-sm pr-5"
                  maxLength={100}
                />
                {editable && (
                  <button
                    type="button"
                    onClick={() => removeNota(n.id)}
                    aria-label="Quitar"
                    className="absolute top-0 right-0 opacity-50 hover:opacity-100"
                    style={{ color: '#fff' }}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {editable && (
              <button
                type="button"
                onClick={addNota}
                className="text-xs font-semibold underline decoration-dotted self-start"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                + Agregar nota
              </button>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="font-mono text-[11px] uppercase tracking-wide mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Paleta sugerida
          </div>
          <div className="grid grid-cols-3 @sm:grid-cols-5 gap-3">
            {paletaColores.map((c) => (
              <div key={c.id} className="relative">
                {editable ? (
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) => updateColor(c.id, { hex: e.target.value })}
                    className="w-full aspect-square border cursor-pointer"
                    style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                  />
                ) : (
                  <div className="aspect-square border" style={{ background: c.hex, borderColor: 'rgba(255,255,255,0.2)' }} />
                )}
                <Editable
                  editable={editable}
                  value={c.nombre}
                  onChange={(v) => updateColor(c.id, { nombre: v })}
                  tag="p"
                  block
                  placeholder="Nombre"
                  style={{ color: 'rgba(255,255,255,0.62)' }}
                  className="text-[11px] mt-1.5"
                  maxLength={20}
                />
                {editable && (
                  <button
                    type="button"
                    onClick={() => removeColor(c.id)}
                    aria-label="Quitar color"
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <XIcon className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
            {editable && (
              <button
                type="button"
                onClick={addColor}
                className="aspect-square border-2 border-dashed flex items-center justify-center"
                style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)' }}
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Formulario de confirmación de asistencia (RSVP) en 3 pasos — nombre y
// acompañantes, menú, nota + resumen — con barra de progreso y pantalla
// final de confirmado. Todo el recorrido vive en estado local del
// visitante (nombre/invitados/menú/nota no se guardan en ningún lado real,
// es una demo funcional igual que el resto del sitio no tiene backend de
// pedidos/reservas conectado). Lo único persistente/editable por el dueño
// es el copy y la lista de menús.
function SeccionRSVP({
  eyebrow,
  onUpdateEyebrow,
  titulo,
  onUpdateTitulo,
  descripcion,
  onUpdateDescripcion,
  menuOptions = [],
  onUpdateMenuOptions,
  mensajeConfirmado,
  onUpdateMensajeConfirmado,
  mensajeDeclinado,
  onUpdateMensajeDeclinado,
  companionMode = false,
  extraPregunta,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [guests, setGuests] = useState(1);
  const [companion, setCompanion] = useState(null);
  const [companionName, setCompanionName] = useState('');
  const [menu, setMenu] = useState(menuOptions[0]?.id ?? '');
  const [extra, setExtra] = useState(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(null);

  const updateMenu = (id, patch) => onUpdateMenuOptions?.(menuOptions.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMenu = (id) => onUpdateMenuOptions?.(menuOptions.filter((m) => m.id !== id));
  const addMenu = () => onUpdateMenuOptions?.([...menuOptions, { id: `menu-${Date.now()}`, nombre: 'Menú', desc: '' }]);

  const menuName = menuOptions.find((m) => m.id === menu)?.nombre || 'Sin elegir';
  const guestLabel = guests === 1 ? 'Solo yo' : `${guests} personas`;
  const companionLabel = companion === false ? 'Voy solo/a' : companion === true ? companionName.trim() || 'Con acompañante' : 'Sin definir';
  const extraLabel = extra === null ? 'Sin definir' : extra ? extraPregunta?.opciones?.[0] || 'Sí' : extraPregunta?.opciones?.[1] || 'No';
  const step0Valid = companionMode
    ? name.trim().length > 1 && companion !== null && (companion === false || companionName.trim().length > 1)
    : name.trim().length > 1;
  const step2Valid = extraPregunta ? extra !== null : true;
  const stepValid = [step0Valid, !!menu, step2Valid][step];
  const nextLabels = ['Continuar', 'Continuar', 'Enviar confirmación'];

  const tokens = {
    nombre: name.trim() || 'Tu lugar',
    invitados: guestLabel.toLowerCase(),
    acompanante: companionLabel.toLowerCase(),
    menu: menuName.toLowerCase(),
    extra: extraLabel.toLowerCase(),
  };
  const fillTokens = (text) => text.replace(/\{(\w+)\}/g, (m, key) => tokens[key] ?? m);

  const reset = () => {
    setDone(null);
    setStep(0);
    setName('');
    setGuests(1);
    setCompanion(null);
    setCompanionName('');
    setMenu(menuOptions[0]?.id ?? '');
    setExtra(null);
    setNote('');
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <Reveal className="max-w-xl mx-auto text-center mb-9">
        <Editable
          editable={editable}
          value={eyebrow}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="rsvp.eyebrow"
          placeholder="Eyebrow (opcional)"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? '¿Vas a venir?'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="rsvp.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif text-2xl @lg:text-3xl mb-3"
          maxLength={70}
        />
        <Editable
          editable={editable}
          value={descripcion}
          onChange={onUpdateDescripcion}
          tag="p"
          block
          multiline
          placeholder="Ej: Confirmame antes del 31 de octubre así reservamos tu lugar."
          style={{ color: palette.inkSoft }}
          className="text-sm"
          maxLength={160}
        />
      </Reveal>

      <Reveal delay={0.12} className="max-w-md mx-auto border p-7 @lg:p-9" style={{ borderColor: palette.line, background: palette.bg }}>
        {done !== null ? (
          <div className="text-center">
            <div
              className="w-14 h-14 mx-auto mb-5 rounded-full border flex items-center justify-center font-serif text-xl"
              style={{ borderColor: accent, color: accent }}
            >
              ✓
            </div>
            <p className="font-serif text-xl mb-2.5" style={{ color: palette.ink }}>
              {done === 'yes' ? '¡Te esperamos!' : 'Gracias por avisar'}
            </p>
            <p className="text-sm leading-relaxed mb-5" style={{ color: palette.inkSoft }}>
              {done === 'yes'
                ? fillTokens(mensajeConfirmado || 'Tu lugar está confirmado. Te vamos a escribir unos días antes con los últimos detalles.')
                : mensajeDeclinado || 'Nos vas a hacer falta, pero gracias por avisar. ¡Nos vemos pronto!'}
            </p>
            <button type="button" onClick={reset} className="text-xs uppercase tracking-wide border-b" style={{ color: accent, borderColor: palette.line }}>
              Cargar otra respuesta
            </button>
            {editable && (
              <div className="mt-6 pt-5 border-t text-left" style={{ borderColor: palette.line }}>
                <label className="block text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: palette.inkSoft }}>
                  Mensaje si confirma (usá {'{nombre}'}, {companionMode ? '{acompanante}' : '{invitados}'}, {'{menu}'}
                  {extraPregunta ? ', {extra}' : ''})
                </label>
                <textarea
                  value={mensajeConfirmado || ''}
                  onChange={(e) => onUpdateMensajeConfirmado?.(e.target.value)}
                  rows={2}
                  className="w-full border px-2.5 py-2 text-xs mb-3"
                  style={{ borderColor: palette.line, color: palette.ink }}
                />
                <label className="block text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: palette.inkSoft }}>
                  Mensaje si no puede venir
                </label>
                <textarea
                  value={mensajeDeclinado || ''}
                  onChange={(e) => onUpdateMensajeDeclinado?.(e.target.value)}
                  rows={2}
                  className="w-full border px-2.5 py-2 text-xs"
                  style={{ borderColor: palette.line, color: palette.ink }}
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex gap-1 mb-7">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1 h-[3px]" style={{ background: i <= step ? accent : palette.line }} />
              ))}
            </div>

            {step === 0 && (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wide mb-2" style={{ color: palette.inkSoft }}>
                  Tu nombre y apellido
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Camila Ríos"
                  className="w-full box-border border px-3.5 py-2.5 text-sm outline-none mb-6"
                  style={{ borderColor: palette.line, background: palette.bg, color: palette.ink }}
                />
                {companionMode ? (
                  <>
                    <label className="block text-[11px] font-mono uppercase tracking-wide mb-2" style={{ color: palette.inkSoft }}>
                      ¿Venís con acompañante?
                    </label>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {[
                        { val: false, label: 'Voy solo/a' },
                        { val: true, label: 'Con acompañante' },
                      ].map((o) => (
                        <button
                          key={String(o.val)}
                          type="button"
                          onClick={() => setCompanion(o.val)}
                          className="border px-4 py-2.5 text-sm transition-colors"
                          style={
                            companion === o.val
                              ? { borderColor: accent, background: palette.accentSoft || 'rgba(0,0,0,0.04)', color: accent }
                              : { borderColor: palette.line, color: palette.ink, background: palette.bg }
                          }
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    {companion === true && (
                      <input
                        value={companionName}
                        onChange={(e) => setCompanionName(e.target.value)}
                        placeholder="Nombre de tu acompañante"
                        className="w-full box-border border px-3.5 py-2.5 text-sm outline-none"
                        style={{ borderColor: palette.line, background: palette.bg, color: palette.ink }}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <label className="block text-[11px] font-mono uppercase tracking-wide mb-2" style={{ color: palette.inkSoft }}>
                      ¿Venís sola/o o con acompañantes?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setGuests(n)}
                          className="border px-4 py-2.5 text-sm transition-colors"
                          style={
                            guests === n
                              ? { borderColor: accent, background: palette.accentSoft || 'rgba(0,0,0,0.04)', color: accent }
                              : { borderColor: palette.line, color: palette.ink, background: palette.bg }
                          }
                        >
                          {n === 1 ? 'Solo yo' : `${n} personas`}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 1 && (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wide mb-3" style={{ color: palette.inkSoft }}>
                  Elegí tu menú
                </label>
                <div className="flex flex-col gap-2">
                  {menuOptions.map((m) => (
                    <div key={m.id} className="relative">
                      <button
                        type="button"
                        onClick={() => !editable && setMenu(m.id)}
                        className="w-full text-left border px-4 py-3.5 flex items-center gap-3.5 transition-colors"
                        style={
                          menu === m.id
                            ? { borderColor: accent, background: palette.accentSoft || 'rgba(0,0,0,0.04)' }
                            : { borderColor: palette.line, background: palette.bg }
                        }
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border shrink-0"
                          style={{ borderColor: accent, background: menu === m.id ? accent : 'transparent' }}
                        />
                        <span className="flex-1 min-w-0">
                          {editable ? (
                            <>
                              <Editable editable value={m.nombre} onChange={(v) => updateMenu(m.id, { nombre: v })} tag="span" block className="block text-sm font-medium" maxLength={40} />
                              <Editable editable value={m.desc} onChange={(v) => updateMenu(m.id, { desc: v })} tag="span" block className="block text-xs mt-0.5" style={{ color: palette.inkSoft }} maxLength={60} />
                            </>
                          ) : (
                            <>
                              <span className="block text-sm font-medium" style={{ color: palette.ink }}>{m.nombre}</span>
                              <span className="block text-xs mt-0.5" style={{ color: palette.inkSoft }}>{m.desc}</span>
                            </>
                          )}
                        </span>
                      </button>
                      {editable && (
                        <button
                          type="button"
                          onClick={() => removeMenu(m.id)}
                          aria-label="Quitar menú"
                          className="absolute top-2 right-2 opacity-40 hover:opacity-100"
                          style={{ color: palette.ink }}
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <button
                      type="button"
                      onClick={addMenu}
                      className="text-xs font-semibold underline decoration-dotted self-start mt-1"
                      style={{ color: palette.inkSoft }}
                    >
                      + Agregar menú
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                {extraPregunta && (
                  <>
                    <label className="block text-[11px] font-mono uppercase tracking-wide mb-2" style={{ color: palette.inkSoft }}>
                      {extraPregunta.label}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {[
                        { val: true, label: extraPregunta.opciones?.[0] || 'Sí' },
                        { val: false, label: extraPregunta.opciones?.[1] || 'No' },
                      ].map((o) => (
                        <button
                          key={String(o.val)}
                          type="button"
                          onClick={() => setExtra(o.val)}
                          className="border px-4 py-2.5 text-sm transition-colors"
                          style={
                            extra === o.val
                              ? { borderColor: accent, background: palette.accentSoft || 'rgba(0,0,0,0.04)', color: accent }
                              : { borderColor: palette.line, color: palette.ink, background: palette.bg }
                          }
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <label className="block text-[11px] font-mono uppercase tracking-wide mb-2" style={{ color: palette.inkSoft }}>
                  ¿Alguna alergia o algo que deba saber?
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Opcional — contame si tenés alguna restricción"
                  className="w-full box-border border px-3.5 py-2.5 text-sm outline-none resize-y mb-5"
                  style={{ borderColor: palette.line, background: palette.bg, color: palette.ink }}
                />
                <div className="p-4" style={{ background: palette.accentSoft || 'rgba(0,0,0,0.03)' }}>
                  <div className="text-[11px] font-mono uppercase tracking-wide mb-2.5" style={{ color: palette.inkSoft }}>
                    Tu confirmación
                  </div>
                  {[
                    { label: 'Invitado', value: name.trim() || '—' },
                    companionMode ? { label: 'Acompañante', value: companionLabel } : { label: 'Asistentes', value: guestLabel },
                    { label: 'Menú', value: menuName },
                    ...(extraPregunta ? [{ label: extraPregunta.label, value: extraLabel }] : []),
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between gap-3 text-sm py-1">
                      <span style={{ color: palette.inkSoft }}>{r.label}</span>
                      <span className="font-medium text-right" style={{ color: palette.ink }}>
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 items-center mt-7">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="border px-4 py-2.5 text-xs uppercase tracking-wide"
                  style={{ borderColor: palette.line, color: palette.inkSoft }}
                >
                  Atrás
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!stepValid) return;
                  if (step < 2) setStep((s) => s + 1);
                  else setDone('yes');
                }}
                className="flex-1 text-center text-xs uppercase tracking-wide py-3"
                style={{ background: stepValid ? accent : palette.line, color: '#fff' }}
              >
                {nextLabels[step]}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setDone('no')}
              className="block mx-auto mt-4 text-xs underline"
              style={{ color: palette.inkSoft }}
            >
              No voy a poder ir
            </button>
          </div>
        )}
      </Reveal>
    </section>
  );
}

// Pedidos de canción para el DJ: el visitante suma un tema a una lista en
// vivo (queda solo en su sesión, no se guarda en la plantilla real — mismo
// motivo que el RSVP no tiene backend propio) mientras el dueño edita la
// lista semilla que todos ven al entrar.
function SeccionPlaylist({
  canciones = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const [input, setInput] = useState('');
  const [extra, setExtra] = useState([]);

  const update = (id, patch) => onUpdate?.(canciones.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id) => onUpdate?.(canciones.filter((c) => c.id !== id));
  const add = () => onUpdate?.([...canciones, { id: `song-${Date.now()}`, titulo: 'Artista — Tema', por: 'Vos' }]);

  const addRequest = () => {
    const v = input.trim();
    if (!v) return;
    setExtra((prev) => [...prev, { titulo: v, por: 'Vos' }]);
    setInput('');
  };

  const allSongs = [...canciones, ...extra];

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto grid @lg:grid-cols-[0.95fr_1.05fr] gap-10 @lg:gap-14 items-start">
        <Reveal>
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="playlist.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Pedí tu canción'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="playlist.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl mb-3"
            maxLength={70}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            placeholder="Bajada (opcional)"
            style={{ color: palette.inkSoft }}
            className="text-sm leading-relaxed mb-6 max-w-sm"
            maxLength={140}
          />
          {!editable && (
            <>
              <div className="flex gap-2 mb-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRequest()}
                  placeholder="Artista — Tema"
                  className="flex-1 min-w-0 border px-3.5 py-2.5 text-sm outline-none"
                  style={{ borderColor: palette.line, background: palette.bg, color: palette.ink }}
                />
                <button
                  type="button"
                  onClick={addRequest}
                  className="shrink-0 px-4 text-xs uppercase tracking-wide font-semibold"
                  style={{ background: accent, color: '#fff' }}
                >
                  Sumar
                </button>
              </div>
              <div className="text-xs" style={{ color: palette.inkSoft }}>
                {allSongs.length} canciones en la lista — sumá la tuya
              </div>
            </>
          )}
        </Reveal>
        <Reveal delay={0.12}>
          <div className="font-mono text-[11px] uppercase tracking-wide mb-4" style={{ color: palette.inkSoft }}>
            Ya pidieron
          </div>
          <div className="flex flex-col">
            {canciones.map((s, i) => (
              <div key={s.id} className="relative grid gap-3 items-center py-3 border-b" style={{ gridTemplateColumns: 'auto 1fr auto', borderColor: palette.line }}>
                <span className="font-serif text-base min-w-[1.6rem]" style={{ color: '#c0a05c' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Editable
                  editable={editable}
                  value={s.titulo}
                  onChange={(v) => update(s.id, { titulo: v })}
                  tag="span"
                  placeholder="Artista — Tema"
                  style={{ color: palette.ink }}
                  className="text-sm truncate pr-4"
                  maxLength={60}
                />
                {editable ? (
                  <div className="flex items-center gap-2">
                    <Editable editable value={s.por} onChange={(v) => update(s.id, { por: v })} tag="span" placeholder="Quién lo pidió" style={{ color: palette.inkSoft }} className="text-xs" maxLength={20} />
                    <button type="button" onClick={() => remove(s.id)} aria-label="Quitar" className="opacity-40 hover:opacity-100" style={{ color: palette.ink }}>
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: palette.inkSoft }}>
                    {s.por}
                  </span>
                )}
              </div>
            ))}
            {extra.map((s, i) => (
              <div key={`extra-${i}`} className="grid gap-3 items-center py-3 border-b" style={{ gridTemplateColumns: 'auto 1fr auto', borderColor: palette.line }}>
                <span className="font-serif text-base min-w-[1.6rem]" style={{ color: '#c0a05c' }}>
                  {String(canciones.length + i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm truncate pr-4" style={{ color: palette.ink }}>
                  {s.titulo}
                </span>
                <span className="text-xs" style={{ color: palette.inkSoft }}>
                  {s.por}
                </span>
              </div>
            ))}
            {editable && (
              <button
                type="button"
                onClick={add}
                className="inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-2.5 border-2 border-dashed mt-3 self-start"
                style={{ borderColor: palette.line, color: palette.inkSoft }}
              >
                <PlusIcon className="w-3 h-3" /> Agregar canción
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Tarjetas simples con un glifo/símbolo en un recuadro, título, descripción
// y un dato final destacado — pensada para mesas de regalo/opciones cortas
// (a diferencia de Beneficios, que usa la librería de íconos del sitio; acá
// el símbolo es un carácter suelto elegido a mano, más personal).
function SeccionRegalos({
  items = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onUpdate?.(items.filter((it) => it.id !== id));
  const add = () => onUpdate?.([...items, { id: `regalo-${Date.now()}`, glyph: '♡', titulo: 'Nueva opción', desc: '', detalle: '' }]);

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <Reveal className="max-w-xl mx-auto text-center mb-9">
        <Editable
          editable={editable}
          value={eyebrow}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="regalos.eyebrow"
          placeholder="Eyebrow (opcional)"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Mesa de regalos'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="regalos.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif text-2xl @lg:text-3xl mb-3"
          maxLength={70}
        />
        <Editable
          editable={editable}
          value={descripcion}
          onChange={onUpdateDescripcion}
          tag="p"
          block
          multiline
          placeholder="Bajada (opcional)"
          style={{ color: palette.inkSoft }}
          className="text-sm"
          maxLength={160}
        />
      </Reveal>
      <div className="max-w-4xl mx-auto grid @sm:grid-cols-2 @lg:grid-cols-3 gap-6">
        {items.map((it, i) => (
          <Reveal key={it.id} delay={Math.min(i * 0.08, 0.4)} className="relative border text-center px-6 py-8" style={{ borderColor: palette.line, background: palette.bg }}>
            {editable && (
              <button
                type="button"
                onClick={() => remove(it.id)}
                aria-label="Quitar"
                className="absolute top-2 right-2 opacity-40 hover:opacity-100"
                style={{ color: palette.ink }}
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <Editable
              editable={editable}
              value={it.glyph}
              onChange={(v) => update(it.id, { glyph: v })}
              tag="div"
              className="w-10 h-10 mx-auto mb-4 border flex items-center justify-center font-serif text-lg"
              style={{ borderColor: '#c0a05c', color: '#c0a05c' }}
              maxLength={2}
            />
            <Editable
              editable={editable}
              value={it.titulo}
              onChange={(v) => update(it.id, { titulo: v })}
              tag="p"
              block
              placeholder="Título"
              style={{ color: palette.ink }}
              className="font-serif text-xl mb-2"
              maxLength={40}
            />
            <Editable
              editable={editable}
              value={it.desc}
              onChange={(v) => update(it.id, { desc: v })}
              tag="p"
              block
              multiline
              placeholder="Descripción"
              style={{ color: palette.inkSoft }}
              className="text-sm leading-relaxed mb-3"
              maxLength={140}
            />
            <Editable
              editable={editable}
              value={it.detalle}
              onChange={(v) => update(it.id, { detalle: v })}
              tag="p"
              block
              placeholder="Detalle (ej: Alias)"
              style={{ color: accent }}
              className="text-sm font-medium"
              maxLength={60}
            />
          </Reveal>
        ))}
        {editable && (
          <button
            type="button"
            onClick={add}
            className="border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-10 text-sm font-semibold"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-4 h-4" /> Agregar
          </button>
        )}
      </div>
    </section>
  );
}

// Grilla conectada de hitos (año + título + descripción) — a diferencia de
// "Cronograma" (horarios de un día puntual, en línea de tiempo), acá cada
// tarjeta comparte borde con la de al lado, pensada para contar una
// historia de varios años en pocas palabras.
function SeccionHistoria({
  items = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onUpdate?.(items.filter((it) => it.id !== id));
  const add = () => onUpdate?.([...items, { id: `hist-${Date.now()}`, year: '2026', title: 'Nuevo momento', desc: '' }]);

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <Reveal className="max-w-xl mx-auto text-center mb-10">
        <Editable
          editable={editable}
          value={eyebrow}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="historia.eyebrow"
          placeholder="Eyebrow (opcional)"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Nuestra historia'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="historia.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif text-2xl @lg:text-3xl"
          maxLength={70}
        />
      </Reveal>
      <div
        className="max-w-5xl mx-auto grid grid-cols-2 @lg:grid-cols-3"
        style={{ borderTop: `1px solid ${palette.line}`, borderLeft: `1px solid ${palette.line}` }}
      >
        {items.map((it, i) => (
          <Reveal
            key={it.id}
            delay={Math.min(i * 0.08, 0.4)}
            className="relative p-6"
            style={{ borderRight: `1px solid ${palette.line}`, borderBottom: `1px solid ${palette.line}` }}
          >
            {editable && (
              <button
                type="button"
                onClick={() => remove(it.id)}
                aria-label="Quitar"
                className="absolute top-2 right-2 opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: palette.ink }}
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <Editable
              editable={editable}
              value={it.year}
              onChange={(v) => update(it.id, { year: v })}
              tag="p"
              placeholder="Año"
              style={{ color: accent }}
              className="font-serif text-2xl mb-2.5"
              maxLength={20}
            />
            <Editable
              editable={editable}
              value={it.title}
              onChange={(v) => update(it.id, { title: v })}
              tag="p"
              block
              placeholder="Título"
              style={{ color: palette.ink }}
              className="font-semibold text-sm mb-1.5 pr-4"
              maxLength={50}
            />
            <Editable
              editable={editable}
              value={it.desc}
              onChange={(v) => update(it.id, { desc: v })}
              tag="p"
              block
              multiline
              placeholder="Descripción breve"
              style={{ color: palette.inkSoft }}
              className="text-sm leading-relaxed"
              maxLength={140}
            />
          </Reveal>
        ))}
        {editable && (
          <button
            type="button"
            onClick={add}
            className="border-r border-b flex flex-col items-center justify-center gap-1.5 py-10 text-sm font-semibold"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-4 h-4" /> Agregar
          </button>
        )}
      </div>
    </section>
  );
}

// Grilla conectada por borde con SOLO título + descripción (sin número ni
// año) sobre fondo oscuro — a diferencia de "Historia" (que siempre lleva un
// año grande arriba) o "Ciclo de trabajo" (que lleva número + rango de
// fechas + sub-lista), pensada para condiciones/políticas cortas tipo FAQ
// en columnas, no una línea de tiempo.
function SeccionCondiciones({
  items = [],
  onUpdate,
  onRemove,
  onAdd,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  textColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onRemove?.(id);
  const add = () => onAdd?.({ id: `cond-${Date.now()}`, titulo: 'Nueva condición', desc: '' });

  const suave = textColor || 'rgba(244,245,247,0.72)';

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.ink, color: textColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <Reveal className="mb-9 max-w-xl">
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="condiciones.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Cómo trabajamos'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="condiciones.titulo"
            style={{ color: headingColor || textColor || palette.bg }}
            className="font-serif text-2xl @lg:text-3xl"
            maxLength={70}
          />
        </Reveal>
        <div
          className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-4"
          style={{ borderTop: '1px solid rgba(244,245,247,0.2)', borderLeft: '1px solid rgba(244,245,247,0.2)' }}
        >
          {items.map((it, i) => (
            <Reveal
              key={it.id}
              delay={Math.min(i * 0.08, 0.4)}
              className="relative px-6 py-7"
              style={{ borderRight: '1px solid rgba(244,245,247,0.2)', borderBottom: '1px solid rgba(244,245,247,0.2)' }}
            >
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label="Quitar"
                  className="absolute top-2 right-2 opacity-40 hover:opacity-100"
                  style={{ color: textColor || palette.bg }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <Editable
                editable={editable}
                value={it.titulo}
                onChange={(v) => update(it.id, { titulo: v })}
                tag="div"
                block
                placeholder="Título"
                style={{ color: accent }}
                className="font-serif font-bold text-xl mb-2.5"
                maxLength={40}
              />
              <Editable
                editable={editable}
                value={it.desc}
                onChange={(v) => update(it.id, { desc: v })}
                tag="p"
                block
                multiline
                placeholder="Descripción breve"
                style={{ color: suave }}
                className="text-sm leading-relaxed"
                maxLength={160}
              />
            </Reveal>
          ))}
          {editable && (
            <button
              type="button"
              onClick={add}
              className="border-r border-b flex flex-col items-center justify-center gap-1.5 py-10 text-sm font-semibold"
              style={{ borderColor: 'rgba(244,245,247,0.2)', color: suave }}
            >
              <PlusIcon className="w-4 h-4" /> Agregar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// Tarjetas de hospedaje (nombre, distancia, descripción, precio + código de
// descuento) — para invitados que vienen de afuera del evento, distinta de
// "Lugares del evento" (que son los lugares DEL evento en sí, con hora y
// mapa, no alojamiento con tarifa).
function SeccionHospedaje({
  items = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onUpdate?.(items.filter((it) => it.id !== id));
  const add = () =>
    onUpdate?.([...items, { id: `hotel-${Date.now()}`, nombre: 'Nuevo hotel', distancia: '', desc: '', precio: '', codigo: '' }]);

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <Reveal className="max-w-xl mx-auto text-center mb-9">
        <Editable
          editable={editable}
          value={eyebrow}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="hospedaje.eyebrow"
          placeholder="Eyebrow (opcional)"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Si venís de afuera'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="hospedaje.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif text-2xl @lg:text-3xl mb-3"
          maxLength={70}
        />
        <Editable
          editable={editable}
          value={descripcion}
          onChange={onUpdateDescripcion}
          tag="p"
          block
          multiline
          placeholder="Bajada (opcional)"
          style={{ color: palette.inkSoft }}
          className="text-sm"
          maxLength={140}
        />
      </Reveal>
      <div className="max-w-5xl mx-auto grid @sm:grid-cols-2 @lg:grid-cols-3 gap-5">
        {items.map((it, i) => (
          <Reveal key={it.id} delay={Math.min(i * 0.08, 0.4)} className="relative border px-6 py-6" style={{ borderColor: palette.line, background: palette.bg }}>
            {editable && (
              <button
                type="button"
                onClick={() => remove(it.id)}
                aria-label="Quitar"
                className="absolute top-2 right-2 opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: palette.ink }}
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <Editable
              editable={editable}
              value={it.nombre}
              onChange={(v) => update(it.id, { nombre: v })}
              tag="p"
              block
              placeholder="Nombre del hotel"
              style={{ color: palette.ink }}
              className="font-serif text-xl mb-1 pr-4"
              maxLength={50}
            />
            <Editable
              editable={editable}
              value={it.distancia}
              onChange={(v) => update(it.id, { distancia: v })}
              tag="p"
              block
              placeholder="Ej: A 4 km del predio"
              style={{ color: palette.inkSoft }}
              className="text-xs mb-3"
              maxLength={40}
            />
            <Editable
              editable={editable}
              value={it.desc}
              onChange={(v) => update(it.id, { desc: v })}
              tag="p"
              block
              multiline
              placeholder="Descripción breve"
              style={{ color: palette.inkSoft }}
              className="text-sm leading-relaxed mb-4"
              maxLength={140}
            />
            <div className="flex items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: palette.line }}>
              <Editable
                editable={editable}
                value={it.precio}
                onChange={(v) => update(it.id, { precio: v })}
                tag="span"
                placeholder="Desde $0"
                style={{ color: palette.ink }}
                className="text-sm font-semibold"
                maxLength={30}
              />
              <Editable
                editable={editable}
                value={it.codigo}
                onChange={(v) => update(it.id, { codigo: v })}
                tag="span"
                placeholder="Código"
                style={{ color: accent }}
                className="text-xs"
                maxLength={30}
              />
            </div>
          </Reveal>
        ))}
        {editable && (
          <button
            type="button"
            onClick={add}
            className="border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-10 text-sm font-semibold"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-4 h-4" /> Agregar
          </button>
        )}
      </div>
    </section>
  );
}

// Libro de mensajes: el visitante deja un mensaje en el momento (queda solo
// en su sesión, mismo criterio que Playlist/RSVP no tienen backend propio)
// mientras el dueño edita los mensajes semilla que todos ven al entrar. A
// diferencia de Playlist (input de una línea + lista numerada), acá el
// mensaje es un texto largo con firma, mostrado como cita.
function SeccionLibroDeMensajes({
  mensajes = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const [input, setInput] = useState('');
  const [extra, setExtra] = useState([]);

  const update = (id, patch) => onUpdate?.(mensajes.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const remove = (id) => onUpdate?.(mensajes.filter((m) => m.id !== id));
  const add = () => onUpdate?.([...mensajes, { id: `msg-${Date.now()}`, texto: 'Nuevo mensaje', por: 'Alguien' }]);

  const addMensaje = () => {
    const v = input.trim();
    if (!v) return;
    setExtra((prev) => [{ texto: v, por: 'Un invitado' }, ...prev]);
    setInput('');
  };

  const allMensajes = [...extra, ...mensajes];

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto grid @lg:grid-cols-[0.95fr_1.05fr] gap-10 @lg:gap-14 items-start">
        <Reveal>
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="libromensajes.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Dejanos unas palabras'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="libromensajes.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl mb-3"
            maxLength={70}
          />
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="p"
            block
            multiline
            placeholder="Bajada (opcional)"
            style={{ color: palette.inkSoft }}
            className="text-sm leading-relaxed mb-6 max-w-sm"
            maxLength={140}
          />
          {!editable && (
            <>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                placeholder="Escribí tu mensaje..."
                className="w-full box-border border px-3.5 py-2.5 text-sm outline-none resize-y mb-3"
                style={{ borderColor: palette.line, background: palette.bg, color: palette.ink }}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={addMensaje}
                  className="px-4 py-2.5 text-xs uppercase tracking-wide font-semibold"
                  style={{ background: accent, color: '#fff' }}
                >
                  Firmar el libro
                </button>
                <span className="text-sm" style={{ color: palette.inkSoft }}>
                  {allMensajes.length} mensajes firmados
                </span>
              </div>
            </>
          )}
        </Reveal>
        <Reveal delay={0.12} className="flex flex-col gap-4 @lg:max-h-[420px] @lg:overflow-y-auto scrollbar-hide">
          {mensajes.map((m) => (
            <div key={m.id} className="relative border px-5 py-5" style={{ borderColor: palette.line, background: palette.bg }}>
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label="Quitar"
                  className="absolute top-2 right-2 opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <Editable
                editable={editable}
                value={m.texto}
                onChange={(v) => update(m.id, { texto: v })}
                tag="p"
                block
                multiline
                prefix={editable ? '' : '"'}
                suffix={editable ? '' : '"'}
                placeholder="Mensaje"
                style={{ color: palette.ink }}
                className="font-serif italic text-base leading-relaxed mb-3 pr-4"
                maxLength={220}
              />
              <Editable
                editable={editable}
                value={m.por}
                onChange={(v) => update(m.id, { por: v })}
                tag="span"
                placeholder="Firma"
                style={{ color: palette.inkSoft }}
                className="text-xs"
                maxLength={40}
                prefix="— "
              />
            </div>
          ))}
          {extra.map((m, i) => (
            <div key={`extra-${i}`} className="border px-5 py-5" style={{ borderColor: palette.line, background: palette.bg }}>
              <p className="font-serif italic text-base leading-relaxed mb-3" style={{ color: palette.ink }}>
                "{m.texto}"
              </p>
              <span className="text-xs" style={{ color: palette.inkSoft }}>
                — {m.por}
              </span>
            </div>
          ))}
          {editable && (
            <button
              type="button"
              onClick={add}
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-2.5 border-2 border-dashed self-start"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-3 h-3" /> Agregar mensaje
            </button>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function SeccionContacto({
  accent,
  palette = {},
  bgColor,
  headingColor,
  buttonColor,
  editable = false,
  variant = 'centrado',
  titulo,
  subtitulo,
  placeholderNombre,
  placeholderEmail,
  placeholderMensaje,
  textoBoton,
  textoGracias,
  camposExtra = [],
  imagenUrl,
  direccion,
  telefono,
  horarios,
  whatsapp,
  nombreNegocio,
  seccionesDisponibles = [],
  botones: botonesData = {},
  onUpdateBotones,
  onUpdateContacto,
  onUpdateHorarios,
  onUpdateDireccion,
  onUpdateTelefono,
}) {
  const btnColor = buttonColor || palette.inkHex || '#171717';
  const set = (field) => (v) => onUpdateContacto?.({ [field]: v });

  const formProps = {
    editable,
    placeholderNombre,
    placeholderEmail,
    placeholderMensaje,
    textoBoton,
    textoGracias,
    camposExtra,
    btnColor,
    set,
    onUpdateContacto,
  };

  if (variant === 'split') {
    return (
      <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
        <div className="max-w-4xl mx-auto grid @lg:grid-cols-2 gap-8 @lg:gap-12 items-center">
          <div className="text-left">
            {editable ? (
              <label className="group/cimg relative block aspect-video overflow-hidden bg-black/5 cursor-pointer mb-5">
                {imagenUrl ? (
                  <img src={imagenUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: palette.inkSoft }}>
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <span className="absolute inset-0 bg-black/0 group-hover/cimg:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/cimg:opacity-100">
                  <PencilIcon className="w-5 h-5 text-white" />
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpdateContacto?.({ contactoImagenUrl: await uploadImage(file) });
                  }}
                />
              </label>
            ) : imagenUrl ? (
              <img src={imagenUrl} alt="" className="w-full aspect-video object-cover mb-5" />
            ) : null}
            <Editable
              editable={editable}
              value={titulo ?? 'Dejanos tu consulta'}
              onChange={set('contactoTitulo')}
              tag="h2"
              block
              styleKey="contacto.titulo"
              style={{ color: headingColor || palette.ink }}
              className="font-serif italic text-2xl mb-2"
            />
            <Editable
              editable={editable}
              value={subtitulo ?? 'Te respondemos a la brevedad.'}
              onChange={set('contactoSubtitulo')}
              tag="p"
              block
              styleKey="contacto.subtitulo"
              style={{ color: palette.inkSoft }}
              className="text-sm"
            />
            {(direccion || telefono) && (
              <div className="mt-4 space-y-1 text-sm" style={{ color: palette.inkSoft }}>
                {direccion && <p>{direccion}</p>}
                {telefono && <p>{telefono}</p>}
              </div>
            )}
          </div>
          <ContactoForm {...formProps} />
        </div>
      </section>
    );
  }

  // "directo" — sin formulario: título grande + botón de WhatsApp + los
  // mismos datos globales (horarios/dirección/contacto) en una lista simple.
  // Para negocios que prefieren que la conversación arranque directo por
  // WhatsApp en vez de completar un form web (fotógrafos, artistas,
  // freelancers) — misma idea que "mapa" pero sin el mapa simulado.
  if (variant === 'directo') {
    const rows = [
      { label: 'Dirección', value: direccion, onChangeValue: onUpdateDireccion, maxLength: 120 },
      { label: 'Contacto', value: telefono, onChangeValue: onUpdateTelefono, maxLength: 40 },
      { label: 'Horarios', value: horarios, onChangeValue: onUpdateHorarios, maxLength: 60 },
    ].filter((r) => r.value || editable);
    return (
      <section className="px-6 @lg:px-10 py-14 @lg:py-20 border-t" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
        <div className="max-w-5xl mx-auto grid @lg:grid-cols-2 gap-8 @lg:gap-12 items-center">
          <div>
            <Editable
              editable={editable}
              value={titulo ?? 'Contame tu proyecto.'}
              onChange={set('contactoTitulo')}
              tag="h2"
              block
              styleKey="contacto.titulo"
              style={{ color: headingColor || palette.ink }}
              className="font-serif text-3xl @lg:text-5xl leading-[0.98] mb-5 text-balance"
              maxLength={70}
            />
            <Editable
              editable={editable}
              value={subtitulo ?? 'Respondo dentro de las 24 horas.'}
              onChange={set('contactoSubtitulo')}
              tag="p"
              block
              styleKey="contacto.subtitulo"
              style={{ color: palette.inkSoft }}
              className="text-sm leading-relaxed mb-7 max-w-sm"
              maxLength={160}
            />
            <ButtonObject
              value={botonesData.whatsapp}
              onChange={(patch) => onUpdateBotones?.({ ...botonesData, whatsapp: { ...(botonesData.whatsapp || {}), ...patch } })}
              editable={editable}
              seccionesDisponibles={seccionesDisponibles}
              nombreNegocio={nombreNegocio}
              defaultFuncion="whatsapp"
              defaultLabel="Escribime por WhatsApp"
              defaultColor={accent}
              defaultTarget={whatsapp}
            />
          </div>
          <div className="flex flex-col gap-5">
            {rows.map((r) => (
              <div key={r.label} className="border-b pb-4" style={{ borderColor: palette.line }}>
                <p className="font-mono text-xs uppercase tracking-wide mb-1" style={{ color: accent }}>
                  {r.label}
                </p>
                <Editable
                  editable={editable}
                  value={r.value ?? ''}
                  onChange={r.onChangeValue}
                  tag="p"
                  block
                  placeholder="—"
                  styleKey={`contacto.directo.${r.label}`}
                  style={{ color: palette.ink }}
                  className="text-[15px]"
                  maxLength={r.maxLength}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // "mapa" es el default de las plantillas de cliente: datos (horarios/
  // dirección/contacto) + un mapa simulado, sin formulario — el visitante
  // escribe por WhatsApp, no llena un form web. horarios/direccion/telefono
  // son campos globales de siteData (no de esta sección), por eso sus
  // onChange van por field(name) desde el llamador, no por onUpdateContacto
  // (que solo toca campos propios de ESTA sección, como contactoImagenUrl).
  if (variant === 'mapa') {
    const dato = (label, value, onChangeValue, maxLength) =>
      (value || editable) && (
        <div>
          <p className="font-mono text-xs uppercase tracking-wide mb-1" style={{ color: palette.inkSoft }}>
            {label}
          </p>
          <Editable
            editable={editable}
            value={value ?? ''}
            onChange={onChangeValue}
            tag="p"
            block
            placeholder="—"
            styleKey={`contacto.${label}`}
            style={{ color: palette.ink }}
            className="text-[15px]"
            maxLength={maxLength}
          />
        </div>
      );
    return (
      <section
        className="px-6 @lg:px-10 py-14 @lg:py-20 border-t grid @lg:grid-cols-2 gap-10 @lg:gap-14 max-w-6xl mx-auto"
        style={{ background: bgColor || palette.bg, borderColor: palette.line }}
      >
        <div>
          <Editable
            editable={editable}
            value={titulo ?? 'Encontranos'}
            onChange={set('contactoTitulo')}
            tag="span"
            block
            styleKey="contacto.titulo"
            style={{ color: headingColor || accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-5"
            maxLength={40}
          />
          <div className="flex flex-col gap-5">
            {dato('Horarios', horarios, onUpdateHorarios, 60)}
            {dato('Dirección', direccion, onUpdateDireccion, 120)}
            {dato('Contacto', telefono, onUpdateTelefono, 40)}
          </div>
        </div>
        <label
          className={`group/mapimg relative min-h-[220px] flex items-center justify-center overflow-hidden ${editable ? 'cursor-pointer' : ''}`}
          style={{ background: palette.line }}
        >
          {imagenUrl ? (
            <img src={imagenUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <span className="font-mono text-xs uppercase" style={{ color: palette.inkSoft }}>
              Mapa (simulado)
            </span>
          )}
          {editable && (
            <>
              <span className="absolute inset-0 bg-black/0 group-hover/mapimg:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/mapimg:opacity-100">
                <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                  <PencilIcon className="w-4 h-4" /> {imagenUrl ? 'Cambiar imagen' : 'Subir foto o captura del mapa'}
                </span>
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpdateContacto?.({ contactoImagenUrl: await uploadImage(file) });
                }}
              />
            </>
          )}
        </label>
      </section>
    );
  }

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-md mx-auto text-center">
        <Editable
          editable={editable}
          value={titulo ?? 'Dejanos tu consulta'}
          onChange={set('contactoTitulo')}
          tag="h2"
          block
          styleKey="contacto.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif italic text-2xl mb-2"
        />
        <Editable
          editable={editable}
          value={subtitulo ?? 'Te respondemos a la brevedad.'}
          onChange={set('contactoSubtitulo')}
          tag="p"
          block
          styleKey="contacto.subtitulo"
          style={{ color: palette.inkSoft }}
          className="text-sm mb-6"
        />
        <ContactoForm {...formProps} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Secciones nuevas: Precios, Equipo, Llamado a la acción (CTA), Menú, Logos
// de clientes, Ubicación y Blog/Novedades. Todas siguen las mismas
// convenciones que las secciones de antes: `Editable` con `styleKey` para
// cada texto, `MediaCarousel`/subida validada para las fotos, `ButtonObject`
// para cualquier botón, y el color de fondo/título/texto/botones lo resuelve
// `SectionShell` genéricamente (no hace falta nada especial acá para eso).
// ---------------------------------------------------------------------------

function SeccionPrecios({
  accent,
  palette = {},
  bgColor,
  headingColor,
  titulo,
  onUpdateTitulo,
  planes = [],
  editable = false,
  onAddPlan,
  onRemovePlan,
  onUpdatePlan,
  onDuplicatePlan,
  onMovePlan,
  onToggleOcultoPlan,
  nombreNegocio,
  whatsapp,
  seccionesDisponibles = [],
}) {
  const [nombre, setNombre] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onAddPlan?.({ nombre, precio: 0, periodo: 'mes', destacado: false, features: [], boton: {} });
    setNombre('');
  };

  const addFeature = (plan) => onUpdatePlan?.(plan.id, { features: [...(plan.features || []), 'Nueva característica'] });
  const updateFeature = (plan, i, value) => {
    const next = [...(plan.features || [])];
    next[i] = value;
    onUpdatePlan?.(plan.id, { features: next });
  };
  const removeFeature = (plan, i) =>
    onUpdatePlan?.(plan.id, { features: (plan.features || []).filter((_, idx) => idx !== i) });

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto pb-6 mb-10 border-b" style={{ borderColor: palette.line }}>
        <Editable
          editable={editable}
          value={titulo ?? 'Precios y planes'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="precios.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif italic text-2xl @lg:text-3xl"
          maxLength={70}
        />
      </div>
      {planes.length === 0 && !editable ? (
        <p className="text-center text-sm max-w-sm mx-auto" style={{ color: palette.inkSoft }}>
          Todavía no cargaste planes.
        </p>
      ) : (
        <div className="max-w-5xl mx-auto grid @lg:grid-cols-3 gap-6 items-stretch">
          {(editable ? planes : planes.filter((p) => !p.oculto)).map((p, i, arr) => (
            <div
              key={p.id}
              className={`relative border p-7 text-left flex flex-col gap-4 ${p.oculto ? 'opacity-40' : ''}`}
              style={{ borderColor: palette.line }}
            >
              {editable && (
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => onUpdatePlan?.(p.id, { destacado: !p.destacado })}
                    aria-label={p.destacado ? 'Quitar destacado' : 'Marcar como destacado'}
                    title={p.destacado ? 'Quitar destacado' : 'Marcar como destacado'}
                    className="w-6 h-6 flex items-center justify-center transition-colors"
                    style={{ color: p.destacado ? accent : palette.inkSoft }}
                  >
                    <StarIcon className="w-3.5 h-3.5" />
                  </button>
                  <ItemToolbar
                    variant="inline"
                    color={palette.ink}
                    oculto={p.oculto}
                    canMoveUp={i > 0}
                    canMoveDown={i < arr.length - 1}
                    onMoveUp={() => onMovePlan?.(p.id, -1)}
                    onMoveDown={() => onMovePlan?.(p.id, 1)}
                    onDuplicate={() => onDuplicatePlan?.(p.id)}
                    onToggleOculto={() => onToggleOcultoPlan?.(p.id)}
                    onRemove={() => onRemovePlan?.(p.id)}
                    removeLabel={`Quitar ${p.nombre}`}
                  />
                </div>
              )}
              {p.destacado && (
                <span className="font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: accent }}>
                  Más elegido
                </span>
              )}
              <Editable
                editable={editable}
                value={p.nombre}
                onChange={(v) => onUpdatePlan?.(p.id, { nombre: v })}
                tag="p"
                block
                styleKey={`plan.${p.id}.nombre`}
                placeholder="Nombre del plan"
                style={{ color: palette.ink }}
                className="font-serif text-2xl"
                maxLength={40}
              />
              <div className="flex items-baseline gap-1 flex-wrap">
                {p.precioTexto ? (
                  <Editable
                    editable={editable}
                    value={p.precioTexto}
                    onChange={(v) => onUpdatePlan?.(p.id, { precioTexto: v })}
                    tag="span"
                    styleKey={`plan.${p.id}.precioTexto`}
                    placeholder="Ej: A medida"
                    style={{ color: palette.ink }}
                    className="font-mono font-bold text-2xl"
                    maxLength={20}
                  />
                ) : (
                  <Editable
                    editable={editable}
                    value={p.precio}
                    onChange={(v) => onUpdatePlan?.(p.id, { precio: Number(v) || 0 })}
                    tag="span"
                    type="number"
                    styleKey={`plan.${p.id}.precio`}
                    format={(v) => `$${Number(v || 0).toLocaleString('es-AR')}`}
                    style={{ color: palette.ink }}
                    className="font-mono font-bold text-2xl"
                  />
                )}
                <span className="text-sm inline-flex items-baseline" style={{ color: palette.inkSoft }}>
                  /
                  <Editable
                    editable={editable}
                    value={p.periodo}
                    onChange={(v) => onUpdatePlan?.(p.id, { periodo: v })}
                    tag="span"
                    styleKey={`plan.${p.id}.periodo`}
                    placeholder="mes"
                    maxLength={20}
                  />
                </span>
                {editable && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdatePlan?.(p.id, p.precioTexto ? { precioTexto: undefined } : { precioTexto: 'A medida' })
                    }
                    className="text-[10px] underline decoration-dotted opacity-60 hover:opacity-100 transition-opacity ml-1"
                  >
                    {p.precioTexto ? 'Usar precio numérico' : 'Usar texto libre'}
                  </button>
                )}
              </div>
              <ul className="flex flex-col gap-1.5 flex-1">
                {(p.features || []).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: palette.inkSoft }}>
                    <Editable
                      editable={editable}
                      value={f}
                      onChange={(v) => updateFeature(p, i, v)}
                      tag="span"
                      className="flex-1"
                      maxLength={80}
                    />
                    {editable && (
                      <button
                        type="button"
                        onClick={() => removeFeature(p, i)}
                        aria-label="Quitar característica"
                        className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    )}
                  </li>
                ))}
                {editable && (
                  <li>
                    <button
                      type="button"
                      onClick={() => addFeature(p)}
                      className="inline-flex items-center gap-1 text-xs font-semibold opacity-50 hover:opacity-100 transition-opacity"
                      style={{ color: palette.inkSoft }}
                    >
                      <PlusIcon className="w-3 h-3" /> Agregar característica
                    </button>
                  </li>
                )}
              </ul>
              {buttonSlotVisible(editable, p.boton, 'whatsapp', whatsapp) && (
                <ButtonObject
                  value={p.boton}
                  onChange={(patch) => onUpdatePlan?.(p.id, { boton: { ...(p.boton || {}), ...patch } })}
                  editable={editable}
                  seccionesDisponibles={seccionesDisponibles}
                  nombreNegocio={nombreNegocio}
                  defaultFuncion="whatsapp"
                  defaultLabel="Elegir plan"
                  defaultColor={palette.inkHex || '#171717'}
                  defaultTarget={whatsapp}
                  waMessage={p.nombre ? `Hola! Quiero consultar por el plan "${p.nombre}".` : undefined}
                  outline
                  className="w-full justify-center"
                />
              )}
            </div>
          ))}
          {editable && (
            <form
              onSubmit={submit}
              className="border-2 border-dashed p-7 flex flex-col justify-center gap-2"
              style={{ borderColor: palette.line }}
            >
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del plan"
                className="w-full border px-3 py-2 text-sm outline-none"
                style={{ borderColor: palette.line }}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 text-white mt-1"
                style={{ background: palette.inkHex || '#171717' }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar plan
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

// Escalas de descuento por volumen: tarjetas con un rango de cantidad, un
// porcentaje de descuento grande y una etiqueta opcional ("El más elegido")
// — a diferencia de "Precios" (que son planes de suscripción con lista de
// características), acá cada tarjeta es un escalón de una MISMA tabla de
// descuento por cantidad total, no una oferta independiente.
function SeccionEscalasVolumen({
  items = [],
  onUpdate,
  onRemove,
  onAdd,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  descripcion,
  onUpdateDescripcion,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onRemove?.(id);
  const add = () =>
    onAdd?.({ id: `tier-${Date.now()}`, tag: '', rango: 'Nuevo rango', off: '−0 %', desc: '', topColor: '#c6ccd8' });

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <Reveal className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Editable
              editable={editable}
              value={eyebrow}
              onChange={onUpdateEyebrow}
              tag="span"
              block
              styleKey="escalasvolumen.eyebrow"
              placeholder="Eyebrow (opcional)"
              style={{ color: '#2a4d9b' }}
              className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
              maxLength={40}
            />
            <Editable
              editable={editable}
              value={titulo ?? 'Más bultos, mejor precio'}
              onChange={onUpdateTitulo}
              tag="h2"
              block
              styleKey="escalasvolumen.titulo"
              style={{ color: headingColor || palette.ink }}
              className="font-serif text-2xl @lg:text-3xl"
              maxLength={70}
            />
          </div>
          <Editable
            editable={editable}
            value={descripcion}
            onChange={onUpdateDescripcion}
            tag="span"
            block
            placeholder="Nota breve (opcional)"
            style={{ color: palette.inkSoft }}
            className="font-mono text-xs max-w-xs"
            maxLength={160}
          />
        </Reveal>
        <div className="grid @sm:grid-cols-2 @lg:grid-cols-3 gap-5">
          {items.map((it, i) => (
            <Reveal
              key={it.id}
              delay={Math.min(i * 0.08, 0.4)}
              className="relative bg-white px-6 py-7"
              style={{ border: `1px solid ${palette.line}`, borderTop: `4px solid ${it.topColor || palette.line}`, background: palette.bg }}
            >
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label="Quitar"
                  className="absolute top-2 right-2 opacity-40 hover:opacity-100"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <Editable
                editable={editable}
                value={it.tag}
                onChange={(v) => update(it.id, { tag: v })}
                tag="div"
                block
                placeholder="Etiqueta (opcional)"
                style={{ color: it.topColor || accent }}
                className="font-mono text-[11px] uppercase tracking-wide mb-3 min-h-[1rem]"
                maxLength={30}
              />
              <Editable
                editable={editable}
                value={it.rango}
                onChange={(v) => update(it.id, { rango: v })}
                tag="div"
                block
                placeholder="Rango (ej: 6 a 20 bultos)"
                style={{ color: palette.ink }}
                className="font-semibold text-lg mb-1.5"
                maxLength={40}
              />
              <Editable
                editable={editable}
                value={it.off}
                onChange={(v) => update(it.id, { off: v })}
                tag="div"
                placeholder="−0 %"
                style={{ color: accent }}
                className="font-serif font-bold text-4xl leading-none mb-3"
                maxLength={10}
              />
              <Editable
                editable={editable}
                value={it.desc}
                onChange={(v) => update(it.id, { desc: v })}
                tag="p"
                block
                multiline
                placeholder="Descripción breve"
                style={{ color: palette.inkSoft }}
                className="text-sm leading-relaxed"
                maxLength={140}
              />
            </Reveal>
          ))}
          {editable && (
            <button
              type="button"
              onClick={add}
              className="border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-10 text-sm font-semibold min-h-[220px]"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-4 h-4" /> Agregar escalón
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function SeccionEquipo({
  equipo = [],
  variant = 'grid',
  editable = false,
  bgColor,
  headingColor,
  accent,
  palette = {},
  titulo,
  onUpdateTitulo,
  onAddMember,
  onRemoveMember,
  onUpdateMember,
  onDuplicateMember,
  onMoveMember,
  onToggleOcultoMember,
}) {
  const [idx, setIdx] = useState(0);
  const current = Math.min(idx, Math.max(equipo.length - 1, 0));
  const [nombre, setNombre] = useState('');

  const handleFoto = (id) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (await validateImageFile(file, 'equipo')) onUpdateMember?.(id, { foto: await uploadImage(file) });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onAddMember?.({ nombre, rol: '', foto: '' });
    setNombre('');
  };

  const Card = ({ m, canMoveUp, canMoveDown }) => (
    <div className={`relative text-left border-t-2 pt-4 ${m.oculto ? 'opacity-40' : ''}`} style={{ borderColor: accent }}>
      {editable && (
        <div className="absolute top-4 right-0">
          <ItemToolbar
            variant="inline"
            color={palette.ink}
            oculto={m.oculto}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            onMoveUp={() => onMoveMember?.(m.id, -1)}
            onMoveDown={() => onMoveMember?.(m.id, 1)}
            onDuplicate={() => onDuplicateMember?.(m.id)}
            onToggleOculto={() => onToggleOcultoMember?.(m.id)}
            onRemove={() => onRemoveMember?.(m.id)}
            removeLabel={`Quitar ${m.nombre}`}
          />
        </div>
      )}
      <label
        className={`group/foto relative w-13 h-13 overflow-hidden mb-4 flex items-center justify-center ${
          editable ? 'cursor-pointer' : ''
        }`}
        style={{ background: palette.inkHex || '#171717' }}
        title={editable ? 'Cambiar foto' : undefined}
      >
        {m.foto ? (
          <img src={m.foto} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="font-mono font-bold text-base" style={{ color: palette.bg }}>
            {initials(m.nombre)}
          </span>
        )}
        {editable && (
          <>
            <span className="absolute inset-0 bg-black/0 group-hover/foto:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/foto:opacity-100">
              <PencilIcon className="w-4 h-4 text-white" />
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFoto(m.id)} />
          </>
        )}
      </label>
      <Editable
        editable={editable}
        value={m.nombre}
        onChange={(v) => onUpdateMember?.(m.id, { nombre: v })}
        tag="p"
        block
        styleKey={`equipo.${m.id}.nombre`}
        placeholder="Nombre"
        style={{ color: palette.ink }}
        className="font-serif text-xl mb-0.5"
        maxLength={50}
      />
      <Editable
        editable={editable}
        value={m.rol}
        onChange={(v) => onUpdateMember?.(m.id, { rol: v })}
        tag="p"
        block
        styleKey={`equipo.${m.id}.rol`}
        placeholder="Rol o cargo"
        style={{ color: palette.inkSoft }}
        className="font-mono text-xs uppercase tracking-wide"
        maxLength={50}
      />
    </div>
  );

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto pb-6 mb-10 border-b" style={{ borderColor: palette.line }}>
        <Editable
          editable={editable}
          value={titulo ?? 'Nuestro equipo'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="equipo.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif italic text-2xl @lg:text-3xl"
          maxLength={70}
        />
      </div>
      {equipo.length === 0 && !editable ? (
        <p className="text-center text-sm max-w-sm mx-auto" style={{ color: palette.inkSoft }}>
          Todavía no agregaste a tu equipo.
        </p>
      ) : variant === 'carousel' ? (
        <div className="max-w-xs mx-auto">
          {equipo.length > 0 && <Card m={equipo[current]} />}
          {equipo.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                type="button"
                onClick={() => setIdx((current - 1 + equipo.length) % equipo.length)}
                aria-label="Anterior"
                className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIdx((current + 1) % equipo.length)}
                aria-label="Siguiente"
                className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
          {editable && (
            <form onSubmit={submit} className="mt-4 flex gap-2">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la persona"
                className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
              <button type="submit" className="rounded-lg bg-neutral-900 text-white px-3 text-sm font-semibold">
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      ) : variant === 'retrato' ? (
        <div className="max-w-4xl mx-auto grid grid-cols-2 @lg:grid-cols-3 gap-6">
          {(editable ? equipo : equipo.filter((m) => !m.oculto)).map((m, i, arr) => (
            <div
              key={m.id}
              className={`relative text-left border-t-2 pt-4 ${m.oculto ? 'opacity-40' : ''}`}
              style={{ borderColor: accent }}
            >
              {editable && (
                <div className="absolute top-4 right-0 z-10">
                  <ItemToolbar
                    variant="inline"
                    color={palette.ink}
                    oculto={m.oculto}
                    canMoveUp={i > 0}
                    canMoveDown={i < arr.length - 1}
                    onMoveUp={() => onMoveMember?.(m.id, -1)}
                    onMoveDown={() => onMoveMember?.(m.id, 1)}
                    onDuplicate={() => onDuplicateMember?.(m.id)}
                    onToggleOculto={() => onToggleOcultoMember?.(m.id)}
                    onRemove={() => onRemoveMember?.(m.id)}
                    removeLabel={`Quitar ${m.nombre}`}
                  />
                </div>
              )}
              <label
                className={`group/foto relative block w-full aspect-[3/4] overflow-hidden mb-4 ${editable ? 'cursor-pointer' : ''}`}
                style={{ background: 'rgba(0,0,0,0.05)' }}
                title={editable ? 'Cambiar foto' : undefined}
              >
                {m.foto ? (
                  <img
                    src={m.foto}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ filter: 'grayscale(0.15) contrast(1.05)' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ color: palette.inkSoft }}>
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                {editable && (
                  <>
                    <span className="absolute inset-0 bg-black/0 group-hover/foto:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/foto:opacity-100">
                      <PencilIcon className="w-4 h-4 text-white" />
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFoto(m.id)} />
                  </>
                )}
              </label>
              <Editable
                editable={editable}
                value={m.nombre}
                onChange={(v) => onUpdateMember?.(m.id, { nombre: v })}
                tag="p"
                block
                styleKey={`equipo.${m.id}.nombre`}
                placeholder="Nombre"
                style={{ color: palette.ink }}
                className="font-serif italic text-lg mb-0.5"
                maxLength={50}
              />
              <Editable
                editable={editable}
                value={m.rol}
                onChange={(v) => onUpdateMember?.(m.id, { rol: v })}
                tag="p"
                block
                styleKey={`equipo.${m.id}.rol`}
                placeholder="Rol o cargo"
                style={{ color: palette.inkSoft }}
                className="font-mono text-xs uppercase tracking-wide"
                maxLength={50}
              />
              <Editable
                editable={editable}
                value={m.bio}
                onChange={(v) => onUpdateMember?.(m.id, { bio: v })}
                tag="p"
                block
                multiline
                placeholder="Bio corta (opcional)"
                style={{ color: palette.inkSoft }}
                className="text-xs leading-relaxed mt-2"
                maxLength={200}
              />
              {(m.tags?.length > 0 || editable) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(m.tags || []).map((tag, i) => (
                    <span
                      key={i}
                      className="relative group/tag text-[10px] uppercase tracking-wide border px-2 py-1"
                      style={{ borderColor: palette.line, color: palette.inkSoft }}
                    >
                      {tag}
                      {editable && (
                        <button
                          type="button"
                          onClick={() => onUpdateMember?.(m.id, { tags: m.tags.filter((_, ti) => ti !== i) })}
                          aria-label={`Quitar ${tag}`}
                          className="ml-1 opacity-50 hover:opacity-100"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  {editable && (
                    <button
                      type="button"
                      onClick={() => {
                        const tag = window.prompt('Etiqueta (ej: Fineline)');
                        if (tag?.trim()) onUpdateMember?.(m.id, { tags: [...(m.tags || []), tag.trim()] });
                      }}
                      className="text-[10px] uppercase tracking-wide border-2 border-dashed px-2 py-1"
                      style={{ borderColor: palette.line, color: palette.inkSoft }}
                    >
                      + Etiqueta
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {editable && (
            <form
              onSubmit={submit}
              className="border-2 border-dashed border-black/15 p-5 flex flex-col justify-center gap-2"
            >
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la persona"
                className="w-full border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 bg-neutral-900 text-white mt-1"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-2 @lg:grid-cols-4 gap-4">
          {(editable ? equipo : equipo.filter((m) => !m.oculto)).map((m, i, arr) => (
            <Card key={m.id} m={m} canMoveUp={i > 0} canMoveDown={i < arr.length - 1} />
          ))}
          {editable && (
            <form
              onSubmit={submit}
              className="rounded-xl border-2 border-dashed border-black/15 p-5 flex flex-col justify-center gap-2"
            >
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la persona"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold py-2 bg-neutral-900 text-white mt-1"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

const CTA_BUTTON_SLOTS = [{ key: 'primary', defaultFuncion: 'whatsapp', defaultLabel: 'Escribinos por WhatsApp' }];

// Banda de ancho completo en `ink` (o imagen de fondo con velo oscuro):
// eyebrow + headline + body a la izquierda, botón en acento a la derecha —
// nunca centrado, nunca la única banda de color del sitio fuera del acento.
function SeccionCTA({
  variant = 'centrado',
  titulo,
  onUpdateTitulo,
  subtitulo,
  onUpdateSubtitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  textColor,
  buttonColor,
  accent,
  palette = {},
  botones: botonesData = {},
  onUpdateBotones,
  nombreNegocio,
  seccionesDisponibles = [],
  whatsapp,
  imagenFondo,
  onUpdateImagenFondo,
}) {
  const handleFondo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (await validateImageFile(file, 'galeria')) onUpdateImagenFondo?.(await uploadImage(file));
  };

  const bgStyle =
    variant === 'fondo'
      ? {
          backgroundImage: imagenFondo
            ? `linear-gradient(90deg, rgba(0,0,0,.8) 0%, rgba(0,0,0,.55) 100%), url(${imagenFondo})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          background: !imagenFondo ? bgColor || palette.ink : undefined,
        }
      : { background: bgColor || palette.ink };

  return (
    <section className="relative px-6 @lg:px-10 py-14 @lg:py-16 overflow-hidden" style={bgStyle}>
      {variant === 'fondo' && editable && (
        <label className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 bg-black/40 text-white text-xs font-semibold px-3 py-1.5 cursor-pointer hover:bg-black/60 transition-colors">
          <ImageIcon className="w-3.5 h-3.5" /> Cambiar fondo
          <input type="file" accept="image/*" className="hidden" onChange={handleFondo} />
        </label>
      )}
      <div className="max-w-6xl mx-auto relative z-[1] grid @lg:grid-cols-[1.3fr_auto] gap-8 items-center">
        <div>
          <Editable
            editable={editable}
            value={eyebrow ?? 'Escribinos hoy'}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="cta.eyebrow"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.14em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? '¿Listo para empezar?'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="cta.titulo"
            style={{ color: textColor || '#ffffff' }}
            className="font-serif text-3xl @lg:text-4xl mb-3 text-balance"
            maxLength={80}
          />
          <Editable
            editable={editable}
            value={subtitulo ?? 'Escribinos hoy y arrancamos.'}
            onChange={onUpdateSubtitulo}
            tag="p"
            block
            multiline
            styleKey="cta.subtitulo"
            style={{ color: textColor || 'rgba(255,255,255,0.75)' }}
            className="text-base max-w-md"
            maxLength={160}
          />
        </div>
        <div className="@lg:justify-self-end">
          {CTA_BUTTON_SLOTS.map((slot) => {
            const v = botonesData[slot.key];
            const defaultTarget = slot.defaultFuncion === 'whatsapp' ? whatsapp : undefined;
            if (!buttonSlotVisible(editable, v, slot.defaultFuncion, defaultTarget)) return null;
            return (
              <ButtonObject
                key={slot.key}
                value={v}
                onChange={(patch) =>
                  onUpdateBotones?.({ ...botonesData, [slot.key]: { ...(botonesData[slot.key] || {}), ...patch } })
                }
                editable={editable}
                seccionesDisponibles={seccionesDisponibles}
                nombreNegocio={nombreNegocio}
                defaultFuncion={slot.defaultFuncion}
                defaultLabel={slot.defaultLabel}
                defaultColor={buttonColor || accent}
                defaultTarget={defaultTarget}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Grilla de columnas conectadas por borde (número + rango de fechas, título,
// descripción y una sub-lista de puntos) — a diferencia de "Pasos" (que no
// tiene sub-lista) o "Historia" (que no tiene sub-lista ni rango de fechas),
// pensada para describir las etapas de un ciclo de trabajo con tareas
// concretas en cada una.
function SeccionCicloTrabajo({
  items = [],
  onUpdate,
  onRemove,
  onAdd,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onRemove?.(id);
  const add = () =>
    onAdd?.({ id: `etapa-${Date.now()}`, n: String(items.length + 1).padStart(2, '0'), rango: 'Mes — Mes', titulo: 'Nueva etapa', desc: '', items: ['Tarea'] });

  const updateSubitem = (id, idx, value) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const nextItems = it.items.map((v, i) => (i === idx ? value : v));
    update(id, { items: nextItems });
  };
  const removeSubitem = (id, idx) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    update(id, { items: it.items.filter((_, i) => i !== idx) });
  };
  const addSubitem = (id) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    update(id, { items: [...(it.items || []), 'Tarea'] });
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <Reveal className="mb-9">
          <Editable
            editable={editable}
            value={eyebrow}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="ciclotrabajo.eyebrow"
            placeholder="Eyebrow (opcional)"
            style={{ color: '#3f6b2b' }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Te acompañamos en todo el proceso'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="ciclotrabajo.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl"
            maxLength={80}
          />
        </Reveal>
        <div
          className="grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-4"
          style={{ borderTop: `2px solid ${palette.ink}` }}
        >
          {items.map((it, i) => (
            <Reveal
              key={it.id}
              delay={Math.min(i * 0.08, 0.4)}
              className="relative border-r border-b @lg:border-b-0 px-5 py-6"
              style={{ borderColor: palette.line }}
            >
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label="Quitar"
                  className="absolute top-2 right-2 opacity-40 hover:opacity-100"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex items-baseline justify-between gap-3 mb-4">
                <Editable
                  editable={editable}
                  value={it.n}
                  onChange={(v) => update(it.id, { n: v })}
                  tag="span"
                  placeholder="01"
                  style={{ color: accent }}
                  className="font-serif font-bold text-3xl leading-none"
                  maxLength={4}
                />
                <Editable
                  editable={editable}
                  value={it.rango}
                  onChange={(v) => update(it.id, { rango: v })}
                  tag="span"
                  placeholder="Mes — Mes"
                  style={{ color: palette.inkSoft }}
                  className="font-mono text-[11px] uppercase tracking-wide"
                  maxLength={20}
                />
              </div>
              <Editable
                editable={editable}
                value={it.titulo}
                onChange={(v) => update(it.id, { titulo: v })}
                tag="div"
                block
                placeholder="Título"
                style={{ color: palette.ink }}
                className="font-semibold text-base mb-2"
                maxLength={40}
              />
              <Editable
                editable={editable}
                value={it.desc}
                onChange={(v) => update(it.id, { desc: v })}
                tag="p"
                block
                multiline
                placeholder="Descripción breve"
                style={{ color: palette.inkSoft }}
                className="text-sm leading-relaxed mb-4"
                maxLength={140}
              />
              <div className="flex flex-col gap-1.5">
                {(it.items || []).map((v, idx) => (
                  <div key={idx} className="relative flex items-center gap-1.5">
                    <Editable
                      editable={editable}
                      value={v}
                      onChange={(val) => updateSubitem(it.id, idx, val)}
                      tag="span"
                      block
                      prefix="— "
                      style={{ color: '#3f6b2b' }}
                      className="font-mono text-xs pr-4"
                      maxLength={40}
                    />
                    {editable && (
                      <button
                        type="button"
                        onClick={() => removeSubitem(it.id, idx)}
                        aria-label="Quitar tarea"
                        className="absolute right-0 opacity-40 hover:opacity-100"
                        style={{ color: palette.ink }}
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {editable && (
                  <button
                    type="button"
                    onClick={() => addSubitem(it.id)}
                    className="text-xs font-semibold underline decoration-dotted self-start mt-1"
                    style={{ color: palette.inkSoft }}
                  >
                    + Agregar tarea
                  </button>
                )}
              </div>
            </Reveal>
          ))}
        </div>
        {editable && (
          <button
            type="button"
            onClick={add}
            className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-2.5 border-2 border-dashed"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-3 h-3" /> Agregar etapa
          </button>
        )}
      </div>
    </section>
  );
}

const PASOS_BUTTON_SLOTS = [{ key: 'primary', defaultFuncion: 'whatsapp', defaultLabel: 'Escribinos por WhatsApp' }];

// Banda oscura (mismo estilo que CTA) con una lista de pasos numerados —
// agregar/editar/quitar cada uno — y un botón de acción al final. Pensada
// para explicar en pocos pasos cómo funciona un servicio (ej. "armá tu
// regalo en 3 pasos").
function SeccionPasos({
  pasos = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  textColor,
  accent,
  palette = {},
  botones: botonesData = {},
  onUpdateBotones,
  nombreNegocio,
  whatsapp,
  seccionesDisponibles = [],
  variant = 'numerados',
  descripcion,
  onUpdateDescripcion,
  imagen,
  onUpdateImagen,
  specs = [],
  onUpdateSpecs,
  notaTitulo,
  onUpdateNotaTitulo,
  notaTexto,
  onUpdateNotaTexto,
}) {
  const update = (id, patch) => onUpdate?.(pasos.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id) => onUpdate?.(pasos.filter((p) => p.id !== id));
  const add = () =>
    onUpdate?.([...pasos, { id: `paso-${Date.now()}`, titulo: 'Nuevo paso', desc: 'Describí este paso.' }]);
  const textoSuave = textColor || 'rgba(255,255,255,0.7)';

  // "sticky" — columna izquierda fija (intro + foto) mientras se scrollea la
  // derecha (pasos numerados en fila completa + specs técnicas al final) —
  // para procesos con contexto propio (cómo trabajo, con qué equipo), a
  // diferencia de "numerados"/"timeline" que son pasos solos, sin intro.
  if (variant === 'sticky') {
    const updateSpec = (id, patch) => onUpdateSpecs?.(specs.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const removeSpec = (id) => onUpdateSpecs?.(specs.filter((s) => s.id !== id));
    const addSpec = () => onUpdateSpecs?.([...specs, { id: `spec-${Date.now()}`, label: 'Dato', value: 'Valor' }]);
    const handleImagen = async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file && (await validateImageFile(file, 'galeria'))) onUpdateImagen?.(await uploadImage(file));
    };
    return (
      <section className="px-6 @lg:px-10 py-14 @lg:py-20 border-t" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
        <div className="max-w-5xl mx-auto grid @lg:grid-cols-2 gap-10 @lg:gap-16 items-start">
          <div className="@lg:sticky @lg:top-20">
            <Editable
              editable={editable}
              value={eyebrow ?? 'Cómo trabajo'}
              onChange={onUpdateEyebrow}
              tag="span"
              block
              styleKey="pasos.eyebrow"
              style={{ color: accent }}
              className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
              maxLength={40}
            />
            <Editable
              editable={editable}
              value={titulo ?? 'Cómo trabajo un proyecto'}
              onChange={onUpdateTitulo}
              tag="h2"
              block
              styleKey="pasos.titulo"
              style={{ color: headingColor || palette.ink }}
              className="font-serif text-2xl @lg:text-3xl mb-4 leading-tight"
              maxLength={90}
            />
            <Editable
              editable={editable}
              value={descripcion}
              onChange={onUpdateDescripcion}
              tag="p"
              block
              multiline
              styleKey="pasos.descripcion"
              placeholder="Contá brevemente tu forma de trabajar"
              style={{ color: textColor || palette.inkSoft }}
              className="text-sm leading-relaxed mb-6"
              maxLength={220}
            />
            <label
              className={`relative block aspect-[4/3] bg-black/5 overflow-hidden group/pasoimg ${editable ? 'cursor-pointer' : ''}`}
              title={editable ? 'Cambiar foto' : undefined}
            >
              {imagen ? (
                <img src={imagen} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-center px-4" style={{ color: palette.inkSoft }}>
                  Agregá una foto
                </div>
              )}
              {editable && (
                <>
                  <span className="absolute inset-0 bg-black/0 group-hover/pasoimg:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/pasoimg:opacity-100">
                    <span className="text-white text-xs font-semibold">Cambiar foto</span>
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />
                </>
              )}
            </label>
          </div>
          <div>
            <div className="flex flex-col">
              {pasos.map((p, i) => (
                <div key={p.id} className="relative grid gap-4 py-6 border-b" style={{ gridTemplateColumns: 'auto 1fr', borderColor: palette.line }}>
                  <div
                    className="font-serif font-bold text-4xl leading-none min-w-[2.5rem]"
                    style={{ color: accent, opacity: 0.4 }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        aria-label="Quitar paso"
                        className="float-right opacity-50 hover:opacity-100 transition-opacity"
                        style={{ color: palette.ink }}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                    <Editable
                      editable={editable}
                      value={p.titulo}
                      onChange={(v) => update(p.id, { titulo: v })}
                      tag="p"
                      block
                      styleKey={`paso.${p.id}.titulo`}
                      placeholder="Título del paso"
                      style={{ color: palette.ink }}
                      className="font-semibold text-lg mb-1.5"
                      maxLength={50}
                    />
                    <Editable
                      editable={editable}
                      value={p.desc}
                      onChange={(v) => update(p.id, { desc: v })}
                      tag="p"
                      multiline
                      block
                      styleKey={`paso.${p.id}.desc`}
                      placeholder="Descripción breve"
                      style={{ color: palette.inkSoft }}
                      className="text-sm leading-relaxed"
                      maxLength={160}
                    />
                  </div>
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={add}
                  className="border-2 border-dashed flex items-center justify-center gap-1.5 py-4 mt-4 text-sm font-semibold"
                  style={{ borderColor: palette.line, color: palette.inkSoft }}
                >
                  <PlusIcon className="w-4 h-4" /> Agregar paso
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 @lg:grid-cols-4 gap-5 mt-8">
              {specs.map((s) => (
                <div key={s.id} className="relative border-t pt-3" style={{ borderColor: accent }}>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => removeSpec(s.id)}
                      aria-label={`Quitar ${s.label}`}
                      className="absolute top-0 right-0 opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: palette.ink }}
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  )}
                  <Editable
                    editable={editable}
                    value={s.label}
                    onChange={(v) => updateSpec(s.id, { label: v })}
                    tag="p"
                    block
                    placeholder="Dato"
                    style={{ color: palette.inkSoft }}
                    className="font-mono text-[0.65rem] uppercase tracking-wide mb-1"
                    maxLength={20}
                  />
                  <Editable
                    editable={editable}
                    value={s.value}
                    onChange={(v) => updateSpec(s.id, { value: v })}
                    tag="p"
                    block
                    placeholder="Valor"
                    style={{ color: palette.ink }}
                    className="text-sm font-medium"
                    maxLength={40}
                  />
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={addSpec}
                  className="border-2 border-dashed flex items-center justify-center gap-1.5 py-3 text-xs font-semibold"
                  style={{ borderColor: palette.line, color: palette.inkSoft }}
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Agregar dato
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.ink }}>
      <div className="max-w-5xl mx-auto">
        <Editable
          editable={editable}
          value={eyebrow ?? 'Cómo funciona'}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="pasos.eyebrow"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Así de simple'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="pasos.titulo"
          style={{ color: textColor || '#ffffff' }}
          className="font-serif text-3xl @lg:text-4xl mb-10 max-w-lg text-balance"
          maxLength={90}
        />
        {variant === 'timeline' ? (
          <div className="flex flex-col max-w-lg mb-10">
            {pasos.map((p, i) => (
              <div key={p.id} className="relative grid gap-4" style={{ gridTemplateColumns: 'auto 1fr' }}>
                <div className="flex flex-col items-center">
                  <div
                    className="w-9 h-9 shrink-0 rounded-full border flex items-center justify-center font-mono font-bold text-sm"
                    style={{ borderColor: accent, color: accent }}
                  >
                    {i + 1}
                  </div>
                  {i < pasos.length - 1 && (
                    <div className="w-px flex-1 min-h-10" style={{ background: 'rgba(255,255,255,0.15)' }} />
                  )}
                </div>
                <div className="pb-8">
                  {editable && (
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      aria-label="Quitar paso"
                      className="float-right opacity-50 hover:opacity-100 transition-opacity"
                      style={{ color: textColor || '#ffffff' }}
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                  <Editable
                    editable={editable}
                    value={p.titulo}
                    onChange={(v) => update(p.id, { titulo: v })}
                    tag="p"
                    block
                    styleKey={`paso.${p.id}.titulo`}
                    placeholder="Título del paso"
                    style={{ color: textColor || '#ffffff' }}
                    className="font-serif italic text-lg mb-1"
                    maxLength={50}
                  />
                  <Editable
                    editable={editable}
                    value={p.desc}
                    onChange={(v) => update(p.id, { desc: v })}
                    tag="p"
                    multiline
                    block
                    styleKey={`paso.${p.id}.desc`}
                    placeholder="Descripción breve"
                    style={{ color: textoSuave }}
                    className="text-sm leading-relaxed"
                    maxLength={140}
                  />
                </div>
              </div>
            ))}
            {editable && (
              <button
                type="button"
                onClick={add}
                className="border-2 border-dashed flex items-center justify-center gap-1.5 py-4 text-sm font-semibold"
                style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.6)' }}
              >
                <PlusIcon className="w-4 h-4" /> Agregar paso
              </button>
            )}
          </div>
        ) : (
        <div className={`grid ${pasos.length >= 4 ? '@lg:grid-cols-4' : '@lg:grid-cols-3'} gap-8 @lg:gap-6 mb-10`}>
          {pasos.map((p, i) => (
            <div key={p.id} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 shrink-0 border flex items-center justify-center font-mono font-bold text-sm"
                  style={{ borderColor: accent, color: accent }}
                >
                  {i + 1}
                </div>
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
                {editable && (
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    aria-label="Quitar paso"
                    className="opacity-50 hover:opacity-100 transition-opacity shrink-0"
                    style={{ color: textColor || '#ffffff' }}
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Editable
                editable={editable}
                value={p.titulo}
                onChange={(v) => update(p.id, { titulo: v })}
                tag="p"
                block
                styleKey={`paso.${p.id}.titulo`}
                placeholder="Título del paso"
                style={{ color: textColor || '#ffffff' }}
                className="font-serif italic text-lg mb-1.5"
                maxLength={50}
              />
              <Editable
                editable={editable}
                value={p.desc}
                onChange={(v) => update(p.id, { desc: v })}
                tag="p"
                multiline
                block
                styleKey={`paso.${p.id}.desc`}
                placeholder="Descripción breve"
                style={{ color: textoSuave }}
                className="text-sm leading-relaxed"
                maxLength={140}
              />
            </div>
          ))}
          {editable && (
            <button
              type="button"
              onClick={add}
              className="border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-6 text-sm font-semibold"
              style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.6)' }}
            >
              <PlusIcon className="w-4 h-4" /> Agregar paso
            </button>
          )}
        </div>
        )}
        {(notaTitulo || notaTexto || editable) && variant !== 'sticky' ? (
          <div
            className="border p-5 @lg:p-6 flex flex-wrap gap-5 items-center justify-between mb-2"
            style={{ borderColor: accent, background: palette.accentSoft || 'rgba(0,0,0,0.03)' }}
          >
            <div className="flex-1 min-w-[200px]">
              <Editable
                editable={editable}
                value={notaTitulo}
                onChange={onUpdateNotaTitulo}
                tag="p"
                block
                placeholder="Ej: SEÑA DE RESERVA: $25.000 (opcional)"
                style={{ color: accent }}
                className="font-mono font-bold text-sm uppercase tracking-wide mb-1.5"
                maxLength={60}
              />
              <Editable
                editable={editable}
                value={notaTexto}
                onChange={onUpdateNotaTexto}
                tag="p"
                block
                multiline
                placeholder="Aclaración corta (opcional)"
                style={{ color: textoSuave }}
                className="text-sm leading-relaxed"
                maxLength={200}
              />
            </div>
            {PASOS_BUTTON_SLOTS.map((slot) => {
              const v = botonesData[slot.key];
              const defaultTarget = slot.defaultFuncion === 'whatsapp' ? whatsapp : undefined;
              if (!buttonSlotVisible(editable, v, slot.defaultFuncion, defaultTarget)) return null;
              return (
                <ButtonObject
                  key={slot.key}
                  value={v}
                  onChange={(patch) =>
                    onUpdateBotones?.({ ...botonesData, [slot.key]: { ...(botonesData[slot.key] || {}), ...patch } })
                  }
                  editable={editable}
                  seccionesDisponibles={seccionesDisponibles}
                  nombreNegocio={nombreNegocio}
                  defaultFuncion={slot.defaultFuncion}
                  defaultLabel={slot.defaultLabel}
                  defaultColor={accent}
                  defaultTarget={defaultTarget}
                />
              );
            })}
          </div>
        ) : (
          PASOS_BUTTON_SLOTS.map((slot) => {
            const v = botonesData[slot.key];
            const defaultTarget = slot.defaultFuncion === 'whatsapp' ? whatsapp : undefined;
            if (!buttonSlotVisible(editable, v, slot.defaultFuncion, defaultTarget)) return null;
            return (
              <ButtonObject
                key={slot.key}
                value={v}
                onChange={(patch) =>
                  onUpdateBotones?.({ ...botonesData, [slot.key]: { ...(botonesData[slot.key] || {}), ...patch } })
                }
                editable={editable}
                seccionesDisponibles={seccionesDisponibles}
                nombreNegocio={nombreNegocio}
                defaultFuncion={slot.defaultFuncion}
                defaultLabel={slot.defaultLabel}
                defaultColor={accent}
                defaultTarget={defaultTarget}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

const RESERVAS_DIAS_SEMANA = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const RESERVAS_HORAS_MANANA = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const RESERVAS_HORAS_TARDE = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

// Calendario + horarios + lista de servicios reservables, para negocios que
// atienden con turno (peluquerías, consultorios, estudios). No hay backend
// de reservas real: elegir día/hora sólo resalta la selección en pantalla,
// como el mapa "simulado" — el calendario sí usa el mes real del visitante.
function SeccionReservas({
  servicios = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  textColor,
  accent,
  palette = {},
  itemsLabel = 'Tu turno · Servicios',
  itemPlaceholder = 'Nombre del servicio',
  addLabel = 'Agregar servicio',
  confirmLabel = 'Confirmar turno →',
}) {
  const update = (id, patch) => onUpdate?.(servicios.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id) => onUpdate?.(servicios.filter((s) => s.id !== id));
  const add = () => onUpdate?.([...servicios, { id: `resv-${Date.now()}`, nombre: 'Nuevo servicio' }]);

  const [viewDate, setViewDate] = useState(() => new Date());
  const [pickedDay, setPickedDay] = useState(() => new Date().getDate());
  const [pickedTime, setPickedTime] = useState(null);
  const textoSuave = textColor || 'rgba(255,255,255,0.65)';
  const lineColor = 'rgba(255,255,255,0.15)';

  const today = new Date();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const cells = Array.from({ length: firstWeekday }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const changeMonth = (delta) => {
    setViewDate(new Date(year, month + delta, 1));
    setPickedDay(null);
  };

  const fechaLabel = pickedDay ? `${pickedDay} de ${monthLabelCap.split(' ')[0]}` : '—';

  return (
    <section className="relative px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.ink }}>
      <div className="max-w-5xl mx-auto">
        <Editable
          editable={editable}
          value={eyebrow ?? 'Reserva online'}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="reservas.eyebrow"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Sacá tu turno en un minuto'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="reservas.titulo"
          style={{ color: textColor || '#ffffff' }}
          className="font-serif text-3xl @lg:text-4xl mb-10 max-w-lg text-balance"
          maxLength={90}
        />
        <div className="grid @lg:grid-cols-[1.3fr_1fr] gap-8 @lg:gap-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide mb-3" style={{ color: textoSuave }}>
              Elegí el día
            </p>
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Mes anterior"
                className="w-7 h-7 flex items-center justify-center border rounded-full shrink-0"
                style={{ borderColor: lineColor, color: textColor || '#fff' }}
              >
                <ChevronLeftIcon className="w-3.5 h-3.5" />
              </button>
              <p className="font-serif italic text-sm" style={{ color: textColor || '#fff' }}>
                {monthLabelCap}
              </p>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Mes siguiente"
                className="w-7 h-7 flex items-center justify-center border rounded-full shrink-0"
                style={{ borderColor: lineColor, color: textColor || '#fff' }}
              >
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {RESERVAS_DIAS_SEMANA.map((d, i) => (
                <span key={i} className="font-mono text-[10px]" style={{ color: textoSuave }}>
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                const isToday = isCurrentMonth && d === today.getDate();
                const isPicked = d != null && d === pickedDay;
                return (
                  <button
                    type="button"
                    key={i}
                    disabled={d == null}
                    onClick={() => setPickedDay(d)}
                    className="aspect-square flex items-center justify-center text-xs font-mono rounded-sm transition-colors"
                    style={{
                      background: isPicked ? accent : 'transparent',
                      color: isPicked ? '#171717' : d == null ? 'transparent' : isToday ? accent : textColor || '#fff',
                    }}
                  >
                    {d ?? ''}
                  </button>
                );
              })}
            </div>
            <p className="font-mono text-xs uppercase tracking-wide mt-7 mb-3" style={{ color: textoSuave }}>
              Elegí el horario
            </p>
            <p className="text-[11px] mb-1.5" style={{ color: textoSuave }}>
              Mañana
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {RESERVAS_HORAS_MANANA.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPickedTime(h)}
                  className="text-xs font-mono px-2.5 py-1.5 border rounded-sm"
                  style={{
                    borderColor: pickedTime === h ? accent : lineColor,
                    background: pickedTime === h ? accent : 'transparent',
                    color: pickedTime === h ? '#171717' : textColor || '#fff',
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
            <p className="text-[11px] mb-1.5" style={{ color: textoSuave }}>
              Tarde
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RESERVAS_HORAS_TARDE.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPickedTime(h)}
                  className="text-xs font-mono px-2.5 py-1.5 border rounded-sm"
                  style={{
                    borderColor: pickedTime === h ? accent : lineColor,
                    background: pickedTime === h ? accent : 'transparent',
                    color: pickedTime === h ? '#171717' : textColor || '#fff',
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div className="border p-5 h-fit" style={{ borderColor: lineColor }}>
            <p className="font-mono text-[10px] uppercase tracking-wide mb-3" style={{ color: textoSuave }}>
              {itemsLabel}
            </p>
            <div className="flex flex-col gap-2 mb-5">
              {servicios.map((s) => (
                <div key={s.id} className="relative flex items-center border px-3 py-2" style={{ borderColor: lineColor }}>
                  <Editable
                    editable={editable}
                    value={s.nombre}
                    onChange={(v) => update(s.id, { nombre: v })}
                    tag="span"
                    block
                    styleKey={`reserva.${s.id}.nombre`}
                    placeholder={itemPlaceholder}
                    style={{ color: textColor || '#fff' }}
                    className="text-sm flex-1"
                    maxLength={60}
                  />
                  {editable && (
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      aria-label="Quitar servicio"
                      className="opacity-50 hover:opacity-100 transition-opacity ml-2 shrink-0"
                      style={{ color: textColor || '#fff' }}
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={add}
                  className="border-2 border-dashed flex items-center justify-center gap-1.5 py-2 text-xs font-semibold"
                  style={{ borderColor: 'rgba(255,255,255,0.25)', color: textoSuave }}
                >
                  <PlusIcon className="w-3.5 h-3.5" /> {addLabel}
                </button>
              )}
              {!editable && servicios.length === 0 && (
                <p className="text-xs" style={{ color: textoSuave }}>
                  Todavía no cargaste servicios.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between text-sm mb-2 pt-3 border-t" style={{ borderColor: lineColor }}>
              <span style={{ color: textoSuave }}>Fecha</span>
              <span className="font-mono" style={{ color: textColor || '#fff' }}>
                {fechaLabel}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-4">
              <span style={{ color: textoSuave }}>Horario</span>
              <span className="font-mono" style={{ color: textColor || '#fff' }}>
                {pickedTime || '—'}
              </span>
            </div>
            <button
              type="button"
              className="w-full py-2.5 text-sm font-semibold text-center"
              style={{ background: accent, color: '#171717' }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Lista numerada de áreas/especialidades a la izquierda (clickeable) + panel
// de detalle a la derecha con frase resumen, descripción y tags — pensada
// para estudios jurídicos, consultoras o clínicas con varias especialidades.
function SeccionAreas({
  areas = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(areas.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const remove = (id) => onUpdate?.(areas.filter((a) => a.id !== id));
  const add = () =>
    onUpdate?.([...areas, { id: `area-${Date.now()}`, nombre: 'Nueva área', resumen: '', desc: '', tags: [] }]);

  const [selected, setSelected] = useState(0);
  const currentIndex = Math.min(selected, Math.max(areas.length - 1, 0));
  const current = areas[currentIndex];
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (!tagInput.trim() || !current) return;
    update(current.id, { tags: [...(current.tags || []), tagInput.trim()] });
    setTagInput('');
  };
  const removeTag = (i) => {
    if (!current) return;
    update(current.id, { tags: (current.tags || []).filter((_, idx) => idx !== i) });
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <div className="pb-6 mb-10 border-b" style={{ borderColor: palette.line }}>
          <Editable
            editable={editable}
            value={eyebrow ?? 'Áreas de práctica'}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="areas.eyebrow"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'En qué te podemos ayudar'}
            onChange={onUpdateTitulo}
            tag="h2"
            styleKey="areas.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif italic text-2xl @lg:text-3xl"
            maxLength={70}
          />
        </div>
        {areas.length === 0 && !editable ? (
          <p className="text-center text-sm max-w-sm mx-auto" style={{ color: palette.inkSoft }}>
            Todavía no cargaste áreas.
          </p>
        ) : (
          <div className="grid @lg:grid-cols-[0.75fr_1.25fr] gap-8 @lg:gap-10">
            <div>
              {areas.map((a, i) => (
                <div
                  key={a.id}
                  className="relative border-b py-4 first:pt-0"
                  style={{ borderColor: palette.line }}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    className="w-full flex items-baseline gap-3 text-left"
                  >
                    <span
                      className="font-mono text-xs shrink-0"
                      style={{ color: i === currentIndex ? accent : palette.inkSoft }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Editable
                      editable={editable}
                      value={a.nombre}
                      onChange={(v) => update(a.id, { nombre: v })}
                      tag="span"
                      styleKey={`area.${a.id}.nombre`}
                      placeholder="Nombre del área"
                      style={{ color: i === currentIndex ? headingColor || palette.ink : palette.inkSoft }}
                      className="font-serif italic text-lg flex-1"
                      maxLength={50}
                    />
                  </button>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => remove(a.id)}
                      aria-label={`Quitar ${a.nombre}`}
                      className="absolute top-4 right-0 opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: palette.ink }}
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={add}
                  className="mt-4 border-2 border-dashed w-full flex items-center justify-center gap-1.5 py-3 text-sm font-semibold"
                  style={{ borderColor: palette.line, color: palette.inkSoft }}
                >
                  <PlusIcon className="w-4 h-4" /> Agregar área
                </button>
              )}
            </div>
            {current && (
              <div className="border p-6 @lg:p-8" style={{ borderColor: palette.line }}>
                <p className="font-mono text-xs uppercase tracking-wide mb-4" style={{ color: accent }}>
                  {String(currentIndex + 1).padStart(2, '0')} · {current.nombre}
                </p>
                <Editable
                  editable={editable}
                  value={current.resumen}
                  onChange={(v) => update(current.id, { resumen: v })}
                  tag="p"
                  block
                  multiline
                  styleKey={`area.${current.id}.resumen`}
                  placeholder="Frase resumen de esta área"
                  style={{ color: headingColor || palette.ink }}
                  className="font-serif italic text-xl @lg:text-2xl leading-snug mb-4 text-balance"
                  maxLength={140}
                />
                <Editable
                  editable={editable}
                  value={current.desc}
                  onChange={(v) => update(current.id, { desc: v })}
                  tag="p"
                  block
                  multiline
                  styleKey={`area.${current.id}.desc`}
                  placeholder="Descripción de esta área"
                  style={{ color: palette.inkSoft }}
                  className="text-sm leading-relaxed mb-5"
                  maxLength={220}
                />
                <div className="flex flex-wrap gap-2">
                  {(current.tags || []).map((t, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 font-mono border text-xs px-2.5 py-1"
                      style={{ borderColor: palette.line, color: palette.inkSoft }}
                    >
                      {t}
                      {editable && (
                        <button type="button" onClick={() => removeTag(i)} aria-label={`Quitar ${t}`}>
                          <XIcon className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {editable && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        addTag();
                      }}
                      className="inline-flex items-center gap-1"
                    >
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Agregar tag"
                        className="font-mono text-xs border px-2 py-1 outline-none w-24"
                        style={{ borderColor: palette.line }}
                      />
                      <button
                        type="submit"
                        className="border px-2 py-1"
                        style={{ borderColor: palette.line, color: palette.inkSoft }}
                      >
                        <PlusIcon className="w-3 h-3" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// Fila compacta de medios de pago aceptados (transferencia, efectivo,
// tarjetas, etc.) — una lista chica de badges, pensada para comercios que
// venden por WhatsApp/redes y quieren dejar claro cómo se puede pagar.
function SeccionPagos({
  metodos = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  editable,
  bgColor,
  headingColor,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(metodos.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const remove = (id) => onUpdate?.(metodos.filter((m) => m.id !== id));
  const add = () => onUpdate?.([...metodos, { id: `pago-${Date.now()}`, label: 'Nuevo medio de pago' }]);

  return (
    <section className="px-6 @lg:px-10 py-8 @lg:py-10" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-4">
        <Editable
          editable={editable}
          value={titulo ?? 'Formas de pago'}
          onChange={onUpdateTitulo}
          tag="span"
          styleKey="pagos.titulo"
          style={{ color: headingColor || palette.inkSoft }}
          className="font-mono text-xs uppercase tracking-wide shrink-0"
          maxLength={40}
        />
        <div className="flex flex-wrap gap-2">
          {metodos.map((m) => (
            <div
              key={m.id}
              className="relative inline-flex items-center gap-1.5 border rounded-sm px-3 py-1.5"
              style={{ borderColor: palette.line }}
            >
              <Editable
                editable={editable}
                value={m.label}
                onChange={(v) => update(m.id, { label: v })}
                tag="span"
                styleKey={`pago.${m.id}.label`}
                placeholder="Medio de pago"
                style={{ color: palette.ink }}
                className="text-xs font-semibold"
                maxLength={30}
              />
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  aria-label={`Quitar ${m.label}`}
                  className="opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {editable && (
            <button
              type="button"
              onClick={add}
              className="inline-flex items-center gap-1.5 border-2 border-dashed rounded-sm px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-3.5 h-3.5" /> Agregar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

const FINANCIACION_BUTTON_SLOTS = [{ key: 'primary', defaultFuncion: 'whatsapp', defaultLabel: 'Coordinar financiación →' }];
const FINANCIACION_PRECIOS_DEFAULT = [15000000, 20000000, 25000000, 30000000];
const FINANCIACION_PLANES_DEFAULT = [
  { meses: 12, factor: 1.05 },
  { meses: 24, factor: 1.18 },
  { meses: 36, factor: 1.32 },
];

// Simulador de cuotas: elegís un precio aproximado y ves, al toque, la cuota
// estimada en cada plazo (precio × tasa ÷ meses) — para negocios que venden
// bienes de alto valor con financiación propia (concesionarias, muebles,
// electrodomésticos). Es una estimación real en pantalla, no un dato fijo:
// cambiar el precio recalcula las tres cuotas al instante.
function SeccionFinanciacion({
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  desc,
  onUpdateDesc,
  editable,
  bgColor,
  textColor,
  accent,
  palette = {},
  precios = FINANCIACION_PRECIOS_DEFAULT,
  planes = FINANCIACION_PLANES_DEFAULT,
  botones: botonesData = {},
  onUpdateBotones,
  nombreNegocio,
  whatsapp,
  seccionesDisponibles = [],
}) {
  const [selectedPrice, setSelectedPrice] = useState(precios[1] ?? precios[0]);
  const textoSuave = textColor || 'rgba(255,255,255,0.7)';
  const lineColor = 'rgba(255,255,255,0.12)';

  const planResults = planes.map(({ meses, factor }) => ({
    meses,
    factor,
    monthly: Math.round((selectedPrice * factor) / meses),
  }));

  return (
    <section className="relative px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.ink }}>
      <div className="max-w-5xl mx-auto">
        <Editable
          editable={editable}
          value={eyebrow ?? 'Financiación propia'}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="financiacion.eyebrow"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Simulá tu cuota'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="financiacion.titulo"
          style={{ color: textColor || '#ffffff' }}
          className="font-serif text-3xl @lg:text-4xl mb-5 max-w-lg text-balance"
          maxLength={90}
        />
        <div className="grid @lg:grid-cols-[1.2fr_1fr] gap-8 @lg:gap-12">
          <div>
            <Editable
              editable={editable}
              value={desc}
              onChange={onUpdateDesc}
              tag="p"
              block
              multiline
              styleKey="financiacion.desc"
              placeholder="Descripción del simulador"
              style={{ color: textoSuave }}
              className="text-sm leading-relaxed max-w-md mb-8"
              maxLength={220}
            />
            <p className="font-mono text-xs uppercase tracking-wide mb-3" style={{ color: textoSuave }}>
              Precio del vehículo
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {precios.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPrice(p)}
                  className="text-sm font-semibold px-4 py-2 border"
                  style={{
                    borderColor: selectedPrice === p ? accent : lineColor,
                    background: selectedPrice === p ? accent : 'transparent',
                    color: selectedPrice === p ? '#171717' : textColor || '#fff',
                  }}
                >
                  ${(p / 1000000).toFixed(0)}M
                </button>
              ))}
            </div>
            {FINANCIACION_BUTTON_SLOTS.map((slot) => {
              const v = botonesData[slot.key];
              const defaultTarget = slot.defaultFuncion === 'whatsapp' ? whatsapp : undefined;
              if (!buttonSlotVisible(editable, v, slot.defaultFuncion, defaultTarget)) return null;
              return (
                <ButtonObject
                  key={slot.key}
                  value={v}
                  onChange={(patch) =>
                    onUpdateBotones?.({ ...botonesData, [slot.key]: { ...(botonesData[slot.key] || {}), ...patch } })
                  }
                  editable={editable}
                  seccionesDisponibles={seccionesDisponibles}
                  nombreNegocio={nombreNegocio}
                  defaultFuncion={slot.defaultFuncion}
                  defaultLabel={slot.defaultLabel}
                  defaultColor={accent}
                  defaultTarget={defaultTarget}
                />
              );
            })}
          </div>
          <div>
            {planResults.map((r) => (
              <div key={r.meses} className="flex items-center justify-between py-4 border-b" style={{ borderColor: lineColor }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: textColor || '#fff' }}>
                    {r.meses} cuotas
                  </p>
                  <p className="text-xs" style={{ color: textoSuave }}>
                    Tasa estimada {r.factor.toFixed(2)}x
                  </p>
                </div>
                <p className="font-mono font-bold text-lg" style={{ color: accent }}>
                  ${r.monthly.toLocaleString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const BENEFICIOS_ICONOS = {
  shield: ShieldCheckIcon,
  check: CheckCircleIcon,
  card: CardIcon,
  bolt: BoltIcon,
  clipboard: ClipboardIcon,
  lightbulb: LightbulbIcon,
  'urgent-bolt': UrgentBoltIcon,
};

const BENEFICIOS_ICON_LIBRARY = [
  { id: 'shield', label: 'Garantía' },
  { id: 'check', label: 'Check' },
  { id: 'card', label: 'Pago' },
  { id: 'bolt', label: 'Rapidez' },
  { id: 'clipboard', label: 'Presupuesto' },
  { id: 'lightbulb', label: 'Idea' },
  { id: 'urgent-bolt', label: 'Urgencias' },
];

// Fila de puntos clave con ícono + título + descripción (garantías, tiempos
// de entrega, medios de pago) — para reforzar confianza a mitad de página,
// separados por finas líneas verticales.
function SeccionBeneficios({
  variant = 'fila',
  items = [],
  onUpdate,
  editable,
  bgColor,
  headingColor,
  palette = {},
  accent,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
}) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onUpdate?.(items.filter((it) => it.id !== id));
  const add = () =>
    onUpdate?.([...items, { id: `beneficio-${Date.now()}`, icon: 'check', titulo: 'Nuevo beneficio', desc: '' }]);

  // Este bloque nació sin título propio (fila de confianza a media página) —
  // solo mostramos eyebrow/título si la plantilla los definió a mano, para
  // no hacerle aparecer un encabezado a las secciones que ya viven sin uno.
  const showHeading = editable || titulo || eyebrow;

  const heading = showHeading && (
    <div className="max-w-5xl mx-auto mb-8">
      <Editable
        editable={editable}
        value={eyebrow}
        onChange={onUpdateEyebrow}
        tag="span"
        block
        styleKey="beneficios.eyebrow"
        placeholder="Eyebrow (opcional)"
        style={{ color: accent }}
        className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
        maxLength={40}
      />
      <Editable
        editable={editable}
        value={titulo}
        onChange={onUpdateTitulo}
        tag="h2"
        block
        styleKey="beneficios.titulo"
        placeholder="Título (opcional)"
        style={{ color: headingColor || palette.ink }}
        className="font-serif text-2xl @lg:text-3xl"
        maxLength={70}
      />
    </div>
  );

  const iconSlot = (it) =>
    editable ? (
      <IconSlot
        editable
        value={it.icon}
        onChange={(id) => update(it.id, { icon: id })}
        library={BENEFICIOS_ICON_LIBRARY}
        components={BENEFICIOS_ICONOS}
        size="w-8 h-8"
        iconSize="w-5 h-5"
      />
    ) : (
      (() => {
        const Icon = BENEFICIOS_ICONOS[it.icon] || CheckCircleIcon;
        return <Icon className="w-8 h-8" style={{ color: accent }} />;
      })()
    );

  // "grid" — tarjetas con borde en 2/4 columnas, para cuando esta sección
  // hace de listado de servicios propiamente dicho (no una fila angosta de
  // confianza a media página). Mismo contenido, más presencia visual.
  if (variant === 'grid') {
    return (
      <section className="px-6 @lg:px-10 py-10 @lg:py-14" style={{ background: bgColor || palette.bg }}>
        {heading}
        <div className="max-w-5xl mx-auto grid grid-cols-2 @lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <div key={it.id} className="relative border p-5 flex flex-col gap-2" style={{ borderColor: palette.line }}>
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  aria-label={`Quitar ${it.titulo}`}
                  className="absolute top-2 right-2 opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="mb-1">{iconSlot(it)}</div>
              <Editable
                editable={editable}
                value={it.titulo}
                onChange={(v) => update(it.id, { titulo: v })}
                tag="p"
                block
                styleKey={`beneficio.${it.id}.titulo`}
                placeholder="Título"
                style={{ color: palette.ink }}
                className="font-semibold text-sm"
                maxLength={50}
              />
              <Editable
                editable={editable}
                value={it.desc}
                onChange={(v) => update(it.id, { desc: v })}
                tag="p"
                block
                multiline
                styleKey={`beneficio.${it.id}.desc`}
                placeholder="Descripción breve"
                style={{ color: palette.inkSoft }}
                className="text-xs leading-relaxed"
                maxLength={140}
              />
            </div>
          ))}
          {editable && (
            <button
              type="button"
              onClick={add}
              className="border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-4 text-sm font-semibold"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-4 h-4" /> Agregar
            </button>
          )}
        </div>
      </section>
    );
  }

  // "fila" (default): puntos clave separados por líneas verticales, pensada
  // como franja angosta de confianza a media página.
  return (
    <section className="px-6 @lg:px-10 py-10 @lg:py-14" style={{ background: bgColor || palette.bg }}>
      {heading}
      <div className="max-w-5xl mx-auto flex flex-wrap @lg:flex-nowrap gap-8">
        {items.map((it, i) => (
          <div
            key={it.id}
            className="relative flex-1 min-w-[160px] @lg:pl-8"
            style={i > 0 ? { borderLeft: `1px solid ${palette.line}` } : undefined}
          >
            {editable && (
              <button
                type="button"
                onClick={() => remove(it.id)}
                aria-label={`Quitar ${it.titulo}`}
                className="absolute top-0 right-0 opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: palette.ink }}
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
            <div className="mb-3">{iconSlot(it)}</div>
            <Editable
              editable={editable}
              value={it.titulo}
              onChange={(v) => update(it.id, { titulo: v })}
              tag="p"
              block
              styleKey={`beneficio.${it.id}.titulo`}
              placeholder="Título"
              style={{ color: palette.ink }}
              className="font-semibold text-sm mb-1"
              maxLength={50}
            />
            <Editable
              editable={editable}
              value={it.desc}
              onChange={(v) => update(it.id, { desc: v })}
              tag="p"
              block
              multiline
              styleKey={`beneficio.${it.id}.desc`}
              placeholder="Descripción breve"
              style={{ color: palette.inkSoft }}
              className="text-xs leading-relaxed"
              maxLength={140}
            />
          </div>
        ))}
        {editable && (
          <button
            type="button"
            onClick={add}
            className="flex-1 min-w-[160px] border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-4 text-sm font-semibold"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-4 h-4" /> Agregar
          </button>
        )}
      </div>
    </section>
  );
}

// Números grandes (años, clientes, unidades) que suman desde 0 hasta el
// valor real quedándose ahí — solo anima en la vista final (no en el editor,
// para no competir con la edición del número mientras se escribe).
function SeccionEstadisticas({ items = [], onUpdate, editable, bgColor, textColor, accent, palette = {} }) {
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onUpdate?.(items.filter((it) => it.id !== id));
  const add = () => onUpdate?.([...items, { id: `stat-${Date.now()}`, label: 'Nueva estadística', target: 100 }]);

  const [progress, setProgress] = useState(editable ? 1 : 0);

  useEffect(() => {
    if (editable) {
      setProgress(1);
      return undefined;
    }
    setProgress(0);
    let raf;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / 1400);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [editable, items.length]);

  const formatNumero = (target, p) => {
    const value = Math.round((Number(target) || 0) * p);
    return value.toLocaleString('es-AR') + (Number(target) >= 1000 ? '+' : '');
  };

  return (
    <section className="px-6 @lg:px-10 py-12 @lg:py-16" style={{ background: bgColor || palette.ink }}>
      <div className="max-w-5xl mx-auto flex flex-wrap justify-around gap-8 text-center">
        {items.map((it) => (
          <div key={it.id} className="relative flex flex-col items-center gap-1 min-w-[120px]">
            {editable && (
              <button
                type="button"
                onClick={() => remove(it.id)}
                aria-label={`Quitar ${it.label}`}
                className="absolute -top-2 -right-2 opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: textColor || '#ffffff' }}
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
            {editable ? (
              <Editable
                editable
                value={it.target}
                onChange={(v) => update(it.id, { target: Number(v) || 0 })}
                tag="span"
                type="number"
                styleKey={`estadistica.${it.id}.target`}
                format={(v) => formatNumero(v, 1)}
                style={{ color: accent }}
                className="font-serif text-3xl @lg:text-4xl font-bold"
              />
            ) : (
              <p className="font-serif text-3xl @lg:text-4xl font-bold" style={{ color: accent }}>
                {formatNumero(it.target, progress)}
              </p>
            )}
            <Editable
              editable={editable}
              value={it.label}
              onChange={(v) => update(it.id, { label: v })}
              tag="p"
              styleKey={`estadistica.${it.id}.label`}
              placeholder="Etiqueta"
              style={{ color: textColor || 'rgba(255,255,255,0.7)' }}
              className="font-mono text-[11px] uppercase tracking-wide"
              maxLength={40}
            />
          </div>
        ))}
        {editable && (
          <button
            type="button"
            onClick={add}
            className="border-2 border-dashed flex items-center justify-center gap-1.5 px-6 py-4 text-sm font-semibold"
            style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.6)' }}
          >
            <PlusIcon className="w-4 h-4" /> Agregar
          </button>
        )}
      </div>
    </section>
  );
}

const VIDRIERA_BUTTON_SLOTS = [{ key: 'primary', defaultFuncion: 'whatsapp', defaultLabel: 'Encargar por WhatsApp →' }];

// Una sola foto grande que va rotando sola entre varios productos destacados
// (nombre + precio superpuestos), con puntitos para elegir manualmente en el
// editor — mismo patrón de auto-rotado que HeroOfertasPanel, pero como
// sección propia (con su título arriba y un botón de acción abajo) en vez de
// ir dentro del Hero.
function SeccionVidriera({
  items = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
  botones: botonesData = {},
  onUpdateBotones,
  nombreNegocio,
  whatsapp,
  seccionesDisponibles = [],
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [editIndex, setEditIndex] = useState(0);

  useEffect(() => {
    if (editable || items.length <= 1) return undefined;
    const t = setInterval(() => setActiveIndex((i) => (i + 1) % items.length), 3200);
    return () => clearInterval(t);
  }, [editable, items.length]);

  useEffect(() => {
    setEditIndex((i) => Math.min(i, Math.max(0, items.length - 1)));
  }, [items.length]);

  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onUpdate?.(items.filter((it) => it.id !== id));
  const addWithFile = async (file) => {
    if (!(await validateImageFile(file, 'galeria'))) return;
    const imagen = await uploadImage(file);
    onUpdate?.([...items, { id: `vidriera-${Date.now()}`, nombre: 'Producto', precio: 'Desde $0', imagen }]);
    setEditIndex(items.length);
  };
  const replaceImagen = async (id, file) => {
    if (!(await validateImageFile(file, 'galeria'))) return;
    update(id, { imagen: await uploadImage(file) });
  };

  const current = items[Math.min(editIndex, Math.max(0, items.length - 1))];

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-2xl mx-auto text-center mb-10">
        <Editable
          editable={editable}
          value={eyebrow ?? 'Tortas por encargo'}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="vidriera.eyebrow"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Una torta para cada ocasión'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="vidriera.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif italic text-2xl @lg:text-3xl"
          maxLength={70}
        />
      </div>
      <div className="max-w-xl mx-auto">
        {!editable ? (
          items.length > 0 && (
            <div className="relative aspect-[4/3] overflow-hidden">
              {items.map((it, i) => (
                <div
                  key={it.id}
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: i === activeIndex ? 1 : 0 }}
                >
                  {it.imagen && (
                    <img
                      src={it.imagen}
                      alt={it.nombre || ''}
                      className="w-full h-full object-cover"
                      style={{ filter: 'grayscale(0.1) contrast(1.05)' }}
                    />
                  )}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%)' }}
                  />
                  <div className="absolute left-4 bottom-4 text-white">
                    {it.nombre && <p className="font-serif italic text-lg">{it.nombre}</p>}
                    {it.precio && <p className="text-sm opacity-90">{it.precio}</p>}
                  </div>
                </div>
              ))}
              {items.length > 1 && (
                <div className="absolute bottom-3 right-4 flex gap-1.5">
                  {items.map((_, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: i === activeIndex ? accent : 'rgba(255,255,255,0.6)' }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          <div>
            <div className="relative aspect-[4/3] overflow-hidden mb-3" style={{ background: 'rgba(0,0,0,0.05)' }}>
              {current ? (
                <>
                  {current.imagen ? (
                    <img src={current.imagen} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: palette.inkSoft }}>
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)' }}
                  />
                  <label className="absolute inset-0 cursor-pointer" title="Cambiar foto">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) replaceImagen(current.id, file);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(current.id)}
                    aria-label="Quitar foto"
                    className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/50 text-white flex items-center justify-center hover:bg-red-500/80 transition-colors"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute left-3 bottom-3 right-3 flex flex-col gap-1 z-10">
                    <Editable
                      editable
                      value={current.nombre}
                      onChange={(v) => update(current.id, { nombre: v })}
                      tag="span"
                      styleKey={`vidriera.${current.id}.nombre`}
                      placeholder="Nombre del producto"
                      style={{ color: '#ffffff' }}
                      className="font-serif italic text-lg"
                      maxLength={50}
                    />
                    <Editable
                      editable
                      value={current.precio}
                      onChange={(v) => update(current.id, { precio: v })}
                      tag="span"
                      styleKey={`vidriera.${current.id}.precio`}
                      placeholder="Precio (ej: Desde $30.000)"
                      style={{ color: '#ffffff' }}
                      className="text-sm"
                      maxLength={30}
                    />
                  </div>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center gap-1.5 cursor-pointer text-sm font-semibold" style={{ color: palette.inkSoft }}>
                  <ImageIcon className="w-6 h-6" />
                  Agregá una foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) addWithFile(file);
                    }}
                  />
                </label>
              )}
            </div>
            {items.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 mb-3">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditIndex(i)}
                    aria-label={`Foto ${i + 1}`}
                    className="w-2 h-2 rounded-full"
                    style={{ background: i === editIndex ? accent : palette.line }}
                  />
                ))}
              </div>
            )}
            {items.length > 0 && (
              <label
                className="flex items-center justify-center gap-1.5 border-2 border-dashed py-2.5 text-sm font-semibold cursor-pointer"
                style={{ borderColor: palette.line, color: palette.inkSoft }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) addWithFile(file);
                  }}
                />
              </label>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-center mt-8">
        {VIDRIERA_BUTTON_SLOTS.map((slot) => {
          const v = botonesData[slot.key];
          const defaultTarget = slot.defaultFuncion === 'whatsapp' ? whatsapp : undefined;
          if (!buttonSlotVisible(editable, v, slot.defaultFuncion, defaultTarget)) return null;
          return (
            <ButtonObject
              key={slot.key}
              value={v}
              onChange={(patch) =>
                onUpdateBotones?.({ ...botonesData, [slot.key]: { ...(botonesData[slot.key] || {}), ...patch } })
              }
              editable={editable}
              seccionesDisponibles={seccionesDisponibles}
              nombreNegocio={nombreNegocio}
              defaultFuncion={slot.defaultFuncion}
              defaultLabel={slot.defaultLabel}
              defaultColor={accent}
              defaultTarget={defaultTarget}
            />
          );
        })}
      </div>
    </section>
  );
}

// Dos fotos lado a lado con un badge chico ("Antes"/"Después") — para
// mostrar una transformación o comparar el punto de partida con el trabajo
// terminado (obras, reformas, carpintería, estética).
function SeccionAntesDespues({
  antesImagen,
  onUpdateAntesImagen,
  despuesImagen,
  onUpdateDespuesImagen,
  antesLabel,
  onUpdateAntesLabel,
  despuesLabel,
  onUpdateDespuesLabel,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const handleUpload = (setter) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) setter?.(await uploadImage(file));
  };

  const Slot = ({ img, label, onUpdateLabel, onUpload, side, styleKeyName }) => (
    <div className="relative aspect-[5/6] bg-black/5 overflow-hidden">
      {img ? (
        <img src={img} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ color: palette.inkSoft }}>
          <ImageIcon className="w-6 h-6" />
        </div>
      )}
      <div className={`absolute top-2 ${side === 'right' ? 'right-2' : 'left-2'} z-10`}>
        <Editable
          editable={editable}
          value={label}
          onChange={onUpdateLabel}
          tag="span"
          styleKey={styleKeyName}
          placeholder={side === 'right' ? 'Después' : 'Antes'}
          style={{ color: '#ffffff', background: 'rgba(0,0,0,0.65)' }}
          className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide inline-block"
          maxLength={20}
        />
      </div>
      {editable && (
        <label className="absolute inset-0 cursor-pointer" title="Cambiar foto">
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>
      )}
    </div>
  );

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-4xl mx-auto text-center mb-10">
        <Editable
          editable={editable}
          value={eyebrow ?? 'De la madera cruda al mueble terminado'}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="antes-despues.eyebrow"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={70}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Antes y después'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="antes-despues.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif text-2xl @lg:text-3xl"
          maxLength={70}
        />
      </div>
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-2 @lg:gap-3">
        <Slot
          img={antesImagen}
          label={antesLabel ?? 'Antes'}
          onUpdateLabel={onUpdateAntesLabel}
          onUpload={handleUpload(onUpdateAntesImagen)}
          side="left"
          styleKeyName="antes-despues.antesLabel"
        />
        <Slot
          img={despuesImagen}
          label={despuesLabel ?? 'Después'}
          onUpdateLabel={onUpdateDespuesLabel}
          onUpload={handleUpload(onUpdateDespuesImagen)}
          side="right"
          styleKeyName="antes-despues.despuesLabel"
        />
      </div>
    </section>
  );
}

// Muestras chicas (maderas, telas, colores) para tocar — al elegir una se ve
// su nombre y descripción debajo. Mismo espíritu que "Áreas de práctica"
// (selección + detalle) pero con miniaturas de foto en vez de una lista.
function SeccionMateriales({
  materiales = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  desc,
  onUpdateDesc,
  editable,
  bgColor,
  textColor,
  headingColor,
  accent,
  palette = {},
}) {
  const [selected, setSelected] = useState(0);
  const currentIndex = Math.min(selected, Math.max(materiales.length - 1, 0));
  const current = materiales[currentIndex];
  const textoSuave = textColor || 'rgba(255,255,255,0.7)';

  const update = (id, patch) => onUpdate?.(materiales.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const remove = (id) => onUpdate?.(materiales.filter((m) => m.id !== id));
  const addWithFile = async (file) => {
    if (!(await validateImageFile(file, 'galeria'))) return;
    const imagen = await uploadImage(file);
    onUpdate?.([...materiales, { id: `material-${Date.now()}`, nombre: 'Nuevo material', desc: '', imagen }]);
    setSelected(materiales.length);
  };
  const replaceImagen = async (id, file) => {
    if (!(await validateImageFile(file, 'galeria'))) return;
    update(id, { imagen: await uploadImage(file) });
  };

  return (
    <section className="relative px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.ink }}>
      <div className="max-w-5xl mx-auto grid @lg:grid-cols-[0.8fr_1.2fr] gap-8 @lg:gap-12 items-start">
        <div>
          <Editable
            editable={editable}
            value={eyebrow ?? 'Materiales'}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="materiales.eyebrow"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={titulo ?? 'Elegí tu material'}
            onChange={onUpdateTitulo}
            tag="h2"
            block
            styleKey="materiales.titulo"
            style={{ color: headingColor || '#ffffff' }}
            className="font-serif text-2xl @lg:text-3xl mb-3"
            maxLength={70}
          />
          <Editable
            editable={editable}
            value={desc}
            onChange={onUpdateDesc}
            tag="p"
            block
            multiline
            styleKey="materiales.desc"
            placeholder="Tocá cada muestra para ver de qué se trata."
            style={{ color: textoSuave }}
            className="text-sm leading-relaxed"
            maxLength={160}
          />
        </div>
        <div>
          <div className="flex gap-3 mb-6 flex-wrap">
            {materiales.map((m, i) => (
              <div key={m.id} className="relative">
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  className="w-16 h-16 overflow-hidden"
                  style={{ outline: `2px solid ${i === currentIndex ? accent : 'transparent'}`, outlineOffset: 2 }}
                >
                  {m.imagen ? (
                    <img src={m.imagen} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <ImageIcon className="w-4 h-4" style={{ color: textoSuave }} />
                    </div>
                  )}
                </button>
                {editable && (
                  <>
                    <label
                      className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer"
                      title="Cambiar foto"
                    >
                      <PencilIcon className="w-2.5 h-2.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (file) replaceImagen(m.id, file);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(m.id)}
                      aria-label={`Quitar ${m.nombre}`}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <XIcon className="w-2.5 h-2.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {editable && (
              <label
                className="w-16 h-16 border-2 border-dashed flex items-center justify-center cursor-pointer"
                style={{ borderColor: 'rgba(255,255,255,0.25)' }}
              >
                <PlusIcon className="w-4 h-4" style={{ color: textoSuave }} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) addWithFile(file);
                  }}
                />
              </label>
            )}
          </div>
          {current ? (
            <div>
              <Editable
                editable={editable}
                value={current.nombre}
                onChange={(v) => update(current.id, { nombre: v })}
                tag="p"
                block
                styleKey={`material.${current.id}.nombre`}
                placeholder="Nombre"
                style={{ color: '#ffffff' }}
                className="font-serif italic text-xl mb-2"
                maxLength={40}
              />
              <Editable
                editable={editable}
                value={current.desc}
                onChange={(v) => update(current.id, { desc: v })}
                tag="p"
                block
                multiline
                styleKey={`material.${current.id}.desc`}
                placeholder="Descripción"
                style={{ color: textoSuave }}
                className="text-sm leading-relaxed"
                maxLength={200}
              />
            </div>
          ) : (
            !editable && (
              <p className="text-sm" style={{ color: textoSuave }}>
                Todavía no cargaste materiales.
              </p>
            )
          )}
        </div>
      </div>
    </section>
  );
}

const TURNOS_DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const TURNOS_MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const TURNOS_HORARIOS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
];

// Patrón fijo (no datos reales) para que algunos horarios se vean "tomados"
// en la vista previa — mismo espíritu que el calendario de SeccionReservas:
// una demo con textura, no un backend de turnos de verdad.
function turnoTomado(barberoIdx, diaOffset, slotIdx) {
  return ((barberoIdx + 1) * 7 + diaOffset * 5 + slotIdx * 3) % 11 < 4;
}

// Wizard de 4 pasos (barbero → servicio → día → horario) con resumen y total
// en vivo al costado — a diferencia de SeccionReservas (calendario mensual +
// franjas mañana/tarde fijas, sin elegir profesional ni ver un resumen), acá
// cada combinación barbero+día tiene sus propios horarios ocupados/libres, y
// el botón final arma un link de WhatsApp con el resumen ya cargado.
function SeccionTurnos({
  barberos = [],
  onAddBarbero,
  onRemoveBarbero,
  onUpdateBarbero,
  servicios = [],
  onAddServicio,
  onRemoveServicio,
  onUpdateServicio,
  eyebrow,
  onUpdateEyebrow,
  titulo,
  onUpdateTitulo,
  descripcion,
  onUpdateDescripcion,
  whatsapp,
  nombreNegocio,
  editable,
  bgColor,
  headingColor,
  textColor,
  accent,
  palette = {},
}) {
  const [sel, setSel] = useState({ barbero: 0, servicio: 0, dia: 0, hora: null });
  const barberoIdx = Math.min(sel.barbero, Math.max(barberos.length - 1, 0));
  const servicioIdx = Math.min(sel.servicio, Math.max(servicios.length - 1, 0));
  const barbero = barberos[barberoIdx];
  const servicio = servicios[servicioIdx];
  const textoSuave = textColor || palette.inkSoft;

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { offset: i, dayNum: d.getDate(), weekday: TURNOS_DIAS_SEMANA[d.getDay()], month: TURNOS_MESES[d.getMonth()] };
  });

  const horarios = TURNOS_HORARIOS.map((time, i) => ({ time, taken: turnoTomado(barberoIdx, sel.dia, i) }));
  const total = servicio ? Number(servicio.precio || 0) : 0;
  const hasHora = !!sel.hora;
  const endTime = (() => {
    if (!hasHora || !servicio) return '—';
    const [h, m] = sel.hora.split(':').map(Number);
    const totalMin = h * 60 + m + Number(servicio.minutos || 0);
    return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  })();
  const diaSel = dias[sel.dia];

  const addBarbero = () =>
    onAddBarbero?.({ id: `barbero-${Date.now()}`, nombre: 'Nuevo barbero', especialidad: '', imagen: '' });
  const addServicio = () =>
    onAddServicio?.({ id: `servicio-${Date.now()}`, nombre: 'Nuevo servicio', minutos: 30, precio: 0 });

  const handleFoto = (id) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) onUpdateBarbero?.(id, { imagen: await uploadImage(file) });
  };

  const mensajeWa = barbero && servicio && diaSel && hasHora
    ? `Hola! Quiero reservar un turno: ${servicio.nombre} con ${barbero.nombre}, ${diaSel.weekday} ${diaSel.dayNum} de ${diaSel.month} a las ${sel.hora}.`
    : undefined;

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto mb-8">
        <Editable
          editable={editable}
          value={eyebrow ?? 'Reservá online'}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="turnos.eyebrow"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Elegí barbero, servicio y hora'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="turnos.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif text-2xl @lg:text-3xl mb-3"
          maxLength={90}
        />
        <Editable
          editable={editable}
          value={descripcion}
          onChange={onUpdateDescripcion}
          tag="p"
          block
          multiline
          styleKey="turnos.descripcion"
          placeholder="Descripción breve (opcional)"
          style={{ color: textoSuave }}
          className="text-sm leading-relaxed max-w-xl"
          maxLength={160}
        />
      </div>

      <div className="max-w-5xl mx-auto grid @lg:grid-cols-[1.5fr_1fr] gap-8 @lg:gap-10 items-start">
        <div className="flex flex-col gap-7">
          {/* Paso 1: barbero */}
          <div>
            <p className="font-mono text-xs uppercase tracking-wide mb-3" style={{ color: textoSuave }}>
              1 · Tu barbero
            </p>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
              {barberos.map((b, i) => {
                const on = i === barberoIdx;
                return (
                  <div
                    key={b.id}
                    className="relative flex items-center gap-2.5 p-2.5 border cursor-pointer"
                    onClick={() => setSel((s) => ({ ...s, barbero: i, hora: null }))}
                    style={{ borderColor: on ? accent : palette.line, background: on ? `${accent}1f` : 'transparent' }}
                  >
                    {editable && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBarbero?.(b.id);
                        }}
                        aria-label={`Quitar ${b.nombre}`}
                        className="absolute top-1 right-1 opacity-50 hover:opacity-100 transition-opacity"
                        style={{ color: palette.ink }}
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    )}
                    <label
                      className={`relative w-11 h-11 shrink-0 overflow-hidden ${editable ? 'cursor-pointer' : ''}`}
                      onClick={(e) => editable && e.stopPropagation()}
                      title={editable ? 'Cambiar foto' : undefined}
                    >
                      {b.imagen ? (
                        <img src={b.imagen} alt={b.nombre} className="w-full h-full object-cover" style={{ filter: 'grayscale(0.2) contrast(1.05)' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.06)' }}>
                          <ImageIcon className="w-4 h-4" style={{ color: palette.inkSoft }} />
                        </div>
                      )}
                      {editable && <input type="file" accept="image/*" className="hidden" onChange={handleFoto(b.id)} />}
                    </label>
                    <div className="min-w-0 flex-1">
                      <Editable
                        editable={editable}
                        value={b.nombre}
                        onChange={(v) => onUpdateBarbero?.(b.id, { nombre: v })}
                        tag="div"
                        placeholder="Nombre"
                        style={{ color: palette.ink }}
                        className="font-semibold text-sm truncate"
                        maxLength={30}
                      />
                      <Editable
                        editable={editable}
                        value={b.especialidad}
                        onChange={(v) => onUpdateBarbero?.(b.id, { especialidad: v })}
                        tag="div"
                        placeholder="Especialidad"
                        style={{ color: on ? accent : palette.inkSoft }}
                        className="font-mono text-[10px] uppercase tracking-wide truncate"
                        maxLength={30}
                      />
                    </div>
                  </div>
                );
              })}
              {editable && (
                <button
                  type="button"
                  onClick={addBarbero}
                  className="flex items-center justify-center gap-1.5 border-2 border-dashed p-2.5 transition-colors"
                  style={{ borderColor: palette.line, color: palette.inkSoft }}
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Agregar</span>
                </button>
              )}
            </div>
          </div>

          {/* Paso 2: servicio */}
          <div>
            <p className="font-mono text-xs uppercase tracking-wide mb-3" style={{ color: textoSuave }}>
              2 · Servicio
            </p>
            <div className="flex flex-col gap-2">
              {servicios.map((sv, i) => {
                const on = i === servicioIdx;
                return (
                  <div
                    key={sv.id}
                    className="relative flex items-center justify-between gap-3 p-3 border cursor-pointer"
                    onClick={() => setSel((s) => ({ ...s, servicio: i }))}
                    style={{ borderColor: on ? accent : palette.line, background: on ? `${accent}1f` : 'transparent' }}
                  >
                    <div className="min-w-0">
                      <Editable
                        editable={editable}
                        value={sv.nombre}
                        onChange={(v) => onUpdateServicio?.(sv.id, { nombre: v })}
                        tag="div"
                        placeholder="Nombre del servicio"
                        style={{ color: palette.ink }}
                        className="font-semibold text-sm"
                        maxLength={40}
                      />
                      <div className="flex items-center gap-1 font-mono text-xs" style={{ color: on ? accent : textoSuave }}>
                        <Editable
                          editable={editable}
                          value={sv.minutos}
                          onChange={(v) => onUpdateServicio?.(sv.id, { minutos: Number(v) || 0 })}
                          tag="span"
                          type="number"
                          format={(v) => `${v} min`}
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Editable
                        editable={editable}
                        value={sv.precio}
                        onChange={(v) => onUpdateServicio?.(sv.id, { precio: Number(v) || 0 })}
                        tag="span"
                        type="number"
                        format={(v) => `$${Number(v || 0).toLocaleString('es-AR')}`}
                        style={{ color: accent }}
                        className="font-mono font-bold text-sm"
                      />
                      {editable && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveServicio?.(sv.id);
                          }}
                          aria-label={`Quitar ${sv.nombre}`}
                          className="opacity-50 hover:opacity-100 transition-opacity"
                          style={{ color: palette.ink }}
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {editable && (
                <button
                  type="button"
                  onClick={addServicio}
                  className="inline-flex items-center gap-1.5 border-2 border-dashed p-2.5 justify-center transition-colors"
                  style={{ borderColor: palette.line, color: palette.inkSoft }}
                >
                  <PlusIcon className="w-4 h-4" /> <span className="text-xs font-semibold">Agregar servicio</span>
                </button>
              )}
            </div>
          </div>

          {/* Paso 3: día */}
          <div>
            <p className="font-mono text-xs uppercase tracking-wide mb-3" style={{ color: textoSuave }}>
              3 · Día
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dias.map((d) => {
                const on = sel.dia === d.offset;
                return (
                  <button
                    key={d.offset}
                    type="button"
                    onClick={() => setSel((s) => ({ ...s, dia: d.offset, hora: null }))}
                    className="shrink-0 w-[68px] border py-2.5 text-center transition-colors"
                    style={{ borderColor: on ? accent : palette.line, background: on ? accent : 'transparent' }}
                  >
                    <div className="font-mono text-[10px] uppercase" style={{ color: on ? palette.bg : textoSuave }}>
                      {d.weekday}
                    </div>
                    <div className="font-serif text-lg leading-tight" style={{ color: on ? palette.bg : palette.ink }}>
                      {d.dayNum}
                    </div>
                    <div className="font-mono text-[10px]" style={{ color: on ? palette.bg : textoSuave }}>
                      {d.month}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paso 4: horario */}
          <div>
            <p className="font-mono text-xs uppercase tracking-wide mb-3" style={{ color: textoSuave }}>
              4 · Horario
            </p>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))' }}>
              {horarios.map((h) => {
                const on = sel.hora === h.time;
                return (
                  <button
                    key={h.time}
                    type="button"
                    disabled={h.taken}
                    onClick={() => setSel((s) => ({ ...s, hora: h.time }))}
                    className="py-2.5 text-center font-mono text-sm border transition-colors"
                    style={{
                      borderColor: on ? accent : h.taken ? 'transparent' : palette.line,
                      background: on ? accent : 'transparent',
                      color: on ? palette.bg : h.taken ? palette.inkSoft : palette.ink,
                      textDecoration: h.taken ? 'line-through' : 'none',
                      opacity: h.taken ? 0.5 : 1,
                      cursor: h.taken ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {h.time}
                  </button>
                );
              })}
            </div>
            <p className="font-mono text-xs mt-3" style={{ color: textoSuave }}>
              Los horarios tachados ya están tomados.
            </p>
          </div>
        </div>

        {/* Resumen */}
        <div className="@lg:sticky @lg:top-20 border" style={{ borderColor: palette.line, background: bgColor || palette.bg }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: palette.line }}>
            <span className="font-mono text-xs uppercase tracking-wide" style={{ color: textoSuave }}>
              Tu turno
            </span>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs uppercase" style={{ color: textoSuave }}>
                Barbero
              </span>
              <span className="text-sm font-semibold text-right" style={{ color: palette.ink }}>
                {barbero?.nombre ?? '—'}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs uppercase" style={{ color: textoSuave }}>
                Servicio
              </span>
              <span className="text-sm font-semibold text-right" style={{ color: palette.ink }}>
                {servicio ? `${servicio.nombre} · ${servicio.minutos} min` : '—'}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs uppercase" style={{ color: textoSuave }}>
                Día
              </span>
              <span className="text-sm font-semibold text-right" style={{ color: palette.ink }}>
                {diaSel ? `${diaSel.weekday} ${diaSel.dayNum} de ${diaSel.month}` : '—'}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs uppercase" style={{ color: textoSuave }}>
                Horario
              </span>
              <span className="text-sm font-semibold text-right" style={{ color: hasHora ? accent : textoSuave }}>
                {hasHora ? `${sel.hora} a ${endTime}` : 'Elegí un horario'}
              </span>
            </div>
          </div>
          <div className="px-5 py-4 border-t flex items-baseline justify-between" style={{ borderColor: palette.line }}>
            <span className="font-mono text-xs uppercase" style={{ color: textoSuave }}>
              Total
            </span>
            <span className="font-serif text-2xl" style={{ color: accent }}>
              ${total.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="px-5 pb-5">
            <a
              href={hasHora && whatsapp ? waLink(whatsapp, nombreNegocio, mensajeWa) : undefined}
              target={hasHora ? '_blank' : undefined}
              rel={hasHora ? 'noreferrer' : undefined}
              onClick={(e) => !hasHora && e.preventDefault()}
              className="block text-center font-bold py-3 text-sm transition-colors"
              style={{
                background: hasHora ? accent : 'transparent',
                color: hasHora ? palette.bg : textoSuave,
                border: `1px solid ${hasHora ? accent : palette.line}`,
                cursor: hasHora ? 'pointer' : 'not-allowed',
              }}
            >
              {hasHora ? 'Confirmar por WhatsApp →' : 'Elegí un horario'}
            </a>
            <p className="font-mono text-[11px] mt-3 text-center" style={{ color: textoSuave }}>
              Se paga en el local. Si no podés venir, avisá con 2 horas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Lista de precios numerada (01, 02...) en 4 columnas: número, nombre+
// descripción, duración y precio — a diferencia de SeccionProductos variant
// "tarifario" (2 columnas, sin numerar, sin campo de duración propio), pensada
// para un menú de servicios con precio fijo por duración.
function SeccionPreciosBarberia({
  servicios = [],
  onAddServicio,
  onRemoveServicio,
  onUpdateServicio,
  titulo,
  onUpdateTitulo,
  nota,
  onUpdateNota,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdateServicio?.(id, patch);
  const remove = (id) => onRemoveServicio?.(id);
  const add = () =>
    onAddServicio?.({ id: `precio-${Date.now()}`, nombre: 'Nuevo servicio', desc: '', minutos: 30, precio: 0 });

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto flex flex-wrap items-baseline justify-between gap-3 mb-7 pb-5 border-b" style={{ borderColor: palette.line }}>
        <Editable
          editable={editable}
          value={titulo ?? 'Lista de precios'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="precios-barberia.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif uppercase text-3xl @lg:text-4xl"
          maxLength={70}
        />
        <Editable
          editable={editable}
          value={nota}
          onChange={onUpdateNota}
          tag="span"
          placeholder="Ej: Vigente desde julio 2026 · Efectivo y transferencia"
          style={{ color: palette.inkSoft }}
          className="font-mono text-xs"
          maxLength={80}
        />
      </div>
      <div className="max-w-5xl mx-auto flex flex-col">
        {servicios.map((sv, i) => (
          <div
            key={sv.id}
            className="relative grid gap-x-4 @lg:gap-x-7 gap-y-1 items-center py-4 border-b"
            style={{ gridTemplateColumns: 'auto 1fr auto auto', borderColor: palette.line }}
          >
            <span className="font-mono text-xs min-w-[1.8rem]" style={{ color: palette.inkSoft, opacity: 0.6 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <Editable
                editable={editable}
                value={sv.nombre}
                onChange={(v) => update(sv.id, { nombre: v })}
                tag="p"
                block
                styleKey={`precio.${sv.id}.nombre`}
                placeholder="Nombre del servicio"
                style={{ color: palette.ink }}
                className="font-bold text-base mb-0.5"
                maxLength={50}
              />
              <Editable
                editable={editable}
                value={sv.desc}
                onChange={(v) => update(sv.id, { desc: v })}
                tag="p"
                block
                styleKey={`precio.${sv.id}.desc`}
                placeholder="Descripción corta"
                style={{ color: palette.inkSoft }}
                className="text-sm"
                maxLength={80}
              />
            </div>
            <Editable
              editable={editable}
              value={sv.minutos}
              onChange={(v) => update(sv.id, { minutos: Number(v) || 0 })}
              tag="span"
              type="number"
              format={(v) => `${v} min`}
              style={{ color: palette.inkSoft }}
              className="font-mono text-xs whitespace-nowrap"
              maxLength={4}
            />
            <div className="flex items-center gap-2">
              <Editable
                editable={editable}
                value={sv.precio}
                onChange={(v) => update(sv.id, { precio: Number(v) || 0 })}
                tag="span"
                type="number"
                format={(v) => `$${Number(v || 0).toLocaleString('es-AR')}`}
                style={{ color: accent }}
                className="font-serif text-xl whitespace-nowrap"
              />
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(sv.id)}
                  aria-label={`Quitar ${sv.nombre}`}
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {editable && (
        <div className="max-w-5xl mx-auto mt-5">
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide border px-3 py-2 transition-colors"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-3.5 h-3.5" /> Agregar servicio
          </button>
        </div>
      )}
    </section>
  );
}

// Grilla de fotos 3/4 con nombre grande (mayúsculas), especialidad+años en
// mono color acento, y bio corta — a diferencia de SeccionEquipo (todas sus
// variantes usan nombre en serif itálica minúscula y llevan un borde-top de
// acento que acá no corresponde), pensada para calzar con la tipografía
// Anton/mayúsculas del resto de la plantilla.
function SeccionBarberos({
  barberos = [],
  onAddBarbero,
  onRemoveBarbero,
  onUpdateBarbero,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdateBarbero?.(id, patch);
  const remove = (id) => onRemoveBarbero?.(id);
  const add = () =>
    onAddBarbero?.({ id: `equipo-${Date.now()}`, nombre: 'Nueva persona', especialidad: '', anios: '', bio: '', foto: '' });

  const handleFoto = (id) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) update(id, { foto: await uploadImage(file) });
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20 border-t" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
      <div className="max-w-5xl mx-auto mb-7">
        <Editable
          editable={editable}
          value={eyebrow ?? 'El equipo'}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="barberos.eyebrow"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'Quién te atiende'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="barberos.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif uppercase text-3xl @lg:text-4xl"
          maxLength={70}
        />
      </div>
      <div className="max-w-5xl mx-auto grid grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-3 gap-6">
        {barberos.map((b) => (
          <div key={b.id} className="relative">
            {editable && (
              <button
                type="button"
                onClick={() => remove(b.id)}
                aria-label={`Quitar ${b.nombre}`}
                className="absolute top-3 right-3 z-10 w-6 h-6 bg-black/50 text-white flex items-center justify-center hover:bg-red-500/80 transition-colors"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <label
              className={`relative block w-full aspect-[3/4] bg-black/10 overflow-hidden mb-4 ${editable ? 'cursor-pointer' : ''}`}
              title={editable ? 'Cambiar foto' : undefined}
            >
              {b.foto ? (
                <img src={b.foto} alt={b.nombre} className="w-full h-full object-cover" style={{ filter: 'grayscale(0.25) contrast(1.08)' }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" style={{ color: palette.inkSoft }} />
                </div>
              )}
              {editable && <input type="file" accept="image/*" className="hidden" onChange={handleFoto(b.id)} />}
            </label>
            <Editable
              editable={editable}
              value={b.nombre}
              onChange={(v) => update(b.id, { nombre: v })}
              tag="p"
              block
              styleKey={`barbero.${b.id}.nombre`}
              placeholder="Nombre"
              style={{ color: palette.ink }}
              className="font-serif uppercase text-xl mb-1"
              maxLength={40}
            />
            <div className="flex items-center gap-1 font-mono text-xs uppercase tracking-wide mb-2.5" style={{ color: accent }}>
              <Editable
                editable={editable}
                value={b.especialidad}
                onChange={(v) => update(b.id, { especialidad: v })}
                tag="span"
                placeholder="Especialidad"
                maxLength={30}
              />
              {(b.anios || editable) && <span>·</span>}
              <Editable
                editable={editable}
                value={b.anios}
                onChange={(v) => update(b.id, { anios: v })}
                tag="span"
                placeholder="X años"
                maxLength={20}
              />
            </div>
            <Editable
              editable={editable}
              value={b.bio}
              onChange={(v) => update(b.id, { bio: v })}
              tag="p"
              block
              multiline
              styleKey={`barbero.${b.id}.bio`}
              placeholder="Bio corta"
              style={{ color: palette.inkSoft }}
              className="text-sm leading-relaxed"
              maxLength={180}
            />
          </div>
        ))}
      </div>
      {editable && (
        <div className="max-w-5xl mx-auto mt-6">
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide border px-3 py-2 transition-colors"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-3.5 h-3.5" /> Agregar persona
          </button>
        </div>
      )}
    </section>
  );
}

// Tarjetas horizontales con scroll-snap: estrellas en mono, cita, persona y
// meta — a diferencia de TestimonioCard/SeccionTestimonios (que llevan
// avatar circular y el layout de tarjeta "review de e-commerce" propio del
// resto de la app), acá es la tarjeta simple con borde que trae el HTML
// original, sin foto de la persona.
function SeccionReviewsBarberia({
  reviews = [],
  onAddReview,
  onRemoveReview,
  onUpdateReview,
  editable,
  bgColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdateReview?.(id, patch);
  const remove = (id) => onRemoveReview?.(id);
  const add = () => onAddReview?.({ id: `review-${Date.now()}`, cita: 'Escribí acá la reseña.', persona: 'Nombre', meta: 'Detalle' });

  return (
    <section className="px-6 @lg:px-10 py-10 @lg:py-14" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
        {reviews.map((r) => (
          <div
            key={r.id}
            className="relative shrink-0 w-[320px] border p-6"
            style={{ scrollSnapAlign: 'start', borderColor: palette.line }}
          >
            {editable && (
              <button
                type="button"
                onClick={() => remove(r.id)}
                aria-label="Quitar reseña"
                className="absolute top-3 right-3 opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: palette.ink }}
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="font-mono tracking-[0.2em] text-sm mb-4" style={{ color: accent }}>
              ★★★★★
            </div>
            <Editable
              editable={editable}
              value={r.cita}
              onChange={(v) => update(r.id, { cita: v })}
              tag="p"
              block
              multiline
              styleKey={`review.${r.id}.cita`}
              placeholder="Cita de la reseña"
              style={{ color: palette.ink, opacity: 0.85 }}
              className="text-sm leading-relaxed mb-4"
              maxLength={200}
            />
            <Editable
              editable={editable}
              value={r.persona}
              onChange={(v) => update(r.id, { persona: v })}
              tag="div"
              placeholder="Nombre"
              style={{ color: palette.ink }}
              className="font-bold text-sm"
              maxLength={30}
            />
            <Editable
              editable={editable}
              value={r.meta}
              onChange={(v) => update(r.id, { meta: v })}
              tag="div"
              placeholder="Detalle (ej: cliente desde 2020)"
              style={{ color: palette.inkSoft }}
              className="font-mono text-xs"
              maxLength={40}
            />
          </div>
        ))}
        {editable && (
          <button
            type="button"
            onClick={add}
            className="shrink-0 w-[320px] border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-5 h-5" />
            <span className="text-xs font-semibold">Agregar reseña</span>
          </button>
        )}
      </div>
    </section>
  );
}

// Footer de una sola fila (nombre, links, crédito, todo en línea) — a
// diferencia de SeccionFooter variant "minimal" (apila links arriba y
// crédito centrado abajo en 2 líneas), pensado para cuando el nombre del
// negocio es corto y entra cómodo junto a los links sin apilar nada.
function SeccionFooterBarberia({
  nombreNegocio,
  whatsapp,
  instagram,
  editable,
  bgColor,
  textColor,
  palette = {},
  botones: botonesData = {},
  onUpdateBotones,
  seccionesDisponibles = [],
}) {
  const footerTargetDefaults = {
    primary: instagram ? `https://instagram.com/${instagram.replace('@', '')}` : undefined,
    secondary: whatsapp,
  };
  const slots = [
    { key: 'primary', defaultFuncion: 'enlace', defaultLabel: 'Instagram' },
    { key: 'secondary', defaultFuncion: 'whatsapp', defaultLabel: 'WhatsApp' },
  ];

  return (
    <footer className="px-6 @lg:px-10 py-8 border-t" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <span className="font-serif uppercase text-lg" style={{ color: textColor || palette.ink }}>
          {nombreNegocio}
        </span>
        <div className="flex items-center gap-5">
          {slots.map((slot) => {
            const v = botonesData[slot.key];
            const defaultTarget = footerTargetDefaults[slot.key];
            if (!buttonSlotVisible(editable, v, slot.defaultFuncion, defaultTarget)) return null;
            return (
              <ButtonObject
                key={slot.key}
                value={v}
                onChange={(patch) => onUpdateBotones?.({ ...botonesData, [slot.key]: { ...(botonesData[slot.key] || {}), ...patch } })}
                editable={editable}
                seccionesDisponibles={seccionesDisponibles}
                nombreNegocio={nombreNegocio}
                defaultFuncion={slot.defaultFuncion}
                defaultLabel={slot.defaultLabel}
                defaultColor={palette.inkHex || palette.ink}
                defaultTarget={defaultTarget}
                outline
                size="sm"
                className="!px-0 !py-0 !border-0"
              />
            );
          })}
        </div>
        <span className="text-xs" style={{ color: palette.inkSoft }}>
          Sitio creado con SitioWeb Digital
        </span>
      </div>
    </footer>
  );
}

// Riel horizontal con scroll-snap: cada paso de un proceso productivo con su
// propia foto, número y descripción — a diferencia de SeccionPasos (que no
// tiene una foto por paso en ninguna de sus variantes), pensado para talleres
// que quieren mostrar el "antes de que llegue el producto terminado" con
// imágenes reales de cada etapa, una al lado de la otra para hojear.
function SeccionProcesoTaller({
  pasos = [],
  onAddPaso,
  onRemovePaso,
  onUpdatePaso,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  textColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdatePaso?.(id, patch);
  const remove = (id) => onRemovePaso?.(id);
  const add = () =>
    onAddPaso?.({ id: `proceso-${Date.now()}`, titulo: 'Nueva etapa', desc: 'Describí esta etapa del proceso.', imagen: '' });

  const handleImagen = (id) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) update(id, { imagen: await uploadImage(file) });
  };

  return (
    <section className="py-14 @lg:py-20 border-t" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
      <div className="max-w-5xl mx-auto px-6 @lg:px-10 mb-7">
        <Editable
          editable={editable}
          value={eyebrow ?? 'El proceso'}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="proceso-taller.eyebrow"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.16em] mb-2"
          maxLength={40}
        />
        <Editable
          editable={editable}
          value={titulo ?? 'De la materia cruda a tu casa'}
          onChange={onUpdateTitulo}
          tag="h2"
          block
          styleKey="proceso-taller.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif text-2xl @lg:text-3xl max-w-[22ch]"
          maxLength={90}
        />
      </div>
      <div className="flex gap-4 overflow-x-auto px-6 @lg:px-10 pb-2" style={{ scrollSnapType: 'x mandatory' }}>
        {pasos.map((p, i) => (
          <div key={p.id} className="relative shrink-0 w-[clamp(240px,26vw,320px)]" style={{ scrollSnapAlign: 'start' }}>
            {editable && (
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label="Quitar etapa"
                className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/50 text-white flex items-center justify-center hover:bg-red-500/80 transition-colors"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <label
              className={`relative block w-full aspect-[4/3] bg-black/5 mb-3.5 overflow-hidden ${editable ? 'cursor-pointer' : ''}`}
              title={editable ? 'Cambiar foto' : undefined}
            >
              {p.imagen ? (
                <img src={p.imagen} alt={p.titulo} className="w-full h-full object-cover" style={{ filter: 'contrast(1.03) saturate(0.96)' }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" style={{ color: palette.inkSoft }} />
                </div>
              )}
              {editable && <input type="file" accept="image/*" className="hidden" onChange={handleImagen(p.id)} />}
            </label>
            <div className="flex items-baseline gap-2.5 mb-1">
              <span className="font-mono font-bold text-sm" style={{ color: accent }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <Editable
                editable={editable}
                value={p.titulo}
                onChange={(v) => update(p.id, { titulo: v })}
                tag="span"
                styleKey={`proceso.${p.id}.titulo`}
                placeholder="Título de la etapa"
                style={{ color: palette.ink }}
                className="font-serif text-lg"
                maxLength={50}
              />
            </div>
            <Editable
              editable={editable}
              value={p.desc}
              onChange={(v) => update(p.id, { desc: v })}
              tag="p"
              block
              multiline
              styleKey={`proceso.${p.id}.desc`}
              placeholder="Descripción de esta etapa"
              style={{ color: textColor || palette.inkSoft }}
              className="text-sm leading-relaxed"
              maxLength={160}
            />
          </div>
        ))}
        {editable && (
          <button
            type="button"
            onClick={add}
            className="shrink-0 w-[clamp(240px,26vw,320px)] aspect-[4/3] border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-5 h-5" />
            <span className="text-xs font-semibold">Agregar etapa</span>
          </button>
        )}
      </div>
    </section>
  );
}

// Grilla de personas con una plaqueta de iniciales (no foto), bio y una
// "firma" a modo de detalle distintivo — a diferencia de SeccionEquipo (que
// siempre usa una foto grande o el nombre como centro de la tarjeta), acá el
// nombre y la plaqueta van en una misma fila chica arriba de la bio, con un
// desplazamiento vertical alternado entre tarjetas para que la fila no quede
// perfectamente pareja (mismo espíritu que un masonry, sin serlo del todo).
function SeccionArtesanas({
  artesanas = [],
  onAddArtesana,
  onRemoveArtesana,
  onUpdateArtesana,
  titulo,
  onUpdateTitulo,
  editable,
  bgColor,
  headingColor,
  palette = {},
}) {
  const BADGE_COLORS = ['#b5502f', '#6b7f5e', '#8a6a3f', '#4a5a7a'];
  const OFFSETS = ['0rem', '2.5rem', '1.25rem'];
  const update = (id, patch) => onUpdateArtesana?.(id, patch);
  const remove = (id) => onRemoveArtesana?.(id);
  const add = () =>
    onAddArtesana?.({
      id: `artesana-${Date.now()}`,
      nombre: 'Nueva persona',
      oficio: '',
      anios: '',
      bio: '',
      firma: '',
      badgeBg: BADGE_COLORS[artesanas.length % BADGE_COLORS.length],
    });

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto mb-9 pb-5 border-b" style={{ borderColor: palette.line }}>
        <Editable
          editable={editable}
          value={titulo ?? 'Quiénes hacen las piezas'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="artesanas.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif text-2xl @lg:text-3xl"
          maxLength={70}
        />
      </div>
      {artesanas.length === 0 && !editable ? (
        <p className="text-center text-sm max-w-sm mx-auto" style={{ color: palette.inkSoft }}>
          Todavía no agregaste a las personas del taller.
        </p>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 @lg:grid-cols-3 gap-7">
          {artesanas.map((a, i) => (
            <div key={a.id} className="relative" style={{ marginTop: OFFSETS[i % OFFSETS.length] }}>
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  aria-label={`Quitar ${a.nombre}`}
                  className="absolute top-0 right-0 opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-2.5 mb-3.5">
                <div
                  className="w-9 h-9 shrink-0 flex items-center justify-center font-mono font-bold text-xs text-white"
                  style={{ background: a.badgeBg || '#b5502f' }}
                >
                  {initials(a.nombre)}
                </div>
                <div className="min-w-0">
                  <Editable
                    editable={editable}
                    value={a.nombre}
                    onChange={(v) => update(a.id, { nombre: v })}
                    tag="p"
                    block
                    styleKey={`artesana.${a.id}.nombre`}
                    placeholder="Nombre"
                    style={{ color: palette.ink }}
                    className="font-serif text-lg leading-tight"
                    maxLength={50}
                  />
                  <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide" style={{ color: palette.inkSoft }}>
                    <Editable
                      editable={editable}
                      value={a.oficio}
                      onChange={(v) => update(a.id, { oficio: v })}
                      tag="span"
                      placeholder="Oficio"
                      maxLength={30}
                    />
                    {(a.anios || editable) && <span>·</span>}
                    <Editable
                      editable={editable}
                      value={a.anios}
                      onChange={(v) => update(a.id, { anios: v })}
                      tag="span"
                      placeholder="Años"
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>
              <Editable
                editable={editable}
                value={a.bio}
                onChange={(v) => update(a.id, { bio: v })}
                tag="p"
                block
                multiline
                styleKey={`artesana.${a.id}.bio`}
                placeholder="Contá quién es y cómo trabaja"
                style={{ color: palette.inkSoft }}
                className="text-sm leading-relaxed mb-3"
                maxLength={220}
              />
              <div className="border-t pt-2.5 font-mono text-xs" style={{ borderColor: palette.line, color: '#6b7f5e' }}>
                Firma:{' '}
                <Editable
                  editable={editable}
                  value={a.firma}
                  onChange={(v) => update(a.id, { firma: v })}
                  tag="span"
                  placeholder="Detalle distintivo de su trabajo"
                  maxLength={50}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {editable && (
        <div className="max-w-5xl mx-auto mt-6">
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide border px-3 py-2 transition-colors"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-3.5 h-3.5" /> Agregar persona
          </button>
        </div>
      )}
    </section>
  );
}

// Lista de fechas (ferias, mercados, eventos propios) fila por fila: fecha,
// nombre + lugar, y una etiqueta de estado — a diferencia de SeccionCronograma
// (pensado para el cronograma de UN evento propio, no una serie de apariciones
// en distintos eventos de terceros) y SeccionLugares (sucursales fijas, sin
// fecha). Acá cada fila es una feria puntual con su propio rango de fechas.
function SeccionFerias({
  ferias = [],
  onAddFeria,
  onRemoveFeria,
  onUpdateFeria,
  titulo,
  onUpdateTitulo,
  subtitulo,
  onUpdateSubtitulo,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdateFeria?.(id, patch);
  const remove = (id) => onRemoveFeria?.(id);
  const add = () =>
    onAddFeria?.({ id: `feria-${Date.now()}`, fechas: '', nombre: 'Nueva feria', ciudad: '', stand: '', destacada: false });

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto flex flex-wrap items-end justify-between gap-3 mb-7 pb-5 border-b" style={{ borderColor: palette.line }}>
        <Editable
          editable={editable}
          value={titulo ?? 'Dónde encontrarnos'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="ferias.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif text-2xl @lg:text-3xl"
          maxLength={70}
        />
        <Editable
          editable={editable}
          value={subtitulo}
          onChange={onUpdateSubtitulo}
          tag="span"
          placeholder="Ej: Ferias y mercados · 2026"
          style={{ color: palette.inkSoft }}
          className="font-mono text-xs"
          maxLength={50}
        />
      </div>
      {ferias.length === 0 && !editable ? (
        <p className="text-center text-sm max-w-sm mx-auto" style={{ color: palette.inkSoft }}>
          Todavía no cargaste ninguna feria o evento.
        </p>
      ) : (
        <div className="max-w-5xl mx-auto flex flex-col">
          {ferias.map((f) => (
            <div
              key={f.id}
              className="relative grid grid-cols-2 @lg:grid-cols-[auto_1fr_auto_auto] gap-x-4 gap-y-1 items-center py-4 border-b"
              style={{ borderColor: palette.line }}
            >
              <Editable
                editable={editable}
                value={f.fechas}
                onChange={(v) => update(f.id, { fechas: v })}
                tag="span"
                placeholder="14—16 AGO"
                style={{ color: f.destacada ? accent : palette.inkSoft }}
                className="font-mono text-sm font-bold"
                maxLength={20}
              />
              <div className="col-span-2 @lg:col-span-1 min-w-0">
                <Editable
                  editable={editable}
                  value={f.nombre}
                  onChange={(v) => update(f.id, { nombre: v })}
                  tag="p"
                  block
                  styleKey={`feria.${f.id}.nombre`}
                  placeholder="Nombre de la feria"
                  style={{ color: palette.ink }}
                  className="font-serif text-lg leading-tight"
                  maxLength={70}
                />
                <Editable
                  editable={editable}
                  value={f.ciudad}
                  onChange={(v) => update(f.id, { ciudad: v })}
                  tag="span"
                  placeholder="Lugar y ciudad"
                  style={{ color: palette.inkSoft }}
                  className="text-sm"
                  maxLength={60}
                />
              </div>
              <div className="font-mono text-xs whitespace-nowrap" style={{ color: palette.inkSoft }}>
                Stand{' '}
                <Editable
                  editable={editable}
                  value={f.stand}
                  onChange={(v) => update(f.id, { stand: v })}
                  tag="span"
                  placeholder="B-12"
                  maxLength={10}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => update(f.id, { destacada: !f.destacada })}
                  className="font-mono text-[10px] uppercase tracking-wide px-2 py-1 transition-colors"
                  style={
                    f.destacada
                      ? { background: accent, color: palette.bg }
                      : { background: 'rgba(0,0,0,0.05)', color: palette.inkSoft }
                  }
                >
                  {f.destacada ? 'Próxima' : 'Confirmada'}
                </button>
                {editable && (
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    aria-label="Quitar feria"
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    style={{ color: palette.ink }}
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {editable && (
        <div className="max-w-5xl mx-auto mt-5">
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide border px-3 py-2 transition-colors"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-3.5 h-3.5" /> Agregar feria
          </button>
        </div>
      )}
    </section>
  );
}

// Una sola frase de cliente por vez, grande e itálica, centrada, con puntos
// clickeables debajo y auto-avance con timer — a diferencia de
// SeccionTestimonios (que siempre muestra la tarjeta con estrellas/avatar,
// aunque sea de a una en variante "carousel"), acá es solo la cita + persona,
// sin chrome de tarjeta, pensado para un tono más editorial que de reseña.
function SeccionCitasRotativas({
  citas = [],
  onAddCita,
  onRemoveCita,
  onUpdateCita,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  accent,
  palette = {},
}) {
  const [idx, setIdx] = useState(0);
  const current = Math.min(idx, Math.max(citas.length - 1, 0));

  useEffect(() => {
    if (editable || citas.length < 2) return undefined;
    const timer = setInterval(() => setIdx((i) => (i + 1) % citas.length), 5200);
    return () => clearInterval(timer);
  }, [editable, citas.length]);

  const add = () =>
    onAddCita?.({ id: `cita-${Date.now()}`, frase: 'Escribí acá la cita de un cliente.', persona: 'Nombre', ciudad: '' });

  if (citas.length === 0 && !editable) return null;
  const activa = citas[current];

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20 border-t" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
      <div className="max-w-2xl mx-auto text-center">
        <Editable
          editable={editable}
          value={eyebrow ?? 'Nos escriben'}
          onChange={onUpdateEyebrow}
          tag="span"
          block
          styleKey="citas.eyebrow"
          style={{ color: accent }}
          className="font-mono text-xs uppercase tracking-[0.18em] mb-7"
          maxLength={40}
        />
        {activa ? (
          <>
            <div className="relative min-h-[5.5rem] flex items-center justify-center">
              {editable && (
                <button
                  type="button"
                  onClick={() => {
                    onRemoveCita?.(activa.id);
                    setIdx(0);
                  }}
                  aria-label="Quitar esta cita"
                  className="absolute -top-1 right-0 opacity-50 hover:opacity-100 transition-opacity"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
              <Editable
                editable={editable}
                value={activa.frase}
                onChange={(v) => onUpdateCita?.(activa.id, { frase: v })}
                tag="p"
                block
                multiline
                styleKey={`cita.${activa.id}.frase`}
                placeholder="Cita del cliente"
                style={{ color: palette.ink }}
                className="font-serif italic text-xl @lg:text-2xl leading-relaxed"
                maxLength={200}
              />
            </div>
            <div className="font-mono text-sm mt-7" style={{ color: palette.inkSoft }}>
              <Editable
                editable={editable}
                value={activa.persona}
                onChange={(v) => onUpdateCita?.(activa.id, { persona: v })}
                tag="span"
                placeholder="Nombre"
                maxLength={40}
              />
              {(activa.ciudad || editable) && ' · '}
              <Editable
                editable={editable}
                value={activa.ciudad}
                onChange={(v) => onUpdateCita?.(activa.id, { ciudad: v })}
                tag="span"
                placeholder="Ciudad"
                maxLength={30}
              />
            </div>
            {citas.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-7">
                {citas.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setIdx(i)}
                    aria-label={`Ver cita ${i + 1}`}
                    className="h-[5px] transition-all"
                    style={{ width: i === current ? '22px' : '5px', background: i === current ? accent : palette.line }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm" style={{ color: palette.inkSoft }}>
            Todavía no cargaste ninguna cita.
          </p>
        )}
      </div>
      {editable && (
        <div className="max-w-2xl mx-auto mt-6 text-center">
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide border px-3 py-2 transition-colors"
            style={{ borderColor: palette.line, color: palette.inkSoft }}
          >
            <PlusIcon className="w-3.5 h-3.5" /> Agregar cita
          </button>
        </div>
      )}
    </section>
  );
}

// Filas de label/valor completamente libres (no 3 campos fijos como
// SeccionContacto variant="directo") + una foto al lado — para cuando el
// negocio quiere mostrar información puntual (horario de visitas, zona de
// envíos) que no encaja en el molde fijo "dirección/contacto/horarios".
function SeccionVisitaTaller({
  filas = [],
  onAddFila,
  onRemoveFila,
  onUpdateFila,
  imagen,
  onUpdateImagen,
  mapaSimulado = false,
  imagenPrimero = false,
  titulo,
  onUpdateTitulo,
  descripcion,
  onUpdateDescripcion,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdateFila?.(id, patch);
  const remove = (id) => onRemoveFila?.(id);
  const add = () => onAddFila?.({ id: `visita-${Date.now()}`, label: 'Dato', value: 'Detalle' });

  const handleImagen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && (await validateImageFile(file, 'galeria'))) onUpdateImagen?.(await uploadImage(file));
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto grid @lg:grid-cols-2 gap-10 @lg:gap-12 items-start">
        <div className={imagenPrimero ? '@lg:order-2' : ''}>
          <Editable
            editable={editable}
            value={eyebrow ?? 'Visitá el taller'}
            onChange={onUpdateEyebrow}
            tag="span"
            block
            styleKey="visita-taller.eyebrow"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
            maxLength={40}
          />
          {(titulo || descripcion || editable) && (
            <>
              <Editable
                editable={editable}
                value={titulo}
                onChange={onUpdateTitulo}
                tag="h2"
                block
                styleKey="visita-taller.titulo"
                placeholder="Título (opcional)"
                style={{ color: headingColor || palette.ink }}
                className="font-serif text-2xl @lg:text-3xl mb-3 leading-tight"
                maxLength={90}
              />
              <Editable
                editable={editable}
                value={descripcion}
                onChange={onUpdateDescripcion}
                tag="p"
                block
                multiline
                styleKey="visita-taller.descripcion"
                placeholder="Descripción (opcional)"
                style={{ color: palette.inkSoft }}
                className="text-sm leading-relaxed mb-5"
                maxLength={220}
              />
            </>
          )}
          <div className="flex flex-col gap-5">
            {filas.map((f) => (
              <div key={f.id} className="relative">
                {editable && (
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    aria-label="Quitar fila"
                    className="absolute top-0 right-0 opacity-50 hover:opacity-100 transition-opacity"
                    style={{ color: palette.ink }}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                )}
                <Editable
                  editable={editable}
                  value={f.label}
                  onChange={(v) => update(f.id, { label: v })}
                  tag="span"
                  placeholder="Etiqueta (ej: Taller)"
                  style={{ color: palette.inkSoft }}
                  className="font-mono text-[10px] uppercase tracking-wide mb-0.5 block"
                  maxLength={30}
                />
                <Editable
                  editable={editable}
                  value={f.value}
                  onChange={(v) => update(f.id, { value: v })}
                  tag="span"
                  placeholder="Detalle"
                  style={{ color: palette.ink }}
                  className="text-[0.98rem] block"
                  maxLength={100}
                />
              </div>
            ))}
          </div>
          {editable && (
            <button
              type="button"
              onClick={add}
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide border px-3 py-2 transition-colors mt-5"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-3.5 h-3.5" /> Agregar dato
            </button>
          )}
        </div>
        {mapaSimulado ? (
          <div
            className={`w-full min-h-[220px] flex items-center justify-center ${imagenPrimero ? '@lg:order-1' : ''}`}
            style={{ background: palette.line }}
          >
            <span className="font-mono text-xs uppercase" style={{ color: palette.inkSoft }}>
              Mapa (simulado)
            </span>
          </div>
        ) : (
          <label
            className={`relative block w-full aspect-[4/3] bg-black/5 overflow-hidden ${imagenPrimero ? '@lg:order-1' : ''} ${editable ? 'cursor-pointer' : ''}`}
            title={editable ? 'Cambiar foto' : undefined}
          >
            {imagen ? (
              <img src={imagen} alt="" className="w-full h-full object-cover" style={{ filter: 'contrast(1.03) saturate(0.96)' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6" style={{ color: palette.inkSoft }} />
              </div>
            )}
            {editable && <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />}
          </label>
        )}
      </div>
    </section>
  );
}

// Franja angosta arriba de todo con un mensaje corto y el teléfono — para
// negocios de urgencia (electricistas, cerrajeros, plomeros) que quieren
// dejar bien visible cómo contactarlos ya mismo, antes incluso del header.
function SeccionAnuncio({ mensaje, onUpdateMensaje, telefono, editable, bgColor, textColor, accent, palette = {} }) {
  return (
    <div className="px-6 @lg:px-10 py-2" style={{ background: bgColor || palette.ink }}>
      <div className="max-w-5xl mx-auto flex items-center justify-center gap-2.5 text-center flex-wrap">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
        <Editable
          editable={editable}
          value={mensaje ?? 'Urgencias 24 hs, todos los días'}
          onChange={onUpdateMensaje}
          tag="span"
          styleKey="anuncio.mensaje"
          placeholder="Mensaje corto"
          style={{ color: textColor || '#ffffff' }}
          className="text-xs @lg:text-sm"
          maxLength={80}
        />
        {telefono && (
          <a
            href={`tel:${telefono.replace(/\s|-/g, '')}`}
            className="font-mono font-bold text-xs @lg:text-sm"
            style={{ color: accent }}
          >
            {telefono}
          </a>
        )}
      </div>
    </div>
  );
}

// Franja angosta con textos cortos en movimiento continuo (medios, premios,
// marcas con las que trabajó) — separada de "Logos de clientes" porque acá
// es texto plano en loop, no una fila fija de imágenes. En el editor se ve
// una fila estática (más fácil de tocar para editar); el movimiento infinito
// solo corre en el sitio publicado.
function SeccionMarquee({ mensajes = [], onUpdate, editable, bgColor, textColor, palette = {}, separador = '·', velocidad, fuente = 'font-serif' }) {
  const update = (id, patch) => onUpdate?.(mensajes.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const remove = (id) => onUpdate?.(mensajes.filter((m) => m.id !== id));
  const add = () => onUpdate?.([...mensajes, { id: `marquee-${Date.now()}`, texto: 'Nueva mención' }]);
  const textoSuave = textColor || 'rgba(255,255,255,0.4)';

  if (editable) {
    return (
      <div
        className="border-y py-3 px-6 @lg:px-10"
        style={{ background: bgColor || palette.ink, borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-2">
          {mensajes.map((m) => (
            <div key={m.id} className="relative inline-flex items-center gap-1.5 border rounded-full pl-3 pr-2 py-1" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
              <Editable
                editable
                value={m.texto}
                onChange={(v) => update(m.id, { texto: v })}
                tag="span"
                placeholder="Mención, medio o premio"
                style={{ color: textoSuave }}
                className="text-sm"
                maxLength={60}
              />
              <button
                type="button"
                onClick={() => remove(m.id)}
                aria-label={`Quitar ${m.texto}`}
                className="opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: textoSuave }}
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border-2 border-dashed px-3 py-1.5"
            style={{ borderColor: 'rgba(255,255,255,0.25)', color: textoSuave }}
          >
            <PlusIcon className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>
      </div>
    );
  }

  if (mensajes.length === 0) return null;
  const loop = [...mensajes, ...mensajes];
  return (
    <div
      className="border-y py-3 overflow-hidden"
      style={{ background: bgColor || palette.ink, borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex w-max animate-marquee" style={velocidad ? { animationDuration: `${velocidad}s` } : undefined}>
        {loop.map((m, i) => (
          <span
            key={`${m.id}-${i}`}
            className={`${fuente} text-base font-semibold px-8 whitespace-nowrap shrink-0`}
            style={{ color: textoSuave }}
          >
            {m.texto} {separador}
          </span>
        ))}
      </div>
    </div>
  );
}

// Selector de series/colecciones: una fila de tabs (una por serie de
// trabajos) que cambia qué imagen y qué detalle (título, descripción, año,
// formato) se ve al lado — para portfolios con varias líneas de trabajo
// distintas que no entran todas juntas en una sola grilla. El cambio de tab
// funciona igual editando o publicado; lo único que cambia en el editor es
// que la imagen activa se puede tocar para reemplazarla.
function SeccionSeries({
  items = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  headingColor,
  textColor,
  accent,
  palette = {},
  variant = 'tabs',
}) {
  const [active, setActive] = useState(0);
  const activeIndex = Math.min(active, Math.max(items.length - 1, 0));
  const activeItem = items[activeIndex];

  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => {
    onUpdate?.(items.filter((it) => it.id !== id));
    setActive(0);
  };
  const add = () =>
    onUpdate?.([
      ...items,
      { id: `serie-${Date.now()}`, key: 'Nueva', title: 'Nueva serie', desc: '', year: '', format: '', count: '', hint: '', imagen: '' },
    ]);

  const handleImagen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file && activeItem && (await validateImageFile(file, 'galeria'))) {
      update(activeItem.id, { imagen: await uploadImage(file) });
    }
  };

  const eyebrowEl = (
    <Editable
      editable={editable}
      value={eyebrow}
      onChange={onUpdateEyebrow}
      tag="span"
      block
      styleKey="series.eyebrow"
      placeholder="Eyebrow (opcional)"
      style={{ color: accent }}
      className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
      maxLength={40}
    />
  );
  const tituloEl = (
    <Editable
      editable={editable}
      value={titulo ?? 'Series'}
      onChange={onUpdateTitulo}
      tag="h2"
      block
      styleKey="series.titulo"
      style={{ color: headingColor || palette.ink }}
      className="font-serif text-2xl @lg:text-3xl max-w-[18ch] text-balance"
      maxLength={70}
    />
  );

  const imagePanel = (aspect) => (
    <label
      className={`relative block overflow-hidden ${aspect} bg-black/5 ${editable ? 'cursor-pointer' : ''}`}
      title={editable ? 'Cambiar foto' : undefined}
    >
      {items.map((it, i) => (
        <img
          key={it.id}
          src={it.imagen || undefined}
          alt={it.title}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
          style={{ opacity: i === activeIndex ? 1 : 0, display: it.imagen ? 'block' : 'none' }}
        />
      ))}
      {!activeItem?.imagen && (
        <div className="w-full h-full flex items-center justify-center text-sm text-center px-4" style={{ color: palette.inkSoft }}>
          Subí una foto para esta serie
        </div>
      )}
      {editable && <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />}
    </label>
  );

  if (variant === 'lista') {
    return (
      <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
        <div className="max-w-5xl mx-auto grid @lg:grid-cols-[1fr_1.15fr] gap-8 @lg:gap-12 items-center">
          <div>
            {eyebrowEl}
            <div className="mb-7">{tituloEl}</div>
            <div className="flex flex-col border-t" style={{ borderColor: palette.line }}>
              {items.map((it, i) => (
                <div
                  key={it.id}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className="relative cursor-pointer px-3 py-4 border-b border-l-[3px] transition-colors"
                  style={{
                    borderBottomColor: palette.line,
                    borderLeftColor: i === activeIndex ? accent : 'transparent',
                    background: i === activeIndex ? (palette.accentSoft || 'rgba(0,0,0,0.04)') : 'transparent',
                  }}
                >
                  <Editable
                    editable={editable}
                    value={it.title}
                    onChange={(v) => update(it.id, { title: v })}
                    tag="p"
                    block
                    placeholder="Nombre del estilo"
                    style={{ color: i === activeIndex ? accent : palette.ink }}
                    className="font-serif text-lg tracking-wide"
                    maxLength={40}
                  />
                  <Editable
                    editable={editable}
                    value={it.hint}
                    onChange={(v) => update(it.id, { hint: v })}
                    tag="p"
                    block
                    placeholder="Frase corta"
                    style={{ color: palette.inkSoft }}
                    className="text-sm"
                    maxLength={60}
                  />
                  {editable && items.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(it.id);
                      }}
                      aria-label={`Quitar ${it.title}`}
                      className="absolute top-3 right-2 opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: palette.ink }}
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {editable && (
                <button
                  type="button"
                  onClick={add}
                  className="inline-flex items-center gap-1.5 font-mono text-xs uppercase px-3 py-3 border-2 border-dashed mt-2"
                  style={{ borderColor: palette.line, color: palette.inkSoft }}
                >
                  <PlusIcon className="w-3 h-3" /> Agregar
                </button>
              )}
            </div>
          </div>
          <div>
            {imagePanel('aspect-[5/4]')}
            {activeItem && (
              <Editable
                editable={editable}
                value={activeItem.desc}
                onChange={(v) => update(activeItem.id, { desc: v })}
                tag="p"
                block
                multiline
                placeholder="Descripción de este estilo"
                style={{ color: textColor || palette.inkSoft }}
                className="text-sm leading-relaxed mt-5"
                maxLength={220}
              />
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            {eyebrowEl}
            {tituloEl}
          </div>
          <div className="flex flex-wrap gap-2">
            {items.map((it, i) => (
              <div
                key={it.id}
                onClick={() => setActive(i)}
                className="relative cursor-pointer font-mono text-xs uppercase tracking-wide px-3 py-1.5 border transition-colors"
                style={
                  i === activeIndex
                    ? { borderColor: accent, background: accent, color: palette.bg }
                    : { borderColor: palette.line, color: palette.inkSoft }
                }
              >
                <Editable
                  editable={editable}
                  value={it.key}
                  onChange={(v) => update(it.id, { key: v })}
                  tag="span"
                  placeholder="Nombre"
                  maxLength={20}
                />
                {editable && items.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(it.id);
                    }}
                    aria-label={`Quitar serie ${it.key}`}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <XIcon className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
            {editable && (
              <button
                type="button"
                onClick={add}
                className="inline-flex items-center gap-1 font-mono text-xs uppercase px-3 py-1.5 border-2 border-dashed"
                style={{ borderColor: palette.line, color: palette.inkSoft }}
              >
                <PlusIcon className="w-3 h-3" /> Agregar
              </button>
            )}
          </div>
        </Reveal>

        {!activeItem ? (
          <p className="text-sm" style={{ color: palette.inkSoft }}>
            Agregá al menos una serie para mostrar acá.
          </p>
        ) : (
          <div className="grid @lg:grid-cols-[1.35fr_1fr] gap-8 @lg:gap-10 items-stretch">
            {imagePanel('aspect-[4/3]')}
            <div className="flex flex-col justify-center gap-3">
              <Editable
                editable={editable}
                value={activeItem.count}
                onChange={(v) => update(activeItem.id, { count: v })}
                tag="span"
                placeholder="Ej: 24 fotografías"
                style={{ color: accent }}
                className="font-mono text-xs"
                maxLength={30}
              />
              <Editable
                editable={editable}
                value={activeItem.title}
                onChange={(v) => update(activeItem.id, { title: v })}
                tag="h3"
                block
                placeholder="Título de la serie"
                style={{ color: headingColor || palette.ink }}
                className="font-serif text-2xl @lg:text-3xl leading-tight"
                maxLength={60}
              />
              <Editable
                editable={editable}
                value={activeItem.desc}
                onChange={(v) => update(activeItem.id, { desc: v })}
                tag="p"
                block
                multiline
                placeholder="Descripción de esta serie"
                style={{ color: textColor || palette.inkSoft }}
                className="text-sm leading-relaxed"
                maxLength={220}
              />
              <div className="h-px my-1" style={{ background: palette.line }} />
              <div className="flex gap-6 font-mono text-xs" style={{ color: palette.inkSoft }}>
                <div>
                  <div className="mb-1" style={{ color: accent }}>
                    AÑO
                  </div>
                  <Editable
                    editable={editable}
                    value={activeItem.year}
                    onChange={(v) => update(activeItem.id, { year: v })}
                    tag="span"
                    placeholder="2026"
                    maxLength={20}
                  />
                </div>
                <div>
                  <div className="mb-1" style={{ color: accent }}>
                    FORMATO
                  </div>
                  <Editable
                    editable={editable}
                    value={activeItem.format}
                    onChange={(v) => update(activeItem.id, { format: v })}
                    tag="span"
                    placeholder="Digital"
                    maxLength={30}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Grilla de fotos en distintos tamaños (algunas ocupan 2 columnas o 2 filas)
// con un texto que aparece al pasar el mouse — tocar una la abre en pantalla
// completa (lightbox). Pensada para portfolios de fotografía/diseño con
// muchas piezas sueltas, a diferencia de "Galería" (más genérica, sin zoom).
function SeccionArchivo({
  items = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  subtitulo,
  onUpdateSubtitulo,
  editable,
  bgColor,
  headingColor,
  palette = {},
  accent,
}) {
  const [openIndex, setOpenIndex] = useState(null);
  const update = (id, patch) => onUpdate?.(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onUpdate?.(items.filter((it) => it.id !== id));
  const add = () =>
    onUpdate?.([
      ...items,
      { id: `archivo-${Date.now()}`, imagen: '', titulo: 'Nueva foto', meta: '', colSpan: 1, rowSpan: 1 },
    ]);
  const cycleSpan = (it, key) => update(it.id, { [key]: it[key] >= 2 ? 1 : 2 });

  useEffect(() => {
    if (editable || openIndex === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenIndex(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editable, openIndex]);

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto">
        <Reveal className="flex flex-wrap items-baseline justify-between gap-3 mb-8 pb-5 border-b" style={{ borderColor: palette.line }}>
          <Editable
            editable={editable}
            value={titulo ?? 'Archivo'}
            onChange={onUpdateTitulo}
            tag="h2"
            styleKey="archivo.titulo"
            style={{ color: headingColor || palette.ink }}
            className="font-serif text-2xl @lg:text-3xl"
            maxLength={70}
          />
          <Editable
            editable={editable}
            value={subtitulo ?? 'Tocá una imagen para ampliar'}
            onChange={onUpdateSubtitulo}
            tag="span"
            style={{ color: palette.inkSoft }}
            className="font-mono text-xs"
            maxLength={60}
          />
        </Reveal>

        <div className="grid grid-cols-2 @lg:grid-cols-4 auto-rows-[140px] @lg:auto-rows-[190px] gap-3">
          {items.map((it, idx) => (
            <Reveal
              as="div"
              key={it.id}
              delay={Math.min(idx * 0.06, 0.3)}
              className="relative group/archivo overflow-hidden bg-black/5"
              style={{ gridColumn: `span ${it.colSpan || 1}`, gridRow: `span ${it.rowSpan || 1}` }}
            >
              {editable ? (
                <label className="absolute inset-0 cursor-pointer" title="Cambiar foto">
                  {it.imagen ? (
                    <img src={it.imagen} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: palette.inkSoft }}>
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file && (await validateImageFile(file, 'galeria'))) {
                        update(it.id, { imagen: await uploadImage(file) });
                      }
                    }}
                  />
                </label>
              ) : it.imagen ? (
                <button
                  type="button"
                  onClick={() => setOpenIndex(items.indexOf(it))}
                  aria-label={`Ampliar ${it.titulo}`}
                  className="absolute inset-0 cursor-zoom-in"
                >
                  <img
                    src={it.imagen}
                    alt={it.titulo}
                    className="w-full h-full object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover/archivo:scale-[1.07] group-hover/archivo:brightness-110"
                  />
                </button>
              ) : null}
              <div
                className={`absolute inset-0 pointer-events-none flex items-end p-3 transition-opacity ${
                  editable ? 'opacity-100' : 'opacity-0 group-hover/archivo:opacity-100'
                }`}
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent 55%)' }}
              >
                <div className="pointer-events-auto w-full">
                  <Editable
                    editable={editable}
                    value={it.titulo}
                    onChange={(v) => update(it.id, { titulo: v })}
                    tag="p"
                    block
                    placeholder="Nombre de la foto"
                    style={{ color: '#ffffff' }}
                    className="font-serif font-semibold text-sm"
                    maxLength={50}
                  />
                  <Editable
                    editable={editable}
                    value={it.meta}
                    onChange={(v) => update(it.id, { meta: v })}
                    tag="p"
                    block
                    placeholder="Ej: 35mm · 2026"
                    style={{ color: accent }}
                    className="font-mono text-xs"
                    maxLength={30}
                  />
                </div>
              </div>
              {editable && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => cycleSpan(it, 'colSpan')}
                    title="Ancho de esta foto en la grilla"
                    className="w-6 h-6 bg-black/50 text-white flex items-center justify-center text-[10px] font-bold"
                  >
                    ↔
                  </button>
                  <button
                    type="button"
                    onClick={() => cycleSpan(it, 'rowSpan')}
                    title="Alto de esta foto en la grilla"
                    className="w-6 h-6 bg-black/50 text-white flex items-center justify-center text-[10px] font-bold"
                  >
                    ↕
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    aria-label={`Quitar ${it.titulo}`}
                    className="w-6 h-6 bg-black/50 text-white flex items-center justify-center"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </Reveal>
          ))}
          {editable && (
            <button
              type="button"
              onClick={add}
              className="border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-sm font-semibold"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-4 h-4" /> Agregar
            </button>
          )}
        </div>
      </div>

      {!editable && openIndex !== null && items[openIndex] && (
        <div
          onClick={() => setOpenIndex(null)}
          className="fixed inset-0 z-[95] bg-black/95 flex items-center justify-center p-4 @lg:p-12 cursor-zoom-out"
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={items[openIndex].imagen}
              alt={items[openIndex].titulo}
              className="w-full max-h-[76vh] object-contain"
            />
            <div className="flex flex-wrap items-baseline justify-between gap-3 mt-4">
              <p className="font-serif font-semibold text-lg text-white">{items[openIndex].titulo}</p>
              <p className="font-mono text-xs" style={{ color: accent }}>
                {items[openIndex].meta}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Lista con tilde de los barrios/zonas donde trabaja el negocio — para
// oficios y servicios a domicilio que quieren dejar claro, de un vistazo,
// hasta dónde llegan.
function SeccionZonas({
  variant = 'lista',
  zonas = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  eyebrow,
  onUpdateEyebrow,
  editable,
  bgColor,
  textColor,
  headingColor,
  accent,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(zonas.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  const remove = (id) => onUpdate?.(zonas.filter((z) => z.id !== id));
  const add = () => onUpdate?.([...zonas, { id: `zona-${Date.now()}`, nombre: 'Nueva zona' }]);
  const textoSuave = textColor || 'rgba(255,255,255,0.85)';

  const heading = (
    <>
      <Editable
        editable={editable}
        value={eyebrow ?? 'Zonas de cobertura'}
        onChange={onUpdateEyebrow}
        tag="span"
        block
        styleKey="zonas.eyebrow"
        style={{ color: accent }}
        className="font-mono text-xs uppercase tracking-[0.16em] mb-3"
        maxLength={40}
      />
      <Editable
        editable={editable}
        value={titulo ?? 'Llegamos a estos barrios en el día'}
        onChange={onUpdateTitulo}
        tag="h2"
        block
        styleKey="zonas.titulo"
        style={{ color: headingColor || '#ffffff' }}
        className="font-serif text-2xl @lg:text-3xl mb-8 max-w-lg text-balance"
        maxLength={90}
      />
    </>
  );

  // "chips" — barrios como pastillas sueltas (tag cloud), en vez de la
  // grilla prolija con tilde de "lista" — se siente menos a formulario,
  // mejor cuando son muchas zonas con nombres de largo parejo.
  if (variant === 'chips') {
    return (
      <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.ink }}>
        <div className="max-w-5xl mx-auto">
          {heading}
          <div className="flex flex-wrap gap-2.5">
            {zonas.map((z) => (
              <div
                key={z.id}
                className="relative inline-flex items-center gap-1.5 border rounded-full pl-3.5 pr-3 py-1.5"
                style={{ borderColor: accent || 'rgba(255,255,255,0.3)' }}
              >
                <Editable
                  editable={editable}
                  value={z.nombre}
                  onChange={(v) => update(z.id, { nombre: v })}
                  tag="span"
                  styleKey={`zona.${z.id}.nombre`}
                  placeholder="Barrio o zona"
                  style={{ color: textoSuave }}
                  className="text-sm"
                  maxLength={30}
                />
                {editable && (
                  <button
                    type="button"
                    onClick={() => remove(z.id)}
                    aria-label={`Quitar ${z.nombre}`}
                    className="opacity-40 hover:opacity-100 transition-opacity"
                    style={{ color: textoSuave }}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {editable && (
              <button
                type="button"
                onClick={add}
                className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border-2 border-dashed px-3.5 py-1.5"
                style={{ borderColor: 'rgba(255,255,255,0.25)', color: textoSuave }}
              >
                <PlusIcon className="w-3.5 h-3.5" /> Agregar
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // "lista" (default): grilla prolija con tilde de check.
  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.ink }}>
      <div className="max-w-5xl mx-auto">
        {heading}
        <div className="grid grid-cols-2 @lg:grid-cols-5 gap-x-6 gap-y-3">
          {zonas.map((z) => (
            <div key={z.id} className="relative flex items-center gap-2">
              <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
              <Editable
                editable={editable}
                value={z.nombre}
                onChange={(v) => update(z.id, { nombre: v })}
                tag="span"
                styleKey={`zona.${z.id}.nombre`}
                placeholder="Barrio o zona"
                style={{ color: textoSuave }}
                className="text-sm"
                maxLength={30}
              />
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(z.id)}
                  aria-label={`Quitar ${z.nombre}`}
                  className="opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: textoSuave }}
                >
                  <XIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {editable && (
            <button
              type="button"
              onClick={add}
              className="inline-flex items-center gap-1.5 text-xs font-semibold border-2 border-dashed px-2.5 py-1.5"
              style={{ borderColor: 'rgba(255,255,255,0.25)', color: textoSuave }}
            >
              <PlusIcon className="w-3.5 h-3.5" /> Agregar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// Fila de fotos con un nombre corto cada una, para navegar por categoría,
// ocasión o tipo (ej. "¿para qué momento es tu regalo?") — con scroll
// horizontal si no entran todas, foto + una sola línea de texto abajo.
function SeccionCategorias({
  categorias = [],
  onUpdate,
  titulo,
  onUpdateTitulo,
  editable,
  bgColor,
  headingColor,
  palette = {},
}) {
  const update = (id, patch) => onUpdate?.(categorias.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id) => onUpdate?.(categorias.filter((c) => c.id !== id));
  const addSlide = async (file) => {
    if (!(await validateImageFile(file, 'galeria'))) return;
    const img = await uploadImage(file);
    onUpdate?.([...categorias, { id: `categoria-${Date.now()}`, img, label: 'Categoría' }]);
  };

  return (
    <section className="py-10 @lg:py-14 border-y" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
      <div className="max-w-6xl mx-auto px-6 @lg:px-10 mb-6">
        <Editable
          editable={editable}
          value={titulo ?? '¿Qué estás buscando?'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="categorias.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif italic text-2xl @lg:text-3xl"
          maxLength={70}
        />
      </div>
      {categorias.length === 0 && !editable ? null : (
        <div className="flex gap-4 overflow-x-auto px-6 @lg:px-10 pb-2">
          {categorias.map((c) => (
            <div key={c.id} className="relative shrink-0 w-36 @lg:w-40 aspect-[3/4] group/cat">
              <label className={`absolute inset-0 overflow-hidden block ${editable ? 'cursor-pointer' : ''}`}>
                {c.img ? (
                  <img src={c.img} alt={c.label || ''} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.05)', color: palette.inkSoft }}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                {editable && (
                  <span className="absolute inset-0 bg-black/0 group-hover/cat:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/cat:opacity-100">
                    <span className="text-white text-xs font-semibold">Cambiar foto</span>
                  </span>
                )}
                {editable && (
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      if (!(await validateImageFile(file, 'galeria'))) return;
                      update(c.id, { img: await uploadImage(file) });
                    }}
                  />
                )}
              </label>
              <div
                className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}
              />
              <div className="absolute left-3 bottom-2.5 right-3">
                <Editable
                  editable={editable}
                  value={c.label}
                  onChange={(v) => update(c.id, { label: v })}
                  tag="span"
                  placeholder="Nombre"
                  maxLength={30}
                  style={{ color: '#ffffff' }}
                  className="font-serif italic text-base"
                />
              </div>
              {editable && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label={`Quitar ${c.label}`}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/cat:opacity-100 transition-opacity"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {editable && (
            <label
              className="shrink-0 w-36 @lg:w-40 aspect-[3/4] border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-4 h-4" />
              <span className="text-xs font-semibold">Agregar</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) await addSlide(file);
                }}
              />
            </label>
          )}
        </div>
      )}
    </section>
  );
}

function SeccionMenu({
  menuItems = [],
  editable = false,
  bgColor,
  headingColor,
  accent,
  palette = {},
  titulo,
  onUpdateTitulo,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onDuplicateItem,
  onToggleOcultoItem,
}) {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    onAddItem?.({ nombre, categoria: categoria.trim() || 'General', descripcion: '', precio: 0 });
    setNombre('');
  };

  const categorias = [...new Set(menuItems.map((i) => i.categoria || 'General'))];

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-2xl mx-auto pb-6 mb-8 border-b" style={{ borderColor: palette.line }}>
        <Editable
          editable={editable}
          value={titulo ?? 'Nuestro menú'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="menu.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif italic text-2xl @lg:text-3xl"
          maxLength={70}
        />
      </div>
      {menuItems.length === 0 && !editable ? (
        <p className="text-center text-sm max-w-sm mx-auto" style={{ color: palette.inkSoft }}>
          Todavía no cargaste tu menú.
        </p>
      ) : (
        <div className="max-w-2xl mx-auto space-y-8">
          {categorias.map((cat) => (
            <div key={cat}>
              <h3
                className="font-mono text-xs uppercase tracking-wide mb-3 pb-2 border-b"
                style={{ color: accent, borderColor: palette.line }}
              >
                {cat}
              </h3>
              <div className="space-y-4">
                {menuItems
                  .filter((i) => (i.categoria || 'General') === cat)
                  .filter((i) => editable || !i.oculto)
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start justify-between gap-3 ${item.oculto ? 'opacity-40' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <Editable
                          editable={editable}
                          value={item.nombre}
                          onChange={(v) => onUpdateItem?.(item.id, { nombre: v })}
                          tag="p"
                          block
                          styleKey={`menu.${item.id}.nombre`}
                          placeholder="Nombre del plato"
                          style={{ color: palette.ink }}
                          className="font-serif text-lg"
                          maxLength={60}
                        />
                        <Editable
                          editable={editable}
                          value={item.descripcion}
                          onChange={(v) => onUpdateItem?.(item.id, { descripcion: v })}
                          tag="p"
                          block
                          multiline
                          styleKey={`menu.${item.id}.descripcion`}
                          placeholder="Descripción (opcional)"
                          style={{ color: palette.inkSoft }}
                          className="text-sm"
                          maxLength={140}
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Editable
                          editable={editable}
                          value={item.precio}
                          onChange={(v) => onUpdateItem?.(item.id, { precio: Number(v) || 0 })}
                          tag="p"
                          type="number"
                          styleKey={`menu.${item.id}.precio`}
                          format={(v) => `$${Number(v || 0).toLocaleString('es-AR')}`}
                          style={{ color: palette.ink }}
                          className="font-mono font-bold"
                        />
                        {editable && (
                          <ItemToolbar
                            variant="inline"
                            color={palette.ink}
                            oculto={item.oculto}
                            onDuplicate={() => onDuplicateItem?.(item.id)}
                            onToggleOculto={() => onToggleOcultoItem?.(item.id)}
                            onRemove={() => onRemoveItem?.(item.id)}
                            removeLabel={`Quitar ${item.nombre}`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {editable && (
        <form
          onSubmit={submit}
          className="max-w-2xl mx-auto mt-6 border-2 border-dashed p-4 flex flex-col @lg:flex-row gap-2"
          style={{ borderColor: palette.line }}
        >
          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Categoría (ej: Entradas)"
            className="flex-1 border px-3 py-2 text-sm outline-none"
            style={{ borderColor: palette.line }}
          />
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del plato"
            className="flex-1 border px-3 py-2 text-sm outline-none"
            style={{ borderColor: palette.line }}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 text-white shrink-0"
            style={{ background: palette.inkHex || '#171717' }}
          >
            <PlusIcon className="w-3.5 h-3.5" /> Agregar
          </button>
        </form>
      )}
    </section>
  );
}

function SeccionMarcas({
  marcas = [],
  editable = false,
  bgColor,
  headingColor,
  palette = {},
  titulo,
  onUpdateTitulo,
  onAddLogos,
  onRemoveLogo,
  onDuplicateLogo,
  onToggleOcultoLogo,
}) {
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const ok = await validateImageFiles(files, 'marcas');
    if (ok.length) onAddLogos?.(await Promise.all(ok.map(uploadImage)));
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <Editable
        editable={editable}
        value={titulo ?? 'Trabajamos con'}
        onChange={onUpdateTitulo}
        tag="h2"
        styleKey="marcas.titulo"
        style={{ color: headingColor || palette.ink }}
        className="font-serif italic text-2xl text-center mb-8"
        maxLength={70}
      />
      {marcas.length === 0 && !editable ? null : (
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-6 @lg:gap-10">
          {(editable ? marcas : marcas.filter((m) => !m.oculto)).map((m) => (
            <div key={m.id} className={`relative group/logo ${m.oculto ? 'opacity-40' : ''}`}>
              <img
                src={m.imagen}
                alt=""
                className="h-10 @lg:h-12 w-auto object-contain grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all"
              />
              {editable && (
                <div className="absolute -top-2 -right-2 opacity-0 group-hover/logo:opacity-100 transition-opacity">
                  <ItemToolbar
                    variant="overlay"
                    oculto={m.oculto}
                    onDuplicate={() => onDuplicateLogo?.(m.id)}
                    onToggleOculto={() => onToggleOcultoLogo?.(m.id)}
                    onRemove={() => onRemoveLogo?.(m.id)}
                    removeLabel="Quitar logo"
                  />
                </div>
              )}
            </div>
          ))}
          {editable && (
            <label
              className="flex flex-col items-center justify-center gap-1 w-20 h-12 border-2 border-dashed cursor-pointer transition-colors"
              style={{ borderColor: palette.line, color: palette.inkSoft }}
            >
              <PlusIcon className="w-4 h-4" />
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </label>
          )}
        </div>
      )}
    </section>
  );
}

// Tres columnas: datos de contacto (lista editable de filas label/valor),
// suscripción al boletín (mail + botón, con estado de "ya te anotaste" —
// ephemeral, sin backend real) y un mapa simulado — a diferencia de
// "Contacto" (que es 2 columnas datos+mapa), acá suma la columna del
// boletín en el medio, tal como en el original.
function SeccionVisitanosBoletin({
  filas = [],
  onUpdateFilas,
  eyebrowContacto,
  onUpdateEyebrowContacto,
  eyebrowBoletin,
  onUpdateEyebrowBoletin,
  descripcionBoletin,
  onUpdateDescripcionBoletin,
  mensajeSuscripto,
  onUpdateMensajeSuscripto,
  editable,
  bgColor,
  accent,
  palette = {},
}) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const updateFila = (id, patch) => onUpdateFilas?.(filas.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const removeFila = (id) => onUpdateFilas?.(filas.filter((f) => f.id !== id));
  const addFila = () => onUpdateFilas?.([...filas, { id: `fila-${Date.now()}`, label: 'Dato', valor: 'Valor' }]);

  const suscribir = () => {
    if (email.trim().includes('@')) setDone(true);
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20 border-t" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
      <div className="max-w-5xl mx-auto grid @sm:grid-cols-2 @lg:grid-cols-3 gap-10 @lg:gap-12">
        <Reveal>
          <Editable
            editable={editable}
            value={eyebrowContacto}
            onChange={onUpdateEyebrowContacto}
            tag="div"
            block
            styleKey="visitanosboletin.eyebrowContacto"
            placeholder="Visitanos"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.14em] mb-4"
            maxLength={40}
          />
          <div className="flex flex-col gap-4.5">
            {filas.map((f) => (
              <div key={f.id} className="relative">
                {editable && (
                  <button
                    type="button"
                    onClick={() => removeFila(f.id)}
                    aria-label="Quitar"
                    className="absolute -top-1 -right-1 opacity-40 hover:opacity-100"
                    style={{ color: palette.ink }}
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
                <Editable
                  editable={editable}
                  value={f.label}
                  onChange={(v) => updateFila(f.id, { label: v })}
                  tag="div"
                  placeholder="Dato"
                  style={{ color: palette.inkSoft }}
                  className="font-mono text-[10px] uppercase tracking-wide mb-1"
                  maxLength={30}
                />
                <Editable
                  editable={editable}
                  value={f.valor}
                  onChange={(v) => updateFila(f.id, { valor: v })}
                  tag="div"
                  block
                  placeholder="Valor"
                  style={{ color: palette.ink }}
                  className="text-[15px]"
                  maxLength={80}
                />
              </div>
            ))}
            {editable && (
              <button
                type="button"
                onClick={addFila}
                className="text-xs font-semibold underline decoration-dotted self-start"
                style={{ color: palette.inkSoft }}
              >
                + Agregar dato
              </button>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <Editable
            editable={editable}
            value={eyebrowBoletin}
            onChange={onUpdateEyebrowBoletin}
            tag="div"
            block
            styleKey="visitanosboletin.eyebrowBoletin"
            placeholder="Boletín de novedades"
            style={{ color: accent }}
            className="font-mono text-xs uppercase tracking-[0.14em] mb-4"
            maxLength={40}
          />
          <Editable
            editable={editable}
            value={descripcionBoletin}
            onChange={onUpdateDescripcionBoletin}
            tag="p"
            block
            multiline
            placeholder="Descripción breve del boletín"
            style={{ color: palette.inkSoft }}
            className="text-sm leading-relaxed mb-4.5"
            maxLength={160}
          />
          {done ? (
            <div className="font-mono text-sm" style={{ color: '#3f6b6b' }}>
              ✓ {mensajeSuscripto || 'Anotado. Te escribimos el primer lunes del mes.'}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="flex-1 min-w-0 border px-3.5 py-2.5 text-sm outline-none"
                style={{ borderColor: palette.line, background: palette.bg, color: palette.ink }}
              />
              <button
                type="button"
                onClick={suscribir}
                className="shrink-0 px-4 text-sm whitespace-nowrap"
                style={{ background: palette.ink, color: palette.bg }}
              >
                Suscribirme
              </button>
            </div>
          )}
          {editable && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: palette.line }}>
              <label className="block text-[11px] font-mono uppercase tracking-wide mb-1.5" style={{ color: palette.inkSoft }}>
                Mensaje al suscribirse
              </label>
              <input
                value={mensajeSuscripto || ''}
                onChange={(e) => onUpdateMensajeSuscripto?.(e.target.value)}
                className="w-full border px-2.5 py-2 text-xs"
                style={{ borderColor: palette.line, color: palette.ink }}
              />
            </div>
          )}
        </Reveal>
        <Reveal
          delay={0.2}
          className="min-h-[180px] flex items-center justify-center border"
          style={{ background: palette.line + '40', borderColor: palette.line }}
        >
          <span className="font-mono text-xs uppercase" style={{ color: palette.inkSoft }}>
            Mapa (simulado)
          </span>
        </Reveal>
      </div>
    </section>
  );
}

function SeccionMapa({ direccion, editable, bgColor, headingColor, textColor, palette = {}, titulo, onUpdateTitulo, onUpdateDireccion }) {
  return (
    <section className="relative px-6 @lg:px-10 py-14 @lg:py-20 border-t" style={{ background: bgColor || palette.bg, borderColor: palette.line }}>
      <div className="max-w-4xl mx-auto">
        <Editable
          editable={editable}
          value={titulo ?? 'Dónde estamos'}
          onChange={onUpdateTitulo}
          tag="span"
          styleKey="mapa.titulo"
          style={{ color: headingColor || palette.inkSoft }}
          className="font-mono text-xs uppercase tracking-[0.16em] block mb-3"
          maxLength={70}
        />
        <Editable
          editable={editable}
          value={direccion}
          onChange={onUpdateDireccion}
          tag="p"
          block
          placeholder="Tu dirección"
          styleKey="mapa.direccion"
          style={{ color: textColor || palette.ink }}
          className="font-serif italic text-2xl @lg:text-3xl mb-6"
          maxLength={120}
        />
        <div className="relative aspect-[16/7] flex items-center justify-center overflow-hidden" style={{ background: palette.line }}>
          <span className="font-mono text-xs uppercase" style={{ color: palette.inkSoft }}>
            Mapa (simulado)
          </span>
        </div>
      </div>
    </section>
  );
}

// Convierte un link de YouTube/Vimeo a su URL de embed — si no matchea
// ninguno de los dos, se asume que es una foto y se descarta como video.
const toEmbedUrl = (url) => {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
};

function SeccionBlog({
  posts = [],
  variant = 'grid',
  editable = false,
  bgColor,
  headingColor,
  palette = {},
  titulo,
  onUpdateTitulo,
  onAddPost,
  onRemovePost,
  onUpdatePost,
  onDuplicatePost,
  onMovePost,
  onToggleOcultoPost,
}) {
  const [tituloDraft, setTituloDraft] = useState('');

  const handleImagen = (id) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (await validateImageFile(file, 'blog')) onUpdatePost?.(id, { imagen: await uploadImage(file), videoUrl: '' });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!tituloDraft.trim()) return;
    onAddPost?.({ titulo: tituloDraft, resumen: '', imagen: '', videoUrl: '' });
    setTituloDraft('');
  };

  const Card = ({ post, canMoveUp, canMoveDown }) => {
    const embed = toEmbedUrl(post.videoUrl);
    return (
      <div className={`relative flex flex-col text-left ${post.oculto ? 'opacity-40' : ''}`}>
        {editable && (
          <div className="absolute top-2 right-2 z-10">
            <ItemToolbar
              variant="overlay"
              oculto={post.oculto}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              onMoveUp={() => onMovePost?.(post.id, -1)}
              onMoveDown={() => onMovePost?.(post.id, 1)}
              onDuplicate={() => onDuplicatePost?.(post.id)}
              onToggleOculto={() => onToggleOcultoPost?.(post.id)}
              onRemove={() => onRemovePost?.(post.id)}
              removeLabel={`Quitar ${post.titulo}`}
            />
          </div>
        )}
        <div className="relative aspect-video bg-black/5">
          {embed ? (
            <iframe src={embed} title={post.titulo} className="w-full h-full" allowFullScreen />
          ) : post.imagen ? (
            <img
              src={post.imagen}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'grayscale(0.15) contrast(1.05)' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: palette.inkSoft }}>
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
          {editable && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <label className="text-[11px] font-semibold bg-black/60 text-white px-2.5 py-1 cursor-pointer hover:bg-black/80 transition-colors">
                Foto
                <input type="file" accept="image/*" className="hidden" onChange={handleImagen(post.id)} />
              </label>
              <button
                type="button"
                onClick={() => {
                  const url = window.prompt('Enlace de YouTube o Vimeo:', post.videoUrl || '');
                  if (url !== null) onUpdatePost?.(post.id, { videoUrl: url.trim(), imagen: url.trim() ? '' : post.imagen });
                }}
                className="text-[11px] font-semibold bg-black/60 text-white px-2.5 py-1 hover:bg-black/80 transition-colors"
              >
                Video
              </button>
            </div>
          )}
        </div>
        <div className="pt-4">
          <Editable
            editable={editable}
            value={post.titulo}
            onChange={(v) => onUpdatePost?.(post.id, { titulo: v })}
            tag="p"
            block
            styleKey={`post.${post.id}.titulo`}
            placeholder="Título"
            style={{ color: palette.ink }}
            className="font-serif text-xl mb-1"
            maxLength={80}
          />
          <Editable
            editable={editable}
            value={post.resumen}
            onChange={(v) => onUpdatePost?.(post.id, { resumen: v })}
            tag="p"
            block
            multiline
            styleKey={`post.${post.id}.resumen`}
            placeholder="Resumen"
            style={{ color: palette.inkSoft }}
            className="text-sm"
            maxLength={220}
          />
        </div>
      </div>
    );
  };

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto pb-6 mb-10 border-b" style={{ borderColor: palette.line }}>
        <Editable
          editable={editable}
          value={titulo ?? 'Novedades'}
          onChange={onUpdateTitulo}
          tag="h2"
          styleKey="blog.titulo"
          style={{ color: headingColor || palette.ink }}
          className="font-serif italic text-2xl @lg:text-3xl"
          maxLength={70}
        />
      </div>
      {posts.length === 0 && !editable ? (
        <p className="text-center text-sm max-w-sm mx-auto" style={{ color: palette.inkSoft }}>
          Todavía no publicaste novedades.
        </p>
      ) : (
        <div className={`max-w-5xl mx-auto grid gap-8 ${variant === 'lista' ? 'grid-cols-1 max-w-2xl' : '@lg:grid-cols-3'}`}>
          {(editable ? posts : posts.filter((p) => !p.oculto)).map((post, i, arr) => (
            <Card key={post.id} post={post} canMoveUp={i > 0} canMoveDown={i < arr.length - 1} />
          ))}
        </div>
      )}
      {editable && (
        <form className="max-w-5xl mx-auto mt-5 flex gap-2" onSubmit={submit}>
          <input
            value={tituloDraft}
            onChange={(e) => setTituloDraft(e.target.value)}
            placeholder="Título de la novedad"
            className="flex-1 border px-3 py-2 text-sm outline-none"
            style={{ borderColor: palette.line }}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2 px-4 text-white shrink-0"
            style={{ background: palette.inkHex || '#171717' }}
          >
            <PlusIcon className="w-3.5 h-3.5" /> Agregar
          </button>
        </form>
      )}
    </section>
  );
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function WhatsAppIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 004.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.11h-.01a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.17 8.17 0 01-1.26-4.36c0-4.52 3.68-8.2 8.26-8.2 2.21 0 4.28.86 5.84 2.42a8.15 8.15 0 012.42 5.8c0 4.52-3.68 8.22-8.26 8.22z" />
    </svg>
  );
}
