import { useState } from 'react';

// Foto de fondo con shimmer mientras carga y fallback automático si la fuente
// principal falla o tarda (LoremFlickr puede ser lento en la primera resolución
// de una combinación de keywords nueva). Nunca deja un hueco negro/roto.
export default function Photo({ src, fallback, alt = '', overlay, className = '' }) {
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 bg-navy-700 animate-pulse" />}
      <img
        src={broken ? fallback : src}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setBroken(true);
          setLoaded(true);
        }}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {overlay && <div className="absolute inset-0" style={{ background: overlay }} />}
    </div>
  );
}
