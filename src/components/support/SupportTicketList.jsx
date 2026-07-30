import { useState } from 'react';
import SupportThread from './SupportThread';

// Lista de consultas ya enviadas (más nueva primero): cada una se puede
// expandir para ver el chat completo (mensaje inicial + réplicas) y seguir
// respondiendo ahí mismo. La usan tanto Dashboard > Soporte como el modal de
// soporte del editor — mismos tickets, mismo backend, solo cambia el
// contenedor donde se muestra.
export default function SupportTicketList({ tickets, currentUserId, unreadIds = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  if (tickets.length === 0) {
    return (
      <p className="text-sm text-ink-400">
        Todavía no escribiste a soporte. Si tenés una duda o un problema, contanos con "Nueva consulta".
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((t) => {
        const isOpen = expandedId === t.id;
        return (
          <div key={t.id} className="border border-white/10 bg-navy-900 hover:border-white/20 transition-colors">
            <button
              onClick={() => setExpandedId(isOpen ? null : t.id)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0 flex items-center gap-2">
                {unreadIds.includes(t.id) && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-label="Respuesta nueva" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{t.asunto}</p>
                    <span
                      className={`shrink-0 text-[0.65rem] font-semibold uppercase px-1.5 py-0.5 border rounded ${
                        t.status === 'cerrado'
                          ? 'text-ink-400 bg-white/5 border-white/15'
                          : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25'
                      }`}
                    >
                      {t.status === 'cerrado' ? 'Cerrado' : 'Abierto'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {new Date(t.createdAt).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <span className="text-xs text-ink-500 shrink-0">{isOpen ? 'Ocultar' : 'Ver'}</span>
            </button>
            {isOpen && <SupportThread ticketId={t.id} currentUserId={currentUserId} />}
          </div>
        );
      })}
    </div>
  );
}
