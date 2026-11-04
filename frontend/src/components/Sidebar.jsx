import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Activity,
  History,
  Sliders,
  Terminal,
  Settings,
  Lock,
  X,
  Radio,
  FileCode2
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  stats,
  onOpenProofModal,
  mobileOpen,
  setMobileOpen
}) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Platform summary & status'
    },
    {
      id: 'scanner',
      label: 'Scan & Mask Studio',
      icon: FileCode2,
      badge: 'Live',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Payload masking studio'
    },
    {
      id: 'analytics',
      label: 'Security Analytics',
      icon: Activity,
      count: stats?.totalScans || 0,
      description: 'Threat & category telemetry'
    },
    {
      id: 'history',
      label: 'Audit History',
      icon: History,
      count: stats?.totalScans || 0,
      description: 'Sanitized audit logs'
    },
    {
      id: 'rules',
      label: 'Detection Policies',
      icon: Sliders,
      description: 'Inspection rule definitions'
    },
    {
      id: 'simulator',
      label: 'API Gateway Interceptor',
      icon: Terminal,
      badge: 'Proxy',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Reverse proxy simulation'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Engine & data controls'
    }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5 text-purple-400" strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-bold text-base text-slate-950 tracking-tight">Privacy<span className="text-purple-600">Shield</span></span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    v1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Enterprise API DLP</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* System Status Pill */}
          <div className="mx-4 my-4 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-slate-800">Inline Engine Active</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                100% Zero-Leak
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between font-mono">
              <span>Protection:</span>
              <span className="text-slate-700 font-medium">{stats?.totalEntitiesIntercepted || 0} Entities Shielded</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="px-3 space-y-1 flex-1">
            <div className="px-3 pb-2 pt-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Platform Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (setMobileOpen) setMobileOpen(false);
                  }}
                  className={`w-full group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-purple-50 text-purple-900 font-semibold shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {/* Colored vertical stripe on active item */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-purple-600 rounded-r-full" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                      strokeWidth={1.8}
                    />
                    <span className="tracking-tight">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border font-semibold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                    {item.count !== undefined && !item.badge && (
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-100 group-hover:bg-slate-200/80 px-2 py-0.5 rounded-full transition">
                        {item.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Security Assurance Box */}
          <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-white/10 text-purple-300">
                <Lock className="w-3.5 h-3.5" strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold font-heading">Zero-Storage Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              Sensitive plaintext is scrubbed in-memory. SQLite stores only masked tokens.
            </p>
            <button
              onClick={onOpenProofModal}
              className="w-full py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium font-sans flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Radio className="w-3 h-3 text-purple-200" />
              <span>Verify Storage Integrity</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
