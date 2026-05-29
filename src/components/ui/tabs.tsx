import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pill';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'underline',
}) => {
  if (variant === 'pill') {
    return (
      <div className={`flex p-1 bg-muted/40 rounded-lg overflow-x-auto scrollbar-none mb-6 ${className}`}>
        <div className="flex gap-1 min-w-full">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                  isActive
                    ? 'bg-card text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex border-b border-border/60 overflow-x-auto scrollbar-none mb-6 ${className}`}>
      <div className="flex space-x-1 min-w-full">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center space-x-2 py-3 px-5 text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon && <span className="flex-shrink-0 text-current">{tab.icon}</span>}
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full transition-all duration-300" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
