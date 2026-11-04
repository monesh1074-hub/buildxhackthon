import React, { useState, useEffect } from 'react';
import {
  FileCode2,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Download,
  Trash2,
  Zap,
  Lock,
  ArrowRight,
  Code2,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  AlignLeft,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

export default function ScannerInterface({ onScanComplete }) {
  const [content, setContent] = useState('');
  const [maskingMode, setMaskingMode] = useState('partial'); // partial | redaction | tokenization
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch synthetic samples on mount
  useEffect(() => {
    async function loadSamples() {
      try {
        const res = await api.fetchSamples();
        if (res.success && res.data) {
          setSamples(res.data);
          // Set first sample by default
          if (res.data.length > 0) {
            const first = res.data[0];
            setSelectedSampleId(first.id);
            setContent(typeof first.data === 'object' ? JSON.stringify(first.data, null, 2) : first.data);
          }
        }
      } catch (err) {
        console.error('Failed to load samples:', err);
      }
    }
    loadSamples();
  }, []);

  const handleSelectSample = (sampleId) => {
    setSelectedSampleId(sampleId);
    const sample = samples.find(s => s.id === sampleId);
    if (sample) {
      setContent(typeof sample.data === 'object' ? JSON.stringify(sample.data, null, 2) : sample.data);
      setScanResult(null);
      setErrorMessage('');
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(content);
      setContent(JSON.stringify(parsed, null, 2));
      setErrorMessage('');
    } catch {
      setErrorMessage('Input is not valid JSON. Plain text and logs are also fully supported.');
      setTimeout(() => setErrorMessage(''), 3500);
    }
  };

  const handleScan = async () => {
    if (!content || !content.trim()) {
      setErrorMessage('Please provide sample customer data or select a preset to scan.');
      return;
    }

    setIsScanning(true);
    setErrorMessage('');

    try {
      const sample = samples.find(s => s.id === selectedSampleId);
      const title = sample ? sample.name : 'Interactive Data Scan';

      const res = await api.scanData({
        content,
        maskingMode,
        previewTitle: title,
        source: 'web-ui'
      });

      if (res.success) {
        setScanResult(res);
        if (onScanComplete) {
          onScanComplete(res);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error occurred while scanning payload');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopy = () => {
    if (!scanResult?.sanitizedContent) return;
    navigator.clipboard.writeText(scanResult.sanitizedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!scanResult?.sanitizedContent) return;
    const blob = new Blob([scanResult.sanitizedContent], {
      type: scanResult.inputType === 'json' ? 'application/json' : 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacyshield-sanitized-${Date.now()}.${scanResult.inputType === 'json' ? 'json' : 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
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
      {/* Top Controls Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Synthetic Presets Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
            Synthetic Datasets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSample(s.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  selectedSampleId === s.id
                    ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-sm font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {s.name.split(' ')[0]} {s.badge ? `(${s.badge.split(' ')[0]})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Masking Mode Segmented Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
            Masking Policy:
          </span>
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1">
            <button
              onClick={() => setMaskingMode('partial')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                maskingMode === 'partial'
                  ? 'bg-white text-purple-700 font-semibold shadow-sm border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Partial Masking (j***@domain.com, ****-****-****-4444)"
            >
              Partial Mask
            </button>
            <button
              onClick={() => setMaskingMode('redaction')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                maskingMode === 'redaction'
                  ? 'bg-white text-rose-700 font-semibold shadow-sm border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Full Token Redaction ([REDACTED_EMAIL], [REDACTED_CARD])"
            >
              Full Redact
            </button>
            <button
              onClick={() => setMaskingMode('tokenization')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                maskingMode === 'tokenization'
                  ? 'bg-white text-violet-700 font-semibold shadow-sm border border-slate-200/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Pseudonymized Tokenization ([TOKEN_EMAIL_7D3A2B])"
            >
              Tokenize
            </button>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Dual-Pane Developer Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane: Input Raw Payload */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-mono font-semibold text-slate-800 uppercase tracking-wider">
                Raw Input Payload (In-Memory Only)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFormatJson}
                className="text-[11px] font-mono text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 transition shadow-subtle"
                title="Format JSON"
              >
                Prettify JSON
              </button>
              <button
                onClick={() => { setContent(''); setScanResult(null); }}
                className="text-[11px] font-mono text-slate-500 hover:text-rose-600 px-2 py-1 rounded-md bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition flex items-center gap-1 shadow-subtle"
                title="Clear input"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>

          {/* Textarea Editor */}
          <div className="relative flex-1 min-h-[360px] bg-white">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste raw customer payloads, API JSON, or logs here..."
              className="w-full h-full min-h-[360px] p-5 bg-transparent text-slate-800 font-mono text-xs focus:outline-none resize-none leading-relaxed placeholder:text-slate-400"
              spellCheck={false}
            />
          </div>

          {/* Footer Bar with CTA */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero-Storage: Plaintext is never saved to database</span>
            </div>
            <button
              onClick={handleScan}
              disabled={isScanning || !content.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs tracking-wide shadow-purple-glow disabled:opacity-50 transition duration-150 font-sans"
            >
              <Zap className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Sanitizing Payload...' : 'Shield & Sanitize'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Pane: Sanitized Output Payload */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Sanitized Output (Safe for Logs & DB)
              </span>
            </div>
            {scanResult && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="text-[11px] font-mono text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1 shadow-subtle"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-purple-600" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="text-[11px] font-mono text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 transition flex items-center gap-1 shadow-subtle"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Export</span>
                </button>
              </div>
            )}
          </div>

          {/* Sanitized Viewer Body */}
          <div className="relative flex-1 min-h-[360px] bg-slate-50/50">
            {scanResult ? (
              <pre className="w-full h-full min-h-[360px] p-5 text-slate-800 font-mono text-xs overflow-auto leading-relaxed whitespace-pre-wrap select-text">
                {scanResult.sanitizedContent}
              </pre>
            ) : (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mb-3">
                  <FileCode2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-heading font-bold text-slate-800 mb-1">
                  Awaiting Input Interception
                </h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-sans">
                  Click <span className="text-purple-600 font-semibold">"Shield & Sanitize"</span> to process the input through our regex engine and Luhn validation rules.
                </p>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
            {scanResult ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{scanResult.detectionsCount} Entities Masked</span>
                  </span>
                  <span>Latency: <strong className="text-purple-700">{scanResult.processingTimeMs} ms</strong></span>
                </div>
                <span className="text-slate-400">Zero Plaintext Persisted</span>
              </>
            ) : (
              <span>PrivacyShield Engine Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Detection Telemetry & Threat Breakdown (Appears when scan has results) */}
      {scanResult && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-heading font-bold text-slate-900">
                  Detection Telemetry & Threat Classification
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Scan ID: {scanResult.scanId || 'In-Memory Inspection'}
                </span>
              </div>
            </div>

            {/* Risk Level Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-slate-400">Calculated Risk</div>
                <div className="text-sm font-heading font-bold text-slate-900">
                  {scanResult.riskScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-wider ${getSeverityBadgeClass(scanResult.riskLevel)}`}>
                {scanResult.riskLevel} RISK
              </span>
            </div>
          </div>

          {/* Category Badges */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Detected Sensitive Categories ({scanResult.summary?.length || 0}):
            </div>
            <div className="flex flex-wrap gap-2">
              {scanResult.summary && scanResult.summary.length > 0 ? (
                scanResult.summary.map((item, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-mono ${getSeverityBadgeClass(item.severity)}`}
                  >
                    <span className="font-bold">{item.category}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white text-[11px] font-bold border border-slate-200/60">
                      {item.count} found
                    </span>
                    <span className="text-[10px] uppercase font-semibold">
                      [{item.severity}]
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs font-mono text-emerald-700 py-1">
                  Clean payload: Zero sensitive entities detected in this scan.
                </div>
              )}
            </div>
          </div>

          {/* Masked Replacements Breakdown Table */}
          {scanResult.highlights && scanResult.highlights.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2 font-semibold">
                Sanitization Substitutions Applied:
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Rule Name</th>
                      <th className="py-2.5 px-4">Severity</th>
                      <th className="py-2.5 px-4">Safe Masked Output</th>
                      <th className="py-2.5 px-4">Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {scanResult.highlights.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-semibold text-purple-700">{h.category}</td>
                        <td className="py-2.5 px-4 text-slate-500">{h.ruleName}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] border font-semibold ${getSeverityBadgeClass(h.severity)}`}>
                            {h.severity}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium text-emerald-800 bg-emerald-50/50">
                          {h.maskedValue}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">{h.originalLength} chars</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Polished Terminal-Style Preview Window for Sanitized Server Logs */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-card p-5 text-slate-300 font-mono text-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span className="text-white font-bold text-xs font-heading">
              Sanitized Application Log Stream (Zero Leakage)
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold">
            PLAINTEXT LEAKS BLOCKED
          </span>
        </div>

        <div className="space-y-1.5 leading-relaxed overflow-x-auto text-slate-400">
          <div>
            <span className="text-slate-600 select-none">[00:00:01] </span>
            <span className="text-purple-400">[PrivacyShield Audit]</span> Inbound POST /api/scan intercepted
          </div>
          {scanResult ? (
            <>
              <div>
                <span className="text-slate-600 select-none">[00:00:01] </span>
                <span className="text-purple-400">[PrivacyShield Audit]</span> 🛡️ Intercepted {scanResult.detectionsCount} sensitive entities ({scanResult.riskLevel} risk)
              </div>
              <div>
                <span className="text-slate-600 select-none">[00:00:01] </span>
                <span className="text-purple-400">[PrivacyShield Audit]</span> Applied policy: <span className="text-amber-400">{scanResult.maskingMode.toUpperCase()}</span> in {scanResult.processingTimeMs}ms
              </div>
              <div>
                <span className="text-slate-600 select-none">[00:00:01] </span>
                <span className="text-emerald-400">[Safe Log Emission]</span> Payload logged to CloudWatch/Datadog with ZERO customer plaintext!
              </div>
            </>
          ) : (
            <div>
              <span className="text-slate-600 select-none">[00:00:01] </span>
              <span className="text-slate-500">Awaiting scan trigger to stream live sanitized audit telemetry...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
