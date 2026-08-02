import { forwardRef } from 'react';
import { motion } from 'motion/react';

// Curva firma de Vaul/Sonner (Emil Kowalski): entra rápido, frena largo — se siente con peso, no elástica.
export const KOWALSKI_EASE = [0.32, 0.72, 0, 1];

// forwardRef: varias secciones registran un ref por ítem para saber dónde
// cae el puntero al arrastrar (ver useListDragReorder) — sin esto, un
// function component normal no puede recibir `ref` y React lo descarta en
// silencio (el arrastre calculaba posiciones sobre `undefined`).
const Reveal = forwardRef(function Reveal(
  { children, as = 'div', delay = 0, y = 20, duration = 0.6, className = '', once = true, ...props },
  ref
) {
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration, delay, ease: KOWALSKI_EASE }}
      {...props}
    >
      {children}
    </Comp>
  );
});

export default Reveal;
