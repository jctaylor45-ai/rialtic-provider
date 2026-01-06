import React from 'react';
import { BarChart, CheckCircle, XCircle, DollarSign, Award, TrendingUp, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getGreeting } from '../utils/formatting';
import { formatNumber, formatCurrency } from '../utils/calculations';
import { MetricCard } from '../components/Dashboard/MetricCard';
import { ClaimsTrendChart } from '../components/Dashboard/ClaimsTrendChart';
import { DenialReasonsChart } from '../components/Dashboard/DenialReasonsChart';
import { PolicyPerformanceChart } from '../components/Dashboard/PolicyPerformanceChart';
import { TopPoliciesPanel } from '../components/Dashboard/TopPoliciesPanel';
import { RecentDenialsPanel } from '../components/Dashboard/RecentDenialsPanel';
import { AIInsightsPanel } from '../components/Dashboard/AIInsightsPanel';
import { Button } from '../components/shared/Button';

export const Dashboard = () => {
  const { metrics, filters, providers } = useApp();

  console.log('Dashboard rendering with metrics:', metrics);

  const getProviderName = () => {
    if (filters.viewMode === 'individual' && filters.providerId !== 'all') {
      const provider = providers.find(p => p.id === filters.providerId);
      return provider ? provider.name.replace('Dr. ', '') : 'Provider';
    }
    return 'Team';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          {getGreeting()}, {getProviderName()}.
        </h1>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <MetricCard
          icon={BarChart}
          title="Claims Submitted"
          value={metrics.claimsSubmitted.value}
          subValue="This period"
          trend={metrics.claimsSubmitted.trend}
          format="number"
        />
        <MetricCard
          icon={CheckCircle}
          title="Approval Rate"
          value={metrics.approvalRate.value}
          subValue="Active"
          trend={metrics.approvalRate.trend}
          format="percentage"
        />
        <MetricCard
          icon={XCircle}
          title="Denied Claims"
          value={metrics.deniedClaims.value}
          subValue={`${metrics.deniedClaims.percentage}% of total`}
          trend={metrics.deniedClaims.trend}
          format="number"
        />
        <MetricCard
          icon={DollarSign}
          title="Denied Amount"
          value={metrics.deniedAmount.value}
          subValue="Potential revenue"
          trend={metrics.deniedAmount.trend}
          format="currency"
        />
        <MetricCard
          icon={Award}
          title="Appeal Success"
          value={metrics.appealSuccess.value}
          subValue={`${metrics.appealSuccess.overturnedCount} overturned`}
          trend={metrics.appealSuccess.trend}
          format="percentage"
        />
        <MetricCard
          icon={TrendingUp}
          title="Learning Impact"
          value={metrics.learningImpact.value}
          subValue="Tests completed"
          badge="New"
          highlighted={true}
        />
      </div>

      <ClaimsTrendChart />

      <div className="grid grid-cols-2 gap-6">
        <DenialReasonsChart />
        <PolicyPerformanceChart />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <TopPoliciesPanel />
        <RecentDenialsPanel />
        <AIInsightsPanel />
      </div>
    </div>
  );
};
