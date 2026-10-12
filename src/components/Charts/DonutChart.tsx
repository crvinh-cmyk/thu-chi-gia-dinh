import React, { useState } from 'react';
import { formatVND } from '../../utils/formatters';
import { CategoryIcon } from '../CategoryIcon';

export interface ChartSegment {
  id: string;
  name: string;
  value: number;
  color: string;
  icon: string;
}

interface DonutChartProps {
  data: ChartSegment[];
  totalValue: number;
  title?: string;
  emptyMessage?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  totalValue,
  title = 'Cơ cấu chi tiêu',
  emptyMessage = 'Chưa có khoản chi nào trong thời gian này',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (totalValue <= 0 || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <p className="text-slate-500 font-medium">{emptyMessage}</p>
        <p className="text-xs text-slate-400 mt-1">Hãy thêm các khoản chi tiêu để xem biểu đồ phân tích</p>
      </div>
    );
  }

  // Calculate SVG arc paths
  const size = 260;
  const strokeWidth = 38;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;
  const segmentsWithAngles = data.map((item, idx) => {
    const percentage = item.value / totalValue;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += percentage;

    return {
      ...item,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      strokeDashoffset,
      index: idx,
    };
  });

  const activeItem = hoveredIndex !== null ? segmentsWithAngles[hoveredIndex] : null;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* SVG Donut Circle */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 filter drop-shadow-sm transition-all"
        >
          {segmentsWithAngles.map((seg, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <circle
                key={seg.id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {activeItem ? (
            <div className="animate-fade-in flex flex-col items-center">
              <span className="text-xs font-medium text-slate-500 max-w-[120px] truncate">
                {activeItem.name}
              </span>
              <span className="text-base font-bold text-slate-900 mt-0.5">
                {formatVND(activeItem.value)}
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 text-white shadow-xs"
                style={{ backgroundColor: activeItem.color }}
              >
                {activeItem.percentage}%
              </span>
            </div>
          ) : (
            <>
              <span className="text-xs font-medium text-slate-400">Tổng chi tiêu</span>
              <span className="text-base lg:text-lg font-bold text-slate-900 mt-0.5">
                {formatVND(totalValue)}
              </span>
              <span className="text-xs text-slate-400 mt-1">{data.length} danh mục</span>
            </>
          )}
        </div>
      </div>

      {/* Legend & Details */}
      <div className="flex-1 w-full space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {segmentsWithAngles.map((seg, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={seg.id}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                isHovered
                  ? 'bg-slate-100/80 shadow-xs translate-x-1'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                  style={{ backgroundColor: seg.color }}
                >
                  <CategoryIcon name={seg.icon} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{seg.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold" style={{ color: seg.color }}>
                      {seg.percentage}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0 pl-2">
                <span className="text-sm font-semibold text-slate-900">
                  {formatVND(seg.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
