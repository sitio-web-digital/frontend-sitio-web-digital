export default function BrowserChrome({ url, secure = true }) {
  return (
    <div className="flex items-center gap-3 bg-navy-950 border-b border-white/10 px-4 py-3 rounded-t-2xl">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-ink-300">
        {secure && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-400">
            <path
              d="M6 10V8a6 6 0 1112 0v2M5 10h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        )}
        <span className="truncate font-medium text-white">{url}</span>
      </div>
    </div>
  );
}
