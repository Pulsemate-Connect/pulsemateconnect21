import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
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
      <p style={{ color: '#2563EB' }}>{payload[0].value} appointments</p>
    </div>
  );
};

export function PeakHoursHeatmap({ data = [], loading, empty, isMobile }) {
  if (loading) return <ChartSkeleton />;
  if (empty || !data.length) return <EmptyState />;

  const maxCount = useMemo(
    () => Math.max(...data.map((d) => d.count), 1),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        {!isMobile && <Legend />}
        <Bar dataKey="count" name="Appointments" radius={[3, 3, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={`rgba(37,99,235,${(0.2 + 0.8 * (entry.count / maxCount)).toFixed(3)})`}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default PeakHoursHeatmap;
