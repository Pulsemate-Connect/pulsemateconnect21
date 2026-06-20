/**
 * PulsemateLogo — reusable logo component using logo.png
 *
 * Props:
 *   size        — 'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 *   theme       — 'dark' | 'light'            (default: 'dark')  [kept for compat, not used visually]
 *   showTagline — boolean                     (default: false)
 */

const sizes = {
  sm: { img: 'h-7',  sub: 'text-[10px]', mt: 'mt-0.5' },
  md: { img: 'h-9',  sub: 'text-[11px]', mt: 'mt-1'   },
  lg: { img: 'h-12', sub: 'text-sm',     mt: 'mt-1'   },
  xl: { img: 'h-16', sub: 'text-base',   mt: 'mt-1.5' },
};

const PulsemateLogo = ({ size = 'md', theme = 'dark', showTagline = false, className = '' }) => {
  const s = sizes[size] || sizes.md;
  const subTextColor = theme === 'dark' ? 'text-blue-300' : 'text-blue-600';

  return (
    <div className={`flex flex-col items-start ${className}`}>
      <img
        src="/logo11.png"
        alt="PulseMate"
        className={`${s.img} w-auto object-contain`}
        draggable={false}
      />
      {showTagline && (
        <p className={`${s.sub} ${s.mt} font-medium leading-none ${subTextColor}`}>
          Healthcare Platform
        </p>
      )}
    </div>
  );
};

export default PulsemateLogo;
