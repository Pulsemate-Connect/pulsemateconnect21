/**
 * PulsemateLogo — uses the official app_ion logo image
 *
 * Props:
 *   size        — 'sm' | 'md' | 'lg' | 'xl'
 *   theme       — 'dark' | 'light'
 *   showTagline — boolean
 */

const sizes = {
  sm: { img: 'h-8 w-8',   name: 'text-base',   sub: 'text-[10px]' },
  md: { img: 'h-10 w-10', name: 'text-lg',     sub: 'text-[11px]' },
  lg: { img: 'h-13 w-13', name: 'text-xl',     sub: 'text-sm'     },
  xl: { img: 'h-16 w-16', name: 'text-2xl',    sub: 'text-base'   },
};

const PulsemateLogo = ({ size = 'md', theme = 'dark', showTagline = false, className = '' }) => {
  const s = sizes[size] || sizes.md;
  const nameColor  = theme === 'dark' ? 'text-white'      : 'text-slate-900';
  const accentColor= theme === 'dark' ? 'text-blue-300'   : 'text-blue-600';
  const subColor   = theme === 'dark' ? 'text-blue-300'   : 'text-blue-500';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo image */}
      <img
        src="/logo.png"
        alt="PulseMate Connect"
        className={`${s.img} rounded-xl object-cover flex-shrink-0 shadow-sm`}
        draggable={false}
      />

      {/* Name + tagline */}
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
