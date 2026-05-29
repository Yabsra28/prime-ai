'use client';

import React from 'react';

export const DashboardFooter: React.FC = () => (
  <footer className="mt-10 border-t border-border/60 pt-6 pb-2">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
      <div>
        <p className="font-semibold text-foreground">Continue Managing!</p>
        <p className="text-xs mt-0.5 max-w-md">
          Pick up right where you left off. Prime Teaching System — fast, easy school
          management for Ethiopian education.
        </p>
      </div>
      <div className="text-xs text-muted-foreground shrink-0">
        © {new Date().getFullYear()} Ministry of Education, Ethiopia
      </div>
    </div>
  </footer>
);
