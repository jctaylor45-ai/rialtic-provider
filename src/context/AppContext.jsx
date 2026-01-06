import React, { createContext, useContext, useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import claimsData from '../data/claims.json';
import policiesData from '../data/policies.json';
import providersData from '../data/providers.json';
import insightsData from '../data/insights.json';
import {
  filterClaimsByDateRange,
  filterClaimsByProvider,
  calculateApprovalRate,
  calculateDeniedAmount,
  calculateAppealSuccess,
  getTrendPercentage,
  groupClaimsByMonth,
  getTopDenialReasons,
  getTopPolicies,
  getDateRangeFromDays
} from '../utils/calculations';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    viewMode: 'practice',
    providerId: 'all',
    timeRange: '90',
    dateFrom: null,
    dateTo: null
  });

  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [learningMarkers, setLearningMarkers] = useLocalStorage('learningMarkers', []);

  // Static data
  const claims = useMemo(() => {
    console.log('Claims data loaded:', claimsData?.length, 'claims');
    return claimsData;
  }, []);
  const policies = useMemo(() => {
    console.log('Policies data loaded:', policiesData?.length, 'policies');
    return policiesData;
  }, []);
  const providers = useMemo(() => {
    console.log('Providers data loaded:', providersData?.length, 'providers');
    return providersData;
  }, []);
  const insights = useMemo(() => {
    console.log('Insights data loaded:', insightsData?.length, 'insights');
    return insightsData;
  }, []);

  // Filtered claims based on current filters
  const filteredClaims = useMemo(() => {
    let filtered = [...claims];

    // Filter by date range
    if (filters.timeRange !== 'custom') {
      const { from, to } = getDateRangeFromDays(filters.timeRange);
      filtered = filterClaimsByDateRange(filtered, from, to);
    } else if (filters.dateFrom && filters.dateTo) {
      filtered = filterClaimsByDateRange(filtered, filters.dateFrom, filters.dateTo);
    }

    // Filter by provider
    if (filters.viewMode === 'individual' && filters.providerId !== 'all') {
      filtered = filterClaimsByProvider(filtered, filters.providerId);
    }

    return filtered;
  }, [claims, filters]);

  // Previous period claims for trend calculation
  const previousPeriodClaims = useMemo(() => {
    let days = parseInt(filters.timeRange);
    if (filters.timeRange === 'custom') {
      const from = new Date(filters.dateFrom);
      const to = new Date(filters.dateTo);
      days = Math.floor((to - from) / (1000 * 60 * 60 * 24));
    }

    const from = new Date();
    from.setDate(from.getDate() - (days * 2));
    const to = new Date();
    to.setDate(to.getDate() - days);

    let filtered = filterClaimsByDateRange(claims, from, to);

    if (filters.viewMode === 'individual' && filters.providerId !== 'all') {
      filtered = filterClaimsByProvider(filtered, filters.providerId);
    }

    return filtered;
  }, [claims, filters]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const currentApprovalRate = parseFloat(calculateApprovalRate(filteredClaims));
    const previousApprovalRate = parseFloat(calculateApprovalRate(previousPeriodClaims));

    const deniedClaims = filteredClaims.filter(c => c.status === 'denied');
    const previousDeniedClaims = previousPeriodClaims.filter(c => c.status === 'denied');

    const deniedAmount = calculateDeniedAmount(filteredClaims);
    const previousDeniedAmount = calculateDeniedAmount(previousPeriodClaims);

    const appealedClaims = filteredClaims.filter(c => c.appealStatus);
    const overturnedCount = appealedClaims.filter(c => c.appealStatus === 'overturned').length;
    const currentAppealSuccess = parseFloat(calculateAppealSuccess(filteredClaims));
    const previousAppealSuccess = parseFloat(calculateAppealSuccess(previousPeriodClaims));

    return {
      claimsSubmitted: {
        value: filteredClaims.length,
        trend: getTrendPercentage(filteredClaims.length, previousPeriodClaims.length)
      },
      approvalRate: {
        value: currentApprovalRate,
        trend: getTrendPercentage(currentApprovalRate, previousApprovalRate)
      },
      deniedClaims: {
        value: deniedClaims.length,
        percentage: filteredClaims.length > 0 ? ((deniedClaims.length / filteredClaims.length) * 100).toFixed(1) : 0,
        trend: getTrendPercentage(deniedClaims.length, previousDeniedClaims.length)
      },
      deniedAmount: {
        value: deniedAmount,
        trend: getTrendPercentage(deniedAmount, previousDeniedAmount)
      },
      appealSuccess: {
        value: currentAppealSuccess,
        overturnedCount,
        trend: getTrendPercentage(currentAppealSuccess, previousAppealSuccess)
      },
      learningImpact: {
        value: learningMarkers.length,
        isNew: true
      }
    };
  }, [filteredClaims, previousPeriodClaims, learningMarkers]);

  // Chart data
  const chartData = useMemo(() => ({
    claimsTrend: groupClaimsByMonth(filteredClaims),
    denialReasons: getTopDenialReasons(filteredClaims, 6),
    topPolicies: getTopPolicies(filteredClaims, policies, 4)
  }), [filteredClaims, policies]);

  // Recent denied claims
  const recentDeniedClaims = useMemo(() => {
    return filteredClaims
      .filter(c => c.status === 'denied')
      .sort((a, b) => new Date(b.dateOfService) - new Date(a.dateOfService))
      .slice(0, 3);
  }, [filteredClaims]);

  // Top denial policies for panel
  const topDenialPolicies = useMemo(() => {
    return getTopPolicies(filteredClaims, policies, 3);
  }, [filteredClaims, policies]);

  const value = {
    filters,
    setFilters,
    claims,
    policies,
    providers,
    insights,
    filteredClaims,
    metrics,
    chartData,
    recentDeniedClaims,
    topDenialPolicies,
    learningMarkers,
    setLearningMarkers,
    selectedPolicy,
    setSelectedPolicy
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
