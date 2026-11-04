import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  Activity,
  ArrowRight,
  Filter,
  Search,
  RotateCcw,
  Play,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Server,
  Layers,
  Radio,
  Sparkles,
  GitFork,
  Eye,
  FileSearch,
  Lock,
  ArrowUpRight,
  RefreshCw,
  Building2,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function DataTimeMachine() {
  const [overviewStats, setOverviewStats] = useState(null);
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeTimeline, setActiveTimeline] = useState(null);
  const [activeImpact, setActiveImpact] = useState(null);
  const [activeJourney, setActiveJourney] = useState(null);

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [demoBanner, setDemoBanner] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeSubTab, setActiveSubTab] = useState('journey'); // 'journey' | 'timeline' | 'incidents'

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, servicesRes, incidentsRes] = await Promise.allSettled([
        api.fetchLineageOverview(),
        api.fetchLineageServices(),
        api.fetchIncidents({ limit: 20 })
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value?.success) {
        setOverviewStats(overviewRes.value.data);
      }
      if (servicesRes.status === 'fulfilled' && servicesRes.value?.success) {
        setServices(servicesRes.value.data);
      }
      if (incidentsRes.status === 'fulfilled' && incidentsRes.value?.success) {
        const incList = incidentsRes.value.data?.incidents || [];
        setIncidents(incList);
        if (incList.length > 0 && !selectedIncident) {
          selectIncident(incList[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load Time Machine data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When an incident is selected, load its detailed timeline and impact report
  const selectIncident = async (inc) => {
    setSelectedIncident(inc);
    try {
      const incId = inc.incident_id || inc.id;
      const [tlRes, impRes, jnyRes] = await Promise.allSettled([
        api.fetchIncidentTimeline(incId),
        api.fetchIncidentImpact(incId),
        inc.trace_id ? api.fetchLineageJourney(inc.trace_id) : Promise.resolve(null)
      ]);

      if (tlRes.status === 'fulfilled' && tlRes.value?.success) {
        setActiveTimeline(tlRes.value.data);
      }
      if (impRes.status === 'fulfilled' && impRes.value?.success) {
        setActiveImpact(impRes.value.data);
      }
      if (jnyRes.status === 'fulfilled' && jnyRes.value?.success) {
        setActiveJourney(jnyRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load incident investigation details:', err);
    }
  };

  // Run Demo Scenario A (Successful Protection)
  const handleRunScenarioA = async () => {
    setSimulating(true);
    try {
      const res = await api.runDemoScenarioA();
      if (res.success && res.data) {
        setActiveJourney(res.data);
        setActiveTimeline({
          timeline: res.data.timeline,
          firstExposure: null,
          totalHops: res.data.totalEvents
        });
        setSelectedIncident(null);
        setActiveImpact(null);
        setActiveSubTab('journey');
        setDemoBanner({
          type: 'success',
          title: 'Scenario A: Successful Protection Verified',
          desc: 'Synthetic customer email (arun.demo@example.com) was detected at Banking API Gateway, transformed with format-preserving masking, and safely delivered.'
        });
        loadData();
      }
    } catch (err) {
      console.error('Scenario A failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Run Demo Scenario B (Simulated Policy Failure & Unauthorized Exposure)
  const handleRunScenarioB = async () => {
    setSimulating(true);
    try {
      const res = await api.runDemoScenarioB();
      if (res.success && res.data) {
        setActiveJourney(res.data.journey);
        const incId = res.data.incidentId;
        setDemoBanner({
          type: 'error',
          title: 'Scenario B: Unauthorized Exposure Incident Triggered',
          desc: 'Policy failure simulated: unmasked customer email crossed perimeter to Third-party Notification Gateway. Time Machine identified earliest breach at 10:00:03.'
        });
        await loadData();
        // Fetch detailed incident
        const incDetails = await api.fetchIncidentDetails(incId);
        if (incDetails?.success && incDetails.data?.incident) {
          selectIncident(incDetails.data.incident);
          setActiveSubTab('journey');
        }
      }
    } catch (err) {
      console.error('Scenario B failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Reset Demo Data
  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demonstration journeys and incidents? Real audit records are preserved.')) return;
    setLoading(true);
    try {
      await api.resetDemoLineage();
      setActiveJourney(null);
      setSelectedIncident(null);
      setActiveTimeline(null);
      setActiveImpact(null);
      setDemoBanner(null);
      await loadData();
    } catch (err) {
      console.error('Reset demo failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update status of current incident
  const handleStatusChange = async (newStatus) => {
    if (!selectedIncident) return;
    try {
      const incId = selectedIncident.incident_id || selectedIncident.id;
      const res = await api.updateIncidentStatus(incId, newStatus);
      if (res.success) {
        setSelectedIncident(prev => ({ ...prev, status: newStatus }));
        loadData();
      }
    } catch (err) {
      console.error('Failed to update incident status:', err);
    }
  };

  // Filtered timeline events
  const timelineEvents = (activeTimeline?.timeline || activeJourney?.timeline || []).filter(evt => {
    if (serviceFilter !== 'ALL' && evt.sourceService !== serviceFilter && evt.destinationService !== serviceFilter) {
      return false;
    }
    if (categoryFilter !== 'ALL' && evt.dataCategory !== categoryFilter) {
      return false;
    }
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'EXPOSURE' && !evt.isExposure) return false;
      if (statusFilter === 'MASKED' && evt.action !== 'MASKED' && evt.action !== 'TOKENIZED') return false;
      if (statusFilter === 'DETECTED' && evt.action !== 'DETECTED') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTrace = evt.traceId?.toLowerCase().includes(q);
      const matchSource = evt.sourceService?.toLowerCase().includes(q);
      const matchDest = evt.destinationService?.toLowerCase().includes(q);
      const matchRoute = evt.apiRoute?.toLowerCase().includes(q);
      const matchCat = evt.dataCategory?.toLowerCase().includes(q);
      if (!matchTrace && !matchSource && !matchDest && !matchRoute && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Header Action Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              Forensic Time Travel Engine Active
            </span>
          </div>
          <h2 className="text-2xl font-heading font-bold text-slate-950 tracking-tight">
            Data Leakage <span className="text-purple-600">Time Machine</span>
          </h2>
          <p className="text-sm text-slate-500 font-sans mt-0.5">
            Reconstruct how sensitive PII travels across API boundaries and pinpoint the earliest confirmed exposure.
          </p>
        </div>

        {/* Demo Controller Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunScenarioA}
            disabled={simulating}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Demonstrate safe end-to-end masking with synthetic customer Arun Kumar"
          >
            <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Scenario A: Protected Masking</span>
          </button>

          <button
            onClick={handleRunScenarioB}
            disabled={simulating}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Simulate policy failure causing unmasked exposure to third-party sink"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Scenario B: Policy Leakage</span>
          </button>

          <button
            onClick={handleResetDemo}
            disabled={loading}
            className="p-2 rounded-xl text-xs text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Reset demo data"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Floating Demo Notice if Active */}
      {demoBanner && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
          demoBanner.type === 'error'
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}>
          {demoBanner.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs font-sans">
            <span className="font-semibold font-heading text-sm block mb-0.5">{demoBanner.title}</span>
            <p className="text-slate-600 font-normal leading-relaxed">{demoBanner.desc}</p>
          </div>
          <button
            onClick={() => setDemoBanner(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-mono px-2 py-1"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* 6 Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase text-slate-500">Tracked Journeys</span>
            <GitFork className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-heading font-bold text-slate-900">
            {overviewStats?.totalTrackedJourneys || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5 flex items-center gap-1">
            <span>Distinct traces</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase text-slate-500">Confirmed Exposures</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-heading font-bold text-rose-600">
            {overviewStats?.confirmedExposures || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">
            Boundary violations
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase text-slate-500">Blocked Transfers</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-heading font-bold text-amber-600">
            {overviewStats?.blockedTransfers || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">
            Intercepted at gateway
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase text-slate-500">Masked Transfers</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-heading font-bold text-emerald-600">
            {overviewStats?.maskedTransfers || 0}
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">
            Zero plaintext leak
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase text-slate-500">Services Online</span>
            <Server className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-heading font-bold text-slate-900">
            {overviewStats?.servicesCount || services.length || 6}
          </div>
          <div className="text-[11px] text-slate-500 font-sans mt-0.5">
            Instrumented nodes
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono font-medium uppercase text-slate-500">Investigations</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-heading font-bold text-slate-900">
            {overviewStats?.activeInvestigations || 0}
          </div>
          <div className="text-[11px] text-purple-600 font-sans mt-0.5 font-medium">
            Active incidents
          </div>
        </div>
      </div>

      {/* Main Investigation & Journey Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Navigation Tabs & Search Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 w-fit">
            <button
              onClick={() => setActiveSubTab('journey')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeSubTab === 'journey'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Data Journey Graph
            </button>
            <button
              onClick={() => setActiveSubTab('timeline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeSubTab === 'timeline'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chronological Timeline ({timelineEvents.length})
            </button>
            <button
              onClick={() => setActiveSubTab('incidents')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                activeSubTab === 'incidents'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Incident Investigations ({incidents.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trace ID, route, service..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
        </div>

        {/* SUB-TAB 1: Data Journey Flow Graph */}
        {activeSubTab === 'journey' && (
          <div className="p-6 space-y-6">
            {/* Active Trace Context Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#F8FAFC] rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-900">
                      Trace: {activeJourney?.traceId || selectedIncident?.trace_id || 'trc-live-stream'}
                    </span>
                    {activeJourney?.hasConfirmedExposure ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                        CONFIRMED EXPOSURE
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        SAFE JOURNEY
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-sans">
                    Total recorded service hops: {activeJourney?.totalEvents || activeJourney?.timeline?.length || 4} &bull; Total journey duration: {activeJourney?.durationMs || 410}ms
                  </span>
                </div>
              </div>

              {activeJourney?.firstExposure && (
                <div className="p-2.5 px-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-sans text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-semibold block font-mono text-[11px]">Earliest Confirmed Breach</span>
                    <span className="text-[11px] text-rose-700">
                      {activeJourney.firstExposure.sourceService} &rarr; {activeJourney.firstExposure.destinationService}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Journey Node Flow */}
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-white shadow-inner relative overflow-hidden">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-6 flex items-center justify-between">
                <span>Microservice Boundary Hop Flow</span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  Live Trace Inspector
                </span>
              </div>

              {/* Node Sequence Visualizer */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                {/* Node 1: Client */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">ORIGIN</span>
                      <Building2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="font-heading font-semibold text-sm text-slate-100">Customer API / App</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Client submits customer inquiry payload.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-300">
                    <span className="text-amber-400">Detected: EMAIL, PHONE</span>
                  </div>
                </div>

                {/* Node 2: Gateway */}
                <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-500/60 transition-all shadow-lg shadow-purple-950/20">
                  <div>
                    <div className="flex items-center justify-between text-xs text-purple-400 mb-2">
                      <span className="font-mono text-[10px] bg-purple-950/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/50">PERIMETER</span>
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                    </div>
                    <h4 className="font-heading font-semibold text-sm text-purple-100">Banking API Gateway</h4>
                    <p className="text-[11px] text-slate-400 mt-1">PrivacyShield policy evaluation & inspection.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-emerald-400">
                    <span>Action: MASKED / ALLOWED</span>
                  </div>
                </div>

                {/* Node 3: Internal CIS */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">INTERNAL</span>
                      <Server className="w-4 h-4 text-blue-400" />
                    </div>
                    <h4 className="font-heading font-semibold text-sm text-slate-100">Customer Info Service</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Authorized internal account data retrieval.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-300">
                    <span>Boundary: TRUSTED_INTERNAL</span>
                  </div>
                </div>

                {/* Node 4: Third Party */}
                <div className={`rounded-2xl p-4 flex flex-col justify-between transition-all ${
                  activeJourney?.hasConfirmedExposure
                    ? 'bg-rose-950/40 border border-rose-500 shadow-lg shadow-rose-950/40 animate-pulse'
                    : 'bg-slate-900/90 border border-slate-800'
                }`}>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        activeJourney?.hasConfirmedExposure
                          ? 'bg-rose-900 text-rose-200 border border-rose-700'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {activeJourney?.hasConfirmedExposure ? 'BREACH SINK' : 'EXTERNAL'}
                      </span>
                      {activeJourney?.hasConfirmedExposure ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <h4 className={`font-heading font-semibold text-sm ${
                      activeJourney?.hasConfirmedExposure ? 'text-rose-200' : 'text-slate-100'
                    }`}>
                      Third-party Notification
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">Untrusted downstream webhook or external sink.</p>
                  </div>
                  <div className={`mt-4 pt-3 border-t text-[11px] font-mono ${
                    activeJourney?.hasConfirmedExposure
                      ? 'border-rose-800 text-rose-300 font-bold'
                      : 'border-slate-800 text-emerald-400'
                  }`}>
                    {activeJourney?.hasConfirmedExposure ? 'CONFIRMED EXPOSURE (UNMASKED)' : 'PROTECTED (MASKED)'}
                  </div>
                </div>
              </div>
            </div>

            {/* First Confirmed Exposure Detailed Breakdown */}
            {activeJourney?.firstExposure && (
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 font-heading font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Earliest Confirmed Unauthorized Exposure Identified</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                    <span className="text-slate-400 text-[11px] block font-mono">Timestamp</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {new Date(activeJourney.firstExposure.earliestTimestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                    <span className="text-slate-400 text-[11px] block font-mono">Offending Hop</span>
                    <span className="font-semibold text-slate-800">
                      {activeJourney.firstExposure.sourceService} &rarr; <span className="text-rose-600">{activeJourney.firstExposure.destinationService}</span>
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                    <span className="text-slate-400 text-[11px] block font-mono">Policy Violated</span>
                    <span className="font-semibold text-slate-800">{activeJourney.firstExposure.policyName}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
                    <span className="text-slate-400 text-[11px] block font-mono">Evidence Confidence</span>
                    <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {activeJourney.firstExposure.evidenceConfidence}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed pt-1">
                  {activeJourney.firstExposure.explanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 2: Chronological Timeline View */}
        {activeSubTab === 'timeline' && (
          <div className="p-6 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-mono font-semibold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>

              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Services</option>
                {services.map(s => (
                  <option key={s.id} value={s.service_name}>{s.service_name}</option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="EMAIL">Email</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="SSN">SSN</option>
                <option value="PHONE">Phone</option>
                <option value="ACCOUNT_NUMBER">Account Number</option>
                <option value="API_KEY">API Key</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Actions</option>
                <option value="EXPOSURE">Confirmed Exposures</option>
                <option value="MASKED">Masked / Tokenized</option>
                <option value="DETECTED">Detected</option>
              </select>

              {(serviceFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  onClick={() => { setServiceFilter('ALL'); setCategoryFilter('ALL'); setStatusFilter('ALL'); }}
                  className="text-purple-600 hover:text-purple-800 text-[11px] font-mono underline ml-auto"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Chronological Event Cards */}
            {timelineEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-mono">
                No lineage events match the current filter criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {timelineEvents.map((evt, idx) => (
                  <div
                    key={evt.eventId || idx}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      evt.isExposure
                        ? 'bg-rose-50/60 border-rose-300 shadow-sm'
                        : evt.action === 'MASKED' || evt.action === 'TOKENIZED'
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                        evt.isExposure
                          ? 'bg-rose-600 text-white'
                          : evt.action === 'MASKED'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {idx + 1}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-heading font-bold text-sm text-slate-900">
                            {evt.sourceService}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`font-heading font-bold text-sm ${evt.isExposure ? 'text-rose-700 font-extrabold' : 'text-slate-900'}`}>
                            {evt.destinationService}
                          </span>

                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
                            evt.isExposure
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : evt.action === 'MASKED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {evt.action}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-sans">
                          <span>Route: <code className="font-mono text-slate-700">{evt.apiRoute}</code></span>
                          <span>Category: <strong className="text-slate-800">{evt.dataCategory}</strong></span>
                          <span>Fingerprint: <code className="font-mono text-[11px] text-purple-700 bg-purple-50 px-1 py-0.5 rounded">{evt.publicFingerprint}</code></span>
                        </div>

                        {evt.explanation && (
                          <p className="text-xs text-slate-600 mt-1.5 italic">
                            {evt.explanation}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-xs font-mono text-slate-400">
                      <div>{new Date(evt.timestamp).toLocaleTimeString()}</div>
                      {evt.hopDeltaMs > 0 && (
                        <div className="text-[11px] text-slate-500">+{evt.hopDeltaMs}ms</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 3: Incident Investigations Panel */}
        {activeSubTab === 'incidents' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Incidents List (Left Column) */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Recorded Incident Logs ({incidents.length})
              </span>
              {incidents.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                  No policy breach incidents recorded yet. Use Demo Scenario B above to generate a forensic leakage test case.
                </div>
              ) : (
                incidents.map((inc) => (
                  <div
                    key={inc.id || inc.incident_id}
                    onClick={() => selectIncident(inc)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedIncident?.incident_id === inc.incident_id || selectedIncident?.id === inc.id
                        ? 'bg-purple-50/60 border-purple-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono font-semibold text-purple-700">
                        {inc.incident_id}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        inc.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>

                    <h5 className="font-heading font-semibold text-xs text-slate-900 line-clamp-1 mb-1">
                      {inc.title}
                    </h5>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans">
                      <span>Trace: <code className="font-mono text-slate-700">{inc.trace_id}</code></span>
                      <span className="font-mono text-[10px] uppercase font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {inc.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Incident Forensic Deep-Dive (Right 2 Columns) */}
            <div className="lg:col-span-2 space-y-4">
              {selectedIncident ? (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {selectedIncident.incident_id}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          Trace: {selectedIncident.trace_id}
                        </span>
                      </div>
                      <h3 className="text-base font-heading font-bold text-slate-950">
                        {selectedIncident.title}
                      </h3>
                    </div>

                    {/* Investigation Status Switcher */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-sans">Status:</span>
                      <select
                        value={selectedIncident.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="INVESTIGATING">INVESTIGATING</option>
                        <option value="CONTAINED">CONTAINED</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </div>
                  </div>

                  {/* Impact Blast Radius Metric Box */}
                  {activeImpact && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[11px] block font-mono">Blast Radius Score</span>
                        <span className="text-lg font-heading font-bold text-rose-600">
                          {activeImpact.blastRadiusScore}/100
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[11px] block font-mono">Affected Services</span>
                        <span className="text-lg font-heading font-bold text-slate-900">
                          {activeImpact.metrics?.affectedServicesCount || 4}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[11px] block font-mono">Leaked Sinks</span>
                        <span className="text-lg font-heading font-bold text-rose-600">
                          {activeImpact.metrics?.confirmedExposedDestinationsCount || 1}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 text-[11px] block font-mono">Neutralized Masked</span>
                        <span className="text-lg font-heading font-bold text-emerald-600">
                          {activeImpact.metrics?.safeMaskedEventsCount || 0}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Expected vs Actual Policy Decision */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider block">
                      Policy Enforcement Discrepancy
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="text-emerald-700 font-semibold block font-mono text-[11px] mb-1">
                          ✓ Expected Security Policy
                        </span>
                        <p className="text-slate-600">
                          Third-party integrations must strictly receive format-preserving masked tokens or redacted values.
                        </p>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-rose-200 bg-rose-50/20">
                        <span className="text-rose-700 font-semibold block font-mono text-[11px] mb-1">
                          ✗ Actual Runtime Action
                        </span>
                        <p className="text-slate-600">
                          Raw unmasked email was forwarded across boundary due to policy filter bypass at dispatch route.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Remediation Action Banner */}
                  {activeImpact?.investigationRecommendation && (
                    <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl text-xs text-purple-950 font-sans flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block font-heading text-[12px]">Forensic Recommendation</span>
                        <p className="text-slate-600 mt-0.5">{activeImpact.investigationRecommendation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs font-mono bg-white rounded-2xl border border-slate-200">
                  Select an incident from the left list to review detailed forensic lineage and impact.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
