-- Crea site_terms (si todavía no existe) y siembra el texto que ya estaba
-- hardcodeado en TermsGate.jsx, para que la migración a "editable desde
-- Admin" no borre lo que ya estaba publicado. Re-ejecutable: ON CONFLICT no
-- pisa un texto que un admin ya haya editado a mano después de correr esto.
CREATE TABLE IF NOT EXISTS site_terms (
  id INT PRIMARY KEY DEFAULT 1,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_terms_singleton CHECK (id = 1)
);

INSERT INTO site_terms (id, content, updated_at)
VALUES (1, $$1. Objeto

Estos Términos y Condiciones regulan el acceso y uso de la plataforma "SitioWeb Digital" (en adelante, "la Plataforma"), un servicio que permite a comercios y profesionales crear, personalizar y publicar sitios web propios a partir de plantillas prediseñadas. El uso de la Plataforma implica la aceptación plena de estos términos.

2. Aceptación de los términos

Al acceder, registrarte o utilizar cualquier funcionalidad de la Plataforma, aceptás quedar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguno de sus puntos, debés abstenerte de utilizar el servicio.

3. Descripción del servicio

SitioWeb Digital ofrece un asistente guiado y un editor visual para armar un sitio web a partir de plantillas, con secciones personalizables (galería, productos, testimonios, preguntas frecuentes, contacto, entre otras). El servicio se presta bajo la modalidad de suscripción, según el plan vigente al momento de la contratación.

4. Registro y cuenta de usuario

Para publicar y administrar tu sitio necesitás crear una cuenta con un correo electrónico válido. Sos responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta. Debés notificarnos de inmediato ante cualquier uso no autorizado.

5. Contenido cargado por el usuario

Sos el único responsable del contenido que subís a tu sitio (textos, imágenes, precios, datos de contacto, logo, etc.). Declarás contar con los derechos necesarios sobre ese contenido y te comprometés a no publicar material ilícito, difamatorio, que infrinja derechos de terceros o que viole normativa vigente. Nos reservamos el derecho de suspender un sitio que incumpla esta cláusula.

6. Suscripción, pagos y cancelación

El acceso a la publicación del sitio requiere una suscripción activa, con cobro recurrente según el ciclo elegido. Podés cancelar en cualquier momento desde tu panel; la cancelación tendrá efecto al finalizar el período ya abonado. Los pagos se procesan a través de la pasarela de pago habilitada en cada momento.

7. Propiedad intelectual

Las plantillas, el software, el diseño y la marca "SitioWeb Digital" están protegidos por la normativa de propiedad intelectual vigente. Se te otorga una licencia de uso limitada, no exclusiva e intransferible sobre las plantillas, exclusivamente para operar tu propio sitio dentro de la Plataforma.

8. Disponibilidad del servicio

Trabajamos para mantener la Plataforma disponible de forma continua, pero no garantizamos un funcionamiento ininterrumpido o libre de errores. Podemos realizar tareas de mantenimiento, actualizar funcionalidades o modificar el servicio, procurando el menor impacto posible para los usuarios.

9. Limitación de responsabilidad

En la medida permitida por la ley, SitioWeb Digital no será responsable por daños indirectos, lucro cesante o pérdida de datos derivados del uso o la imposibilidad de uso de la Plataforma. El servicio se brinda "tal cual", sin garantías de que se ajuste a un fin específico.

10. Datos personales

Los datos que nos proporciones (nombre, correo, teléfono, datos del negocio) se utilizan exclusivamente para prestar el servicio y comunicarnos con vos. No compartimos tus datos con terceros salvo obligación legal o para procesar el pago de tu suscripción.

11. Modificación de estos términos

Podemos actualizar estos Términos y Condiciones en cualquier momento. Los cambios relevantes se informarán dentro de la Plataforma. El uso continuado del servicio luego de una actualización implica la aceptación de los nuevos términos.

12. Ley aplicable y contacto

Estos términos se rigen por las leyes de la República Argentina. Ante cualquier consulta, podés escribirnos a hola@sitiowebdigital.com.ar.$$, '2026-07-22T00:00:00-03:00')
ON CONFLICT (id) DO NOTHING;
