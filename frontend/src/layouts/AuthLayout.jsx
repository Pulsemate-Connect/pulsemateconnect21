import PulsemateLogo from '../components/PulsemateLogo';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-primary-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white -translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <PulsemateLogo size="lg" theme="dark" showTagline={true} />
        </div>

        {/* Main copy */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Healthcare that<br />works around you.
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed mb-10">
            Book appointments, track your queue in real time, and manage your health — all in one place.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              { icon: '⏱', text: 'Live queue tracking — know your exact wait time' },
              { icon: '📋', text: 'Digital prescriptions stored securely' },
              { icon: '🔄', text: 'Smart follow-up priority system' },
            ].map((f) => (
              <div key={f.text} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">
                  {f.icon}
                </div>
                <p className="text-primary-100 text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-primary-300 text-xs">© {new Date().getFullYear()} PulseMate Health Technologies</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center mb-10">
          <PulsemateLogo size="md" theme="light" showTagline={true} />
        </div>

        <div className="w-full max-w-sm mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
