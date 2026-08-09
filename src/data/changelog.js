// Historial de versiones — cada vez que se hace un cambio o arreglo se
// agrega una entrada nueva ACÁ ARRIBA de todo (más nueva primero) y se sube
// el número de versión. Lo lee el tab "Versiones" de Admin y el modal de
// novedades que aparece una vez por versión nueva (ver App.jsx > VersionGate
// y Admin.jsx > VersionesSection).
export const CHANGELOG = [
  {
    version: '1.46.9',
    date: '2026-08-09',
    changes: [
      { type: 'fix', text: 'La Vista previa de una página recién creada podía no mostrar el botón "Publicar ahora" — el editor seguía sondeando el estado de una página distinta (una que ya estaba abierta antes) por quedarse con una referencia vieja al pasar a "Crear nueva página" sin salir del editor.' },
    ],
  },
  {
    version: '1.46.8',
    date: '2026-08-09',
    changes: [
      { type: 'fix', text: 'La pantalla de "tu página ya está en vivo" podía mostrar el link roto (null.sitioweb.digital) recién creada una página nueva — el subdominio sí quedaba guardado bien del lado del servidor, pero el navegador no se enteraba a tiempo por una condición de carrera al guardar el estado. Arreglado.' },
    ],
  },
  {
    version: '1.46.7',
    date: '2026-08-09',
    changes: [
      { type: 'fix', text: 'Bug grave: al armar una página por primera vez, si dos guardados se disparaban casi al mismo tiempo (el autoguardado del editor y el guardado al elegir el subdominio en Checkout), cada uno podía crear su propia fila — resultado, una página duplicada, huérfana y sin subdominio dando vueltas en el Dashboard. Ahora solo se puede crear una vez: el segundo guardado se engancha a la misma creación en vez de arrancar la suya.' },
    ],
  },
  {
    version: '1.46.6',
    date: '2026-08-08',
    changes: [
      { type: 'fix', text: 'Al volver de pagar en Mercado Pago, la pantalla de confirmación podía no aparecer — aterrizaba en el hostname dedicado al retorno de pago (necesario porque Mercado Pago rechaza dominios .digital ahí), que al ser un origen distinto al de uso diario no comparte la sesión guardada. Ahora esa página, apenas carga, salta sola al dominio real (app.sitioweb.digital) preservando a dónde iba, así la sesión de siempre está disponible al instante.' },
    ],
  },
  {
    version: '1.46.5',
    date: '2026-08-08',
    changes: [
      { type: 'fix', text: 'Bug grave: un autoguardado del editor (tipear, cambiar el subdominio, etc.) podía despublicar una página que ya tenía la suscripción pagada y autorizada por Mercado Pago, si el navegador todavía no se había enterado del pago confirmado en ese momento. "Publicada" ahora es un estado que solo puede tocar el propio pago (o soporte) — nunca un guardado de contenido normal.' },
    ],
  },
  {
    version: '1.46.4',
    date: '2026-08-08',
    changes: [
      { type: 'fix', text: 'El aviso de pago confirmado (webhook) de Mercado Pago resultó no ser confiable en la práctica — a veces nunca llega, aunque esté todo bien configurado del lado de Mercado Pago. El Dashboard ahora consulta solo, cada 10 segundos, el estado real de cualquier página con un pago pendiente, así se publica sola apenas Mercado Pago confirma el cobro, sin depender de que ese aviso llegue.' },
      { type: 'fix', text: 'Se revierte otra vez el back_url al hostname dedicado con el path completo (probado en vivo: Mercado Pago rechaza cualquier dominio .digital con path, incluso después de agregarlo a las URLs de retorno de la cuenta — es una restricción fija de su lado, no de configuración).' },
    ],
  },
  {
    version: '1.46.3',
    date: '2026-08-08',
    changes: [
      { type: 'fix', text: 'Se revierte el cambio de dominio de retorno de v1.46.1/1.46.2: Mercado Pago rechaza cualquier URL de retorno en dominios .digital, sin excepción — no era un olvido de configuración, era intencional (ver infraestructura/terraform). El botón "Pagar" vuelve a funcionar apuntando al hostname dedicado a esto. Lo que sí queda arreglado de v1.46.1: el aviso de pago confirmado (webhook) ya no depende de configuración manual en Mercado Pago, así que un pago se aplica igual aunque el usuario no vea la pantalla de confirmación.' },
    ],
  },
  {
    version: '1.46.2',
    date: '2026-08-08',
    changes: [
      { type: 'fix', text: 'El fix del dominio de retorno (v1.46.1) rompió sin querer el botón "Pagar" de una segunda página — Mercado Pago rechazaba de una la URL de retorno con path por no estar todavía registrada en la cuenta. Mientras se registra del lado de Mercado Pago, se manda sin path para no bloquear el pago.' },
    ],
  },
  {
    version: '1.46.1',
    date: '2026-08-08',
    changes: [
      { type: 'fix', text: 'Bug grave: después de pagar en Mercado Pago, Mercado Pago devolvía al dominio compartido viejo en vez de app.sitioweb.digital, y el aviso de pago confirmado (webhook) nunca llegaba — quien pagaba quedaba sin la página publicada aunque ya se le hubiera cobrado. Las suscripciones ahora se crean apuntando siempre al dominio correcto y avisando por webhook sin depender de configuración manual en Mercado Pago.' },
    ],
  },
  {
    version: '1.46.0',
    date: '2026-08-08',
    changes: [
      { type: 'nuevo', text: 'Respuestas predefinidas en Soporte: un click autocompleta el mensaje con las consultas más típicas, se puede editar antes de mandar.' },
      { type: 'nuevo', text: 'Los mensajes de soporte ahora avisan por mail — al usuario cuando le responde un admin, y a los admins cuando responde el usuario (a todos si el ticket no está tomado, solo al que lo tomó si ya lo está).' },
      { type: 'nuevo', text: 'Sonido de aviso en Admin cuando llega un mensaje de soporte nuevo.' },
      { type: 'nuevo', text: 'Admin > Usuarios: mandar un mail a todos los usuarios o a uno en particular.' },
      { type: 'mejora', text: 'Botón de refrescar en cada sección de Admin, para traer lo nuevo sin esperar al sondeo automático ni recargar la página.' },
    ],
  },
  {
    version: '1.45.0',
    date: '2026-08-08',
    changes: [
      { type: 'nuevo', text: 'Ahora una misma cuenta puede tener varias páginas publicadas, cada una con su propia suscripción de $15.000/mes, su propio subdominio y su propia estadística — antes solo se podía tener una.' },
    ],
  },
  {
    version: '1.44.2',
    date: '2026-08-08',
    changes: [
      { type: 'fix', text: 'El botón "Volver a suscribirme" del mail de cancelación mandaba a Checkout, que no sabe qué hacer sin una sesión ya iniciada en ese navegador — ahora manda al Dashboard, que primero pide login si hace falta.' },
    ],
  },
  {
    version: '1.44.1',
    date: '2026-08-08',
    changes: [
      { type: 'fix', text: 'Los mails de suscripción podían mostrar "null" en vez del nombre del negocio si faltaba el dato — ahora siempre muestran algo legible.' },
      { type: 'mejora', text: 'Se configuró un dominio de retorno propio (MAIL FROM) para los mails de suscripción — mejora que no caigan en spam.' },
    ],
  },
  {
    version: '1.44.0',
    date: '2026-08-08',
    changes: [
      { type: 'nuevo', text: 'La app y las páginas publicadas de los clientes ahora viven en el dominio propio (sitioweb.digital) en vez del dominio de prueba compartido — mismos links, dirección definitiva.' },
      { type: 'nuevo', text: 'Mails automáticos por mail: cuando se publica una página (pago confirmado), cuando falla un cobro y la página se pausa, y cuando se cancela una suscripción.' },
    ],
  },
  {
    version: '1.43.1',
    date: '2026-08-08',
    changes: [
      { type: 'fix', text: 'Si alguien tocaba "Pagar" más de una vez (se arrepentía, recargaba la página, etc.) quedaban suscripciones pendientes duplicadas colgadas en Mercado Pago — ahora, antes de crear una nueva, se cancela sola cualquier intento anterior sin autorizar de esa misma página.' },
    ],
  },
  {
    version: '1.43.0',
    date: '2026-08-08',
    changes: [
      { type: 'mejora', text: 'Pantalla de "página publicada": el emoji 🎉 se reemplazó por una animación de confeti de verdad al entrar. También se sacó el cartel viejo de "prototipo — pago/subdominio/hosting simulados", que ya no es cierto.' },
    ],
  },
  {
    version: '1.42.1',
    date: '2026-08-08',
    changes: [
      { type: 'fix', text: 'Checkout: el aviso "Todavía no elegiste tu subdominio" podía aparecer antes de terminar de iniciar sesión, cuando en realidad el subdominio se asigna solo (con el nombre del negocio del quiz) apenas hay una cuenta detrás — no era un error real, solo un cartel adelantado.' },
    ],
  },
  {
    version: '1.42.0',
    date: '2026-08-07',
    changes: [
      { type: 'nuevo', text: 'Dashboard > Configuración: ahora se puede elegir un subdominio real para tu página — antes el subdominio que se mostraba en Checkout y Dashboard era solo un cálculo visual que nunca se guardaba de verdad.' },
      { type: 'nuevo', text: 'Cualquier visitante puede entrar directo a tu-subdominio.sitiowebdigital.com.ar y ver tu página publicada — antes no existía ninguna forma pública de verla, solo la vista previa interna del editor (que necesitaba estar logueado).' },
      { type: 'fix', text: 'El botón "Cancelar" de una suscripción paga fallaba siempre con un error — la app le mandaba a Mercado Pago un estado que ya no acepta. Ahora cancela bien, tanto desde el Dashboard del cliente como desde Admin > Suscripciones.' },
      { type: 'fix', text: 'Si una suscripción se cancelaba o se pausaba directo desde Mercado Pago (sin tocar el botón "Cancelar" de acá), la página se quedaba publicada para siempre igual — ahora se despublica sola apenas nos enteramos.' },
      { type: 'mejora', text: 'Admin > Suscripciones: las cuentas que se dan de baja ya no desaparecen de la lista — quedan marcadas como "Cancelada" con la fecha, para poder recontactarlas más adelante. Se suma un contador de activas vs. dadas de baja arriba de la tabla.' },
      { type: 'mejora', text: 'Admin > Resumen: nuevo KPI de cuántas cuentas se dieron de baja. Admin > Analytics: nuevo bloque con suscriptores activos, pausados y dados de baja.' },
      { type: 'mejora', text: 'Se endureció el armado de la suscripción en Mercado Pago (cambio interno de cómo se crea del lado del servidor) — mismo precio y flujo para quien paga, pero más estable.' },
    ],
  },
  {
    version: '1.41.0',
    date: '2026-08-02',
    changes: [
      { type: 'fix', text: 'Sobre Nosotros: la distribución "Centrado" no hacía nada al elegirla (se veía igual que "Texto + foto") — ahora es un layout propio, con todo centrado y la foto debajo del texto.' },
      { type: 'fix', text: 'Catálogo de libros: el contador "X de Y" contaba también los libros ocultos — ahora muestra solo los que un visitante puede llegar a ver.' },
      { type: 'nuevo', text: 'Se destrabaron 3 distribuciones que ya estaban armadas en el código pero no aparecían en el menú: Hero "Foto a cada lado", Productos "Pieza destacada + categorías" y Footer "Nombre gigante".' },
      { type: 'nuevo', text: 'Menú: los platos de una misma categoría ahora se pueden reordenar con las flechas, no solo borrar y volver a cargar en otro orden.' },
      { type: 'nuevo', text: 'Marcas: además de arrastrar, ahora hay flechas para subir/bajar cada logo — más fácil en celular.' },
      { type: 'nuevo', text: 'Header: los links del menú de navegación ahora se pueden duplicar y reordenar, no solo agregar y quitar.' },
      { type: 'nuevo', text: 'Canje y Comparador: sus listas de beneficios/campos ahora se pueden duplicar y reordenar.' },
      { type: 'nuevo', text: 'Tabla de resultados (Ensayos): ahora se pueden agregar o quitar columnas, no solo renombrarlas.' },
      { type: 'fix', text: 'Hero Barbería: los datos destacados (ej. "+500 cortes") no se podían editar ni agregar/quitar — ahora sí.' },
      { type: 'nuevo', text: 'Confirmación de asistencia (RSVP): "modo acompañante" y una pregunta extra sí/no ahora se activan desde el editor — antes solo se podían cargar escribiendo directo en la base de datos.' },
      { type: 'fix', text: 'Reseñas con estrellas (Barbería): la calificación estaba fija en 5 estrellas — ahora se puede elegir de 1 a 5, igual que en Testimonios.' },
      { type: 'mejora', text: 'Las plantillas "Bella Rosa Estudio", "Vidriera Once" y "Manos a la Obra" ahora incluyen, respectivamente, reserva de turnos, vidriera rotativa y zonas de cobertura con contenido real — antes ninguna las traía de fábrica.' },
      { type: 'fix', text: 'Más de 20 secciones (Beneficios, Cronograma, Hospedaje, Historia, Lugares, Playlist, Barberos, Estadísticas, Vidriera y otras) ya no quedan en blanco para el visitante cuando todavía no se cargó ningún ítem — ahora muestran un mensaje corto avisando que falta contenido.' },
      { type: 'fix', text: '"Formas de pago" y "Texto en movimiento" ahora se pueden reordenar con las flechas del editor, no solo arrastrando.' },
      { type: 'fix', text: 'Series, distribución "Lista vertical": la miniatura de vista previa mostraba el mismo dibujo que "Tabs" aunque el diseño real es distinto — ahora tiene su propia miniatura.' },
      { type: 'mejora', text: 'Las fotos de productos, galería, antes/después y los logos de marcas ahora llevan un texto alternativo descriptivo (accesibilidad y SEO) en vez de ir vacíos.' },
      { type: 'mejora', text: 'Ferias: la etiqueta de estado ("Próxima" / "Confirmada") ahora se ve clickeable al editar, con cursor y efecto al pasar el mouse.' },
      { type: 'nuevo', text: 'Hospedaje: cada hotel puede llevar una dirección y un link "Cómo llegar" a Google Maps, igual que en Lugares.' },
      { type: 'mejora', text: 'RSVP: los mensajes de confirmación y de "no puedo ir" ahora se editan directo desde la vista inicial del editor, sin tener que simular todo el formulario como invitado.' },
      { type: 'fix', text: 'Testimonios, variante "Destacado": ahora se puede duplicar y ocultar el testimonio, igual que en el resto de las variantes — antes solo se podía quitar.' },
      { type: 'fix', text: 'La plantilla "Todo en Uno" traía dos widgets de mapa seguidos (uno suelto y otro dentro de Contacto) — se sacó el duplicado.' },
    ],
  },
  {
    version: '1.40.0',
    date: '2026-08-02',
    changes: [
      { type: 'fix', text: 'Financiación: los precios y planes de cuotas ahora se pueden editar de verdad — antes la sección siempre mostraba los mismos montos de ejemplo sin ninguna forma de cambiarlos.' },
      { type: 'fix', text: 'Pedido mayorista: "Enviar pedido" ahora abre WhatsApp con el detalle real del pedido — antes solo mostraba un mensaje de confirmación falso, sin enviar nada.' },
      { type: 'fix', text: 'Cotizador: "Pedir cotización formal" ahora abre WhatsApp con el detalle de la cotización — antes el botón no llevaba a ningún lado.' },
      { type: 'fix', text: 'Turnos / Reservas: "Confirmar turno" ahora abre WhatsApp con el día y horario elegidos — antes el botón no hacía nada al tocarlo.' },
      { type: 'fix', text: 'Productos, distribución "Lista de precios": el campo "desde" de un ítem nuevo ya no se pierde al guardarlo.' },
      { type: 'fix', text: 'Arrastrar para reordenar ya funciona bien en secciones con grilla de varias columnas (como Zonas o Barberos) — antes soltar un ítem al costado, dentro de su misma fila, lo mandaba siempre al principio.' },
      { type: 'mejora', text: 'La plantilla "Sabor Casero" ahora trae productos y reseñas propios (milanesas, empanadas, guiso) en vez de caer en el ejemplo genérico.' },
    ],
  },
  {
    version: '1.39.1',
    date: '2026-08-02',
    changes: [
      { type: 'mejora', text: 'La ventanita de vista previa ya no muestra el cartel "Vista previa" arriba, para aprovechar mejor el espacio.' },
      { type: 'fix', text: 'La barra de scroll del menú de secciones y distribuciones se veía negra y sin contraste sobre el fondo blanco — ahora usa tonos grises claros para que se note bien dónde estás parado.' },
    ],
  },
  {
    version: '1.39.0',
    date: '2026-08-02',
    changes: [
      { type: 'mejora', text: 'La vista previa en vivo del menú de secciones ahora aparece en una ventanita separada al costado, en vez de compartir el mismo recuadro que la lista de secciones o distribuciones — se entiende mejor cuál es el menú y cuál la muestra.' },
    ],
  },
  {
    version: '1.38.0',
    date: '2026-08-02',
    changes: [
      { type: 'nuevo', text: 'Vista previa en vivo en el menú de secciones: al pasar el cursor sobre un tipo de sección o una distribución, aparece un panel que muestra esa sección de verdad, con contenido de ejemplo — ya no hace falta agregarla para saber cómo se ve.' },
    ],
  },
  {
    version: '1.37.0',
    date: '2026-08-02',
    changes: [
      { type: 'nuevo', text: 'Deshacer y rehacer (Ctrl+Z / Ctrl+Shift+Z) en todo el editor, con botones nuevos en la barra superior — cualquier cambio de contenido, color, sección o lista se puede revertir.' },
      { type: 'mejora', text: 'El menú de "Agregar sección" ahora tiene buscador y una miniatura por cada tipo, en vez de una lista de solo texto — más fácil de encontrar entre los 45+ tipos disponibles.' },
      { type: 'mejora', text: 'Las miniaturas de distribución que faltaban (Footer minimalista, CTA centrado, CTA con imagen, Menú en lista, Fila de marcas, Mapa) ya no se ven como un rectángulo gris genérico.' },
      { type: 'mejora', text: 'Las distribuciones que rotan solas (Vidriera, "Armá el tuyo" con foto automática, Marquee, cuenta regresiva, estadísticas, foto con zoom) ahora muestran esa animación en su propia miniatura del menú, para distinguirlas de un carrusel manual a simple vista.' },
    ],
  },
  {
    version: '1.36.0',
    date: '2026-08-02',
    changes: [
      { type: 'mejora', text: 'Vidriera rotativa y Cita única rotativa: el selector de fotos/citas en edición pasa de puntitos sin espacio para nada a una tira de miniaturas y una fila de fichas, cada una con sus propios controles de duplicar, mover y arrastrar.' },
      { type: 'nuevo', text: '"Un referente por zona" ahora también permite duplicar, mover y arrastrar cada zona para reordenarla.' },
    ],
  },
  {
    version: '1.35.0',
    date: '2026-08-02',
    changes: [
      { type: 'nuevo', text: 'Duplicar, ocultar y arrastrar para reordenar ahora también funciona en las secciones específicas de cada rubro: librería, farmacia/insumos, mayorista, agro, bodas y XV, fotografía, alfarería y barbería — el mismo set de controles que ya tenían las secciones genéricas.' },
    ],
  },
  {
    version: '1.34.0',
    date: '2026-08-01',
    changes: [
      { type: 'mejora', text: 'Arrastrar un objeto entre zonas de "Armá el tuyo" ahora muestra un fantasma con su ícono y contenido siguiendo al puntero, para que se vea claro qué objeto agarraste — antes solo se atenuaba en su lugar sin ninguna otra pista.' },
    ],
  },
  {
    version: '1.33.0',
    date: '2026-08-01',
    changes: [
      { type: 'nuevo', text: 'Beneficios, cómo funciona, cronograma, nuestra historia, áreas/especialidades, sucursales, estadísticas, formas de pago, menciones y categorías: todos sus ítems ahora se pueden duplicar, ocultar y arrastrar para reordenar, igual que ya podían productos, testimonios y equipo.' },
    ],
  },
  {
    version: '1.32.0',
    date: '2026-08-01',
    changes: [
      { type: 'nuevo', text: 'Llamado a la acción: sus 2 distribuciones (Centrado, Con imagen de fondo) ahora también existen en versión "Armá el tuyo" — mismo sistema de objetos armables que Hero y Sobre Nosotros. Las 2 fijas de siempre siguen disponibles debajo.' },
    ],
  },
  {
    version: '1.31.0',
    date: '2026-08-01',
    changes: [
      { type: 'fix', text: 'Zonas: la columna de foto del Hero y de Sobre Nosotros solo dejaba agregar otra foto si borrabas la que tenía — ahora esa zona también acepta un carrusel, una etiqueta o un botón, así nunca queda sin opciones.' },
      { type: 'nuevo', text: 'Nuevo objeto "Carrusel" para Zonas: varias fotos rotando en un mismo bloque, en vez de una sola imagen fija (reusa el mismo carrusel que ya usan Productos y FAQ).' },
    ],
  },
  {
    version: '1.30.0',
    date: '2026-08-01',
    changes: [
      { type: 'nuevo', text: 'Productos, testimonios, precios, equipo, marcas y novedades ahora se pueden arrastrar para reordenar, además de los botones subir/bajar que ya tenían — mismo ícono de arrastre que ya usan los objetos de "Armá el tuyo".' },
    ],
  },
  {
    version: '1.29.0',
    date: '2026-08-01',
    changes: [
      { type: 'nuevo', text: 'Sobre Nosotros: sus 3 distribuciones (Texto + datos, Centrado, Imagen de fondo) ahora también existen en versión "Armá el tuyo" — contenido armable con objetos que se pueden agregar, duplicar, ocultar y arrastrar, igual que en el Hero. Las viejas fijas siguen disponibles debajo, sin cambios.' },
      { type: 'mejora', text: 'Selector de distribución del Hero: las 3 opciones de "Armá el tuyo" ahora aparecen arriba, agrupadas como "Distribuciones", y las 9 de siempre quedan abajo agrupadas como "Distribuciones fijas" — mismo criterio que se va a usar en el resto de las secciones.' },
    ],
  },
  {
    version: '1.28.0',
    date: '2026-08-01',
    changes: [
      { type: 'nuevo', text: 'Portada (Hero) "Armá el tuyo": ahora los objetos (título, texto, botón, etc.) se pueden arrastrar para moverlos, no solo con los botones subir/bajar — incluye pasarlos de una zona a otra (ej. de la columna de texto a la de imagen) cuando el tipo de objeto lo permite. Mientras se arrastra, se resalta qué zonas lo aceptan y cuál no.' },
    ],
  },
  {
    version: '1.27.0',
    date: '2026-08-01',
    changes: [
      { type: 'nuevo', text: 'Cualquier sección se puede duplicar (ícono nuevo en su barra de controles) — útil para armar variantes rápido, ej. dos "Productos" con distinta distribución.' },
      { type: 'nuevo', text: 'Portada (Hero) "Armá el tuyo": ahora tiene 3 distribuciones (imagen + texto, centrado, foto de fondo) en vez de una sola, todas armables con los mismos objetos.' },
    ],
  },
  {
    version: '1.26.0',
    date: '2026-08-01',
    changes: [
      { type: 'nuevo', text: 'Portada (Hero): nueva distribución "Armá el tuyo (Beta)" — en vez de una portada con campos fijos, se arma agregando, duplicando, reordenando y ocultando bloques sueltos (título, texto, botón, etiqueta, imagen) dentro de dos zonas con límites propios. Primer paso del sistema de Zonas y Objetos.' },
    ],
  },
  {
    version: '1.25.0',
    date: '2026-08-01',
    changes: [
      { type: 'nuevo', text: 'Editor: los ítems de listas (productos, testimonios, precios, equipo, menú, marcas, preguntas frecuentes y novedades) ahora se pueden duplicar, subir/bajar de orden y ocultar sin borrarlos — antes solo se podían quitar. Primer paso hacia un editor menos rígido.' },
    ],
  },
  {
    version: '1.24.1',
    date: '2026-08-01',
    changes: [
      { type: 'fix', text: 'El menú de formato de texto (fuente, color, negrita, link, ícono) había dejado de aparecer al tocar cualquier texto editable. Era un bug de orden de montaje de React: el ancla del menú es un elemento padre, y su referencia todavía no estaba lista cuando el menú calculaba dónde ubicarse.' },
    ],
  },
  {
    version: '1.24.0',
    date: '2026-07-31',
    changes: [
      { type: 'nuevo', text: 'Nueva plantilla "Barbería Don Vito": hero con foto y estadísticas, wizard de reserva de turno (barbero + servicio + día + horario), lista de precios, equipo, reseñas, el local y footer — pensada para barberías y peluquerías con turno.' },
    ],
  },
  {
    version: '1.23.0',
    date: '2026-07-31',
    changes: [
      { type: 'nuevo', text: 'Nueva plantilla "Manos de Barro": hero con fotos y estadísticas, proceso de trabajo paso a paso, presentación de artesanas, catálogo de piezas por material, agenda de ferias, citas rotativas y visita al taller — pensada para talleres de cerámica y oficios artesanales.' },
    ],
  },
  {
    version: '1.22.0',
    date: '2026-07-31',
    changes: [
      { type: 'nuevo', text: 'Admin > Suscripciones: ahora muestra el estado real de Mercado Pago (Autorizada, Pendiente, Pausada, Cancelada) y la fecha del próximo cobro por página, en vez de solo la fecha de alta. "Dar de baja" cancela la suscripción real en Mercado Pago si es una cuenta paga, o simplemente despublica si es una cuenta de prueba regalada.' },
    ],
  },
  {
    version: '1.21.1',
    date: '2026-07-31',
    changes: [
      { type: 'mejora', text: 'Home: se simplificaron los títulos de "Negocios que ya están online" y "Así de simple" — menos texto, misma idea.' },
    ],
  },
  {
    version: '1.21.0',
    date: '2026-07-31',
    changes: [
      { type: 'nuevo', text: 'Admin > Términos y Condiciones: nueva sección para editar el texto completo (antes hardcodeado en el código) como un solo campo, con la fecha de "Última actualización" que se pisa sola en cada guardado. TermsGate ahora lo carga en vivo desde ahí.' },
    ],
  },
  {
    version: '1.20.5',
    date: '2026-07-31',
    changes: [
      { type: 'mejora', text: 'Checkout: ya no manda a Configuración a elegir el subdominio a mano si el nombre del negocio (dado en el Paso 1 del quiz) está libre — se lo asigna solo, con un link "Cambiar" al lado por si querés otro. El aviso de "elegilo primero" solo aparece si ese nombre puntual ya está en uso.' },
    ],
  },
  {
    version: '1.20.4',
    date: '2026-07-30',
    changes: [
      { type: 'fix', text: '"¡Página publicada!": el botón "Ver mi página" llevaba a la vista previa interna en vez de al subdominio real — ahora abre la página publicada de verdad en una pestaña nueva, igual que el botón "Ver" de Dashboard.' },
    ],
  },
  {
    version: '1.20.3',
    date: '2026-07-30',
    changes: [
      { type: 'mejora', text: 'Checkout: la lista "Incluye" mostraba los 6 beneficios del plan otra vez, ya vistos antes en el resto del recorrido. Ahora muestra solo los 3 más fuertes (dominio propio, editor ilimitado, soporte) para una pantalla más liviana.' },
    ],
  },
  {
    version: '1.20.2',
    date: '2026-07-30',
    changes: [
      { type: 'fix', text: 'Checkout y "¡Página publicada!": las tarjetas de pago (blancas, esquinas redondeadas) y los botones no seguían el estilo oscuro y de esquinas rectas del resto de la app. Ahora usan la misma paleta navy/dorado y componentes que Dashboard y el editor.' },
    ],
  },
  {
    version: '1.20.1',
    date: '2026-07-30',
    changes: [
      { type: 'mejora', text: 'Editor: si soporte responde mientras se sigue editando, aparece un aviso (y un punto sobre el ícono de Soporte) sin tener que volver a abrirlo para enterarse — mismo mecanismo que ya avisa en Dashboard > Soporte.' },
    ],
  },
  {
    version: '1.20.0',
    date: '2026-07-30',
    changes: [
      { type: 'nuevo', text: 'Editor: el botón de Soporte ahora abre el mismo chat de tickets real de Dashboard > Soporte (antes solo mandaba un mensaje simulado) — se puede crear una consulta nueva y seguir la conversación sin salir del editor.' },
    ],
  },
  {
    version: '1.19.3',
    date: '2026-07-30',
    changes: [
      { type: 'fix', text: 'Home: el reinicio del ciclo de las miniaturas que scrollean solas caía en cualquier momento, a veces con la miniatura bien visible en el medio de la pantalla. Ahora se reinicia justo cuando esa miniatura termina de salir de la pantalla (nunca a la vista), sacando el fundido a ciegas que se había agregado antes.' },
    ],
  },
  {
    version: '1.19.2',
    date: '2026-07-30',
    changes: [
      { type: 'mejora', text: 'Home: la miniatura que scrollea sola ahora se desvanece de a poco (más de un segundo) al volver a arrancar el ciclo, en vez de cortar de golpe.' },
    ],
  },
  {
    version: '1.19.1',
    date: '2026-07-30',
    changes: [
      { type: 'fix', text: 'Home: en algunas plantillas, la miniatura que scrollea sola llegaba más abajo del contenido real cargado y se veía un hueco en blanco a mitad de recorrido, antes de volver arriba. Ahora carga todas las secciones reales de esa plantilla, así el scroll nunca se queda sin contenido.' },
    ],
  },
  {
    version: '1.19.0',
    date: '2026-07-30',
    changes: [
      { type: 'mejora', text: 'Home: una de cada cuatro miniaturas de la pared del hero ahora scrollea sola lentamente para mostrar más de la página real, en vez de quedarse quieta en el hero.' },
    ],
  },
  {
    version: '1.18.1',
    date: '2026-07-30',
    changes: [
      { type: 'fix', text: 'Home: la pared de miniaturas del fondo del hero mostraba solo el header y el hero de cada plantilla, dejando un hueco en blanco abajo en las que tienen un hero más corto. Ahora se recorta un poco más abajo de cada página real, así siempre se ve contenido de punta a punta.' },
    ],
  },
  {
    version: '1.18.0',
    date: '2026-07-30',
    changes: [
      { type: 'nuevo', text: 'Nueva plantilla "Mayorista Punto Norte": distribuidora mayorista con catálogo, carrito y descuento por volumen, tipografía Saira Condensed/Overpass Mono/Rubik y paleta azul noche/naranja.' },
      { type: 'nuevo', text: 'Nueva sección "Escalas por volumen": tarjetas con rangos de cantidad y el descuento que corresponde a cada uno.' },
      { type: 'nuevo', text: 'Nueva sección "Catálogo con carrito": buscador + tabs de categoría + tabla de productos con contador de bultos y un carrito lateral que calcula el descuento por volumen y el mínimo de compra en vivo.' },
      { type: 'nuevo', text: 'Nueva sección "Zonas de reparto": texto + foto y una tabla de zonas con días de reparto, mínimo de compra y flete (marcado como gratis o no).' },
      { type: 'nuevo', text: 'Nueva sección "Condiciones / políticas": grilla conectada por borde con título y descripción corta, sobre fondo oscuro.' },
    ],
  },
  {
    version: '1.17.0',
    date: '2026-07-30',
    changes: [
      { type: 'nuevo', text: 'Nueva plantilla "AgroSur": asesoramiento agronómico e insumos de campo, con tipografía Oswald/DM Mono/Source Sans 3 y paleta verde/dorado.' },
      { type: 'nuevo', text: 'Nueva sección "Ciclo de trabajo": grilla de etapas con número, rango de fechas, título, descripción y una lista de tareas concretas.' },
      { type: 'nuevo', text: 'Nueva sección "Catálogo técnico": fichas filtrables por tipo con nombre, fórmula, datos técnicos y precio por unidad, sin fotos.' },
      { type: 'nuevo', text: 'Nueva sección "Cotizador rápido": el visitante elige una opción y una cantidad, y ve al instante una cotización estimada con el detalle.' },
      { type: 'nuevo', text: 'Nueva sección "Tabla de resultados": columnas y filas propias, para mostrar ensayos, mediciones o cualquier comparación de datos.' },
      { type: 'nuevo', text: 'Nueva sección "Un referente por zona": selector de zonas con el técnico de cada una, sus datos clave y una foto real.' },
      { type: 'mejora', text: 'Testimonios: cada reseña puede mostrar un número destacado arriba (ej: "+14%", "31 años") además del comentario.' },
    ],
  },
  {
    version: '1.16.0',
    date: '2026-07-30',
    changes: [
      { type: 'nuevo', text: 'Nueva plantilla "Librería Los Andes": comercio con catálogo, tipografía Newsreader/Courier Prime/Figtree y colores tierra/terracota.' },
      { type: 'nuevo', text: 'Nueva distribución del Hero "Foto + producto destacado": foto fija y una tarjeta flotante con un producto elegido a mano (foto, título, autor, precio y stock).' },
      { type: 'nuevo', text: 'Nueva sección "Catálogo con buscador": buscador en vivo + pestañas de género/rubro + grilla con stock, con un estado de "sin resultados" y llamado a la acción.' },
      { type: 'nuevo', text: 'Nueva sección "Recomendados del staff": fichas con foto chica, una nota de quien lo recomienda y su firma con iniciales.' },
      { type: 'nuevo', text: 'Nueva sección "Club / comunidad": sección oscura con foto, datos clave y un botón para anotarse.' },
      { type: 'nuevo', text: 'Nueva sección "Agenda de eventos": lista de eventos propios (firmas, presentaciones, talleres) con día, mes y horario destacados.' },
      { type: 'nuevo', text: 'Nueva sección "Encargo especial": pasos de cómo funciona + formulario simple con pantalla de confirmado.' },
      { type: 'nuevo', text: 'Nueva sección "Visitanos + boletín": datos de contacto, suscripción a un boletín y un mapa simulado en tres columnas.' },
    ],
  },
  {
    version: '1.15.2',
    date: '2026-07-30',
    changes: [
      { type: 'mejora', text: 'En la vista previa ("Ver mi página"), el botón para volver a editar ahora es un botón bien visible ("‹ Volver"), separado del botón dorado de "Publicar ahora" para no confundirlos.' },
    ],
  },
  {
    version: '1.15.1',
    date: '2026-07-30',
    changes: [
      { type: 'fix', text: 'Se sacó la barra con la URL falsa que aparecía arriba de la vista previa al tocar "Ver mi página" después de editar.' },
    ],
  },
  {
    version: '1.15.0',
    date: '2026-07-30',
    changes: [
      { type: 'fix', text: 'Secciones de evento (cronograma, lugares, dress code, RSVP, playlist, mesa de regalos, historia, hospedaje, libro de mensajes) ahora aparecen con un efecto de desvanecimiento al hacer scroll, igual que en las plantillas originales de "Mis XV Valentina" y "Boda Camila y Nicolás".' },
    ],
  },
  {
    version: '1.14.0',
    date: '2026-07-30',
    changes: [
      { type: 'nuevo', text: 'Nueva plantilla "Boda Camila y Nicolás": invitación de casamiento con tipografía Marcellus/EB Garamond/Mulish, reutilizando las secciones de evento ya creadas (cuenta regresiva, lugares, dress code, RSVP, regalos, galería, footer de evento).' },
      { type: 'nuevo', text: 'Nueva sección "Nuestra historia": grilla conectada de hitos con año, título y descripción — para contar una historia de varios años en pocas palabras.' },
      { type: 'nuevo', text: 'Cronograma: nueva distribución "Con foto fija al costado" (columna fija con foto y bajada, filas de horario simples al lado), además de la línea de tiempo de siempre.' },
      { type: 'nuevo', text: 'Confirmación de asistencia (RSVP): ahora puede pedir "acompañante sí/no + nombre" en vez de una cantidad de invitados, y sumar una pregunta extra de sí/no antes de enviar (ej: si necesita traslado).' },
      { type: 'nuevo', text: 'Nueva sección "Hospedaje": tarjetas de hoteles con distancia, descripción, precio y código de descuento, para invitados que vienen de afuera.' },
      { type: 'nuevo', text: 'Nueva sección "Libro de mensajes": los invitados dejan un mensaje en el momento, sobre una lista de mensajes ya firmados.' },
      { type: 'fix', text: 'Preguntas frecuentes: se corrigió dónde busca sus preguntas semilla una plantilla nueva (antes podían no aparecer las cargadas y mostrarse unas genéricas en su lugar).' },
    ],
  },
  {
    version: '1.13.0',
    date: '2026-07-30',
    changes: [
      { type: 'nuevo', text: 'Nueva plantilla "Mis XV Valentina": invitación de evento (cumpleaños de 15, casamientos) con tipografía Cormorant Garamond/Jost/Parisienne y cuenta regresiva en vivo hasta la fecha del evento.' },
      { type: 'nuevo', text: 'Nueva distribución del Hero "Cuenta regresiva a una fecha": nombre grande, fecha con líneas doradas y un contador de días/horas/minutos/segundos que corre solo.' },
      { type: 'nuevo', text: 'Nueva sección "Cronograma": línea de tiempo con hora, título y descripción de cada momento de un evento.' },
      { type: 'nuevo', text: 'Nueva sección "Lugares del evento": tarjetas con foto, dirección y hora de cada lugar, con link para llegar por Google Maps.' },
      { type: 'nuevo', text: 'Nueva sección "Dress code": lista de sí/no sobre qué ponerse, más una paleta de colores sugerida, sobre fondo oscuro.' },
      { type: 'nuevo', text: 'Nueva sección "Confirmación de asistencia (RSVP)": formulario en 3 pasos (nombre y acompañantes, menú, nota) con pantalla de confirmado.' },
      { type: 'nuevo', text: 'Nueva sección "Playlist": lista de canciones ya pedidas para el evento, más un campo para que el invitado sume la suya.' },
      { type: 'nuevo', text: 'Nueva sección "Mesa de regalos": tarjetas simples con un símbolo, título, descripción y un dato final (alias, urna, etc).' },
      { type: 'nuevo', text: 'Sobre nosotros: se le puede agregar una firma corta al final del texto (ej: tu nombre).' },
      { type: 'nuevo', text: 'Galería de fotos: nueva distribución en fila con scroll horizontal.' },
      { type: 'nuevo', text: 'Pie de página: nueva distribución para eventos, con un cierre grande y un hashtag.' },
      { type: 'nuevo', text: 'Se sumó "Caligráfica" (Parisienne) a las tipografías elegibles por texto en el editor.' },
      { type: 'fix', text: 'Un botón de texto sin color de fondo (solo borde) podía quedar con el texto invisible si no tenía un color válido asignado.' },
    ],
  },
  {
    version: '1.12.0',
    date: '2026-07-30',
    changes: [
      { type: 'nuevo', text: 'Nueva plantilla "Nexo Tech": tienda de electrónica, con tipografía Outfit/Figtree/Azeret Mono y acento verde azulado.' },
      { type: 'nuevo', text: 'Nueva sección "Comparador de productos": elegís dos productos de una lista y se comparan lado a lado en una tabla, resaltando el más barato.' },
      { type: 'nuevo', text: 'Nueva sección "Plan canje": el cliente elige su equipo usado y su estado de conservación, y ve al instante cuánto se le toma a cuenta de una compra nueva.' },
      { type: 'nuevo', text: 'Nueva sección "Sucursales": lista de locales físicos — tocar uno muestra su dirección, horario y teléfono al lado.' },
      { type: 'nuevo', text: 'Portada "Vidriera rotativa": ahora puede llevar precio anterior tachado, un halo de color detrás de la foto y una frase fija arriba del precio (ej: "Oferta del mes"); también se le puede sumar una fila de números destacados (ej: "+12.000 equipos vendidos").' },
      { type: 'nuevo', text: 'Productos o servicios (Catálogo): cada ítem puede llevar una etiqueta de texto libre con color propio (ej: "Nuevo", "Oferta"), además del estado de disponible/reservado.' },
      { type: 'nuevo', text: 'Menciones/marquee: la tipografía del texto en movimiento ahora se puede elegir por plantilla (antes siempre usaba la misma).' },
      { type: 'nuevo', text: 'Pie de página: nueva distribución en 3 columnas con medios de pago y datos de contacto, para negocios de venta de productos.' },
    ],
  },
  {
    version: '1.11.0',
    date: '2026-07-29',
    changes: [
      { type: 'nuevo', text: 'Nueva plantilla "Tinta Negra": estudio de tatuajes, fondo oscuro, acento terracota y tipografía Bebas Neue/Barlow/Cormorant Garamond.' },
      { type: 'nuevo', text: 'Productos o servicios (distribución "Catálogo con filtro"): cada ítem puede marcarse como Disponible o Reservado, con una etiqueta sobre la foto.' },
      { type: 'nuevo', text: 'Equipo (distribución "Fotos grandes"): cada persona puede sumar una bio corta y etiquetas de especialidad.' },
      { type: 'nuevo', text: 'Series / colecciones: nueva distribución en lista vertical (además de los tabs) para elegir qué foto y detalle mostrar.' },
      { type: 'nuevo', text: 'Menciones/marquee: el separador entre menciones y la velocidad del texto ahora se pueden ajustar por plantilla.' },
      { type: 'nuevo', text: 'Portada con imagen de fondo: la foto puede llevar un filtro (blanco y negro, contraste, etc.) propio de la plantilla.' },
      { type: 'nuevo', text: 'Pasos numerados: se le puede sumar un recuadro destacado con un aviso corto y un botón (ej. seña de reserva) al final.' },
      { type: 'fix', text: 'Series / colecciones: la foto no se veía en algunos casos por un problema de tamaño del contenedor.' },
    ],
  },
  {
    version: '1.10.0',
    date: '2026-07-29',
    changes: [
      { type: 'nuevo', text: 'Las plantillas ahora también pueden llevar su propia tipografía (además de su propia paleta) — necesario para que Estudio Lumen se vea con sus fuentes reales (Syne, DM Sans, JetBrains Mono) en vez de las genéricas del resto del sitio.' },
      { type: 'fix', text: 'Estudio Lumen: se reemplazaron todas las fotos de relleno por las fotos reales de la plantilla original (portada, series y archivo).' },
      { type: 'fix', text: 'Portada con imagen de fondo: la foto ahora hace un leve acercamiento al cargar, y el texto entra con una animación escalonada, igual que en el diseño original de Estudio Lumen.' },
      { type: 'fix', text: 'Archivo con zoom: el efecto al pasar el mouse sobre una foto (agrandado + brillo) y la animación de entrada al hacer scroll ahora coinciden con el diseño original.' },
      { type: 'fix', text: 'Menciones/marquee y testimonios en fila: velocidad del texto en movimiento ajustada, y se le sacó la barra de scroll visible a los testimonios.' },
    ],
  },
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
