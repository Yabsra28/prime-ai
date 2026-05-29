'use client';

import React from 'react';

export interface MetricProgressRowProps {
  /** Primary label (region, subject, etc.) */
  label: React.ReactNode;
  /** Progress value 0–100 */
  value: number;
  /** Shown beside the bar (defaults to `${value}%`) */
  valueDisplay?: React.ReactNode;
  barClassName?: string;
  /** Optional vertical target marker on the track (0–100) */
  targetPercent?: number;
  /** Secondary line under the label row */
  subtitle?: React.ReactNode;
  /** Content aligned right on the label row (badges, letter grades, status) */
  headerExtra?: React.ReactNode;
  className?: string;
}

function clampPercent(n: number) {
  return Math.min(100, Math.max(0, n));
}

export const MetricProgressRow: React.FC<MetricProgressRowProps> = ({
  label,
  value,
  valueDisplay,
  barClassName = 'bg-primary',
  targetPercent,
  subtitle,
  headerExtra,
  className = '',
}) => (
  <div className={`space-y-1.5 text-left ${className}`}>
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 text-sm font-medium text-foreground">{label}</div>
      {headerExtra ? <div className="shrink-0">{headerExtra}</div> : null}
    </div>
    {subtitle ? <div className="text-xs text-muted-foreground -mt-0.5">{subtitle}</div> : null}
    <div className="flex items-center gap-3">
      <div className="relative flex-1 min-w-0 h-3.5 rounded-full bg-muted/80 border border-border/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClassName}`}
          style={{ width: `${clampPercent(value)}%` }}
        />
        {targetPercent != null ? (
          <div
            className="absolute top-0 bottom-0 w-px bg-primary/50"
            style={{ left: `${clampPercent(targetPercent)}%` }}
            title={`${targetPercent}% target`}
            aria-hidden
          />
        ) : null}
      </div>
      <span className="text-sm font-bold text-primary tabular-nums shrink-0 min-w-[2.75rem] text-right">
        {valueDisplay ?? `${value}%`}
      </span>
    </div>
  </div>
);
