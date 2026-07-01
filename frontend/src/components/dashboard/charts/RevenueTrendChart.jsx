import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow p-2 text-sm">
      <p className="text-gray-600 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {'₹' + Number(entry.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

export function RevenueTrendChart({ data = [], granularity = 'daily', loading, empty, isMobile }) {
  if (loading) return <ChartSkeleton />;
  if (empty || !data.length) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => '₹' + Number(v).toLocaleString('en-IN')} />
        <Tooltip content={<CustomTooltip />} />
        {!isMobile && <Legend />}
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#2563EB"
          strokeWidth={2}
          dot={false}
          name="Revenue"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default RevenueTrendChart;
