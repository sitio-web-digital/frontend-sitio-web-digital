import { useState } from 'react';

const FAQS = [
  {
    q: '¿El precio es realmente $14.900 por mes y no pago nada más?',
    a: 'Sí, es un precio final y mensual. Incluye el diseño, la página, el hosting, la seguridad y las actualizaciones. Sin anticipo, sin costo de instalación y sin sorpresas en la factura.',
  },
  {
    q: 'No sé nada de tecnología, ¿igual puedo tener mi página?',
    a: 'Sí. Respondés unas preguntas simples sobre tu negocio y armamos la página por vos con una plantilla lista. Después la editás con clics, sin escribir código ni instalar nada.',
  },
  {
    q: '¿Puedo darme de baja cuando quiera?',
    a: 'Sí, es mes a mes y sin contrato de permanencia. Si en algún momento querés dar de baja, tu página se desactiva y no seguís pagando.',
  },
  {
    q: '¿En cuánto tiempo queda online mi página?',
    a: 'El mismo día. Elegís tu plantilla, cargás los datos de tu negocio y en minutos ya está publicada con tu propia dirección web.',
  },
  {
    q: '¿Voy a aparecer en Google?',
    a: 'Sí, tu página queda indexada con tu nombre, dirección y rubro para que te encuentren cuando buscan tu negocio o lo que vendés.',
  },
  {
    q: '¿Por qué necesito una página si ya tengo redes sociales?',
    a: 'Las redes sirven, pero no son tuyas ni buscables en Google del mismo modo. Tu página es tu dirección propia, siempre disponible, con tu catálogo, tu WhatsApp y tu información de contacto ordenada en un solo lugar.',
  },
  {
    q: '¿Sirve para mi tipo de negocio y puedo cambiarla después?',
    a: 'Sí, hay plantillas pensadas para distintos rubros y podés cambiar de plantilla, colores y secciones cuando quieras sin perder tu contenido.',
  },
];

export default function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section
      id="faq"
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 'clamp(3rem, 6vw, 4.5rem) clamp(1.25rem, 3vw, 2rem)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 'clamp(2rem, 5vw, 4rem)',
        alignItems: 'start',
      }}
    >
      <div>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.18em', color: 'oklch(0.8 0.15 86)', marginBottom: '0.75rem' }}>
          PREGUNTAS FRECUENTES
        </div>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', margin: '0 0 2rem' }}>
          Antes de que preguntes
        </h2>
        <div>
          {FAQS.map((item, i) => {
            const open = openIdx === i;
            return (
              <div key={item.q} style={{ borderBottom: '1px solid oklch(0.97 0.008 95 / 0.1)' }}>
                <div
                  onClick={() => setOpenIdx(open ? -1 : i)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 0', cursor: 'pointer' }}
                >
                  <span
                    style={{
                      fontFamily: '"Space Mono", monospace',
                      fontSize: '1.3rem',
                      color: 'oklch(0.8 0.15 86)',
                      width: '1.5rem',
                      transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  >
                    +
                  </span>
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.02rem', flex: 1 }}>{item.q}</span>
                </div>
                {open && (
                  <p style={{ fontSize: '0.92rem', color: 'oklch(0.78 0.02 258)', lineHeight: 1.6, margin: '0 0 1.5rem 2.5rem', maxWidth: '36rem' }}>
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: 'sticky',
          top: '6.5rem',
          background: 'oklch(0.8 0.15 86)',
          color: 'oklch(0.19 0.03 258)',
          padding: 'clamp(2.5rem, 4vw, 3.5rem) clamp(1.75rem, 3vw, 2.5rem)',
          textAlign: 'center',
        }}
      >
        <div style={{ width: 46, height: 46, margin: '0 auto 1.5rem', border: '2px solid oklch(0.19 0.03 258 / 0.55)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: 12, borderBottom: '2px solid oklch(0.19 0.03 258 / 0.55)', display: 'flex', alignItems: 'center', gap: '2.5px', padding: '0 4px' }}>
            <div style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', background: 'oklch(0.19 0.03 258 / 0.6)' }} />
            <div style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', background: 'oklch(0.19 0.03 258 / 0.6)' }} />
            <div style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', background: 'oklch(0.19 0.03 258 / 0.6)' }} />
          </div>
          <div style={{ padding: '5px 5px 0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ height: 4, width: '70%', background: 'oklch(0.19 0.03 258 / 0.35)' }} />
            <div style={{ height: 4, width: '50%', background: 'oklch(0.19 0.03 258 / 0.35)' }} />
            <div style={{ height: 4, width: '60%', background: 'oklch(0.19 0.03 258 / 0.5)' }} />
          </div>
        </div>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', margin: '0 0 1rem' }}>
          Tu página, lista hoy.
        </h2>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.3rem', marginBottom: '2rem' }}>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '2.4rem' }}>$14.900</span>
          <span style={{ fontFamily: '"Space Mono", monospace', fontSize: '1rem', fontWeight: 700, opacity: 0.75 }}>/mes</span>
        </div>
        <a
          href="#/quiz"
          style={{ display: 'inline-block', background: 'oklch(0.19 0.03 258)', color: 'oklch(0.97 0.008 95)', fontWeight: 700, padding: '1rem 2rem', width: '100%', boxSizing: 'border-box' }}
        >
          Crear mi página →
        </a>
        <div style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: '1rem' }}>Sin anticipo · Sin tarjeta · Cancelás cuando quieras</div>
      </div>
    </section>
  );
}
