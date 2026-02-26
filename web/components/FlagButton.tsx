export function FlagButton({
  lang,
  active,
  onClick
}: {
  lang: 'pt' | 'en'
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-6 h-6 rounded-full overflow-hidden transition-all duration-200 ${
        active
          ? 'ring-1 ring-blue-500 ring-offset-1 ring-offset-zinc-950 scale-105'
          : 'opacity-40 hover:opacity-70 grayscale hover:grayscale-0'
      }`}
      title={lang === 'pt' ? 'Português do Brasil' : 'English'}
    >
      {lang === 'pt' ? (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" fill="#009739" />
          <polygon points="16,4 30,16 16,28 2,16" fill="#FEDD00" />
          <circle cx="16" cy="16" r="6" fill="#012169" />
          <rect x="10" y="14.5" width="12" height="3" fill="#fff" rx="1.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" fill="#B22234" />
          {[2.5, 7.5, 12.5, 17.5, 22.5, 27.5].map((y) => (
            <rect key={y} y={y} width="32" height="2.5" fill="#fff" />
          ))}
          <rect width="14" height="17" fill="#3C3B6E" />
          {[4, 8, 12].map((y) => (
            <g key={y}>
              {[3, 7, 11].map((x) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="0.8" fill="#fff" />
              ))}
            </g>
          ))}
        </svg>
      )}
    </button>
  );
}
