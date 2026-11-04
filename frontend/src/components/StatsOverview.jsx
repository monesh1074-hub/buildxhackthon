import React from 'react';
import {
  FileCheck2,
  ShieldAlert,
  Flame,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

export default function StatsOverview({ stats }) {
  const cards = [
    {
      title: 'Total Scans',
      value: stats?.totalScans ?? 0,
      subtitle: 'API requests & inputs evaluated',
      icon: FileCheck2,
      accentBorder: 'border-l-blue-500',
      iconBg: 'bg-blue-50 text-blue-600',
      badge: 'Active Engine',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-100'
    },
    {
      title: 'Sensitive Entities Detected',
      value: stats?.totalEntitiesIntercepted ?? 0,
      subtitle: 'PII tokens safely sanitized',
      icon: ShieldAlert,
      accentBorder: 'border-l-purple-500',
      iconBg: 'bg-purple-50 text-purple-600',
      badge: 'Shielded',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-100'
    },
    {
      title: 'Threats Blocked',
      value: stats?.criticalThreatsBlocked ?? 0,
      subtitle: 'Cards, SSNs & credentials',
      icon: Flame,
      accentBorder: 'border-l-rose-500',
      iconBg: 'bg-rose-50 text-rose-600',
      badge: 'Critical Tier',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-100'
    },
    {
      title: 'Protection Rate',
      value: stats?.leakPreventionRate ?? '100.0%',
      subtitle: 'Zero plaintext stored',
      icon: ShieldCheck,
      accentBorder: 'border-l-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'Zero-Storage',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    {
      title: 'Average Scan Latency',
      value: `${stats?.avgProcessingTimeMs ?? 1.4} ms`,
      subtitle: 'Sub-millisecond inline engine',
      icon: Zap,
      accentBorder: 'border-l-amber-500',
      iconBg: 'bg-amber-50 text-amber-600',
      badge: 'Real-Time',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 border-l-4 ${c.accentBorder} flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  {c.title}
                </span>
                <div className={`p-2 rounded-lg ${c.iconBg}`}>
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
                  {c.value}
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${c.badgeClass}`}>
                  {c.badge}
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 truncate">
              {c.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
