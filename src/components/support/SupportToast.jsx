// Cartel avisando que soporte respondió algo nuevo — aparece solo cuando el
// conteo de no-leídos sube (nunca en cada sondeo repetido mientras la misma
// respuesta sigue sin verse). Lo usan tanto Dashboard como el editor, cada
// uno con su propio sondeo de `apiGetSupportUnread` y su propio `onVer`
// (a qué pantalla/sección lleva ver la respuesta).
export default function SupportToast({ data, onVer, onClose }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 border border-gold-500/40 bg-navy-850 shadow-2xl p-4 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-white">
          {data.count === 1 ? 'Soporte te respondió' : `Soporte te respondió en ${data.count} consultas`}
        </p>
        <button onClick={onClose} className="text-ink-500 hover:text-white transition-colors shrink-0" aria-label="Cerrar">
          ✕
        </button>
      </div>
      {data.tickets?.[0] && (
        <p className="text-xs text-ink-400 mt-1.5 truncate">{data.tickets[0].asunto}</p>
      )}
      <button
        onClick={onVer}
        className="mt-3 w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-sm py-2 transition-colors"
      >
        Ver en Soporte →
      </button>
    </div>
  );
}
