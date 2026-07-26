import Marquee from './Marquee';

// Cada ítem tiene su propio color saturado (no un solo tono gris repetido) y
// un ícono a línea gruesa en blanco sobre una placa con degradé — para que
// lea como el ícono de una app real, no como un ícono de librería genérico
// flotando sin fondo.
const ITEMS = [
  { label: 'Aparecés en Google', from: 'oklch(0.62 0.19 255)', to: 'oklch(0.5 0.19 265)', svg: '<circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M20 20l-4.3-4.3"></path>' },
  { label: 'Botón de WhatsApp', from: 'oklch(0.68 0.19 150)', to: 'oklch(0.56 0.17 155)', svg: '<path d="M6 19l1.2-3.6A7.5 7.5 0 1112 19.5a7.4 7.4 0 01-3.4-.8L6 19z"></path><path d="M9 10.5c0 3 2.5 5.5 5.5 5.5"></path>' },
  { label: 'La editás vos', from: 'oklch(0.65 0.2 300)', to: 'oklch(0.53 0.2 305)', svg: '<path d="M15 5l4 4L8 20l-4.5.5L4 16 15 5z"></path>' },
  { label: 'Hosting incluido', from: 'oklch(0.68 0.18 55)', to: 'oklch(0.56 0.18 45)', svg: '<rect x="4" y="4" width="16" height="6" rx="1"></rect><rect x="4" y="14" width="16" height="6" rx="1"></rect><circle cx="8" cy="7" r="0.8" fill="currentColor"></circle><circle cx="8" cy="17" r="0.8" fill="currentColor"></circle>' },
  { label: 'Se ve en el celular', from: 'oklch(0.65 0.21 15)', to: 'oklch(0.53 0.2 10)', svg: '<rect x="7" y="3" width="10" height="18" rx="2"></rect><path d="M11 18h2"></path>' },
  { label: 'Tu dirección propia', from: 'oklch(0.66 0.15 200)', to: 'oklch(0.54 0.14 210)', svg: '<circle cx="12" cy="12" r="8.5"></circle><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14.5 0 17M12 3.5c-2.5 2.5-2.5 14.5 0 17"></path>' },
  { label: 'Sitio seguro', from: 'oklch(0.66 0.17 165)', to: 'oklch(0.53 0.16 165)', svg: '<path d="M12 3l7 3v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"></path><path d="M9 12l2 2 4-4.5"></path>' },
  { label: 'Galería de fotos', from: 'oklch(0.7 0.17 75)', to: 'oklch(0.58 0.17 65)', svg: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"></rect><circle cx="8.5" cy="9.5" r="1.7" fill="currentColor"></circle><path d="M4 17l5-5 3.5 3.5L17 11l3 3.5"></path>' },
  { label: 'Formulario de contacto', from: 'oklch(0.62 0.18 280)', to: 'oklch(0.5 0.18 285)', svg: '<rect x="3.5" y="5" width="17" height="14" rx="1.5"></rect><path d="M4 6.5l8 6 8-6"></path>' },
  { label: 'Diseño a tu rubro', from: 'oklch(0.66 0.2 350)', to: 'oklch(0.54 0.19 355)', svg: '<path d="M12 3.5a8.5 8.5 0 100 17c1.2 0 2-1 2-2 0-.6-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.4 0-1 .9-1.7 1.9-1.7H17c2.2 0 3.5-1.6 3.5-3.6C20.5 6.4 16.7 3.5 12 3.5z"></path><circle cx="7.7" cy="10" r="1" fill="currentColor"></circle><circle cx="10.5" cy="7" r="1" fill="currentColor"></circle><circle cx="14.5" cy="7.2" r="1" fill="currentColor"></circle>' },
  { label: 'Cambios ilimitados', from: 'oklch(0.68 0.15 195)', to: 'oklch(0.56 0.15 200)', svg: '<path d="M7 12a5 5 0 019-3M17 12a5 5 0 01-9 3"></path><path d="M16 5.5v3.5h-3.5"></path><path d="M8 18.5V15h3.5"></path>' },
  { label: 'Online el mismo día', from: 'oklch(0.72 0.18 90)', to: 'oklch(0.6 0.18 75)', svg: '<path d="M13 3L5 13.5h5.5L11 21l8-10.5h-5.5L13 3z"></path>' },
  { label: 'Soporte real', from: 'oklch(0.64 0.16 230)', to: 'oklch(0.52 0.16 235)', svg: '<path d="M4 13a8 8 0 1116 0"></path><rect x="3" y="13" width="4" height="5" rx="1"></rect><rect x="17" y="13" width="4" height="5" rx="1"></rect><path d="M20 18v1a3 3 0 01-3 3h-3"></path>' },
  { label: 'Google Maps', from: 'oklch(0.66 0.19 25)', to: 'oklch(0.54 0.19 15)', svg: '<path d="M12 21s-6.5-6-6.5-11A6.5 6.5 0 0112 3a6.5 6.5 0 016.5 6.5c0 5-6.5 11.5-6.5 11.5z"></path><circle cx="12" cy="9.5" r="2.3" fill="currentColor"></circle>' },
  { label: 'Redes conectadas', from: 'oklch(0.63 0.19 320)', to: 'oklch(0.51 0.19 325)', svg: '<circle cx="6" cy="12" r="2.3"></circle><circle cx="18" cy="6" r="2.3"></circle><circle cx="18" cy="18" r="2.3"></circle><path d="M8 11l8-3.5M8 13l8 3.5"></path>' },
  { label: 'Sin anticipo', from: 'oklch(0.6 0.03 258)', to: 'oklch(0.46 0.03 258)', svg: '<rect x="3" y="6" width="18" height="13" rx="1.8"></rect><path d="M3 10h18"></path><path d="M6.5 14.5h4"></path><path d="M4 4l16 16"></path>' },
];

function Chip({ item }) {
  return (
    <div
      style={{
        flex: '0 0 168px',
        background: 'oklch(0.22 0.03 258)',
        border: '1px solid oklch(0.97 0.008 95 / 0.08)',
        borderRadius: 14,
        padding: '1.1rem 1.1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(150deg, ${item.from}, ${item.to})`,
          boxShadow: `0 6px 14px -4px ${item.to}`,
        }}
        dangerouslySetInnerHTML={{
          __html: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" color="white">${item.svg}</svg>`,
        }}
      />
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'oklch(0.92 0.01 258)', lineHeight: 1.3 }}>{item.label}</span>
    </div>
  );
}

const MID = Math.ceil(ITEMS.length / 2);
const ROW_1 = ITEMS.slice(0, MID);
const ROW_2 = ITEMS.slice(MID);

export default function TodoIncluidoCarousel() {
  return (
    <section
      id="incluye"
      style={{
        borderTop: '1px solid oklch(0.97 0.008 95 / 0.08)',
        borderBottom: '1px solid oklch(0.97 0.008 95 / 0.08)',
        background: 'oklch(0.16 0.026 258)',
        padding: 'clamp(2.5rem, 5vw, 3.5rem) 0',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto 1.75rem', padding: '0 clamp(1.25rem, 3vw, 2rem)' }}>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.18em', color: 'oklch(0.8 0.15 86)', marginBottom: '0.6rem' }}>
          TODO INCLUIDO
        </div>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 2.6vw, 2rem)', margin: 0, maxWidth: '30rem' }}>
          Nada de esto se cobra aparte
        </h2>
      </div>
      <div style={{ padding: '0 clamp(1.25rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Marquee items={ROW_1} gap="1rem" duration={34} direction="left" renderItem={(item, key) => <Chip key={key} item={item} />} />
        <Marquee items={ROW_2} gap="1rem" duration={38} direction="right" renderItem={(item, key) => <Chip key={key} item={item} />} />
      </div>
    </section>
  );
}
