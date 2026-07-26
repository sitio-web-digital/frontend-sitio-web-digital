import { useState } from 'react';

const EASE = 'cubic-bezier(0.32,0.72,0,1)';

export default function Accordion({ items, defaultOpen = 0 }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);

  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpenIndex(open ? -1 : i)}
              aria-expanded={open}
              className="w-full flex items-center justify-between gap-6 py-5 text-left"
            >
              <span className="font-display font-semibold text-white text-base sm:text-lg">
                {item.q}
              </span>
              <span
                className="shrink-0 w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-ink-300 transition-transform"
                style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transitionDuration: '500ms', transitionTimingFunction: EASE }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows]"
              style={{ gridTemplateRows: open ? '1fr' : '0fr', transitionDuration: '450ms', transitionTimingFunction: EASE }}
            >
              <div className="overflow-hidden">
                <p className="text-ink-300 text-sm sm:text-[15px] leading-relaxed pb-5 pr-10 text-balance">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
