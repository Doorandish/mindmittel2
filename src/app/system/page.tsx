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
      {/* Top Header Bar */}
      <header className="liquid-glass-pill px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h1 className="text-base md:text-lg font-bold text-white">
                MindMittel V2 — System Architecture & Live Telemetry
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-300">
              Inspect technical architecture specifications or monitor real-time
              SSE server logs.
            </p>
          </div>
        </div>

        {/* Clean View Switcher */}
        <div className="flex items-center gap-2 bg-slate-950/70 p-1.5 rounded-full border border-white/15">
          <button
            type="button"
            onClick={() => setActiveView('topology')}
            className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-colors ${
              activeView === 'topology'
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            Architecture Topology
          </button>
          <button
            type="button"
            onClick={() => setActiveView('logs')}
            className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeView === 'logs'
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live SSE Logs ({logs.length})</span>
          </button>
        </div>
      </header>

      {/* Action Bar for Live Gemini Model Probes */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-white/15 rounded-2xl px-5 py-3.5">
        <span className="text-sm text-slate-200 font-medium">
          Runtime Gemini Model Evaluation Probe:
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => triggerDynamicModelEvaluation('fast')}
            className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-200 border border-cyan-400/40 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Probe Fast Profile</span>
          </button>
          <button
            type="button"
            onClick={() => triggerDynamicModelEvaluation('reasoning')}
            className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-indigo-400/15 hover:bg-indigo-400/25 text-indigo-200 border border-indigo-400/40 transition-colors flex items-center gap-2"
          >
            <Cpu className="w-4 h-4" />
            <span>Probe Reasoning Profile</span>
          </button>
        </div>
      </div>

      {modelTestResult && (
        <div className="px-5 py-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-sm text-emerald-100 flex items-center justify-between gap-4">
          <span className="font-mono break-words">{modelTestResult}</span>
          <button
            type="button"
            onClick={() => setModelTestResult(null)}
            className="text-emerald-300 underline font-semibold shrink-0"
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
              <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-cyan-400" />
                <span>System Nodes</span>
              </h2>
              <span className="text-xs text-emerald-300 font-semibold">
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
                        ? 'bg-cyan-400/15 border-cyan-400 shadow-sm'
                        : 'bg-slate-950/60 border-white/15 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-white/10 text-cyan-300 font-semibold">
                        {node.category}
                      </span>
                      <span className="text-xs text-emerald-300 font-medium">
                        ● {node.status}
                      </span>
                    </div>
                    <div className="text-base font-bold text-white mt-2">
                      {node.title}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/15 space-y-2">
              <div className="text-xs md:text-sm font-semibold text-slate-200">
                Active Data Channels
              </div>
              {ARCHITECTURE_EDGES.map((edge, idx) => (
                <div
                  key={idx}
                  className="text-xs font-mono text-slate-200 bg-slate-950/60 px-3 py-2 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="break-all">
                    {edge.from} → {edge.to}
                  </span>
                  <span className="text-cyan-300">{edge.protocol}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Right 7 Columns: High-Readability Technical Deep-Dive (Overflow-Safe) */}
          <GlassCard className="lg:col-span-7 p-6 md:p-8 space-y-6 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
              <div>
                <span className="text-xs font-mono uppercase text-cyan-300 font-semibold">
                  Technical Deep-Dive Specification
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white mt-1">
                  {selectedNode.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => emitDiagnosticLog('info')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                >
                  + Emit INFO
                </button>
                <button
                  type="button"
                  onClick={() => emitDiagnosticLog('warn')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold text-amber-200 transition-colors"
                >
                  + Emit WARN
                </button>
                <button
                  type="button"
                  onClick={() => emitDiagnosticLog('error')}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold text-rose-200 transition-colors"
                >
                  + Emit ERROR
                </button>
              </div>
            </div>

            <div className="space-y-5 text-sm">
              <div>
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Architectural Pattern</span>
                </h3>
                <p className="p-4 rounded-xl bg-slate-950/70 border border-white/15 text-slate-100 font-mono text-xs md:text-sm break-words">
                  {selectedNode.technical.architecturePattern}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Technology Stack</span>
                  </h3>
                  <ul className="space-y-1.5 p-4 rounded-xl bg-slate-950/70 border border-white/15 text-slate-200 break-words">
                    {selectedNode.technical.stack.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Source File References</span>
                  </h3>
                  <ul className="space-y-1.5 p-4 rounded-xl bg-slate-950/70 border border-white/15 text-cyan-300 font-mono text-xs md:text-sm break-all overflow-hidden">
                    {selectedNode.technical.sourceFiles.map((file) => (
                      <li key={file} className="break-all">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>API Contracts & Signatures</span>
                </h3>
                <ul className="space-y-1.5 p-4 rounded-xl bg-slate-950/70 border border-white/15 text-slate-100 font-mono text-xs md:text-sm break-all overflow-hidden">
                  {selectedNode.technical.apiContracts.map((contract) => (
                    <li key={contract} className="break-words">
                      {contract}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2">
                  Data Execution Pipeline
                </h3>
                <p className="p-4 rounded-xl bg-slate-950/70 border border-white/15 text-slate-200 leading-relaxed break-words">
                  {selectedNode.technical.dataPipeline}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Error Boundaries, Self-Healing & Fallbacks</span>
                </h3>
                <p className="p-4 rounded-xl bg-slate-950/70 border border-white/15 text-slate-200 leading-relaxed break-words">
                  {selectedNode.technical.errorHandlingAndFallbacks}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <span className="text-slate-300 font-medium">
                  Environment Variables:
                </span>
                {selectedNode.technical.envVars.length === 0 ? (
                  <span className="px-3 py-1 rounded-lg bg-white/10 text-slate-200 font-mono text-xs">
                    None (Pure Core Module)
                  </span>
                ) : (
                  selectedNode.technical.envVars.map((envVar) => (
                    <span
                      key={envVar}
                      className="px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-200 font-mono text-xs break-all"
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
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg md:text-xl font-bold text-white">
                Live SSE System Log Stream
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
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
                className="px-3.5 py-2 rounded-xl bg-slate-950 border border-white/20 text-white"
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
                className="px-3.5 py-2 rounded-xl bg-slate-950 border border-white/20 text-white placeholder-slate-400"
              />

              <button
                type="button"
                onClick={() => setIsStreamPaused((prev) => !prev)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium flex items-center gap-1.5"
              >
                {isStreamPaused ? (
                  <>
                    <Play className="w-4 h-4 text-emerald-400" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 text-amber-300" />
                    <span>Pause</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="h-[420px] overflow-y-auto rounded-2xl bg-slate-950/90 border border-white/15 p-4 font-mono text-xs md:text-sm space-y-2.5">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-300 py-12 text-center">
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
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span className="text-slate-300 shrink-0">
                        {entry.timestamp.slice(11, 19)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs uppercase font-bold border shrink-0 ${badgeColor}`}
                      >
                        {entry.level}
                      </span>
                      <span className="text-indigo-300 font-semibold shrink-0">
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
