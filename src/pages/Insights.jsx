import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  DollarSign, FileText, Users, Award, TrendingDown, TrendingUp,
  CheckCircle, XCircle, ChevronRight, X, Clock
} from 'lucide-react';
import { formatCurrency } from '../utils/formatting';

export function Insights() {
  const { insights, learningMarkers } = useApp();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    status: 'all'
  });
  const [selectedInsight, setSelectedInsight] = useState(null);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalImpact = insights.reduce((sum, i) => sum + i.impact, 0);
    const totalClaims = insights.reduce((sum, i) => sum + (i.claimIds?.length || 0), 0);
    const totalProviders = new Set(insights.flatMap(i => i.providerIds || [])).size;

    return {
      totalImpact,
      totalClaims,
      totalProviders
    };
  }, [insights]);

  // Filter insights
  const filteredInsights = useMemo(() => {
    let filtered = [...insights];

    if (filters.category !== 'all') {
      filtered = filtered.filter(i => i.category === filters.category);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(i => i.priority === filters.priority);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(i => i.status === filters.status);
    }

    // Sort by impact (high to low)
    return filtered.sort((a, b) => b.impact - a.impact);
  }, [insights, filters]);

  const getPolicyName = (policyId) => {
    // This would normally fetch from policies array
    return policyId;
  };

  const PriorityBadge = ({ priority }) => {
    const styles = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-700'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </span>
    );
  };

  const CategoryBadge = ({ category }) => {
    const styles = {
      'Coding': 'bg-indigo-100 text-indigo-700',
      'Practice Pattern': 'bg-cyan-100 text-cyan-700',
      'Documentation': 'bg-purple-100 text-purple-700'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[category] || 'bg-gray-100 text-gray-700'}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-hidden">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white p-8">
        <h1 className="text-3xl font-semibold mb-4">
          {insights.length} patterns detected that could improve your approval rate
        </h1>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm opacity-80">Potential Savings</div>
            <div className="text-2xl font-semibold">{formatCurrency(summaryMetrics.totalImpact)}</div>
          </div>
          <div>
            <div className="text-sm opacity-80">Affected Claims</div>
            <div className="text-2xl font-semibold">{summaryMetrics.totalClaims}</div>
          </div>
          <div>
            <div className="text-sm opacity-80">Providers Affected</div>
            <div className="text-2xl font-semibold">{summaryMetrics.totalProviders}</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="Coding">Coding</option>
            <option value="Practice Pattern">Practice Pattern</option>
            <option value="Documentation">Documentation</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Pattern Cards */}
      <div className={`p-8 overflow-auto ${selectedInsight ? 'mr-[480px]' : ''}`} style={{ height: 'calc(100vh - 340px)' }}>
        <div className="space-y-4">
          {filteredInsights.map((insight) => {
            const learningProgress = insight.providerIds?.length > 0
              ? Math.round((insight.learningMarkersCount / insight.providerIds.length) * 100)
              : 0;

            return (
              <div
                key={insight.id}
                onClick={() => setSelectedInsight(insight)}
                className={`bg-white border rounded-lg p-6 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer ${
                  selectedInsight?.id === insight.id ? 'border-indigo-300 shadow-md' : 'border-gray-200'
                }`}
              >
                {/* Priority Indicator & Title */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${
                    insight.priority === 'high' ? 'bg-red-500' :
                    insight.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}></div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {insight.pattern}
                    </h3>

                    <p className="text-sm text-gray-600 mb-3">
                      {insight.description}
                    </p>

                    {/* Impact Metrics */}
                    <div className="flex items-center gap-6 mb-3 text-sm text-gray-700">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">{formatCurrency(insight.impact)}</span>
                        <span>denied</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{insight.claimIds?.length || 0} claims</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{insight.providerIds?.length || 0} providers</span>
                      </div>
                    </div>

                    {/* Learning Status */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-cyan-600" />
                        <span className="text-cyan-600 font-medium">
                          {insight.learningMarkersCount || 0} tests completed
                        </span>
                      </div>

                      {/* Trend */}
                      <div className="flex items-center gap-1 text-sm">
                        {insight.trend === 'improving' ? (
                          <>
                            <TrendingDown className="w-4 h-4 text-green-500" />
                            <span className="text-green-600">Improving</span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4 text-red-500" />
                            <span className="text-red-600">Getting worse</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Learning Progress</span>
                        <span>{learningProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-cyan-600 rounded-full h-2"
                          style={{ width: `${learningProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Example Claims Link */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (insight.claimIds?.length > 0) {
                          navigate(`/claims/${insight.claimIds[0]}`);
                        }
                      }}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      See {Math.min(3, insight.claimIds?.length || 0)} example claims →
                    </button>
                  </div>

                  {/* Category Badge */}
                  <CategoryBadge category={insight.category} />
                </div>

                {/* Review Button */}
                <div className="flex justify-end">
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Review Pattern
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight Detail Panel */}
      {selectedInsight && (
        <div className="fixed right-0 top-16 bottom-0 w-[480px] bg-white shadow-xl border-l border-gray-200 z-40 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-900 flex-1 pr-4">
                {selectedInsight.pattern}
              </h2>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={selectedInsight.priority} />
              <CategoryBadge category={selectedInsight.category} />
              <span className="text-xs text-gray-500">
                Detected {selectedInsight.detectedDate || 'recently'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Problem Explanation */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Problem</h3>
              <p className="text-sm text-gray-700">
                {selectedInsight.guidance?.problem || selectedInsight.description}
              </p>
            </div>

            {/* Visual Examples */}
            {selectedInsight.guidance?.examples && selectedInsight.guidance.examples.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Before/After Example</h3>
                <div className="space-y-2">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-red-900 mb-1">
                      <XCircle className="w-4 h-4" />
                      <span className="font-semibold">Wrong</span>
                    </div>
                    <code className="text-sm text-gray-700">{selectedInsight.guidance.examples[0].wrong}</code>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-green-900 mb-1">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-semibold">Right</span>
                    </div>
                    <code className="text-sm text-gray-700">{selectedInsight.guidance.examples[0].right}</code>
                  </div>
                </div>
              </div>
            )}

            {/* Affected Claims */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Affected Claims</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedInsight.claimIds?.slice(0, 5).map((claimId) => (
                  <button
                    key={claimId}
                    onClick={() => navigate(`/claims/${claimId}`)}
                    className="w-full text-left p-2 border border-gray-200 rounded hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                  >
                    <div className="text-xs text-gray-500 font-mono">{claimId}</div>
                  </button>
                ))}
              </div>
              {selectedInsight.claimIds?.length > 5 && (
                <button
                  onClick={() => navigate('/claims')}
                  className="w-full mt-2 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                >
                  View all {selectedInsight.claimIds.length} claims →
                </button>
              )}
            </div>

            {/* Related Policies */}
            {selectedInsight.policyIds && selectedInsight.policyIds.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Related Policies</h3>
                <div className="space-y-2">
                  {selectedInsight.policyIds.map((policyId) => (
                    <button
                      key={policyId}
                      onClick={() => navigate(`/policies?selected=${policyId}`)}
                      className="w-full text-left p-2 border border-gray-200 rounded hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-between transition-all"
                    >
                      <span className="text-sm text-gray-900">{getPolicyName(policyId)}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Impact */}
            <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 border border-cyan-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6 text-indigo-600" />
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {selectedInsight.learningMarkersCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Providers tested corrections</div>
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div className="text-xs text-gray-600 space-y-1">
                <div>Recent testing activity...</div>
              </div>
            </div>

            {/* Guidance */}
            {selectedInsight.guidance?.solution && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">How to Fix</h3>
                <p className="text-sm text-gray-700">{selectedInsight.guidance.solution}</p>
              </div>
            )}

            {/* CTAs */}
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/claim-lab?insight=${selectedInsight.id}`)}
                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Test a Correction in Claim Lab
              </button>
              <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Mark as Acknowledged
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
