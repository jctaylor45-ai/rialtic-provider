import React from 'react';
import { Card } from '../shared/Card';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/calculations';

export const TopPoliciesPanel = () => {
  const { topDenialPolicies, setSelectedPolicy, policies } = useApp();

  const getCategoryColor = (category) => {
    const colors = {
      'E&M': 'bg-blue-100 text-blue-700',
      'Surgery': 'bg-purple-100 text-purple-700',
      'Laboratory': 'bg-green-100 text-green-700',
      'Cardiology': 'bg-red-100 text-red-700',
      'DME': 'bg-yellow-100 text-yellow-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const handlePolicyClick = (policyId) => {
    const policy = policies.find(p => p.id === policyId);
    setSelectedPolicy(policy);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Denial Policies</h2>
      <div className="space-y-3">
        {topDenialPolicies.map((item) => (
          <div
            key={item.policyId}
            onClick={() => handlePolicyClick(item.policyId)}
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900 flex-1 mr-2">{item.name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(item.category)}`}>
                {item.category}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{item.count} claims</span>
              <span className="font-semibold text-gray-900">{formatCurrency(item.impact)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
