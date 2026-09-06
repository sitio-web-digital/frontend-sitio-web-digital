import { useEffect, useRef } from 'react';

// El fondo del hero es un video en loop (grabado a partir del render real de
// la pared de plantillas — ver HeroWall.source-for-recording.jsx en el
// historial si hay que re-grabarlo) en vez de renderizar en vivo ~90
// instancias de SitePreview animando a la vez, que le quitaba mucho
// rendimiento a la home.
export default function HeroWall() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'oklch(0.19 0.03 258)' }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster="/hero-wall-poster.jpg?v=2"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      >
        {/* ?v= al final: Cloudflare cachea estos assets por 4hs (max-age) y
            trata cada query string distinto como un archivo nuevo — sin esto,
            re-grabar el video no alcanza para que los visitantes reales vean
            la versión nueva hasta que expire el cache viejo. Subir el
            número cada vez que se reemplaza el archivo. */}
        <source src="/hero-wall-loop.mp4?v=2" type="video/mp4" />
      </video>
    </div>
  );
}
