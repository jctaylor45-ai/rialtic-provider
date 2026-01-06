import React from 'react';
import { X, FlaskConical } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../shared/Button';
import { formatCurrency } from '../../utils/calculations';

export const DetailPanel = () => {
  const { selectedPolicy, setSelectedPolicy, topDenialPolicies } = useApp();

  if (!selectedPolicy) return null;

  const policyData = topDenialPolicies.find(p => p.policyId === selectedPolicy.id);

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

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-20 transition-opacity"
        onClick={() => setSelectedPolicy(null)}
      />
      <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-2xl z-30 overflow-y-auto animate-slide-in">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-gray-900 pr-8">
              {selectedPolicy.name}
            </h2>
            <button
              onClick={() => setSelectedPolicy(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Category</label>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${getCategoryColor(selectedPolicy.topic)}`}>
                {selectedPolicy.topic}
              </span>
            </div>

            {policyData && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Financial Impact</label>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(policyData.impact)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Claims Affected</label>
                  <p className="text-xl font-semibold text-gray-900">{policyData.count} claims</p>
                </div>
              </>
            )}

            <div className="border-t border-gray-200 pt-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">Common Issue</label>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">{selectedPolicy.commonMistake}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">How to Fix</label>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-700">{selectedPolicy.fixGuidance}</p>
              </div>
            </div>

            {selectedPolicy.referenceDocs && selectedPolicy.referenceDocs.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Reference Documents</label>
                <div className="space-y-2">
                  {selectedPolicy.referenceDocs.map((doc, idx) => (
                    <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-500">{doc.source}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <FlaskConical className="w-4 h-4" />
              Test in Claim Lab
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
