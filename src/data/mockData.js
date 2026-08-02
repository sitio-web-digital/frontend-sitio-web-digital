// Datos de ejemplo hardcodeados para el prototipo. Nada de esto viene de una API real.

// Fuentes seleccionables por texto en el editor — todas de Google Fonts (de uso
// libre, sin costo de licencia), cargadas en src/index.css.
export const FONT_OPTIONS = [
  { id: 'inter', label: 'Moderna', family: '"Inter", system-ui, sans-serif' },
  { id: 'sora', label: 'Audaz', family: '"Sora", system-ui, sans-serif' },
  { id: 'poppins', label: 'Amigable', family: '"Poppins", system-ui, sans-serif' },
  { id: 'playfair', label: 'Elegante', family: '"Playfair Display", Georgia, serif' },
  { id: 'merriweather', label: 'Clásica', family: '"Merriweather", Georgia, serif' },
  { id: 'space-mono', label: 'Técnica', family: '"Space Mono", monospace' },
  { id: 'caveat', label: 'Manuscrita', family: '"Caveat", cursive' },
  { id: 'anton', label: 'Impacto', family: '"Anton", sans-serif' },
  { id: 'cormorant', label: 'Editorial itálica', family: '"Cormorant Garamond", Georgia, serif' },
  { id: 'dm-serif', label: 'Salón elegante', family: '"DM Serif Display", Georgia, serif' },
  { id: 'newsreader', label: 'Estudio clásico', family: '"Newsreader", Georgia, serif' },
  { id: 'parisienne', label: 'Caligráfica', family: '"Parisienne", cursive' },
];

// Íconos seleccionables para FAQ, testimonios y los datos de "Sobre nosotros" —
// son los mismos SVG propios que ya usa el resto del sitio (dibujados a mano,
// sin ningún ícono de terceros ni de fuente con copyright).
export const ICON_LIBRARY = [
  { id: 'star', label: 'Estrella' },
  { id: 'heart', label: 'Corazón' },
  { id: 'check', label: 'Check' },
  { id: 'clock', label: 'Reloj' },
  { id: 'pin', label: 'Ubicación' },
  { id: 'phone', label: 'Teléfono' },
  { id: 'tag', label: 'Etiqueta' },
  { id: 'spark', label: 'Destello' },
  { id: 'compass', label: 'Brújula' },
  { id: 'rocket', label: 'Cohete' },
  { id: 'fork', label: 'Cubiertos' },
  { id: 'scissors', label: 'Tijera' },
  { id: 'wrench', label: 'Llave' },
  { id: 'bag', label: 'Bolsa' },
  { id: 'trend', label: 'Tendencia' },
  { id: 'lock', label: 'Candado' },
];

export const RUBROS = [
  { id: 'gastronomia', label: 'Gastronomía', icon: '🍽️' },
  { id: 'belleza', label: 'Belleza y estética', icon: '💇‍♀️' },
  { id: 'oficios', label: 'Oficios y servicios', icon: '🔧' },
  { id: 'comercio', label: 'Comercio y retail', icon: '🛍️' },
  { id: 'salud', label: 'Salud y bienestar', icon: '🩺' },
  { id: 'otro', label: 'Otro rubro', icon: '✨' },
];

// Catálogo de rubros específicos para el paso 2 del quiz ("¿A qué te
// dedicás?"): mucho más granular que RUBROS (que solo tiene 6 categorías
// amplias, una por plantilla). Cada tipo apunta a uno de esos 6 rubros +
// unos tags de "sabor" (comida, turnos, catálogo, etc.) que alimentan
// recomendarPlantillaPorTags. Sin íconos a propósito: se listan como texto
// plano, buscable, sin emojis.
export const TIPOS_NEGOCIO = [
  // Gastronomía y bebidas
  { id: 'restaurantes', nombre: 'Restaurantes', grupo: 'Gastronomía y bebidas', rubro: 'gastronomia', tags: ['gastronomia', 'comida', 'delivery'] },
  { id: 'bares', nombre: 'Bares', grupo: 'Gastronomía y bebidas', rubro: 'gastronomia', tags: ['gastronomia', 'comida', 'bebidas'] },
  { id: 'cafeterias', nombre: 'Cafeterías', grupo: 'Gastronomía y bebidas', rubro: 'gastronomia', tags: ['gastronomia', 'comida', 'bebidas'] },
  { id: 'heladerias', nombre: 'Heladerías', grupo: 'Gastronomía y bebidas', rubro: 'gastronomia', tags: ['gastronomia', 'comida'] },
  { id: 'pizzerias', nombre: 'Pizzerías', grupo: 'Gastronomía y bebidas', rubro: 'gastronomia', tags: ['gastronomia', 'comida', 'delivery'] },
  { id: 'casas-de-comida', nombre: 'Casas de comida', grupo: 'Gastronomía y bebidas', rubro: 'gastronomia', tags: ['gastronomia', 'comida', 'delivery'] },
  { id: 'hamburgueserias', nombre: 'Hamburgueserías', grupo: 'Gastronomía y bebidas', rubro: 'gastronomia', tags: ['gastronomia', 'comida', 'delivery', 'fastfood', 'carrito'] },
  { id: 'comida-rapida', nombre: 'Comida rápida', grupo: 'Gastronomía y bebidas', rubro: 'gastronomia', tags: ['gastronomia', 'comida', 'delivery', 'fastfood', 'carrito'] },
  { id: 'panaderias', nombre: 'Panaderías', grupo: 'Gastronomía y bebidas', rubro: 'gastronomia', tags: ['gastronomia', 'panaderia', 'pasteleria', 'reposteria', 'tortas'] },
  { id: 'pastelerias', nombre: 'Pastelerías', grupo: 'Gastronomía y bebidas', rubro: 'gastronomia', tags: ['gastronomia', 'pasteleria', 'panaderia', 'reposteria', 'tortas'] },
  // Comercio y tiendas
  { id: 'tiendas', nombre: 'Tiendas', grupo: 'Comercio y tiendas', rubro: 'comercio', tags: ['comercio', 'catalogo', 'productos'] },
  { id: 'kioscos', nombre: 'Kioscos', grupo: 'Comercio y tiendas', rubro: 'comercio', tags: ['comercio', 'catalogo', 'productos'] },
  { id: 'ferreterias', nombre: 'Ferreterías', grupo: 'Comercio y tiendas', rubro: 'comercio', tags: ['comercio', 'catalogo', 'productos'] },
  { id: 'librerias', nombre: 'Librerías', grupo: 'Comercio y tiendas', rubro: 'comercio', tags: ['comercio', 'catalogo', 'productos'] },
  { id: 'regalerias', nombre: 'Regalerías', grupo: 'Comercio y tiendas', rubro: 'comercio', tags: ['comercio', 'catalogo', 'productos'] },
  { id: 'supermercados', nombre: 'Supermercados', grupo: 'Comercio y tiendas', rubro: 'comercio', tags: ['comercio', 'catalogo', 'productos'] },
  // Belleza y estética
  { id: 'peluquerias', nombre: 'Peluquerías', grupo: 'Belleza y estética', rubro: 'belleza', tags: ['belleza', 'turnos', 'estetica'] },
  { id: 'barberias', nombre: 'Barberías', grupo: 'Belleza y estética', rubro: 'belleza', tags: ['belleza', 'turnos', 'estetica'] },
  { id: 'centros-de-estetica', nombre: 'Centros de estética', grupo: 'Belleza y estética', rubro: 'belleza', tags: ['belleza', 'turnos', 'estetica'] },
  { id: 'centros-de-unas', nombre: 'Centros de uñas', grupo: 'Belleza y estética', rubro: 'belleza', tags: ['belleza', 'turnos', 'estetica'] },
  { id: 'spas', nombre: 'Spas', grupo: 'Belleza y estética', rubro: 'belleza', tags: ['belleza', 'turnos', 'estetica'] },
  // Salud y bienestar
  { id: 'medicos', nombre: 'Médicos', grupo: 'Salud y bienestar', rubro: 'salud', tags: ['salud', 'turnos', 'consultorio'] },
  { id: 'odontologos', nombre: 'Odontólogos', grupo: 'Salud y bienestar', rubro: 'salud', tags: ['salud', 'turnos', 'consultorio'] },
  { id: 'psicologos', nombre: 'Psicólogos', grupo: 'Salud y bienestar', rubro: 'salud', tags: ['salud', 'turnos', 'consultorio'] },
  { id: 'nutricionistas', nombre: 'Nutricionistas', grupo: 'Salud y bienestar', rubro: 'salud', tags: ['salud', 'turnos', 'consultorio'] },
  { id: 'clinicas', nombre: 'Clínicas', grupo: 'Salud y bienestar', rubro: 'salud', tags: ['salud', 'turnos', 'consultorio'] },
  { id: 'centros-de-kinesiologia', nombre: 'Centros de kinesiología', grupo: 'Salud y bienestar', rubro: 'salud', tags: ['salud', 'turnos', 'consultorio'] },
  // Oficios y reparaciones
  { id: 'plomeros', nombre: 'Plomeros', grupo: 'Oficios y reparaciones', rubro: 'oficios', tags: ['oficios', 'reparaciones', 'urgencias'] },
  { id: 'electricistas', nombre: 'Electricistas', grupo: 'Oficios y reparaciones', rubro: 'oficios', tags: ['oficios', 'reparaciones', 'urgencias'] },
  { id: 'gasistas', nombre: 'Gasistas', grupo: 'Oficios y reparaciones', rubro: 'oficios', tags: ['oficios', 'reparaciones', 'urgencias'] },
  { id: 'albaniles', nombre: 'Albañiles', grupo: 'Oficios y reparaciones', rubro: 'oficios', tags: ['oficios', 'reparaciones', 'proyectos'] },
  { id: 'pintores', nombre: 'Pintores', grupo: 'Oficios y reparaciones', rubro: 'oficios', tags: ['oficios', 'reparaciones', 'proyectos'] },
  { id: 'cerrajeros', nombre: 'Cerrajeros', grupo: 'Oficios y reparaciones', rubro: 'oficios', tags: ['oficios', 'reparaciones', 'urgencias'] },
  { id: 'carpinterias', nombre: 'Carpinterías', grupo: 'Oficios y reparaciones', rubro: 'oficios', tags: ['oficios', 'carpinteria', 'muebles', 'madera'] },
  // Profesionales
  { id: 'abogados', nombre: 'Abogados', grupo: 'Profesionales', rubro: 'otro', tags: ['otro', 'profesional', 'turnos'] },
  { id: 'contadores', nombre: 'Contadores', grupo: 'Profesionales', rubro: 'otro', tags: ['otro', 'profesional', 'turnos'] },
  { id: 'arquitectos', nombre: 'Arquitectos', grupo: 'Profesionales', rubro: 'otro', tags: ['otro', 'profesional', 'proyectos'] },
  { id: 'escribanos', nombre: 'Escribanos', grupo: 'Profesionales', rubro: 'otro', tags: ['otro', 'profesional', 'turnos'] },
  { id: 'consultores', nombre: 'Consultores', grupo: 'Profesionales', rubro: 'otro', tags: ['otro', 'profesional', 'turnos'] },
  // Fitness y bienestar
  { id: 'gimnasios', nombre: 'Gimnasios', grupo: 'Fitness y bienestar', rubro: 'salud', tags: ['salud', 'turnos', 'clases'] },
  { id: 'personal-trainers', nombre: 'Personal trainers', grupo: 'Fitness y bienestar', rubro: 'salud', tags: ['salud', 'turnos', 'clases'] },
  { id: 'academias-de-danza', nombre: 'Academias de danza', grupo: 'Fitness y bienestar', rubro: 'salud', tags: ['salud', 'turnos', 'clases'] },
  { id: 'estudios-de-yoga', nombre: 'Estudios de yoga', grupo: 'Fitness y bienestar', rubro: 'salud', tags: ['salud', 'turnos', 'clases'] },
  { id: 'estudios-de-pilates', nombre: 'Estudios de pilates', grupo: 'Fitness y bienestar', rubro: 'salud', tags: ['salud', 'turnos', 'clases'] },
  // Hogar y construcción
  { id: 'inmobiliarias', nombre: 'Inmobiliarias', grupo: 'Hogar y construcción', rubro: 'oficios', tags: ['oficios', 'proyectos', 'catalogo'] },
  { id: 'constructoras', nombre: 'Constructoras', grupo: 'Hogar y construcción', rubro: 'oficios', tags: ['oficios', 'reparaciones', 'proyectos'] },
  { id: 'locales-de-decoracion', nombre: 'Locales de decoración', grupo: 'Hogar y construcción', rubro: 'comercio', tags: ['comercio', 'catalogo', 'productos'] },
  { id: 'muebleries', nombre: 'Mueblerías', grupo: 'Hogar y construcción', rubro: 'comercio', tags: ['comercio', 'catalogo', 'productos'] },
  { id: 'jardinerias', nombre: 'Jardinerías', grupo: 'Hogar y construcción', rubro: 'comercio', tags: ['comercio', 'catalogo', 'reparaciones'] },
  // Educación
  { id: 'academias', nombre: 'Academias', grupo: 'Educación', rubro: 'otro', tags: ['otro', 'clases', 'turnos'] },
  { id: 'institutos', nombre: 'Institutos', grupo: 'Educación', rubro: 'otro', tags: ['otro', 'clases', 'turnos'] },
  { id: 'profesores-particulares', nombre: 'Profesores particulares', grupo: 'Educación', rubro: 'otro', tags: ['otro', 'clases', 'turnos'] },
  { id: 'centros-de-cursos', nombre: 'Centros de cursos', grupo: 'Educación', rubro: 'otro', tags: ['otro', 'clases', 'turnos'] },
  // Automotor
  { id: 'talleres-mecanicos', nombre: 'Talleres mecánicos', grupo: 'Automotor', rubro: 'oficios', tags: ['oficios', 'reparaciones', 'urgencias'] },
  { id: 'mecanicos', nombre: 'Mecánicos', grupo: 'Automotor', rubro: 'oficios', tags: ['oficios', 'reparaciones', 'urgencias'] },
  { id: 'lavaderos-de-autos', nombre: 'Lavaderos de autos', grupo: 'Automotor', rubro: 'oficios', tags: ['oficios', 'turnos'] },
  { id: 'gomerias', nombre: 'Gomerías', grupo: 'Automotor', rubro: 'oficios', tags: ['oficios', 'reparaciones', 'urgencias'] },
  { id: 'concesionarias', nombre: 'Concesionarias', grupo: 'Automotor', rubro: 'comercio', tags: ['comercio', 'catalogo', 'productos'] },
  // Mascotas
  { id: 'veterinarias', nombre: 'Veterinarias', grupo: 'Mascotas', rubro: 'salud', tags: ['salud', 'turnos', 'consultorio'] },
  { id: 'pet-shops', nombre: 'Pet shops', grupo: 'Mascotas', rubro: 'comercio', tags: ['comercio', 'catalogo', 'productos'] },
  { id: 'peluquerias-caninas', nombre: 'Peluquerías caninas', grupo: 'Mascotas', rubro: 'belleza', tags: ['belleza', 'turnos', 'estetica'] },
  // Eventos
  { id: 'fotografos', nombre: 'Fotógrafos', grupo: 'Eventos', rubro: 'otro', tags: ['otro', 'proyectos', 'eventos'] },
  { id: 'djs', nombre: 'DJs', grupo: 'Eventos', rubro: 'otro', tags: ['otro', 'proyectos', 'eventos'] },
  { id: 'salones-de-eventos', nombre: 'Salones de eventos', grupo: 'Eventos', rubro: 'otro', tags: ['otro', 'eventos', 'turnos'] },
  { id: 'organizadores-de-eventos', nombre: 'Organizadores de eventos', grupo: 'Eventos', rubro: 'otro', tags: ['otro', 'proyectos', 'eventos'] },
  // Turismo
  { id: 'hoteles', nombre: 'Hoteles', grupo: 'Turismo', rubro: 'otro', tags: ['otro', 'turismo', 'reservas'] },
  { id: 'cabanas', nombre: 'Cabañas', grupo: 'Turismo', rubro: 'otro', tags: ['otro', 'turismo', 'reservas'] },
  { id: 'agencias-de-viajes', nombre: 'Agencias de viajes', grupo: 'Turismo', rubro: 'otro', tags: ['otro', 'turismo', 'reservas'] },
  { id: 'guias-turisticos', nombre: 'Guías turísticos', grupo: 'Turismo', rubro: 'otro', tags: ['otro', 'turismo', 'reservas'] },
  // Empresas
  { id: 'pymes', nombre: 'Pymes', grupo: 'Empresas', rubro: 'comercio', tags: ['comercio', 'catalogo', 'mayorista'] },
  { id: 'industrias', nombre: 'Industrias', grupo: 'Empresas', rubro: 'comercio', tags: ['comercio', 'catalogo', 'mayorista'] },
  { id: 'distribuidores', nombre: 'Distribuidores', grupo: 'Empresas', rubro: 'comercio', tags: ['comercio', 'catalogo', 'mayorista'] },
  { id: 'mayoristas', nombre: 'Mayoristas', grupo: 'Empresas', rubro: 'comercio', tags: ['comercio', 'catalogo', 'mayorista'] },
];

export const getTipoNegocioById = (id) => TIPOS_NEGOCIO.find((t) => t.id === id) ?? null;

export const TIPO_VENTA = [
  { id: 'productos', label: 'Productos', desc: 'Vendo cosas físicas o del catálogo' },
  { id: 'servicios', label: 'Servicios', desc: 'Ofrezco mi trabajo o mi tiempo' },
  { id: 'ambos', label: 'Ambos', desc: 'Un poco de las dos cosas' },
];

// Catálogo de funciones que puede tener el objeto Botón, sin importar en qué
// sección viva. `target` dice qué tipo de dato extra pide esa función (o
// ninguno): un teléfono, un email, una URL externa, una sección propia, una
// página nueva (todavía no soportada, ver `pagina` en las rutas del Header) o
// nada porque abre su propio formulario.
export const BUTTON_FUNCTIONS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    desc: 'Abre un chat de WhatsApp con tu número',
    target: 'phone',
    placeholder: 'Ej: 5491122223333',
  },
  {
    id: 'llamar',
    label: 'Llamar',
    desc: 'Inicia una llamada al número que pongas',
    target: 'phone',
    placeholder: 'Ej: 011 4567-8901',
  },
  {
    id: 'agendar',
    label: 'Agendar cita',
    desc: 'Abre un formulario para coordinar un turno',
    target: null,
  },
  {
    id: 'seccion',
    label: 'Ir a una sección',
    desc: 'Baja directo a otra parte de esta misma página',
    target: 'section',
  },
  {
    id: 'pagina',
    label: 'Ir a otra página',
    desc: 'Lleva a una página nueva de tu sitio (próximamente)',
    target: 'page',
  },
  {
    id: 'email',
    label: 'Enviar email',
    desc: 'Abre el mail del visitante con tu dirección ya cargada',
    target: 'email',
    placeholder: 'Ej: hola@tunegocio.com',
  },
  {
    id: 'enlace',
    label: 'Enlace externo',
    desc: 'Lleva a cualquier otra web (Instagram, menú digital, etc.)',
    target: 'url',
    placeholder: 'https://instagram.com/tunegocio',
  },
];

// Catálogo de animaciones del objeto Imagen — cómo se muestra un grupo de
// fotos (una sola quieta, pasando manualmente, solas, o con un zoom suave),
// elegible desde un selector de esqueletos como el de las distribuciones.
export const MEDIA_ANIMATIONS = [
  { id: 'estatica', label: 'Estática', desc: 'Una sola foto fija', skeleton: 'mediaEstatica' },
  { id: 'manual', label: 'Carrusel manual', desc: 'Flechas y puntos para pasar de foto', skeleton: 'mediaManual' },
  { id: 'auto', label: 'Carrusel automático', desc: 'Va cambiando de foto sola', skeleton: 'mediaAuto' },
  { id: 'zoom', label: 'Zoom suave', desc: 'La foto se acerca y aleja despacio', skeleton: 'mediaZoom' },
];

// Catálogo de animaciones del objeto Texto — cómo entra ese texto puntual
// cuando aparece en pantalla al scrollear la página publicada (en el editor
// no se reproducen, para no molestar mientras se edita).
export const TEXT_ANIMATIONS = [
  { id: 'fade', label: 'Aparecer', previewClass: 'preview-anim-fade' },
  { id: 'subir', label: 'Deslizar arriba', previewClass: 'preview-anim-up' },
  { id: 'lateral', label: 'Deslizar lateral', previewClass: 'preview-anim-side' },
];

// Chips de categoría para la primera pregunta del quiz ("¿de qué se trata tu
// sitio?") — es más amplio que el rubro (que decide la plantilla): acá solo
// suma contexto narrativo, no cambia ninguna lógica de recomendación.
export const CATEGORIAS_SITIO = [
  'Tienda online',
  'Portafolio',
  'Ofrecer servicios',
  'Blog',
  'Landing page',
  'Organización sin fines de lucro',
  'Empresa de tecnología',
  'Restaurante',
  'Promocionar un evento',
];

// Sugerencias de objetivos del sitio, pensadas para un pequeño negocio real
// (no un blog) — se muestran como chips en la pregunta de metas del quiz.
export const METAS_SUGERIDAS = [
  'Vender más',
  'Conseguir más clientes',
  'Que me encuentren en Google',
  'Mostrar mi catálogo',
  'Recibir consultas por WhatsApp',
  'Mostrar reseñas de mis clientes',
  'Verme más profesional',
  'Ahorrar tiempo atendiendo consultas',
];

// Sugerencias de nombre por rubro, para la pregunta "¿cómo querés que se
// llame tu sitio?" — si todavía no eligió rubro, usamos las genéricas de "otro".
export const NOMBRE_SUGERENCIAS_POR_RUBRO = {
  gastronomia: ['Sabor Casero', 'La Esquina', 'Buen Bocado', 'Cocina de Barrio'],
  belleza: ['Estudio Bella', 'Turno Perfecto', 'Espacio Belleza', 'Look Studio'],
  oficios: ['Manos a la Obra', 'Servicio Rápido', 'Todo Arreglado', 'Técnicos Ya'],
  comercio: ['Vidriera Digital', 'Tu Kiosco', 'Rincón de Ofertas', 'La Tienda'],
  salud: ['Cuidado Total', 'Centro de Bienestar', 'Consultorio Amigo', 'Vida Sana'],
  otro: ['Mi Negocio', 'Idea en Marcha', 'Proyecto Nuevo', 'Emprendimiento Propio'],
};

// Aclara un color hex mezclándolo con blanco — se usa para derivar el tono de
// fondo suave a partir de un color custom elegido libremente en el editor.
export const tint = (hex, percent) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const mix = (c) => Math.round(c + (percent / 100) * (255 - c));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

const img = (seed, w = 800, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
// Fotos reales por rubro (no gradientes/placeholders de color) para que la maqueta
// venda la idea de forma creíble — LoremFlickr sirve fotos reales por palabra clave.
const photo = (keywords, lock, w = 1000, h = 750) => `https://loremflickr.com/${w}/${h}/${keywords}?lock=${lock}`;

// Paleta editorial por rubro (guía de diseño de las plantillas de cliente): un
// único acento de marca por sitio (hex, compatible con el selector de color
// existente) + una escala neutra ink/inkSoft/bg/line con un leve tinte del
// mismo hue — esos cuatro quedan fijos por rubro, no son editables desde el
// selector de color (son la identidad editorial de la plantilla, no "el
// color de marca" que el usuario elige).
export const RUBRO_PALETTES = {
  gastronomia: {
    accent: '#bb5d00',
    accentSoft: tint('#bb5d00', 88),
    ink: 'oklch(17% 0.012 55)',
    inkHex: '#140e0a',
    inkSoft: 'oklch(44% 0.012 55)',
    bg: 'oklch(97% 0.007 55)',
    line: 'oklch(85% 0.015 55)',
  },
  belleza: {
    accent: '#bd1f44',
    accentSoft: tint('#bd1f44', 88),
    ink: 'oklch(18% 0.015 350)',
    inkHex: '#170f12',
    inkSoft: 'oklch(45% 0.015 350)',
    bg: 'oklch(97% 0.008 20)',
    line: 'oklch(86% 0.02 20)',
  },
  oficios: {
    accent: '#c0571e',
    accentSoft: tint('#c0571e', 88),
    ink: 'oklch(17% 0.012 45)',
    inkHex: '#140e0b',
    inkSoft: 'oklch(44% 0.012 45)',
    bg: 'oklch(96% 0.008 45)',
    line: 'oklch(84% 0.015 45)',
  },
  comercio: {
    accent: '#bc4527',
    accentSoft: tint('#bc4527', 88),
    ink: 'oklch(18% 0.01 60)',
    inkHex: '#15110d',
    inkSoft: 'oklch(42% 0.01 60)',
    bg: 'oklch(97% 0.006 80)',
    line: 'oklch(85% 0.01 70)',
  },
  salud: {
    accent: '#009365',
    accentSoft: tint('#009365', 88),
    ink: 'oklch(17% 0.012 200)',
    inkHex: '#091111',
    inkSoft: 'oklch(44% 0.012 200)',
    bg: 'oklch(97% 0.006 180)',
    line: 'oklch(85% 0.015 180)',
  },
  otro: {
    accent: '#9d6400',
    accentSoft: tint('#9d6400', 88),
    ink: 'oklch(16% 0.01 60)',
    inkHex: '#110c09',
    inkSoft: 'oklch(44% 0.01 60)',
    bg: 'oklch(97% 0.005 80)',
    line: 'oklch(84% 0.012 75)',
  },
};

export const getRubroPalette = (rubro) => RUBRO_PALETTES[rubro] || RUBRO_PALETTES.otro;

// Ángulo de matiz (0-360) de un color hex, para poder teñir la escala neutra
// de una plantilla con el mismo tono de su propio acento — no es una
// conversión exacta a OKLCH (alcanza con HSL para esto), solo necesitamos
// "para qué lado del círculo cromático tira" este acento en particular.
const hexHue = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  return h < 0 ? h + 360 : h;
};

// Paleta editorial de una plantilla puntual: parte de la escala neutra del
// rubro (RUBRO_PALETTES) pero le pisa el matiz por el del acento PROPIO de
// esa plantilla (no el rubro genérico) — así dos plantillas del mismo rubro
// (ej. Sabor Casero y Fuego Burger, ambas gastronomía) quedan con un fondo y
// bordes tan distintos entre sí como lo son sus acentos, en vez de compartir
// exactamente el mismo tinte de fondo por venir del mismo rubro. Se usa el
// acento DEFINIDO en la plantilla (no el que el usuario haya elegido en el
// selector de color), para que esa identidad no cambie con cada retoque.
export const getTemplatePalette = (template) => {
  // Algunas plantillas (ej. Estudio Lumen) tienen una identidad tan propia
  // — fondo oscuro en vez del claro estándar del rubro — que derivarla del
  // rubro no tiene sentido. `paletteOverride` reemplaza la escala entera,
  // ya resuelta a mano; el resto de las plantillas no la declaran, así que
  // siguen derivando de RUBRO_PALETTES exactamente como antes.
  if (template?.paletteOverride) return template.paletteOverride;
  const base = getRubroPalette(template?.rubros?.[0]);
  if (!template?.accent) return base;
  const hue = hexHue(template.accent);
  // Cada string tiene la forma "oklch(17% 0.012 55)" — se pisa el matiz (el
  // número antes del paréntesis) y se multiplica un poco el chroma en fondo
  // y bordes (no en el texto, para no perder legibilidad) para que el
  // tinte se note de verdad al lado de otra plantilla del mismo rubro, no
  // solo en teoría.
  const withHue = (oklchStr, chromaScale = 1) =>
    oklchStr.replace(
      /oklch\((\d+)%\s+([\d.]+)\s+[\d.]+\)/,
      (_, l, c) => `oklch(${l}% ${(Number(c) * chromaScale).toFixed(3)} ${hue})`
    );
  return {
    ...base,
    ink: withHue(base.ink),
    inkSoft: withHue(base.inkSoft),
    bg: withHue(base.bg, 1.8),
    line: withHue(base.line, 1.6),
  };
};

export const TEMPLATES = [
  {
    id: 'sabor-casero',
    rubros: ['gastronomia'],
    nombre: 'Sabor Casero',
    tagline: 'Para bares, restós, cafeterías y deliverys.',
    tags: ['gastronomia', 'comida', 'delivery', 'bebidas'],
    accent: '#bb5d00',
    accentSoft: tint('#bb5d00', 88),
    heroSeed: 'sabor-casero-hero',
    image: photo('restaurant,cafe', 11),
    imageFallback: img('sabor-casero-hero'),
    demo: {
      nombreNegocio: 'La Esquina de Doña Rosa',
      rubroLabel: 'Cocina casera • Bar y restó',
      sobreNosotros:
        'Cocina casera de barrio, con recetas de siempre y productos frescos todos los días. Desde 1998 en el mismo lugar, con el mismo cariño.',
      whatsapp: '5491123456789',
      telefono: '011 4567-8901',
      direccion: 'Av. Rivadavia 4521, CABA',
      horarios: 'Mar a Dom, 12 a 16 hs y 20 a 00 hs',
      instagram: '@laesquinadonarosa',
      galeria: [img('sabor-1'), img('sabor-2'), img('sabor-3'), img('sabor-4')],
    },
    // Disposición ya armada para este rubro: qué elementos trae la plantilla y con
    // qué distribución cada uno — esto es lo que "chooseTemplate" usa para no
    // arrancar de una hoja en blanco, sea cual sea el negocio que la elija.
    sections: [
      { type: 'header' },
      { type: 'hero' },
      { type: 'galeria', variant: 'grid' },
      { type: 'productos', variant: 'grid-3' },
      { type: 'testimonios', variant: 'grid' },
      { type: 'sobre-nosotros' },
      { type: 'footer' },
    ],
    seeds: {
      productos: [
        { id: 'prod-milanesa', nombre: 'Milanesa napolitana con papas', precio: 8500, desc: 'De ternera, con jamón, queso y salsa, acompañada de papas fritas.', detalle: '', imagenes: [photo('schnitzel', 601)] },
        { id: 'prod-empanadas', nombre: 'Docena de empanadas caseras', precio: 7200, desc: 'Carne cortada a cuchillo, pollo o jamón y queso, al horno.', detalle: '', imagenes: [photo('empanadas', 602)] },
        { id: 'prod-guiso', nombre: 'Guiso de lentejas', precio: 6800, desc: 'Receta de la casa, con chorizo colorado y panceta.', detalle: '', imagenes: [photo('stew', 603)] },
        { id: 'prod-tarta', nombre: 'Tarta de manzana casera', precio: 3200, desc: 'Masa quebrada, manzanas al horno y canela.', detalle: '', imagenes: [photo('applepie', 604)] },
        { id: 'prod-pastel', nombre: 'Pastel de papa', precio: 7500, desc: 'Relleno de carne picada, huevo y aceitunas.', detalle: '', imagenes: [photo('shepherdspie', 605)] },
        { id: 'prod-flan', nombre: 'Flan casero con dulce de leche', precio: 3000, desc: 'Con crema y dulce de leche a elección.', detalle: '', imagenes: [photo('flan', 606)] },
      ],
      testimonios: [
        { id: 'testi-marta', nombre: 'Marta Fernández', texto: 'Comida como la de casa, con ese gusto de siempre. Pedimos delivery todas las semanas.', rating: 5, avatar: '', verificado: true },
        { id: 'testi-ruben', nombre: 'Rubén Acosta', texto: 'Las empanadas son las mejores del barrio, y el guiso de lentejas no tiene rival.', rating: 5, avatar: '', verificado: true },
        { id: 'testi-noelia', nombre: 'Noelia Suárez', texto: 'Atención de siempre, precios justos y porciones generosas. Volvemos seguido.', rating: 5, avatar: '', verificado: true },
      ],
    },
  },
  {
    id: 'turno-perfecto',
    rubros: ['belleza'],
    nombre: 'Bella Rosa Estudio',
    tagline: 'Para peluquerías, barberías, manicuras y centros de estética.',
    tags: ['belleza', 'turnos', 'estetica'],
    accent: '#bd1f44',
    accentSoft: tint('#bd1f44', 88),
    heroSeed: 'bella-rosa-hero',
    image: photo('hairsalon,barber', 22),
    imageFallback: img('turno-perfecto-hero'),
    demo: {
      nombreNegocio: 'Bella Rosa Estudio',
      rubroLabel: 'Peluquería y estética integral',
      sobreNosotros:
        'Un espacio pensado para que te sientas increíble. Color, cortes y tratamientos con productos premium y profesionales especializadas en cada técnica.',
      whatsapp: '5493414567890',
      telefono: '0341 456-7890',
      direccion: 'Sarmiento 1234, Rosario',
      horarios: 'Lun a Sáb, 10 a 20 hs',
      instagram: '@bellarosa.estudio',
      galeria: [img('bella-rosa-hero', 1000, 1200), photo('haircut', 532), photo('beautysalon', 533), photo('manicure', 534), photo('hairstyle', 535)],
    },
    sections: [
      { type: 'header' },
      { type: 'hero', heroCaption: 'Agenda abierta — turnos esta semana' },
      { type: 'galeria', variant: 'masonry' },
      { type: 'precios' },
      {
        type: 'reservas',
        servicios: [
          { id: 'resv-corte', nombre: 'Corte' },
          { id: 'resv-color', nombre: 'Color completo' },
          { id: 'resv-brushing', nombre: 'Brushing' },
          { id: 'resv-novias', nombre: 'Combo novias' },
        ],
      },
      { type: 'testimonios', variant: 'grid' },
      { type: 'contacto', variant: 'mapa' },
      { type: 'footer', variant: 'columnas' },
    ],
    seeds: {
      planes: [
        { id: 'plan-corte', nombre: 'Corte', precio: 9000, periodo: 'sesión', destacado: false, features: ['Lavado y corte', 'Brushing incluido'], boton: {} },
        { id: 'plan-color', nombre: 'Color completo', precio: 22000, periodo: 'sesión', destacado: true, features: ['Color + matización', 'Tratamiento reparador', 'Brushing incluido'], boton: {} },
        { id: 'plan-novias', nombre: 'Combo novias', precio: 45000, periodo: 'evento', destacado: false, features: ['Prueba incluida', 'Peinado + maquillaje', 'Retoque el mismo día'], boton: {} },
      ],
      testimonios: [
        { id: 'testi-rosa', nombre: 'Rosa Giménez', texto: 'Antes usaba solo Instagram y perdía turnos. Ahora entran a la web y me escriben directo.', rating: 5, avatar: '', verificado: true },
        { id: 'testi-carla', nombre: 'Carla Gómez', texto: 'La atención es impecable y los resultados se notan desde la primera visita.', rating: 5, avatar: '', verificado: true },
        { id: 'testi-marina', nombre: 'Marina Paz', texto: 'Pedí el combo novias y quedó todo perfecto, sin sorpresas de último momento.', rating: 5, avatar: '', verificado: true },
      ],
    },
  },
  {
    id: 'manos-a-la-obra',
    rubros: ['oficios'],
    nombre: 'Manos a la Obra',
    tagline: 'Para plomeros, electricistas, gasistas y técnicos.',
    tags: ['oficios', 'reparaciones', 'urgencias', 'proyectos'],
    accent: '#c0571e',
    accentSoft: tint('#c0571e', 88),
    heroSeed: 'manos-hero',
    image: photo('mechanic,garage', 33),
    imageFallback: img('manos-hero'),
    demo: {
      nombreNegocio: 'Martínez Servicios Técnicos',
      rubroLabel: 'Electricidad y gas',
      sobreNosotros:
        'Más de 15 años de experiencia en instalaciones y reparaciones. Presupuesto sin cargo y atención de urgencias.',
      whatsapp: '5493511234567',
      telefono: '0351 123-4567',
      direccion: 'Zona Norte, Córdoba',
      horarios: 'Lun a Vie, 8 a 18 hs · Urgencias 24 hs',
      instagram: '@martinez.tecnico',
      galeria: [img('manos-1'), img('manos-2'), img('manos-3'), img('manos-4')],
    },
    sections: [
      { type: 'header' },
      { type: 'hero' },
      { type: 'testimonios', variant: 'grid' },
      { type: 'faq', variant: 'lista' },
      {
        type: 'zonas',
        variant: 'lista',
        zonas: [
          { id: 'zona-norte', nombre: 'Zona Norte' },
          { id: 'zona-cerro', nombre: 'Cerro de las Rosas' },
          { id: 'zona-belgrano', nombre: 'Villa Belgrano' },
          { id: 'zona-alta-cba', nombre: 'Alta Córdoba' },
          { id: 'zona-alberdi', nombre: 'Alberdi' },
          { id: 'zona-general-paz', nombre: 'General Paz' },
          { id: 'zona-guemes', nombre: 'Güemes' },
        ],
      },
      { type: 'contacto', variant: 'centrado' },
      { type: 'sobre-nosotros' },
      { type: 'footer' },
    ],
  },
  {
    id: 'vidriera-digital',
    rubros: ['comercio'],
    nombre: 'Vidriera Once',
    tagline: 'Para kioscos, tiendas de ropa, librerías y regalerías.',
    tags: ['comercio', 'catalogo', 'productos', 'mayorista'],
    accent: '#bc4527',
    accentSoft: tint('#bc4527', 88),
    heroSeed: 'vidriera-once-hero',
    image: photo('clothing,store', 44),
    imageFallback: img('vidriera-hero'),
    demo: {
      nombreNegocio: 'Vidriera Once',
      rubroLabel: 'Ropa y accesorios de diseño',
      sobreNosotros:
        'Moda urbana y accesorios seleccionados a mano. Trabajamos con marcas locales, tenemos stock permanente y cambios sin problema dentro de los 15 días.',
      whatsapp: '5491156789012',
      telefono: '011 5678-2345',
      direccion: 'Av. Corrientes 2345, CABA',
      horarios: 'Lun a Sáb, 10 a 20 hs',
      instagram: '@vidrieraonce',
      galeria: [img('vidriera-once-hero', 1000, 1200), photo('sneakers', 512), photo('leatherbag', 513), photo('hollywood', 514)],
    },
    sections: [
      { type: 'header' },
      { type: 'hero', heroCaption: 'Nueva colección — invierno 2026' },
      {
        type: 'vidriera',
        variant: 'rotativa',
        items: [
          { id: 'vid-campera', nombre: 'Campera de jean oversize', precio: 'Desde $42.000', imagen: photo('denimjacket', 521) },
          { id: 'vid-zapatillas', nombre: 'Zapatillas urbanas', precio: 'Desde $58.000', imagen: photo('sneakers', 522) },
          { id: 'vid-bandolera', nombre: 'Bandolera de cuero', precio: 'Desde $31.000', imagen: photo('leatherbag', 523) },
          { id: 'vid-remera', nombre: 'Remera básica premium', precio: 'Desde $15.000', imagen: photo('tshirt', 524) },
        ],
      },
      { type: 'productos', variant: 'lista' },
      { type: 'cta', eyebrow: 'Envíos a todo el país', titulo: 'Comprá desde tu celular, recibilo en tu casa', subtitulo: 'Despachos en 48 hs a todo el país, con cambios sin cargo dentro de los 15 días.' },
      { type: 'sobre-nosotros', variant: 'split', quote: 'Elegimos cada prenda como si fuera para nuestro propio placard.' },
      { type: 'contacto', variant: 'mapa' },
      { type: 'footer', variant: 'columnas' },
    ],
    seeds: {
      productos: [
        { id: 'prod-campera', nombre: 'Campera de jean oversize', precio: 42000, desc: 'Unisex, talles S a XL.', detalle: '', imagenes: [photo('denimjacket', 521)] },
        { id: 'prod-zapatillas', nombre: 'Zapatillas urbanas', precio: 58000, desc: 'Diseño exclusivo, suela de goma.', detalle: '', imagenes: [photo('sneakers', 522)] },
        { id: 'prod-bandolera', nombre: 'Bandolera de cuero', precio: 31000, desc: 'Cuero legítimo, hecha a mano.', detalle: '', imagenes: [photo('leatherbag', 523)] },
        { id: 'prod-remera', nombre: 'Remera básica premium', precio: 15000, desc: 'Algodón peinado 24/1.', detalle: '', imagenes: [photo('tshirt', 524)] },
      ],
    },
  },
  {
    id: 'cuidado-total',
    rubros: ['salud'],
    nombre: 'Consultorio Vital',
    tagline: 'Para consultorios, nutricionistas, kinesiólogos y psicólogos.',
    tags: ['salud', 'turnos', 'consultorio', 'clases'],
    accent: '#009365',
    accentSoft: tint('#009365', 88),
    heroSeed: 'consultorio-vital-hero',
    image: photo('clinic', 302),
    imageFallback: img('cuidado-hero'),
    demo: {
      nombreNegocio: 'Consultorio Vital',
      rubroLabel: 'Nutrición, kinesiología y bienestar',
      sobreNosotros:
        'Atención personalizada en un ambiente cálido y profesional. Planes a medida y seguimiento cercano en cada turno, con un equipo interdisciplinario.',
      whatsapp: '5493514445566',
      telefono: '0341 678-1234',
      direccion: 'Bv. Oroño 890, Rosario',
      horarios: 'Lun a Vie, 9 a 19 hs',
      instagram: '@consultorio.vital',
      galeria: [img('consultorio-vital-hero', 1000, 1200), photo('physiotherapy', 542), photo('nutrition', 543), photo('wellness', 544)],
    },
    sections: [
      { type: 'header' },
      { type: 'hero', heroCaption: 'Turnos presenciales y a distancia' },
      { type: 'equipo' },
      { type: 'faq', variant: 'lista' },
      { type: 'blog' },
      { type: 'contacto', variant: 'mapa' },
      { type: 'footer', variant: 'columnas' },
    ],
    seeds: {
      equipo: [
        { id: 'equipo-fernandez', nombre: 'Dra. Fernández', rol: 'Nutricionista', foto: '' },
        { id: 'equipo-ibarra', nombre: 'Lic. Ibarra', rol: 'Kinesiólogo', foto: '' },
        { id: 'equipo-suarez', nombre: 'Lic. Suárez', rol: 'Psicóloga', foto: '' },
      ],
      faqs: [
        { id: 'faq-obras-sociales', q: '¿Atienden obras sociales?', a: 'Sí, emitimos factura para reintegro con la mayoría de las obras sociales y prepagas.' },
        { id: 'faq-turno', q: '¿Cómo reservo un turno?', a: 'Podés escribirnos por WhatsApp o llamarnos directamente, te confirmamos el mismo día.' },
        { id: 'faq-distancia', q: '¿Hacen seguimiento a distancia?', a: 'Sí, ofrecemos videoconsultas de seguimiento entre turnos presenciales.' },
      ],
      posts: [
        { id: 'post-espalda', titulo: '5 hábitos simples para cuidar tu espalda', resumen: 'Pequeños cambios en tu rutina diaria que hacen una gran diferencia.', imagen: photo('stretching', 551), videoUrl: '' },
        { id: 'post-alimentacion', titulo: 'Cómo armar una alimentación sostenible', resumen: 'Consejos prácticos de nuestra nutricionista para el día a día.', imagen: photo('healthyfood', 552), videoUrl: '' },
      ],
    },
  },
  {
    id: 'todo-en-uno',
    rubros: ['otro'],
    nombre: 'Urbano & Asociados',
    tagline: 'Flexible para estudios de arquitectura, consultoras y profesionales.',
    tags: ['otro', 'profesional', 'proyectos', 'eventos', 'turismo', 'reservas'],
    accent: '#9d6400',
    accentSoft: tint('#9d6400', 88),
    heroSeed: 'urbano-asociados-hero',
    image: photo('architecture', 401),
    imageFallback: img('todo-hero'),
    demo: {
      nombreNegocio: 'Urbano & Asociados',
      rubroLabel: 'Estudio de arquitectura e interiorismo',
      sobreNosotros:
        'Proyectamos y acompañamos cada obra de principio a fin: diseño, dirección técnica e interiorismo, con foco en espacios que funcionan de verdad.',
      whatsapp: '5491100002222',
      telefono: '011 0000-2222',
      direccion: 'Av. del Libertador 3400, CABA',
      horarios: 'Lun a Vie, 9 a 18 hs · Con cita previa',
      instagram: '@urbanoyasociados',
      galeria: [img('urbano-asociados-hero', 1000, 1200), photo('mountainlake', 562), photo('interiordesign', 563), photo('modernhouse', 564)],
    },
    sections: [
      { type: 'header' },
      { type: 'hero', heroCaption: 'Proyectos en curso — 2026' },
      { type: 'sobre-nosotros', variant: 'split', quote: 'Cada obra empieza escuchando cómo se va a vivir ese espacio.' },
      { type: 'cta', eyebrow: 'Primera reunión sin cargo', titulo: '¿Tenés un proyecto en mente?', subtitulo: 'Contanos tu idea y te asesoramos sin cargo en la primera reunión.' },
      { type: 'contacto', variant: 'mapa' },
      { type: 'footer', variant: 'columnas' },
    ],
  },
];

// Mapeo mockeado: en un producto real esto sería un modelo de recomendación,
// acá alcanza con un mapeo directo rubro -> plantilla. `list` es opcional
// (por defecto las plantillas de fábrica) — quien tenga a mano el catálogo
// completo (de fábrica + creadas por el admin, ver AppContext.templates) lo
// pasa para que también puedan salir recomendadas.
export const recomendarPlantilla = (rubroId, list = TEMPLATES) => {
  const match = list.find((t) => t.rubros?.includes(rubroId));
  return match ?? list[list.length - 1];
};

// Recomendación por tags: cada plantilla tiene sus propios tags (TEMPLATES[].tags)
// y cada tipo de negocio del quiz (TIPOS_NEGOCIO) trae los suyos — se puntúa cada
// plantilla por cuántos tags comparte con el tipo elegido y gana la de mayor
// puntaje. Así, si un rubro tiene más de una plantilla candidata (ej.
// gastronomía: Sabor Casero vs. Fuego Burger), gana la que de verdad
// comparte más tags con ese tipo de negocio, no la primera del catálogo.
export const recomendarPlantillaPorTags = (tags, list = TEMPLATES) => {
  if (!tags || tags.length === 0) return list[list.length - 1];
  let best = null;
  let bestScore = -1;
  list.forEach((t) => {
    const score = (t.tags || []).filter((tag) => tags.includes(tag)).length;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  });
  return bestScore > 0 ? best : list[list.length - 1];
};

const normalizarTexto = (text) =>
  (text || '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

// Recomendación a partir del texto libre del rubro (paso 2 del quiz, sin
// lista fija para elegir): busca ese texto contra los nombres del catálogo
// TIPOS_NEGOCIO (ej. "peluqueria" contra "Peluquerías") y, si encuentra
// coincidencia, puntúa las plantillas por sus tags (no por rubro a secas) —
// así, si un rubro ya tiene más de una plantilla candidata (ej. gastronomía:
// Sabor Casero vs. Fuego Burger), gana la que de verdad comparte más tags
// con ese tipo de negocio en vez de quedarse siempre con la primera del
// catálogo. Devuelve null si el texto es muy corto o no matchea nada, para
// que quien llame decida la plantilla por defecto.
export const recomendarPlantillaPorTexto = (texto, list = TEMPLATES) => {
  const norm = normalizarTexto(texto);
  if (norm.length < 3) return null;

  // 1) Match directo contra las tags propias de cada plantilla del catálogo
  // (más preciso, y se mantiene solo: una plantilla nueva ya es encontrable
  // por sus propias tags apenas se crea, sin depender de que alguien se
  // acuerde de sumarla también a TIPOS_NEGOCIO más abajo — eso es justo lo
  // que se había desactualizado, dejando "panadería"/"carpintería" sin
  // ninguna coincidencia pese a que ya existían plantillas para esos rubros).
  let mejorPorTag = null;
  let mejorPorTagScore = 0;
  list.forEach((t) => {
    const score = (t.tags || []).filter((tag) => norm.includes(tag) || tag.includes(norm)).length;
    if (score > mejorPorTagScore) {
      mejorPorTagScore = score;
      mejorPorTag = t;
    }
  });
  if (mejorPorTag) return mejorPorTag;

  // 2) Si ninguna plantilla tiene una tag que matchee, cae al catálogo fijo
  // de tipos de negocio (cubre sinónimos más genéricos que no son tag de
  // ninguna plantilla puntual, ej. "restaurantes", "kioscos").
  const match = TIPOS_NEGOCIO.find((t) => {
    const stem = normalizarTexto(t.nombre).replace(/s$/, '');
    return norm.includes(stem) || stem.includes(norm);
  });
  return match ? recomendarPlantillaPorTags(match.tags, list) : null;
};

export const getTemplateById = (id, list = TEMPLATES) => list.find((t) => t.id === id) ?? list[0];

const avatar = (n) => `https://i.pravatar.cc/120?img=${n}`;

export const EJEMPLOS_DESTACADOS = [
  {
    templateId: 'turno-perfecto',
    nombre: 'Peluquería Bella Rosa',
    rating: '4.9',
    resena:
      '"Antes usaba solo Instagram y perdía turnos porque las clientas no sabían mi horario ni dónde quedaba el salón. Ahora todos entran a mi página, ven las fotos de los cortes y me escriben directo por WhatsApp."',
    autor: 'Rosa, peluquera en Rosario',
    avatar: avatar(47),
    resultado: '+38% más turnos reservados por WhatsApp en el primer mes',
  },
  {
    templateId: 'vidriera-digital',
    nombre: 'Kiosco El Sol',
    rating: '4.8',
    resena: '"La armé en una tarde. Mis clientes ven el horario y ya no me preguntan si estoy abierto."',
    autor: 'Marcos, kiosquero en Mendoza',
    avatar: avatar(32),
  },
  {
    templateId: 'manos-a-la-obra',
    nombre: 'Taller Mecánico Rodríguez',
    rating: '5.0',
    resena: '"Me llegan más consultas por WhatsApp desde que tengo la página. Se paga sola."',
    autor: 'Diego, mecánico en Córdoba',
    avatar: avatar(53),
  },
];

// Paletas de color seleccionables en el editor — reutilizan los mismos tonos
// que ya usan las plantillas, así cualquier combinación queda prolija.
export const PALETTES = [
  { id: 'coral', label: 'Coral', accent: '#FF6B4A', accentSoft: '#FFE2D9' },
  { id: 'rosa', label: 'Rosa', accent: '#E85D9E', accentSoft: '#FBDCEA' },
  { id: 'azul', label: 'Azul', accent: '#3BA1E8', accentSoft: '#D6ECFC' },
  { id: 'violeta', label: 'Violeta', accent: '#9B6BF2', accentSoft: '#E7DCFC' },
  { id: 'verde', label: 'Verde azulado', accent: '#2FBF9D', accentSoft: '#D3F3EB' },
  { id: 'dorado', label: 'Dorado', accent: '#F5B400', accentSoft: '#FBE9C2' },
  { id: 'rojo', label: 'Rojo', accent: '#E0483E', accentSoft: '#FBDAD7' },
  { id: 'grafito', label: 'Grafito', accent: '#4B5563', accentSoft: '#E2E5E9' },
];

// Catálogo de secciones que se pueden agregar a la página desde el editor.
// Es un subconjunto acotado (no las ~90 variantes posibles) pensado para
// probar el flujo de "armar tu página por bloques", no un builder completo.
export const SECCIONES_CATALOGO = [
  {
    id: 'header',
    label: 'Header con menú',
    desc: 'Tu logo y botones de menú a otras secciones de tu página.',
  },
  {
    id: 'hero',
    label: 'Portada (Hero)',
    desc: 'Tu logo, nombre y los botones principales de contacto.',
  },
  {
    id: 'galeria',
    label: 'Galería de fotos',
    desc: 'Mostrá fotos de tu local, tus productos o tu trabajo.',
  },
  {
    id: 'productos',
    label: 'Productos o servicios',
    desc: 'Una grilla con tus productos o servicios y precios.',
  },
  {
    id: 'testimonios',
    label: 'Testimonios',
    desc: 'Reseñas y comentarios de tus clientes.',
  },
  {
    id: 'faq',
    label: 'Preguntas frecuentes',
    desc: 'Respondé las dudas más comunes antes de que te escriban.',
  },
  {
    id: 'contacto',
    label: 'Formulario de contacto',
    desc: 'Un formulario para que te dejen su consulta.',
  },
  {
    id: 'sobre-nosotros',
    label: 'Sobre nosotros',
    desc: 'Descripción, horarios, dirección y contacto.',
  },
  {
    id: 'precios',
    label: 'Precios y planes',
    desc: 'Una tabla para comparar tus planes o paquetes de servicios.',
  },
  {
    id: 'equipo',
    label: 'Equipo',
    desc: 'Presentá a las personas detrás de tu negocio.',
  },
  {
    id: 'cta',
    label: 'Llamado a la acción',
    desc: 'Una franja destacada para reforzar tu botón principal a mitad de página.',
  },
  {
    id: 'menu',
    label: 'Menú',
    desc: 'Tus platos organizados por categoría, con precio.',
  },
  {
    id: 'marcas',
    label: 'Logos de clientes',
    desc: 'Una fila de marcas o clientes con los que trabajaste.',
  },
  {
    id: 'mapa',
    label: 'Ubicación',
    desc: 'Un mapa grande para que te encuentren fácil.',
  },
  {
    id: 'blog',
    label: 'Blog / Novedades',
    desc: 'Publicá novedades con foto o video.',
  },
  {
    id: 'categorias',
    label: 'Categorías',
    desc: 'Una fila de fotos con nombre para navegar por categoría, ocasión o tipo (ej: "¿para qué momento es tu regalo?").',
  },
  {
    id: 'pasos',
    label: 'Cómo funciona',
    desc: 'Explicá tu servicio en unos pocos pasos numerados, con un botón al final.',
  },
  {
    id: 'reservas',
    label: 'Turnos / Reservas',
    desc: 'Un calendario y horarios para que reserven un turno online, con tus servicios cargados.',
  },
  {
    id: 'areas',
    label: 'Áreas de práctica o especialidades',
    desc: 'Una lista de tus áreas o especialidades con un panel de detalle al costado (ideal para estudios, consultoras, clínicas).',
  },
  {
    id: 'pagos',
    label: 'Formas de pago',
    desc: 'Una fila con los medios de pago que aceptás (transferencia, efectivo, tarjetas, etc).',
  },
  {
    id: 'financiacion',
    label: 'Simulador de cuotas',
    desc: 'Un simulador de financiación: elegí un precio y mostrá la cuota estimada en distintos plazos.',
  },
  {
    id: 'beneficios',
    label: 'Beneficios / confianza',
    desc: 'Una fila de puntos clave con ícono, título y descripción (garantías, tiempos de entrega, etc).',
  },
  {
    id: 'marquee',
    label: 'Menciones / marquee',
    desc: 'Una franja angosta con texto en movimiento continuo (medios, premios, clientes con los que trabajaste).',
  },
  {
    id: 'series',
    label: 'Series / colecciones',
    desc: 'Tabs que muestran una imagen y un detalle distinto por cada serie o colección de trabajos.',
  },
  {
    id: 'archivo',
    label: 'Archivo con zoom',
    desc: 'Grilla de fotos en distintos tamaños — tocar una la amplía en pantalla completa.',
  },
  {
    id: 'comparador',
    label: 'Comparador de productos',
    desc: 'Elegí dos productos de una lista y compará sus datos lado a lado en una tabla.',
  },
  {
    id: 'canje',
    label: 'Plan canje',
    desc: 'Calculadora simple: el cliente elige su equipo usado y su estado, y ve cuánto se le toma a cuenta.',
  },
  {
    id: 'sucursales',
    label: 'Sucursales',
    desc: 'Lista de locales físicos — tocar uno muestra su dirección, horario y teléfono al lado.',
  },
  {
    id: 'cronograma',
    label: 'Cronograma',
    desc: 'Línea de tiempo con hora, título y descripción de cada momento — para el orden de una fiesta o evento.',
  },
  {
    id: 'lugares',
    label: 'Lugares del evento',
    desc: 'Tarjetas con foto, dirección y hora de cada lugar (ej: ceremonia y fiesta), con link para llegar.',
  },
  {
    id: 'dresscode',
    label: 'Dress code',
    desc: 'Qué ponerse: una lista de sí/no y una paleta de colores sugerida, sobre fondo oscuro.',
  },
  {
    id: 'rsvp',
    label: 'Confirmación de asistencia (RSVP)',
    desc: 'Formulario en 3 pasos para que el invitado confirme si viene, con cuántos y qué menú elige.',
  },
  {
    id: 'playlist',
    label: 'Playlist / pedidos de canción',
    desc: 'Lista de canciones ya pedidas, más un campo para que el invitado sume la suya.',
  },
  {
    id: 'regalos',
    label: 'Mesa de regalos',
    desc: 'Tarjetas simples con un símbolo, título, descripción y un dato final (ej: alias, urna).',
  },
  {
    id: 'historia',
    label: 'Nuestra historia',
    desc: 'Grilla de hitos con año, título y descripción — para contar una historia de varios años en pocas palabras.',
  },
  {
    id: 'hospedaje',
    label: 'Hospedaje',
    desc: 'Tarjetas de hoteles con distancia, descripción, precio y código de descuento para invitados de afuera.',
  },
  {
    id: 'libro-mensajes',
    label: 'Libro de mensajes',
    desc: 'Los invitados dejan un mensaje en el momento, sobre una lista de mensajes ya firmados.',
  },
  {
    id: 'catalogo-libros',
    label: 'Catálogo con buscador',
    desc: 'Buscador en vivo + pestañas de género/rubro + grilla de fichas con stock, y un estado de "sin resultados" con llamado a la acción.',
  },
  {
    id: 'recomendados',
    label: 'Recomendados del staff',
    desc: 'Fichas con foto chica, una nota escrita por quien lo recomienda y su firma con iniciales.',
  },
  {
    id: 'club-lectura',
    label: 'Club / comunidad',
    desc: 'Sección oscura con foto, datos clave (próximo encuentro, dónde, cuánto) y un botón para anotarse.',
  },
  {
    id: 'firmas-eventos',
    label: 'Agenda de eventos',
    desc: 'Lista de eventos propios (firmas, presentaciones, talleres) con día, mes y horario destacados.',
  },
  {
    id: 'pedidos-especiales',
    label: 'Encargo especial',
    desc: 'Pasos de cómo funciona + formulario simple (título/autor/WhatsApp) con pantalla de confirmado.',
  },
  {
    id: 'visitanos-boletin',
    label: 'Visitanos + boletín',
    desc: 'Tres columnas: datos de contacto, suscripción a un boletín y un mapa simulado.',
  },
  {
    id: 'ciclo-trabajo',
    label: 'Ciclo de trabajo',
    desc: 'Grilla de etapas con número, rango de fechas, título, descripción y una sub-lista de tareas concretas.',
  },
  {
    id: 'catalogo-insumos',
    label: 'Catálogo técnico',
    desc: 'Fichas filtrables por tipo con nombre, fórmula, datos técnicos y precio por unidad — sin fotos.',
  },
  {
    id: 'cotizador',
    label: 'Cotizador rápido',
    desc: 'El visitante elige una opción y una cantidad, y ve al instante una cotización estimada con el detalle.',
  },
  {
    id: 'ensayos',
    label: 'Tabla de resultados',
    desc: 'Tabla con columnas y filas propias, para mostrar ensayos, mediciones o cualquier comparación de datos.',
  },
  {
    id: 'zonas-tecnicas',
    label: 'Un referente por zona',
    desc: 'Selector de zonas con el técnico o referente de cada una, sus datos clave y una foto real.',
  },
  {
    id: 'escalas-volumen',
    label: 'Escalas por volumen',
    desc: 'Tarjetas con rangos de cantidad y el descuento que corresponde a cada uno, para ventas mayoristas.',
  },
  {
    id: 'pedido-mayorista',
    label: 'Catálogo con carrito',
    desc: 'Buscador + tabs de categoría + tabla de productos con contador de bultos y un carrito lateral con descuento por volumen y mínimo de compra.',
  },
  {
    id: 'logistica-zonas',
    label: 'Zonas de reparto',
    desc: 'Texto + foto y una tabla de zonas con días de reparto, mínimo y flete (gratis o no).',
  },
  {
    id: 'condiciones',
    label: 'Condiciones / políticas',
    desc: 'Grilla conectada por borde con título y descripción corta, sobre fondo oscuro — sin números ni fechas.',
  },
  {
    id: 'proceso-taller',
    label: 'Etapas de un proceso',
    desc: 'Riel horizontal para deslizar con foto, número y descripción de cada etapa — cómo se hace algo, paso a paso.',
  },
  {
    id: 'turnos',
    label: 'Turnos con resumen',
    desc: 'Wizard de 4 pasos (profesional, servicio, día, horario) con resumen y total en vivo, y confirmación por WhatsApp — para negocios con varios profesionales que atienden con turno.',
  },
  {
    id: 'hero-barberia',
    label: 'Portada con franja de disponibilidad',
    desc: 'Título grande en mayúsculas, foto fija con una franja "Hoy · turnos libres" superpuesta abajo, y una fila de estadísticas.',
  },
  {
    id: 'precios-barberia',
    label: 'Lista de precios numerada',
    desc: 'Cada servicio en su propia fila numerada, con nombre, descripción corta, duración y precio.',
  },
  {
    id: 'barberos',
    label: 'Equipo (foto grande + bio)',
    desc: 'Foto de cuerpo entero, nombre en mayúsculas, especialidad y años, y una bio corta — para presentar a cada profesional.',
  },
  {
    id: 'reviews-barberia',
    label: 'Reseñas con estrellas',
    desc: 'Tarjetas horizontales para deslizar, con estrellas, cita y quién la escribió.',
  },
  {
    id: 'footer-barberia',
    label: 'Footer en una fila',
    desc: 'Nombre, links de contacto y el crédito, todo en una sola línea — para nombres de marca cortos.',
  },
  {
    id: 'artesanas',
    label: 'Personas del equipo (con firma)',
    desc: 'Plaqueta de iniciales + nombre + oficio, bio y un detalle distintivo ("firma"), en tarjetas con altura escalonada.',
  },
  {
    id: 'ferias',
    label: 'Ferias / eventos donde estás',
    desc: 'Lista de fechas con nombre, lugar y una etiqueta de estado (próxima / confirmada) — para negocios que participan de ferias o mercados.',
  },
  {
    id: 'citas-rotativas',
    label: 'Cita única rotativa',
    desc: 'Una sola frase de cliente por vez, grande e itálica, con puntos para navegar y cambio automático — más editorial que una reseña con estrellas.',
  },
  {
    id: 'visita-taller',
    label: 'Datos + foto (libre)',
    desc: 'Filas de dato/valor completamente libres (no un formulario fijo) junto a una foto — para horarios de visita, zona de envíos, etc.',
  },
  {
    id: 'estadisticas',
    label: 'Números / estadísticas',
    desc: 'Una fila de números grandes (años, clientes, unidades vendidas) que suman de 0 al valor real al entrar en pantalla.',
  },
  {
    id: 'vidriera',
    label: 'Vidriera rotativa',
    desc: 'Una foto grande que va rotando sola entre varios productos destacados, con nombre y precio.',
  },
  {
    id: 'antes-despues',
    label: 'Antes y después',
    desc: 'Dos fotos lado a lado para mostrar una transformación o un trabajo terminado.',
  },
  {
    id: 'materiales',
    label: 'Elegí un material',
    desc: 'Muestras para tocar (maderas, telas, colores) que muestran nombre y descripción al elegir una.',
  },
  {
    id: 'anuncio',
    label: 'Barra de aviso',
    desc: 'Una franja angosta arriba de todo con un mensaje corto (ej: guardia 24 hs) y tu teléfono.',
  },
  {
    id: 'zonas',
    label: 'Zonas de cobertura',
    desc: 'Una lista con tilde de los barrios o zonas donde trabajás.',
  },
  {
    id: 'footer',
    label: 'Pie de página',
    desc: 'El cierre de la página con tu nombre y los créditos.',
  },
];

// Header y footer son el marco fijo de la página (un solo nav arriba, un
// solo cierre abajo) — el resto de las secciones se pueden repetir todas las
// veces que haga falta (por ejemplo, dos de "Productos o servicios" con
// contenidos o disposiciones distintas).
export const SECCIONES_UNICAS = ['header', 'footer'];

// Variantes de disposición interna por tipo de sección — al agregar una sección con
// más de una variante, el editor muestra estos esqueletos para elegir antes de agregarla.
export const SECTION_VARIANTS = {
  cronograma: [
    { id: 'linea', label: 'Línea de tiempo', skeleton: 'grid3' },
    { id: 'sticky', label: 'Con foto fija al costado', skeleton: 'pasosSticky' },
  ],
  header: [
    { id: 'clasico', label: 'Logo + menú', skeleton: 'navLeft' },
    { id: 'centrado', label: 'Centrado', skeleton: 'navCenter' },
    { id: 'lados', label: 'Logo al medio', skeleton: 'navSplit' },
  ],
  hero: [
    { id: 'zonas', label: 'Imagen + texto', skeleton: 'split', group: 'Distribuciones' },
    { id: 'zonas-centrado', label: 'Centrado', skeleton: 'heroCentro', group: 'Distribuciones' },
    { id: 'zonas-superpuesto', label: 'Foto de fondo', skeleton: 'heroFondo', group: 'Distribuciones' },
    { id: 'centrado', label: 'Centrado', skeleton: 'centered', group: 'Distribuciones fijas' },
    { id: 'split', label: 'Imagen + texto', skeleton: 'split', group: 'Distribuciones fijas' },
    { id: 'minimal', label: 'Minimalista', skeleton: 'heroMinimal', group: 'Distribuciones fijas' },
    { id: 'fondo', label: 'Imagen de fondo', skeleton: 'heroFondo', group: 'Distribuciones fijas' },
    { id: 'ofertas', label: 'Vidriera rotativa', skeleton: 'heroVidriera', group: 'Distribuciones fijas' },
    { id: 'cuenta-regresiva', label: 'Cuenta regresiva a una fecha', skeleton: 'heroVidriera', group: 'Distribuciones fijas' },
    { id: 'destacado', label: 'Foto + producto destacado', skeleton: 'heroVidriera', group: 'Distribuciones fijas' },
    { id: 'duo', label: 'Dos fotos', skeleton: 'heroDuo', group: 'Distribuciones fijas' },
    { id: 'flanqueada', label: 'Foto a cada lado', skeleton: 'heroDuo', group: 'Distribuciones fijas' },
    { id: 'centro', label: 'Todo centrado, sin foto', skeleton: 'heroCentro', group: 'Distribuciones fijas' },
  ],
  galeria: [
    { id: 'grid', label: 'Grilla', skeleton: 'grid4' },
    { id: 'carousel', label: 'Carrusel', skeleton: 'carousel' },
    { id: 'masonry', label: 'Masonry', skeleton: 'masonry' },
    { id: 'bento', label: 'Destacado + grilla', skeleton: 'galeriaBento' },
    { id: 'scroll', label: 'Fila con scroll', skeleton: 'carousel' },
  ],
  testimonios: [
    { id: 'grid', label: 'Tarjetas', skeleton: 'grid3' },
    { id: 'carousel', label: 'Carrusel', skeleton: 'carousel' },
    { id: 'destacado', label: 'Reseña destacada', skeleton: 'destacado' },
    { id: 'scroll', label: 'Fila con scroll', skeleton: 'testimoniosScroll' },
  ],
  contacto: [
    { id: 'centrado', label: 'Formulario centrado', skeleton: 'centered' },
    { id: 'split', label: 'Imagen + formulario', skeleton: 'split' },
    { id: 'mapa', label: 'Formulario + mapa', skeleton: 'contactoMapa' },
    { id: 'directo', label: 'Sin formulario, directo a WhatsApp', skeleton: 'contactoDirecto' },
  ],
  faq: [
    { id: 'lista', label: 'Lista centrada', skeleton: 'centered' },
    { id: 'imagen-lista', label: 'Imagen + preguntas', skeleton: 'split' },
  ],
  productos: [
    { id: 'grid-3', label: 'Filas de 3', skeleton: 'grid3col', group: 'Productos' },
    { id: 'grid-4', label: 'Filas de 4', skeleton: 'grid4col', group: 'Productos' },
    { id: 'grid-5', label: 'Filas de 5', skeleton: 'grid5col', group: 'Productos' },
    { id: 'lista', label: 'Lista', skeleton: 'productosLista', group: 'Productos' },
    { id: 'fila', label: 'Fila con foto', skeleton: 'productosFila', group: 'Productos' },
    { id: 'bento', label: 'Destacado + grilla', skeleton: 'productosBento', group: 'Productos' },
    { id: 'destacada', label: 'Pieza destacada + categorías', skeleton: 'productosBento', group: 'Productos' },
    { id: 'catalogo', label: 'Catálogo con filtro', skeleton: 'productosCatalogo', group: 'Productos' },
    { id: 'servicios', label: 'Tarjetas sin foto', skeleton: 'productosServicios', group: 'Servicios' },
    { id: 'tarifario', label: 'Lista de precios (con WhatsApp)', skeleton: 'productosTarifario', group: 'Precios' },
  ],
  'sobre-nosotros': [
    { id: 'zonas', label: 'Texto + datos', skeleton: 'split', group: 'Distribuciones' },
    { id: 'zonas-centrado', label: 'Centrado', skeleton: 'aboutCentered', group: 'Distribuciones' },
    { id: 'zonas-superpuesto', label: 'Imagen de fondo', skeleton: 'heroFondo', group: 'Distribuciones' },
    { id: 'split', label: 'Texto + datos', skeleton: 'split', group: 'Distribuciones fijas' },
    { id: 'centrado', label: 'Centrado', skeleton: 'aboutCentered', group: 'Distribuciones fijas' },
    { id: 'fondo', label: 'Imagen de fondo', skeleton: 'heroFondo', group: 'Distribuciones fijas' },
  ],
  footer: [
    { id: 'simple', label: 'Simple', skeleton: 'centered' },
    { id: 'columnas', label: 'Con columnas', skeleton: 'split' },
    { id: 'minimal', label: 'Minimalista con redes', skeleton: 'footerMinimal' },
    { id: 'newsletter', label: 'Con newsletter', skeleton: 'footerNewsletter' },
    { id: 'tienda', label: 'Con medios de pago y contacto', skeleton: 'footerMinimal' },
    { id: 'evento', label: 'Cierre de evento con hashtag', skeleton: 'centered' },
    { id: 'gigante', label: 'Nombre gigante', skeleton: 'centered' },
  ],
  categorias: [{ id: 'scroll', label: 'Fila con scroll', skeleton: 'categoriasScroll' }],
  pasos: [
    { id: 'numerados', label: 'Pasos numerados', skeleton: 'pasosNumerados' },
    { id: 'timeline', label: 'Línea de tiempo vertical', skeleton: 'pasosTimeline' },
    { id: 'sticky', label: 'Con foto fija + datos técnicos', skeleton: 'pasosSticky' },
  ],
  reservas: [{ id: 'calendario', label: 'Calendario y horarios', skeleton: 'reservasCalendario' }],
  areas: [{ id: 'lista-detalle', label: 'Lista + detalle', skeleton: 'areasListaDetalle' }],
  pagos: [{ id: 'fila', label: 'Fila de badges', skeleton: 'pagosFila' }],
  financiacion: [{ id: 'simulador', label: 'Simulador de cuotas', skeleton: 'financiacionSimulador' }],
  beneficios: [
    { id: 'fila', label: 'Fila con íconos', skeleton: 'beneficiosFila' },
    { id: 'grid', label: 'Tarjetas en grilla', skeleton: 'beneficiosGrid' },
  ],
  marquee: [{ id: 'scroll', label: 'Texto en movimiento', skeleton: 'marqueeScroll' }],
  series: [
    { id: 'tabs', label: 'Tabs con imagen', skeleton: 'seriesTabs' },
    { id: 'lista', label: 'Lista vertical con imagen', skeleton: 'seriesLista' },
  ],
  archivo: [{ id: 'bento', label: 'Grilla con lightbox', skeleton: 'archivoBento' }],
  estadisticas: [{ id: 'fila', label: 'Fila de números', skeleton: 'estadisticasFila' }],
  vidriera: [{ id: 'rotativa', label: 'Foto rotativa', skeleton: 'vidrieraRotativa' }],
  'antes-despues': [{ id: 'lado-a-lado', label: 'Lado a lado', skeleton: 'antesDespues' }],
  materiales: [{ id: 'muestras', label: 'Muestras + detalle', skeleton: 'materialesMuestras' }],
  anuncio: [{ id: 'simple', label: 'Franja simple', skeleton: 'anuncioSimple' }],
  zonas: [
    { id: 'lista', label: 'Lista con tilde', skeleton: 'zonasLista' },
    { id: 'chips', label: 'Pastillas sueltas', skeleton: 'zonasChips' },
  ],
  precios: [{ id: 'tarjetas', label: 'Tarjetas', skeleton: 'grid3col' }],
  equipo: [
    { id: 'grid', label: 'Tarjetas', skeleton: 'grid3' },
    { id: 'carousel', label: 'Carrusel', skeleton: 'carousel' },
    { id: 'retrato', label: 'Fotos grandes', skeleton: 'equipoRetrato' },
  ],
  cta: [
    { id: 'zonas', label: 'Centrado', skeleton: 'ctaCentered', group: 'Distribuciones' },
    { id: 'zonas-superpuesto', label: 'Con imagen de fondo', skeleton: 'ctaImage', group: 'Distribuciones' },
    { id: 'centrado', label: 'Centrado', skeleton: 'ctaCentered', group: 'Distribuciones fijas' },
    { id: 'fondo', label: 'Con imagen de fondo', skeleton: 'ctaImage', group: 'Distribuciones fijas' },
  ],
  menu: [{ id: 'lista', label: 'Lista por categoría', skeleton: 'menuList' }],
  marcas: [{ id: 'fila', label: 'Fila de logos', skeleton: 'marcasRow' }],
  mapa: [{ id: 'completo', label: 'Pantalla completa', skeleton: 'mapaFull' }],
  blog: [
    { id: 'grid', label: 'Grilla', skeleton: 'grid3' },
    { id: 'lista', label: 'Lista', skeleton: 'centered' },
  ],
};

// Plantilla y datos de negocio "neutros" para la vista previa en vivo del
// menú de secciones (ver SectionLivePreview en SitePreview.jsx) — no son de
// ningún rubro puntual, para que la miniatura se vea razonable sea cual sea
// el tipo de sección que se esté mostrando.
export const SECTION_PREVIEW_TEMPLATE = { id: 'preview', rubros: [], accent: '#7c5cff', accentSoft: tint('#7c5cff', 88) };
export const SECTION_PREVIEW_SITE_DATA = {
  nombreNegocio: 'Tu Negocio',
  rubroLabel: 'Tu rubro o eslogan',
  sobreNosotros: 'Contá acá de qué se trata tu negocio y qué te diferencia de otros.',
  whatsapp: '5491100000000',
  telefono: '011 0000-0000',
  direccion: 'Tu dirección',
  horarios: 'Lun a Vie, 9 a 18 hs',
  instagram: '@tunegocio',
  galeria: [img('preview-1'), img('preview-2'), img('preview-3'), img('preview-4')],
};

// Datos de ejemplo por tipo de sección para esa misma vista previa — cubre
// los campos que viven DIRECTO en la sección (arrays propios: items, zonas,
// citas, etc.), que si no se completan quedan vacíos y la vista previa no
// muestra nada útil. Las 8 listas globales (productos/faqs/testimonios/
// planes/equipo/menuItems/marcas/posts) no hace falta repetirlas acá: usan
// directo sus seed*() ya existentes (ver SectionLivePreview).
export const SECTION_PREVIEW_DATA = {
  categorias: {
    categorias: [
      { id: 'p1', img: img('preview-cat-1'), label: 'Categoría uno' },
      { id: 'p2', img: img('preview-cat-2'), label: 'Categoría dos' },
      { id: 'p3', img: img('preview-cat-3'), label: 'Categoría tres' },
    ],
  },
  pasos: {
    pasos: [
      { id: 'p1', titulo: 'Elegí lo que necesitás', desc: 'Mirá el catálogo y elegí lo que te sirve.' },
      { id: 'p2', titulo: 'Coordiná por WhatsApp', desc: 'Te confirmamos disponibilidad al toque.' },
      { id: 'p3', titulo: 'Listo', desc: 'Retirás o te lo llevamos.' },
    ],
  },
  areas: {
    areas: [
      { id: 'p1', nombre: 'Primera área', resumen: 'Resumen breve.', desc: 'Descripción más larga de esta área de práctica.', tags: ['Etiqueta uno', 'Etiqueta dos'] },
      { id: 'p2', nombre: 'Segunda área', resumen: 'Resumen breve.', desc: 'Descripción más larga de esta otra área.', tags: ['Etiqueta tres'] },
    ],
  },
  pagos: { metodos: [{ id: 'p1', label: 'Efectivo' }, { id: 'p2', label: 'Transferencia' }, { id: 'p3', label: 'Tarjetas' }] },
  financiacion: {},
  beneficios: {
    items: [
      { id: 'p1', icon: 'check', titulo: 'Envío gratis', desc: 'En compras desde cierto monto.' },
      { id: 'p2', icon: 'shield', titulo: 'Garantía', desc: '30 días para cambios.' },
      { id: 'p3', icon: 'clock', titulo: 'Entrega rápida', desc: '24 a 48 hs hábiles.' },
    ],
  },
  marquee: { mensajes: [{ id: 'p1', texto: 'Visto en La Nación' }, { id: 'p2', texto: '+500 clientes' }, { id: 'p3', texto: 'Desde 2015' }] },
  series: {
    items: [
      { id: 'p1', key: 'Serie A', title: 'Primera serie', desc: 'Descripción de esta serie de trabajos.', year: '2026', format: 'Digital', count: '18 fotografías', hint: 'Retratos', imagen: img('preview-serie-1') },
      { id: 'p2', key: 'Serie B', title: 'Segunda serie', desc: 'Otra serie distinta.', year: '2025', format: 'Analógico', count: '24 fotografías', hint: 'Paisajes', imagen: img('preview-serie-2') },
    ],
  },
  archivo: {
    items: [
      { id: 'p1', imagen: img('preview-arch-1'), titulo: 'Primera foto', meta: '35mm · 2026', colSpan: 2, rowSpan: 2 },
      { id: 'p2', imagen: img('preview-arch-2'), titulo: 'Segunda foto', meta: '2025', colSpan: 1, rowSpan: 1 },
      { id: 'p3', imagen: img('preview-arch-3'), titulo: 'Tercera foto', meta: '2025', colSpan: 1, rowSpan: 1 },
    ],
  },
  comparador: {
    modelos: [
      { id: 'p1', nombre: 'Modelo A', precioNum: 450000, specs: { precio: '$450.000', bateria: '18 hs' } },
      { id: 'p2', nombre: 'Modelo B', precioNum: 620000, specs: { precio: '$620.000', bateria: '24 hs' } },
    ],
    campos: [{ key: 'precio', label: 'Precio' }, { key: 'bateria', label: 'Batería' }],
  },
  canje: {
    modelos: [{ id: 'p1', nombre: 'Modelo A', valorBase: 300000 }, { id: 'p2', nombre: 'Modelo B', valorBase: 500000 }],
    condiciones: [{ id: 'p1', label: 'Como nuevo', hint: 'Sin marcas', factor: 1 }, { id: 'p2', label: 'Usado', hint: 'Con marcas de uso', factor: 0.7 }],
    perks: ['Retiro sin cargo', 'Evaluación en el momento'],
  },
  sucursales: {
    sucursales: [
      { id: 'p1', nombre: 'Sucursal Centro', ciudad: 'CABA', abierto: true, direccion: 'Av. Ejemplo 123', horarios: 'Lun a Sáb, 9 a 20 hs', telefono: '011 0000-0000' },
      { id: 'p2', nombre: 'Sucursal Norte', ciudad: 'CABA', abierto: true, direccion: 'Av. Otro 456', horarios: 'Lun a Vie, 9 a 18 hs', telefono: '011 1111-1111' },
    ],
  },
  cronograma: {
    items: [
      { id: 'p1', time: '19:00', title: 'Ceremonia', desc: 'Llegada e inicio.' },
      { id: 'p2', time: '21:00', title: 'Recepción', desc: 'Brindis y cena.' },
      { id: 'p3', time: '23:00', title: 'Fiesta', desc: 'Música y baile.' },
    ],
  },
  lugares: {
    items: [
      { id: 'p1', kind: 'Ceremonia', nombre: 'Salón Principal', direccion: 'Av. Ejemplo 123', hora: '19:00', imagen: img('preview-lugar-1') },
      { id: 'p2', kind: 'Fiesta', nombre: 'Quinta El Ombú', direccion: 'Ruta 8 km 40', hora: '21:00', imagen: img('preview-lugar-2') },
    ],
  },
  dresscode: {
    notas: [{ id: 'p1', positivo: true, texto: 'Elegante sport' }, { id: 'p2', positivo: false, texto: 'Jean y zapatillas' }],
    paletaColores: [{ id: 'p1', nombre: 'Verde salvia', hex: '#8a9a7a' }, { id: 'p2', nombre: 'Dorado', hex: '#c0a05c' }],
  },
  rsvp: { menuOptions: [{ id: 'p1', nombre: 'Carne', desc: 'Bife de chorizo' }, { id: 'p2', nombre: 'Vegetariano', desc: 'Risotto de hongos' }] },
  playlist: { canciones: [{ id: 'p1', titulo: 'Artista — Tema', por: 'Los novios' }, { id: 'p2', titulo: 'Otro artista — Otro tema', por: 'Invitado' }] },
  regalos: {
    items: [
      { id: 'p1', glyph: '♡', titulo: 'Luna de miel', desc: 'Colaborá con nuestro viaje.', detalle: 'Alias: novios.mp' },
      { id: 'p2', glyph: '🏠', titulo: 'Nuestra casa', desc: 'Para el hogar que estamos armando.', detalle: 'Alias: casa.novios' },
    ],
  },
  historia: {
    items: [
      { id: 'p1', year: '2015', title: 'Los comienzos', desc: 'Abrimos las puertas por primera vez.' },
      { id: 'p2', year: '2020', title: 'Nueva sede', desc: 'Nos mudamos a un local más grande.' },
      { id: 'p3', year: '2026', title: 'Hoy', desc: 'Seguimos creciendo con vos.' },
    ],
  },
  hospedaje: {
    items: [
      { id: 'p1', nombre: 'Hotel Central', distancia: 'A 2 km', desc: 'Cómodo y bien ubicado.', precio: 'Desde $40.000', codigo: 'NOVIOS10' },
      { id: 'p2', nombre: 'Hostería del Sur', distancia: 'A 5 km', desc: 'Opción más económica.', precio: 'Desde $25.000', codigo: 'NOVIOS10' },
    ],
  },
  'libro-mensajes': { mensajes: [{ id: 'p1', texto: 'Felicidades, que sean muy felices.', por: 'Ana' }, { id: 'p2', texto: 'Los queremos mucho.', por: 'Juan y Sol' }] },
  'catalogo-libros': {
    items: [
      { id: 'p1', titulo: 'Cien años de soledad', autor: 'G. García Márquez', genero: 'Novela', precio: '$18.000', stock: 'En stock', stockColor: '#3f6b6b', img: img('preview-libro-1') },
      { id: 'p2', titulo: 'Rayuela', autor: 'J. Cortázar', genero: 'Novela', precio: '$16.500', stock: 'Últimas unidades', stockColor: '#b45309', img: img('preview-libro-2') },
    ],
  },
  recomendados: {
    items: [
      { id: 'p1', titulo: 'El nombre del viento', autor: 'P. Rothfuss', nota: 'Ideal para empezar con fantasía.', staff: 'Male, librera', img: img('preview-reco-1') },
      { id: 'p2', titulo: 'Persépolis', autor: 'M. Satrapi', nota: 'Una novela gráfica imperdible.', staff: 'Tomás, librero', img: img('preview-reco-2') },
    ],
  },
  'club-lectura': { datos: [{ id: 'p1', label: 'Próximo encuentro', valor: '15 de agosto' }, { id: 'p2', label: 'Dónde', valor: 'Salón de arriba' }, { id: 'p3', label: 'Cuánto', valor: 'Gratis' }] },
  'firmas-eventos': {
    items: [
      { id: 'p1', dia: '12', mes: 'Ago', titulo: 'Firma de ejemplares', detalle: 'Con la autora invitada.', hora: '18:00' },
      { id: 'p2', dia: '20', mes: 'Ago', titulo: 'Club de lectura', detalle: 'Charla abierta.', hora: '19:00' },
    ],
  },
  'pedidos-especiales': { pasos: [{ id: 'p1', texto: 'Nos escribís el título y autor.' }, { id: 'p2', texto: 'Te confirmamos precio y llegada.' }, { id: 'p3', texto: 'Te avisamos cuando está.' }] },
  'visitanos-boletin': { filas: [{ id: 'p1', label: 'Dirección', valor: 'Av. Ejemplo 123' }, { id: 'p2', label: 'Horario', valor: 'Lun a Sáb, 9 a 20 hs' }] },
  'ciclo-trabajo': {
    items: [
      { id: 'p1', n: '01', rango: 'Semana 1—2', titulo: 'Diseño', desc: 'Definimos la propuesta.', items: ['Reunión inicial', 'Boceto'] },
      { id: 'p2', n: '02', rango: 'Semana 3—4', titulo: 'Producción', desc: 'Fabricamos la pieza.', items: ['Torno', 'Horneado'] },
    ],
  },
  'catalogo-insumos': {
    items: [
      { id: 'p1', tipo: 'Analgésico', nombre: 'Ejemplo A', formula: 'Ibuprofeno 400mg', precio: '$2.500', unidad: 'por caja', stock: 'Disponible', stockColor: '#3f6b2b', specs: [{ k: 'Presentación', v: 'x30 comp.' }] },
      { id: 'p2', tipo: 'Antibiótico', nombre: 'Ejemplo B', formula: 'Amoxicilina 500mg', precio: '$4.200', unidad: 'por caja', stock: 'Disponible', stockColor: '#3f6b2b', specs: [{ k: 'Presentación', v: 'x21 comp.' }] },
    ],
  },
  cotizador: {
    opciones: [
      { id: 'p1', label: 'Opción A', dosis: 2, dosisUnidad: 'kg/ha', producto: 'Producto sugerido A', precioUnitario: 850, precioUnidad: 'kg', extra: 0 },
      { id: 'p2', label: 'Opción B', dosis: 1.5, dosisUnidad: 'kg/ha', producto: 'Producto sugerido B', precioUnitario: 1200, precioUnidad: 'kg', extra: 0 },
    ],
  },
  ensayos: {
    columnas: ['Producto', 'Rinde (kg/ha)', 'Variación'],
    filas: [
      { id: 'p1', cells: ['Producto A', '4.200', '+8%'] },
      { id: 'p2', cells: ['Producto B', '3.900', '+2%'] },
    ],
  },
  'zonas-tecnicas': {
    zonas: [
      { id: 'p1', label: 'Zona Norte', tech: 'Juan Pérez', specialty: 'Instalaciones', facts: [{ k: 'Experiencia', v: '10 años' }] },
      { id: 'p2', label: 'Zona Sur', tech: 'Ana Gómez', specialty: 'Mantenimiento', facts: [{ k: 'Experiencia', v: '6 años' }] },
    ],
  },
  'escalas-volumen': {
    items: [
      { id: 'p1', tag: 'Nivel 1', rango: '10 a 50 u.', off: '−5 %', desc: 'Descuento inicial.', topColor: '#c6ccd8' },
      { id: 'p2', tag: 'Nivel 2', rango: '51 a 200 u.', off: '−12 %', desc: 'Para pedidos grandes.', topColor: '#c9a227' },
    ],
  },
  'pedido-mayorista': {
    items: [
      { id: 'p1', sku: 'SKU-001', nombre: 'Producto A', categoria: 'Categoría 1', unidad: 'Bulto x 10', precio: 1200, stockN: 80 },
      { id: 'p2', sku: 'SKU-002', nombre: 'Producto B', categoria: 'Categoría 2', unidad: 'Bulto x 6', precio: 2400, stockN: 40 },
    ],
    tiers: [{ id: 'p1', umbral: 20, descuento: 5, etiqueta: 'Nivel 1' }, { id: 'p2', umbral: 50, descuento: 10, etiqueta: 'Nivel 2' }],
  },
  'logistica-zonas': {
    zonas: [
      { id: 'p1', zona: 'CABA', dias: 'Lun a Vie', minimo: '$50.000', flete: 'Gratis', gratis: true },
      { id: 'p2', zona: 'GBA', dias: 'Mar y Jue', minimo: '$80.000', flete: '$3.500', gratis: false },
    ],
  },
  condiciones: {
    items: [
      { id: 'p1', titulo: 'Cambios', desc: 'Hasta 10 días con el comprobante.' },
      { id: 'p2', titulo: 'Envíos', desc: 'A todo el país por correo.' },
    ],
  },
  'proceso-taller': {
    pasos: [
      { id: 'p1', titulo: 'Modelado', desc: 'Se arma la pieza a mano.', imagen: img('preview-taller-1') },
      { id: 'p2', titulo: 'Horneado', desc: 'Cocción en horno propio.', imagen: img('preview-taller-2') },
    ],
  },
  turnos: {
    barberos: [{ id: 'p1', nombre: 'Franco', especialidad: 'Fade y barba', imagen: img('preview-barbero-1') }, { id: 'p2', nombre: 'Lucas', especialidad: 'Clásico', imagen: img('preview-barbero-2') }],
    servicios: [{ id: 'p1', nombre: 'Corte', minutos: 30, precio: 8000 }, { id: 'p2', nombre: 'Corte + Barba', minutos: 45, precio: 12000 }],
  },
  'precios-barberia': {
    servicios: [
      { id: 'p1', nombre: 'Corte clásico', desc: 'Con máquina y tijera.', minutos: 30, precio: 8000 },
      { id: 'p2', nombre: 'Barba', desc: 'Perfilado con navaja.', minutos: 20, precio: 5000 },
    ],
  },
  barberos: {
    barberos: [
      { id: 'p1', nombre: 'Franco', especialidad: 'Fade y diseños', anios: '8 años', bio: 'Especialista en cortes modernos.', foto: img('preview-barbero-3') },
      { id: 'p2', nombre: 'Lucas', especialidad: 'Clásico y barba', anios: '5 años', bio: 'Estilo prolijo de toda la vida.', foto: img('preview-barbero-4') },
    ],
  },
  'reviews-barberia': {
    reviews: [
      { id: 'p1', cita: 'El mejor corte que me hice en años.', persona: 'Martín', meta: 'Cliente desde 2022' },
      { id: 'p2', cita: 'Atención impecable, quedé recontento.', persona: 'Diego', meta: 'Cliente desde 2023' },
    ],
  },
  artesanas: {
    artesanas: [
      { id: 'p1', nombre: 'María López', oficio: 'Ceramista', anios: '12 años', bio: 'Trabaja el gres desde el 2012.', firma: 'Esmaltados propios', badgeBg: '#b5502f' },
      { id: 'p2', nombre: 'Carla Ruiz', oficio: 'Torneras', anios: '7 años', bio: 'Especialista en piezas utilitarias.', firma: 'Piezas únicas', badgeBg: '#6b7f5e' },
    ],
  },
  ferias: {
    ferias: [
      { id: 'p1', fechas: '14—16 AGO', nombre: 'Feria de Diseño', ciudad: 'Palermo, CABA', stand: 'B-12', destacada: true },
      { id: 'p2', fechas: '2—3 SEP', nombre: 'Mercado de Artesanos', ciudad: 'San Telmo, CABA', stand: 'A-4', destacada: false },
    ],
  },
  'citas-rotativas': {
    citas: [
      { id: 'p1', frase: 'Un trabajo hermoso, superó lo que esperaba.', persona: 'Julieta', ciudad: 'CABA' },
      { id: 'p2', frase: 'Atención personalizada de principio a fin.', persona: 'Nico', ciudad: 'Rosario' },
    ],
  },
  'visita-taller': { filas: [{ id: 'p1', label: 'Horario de visitas', value: 'Sáb 10 a 13 hs' }, { id: 'p2', label: 'Cupo', value: 'Hasta 6 personas' }] },
  estadisticas: { items: [{ id: 'p1', label: 'Años en el rubro', target: 15 }, { id: 'p2', label: 'Clientes', target: 850 }, { id: 'p3', label: 'Proyectos', target: 320 }] },
  vidriera: {
    items: [
      { id: 'p1', nombre: 'Torta de chocolate', precio: 'Desde $18.000', imagen: img('preview-vidriera-1') },
      { id: 'p2', nombre: 'Torta de frutas', precio: 'Desde $20.000', imagen: img('preview-vidriera-2') },
    ],
  },
  materiales: {
    materiales: [
      { id: 'p1', nombre: 'Roble claro', desc: 'Madera cálida, ideal para interiores.', imagen: img('preview-material-1') },
      { id: 'p2', nombre: 'Nogal oscuro', desc: 'Más resistente, terminación premium.', imagen: img('preview-material-2') },
    ],
  },
  zonas: { zonas: [{ id: 'p1', nombre: 'Palermo' }, { id: 'p2', nombre: 'Belgrano' }, { id: 'p3', nombre: 'Recoleta' }] },
  reservas: { servicios: [{ id: 'p1', nombre: 'Corte de pelo' }, { id: 'p2', nombre: 'Manicura' }] },
};

// Catálogo de "objetos" que se pueden agregar dentro de una Zona (ver
// variante "zonas" de Hero) — primer paso del sistema de Zonas + Objetos:
// en vez de una distribución fija por sección, el usuario arma el
// contenido eligiendo qué objetos van y en qué orden, dentro de límites
// por zona (ver `allowedTypes`/`maxObjetos` en SeccionHero). El ícono se
// resuelve por nombre en SitePreview.jsx (mismo patrón que ICON_LIBRARY).
export const OBJECT_TYPES = {
  titulo: { label: 'Título', icon: 'TypeIcon' },
  texto: { label: 'Texto', icon: 'AlignLeftIcon' },
  boton: { label: 'Botón', icon: 'LinkIcon' },
  imagen: { label: 'Imagen', icon: 'ImageIcon' },
  carrusel: { label: 'Carrusel', icon: 'ImagesIcon' },
  badge: { label: 'Etiqueta', icon: 'TagIcon' },
};

// Contenido de ejemplo con el que arranca cada tipo de sección con lista propia
// (productos, FAQ, testimonios) — nunca una hoja en blanco, sea que la sección
// venga pre-armada en la plantilla o que se agregue después a mano.
export const seedProductos = () => [
  {
    id: 'producto-seed',
    nombre: 'Producto de ejemplo',
    precio: 5000,
    desc: 'Editá o borrá este ejemplo y agregá los tuyos.',
    detalle: '',
    imagenes: [],
  },
];

export const seedFaqs = (horarios) => [
  {
    id: 'faq-seed-1',
    q: '¿Cómo puedo pagar?',
    a: 'Aceptamos efectivo, transferencia y todas las tarjetas.',
  },
  {
    id: 'faq-seed-2',
    q: '¿Cuáles son los horarios de atención?',
    a: horarios || 'Consultanos por WhatsApp para conocer nuestros horarios.',
  },
];

export const seedTestimonios = () => [
  {
    id: 'testimonio-seed-1',
    nombre: 'Juan Pérez',
    texto: 'Excelente atención, muy recomendable.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/80?img=12',
    verificado: false,
  },
  {
    id: 'testimonio-seed-2',
    nombre: 'María López',
    texto: 'Quedé muy conforme, superó mis expectativas.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/80?img=45',
    verificado: false,
  },
  {
    id: 'testimonio-seed-3',
    nombre: 'Carlos Gómez',
    texto: 'Rápido, prolijo y a buen precio.',
    rating: 4,
    avatar: 'https://i.pravatar.cc/80?img=33',
    verificado: false,
  },
];

export const seedPlanes = () => [
  {
    id: 'plan-seed-1',
    nombre: 'Básico',
    precio: 8000,
    periodo: 'mes',
    destacado: false,
    features: ['Hasta 5 clientes', 'Soporte por email'],
    boton: {},
  },
  {
    id: 'plan-seed-2',
    nombre: 'Pro',
    precio: 15000,
    periodo: 'mes',
    destacado: true,
    features: ['Clientes ilimitados', 'Soporte prioritario', 'Reportes mensuales'],
    boton: {},
  },
  {
    id: 'plan-seed-3',
    nombre: 'Premium',
    precio: 25000,
    periodo: 'mes',
    destacado: false,
    features: ['Todo lo del Pro', 'Atención personalizada', 'Asesoría mensual'],
    boton: {},
  },
];

export const seedEquipo = () => [
  { id: 'equipo-seed-1', nombre: 'Ana Martínez', rol: 'Fundadora', foto: 'https://i.pravatar.cc/200?img=47' },
  { id: 'equipo-seed-2', nombre: 'Diego Torres', rol: 'Encargado', foto: 'https://i.pravatar.cc/200?img=68' },
];

export const seedMenu = () => [
  {
    id: 'menu-seed-1',
    categoria: 'Entradas',
    nombre: 'Empanadas (x3)',
    descripcion: 'Carne, pollo o jamón y queso.',
    precio: 3500,
  },
  {
    id: 'menu-seed-2',
    categoria: 'Principales',
    nombre: 'Milanesa con papas',
    descripcion: 'A elección, napolitana o común.',
    precio: 8500,
  },
  {
    id: 'menu-seed-3',
    categoria: 'Postres',
    nombre: 'Flan casero',
    descripcion: 'Con dulce de leche y crema.',
    precio: 3000,
  },
];

// Los logos de clientes arrancan vacíos a propósito: son marcas reales del
// negocio, no tiene sentido sembrar ejemplos genéricos ahí.
export const seedMarcas = () => [];

export const seedPosts = () => [
  {
    id: 'post-seed-1',
    titulo: 'Novedad de ejemplo',
    resumen: 'Editá o borrá este ejemplo y contá tus propias novedades.',
    imagen: '',
    videoUrl: '',
  },
];

export const PLAN = {
  nombre: 'Plan Emprendedor',
  precio: 15000,
  moneda: 'ARS',
  ciclo: 'mes',
  beneficios: [
    'Dominio propio: tunegocio.sitiowebdigital.com.ar',
    'Hosting y mantenimiento incluidos',
    'Botón de WhatsApp directo para tus clientes',
    'Editor ilimitado: cambiá lo que quieras cuando quieras',
    'Estadísticas de visitas y contactos',
    'Soporte humano por WhatsApp',
  ],
};

export const slugify = (text) =>
  (text || 'tunegocio')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)
    .replace(/^-+|-+$/g, '') || 'tunegocio';
