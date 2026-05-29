import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col space-y-1 w-full text-left">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full h-10 px-3 pr-10 text-sm bg-card border border-border rounded-md text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 cursor-pointer appearance-none ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-foreground">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {helperText && (
        <p className="text-xxs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};
