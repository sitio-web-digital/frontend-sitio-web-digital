export default function Logo({ withWordmark = true, size = 'md', dark = false, frame = true }) {
  const sizes = {
    sm: { box: 'w-8 h-8 text-sm', word: 'text-sm' },
    md: { box: 'w-10 h-10 text-base', word: 'text-lg' },
    lg: { box: 'w-14 h-14 text-xl', word: 'text-2xl' },
  }[size];

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`${sizes.box} shrink-0 flex items-center justify-center font-display font-bold tracking-tight ${
          frame ? 'rounded-xl bg-navy-800 border border-white/10' : ''
        }`}
      >
        <span className={dark ? 'text-navy-900' : 'text-white'}>S</span>
        <span className="text-gold-500">W</span>
      </div>
      {withWordmark && (
        <span
          className={`${sizes.word} font-display font-semibold tracking-tight ${dark ? 'text-navy-900' : 'text-white'}`}
        >
          SitioWeb <span className="text-gold-500">Digital</span>
        </span>
      )}
    </div>
  );
}
