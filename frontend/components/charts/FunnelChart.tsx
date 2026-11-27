'use client';

import React from 'react';
import { ArrowDown, TrendingUp } from 'lucide-react';

export interface FunnelStage {
  label: string;
  value: number;
  color: string;
  description?: string;
}

export interface FunnelChartProps {
  title?: string;
  description?: string;
  stages: FunnelStage[];
  className?: string;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  title,
  description,
  stages,
  className = '',
}) => {
  const topValue = stages.length > 0 ? Math.max(stages[0].value, 1) : 1;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm transition-all ${className}`}>
      {title && (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{title}</span>
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/80">
              Pipeline Flow
            </span>
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {stages.map((stage, index) => {
          // Conversion relative to the first stage (Applied)
          const conversionRate = topValue > 0 ? Math.round((stage.value / topValue) * 100) : 0;
          // Step drop-off from previous step
          const prevValue = index > 0 ? stages[index - 1].value : stage.value;
          const stepConversion = prevValue > 0 ? Math.round((stage.value / prevValue) * 100) : 0;

          // Bar width percentage relative to topValue
          const widthPercent = Math.max(16, Math.min(100, Math.round((stage.value / topValue) * 100)));

          return (
            <div key={index} className="space-y-1">
              {/* Connector arrow between stages */}
              {index > 0 && (
                <div className="flex items-center gap-2 pl-6 py-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                  <ArrowDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                  <span>
                    {stepConversion}% step throughput
                  </span>
                </div>
              )}

              <div className="group relative p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 transition-all">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {stage.label}
                    </span>
                    {stage.description && (
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        • {stage.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {stage.value}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                      {conversionRate}%
                    </span>
                  </div>
                </div>

                {/* Funnel Bar Track */}
                <div className="w-full h-2.5 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
