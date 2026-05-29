'use client';

import React from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { PageTransition } from '@/components/ui/page-transition';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import type { BreadcrumbItem } from '@/components/ui/breadcrumb';

export interface DashboardShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Animate content when tab changes */
  animateTabs?: boolean;
  /** Hide the built-in page title block (e.g. when a tab has its own hero) */
  showPageHeader?: boolean;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  activeTab,
  setActiveTab,
  title,
  subtitle,
  eyebrow,
  breadcrumbs,
  actions,
  children,
  animateTabs = true,
  showPageHeader = true,
}) => {
  const content = (
    <>
      {showPageHeader && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          eyebrow={eyebrow}
          actions={actions}
        />
      )}
      {children}
      <DashboardFooter />
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[hsl(var(--dashboard-bg))]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar breadcrumbs={breadcrumbs} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            {animateTabs ? (
              <PageTransition transitionKey={activeTab}>{content}</PageTransition>
            ) : (
              content
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
