-- Crea (o actualiza) "Taller Norte" (Escuela Taller Norte) como
-- plantilla real en custom_templates. Construida con el mismo método
-- verificado en las plantillas anteriores: el <script type="__bundler/
-- template"> del export "bundled" trae el componente fuente completo con
-- los arrays de datos tal cual (cursos con temario completo por módulo,
-- camadas con cupos, docentes, reseñas, contacto) — se usó ese código, no
-- fragmentos de texto adivinados. Fotos de cursos y docentes son las
-- mismas de Pexels que usaba el archivo original (mismos IDs, vía
-- px(id,w,h)). La foto del hero NO tenía un ID de Pexels en el original
-- (era un asset propio del bundler sin equivalente real) — se reemplazó
-- por una foto de Pexels del mismo tema (estudio de diseño/taller
-- creativo), verificada antes de usarla.
--
-- Piezas NUEVAS creadas en SitePreview.jsx para esta réplica:
--   - hero: props opcionales nuevas en la variante "insignia" —
--     badgeLado ('derecha' por defecto, 'izquierda' acá) y badgeColor
--     ('#ffb020' por defecto, propio color del diseño acá) — no cambian
--     la plantilla que ya usa esta variante (Detailing Punto Cero) porque
--     ninguna de las dos setea estos campos.
--   - equipo variant "perfil" — foto grande 3/4, nombre sin cursiva, rol
--     en mono color de acento y bio, SIN el borde superior de acento que
--     usa "retrato", en fila de 4 en vez de 3.
--   - Sección nueva "cursos" — dos bloques que comparten estado (curso
--     elegido + modalidad presencial/online, que cambia el precio -15%):
--     grilla de cursos con selector de modalidad arriba, y el temario del
--     curso elegido con acordeón de módulos (cada uno con desc + lista de
--     temas) abajo. Se registra como una sola sección porque el temario
--     no tiene sentido sin saber qué curso está elegido arriba.
--   - Sección nueva "camadas" — lista de próximas camadas con barra de
--     cupos ocupados y botón de reserva por WhatsApp (o "lista de
--     espera" si está completa), independiente de "cursos" porque no
--     depende de qué curso esté elegido.
--   - contacto variant "directo" con infoRows (ya agregado en la réplica
--     de Pet Shop Pata) reutilizado acá con las 4 filas propias de esta
--     escuela.
--
-- No se creó sección de "turnos" nueva: esta plantilla no tiene reserva
-- de horario, tiene inscripción a camadas (sección "camadas" ya cubre
-- ese caso). Tampoco se tocó la sección "cursos"/"servicios" de
-- productos existente: el modelo de curso acá (con módulos y temario)
-- no encaja en el catálogo compartido de productos, por eso es una
-- sección propia con su propia lista de cursos.
--
-- Requiere que ya exista la columna palette_override. Se puede correr las
-- veces que haga falta: si la fila ya existe, se actualiza.
INSERT INTO custom_templates
  (id, nombre, tagline, rubros, tags, accent, image, image_fallback, sections, demo, seeds, text_styles, published, palette_override, created_by)
VALUES (
  'escuela-taller-norte',
  'Taller Norte',
  'Para escuelas y academias de oficios creativos con catálogo de cursos (presencial u online), temario detallado por módulos y calendario de camadas.',
  '["otro"]'::jsonb,
  '["educacion","cursos","talleres","academia","oficios"]'::jsonb,
  '#6b4ee6',
  'https://images.pexels.com/photos/5104690/pexels-photo-5104690.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1100&fit=crop',
  'https://images.pexels.com/photos/5104690/pexels-photo-5104690.jpeg?auto=compress&cs=tinysrgb&w=1000&h=1100&fit=crop',
  $sections$[{"type":"header","variant":"clasico"},{"type":"hero","variant":"insignia","rubroLabel":"Cursos y talleres · Camada de agosto","titulo":"Aprendé un oficio nuevo en ocho semanas","descripcion":"Cursos cortos con cupo limitado, docentes que trabajan del rubro y proyecto final para tu portfolio. Presencial en Belgrano o en vivo por videollamada.","destacadoEtiqueta":"Inscripción abierta","heroCaption":"Quedan 4 lugares para la camada del 12 de agosto","badgeLado":"izquierda","badgeColor":"#ff6b4a","botones":{"primary":{"funcion":"seccion","label":"Ver los cursos"},"secondary":{"funcion":"seccion","label":"Próximas fechas"}},"stats":[{"value":"3","label":"cursos activos"},{"value":"640","label":"egresados"},{"value":"16","label":"alumnos por camada"}]},{"type":"cursos","titulo":"Nuestros cursos","descripcion":"Tocá un curso para ver su temario completo más abajo.","tituloTemario":"Qué vas a aprender, semana por semana","cursos":[{"id":"curso-diseno","nombre":"Diseño gráfico desde cero","nivel":"Inicial","semanas":8,"horas":4,"precioBase":168000,"cupos":18,"ocupados":14,"imagen":"https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=640&h=400&fit=crop","desc":"Composición, tipografía y color para armar piezas que se defiendan solas.","longDesc":"Ocho semanas para pasar de no saber abrir un archivo a entregar un sistema visual completo. Trabajamos sobre un cliente ficticio de punta a punta y terminás con tres piezas para tu portfolio.","proyecto":"Identidad visual de una marca","modulos":[{"titulo":"Fundamentos visuales","desc":"Antes de tocar el software entendemos por qué algo se ve bien o no.","topics":["Grilla, jerarquía y aire","Teoría del color aplicada","Lectura de referencias"]},{"titulo":"Tipografía","desc":"La mitad del trabajo de un diseñador es elegir y acomodar letras.","topics":["Clasificación y pares tipográficos","Ritmo vertical e interlínea","Errores frecuentes"]},{"titulo":"Herramientas","desc":"Recién acá abrimos el programa, ya sabiendo qué queremos hacer.","topics":["Vectores y trazados","Estilos y componentes","Preparación de archivos"]},{"titulo":"Proyecto final","desc":"Aplicás todo sobre un caso real, con devolución en vivo.","topics":["Brief y research","Sistema visual completo","Presentación al grupo"]}]},{"id":"curso-programacion","nombre":"Programación web inicial","nivel":"Inicial","semanas":12,"horas":6,"precioBase":240000,"cupos":16,"ocupados":16,"imagen":"https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=640&h=400&fit=crop","desc":"HTML, CSS y JavaScript hasta publicar tu primer sitio funcionando.","longDesc":"Doce semanas con ejercicios todas las clases y un proyecto que queda online. No hace falta saber nada previo, solo tener una computadora y ganas de romper cosas.","proyecto":"Sitio propio publicado","modulos":[{"titulo":"Estructura y estilos","desc":"Cómo se arma una página y cómo se le da forma.","topics":["HTML semántico","CSS y flexbox","Diseño responsive"]},{"titulo":"JavaScript","desc":"El lenguaje que hace que las cosas respondan al usuario.","topics":["Variables y funciones","Eventos y DOM","Fetch y datos"]},{"titulo":"Herramientas del oficio","desc":"Lo que usan los equipos reales todos los días.","topics":["Git y control de versiones","Consola y debugging","Deploy gratuito"]},{"titulo":"Proyecto final","desc":"Armás un sitio completo con lo aprendido y lo publicás.","topics":["Planificación","Desarrollo guiado","Puesta online"]}]},{"id":"curso-fotografia","nombre":"Taller de fotografía","nivel":"Intermedio","semanas":6,"horas":3,"precioBase":126000,"cupos":12,"ocupados":7,"imagen":"https://images.pexels.com/photos/7869240/pexels-photo-7869240.jpeg?auto=compress&cs=tinysrgb&w=640&h=400&fit=crop","desc":"Luz natural, encuadre y edición para fotos de producto y retrato.","longDesc":"Seis semanas cortas y prácticas: cada clase salimos a fotografiar y la siguiente revisamos el material entre todos. Se puede hacer con celular o con cámara.","proyecto":"Serie fotográfica de ocho tomas","modulos":[{"titulo":"Cómo ver la luz","desc":"La diferencia entre una buena y una mala foto casi siempre es la luz.","topics":["Luz dura y difusa","Horarios y ventanas","Rebotes caseros"]},{"titulo":"Encuadre","desc":"Dónde poner la cámara y qué dejar afuera.","topics":["Planos y distancias","Fondos y limpieza","Punto de vista"]},{"titulo":"Edición","desc":"Revelado sobrio, sin filtros que tapen el trabajo.","topics":["Ajustes básicos","Color y contraste","Exportar para web"]},{"titulo":"Serie final","desc":"Curaduría y armado de una serie coherente.","topics":["Selección","Secuencia","Presentación"]}]}]},{"type":"camadas","eyebrow":"Calendario","titulo":"Próximas camadas","descripcion":"Cada camada arranca con cupo cerrado. Reservás con la primera cuota y el resto lo pagás durante la cursada.","camadas":[{"id":"camada-1","fecha":"12 ago","diaSemana":"Martes","curso":"Diseño gráfico desde cero","horario":"Mar y Jue · 18:30 a 20:30 hs","cupos":18,"ocupados":14},{"id":"camada-2","fecha":"19 ago","diaSemana":"Martes","curso":"Programación web inicial","horario":"Mar y Vie · 19 a 22 hs","cupos":16,"ocupados":16},{"id":"camada-3","fecha":"2 sep","diaSemana":"Miércoles","curso":"Taller de fotografía","horario":"Miércoles · 18 a 21 hs","cupos":12,"ocupados":7},{"id":"camada-4","fecha":"15 sep","diaSemana":"Lunes","curso":"Diseño gráfico desde cero","horario":"Lun y Mié · 10 a 12 hs","cupos":18,"ocupados":3}]},{"type":"equipo","variant":"perfil","titulo":"Quién da las clases","descripcion":"Todos trabajan del rubro que enseñan, no solo lo estudiaron."},{"type":"testimonios","variant":"grid"},{"type":"contacto","variant":"directo","contactoTitulo":"¿Dudas antes de anotarte?","contactoSubtitulo":"Escribinos y te contamos si el curso es para tu nivel. También podés venir a una clase de prueba sin cargo.","infoRows":[{"id":"info-direccion","label":"Dirección","value":"Ciudad de la Paz 2140, Belgrano"},{"id":"info-secretaria","label":"Secretaría","value":"Lun a Vie, 14 a 20 hs"},{"id":"info-telefono","label":"Teléfono","value":"011 4783-2200"},{"id":"info-prueba","label":"Clase de prueba","value":"Sin cargo, coordinás por WhatsApp"}]},{"type":"footer","variant":"minimal"}]$sections$::jsonb,
  $demo${"nombreNegocio":"Taller Norte","rubroLabel":"Escuela de oficios creativos: diseño, programación y fotografía, presencial u online","sobreNosotros":"Cursos cortos con cupo limitado, docentes que trabajan del rubro y proyecto final para tu portfolio. Presencial en Belgrano o en vivo por videollamada.","whatsapp":"5491147832200","telefono":"011 4783-2200","direccion":"Ciudad de la Paz 2140, Belgrano","horarios":"Lun a Vie, 14 a 20 hs","instagram":"@tallernorte","galeria":["https://images.pexels.com/photos/5104690/pexels-photo-5104690.jpeg?auto=compress&cs=tinysrgb&w=900&h=990&fit=crop","https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=640&h=400&fit=crop","https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=640&h=400&fit=crop","https://images.pexels.com/photos/7869240/pexels-photo-7869240.jpeg?auto=compress&cs=tinysrgb&w=640&h=400&fit=crop"]}$demo$::jsonb,
  $seeds${"equipo":[{"id":"doc-paula","nombre":"Paula Aguirre","rol":"Diseño gráfico","foto":"https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop","bio":"Diseñadora en estudio propio hace doce años. Da el curso inicial desde 2019."},{"id":"doc-carla","nombre":"Carla Vera","rol":"Programación","foto":"https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop","bio":"Desarrolladora front-end. Enseña como le hubiera gustado que le enseñen a ella."},{"id":"doc-lucia","nombre":"Lucía Ferrer","rol":"Fotografía","foto":"https://images.pexels.com/photos/4491461/pexels-photo-4491461.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop","bio":"Fotógrafa de producto para marcas locales. Trabaja con luz natural casi siempre."},{"id":"doc-ana","nombre":"Ana Domínguez","rol":"Coordinación","foto":"https://images.pexels.com/photos/6929163/pexels-photo-6929163.jpeg?auto=compress&cs=tinysrgb&w=500&h=667&fit=crop","bio":"Arma las camadas y acompaña a cada grupo durante toda la cursada."}],"testimonios":[{"id":"testi-sofia","nombre":"Sofía R.","cargo":"Diseño gráfico · camada marzo","texto":"Entré sin saber nada y salí con tres piezas de portfolio. Las devoluciones en clase valen oro.","rating":5,"avatar":"","verificado":false},{"id":"testi-emiliano","nombre":"Emiliano T.","cargo":"Programación web · camada abril","texto":"El curso de programación es exigente pero te llevan de la mano. Publiqué mi sitio en la semana 11.","rating":5,"avatar":"","verificado":false},{"id":"testi-nadia","nombre":"Nadia P.","cargo":"Fotografía · camada mayo","texto":"Hice el taller de fotografía con el celular y aprendí más que en dos años de tutoriales.","rating":5,"avatar":"","verificado":false}]}$seeds$::jsonb,
  '{}'::jsonb,
  true,
  $palette${"accent":"#6b4ee6","accentSoft":"rgba(107,78,230,0.12)","ink":"#241d2e","inkHex":"#241d2e","inkSoft":"#6a6076","bg":"#f6f3ec","line":"#ddd6c9","fonts":{"serif":"'Bricolage Grotesque', sans-serif","mono":"'Martian Mono', monospace","editorial":"'Source Sans 3', sans-serif","googleFontsHref":"https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Source+Sans+3:wght@400;500;600;700&family=Martian+Mono:wght@500;600&display=swap"}}$palette$::jsonb,
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
