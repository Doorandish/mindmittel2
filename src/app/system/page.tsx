'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck } from 'lucide-react';
import { AppShell, type WorkspaceSubTab } from '@/components/layout/AppShell';
import { SystemObservabilityPanel } from '@/components/system/SystemObservabilityPanel';
import {
  getDictionary,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from '@/i18n/dictionaries';
import type { EnterpriseConnectorItem } from '@/core/connectors/connectorRegistry';

/**
 * Dedicated /system route wrapped inside the full-height Left Sidebar AppShell
 * with live sidebar badge counts, Email Authentication modal, and overflow-safe break-all technical inspection.
 */
export default function SystemObservabilityPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [userEmail, setUserEmail] = useState<string>('amir@mindmittel.de');
  const [userFullName, setUserFullName] = useState<string>('Amir Doorandish');
  const [userDepartment, setUserDepartment] =
    useState<string>('Executive Board');

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authEmailInput, setAuthEmailInput] =
    useState<string>('amir@mindmittel.de');
  const [authNameInput, setAuthNameInput] = useState<string>('Amir Doorandish');
  const [authDeptInput, setAuthDeptInput] =
    useState<string>('Executive Board');
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  const [brainCount, setBrainCount] = useState<number>(3);
  const [auditHistoryCount, setAuditHistoryCount] = useState<number>(0);
  const [connectors, setConnectors] = useState<EnterpriseConnectorItem[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('mindmittel_v2_user');
      if (saved) {
        const parsed = JSON.parse(saved) as {
          email?: string;
          fullName?: string;
          department?: string;
        };
        if (parsed.email) {
          setUserEmail(parsed.email);
          setAuthEmailInput(parsed.email);
        }
        if (parsed.fullName) {
          setUserFullName(parsed.fullName);
          setAuthNameInput(parsed.fullName);
        }
        if (parsed.department) {
          setUserDepartment(parsed.department);
          setAuthDeptInput(parsed.department);
        }
      }
    } catch {
      // Ignore storage access errors
    }

    fetch('/api/brain/documents')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.documents)) {
          setBrainCount(d.documents.length);
        }
      })
      .catch(() => {});

    fetch('/api/brain/audit')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.history)) {
          setAuditHistoryCount(d.history.length);
        }
      })
      .catch(() => {});

    fetch('/api/connectors')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.connectors)) {
          setConnectors(d.connectors);
        }
      })
      .catch(() => {});
  }, []);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthFeedback(null);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmailInput,
          fullName: authNameInput,
          department: authDeptInput,
        }),
      });
      const data = await res.json();

      if (data.ok && data.user) {
        setUserEmail(data.user.email);
        setUserFullName(data.user.fullName);
        setUserDepartment(data.user.department);
        try {
          window.localStorage.setItem(
            'mindmittel_v2_user',
            JSON.stringify(data.user)
          );
        } catch {
          // Ignore storage error
        }
        setShowAuthModal(false);
      } else {
        setAuthFeedback(data.error ?? 'Invalid email');
      }
    } catch (err) {
      setAuthFeedback(
        err instanceof Error ? err.message : 'Authentication error'
      );
    }
  }

  const dict = getDictionary(locale);

  function handleTabChange(nextTab: 'overview' | 'vault') {
    if (nextTab === 'overview') {
      router.push('/');
    }
  }

  function handleSubTabChange(nextSubTab: WorkspaceSubTab) {
    if (nextSubTab === 'system') return;
    router.push(`/?tab=${nextSubTab}`);
  }

  return (
    <AppShell
      locale={locale}
      onLocaleChange={setLocale}
      dict={dict}
      activeTab="vault"
      onTabChange={handleTabChange}
      workspaceSubTab="system"
      onWorkspaceSubTabChange={handleSubTabChange}
      currentUserEmail={userEmail}
      currentUserName={userFullName}
      currentUserDepartment={userDepartment}
      brainCount={brainCount}
      auditHistoryCount={auditHistoryCount}
      enabledConnectorsCount={connectors.filter((c) => c.enabled).length}
      totalConnectorsCount={connectors.length || 7}
      onOpenAuthModal={() => setShowAuthModal(true)}
    >
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    {locale === 'de'
                      ? 'E-Mail-Authentifizierung'
                      : 'Corporate Email Authentication'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === 'de'
                      ? 'Jeder Eintrag & jedes Audit wird Ihrer E-Mail zugeordnet.'
                      : 'Every ingested document & audit report is attributed to your email.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Corporate Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={authEmailInput}
                  onChange={(e) => setAuthEmailInput(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2.5 text-sm liquid-glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={authNameInput}
                  onChange={(e) => setAuthNameInput(e.target.value)}
                  placeholder="Amir Doorandish"
                  className="w-full px-3.5 py-2.5 text-sm liquid-glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Role
                </label>
                <select
                  value={authDeptInput}
                  onChange={(e) => setAuthDeptInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm liquid-glass-input"
                >
                  <option value="Executive Board">Executive Board</option>
                  <option value="Finance & Legal">Finance & Legal</option>
                  <option value="Engineering">Engineering</option>
                  <option value="HR & Legal">HR & Legal</option>
                </select>
              </div>

              {authFeedback && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                  {authFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm"
                >
                  Save & Authenticate Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 break-all sm:break-normal">
        <SystemObservabilityPanel />
      </div>
    </AppShell>
  );
}
