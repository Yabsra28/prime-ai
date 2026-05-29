'use client';

import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  actions,
}) => (
  <div className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0 space-y-1">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
