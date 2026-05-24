'use client';

import React from 'react';
import { ContentCard } from '@/components/dashboard/ContentCard';

export interface TablePanelProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** ContentCard wrapper with horizontal scroll for eskooly-table */
export const TablePanel: React.FC<TablePanelProps> = ({
  title,
  description,
  actions,
  children,
  className = '',
}) => (
  <ContentCard
    title={title}
    description={description}
    actions={actions}
    noPadding
    className={className}
  >
    <div className="overflow-x-auto">{children}</div>
  </ContentCard>
);
