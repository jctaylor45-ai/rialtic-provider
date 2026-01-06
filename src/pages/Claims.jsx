import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Search } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatting';

export function Claims() {
  const { claims, policies } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchParams, setSearchParams] = useState({
    claimId: '',
    patient: '',
    procedureCode: ''
  });

  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '90',
    provider: 'all',
    policy: new URLSearchParams(location.search).get('policy') || 'all',
    denialReason: 'all'
  });

  const [activeQuickFilter, setActiveQuickFilter] = useState(null);

  // Quick filter presets
  const quickFilters = [
    {
      id: 'denied',
      label: 'My Denied Claims',
      filter: { status: 'denied' }
    },
    {
      id: 'appealed',
      label: 'Appealed This Month',
      filter: { status: 'appealed', dateRange: '30' }
    },
    {
      id: 'high-impact',
      label: 'High $ Impact (>$500)',
      filter: {}
    },
    {
      id: 'recent',
      label: 'Recent (Last 7 Days)',
      filter: { dateRange: '7' }
    }
  ];

  // Filter and search claims
  const filteredClaims = useMemo(() => {
    let filtered = [...claims];

    // Search filters
    if (searchParams.claimId) {
      filtered = filtered.filter(c =>
        c.id.toLowerCase().includes(searchParams.claimId.toLowerCase())
      );
    }

    if (searchParams.patient) {
      filtered = filtered.filter(c =>
        c.patientName.toLowerCase().includes(searchParams.patient.toLowerCase()) ||
        c.memberId?.toLowerCase().includes(searchParams.patient.toLowerCase())
      );
    }

    if (searchParams.procedureCode) {
      filtered = filtered.filter(c => {
        const codes = c.procedureCodes || [c.procedureCode];
        return codes.some(code => code?.toLowerCase().includes(searchParams.procedureCode.toLowerCase()));
      });
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const days = parseInt(filters.dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(c => new Date(c.dateOfService) >= cutoffDate);
    }

    // Policy filter
    if (filters.policy !== 'all') {
      filtered = filtered.filter(c => c.policyId === filters.policy);
    }

    // Denial reason filter
    if (filters.denialReason !== 'all') {
      filtered = filtered.filter(c => c.denialReason === filters.denialReason);
    }

    // High impact filter
    if (activeQuickFilter === 'high-impact') {
      filtered = filtered.filter(c => parseFloat(c.billedAmount) > 500);
    }

    return filtered.sort((a, b) => new Date(b.dateOfService) - new Date(a.dateOfService));
  }, [claims, searchParams, filters, activeQuickFilter]);

  const handleQuickFilter = (filterId) => {
    const filter = quickFilters.find(f => f.id === filterId);
    if (filter && filter.filter) {
      setFilters({ ...filters, ...filter.filter });
      setActiveQuickFilter(filterId);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-700',
      denied: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
      appealed: 'bg-blue-100 text-blue-700'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Get unique denial reasons for filter
  const denialReasons = useMemo(() => {
    const reasons = new Set();
    claims.forEach(c => {
      if (c.denialReason) reasons.add(c.denialReason);
    });
    return Array.from(reasons);
  }, [claims]);

  return (
    <div className="flex-1 overflow-hidden p-8">
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          {/* Claim ID Search */}
          <div className="flex-1">
            <label className="text-sm text-gray-600 mb-1 block">Claim ID</label>
            <input
              type="text"
              placeholder="CLM-2024-XXXX"
              value={searchParams.claimId}
              onChange={(e) => setSearchParams({ ...searchParams, claimId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Patient/Member ID Search */}
          <div className="flex-1">
            <label className="text-sm text-gray-600 mb-1 block">Patient/Member ID</label>
            <input
              type="text"
              placeholder="Search by patient..."
              value={searchParams.patient}
              onChange={(e) => setSearchParams({ ...searchParams, patient: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Procedure Code Search */}
          <div className="flex-1">
            <label className="text-sm text-gray-600 mb-1 block">Procedure Code</label>
            <input
              type="text"
              placeholder="CPT/HCPCS code"
              value={searchParams.procedureCode}
              onChange={(e) => setSearchParams({ ...searchParams, procedureCode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-4">
          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="pending">Pending</option>
            <option value="appealed">Appealed</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>

          {/* Policy Filter */}
          <select
            value={filters.policy}
            onChange={(e) => setFilters({ ...filters, policy: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Policies</option>
            {policies.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Denial Reason Filter */}
          <select
            value={filters.denialReason}
            onChange={(e) => setFilters({ ...filters, denialReason: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Denial Reasons</option>
            {denialReasons.map(reason => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 mb-6">
        {quickFilters.map(filter => (
          <button
            key={filter.id}
            onClick={() => handleQuickFilter(filter.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeQuickFilter === filter.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
        {activeQuickFilter && (
          <button
            onClick={() => {
              setActiveQuickFilter(null);
              setFilters({
                status: 'all',
                dateRange: '90',
                provider: 'all',
                policy: 'all',
                denialReason: 'all'
              });
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 mb-4">
        {filteredClaims.length} claims found
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Claim ID</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Patient</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Date of Service</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700">Amount</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-700">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredClaims.map((claim) => (
                <tr
                  key={claim.id}
                  onClick={() => navigate(`/claims/${claim.id}`)}
                  className="hover:bg-indigo-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm text-indigo-600 font-medium">{claim.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{claim.patientName}</div>
                    {claim.memberId && (
                      <div className="text-xs text-gray-500">ID: {claim.memberId}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{formatDate(claim.dateOfService)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(claim.billedAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getStatusBadge(claim.status)}
                  </td>
                  <td className="px-6 py-4">
                    {claim.denialReason && (
                      <div className="text-sm text-gray-700">{claim.denialReason}</div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredClaims.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No claims found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
