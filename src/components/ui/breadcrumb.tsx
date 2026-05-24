'use client';

import React, { useState, useRef, useEffect } from 'react';

/* ───────────── Types ───────────── */

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  maxItems?: number;
  separator?: React.ReactNode;
  className?: string;
}

/* ───────────── Chevron ───────────── */

const ChevronRight: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={`h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/50 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

/* ───────────── Collapsed‑Items Dropdown ───────────── */

const CollapsedItems: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center rounded px-1.5 py-0.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        aria-label="Show hidden breadcrumbs"
      >
        ···
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-border bg-popover text-popover-foreground shadow-lg animate-fade-in py-1">
          {items.map((item, i) => (
            <BreadcrumbLink key={i} item={item} extraClass="block w-full px-3 py-1.5 text-sm text-left hover:bg-muted" onClick={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ───────────── Single Link/Span ───────────── */

const BreadcrumbLink: React.FC<{
  item: BreadcrumbItem;
  isCurrent?: boolean;
  extraClass?: string;
  onClick?: () => void;
}> = ({ item, isCurrent = false, extraClass = '', onClick }) => {
  const baseClass = `inline-flex items-center gap-1.5 rounded transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${extraClass}`;

  if (isCurrent) {
    return (
      <span aria-current="page" className={`${baseClass} text-sm font-semibold text-foreground select-none`}>
        {item.icon && <span className="flex-shrink-0 opacity-70">{item.icon}</span>}
        {item.label}
      </span>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }
    onClick?.();
  };

  if (item.href) {
    return (
      <a
        href={item.href}
        onClick={handleClick}
        className={`${baseClass} text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 px-1.5 py-0.5`}
      >
        {item.icon && <span className="flex-shrink-0 opacity-70">{item.icon}</span>}
        {item.label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClass} text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 px-1.5 py-0.5 cursor-pointer`}
    >
      {item.icon && <span className="flex-shrink-0 opacity-70">{item.icon}</span>}
      {item.label}
    </button>
  );
};

/* ───────────── Breadcrumb ───────────── */

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  maxItems = 4,
  separator,
  className = '',
}) => {
  const sep = separator ?? <ChevronRight />;

  const shouldCollapse = items.length > maxItems;
  let visibleItems: (BreadcrumbItem | 'collapsed')[];
  let collapsedItems: BreadcrumbItem[] = [];

  if (shouldCollapse) {
    const head = items.slice(0, 1);
    const tail = items.slice(-(maxItems - 2));
    collapsedItems = items.slice(1, items.length - (maxItems - 2));
    visibleItems = [...head, 'collapsed' as const, ...tail];
  } else {
    visibleItems = items;
  }

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center ${className}`}>
      <ol className="flex items-center gap-1">
        {visibleItems.map((entry, i) => {
          const isLast = i === visibleItems.length - 1;

          return (
            <li key={i} className="flex items-center gap-1">
              {entry === 'collapsed' ? (
                <CollapsedItems items={collapsedItems} />
              ) : (
                <BreadcrumbLink item={entry} isCurrent={isLast} />
              )}
              {!isLast && <span className="flex items-center" aria-hidden="true">{sep}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
