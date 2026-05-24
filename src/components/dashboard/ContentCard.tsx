'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export interface ContentCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/** eSkooly-style white panel for tables and forms */
export const ContentCard: React.FC<ContentCardProps> = ({
  title,
  description,
  children,
  actions,
  className = '',
  noPadding = false,
}) => (
  <Card className={`eskooly-panel border-border/70 shadow-sm ${className}`}>
    <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-primary/10 bg-primary/[0.04] py-4">
      <div className="min-w-0">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        {description && (
          <CardDescription className="mt-0.5 text-sm">{description}</CardDescription>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </CardHeader>
    <CardContent className={noPadding ? 'p-0' : 'pt-4'}>{children}</CardContent>
  </Card>
);
