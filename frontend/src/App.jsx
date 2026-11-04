import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import OverviewDashboard from './components/OverviewDashboard';
import ScannerInterface from './components/ScannerInterface';
import AnalyticsView from './components/AnalyticsView';
import HistoryTable from './components/HistoryTable';
import RulesManager from './components/RulesManager';
import ApiSimulator from './components/ApiSimulator';
import SettingsView from './components/SettingsView';
import ZeroStorageModal from './components/ZeroStorageModal';
import { api } from './services/api';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch real-time metrics and database mode
  const loadStats = async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, dbRes] = await Promise.allSettled([
        api.fetchStats(),
        api.getDatabaseStatus()
      ]);
      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.data);
      }
      if (dbRes.status === 'fulfilled' && dbRes.value?.success) {
        setDbStatus(dbRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load stats/dbStatus:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Periodic refresh every 15 seconds
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleScanComplete = (scanResult) => {
    loadStats();
    setNotification({
      type: 'success',
      message: `Shielded ${scanResult.detectionsCount} sensitive entities in ${scanResult.processingTimeMs}ms (Zero plaintext persisted)`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        onOpenProofModal={() => setIsProofModalOpen(true)}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onRefresh={loadStats}
          isRefreshing={isRefreshing}
          onOpenProofModal={() => setIsProofModalOpen(true)}
          setMobileOpen={setMobileOpen}
          dbStatus={dbStatus}
        />

        {/* Global Floating Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300">
            <div className="liquid-glass px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-purple-200 text-slate-800 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Page Body */}
        <main className="p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Key Statistics Bar (Always accessible) */}
          <StatsOverview stats={stats} />

          {/* Active Tab View */}
          <div className="pt-2">
            {activeTab === 'overview' && (
              <OverviewDashboard
                stats={stats}
                setActiveTab={setActiveTab}
                onOpenProofModal={() => setIsProofModalOpen(true)}
              />
            )}

            {activeTab === 'scanner' && (
              <ScannerInterface onScanComplete={handleScanComplete} />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                stats={stats}
                onOpenProofModal={() => setIsProofModalOpen(true)}
              />
            )}

            {activeTab === 'history' && (
              <HistoryTable />
            )}

            {activeTab === 'rules' && (
              <RulesManager />
            )}

            {activeTab === 'simulator' && (
              <ApiSimulator />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                stats={stats}
                onOpenProofModal={() => setIsProofModalOpen(true)}
                onRefresh={loadStats}
                dbStatus={dbStatus}
                onUpdateDbStatus={loadStats}
              />
            )}
          </div>
        </main>
      </div>

      {/* Zero Storage Verification Modal */}
      <ZeroStorageModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
      />
    </div>
  );
}
