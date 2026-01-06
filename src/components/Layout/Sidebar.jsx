import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardList, Lightbulb, FlaskConical, BookOpen, TrendingUp } from 'lucide-react';
import { Select } from '../shared/Select';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'policies', label: 'Policies', icon: FileText, path: '/policies' },
    { id: 'claims', label: 'Claims', icon: ClipboardList, path: '/claims' },
    { id: 'insights', label: 'Insights', icon: Lightbulb, path: '/insights' },
    { id: 'claim-lab', label: 'Claim Lab', icon: FlaskConical, path: '/claim-lab' },
    { id: 'impact', label: 'Impact', icon: TrendingUp, path: '/impact' }
  ];

  const practiceOptions = [
    { value: 'practice-1', label: 'Main Practice' }
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-indigo-600 to-indigo-700 text-white flex flex-col">
      <div className="p-6">
        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-6">
          <span className="text-indigo-600 font-bold text-2xl">R</span>
        </div>

        <Select
          value="practice-1"
          onChange={() => {}}
          options={practiceOptions}
          className="bg-indigo-500 border-indigo-400 text-white mb-6"
        />
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
                          (item.path === '/dashboard' && location.pathname === '/');
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 mb-1 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-500 text-white'
                  : 'text-indigo-100 hover:bg-indigo-500/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-indigo-500">
        <button className="flex items-center gap-2 text-indigo-100 hover:text-white text-sm transition-colors">
          <BookOpen className="w-4 h-4" />
          <span>Product Guide</span>
        </button>
      </div>
    </div>
  );
};
