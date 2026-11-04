import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Shield,
  Code2,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function RulesManager() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    category: 'CUSTOM_PII',
    severity: 'HIGH',
    pattern: '',
    description: ''
  });
  const [modalError, setModalError] = useState('');

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await api.fetchRules();
      if (res.success && res.data) {
        setRules(res.data);
      }
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (id) => {
    try {
      await api.toggleRule(id);
      setRules(rules.map(r => r.id === id ? { ...r, is_enabled: r.is_enabled === 1 ? 0 : 1 } : r));
    } catch (err) {
      alert('Failed to toggle rule: ' + err.message);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!newRule.name || !newRule.pattern) {
      setModalError('Rule name and regex pattern are required.');
      return;
    }

    try {
      new RegExp(newRule.pattern);
    } catch {
      setModalError('Invalid regular expression pattern syntax.');
      return;
    }

    try {
      const res = await api.createRule(newRule);
      if (res.success) {
        setShowAddModal(false);
        setNewRule({
          name: '',
          category: 'CUSTOM_PII',
          severity: 'HIGH',
          pattern: '',
          description: ''
        });
        loadRules();
      }
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Delete this custom detection rule?')) return;
    try {
      await api.deleteRule(id);
      loadRules();
    } catch (err) {
      alert(err.message);
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-heading font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-600" />
            Inspection Policies & Detection Rules
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Active patterns and mathematical verification algorithms evaluated against all incoming data streams.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadRules}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
            title="Reload Rules"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-purple-glow transition font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Rule</span>
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => {
          const isEnabled = rule.is_enabled === 1;
          return (
            <div
              key={rule.id}
              className={`p-5 rounded-2xl border transition-all ${
                isEnabled
                  ? 'bg-white border-slate-200/90 shadow-sm hover:shadow-card-hover'
                  : 'bg-slate-50 border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-slate-900 text-sm">{rule.name}</h3>
                    {rule.is_custom === 1 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-snug font-sans">{rule.description}</p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(rule.id)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                    isEnabled ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                  title={isEnabled ? 'Click to disable' : 'Click to enable'}
                >
                  <span
                    className={`inline-block w-4 h-4 rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Regex Code Preview */}
              <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 font-mono text-[11px] text-slate-700 truncate">
                <span className="text-slate-400 select-none">Regex: </span>
                {rule.pattern}
              </div>

              {/* Bottom metadata tags */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadgeClass(rule.severity)}`}>
                    {rule.severity}
                  </span>
                  <span className="text-slate-500 text-[11px]">{rule.category}</span>
                </div>

                {rule.is_custom === 1 && (
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-slate-400 hover:text-rose-600 transition"
                    title="Delete custom rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600" />
                Author Custom Detection Rule
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 space-y-4 bg-white">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Employee ID, Confidential Codename"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Category Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BADGE_ID"
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Severity</label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Regular Expression Pattern</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. \\bEMP-[0-9]{5}\\b"
                  value={newRule.pattern}
                  onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-purple-700 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  Standard JavaScript regex format. Escaped backslashes are supported.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-700 mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain what this rule protects..."
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold shadow-purple-glow transition"
                >
                  Save & Enable Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
