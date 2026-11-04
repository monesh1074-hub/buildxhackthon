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
  AlertTriangle,
  ExternalLink,
  Code2,
  Check,
  Radio,
  Sparkles,
  Link2,
  Key
} from 'lucide-react';
import { api } from '../services/api';
import SupabaseSqlModal from './SupabaseSqlModal';

export default function SettingsView({ stats, onOpenProofModal, onRefresh, dbStatus, onUpdateDbStatus }) {
  const [clearing, setClearing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Connection Mode: 'pooler' | 'rest'
  const [connMode, setConnMode] = useState('pooler');

  // Pooler URI & Password State
  const defaultPooler = 'postgresql://postgres.ahgwddljobktbngfwjou:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
  const [poolerUri, setPoolerUri] = useState(defaultPooler);
  const [dbPassword, setDbPassword] = useState('');

  // REST API State
  const [supabaseUrl, setSupabaseUrl] = useState('https://ahgwddljobktbngfwjou.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState('');

  const [testingSupabase, setTestingSupabase] = useState(false);
  const [connectingSupabase, setConnectingSupabase] = useState(false);
  const [supabaseMessage, setSupabaseMessage] = useState(null);

  const isSupabaseOnline = dbStatus?.type === 'SUPABASE' || dbStatus?.isOnline;

  const getEffectiveConnectionString = () => {
    let uri = poolerUri.trim();
    if (dbPassword.trim()) {
      uri = uri.replace('[YOUR-PASSWORD]', encodeURIComponent(dbPassword.trim()));
    }
    return uri;
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setSupabaseMessage(null);

    try {
      let params = {};
      if (connMode === 'pooler') {
        const effectiveUri = getEffectiveConnectionString();
        if (effectiveUri.includes('[YOUR-PASSWORD]')) {
          setSupabaseMessage({
            type: 'error',
            text: 'Please enter your actual Supabase database password in the password field below.'
          });
          setTestingSupabase(false);
          return;
        }
        params = { connectionString: effectiveUri };
      } else {
        if (!supabaseUrl || !supabaseKey) {
          setSupabaseMessage({ type: 'error', text: 'Please enter both Supabase Project URL and API Key.' });
          setTestingSupabase(false);
          return;
        }
        params = { url: supabaseUrl, key: supabaseKey };
      }

      const res = await api.testSupabase(params);
      if (res.success) {
        setSupabaseMessage({ type: 'success', text: res.message || 'Connected to Supabase PostgreSQL successfully!' });
      } else {
        setSupabaseMessage({ type: 'error', text: res.message || 'Connection test failed.' });
      }
    } catch (err) {
      setSupabaseMessage({ type: 'error', text: 'Connection error: ' + err.message });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleConnectSupabase = async () => {
    setConnectingSupabase(true);
    setSupabaseMessage(null);

    try {
      let params = {};
      if (connMode === 'pooler') {
        const effectiveUri = getEffectiveConnectionString();
        if (effectiveUri.includes('[YOUR-PASSWORD]')) {
          setSupabaseMessage({
            type: 'error',
            text: 'Please replace "[YOUR-PASSWORD]" with your actual Supabase database password.'
          });
          setConnectingSupabase(false);
          return;
        }
        params = { connectionString: effectiveUri };
      } else {
        if (!supabaseUrl || !supabaseKey) {
          setSupabaseMessage({ type: 'error', text: 'Please enter both Supabase Project URL and API Key.' });
          setConnectingSupabase(false);
          return;
        }
        params = { url: supabaseUrl, key: supabaseKey };
      }

      const res = await api.configureSupabase(params);
      if (res.success) {
        setSupabaseMessage({ type: 'success', text: 'Connected to Supabase Cloud PostgreSQL database!' });
        if (onUpdateDbStatus) onUpdateDbStatus();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setSupabaseMessage({ type: 'error', text: err.message });
    } finally {
      setConnectingSupabase(false);
    }
  };

  const handleSwitchToSqlite = async () => {
    try {
      await api.configureSupabase({});
      setSupabaseMessage({ type: 'success', text: 'Switched back to Local SQLite (WAL Mode).' });
      if (onUpdateDbStatus) onUpdateDbStatus();
      if (onRefresh) onRefresh();
    } catch (err) {
      setSupabaseMessage({ type: 'error', text: err.message });
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to purge all sanitized audit logs? This cannot be undone.')) return;
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
            Database & Cloud Configuration
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Configure Supabase Online PostgreSQL (Transaction Pooler or REST), local SQLite persistence, and zero-knowledge audits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition shadow-subtle"
          >
            <Code2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Supabase SQL Schema</span>
          </button>
          <button
            onClick={onOpenProofModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition shadow-subtle"
          >
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>Audit Zero-PII</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Supabase Online Cloud Card (Top Spotlight) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-heading font-bold text-slate-900">
                  Supabase Cloud Database (Online PostgreSQL)
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                  isSupabaseOnline
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {isSupabaseOnline ? `Connected Online (${dbStatus?.subType || 'SUPABASE'})` : 'Standby (Using Local SQLite)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Target Project: <span className="font-mono text-slate-700">ahgwddljobktbngfwjou (aws-0-ap-southeast-1)</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg border border-purple-200 transition"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Copy supabase_schema.sql</span>
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-mono text-slate-500 font-semibold uppercase">Connection Mode:</span>
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs font-sans">
            <button
              onClick={() => setConnMode('pooler')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                connMode === 'pooler'
                  ? 'bg-white text-purple-700 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PostgreSQL Transaction Pooler (Port 6543)
            </button>
            <button
              onClick={() => setConnMode('rest')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                connMode === 'rest'
                  ? 'bg-white text-purple-700 font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Supabase REST API (HTTPS)
            </button>
          </div>
        </div>

        {/* Tab 1: Transaction Pooler */}
        {connMode === 'pooler' && (
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-mono text-slate-700 mb-1.5 font-semibold flex items-center justify-between">
                <span>Supabase PostgreSQL Pooler URI</span>
                <span className="text-[11px] text-purple-600 font-normal">Transaction Mode: Port 6543</span>
              </label>
              <input
                type="text"
                value={poolerUri}
                onChange={(e) => setPoolerUri(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-700 mb-1.5 font-semibold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-600" />
                <span>Supabase Database Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your database password (replaces [YOUR-PASSWORD])"
                value={dbPassword}
                onChange={(e) => setDbPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 font-sans mt-1 block">
                Found in Supabase: Project Settings &gt; Database &gt; Database Password
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: REST API */}
        {connMode === 'rest' && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1.5 font-semibold">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1.5 font-semibold">
                  Supabase Anon / Service Role API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {supabaseMessage && (
          <div className={`p-3.5 rounded-xl text-xs font-mono flex items-center gap-2 ${
            supabaseMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}>
            {supabaseMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span className="leading-relaxed">{supabaseMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={handleTestSupabase}
            disabled={testingSupabase}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold transition flex items-center gap-1.5"
          >
            {testingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
            <span>{testingSupabase ? 'Testing Connection...' : 'Test Connection'}</span>
          </button>

          <button
            onClick={handleConnectSupabase}
            disabled={connectingSupabase}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-semibold shadow-purple-glow transition flex items-center gap-1.5"
          >
            {connectingSupabase ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            <span>{connectingSupabase ? 'Connecting...' : 'Connect to Supabase Online'}</span>
          </button>

          {isSupabaseOnline && (
            <button
              onClick={handleSwitchToSqlite}
              className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-mono transition"
            >
              Switch Back to Local SQLite
            </button>
          )}
        </div>
      </div>

      {/* Architecture & DB Maintenance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Architecture & Specs */}
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
              <span className="text-slate-500">Active Database:</span>
              <span className={`font-semibold ${isSupabaseOnline ? 'text-emerald-700' : 'text-purple-700'}`}>
                {isSupabaseOnline ? 'Supabase Online (PostgreSQL)' : 'SQLite (Local WAL Mode)'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">PostgreSQL Driver:</span>
              <span className="font-semibold text-slate-800">pg (node-postgres) Pool</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Zero-Storage Audit:</span>
              <span className="font-semibold text-emerald-700">STRICT (Zero Plaintext)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Target Supabase Host:</span>
              <span className="font-semibold text-slate-700">aws-0-ap-southeast-1.pooler.supabase.com</span>
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
                <h3 className="text-sm font-heading font-bold text-slate-900">Database & Audit Controls</h3>
                <p className="text-[11px] text-slate-400">Manage sanitized telemetry records</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans mb-4">
              Export sanitized audit logs for SIEM integration (Splunk, Elastic, Datadog), or purge historical records to reset demonstration stats.
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

      {/* Supabase Schema Modal */}
      <SupabaseSqlModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
}
