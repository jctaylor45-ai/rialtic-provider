import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Search, Download, TrendingUp, TrendingDown, ChevronRight,
  FileText, Code, BookOpen, BarChart3, AlertCircle, Award, X,
  XCircle, CheckCircle
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatting';

export function Policies() {
  const { policies } = useApp();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    mode: 'all',
    topic: 'all',
    logicType: 'all',
    source: 'all'
  });
  const [sortBy, setSortBy] = useState({ column: 'impact', direction: 'desc' });
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Filter and sort policies
  const filteredPolicies = useMemo(() => {
    let filtered = [...policies];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Mode filter
    if (filters.mode !== 'all') {
      filtered = filtered.filter(p => p.mode === filters.mode);
    }

    // Topic filter
    if (filters.topic !== 'all') {
      filtered = filtered.filter(p => p.topic === filters.topic);
    }

    // Logic type filter
    if (filters.logicType !== 'all') {
      filtered = filtered.filter(p => p.logicType === filters.logicType);
    }

    // Source filter
    if (filters.source !== 'all') {
      filtered = filtered.filter(p => p.source === filters.source);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy.column];
      let bVal = b[sortBy.column];

      if (sortBy.column === 'name') {
        return sortBy.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortBy.direction === 'asc'
        ? aVal - bVal
        : bVal - aVal;
    });

    return filtered;
  }, [policies, searchTerm, filters, sortBy]);

  const handleSort = (column) => {
    setSortBy(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleExport = () => {
    // CSV export functionality
    const headers = ['Policy ID', 'Name', 'Category', 'Topic', 'Logic Type', 'Source', 'Hit Rate', 'Denial Rate', 'Appeal Rate', 'Overturn Rate', 'Impact'];
    const rows = filteredPolicies.map(p => [
      p.id,
      p.name,
      p.topic,
      p.logicType,
      p.source,
      `${p.hitRate}%`,
      `${p.denialRate}%`,
      `${p.appealRate}%`,
      `${p.overturnRate}%`,
      `$${p.impact}`
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'policies-export.csv';
    a.click();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'technical', label: 'Technical', icon: Code },
    { id: 'references', label: 'References', icon: BookOpen },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'claims', label: 'Claims', icon: AlertCircle },
    { id: 'learning', label: 'Learning', icon: Award }
  ];

  return (
    <div className="flex-1 overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          {/* Search Input */}
          <div className="flex-1 min-w-[300px] relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Mode Filter */}
          <select
            value={filters.mode}
            onChange={(e) => setFilters({ ...filters, mode: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Modes</option>
            <option value="active">Active</option>
            <option value="observation">Observation</option>
          </select>

          {/* Topic Filter */}
          <select
            value={filters.topic}
            onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Topics</option>
            <option value="DME">DME</option>
            <option value="Laboratory">Laboratory</option>
            <option value="E&M">E&M</option>
            <option value="Surgery">Surgery</option>
            <option value="BH">BH</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Radiology">Radiology</option>
          </select>

          {/* Logic Type Filter */}
          <select
            value={filters.logicType}
            onChange={(e) => setFilters({ ...filters, logicType: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Logic Types</option>
            <option value="Modifier">Modifier</option>
            <option value="Duplicate">Duplicate</option>
            <option value="Medical Necessity">Medical Necessity</option>
            <option value="Authorization">Authorization</option>
            <option value="Unit/Frequency">Unit/Frequency</option>
            <option value="Code Combinations">Code Combinations</option>
            <option value="Age">Age</option>
            <option value="Covered Service">Covered Service</option>
            <option value="Pricing">Pricing</option>
            <option value="Place of Service">Place of Service</option>
          </select>

          {/* Source Filter */}
          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Sources</option>
            <option value="NCCI">NCCI</option>
            <option value="Medicare Policy">Medicare Policy</option>
            <option value="LCD">LCD</option>
            <option value="NCD">NCD</option>
            <option value="Client Source">Client Source</option>
            <option value="HCPCS">HCPCS</option>
            <option value="AMA">AMA</option>
            <option value="FDA">FDA</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {filteredPolicies.length} policies
        </div>
      </div>

      {/* Policy Table */}
      <div className={`overflow-auto ${selectedPolicy ? 'mr-[480px]' : ''}`} style={{ height: 'calc(100vh - 200px)' }}>
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="text-left px-4 py-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              >
                Policy {sortBy.column === 'name' && (sortBy.direction === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Category</th>
              <th
                onClick={() => handleSort('hitRate')}
                className="text-right px-4 py-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              >
                Hit Rate {sortBy.column === 'hitRate' && (sortBy.direction === 'desc' ? '↓' : '↑')}
              </th>
              <th
                onClick={() => handleSort('denialRate')}
                className="text-right px-4 py-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              >
                Denial Rate {sortBy.column === 'denialRate' && (sortBy.direction === 'desc' ? '↓' : '↑')}
              </th>
              <th
                onClick={() => handleSort('appealRate')}
                className="text-right px-4 py-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              >
                Appeal Rate {sortBy.column === 'appealRate' && (sortBy.direction === 'desc' ? '↓' : '↑')}
              </th>
              <th
                onClick={() => handleSort('overturnRate')}
                className="text-right px-4 py-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              >
                Overturn Rate {sortBy.column === 'overturnRate' && (sortBy.direction === 'desc' ? '↓' : '↑')}
              </th>
              <th
                onClick={() => handleSort('impact')}
                className="text-right px-4 py-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
              >
                Impact {sortBy.column === 'impact' && (sortBy.direction === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPolicies.map((policy) => (
              <tr
                key={policy.id}
                onClick={() => setSelectedPolicy(policy)}
                className={`cursor-pointer hover:bg-indigo-50 transition-colors ${
                  selectedPolicy?.id === policy.id ? 'bg-indigo-50 border-l-4 border-indigo-400' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-sm text-gray-900">{policy.name}</div>
                  <div className="font-mono text-xs text-gray-500">{policy.id}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                      {policy.topic}
                    </span>
                    <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded">
                      {policy.logicType}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {policy.source}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">
                  {formatPercentage(policy.hitRate)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-red-600 font-medium">
                  {formatPercentage(policy.denialRate)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">
                  {formatPercentage(policy.appealRate)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-green-600 font-medium">
                  {formatPercentage(policy.overturnRate)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(policy.impact)}
                </td>
                <td className="px-4 py-3 text-center">
                  {policy.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500 mx-auto" />}
                  {policy.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500 mx-auto" />}
                  {policy.trend === 'stable' && <div className="w-4 h-4 mx-auto" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Policy Detail Panel */}
      {selectedPolicy && (
        <div className="fixed right-0 top-16 bottom-0 w-[480px] bg-white shadow-xl border-l border-gray-200 z-40 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-900 flex-1 pr-4">
                {selectedPolicy.name}
              </h2>
              <button
                onClick={() => setSelectedPolicy(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                selectedPolicy.mode === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {selectedPolicy.mode === 'active' ? 'Active' : 'Observation'}
              </span>
              <span className="text-xs text-gray-500">
                Since {new Date(selectedPolicy.effectiveDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                {selectedPolicy.topic}
              </span>
              <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded">
                {selectedPolicy.logicType}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {selectedPolicy.source}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedPolicy.description}</p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Clinical Rationale</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedPolicy.clinicalRationale}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Common Issue</h4>
                    <p className="text-sm text-gray-700">{selectedPolicy.commonMistake}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">How to Fix</h4>
                    <p className="text-sm text-gray-700">{selectedPolicy.fixGuidance}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'technical' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Procedure Codes</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPolicy.procedureCodes?.map((code, idx) => (
                      <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-mono rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Diagnosis Codes</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPolicy.diagnosisCodes?.map((code, idx) => (
                      <span key={idx} className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-mono rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Modifiers</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPolicy.modifiers?.map((code, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-mono rounded">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Technical Details</h4>
                  <div className="space-y-2 text-sm">
                    {selectedPolicy.ageRestrictions && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age Restrictions:</span>
                        <span className="text-gray-900">{selectedPolicy.ageRestrictions}</span>
                      </div>
                    )}
                    {selectedPolicy.frequencyLimits && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Frequency Limits:</span>
                        <span className="text-gray-900">{selectedPolicy.frequencyLimits}</span>
                      </div>
                    )}
                    {selectedPolicy.placeOfService?.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Place of Service:</span>
                        <span className="text-gray-900">{selectedPolicy.placeOfService.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'references' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Reference Documents</h4>
                {selectedPolicy.referenceDocs?.map((doc, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                          {doc.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{doc.source}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          doc.type === 'primary'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {doc.type}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">Hit Rate</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatPercentage(selectedPolicy.hitRate)}
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">Denial Rate</div>
                    <div className="text-2xl font-semibold text-red-600">
                      {formatPercentage(selectedPolicy.denialRate)}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">Appeal Rate</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatPercentage(selectedPolicy.appealRate)}
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-xs text-gray-600 mb-1">Overturn Rate</div>
                    <div className="text-2xl font-semibold text-green-600">
                      {formatPercentage(selectedPolicy.overturnRate)}
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="text-xs text-gray-600 mb-1">Financial Impact</div>
                  <div className="text-3xl font-semibold text-indigo-600">
                    {formatCurrency(selectedPolicy.impact)}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    Denied across {selectedPolicy.insightCount} claims
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-xs text-gray-600 mb-1">Provider Impact</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {selectedPolicy.providersImpacted}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">providers affected</div>
                </div>
              </div>
            )}

            {activeTab === 'claims' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Claims</h4>
                <p className="text-sm text-gray-500 mb-4">Claims related to this policy will appear here</p>
                <button
                  onClick={() => navigate(`/claims?policy=${selectedPolicy.id}`)}
                  className="w-full py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded transition-colors"
                >
                  View all claims →
                </button>
              </div>
            )}

            {activeTab === 'learning' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 border border-cyan-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Award className="w-6 h-6 text-indigo-600" />
                    <div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {selectedPolicy.learningMarkersCount || 0}
                      </div>
                      <div className="text-sm text-gray-600">Providers tested corrections</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {selectedPolicy.recentTests || 0} tests in the last 7 days
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Common Mistakes</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedPolicy.commonMistake}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Coding Guidance</h4>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedPolicy.fixGuidance}</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/claim-lab?policy=${selectedPolicy.id}`)}
                  className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Test in Claim Lab
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
