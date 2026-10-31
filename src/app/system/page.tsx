'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Cpu,
  Database,
  FileCode2,
  GitBranch,
  Layers,
  Pause,
  Play,
  Radio,
  ShieldAlert,
  Terminal,
  Zap,
} from 'lucide-react';
import { GlassCard } from '@/components/glass/GlassCard';
import {
  ARCHITECTURE_NODES,
  ARCHITECTURE_EDGES,
  type TechnicalNodeSpec,
} from '@/system/architectureRegistry';
import type { SystemLogEntry, LogLevel } from '@/infrastructure/logging/logger';

export default function SystemObservabilityPage() {
  const [activeView, setActiveView] = useState<'topology' | 'logs'>('topology');
  const [selectedNode, setSelectedNode] = useState<TechnicalNodeSpec>(
    ARCHITECTURE_NODES[1]
  );
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<'all' | LogLevel>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);
  const [modelTestResult, setModelTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isStreamPaused) return;

    const eventSource = new EventSource('/api/system/logs/stream');

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as SystemLogEntry;
        setLogs((prev) => {
          if (prev.some((item) => item.id === parsed.id)) {
            return prev;
          }
          const updated = [...prev, parsed];
          return updated.slice(-150);
        });
      } catch {
        // Ignore malformed frame
      }
    };

    return () => {
      eventSource.close();
    };
  }, [isStreamPaused]);

  async function emitDiagnosticLog(level: LogLevel) {
    await fetch('/api/system/logs/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        module: selectedNode.id,
        message: `Diagnostic ${level.toUpperCase()} probe on node [${selectedNode.title}]`,
        meta: {
          inspectedNode: selectedNode.id,
          apiKey: 'secret_key_auto_redacted_demo',
        },
      }),
    });
    setActiveView('logs');
  }

  async function triggerDynamicModelEvaluation(profile: 'fast' | 'reasoning') {
    const res = await fetch(`/api/ai/models?profile=${profile}`);
    const data = await res.json();
    setModelTestResult(
      `Profile "${profile}" → Selected: ${data.selectedModel?.modelId} (Score: ${data.selectedModel?.score}, Mode: ${data.mode})`
    );
  }

  const filteredLogs = logs.filter((entry) => {
    if (levelFilter !== 'all' && entry.level !== levelFilter) return false;
    if (
      moduleFilter.trim() !== '' &&
      !entry.module.toLowerCase().includes(moduleFilter.toLowerCase()) &&
      !entry.message.toLowerCase().includes(moduleFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header Bar (Clean Enterprise Light Theme) */}
      <header className="liquid-glass-pill px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/"
            className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-colors"
            aria-label="Back to Landing Page"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h1 className="text-base md:text-lg font-extrabold text-slate-900">
                MindMittel V2 — System Architecture & Live Telemetry
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-600">
              Inspect technical architecture specifications or monitor real-time
              SSE server logs.
            </p>
          </div>
        </div>

        {/* Clean View Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveView('topology')}
            className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-colors ${
              activeView === 'topology'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Architecture Topology
          </button>
          <button
            type="button"
            onClick={() => setActiveView('logs')}
            className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeView === 'logs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live SSE Logs ({logs.length})</span>
          </button>
        </div>
      </header>

      {/* Action Bar for Live Gemini Model Probes */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 shadow-sm rounded-2xl px-6 py-4">
        <span className="text-sm text-slate-700 font-semibold">
          Runtime Gemini Model Evaluation Probe:
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => triggerDynamicModelEvaluation('fast')}
            className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Probe Fast Profile</span>
          </button>
          <button
            type="button"
            onClick={() => triggerDynamicModelEvaluation('reasoning')}
            className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-2"
          >
            <Cpu className="w-4 h-4" />
            <span>Probe Reasoning Profile</span>
          </button>
        </div>
      </div>

      {modelTestResult && (
        <div className="px-5 py-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-sm text-emerald-900 flex items-center justify-between gap-4">
          <span className="font-mono break-words font-semibold">
            {modelTestResult}
          </span>
          <button
            type="button"
            onClick={() => setModelTestResult(null)}
            className="text-emerald-700 underline font-bold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW 1: ARCHITECTURE TOPOLOGY & TECHNICAL DEEP-DIVE */}
      {activeView === 'topology' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Columns: Node Selector */}
          <GlassCard className="lg:col-span-5 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base md:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-blue-600" />
                <span>System Nodes</span>
              </h2>
              <span className="text-xs text-emerald-700 font-bold">
                ● {ARCHITECTURE_NODES.length} Healthy
              </span>
            </div>

            <div className="space-y-3">
              {ARCHITECTURE_NODES.map((node) => {
                const isSelected = node.id === selectedNode.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNode(node)}
                    className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                        {node.category}
                      </span>
                      <span className="text-xs text-emerald-700 font-semibold">
                        ● {node.status}
                      </span>
                    </div>
                    <div className="text-base font-bold text-slate-900 mt-2">
                      {node.title}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="text-xs md:text-sm font-bold text-slate-700">
                Active Data Channels
              </div>
              {ARCHITECTURE_EDGES.map((edge, idx) => (
                <div
                  key={idx}
                  className="text-xs font-mono text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="break-all">
                    {edge.from} → {edge.to}
                  </span>
                  <span className="text-blue-700 font-semibold">
                    {edge.protocol}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Right 7 Columns: High-Readability Technical Deep-Dive (Overflow-Safe) */}
          <GlassCard className="lg:col-span-7 p-6 md:p-8 space-y-6 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-blue-600 font-bold">
                  Technical Deep-Dive Specification
                </span>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
                  {selectedNode.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => emitDiagnosticLog('info')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
                >
                  + Emit INFO
                </button>
                <button
                  type="button"
                  onClick={() => emitDiagnosticLog('warn')}
                  className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-xs font-bold text-amber-900 transition-colors"
                >
                  + Emit WARN
                </button>
                <button
                  type="button"
                  onClick={() => emitDiagnosticLog('error')}
                  className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-xs font-bold text-rose-900 transition-colors"
                >
                  + Emit ERROR
                </button>
              </div>
            </div>

            <div className="space-y-5 text-sm">
              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Architectural Pattern</span>
                </h3>
                <p className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs md:text-sm break-words">
                  {selectedNode.technical.architecturePattern}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Technology Stack</span>
                  </h3>
                  <ul className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 break-words">
                    {selectedNode.technical.stack.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Source File References</span>
                  </h3>
                  <ul className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-blue-700 font-mono text-xs md:text-sm break-all overflow-hidden">
                    {selectedNode.technical.sourceFiles.map((file) => (
                      <li key={file} className="break-all">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>API Contracts & Signatures</span>
                </h3>
                <ul className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs md:text-sm break-all overflow-hidden">
                  {selectedNode.technical.apiContracts.map((contract) => (
                    <li key={contract} className="break-words">
                      {contract}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2">
                  Data Execution Pipeline
                </h3>
                <p className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed break-words">
                  {selectedNode.technical.dataPipeline}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Error Boundaries, Self-Healing & Fallbacks</span>
                </h3>
                <p className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed break-words">
                  {selectedNode.technical.errorHandlingAndFallbacks}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <span className="text-slate-700 font-bold">
                  Environment Variables:
                </span>
                {selectedNode.technical.envVars.length === 0 ? (
                  <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs">
                    None (Pure Core Module)
                  </span>
                ) : (
                  selectedNode.technical.envVars.map((envVar) => (
                    <span
                      key={envVar}
                      className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-mono text-xs font-bold break-all"
                    >
                      {envVar}
                    </span>
                  ))
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* VIEW 2: FULL-SCREEN LIVE SSE LOG STREAM CONSOLE */}
      {activeView === 'logs' && (
        <GlassCard className="p-6 md:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg md:text-xl font-extrabold text-slate-900">
                Live SSE System Log Stream
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                {isStreamPaused ? 'Paused' : 'Streaming Live'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <select
                aria-label="Filter Log Level"
                value={levelFilter}
                onChange={(e) =>
                  setLevelFilter(e.target.value as 'all' | LogLevel)
                }
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium"
              >
                <option value="all">All Levels</option>
                <option value="info">INFO only</option>
                <option value="warn">WARN only</option>
                <option value="error">ERROR only</option>
              </select>

              <input
                type="text"
                placeholder="Filter by module or message..."
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400"
              />

              <button
                type="button"
                onClick={() => setIsStreamPaused((prev) => !prev)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold flex items-center gap-1.5"
              >
                {isStreamPaused ? (
                  <>
                    <Play className="w-4 h-4 text-emerald-600" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 text-amber-600" />
                    <span>Pause</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="h-[420px] overflow-y-auto rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs md:text-sm space-y-2.5 text-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-400 py-12 text-center">
                No log entries match the active filter.
              </div>
            ) : (
              filteredLogs.map((entry) => {
                const badgeColor =
                  entry.level === 'error'
                    ? 'text-rose-300 bg-rose-500/20 border-rose-500/40'
                    : entry.level === 'warn'
                    ? 'text-amber-200 bg-amber-500/20 border-amber-500/40'
                    : 'text-cyan-200 bg-cyan-500/20 border-cyan-500/40';

                return (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span className="text-slate-400 shrink-0">
                        {entry.timestamp.slice(11, 19)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs uppercase font-bold border shrink-0 ${badgeColor}`}
                      >
                        {entry.level}
                      </span>
                      <span className="text-blue-300 font-semibold shrink-0">
                        [{entry.module}]
                      </span>
                      <span className="text-white break-words">
                        {entry.message}
                      </span>
                    </div>
                    {entry.meta && (
                      <span className="text-xs text-slate-300 break-all max-w-md">
                        {JSON.stringify(entry.meta)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
