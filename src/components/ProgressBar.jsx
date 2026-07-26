export default function ProgressBar({ step, total }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-ink-400 tracking-wide uppercase">
          Paso {step} de {total}
        </span>
        <span className="text-xs font-medium text-gold-500">
          {Math.round((step / total) * 100)}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500 ease-out"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
