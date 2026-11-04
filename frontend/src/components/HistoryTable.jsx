import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Download,
  RefreshCw,
  AlertTriangle,
  X,
  FileCode2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function HistoryTable() {
  const [scans, setScans] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('ALL');
  const [selectedScanForModal, setSelectedScanForModal] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.fetchHistory({
        search,
        riskLevel: riskLevel === 'ALL' ? '' : riskLevel,
        limit: 50
      });
      if (res.success && res.data) {
        setScans(res.data.scans || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load scan history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [search, riskLevel]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this audit scan record?')) return;
    try {
      await api.deleteScan(id);
      loadHistory();
    } catch (err) {
      alert('Failed to delete scan: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to purge all sanitized audit logs from SQLite?')) return;
    try {
      await api.clearHistory();
      loadHistory();
    } catch (err) {
      alert('Failed to purge history: ' + err.message);
    }
  };

  const getRiskBadgeClass = (level) => {
    switch (level) {
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
      {/* Search & Filter Header Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit records or titles..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition"
          />
        </div>

        {/* Filter Controls & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          <button
            onClick={loadHistory}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
            title="Reload Audit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          {scans.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-mono transition font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Audit</span>
            </button>
          )}
        </div>
      </div>

      {/* Zero Storage Principle Callout */}
      <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center gap-3 text-xs font-sans text-purple-900 shadow-subtle">
        <Lock className="w-4 h-4 text-purple-600 shrink-0" />
        <span className="leading-relaxed">
          <strong>Zero-Knowledge Principle:</strong> Original customer plaintext is strictly never saved to SQLite. Only sanitized results and detection telemetry counters exist in this audit log.
        </span>
      </div>

      {/* History Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5">Title / Source</th>
                <th className="py-3 px-5">Risk Level</th>
                <th className="py-3 px-5">PII Intercepted</th>
                <th className="py-3 px-5">Policy</th>
                <th className="py-3 px-5">Latency</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {scans.length > 0 ? (
                scans.map((scan) => (
                  <tr
                    key={scan.id}
                    onClick={() => setSelectedScanForModal(scan)}
                    className="hover:bg-slate-50/70 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                      {new Date(scan.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{scan.preview_title}</div>
                      <div className="text-[11px] text-slate-400">{scan.source} • {scan.input_type.toUpperCase()}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadgeClass(scan.risk_level)}`}>
                        {scan.risk_level} ({scan.risk_score})
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-rose-600">{scan.total_detections}</span>
                        {scan.detections?.slice(0, 2).map((d, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                            {d.category}
                          </span>
                        ))}
                        {scan.detections?.length > 2 && (
                          <span className="text-[10px] text-slate-400">+{scan.detections.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 uppercase text-purple-700 font-semibold">
                      {scan.masking_mode}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {scan.processing_time_ms} ms
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedScanForModal(scan)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-purple-600 transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(scan.id, e)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-mono">
                    {loading ? 'Querying SQLite audit log...' : 'No audit records match your query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal with Liquid Glass Styling */}
      {selectedScanForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  Audit Record: {selectedScanForModal.preview_title}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {selectedScanForModal.id} • {selectedScanForModal.timestamp}
                </span>
              </div>
              <button
                onClick={() => setSelectedScanForModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 bg-white">
              {/* Metrics pill strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px] uppercase">Risk Assessment</div>
                  <div className="font-bold text-rose-700 mt-0.5">{selectedScanForModal.risk_level} ({selectedScanForModal.risk_score}/100)</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px] uppercase">Entities Shielded</div>
                  <div className="font-bold text-purple-700 mt-0.5">{selectedScanForModal.total_detections} Tokens</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px] uppercase">Masking Policy</div>
                  <div className="font-bold text-slate-800 mt-0.5 uppercase">{selectedScanForModal.masking_mode}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-slate-400 text-[10px] uppercase">Scan Latency</div>
                  <div className="font-bold text-emerald-700 mt-0.5">{selectedScanForModal.processing_time_ms} ms</div>
                </div>
              </div>

              {/* Detections Breakdown */}
              {selectedScanForModal.detections && selectedScanForModal.detections.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
                    Inspection Rules Triggered:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedScanForModal.detections.map((d, i) => (
                      <span key={i} className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5">
                        <span className="font-bold text-purple-700">{d.category}</span>
                        <span className="text-slate-400">×{d.count}</span>
                        <span className="text-[10px] text-rose-600 font-semibold">({d.severity})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stored Sanitized Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="uppercase tracking-wider font-semibold">Persisted Sanitized Content in SQLite:</span>
                  <span className="text-emerald-700 font-medium">✓ Zero Plaintext PII</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap select-text">
                  {selectedScanForModal.sanitized_content}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedScanForModal(null)}
                className="px-5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono font-medium shadow-subtle transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
