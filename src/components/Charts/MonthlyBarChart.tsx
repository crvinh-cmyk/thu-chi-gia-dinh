import React from 'react';
import { formatCompactVND, formatVND } from '../../utils/formatters';

export interface MonthlyStats {
  monthKey: string; // YYYY-MM
  label: string;    // e.g. "T09", "T10"
  income: number;
  expense: number;
}

interface MonthlyBarChartProps {
  data: MonthlyStats[];
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ data }) => {
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1000000 // avoid div by zero
  );

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center justify-end gap-5 mb-4 text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
          <span className="text-slate-600">Thu nhập</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
          <span className="text-slate-600">Chi tiêu</span>
        </div>
      </div>

      {/* Bars container */}
      <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-56 pt-6 pb-2 border-b border-slate-100">
        {data.map((item) => {
          const incHeight = (item.income / maxVal) * 100;
          const expHeight = (item.expense / maxVal) * 100;

          return (
            <div key={item.monthKey} className="group flex flex-col items-center h-full justify-end relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] rounded-lg py-1.5 px-2.5 pointer-events-none z-20 shadow-lg whitespace-nowrap">
                <p className="font-semibold">{item.monthKey}</p>
                <p className="text-emerald-400">Thu: {formatVND(item.income)}</p>
                <p className="text-rose-400">Chi: {formatVND(item.expense)}</p>
              </div>

              {/* Bar columns */}
              <div className="flex items-end gap-1 sm:gap-2 h-full w-full justify-center px-1">
                {/* Income Bar */}
                <div className="w-3 sm:w-5 bg-slate-100 rounded-t-md flex items-end h-full">
                  <div
                    style={{ height: `${Math.max(incHeight, 2)}%` }}
                    className="w-full bg-emerald-500 rounded-t-md transition-all duration-500 group-hover:bg-emerald-600"
                  />
                </div>

                {/* Expense Bar */}
                <div className="w-3 sm:w-5 bg-slate-100 rounded-t-md flex items-end h-full">
                  <div
                    style={{ height: `${Math.max(expHeight, 2)}%` }}
                    className="w-full bg-rose-500 rounded-t-md transition-all duration-500 group-hover:bg-rose-600"
                  />
                </div>
              </div>

              {/* Label */}
              <span className="text-xs font-medium text-slate-500 mt-2">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Axis notes */}
      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-1">
        <span>Đơn vị: VNĐ</span>
        <span>Cao nhất: {formatCompactVND(maxVal)}</span>
      </div>
    </div>
  );
};
