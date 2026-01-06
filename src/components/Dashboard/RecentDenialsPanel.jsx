import React from 'react';
import { Card } from '../shared/Card';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/formatting';
import { formatCurrency } from '../../utils/calculations';

export const RecentDenialsPanel = () => {
  const { recentDeniedClaims } = useApp();

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Denied Claims</h2>
      <div className="space-y-3">
        {recentDeniedClaims.map((claim) => (
          <div
            key={claim.id}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-gray-900">{claim.id}</span>
              <span className="font-semibold text-gray-900">{formatCurrency(claim.billedAmount)}</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{claim.patientName}</p>
            <p className="text-sm text-red-600 mb-1">{claim.denialReason}</p>
            <p className="text-xs text-gray-500">{formatDate(claim.dateOfService)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          View all claims →
        </a>
      </div>
    </Card>
  );
};
