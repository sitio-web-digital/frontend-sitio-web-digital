-- Crea (o actualiza) "Molienda" (Cafe Molienda) como plantilla real en
-- custom_templates. Construida con el mismo método verificado en las
-- plantillas anteriores: el <script type="__bundler/template"> del export
-- "bundled" trae el componente fuente completo con los arrays de datos tal
-- cual (combos con items incluidos, carta agrupada por categoría, horarios
-- semanales, reseñas, contacto) — se usó ese código, no fragmentos de
-- texto adivinados. TODAS las fotos (hero, cada combo y la galería del
-- local) ya tenían un ID de Pexels real en el origen — se usaron esos
-- mismos IDs tal cual, sin ningún reemplazo (varios se reusan a propósito
-- entre hero/combos/galería, tal como hacía el diseño original).
--
-- rubros se dejó en "otro" (no "gastronomia") a propósito: esta plantilla
-- no usa carrito (cada combo/ítem de la carta pide por WhatsApp de a uno,
-- como en el diseño original) y "gastronomia" activa el botón flotante de
-- carrito automáticamente en toda la plataforma — hubiera aparecido un
-- carrito vacío y sin uso que el diseño real no tiene. Se agregó
-- "gastronomia" como tag de texto libre así igual aparece en búsquedas
-- por rubro.
--
-- Piezas NUEVAS creadas en SitePreview.jsx para esta réplica:
--   - hero: props opcionales nuevas en la variante "insignia" —
--     badgeCaptionItalic (cursiva sin negrita para el valor de la ficha,
--     en vez de negrita sin cursiva) e imgAspect (relación de aspecto de
--     la foto, antes fija en 9/10). Ninguna de las dos cambia las
--     plantillas que ya usan esta variante sin setearlas.
--   - Sección nueva "combos" — pestañas por grupo (Todos + cada grupo
--     real) que filtran una grilla de tarjetas, cada una con foto,
--     etiqueta de franja horaria, nombre+precio, descripción, lista de
--     items incluidos y un pie con "para cuántos" + link de WhatsApp, más
--     una fila de notas chicas debajo de todo.
--   - productos variant "carta" — pestañas de categoría que SWAPEAN toda
--     la lista visible (no hay pestaña "Todos", arranca en la primera
--     categoría), filas de 2 columnas con nombre+etiqueta opcional+
--     descripción, línea punteada conectora y precio — a diferencia de
--     "vitrina"/"catalogo" (con foto) o "tarifario" (una sola columna,
--     sin pestañas).
--   - galeria variant "sencilla" — grilla 4 columnas en foto 3/4 sin el
--     filtro de desaturación que usa la variante por defecto.
--   - contacto variant "mapa" ahora admite horas (tabla semanal de
--     día+horario+abierto, con CRUD) e infoRows (ya agregado en Pet Shop
--     Pata) para una lista de datos personalizada en vez del campo fijo
--     "Horarios" — ninguna de las dos cambia las plantillas que ya usan
--     "mapa" sin setearlas.
--
-- Requiere que ya exista la columna palette_override. Se puede correr las
-- veces que haga falta: si la fila ya existe, se actualiza.
INSERT INTO custom_templates
  (id, nombre, tagline, rubros, tags, accent, image, image_fallback, sections, demo, seeds, text_styles, published, palette_override, created_by)
VALUES (
  'cafe-molienda',
  'Molienda',
  'Para cafeterías de especialidad con combos de desayuno y merienda, carta agrupada por categoría y pedidos por WhatsApp.',
  '["otro"]'::jsonb,
  '["cafeteria","desayunos","meriendas","panaderia","gastronomia"]'::jsonb,
  '#c2703f',
  'https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  'https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  $sections$[{"type":"header","variant":"clasico"},{"type":"hero","variant":"insignia","rubroLabel":"Palermo · Desde 2016","titulo":"Desayunos y meriendas","tituloAcento":"todo el día","descripcion":"Panadería propia, café de especialidad y combos que alcanzan de verdad. Se sirven desde que abrimos hasta que cerramos.","heroImagen":"https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=900&h=1080&fit=crop","imgAspect":"5/6","destacadoEtiqueta":"Horneamos cada mañana","heroCaption":"Medialunas desde las 8 hs","badgeLado":"izquierda","badgeColor":"#f5f2eb","badgeCaptionItalic":true,"botones":{"primary":{"funcion":"seccion","label":"Ver los combos"},"secondary":{"funcion":"seccion","label":"Carta completa"}}},{"type":"combos","eyebrow":"Desayunos y meriendas","titulo":"Los combos que servimos","descripcion":"Todos incluyen la bebida a elección. Si querés cambiar algo del combo, avisale a quien te atienda.","notas":["Se sirven en mesa, sin cargo de servicio","Opciones sin TACC y sin lácteos a pedido","Cambios dentro del combo, sin recargo"],"combos":[{"id":"combo-desayuno-completo","grupo":"Desayunos","cuando":"Hasta las 12 hs","nombre":"Desayuno completo","precio":8900,"desc":"El más pedido de la mañana. Alcanza tranquilo hasta el almuerzo.","items":["Café con leche, cortado o té a elección","Dos medialunas de manteca","Jugo de naranja exprimido","Tostada de masa madre con manteca y mermelada"],"sirve":"Para una persona","imagen":"https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop"},{"id":"combo-desayuno-simple","grupo":"Desayunos","cuando":"Hasta las 12 hs","nombre":"Desayuno simple","precio":5400,"desc":"Lo justo para arrancar el día sin apuro.","items":["Café a elección","Dos medialunas de manteca"],"sirve":"Para una persona","imagen":"https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop"},{"id":"combo-desayuno-salado","grupo":"Desayunos","cuando":"Hasta las 12 hs","nombre":"Desayuno salado","precio":10200,"desc":"Para los que no arrancan con dulce. Se puede pedir sin huevo.","items":["Café a elección","Tostado de campo con jamón crudo y rúcula","Huevos revueltos","Jugo de naranja exprimido"],"sirve":"Para una persona","imagen":"https://images.pexels.com/photos/851555/pexels-photo-851555.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop"},{"id":"combo-merienda-clasica","grupo":"Meriendas","cuando":"Desde las 15 hs","nombre":"Merienda clásica","precio":7600,"desc":"La tarde tranquila: algo dulce, algo caliente y tiempo.","items":["Café con leche, submarino o té","Porción de budín de limón","Dos alfajores de maicena"],"sirve":"Para una persona","imagen":"https://images.pexels.com/photos/887853/pexels-photo-887853.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop"},{"id":"combo-merienda-compartir","grupo":"Meriendas","cuando":"Desde las 15 hs","nombre":"Merienda para compartir","precio":14800,"desc":"Tabla grande al centro de la mesa. Se puede pedir sin lácteos.","items":["Dos cafés a elección","Brownie con nueces","Porción de budín de limón","Cuatro medialunas","Bowl de frutas de estación"],"sirve":"Para dos personas","imagen":"https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop"},{"id":"combo-merienda-fria","grupo":"Meriendas","cuando":"Desde las 15 hs","nombre":"Merienda fría","precio":8400,"desc":"Para los días de calor, cuando el café caliente no entra.","items":["Cold brew o latte helado","Brownie con nueces","Limonada de jengibre"],"sirve":"Para una persona","imagen":"https://images.pexels.com/photos/851555/pexels-photo-851555.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop"}]},{"type":"productos","variant":"carta","eyebrow":"La carta","titulo":"Todo lo demás"},{"type":"galeria","variant":"sencilla","titulo":"Veintidós asientos y una barra larga"},{"type":"testimonios","variant":"scroll"},{"type":"contacto","variant":"mapa","contactoTitulo":"Dónde y cuándo","horas":[{"id":"hora-semana","dia":"Lunes a Viernes","horario":"8 a 20 hs","abierto":true},{"id":"hora-sabado","dia":"Sábados","horario":"9 a 20 hs","abierto":true},{"id":"hora-domingo","dia":"Domingos","horario":"10 a 18 hs","abierto":true},{"id":"hora-feriados","dia":"Feriados","horario":"Cerrado","abierto":false}],"infoRows":[{"id":"info-direccion","label":"Dirección","value":"Gorriti 4820, Palermo"},{"id":"info-telefono","label":"Teléfono","value":"011 4831-9040"},{"id":"info-reservas","label":"Reservas","value":"Solo para grupos de 6 o más"}]},{"type":"footer","variant":"minimal"}]$sections$::jsonb,
  $demo${"nombreNegocio":"Molienda","rubroLabel":"Café de especialidad, panadería propia y combos de desayuno y merienda","sobreNosotros":"Panadería propia, café de especialidad y combos que alcanzan de verdad. Se sirven desde que abrimos hasta que cerramos.","whatsapp":"5491148319040","telefono":"011 4831-9040","direccion":"Gorriti 4820, Palermo","horarios":"Lun a Vie, 8 a 20 hs","instagram":"@moliendacafe","galeria":["https://images.pexels.com/photos/1833586/pexels-photo-1833586.jpeg?auto=compress&cs=tinysrgb&w=500&h=660&fit=crop","https://images.pexels.com/photos/2159065/pexels-photo-2159065.jpeg?auto=compress&cs=tinysrgb&w=500&h=660&fit=crop","https://images.pexels.com/photos/1002740/pexels-photo-1002740.jpeg?auto=compress&cs=tinysrgb&w=500&h=660&fit=crop","https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=500&h=660&fit=crop"]}$demo$::jsonb,
  $seeds${"productos":[{"id":"menu-espresso","nombre":"Espresso","categoria":"Café","desc":"Simple o doble, del blend de la casa","precio":2400},{"id":"menu-cortado","nombre":"Cortado","categoria":"Café","desc":"Espresso con un toque de leche texturada","precio":2800},{"id":"menu-con-leche","nombre":"Café con leche","categoria":"Café","desc":"En taza grande, como corresponde","precio":3200},{"id":"menu-flat-white","nombre":"Flat white","categoria":"Café","desc":"Doble ristretto y leche sedosa, sin espuma alta","precio":3400,"etiqueta":"El más pedido"},{"id":"menu-submarino","nombre":"Submarino","categoria":"Café","desc":"Leche caliente y barra de chocolate aparte","precio":3800},{"id":"menu-te-hebras","nombre":"Té en hebras","categoria":"Café","desc":"Negro, verde o de frutos rojos","precio":2600},{"id":"menu-cold-brew","nombre":"Cold brew","categoria":"Fríos","desc":"Dieciséis horas de infusión, con hielo de café","precio":3600},{"id":"menu-latte-helado","nombre":"Latte helado","categoria":"Fríos","desc":"Espresso doble sobre leche fría","precio":3800},{"id":"menu-jugo-naranja","nombre":"Jugo de naranja","categoria":"Fríos","desc":"Exprimido en el momento, medio litro","precio":3400},{"id":"menu-limonada","nombre":"Limonada de jengibre","categoria":"Fríos","desc":"Prensada en el día, sin azúcar agregada","precio":3200},{"id":"menu-te-helado","nombre":"Té helado de durazno","categoria":"Fríos","desc":"Infusionado en frío, poco dulce","precio":3000},{"id":"menu-medialuna","nombre":"Medialuna de manteca","categoria":"Pastelería","desc":"Hechas acá cada mañana, docena a pedido","precio":1400},{"id":"menu-brownie","nombre":"Brownie con nueces","categoria":"Pastelería","desc":"Denso, apenas tibio si lo pedís así","precio":3200,"etiqueta":"El más pedido"},{"id":"menu-budin","nombre":"Budín de limón","categoria":"Pastelería","desc":"Con glasé y ralladura, porción generosa","precio":2900},{"id":"menu-alfajor","nombre":"Alfajor de maicena","categoria":"Pastelería","desc":"De la vecina de al lado, siempre se agotan","precio":1900},{"id":"menu-tostado","nombre":"Tostado de campo","categoria":"Pastelería","desc":"Masa madre, jamón crudo, rúcula y tomate","precio":6800},{"id":"menu-avocado","nombre":"Avocado toast","categoria":"Pastelería","desc":"Palta, huevo poché y semillas sobre masa madre","precio":7400}],"testimonios":[{"id":"testi-malena","nombre":"Malena T.","cargo":"Desayuno completo","texto":"El desayuno completo es enorme y encima el café está buenísimo. Volvimos tres domingos seguidos.","rating":5,"avatar":"","verificado":false},{"id":"testi-ivan","nombre":"Iván C.","cargo":"Merienda para compartir","texto":"Pedimos la merienda para compartir y sobró. Muy buena relación precio-cantidad.","rating":5,"avatar":"","verificado":false},{"id":"testi-rocio","nombre":"Rocío D.","cargo":"Desayuno simple","texto":"Me hicieron el desayuno sin TACC sin ningún problema y sin cobrarme de más.","rating":5,"avatar":"","verificado":false}]}$seeds$::jsonb,
  '{}'::jsonb,
  true,
  $palette${"accent":"#c2703f","accentSoft":"rgba(194,112,63,0.12)","ink":"#1e1f1b","inkHex":"#1e1f1b","inkSoft":"rgba(30,31,27,0.62)","bg":"#f5f2eb","line":"rgba(30,31,27,0.14)","fonts":{"serif":"'Newsreader', serif","mono":"'Martian Mono', monospace","editorial":"'Archivo', sans-serif","googleFontsHref":"https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;1,400&family=Archivo:wght@400;500;600;700&family=Martian+Mono:wght@400;500;600&display=swap"}}$palette$::jsonb,
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
