// Historial de versiones — cada vez que se hace un cambio o arreglo se
// agrega una entrada nueva ACÁ ARRIBA de todo (más nueva primero) y se sube
// el número de versión. Lo lee el tab "Versiones" de Admin y el modal de
// novedades que aparece una vez por versión nueva (ver App.jsx > VersionGate
// y Admin.jsx > VersionesSection).
export const CHANGELOG = [
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
