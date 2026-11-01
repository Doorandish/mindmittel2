'use client';

import React from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  Database,
  Activity,
  ArrowUpRight,
  Home,
  ShieldCheck,
  Plug,
  UserCheck,
  Settings2,
} from 'lucide-react';
import type { AppDictionary, SupportedLocale } from '@/i18n/dictionaries';

export type WorkspaceSubTab = 'evaluate' | 'brain' | 'connectors';

export interface WorkspaceSidebarSection {
  id: string;
  titleEn: string;
  titleDe: string;
  items: {
    subTab: WorkspaceSubTab;
    labelEn: string;
    labelDe: string;
    descriptionEn: string;
    descriptionDe: string;
  }[];
}

export const WORKSPACE_SIDEBAR_SECTIONS: WorkspaceSidebarSection[] = [
  {
    id: 'governance',
    titleEn: 'GOVERNANCE ENGINE',
    titleDe: 'GOVERNANCE-ENGINE',
    items: [
      {
        subTab: 'evaluate',
        labelEn: 'Evaluate Decision',
        labelDe: 'Entscheidung prüfen',
        descriptionEn: 'Live audit & previous reports',
        descriptionDe: 'Live-Prüfung & Bericht-Archiv',
      },
    ],
  },
  {
    id: 'knowledge',
    titleEn: 'KNOWLEDGE VAULT',
    titleDe: 'WISSENS-TRESOR',
    items: [
      {
        subTab: 'brain',
        labelEn: 'Company Brain',
        labelDe: 'Company Brain',
        descriptionEn: 'Text, PDF, PPTX, Audio & Voice',
        descriptionDe: 'Text, PDF, PPTX, Audio & Sprache',
      },
      {
        subTab: 'connectors',
        labelEn: 'Connectors Hub',
        labelDe: 'Connectors Hub',
        descriptionEn: 'Chat, Docs & Online Meetings',
        descriptionDe: 'Chat, Docs & Online-Meetings',
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
  onOpenAuthModal?: () => void;
}

/**
 * MindMittel V2 Enterprise Layout Shell:
 * - Crisp Top Header with balanced spacing so the EN | DE Language Selector never overflows.
 * - Dedicated Left Sidebar when inside the workspace ('vault') featuring categorized sections
 *   at the top and the authenticated User Profile card pinned to the bottom.
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
  onOpenAuthModal,
}: AppShellProps) {
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
    return `${enabledConnectorsCount}/${totalConnectorsCount}`;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between pb-20 md:pb-0 selection:bg-blue-600 selection:text-white">
      {/* Sticky Crisp White Top Header (Clean & Overflow-Safe) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div
          className={`${
            activeTab === 'vault' ? 'max-w-[1600px]' : 'max-w-7xl'
          } mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4`}
        >
          {/* Left Brand Logo */}
          <button
            type="button"
            onClick={() => onTabChange?.('overview')}
            className="flex items-center gap-3 text-left group shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-base text-slate-900">
                  {dict.meta.appName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  V2
                </span>
              </div>
              <p className="text-[9px] font-bold tracking-widest text-slate-500 uppercase hidden sm:block">
                {dict.meta.tagline}
              </p>
            </div>
          </button>

          {/* Center Navigation Links (Landing Page Anchors or Clean Workspace Breadcrumb) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {activeTab === 'overview' ? (
              <>
                <a
                  href="#why-mindmittel"
                  className="hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  {dict.nav.whyMindMittel}
                </a>
                <a
                  href="#how-it-works"
                  className="hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  {dict.nav.howItWorks}
                </a>
                <a
                  href="#features"
                  className="hover:text-blue-600 transition-colors whitespace-nowrap"
                >
                  {dict.nav.features}
                </a>
                <Link
                  href="/system"
                  className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{dict.nav.systemCenter}</span>
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onTabChange?.('overview')}
                  className="px-3 py-1.5 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Home className="w-4 h-4 text-blue-600" />
                  <span>{dict.nav.backToLanding}</span>
                </button>

                <Link
                  href="/system"
                  className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{dict.nav.systemCenter}</span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Language Toggle & Conditional Primary Blue CTA Button (Never Overflows) */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              role="group"
              aria-label="Language Selector"
              className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-full p-1 text-xs font-semibold shrink-0"
            >
              <button
                type="button"
                onClick={() => onLocaleChange('en')}
                className={`px-2.5 py-1 rounded-full transition-colors ${
                  locale === 'en'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLocaleChange('de')}
                className={`px-2.5 py-1 rounded-full transition-colors ${
                  locale === 'de'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                DE
              </button>
            </div>

            {activeTab === 'overview' && (
              <button
                type="button"
                onClick={() => onTabChange?.('vault')}
                className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>{dict.nav.launchApp}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area: Full-Width on Landing Page, Left Sidebar + Workspace Canvas in Vault */}
      {activeTab === 'vault' ? (
        <div className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col md:flex-row">
          {/* DEDICATED LEFT SIDEBAR: Sectioned Navigation on Top + User Profile Card at Bottom */}
          <aside
            aria-label="Workspace Sidebar Navigation"
            className="hidden md:flex md:w-72 lg:w-80 shrink-0 bg-white/90 backdrop-blur-sm border-r border-slate-200/90 flex-col justify-between p-5 md:sticky md:top-16 md:h-[calc(100vh-4rem)] overflow-y-auto"
          >
            {/* Top Categorized Sections */}
            <div className="space-y-6">
              {WORKSPACE_SIDEBAR_SECTIONS.map((section) => (
                <div key={section.id} className="space-y-2">
                  <div className="px-3 text-[11px] font-mono font-extrabold tracking-wider text-slate-400 uppercase">
                    {locale === 'de' ? section.titleDe : section.titleEn}
                  </div>

                  <div className="space-y-1.5">
                    {section.items.map((item) => {
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
                          className={`w-full px-3.5 py-3 rounded-2xl text-left transition-all flex items-center justify-between gap-3 border ${
                            isActive
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                              : 'bg-transparent text-slate-700 border-transparent hover:bg-slate-100/90 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-blue-600'
                              }`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-extrabold truncate">
                                {locale === 'de' ? item.labelDe : item.labelEn}
                              </div>
                              <div
                                className={`text-[11px] truncate ${
                                  isActive ? 'text-blue-100' : 'text-slate-400'
                                }`}
                              >
                                {locale === 'de'
                                  ? item.descriptionDe
                                  : item.descriptionEn}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {getBadgeText(item.subTab)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* SYSTEM & NAVIGATION SECTION */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <div className="px-3 text-[11px] font-mono font-extrabold tracking-wider text-slate-400 uppercase">
                  {locale === 'de' ? 'SYSTEM & NAVIGATION' : 'SYSTEM & NAVIGATION'}
                </div>

                <div className="space-y-1">
                  <Link
                    href="/system"
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2.5">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span>{dict.nav.systemCenter}</span>
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => onTabChange?.('overview')}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors flex items-center gap-2.5 text-left"
                  >
                    <Home className="w-4 h-4 text-blue-600" />
                    <span>{dict.nav.backToLanding}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Pinned User Profile Card */}
            <div className="pt-4 border-t border-slate-200/90">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      {currentUserName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 truncate">
                      {currentUserEmail}
                    </div>
                    <div className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[10px] font-mono font-bold text-blue-700">
                      {currentUserDepartment}
                    </div>
                  </div>
                </div>

                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {locale === 'de' ? 'Profil wechseln' : 'Switch Profile'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Right Main Workspace Content */}
          <main className="flex-1 min-w-0 w-full">{children}</main>
        </div>
      ) : (
        <main className="flex-1 w-full">{children}</main>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-3 inset-x-4 z-50"
      >
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-full px-3 py-2 flex items-center justify-around">
          <button
            type="button"
            onClick={() => onTabChange?.('overview')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
              activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{dict.nav.backToLanding}</span>
          </button>

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

          <Link
            href="/system"
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-600"
          >
            <Activity className="w-4 h-4" />
            <span>System</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
