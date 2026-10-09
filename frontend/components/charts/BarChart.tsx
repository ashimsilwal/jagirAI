'use client';

import React, { useState } from 'react';

export interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
  secondaryLabel?: string;
  badge?: string;
}

export interface BarChartProps {
  title?: string;
  description?: string;
  data: BarDataPoint[];
  maxValue?: number;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  emptyMessage?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  description,
  data,
  maxValue,
  className = '',
  orientation = 'horizontal',
  emptyMessage = 'No chart data available yet',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const calculatedMax = maxValue || Math.max(...data.map((d) => d.value), 1);

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm ${className}`}>
        {title && <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{title}</h3>}
        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm transition-all ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      )}

      {orientation === 'horizontal' ? (
        <div className="space-y-3.5">
          {data.map((item, index) => {
            const percentage = Math.min(100, Math.round((item.value / calculatedMax) * 100));
            const isHovered = hoveredIndex === index;
            const barColor = item.color || '#0284c7';

            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-2 rounded-xl transition-all ${
                  isHovered ? 'bg-slate-50 dark:bg-slate-800/60' : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.secondaryLabel && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {item.secondaryLabel}
                      </span>
                    )}
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {item.value}
                    </span>
                  </div>
                </div>

                {/* Bar Track & Fill */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.max(percentage, 3)}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vertical Bar Chart */
        <div className="pt-4">
          <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            {data.map((item, index) => {
              const heightPercent = Math.min(100, Math.round((item.value / calculatedMax) * 100));
              const isHovered = hoveredIndex === index;
              const barColor = item.color || '#0284c7';

              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Hover Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-9 px-2 py-1 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold shadow-lg pointer-events-none whitespace-nowrap z-20 animate-in fade-in zoom-in-95 duration-150">
                      {item.value} ({heightPercent}%)
                    </div>
                  )}

                  <div className="w-full max-w-[40px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-full flex items-end overflow-hidden p-0.5">
                    <div
                      className="w-full rounded-t-md transition-all duration-500 ease-out"
                      style={{
                        height: `${Math.max(heightPercent, 4)}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-2 truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
