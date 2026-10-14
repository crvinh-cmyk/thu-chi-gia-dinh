import React, { useState } from 'react';
import { X, Target, DollarSign } from 'lucide-react';
import { MonthlyBudget, Category } from '../types';
import { formatVND, numberToVietnameseWords } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: MonthlyBudget;
  expenseCategories: Category[];
  onSaveBudget: (budget: MonthlyBudget) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  currentBudget,
  expenseCategories,
  onSaveBudget,
}) => {
  const [totalBudgetStr, setTotalBudgetStr] = useState<string>(
    currentBudget.totalBudget ? currentBudget.totalBudget.toString() : '30000000'
  );
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(
    currentBudget.categoryBudgets || {}
  );

  if (!isOpen) return null;

  const numericTotal = parseInt(totalBudgetStr, 10) || 0;

  const handleCategoryBudgetChange = (catId: string, valStr: string) => {
    const rawVal = valStr.replace(/[^0-9]/g, '');
    const num = parseInt(rawVal, 10) || 0;
    setCategoryBudgets((prev) => ({
      ...prev,
      [catId]: num,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBudget({
      ...currentBudget,
      totalBudget: numericTotal,
      categoryBudgets,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 my-auto max-h-[92vh] flex flex-col">
        <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Thiết lập Ngân sách Tháng</h3>
              <p className="text-xs text-slate-500">
                Kiểm soát trần chi tiêu để bảo đảm kế hoạch tiết kiệm của gia đình
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Total Budget */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Tổng ngân sách chi tiêu tối đa trong tháng
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={totalBudgetStr ? parseInt(totalBudgetStr, 10).toLocaleString('vi-VN') : ''}
                onChange={(e) => setTotalBudgetStr(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="VD: 35.000.000"
                className="w-full text-xl font-bold px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100 outline-hidden text-right pr-14 text-indigo-700"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                VNĐ
              </span>
            </div>
            {numericTotal > 0 && (
              <p className="text-xs text-slate-500 italic mt-1.5 pl-1">
                {numberToVietnameseWords(numericTotal)}
              </p>
            )}
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-2">
            {[20000000, 30000000, 40000000, 50000000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTotalBudgetStr(preset.toString())}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                {formatVND(preset)}
              </button>
            ))}
          </div>

          {/* Category-specific budgets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Hạn mức theo từng danh mục (Tùy chọn)
              </label>
              <span className="text-xs text-slate-400">Có thể để trống</span>
            </div>
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {expenseCategories.map((cat) => {
                const currentVal = categoryBudgets[cat.id] || 0;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="relative w-36">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={currentVal > 0 ? currentVal.toLocaleString('vi-VN') : ''}
                        onChange={(e) => handleCategoryBudgetChange(cat.id, e.target.value)}
                        className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-200 text-right pr-6 focus:border-indigo-400 outline-hidden"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                        ₫
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all"
            >
              Lưu ngân sách
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
