'use client';

import React, { useState } from 'react';

export interface TrendPoint {
  label: string;
  value: number;
}

export interface AreaTrendChartProps {
  title?: string;
  description?: string;
  points: TrendPoint[];
  lineColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
  height?: number;
}

export const AreaTrendChart: React.FC<AreaTrendChartProps> = ({
  title,
  description,
  points,
  lineColor = '#0284c7', // Sky-600
  gradientFrom = 'rgba(2, 132, 199, 0.35)',
  gradientTo = 'rgba(2, 132, 199, 0.0)',
  className = '',
  height = 160,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm ${className}`}>
        {title && <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{title}</h3>}
        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">No trend points available</div>
      </div>
    );
  }

  const width = 500;
  const paddingX = 30;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxValue = Math.max(...points.map((p) => p.value), 1);
  const minValue = 0;

  // Calculate coordinates for each point
  const coords = points.map((p, index) => {
    const x = paddingX + (index / (points.length - 1 || 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((p.value - minValue) / (maxValue - minValue || 1)) * chartHeight;
    return { x, y, ...p };
  });

  // Construct SVG Path
  const linePath = coords.reduce((acc, curr, index) => {
    if (index === 0) return `M ${curr.x} ${curr.y}`;
    // Simple smooth curve control points
    const prev = coords[index - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, '');

  // Construct Area Fill Path
  const firstPoint = coords[0];
  const lastPoint = coords[coords.length - 1];
  const areaPath = `${linePath} L ${lastPoint.x} ${height - paddingBottom} L ${firstPoint.x} ${height - paddingBottom} Z`;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm transition-all ${className}`}>
      {title && (
        <div className="mb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      )}

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          <line
            x1={paddingX}
            y1={paddingTop}
            x2={width - paddingX}
            y2={paddingTop}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-slate-100 dark:text-slate-800"
          />
          <line
            x1={paddingX}
            y1={paddingTop + chartHeight / 2}
            x2={width - paddingX}
            y2={paddingTop + chartHeight / 2}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-slate-100 dark:text-slate-800"
          />
          <line
            x1={paddingX}
            y1={height - paddingBottom}
            x2={width - paddingX}
            y2={height - paddingBottom}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
          />

          {/* Area Fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Trend Line */}
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points */}
          {coords.map((c, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <g key={index} className="cursor-pointer">
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#ffffff' : lineColor}
                  stroke={lineColor}
                  strokeWidth="2.5"
                  className="transition-all duration-150"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                {/* X Axis Label */}
                <text
                  x={c.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-medium"
                >
                  {c.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && (
          <div
            className="absolute -top-4 px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-xl pointer-events-none transform -translate-x-1/2 animate-in fade-in zoom-in-95 duration-100 z-10"
            style={{
              left: `${(coords[hoveredIndex].x / width) * 100}%`,
            }}
          >
            <span className="text-[10px] opacity-75 mr-1">{coords[hoveredIndex].label}:</span>
            <span>{coords[hoveredIndex].value}</span>
          </div>
        )}
      </div>
    </div>
  );
};
