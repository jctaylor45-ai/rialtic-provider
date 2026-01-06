import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../shared/Card';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/calculations';

export const DenialReasonsChart = () => {
  const { chartData } = useApp();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{payload[0].payload.reason}</p>
          <p className="text-sm text-indigo-600">Impact: {formatCurrency(payload[0].value)}</p>
          <p className="text-sm text-cyan-600">Claims: {payload[1].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Top Denial Reasons</h2>
        <p className="text-sm text-gray-500">By financial impact and claim count</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData.denialReasons}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="reason"
            tick={{ fontSize: 11, angle: -45, textAnchor: 'end' }}
            height={100}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            tickLine={false}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="rect"
          />
          <Bar
            yAxisId="left"
            dataKey="active"
            fill="#818CF8"
            name="Dollar Impact"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="count"
            fill="#4DD0E1"
            name="Claim Count"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          View more →
        </a>
      </div>
    </Card>
  );
};
