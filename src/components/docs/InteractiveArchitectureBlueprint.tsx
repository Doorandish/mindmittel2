'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Cpu,
  Database,
  FileCode2,
  FileUp,
  HardDrive,
  Landmark,
  Layers,
  Lock,
  Plug,
  Radio,
  Scale,
  Search,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import {
  BLUEPRINT_CONNECTIONS,
  BLUEPRINT_MODULES,
  BLUEPRINT_ZONES,
  getBlueprintModuleById,
  getBlueprintZoneById,
  type BlueprintConnectionSpec,
  type BlueprintIconKey,
  type BlueprintModuleSpec,
  type BlueprintZoneId,
} from '@/system/interactiveBlueprintRegistry';

type InspectorSelection =
  | { kind: 'module'; module: BlueprintModuleSpec }
  | { kind: 'connection'; connection: BlueprintConnectionSpec }
  | null;

function ModuleIcon({
  iconKey,
  className = 'w-4 h-4',
}: {
  iconKey: BlueprintIconKey;
  className?: string;
}) {
  switch (iconKey) {
    case 'shield':
      return <Shield className={className} />;
    case 'lock':
      return <Lock className={className} />;
    case 'plug':
      return <Plug className={className} />;
    case 'file-up':
      return <FileUp className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'search':
      return <Search className={className} />;
    case 'alert-triangle':
      return <AlertTriangle className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'scale':
      return <Scale className={className} />;
    case 'landmark':
      return <Landmark className={className} />;
    case 'database':
      return <Database className={className} />;
    case 'hard-drive':
      return <HardDrive className={className} />;
    case 'radio':
      return <Radio className={className} />;
    case 'activity':
      return <Activity className={className} />;
  }
}

function FlowArrowConnector({
  connections,
  onSelectConnection,
}: {
  connections: BlueprintConnectionSpec[];
  onSelectConnection: (conn: BlueprintConnectionSpec) => void;
}) {
  if (connections.length === 0) return null;

  return (
    <div className="flex flex-col items-center py-2.5 select-none">
      <div className="w-px h-4 bg-slate-300" aria-hidden="true" />
      <div className="flex flex-wrap items-center justify-center gap-2 my-1">
        {connections.map((conn) => (
          <button
            key={conn.id}
            type="button"
            onClick={() => onSelectConnection(conn)}
            className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200/90 text-[11px] font-medium text-slate-600 shadow-xs hover:border-slate-400 hover:text-slate-900 hover:shadow transition-all cursor-pointer"
            title="برای مشاهده جزئیات این جریان داده کلیک کنید"
          >
            <ArrowDown className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
            <span>{conn.labelFa}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center" aria-hidden="true">
        <div className="w-px h-3 bg-slate-300" />
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className="text-slate-400"
        >
          <path d="M5 6L0 0H10L5 6Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

function BlueprintModuleCard({
  mod,
  isSelected,
  onSelect,
}: {
  mod: BlueprintModuleSpec;
  isSelected: boolean;
  onSelect: (mod: BlueprintModuleSpec) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(mod)}
      className={`w-full text-right rounded-2xl border bg-white p-4 sm:p-5 transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
        isSelected
          ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-md'
          : 'border-slate-200/90 shadow-xs hover:border-slate-400 hover:shadow-md'
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <ModuleIcon iconKey={mod.iconKey} className="w-4 h-4" />
          </div>
          <span
            dir="ltr"
            className="text-[11px] font-medium text-slate-400 text-left leading-tight pt-1"
          >
            {mod.subtitleEn}
          </span>
        </div>

        <h4 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug">
          {mod.titleFa}
        </h4>

        <p className="text-xs text-slate-600 leading-relaxed">
          {mod.roleSummaryFa}
        </p>
      </div>

      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-700 transition-colors">
        <span>مشاهده مکانیزم داخلی</span>
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
      </div>
    </button>
  );
}

export function InteractiveArchitectureBlueprint() {
  const [selection, setSelection] = useState<InspectorSelection>(null);

  useEffect(() => {
    if (!selection) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelection(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection]);

  const modulesByZone = useMemo(() => {
    const map = new Map<BlueprintZoneId, BlueprintModuleSpec[]>();
    for (const z of BLUEPRINT_ZONES) {
      map.set(z.id, []);
    }
    for (const m of BLUEPRINT_MODULES) {
      map.get(m.zoneId)?.push(m);
    }
    return map;
  }, []);

  const pipelineTransitions = useMemo(() => {
    const byIds = (ids: string[]) =>
      ids
        .map((id) => BLUEPRINT_CONNECTIONS.find((c) => c.id === id))
        .filter((c): c is BlueprintConnectionSpec => Boolean(c));

    return {
      z0ToZ1: byIds(['conn-guard-to-connectors', 'conn-guard-to-extractor']),
      z1ToZ2: byIds(['conn-connectors-to-chunker', 'conn-extractor-to-chunker']),
      z2ToZ4: byIds(['conn-retriever-to-auditor', 'conn-guard-to-auditor']),
      z4ToZ6: byIds(['conn-regulatory-to-stream', 'conn-audit-to-telemetry']),
    };
  }, []);

  const zone3Connections = useMemo(
    () =>
      BLUEPRINT_CONNECTIONS.filter(
        (c) => c.fromModuleId === 'ai-model-router' || c.toModuleId === 'ai-model-router'
      ),
    []
  );

  const zone5Connections = useMemo(
    () =>
      BLUEPRINT_CONNECTIONS.filter(
        (c) =>
          c.fromModuleId === 'tenant-mongodb-cluster' ||
          c.toModuleId === 'tenant-mongodb-cluster' ||
          c.fromModuleId === 'in-memory-vault-hydration' ||
          c.toModuleId === 'in-memory-vault-hydration'
      ),
    []
  );

  const selectedModuleConnections = useMemo(() => {
    if (!selection || selection.kind !== 'module') {
      return { incoming: [], outgoing: [] };
    }
    const id = selection.module.id;
    return {
      incoming: BLUEPRINT_CONNECTIONS.filter((c) => c.toModuleId === id),
      outgoing: BLUEPRINT_CONNECTIONS.filter((c) => c.fromModuleId === id),
    };
  }, [selection]);

  function renderPipelineZone(zoneId: BlueprintZoneId) {
    const zone = getBlueprintZoneById(zoneId);
    const mods = modulesByZone.get(zoneId) ?? [];
    if (!zone) return null;

    const internalConnections = BLUEPRINT_CONNECTIONS.filter((c) => {
      const from = getBlueprintModuleById(c.fromModuleId);
      const to = getBlueprintModuleById(c.toModuleId);
      return from?.zoneId === zoneId && to?.zoneId === zoneId;
    });

    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white/80 backdrop-blur-[2px] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                dir="ltr"
                className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider"
              >
                {zone.zoneNumber}
              </span>
              <span className="text-slate-300">/</span>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                {zone.titleFa}
              </h3>
            </div>
            <p className="text-xs text-slate-500">{zone.summaryFa}</p>
          </div>
          <span dir="ltr" className="text-[11px] text-slate-400 font-medium">
            {zone.subtitleEn}
          </span>
        </div>

        <div
          className={`grid grid-cols-1 gap-3.5 ${
            mods.length >= 2 ? 'md:grid-cols-2' : ''
          }`}
        >
          {mods.map((mod) => (
            <BlueprintModuleCard
              key={mod.id}
              mod={mod}
              isSelected={
                selection?.kind === 'module' && selection.module.id === mod.id
              }
              onSelect={(m) => setSelection({ kind: 'module', module: m })}
            />
          ))}
        </div>

        {internalConnections.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">
              جریان‌های داخلی این لایه:
            </span>
            {internalConnections.map((conn) => (
              <button
                key={conn.id}
                type="button"
                onClick={() => setSelection({ kind: 'connection', connection: conn })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3 text-slate-400" />
                <span>{conn.labelFa}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderDedicatedHub(
    zoneId: BlueprintZoneId,
    connections: BlueprintConnectionSpec[]
  ) {
    const zone = getBlueprintZoneById(zoneId);
    const mods = modulesByZone.get(zoneId) ?? [];
    if (!zone) return null;

    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-300/90 bg-white/90 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="space-y-1 border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span
              dir="ltr"
              className="text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wider"
            >
              {zone.zoneNumber} · Shared Hub
            </span>
            <span dir="ltr" className="text-[11px] text-slate-400">
              {zone.subtitleEn}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            {zone.titleFa}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {zone.summaryFa}
          </p>
        </div>

        <div className="space-y-3">
          {mods.map((mod) => (
            <BlueprintModuleCard
              key={mod.id}
              mod={mod}
              isSelected={
                selection?.kind === 'module' && selection.module.id === mod.id
              }
              onSelect={(m) => setSelection({ kind: 'module', module: m })}
            />
          ))}
        </div>

        {/* Explicit Directional Connections to/from Pipeline Zones */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-bold text-slate-500">
            اتصالات مستقیم این هاب با سایر لایه‌ها (کلیک برای بررسی):
          </div>
          <div className="space-y-1.5">
            {connections.map((conn) => {
              const fromMod = getBlueprintModuleById(conn.fromModuleId);
              const toMod = getBlueprintModuleById(conn.toModuleId);
              const isActive =
                selection?.kind === 'connection' &&
                selection.connection.id === conn.id;

              return (
                <button
                  key={conn.id}
                  type="button"
                  onClick={() =>
                    setSelection({ kind: 'connection', connection: conn })
                  }
                  className={`w-full text-right px-3 py-2 rounded-xl border text-xs transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50/90 text-slate-700 border-slate-200/80 hover:border-slate-400 hover:bg-white'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold leading-snug">
                      {conn.labelFa}
                    </div>
                    <div
                      className={`text-[10.5px] flex flex-wrap items-center gap-1 ${
                        isActive ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      <span>{fromMod?.titleFa}</span>
                      <ArrowLeft className="w-3 h-3 inline shrink-0" />
                      <span>{toMod?.titleFa}</span>
                    </div>
                  </div>
                  <ArrowLeft
                    className={`w-3.5 h-3.5 shrink-0 mt-1 ${
                      isActive ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Interactive System Architecture Blueprint"
      className="rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage:
          'linear-gradient(to right, rgba(148, 163, 184, 0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.14) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Blueprint Canvas Header */}
      <div className="bg-white/95 border-b border-slate-200/90 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Interactive Living Architecture Blueprint · Zones 0–6
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            نقشه تعاملی معماری سیستم و سازوکار زیر کاپوت
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            روی هر ماژول یا هر فلش ارتباطی کلیک کنید تا پنجره راهنمای فارسی شامل وظیفه، مکانیزم داخلی، آستانه‌ها، مسیرهای پشتیبان و ورودی/خروجی آن باز شود.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
          <span>{BLUEPRINT_ZONES.length} لایه معماری</span>
          <span className="text-slate-300">•</span>
          <span>{BLUEPRINT_MODULES.length} ماژول کلیدی</span>
          <span className="text-slate-300">•</span>
          <span>{BLUEPRINT_CONNECTIONS.length} جریان داده</span>
        </div>
      </div>

      {/* Main Blueprint Grid: Left/Main Pipeline (Zones 0,1,2,4,6) + Dedicated Shared Hubs (Zone 3 & Zone 5) */}
      <div className="p-5 sm:p-7">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Primary Request & Data Processing Pipeline */}
          <div className="xl:col-span-8 flex flex-col">
            {renderPipelineZone('zone-0')}
            <FlowArrowConnector
              connections={pipelineTransitions.z0ToZ1}
              onSelectConnection={(c) =>
                setSelection({ kind: 'connection', connection: c })
              }
            />

            {renderPipelineZone('zone-1')}
            <FlowArrowConnector
              connections={pipelineTransitions.z1ToZ2}
              onSelectConnection={(c) =>
                setSelection({ kind: 'connection', connection: c })
              }
            />

            {renderPipelineZone('zone-2')}
            <FlowArrowConnector
              connections={pipelineTransitions.z2ToZ4}
              onSelectConnection={(c) =>
                setSelection({ kind: 'connection', connection: c })
              }
            />

            {renderPipelineZone('zone-4')}
            <FlowArrowConnector
              connections={pipelineTransitions.z4ToZ6}
              onSelectConnection={(c) =>
                setSelection({ kind: 'connection', connection: c })
              }
            />

            {renderPipelineZone('zone-6')}
          </div>

          {/* Dedicated Cross-Cutting Hubs: Zone 3 (AI Router) & Zone 5 (Database & Dual-Layer Storage) */}
          <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-20">
            {renderDedicatedHub('zone-3', zone3Connections)}
            {renderDedicatedHub('zone-5', zone5Connections)}
          </div>
        </div>
      </div>

      {/* Interactive Persian Inspector Slide-Over Drawer */}
      {selection && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px] print:hidden"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelection(null)}
        >
          <div
            dir="rtl"
            className="w-full max-w-2xl bg-white h-full shadow-2xl border-r border-slate-200 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/80 shrink-0">
              {selection.kind === 'module' ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span dir="ltr" className="font-mono font-semibold">
                      {getBlueprintZoneById(selection.module.zoneId)?.zoneNumber}
                    </span>
                    <span>·</span>
                    <span>
                      {getBlueprintZoneById(selection.module.zoneId)?.titleFa}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {selection.module.titleFa}
                  </h3>
                  <div
                    dir="ltr"
                    className="text-xs font-mono text-slate-500 text-left"
                  >
                    {selection.module.subtitleEn}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-500">
                    بازرس جریان داده و کنترل (Data & Control Flow)
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {selection.connection.labelFa}
                  </h3>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="font-bold text-slate-800">
                      {getBlueprintModuleById(selection.connection.fromModuleId)?.titleFa}
                    </span>
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-800">
                      {getBlueprintModuleById(selection.connection.toModuleId)?.titleFa}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelection(null)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer shrink-0"
                aria-label="بستن پنجره جزئیات"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {selection.kind === 'module' ? (
                <>
                  {/* 1. وظیفه این ماژول چیست؟ */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                      ۱. وظیفه این ماژول چیست؟
                    </h4>
                    <p className="text-xs sm:text-[13.5px] text-slate-700 leading-8">
                      {selection.module.whatItDoesFa}
                    </p>
                  </div>

                  {/* 2. مکانیزم دقیق و منطق داخلی */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                      ۲. مکانیزم دقیق و منطق داخلی
                    </h4>
                    <div className="space-y-3">
                      {selection.module.internalMechanicsFa.map((step, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2"
                        >
                          <div className="text-xs sm:text-sm font-bold text-slate-900">
                            {step.stepTitleFa}
                          </div>
                          <p className="text-xs sm:text-[13px] text-slate-700 leading-7">
                            {step.detailFa}
                          </p>
                          <div
                            dir="ltr"
                            className="pt-2 border-t border-slate-200/70 text-[11px] font-mono text-slate-500 text-left break-all flex items-center gap-1.5"
                          >
                            <FileCode2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span>{step.codeRef}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. ورودی و خروجی‌ها */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                      ۳. ورودی و خروجی‌ها
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-2">
                        <div className="text-xs font-bold text-slate-900">
                          ورودی‌ها (Inputs)
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside leading-relaxed">
                          {selection.module.inputsFa.map((inp, i) => (
                            <li key={i}>{inp}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-2">
                        <div className="text-xs font-bold text-slate-900">
                          خروجی‌ها (Outputs)
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside leading-relaxed">
                          {selection.module.outputsFa.map((out, i) => (
                            <li key={i}>{out}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Related Upstream / Downstream Navigation */}
                  {(selectedModuleConnections.incoming.length > 0 ||
                    selectedModuleConnections.outgoing.length > 0) && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-700">
                        ماژول‌های متصل (برای پرش سریع کلیک کنید):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedModuleConnections.incoming.map((c) => {
                          const fromMod = getBlueprintModuleById(c.fromModuleId);
                          if (!fromMod) return null;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() =>
                                setSelection({ kind: 'module', module: fromMod })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-800 transition-colors cursor-pointer"
                            >
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                              <span>از: {fromMod.titleFa}</span>
                            </button>
                          );
                        })}
                        {selectedModuleConnections.outgoing.map((c) => {
                          const toMod = getBlueprintModuleById(c.toModuleId);
                          if (!toMod) return null;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() =>
                                setSelection({ kind: 'module', module: toMod })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-white transition-colors cursor-pointer"
                            >
                              <span>به: {toMod.titleFa}</span>
                              <ArrowLeft className="w-3 h-3 text-slate-300" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Source Files Reference */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500">
                      فایل‌های مرجع در کدبیس:
                    </div>
                    <div dir="ltr" className="flex flex-wrap gap-1.5">
                      {selection.module.sourceFiles.map((file) => (
                        <code
                          key={file}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700"
                        >
                          {file}
                        </code>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Connection Inspector */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                      ۱. وظیفه این ارتباط چیست؟
                    </h4>
                    <p className="text-xs sm:text-[13.5px] text-slate-700 leading-8">
                      {selection.connection.whatItDoesFa}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                      ۲. مکانیزم دقیق و منطق داخلی انتقال
                    </h4>
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 text-xs sm:text-[13px] text-slate-700 leading-7">
                      {selection.connection.internalMechanicsFa}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                      ۳. ورودی و خروجی این مسیر (مبدا و مقصد)
                    </h4>
                    <div
                      dir="ltr"
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono text-slate-800 text-left"
                    >
                      {selection.connection.payloadSummaryFa}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(() => {
                        const fromMod = getBlueprintModuleById(
                          selection.connection.fromModuleId
                        );
                        const toMod = getBlueprintModuleById(
                          selection.connection.toModuleId
                        );
                        return (
                          <>
                            {fromMod && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelection({ kind: 'module', module: fromMod })
                                }
                                className="text-right rounded-2xl border border-slate-200 bg-white hover:border-slate-400 p-4 space-y-1 transition-colors cursor-pointer"
                              >
                                <div className="text-[11px] text-slate-400">
                                  ماژول مبدا (ارسال‌کننده)
                                </div>
                                <div className="text-xs font-bold text-slate-900">
                                  {fromMod.titleFa}
                                </div>
                              </button>
                            )}
                            {toMod && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelection({ kind: 'module', module: toMod })
                                }
                                className="text-right rounded-2xl border border-slate-200 bg-white hover:border-slate-400 p-4 space-y-1 transition-colors cursor-pointer"
                              >
                                <div className="text-[11px] text-slate-400">
                                  ماژول مقصد (دریافت‌کننده)
                                </div>
                                <div className="text-xs font-bold text-slate-900">
                                  {toMod.titleFa}
                                </div>
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
