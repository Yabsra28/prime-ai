import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
  /** Number of text lines to render (only for variant="text") */
  lines?: number;
}

const formatDimension = (value: string | number | undefined): string | undefined => {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  animate = true,
  lines = 1,
  ...props
}) => {
  const baseStyle = 'bg-muted rounded-md';
  const animationStyle = animate ? 'shimmer' : '';

  const variantStyles: Record<string, string> = {
    text: 'rounded-sm',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    card: 'rounded-lg',
  };

  const defaultDimensions: Record<string, { width?: string; height: string }> = {
    text: { width: '100%', height: '0.875rem' },
    circular: { width: '40px', height: '40px' },
    rectangular: { width: '100%', height: '80px' },
    card: { width: '100%', height: '160px' },
  };

  const resolvedWidth = formatDimension(width) ?? defaultDimensions[variant].width;
  const resolvedHeight = formatDimension(height) ?? defaultDimensions[variant].height;

  // For card variant, render a structured skeleton card
  if (variant === 'card') {
    return (
      <div
        className={`${baseStyle} ${animationStyle} rounded-lg overflow-hidden ${className}`}
        style={{ width: resolvedWidth, height: resolvedHeight }}
        role="status"
        aria-label="Loading"
        aria-busy="true"
        {...props}
      >
        <div className="p-5 h-full flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted-foreground/10 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/5 rounded-sm bg-muted-foreground/10" />
              <div className="h-2.5 w-2/5 rounded-sm bg-muted-foreground/10" />
            </div>
          </div>
          {/* Content lines */}
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-2.5 w-full rounded-sm bg-muted-foreground/10" />
            <div className="h-2.5 w-4/5 rounded-sm bg-muted-foreground/10" />
            <div className="h-2.5 w-3/5 rounded-sm bg-muted-foreground/10" />
          </div>
        </div>
      </div>
    );
  }

  // For text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div
        className={`space-y-2 ${className}`}
        role="status"
        aria-label="Loading"
        aria-busy="true"
        {...props}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseStyle} ${animationStyle} ${variantStyles.text}`}
            style={{
              width: i === lines - 1 ? '60%' : resolvedWidth,
              height: resolvedHeight,
            }}
          />
        ))}
      </div>
    );
  }

  // Default single skeleton element
  return (
    <div
      className={`${baseStyle} ${animationStyle} ${variantStyles[variant]} ${className}`}
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
      }}
      role="status"
      aria-label="Loading"
      aria-busy="true"
      {...props}
    />
  );
};

/** A convenience wrapper for rendering a group of skeletons */
export const SkeletonGroup: React.FC<React.HTMLAttributes<HTMLDivElement> & { gap?: string }> = ({
  children,
  className = '',
  gap = '0.75rem',
  ...props
}) => (
  <div
    className={`flex flex-col ${className}`}
    style={{ gap }}
    role="status"
    aria-label="Loading content"
    aria-busy="true"
    {...props}
  >
    {children}
  </div>
);
