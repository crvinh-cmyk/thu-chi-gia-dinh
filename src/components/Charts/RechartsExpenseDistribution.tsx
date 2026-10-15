import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { BarChart3, ListFilter, Info } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'list' | 'bar'>('list');

  if (totalValue <= 0 || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 min-h-[180px]">
        <p className="text-zinc-700 font-bold text-xs">Chưa có dữ liệu chi tiêu trong tháng</p>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
          Các khoản chi được ghi chép sẽ tự động tính toán và phân bổ cơ cấu tại đây.
        </p>
      </div>
    );
  }

  // Custom Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategoryExpenseData;
      return (
        <div className="bg-zinc-900 text-white px-3 py-2 rounded-xl shadow-xl text-xs pointer-events-none z-50">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-bold">{item.name}</span>
          </div>
          <p className="text-zinc-300 text-[11px]">
            Số tiền: <strong className="text-white">{formatVND(item.value)}</strong> ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-3">
      {/* Header Info & View Switcher */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-semibold">
          <Info className="w-3.5 h-3.5 text-zinc-700" />
          <span>Tổng chi: <strong className="text-zinc-900">{formatVND(totalValue)}</strong></span>
        </div>

        <div className="flex items-center bg-zinc-100 p-0.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
              viewMode === 'list'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <ListFilter className="w-3 h-3" />
            <span>Danh sách %</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('bar')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
              viewMode === 'bar'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Biểu đồ Cột</span>
          </button>
        </div>
      </div>

      {/* Multi-segment Cumulative Percentage Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-3 rounded-full bg-zinc-100 overflow-hidden flex shadow-2xs">
          {data.map((item) => (
            <div
              key={item.id}
              className="h-full transition-all duration-300 border-r border-white/30 last:border-0"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: item.color,
              }}
              title={`${item.name}: ${item.percentage}% (${formatVND(item.value)})`}
            />
          ))}
        </div>
      </div>

      {/* Content View: Category Breakdown List or Horizontal Bar Chart */}
      {viewMode === 'list' ? (
        <div className="space-y-2 pt-1">
          {data.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-2xl bg-zinc-50/80 hover:bg-zinc-100/80 transition-colors border border-zinc-200/50 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-2xs"
                    style={{ backgroundColor: item.color }}
                  >
                    <CategoryIcon name={item.icon} className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-zinc-900 truncate">
                      {item.name}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-extrabold text-zinc-900">
                    {formatVND(item.value)}
                  </p>
                </div>
              </div>

              {/* Progress percentage bar per item */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-zinc-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-black text-zinc-700 min-w-[32px] text-right"
                >
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Recharts Horizontal Bar Chart */
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 15, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
              <XAxis
                type="number"
                tickFormatter={(val) => formatCompactVND(val)}
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 10, fill: '#27272a', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={500}>
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

