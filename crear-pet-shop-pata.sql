-- Crea (o actualiza) "Pata" (Pet Shop Pata) como plantilla real en
-- custom_templates. Construida con el mismo método verificado en las
-- plantillas anteriores: el <script type="__bundler/template"> del export
-- "bundled" trae el componente fuente completo con los arrays de datos tal
-- cual (perks, catálogo, rubros, tamaños de peluquería, consejos, reseñas,
-- contacto) — se usó ese código, no fragmentos de texto adivinados. Las
-- fotos de categorías son las mismas de Pexels que usaba el archivo
-- original (mismos IDs, vía px(id,w,h)). La foto del hero y la de
-- peluquería NO tenían un ID de Pexels en el original (eran assets propios
-- del bundler sin equivalente real) — se reemplazaron por fotos de Pexels
-- del mismo tema (perro en primer plano / perro en sesión de peluquería),
-- verificadas una por una antes de usarlas.
--
-- Piezas NUEVAS creadas en SitePreview.jsx para esta réplica:
--   - beneficios variant "raya" — fila de items con un guión "—" de
--     acento antes del título, sin ícono, con salto de línea automático
--     (flex-wrap) — para franjas angostas de confianza sin necesitar un
--     ícono por ítem.
--   - productos variant "lista-cantidad" — filas numeradas con nombre,
--     etiqueta opcional y detalle, sin foto, y un botón "+" que pasa a
--     mostrar la cantidad ya sumada al carrito (consulta cartItems/
--     onIncrementCart/onDecrementCart, props nuevas en SeccionProductos).
--   - hero variant "sencillo" — eyebrow chico sin borde, título en una
--     sola línea con peso normal (no mayúsculas/extrabold), sin barra de
--     caption sobre la foto — versión "llana" de "foto-derecha".
--   - categorias variant "catalogo" — título de sección arriba + grilla
--     de fotos 4/3 con DOS líneas superpuestas (nombre + conteo), a
--     diferencia de "fotos" (sin título de sección, cuadradas, una sola
--     línea).
--   - pasos variant "consejos" — encabezado apilado (eyebrow+título+
--     párrafo) + fila de 4 con borde superior de 2px en el color de
--     acento y número chico en mono gris, para preguntas frecuentes o
--     tips breves.
--   - Sección nueva "servicio-tamano" — pestañas de tamaño + panel de
--     precio que recalcula el total según dos servicios (ej. baño +
--     corte) y la duración estimada, con botón de WhatsApp para pedir
--     turno. Registrada en el catálogo general.
--   - contacto variant "directo" ahora acepta infoRows (lista genérica de
--     label/valor, con CRUD completo) en vez de los 3 campos fijos
--     dirección/contacto/horarios — prop opcional (solo se activa si el
--     llamador pasa onUpdateInfoRows), no cambia ninguna plantilla que ya
--     use esta variante sin ese campo.
--
-- Requiere que ya exista la columna palette_override. Se puede correr las
-- veces que haga falta: si la fila ya existe, se actualiza.
INSERT INTO custom_templates
  (id, nombre, tagline, rubros, tags, accent, image, image_fallback, sections, demo, seeds, text_styles, published, palette_override, created_by)
VALUES (
  'pet-shop-pata',
  'Pata',
  'Para pet shops de barrio con catálogo de alimento y accesorios, peluquería canina con turno y carrito de compra.',
  '["comercio"]'::jsonb,
  '["mascotas","petshop","peluqueria","comercio","carrito"]'::jsonb,
  '#d9642c',
  'https://images.pexels.com/photos/28914761/pexels-photo-28914761.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  'https://images.pexels.com/photos/28914761/pexels-photo-28914761.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  $sections$[{"type":"header","variant":"clasico"},{"type":"hero","variant":"sencillo","rubroLabel":"Pet shop de barrio · Desde 2011","titulo":"Que no le falte nada.","descripcion":"Alimento balanceado, accesorios y peluquería canina. Te asesoramos según la raza, la edad y el bolsillo.","botones":{"primary":{"funcion":"seccion","label":"Ver el catálogo"},"secondary":{"funcion":"seccion","label":"Turno de peluquería"}},"stats":[{"value":"15","label":"años en el barrio"},{"value":"+100","label":"productos en góndola"},{"value":"2 hs","label":"entrega en la zona"}]},{"type":"beneficios","variant":"raya","items":[{"id":"perk-envio","icon":"check","titulo":"Envío sin cargo","desc":"Desde $25.000 en Avellaneda y alrededores"},{"id":"perk-mismo-dia","icon":"check","titulo":"Entrega el mismo día","desc":"Si pedís antes de las 17 hs"},{"id":"perk-asesoramiento","icon":"check","titulo":"Asesoramiento real","desc":"Te ayudamos a elegir el alimento correcto"},{"id":"perk-marcas","icon":"check","titulo":"Todas las marcas","desc":"Premium, súper premium y económicas"}]},{"type":"productos","variant":"lista-cantidad","eyebrow":"Catálogo","titulo":"Precios de esta semana","disclaimer":"Precios vigentes hasta el domingo. Consultanos por marcas y tamaños que no figuren."},{"type":"categorias","variant":"catalogo","titulo":"Por quién venís","categorias":[{"id":"cat-perros","img":"https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=640&h=480&fit=crop","label":"Perros","count":"48 productos"},{"id":"cat-gatos","img":"https://images.pexels.com/photos/3299905/pexels-photo-3299905.jpeg?auto=compress&cs=tinysrgb&w=640&h=480&fit=crop","label":"Gatos","count":"34 productos"},{"id":"cat-higiene","img":"https://images.pexels.com/photos/7210262/pexels-photo-7210262.jpeg?auto=compress&cs=tinysrgb&w=640&h=480&fit=crop","label":"Higiene y cuidado","count":"21 productos"}]},{"type":"servicio-tamano","eyebrow":"Peluquería canina","titulo":"Baño y corte, con turno","descripcion":"Trabajamos con turno para que ningún perro espere en jaula. Elegí el tamaño y te decimos cuánto sale.","imagen":"https://images.pexels.com/photos/6130997/pexels-photo-6130997.jpeg?auto=compress&cs=tinysrgb&w=900&h=900&fit=crop","tamanos":[{"id":"tam-chico","nombre":"Chico","peso":"Hasta 10 kg","labelA":"Baño completo","precioA":9500,"labelB":"Corte y cepillado","precioB":6500,"duracion":"45 min"},{"id":"tam-mediano","nombre":"Mediano","peso":"10 a 25 kg","labelA":"Baño completo","precioA":13500,"labelB":"Corte y cepillado","precioB":9000,"duracion":"70 min"},{"id":"tam-grande","nombre":"Grande","peso":"Más de 25 kg","labelA":"Baño completo","precioA":18500,"labelB":"Corte y cepillado","precioB":12500,"duracion":"95 min"}]},{"type":"pasos","variant":"consejos","eyebrow":"Consejos","titulo":"Lo que más nos preguntan","descripcion":"Cuatro cosas simples que hacen la diferencia en el día a día de tu mascota.","pasos":[{"id":"tip-alimento","titulo":"Cambiá el alimento de a poco","desc":"Mezclá el nuevo con el viejo durante una semana para que no le caiga mal."},{"id":"tip-bolsa","titulo":"Guardá la bolsa cerrada","desc":"Al abrigo del calor y bien cerrada: abierta pierde grasa y sabor en dos semanas."},{"id":"tip-agua","titulo":"Agua fresca todos los días","desc":"Cambiá el agua a diario y lavá el bebedero, sobre todo en verano."},{"id":"tip-cepillado","titulo":"Cepillado dos veces por semana","desc":"Evita nudos, baja la caída de pelo en casa y te deja revisarle la piel."}]},{"type":"testimonios","variant":"scroll"},{"type":"contacto","variant":"directo","contactoTitulo":"Pasá por el local","contactoSubtitulo":"Estamos a media cuadra de la estación. Si venís con tu mascota, mejor.","infoRows":[{"id":"info-direccion","label":"Dirección","value":"Av. Mitre 1240, Avellaneda"},{"id":"info-horarios","label":"Horarios","value":"Lun a Sáb, 9 a 20 hs"},{"id":"info-whatsapp","label":"WhatsApp","value":"011 4201-3345"},{"id":"info-peluqueria","label":"Peluquería","value":"Con turno previo, de martes a sábado"}]},{"type":"footer","variant":"minimal"}]$sections$::jsonb,
  $demo${"nombreNegocio":"Pata","rubroLabel":"Pet shop de barrio: alimento, accesorios y peluquería canina","sobreNosotros":"Alimento balanceado, accesorios y peluquería canina. Te asesoramos según la raza, la edad y el bolsillo. Envío el mismo día en la zona.","whatsapp":"5491142013345","telefono":"011 4201-3345","direccion":"Av. Mitre 1240, Avellaneda","horarios":"Lun a Sáb, 9 a 20 hs","instagram":"@patapetshop","galeria":["https://images.pexels.com/photos/28914761/pexels-photo-28914761.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop","https://images.pexels.com/photos/6130997/pexels-photo-6130997.jpeg?auto=compress&cs=tinysrgb&w=700&h=700&fit=crop","https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=900&h=675&fit=crop","https://images.pexels.com/photos/3299905/pexels-photo-3299905.jpeg?auto=compress&cs=tinysrgb&w=900&h=675&fit=crop"]}$demo$::jsonb,
  $seeds${"productos":[{"id":"p1","nombre":"Alimento perro adulto","precio":38900,"desc":"Bolsa de 15 kg · Súper premium","categoria":"Perros","etiqueta":"Más vendido","disponible":true},{"id":"p2","nombre":"Alimento cachorro","precio":26400,"desc":"Bolsa de 8 kg · Razas medianas","categoria":"Perros","disponible":true},{"id":"p3","nombre":"Collar y correa","precio":18900,"desc":"Set reforzado, talles S a XL","categoria":"Perros","disponible":true},{"id":"p4","nombre":"Juguete mordillo","precio":6400,"desc":"Goma resistente, tamaño mediano","categoria":"Perros","disponible":true},{"id":"p5","nombre":"Snacks de premio","precio":7800,"desc":"Paquete de 500 g","categoria":"Perros","disponible":true},{"id":"g1","nombre":"Alimento gato adulto","precio":29400,"desc":"Bolsa de 7,5 kg · Súper premium","categoria":"Gatos","etiqueta":"Más vendido","disponible":true},{"id":"g2","nombre":"Piedras sanitarias","precio":11200,"desc":"Bolsa de 10 kg, aglutinante","categoria":"Gatos","disponible":true},{"id":"g3","nombre":"Rascador de sisal","precio":22700,"desc":"Poste de 60 cm con base","categoria":"Gatos","disponible":true},{"id":"g4","nombre":"Comedero doble","precio":14300,"desc":"Acero inoxidable antideslizante","categoria":"Gatos","disponible":true},{"id":"h1","nombre":"Shampoo antipulgas","precio":9600,"desc":"Botella de 500 ml","categoria":"Higiene","disponible":true},{"id":"h2","nombre":"Pipeta antiparasitaria","precio":13400,"desc":"Por unidad, según peso","categoria":"Higiene","etiqueta":"Con receta","disponible":true},{"id":"h3","nombre":"Cepillo quitapelo","precio":8200,"desc":"Cerdas de acero con protección","categoria":"Higiene","disponible":true}],"testimonios":[{"id":"testi-veronica","nombre":"Verónica S.","cargo":"Clienta hace 4 años","texto":"Me ayudaron a cambiar el alimento de mi perra sin que le caiga mal. Se nota que saben.","rating":5,"avatar":"","verificado":false},{"id":"testi-damian","nombre":"Damián R.","cargo":"Envío a domicilio","texto":"Pedí a las 3 de la tarde y a las 6 ya tenía la bolsa en casa. Impecable.","rating":5,"avatar":"","verificado":false},{"id":"testi-lucia","nombre":"Lucía M.","cargo":"Peluquería canina","texto":"La peluquería es un lujo. Trabajan con turno así que el perro no espera encerrado.","rating":5,"avatar":"","verificado":false},{"id":"testi-gonzalo","nombre":"Gonzalo P.","cargo":"Asesoramiento en alimento","texto":"Le estaba dando de más a mi gato sin saberlo. Me corrigieron la ración y bajó de peso.","rating":5,"avatar":"","verificado":false}]}$seeds$::jsonb,
  '{}'::jsonb,
  true,
  $palette${"accent":"#d9642c","accentSoft":"rgba(217,100,44,0.12)","ink":"#221f1b","inkHex":"#221f1b","inkSoft":"#635c51","bg":"#fdfbf7","line":"#e6e0d5","fonts":{"serif":"'Fraunces', serif","mono":"'DM Mono', monospace","editorial":"'DM Sans', sans-serif","googleFontsHref":"https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap"}}$palette$::jsonb,
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
