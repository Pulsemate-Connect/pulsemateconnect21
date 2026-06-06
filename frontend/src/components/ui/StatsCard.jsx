const StatsCard = ({ title, value, icon, color = 'blue', trend }) => {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100'   },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100'  },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-100'    },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    gray:   { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200'   },
  };

  const colorScheme = colors[color] || colors.blue;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorScheme.bg}`}>
          <span className={`text-2xl ${colorScheme.text}`}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
