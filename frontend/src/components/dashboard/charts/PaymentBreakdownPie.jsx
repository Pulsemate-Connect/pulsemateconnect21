import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

const ChartSkeleton = () => (
  <div className="animate-pulse bg-gray-100 rounded-xl h-64 w-full" />
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
    <span className="text-4xl mb-2">📊</span>
    <p className="text-sm">No data available</p>
  </div>
);

const COLORS = {
  Cash: '#22c55e',
  Online: '#2563EB',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow p-2 text-sm">
      <p className="font-medium">{name}</p>
      <p style={{ color: COLORS[name] }}>{'₹' + Number(value).toLocaleString('en-IN')}</p>
    </div>
  );
};

export function PaymentBreakdownPie({ cash = 0, online = 0, loading, empty, isMobile }) {
  if (loading) return <ChartSkeleton />;

  const data = [
    { name: 'Cash', value: cash },
    { name: 'Online', value: online },
  ];

  const hasData = data.some((d) => d.value > 0);
  if (empty || !hasData) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {!isMobile && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
}

export default PaymentBreakdownPie;
