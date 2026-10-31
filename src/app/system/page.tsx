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
  const [selectedNode, setSelectedNode] = useState<TechnicalNodeSpec>(
    ARCHITECTURE_NODES[1] // Default to Dynamic Gemini Router
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
  }

  async function triggerDynamicModelEvaluation(profile: 'fast' | 'reasoning') {
    const res = await fetch(`/api/ai/models?profile=${profile}`);
    const data = await res.json();
    setModelTestResult(
      `Profile "${profile}" -> Selected: ${data.selectedModel?.modelId} (Score: ${data.selectedModel?.score}, Mode: ${data.mode})`
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
    <div className="min-h-screen relative px-4 py-6 md:px-8 max-w-7xl mx-auto space-y-6">
      {/* Ambient Background */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      >
        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="liquid-glass-pill px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-slate-200 transition-all"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h1 className="text-sm md:text-base font-bold text-white">
                MindMittel V2 — System Architecture & Live SSE Telemetry
              </h1>
            </div>
            <p className="text-[11px] text-slate-300">
              Click any topology node below to inspect its Technical Deep-Dive
              specification and trigger live diagnostic probes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerDynamicModelEvaluation('fast')}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300 border border-cyan-400/30 transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Probe Fast Model</span>
          </button>
          <button
            type="button"
            onClick={() => triggerDynamicModelEvaluation('reasoning')}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-400/15 hover:bg-indigo-400/25 text-indigo-300 border border-indigo-400/30 transition-all flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Probe Reasoning Model</span>
          </button>
        </div>
      </header>

      {modelTestResult && (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-xs text-emerald-200 flex items-center justify-between">
          <span>{modelTestResult}</span>
          <button
            type="button"
            onClick={() => setModelTestResult(null)}
            className="text-emerald-300 underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Interactive Topology & Technical Deep-Dive Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Columns: Clickable System Topology Nodes */}
        <GlassCard className="lg:col-span-5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-semibold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span>Interactive Architecture Topology</span>
            </h2>
            <span className="text-[11px] text-emerald-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {ARCHITECTURE_NODES.length} Active Nodes
            </span>
          </div>

          <div className="space-y-2.5">
            {ARCHITECTURE_NODES.map((node) => {
              const isSelected = node.id === selectedNode.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNode(node)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-cyan-400/15 border-cyan-400/50 shadow-md'
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-cyan-300">
                      {node.category}
                    </span>
                    <span className="text-[11px] text-emerald-300 font-medium">
                      ● {node.status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-1.5">
                    {node.title}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                    {node.technical.architecturePattern}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Data Flow Edges Summary */}
          <div className="pt-3 border-t border-white/10 space-y-1.5">
            <div className="text-xs font-semibold text-slate-300">
              Active Data Flow Channels
            </div>
            {ARCHITECTURE_EDGES.map((edge, idx) => (
              <div
                key={idx}
                className="text-[11px] font-mono text-slate-300 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center justify-between"
              >
                <span>
                  {edge.from} → {edge.to}
                </span>
                <span className="text-cyan-300">{edge.protocol}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right 7 Columns: Technical Deep-Dive Inspector (English Only) */}
        <GlassCard className="lg:col-span-7 p-5 md:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="text-[11px] font-mono uppercase text-cyan-300">
                Technical Deep-Dive Specification
              </span>
              <h2 className="text-base md:text-lg font-bold text-white">
                {selectedNode.title}
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => emitDiagnosticLog('info')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] text-slate-200 transition-all"
              >
                + Emit INFO
              </button>
              <button
                type="button"
                onClick={() => emitDiagnosticLog('warn')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[11px] text-amber-200 transition-all"
              >
                + Emit WARN
              </button>
              <button
                type="button"
                onClick={() => emitDiagnosticLog('error')}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-[11px] text-rose-200 transition-all"
              >
                + Emit ERROR
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <h3 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Architectural Pattern</span>
              </h3>
              <p className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-200 font-mono">
                {selectedNode.technical.architecturePattern}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Technology Stack</span>
                </h3>
                <ul className="space-y-1 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300">
                  {selectedNode.technical.stack.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Source File References</span>
                </h3>
                <ul className="space-y-1 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-cyan-300 font-mono">
                  {selectedNode.technical.sourceFiles.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>API Contracts & Signatures</span>
              </h3>
              <ul className="space-y-1 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-200 font-mono">
                {selectedNode.technical.apiContracts.map((contract) => (
                  <li key={contract}>{contract}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-1">
                Data Execution Pipeline
              </h3>
              <p className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 leading-relaxed">
                {selectedNode.technical.dataPipeline}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Error Boundaries, Self-Healing & Fallbacks</span>
              </h3>
              <p className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 leading-relaxed">
                {selectedNode.technical.errorHandlingAndFallbacks}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-slate-400">Environment Variables:</span>
              {selectedNode.technical.envVars.length === 0 ? (
                <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                  None (Pure Core Module)
                </span>
              ) : (
                selectedNode.technical.envVars.map((envVar) => (
                  <span
                    key={envVar}
                    className="px-2.5 py-0.5 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 font-mono"
                  >
                    {envVar}
                  </span>
                ))
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Live Server-Sent Events (SSE) Log Console */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm md:text-base font-semibold text-white">
              Live SSE System Log Stream (Ring Buffer · Automatic Secret
              Redaction)
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
              <Radio className="w-3 h-3 animate-pulse" />
              {isStreamPaused ? 'Paused' : 'Live SSE'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              aria-label="Filter Log Level"
              value={levelFilter}
              onChange={(e) =>
                setLevelFilter(e.target.value as 'all' | LogLevel)
              }
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/15 text-slate-200"
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
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/15 text-slate-200 placeholder-slate-400"
            />

            <button
              type="button"
              onClick={() => setIsStreamPaused((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 flex items-center gap-1"
            >
              {isStreamPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-300" />
                  <span>Pause</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="h-64 overflow-y-auto rounded-2xl bg-slate-950/80 border border-white/10 p-3 font-mono text-xs space-y-1.5">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-400 py-8 text-center">
              No log entries match the active filter.
            </div>
          ) : (
            filteredLogs.map((entry) => {
              const badgeColor =
                entry.level === 'error'
                  ? 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                  : entry.level === 'warn'
                  ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                  : 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30';

              return (
                <div
                  key={entry.id}
                  className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-start sm:items-center gap-2">
                    <span className="text-slate-400 text-[11px] shrink-0">
                      {entry.timestamp.slice(11, 19)}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase border ${badgeColor}`}
                    >
                      {entry.level}
                    </span>
                    <span className="text-indigo-300 shrink-0">
                      [{entry.module}]
                    </span>
                    <span className="text-slate-100">{entry.message}</span>
                  </div>
                  {entry.meta && (
                    <span className="text-[10px] text-slate-400 truncate max-w-md">
                      {JSON.stringify(entry.meta)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
}
