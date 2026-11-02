'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
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
import {
  ARCHITECTURE_NODES,
  ARCHITECTURE_EDGES,
  type TechnicalNodeSpec,
} from '@/system/architectureRegistry';
import type { SystemLogEntry, LogLevel } from '@/infrastructure/logging/logger';

export function SystemObservabilityPanel() {
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
    <div className="space-y-5">
      {/* Top Section Header Bar (No Back-to-Home Button — Integrated in Workspace Sidebar) */}
      <div className="bg-white rounded-xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.03)] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h1 className="text-[16px] sm:text-[17px] font-semibold tracking-[-0.02em] text-slate-900">
              System Architecture & Live Telemetry
            </h1>
          </div>
          <p className="text-[12.5px] text-slate-500 mt-0.5">
            Inspect technical architecture specifications or monitor real-time
            SSE server logs.
          </p>
        </div>

        {/* Clean View Switcher */}
        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80 text-[12px] font-medium">
          <button
            type="button"
            onClick={() => setActiveView('topology')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-all ${
              activeView === 'topology'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Architecture Topology
          </button>
          <button
            type="button"
            onClick={() => setActiveView('logs')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeView === 'logs'
                ? 'bg-white text-slate-900 font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live SSE Logs ({logs.length})</span>
          </button>
        </div>
      </div>

      {/* Action Bar for Live Gemini Model Probes */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/85 shadow-[0_1px_2px_rgba(15,23,42,0.02)] rounded-xl px-5 py-3.5">
        <span className="text-[13px] text-slate-700 font-medium">
          Runtime Gemini Model Evaluation Probe:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => triggerDynamicModelEvaluation('fast')}
            className="h-8 px-3 rounded-md text-[12px] font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 transition-colors flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Probe Fast Profile</span>
          </button>
          <button
            type="button"
            onClick={() => triggerDynamicModelEvaluation('reasoning')}
            className="h-8 px-3 rounded-md text-[12px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 transition-colors flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            <span>Probe Reasoning Profile</span>
          </button>
        </div>
      </div>

      {modelTestResult && (
        <div className="px-4 py-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[12.5px] text-emerald-900 flex items-center justify-between gap-4">
          <span className="font-mono break-words font-medium">
            {modelTestResult}
          </span>
          <button
            type="button"
            onClick={() => setModelTestResult(null)}
            className="text-emerald-700 underline font-semibold shrink-0 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW 1: ARCHITECTURE TOPOLOGY & TECHNICAL DEEP-DIVE */}
      {activeView === 'topology' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 5 Columns: Node Selector */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-slate-900 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span>System Nodes</span>
              </h2>
              <span className="text-[11.5px] font-mono text-emerald-700 font-medium">
                ● {ARCHITECTURE_NODES.length} Healthy
              </span>
            </div>

            <div className="space-y-2">
              {ARCHITECTURE_NODES.map((node) => {
                const isSelected = node.id === selectedNode.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNode(node)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-600 shadow-sm'
                        : 'bg-slate-50/60 border-slate-200/85 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold">
                        {node.category}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700 font-medium">
                        ● {node.status}
                      </span>
                    </div>
                    <div className="text-[13.5px] font-semibold tracking-[-0.01em] text-slate-900 mt-1.5 leading-snug">
                      {node.title}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200/80 space-y-2">
              <div className="text-[12px] font-semibold text-slate-600">
                Active Data Channels
              </div>
              {ARCHITECTURE_EDGES.map((edge, idx) => (
                <div
                  key={idx}
                  className="text-[11.5px] font-mono text-slate-600 bg-slate-50/80 px-3 py-1.5 rounded-md border border-slate-200/80 flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="break-all">
                    {edge.from} → {edge.to}
                  </span>
                  <span className="text-blue-600 font-medium">
                    {edge.protocol}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right 7 Columns: High-Readability Technical Deep-Dive (Overflow-Safe) */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 sm:p-6 space-y-5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
              <div>
                <span className="text-[11px] font-mono uppercase text-blue-600 font-semibold">
                  Technical Deep-Dive Specification
                </span>
                <h2 className="text-[17px] sm:text-[18px] font-semibold tracking-[-0.02em] text-slate-900 mt-0.5">
                  {selectedNode.title}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => emitDiagnosticLog('info')}
                  className="h-7 px-2.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[11.5px] font-medium text-slate-700 transition-colors"
                >
                  + Emit INFO
                </button>
                <button
                  type="button"
                  onClick={() => emitDiagnosticLog('warn')}
                  className="h-7 px-2.5 rounded-md bg-amber-100/80 hover:bg-amber-200/80 text-[11.5px] font-medium text-amber-900 transition-colors"
                >
                  + Emit WARN
                </button>
                <button
                  type="button"
                  onClick={() => emitDiagnosticLog('error')}
                  className="h-7 px-2.5 rounded-md bg-rose-100/80 hover:bg-rose-200/80 text-[11.5px] font-medium text-rose-900 transition-colors"
                >
                  + Emit ERROR
                </button>
              </div>
            </div>

            <div className="space-y-4 text-[13px]">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Architectural Pattern</span>
                </h3>
                <p className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 text-slate-800 font-mono text-[12px] break-words">
                  {selectedNode.technical.architecturePattern}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Technology Stack</span>
                  </h3>
                  <ul className="space-y-1 p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 text-slate-700 text-[12.5px] break-words">
                    {selectedNode.technical.stack.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Source File References</span>
                  </h3>
                  <ul className="space-y-1 p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 text-blue-700 font-mono text-[12px] break-all overflow-hidden">
                    {selectedNode.technical.sourceFiles.map((file) => (
                      <li key={file} className="break-all">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>API Contracts & Signatures</span>
                </h3>
                <ul className="space-y-1 p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 text-slate-800 font-mono text-[12px] break-all overflow-hidden">
                  {selectedNode.technical.apiContracts.map((contract) => (
                    <li key={contract} className="break-words">
                      {contract}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-1.5">
                  Data Execution Pipeline
                </h3>
                <p className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 text-slate-700 leading-relaxed break-words">
                  {selectedNode.technical.dataPipeline}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Error Boundaries, Self-Healing & Fallbacks</span>
                </h3>
                <p className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 text-slate-700 leading-relaxed break-words">
                  {selectedNode.technical.errorHandlingAndFallbacks}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-slate-700 font-semibold text-[12.5px]">
                  Environment Variables:
                </span>
                {selectedNode.technical.envVars.length === 0 ? (
                  <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11.5px]">
                    None (Pure Core Module)
                  </span>
                ) : (
                  selectedNode.technical.envVars.map((envVar) => (
                    <span
                      key={envVar}
                      className="px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-mono text-[11.5px] font-medium break-all"
                    >
                      {envVar}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FULL-SCREEN LIVE SSE LOG STREAM CONSOLE */}
      {activeView === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200/85 shadow-[0_1px_3px_rgba(15,23,42,0.03)] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              <h2 className="text-[15.5px] font-semibold tracking-[-0.015em] text-slate-900">
                Live SSE System Log Stream
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Radio className="w-3 h-3 animate-pulse" />
                {isStreamPaused ? 'Paused' : 'Streaming Live'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-[12.5px]">
              <select
                aria-label="Filter Log Level"
                value={levelFilter}
                onChange={(e) =>
                  setLevelFilter(e.target.value as 'all' | LogLevel)
                }
                className="h-8 px-2.5 rounded-md bg-white border border-slate-200/90 text-slate-800 font-medium"
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
                className="h-8 px-3 rounded-md bg-white border border-slate-200/90 text-slate-900 placeholder-slate-400"
              />

              <button
                type="button"
                onClick={() => setIsStreamPaused((prev) => !prev)}
                className="h-8 px-3 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200/90 text-slate-800 font-medium flex items-center gap-1.5"
              >
                {isStreamPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pause</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="h-[420px] overflow-y-auto rounded-lg bg-slate-950 border border-slate-800 p-3.5 font-mono text-xs space-y-2 text-slate-100">
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
                    className="p-2.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <span className="text-slate-400 shrink-0">
                        {entry.timestamp.slice(11, 19)}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10.5px] uppercase font-semibold border shrink-0 ${badgeColor}`}
                      >
                        {entry.level}
                      </span>
                      <span className="text-blue-300 font-medium shrink-0">
                        [{entry.module}]
                      </span>
                      <span className="text-white break-words">
                        {entry.message}
                      </span>
                    </div>
                    {entry.meta && (
                      <span className="text-[11px] text-slate-300 break-all max-w-md">
                        {JSON.stringify(entry.meta)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
