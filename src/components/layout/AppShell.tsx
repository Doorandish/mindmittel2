'use client';

import React, { useEffect, useState } from 'react';
import {
  Database,
  ArrowUpRight,
  ShieldCheck,
  Plug,
  LogOut,
  Users,
} from 'lucide-react';
import type { AppDictionary, SupportedLocale } from '@/i18n/dictionaries';
import { buildZoneUrl } from '@/core/tenancy/hostResolver';

export type WorkspaceSubTab = 'evaluate' | 'brain' | 'connectors' | 'team';

export interface WorkspaceSidebarSection {
  id: string;
  titleEn: string;
  titleDe: string;
  items: {
    subTab: WorkspaceSubTab;
    labelEn: string;
    labelDe: string;
  }[];
}

export const WORKSPACE_SIDEBAR_SECTIONS: WorkspaceSidebarSection[] = [
  {
    id: 'governance',
    titleEn: 'Governance',
    titleDe: 'Governance',
    items: [
      {
        subTab: 'evaluate',
        labelEn: 'Evaluate Decision',
        labelDe: 'Entscheidung prüfen',
      },
    ],
  },
  {
    id: 'knowledge',
    titleEn: 'Knowledge Vault',
    titleDe: 'Wissensspeicher',
    items: [
      {
        subTab: 'brain',
        labelEn: 'Company Brain',
        labelDe: 'Company Brain',
      },
      {
        subTab: 'connectors',
        labelEn: 'Connectors',
        labelDe: 'Connectors',
      },
    ],
  },
];

export interface AppShellProps {
  children: React.ReactNode;
  locale: SupportedLocale;
  onLocaleChange: (nextLocale: SupportedLocale) => void;
  dict: AppDictionary;
  activeTab?: 'overview' | 'vault';
  onTabChange?: (tab: 'overview' | 'vault') => void;
  workspaceSubTab?: WorkspaceSubTab;
  onWorkspaceSubTabChange?: (subTab: WorkspaceSubTab) => void;
  currentUserEmail?: string;
  currentUserName?: string;
  currentUserDepartment?: string;
  brainCount?: number;
  auditHistoryCount?: number;
  enabledConnectorsCount?: number;
  totalConnectorsCount?: number;
  canManageConnectors?: boolean;
  canManageTeam?: boolean;
  pendingUsersCount?: number;
  companyName?: string;
  companyLogoUrl?: string | null;
  onSignOut?: () => void;
}

/**
 * MindMittel V2 Precision Enterprise Layout Shell:
 * - Landing Page ('overview'): Top marketing header with anchor links, language switcher, and Launch CTA.
 * - Workspace ('vault'): Headerless full-height architectural layout with a 248px Left Sidebar
 *   housing the Brand Mark, Language Switcher (EN | DE), single-line navigation items,
 *   and pinned User Profile.
 */
export function AppShell({
  children,
  locale,
  onLocaleChange,
  dict,
  activeTab = 'overview',
  onTabChange,
  workspaceSubTab = 'evaluate',
  onWorkspaceSubTabChange,
  currentUserEmail = 'amir@mindmittel.de',
  currentUserName = 'Amir Doorandish',
  currentUserDepartment = 'Executive Board',
  brainCount = 0,
  auditHistoryCount = 0,
  enabledConnectorsCount = 0,
  totalConnectorsCount = 7,
  canManageConnectors = true,
  canManageTeam = false,
  pendingUsersCount = 0,
  companyName,
  companyLogoUrl,
  onSignOut,
}: AppShellProps) {
  const [landingHref, setLandingHref] = useState<string>('https://mindmittel.de');
  const activeLogoSrc = companyLogoUrl || '/images/mindmittel-logo.svg';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLandingHref(
        buildZoneUrl(null, window.location.host, window.location.protocol)
      );
    }
  }, []);

  function navigateToWorkspaceSubTab(subTab: WorkspaceSubTab) {
    onTabChange?.('vault');
    onWorkspaceSubTabChange?.(subTab);
  }

  function getBadgeText(subTab: WorkspaceSubTab): string {
    if (subTab === 'evaluate') {
      return `${auditHistoryCount}`;
    }
    if (subTab === 'brain') {
      return `${brainCount}`;
    }
    if (subTab === 'team') {
      return pendingUsersCount > 0 ? `${pendingUsersCount}!` : 'Admin';
    }
    return `${enabledConnectorsCount}/${totalConnectorsCount}`;
  }

  const userInitials =
    currentUserName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'AD';

  return (
    <div className="min-h-screen flex flex-col justify-between pb-20 md:pb-0 selection:bg-blue-600 selection:text-white">
      {/* Top Marketing Header: ONLY rendered on the Landing Page ('overview') */}
      {activeTab === 'overview' && (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <a
              href={landingHref}
              className="flex items-center gap-2.5 text-left group shrink-0"
            >
              <img
                src="/images/mindmittel-logo.svg"
                alt="MindMittel Logo"
                className="w-8 h-8 object-contain shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-[-0.02em] text-[16px] text-slate-900">
                    {dict.meta.appName}
                  </span>
                </div>
                <p className="text-[9.5px] font-medium tracking-[0.04em] text-slate-400 uppercase hidden sm:block">
                  {dict.meta.tagline}
                </p>
              </div>
            </a>

            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center gap-6 text-[13.5px] font-medium text-slate-600"
            >
              <a
                href="#why-mindmittel"
                className="hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                {dict.nav.whyMindMittel}
              </a>
              <a
                href="#how-it-works"
                className="hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                {dict.nav.howItWorks}
              </a>
              <a
                href="#features"
                className="hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                {dict.nav.features}
              </a>
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              <div
                role="group"
                aria-label="Language Selector"
                className="inline-flex items-center bg-slate-100 border border-slate-200/80 rounded-md p-0.5 text-[11.5px] font-medium shrink-0"
              >
                <button
                  type="button"
                  onClick={() => onLocaleChange('en')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    locale === 'en'
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => onLocaleChange('de')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    locale === 'de'
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  DE
                </button>
              </div>

              <button
                type="button"
                onClick={() => onTabChange?.('vault')}
                className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-blue-600 text-white font-medium text-[13px] shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>{dict.nav.launchApp}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Workspace Mode ('vault'): Full-Height Sidebar on Left (No Top Header on Desktop) */}
      {activeTab === 'vault' ? (
        <div className="flex-1 w-full flex flex-col md:flex-row min-h-screen">
          {/* Mobile-Only Compact Bar (since Left Sidebar is hidden on <md screens) */}
          <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between print:hidden">
            <a
              href={landingHref}
              className="flex items-center gap-2.5 text-left min-w-0"
            >
              <img
                src={activeLogoSrc}
                alt={companyName ? `${companyName} Logo` : 'MindMittel Logo'}
                className="w-7 h-7 object-contain rounded-md shrink-0"
              />
              <div className="min-w-0 leading-tight">
                <div className="font-bold text-[14.5px] tracking-[-0.02em] text-slate-900 truncate">
                  {dict.meta.appName}
                </div>
                {companyName && (
                  <div className="text-[11px] font-medium text-slate-500 truncate">
                    {companyName}
                  </div>
                )}
              </div>
            </a>

            <div className="inline-flex items-center bg-slate-100 border border-slate-200/80 rounded-md p-0.5 text-[11px] font-medium shrink-0">
              <button
                type="button"
                onClick={() => onLocaleChange('en')}
                className={`px-2 py-0.5 rounded ${
                  locale === 'en'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLocaleChange('de')}
                className={`px-2 py-0.5 rounded ${
                  locale === 'de'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500'
                }`}
              >
                DE
              </button>
            </div>
          </div>

          {/* FULL-HEIGHT ARCHITECTURAL LEFT SIDEBAR (248px width, Linear/Stripe-grade proportions) */}
          <aside
            aria-label="Workspace Sidebar Navigation"
            className="hidden md:flex md:w-[248px] shrink-0 bg-[#FCFCFD] border-r border-slate-200/80 flex-col justify-between md:sticky md:top-0 md:h-screen select-none print:hidden"
          >
            {/* Top Area: Brand Identity + Language Switcher + Sectioned Navigation */}
            <div>
              {/* Sidebar Top Header: Company/Brand Logo on Left + Stacked MindMittel & Company Name + Language Toggle on Right */}
              <div className="px-4 py-3 border-b border-slate-200/70 flex items-center justify-between gap-2">
                <a
                  href={landingHref}
                  className="flex items-center gap-2.5 text-left group min-w-0"
                  title={companyName || 'mindmittel.de'}
                >
                  <img
                    src={activeLogoSrc}
                    alt={companyName ? `${companyName} Logo` : 'MindMittel Logo'}
                    className="w-8 h-8 object-contain rounded-md shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold tracking-[-0.02em] text-[15px] text-slate-900 leading-tight truncate">
                      {dict.meta.appName}
                    </div>
                    {companyName && (
                      <div className="text-[11px] font-medium text-slate-500 leading-tight truncate mt-0.5">
                        {companyName}
                      </div>
                    )}
                  </div>
                </a>

                {/* Integrated Sidebar Language Selector (EN | DE) */}
                <div
                  role="group"
                  aria-label="Sidebar Language Selector"
                  className="inline-flex items-center bg-slate-100/90 border border-slate-200/80 rounded-md p-0.5 text-[11px] font-medium shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => onLocaleChange('en')}
                    className={`px-1.5 py-0.5 rounded-[4px] transition-all leading-none ${
                      locale === 'en'
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => onLocaleChange('de')}
                    className={`px-1.5 py-0.5 rounded-[4px] transition-all leading-none ${
                      locale === 'de'
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    DE
                  </button>
                </div>
              </div>

              {/* Sectioned Single-Line Navigation Rail */}
              <div className="px-3 py-4 space-y-5">
                {WORKSPACE_SIDEBAR_SECTIONS.map((section) => {
                  const visibleItems = section.items.filter(
                    (item) =>
                      item.subTab !== 'connectors' || canManageConnectors
                  );
                  if (visibleItems.length === 0) return null;
                  return (
                    <div key={section.id} className="space-y-1">
                      <div className="px-2.5 pb-0.5 text-[11px] font-medium text-slate-400 tracking-[0.01em]">
                        {locale === 'de' ? section.titleDe : section.titleEn}
                      </div>

                      <div className="space-y-0.5">
                        {visibleItems.map((item) => {
                          const isActive = workspaceSubTab === item.subTab;
                          const IconComponent =
                            item.subTab === 'evaluate'
                              ? ShieldCheck
                              : item.subTab === 'brain'
                              ? Database
                              : Plug;

                          return (
                            <button
                              key={item.subTab}
                              type="button"
                              onClick={() => navigateToWorkspaceSubTab(item.subTab)}
                              className={`group relative w-full h-9 px-2.5 rounded-lg text-left transition-all flex items-center justify-between gap-2 ${
                                isActive
                                  ? 'bg-slate-900/[0.055] text-slate-900 font-semibold'
                                  : 'text-slate-600 hover:bg-slate-900/[0.03] hover:text-slate-900 font-medium'
                              }`}
                            >
                              {isActive && (
                                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-blue-600" />
                              )}

                              <span className="flex items-center gap-2.5 min-w-0">
                                <IconComponent
                                  className={`w-4 h-4 shrink-0 transition-colors ${
                                    isActive
                                      ? 'text-blue-600'
                                      : 'text-slate-400 group-hover:text-slate-600'
                                  }`}
                                />
                                <span className="text-[13px] leading-5 tracking-[-0.01em] truncate">
                                  {locale === 'de' ? item.labelDe : item.labelEn}
                                </span>
                              </span>

                              <span
                                className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                                  isActive
                                    ? 'bg-white text-slate-700 border border-slate-200/80 shadow-sm'
                                    : 'text-slate-400 group-hover:text-slate-600'
                                }`}
                              >
                                {getBadgeText(item.subTab)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {canManageTeam && (
                  <div className="space-y-1">
                    <div className="px-2.5 pb-0.5 text-[11px] font-medium text-slate-400 tracking-[0.01em]">
                      {locale === 'de' ? 'Verwaltung' : 'Administration'}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateToWorkspaceSubTab('team')}
                      className={`group relative w-full h-9 px-2.5 rounded-lg text-left transition-all flex items-center justify-between gap-2 ${
                        workspaceSubTab === 'team'
                          ? 'bg-slate-900/[0.055] text-slate-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-900/[0.03] hover:text-slate-900 font-medium'
                      }`}
                    >
                      {workspaceSubTab === 'team' && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-blue-600" />
                      )}
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Users
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            workspaceSubTab === 'team'
                              ? 'text-blue-600'
                              : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="text-[13px] leading-5 tracking-[-0.01em] truncate">
                          {locale === 'de' ? 'Team & Zugriff' : 'Team & Access'}
                        </span>
                      </span>
                      <span
                        className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded ${
                          pendingUsersCount > 0
                            ? 'bg-amber-100 text-amber-900 font-bold'
                            : workspaceSubTab === 'team'
                            ? 'bg-white text-slate-700 border border-slate-200/80 shadow-sm'
                            : 'text-slate-400'
                        }`}
                      >
                        {getBadgeText('team')}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Pinned Executive Profile Footer */}
            <div className="p-3 border-t border-slate-200/75 bg-slate-100/40 space-y-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-semibold text-[11px] tracking-wider flex items-center justify-center shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[12.5px] font-semibold text-slate-900 leading-tight truncate tracking-[-0.01em]">
                      {currentUserName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight truncate">
                    {currentUserEmail}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="px-2 py-0.5 rounded bg-slate-200/70 text-[10.5px] font-medium text-slate-600 truncate">
                  {currentUserDepartment}
                </span>

                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="h-6 px-2 rounded bg-white hover:bg-rose-50 border border-slate-200/90 hover:border-rose-200 text-[11px] font-medium text-slate-700 hover:text-rose-700 transition-colors inline-flex items-center gap-1 shrink-0 shadow-sm"
                  >
                    <LogOut className="w-3 h-3 text-slate-400" />
                    <span>
                      {locale === 'de' ? 'Abmelden' : 'Sign Out'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Right Main Workspace Content Canvas */}
          <main className="flex-1 min-w-0 w-full">{children}</main>
        </div>
      ) : (
        <main className="flex-1 w-full">{children}</main>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-3 inset-x-4 z-50 print:hidden"
      >
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-full px-3 py-2 flex items-center justify-around">
          <button
            type="button"
            onClick={() => navigateToWorkspaceSubTab('evaluate')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
              activeTab === 'vault' && workspaceSubTab === 'evaluate'
                ? 'text-blue-600'
                : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit</span>
          </button>

          <button
            type="button"
            onClick={() => navigateToWorkspaceSubTab('brain')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
              activeTab === 'vault' && workspaceSubTab === 'brain'
                ? 'text-blue-600'
                : 'text-slate-500'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Brain</span>
          </button>

          <button
            type="button"
            onClick={() => navigateToWorkspaceSubTab('connectors')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
              activeTab === 'vault' && workspaceSubTab === 'connectors'
                ? 'text-blue-600'
                : 'text-slate-500'
            }`}
          >
            <Plug className="w-4 h-4" />
            <span>Connectors</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
