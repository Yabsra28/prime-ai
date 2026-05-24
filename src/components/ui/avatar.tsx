'use client';

import React, { useState } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';
type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const sizeMap: Record<AvatarSize, { container: string; text: string; status: string; statusRing: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', status: 'w-2 h-2', statusRing: 'ring-1' },
  sm: { container: 'w-8 h-8', text: 'text-xs', status: 'w-2.5 h-2.5', statusRing: 'ring-[1.5px]' },
  md: { container: 'w-10 h-10', text: 'text-sm', status: 'w-3 h-3', statusRing: 'ring-2' },
  lg: { container: 'w-12 h-12', text: 'text-base', status: 'w-3.5 h-3.5', statusRing: 'ring-2' },
};

const statusColors: Record<AvatarStatus, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-muted-foreground/50',
  busy: 'bg-destructive',
  away: 'bg-amber-500',
};

const statusLabels: Record<AvatarStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  busy: 'Busy',
  away: 'Away',
};

/** Deterministic hash from a string to pick a gradient */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const gradients = [
  'from-blue-500 to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-rose-500 to-pink-400',
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400',
  'from-indigo-500 to-blue-400',
  'from-fuchsia-500 to-pink-400',
  'from-sky-500 to-blue-300',
  'from-lime-500 to-green-400',
  'from-red-500 to-rose-400',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradient(name: string): string {
  const index = hashString(name) % gradients.length;
  return gradients[index];
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = '',
  size = 'md',
  status,
  className = '',
  ...props
}) => {
  const [imgError, setImgError] = useState(false);
  const dims = sizeMap[size];
  const showImage = src && !imgError;
  const initials = getInitials(name);
  const gradient = getGradient(name);
  const ariaLabel = alt || name || 'Avatar';

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${className}`}
      role="img"
      aria-label={ariaLabel}
      {...props}
    >
      <div
        className={`
          ${dims.container} rounded-full overflow-hidden
          inline-flex items-center justify-center
          font-semibold text-white select-none
          ${!showImage ? `bg-gradient-to-br ${gradient}` : 'bg-muted'}
          ring-2 ring-background
          transition-all duration-200
        `}
      >
        {showImage ? (
          <img
            src={src}
            alt={ariaLabel}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            draggable={false}
          />
        ) : (
          <span className={`${dims.text} leading-none`}>{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${dims.status} rounded-full
            ${statusColors[status]}
            ${dims.statusRing} ring-background
          `}
          aria-label={statusLabels[status]}
          title={statusLabels[status]}
        />
      )}
    </div>
  );
};

/* ─── AvatarGroup ──────────────────────────────────────────────── */

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Max number of avatars to show before "+N" indicator */
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 4,
  size = 'md',
  className = '',
  ...props
}) => {
  const childArray = React.Children.toArray(children);
  const visible = childArray.slice(0, max);
  const overflow = childArray.length - max;
  const dims = sizeMap[size];

  return (
    <div
      className={`flex items-center -space-x-2 ${className}`}
      role="group"
      aria-label={`Group of ${childArray.length} avatars`}
      {...props}
    >
      {visible.map((child, i) => (
        <div key={i} className="relative hover:z-10 transition-transform duration-200 hover:-translate-y-0.5">
          {child}
        </div>
      ))}

      {overflow > 0 && (
        <div
          className={`
            ${dims.container} rounded-full
            inline-flex items-center justify-center
            bg-muted text-muted-foreground
            font-semibold ${dims.text}
            ring-2 ring-background
            select-none
          `}
          aria-label={`${overflow} more`}
          title={`${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};
