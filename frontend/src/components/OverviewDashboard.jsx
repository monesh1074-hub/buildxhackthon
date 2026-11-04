import React from 'react';
import {
  Shield,
  ShieldCheck,
  Zap,
  Cpu,
  Lock,
  Layers,
  Sliders,
  Terminal,
  Activity,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileCode2,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function OverviewDashboard({ stats, setActiveTab, onOpenProofModal }) {
  const categories = stats?.categoryStats || [];
  const riskDist = stats?.riskDistribution || [];
  const timeline = stats?.timeline || [];
  const totalDetections = stats?.totalEntitiesIntercepted || 1;

  // The 9 Feature Cards (strictly 3 per row on desktop)
  const featureCards = [
    {
      title: 'Real-Time API Scanning',
      desc: 'High-throughput inline inspection pipeline intercepting requests with sub-2 millisecond latency.',
      icon: Zap,
      stripeColor: 'border-l-blue-500',
      iconColor: 'bg-blue-50 text-blue-600',
      actionTab: 'scanner'
    },
    {
      title: 'Context-Aware Detection',
      desc: 'Deep inspection heuristics analyzing JSON keys, nested attributes, and raw text payloads.',
      icon: Cpu,
      stripeColor: 'border-l-cyan-500',
      iconColor: 'bg-cyan-50 text-cyan-600',
      actionTab: 'rules'
    },
    {
      title: 'Intelligent Data Masking',
      desc: 'Configurable policies supporting partial masking, full token redaction, and pseudonymization.',
      icon: Shield,
      stripeColor: 'border-l-purple-500',
      iconColor: 'bg-purple-50 text-purple-600',
      actionTab: 'scanner'
    },
    {
      title: 'Luhn Card Validation',
      desc: 'Algorithmic checksum validation distinguishing verified payment cards from random 16-digit numbers.',
      icon: CheckCircle2,
      stripeColor: 'border-l-emerald-500',
      iconColor: 'bg-emerald-50 text-emerald-600',
      actionTab: 'scanner'
    },
    {
      title: 'Tokenization Engine',
      desc: 'Deterministic cryptographic hash tokens preserving database relational integrity without leaking plain PII.',
      icon: Layers,
      stripeColor: 'border-l-violet-500',
      iconColor: 'bg-violet-50 text-violet-600',
      actionTab: 'scanner'
    },
    {
      title: 'Zero-Plaintext Audit',
      desc: 'Verified guarantee that raw customer sensitive values are never written to disk, SQLite, or log files.',
      icon: Lock,
      stripeColor: 'border-l-amber-500',
      iconColor: 'bg-amber-50 text-amber-600',
      actionTab: 'history'
    },
    {
      title: 'Custom Detection Rules',
      desc: 'Security teams can author corporate regular expression policies with custom severity tiers.',
      icon: Sliders,
      stripeColor: 'border-l-rose-500',
      iconColor: 'bg-rose-50 text-rose-600',
      actionTab: 'rules'
    },
    {
      title: 'API Gateway Protection',
      desc: 'Inline reverse proxy middleware filtering payloads before reaching downstream microservices.',
      icon: Terminal,
      stripeColor: 'border-l-pink-500',
      iconColor: 'bg-pink-50 text-pink-600',
      actionTab: 'simulator'
    },
    {
      title: 'Security Analytics',
      desc: 'Aggregated threat distributions, category histograms, and historical protection telemetry.',
      icon: Activity,
      stripeColor: 'border-l-indigo-500',
      iconColor: 'bg-indigo-50 text-indigo-600',
      actionTab: 'analytics'
    }
  ];

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
    <div className="space-y-8">
      {/* Editorial Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-purple-900 via-slate-900 to-slate-950 p-6 md:p-8 text-white overflow-hidden shadow-card">
        {/* Subtle radial glow background orb */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-purple-200 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>Enterprise Data Loss Prevention System</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white tracking-tight">
              Continuous Protection for Sensitive API & Log Streams
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              PrivacyShield intercepts customer payloads in transit. PII, financial accounts, and secret tokens are masked in-memory before reaching databases, microservices, or third-party log sinks.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('scanner')}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition shadow-purple-glow font-sans"
            >
              <FileCode2 className="w-4 h-4" />
              <span>Launch Scan Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenProofModal}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-medium text-xs flex items-center justify-center gap-2 transition backdrop-blur-md font-sans"
            >
              <Lock className="w-4 h-4 text-purple-300" />
              <span>Verify Zero-Storage</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid: Strictly 3 cards per row on desktop */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-heading font-bold text-slate-900 tracking-tight">
              Core Security Capabilities
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Nine integrated protection modules designed for modern cloud architectures.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">9 Active Modules</span>
        </div>

        {/* 3 Columns on lg/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => setActiveTab(card.actionTab)}
                className={`group bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 border-l-4 ${card.stripeColor} cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className={`p-2.5 rounded-xl ${card.iconColor} transition-transform group-hover:scale-105 duration-200`}>
                      <Icon className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <span className="text-slate-300 group-hover:text-purple-600 transition-colors">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>

                  <h4 className="text-sm font-heading font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    {card.title}
                  </h4>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-sans">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>PrivacyShield Engine</span>
                  <span className="text-purple-600 font-semibold group-hover:underline">Explore</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bento Grid Layout: Telemetry, Category Breakdown & Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bento Column 1: Category Breakdown (Spans 2 columns on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-heading font-bold text-slate-900 tracking-tight">
                  Detection Category Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time classification of intercepted sensitive entities.
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-slate-100 text-slate-600 font-medium">
                {categories.length} Categories Active
              </span>
            </div>

            <div className="space-y-4">
              {categories.length > 0 ? (
                categories.map((c, i) => {
                  const percentage = Math.round((c.total / totalDetections) * 100);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{c.category}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getSeverityBadgeClass(c.severity)}`}>
                            {c.severity}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-900 font-bold">{c.total} intercepted</span>
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
                  No detection metrics recorded yet. Run a scan to populate telemetry.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Real data from SQLite persistence store</span>
            </span>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
            >
              <span>Full Telemetry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bento Column 2: Threat Severity & API Status */}
        <div className="space-y-6">
          {/* Threat Distribution Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-heading font-bold text-slate-900 tracking-tight">
                Threat Severity Distribution
              </h3>
              <Flame className="w-4 h-4 text-rose-500" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => {
                const item = riskDist.find(r => r.risk_level === lvl);
                const count = item ? item.count : 0;
                return (
                  <div
                    key={lvl}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col justify-between"
                  >
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
                      {lvl}
                    </span>
                    <span className="text-xl font-heading font-bold text-slate-900 mt-1">
                      {count}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {lvl === 'CRITICAL' && 'Payment/SSN'}
                      {lvl === 'HIGH' && 'Tokens/IBAN'}
                      {lvl === 'MEDIUM' && 'Email/Phone'}
                      {lvl === 'LOW' && 'IP/Metadata'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Zero-Storage Verification Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-heading font-bold">Zero-Plaintext Guarantee</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
              PrivacyShield's zero-knowledge pipeline guarantees that customer plaintext never touches persistent disk logs or SQLite rows.
            </p>
            <button
              onClick={onOpenProofModal}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Zero-PII In Storage</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

