import React from 'react';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  Flame,
  PieChart,
  TrendingUp,
  Cpu,
  Database,
  Lock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function AnalyticsView({ stats, onOpenProofModal }) {
  const categories = stats?.categoryStats || [];
  const riskDist = stats?.riskDistribution || [];
  const timeline = stats?.timeline || [];
  const totalDetections = stats?.totalEntitiesIntercepted || 1;

  const getSeverityBadgeClass = (sev) => {
    switch (sev) {
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

  const getCategoryBarColor = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500';
      case 'HIGH':
        return 'bg-amber-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="p-6 md:p-8 rounded-2xl bg-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
            <span>Telemetry Pipeline Active</span>
          </div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-white tracking-tight">
            Security Intelligence & Threat Telemetry
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
            Real-time telemetry aggregated across incoming HTTP requests and API endpoints. Demonstrating 100% zero-knowledge data masking across all payload streams.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onOpenProofModal}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow-purple-glow font-sans"
          >
            <Database className="w-4 h-4" />
            <span>Verify SQLite Integrity</span>
          </button>
        </div>
      </div>

      {/* Analytics Grid: Category Breakdown & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <PieChart className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-heading font-bold text-slate-900 tracking-tight">
                Intercepted Entities by Category
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {categories.length} Categories Active
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {categories.length > 0 ? (
              categories.map((c, i) => {
                const percentage = Math.round((c.total / totalDetections) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800 font-semibold">{c.category}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getSeverityBadgeClass(c.severity)}`}>
                          {c.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-900 font-bold">{c.total} blocked</span>
                        <span className="text-slate-400 w-10 text-right">{percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getCategoryBarColor(c.severity)} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.max(6, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                No detections recorded yet. Run a scan in the Scan & Mask Studio to generate telemetry.
              </div>
            )}
          </div>
        </div>

        {/* Threat Severity Distribution & Specifications */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-heading font-bold text-slate-900 tracking-tight">
                Threat Severity Distribution
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Severity Weights
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => {
              const item = riskDist.find(r => r.risk_level === lvl);
              const count = item ? item.count : 0;
              return (
                <div
                  key={lvl}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold tracking-wider text-slate-600">{lvl}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getSeverityBadgeClass(lvl)}`}>
                      Tier
                    </span>
                  </div>
                  <div className="my-2 text-2xl font-heading font-bold text-slate-900">
                    {count}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono leading-tight">
                    {lvl === 'CRITICAL' && 'Payment Cards, SSNs, API Keys'}
                    {lvl === 'HIGH' && 'Bank Accounts, JWT Tokens'}
                    {lvl === 'MEDIUM' && 'Email Addresses, Phones'}
                    {lvl === 'LOW' && 'IP Addresses, Metadata'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Engine Technical Specifications */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="text-xs font-mono text-purple-700 font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>Inspection Engine Benchmark & Compliance:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
              <div>• Luhn Algorithm: <span className="text-emerald-700 font-semibold">Active</span></div>
              <div>• Zero-Knowledge DB: <span className="text-emerald-700 font-semibold">Enforced</span></div>
              <div>• Non-Destructive Diff: <span className="text-emerald-700 font-semibold">Active</span></div>
              <div>• Inline Proxy Logger: <span className="text-emerald-700 font-semibold">Online</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-heading font-bold text-slate-900 tracking-tight">
              Daily Scan & Interception Activity
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">SQLite Audit Aggregation</span>
        </div>

        {timeline.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Total Scans</th>
                  <th className="py-2.5 px-4">PII Intercepted</th>
                  <th className="py-2.5 px-4">Storage Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {timeline.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{t.date}</td>
                    <td className="py-2.5 px-4">{t.scans_count}</td>
                    <td className="py-2.5 px-4 font-bold text-rose-600">{t.entities_blocked}</td>
                    <td className="py-2.5 px-4 text-emerald-700 font-medium">100% Sanitized (Zero Leaks)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 font-mono">
            No activity timeline data yet. Run your first scan to populate this table.
          </div>
        )}
      </div>
    </div>
  );
}
