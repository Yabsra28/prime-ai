'use client';

import React from 'react';

/** Green & white KPI variants */
const toneStyles = {
  default: {
    card: 'bg-card text-card-foreground border-border',
    icon: 'bg-primary/10 text-primary',
    label: 'text-foreground',
    value: 'text-muted-foreground',
    hint: 'text-muted-foreground',
  },
  emphasis: {
    card: 'bg-primary/5 text-card-foreground border-primary/20',
    icon: 'bg-white text-primary border border-primary/20 shadow-sm',
    label: 'text-foreground',
    value: 'text-muted-foreground',
    hint: 'text-primary/80',
  },
  inverse: {
    card: 'bg-primary text-primary-foreground border-primary',
    icon: 'bg-white/20 text-primary-foreground',
    label: 'text-primary-foreground',
    value: 'text-primary-foreground/85',
    hint: 'text-primary-foreground/70',
  },
} as const;

export type KpiTone = keyof typeof toneStyles;

export interface KpiWidgetProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: KpiTone;
  className?: string;
}

export const KpiWidget: React.FC<KpiWidgetProps> = ({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  className = '',
}) => {
  const styles = toneStyles[tone];

  return (
    <div
      className={`relative overflow-hidden rounded-lg border p-4 transition-shadow hover:shadow-sm ${styles.card} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-base font-bold leading-snug sm:text-lg ${styles.label}`}>{label}</p>
          <p className={`mt-1.5 text-sm font-semibold tabular-nums sm:text-base ${styles.value}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {hint && <p className={`mt-1 text-xs ${styles.hint}`}>{hint}</p>}
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm ${styles.icon}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export const KpiGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
    {children}
  </div>
);
