-- Crea (o actualiza) "Almacén 33" como plantilla real en custom_templates.
-- Reescritura #3 (2026-08-09): réplica exacta a partir del código fuente
-- real embebido en "Plantilla Almacen 33 (standalone).html" (un export
-- "bundled" cuyo <script type="__bundler/template"> trae el componente
-- fuente completo, con los arrays de datos tal cual — productos, reseñas,
-- envíos/pagos, criterio y contacto), no de fragmentos de texto adivinados.
-- Fotos son placeholders de picsum.photos (el archivo original usa fotos de
-- Pexels con licencia propia) — cambiar por fotos reales del local antes de
-- publicar esta plantilla a producción.
--
-- Distribuciones NUEVAS creadas en SitePreview.jsx para esta réplica (antes
-- no existían en el catálogo, ver plan en .claude/plans):
--   - hero variant "dividido" — título grande a la izquierda sin foto,
--     párrafo + botones a la derecha, sin foto ni eyebrow.
--   - pasos variant "criterio" — grilla con bordes finos y fondo claro
--     (a diferencia de "numerados"/"timeline", pensadas para fondo oscuro),
--     encabezado en dos columnas (eyebrow+título / párrafo de contexto).
--   - categorias variant "numerada" — ya existía de la vuelta anterior.
--   - envios-tabs — ya existía de la vuelta anterior; esta vuelta le suma
--     la prop activeColor (para el ámbar real, distinto del accent rojo) y
--     la caja con borde que agrupa las 3 estadísticas de la pestaña activa.
--
-- Requiere que ya exista la columna palette_override (misma migración
-- usada para Estudio Lumen/Tinta Negra/Nexo Tech). Se puede correr las
-- veces que haga falta: si la fila ya existe, se actualiza.
INSERT INTO custom_templates
  (id, nombre, tagline, rubros, tags, accent, image, image_fallback, sections, demo, seeds, text_styles, published, palette_override, created_by)
VALUES (
  'almacen-33',
  'Almacén 33',
  'Para bazares, casas de artículos para el hogar y comercios de barrio con un poco de todo.',
  '["comercio"]'::jsonb,
  '["comercio","bazar","hogar","catalogo","productos","almacen","carrito"]'::jsonb,
  '#e2574c',
  'https://picsum.photos/seed/almacen33-portada/1000/1200',
  'https://picsum.photos/seed/almacen33-portada/1000/1200',
  $sections$[{"type":"header","variant":"clasico"},{"type":"hero","variant":"dividido","titulo":"Un poco de todo","descripcion":"Vendemos lo que usamos: cosas para la cocina, textiles de casa y tecnología que no se rompe a los dos meses.","botones":{"primary":{"funcion":"seccion","label":"Ver el catálogo"},"secondary":{"funcion":"seccion","label":"Envíos y pagos"}}},{"type":"categorias","variant":"numerada","categorias":[{"id":"cat-bazar","label":"Bazar y cocina","count":"4 items","img":"https://picsum.photos/seed/almacen33-bowl/800/500"},{"id":"cat-textil","label":"Textil y hogar","count":"3 items","img":"https://picsum.photos/seed/almacen33-manta/800/500"},{"id":"cat-tec","label":"Tecnología","count":"4 items","img":"https://picsum.photos/seed/almacen33-auriculares/800/500"}],"stats":[{"id":"stat-rubros","valor":"3","label":"rubros"},{"id":"stat-despacho","valor":"48 h","label":"despacho"},{"id":"stat-cambios","valor":"15 d","label":"para cambios"}]},{"type":"marquee","fuente":"font-mono","mensajes":[{"id":"tk-1","texto":"Envío gratis desde $80.000"},{"id":"tk-2","texto":"10% off por transferencia"},{"id":"tk-3","texto":"3 y 6 cuotas sin interés"},{"id":"tk-4","texto":"Retiro en el local sin cargo"},{"id":"tk-5","texto":"Cambios dentro de los 15 días"},{"id":"tk-6","texto":"Todo probado antes de venderlo"}]},{"type":"productos","variant":"grid-5","eyebrow":"Catálogo","titulo":"Todo lo que tenemos"},{"type":"pasos","variant":"criterio","numeroPad":true,"eyebrow":"Nuestro criterio","titulo":"Cómo elegimos lo que vendemos","descripcion":"No trabajamos por catálogo de mayorista. Cada producto pasa por estas cuatro preguntas antes de entrar al local.","pasos":[{"id":"crit-1","titulo":"Lo usamos nosotros","desc":"Antes de traerlo lo probamos en casa por lo menos un mes. Si no nos convence, no entra."},{"id":"crit-2","titulo":"Se puede arreglar","desc":"Preferimos lo que tiene repuesto o service en el país antes que lo descartable."},{"id":"crit-3","titulo":"Sabemos quién lo hace","desc":"Trabajamos con talleres y productores con nombre, no con importadores anónimos."},{"id":"crit-4","titulo":"El precio se sostiene","desc":"Si para que cierre el número hay que bajar la calidad, preferimos no venderlo."}]},{"type":"envios-tabs","eyebrow":"Cómo lo recibís","titulo":"Envíos y pagos","bgColor":"#1f2a24","headingColor":"#faf7f0","textColor":"rgba(250,247,240,0.62)","activeColor":"#f5b944","tabs":[{"id":"tab-domicilio","label":"Envío a domicilio","stats":[{"id":"dom-costo","label":"Costo","valor":"$6.500","desc":"Gratis en compras desde $80.000 a todo el país."},{"id":"dom-demora","label":"Demora","valor":"3 a 5 días","desc":"Hábiles, desde que confirmás el pago."},{"id":"dom-seguimiento","label":"Seguimiento","valor":"Por WhatsApp","desc":"Te mandamos el código de seguimiento apenas despachamos."}]},{"id":"tab-retiro","label":"Retiro en el local","stats":[{"id":"ret-costo","label":"Costo","valor":"Sin cargo","desc":"Reservás por WhatsApp y lo pasás a buscar."},{"id":"ret-demora","label":"Demora","valor":"Mismo día","desc":"Si lo pedís antes de las 17 hs, lo tenés listo esa tarde."},{"id":"ret-horario","label":"Horario","valor":"Lun a Sáb","desc":"De 9 a 19 hs en Av. Rivadavia 4521."}]},{"id":"tab-pagos","label":"Formas de pago","stats":[{"id":"pag-transferencia","label":"Transferencia","valor":"10% off","desc":"El descuento se aplica sobre el total del carrito."},{"id":"pag-tarjeta","label":"Tarjeta","valor":"3 y 6 cuotas","desc":"Sin interés con bancos adheridos."},{"id":"pag-efectivo","label":"Efectivo","valor":"En el local","desc":"También aceptamos billeteras virtuales."}]}]},{"type":"testimonios","variant":"scroll"},{"type":"contacto","variant":"mapa","contactoTitulo":"El local","contactoTituloPrincipal":"Vení a verlo antes de comprar","contactoSubtitulo":"Tenemos todo el catálogo en el local, así lo mirás y lo tocás. Si preferís, lo reservás por WhatsApp y lo pasás a buscar."},{"type":"footer","variant":"minimal"}]$sections$::jsonb,
  $demo${"nombreNegocio":"Almacén 33","rubroLabel":"Bazar y artículos para el hogar","sobreNosotros":"Vendemos lo que usamos: cosas para la cocina, textiles de casa y tecnología que no se rompe a los dos meses. No trabajamos por catálogo de mayorista — cada producto pasa por estas cuatro preguntas antes de entrar al local.","whatsapp":"5491155443300","telefono":"011 5544-3300","direccion":"Av. Rivadavia 4521, CABA","horarios":"Lunes a Sábado, 9 a 19 hs","instagram":"@almacen33","galeria":["https://picsum.photos/seed/almacen33-1/1000/1200","https://picsum.photos/seed/almacen33-2/1000/1200","https://picsum.photos/seed/almacen33-3/1000/1200","https://picsum.photos/seed/almacen33-4/1000/1200"]}$demo$::jsonb,
  $seeds${"productos":[{"id":"prod-bowl","nombre":"Bowl de cerámica esmaltada","precio":34000,"desc":"Apto microondas y lavavajillas.","categoria":"Bazar y cocina","disponible":true,"etiqueta":"Más vendido","etiquetaColor":"#e2574c","imagenes":["https://picsum.photos/seed/almacen33-bowl/800/800"]},{"id":"prod-tabla","nombre":"Tabla de madera maciza","precio":46000,"desc":"Algarrobo con terminación al aceite.","categoria":"Bazar y cocina","disponible":true,"imagenes":["https://picsum.photos/seed/almacen33-tabla/800/800"]},{"id":"prod-cazuelas","nombre":"Juego de cazuelas de barro","precio":62000,"desc":"Seis unidades aptas para horno.","categoria":"Bazar y cocina","disponible":true,"imagenes":["https://picsum.photos/seed/almacen33-cazuelas/800/800"]},{"id":"prod-vasija","nombre":"Vasija de gres","precio":41000,"desc":"Esmalte mate exterior, brillante interior.","categoria":"Bazar y cocina","disponible":true,"imagenes":["https://picsum.photos/seed/almacen33-vasija/800/800"]},{"id":"prod-manta","nombre":"Manta de lana tejida","precio":128000,"desc":"Lana de oveja, tejida en telar.","categoria":"Textil y hogar","disponible":true,"etiqueta":"Nuevo","etiquetaColor":"#1f2a24","imagenes":["https://picsum.photos/seed/almacen33-manta/800/800"]},{"id":"prod-hilados","nombre":"Set de hilados teñidos","precio":22000,"desc":"Ovillos teñidos con tintes naturales.","categoria":"Textil y hogar","disponible":true,"imagenes":["https://picsum.photos/seed/almacen33-hilados/800/800"]},{"id":"prod-repasadores","nombre":"Repasadores de algodón","precio":18000,"desc":"Pack de tres, algodón peinado.","categoria":"Textil y hogar","disponible":true,"imagenes":["https://picsum.photos/seed/almacen33-repasadores/800/800"]},{"id":"prod-auriculares","nombre":"Auriculares inalámbricos","precio":189000,"desc":"True wireless, 32 hs de batería.","categoria":"Tecnología","disponible":true,"etiqueta":"Más vendido","etiquetaColor":"#e2574c","imagenes":["https://picsum.photos/seed/almacen33-auriculares/800/800"]},{"id":"prod-notebook","nombre":"Notebook 14 pulgadas","precio":1680000,"desc":"512 GB SSD · 16 GB RAM.","categoria":"Tecnología","disponible":true,"imagenes":["https://picsum.photos/seed/almacen33-notebook/800/800"]},{"id":"prod-tablet","nombre":"Tablet 10 pulgadas","precio":620000,"desc":"Con funda y lápiz incluidos.","categoria":"Tecnología","disponible":true,"imagenes":["https://picsum.photos/seed/almacen33-tablet/800/800"]},{"id":"prod-celular","nombre":"Celular 128 GB","precio":589000,"desc":"Cámara doble y carga rápida.","categoria":"Tecnología","disponible":true,"etiqueta":"Oferta","etiquetaColor":"#c2410c","imagenes":["https://picsum.photos/seed/almacen33-celular/800/800"]}],"testimonios":[{"id":"testi-marina","nombre":"Marina T.","cargo":"Compra online · Rosario","texto":"Compré la manta y un par de cosas de cocina. Llegó en tres días y todo impecable.","rating":5,"avatar":"","verificado":false},{"id":"testi-emiliano","nombre":"Emiliano G.","cargo":"Compra online · Córdoba","texto":"Pregunté por qué traían esa marca y me explicaron todo. Se nota que eligen lo que venden.","rating":5,"avatar":"","verificado":false},{"id":"testi-rocio","nombre":"Rocío D.","cargo":"Retiro en local","texto":"Fui al local a ver los auriculares antes de comprarlos. Te dejan probar todo sin apuro.","rating":5,"avatar":"","verificado":false},{"id":"testi-hernan","nombre":"Hernán V.","cargo":"Compra online · CABA","texto":"Muy buena atención por WhatsApp, me respondieron todas las dudas antes de pagar.","rating":5,"avatar":"","verificado":false}]}$seeds$::jsonb,
  '{}'::jsonb,
  true,
  $palette${"accent":"#e2574c","accentSoft":"rgba(226,87,76,0.12)","ink":"#1f2a24","inkHex":"#1f2a24","inkSoft":"#55645c","bg":"#faf7f0","line":"#e4ddd0","fonts":{"serif":"'Bricolage Grotesque', sans-serif","mono":"'Martian Mono', monospace","editorial":"'Spline Sans', sans-serif","googleFontsHref":"https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Spline+Sans:wght@400;500;600&family=Martian+Mono:wght@400;500&display=swap"}}$palette$::jsonb,
  (SELECT id FROM users WHERE email = 'facundo@sitiowebdigital.com.ar')
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tagline = EXCLUDED.tagline,
  rubros = EXCLUDED.rubros,
  tags = EXCLUDED.tags,
  accent = EXCLUDED.accent,
  image = EXCLUDED.image,
  image_fallback = EXCLUDED.image_fallback,
  sections = EXCLUDED.sections,
  demo = EXCLUDED.demo,
  seeds = EXCLUDED.seeds,
  text_styles = EXCLUDED.text_styles,
  palette_override = EXCLUDED.palette_override,
  updated_at = now();
