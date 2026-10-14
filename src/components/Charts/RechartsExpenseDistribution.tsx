import React, { useState } from 'react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, Info } from 'lucide-react';
import { formatVND, formatCompactVND } from '../../utils/formatters';
import { CategoryIcon } from '../CategoryIcon';

export interface CategoryExpenseData {
  id: string;
  name: string;
  value: number;
  color: string;
  icon: string;
  percentage: number;
}

interface RechartsExpenseDistributionProps {
  data: CategoryExpenseData[];
  totalValue: number;
}

export const RechartsExpenseDistribution: React.FC<RechartsExpenseDistributionProps> = ({
  data,
  totalValue,
}) => {
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (totalValue <= 0 || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 min-h-[320px]">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <PieIcon className="w-7 h-7" />
        </div>
        <p className="text-slate-600 font-bold text-sm">Chưa có dữ liệu chi tiêu trong tháng</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Các khoản chi được ghi chép sẽ tự động tính toán và hiển thị tỷ lệ cơ cấu tại đây.
        </p>
      </div>
    );
  }

  // Custom tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategoryExpenseData;
      return (
        <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-xl text-xs border border-slate-700 pointer-events-none z-50">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-bold text-sm">{item.name}</span>
          </div>
          <div className="flex justify-between items-center gap-4 text-slate-300">
            <span>Số tiền:</span>
            <span className="font-bold text-white text-sm">{formatVND(item.value)}</span>
          </div>
          <div className="flex justify-between items-center gap-4 text-slate-400 mt-0.5">
            <span>Tỷ trọng:</span>
            <span className="font-semibold text-emerald-400">{item.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategoryExpenseData;
      return (
        <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-xl text-xs border border-slate-700 pointer-events-none z-50">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-bold text-sm">{item.name}</span>
          </div>
          <p className="text-slate-300">
            Chi: <span className="font-bold text-white">{formatVND(item.value)}</span> ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-4">
      {/* Chart View Toggle Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <span>Tổng chi: <strong className="text-slate-900">{formatVND(totalValue)}</strong></span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setChartType('donut')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              chartType === 'donut'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Biểu đồ Tròn</span>
          </button>
          <button
            type="button"
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              chartType === 'bar'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Biểu đồ Cột</span>
          </button>
        </div>
      </div>

      {/* Chart Render Area */}
      {chartType === 'donut' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Recharts Pie (Donut) */}
          <div className="md:col-span-6 h-64 sm:h-72 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={800}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={activeIndex === index ? 3 : 1}
                      className="transition-all duration-300 outline-hidden cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </RechartsPie>
            </ResponsiveContainer>

            {/* Donut Center Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {activeIndex !== null && data[activeIndex] ? (
                <>
                  <span className="text-[11px] font-semibold text-slate-500 max-w-[110px] truncate">
                    {data[activeIndex].name}
                  </span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCompactVND(data[activeIndex].value)}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white mt-0.5"
                    style={{ backgroundColor: data[activeIndex].color }}
                  >
                    {data[activeIndex].percentage}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[11px] text-slate-400 font-medium">Tổng chi</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCompactVND(totalValue)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {data.length} danh mục
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="md:col-span-6 space-y-2 max-h-72 overflow-y-auto pr-1">
            {data.map((item, idx) => {
              const isHovered = activeIndex === idx;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-slate-100 shadow-xs translate-x-1'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    >
                      <CategoryIcon name={item.icon} className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                      <span className="text-[11px] font-semibold" style={{ color: item.color }}>
                        {item.percentage}% cơ cấu
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-2">
                    <p className="text-xs font-extrabold text-slate-900">
                      {formatVND(item.value)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Recharts Horizontal Bar Chart */
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                tickFormatter={(val) => formatCompactVND(val)}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="value"
                radius={[0, 6, 6, 0]}
                animationDuration={800}
              >
                {data.map((entry) => (
                  <Cell key={`bar-${entry.id}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
