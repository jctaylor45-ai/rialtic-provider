import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Select } from '../shared/Select';
import { formatTime } from '../../utils/formatting';

export const TopBar = () => {
  const { filters, setFilters, providers } = useApp();
  const [currentTime, setCurrentTime] = useState(formatTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const viewModeOptions = [
    { value: 'practice', label: 'Practice View' },
    { value: 'individual', label: 'Individual Provider' },
    { value: 'comparison', label: 'Provider Comparison' }
  ];

  const providerOptions = [
    { value: 'all', label: 'All Providers' },
    ...providers.map(p => ({ value: p.id, label: p.name }))
  ];

  const timeRangeOptions = [
    { value: '30', label: 'Last 30 days' },
    { value: '60', label: 'Last 60 days' },
    { value: '90', label: 'Last 90 days' },
    { value: 'custom', label: 'Custom range' }
  ];

  const handleViewModeChange = (e) => {
    const newViewMode = e.target.value;
    setFilters(prev => ({
      ...prev,
      viewMode: newViewMode,
      providerId: newViewMode === 'practice' ? 'all' : prev.providerId
    }));
  };

  const handleProviderChange = (e) => {
    setFilters(prev => ({ ...prev, providerId: e.target.value }));
  };

  const handleTimeRangeChange = (e) => {
    setFilters(prev => ({ ...prev, timeRange: e.target.value }));
  };

  const handleDateFromChange = (e) => {
    setFilters(prev => ({ ...prev, dateFrom: e.target.value }));
  };

  const handleDateToChange = (e) => {
    setFilters(prev => ({ ...prev, dateTo: e.target.value }));
  };

  return (
    <div className="fixed left-64 right-0 top-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        <Select
          value={filters.viewMode}
          onChange={handleViewModeChange}
          options={viewModeOptions}
        />

        {filters.viewMode === 'individual' && (
          <Select
            value={filters.providerId}
            onChange={handleProviderChange}
            options={providerOptions}
          />
        )}

        <Select
          value={filters.timeRange}
          onChange={handleTimeRangeChange}
          options={timeRangeOptions}
        />

        {filters.timeRange === 'custom' && (
          <>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={handleDateFromChange}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={handleDateToChange}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{currentTime}</span>
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-indigo-600 font-semibold text-sm">DS</span>
        </div>
      </div>
    </div>
  );
};
