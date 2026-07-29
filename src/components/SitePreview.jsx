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
} from './icons';
import {
  SECCIONES_CATALOGO,
  SECCIONES_UNICAS,
  SECTION_VARIANTS,
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
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
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
                nombreNegocio={nombreNegocio}
                whatsapp={whatsapp}
                seccionesDisponibles={sections
                  .filter((s) => s.id !== sec.id)
                  .map((s) => ({ id: s.id, label: seccionLabelConNumero(sections, s) }))}
                cartEnabled={widgets.carrito === true}
                onAddToCart={cart.addItem}
                disclaimer={sec.disclaimer}
                onUpdateDisclaimer={(v) => onSetSectionStyle?.(sec.id, { disclaimer: v })}
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
function TextStyleToolbar({ styleKey, anchorRef }) {
  const { textStyles, onSetTextStyle } = useContext(TextStyleCtx);
  const current = textStyles[styleKey] || {};
  const [iconOpen, setIconOpen] = useState(false);
  const toolbarRef = useRef(null);
  const [posStyle, setPosStyle] = useState({ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden' });

  useLayoutEffect(() => {
    const anchor = anchorRef?.current;
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
  }, [anchorRef]);
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
  const editAnchorRef = useRef(null);
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
      <span ref={editAnchorRef} className="relative block w-full">
        {styleKey && <TextStyleToolbar styleKey={styleKey} anchorRef={editAnchorRef} />}
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
      className="relative flex items-center justify-between gap-4 px-6 @lg:px-10 py-4 border-b"
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
function HeroOfertasPanel({ ofertas = [], onUpdate, editable, accent, palette = {}, bgColor }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [editIndex, setEditIndex] = useState(0);

  useEffect(() => {
    if (editable || ofertas.length <= 1) return undefined;
    const t = setInterval(() => setActiveIndex((i) => (i + 1) % ofertas.length), 2600);
    return () => clearInterval(t);
  }, [editable, ofertas.length]);

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
    return (
      <div className="relative aspect-[4/5] overflow-hidden" style={{ background: bgColor || palette.bg }}>
        {ofertas.map((o, i) => (
          <div
            key={o.id}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === activeIndex ? 1 : 0 }}
          >
            {o.img && <img src={o.img} alt={o.nombre || ''} className="w-full h-full object-contain p-6" />}
            {o.badge && (
              <span
                className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ background: accent }}
              >
                {o.badge}
              </span>
            )}
            {(o.nombre || o.precio) && (
              <div className="absolute bottom-3 right-3 text-right">
                {o.nombre && (
                  <div className="font-serif text-lg" style={{ color: palette.ink }}>
                    {o.nombre}
                  </div>
                )}
                {o.precio && (
                  <div className="font-mono font-bold" style={{ color: accent }}>
                    {o.precio}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {ofertas.length > 1 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {ofertas.map((_, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: i === activeIndex ? accent : 'rgba(255,255,255,0.6)' }}
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
          </div>
          <HeroOfertasPanel
            ofertas={heroOfertas}
            onUpdate={onUpdateHeroOfertas}
            editable={editable}
            accent={accent}
            palette={palette}
            bgColor={bgColor}
          />
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
  bgColor,
  textColor,
  editable,
  palette = {},
  botones: botonesData = {},
  onUpdateBotones,
  bajada,
  onUpdateBajada,
  seccionesDisponibles = [],
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
  nombreNegocio,
  whatsapp,
  seccionesDisponibles = [],
  cartEnabled = false,
  onAddToCart,
  disclaimer,
  onUpdateDisclaimer,
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
  const productosFiltrados =
    categoriaFiltro === 'Todos' ? productos : productos.filter((p) => p.categoria === categoriaFiltro);

  return (
    <section className="px-6 @lg:px-10 py-14 @lg:py-20" style={{ background: bgColor || palette.bg }}>
      <div className="max-w-5xl mx-auto flex items-baseline justify-between gap-3 mb-8 pb-5 border-b" style={{ borderColor: palette.line }}>
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
          {productos.map((p, i) => (
            <div
              key={p.id}
              className={`relative overflow-hidden group/bento ${
                i === 0 ? 'col-span-2 row-span-2' : ''
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
                <button
                  type="button"
                  onClick={() => onRemoveProducto?.(p.id)}
                  aria-label={`Quitar ${p.nombre}`}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/bento:opacity-100 transition-opacity"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
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
          {productos.map((p) => (
            <div key={p.id} className="flex items-center gap-5 py-5 border-b" style={{ borderColor: palette.line }}>
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
                  <button
                    type="button"
                    onClick={() => onRemoveProducto?.(p.id)}
                    aria-label={`Quitar ${p.nombre}`}
                    className="opacity-40 hover:opacity-100 transition-opacity"
                    style={{ color: palette.ink }}
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
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
          {productos.map((p) => (
            <div key={p.id} className="relative border-r border-b pr-7 pb-7 mr-7 mb-7" style={{ borderColor: palette.line }}>
              {editable && (
                <button
                  type="button"
                  onClick={() => onRemoveProducto?.(p.id)}
                  aria-label={`Quitar ${p.nombre}`}
                  className="absolute top-0 right-0 opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-4 h-4" />
                </button>
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
          {productos.map((p) => (
            <div key={p.id} className="relative border p-5 flex flex-col gap-1" style={{ borderColor: palette.line }}>
              {editable && (
                <button
                  type="button"
                  onClick={() => onRemoveProducto?.(p.id)}
                  aria-label={`Quitar ${p.nombre}`}
                  className="absolute top-2 right-2 opacity-40 hover:opacity-100 transition-opacity"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
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
            {productosFiltrados.map((p) => (
              <div key={p.id} className="relative flex flex-col text-left">
                {editable && (
                  <button
                    type="button"
                    onClick={() => onRemoveProducto?.(p.id)}
                    aria-label={`Quitar ${p.nombre}`}
                    className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/50 text-white flex items-center justify-center hover:bg-red-500/80 transition-colors"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
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
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateProducto?.(p.id, { disponible: p.disponible === undefined ? true : p.disponible ? false : undefined })
                    }
                    className="text-[10px] underline decoration-dotted opacity-60 hover:opacity-100 transition-opacity mb-1 self-start"
                  >
                    {p.disponible === undefined ? 'Agregar estado' : p.disponible ? 'Disponible → Reservado' : 'Quitar estado'}
                  </button>
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
            {productos.map((p) => {
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
                  }`}
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
                      <button
                        type="button"
                        onClick={() => onRemoveProducto?.(p.id)}
                        aria-label={`Quitar ${p.nombre}`}
                        className="opacity-40 hover:opacity-100 transition-opacity"
                        style={{ color: palette.ink }}
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
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
          {productos.map((p) => (
            <div key={p.id} className="relative border flex flex-col text-left" style={{ borderColor: palette.line }}>
              {editable && (
                <button
                  type="button"
                  onClick={() => onRemoveProducto?.(p.id)}
                  aria-label={`Quitar ${p.nombre}`}
                  className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/50 text-white flex items-center justify-center hover:bg-red-500/80 transition-colors"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
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

// Una reseña: nombre, foto, estrellas y comentario editables ahí mismo, con el
// badge de "verificada" cuando vino de la conexión con Google/Facebook.
// Iniciales en badge cuadrado (nunca foto de avatar) — coherente con el resto
// del sistema (logo, equipo): la marca no muestra fotos de perfil de terceros.
function TestimonioCard({ t, editable, onUpdate, onRemove, accent, palette = {} }) {
  return (
    <div className="relative border p-6 text-left h-full flex flex-col" style={{ borderColor: palette.line }}>
      {editable && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar testimonio de ${t.nombre}`}
          className="absolute top-3 right-3 opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: palette.ink }}
        >
          <XIcon className="w-4 h-4" />
        </button>
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
            {testimonios.map((t) => (
              <div key={t.id} className="shrink-0 snap-start w-[280px]">
                <TestimonioCard
                  t={t}
                  editable={editable}
                  accent={accent}
                  palette={palette}
                  onUpdate={(patch) => onUpdateTestimonio?.(t.id, patch)}
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
          {testimonios.map((t) => (
            <TestimonioCard
              key={t.id}
              t={t}
              editable={editable}
              accent={accent}
              palette={palette}
              onUpdate={(patch) => onUpdateTestimonio?.(t.id, patch)}
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
function FAQList({ faqs, accent, palette = {}, editable, onAddFAQ, onRemoveFAQ, onUpdateFAQ }) {
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
        {faqs.map((item) => {
          const isOpen = editable || openId === item.id;
          const Row = editable ? 'div' : 'button';
          return (
            <div key={item.id} className="relative group/faq-item border-b" style={{ borderColor: palette.line }}>
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
                <button
                  type="button"
                  onClick={() => onRemoveFAQ?.(item.id)}
                  aria-label="Quitar pregunta"
                  className="absolute top-4 right-0 opacity-0 group-hover/faq-item:opacity-100 transition-opacity"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-4 h-4" />
                </button>
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
  onAddFaqImagenes,
  onRemoveFaqImagen,
  onReplaceFaqImagen,
  mediaVariant,
  onChangeMediaVariant,
}) {
  const listProps = { faqs, accent, palette, editable, onAddFAQ, onRemoveFAQ, onUpdateFAQ };
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
          {planes.map((p) => (
            <div
              key={p.id}
              className="relative border p-7 text-left flex flex-col gap-4"
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
                  <button
                    type="button"
                    onClick={() => onRemovePlan?.(p.id)}
                    aria-label={`Quitar ${p.nombre}`}
                    className="w-6 h-6 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                    style={{ color: palette.ink }}
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
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

  const Card = ({ m }) => (
    <div className="relative text-left border-t-2 pt-4" style={{ borderColor: accent }}>
      {editable && (
        <button
          type="button"
          onClick={() => onRemoveMember?.(m.id)}
          aria-label={`Quitar ${m.nombre}`}
          className="absolute top-4 right-0 opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: palette.ink }}
        >
          <XIcon className="w-4 h-4" />
        </button>
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
          {equipo.map((m) => (
            <div key={m.id} className="relative text-left border-t-2 pt-4" style={{ borderColor: accent }}>
              {editable && (
                <button
                  type="button"
                  onClick={() => onRemoveMember?.(m.id)}
                  aria-label={`Quitar ${m.nombre}`}
                  className="absolute top-4 right-0 opacity-40 hover:opacity-100 transition-opacity z-10"
                  style={{ color: palette.ink }}
                >
                  <XIcon className="w-4 h-4" />
                </button>
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
          {equipo.map((m) => (
            <Card key={m.id} m={m} />
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
function SeccionMarquee({ mensajes = [], onUpdate, editable, bgColor, textColor, palette = {}, separador = '·', velocidad }) {
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
            className="font-serif text-base font-semibold px-8 whitespace-nowrap shrink-0"
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
                  .map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3">
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
                          <button
                            type="button"
                            onClick={() => onRemoveItem?.(item.id)}
                            aria-label={`Quitar ${item.nombre}`}
                            className="opacity-40 hover:opacity-100 transition-opacity"
                            style={{ color: palette.ink }}
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
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

function SeccionMarcas({ marcas = [], editable = false, bgColor, headingColor, palette = {}, titulo, onUpdateTitulo, onAddLogos, onRemoveLogo }) {
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
          {marcas.map((m) => (
            <div key={m.id} className="relative group/logo">
              <img
                src={m.imagen}
                alt=""
                className="h-10 @lg:h-12 w-auto object-contain grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all"
              />
              {editable && (
                <button
                  type="button"
                  onClick={() => onRemoveLogo?.(m.id)}
                  aria-label="Quitar logo"
                  className="absolute -top-2 -right-2 w-5 h-5 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity"
                >
                  <XIcon className="w-3 h-3" />
                </button>
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

  const Card = ({ post }) => {
    const embed = toEmbedUrl(post.videoUrl);
    return (
      <div className="relative flex flex-col text-left">
        {editable && (
          <button
            type="button"
            onClick={() => onRemovePost?.(post.id)}
            aria-label={`Quitar ${post.titulo}`}
            className="absolute top-2 right-2 z-10 w-6 h-6 bg-black/50 text-white flex items-center justify-center hover:bg-red-500/80 transition-colors"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
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
          {posts.map((post) => (
            <Card key={post.id} post={post} />
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
