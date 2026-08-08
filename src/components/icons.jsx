// Íconos SVG livianos (stroke consistente) en vez de emoji como íconos funcionales —
// los emoji dependen de la fuente del sistema y no son controlables por diseño ni accesibles de forma consistente.

export function WhatsAppIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 004.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.11h-.01a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.17 8.17 0 01-1.26-4.36c0-4.52 3.68-8.2 8.26-8.2 2.21 0 4.28.86 5.84 2.42a8.15 8.15 0 012.42 5.8c0 4.52-3.68 8.22-8.26 8.22z" />
    </svg>
  );
}

export function StarIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.7z" />
    </svg>
  );
}

export function PinIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 21s7-6.5 7-11.5a7 7 0 10-14 0C5 14.5 12 21 12 21z" strokeLinejoin="round" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

export function PhoneCallIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path
        d="M6.6 10.8c1.5 3 3.9 5.4 6.9 6.9l2.3-2.3c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.3c0-.6.4-1 1-1h3.2c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.2 1.1z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendUpIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M3 17l6-6 4 4 8-8M21 7v5M21 7h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckBadgeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function XIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

export function EyeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.4 5.3A10.4 10.4 0 0112 5c6.5 0 10 7 10 7a15.6 15.6 0 01-3.2 4.1M6.6 6.6C3.9 8.3 2 12 2 12s3.5 7 10 7c1.2 0 2.3-.2 3.3-.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="8" y="8" width="13" height="13" rx="1.5" />
      <path d="M16 8V5.5A1.5 1.5 0 0014.5 4H4.5A1.5 1.5 0 003 5.5v10A1.5 1.5 0 004.5 17H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ImagesIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M3 15V6a1.5 1.5 0 011.5-1.5H15" strokeLinecap="round" />
      <rect x="7" y="7" width="14" height="14" rx="1.5" />
      <circle cx="12" cy="12" r="1.3" />
      <path d="M9 18l3-3 2 2 3-3 2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 7h16M9 7V4.8c0-.4.4-.8.9-.8h4.2c.5 0 .9.4.9.8V7M18.5 7l-.7 12.3a2 2 0 01-2 1.7H8.2a2 2 0 01-2-1.7L5.5 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export function GlobeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9s1.3-6.4 3.8-9z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V7a4 4 0 118 0v3.5" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronUpIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ImageIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.5" cy="8.5" r="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MonitorIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16.5V20" strokeLinecap="round" />
    </svg>
  );
}

export function TabletIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="5" y="2.5" width="14" height="19" rx="2" />
      <path d="M11.5 18h1" strokeLinecap="round" />
    </svg>
  );
}

export function SmartphoneIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11.5 18h1" strokeLinecap="round" />
    </svg>
  );
}

export function PencilIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path
        d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PaletteIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path
        d="M12 3a9 9 0 100 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2H17a4 4 0 004-4c0-4.4-4-8-9-8z"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16.2" cy="10" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TypeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 6h16M12 6v14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlignLeftIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 6h16M4 12h10M4 18h13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WidgetsIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <circle cx="17" cy="17" r="4" />
    </svg>
  );
}

export function PlayIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 001.52.85l10.5-6.5a1 1 0 000-1.7l-10.5-6.5A1 1 0 008 5.5z" />
    </svg>
  );
}

export function ClockIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TagIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M11.5 3.5H5v6.5L14.5 20l6.5-6.5L11.5 3.5z" strokeLinejoin="round" />
      <circle cx="8.5" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SparkIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  );
}

export function CompassIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.2l-2 4.6-4.6 2 2-4.6z" strokeLinejoin="round" />
    </svg>
  );
}

export function RocketIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path
        d="M12 15c3-1 5-4.5 5-8.5C13 7.5 9.5 9.5 8.5 12.5m3.5 2.5l-3.5-3.5m3.5 3.5c-1.4 1.8-4 2.6-4 2.6s.8-2.6 2.6-4m-2.6 4L5 21m4-3.9L5.9 15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ForkKnifeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M6 2.5v8a2 2 0 002 2v9M6 2.5v5M8 2.5v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 2.5c-1.7 0-3 2-3 5s1.3 5 3 5v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ScissorsIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <path d="M7.8 7.5L20 19M20 5L7.8 16.5" strokeLinecap="round" />
    </svg>
  );
}

export function WrenchIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path
        d="M14.7 6.3a4 4 0 00-5.4 4.8L3 17.4l2.6 2.6 6.3-6.3a4 4 0 004.8-5.4l-2.6 2.6-2.2-2.2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShoppingBagIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M6 8h12l-1 12.5a1.5 1.5 0 01-1.5 1.5h-8a1.5 1.5 0 01-1.5-1.5L6 8z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 016 0v2" strokeLinecap="round" />
    </svg>
  );
}

export function HeartPulseIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-9.8-9.4C.8 7.6 2.7 4 6.2 4c2 0 3.5 1.2 4.3 2.6M12 20.5s7.5-4.6 9.8-9.4C23.2 7.6 21.3 4 17.8 4c-2 0-3.5 1.2-4.3 2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 12h2.5l1.5-3 2 5 1.5-2.5H14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function QuoteIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9.5 6C6.5 7.2 5 9.5 5 12.4c0 2.3 1.4 3.9 3.4 3.9 1.7 0 2.9-1.2 2.9-2.8 0-1.5-1-2.6-2.4-2.6-.2 0-.4 0-.6.1.3-1.6 1.5-2.9 3.1-3.5L9.5 6zm8.6 0c-3 1.2-4.5 3.5-4.5 6.4 0 2.3 1.4 3.9 3.4 3.9 1.7 0 2.9-1.2 2.9-2.8 0-1.5-1-2.6-2.4-2.6-.2 0-.4 0-.6.1.3-1.6 1.5-2.9 3.1-3.5L18.1 6z" />
    </svg>
  );
}

export function HelpCircleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.5 2.5 0 014.9.7c0 1.7-2.4 2-2.4 3.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SendIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M21 3L10.5 13.5M21 3l-6.5 18-4-8-8-4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BuildingIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 7.5h1M14 7.5h1M9 11.5h1M14 11.5h1M9 15.5h1M14 15.5h1" strokeLinecap="round" />
      <path d="M10 21v-3.5h4V21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LayoutIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9.5h18M9.5 9.5V21" strokeLinecap="round" />
    </svg>
  );
}

export function LinkIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path
        d="M9.5 14.5l5-5M8 10.5L6.5 12a3.5 3.5 0 004.95 4.95L13 15.4M16 13.5l1.5-1.5a3.5 3.5 0 00-4.95-4.95L11 8.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SmileIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14c.8 1 2 1.6 3.5 1.6s2.7-.6 3.5-1.6" strokeLinecap="round" />
      <circle cx="9" cy="9.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BoldIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path
        d="M7 4h6.2a3.3 3.3 0 010 6.6H7V4zM7 10.6h7a3.4 3.4 0 010 6.8H7v-6.8z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ItalicIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M10 4h7M7 20h7M14 4L10 20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UnderlineIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M6 4v7a6 6 0 0012 0V4M4 20h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StrikethroughIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path
        d="M5 12h14M7.5 7.2c0-1.8 1.9-3.2 4.5-3.2s4.5 1.1 4.5 3M8 16.8c0 1.8 1.9 3.2 4.5 3.2s4.5-1.4 4.5-3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CalendarIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" strokeLinecap="round" />
      <circle cx="8.3" cy="13.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="13.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MenuIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function DragHandleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  );
}

export function UsersIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
      <path d="M15.5 5.2c1.5.4 2.5 1.7 2.5 3.3 0 1.5-1 2.9-2.5 3.3M17.5 14.3c2.6.6 4.5 2.9 4.5 5.7" strokeLinecap="round" />
    </svg>
  );
}

export function DownloadIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" />
    </svg>
  );
}

export function CartIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M3 4h2l1.6 10.2a2 2 0 002 1.8h8.6a2 2 0 002-1.8L20.5 7H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
    </svg>
  );
}

export function ShieldCheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3l7 3v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}

export function CheckCircleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12l2.3 2.3L15.5 9.5" />
    </svg>
  );
}

export function CardIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="6" width="18" height="13" rx="1.5" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function BoltIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M13 3L5 13.5h5.5L11 21l8-10.5h-5.5L13 3z" />
    </svg>
  );
}

export function ClipboardIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M8 9h8M8 13h8M8 17h4" />
    </svg>
  );
}

export function LightbulbIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="10" r="5.5" />
      <path d="M9.5 20h5M10.5 22h3" />
    </svg>
  );
}

export function UrgentBoltIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3v5M12 3l6 8h-5l6 10-11-9h5L12 3z" />
    </svg>
  );
}

export function UndoIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7 8H4V5" />
      <path d="M4.5 15.5A8 8 0 1012 4a8 8 0 00-7.5 5" />
    </svg>
  );
}

export function RedoIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M17 8h3V5" />
      <path d="M19.5 15.5A8 8 0 1012 4a8 8 0 017.5 5" />
    </svg>
  );
}

export function RefreshIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 11A8 8 0 006.3 6.3L4 8.6" />
      <path d="M4 4v4.6h4.6" />
      <path d="M4 13a8 8 0 0013.7 4.7l2.3-2.3" />
      <path d="M20 20v-4.6h-4.6" />
    </svg>
  );
}
