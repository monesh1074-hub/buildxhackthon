import React, { useState, useEffect } from 'react';
import {
  Database,
  Copy,
  Check,
  X,
  ExternalLink,
  Code2,
  Terminal,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function SupabaseSqlModal({ isOpen, onClose }) {
  const [sql, setSql] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.fetchSchemaSql()
        .then((res) => {
          if (res.success && res.sql) {
            setSql(res.sql);
          }
        })
        .catch((err) => console.error('Failed to load SQL schema:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!sql) return;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="liquid-glass rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Supabase Online SQL Schema & Migration</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  PostgreSQL
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Paste and execute this in your Supabase project SQL Editor to set up tables, RLS policies, indexes, and RPC stored procedures.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Instructions Banner */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">1.</span>
            <span>Copy this script</span>
            <span className="text-slate-400">→</span>
            <span className="font-bold text-slate-800">2.</span>
            <span>Open Supabase SQL Editor</span>
            <span className="text-slate-400">→</span>
            <span className="font-bold text-slate-800">3.</span>
            <span>Paste and click "Run"</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-800 font-semibold"
            >
              <span>Open Supabase</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy All SQL'}</span>
            </button>
          </div>
        </div>

        {/* Code Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs leading-relaxed text-slate-300">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading Supabase schema script...</div>
          ) : (
            <pre className="select-text whitespace-pre-wrap">{sql}</pre>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">
            Includes scans, scan_detections, detection_rules, RLS policies, verify_zero_storage RPC & seed data.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

