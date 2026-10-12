import React, { useState } from 'react';
import { Plus, Tag, Trash2, ArrowDownRight, ArrowUpRight, X } from 'lucide-react';
import { Category, Transaction, MonthlyBudget, TransactionType } from '../types';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import { formatVND } from '../utils/formatters';

interface CategoriesViewProps {
  categories: Category[];
  transactions: Transaction[];
  currentMonth: string;
  budget: MonthlyBudget;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
}

const PRESET_COLORS = [
  '#f97316', // Orange
  '#0ea5e9', // Sky blue
  '#8b5cf6', // Violet
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#14b8a6', // Teal
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#84cc16', // Lime
  '#64748b', // Slate
];

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  transactions,
  currentMonth,
  budget,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [color, setColor] = useState('#f97316');
  const [error, setError] = useState('');

  // Transactions in current month
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));

  // Compute spent amount per category
  const amountByCategory: Record<string, number> = {};
  monthTransactions.forEach((t) => {
    amountByCategory[t.categoryId] = (amountByCategory[t.categoryId] || 0) + t.amount;
  });

  const displayedCategories = categories.filter((c) => c.type === activeTab);

  const handleOpenAddModal = (type: TransactionType) => {
    setActiveTab(type);
    setName('');
    setIcon(type === 'expense' ? 'ShoppingBag' : 'Wallet');
    setColor(type === 'expense' ? '#ef4444' : '#10b981');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }

    onAddCategory({
      name: name.trim(),
      type: activeTab,
      icon,
      color,
      isCustom: true,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản Lý Danh Mục Thu & Chi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổ chức các nhóm chi tiêu và nguồn thu để phân loại ngân sách khoa học
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal(activeTab)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-200 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm danh mục mới</span>
        </button>
      </div>

      {/* Type Tab Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'expense'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Danh mục Chi tiêu ({categories.filter((c) => c.type === 'expense').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('income')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'income'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Danh mục Thu nhập ({categories.filter((c) => c.type === 'income').length})</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCategories.map((cat) => {
          const spentThisMonth = amountByCategory[cat.id] || 0;
          const catBudget = budget.categoryBudgets?.[cat.id] || 0;
          const isOverBudget = catBudget > 0 && spentThisMonth > catBudget;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{cat.name}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {cat.isCustom ? 'Danh mục tự tạo' : 'Mặc định hệ thống'}
                    </span>
                  </div>
                </div>

                {cat.isCustom && (
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                    title="Xóa danh mục tự tạo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Amount stats */}
              <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {cat.type === 'expense' ? 'Đã chi tháng này:' : 'Thu về tháng này:'}
                </span>
                <span
                  className={`font-bold text-sm ${
                    cat.type === 'expense' ? 'text-slate-900' : 'text-emerald-600'
                  }`}
                >
                  {formatVND(spentThisMonth)}
                </span>
              </div>

              {/* Category Budget Indicator if set */}
              {cat.type === 'expense' && catBudget > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100/70">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-slate-500">Hạn mức danh mục:</span>
                    <span className={isOverBudget ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}>
                      {formatVND(catBudget)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isOverBudget ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}
                      style={{
                        width: `${Math.min(Math.round((spentThisMonth / catBudget) * 100), 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                Thêm danh mục {activeTab === 'expense' ? 'Chi tiêu' : 'Thu nhập'} mới
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Cà phê gặp gỡ, Bảo hiểm, Thưởng tết..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden"
                  autoFocus
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Màu đại diện
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Biểu tượng
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setIcon(ic.name)}
                      title={ic.label}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                        icon === ic.name
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <CategoryIcon name={ic.name} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  Tạo danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
