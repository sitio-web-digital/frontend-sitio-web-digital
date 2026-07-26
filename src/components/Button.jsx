const VARIANTS = {
  primary:
    'bg-gold-500 text-navy-950 hover:bg-gold-400 active:bg-gold-600 shadow-[0_8px_24px_-8px_rgba(255,193,7,0.55)] hover:shadow-[0_10px_28px_-8px_rgba(255,193,7,0.7)]',
  secondary:
    'bg-white/5 text-white border border-white/15 hover:bg-white/10 hover:border-white/25',
  ghost: 'text-ink-300 hover:text-white hover:bg-white/5',
  dark: 'bg-navy-950 text-white hover:bg-navy-900 border border-white/10',
};

const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-3 text-[15px]',
  lg: 'px-7 py-4 text-base',
};

export default function Button({
  as: As = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <As
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </As>
  );
}
