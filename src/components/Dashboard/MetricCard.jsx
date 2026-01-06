import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../shared/Card';
import { formatNumber, formatCurrency } from '../../utils/calculations';

export const MetricCard = ({
  icon: Icon,
  title,
  value,
  subValue,
  trend,
  format = 'number',
  highlighted = false,
  badge = null
}) => {
  const isPositiveTrend = trend && parseFloat(trend) > 0;
  const isNegativeTrend = trend && parseFloat(trend) < 0;

  const formattedValue = format === 'currency'
    ? formatCurrency(value)
    : format === 'percentage'
    ? `${value}%`
    : formatNumber(value);

  return (
    <Card
      className={`p-6 ${highlighted ? 'border-cyan-400 ring-2 ring-cyan-100' : ''}`}
      hover
    >
      <div className="flex justify-between items-start mb-4">
        <Icon className="w-5 h-5 text-gray-400" />
        {badge && (
          <span className="px-2 py-1 text-xs font-medium bg-cyan-100 text-cyan-700 rounded">
            {badge}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-semibold text-gray-900">{formattedValue}</h3>
          {trend && (
            <span
              className={`flex items-center gap-1 text-sm font-medium ${
                isPositiveTrend
                  ? 'text-green-600'
                  : isNegativeTrend
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {isPositiveTrend ? (
                <TrendingUp className="w-4 h-4" />
              ) : isNegativeTrend ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              {trend}%
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{subValue}</p>
        <div className="pt-3 border-t border-gray-200 mt-3">
          <p className="text-sm font-medium text-gray-700">{title}</p>
        </div>
      </div>
    </Card>
  );
};
