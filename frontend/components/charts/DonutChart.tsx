'use client';

import React, { useState } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string; // Tailwind hex or standard hex, e.g. '#0284c7'
}

export interface DonutChartProps {
  title?: string;
  description?: string;
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string | number;
  size?: number;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  description,
  segments,
  centerLabel = 'Total',
  centerValue,
  size = 180,
  className = '',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const displayCenterValue = centerValue !== undefined ? centerValue : total;

  // SVG Geometry
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative offsets
  let cumulativeValue = 0;
  const segmentArcs = segments.map((segment) => {
    const fraction = total > 0 ? segment.value / total : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -1 * (cumulativeValue / (total || 1)) * circumference;
    cumulativeValue += segment.value;

    return {
      ...segment,
      fraction,
      percentage: Math.round(fraction * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

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

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* SVG Donut */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 origin-center drop-shadow-sm"
          >
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100 dark:text-slate-800"
            />

            {/* Segments */}
            {total > 0 &&
              segmentArcs.map((arc, index) => {
                const isHovered = hoveredIndex === index;
                return (
                  <circle
                    key={index}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={arc.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={arc.strokeDasharray}
                    strokeDashoffset={arc.strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
          </svg>

          {/* Centered Stat Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            {hoveredIndex !== null && total > 0 ? (
              <>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight animate-in fade-in zoom-in-95 duration-150">
                  {segmentArcs[hoveredIndex].value}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                  {segmentArcs[hoveredIndex].label} ({segmentArcs[hoveredIndex].percentage}%)
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {displayCenterValue}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {centerLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2">
          {segmentArcs.map((arc, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800 scale-[1.02]'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: arc.color }}
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {arc.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {arc.value}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 w-8 text-right">
                    {total > 0 ? `${arc.percentage}%` : '0%'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
