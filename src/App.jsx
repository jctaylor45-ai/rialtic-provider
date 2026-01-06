import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Layout/Sidebar';
import { TopBar } from './components/Layout/TopBar';
import { DetailPanel } from './components/Layout/DetailPanel';
import { Dashboard } from './pages/Dashboard';
import { Policies } from './pages/Policies';
import { Claims } from './pages/Claims';
import { ClaimDetail } from './pages/ClaimDetail';
import { Insights } from './pages/Insights';
import { ClaimLab } from './pages/ClaimLab';
import { Impact } from './pages/Impact';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <div className="ml-64">
            <TopBar />
            <main className="mt-16">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/claims" element={<Claims />} />
                <Route path="/claims/:claimId" element={<ClaimDetail />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/claim-lab" element={<ClaimLab />} />
                <Route path="/impact" element={<Impact />} />
              </Routes>
            </main>
          </div>
          <DetailPanel />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
