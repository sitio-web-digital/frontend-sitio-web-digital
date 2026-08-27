-- Crea (o actualiza) "Bruma eventos" como plantilla real en
-- custom_templates. Construida con el mismo método verificado en las
-- plantillas anteriores: el <script type="__bundler/template"> del export
-- "bundled" trae el componente fuente completo con los arrays de datos tal
-- cual (servicios, trabajos realizados, tipos de evento, extras, agenda
-- por mes, proceso, reseñas, contacto) — se usó ese código, no fragmentos
-- de texto adivinados. Fotos son las mismas de Pexels que usaba el archivo
-- original (mismos IDs, vía px(id,w,h)), no placeholders.
--
-- Piezas NUEVAS creadas en SitePreview.jsx para esta réplica:
--   - hero variant "collage" — texto a la izquierda (con línea final en
--     cursiva + acento, reusa tituloAcento) y a la derecha un collage de
--     3 fotos de la galería (una grande arriba, dos cuadradas abajo).
--   - precios variant "servicios" — etiqueta de texto libre (no el
--     booleano "destacado"), lista de características ANTES del precio
--     (que queda al final como texto, no como número grande), sin botón.
--   - Sección nueva "trabajos" — portfolio con pestañas de categoría +
--     lista que cambia la foto grande (con crossfade), para productoras
--     y estudios con trabajos realizados.
--   - Sección nueva "presupuesto" — calculadora en vivo: tipo de evento +
--     rango de invitados + extras a elección, con un panel de resumen
--     que recalcula el precio estimado al toque.
--   - Sección nueva "agenda" — grilla de 12 meses con estado (disponible/
--     últimos lugares/completo), para negocios que toman un trabajo por
--     fecha.
--   - pasos variant "con-foto-derecha" ahora acepta imagenLado:"izquierda"
--     (antes solo tenía la foto a la derecha) — prop opcional, no cambia
--     ninguna plantilla que ya use esta variante sin ese campo.
--
-- Requiere que ya exista la columna palette_override. Se puede correr las
-- veces que haga falta: si la fila ya existe, se actualiza.
INSERT INTO custom_templates
  (id, nombre, tagline, rubros, tags, accent, image, image_fallback, sections, demo, seeds, text_styles, published, palette_override, created_by)
VALUES (
  'eventos-bruma',
  'Bruma eventos',
  'Para productoras de eventos con catálogo de servicios, trabajos realizados, calculadora de presupuesto y agenda de disponibilidad.',
  '["otro"]'::jsonb,
  '["eventos","casamientos","produccion","corporativos","fiestas"]'::jsonb,
  '#8a6f4e',
  'https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  'https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  $sections$[{"type":"header","variant":"clasico"},{"type":"hero","variant":"collage","rubroLabel":"Casamientos · Corporativos · Cumpleaños","titulo":"Un día que se","tituloAcento":"recuerda solo","descripcion":"Nos ocupamos de todo: locación, catering, ambientación, música y los cien detalles que no se ven. Vos disfrutás, nosotros resolvemos.","botones":{"primary":{"funcion":"seccion","label":"Armar mi presupuesto"},"secondary":{"funcion":"seccion","label":"Ver eventos realizados"}},"stats":[{"value":"14","label":"años produciendo"},{"value":"+380","label":"eventos realizados"},{"value":"1","label":"evento por fin de semana"}]},{"type":"precios","variant":"servicios","eyebrow":"Qué hacemos","titulo":"Tres formas de trabajar juntos"},{"type":"trabajos","eyebrow":"Eventos realizados","titulo":"Los últimos que armamos","trabajos":[{"id":"trab-sofia-tomas","categoria":"Casamientos","nombre":"Sofía y Tomás","lugar":"Estancia La Candelaria","invitados":"180 invitados","desc":"Ceremonia al aire libre y fiesta en el galpón restaurado, con mesa larga para todos los invitados.","imagen":"https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop"},{"id":"trab-cami-fede","categoria":"Casamientos","nombre":"Cami y Fede","lugar":"Costa Esmeralda","invitados":"120 invitados","desc":"Casamiento a orillas del mar, con ceremonia al atardecer y cena bajo carpa transparente.","imagen":"https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop"},{"id":"trab-nortec","categoria":"Corporativos","nombre":"Fin de año Grupo Nortec","lugar":"Hipódromo de Palermo","invitados":"340 invitados","desc":"Cena de fin de año para toda la compañía, con show en vivo y premiación interna.","imagen":"https://images.pexels.com/photos/1114425/pexels-photo-1114425.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop"},{"id":"trab-serie-v","categoria":"Corporativos","nombre":"Lanzamiento Serie V","lugar":"Distrito Arcos","invitados":"220 invitados","desc":"Presentación de producto con recorrido guiado, catering de pasos y cobertura de prensa.","imagen":"https://images.pexels.com/photos/2306277/pexels-photo-2306277.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop"},{"id":"trab-marta","categoria":"Cumpleaños","nombre":"Los 70 de Marta","lugar":"Casa de campo, Pilar","invitados":"90 invitados","desc":"Almuerzo de día entre árboles, mesa dulce artesanal y música en vivo hasta la tarde.","imagen":"https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop"},{"id":"trab-julieta","categoria":"Cumpleaños","nombre":"XV de Julieta","lugar":"Salón Bruma","invitados":"150 invitados","desc":"Fiesta temática con pista central, barra de tragos sin alcohol y cotillón a medida.","imagen":"https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop"}]},{"type":"presupuesto","eyebrow":"Presupuesto estimado","titulo":"Cuánto sale tu evento","descripcion":"Un número orientativo en tres pasos. Después lo ajustamos juntos en la primera reunión.","invitadosMin":30,"invitadosMax":400,"tiposEvento":[{"id":"tipo-casamiento","nombre":"Casamiento","precioBase":18000,"mult":1},{"id":"tipo-corporativo","nombre":"Corporativo","precioBase":15000,"mult":0.95},{"id":"tipo-cumple","nombre":"Cumpleaños","precioBase":12000,"mult":0.85},{"id":"tipo-aniversario","nombre":"Aniversario","precioBase":13000,"mult":0.9}],"extrasData":[{"nombre":"Ambientación y flores","precio":480000},{"nombre":"Barra de tragos","precio":620000},{"nombre":"Fotografía y video","precio":890000},{"nombre":"DJ y pista de baile","precio":540000},{"nombre":"Carpa y mobiliario","precio":760000}]},{"type":"agenda","titulo":"Fechas disponibles","descripcion":"Tomamos un evento por fin de semana. Estos son los meses con lugar todavía.","meses":[{"id":"mes-ene","nombre":"Ene","estado":"Completo"},{"id":"mes-feb","nombre":"Feb","estado":"Completo"},{"id":"mes-mar","nombre":"Mar","estado":"Últimos"},{"id":"mes-abr","nombre":"Abr","estado":"Disponible"},{"id":"mes-may","nombre":"May","estado":"Disponible"},{"id":"mes-jun","nombre":"Jun","estado":"Disponible"},{"id":"mes-jul","nombre":"Jul","estado":"Últimos"},{"id":"mes-ago","nombre":"Ago","estado":"Disponible"},{"id":"mes-sep","nombre":"Sep","estado":"Últimos"},{"id":"mes-oct","nombre":"Oct","estado":"Completo"},{"id":"mes-nov","nombre":"Nov","estado":"Últimos"},{"id":"mes-dic","nombre":"Dic","estado":"Completo"}]},{"type":"pasos","variant":"con-foto-derecha","imagenLado":"izquierda","numeroPad":true,"eyebrow":"Cómo trabajamos","titulo":"De la primera charla al último brindis","imagen":"https://images.pexels.com/photos/265920/pexels-photo-265920.jpeg?auto=compress&cs=tinysrgb&w=700&h=933&fit=crop","pasos":[{"id":"proc-1","titulo":"Primera charla","desc":"Nos contás qué imaginás, cuántos son y para cuándo. Sin cargo y sin compromiso."},{"id":"proc-2","titulo":"Propuesta a medida","desc":"Te armamos dos o tres caminos posibles con locaciones, presupuesto y cronograma."},{"id":"proc-3","titulo":"Producción","desc":"Cerramos proveedores, coordinamos pruebas y te mantenemos al tanto de cada avance."},{"id":"proc-4","titulo":"El día del evento","desc":"Estamos desde el armado hasta el desarme. Vos solo tenés que llegar y disfrutar."}]},{"type":"testimonios","variant":"scroll"},{"type":"contacto","variant":"directo","contactoTitulo":"Contanos qué tenés en mente","contactoSubtitulo":"Primera reunión sin cargo, presencial o por videollamada. Respondemos dentro de las 24 horas."},{"type":"footer","variant":"minimal"}]$sections$::jsonb,
  $demo${"nombreNegocio":"Bruma eventos","rubroLabel":"Producción integral de eventos: casamientos, corporativos y cumpleaños","sobreNosotros":"Nos ocupamos de todo: locación, catering, ambientación, música y los cien detalles que no se ven. 14 años produciendo eventos, un evento por fin de semana.","whatsapp":"5491148312200","telefono":"011 4831-2200","direccion":"Gorriti 4890, Palermo","horarios":"Lun a Vie, 10 a 19 hs (con cita previa)","instagram":"@brumaeventos","galeria":["https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg?auto=compress&cs=tinysrgb&w=900&h=506&fit=crop","https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&cs=tinysrgb&w=460&h=460&fit=crop","https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=460&h=460&fit=crop","https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg?auto=compress&cs=tinysrgb&w=900&h=700&fit=crop"]}$demo$::jsonb,
  $seeds${"planes":[{"id":"serv-coordinacion","nombre":"Coordinación","periodo":"Día del evento","precioTexto":"Ya tenés todo contratado y necesitás que alguien lo haga funcionar el día.","precio":890000,"destacado":false,"features":["Cronograma minuto a minuto","Coordinación de proveedores","Dos coordinadores en el evento","Armado y desarme del salón"]},{"id":"serv-produccion","nombre":"Producción integral","periodo":"Lo más pedido","precioTexto":"Nos ocupamos del evento completo desde la primera idea hasta que se apagan las luces.","precio":2400000,"destacado":false,"features":["Búsqueda y reserva de locación","Selección de catering y menú","Ambientación y flores","Música, luces y sonido","Coordinación total del día"]},{"id":"serv-corporativo","nombre":"Eventos corporativos","periodo":"Empresas","precioTexto":"Lanzamientos, fines de año y convenciones, con la logística resuelta de punta a punta.","precio":1600000,"destacado":false,"features":["Producción técnica y escenario","Acreditación de invitados","Catering corporativo","Registro fotográfico"]}],"testimonios":[{"id":"testi-sofia-tomas","nombre":"Sofía y Tomás","cargo":"Casamiento · 180 invitados","texto":"No tuvimos que ocuparnos de nada. El día del casamiento fue el más relajado del año.","rating":5,"avatar":"","verificado":false},{"id":"testi-laura","nombre":"Laura Bianchi","cargo":"Grupo Nortec · Corporativo","texto":"Organizaron nuestra cena de fin de año para 340 personas sin un solo imprevisto.","rating":5,"avatar":"","verificado":false},{"id":"testi-aguirre","nombre":"Familia Aguirre","cargo":"Cumpleaños de 70","texto":"Entendieron exactamente lo que queríamos con dos charlas. El resultado superó todo.","rating":5,"avatar":"","verificado":false},{"id":"testi-cami-fede","nombre":"Cami y Fede","cargo":"Casamiento · Costa Esmeralda","texto":"La ambientación quedó preciosa y el presupuesto se respetó al peso.","rating":5,"avatar":"","verificado":false}]}$seeds$::jsonb,
  '{}'::jsonb,
  true,
  $palette${"accent":"#8a6f4e","accentSoft":"rgba(138,111,78,0.12)","ink":"#2a2724","inkHex":"#2a2724","inkSoft":"#6f6659","bg":"#f4f1ec","line":"#ddd6cb","fonts":{"serif":"'Cormorant Garamond', serif","mono":"'Space Grotesk', monospace","editorial":"'Jost', sans-serif","googleFontsHref":"https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap"}}$palette$::jsonb,
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
