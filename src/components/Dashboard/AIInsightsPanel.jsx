import React from 'react';
import { TrendingUp, FlaskConical } from 'lucide-react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/calculations';

export const AIInsightsPanel = () => {
  const { insights, filteredClaims } = useApp();

  // Filter insights to only show those with claims in current filter
  const relevantInsights = insights.filter(insight => {
    const filteredClaimIds = filteredClaims.map(c => c.id);
    return insight.claimIds.some(id => filteredClaimIds.includes(id));
  }).slice(0, 3);

  const getPriorityColor = (priority) => {
    return priority === 'high' ? 'bg-red-500' : 'bg-yellow-500';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-cyan-50 to-indigo-50 border-cyan-200">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
      </div>
      <p className="text-sm text-gray-700 mb-4 font-medium">
        {relevantInsights.length} patterns detected that could improve your approval rate
      </p>
      <div className="space-y-3 mb-4">
        {relevantInsights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 bg-white rounded-lg border border-cyan-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full mt-1.5 ${getPriorityColor(insight.priority)}`} />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">{insight.pattern}</h3>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  <span>{formatCurrency(insight.impact)} denied</span>
                  <span>•</span>
                  <span>{insight.claimIds.length} claims</span>
                  <span>•</span>
                  <span>{insight.providerIds.length} providers</span>
                </div>
                {insight.learningMarkersCount > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-cyan-700">
                    <FlaskConical className="w-3 h-3" />
                    <span className="font-medium">{insight.learningMarkersCount} tests completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button variant="primary" className="w-full">
        Review all insights
      </Button>
    </Card>
  );
};
