import React, { useState, useRef } from "react";
import { MetricPoint } from "../types";

interface CustomChartProps {
  data: MetricPoint[];
  dataKey: keyof MetricPoint;
  label: string;
  color: string;
  fillColor: string;
  unit?: string;
  gridLines?: boolean;
}

export default function CustomChart({
  data,
  dataKey,
  label,
  color,
  fillColor,
  unit = "",
  gridLines = true
}: CustomChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fallback if data is empty
  if (data.length === 0) {
    return (
      <div className="h-44 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50 text-slate-400 font-mono text-xs">
        <span className="animate-pulse">Aguardando telemetria...</span>
      </div>
    );
  }

  // Get only latest 30 points for fluid sliding window
  const chartPoints = data.slice(-35);
  
  // Calculate vertical limits
  const values = chartPoints.map((d) => Number(d[dataKey]) || 0);
  const maxVal = Math.max(...values, 10) * 1.15; // 15% head room
  const minVal = 0;
  const range = maxVal - minVal;

  // Chart dimensions
  const width = 500;
  const height = 150;
  const paddingX = 10;
  const paddingY = 15;

  // Transform datum to coordinate map
  const points = chartPoints.map((d, index) => {
    const val = Number(d[dataKey]) || 0;
    const x = paddingX + (index / (chartPoints.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((val - minVal) / range) * (height - 2 * paddingY);
    return { x, y, val, original: d };
  });

  // SVG Line path definition (splines or line coordinates)
  let linePath = "";
  let areaPath = "";

  if (points.length > 0) {
    // Generate straight-line path
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    
    // Closed path for fill area
    areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  }

  // Handle pointer tracking
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xCoord = e.clientX - rect.left;
    const relativeX = xCoord / rect.width;
    
    // Map to closest index
    const index = Math.round(relativeX * (chartPoints.length - 1));
    if (index >= 0 && index < chartPoints.length) {
      setHoverIndex(index);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeHover = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Title & Real Time Marker */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-sm font-mono font-bold" style={{ color }}>
          {activeHover ? activeHover.val.toFixed(1) : values[values.length - 1].toFixed(1)}
          <span className="text-[10px] ml-0.5 text-slate-500 font-normal lowercase">{unit}</span>
        </span>
      </div>

      <div className="relative border border-slate-100 rounded-xl p-2 bg-slate-50/50 overflow-hidden shadow-inner">
        {/* Grids / Labels inside Chart */}
        <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-400 pointer-events-none">
          MAX: {maxVal.toFixed(0)}
        </div>
        <div className="absolute bottom-1.5 left-2 text-[8px] font-mono text-slate-400 pointer-events-none">
          MIN: 0
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-36 overflow-visible select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Background Grid Lines */}
          {gridLines && (
            <>
              {/* Horizontal rule markers */}
              <line x1={0} y1={paddingY} x2={width} y2={paddingY} stroke="#e2e8f0" strokeDasharray="3,3" strokeWidth={0.5} />
              <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#f1f5f9" strokeDasharray="3,3" strokeWidth={0.5} />
              <line x1={0} y1={height - paddingY} x2={width} y2={height - paddingY} stroke="#cbd5e1" strokeWidth={0.75} />
            </>
          )}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill={fillColor} className="transition-all duration-300" />}

          {/* Sparkline Accent */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Hover tracker line */}
          {activeHover && (
            <>
              <line
                x1={activeHover.x}
                y1={paddingY}
                x2={activeHover.x}
                y2={height - paddingY}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="2,2"
              />
              <circle
                cx={activeHover.x}
                cy={activeHover.y}
                r={4}
                fill={color}
                stroke="#ffffff"
                strokeWidth={1.5}
              />
            </>
          )}
        </svg>

        {/* Hover detail tooltip overlay */}
        {activeHover && (
          <div className="absolute bottom-2 right-2 bg-white/95 border border-slate-200 rounded-lg p-1.5 px-2 text-[10px] shadow-lg pointer-events-none backdrop-blur-md">
            <div className="font-mono text-[9px] text-slate-500 mb-0.5">
              T+{Math.round((new Date((activeHover as any).original.timestamp).getTime() - new Date(chartPoints[0].timestamp).getTime()) / 1000)}s
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-mono text-slate-800 font-semibold">
                {activeHover.val.toFixed(2)} {unit}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
