export const calculateApprovalRate = (claims) => {
  if (!claims || claims.length === 0) return 0;
  const approvedCount = claims.filter(c => c.status === 'approved').length;
  return ((approvedCount / claims.length) * 100).toFixed(1);
};

export const calculateDeniedAmount = (claims) => {
  if (!claims || claims.length === 0) return 0;
  return claims
    .filter(c => c.status === 'denied')
    .reduce((sum, c) => sum + c.billedAmount, 0);
};

export const calculateAppealSuccess = (claims) => {
  if (!claims || claims.length === 0) return 0;
  const appealedClaims = claims.filter(c => c.appealStatus);
  if (appealedClaims.length === 0) return 0;

  const overturnedCount = appealedClaims.filter(c => c.appealStatus === 'overturned').length;
  return ((overturnedCount / appealedClaims.length) * 100).toFixed(1);
};

export const getTrendPercentage = (current, previous) => {
  if (!previous || previous === 0) return 0;
  const change = ((current - previous) / previous) * 100;
  return change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
};

export const filterClaimsByDateRange = (claims, from, to) => {
  if (!claims) return [];
  if (!from && !to) return claims;

  return claims.filter(claim => {
    const dos = new Date(claim.dateOfService);
    const fromDate = from ? new Date(from) : new Date('2000-01-01');
    const toDate = to ? new Date(to) : new Date('2099-12-31');
    return dos >= fromDate && dos <= toDate;
  });
};

export const filterClaimsByProvider = (claims, providerId) => {
  if (!claims) return [];
  if (!providerId || providerId === 'all') return claims;
  return claims.filter(claim => claim.providerId === providerId);
};

export const groupClaimsByMonth = (claims) => {
  if (!claims || claims.length === 0) return [];

  const monthlyData = {};

  claims.forEach(claim => {
    const date = new Date(claim.dateOfService);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        submitted: 0,
        approved: 0,
        denied: 0
      };
    }

    monthlyData[monthKey].submitted++;
    if (claim.status === 'approved') monthlyData[monthKey].approved++;
    if (claim.status === 'denied') monthlyData[monthKey].denied++;
  });

  // Convert to array and sort by date
  const result = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  // Take last 6 months
  const last6Months = result.slice(-6);

  // Format month labels
  return last6Months.map(item => {
    const [year, month] = item.month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      ...item,
      month: monthNames[parseInt(month) - 1]
    };
  });
};

export const getTopDenialReasons = (claims, limit = 6) => {
  if (!claims || claims.length === 0) return [];

  const deniedClaims = claims.filter(c => c.status === 'denied' && c.denialReason);
  const reasonMap = {};

  deniedClaims.forEach(claim => {
    if (!reasonMap[claim.denialReason]) {
      reasonMap[claim.denialReason] = {
        reason: claim.denialReason,
        active: 0,
        count: 0
      };
    }
    reasonMap[claim.denialReason].active += claim.billedAmount;
    reasonMap[claim.denialReason].count++;
  });

  return Object.values(reasonMap)
    .sort((a, b) => b.active - a.active)
    .slice(0, limit);
};

export const getTopPolicies = (claims, policies, limit = 4) => {
  if (!claims || !policies || claims.length === 0) return [];

  const deniedClaims = claims.filter(c => c.status === 'denied');
  const policyMap = {};

  deniedClaims.forEach(claim => {
    if (claim.policyIds && claim.policyIds.length > 0) {
      claim.policyIds.forEach(policyId => {
        if (!policyMap[policyId]) {
          policyMap[policyId] = {
            policyId,
            impact: 0,
            count: 0,
            claimIds: []
          };
        }
        policyMap[policyId].impact += claim.billedAmount;
        policyMap[policyId].count++;
        policyMap[policyId].claimIds.push(claim.id);
      });
    }
  });

  // Merge with policy details
  const topPolicies = Object.values(policyMap)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, limit)
    .map(item => {
      const policy = policies.find(p => p.id === item.policyId);
      return {
        ...item,
        name: policy?.name || 'Unknown Policy',
        category: policy?.topic || 'Unknown'
      };
    });

  return topPolicies;
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '$0';

  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

export const formatNumber = (number) => {
  if (!number && number !== 0) return '0';
  return number.toLocaleString('en-US');
};

export const getDateRangeFromDays = (days) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - parseInt(days));
  return { from, to };
};
