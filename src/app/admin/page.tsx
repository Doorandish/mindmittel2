'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { buildZoneUrl } from '@/core/tenancy/hostResolver';
import { deriveTenantDbName } from '@/core/tenancy/tenantModel';
import type { AdminTenantView } from '@/infrastructure/tenancy/tenantRepository';

export default function SuperAdminConsolePage() {
  const [checkingSession, setCheckingSession] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [ownerEmail, setOwnerEmail] = useState<string>('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('amir.doorandish@gmail.com');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Tenant provisioning state
  const [tenants, setTenants] = useState<AdminTenantView[]>([]);
  const [slug, setSlug] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [allowedEmailDomains, setAllowedEmailDomains] = useState<string>('');
  const [allowedEmails, setAllowedEmails] = useState<string>('');
  const [customDbName, setCustomDbName] = useState<string>('');
  const [mongoUri, setMongoUri] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [showGeminiKey, setShowGeminiKey] = useState<boolean>(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [clearMongoUri, setClearMongoUri] = useState<boolean>(false);
  const [clearGeminiApiKey, setClearGeminiApiKey] = useState<boolean>(false);
  const [deleteTargetSlug, setDeleteTargetSlug] = useState<string | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>('');
  const [formFeedback, setFormFeedback] = useState<{
    type: 'ok' | 'err';
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  async function loadTenants() {
    try {
      const res = await fetch('/api/admin/tenants');
      const data = await res.json();
      if (data.ok && Array.isArray(data.tenants)) {
        setTenants(data.tenants);
      }
    } catch {
      // Ignore network errors
    }
  }

  useEffect(() => {
    async function checkOwner() {
      try {
        const res = await fetch('/api/admin/session');
        const data = await res.json();
        if (data.ok && data.authenticated) {
          setAuthenticated(true);
          setOwnerEmail(data.owner?.email ?? 'amir.doorandish@gmail.com');
          await loadTenants();
        }
      } finally {
        setCheckingSession(false);
      }
    }
    checkOwner();
  }, []);

  async function handleOwnerLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAuthenticated(true);
        setOwnerEmail(data.owner?.email ?? loginEmail);
        setLoginPassword('');
        await loadTenants();
      } else {
        setLoginError(data.error ?? 'Invalid credentials');
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleOwnerLogout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setAuthenticated(false);
    setTenants([]);
  }

  function startEditingTenant(tenant: AdminTenantView) {
    setFormFeedback(null);
    setEditingSlug(tenant.slug);
    setSlug(tenant.slug);
    setCompanyName(tenant.companyName);
    setAllowedEmailDomains(tenant.allowedEmailDomains.join(', '));
    setAllowedEmails(tenant.allowedEmails.join(', '));
    setCustomDbName(tenant.dbName);
    setMongoUri('');
    setGeminiApiKey('');
    setClearMongoUri(false);
    setClearGeminiApiKey(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function cancelEditingTenant() {
    setEditingSlug(null);
    setSlug('');
    setCompanyName('');
    setAllowedEmailDomains('');
    setAllowedEmails('');
    setCustomDbName('');
    setMongoUri('');
    setGeminiApiKey('');
    setClearMongoUri(false);
    setClearGeminiApiKey(false);
    setFormFeedback(null);
  }

  async function handleCreateTenant(e: React.FormEvent) {
    e.preventDefault();
    setFormFeedback(null);
    setIsSaving(true);
    try {
      const isEdit = Boolean(editingSlug);
      const res = await fetch('/api/admin/tenants', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit
            ? {
                slug: editingSlug,
                companyName,
                allowedEmailDomains,
                allowedEmails,
                dbName: customDbName.trim() || undefined,
                mongoUri: mongoUri.trim() || undefined,
                clearMongoUri,
                geminiApiKey: geminiApiKey.trim() || undefined,
                clearGeminiApiKey,
              }
            : {
                slug,
                companyName,
                allowedEmailDomains,
                allowedEmails,
                dbName: customDbName.trim() || undefined,
                mongoUri: mongoUri.trim() || null,
                geminiApiKey: geminiApiKey.trim() || null,
              }
        ),
      });
      const data = await res.json();
      if (data.ok) {
        setTenants(data.tenants ?? []);
        setFormFeedback({
          type: 'ok',
          message: isEdit
            ? `Updated ${data.tenant.companyName} (${data.tenant.slug}.mindmittel.de)`
            : `Provisioned ${data.tenant.companyName} at ${data.tenant.slug}.mindmittel.de (DB: ${data.tenant.dbName})`,
        });
        setEditingSlug(null);
        setSlug('');
        setCompanyName('');
        setAllowedEmailDomains('');
        setAllowedEmails('');
        setCustomDbName('');
        setMongoUri('');
        setGeminiApiKey('');
        setClearMongoUri(false);
        setClearGeminiApiKey(false);
      } else {
        setFormFeedback({
          type: 'err',
          message:
            data.error ??
            (isEdit ? 'Failed to update tenant' : 'Failed to provision tenant'),
        });
      }
    } catch (err) {
      setFormFeedback({
        type: 'err',
        message: err instanceof Error ? err.message : 'Request failed',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(tenant: AdminTenantView) {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const res = await fetch('/api/admin/tenants', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: tenant.slug,
        status: nextStatus,
      }),
    });
    const data = await res.json();
    if (data.ok && Array.isArray(data.tenants)) {
      setTenants(data.tenants);
    }
  }

  async function handleDeleteTenant(targetSlug: string) {
    const res = await fetch(
      `/api/admin/tenants?slug=${encodeURIComponent(targetSlug)}`,
      { method: 'DELETE' }
    );
    const data = await res.json();
    if (data.ok && Array.isArray(data.tenants)) {
      setTenants(data.tenants);
      if (editingSlug === targetSlug) {
        cancelEditingTenant();
      }
    }
    setDeleteTargetSlug(null);
    setDeleteConfirmInput('');
  }

  function openSubdomain(targetSlug: string | null) {
    if (typeof window === 'undefined') return;
    window.open(
      buildZoneUrl(targetSlug, window.location.host, window.location.protocol),
      '_blank'
    );
  }

  const normalizedSlugPreview = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  const autoDbPreview = normalizedSlugPreview
    ? deriveTenantDbName(normalizedSlugPreview)
    : 'mindmittel_<subdomain>';

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Verifying Product Owner session...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-7 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-blue-400">
                admin.mindmittel.de
              </div>
              <h1 className="text-lg font-extrabold text-white">
                Product Owner Control Plane
              </h1>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Sign in with your Product Owner credentials to provision isolated
            customer subdomains, database connection strings, corporate email
            domains, and dedicated Gemini API keys.
          </p>

          <form onSubmit={handleOwnerLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Owner Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Owner Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-200 font-semibold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-colors"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In to Control Plane'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
              M
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>MindMittel Control Plane</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-mono">
                  admin.mindmittel.de
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Signed in as {ownerEmail}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => openSubdomain('demo')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1"
            >
              <span>demo.mindmittel.de</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <a
              href="/admin/docs"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm"
            >
              <span>Architecture Docs</span>
            </a>
            <a
              href="/system"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              System Topology
            </a>
            <button
              type="button"
              onClick={handleOwnerLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-semibold text-rose-200 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-mono">
                AUTO-SYNCED
              </span>
              <span>
                Living System Architecture & Executive Blueprint (Dual-Layer Persian Docs)
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Dynamic Technical Architecture Specification & Non-Technical System Blueprint with visual flowcharts, ADRs, trade-offs, and 6 error-prevention shields.
            </p>
          </div>

          <a
            href="/admin/docs"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow transition-colors shrink-0"
          >
            <span>Open Architecture Docs (/admin/docs)</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 5 Columns: Provision New Customer Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                  {editingSlug ? (
                    <Pencil className="w-4 h-4" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {editingSlug
                      ? `Edit Tenant: ${editingSlug}.mindmittel.de`
                      : 'Register New Customer Tenant'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingSlug
                      ? 'Update allowed emails, domains, DB, or Gemini key.'
                      : 'Creates an isolated subdomain, database & corporate email gate.'}
                  </p>
                </div>
              </div>
              {editingSlug && (
                <button
                  type="button"
                  onClick={cancelEditingTenant}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            <form
              onSubmit={handleCreateTenant}
              autoComplete="off"
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="tenant_company_name"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Robert Bosch GmbH"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subdomain Slug *
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:border-blue-600">
                  <input
                    type="text"
                    name="tenant_slug"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    required
                    readOnly={Boolean(editingSlug)}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="bosch"
                    className={`flex-1 px-3.5 py-2 text-sm font-mono focus:outline-none ${
                      editingSlug ? 'bg-slate-50 text-slate-500' : ''
                    }`}
                  />
                  <span className="px-3 py-2 text-xs font-mono bg-slate-100 text-slate-600 border-l border-slate-200">
                    .mindmittel.de
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Default DB in connection string: <strong>{autoDbPreview}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Allowed Corporate Email Domains (comma-separated) *
                </label>
                <input
                  type="text"
                  name="tenant_email_domains"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={allowedEmailDomains}
                  onChange={(e) => setAllowedEmailDomains(e.target.value)}
                  placeholder="bosch.de, bosch.com"
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Only users with these email domains receive 6-digit OTP login codes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Whitelisted Emails (optional)
                </label>
                <input
                  type="text"
                  name="tenant_allowed_emails"
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  value={allowedEmails}
                  onChange={(e) => setAllowedEmails(e.target.value)}
                  placeholder="exec-advisor@partner.de"
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-200/80 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>Database & AI Key Overrides (Encrypted AES-256-GCM)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Custom Database Name (leave blank for{' '}
                    <code className="font-mono">{autoDbPreview}</code>)
                  </label>
                  <input
                    type="text"
                    name="tenant_db_name"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={customDbName}
                    onChange={(e) => setCustomDbName(e.target.value)}
                    placeholder={autoDbPreview}
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Custom MongoDB Connection String (optional — defaults to main cluster with{' '}
                    <code className="font-mono">/{autoDbPreview}</code>)
                  </label>
                  <input
                    type="text"
                    name="tenant_mongo_uri"
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    placeholder={`mongodb+srv://.../${autoDbPreview}?appName=Doorandish`}
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Dedicated Gemini API Key (optional — defaults to platform key)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      name="tenant_gemini_override"
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="Leave blank to use Heroku GEMINI_API_KEY"
                      style={
                        showGeminiKey
                          ? undefined
                          : ({ WebkitTextSecurity: 'disc' } as React.CSSProperties)
                      }
                      className="w-full px-3.5 py-2 pr-9 text-xs font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey((v) => !v)}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700"
                      title={showGeminiKey ? 'Hide key' : 'Show key'}
                    >
                      {showGeminiKey ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {formFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold border ${
                    formFeedback.type === 'ok'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {formFeedback.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold shadow-sm transition-colors"
              >
                {isSaving
                  ? editingSlug
                    ? 'Saving Changes...'
                    : 'Provisioning Tenant...'
                  : editingSlug
                  ? 'Save Tenant Changes'
                  : 'Provision Customer Tenant'}
              </button>
            </form>
          </div>
        </div>

        {/* Right 7 Columns: Provisioned Customer Tenants List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Provisioned Customer Workspaces ({tenants.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={loadTenants}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Built-in Demo Workspace Card */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    MindMittel Live Demo (Built-in)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                    demo.mindmittel.de
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-mono">
                  DB: <strong>mindmittel_demo</strong> · Open Demo Access · Protected Sample Policies
                </div>
              </div>
              <button
                type="button"
                onClick={() => openSubdomain('demo')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1"
              >
                <span>Open Demo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {tenants.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">
                No customer tenants registered yet. Use the form on the left to
                provision your first company subdomain.
              </div>
            ) : (
              <div className="space-y-3">
                {tenants.map((t) => (
                  <div
                    key={t.slug}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white space-y-3 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {t.companyName}
                        </span>
                        <button
                          type="button"
                          onClick={() => openSubdomain(t.slug)}
                          className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 text-blue-700 text-xs font-mono font-bold flex items-center gap-1"
                        >
                          <span>{t.slug}.mindmittel.de</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            t.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingTenant(t)}
                          className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-xs font-semibold text-blue-700 flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                        >
                          {t.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTargetSlug(t.slug);
                            setDeleteConfirmInput('');
                          }}
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600"
                          title="Delete tenant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono truncate">
                        <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          DB: <strong>{t.dbName}</strong>{' '}
                          {t.usesCustomDatabase ? '(Custom URI)' : '(Shared Cluster)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          Domains:{' '}
                          <strong>
                            {t.allowedEmailDomains.length > 0
                              ? t.allowedEmailDomains.map((d) => `@${d}`).join(', ')
                              : t.allowedEmails.join(', ')}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                      <span className="truncate max-w-md">
                        URI: {t.connectionStringPreview}
                      </span>
                      <span className="flex items-center gap-1">
                        {t.hasCustomGeminiKey ? (
                          <>
                            <KeyRound className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">
                              Custom Gemini Key ({t.geminiKeyPreview})
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Default Platform Gemini Key</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Strict Typed-Slug Confirmation Modal for Deleting a Tenant */}
      {deleteTargetSlug && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete Tenant Profile: {deleteTargetSlug}.mindmittel.de
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Removing this tenant profile immediately disables{' '}
                  <strong>{deleteTargetSlug}.mindmittel.de</strong>, revokes
                  employee logins, and removes stored custom keys. (The
                  underlying MongoDB database is preserved for safety.)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Type <code className="font-mono text-rose-600">{deleteTargetSlug}</code> to confirm deletion:
              </label>
              <input
                type="text"
                autoComplete="off"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder={deleteTargetSlug}
                className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetSlug(null);
                  setDeleteConfirmInput('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  deleteConfirmInput.trim().toLowerCase() !== deleteTargetSlug
                }
                onClick={() => handleDeleteTenant(deleteTargetSlug)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
