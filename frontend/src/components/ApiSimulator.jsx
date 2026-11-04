import React, { useState } from 'react';
import {
  Terminal,
  Send,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Server,
  Zap,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  Radio
} from 'lucide-react';
import { api } from '../services/api';

export default function ApiSimulator() {
  const [method, setMethod] = useState('POST');
  const [endpoint, setEndpoint] = useState('/api/v1/customers/sync');
  const [requestBody, setRequestBody] = useState(`{
  "customer_id": "cust_live_88192",
  "full_name": "Alexander Sterling",
  "email": "alex.sterling@meridian-fintech.io",
  "phone": "+1-415-555-0199",
  "ssn": "987-65-4320",
  "billing_card": {
    "card_number": "4111-2222-3333-4444",
    "cvv": "912",
    "expiry": "11/29"
  },
  "ip_address": "198.51.100.88",
  "api_secret": "secret_live_9921401928410294812"
}`);

  const [loading, setLoading] = useState(false);
  const [gatewayResponse, setGatewayResponse] = useState(null);
  const [simulatedLogs, setSimulatedLogs] = useState([]);
  const [copied, setCopied] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setGatewayResponse(null);

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(requestBody);
    } catch {
      alert('Request body must be valid JSON');
      setLoading(false);
      return;
    }

    try {
      const res = await api.simulateGateway(parsedPayload);
      setGatewayResponse(res);

      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const newLogs = [
        `[${timestamp}] [API-GATEWAY] Inbound ${method} request to ${endpoint}`,
        `[${timestamp}] [PRIVACYSHIELD] Ingested raw payload (${requestBody.length} bytes)`,
        `[${timestamp}] [PRIVACYSHIELD] Intercepted ${res.piiEntitiesBlocked} sensitive entities [${res.riskLevel} RISK]`,
        `[${timestamp}] [PRIVACYSHIELD] Sanitized in ${res.latencyMs} ms via Zero-Leakage Pipeline`,
        `[${timestamp}] [MICROSERVICE-DOWNSTREAM] Received clean payload without customer PII`,
        `[${timestamp}] [LOG-SINK] Log record committed: NO plain text credit cards or SSNs written to disk!`
      ];
      setSimulatedLogs(newLogs);
    } catch (err) {
      alert('Gateway error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyClean = () => {
    if (!gatewayResponse?.forwardedPayload) return;
    navigator.clipboard.writeText(JSON.stringify(gatewayResponse.forwardedPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-heading font-bold text-slate-900 uppercase tracking-wider">
              API Gateway & Reverse Proxy Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1 max-w-2xl leading-relaxed">
            Demonstrates how PrivacyShield functions as an inline reverse proxy or Express middleware. When upstream clients submit raw customer payloads, PrivacyShield strips all PII on-the-fly before forwarding safe objects downstream.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-mono font-semibold">
          <Zap className="w-3.5 h-3.5 text-purple-600" />
          <span>Inline Express Middleware</span>
        </div>
      </div>

      {/* Main Request / Response Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Client API Request Console */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-amber-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              Client Ingestion Request (With PII)
            </span>
            <span className="text-[11px] font-mono text-slate-400">HTTP/1.1</span>
          </div>

          {/* Endpoint Bar */}
          <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-200/60 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-purple-600 text-white text-[11px] font-mono font-bold rounded-md">
              {method}
            </span>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="flex-1 bg-transparent border-0 text-xs font-mono text-slate-800 focus:outline-none"
            />
          </div>

          {/* Request Payload Editor */}
          <div className="p-4 flex-1 bg-white">
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={13}
              className="w-full h-full p-2 bg-transparent text-slate-800 font-mono text-xs focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Send CTA */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">
              Target: Express API Proxy (:5000)
            </span>
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-semibold shadow-purple-glow transition"
            >
              <Send className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Proxying...' : 'Dispatch Request'}</span>
            </button>
          </div>
        </div>

        {/* Right: Downstream Clean Microservice Ingestion */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Downstream Microservice Receives (Sanitized)
            </span>
            {gatewayResponse && (
              <button
                onClick={handleCopyClean}
                className="text-[11px] font-mono text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 flex items-center gap-1 shadow-subtle transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-purple-600" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div className="p-4 flex-1 bg-slate-50/50 overflow-auto min-h-[300px]">
            {gatewayResponse ? (
              <pre className="text-slate-800 font-mono text-xs leading-relaxed select-text">
                {JSON.stringify(gatewayResponse.forwardedPayload, null, 2)}
              </pre>
            ) : (
              <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Terminal className="w-10 h-10 mb-2 opacity-40 text-purple-600" />
                <p className="text-xs font-mono">
                  Click "Dispatch Request" to send the payload through the PrivacyShield interceptor.
                </p>
              </div>
            )}
          </div>

          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            {gatewayResponse ? (
              <>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{gatewayResponse.piiEntitiesBlocked} PII Fields Shielded</span>
                </span>
                <span>Latency: {gatewayResponse.latencyMs} ms</span>
              </>
            ) : (
              <span>Proxy Interceptor Listening</span>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Live Log Stream */}
      {simulatedLogs.length > 0 && (
        <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-card p-5 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-bold font-heading text-xs">
                PrivacyShield Inline Engine Audit Log Stream
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">ZERO LEAKAGE CONFIRMED</span>
          </div>

          {simulatedLogs.map((line, i) => (
            <div key={i} className="text-slate-300 leading-relaxed">
              <span className="text-purple-400 select-none">➜ </span>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
