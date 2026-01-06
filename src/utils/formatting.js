export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
};

export const formatTime = () => {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${Math.round(num)}%`;
};

// Transform claim to include lineItems if missing
export const ensureLineItems = (claim) => {
  if (!claim) return null;

  // If lineItems already exist, return as is
  if (claim.lineItems && claim.lineItems.length > 0) {
    return claim;
  }

  // Create lineItems from procedureCodes
  const lineItems = (claim.procedureCodes || []).map((code, idx) => ({
    lineNumber: idx + 1,
    procedureCode: code,
    modifiers: claim.modifiers || [],
    diagnosisCodes: claim.diagnosisCodes || [],
    units: 1,
    billedAmount: claim.billedAmount / (claim.procedureCodes?.length || 1),
    paidAmount: claim.paidAmount / (claim.procedureCodes?.length || 1),
    status: claim.status,
    dateOfService: claim.dateOfService,
    editsFired: claim.denialReason ? [claim.denialReason] : [],
    policiesTriggered: claim.policyIds || []
  }));

  return {
    ...claim,
    lineItems
  };
};
