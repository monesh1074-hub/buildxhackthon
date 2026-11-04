import React from 'react';
import {
  Menu,
  ShieldCheck,
  RefreshCw,
  Lock,
  CheckCircle2,
  Server,
  ChevronRight,
  Database
} from 'lucide-react';

export default function Header({
  activeTab,
  onRefresh,
  isRefreshing,
  onOpenProofModal,
  setMobileOpen,
  dbStatus
}) {
  const getTabDetails = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'System Overview',
          breadcrumb: 'Dashboard / Overview',
          desc: 'High-level protection metrics, core capabilities, and real-time security posture.'
        };
      case 'scanner':
        return {
          title: 'Scan & Mask Studio',
          breadcrumb: 'Tools / Scan & Mask Studio',
          desc: 'Inspect customer inputs, API payloads, and error logs with inline zero-knowledge masking.'
        };
      case 'analytics':
        return {
          title: 'Security Analytics',
          breadcrumb: 'Analytics / Telemetry',
          desc: 'Aggregated telemetry of neutralized customer PII, threat severity distributions, and latency.'
        };
      case 'history':
        return {
          title: 'Sanitized Audit History',
          breadcrumb: 'Audit / History Logs',
          desc: 'Verifiable history of sanitized scans (raw sensitive records are strictly never stored).'
        };
      case 'rules':
        return {
          title: 'Detection Policies',
          breadcrumb: 'Configuration / Detection Policies',
          desc: 'Manage inspection rules, regular expression patterns, and custom data masking definitions.'
        };
      case 'simulator':
        return {
          title: 'API Gateway Interceptor',
          breadcrumb: 'Developer / API Gateway Interceptor',
          desc: 'Live reverse proxy simulator illustrating request filtering before logs reach downstream storage.'
        };
      case 'settings':
        return {
          title: 'System & Database Settings',
          breadcrumb: 'Management / Settings',
          desc: 'Configure Supabase Online PostgreSQL, SQLite persistence, audit purging, and data export.'
        };
      default:
        return {
          title: 'Dashboard',
          breadcrumb: 'PrivacyShield',
          desc: 'API Data Loss Prevention System'
        };
    }
  };

  const { title, breadcrumb } = getTabDetails();
  const isSupabase = dbStatus?.type === 'SUPABASE' || dbStatus?.isOnline;

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 lg:px-8 py-4 sticky top-0 z-30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen && setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="text-[11px] font-mono font-medium text-slate-400 flex items-center gap-1.5">
            <span>{breadcrumb}</span>
          </div>
          <h1 className="text-xl font-heading font-bold text-slate-900 tracking-tight mt-0.5">
            {title}
          </h1>
        </div>
      </div>

      {/* Action Strip & Status */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Database Online Status Badge */}
        <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-mono border shadow-subtle ${
          isSupabase 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold' 
            : 'bg-slate-50 text-slate-700 border-slate-200 font-medium'
        }`}>
          <Database className={`w-3.5 h-3.5 ${isSupabase ? 'text-emerald-600' : 'text-purple-600'}`} />
          <span>{isSupabase ? 'Supabase Online' : 'SQLite Local WAL'}</span>
        </div>

        {/* Floating Gateway Status Indicator */}
        <div className="liquid-glass-badge px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-mono text-slate-700 shadow-subtle">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-800 font-medium">Gateway Active</span>
          <span className="text-slate-300">|</span>
          <span className="text-purple-700 font-semibold">:5000</span>
        </div>

        {/* Database Zero-Storage Verification Button */}
        <button
          onClick={onOpenProofModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-medium transition shadow-subtle"
          title="Audit database directly for zero plaintext PII"
        >
          <Lock className="w-3.5 h-3.5 text-purple-600" />
          <span>Verify Zero-PII</span>
        </button>

        {/* Refresh Stats Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition shadow-subtle"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
        </button>

        {/* SecOps Team Profile Pill */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
          <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold font-mono text-[11px]">
            SO
          </div>
          <div className="leading-tight">
            <span className="font-semibold text-slate-800 block text-[11px]">SecOps Gateway</span>
            <span className="text-[10px] text-slate-400 font-mono">prod-cluster-01</span>
          </div>
        </div>
      </div>
    </header>
  );
}
