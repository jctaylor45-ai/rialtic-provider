import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, TrendingUp, Target, Users, BookOpen, Trophy } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';

export function Impact() {
  const { learningMarkers, providers, insights } = useApp();

  const [timeRange, setTimeRange] = useState('90');
  const [selectedProvider, setSelectedProvider] = useState('all');

  // Calculate aggregate impact metrics
  const impactMetrics = useMemo(() => {
    const testsCompleted = learningMarkers.length;
    const providersParticipating = new Set(learningMarkers.map(m => m.providerId)).size;

    // Estimate prevented denials (simple calculation)
    const preventedDenials = learningMarkers.filter(m =>
      m.simulationResult?.outcome === 'approved'
    ).length;

    // Estimate revenue recovered (sum of successful tests)
    const revenueRecovered = learningMarkers
      .filter(m => m.simulationResult?.outcome === 'approved')
      .reduce((sum, m) => sum + (m.simulationResult?.estimatedPayment || 0), 0);

    // Calculate average test score
    const avgTestScore = learningMarkers.length > 0
      ? learningMarkers.reduce((sum, m) => {
          const passed = m.simulationResult?.editsPassed || 0;
          const failed = m.simulationResult?.editsFailed || 0;
          const total = passed + failed;
          return sum + (total > 0 ? (passed / total) * 100 : 0);
        }, 0) / learningMarkers.length
      : 0;

    return {
      testsCompleted,
      providersParticipating,
      preventedDenials,
      revenueRecovered,
      avgTestScore
    };
  }, [learningMarkers]);

  // Generate time-series data (by week)
  const timeSeriesData = useMemo(() => {
    const weeks = [];
    const now = new Date();
    const daysToShow = parseInt(timeRange);

    // Create weekly buckets
    for (let i = daysToShow; i >= 0; i -= 7) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const testsThisWeek = learningMarkers.filter(m => {
        const testDate = new Date(m.testDate);
        return testDate >= weekStart && testDate <= weekEnd;
      });

      const successfulTests = testsThisWeek.filter(m =>
        m.simulationResult?.outcome === 'approved'
      ).length;

      weeks.push({
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tests: testsThisWeek.length,
        successful: successfulTests,
        successRate: testsThisWeek.length > 0 ? (successfulTests / testsThisWeek.length) * 100 : 0
      });
    }

    return weeks;
  }, [learningMarkers, timeRange]);

  // Provider leaderboard
  const providerLeaderboard = useMemo(() => {
    const providerStats = {};

    learningMarkers.forEach(marker => {
      const pid = marker.providerId;
      if (!providerStats[pid]) {
        providerStats[pid] = {
          providerId: pid,
          providerName: providers.find(p => p.id === pid)?.name || `Provider ${pid}`,
          testsCompleted: 0,
          successfulTests: 0,
          revenueRecovered: 0,
          categoriesTested: new Set()
        };
      }

      providerStats[pid].testsCompleted++;
      if (marker.simulationResult?.outcome === 'approved') {
        providerStats[pid].successfulTests++;
        providerStats[pid].revenueRecovered += marker.simulationResult?.estimatedPayment || 0;
      }
      if (marker.category) {
        providerStats[pid].categoriesTested.add(marker.category);
      }
    });

    return Object.values(providerStats)
      .map(p => ({
        ...p,
        successRate: p.testsCompleted > 0 ? (p.successfulTests / p.testsCompleted) * 100 : 0,
        categoriesCount: p.categoriesTested.size
      }))
      .sort((a, b) => b.testsCompleted - a.testsCompleted);
  }, [learningMarkers, providers]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categories = {};

    learningMarkers.forEach(marker => {
      const cat = marker.category || 'Other';
      if (!categories[cat]) {
        categories[cat] = { name: cat, count: 0, successful: 0 };
      }
      categories[cat].count++;
      if (marker.simulationResult?.outcome === 'approved') {
        categories[cat].successful++;
      }
    });

    return Object.values(categories)
      .map(c => ({
        ...c,
        successRate: c.count > 0 ? Math.round((c.successful / c.count) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [learningMarkers]);

  return (
    <div className="flex-1 overflow-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Learning Impact Dashboard</h1>
        <p className="text-gray-600">Track how testing in the Claim Lab is improving your practice</p>
      </div>

      {/* Time Range Filter */}
      <div className="mb-6">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="180">Last 6 Months</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      {/* Impact Scorecard */}
      <div className="grid grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-sm text-gray-600">Tests Completed</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">
            {impactMetrics.testsCompleted}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-sm text-gray-600">Prevented Denials</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">
            {impactMetrics.preventedDenials}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="text-sm text-gray-600">Revenue Recovered</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">
            {formatCurrency(impactMetrics.revenueRecovered)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm text-gray-600">Providers Active</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">
            {impactMetrics.providersParticipating}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-sm text-gray-600">Avg Test Score</div>
          </div>
          <div className="text-3xl font-semibold text-gray-900">
            {Math.round(impactMetrics.avgTestScore)}%
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Testing Activity Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" stroke="#999" fontSize={12} />
            <YAxis stroke="#999" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
            />
            <Line
              type="monotone"
              dataKey="tests"
              stroke="#818CF8"
              strokeWidth={2}
              dot={{ fill: '#818CF8', r: 4 }}
              name="Tests Completed"
            />
            <Line
              type="monotone"
              dataKey="successful"
              stroke="#4ADE80"
              strokeWidth={2}
              dot={{ fill: '#4ADE80', r: 4 }}
              name="Successful Tests"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Provider Leaderboard */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Provider Leaderboard</h2>
          <div className="space-y-3">
            {providerLeaderboard.slice(0, 10).map((provider, idx) => (
              <div key={provider.providerId} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                  idx === 1 ? 'bg-gray-100 text-gray-700' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </div>

                {/* Provider Info */}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{provider.providerName}</div>
                  <div className="text-xs text-gray-600">
                    {provider.testsCompleted} tests • {Math.round(provider.successRate)}% success rate
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(provider.revenueRecovered)}
                  </div>
                  <div className="text-xs text-gray-500">recovered</div>
                </div>
              </div>
            ))}
            {providerLeaderboard.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No testing activity yet. Start testing in the Claim Lab to see your progress!
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Category Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#999" fontSize={11} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#999" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#818CF8" name="Total Tests" />
              <Bar dataKey="successful" fill="#4ADE80" name="Successful" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Testing Activity</h2>
        <div className="space-y-3">
          {learningMarkers
            .sort((a, b) => new Date(b.testDate) - new Date(a.testDate))
            .slice(0, 10)
            .map((marker, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  marker.simulationResult?.outcome === 'approved'
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}>
                  {marker.simulationResult?.outcome === 'approved' ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {marker.category || 'General Test'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {marker.claimId} • {new Date(marker.testDate).toLocaleDateString()}
                  </div>
                  {marker.notes && (
                    <div className="text-xs text-gray-500 mt-1 italic">"{marker.notes}"</div>
                  )}
                </div>

                {/* Result */}
                {marker.simulationResult && (
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      marker.simulationResult.outcome === 'approved'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {marker.simulationResult.outcome === 'approved' ? 'Would Approve' : 'Still Denied'}
                    </div>
                    {marker.simulationResult.estimatedPayment > 0 && (
                      <div className="text-xs text-gray-600">
                        {formatCurrency(marker.simulationResult.estimatedPayment)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          {learningMarkers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No tests completed yet</p>
              <p className="text-xs mt-2">
                Go to the Claim Lab to start testing claim corrections and track your learning progress
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
