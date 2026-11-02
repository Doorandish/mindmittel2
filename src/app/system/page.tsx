'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, type WorkspaceSubTab } from '@/components/layout/AppShell';
import { SystemObservabilityPanel } from '@/components/system/SystemObservabilityPanel';
import {
  getDictionary,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from '@/i18n/dictionaries';

/**
 * Dedicated /system route wrapped inside the full-height Left Sidebar AppShell
 * with overflow-safe break-all technical inspection and zero top back-arrow header.
 */
export default function SystemObservabilityPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [userEmail, setUserEmail] = useState<string>('amir@mindmittel.de');
  const [userFullName, setUserFullName] = useState<string>('Amir Doorandish');
  const [userDepartment, setUserDepartment] =
    useState<string>('Executive Board');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('mindmittel_v2_user');
      if (saved) {
        const parsed = JSON.parse(saved) as {
          email?: string;
          fullName?: string;
          department?: string;
        };
        if (parsed.email) setUserEmail(parsed.email);
        if (parsed.fullName) setUserFullName(parsed.fullName);
        if (parsed.department) setUserDepartment(parsed.department);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

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
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 break-all sm:break-normal">
        <SystemObservabilityPanel />
      </div>
    </AppShell>
  );
}
