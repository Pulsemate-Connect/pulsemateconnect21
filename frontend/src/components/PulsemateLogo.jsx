/**
 * PulsemateLogo — official app_ion logo + brand name
 *
 * Props:
 *   size        — 'sm' | 'md' | 'lg' | 'xl'
 *   theme       — 'dark' | 'light'
 *   showTagline — boolean
 */

// Use explicit pixel sizes to avoid Tailwind purge / non-standard class issues
const sizes = {
  sm: { imgPx: 28, name: 'text-sm',   sub: 'text-[10px]' },
  md: { imgPx: 36, name: 'text-base', sub: 'text-[11px]' },
  lg: { imgPx: 44, name: 'text-lg',   sub: 'text-xs'     },
  xl: { imgPx: 56, name: 'text-xl',   sub: 'text-sm'     },
};

const PulsemateLogo = ({ size = 'md', theme = 'dark', showTagline = false, className = '' }) => {
  const s = sizes[size] || sizes.md;
  const nameColor   = theme === 'dark' ? 'text-white'    : 'text-slate-900';
  const accentColor = theme === 'dark' ? 'text-blue-300' : 'text-blue-600';
  const subColor    = theme === 'dark' ? 'text-blue-300' : 'text-blue-500';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo image — fixed pixel size, no stretching */}
      <img
        src="/logo.png"
        alt="PulseMate"
        style={{ width: s.imgPx, height: s.imgPx, flexShrink: 0 }}
        className="rounded-lg object-cover"
        draggable={false}
      />

      {/* Brand name + optional tagline */}
      <div className="flex flex-col leading-none">
        <span className={`${s.name} font-extrabold tracking-tight ${nameColor}`}>
          PulseMate <span className={accentColor}>Connect</span>
        </span>
        {showTagline && (
          <span className={`${s.sub} font-medium mt-0.5 ${subColor}`}>
            Healthcare Platform
          </span>
        )}
      </div>
    </div>
  );
};

export default PulsemateLogo;
