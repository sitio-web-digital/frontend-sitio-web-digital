import Marquee from './Marquee';

const TESTIMONIOS = [
  { nombre: 'Juan Pérez', negocio: 'Ferretería El Tornillo', texto: '"En un día tenía mi página lista y ya me escribían por WhatsApp. Nunca pensé que era tan fácil."' },
  { nombre: 'Carla Gómez', negocio: 'Estilo Carla', texto: '"No sé nada de computación y la armé sola. Ahora aparezco en Google cuando buscan mi peluquería."' },
  { nombre: 'Martín Ruiz', negocio: 'Rotisería Don Martín', texto: '"Sin pagar nada por adelantado y la cambio cuando quiero. Me sacó un peso de encima."' },
  { nombre: 'Lucía Fernández', negocio: 'Óptica Visión', texto: '"La actualizo yo misma en dos minutos, sin llamar a nadie. Comodísimo."' },
  { nombre: 'Diego Sosa', negocio: 'Taller Sosa', texto: '"Ahora los clientes me encuentran y me piden turno directo desde la página."' },
  { nombre: 'Valeria Acuña', negocio: 'Estética Vale', texto: '"Quedó divina y no gasté una fortuna. La recomiendo a todos mis conocidos."' },
  { nombre: 'Nicolás Moreno', negocio: 'Kiosco 24hs', texto: '"Barato, rápido y sin vueltas. Justo lo que necesitaba para mi negocio."' },
];

function Card({ item }) {
  return (
    <div
      style={{
        flex: '0 0 300px',
        background: 'oklch(0.15 0.025 258)',
        border: '1px solid oklch(0.97 0.008 95 / 0.08)',
        padding: '1.75rem',
      }}
    >
      <div style={{ fontFamily: '"Space Mono", monospace', color: 'oklch(0.8 0.15 86)', letterSpacing: '0.15em', marginBottom: '1rem' }}>
        ★★★★★
      </div>
      <p style={{ fontSize: '0.95rem', color: 'oklch(0.85 0.015 258)', lineHeight: 1.55, margin: '0 0 1.25rem' }}>{item.texto}</p>
      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.nombre}</div>
      <div style={{ fontSize: '0.8rem', color: 'oklch(0.58 0.02 258)' }}>{item.negocio}</div>
    </div>
  );
}

export default function TestimoniosCarousel() {
  return (
    <section id="opiniones" style={{ padding: 'clamp(3rem, 6vw, 4.5rem) 0', borderTop: '1px solid oklch(0.97 0.008 95 / 0.08)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto 2rem', padding: '0 clamp(1.25rem, 3vw, 2rem)' }}>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.18em', color: 'oklch(0.8 0.15 86)', marginBottom: '0.75rem' }}>
          NEGOCIOS QUE YA ESTÁN ONLINE
        </div>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.7rem, 3vw, 2.4rem)', margin: 0, maxWidth: '32rem' }}>
          Comercios reales que hoy tienen su página con nosotros
        </h2>
      </div>
      <div style={{ padding: '0 clamp(1.25rem, 3vw, 2rem)' }}>
        <Marquee items={TESTIMONIOS} gap="1.25rem" duration={45} renderItem={(item, key) => <Card key={key} item={item} />} />
      </div>
    </section>
  );
}
