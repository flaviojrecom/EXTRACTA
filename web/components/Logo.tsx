export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="2" width="11" height="15" rx="1.5" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.2" />
            <line x1="6" y1="6" x2="11" y2="6" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="6" y1="9" x2="11" y2="9" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="6" y1="12" x2="9" y2="12" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M14 9l4 0M18 9l-2-2.5M18 9l-2 2.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="18" cy="18" r="1.2" fill="#34d399" />
            <circle cx="21" cy="15" r="1.2" fill="#34d399" />
            <circle cx="21" cy="21" r="1.2" fill="#34d399" />
          </svg>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-extrabold tracking-tight text-white leading-none">
          EXTRACTA
        </span>
        <span className="text-[10px] text-zinc-500 tracking-[0.25em] uppercase mt-0.5 font-medium">
          knowledge engine
        </span>
      </div>
    </div>
  );
}
