-- Crea (o actualiza) "Gimnasio Base 9" como plantilla real en custom_templates.
-- Construida con el mismo método verificado en Almacén 33 / Atelier Norte:
-- el <script type="__bundler/template"> del export "bundled" trae el
-- componente fuente completo con los arrays de datos tal cual (disciplinas,
-- grilla horaria, planes con multiplicador por período, coaches,
-- instalaciones, reseñas, contacto) — se usó ese código, no fragmentos de
-- texto adivinados. Fotos son las mismas de Pexels que usaba el archivo
-- original (mismos IDs, vía px(id,w,h)), no placeholders.
--
-- Piezas NUEVAS creadas en SitePreview.jsx para esta réplica:
--   - Sección nueva "horarios" — grilla semanal (horario × día) con una
--     disciplina asignada por celda; clickeable en público (resalta y
--     muestra el detalle abajo con botón de reserva), con <select> nativo
--     por celda en modo edición. Registrada en el catálogo general.
--   - hero variant "foto-derecha" — eyebrow tipo badge con borde, texto a
--     la izquierda, foto a la derecha con una barra inferior de dos datos
--     (label + valor).
--   - productos variant "disciplinas" — tarjeta con foto, franja de color
--     lateral (por disciplina) y meta de nivel/duración, sin precio.
--   - categorias variant "fotos" — grilla de fotos con etiqueta chica
--     sobre velo, sin número ni contador (para instalaciones/ambientes).
--   - precios ahora admite "terminos" (tabs de período con multiplicador
--     de precio y nota de ahorro, ej. Mensual/Trimestral/Anual) y un
--     eyebrow opcional — ambos opt-in, no cambian ninguna plantilla que
--     ya use "precios" sin esos campos.
--
-- Requiere que ya exista la columna palette_override. Se puede correr las
-- veces que haga falta: si la fila ya existe, se actualiza.
INSERT INTO custom_templates
  (id, nombre, tagline, rubros, tags, accent, image, image_fallback, sections, demo, seeds, text_styles, published, palette_override, created_by)
VALUES (
  'gimnasio-base-9',
  'Gimnasio Base 9',
  'Para gimnasios y estudios de entrenamiento con clases con cupo, planes por período y grilla horaria.',
  '["salud"]'::jsonb,
  '["gimnasio","fitness","entrenamiento","clases","salud"]'::jsonb,
  '#d4ff3d',
  'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop',
  $sections$[{"type":"header","variant":"clasico"},{"type":"hero","variant":"foto-derecha","titulo":"Entrená\nen serio,","tituloAcento":"sin apuro","descripcion":"Clases con cupo limitado, coaches que corrigen técnica de verdad y una rutina armada para vos. Sin contratos ni permanencia mínima.","heroCaption":"Hoy 20:00 · Funcional","botones":{"primary":{"funcion":"seccion","label":"Ver horarios"},"secondary":{"funcion":"seccion","label":"Ver planes"}},"stats":[{"value":"900","label":"m² sobre dos pisos"},{"value":"12","label":"personas por clase"},{"value":"0","label":"meses de permanencia"}]},{"type":"horarios","bgColor":"#171a16","eyebrow":"Grilla semanal","titulo":"Elegí tu horario","dias":["Lun","Mar","Mié","Jue","Vie","Sáb"],"horarios":["07:00","09:00","12:00","18:00","20:00"],"disciplinas":[{"id":"disc-funcional","nombre":"Funcional","coach":"Nadia","color":"#d4ff3d","nivel":"Todos los niveles","duracion":"55 min"},{"id":"disc-musculacion","nombre":"Musculación","coach":"Fede","color":"#4ac8f0","nivel":"Todos los niveles","duracion":"Libre"},{"id":"disc-cross","nombre":"Cross training","coach":"Lucas","color":"#ff7a45","nivel":"Intermedio","duracion":"60 min"},{"id":"disc-cardio","nombre":"Cardio y movilidad","coach":"Ema","color":"#c98bff","nivel":"Inicial","duracion":"45 min"}],"grilla":[["disc-funcional","disc-musculacion","disc-funcional","disc-musculacion","disc-funcional","disc-cross"],["disc-musculacion","disc-cardio","disc-musculacion","disc-cardio","disc-musculacion",null],["disc-cross",null,"disc-cross",null,"disc-cross",null],["disc-funcional","disc-cross","disc-funcional","disc-cross","disc-funcional","disc-cardio"],["disc-cardio","disc-funcional","disc-cardio","disc-funcional","disc-cardio",null]]},{"type":"precios","variant":"gimnasio","eyebrow":"Membresías","titulo":"Planes sin permanencia","terminos":[{"id":"term-mensual","label":"Mensual","mult":1,"ahorro":""},{"id":"term-trimestral","label":"Trimestral","mult":0.9,"ahorro":"10% menos que el mensual"},{"id":"term-anual","label":"Anual","mult":0.78,"ahorro":"22% menos que el mensual"}]},{"type":"productos","variant":"disciplinas","eyebrow":"Qué se entrena","titulo":"Disciplinas"},{"type":"equipo","variant":"retrato","bgColor":"#171a16","eyebrow":"El equipo","titulo":"Quién te entrena"},{"type":"categorias","variant":"fotos","categorias":[{"id":"fac-sala","label":"Sala de musculación","img":"https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop"},{"id":"fac-peso","label":"Zona de peso libre","img":"https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop"},{"id":"fac-cardio","label":"Cardio","img":"https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop"},{"id":"fac-kb","label":"Kettlebells y accesorios","img":"https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=500&h=500&fit=crop"}]},{"type":"contacto","variant":"mapa","contactoTitulo":"La sede","contactoTituloPrincipal":"900 m² sobre dos pisos","contactoSubtitulo":""},{"type":"testimonios","variant":"scroll"},{"type":"footer","variant":"minimal"}]$sections$::jsonb,
  $demo${"nombreNegocio":"Base 9","rubroLabel":"Primera clase sin cargo","sobreNosotros":"Gimnasio de 900 m² sobre dos pisos. Clases con cupo limitado, coaches que corrigen técnica de verdad y planes sin contratos ni permanencia mínima.","whatsapp":"5491166779900","telefono":"011 6677-9900","direccion":"Av. Juan B. Justo 2280, CABA","horarios":"Lun a Vie 6 a 23 hs · Sáb 9 a 16 hs","instagram":"@base9","galeria":["https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop","https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop","https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop","https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1200&fit=crop"]}$demo$::jsonb,
  $seeds${"productos":[{"id":"prod-disc-funcional","nombre":"Funcional","precio":0,"desc":"Circuitos de fuerza y resistencia con peso corporal, kettlebells y sogas.","categoria":"","meta":"Todos los niveles · 55 min","color":"#d4ff3d","disponible":true,"imagenes":["https://images.pexels.com/photos/3253501/pexels-photo-3253501.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop"]},{"id":"prod-disc-musculacion","nombre":"Musculación","precio":0,"desc":"Rutina personalizada con seguimiento de cargas y corrección de técnica.","categoria":"","meta":"Todos los niveles · Libre","color":"#4ac8f0","disponible":true,"imagenes":["https://images.pexels.com/photos/949126/pexels-photo-949126.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop"]},{"id":"prod-disc-cross","nombre":"Cross training","precio":0,"desc":"Trabajo de alta intensidad con barra, anillas y cajones. Cupo de 12.","categoria":"","meta":"Intermedio · 60 min","color":"#ff7a45","disponible":true,"imagenes":["https://images.pexels.com/photos/2261485/pexels-photo-2261485.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop"]},{"id":"prod-disc-cardio","nombre":"Cardio y movilidad","precio":0,"desc":"Trote, bici y trabajo de movilidad articular para descargar la semana.","categoria":"","meta":"Inicial · 45 min","color":"#c98bff","disponible":true,"imagenes":["https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=600&h=450&fit=crop"]}],"equipo":[{"id":"coach-nadia","nombre":"Nadia Ferrer","rol":"Funcional · 11 años","bio":"Profesora de educación física. Arma los circuitos y corrige técnica clase por clase.","foto":"https://images.pexels.com/photos/1638324/pexels-photo-1638324.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop"},{"id":"coach-fede","nombre":"Fede Ortiz","rol":"Musculación · 8 años","bio":"Especialista en fuerza. Si venís de cero, él te arma la primera rutina.","foto":"https://images.pexels.com/photos/2261477/pexels-photo-2261477.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop"},{"id":"coach-lucas","nombre":"Lucas Bravo","rol":"Cross training · 6 años","bio":"Trabaja movilidad antes que carga. Nadie levanta pesado hasta moverse bien.","foto":"https://images.pexels.com/photos/4162451/pexels-photo-4162451.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop"},{"id":"coach-ema","nombre":"Ema Duarte","rol":"Cardio y movilidad · 7 años","bio":"Kinesióloga. Lleva las clases de movilidad y la vuelta a entrenar después de una lesión.","foto":"https://images.pexels.com/photos/703012/pexels-photo-703012.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop"}],"planes":[{"id":"plan-libre","nombre":"Libre","precio":34000,"periodo":"mes","destacado":false,"features":["Acceso a sala de musculación","Horario completo","Rutina inicial armada","Sin permanencia mínima"]},{"id":"plan-full","nombre":"Full","precio":48000,"periodo":"mes","destacado":true,"features":["Todo lo del plan Libre","Clases con cupo incluidas","Seguimiento mensual de cargas","Plan de alimentación básico"]},{"id":"plan-personalizado","nombre":"Personalizado","precio":96000,"periodo":"mes","destacado":false,"features":["Todo lo del plan Full","Dos sesiones 1 a 1 por semana","Rutina rearmada cada mes","Contacto directo con tu coach"]}],"testimonios":[{"id":"testi-martin","nombre":"Martín S.","cargo":"Plan Full · 1 año","texto":"Venía de gimnasios donde nadie te mira. Acá te corrigen la técnica desde el primer día.","rating":5,"avatar":"","verificado":false},{"id":"testi-paula","nombre":"Paula C.","cargo":"Funcional","texto":"Las clases tienen cupo de verdad, no te amontonan. Se entrena tranquilo.","rating":5,"avatar":"","verificado":false},{"id":"testi-ivan","nombre":"Iván R.","cargo":"Plan Libre","texto":"Probé una clase gratis y me quedé. Sin contrato ni letra chica, como dicen.","rating":5,"avatar":"","verificado":false},{"id":"testi-belen","nombre":"Belén M.","cargo":"Musculación","texto":"Fede me armó la rutina de cero y en seis meses cambié por completo.","rating":5,"avatar":"","verificado":false}]}$seeds$::jsonb,
  '{}'::jsonb,
  true,
  $palette${"accent":"#d4ff3d","accentSoft":"rgba(212,255,61,0.12)","ink":"#f2f4ef","inkHex":"#f2f4ef","inkSoft":"rgba(242,244,239,0.6)","bg":"#0e0f0d","line":"rgba(242,244,239,0.14)","fonts":{"serif":"'Big Shoulders Display', sans-serif","mono":"'Anonymous Pro', monospace","editorial":"'Figtree', sans-serif","googleFontsHref":"https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@500;600;700;800&family=Figtree:wght@400;500;600;700&family=Anonymous+Pro:wght@400;700&display=swap"}}$palette$::jsonb,
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
