import type { ResolvedTenant } from '@/core/tenancy/tenantModel';

export const DEFAULT_CONTROL_PLANE_DB = 'mindmittel_v2';

export type DatabaseTarget =
  | { mode: 'none'; uri: null; dbName: string }
  | { mode: 'shared'; uri: string; dbName: string }
  | { mode: 'isolated'; uri: string; dbName: string };

function isValidMongoUri(uri: string | undefined | null): uri is string {
  return Boolean(
    uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))
  );
}

/**
 * Decides which MongoDB cluster and database name to use for a given tenant.
 * - If the tenant has its own `mongoUri`, connects with an isolated client (`mode: 'isolated'`).
 * - Otherwise reuses the master `MONGODB_URI` connection and selects `tenant.dbName` (`mode: 'shared'`).
 */
export function resolveDatabaseTarget(
  tenant: ResolvedTenant | null | undefined,
  env: Record<string, string | undefined> = process.env
): DatabaseTarget {
  const defaultDbName = env.MONGODB_DB_NAME?.trim() || DEFAULT_CONTROL_PLANE_DB;

  if (tenant && isValidMongoUri(tenant.mongoUri)) {
    return {
      mode: 'isolated',
      uri: tenant.mongoUri,
      dbName: tenant.dbName,
    };
  }

  if (isValidMongoUri(env.MONGODB_URI)) {
    return {
      mode: 'shared',
      uri: env.MONGODB_URI,
      dbName: tenant ? tenant.dbName : defaultDbName,
    };
  }

  return {
    mode: 'none',
    uri: null,
    dbName: tenant ? tenant.dbName : defaultDbName,
  };
}
