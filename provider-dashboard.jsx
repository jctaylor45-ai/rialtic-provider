import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, Clock, DollarSign, Award } from 'lucide-react';

export default function ProviderDashboard() {
  const [timeRange, setTimeRange] = useState('90');
  const [viewMode, setViewMode] = useState('practice');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [showDetailPanel, setShowDetailPanel] = useState(null);

  // Mock data
  const providers = [
    { id: 'all', name: 'All Providers' },
    { id: 'dr-smith', name: 'Dr. Sarah Smith' },
    { id: 'dr-johnson', name: 'Dr. Michael Johnson' },
    { id: 'dr-patel', name: 'Dr. Priya Patel' },
  ];

  const metrics = [
    {
      label: 'Claims Submitted',
      value: '1,247',
      subValue: 'This period',
      trend: '+12.3%',
      isPositive: true,
      icon: <BarChart className="w-5 h-5" />
    },
    {
      label: 'Approval Rate',
      value: '87.4%',
      subValue: 'Active',
      trend: '+3.2%',
      isPositive: true,
      icon: <CheckCircle className="w-5 h-5" />
    },
    {
      label: 'Denied Claims',
      value: '157',
      subValue: '12.6% of total',
      trend: '-2.1%',
      isPositive: true,
      icon: <XCircle className="w-5 h-5" />
    },
    {
      label: 'Denied Amount',
      value: '$42.3K',
      subValue: 'Potential revenue',
      trend: '-5.4%',
      isPositive: true,
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      label: 'Appeal Success',
      value: '68.2%',
      subValue: '43 overturned',
      trend: '+8.1%',
      isPositive: true,
      icon: <Award className="w-5 h-5" />
    },
    {
      label: 'Learning Impact',
      value: '23',
      subValue: 'Tests completed',
      trend: 'New metric',
      isPositive: true,
      icon: <TrendingUp className="w-5 h-5" />,
      highlight: true
    },
  ];

  const claimsTrendData = [
    { month: 'Jul', submitted: 412, approved: 362, denied: 50 },
    { month: 'Aug', submitted: 438, approved: 389, denied: 49 },
    { month: 'Sep', submitted: 401, approved: 356, denied: 45 },
    { month: 'Oct', submitted: 425, approved: 368, denied: 57 },
    { month: 'Nov', submitted: 447, approved: 395, denied: 52 },
    { month: 'Dec', submitted: 124, approved: 107, denied: 17 },
  ];

  const denialReasonsData = [
    { reason: 'Missing Modifier', active: 320000, observation: 28, count: 45 },
    { reason: 'Medical Necessity', active: 580000, observation: 18, count: 32 },
    { reason: 'Duplicate Service', active: 180000, observation: 12, count: 18 },
    { reason: 'Authorization', active: 420000, observation: 22, count: 28 },
    { reason: 'Non-Covered', active: 280000, observation: 15, count: 22 },
    { reason: 'Code Combination', active: 650000, observation: 31, count: 38 },
  ];

  const policyPerformanceData = [
    { policy: 'E&M Modifier 25', active: 450000, observation: 25, count: 23, denialRate: '45%', appealRate: '78%' },
    { policy: 'Duplicate Claims', active: 280000, observation: 15, count: 15, denialRate: '100%', appealRate: '12%' },
    { policy: 'Medical Necessity', active: 580000, observation: 28, count: 32, denialRate: '68%', appealRate: '65%' },
    { policy: 'Authorization Required', active: 320000, observation: 18, count: 20, denialRate: '52%', appealRate: '82%' },
  ];

  const topPolicies = [
    { id: 1, name: 'E&M with Modifier 25 Missing', impact: '$12.4K', claims: 23, category: 'Coding' },
    { id: 2, name: 'Duplicate Mental Health Services', impact: '$8.7K', claims: 15, category: 'Practice Pattern' },
    { id: 3, name: 'Medical Necessity - Documentation', impact: '$11.2K', claims: 32, category: 'Documentation' },
  ];

  const recentDenials = [
    { claimId: 'CLM-2024-1247', patient: 'John Doe', amount: '$425', reason: 'Missing Modifier 25', date: '12/15/2024' },
    { claimId: 'CLM-2024-1246', patient: 'Jane Smith', amount: '$680', reason: 'Medical Necessity', date: '12/14/2024' },
    { claimId: 'CLM-2024-1245', patient: 'Robert Johnson', amount: '$215', reason: 'Duplicate Service', date: '12/14/2024' },
  ];

  const insights = [
    { 
      id: 1, 
      pattern: 'E&M visits missing modifier 25', 
      impact: '$12.4K denied', 
      claims: 23, 
      providers: 2,
      status: '5 tests completed',
      priority: 'high'
    },
    { 
      id: 2, 
      pattern: 'Duplicate mental health visits same day', 
      impact: '$8.7K denied', 
      claims: 15, 
      providers: 1,
      status: '2 tests completed',
      priority: 'medium'
    },
    { 
      id: 3, 
      pattern: 'Medical necessity documentation gaps', 
      impact: '$11.2K denied', 
      claims: 32, 
      providers: 3,
      status: '1 test completed',
      priority: 'high'
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-indigo-600 to-indigo-700 text-white flex flex-col">
        <div className="p-6 border-b border-indigo-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-xl">R</span>
            </div>
            <span className="font-semibold text-lg">RIALTIC</span>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-indigo-500 rounded-lg px-3 py-2 mb-2">
            <span className="text-sm">Riverside Medical - Provider</span>
          </div>
        </div>

        <nav className="flex-1 px-3">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-500 mb-1">
            <BarChart className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-500 mb-1 transition-colors">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Policies</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-500 mb-1 transition-colors">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Claims</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-500 mb-1 transition-colors">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Insights</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-500 mb-1 transition-colors">
            <Award className="w-4 h-4" />
            <span className="text-sm font-medium">Claim Lab</span>
          </button>
        </nav>

        <div className="p-4 border-t border-indigo-500">
          <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors">
            <span className="text-sm">Product Guide ↗</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select 
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="practice">Practice View</option>
                <option value="provider">Individual Provider</option>
                <option value="comparison">Provider Comparison</option>
              </select>

              {viewMode === 'provider' && (
                <select 
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
                <span className="text-sm text-gray-600">Last</span>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="text-sm font-medium focus:outline-none"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              <input 
                type="date" 
                defaultValue="2024-01-01"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-gray-400">–</span>
              <input 
                type="date" 
                defaultValue="2024-12-18"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">09:38 PM UTC</span>
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                JT
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-normal text-gray-900">Good afternoon, Dr. Smith.</h1>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm">
                <span>📤</span>
                Export
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {metrics.map((metric, idx) => (
                <div 
                  key={idx} 
                  className={`bg-white rounded-lg shadow-sm p-6 border ${metric.highlight ? 'border-cyan-400 ring-2 ring-cyan-100' : 'border-gray-200'} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${metric.highlight ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-600'}`}>
                      {metric.icon}
                    </div>
                    {metric.highlight && (
                      <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full font-medium">
                        New
                      </span>
                    )}
                  </div>
                  <div className="mb-2">
                    <div className="text-3xl font-semibold text-gray-900 mb-1">{metric.value}</div>
                    <div className="text-sm text-gray-500">{metric.subValue}</div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {metric.trend}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-600">{metric.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Claims Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Claims Trend</h2>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                    <span className="text-gray-600">Submitted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600">Approved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-gray-600">Denied</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={claimsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Line type="monotone" dataKey="submitted" stroke="#818CF8" strokeWidth={2} dot={{ fill: '#818CF8', r: 4 }} />
                  <Line type="monotone" dataKey="approved" stroke="#4ADE80" strokeWidth={2} dot={{ fill: '#4ADE80', r: 4 }} />
                  <Line type="monotone" dataKey="denied" stroke="#F87171" strokeWidth={2} dot={{ fill: '#F87171', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Denial Reasons */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Top Denial Reasons</h2>
                  <p className="text-sm text-gray-500">By financial impact and claim count</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={denialReasonsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="reason" stroke="#999" angle={-45} textAnchor="end" height={100} fontSize={11} />
                    <YAxis yAxisId="left" stroke="#999" />
                    <YAxis yAxisId="right" orientation="right" stroke="#999" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="active" fill="#818CF8" name="$ Impact" />
                    <Bar yAxisId="right" dataKey="count" fill="#4DD0E1" name="# Claims" />
                  </BarChart>
                </ResponsiveContainer>
                <button className="w-full mt-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded transition-colors">
                  View more
                </button>
              </div>

              {/* Policy Performance */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Policy Performance</h2>
                  <p className="text-sm text-gray-500">Denial and appeal rates by policy</p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={policyPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="policy" stroke="#999" angle={-45} textAnchor="end" height={100} fontSize={11} />
                    <YAxis yAxisId="left" stroke="#999" />
                    <YAxis yAxisId="right" orientation="right" stroke="#999" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="active" fill="#818CF8" name="$ Impact" />
                    <Bar yAxisId="right" dataKey="count" fill="#4DD0E1" name="# Claims" />
                  </BarChart>
                </ResponsiveContainer>
                <button className="w-full mt-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded transition-colors">
                  View more
                </button>
              </div>
            </div>

            {/* Quick Actions Section */}
            <div className="grid grid-cols-3 gap-6">
              {/* Top Denial Policies */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Denial Policies</h3>
                <div className="space-y-3">
                  {topPolicies.map(policy => (
                    <button 
                      key={policy.id}
                      onClick={() => setShowDetailPanel(policy)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm text-gray-900 group-hover:text-indigo-600">
                          {policy.name}
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {policy.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{policy.claims} claims</span>
                        <span className="font-semibold text-indigo-600">{policy.impact}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Denied Claims */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Denied Claims</h3>
                <div className="space-y-3">
                  {recentDenials.map((claim, idx) => (
                    <button 
                      key={idx}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-mono text-xs text-gray-500">{claim.claimId}</div>
                        <span className="font-semibold text-sm text-gray-900">{claim.amount}</span>
                      </div>
                      <div className="text-sm text-gray-900 mb-1">{claim.patient}</div>
                      <div className="text-xs text-gray-500">{claim.reason}</div>
                      <div className="text-xs text-gray-400 mt-1">{claim.date}</div>
                    </button>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded transition-colors">
                  View all claims →
                </button>
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-cyan-200">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {insights.length} patterns detected that could improve your approval rate
                </p>
                <div className="space-y-3">
                  {insights.map(insight => (
                    <div 
                      key={insight.id}
                      className="bg-white p-3 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {insight.priority === 'high' && (
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5"></div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {insight.pattern}
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            {insight.impact} • {insight.claims} claims • {insight.providers} providers
                          </div>
                          <div className="flex items-center gap-1 text-xs text-cyan-600">
                            <Award className="w-3 h-3" />
                            {insight.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                  Review all insights
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel (slides in from right) */}
      {showDetailPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-end z-50" onClick={() => setShowDetailPanel(null)}>
          <div className="w-96 h-full bg-white shadow-2xl p-6 overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{showDetailPanel.name}</h2>
              <button 
                onClick={() => setShowDetailPanel(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Category</div>
                <div className="font-medium">{showDetailPanel.category}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Financial Impact</div>
                <div className="text-2xl font-semibold text-indigo-600">{showDetailPanel.impact}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Claims Affected</div>
                <div className="font-medium">{showDetailPanel.claims} claims</div>
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Common Issue:</div>
                <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                  Providers are billing E&M codes (99213-99215) on the same day as procedures without adding modifier 25, causing automatic denials.
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">How to Fix:</div>
                <div className="text-sm text-gray-600 bg-green-50 p-3 rounded border border-green-200">
                  Add modifier 25 to the E&M code when performed on the same day as a procedure to indicate a significant, separately identifiable service.
                </div>
              </div>
              <button className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors mt-6">
                🧪 Test in Claim Lab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
