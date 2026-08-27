-- Crea (o actualiza) "Punto Cero" (Detailing Punto Cero) como plantilla
-- real en custom_templates. Construida con el mismo método verificado en
-- las plantillas anteriores: el <script type="__bundler/template"> del
-- export "bundled" trae el componente fuente completo con los arrays de
-- datos tal cual (servicios y precios, horarios ocupados/libres, datos de
-- contacto) — se usó ese código, no fragmentos de texto adivinados. La
-- foto del hero NO tenía un ID de Pexels en el original (era un asset
-- propio del bundler sin equivalente real) — se reemplazó por una foto de
-- Pexels del mismo tema (detailing de un auto), verificada antes de
-- usarla. No tiene sección de testimonios ni galería propia: el original
-- tampoco la tiene.
--
-- Piezas NUEVAS creadas en SitePreview.jsx para esta réplica:
--   - productos variant "detalle" — tarjetas con una etiqueta de duración
--     en el color de acento arriba del nombre, párrafo de descripción que
--     ocupa el espacio disponible, y precio grande al final — a
--     diferencia de "servicios" (sin descripción, precio chico en mono).
--   - hero variant "insignia" — igual que "sencillo" (eyebrow chico,
--     título llano, foto a la derecha) pero con una ficha fija en la
--     esquina inferior derecha de la foto (etiqueta + valor, ej. "Turno
--     más cercano" / "Hoy 15:30 hs") en un color de resalte propio del
--     diseño, no el acento general del sitio.
--   - Sección nueva "turno-express" — selector de turno en 3 pasos
--     (servicio del catálogo compartido → uno de los próximos 6 días,
--     calculados en vivo desde hoy con los domingos cerrados → horario
--     con cupo) + resumen y botón de WhatsApp. A diferencia de la sección
--     "turnos" ya existente (wizard de 4 pasos con selección de
--     profesional, para barberías), esta NO tiene paso de profesional —
--     pensada para negocios de turno de corto plazo sin distinguir quién
--     atiende (lavaderos, talleres). Registrada en el catálogo general.
--   - contacto variant "directo" con infoRows (ya agregado en la réplica
--     de Pet Shop Pata) reutilizado acá con las 4 filas propias de este
--     negocio (Dirección/Horarios/Teléfono/Estacionamiento).
--
-- Requiere que ya exista la columna palette_override. Se puede correr las
-- veces que haga falta: si la fila ya existe, se actualiza.
INSERT INTO custom_templates
  (id, nombre, tagline, rubros, tags, accent, image, image_fallback, sections, demo, seeds, text_styles, published, palette_override, created_by)
VALUES (
  'detailing-punto-cero',
  'Punto Cero',
  'Para lavaderos y estudios de detailing con catálogo de servicios y reserva de turno online en 3 pasos (servicio, día y horario).',
  '["oficios"]'::jsonb,
  '["detailing","lavadero","autos","turnos","oficios"]'::jsonb,
  '#0b63f6',
  'https://images.pexels.com/photos/17623850/pexels-photo-17623850.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  'https://images.pexels.com/photos/17623850/pexels-photo-17623850.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  $sections$[{"type":"header","variant":"clasico"},{"type":"hero","variant":"insignia","rubroLabel":"Lavadero y detailing","titulo":"Tu auto limpio, con turno y sin esperar","descripcion":"Lavado a mano, interior y pulido. Sacás el turno online, dejás el auto y lo retirás listo.","destacadoEtiqueta":"Turno más cercano","heroCaption":"Hoy 15:30 hs","botones":{"primary":{"funcion":"seccion","label":"Sacar turno"},"secondary":{"funcion":"seccion","label":"Ver servicios"}},"stats":[{"value":"90′","label":"lavado completo"},{"value":"2","label":"bahías en paralelo"},{"value":"11","label":"años en el rubro"}]},{"type":"productos","variant":"detalle","eyebrow":"Servicios","titulo":"Servicios y precios","descripcion":"Precios para auto y sedán. Para SUV y pickup sumá un 30%."},{"type":"turno-express","eyebrow":"Turnos","titulo":"Sacá tu turno en 3 pasos","descripcion":"Elegí servicio, día y horario. Los horarios en gris ya están tomados.","slots":[{"id":"slot-0900","time":"09:00","disponibles":0},{"id":"slot-1030","time":"10:30","disponibles":1},{"id":"slot-1200","time":"12:00","disponibles":2},{"id":"slot-1530","time":"15:30","disponibles":2},{"id":"slot-1700","time":"17:00","disponibles":0},{"id":"slot-1830","time":"18:30","disponibles":1}]},{"type":"contacto","variant":"directo","contactoTitulo":"Dejá el auto y volvé a buscarlo.","contactoSubtitulo":"Estamos sobre la avenida, con estacionamiento propio. Si venís sin turno, consultá disponibilidad por WhatsApp.","infoRows":[{"id":"info-direccion","label":"Dirección","value":"Av. Mitre 4820, San Isidro"},{"id":"info-horarios","label":"Horarios","value":"Lun a Sáb, 8:30 a 19 hs"},{"id":"info-telefono","label":"Teléfono","value":"011 4747-9080"},{"id":"info-estacionamiento","label":"Estacionamiento","value":"Propio, sobre la avenida"}]},{"type":"footer","variant":"minimal"}]$sections$::jsonb,
  $demo${"nombreNegocio":"Punto Cero","rubroLabel":"Lavadero y detailing: lavado a mano, interior y pulido, con turno online","sobreNosotros":"Lavado a mano, interior y pulido. Sacás el turno online, dejás el auto y lo retirás listo. Dos bahías en paralelo, 11 años en el rubro.","whatsapp":"5491147479080","telefono":"011 4747-9080","direccion":"Av. Mitre 4820, San Isidro","horarios":"Lun a Sáb, 8:30 a 19 hs","instagram":"@puntoceroDetailing","galeria":["https://images.pexels.com/photos/17623850/pexels-photo-17623850.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop","https://images.pexels.com/photos/14021836/pexels-photo-14021836.jpeg?auto=compress&cs=tinysrgb&w=900&h=675&fit=crop","https://images.pexels.com/photos/3892898/pexels-photo-3892898.jpeg?auto=compress&cs=tinysrgb&w=900&h=675&fit=crop"]}$demo$::jsonb,
  $seeds${"productos":[{"id":"serv-ext","nombre":"Lavado exterior","precio":14000,"desc":"A mano con método de dos baldes, llantas y vidrios.","duracion":"45 minutos"},{"id":"serv-completo","nombre":"Lavado completo","precio":24000,"desc":"Exterior más aspirado, tablero y plásticos por dentro.","duracion":"90 minutos"},{"id":"serv-tapizados","nombre":"Limpieza de tapizados","precio":42000,"desc":"Inyección y extracción en butacas y alfombras.","duracion":"150 minutos"},{"id":"serv-pulido","nombre":"Pulido de carrocería","precio":78000,"desc":"Corta y refina para sacar rayas finas y opacidad.","duracion":"240 minutos"}]}$seeds$::jsonb,
  '{}'::jsonb,
  true,
  $palette${"accent":"#0b63f6","accentSoft":"rgba(11,99,246,0.12)","ink":"#101820","inkHex":"#101820","inkSoft":"#5b6672","bg":"#f4f6f8","line":"#dde3e9","fonts":{"serif":"'Kanit', sans-serif","mono":"'Roboto Mono', monospace","editorial":"'Public Sans', sans-serif","googleFontsHref":"https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700&family=Public+Sans:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600&display=swap"}}$palette$::jsonb,
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
