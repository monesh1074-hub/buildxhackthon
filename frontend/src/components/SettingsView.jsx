import React, { useState } from 'react';
import {
  Settings,
  Database,
  Trash2,
  Lock,
  CheckCircle2,
  Download,
  Server,
  Cpu,
  ShieldCheck,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsView({ stats, onOpenProofModal, onRefresh }) {
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to purge all sanitized audit logs from SQLite? This cannot be undone.')) return;
    setClearing(true);
    try {
      await api.clearHistory();
      setMessage('Audit history purged successfully.');
      if (onRefresh) onRefresh();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert('Failed to clear history: ' + err.message);
    } finally {
      setClearing(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await api.fetchHistory({ limit: 1000 });
      if (res.success && res.data) {
        const jsonStr = JSON.stringify(res.data.scans || [], null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `privacyshield-audit-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage('Audit logs exported successfully.');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Settings Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-heading font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-600" />
            System & Compliance Settings
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Configure engine parameters, audit persistence, and SQLite zero-knowledge storage controls.
          </p>
        </div>

        <button
          onClick={onOpenProofModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition shadow-subtle"
        >
          <Lock className="w-3.5 h-3.5 text-purple-600" />
          <span>Verify Storage Integrity</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Grid Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Architecture & Engine Specs */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-slate-900">Runtime & Architecture</h3>
              <p className="text-[11px] text-slate-400">Core engine specifications</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Service:</span>
              <span className="font-semibold text-slate-800">PrivacyShield Gateway</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Backend Runtime:</span>
              <span className="font-semibold text-slate-800">Node.js Express 5</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Frontend Stack:</span>
              <span className="font-semibold text-slate-800">React 19 + Vite</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Database Engine:</span>
              <span className="font-semibold text-emerald-700">SQLite (WAL Mode Active)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Zero-Storage Policy:</span>
              <span className="font-semibold text-purple-700">STRICT (Zero Plaintext)</span>
            </div>
          </div>
        </div>

        {/* Database Management */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-bold text-slate-900">Database & Audit Log Controls</h3>
                <p className="text-[11px] text-slate-400">Manage SQLite sanitized records</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans mb-4">
              Export sanitized telemetry logs for external SIEM integration (Splunk, Elastic, Datadog), or purge historical records to reset demonstration stats.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition shadow-subtle"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              <span>{exporting ? 'Exporting...' : 'Export Audit Logs (JSON)'}</span>
            </button>

            <button
              onClick={handleClearHistory}
              disabled={clearing}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{clearing ? 'Purging...' : 'Purge All Audit Records'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

