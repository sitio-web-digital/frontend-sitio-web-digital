export default function Marquee({ items, renderItem, gap = '1rem', duration = 35, direction = 'left' }) {
  const anim = direction === 'right' ? 'swd-marquee-reverse' : 'swd-marquee';
  return (
    <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent, black 4%, black 96%, transparent)' }}>
      <div
        className="swd-marquee-track"
        style={{ display: 'flex', gap, width: 'max-content', animation: `${anim} ${duration}s linear infinite` }}
      >
        {items.map((item, i) => renderItem(item, `a-${i}`))}
        {items.map((item, i) => renderItem(item, `b-${i}`))}
      </div>
      <style>{`
        @keyframes swd-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes swd-marquee-reverse {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .swd-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
