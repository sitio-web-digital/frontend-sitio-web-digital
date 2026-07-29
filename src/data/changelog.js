// Historial de versiones — cada vez que se hace un cambio o arreglo se
// agrega una entrada nueva ACÁ ARRIBA de todo (más nueva primero) y se sube
// el número de versión. Lo lee el tab "Versiones" de Admin y el modal de
// novedades que aparece una vez por versión nueva (ver App.jsx > VersionGate
// y Admin.jsx > VersionesSection).
export const CHANGELOG = [
  {
    version: '1.9.1',
    date: '2026-07-29',
    changes: [
      { type: 'nuevo', text: 'Portada (Hero, distribución "Imagen de fondo"): se le puede poner una frase corta al lado de los botones (ej: "14 años · 400+ sesiones").' },
      { type: 'nuevo', text: 'Precios y planes: un plan puede mostrar un precio de texto libre (ej: "A medida") en vez de un monto fijo.' },
      { type: 'nuevo', text: 'Testimonios: cada uno puede llevar un cargo o contexto corto debajo del nombre (ej: "Directora de arte").' },
      { type: 'fix', text: 'Menciones/marquee: se agregó el separador "·" entre menciones, como en el diseño original.' },
    ],
  },
  {
    version: '1.9.0',
    date: '2026-07-29',
    changes: [
      { type: 'fix', text: 'Estudio Lumen pasó a ser una plantilla real y editable (como cualquier otra creada desde "Guardar como plantilla") en vez de una entrada fija en el código — ahora aparece en Admin > Plantillas con sus botones de Editar/Despublicar/Borrar, igual que las demás.' },
      { type: 'nuevo', text: 'Las plantillas ahora pueden llevar su propia paleta completa (fondo/texto/bordes), no solo un color de acento — necesario para que Estudio Lumen mantenga su fondo oscuro siendo una plantilla real de base de datos.' },
    ],
  },
  {
    version: '1.8.2',
    date: '2026-07-29',
    changes: [
      { type: 'nuevo', text: 'Admin > Plantillas: ahora también se listan las plantillas de fábrica (incluida Estudio Lumen), marcadas como "De fábrica" — antes solo se veían las creadas por un admin, y no había forma de confirmar desde acá que las de fábrica existían.' },
    ],
  },
  {
    version: '1.8.1',
    date: '2026-07-29',
    changes: [
      { type: 'fix', text: 'Galería de plantillas: las de fábrica (incluida Estudio Lumen) ya no quedan ocultas apenas existe una plantilla propia creada por un admin — ahora se muestran siempre las dos juntas.' },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-07-29',
    changes: [
      { type: 'nuevo', text: 'Nueva plantilla "Estudio Lumen": fondo oscuro, acento dorado y tipografía editorial — pensada para fotógrafos y estudios creativos.' },
      { type: 'nuevo', text: 'Sección "Menciones / marquee": texto en movimiento continuo para medios, premios o clientes con los que trabajaste.' },
      { type: 'nuevo', text: 'Sección "Series / colecciones": tabs que muestran una foto y un detalle distinto por cada serie o colección de trabajos.' },
      { type: 'nuevo', text: 'Sección "Archivo con zoom": grilla de fotos en distintos tamaños que se amplían en pantalla completa al tocarlas.' },
      { type: 'nuevo', text: 'Pasos: nueva distribución con foto fija al costado, pasos numerados y una grilla de datos técnicos (cámara, equipo, etc).' },
      { type: 'nuevo', text: 'Testimonios: nueva distribución en fila con scroll horizontal.' },
      { type: 'nuevo', text: 'Formulario de contacto: nueva distribución sin formulario, directo a WhatsApp con los datos de contacto al lado.' },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-07-28',
    changes: [
      { type: 'mejora', text: 'Editor: se sacó el texto "Paso 3 · Personalizá tu página" de la barra superior.' },
      { type: 'fix', text: 'Editor: el menú de formato de texto (negrita, color, ícono, etc.) ya no queda tapado al editar secciones cortas ancladas arriba de todo (Header, Barra de aviso) — ahora se abre hacia abajo cuando no entra arriba.' },
      { type: 'fix', text: 'Portada (Hero): ahora se puede cambiar la foto directamente desde la sección, en todas sus distribuciones — antes solo mostraba la primera foto de la galería sin forma de reemplazarla.' },
      { type: 'nuevo', text: 'Beneficios / confianza: cada ítem tiene su propio selector de ícono, y la sección suma una segunda distribución en tarjetas (antes solo tenía la fila angosta).' },
      { type: 'nuevo', text: 'Zonas de cobertura: nueva distribución en pastillas sueltas, además de la lista con tilde de siempre.' },
      { type: 'nuevo', text: 'Productos o servicios (distribución "Lista de precios"): tocar un ítem manda directo al WhatsApp del negocio con un mensaje que ya menciona ese servicio puntual.' },
      { type: 'mejora', text: 'El selector de distribución de "Productos o servicios" ahora agrupa las opciones en Productos / Servicios / Precios, en vez de mostrar las 9 juntas sin distinción.' },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-07-29',
    changes: [
      { type: 'mejora', text: 'Rediseño de Admin y Dashboard: la navegación lateral pasó de una línea de color a un riel con la pestaña activa marcada como una pastilla sólida.' },
      { type: 'mejora', text: 'Los KPIs (Resumen de Admin y de Dashboard, Analytics) se muestran en una sola franja con divisores en vez de varias tarjetas repetidas.' },
      { type: 'mejora', text: 'Los títulos de cada panel de Admin ya no llevan ícono ni una franja oscura de header — un tilde de acento y el texto alcanzan, mismo tratamiento que ya tenía el Dashboard.' },
      { type: 'mejora', text: 'Filas de tablas y listas (Leads, Páginas, Plantillas, Suscripciones, Usuarios, Soporte, páginas del Dashboard) ahora resaltan al pasar el mouse.' },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-07-29',
    changes: [
      { type: 'mejora', text: 'La edición del dominio de una página se movió de "Configuración" (genérico) a la fila de esa página en Resumen — cada página va a tener el suyo, no es un dato de la cuenta.' },
      { type: 'nuevo', text: 'Dashboard > Resumen: cada página publicada y paga muestra la fecha del próximo cobro y el monto.' },
    ],
  },
  {
    version: '1.4.1',
    date: '2026-07-29',
    changes: [
      { type: 'mejora', text: 'Se sacaron los emojis de los rubros (creados y de fábrica) en Admin, el editor y la galería de plantillas — sin íconos raros.' },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-07-29',
    changes: [
      { type: 'fix', text: 'Editor: las imágenes que subís antes de crear cuenta ya no se rompen al recargar la página (se guardaban como blob:, que no sobrevive un reload).' },
      { type: 'fix', text: 'Sección "Encontranos": Horarios, Dirección y Contacto ahora se pueden editar — antes solo el título era editable.' },
      { type: 'nuevo', text: 'Sección "Encontranos": se puede subir una foto o captura para el mapa en vez del placeholder simulado.' },
      { type: 'fix', text: 'Subida real de imágenes (cuentas ya logueadas): se arregló una URL rota que venía corrompiendo todas las fotos subidas desde la migración a S3/CloudFront.' },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-07-28',
    changes: [
      { type: 'nuevo', text: 'Quiz: se valida el WhatsApp como número argentino real (10 dígitos, código de área válido) — por ahora solo pedimos números de Argentina.' },
      { type: 'fix', text: 'Dashboard: el botón "Ver" de una página publicada ahora abre la URL real (subdominio.dominio), no una vista previa interna.' },
      { type: 'nuevo', text: 'KPIs reales: visitas y clics en WhatsApp de cada página publicada ya no son un número fijo — se miden de verdad en cada visita/clic de un cliente final.' },
      { type: 'nuevo', text: 'Estadísticas: gráfico de visitas por día y fuente de tráfico con datos reales — se sacaron los KPIs que no podíamos medir de verdad (Llamadas, Vistas de ubicación).' },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-07-27',
    changes: [
      { type: 'nuevo', text: 'Soporte: se puede adjuntar imágenes en cualquier respuesta del chat, no solo al crear el ticket (tanto el cliente como el admin).' },
      { type: 'nuevo', text: 'Soporte: un admin puede "tomar" un ticket — queda visible quién lo está atendiendo.' },
      { type: 'nuevo', text: 'Soporte: los tickets tienen estado Abierto/Cerrado — un admin puede cerrarlos; cerrado, se puede seguir viendo el historial pero no admite mensajes nuevos.' },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-07-27',
    changes: [
      { type: 'nuevo', text: 'Tab de Versiones en Admin con el historial de cambios de la plataforma.' },
      { type: 'nuevo', text: 'Modal de novedades para el admin al entrar con una versión nueva.' },
      { type: 'nuevo', text: 'Los admins pueden eliminar usuarios desde Admin > Usuarios (nunca a otro admin).' },
      { type: 'fix', text: 'Términos y Condiciones: ya no se piden de nuevo si la cuenta ya los firmó.' },
      { type: 'mejora', text: 'Dashboard del cliente sin íconos decorativos, más simple.' },
      { type: 'mejora', text: 'El fondo animado del home ya no deja un hueco vacío abajo en pantallas altas.' },
      { type: 'nuevo', text: 'Admin puede crear usuarios admin/analytics con botón de mostrar/ocultar contraseña.' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-26',
    changes: [{ type: 'nuevo', text: 'Primera versión de la plataforma.' }],
  },
];

export const CURRENT_VERSION = CHANGELOG[0].version;
