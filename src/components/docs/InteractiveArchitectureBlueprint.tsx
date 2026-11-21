'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

type ConnectionFilterMode = 'all' | 'ai-hub' | 'db-hub' | 'pipeline';

interface ZonePalette {
  zoneBox: string;
  zoneHeaderText: string;
  zoneNumberBadge: string;
  cardBorder: string;
  cardSelected: string;
  iconBox: string;
  portDot: string;
  strokeHex: string;
  drawerAccent: string;
}

const ZONE_PALETTES: Record<BlueprintZoneId, ZonePalette> = {
  'zone-0': {
    zoneBox: 'bg-sky-50/75 border-sky-300/85',
    zoneHeaderText: 'text-sky-900',
    zoneNumberBadge: 'text-sky-700 bg-sky-100/90 border-sky-200',
    cardBorder: 'border-sky-200/90 hover:border-sky-400',
    cardSelected: 'border-sky-600 ring-2 ring-sky-500/20 shadow-md',
    iconBox: 'bg-sky-100 text-sky-700 border-sky-200/80',
    portDot: 'bg-sky-500',
    strokeHex: '#0284c7',
    drawerAccent: 'bg-sky-50 border-sky-200 text-sky-900',
  },
  'zone-1': {
    zoneBox: 'bg-teal-50/75 border-teal-300/85',
    zoneHeaderText: 'text-teal-900',
    zoneNumberBadge: 'text-teal-700 bg-teal-100/90 border-teal-200',
    cardBorder: 'border-teal-200/90 hover:border-teal-400',
    cardSelected: 'border-teal-600 ring-2 ring-teal-500/20 shadow-md',
    iconBox: 'bg-teal-100 text-teal-700 border-teal-200/80',
    portDot: 'bg-teal-500',
    strokeHex: '#0d9488',
    drawerAccent: 'bg-teal-50 border-teal-200 text-teal-900',
  },
  'zone-2': {
    zoneBox: 'bg-indigo-50/75 border-indigo-300/85',
    zoneHeaderText: 'text-indigo-900',
    zoneNumberBadge: 'text-indigo-700 bg-indigo-100/90 border-indigo-200',
    cardBorder: 'border-indigo-200/90 hover:border-indigo-400',
    cardSelected: 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md',
    iconBox: 'bg-indigo-100 text-indigo-700 border-indigo-200/80',
    portDot: 'bg-indigo-500',
    strokeHex: '#4f46e5',
    drawerAccent: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  },
  'zone-3': {
    zoneBox: 'bg-violet-50/85 border-violet-300/95 border-dashed',
    zoneHeaderText: 'text-violet-950',
    zoneNumberBadge: 'text-violet-700 bg-violet-100/90 border-violet-200',
    cardBorder: 'border-violet-200/95 hover:border-violet-500',
    cardSelected: 'border-violet-600 ring-2 ring-violet-500/25 shadow-md',
    iconBox: 'bg-violet-100 text-violet-700 border-violet-200/80',
    portDot: 'bg-violet-600',
    strokeHex: '#7c3aed',
    drawerAccent: 'bg-violet-50 border-violet-200 text-violet-950',
  },
  'zone-4': {
    zoneBox: 'bg-amber-50/75 border-amber-300/85',
    zoneHeaderText: 'text-amber-950',
    zoneNumberBadge: 'text-amber-800 bg-amber-100/90 border-amber-200',
    cardBorder: 'border-amber-200/95 hover:border-amber-400',
    cardSelected: 'border-amber-600 ring-2 ring-amber-500/20 shadow-md',
    iconBox: 'bg-amber-100 text-amber-700 border-amber-200/80',
    portDot: 'bg-amber-500',
    strokeHex: '#d97706',
    drawerAccent: 'bg-amber-50 border-amber-200 text-amber-950',
  },
  'zone-5': {
    zoneBox: 'bg-emerald-50/85 border-emerald-300/95 border-dashed',
    zoneHeaderText: 'text-emerald-950',
    zoneNumberBadge: 'text-emerald-700 bg-emerald-100/90 border-emerald-200',
    cardBorder: 'border-emerald-200/95 hover:border-emerald-500',
    cardSelected: 'border-emerald-600 ring-2 ring-emerald-500/25 shadow-md',
    iconBox: 'bg-emerald-100 text-emerald-700 border-emerald-200/80',
    portDot: 'bg-emerald-600',
    strokeHex: '#059669',
    drawerAccent: 'bg-emerald-50 border-emerald-200 text-emerald-950',
  },
  'zone-6': {
    zoneBox: 'bg-rose-50/75 border-rose-300/85',
    zoneHeaderText: 'text-rose-950',
    zoneNumberBadge: 'text-rose-700 bg-rose-100/90 border-rose-200',
    cardBorder: 'border-rose-200/90 hover:border-rose-400',
    cardSelected: 'border-rose-600 ring-2 ring-rose-500/20 shadow-md',
    iconBox: 'bg-rose-100 text-rose-700 border-rose-200/80',
    portDot: 'bg-rose-500',
    strokeHex: '#e11d48',
    drawerAccent: 'bg-rose-50 border-rose-200 text-rose-950',
  },
};

function classifyConnectionGroup(
  conn: BlueprintConnectionSpec
): 'ai-hub' | 'db-hub' | 'pipeline' {
  if (
    conn.fromModuleId === 'ai-model-router' ||
    conn.toModuleId === 'ai-model-router'
  ) {
    return 'ai-hub';
  }
  if (
    conn.fromModuleId === 'tenant-mongodb-cluster' ||
    conn.toModuleId === 'tenant-mongodb-cluster' ||
    conn.fromModuleId === 'in-memory-vault-hydration' ||
    conn.toModuleId === 'in-memory-vault-hydration'
  ) {
    return 'db-hub';
  }
  return 'pipeline';
}

function getConnectionColor(conn: BlueprintConnectionSpec): string {
  const group = classifyConnectionGroup(conn);
  if (group === 'ai-hub') return '#7c3aed'; // Violet for AI Router
  if (group === 'db-hub') return '#059669'; // Emerald for Database & Vault
  const fromMod = getBlueprintModuleById(conn.fromModuleId);
  return fromMod ? ZONE_PALETTES[fromMod.zoneId].strokeHex : '#3b82f6';
}

function RichPersianText({ text }: { text: string }) {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {tokens.map((token, idx) => {
        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
          return (
            <strong key={idx} className="font-extrabold text-slate-950">
              {token.slice(2, -2)}
            </strong>
          );
        }
        if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
          return (
            <code
              key={idx}
              dir="ltr"
              className="inline-block mx-0.5 px-1.5 py-0.5 rounded-md bg-slate-900/5 border border-slate-300/60 font-mono text-[11.5px] text-slate-800 align-baseline"
            >
              {token.slice(1, -1)}
            </code>
          );
        }
        return <React.Fragment key={idx}>{token}</React.Fragment>;
      })}
    </>
  );
}

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

interface ComputedSvgEdge {
  conn: BlueprintConnectionSpec;
  pathD: string;
  midX: number;
  midY: number;
  color: string;
  group: 'ai-hub' | 'db-hub' | 'pipeline';
}

interface BoxRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
}

function FlowArrowConnector({
  connections,
  accentHex,
  onSelectConnection,
}: {
  connections: BlueprintConnectionSpec[];
  accentHex: string;
  onSelectConnection: (conn: BlueprintConnectionSpec) => void;
}) {
  if (connections.length === 0) return null;

  return (
    <div className="flex flex-col items-center py-2 select-none relative z-10">
      <div
        className="w-0.5 h-3.5 rounded-full"
        style={{ backgroundColor: `${accentHex}55` }}
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center justify-center gap-2 my-1">
        {connections.map((conn) => (
          <button
            key={conn.id}
            type="button"
            onClick={() => onSelectConnection(conn)}
            className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border text-[11px] font-semibold text-slate-700 shadow-xs hover:shadow transition-all cursor-pointer"
            style={{ borderColor: `${accentHex}55` }}
            title="برای مشاهده جزئیات این جریان داده کلیک کنید"
          >
            <ArrowDown
              className="w-3 h-3 shrink-0"
              style={{ color: accentHex }}
            />
            <span>{conn.labelFa}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center" aria-hidden="true">
        <div
          className="w-0.5 h-2.5"
          style={{ backgroundColor: `${accentHex}70` }}
        />
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M5 6L0 0H10L5 6Z" fill={accentHex} />
        </svg>
      </div>
    </div>
  );
}

function BlueprintModuleCard({
  mod,
  isSelected,
  isHovered,
  isDimmed,
  registerRef,
  onHover,
  onSelect,
}: {
  mod: BlueprintModuleSpec;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  registerRef: (id: string, el: HTMLButtonElement | null) => void;
  onHover: (id: string | null) => void;
  onSelect: (mod: BlueprintModuleSpec) => void;
}) {
  const palette = ZONE_PALETTES[mod.zoneId];

  return (
    <button
      ref={(el) => registerRef(mod.id, el)}
      type="button"
      onMouseEnter={() => onHover(mod.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(mod)}
      className={`relative z-20 w-full text-right rounded-2xl border bg-white p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 group ${
        isSelected
          ? palette.cardSelected
          : isHovered
          ? `${palette.cardBorder} shadow-md -translate-y-0.5`
          : `${palette.cardBorder} shadow-xs hover:shadow-md`
      } ${isDimmed ? 'opacity-55' : 'opacity-100'}`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${palette.iconBox}`}
            >
              <ModuleIcon iconKey={mod.iconKey} className="w-4 h-4" />
            </div>
            <span
              dir="ltr"
              className="text-[11px] font-medium text-slate-400 text-left leading-tight"
            >
              {mod.subtitleEn}
            </span>
          </div>

          {/* Clean connector port indicator dot matching reference diagram */}
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ring-4 ring-white shadow-xs ${palette.portDot}`}
            aria-hidden="true"
          />
        </div>

        <h4 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug">
          {mod.titleFa}
        </h4>

        <p className="text-xs text-slate-600 leading-relaxed">
          {mod.roleSummaryFa}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-800 transition-colors">
        <span>بررسی مکانیزم داخلی</span>
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
      </div>
    </button>
  );
}

export function InteractiveArchitectureBlueprint() {
  const [selection, setSelection] = useState<InspectorSelection>(null);
  const [hoveredModuleId, setHoveredModuleId] = useState<string | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(
    null
  );
  const [filterMode, setFilterMode] = useState<ConnectionFilterMode>('all');
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  );
  const [svgEdges, setSvgEdges] = useState<ComputedSvgEdge[]>([]);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const registerCardRef = useCallback(
    (id: string, el: HTMLButtonElement | null) => {
      if (el) {
        cardRefs.current.set(id, el);
      } else {
        cardRefs.current.delete(id);
      }
    },
    []
  );

  // Compute live SVG Bezier paths between rendered module cards whenever layout resizes
  const recomputeEdges = useCallback(() => {
    const container = canvasRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    setCanvasSize({ width: cRect.width, height: cRect.height });

    const rects = new Map<string, BoxRect>();
    cardRefs.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      rects.set(id, {
        left: r.left - cRect.left,
        right: r.right - cRect.left,
        top: r.top - cRect.top,
        bottom: r.bottom - cRect.top,
        cx: r.left - cRect.left + r.width / 2,
        cy: r.top - cRect.top + r.height / 2,
        width: r.width,
        height: r.height,
      });
    });

    // Only draw cross-hub curved SVG lines on desktop/wide layout (where hubs sit side-by-side)
    const computed: ComputedSvgEdge[] = [];
    const crossHubConnections = BLUEPRINT_CONNECTIONS.filter((c) => c.isCrossHub);

    crossHubConnections.forEach((conn, idx) => {
      const from = rects.get(conn.fromModuleId);
      const to = rects.get(conn.toModuleId);
      if (!from || !to) return;

      const group = classifyConnectionGroup(conn);
      const color = getConnectionColor(conn);

      // Spread anchor offsets slightly so parallel curves never overlap
      const slotOffset = ((idx % 5) - 2) * 14;

      let x1: number;
      let y1: number;
      let x2: number;
      let y2: number;
      let cx1: number;
      let cy1: number;
      let cx2: number;
      let cy2: number;

      if (from.left > to.right + 16) {
        // Right-to-Left (e.g. Pipeline on Right -> Hub on Left in RTL)
        x1 = from.left;
        y1 = from.cy + slotOffset * 0.45;
        x2 = to.right;
        y2 = to.cy + slotOffset * 0.65;
        const dx = Math.max(48, Math.abs(x1 - x2) * 0.55);
        cx1 = x1 - dx;
        cy1 = y1;
        cx2 = x2 + dx;
        cy2 = y2;
      } else if (to.left > from.right + 16) {
        // Left-to-Right (e.g. Hub on Left -> Pipeline on Right in RTL)
        x1 = from.right;
        y1 = from.cy + slotOffset * 0.65;
        x2 = to.left;
        y2 = to.cy + slotOffset * 0.45;
        const dx = Math.max(48, Math.abs(x2 - x1) * 0.55);
        cx1 = x1 + dx;
        cy1 = y1;
        cx2 = x2 - dx;
        cy2 = y2;
      } else {
        // Vertical fallback when columns stack on smaller viewports
        const goingDown = to.cy >= from.cy;
        x1 = from.cx + slotOffset;
        y1 = goingDown ? from.bottom : from.top;
        x2 = to.cx + slotOffset;
        y2 = goingDown ? to.top : to.bottom;
        const dy = Math.max(40, Math.abs(y2 - y1) * 0.45);
        cx1 = x1;
        cy1 = goingDown ? y1 + dy : y1 - dy;
        cx2 = x2;
        cy2 = goingDown ? y2 - dy : y2 + dy;
      }

      // Cubic Bezier midpoint at t = 0.5
      const midX = 0.125 * x1 + 0.375 * cx1 + 0.375 * cx2 + 0.125 * x2;
      const midY = 0.125 * y1 + 0.375 * cy1 + 0.375 * cy2 + 0.125 * y2;

      computed.push({
        conn,
        pathD: `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cx1.toFixed(
          1
        )} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${x2.toFixed(
          1
        )} ${y2.toFixed(1)}`,
        midX,
        midY,
        color,
        group,
      });
    });

    setSvgEdges(computed);
  }, []);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const rafId = window.requestAnimationFrame(recomputeEdges);
    const ro = new ResizeObserver(() => {
      window.requestAnimationFrame(recomputeEdges);
    });
    ro.observe(container);
    window.addEventListener('resize', recomputeEdges);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', recomputeEdges);
    };
  }, [recomputeEdges]);

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
        (c) =>
          c.fromModuleId === 'ai-model-router' ||
          c.toModuleId === 'ai-model-router'
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

  const activeFocusModuleId =
    hoveredModuleId ??
    (selection?.kind === 'module' ? selection.module.id : null);

  const connectedModuleIdsForFocus = useMemo(() => {
    if (!activeFocusModuleId) return null;
    const set = new Set<string>([activeFocusModuleId]);
    for (const c of BLUEPRINT_CONNECTIONS) {
      if (c.fromModuleId === activeFocusModuleId) set.add(c.toModuleId);
      if (c.toModuleId === activeFocusModuleId) set.add(c.fromModuleId);
    }
    return set;
  }, [activeFocusModuleId]);

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
    const palette = ZONE_PALETTES[zoneId];

    const internalConnections = BLUEPRINT_CONNECTIONS.filter((c) => {
      const from = getBlueprintModuleById(c.fromModuleId);
      const to = getBlueprintModuleById(c.toModuleId);
      return from?.zoneId === zoneId && to?.zoneId === zoneId;
    });

    return (
      <div
        className={`relative z-10 rounded-3xl border-2 p-4 sm:p-5 shadow-xs space-y-4 transition-colors ${palette.zoneBox}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                dir="ltr"
                className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold uppercase tracking-wider ${palette.zoneNumberBadge}`}
              >
                {zone.zoneNumber}
              </span>
              <h3
                className={`text-sm sm:text-base font-extrabold ${palette.zoneHeaderText}`}
              >
                {zone.titleFa}
              </h3>
            </div>
            <p className="text-xs text-slate-600">{zone.summaryFa}</p>
          </div>
          <span
            dir="ltr"
            className="text-[11px] text-slate-500 font-medium opacity-80"
          >
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
              isHovered={hoveredModuleId === mod.id}
              isDimmed={
                Boolean(connectedModuleIdsForFocus) &&
                !connectedModuleIdsForFocus?.has(mod.id)
              }
              registerRef={registerCardRef}
              onHover={setHoveredModuleId}
              onSelect={(m) => setSelection({ kind: 'module', module: m })}
            />
          ))}
        </div>

        {internalConnections.length > 0 && (
          <div className="pt-2 border-t border-black/5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">
              جریان داخلی:
            </span>
            {internalConnections.map((conn) => (
              <button
                key={conn.id}
                type="button"
                onClick={() =>
                  setSelection({ kind: 'connection', connection: conn })
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-slate-200 text-[11px] font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft
                  className="w-3 h-3"
                  style={{ color: palette.strokeHex }}
                />
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
    const palette = ZONE_PALETTES[zoneId];

    return (
      <div
        className={`relative z-10 rounded-3xl border-2 p-4 sm:p-5 shadow-xs space-y-4 ${palette.zoneBox}`}
      >
        <div className="space-y-1.5 border-b border-black/5 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              dir="ltr"
              className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold uppercase tracking-wider ${palette.zoneNumberBadge}`}
            >
              {zone.zoneNumber} · Shared Hub
            </span>
            <span dir="ltr" className="text-[11px] text-slate-500 font-medium">
              {zone.subtitleEn}
            </span>
          </div>
          <h3
            className={`text-sm sm:text-base font-extrabold ${palette.zoneHeaderText}`}
          >
            {zone.titleFa}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
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
              isHovered={hoveredModuleId === mod.id}
              isDimmed={
                Boolean(connectedModuleIdsForFocus) &&
                !connectedModuleIdsForFocus?.has(mod.id)
              }
              registerRef={registerCardRef}
              onHover={setHoveredModuleId}
              onSelect={(m) => setSelection({ kind: 'module', module: m })}
            />
          ))}
        </div>

        {/* Clickable Legend of Direct Hub Links */}
        <div className="pt-3 border-t border-black/5 space-y-2">
          <div className="text-[11px] font-bold text-slate-600">
            خطوط اتصال فعال ({connections.length} مسیر — کلیک برای بررسی):
          </div>
          <div className="space-y-1.5">
            {connections.map((conn) => {
              const fromMod = getBlueprintModuleById(conn.fromModuleId);
              const toMod = getBlueprintModuleById(conn.toModuleId);
              const isActive =
                (selection?.kind === 'connection' &&
                  selection.connection.id === conn.id) ||
                hoveredConnectionId === conn.id;

              return (
                <button
                  key={conn.id}
                  type="button"
                  onMouseEnter={() => setHoveredConnectionId(conn.id)}
                  onMouseLeave={() => setHoveredConnectionId(null)}
                  onClick={() =>
                    setSelection({ kind: 'connection', connection: conn })
                  }
                  className={`w-full text-right px-3 py-2 rounded-xl border text-xs transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white/90 text-slate-700 border-black/10 hover:bg-white hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold leading-snug flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: isActive
                            ? '#ffffff'
                            : palette.strokeHex,
                        }}
                      />
                      <span>{conn.labelFa}</span>
                    </div>
                    <div
                      className={`text-[10.5px] flex flex-wrap items-center gap-1 pr-3.5 ${
                        isActive ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <span>{fromMod?.titleFa}</span>
                      <ArrowLeft className="w-3 h-3 inline shrink-0" />
                      <span>{toMod?.titleFa}</span>
                    </div>
                  </div>
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
      style={{
        fontFamily: "'Vazirmatn', 'Inter', Tahoma, sans-serif",
        backgroundColor: '#f8fafc',
        backgroundImage:
          'linear-gradient(to right, rgba(148, 163, 184, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.16) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
      className="rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
    >
      {/* Blueprint Header + Interactive Connection Filter Bar */}
      <div className="bg-white/95 border-b border-slate-200/90 px-6 py-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div
              dir="ltr"
              className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 font-bold text-right"
            >
              Interactive Living Architecture Blueprint · Zones 0–6
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              نقشه تعاملی معماری سیستم و اتصالات زنده
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              ماوس را روی هر ماژول ببرید تا خطوط اتصال آن به{' '}
              <span className="font-bold text-violet-700">مسیریاب هوش مصنوعی</span>{' '}
              و{' '}
              <span className="font-bold text-emerald-700">پایگاه داده ایزوله</span>{' '}
              روشن شوند؛ با کلیک روی هر کارت یا خط اتصال، توضیحات کامل فارسی باز می‌شود.
            </p>
          </div>

          {/* Interactive Connection Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 print:hidden">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              همه اتصالات
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('ai-hub')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                filterMode === 'ai-hub'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-violet-700 hover:bg-violet-100/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>اتصالات هوش مصنوعی (AI)</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('db-hub')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                filterMode === 'db-hub'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-100/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>اتصالات پایگاه داده (DB)</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pipeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'pipeline'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-sky-700 hover:bg-sky-100/70'
              }`}
            >
              فقط جریان اصلی
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Blueprint Canvas with Live Curved SVG Bezier Connector Layer */}
      <div ref={canvasRef} className="relative p-5 sm:p-7">
        {/* Real-Time Curved SVG Overlay for AI Router (Violet) & Database (Emerald) Connections */}
        {canvasSize.width > 0 && canvasSize.height > 0 && (
          <svg
            width={canvasSize.width}
            height={canvasSize.height}
            viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
            className="hidden xl:block absolute inset-0 pointer-events-none z-15 overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="mm-arrow-violet"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#7c3aed" />
              </marker>
              <marker
                id="mm-arrow-emerald"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#059669" />
              </marker>
            </defs>

            {svgEdges.map(({ conn, pathD, midX, midY, color, group }) => {
              const hiddenByFilter =
                filterMode === 'pipeline' ||
                (filterMode === 'ai-hub' && group !== 'ai-hub') ||
                (filterMode === 'db-hub' && group !== 'db-hub');

              if (hiddenByFilter) return null;

              const isFocusedByModule =
                activeFocusModuleId !== null &&
                (conn.fromModuleId === activeFocusModuleId ||
                  conn.toModuleId === activeFocusModuleId);
              const isSelectedConn =
                (selection?.kind === 'connection' &&
                  selection.connection.id === conn.id) ||
                hoveredConnectionId === conn.id;

              const isHighlighted = isFocusedByModule || isSelectedConn;
              const isDimmed =
                (activeFocusModuleId !== null || hoveredConnectionId !== null) &&
                !isHighlighted;

              const markerUrl =
                group === 'ai-hub'
                  ? 'url(#mm-arrow-violet)'
                  : 'url(#mm-arrow-emerald)';

              return (
                <g key={conn.id} className="transition-opacity duration-200">
                  {/* Wide invisible clickable hit target */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    className="pointer-events-auto cursor-pointer"
                    onMouseEnter={() => setHoveredConnectionId(conn.id)}
                    onMouseLeave={() => setHoveredConnectionId(null)}
                    onClick={() =>
                      setSelection({ kind: 'connection', connection: conn })
                    }
                  />

                  {/* Visible curved dashed Bezier line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHighlighted ? 3 : 2}
                    strokeDasharray={isHighlighted ? '8 4' : '6 5'}
                    strokeOpacity={isDimmed ? 0.14 : isHighlighted ? 0.95 : 0.62}
                    markerEnd={markerUrl}
                    className={
                      isHighlighted ? 'blueprint-animated-edge' : undefined
                    }
                  />

                  {/* Clickable Midpoint Node Dot (matching reference diagram) */}
                  <g
                    transform={`translate(${midX}, ${midY})`}
                    className="pointer-events-auto cursor-pointer"
                    opacity={isDimmed ? 0.18 : 1}
                    onMouseEnter={() => setHoveredConnectionId(conn.id)}
                    onMouseLeave={() => setHoveredConnectionId(null)}
                    onClick={() =>
                      setSelection({ kind: 'connection', connection: conn })
                    }
                  >
                    <circle
                      r={isHighlighted ? 9 : 7}
                      fill="#ffffff"
                      stroke={color}
                      strokeWidth={2}
                    />
                    <circle r={3} fill={color} />
                  </g>
                </g>
              );
            })}
          </svg>
        )}

        {/* Main Blueprint Grid: Primary Pipeline (8 cols) + Dedicated AI & DB Hubs (4 cols) with wide arrow highway */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-14 items-start">
          {/* Primary Request & Data Processing Pipeline */}
          <div className="xl:col-span-8 flex flex-col">
            {renderPipelineZone('zone-0')}
            <FlowArrowConnector
              connections={pipelineTransitions.z0ToZ1}
              accentHex={ZONE_PALETTES['zone-0'].strokeHex}
              onSelectConnection={(c) =>
                setSelection({ kind: 'connection', connection: c })
              }
            />

            {renderPipelineZone('zone-1')}
            <FlowArrowConnector
              connections={pipelineTransitions.z1ToZ2}
              accentHex={ZONE_PALETTES['zone-1'].strokeHex}
              onSelectConnection={(c) =>
                setSelection({ kind: 'connection', connection: c })
              }
            />

            {renderPipelineZone('zone-2')}
            <FlowArrowConnector
              connections={pipelineTransitions.z2ToZ4}
              accentHex={ZONE_PALETTES['zone-2'].strokeHex}
              onSelectConnection={(c) =>
                setSelection({ kind: 'connection', connection: c })
              }
            />

            {renderPipelineZone('zone-4')}
            <FlowArrowConnector
              connections={pipelineTransitions.z4ToZ6}
              accentHex={ZONE_PALETTES['zone-4'].strokeHex}
              onSelectConnection={(c) =>
                setSelection({ kind: 'connection', connection: c })
              }
            />

            {renderPipelineZone('zone-6')}
          </div>

          {/* Dedicated Cross-Cutting Hubs: Zone 3 (AI Router) & Zone 5 (Database & Dual-Layer Storage) */}
          <div className="xl:col-span-4 space-y-8 pt-2">
            {renderDedicatedHub('zone-3', zone3Connections)}
            {renderDedicatedHub('zone-5', zone5Connections)}
          </div>
        </div>
      </div>

      {/* Interactive Persian Inspector Slide-Over Drawer */}
      {selection && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/45 backdrop-blur-[2px] print:hidden"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelection(null)}
        >
          <div
            dir="rtl"
            style={{ fontFamily: "'Vazirmatn', 'Inter', Tahoma, sans-serif" }}
            className="w-full max-w-2xl bg-white h-full shadow-2xl border-r border-slate-200 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/90 shrink-0">
              {selection.kind === 'module' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      dir="ltr"
                      className={`px-2 py-0.5 rounded-md border font-mono font-bold ${
                        ZONE_PALETTES[selection.module.zoneId].zoneNumberBadge
                      }`}
                    >
                      {getBlueprintZoneById(selection.module.zoneId)?.zoneNumber}
                    </span>
                    <span className="text-slate-600 font-medium">
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
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-indigo-600">
                    بازرس جریان داده و کنترل (Data & Control Flow)
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {selection.connection.labelFa}
                  </h3>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="font-bold text-slate-900">
                      {
                        getBlueprintModuleById(selection.connection.fromModuleId)
                          ?.titleFa
                      }
                    </span>
                    <ArrowLeft className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-bold text-slate-900">
                      {
                        getBlueprintModuleById(selection.connection.toModuleId)
                          ?.titleFa
                      }
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
                  <div
                    className={`rounded-2xl border p-4 space-y-2 ${
                      ZONE_PALETTES[selection.module.zoneId].drawerAccent
                    }`}
                  >
                    <h4 className="text-sm font-extrabold">
                      ۱. وظیفه این ماژول چیست؟
                    </h4>
                    <p className="text-xs sm:text-[13.5px] leading-8 opacity-95">
                      <RichPersianText text={selection.module.whatItDoesFa} />
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
                          className="rounded-2xl border border-slate-200/90 bg-slate-50/75 p-4 space-y-2"
                        >
                          <div className="text-xs sm:text-sm font-bold text-slate-900">
                            {step.stepTitleFa}
                          </div>
                          <p className="text-xs sm:text-[13px] text-slate-700 leading-8">
                            <RichPersianText text={step.detailFa} />
                          </p>
                          <div
                            dir="ltr"
                            className="pt-2 border-t border-slate-200/70 text-[11px] font-mono text-indigo-700 text-left break-all flex items-center gap-1.5"
                          >
                            <FileCode2 className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
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
                      <div className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-4 space-y-2">
                        <div className="text-xs font-bold text-sky-900">
                          ورودی‌ها (Inputs)
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside leading-relaxed">
                          {selection.module.inputsFa.map((inp, i) => (
                            <li key={i}>
                              <RichPersianText text={inp} />
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 space-y-2">
                        <div className="text-xs font-bold text-emerald-900">
                          خروجی‌ها (Outputs)
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside leading-relaxed">
                          {selection.module.outputsFa.map((out, i) => (
                            <li key={i}>
                              <RichPersianText text={out} />
                            </li>
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs text-white transition-colors cursor-pointer"
                            >
                              <span>به: {toMod.titleFa}</span>
                              <ArrowLeft className="w-3 h-3 text-indigo-200" />
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
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-2 text-indigo-950">
                    <h4 className="text-sm font-extrabold">
                      ۱. وظیفه این ارتباط چیست؟
                    </h4>
                    <p className="text-xs sm:text-[13.5px] leading-8">
                      <RichPersianText text={selection.connection.whatItDoesFa} />
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                      ۲. مکانیزم دقیق و منطق داخلی انتقال
                    </h4>
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/75 p-4 text-xs sm:text-[13px] text-slate-700 leading-8">
                      <RichPersianText
                        text={selection.connection.internalMechanicsFa}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                      ۳. ورودی و خروجی این مسیر (مبدا و مقصد)
                    </h4>
                    <div
                      dir="ltr"
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono text-indigo-800 text-left"
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
                                className={`text-right rounded-2xl border bg-white p-4 space-y-1 transition-all cursor-pointer ${
                                  ZONE_PALETTES[fromMod.zoneId].cardBorder
                                }`}
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
                                className={`text-right rounded-2xl border bg-white p-4 space-y-1 transition-all cursor-pointer ${
                                  ZONE_PALETTES[toMod.zoneId].cardBorder
                                }`}
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
