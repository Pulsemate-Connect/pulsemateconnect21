/**
 * PulsemateLogo — reusable logo component
 *
 * Props:
 *   size   — 'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 *   theme  — 'dark' | 'light'            (default: 'dark')
 *   showTagline — boolean                (default: false)
 */

const sizes = {
  sm: { icon: 'w-7 h-7', text: 'text-base',  sub: 'text-[10px]', gap: 'gap-2' },
  md: { icon: 'w-9 h-9', text: 'text-lg',   sub: 'text-[11px]', gap: 'gap-2.5' },
  lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-sm',     gap: 'gap-3' },
  xl: { icon: 'w-16 h-16', text: 'text-3xl', sub: 'text-base',   gap: 'gap-4' },
};

const PulsemateLogo = ({ size = 'md', theme = 'dark', showTagline = false, className = '' }) => {
  const s = sizes[size] || sizes.md;
  const isDark = theme === 'dark';
  const textColor     = isDark ? 'text-white'     : 'text-slate-900';
  const subTextColor  = isDark ? 'text-blue-300'  : 'text-blue-600';

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {/* Icon mark */}
      <div className={`${s.icon} flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30`}>
        <svg viewBox="0 0 32 32" fill="none" className="w-[60%] h-[60%]">
          {/* Heartbeat pulse */}
          <path
            d="M3 16h5l3-7 5 14 3-7h10"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className={`font-extrabold leading-none tracking-tight ${s.text} ${textColor}`}>
          Pulse<span className="text-blue-400">Mate</span>
        </p>
        {showTagline && (
          <p className={`leading-none mt-0.5 font-medium ${s.sub} ${subTextColor}`}>
            Healthcare Platform
          </p>
        )}
      </div>
    </div>
  );
};

export default PulsemateLogo;
