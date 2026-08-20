import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
      <p className="font-medium mb-1 text-gray-700">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name === 'revenue'
            ? '₹' + Number(entry.value).toLocaleString('en-IN')
            : `${entry.value} appointments`}
        </p>
      ))}
    </div>
  );
};

export function DoctorPerformanceBar({ data = [], loading, empty, isMobile }) {
  if (loading) return <ChartSkeleton />;
  if (empty || !data.length) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="doctor" tick={{ fontSize: 11 }} />
        {/* Left Y axis for appointments */}
        <YAxis yAxisId="left" orientation="left" allowDecimals={false} tick={{ fontSize: 11 }} />
        {/* Right Y axis for revenue */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => '₹' + Number(v).toLocaleString('en-IN')}
        />
        <Tooltip content={<CustomTooltip />} />
        {!isMobile && <Legend />}
        <Bar yAxisId="left" dataKey="appointments" fill="#2563EB" name="appointments" radius={[3, 3, 0, 0]} />
        <Bar yAxisId="right" dataKey="revenue" fill="#7c3aed" name="revenue" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default DoctorPerformanceBar;
