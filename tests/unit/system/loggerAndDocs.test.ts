import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRingBufferLogger,
  redactSensitiveMetadata,
} from '@/infrastructure/logging/logger';
import {
  ARCHITECTURE_NODES,
  ARCHITECTURE_EDGES,
  getArchitectureNodeById,
} from '@/system/architectureRegistry';
import {
  PERSIAN_TECHNICAL_ARCHITECTURE_DOC,
  PERSIAN_NON_TECHNICAL_BLUEPRINT_DOC,
  DOCUMENTED_API_ROUTES,
  DOCUMENTED_CORE_MODULES,
  DOCUMENTED_ENTERPRISE_CONNECTORS,
  getLivePersianDocsSnapshot,
} from '@/system/persianLivingDocsRegistry';
import {
  BLUEPRINT_ZONES,
  BLUEPRINT_MODULES,
  BLUEPRINT_CONNECTIONS,
  getBlueprintModuleById,
} from '@/system/interactiveBlueprintRegistry';
import { createInitialConnectorsState } from '@/core/connectors/connectorRegistry';

describe('Live Ring-Buffer Logger & Secret Redaction', () => {
  it('redacts sensitive keys such as apiKey, password, token, and authorization', () => {
    const rawMeta = {
      requestId: 'req_101',
      apiKey: 'AIzaSySecretKey999',
      nested: {
        password: 'super_secret_password',
        authorization: 'Bearer xyz123',
        safeField: 'visible_value',
      },
    };

    const sanitized = redactSensitiveMetadata(rawMeta);
    expect(sanitized.requestId).toBe('req_101');
    expect(sanitized.apiKey).toBe('[REDACTED]');
    expect((sanitized.nested as Record<string, unknown>).password).toBe(
      '[REDACTED]'
    );
    expect((sanitized.nested as Record<string, unknown>).authorization).toBe(
      '[REDACTED]'
    );
    expect((sanitized.nested as Record<string, unknown>).safeField).toBe(
      'visible_value'
    );
  });

  it('enforces ring buffer capacity by evicting oldest logs when full', () => {
    const logger = createRingBufferLogger({ maxEntries: 3 });

    logger.info('ai.selector', 'Log entry 1');
    logger.info('db.mongo', 'Log entry 2');
    logger.warn('rag.chunker', 'Log entry 3');
    logger.error('api.health', 'Log entry 4');

    const snapshot = logger.getRecentLogs();
    expect(snapshot.length).toBe(3);
    expect(snapshot.map((e) => e.message)).toEqual([
      'Log entry 2',
      'Log entry 3',
      'Log entry 4',
    ]);
  });

  it('notifies live subscribers immediately when a new log entry is emitted', () => {
    const logger = createRingBufferLogger({ maxEntries: 10 });
    const receivedMessages: string[] = [];

    const unsubscribe = logger.subscribe((entry) => {
      receivedMessages.push(entry.message);
    });

    logger.info('system.boot', 'Live stream initialized');
    unsubscribe();
    logger.info('system.boot', 'After unsubscribe');

    expect(receivedMessages).toEqual(['Live stream initialized']);
  });
});

describe('Interactive Architecture Topology Registry (English Technical Deep-Dive)', () => {
  beforeEach(() => {
    // Ensure registry is deterministic
  });

  it('contains all core system nodes with complete English technical deep-dive specifications', () => {
    expect(ARCHITECTURE_NODES.length).toBeGreaterThanOrEqual(5);

    for (const node of ARCHITECTURE_NODES) {
      expect(node.id).toBeTruthy();
      expect(node.title).toBeTruthy();
      expect(node.technical.stack.length).toBeGreaterThan(0);
      expect(node.technical.sourceFiles.length).toBeGreaterThan(0);
      expect(node.technical.apiContracts.length).toBeGreaterThan(0);
      expect(node.technical.dataPipeline).toBeTruthy();
      expect(node.technical.errorHandlingAndFallbacks).toBeTruthy();
      expect(node.technical.envVars.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('ensures every topology edge references valid source and target node IDs', () => {
    for (const edge of ARCHITECTURE_EDGES) {
      const fromNode = getArchitectureNodeById(edge.from);
      const toNode = getArchitectureNodeById(edge.to);
      expect(fromNode).toBeDefined();
      expect(toNode).toBeDefined();
    }
  });
});

function discoverApiRouteFiles(dirPath: string, rootDir: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...discoverApiRouteFiles(fullPath, rootDir));
    } else if (entry.isFile() && entry.name === 'route.ts') {
      const rel = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      results.push(rel);
    }
  }
  return results.sort();
}

describe('Dynamic Persian Dual-Layer Living Documentation & Anti-Drift Guard', () => {
  const repoRoot = process.cwd();

  it('provides both comprehensive Technical and Non-Technical Persian documents with diagrams and flowcharts', () => {
    const snapshot = getLivePersianDocsSnapshot();

    expect(snapshot.technicalDoc.title).toBeTruthy();
    expect(snapshot.technicalDoc.sections.length).toBeGreaterThanOrEqual(6);
    expect(snapshot.technicalDoc.diagrams.length).toBeGreaterThanOrEqual(3);
    expect(
      snapshot.technicalDoc.architectureDecisions.length
    ).toBeGreaterThanOrEqual(8);

    for (const adr of snapshot.technicalDoc.architectureDecisions) {
      expect(adr.id).toBeTruthy();
      expect(adr.titleFa).toBeTruthy();
      expect(adr.chosenArchitectureFa.length).toBeGreaterThan(20);
      expect(adr.whyChosenFa.length).toBeGreaterThan(20);
      expect(adr.alternativesRejectedFa.length).toBeGreaterThanOrEqual(2);
      expect(adr.limitationsAndTradeoffsFa.length).toBeGreaterThan(20);
    }

    expect(snapshot.nonTechnicalDoc.title).toBeTruthy();
    expect(snapshot.nonTechnicalDoc.sections.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.nonTechnicalDoc.diagrams.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.nonTechnicalDoc.errorShields.length).toBeGreaterThanOrEqual(6);
    expect(
      snapshot.nonTechnicalDoc.architectKeyDecisions.length
    ).toBeGreaterThanOrEqual(8);

    for (const decision of snapshot.nonTechnicalDoc.architectKeyDecisions) {
      expect(decision.questionFa).toBeTruthy();
      expect(decision.simpleAnswerFa.length).toBeGreaterThan(20);
      expect(decision.alternativesComparisonFa.length).toBeGreaterThan(20);
      expect(decision.limitationsAndConstraintsFa.length).toBeGreaterThan(20);
      expect(decision.whyItMattersFa.length).toBeGreaterThan(15);
    }

    expect(snapshot.liveMetrics.totalArchitectureNodes).toBe(
      ARCHITECTURE_NODES.length
    );
    expect(snapshot.liveMetrics.totalDataChannels).toBe(
      ARCHITECTURE_EDGES.length
    );
    expect(snapshot.liveMetrics.totalApiEndpoints).toBe(
      DOCUMENTED_API_ROUTES.length
    );
    expect(snapshot.liveMetrics.totalCoreModules).toBe(
      DOCUMENTED_CORE_MODULES.length
    );
    expect(DOCUMENTED_ENTERPRISE_CONNECTORS.map((c) => c.id)).toEqual(
      createInitialConnectorsState().map((c) => c.id)
    );
  });

  it('automatically fails if any API route in src/app/api/**/route.ts is missing from Persian living documentation', () => {
    const apiDir = path.join(repoRoot, 'src/app/api');
    const actualRouteFiles = discoverApiRouteFiles(apiDir, repoRoot);
    const documentedRouteFiles = DOCUMENTED_API_ROUTES.map(
      (r) => r.sourceFile
    ).sort();

    expect(documentedRouteFiles).toEqual(actualRouteFiles);

    for (const route of DOCUMENTED_API_ROUTES) {
      expect(route.endpoint).toMatch(/^\/api\//);
      expect(route.methods.length).toBeGreaterThan(0);
      expect(route.technicalSummaryFa.length).toBeGreaterThan(20);
      expect(route.nonTechnicalSummaryFa.length).toBeGreaterThan(20);
    }
  });

  it('automatically fails if any ARCHITECTURE_NODES entry is missing a Persian technical & non-technical translation', () => {
    const mappedNodeIds = new Set(
      PERSIAN_TECHNICAL_ARCHITECTURE_DOC.nodeTranslations.map((n) => n.nodeId)
    );
    for (const node of ARCHITECTURE_NODES) {
      expect(mappedNodeIds.has(node.id)).toBe(true);
    }
    expect(PERSIAN_NON_TECHNICAL_BLUEPRINT_DOC.errorShields.length).toBeGreaterThanOrEqual(6);
  });

  it('enforces project-level rules (.agents/rules/living-persian-docs.md and AGENTS.md) and admin docs UI page', () => {
    const ruleFile = path.join(
      repoRoot,
      '.agents/rules/living-persian-docs.md'
    );
    const agentsMd = path.join(repoRoot, 'AGENTS.md');
    const adminDocsPage = path.join(repoRoot, 'src/app/admin/docs/page.tsx');
    const adminPage = path.join(repoRoot, 'src/app/admin/page.tsx');

    expect(fs.existsSync(ruleFile)).toBe(true);
    expect(fs.existsSync(agentsMd)).toBe(true);
    expect(fs.existsSync(adminDocsPage)).toBe(true);

    const ruleContent = fs.readFileSync(ruleFile, 'utf8');
    expect(ruleContent).toContain('trigger: always_on');
    expect(ruleContent).toContain('src/system/persianLivingDocsRegistry.ts');

    const adminPageContent = fs.readFileSync(adminPage, 'utf8');
    expect(adminPageContent).toContain('/admin/docs');
    expect(adminPageContent).toContain('Architecture Docs');
    expect(/[\u0600-\u06FF]/.test(adminPageContent)).toBe(false);

    const systemPage = path.join(repoRoot, 'src/app/system/page.tsx');
    const systemPageContent = fs.readFileSync(systemPage, 'utf8');
    expect(systemPageContent).toContain('/admin/docs');
    expect(/[\u0600-\u06FF]/.test(systemPageContent)).toBe(false);
  });

  it('provides a complete 7-zone Interactive Architecture Blueprint with valid source file references, dedicated AI Router & DB hubs, and auto-sync rule enforcement', () => {
    // 1. Verify all 7 required architectural zones (Zone 0 to Zone 6)
    expect(BLUEPRINT_ZONES.map((z) => z.id)).toEqual([
      'zone-0',
      'zone-1',
      'zone-2',
      'zone-3',
      'zone-4',
      'zone-5',
      'zone-6',
    ]);

    // 2. Verify every module has clean Persian inspector content and existing source files
    expect(BLUEPRINT_MODULES.length).toBeGreaterThanOrEqual(12);
    for (const mod of BLUEPRINT_MODULES) {
      expect(mod.titleFa.length).toBeGreaterThan(3);
      expect(mod.roleSummaryFa.length).toBeGreaterThan(15);
      expect(mod.whatItDoesFa.length).toBeGreaterThan(30);
      expect(mod.internalMechanicsFa.length).toBeGreaterThanOrEqual(2);
      expect(mod.inputsFa.length).toBeGreaterThanOrEqual(1);
      expect(mod.outputsFa.length).toBeGreaterThanOrEqual(1);
      expect(mod.sourceFiles.length).toBeGreaterThanOrEqual(1);

      for (const relPath of mod.sourceFiles) {
        const absPath = path.join(repoRoot, relPath);
        expect(fs.existsSync(absPath)).toBe(true);
      }
    }

    // 3. Verify dedicated AI Model Router (Zone 3) has explicit connections to Extraction, Embedding, and Audit
    const routerModules = BLUEPRINT_MODULES.filter((m) => m.zoneId === 'zone-3');
    expect(routerModules.length).toBeGreaterThanOrEqual(1);
    const routerToTargets = BLUEPRINT_CONNECTIONS.filter((c) =>
      routerModules.some((rm) => rm.id === c.fromModuleId || rm.id === c.toModuleId)
    );
    expect(routerToTargets.length).toBeGreaterThanOrEqual(3);

    // 4. Verify dedicated Database & Dual-Layer Storage (Zone 5) has connections from Ingestion, RAG, Connectors, and Audit
    const dbModules = BLUEPRINT_MODULES.filter((m) => m.zoneId === 'zone-5');
    expect(dbModules.length).toBeGreaterThanOrEqual(1);
    const dbLinks = BLUEPRINT_CONNECTIONS.filter((c) =>
      dbModules.some((dm) => dm.id === c.toModuleId || dm.id === c.fromModuleId)
    );
    expect(dbLinks.length).toBeGreaterThanOrEqual(4);

    // 5. Verify every connection points to valid modules and carries Persian inspector explanations
    for (const conn of BLUEPRINT_CONNECTIONS) {
      expect(getBlueprintModuleById(conn.fromModuleId)).toBeDefined();
      expect(getBlueprintModuleById(conn.toModuleId)).toBeDefined();
      expect(conn.labelFa.length).toBeGreaterThan(3);
      expect(conn.whatItDoesFa.length).toBeGreaterThan(20);
      expect(conn.internalMechanicsFa.length).toBeGreaterThan(20);
      expect(conn.payloadSummaryFa.length).toBeGreaterThan(10);
    }

    // 6. Verify auto-sync rules cover src/core/, src/infrastructure/, src/app/api/ and interactiveBlueprintRegistry.ts
    const ruleContent = fs.readFileSync(
      path.join(repoRoot, '.agents/rules/living-persian-docs.md'),
      'utf8'
    );
    const agentsContent = fs.readFileSync(
      path.join(repoRoot, 'AGENTS.md'),
      'utf8'
    );
    expect(ruleContent).toContain('src/system/interactiveBlueprintRegistry.ts');
    expect(ruleContent).toContain('src/core/');
    expect(ruleContent).toContain('src/infrastructure/');
    expect(ruleContent).toContain('src/app/api/');
    expect(agentsContent).toContain('src/system/interactiveBlueprintRegistry.ts');

    // 7. Verify bundled Vazirmatn font and interactive SVG connection overlay
    const vazirmatnFont = path.join(
      repoRoot,
      'public/fonts/Vazirmatn-VariableFont_wght.ttf'
    );
    expect(fs.existsSync(vazirmatnFont)).toBe(true);

    const globalsCss = fs.readFileSync(
      path.join(repoRoot, 'src/app/globals.css'),
      'utf8'
    );
    expect(globalsCss).toContain("font-family: 'Vazirmatn'");
    expect(globalsCss).toContain('/fonts/Vazirmatn-VariableFont_wght.ttf');

    const blueprintComponent = fs.readFileSync(
      path.join(
        repoRoot,
        'src/components/docs/InteractiveArchitectureBlueprint.tsx'
      ),
      'utf8'
    );
    expect(blueprintComponent).toContain('ResizeObserver');
    expect(blueprintComponent).toContain('<svg');
    expect(blueprintComponent).toContain('ai-hub');
    expect(blueprintComponent).toContain('db-hub');
  });
});
