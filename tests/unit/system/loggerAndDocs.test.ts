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
