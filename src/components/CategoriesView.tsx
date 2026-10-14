import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  X,
  Edit2,
  Eye,
  Search,
  Target,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Category, Transaction, MonthlyBudget, TransactionType, FamilyMember } from '../types';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import { formatVND, formatDateVN, formatRelativeDateVN } from '../utils/formatters';

interface CategoriesViewProps {
  categories: Category[];
  transactions: Transaction[];
  members: FamilyMember[];
  currentMonth: string;
  budget: MonthlyBudget;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategoryBudget: (catId: string, amount: number) => void;
  onEditTransaction?: (tx: Transaction) => void;
}

const PRESET_COLORS = [
  '#f97316', // Cam
  '#0ea5e9', // Xanh da trời
  '#8b5cf6', // Tím
  '#6366f1', // Chàm
  '#ef4444', // Đỏ
  '#ec4899', // Hồng
  '#f59e0b', // Hổ phách
  '#14b8a6', // Xanh mòng két
  '#10b981', // Xanh lục
  '#3b82f6', // Xanh dương
  '#84cc16', // Xanh lá mạ
  '#64748b', // Xám đá
];

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  transactions,
  members,
  currentMonth,
  budget,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onUpdateCategoryBudget,
  onEditTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [color, setColor] = useState('#f97316');
  const [budgetLimitStr, setBudgetLimitStr] = useState('');
  const [error, setError] = useState('');

  // Category Detail Modal (view transactions in this category)
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState<Category | null>(null);

  // Lookups
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Current month transactions
  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(currentMonth)),
    [transactions, currentMonth]
  );

  // Compute spent/income per category
  const statsByCategory = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    monthTransactions.forEach((t) => {
      if (!map[t.categoryId]) {
        map[t.categoryId] = { total: 0, count: 0 };
      }
      map[t.categoryId].total += t.amount;
      map[t.categoryId].count += 1;
    });
    return map;
  }, [monthTransactions]);

  const totalExpenseThisMonth = useMemo(
    () => monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );

  const totalIncomeThisMonth = useMemo(
    () => monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );

  // Filtered categories by active tab and search
  const displayedCategories = useMemo(() => {
    return categories
      .filter((c) => c.type === activeTab)
      .filter((c) => (searchQuery ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true))
      .sort((a, b) => {
        const totalA = statsByCategory[a.id]?.total || 0;
        const totalB = statsByCategory[b.id]?.total || 0;
        return totalB - totalA;
      });
  }, [categories, activeTab, searchQuery, statsByCategory]);

  // Top spending / income categories
  const topExpenseCategory = useMemo(() => {
    const expenseCats = categories.filter((c) => c.type === 'expense');
    return expenseCats.reduce((max, cat) => {
      const val = statsByCategory[cat.id]?.total || 0;
      return val > (statsByCategory[max?.id]?.total || 0) ? cat : max;
    }, expenseCats[0]);
  }, [categories, statsByCategory]);

  const topIncomeCategory = useMemo(() => {
    const incomeCats = categories.filter((c) => c.type === 'income');
    return incomeCats.reduce((max, cat) => {
      const val = statsByCategory[cat.id]?.total || 0;
      return val > (statsByCategory[max?.id]?.total || 0) ? cat : max;
    }, incomeCats[0]);
  }, [categories, statsByCategory]);

  const handleOpenAddModal = (type: TransactionType) => {
    setEditingCategory(null);
    setActiveTab(type);
    setName('');
    setIcon(type === 'expense' ? 'ShoppingBag' : 'Wallet');
    setColor(type === 'expense' ? '#f97316' : '#10b981');
    setBudgetLimitStr('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setActiveTab(cat.type);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
    const catBudget = budget.categoryBudgets?.[cat.id] || 0;
    setBudgetLimitStr(catBudget > 0 ? catBudget.toString() : '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên danh mục');
      return;
    }

    const budgetNum = parseInt(budgetLimitStr.replace(/[^0-9]/g, ''), 10) || 0;

    if (editingCategory) {
      // Update existing
      onUpdateCategory({
        ...editingCategory,
        name: name.trim(),
        icon,
        color,
      });
      onUpdateCategoryBudget(editingCategory.id, budgetNum);
    } else {
      // Add new
      onAddCategory({
        name: name.trim(),
        type: activeTab,
        icon,
        color,
        isCustom: true,
      });
    }

    setIsModalOpen(false);
  };

  // Transactions inside selected category for Detail Modal
  const categoryDetailTransactions = useMemo(() => {
    if (!selectedCategoryForDetail) return [];
    return monthTransactions
      .filter((t) => t.categoryId === selectedCategoryForDetail.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [monthTransactions, selectedCategoryForDetail]);

  const categoryDetailTotal = useMemo(
    () => categoryDetailTransactions.reduce((s, t) => s + t.amount, 0),
    [categoryDetailTransactions]
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản Lý Danh Mục Thu & Chi</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân loại khoa học các khoản sinh hoạt, học tập, ăn uống, nhà cửa và nguồn thu nhập
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddModal('expense')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs shadow-rose-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Danh Mục Chi Tiêu</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('income')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs shadow-emerald-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Danh Mục Thu Nhập</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Danh mục chi</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {categories.filter((c) => c.type === 'expense').length}{' '}
            <span className="text-xs font-normal text-slate-400">nhóm</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Tổng chi: {formatVND(totalExpenseThisMonth)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Danh mục thu</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {categories.filter((c) => c.type === 'income').length}{' '}
            <span className="text-xs font-normal text-slate-400">nguồn</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Tổng thu: {formatVND(totalIncomeThisMonth)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Chi nhiều nhất</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-900 truncate">
            {topExpenseCategory?.name || 'Chưa có'}
          </p>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            {formatVND(statsByCategory[topExpenseCategory?.id]?.total || 0)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Thu nhiều nhất</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-sm font-bold text-slate-900 truncate">
            {topIncomeCategory?.name || 'Chưa có'}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            {formatVND(statsByCategory[topIncomeCategory?.id]?.total || 0)}
          </p>
        </div>
      </div>

      {/* 3. Tab Switcher & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'expense'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Khoản Chi Tiêu ({categories.filter((c) => c.type === 'expense').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'income'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Khoản Thu Nhập ({categories.filter((c) => c.type === 'income').length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm danh mục..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Grid of Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCategories.map((cat) => {
          const stats = statsByCategory[cat.id] || { total: 0, count: 0 };
          const catBudget = budget.categoryBudgets?.[cat.id] || 0;
          const isOverBudget = cat.type === 'expense' && catBudget > 0 && stats.total > catBudget;
          const budgetPct = catBudget > 0 ? Math.min(Math.round((stats.total / catBudget) * 100), 100) : 0;
          const totalBase = cat.type === 'expense' ? totalExpenseThisMonth : totalIncomeThisMonth;
          const proportion = totalBase > 0 ? Math.round((stats.total / totalBase) * 100) : 0;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: Icon + Name + Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{cat.name}</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <span>{stats.count} giao dịch</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">{proportion}% tổng</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      title="Chỉnh sửa danh mục & hạn mức"
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {cat.isCustom && (
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"?`)) {
                            onDeleteCategory(cat.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xóa danh mục tự tạo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Amount details */}
                <div className="pt-2 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {cat.type === 'expense' ? 'Đã chi tháng này:' : 'Thu về tháng này:'}
                  </span>
                  <span
                    className={`text-base font-extrabold ${
                      cat.type === 'expense' ? 'text-slate-900' : 'text-emerald-600'
                    }`}
                  >
                    {formatVND(stats.total)}
                  </span>
                </div>

                {/* Category Budget progress bar if expense & budget is set */}
                {cat.type === 'expense' && catBudget > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Target className="w-3 h-3 text-indigo-500" /> Hạn mức:
                      </span>
                      <span
                        className={`font-bold ${
                          isOverBudget ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {formatVND(catBudget)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverBudget
                            ? 'bg-rose-500'
                            : budgetPct > 80
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${budgetPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] mt-1 text-slate-400">
                      <span>Đã dùng {budgetPct}%</span>
                      {isOverBudget ? (
                        <span className="text-rose-600 font-bold">Vượt ngân sách!</span>
                      ) : (
                        <span>Còn lại {formatVND(catBudget - stats.total)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Action: View transactions */}
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <button
                  onClick={() => setSelectedCategoryForDetail(cat)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem {stats.count} giao dịch</span>
                </button>
                <button
                  onClick={() => handleOpenEditModal(cat)}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-600 underline"
                >
                  {catBudget > 0 ? 'Đổi hạn mức' : '+ Đặt hạn mức'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 my-auto max-h-[92vh] flex flex-col">
            <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${
                    activeTab === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                >
                  {activeTab === 'expense' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCategory ? `Chỉnh sửa: ${editingCategory.name}` : `Thêm danh mục ${activeTab === 'expense' ? 'Chi tiêu' : 'Thu nhập'} mới`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thiết lập tên, màu sắc, biểu tượng và ngân sách
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tên danh mục */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Cà phê, Bảo hiểm, Thưởng lễ tết, Tiền điện..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden font-medium"
                  autoFocus
                />
              </div>

              {/* Hạn mức ngân sách tháng nếu là Chi tiêu */}
              {activeTab === 'expense' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-indigo-500" />
                      Hạn mức ngân sách tháng (VNĐ)
                    </label>
                    <span className="text-[11px] text-slate-400">Tùy chọn</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        budgetLimitStr
                          ? parseInt(budgetLimitStr.replace(/[^0-9]/g, ''), 10).toLocaleString('vi-VN')
                          : ''
                      }
                      onChange={(e) => setBudgetLimitStr(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="VD: 5.000.000"
                      className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden font-semibold text-right pr-12 text-indigo-600"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₫
                    </span>
                  </div>
                </div>
              )}

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Màu sắc nhận diện
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
                  Biểu tượng (Icon)
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1.5 border border-slate-100 rounded-xl bg-slate-50">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setIcon(ic.name)}
                      title={ic.label}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                        icon === ic.name
                          ? 'bg-indigo-600 text-white shadow-xs scale-105'
                          : 'bg-white text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <CategoryIcon name={ic.name} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-200 transition-colors"
                >
                  {editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Category Detail Modal (view transactions in this category) */}
      {selectedCategoryForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 my-auto max-h-[92vh] flex flex-col">
            <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: selectedCategoryForDetail.color }}
                >
                  <CategoryIcon name={selectedCategoryForDetail.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Danh mục: {selectedCategoryForDetail.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tổng cộng: <strong className="text-slate-900">{formatVND(categoryDetailTotal)}</strong> ({categoryDetailTransactions.length} giao dịch)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCategoryForDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-200/60 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto space-y-2 divide-y divide-slate-100">
              {categoryDetailTransactions.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">
                  Không có giao dịch nào được ghi nhận cho danh mục này trong tháng đang chọn.
                </p>
              ) : (
                categoryDetailTransactions.map((tx) => {
                  const mem = memberMap.get(tx.memberId);
                  const isExpense = tx.type === 'expense';
                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        if (onEditTransaction) {
                          onEditTransaction(tx);
                          setSelectedCategoryForDetail(null);
                        }
                      }}
                      className="pt-2.5 pb-2 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{tx.note || 'Giao dịch'}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateVN(tx.date)} • {mem ? mem.name : 'Gia đình'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-bold ${
                            isExpense ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {formatVND(tx.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Bấm vào giao dịch để chỉnh sửa nhanh</span>
              <button
                onClick={() => setSelectedCategoryForDetail(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
