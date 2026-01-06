import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../shared/Card';
import { useApp } from '../../context/AppContext';

export const ClaimsTrendChart = () => {
  const { chartData } = useApp();

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Claims Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData.claimsTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="submitted"
            stroke="#818CF8"
            strokeWidth={2}
            dot={{ r: 4, fill: '#818CF8' }}
            name="Submitted"
          />
          <Line
            type="monotone"
            dataKey="approved"
            stroke="#4ADE80"
            strokeWidth={2}
            dot={{ r: 4, fill: '#4ADE80' }}
            name="Approved"
          />
          <Line
            type="monotone"
            dataKey="denied"
            stroke="#F87171"
            strokeWidth={2}
            dot={{ r: 4, fill: '#F87171' }}
            name="Denied"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
