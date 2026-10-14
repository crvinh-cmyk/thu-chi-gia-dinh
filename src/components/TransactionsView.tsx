import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Edit2,
  Download,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  X,
  Copy,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CheckSquare,
  Square,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Transaction, Category, FamilyMember, TransactionType } from '../types';
import { formatVND, formatDateVN, formatRelativeDateVN } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { exportTransactionsToCSV } from '../utils/storage';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  onOpenAddModal: (type?: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onDuplicateTransaction?: (tx: Transaction) => void;
  currentMonth: string;
}

type SortField = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  members,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  onDuplicateTransaction,
  currentMonth,
}) => {
  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'current_month' | 'prev_month' | 'this_year' | 'all' | 'custom'>('current_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date-desc');
  const [showFiltersMobile, setShowFiltersMobile] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete confirmation modal states
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const prevMonthStr = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  }, [currentMonth]);

  const currentYearStr = currentMonth.slice(0, 4);

  // Filtered transactions
  const filteredList = useMemo(() => {
    const list = transactions.filter((tx) => {
      // 1. Time filter
      if (timeFilter === 'current_month') {
        if (!tx.date.startsWith(currentMonth)) return false;
      } else if (timeFilter === 'prev_month') {
        if (!tx.date.startsWith(prevMonthStr)) return false;
      } else if (timeFilter === 'this_year') {
        if (!tx.date.startsWith(currentYearStr)) return false;
      } else if (timeFilter === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      // 2. Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) return false;

      // 3. Category filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;

      // 4. Member filter
      if (selectedMember !== 'all' && tx.memberId !== selectedMember) return false;

      // 5. Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const noteMatch = (tx.note || '').toLowerCase().includes(query);
        const catName = (categoryMap.get(tx.categoryId)?.name || '').toLowerCase();
        const memName = (memberMap.get(tx.memberId)?.name || '').toLowerCase();
        const amountMatch = tx.amount.toString().includes(query);
        if (!noteMatch && !catName.includes(query) && !memName.includes(query) && !amountMatch) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [
    transactions,
    timeFilter,
    currentMonth,
    prevMonthStr,
    currentYearStr,
    customStartDate,
    customEndDate,
    selectedType,
    selectedCategory,
    selectedMember,
    searchTerm,
    sortBy,
    categoryMap,
    memberMap,
  ]);

  // Reset page when filter changes
  useMemo(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchTerm, selectedType, selectedCategory, selectedMember, timeFilter, customStartDate, customEndDate, sortBy]);

  // Paginated records
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  // Summary stats for filtered results
  const summaryIncome = useMemo(
    () => filteredList.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [filteredList]
  );
  const summaryExpense = useMemo(
    () => filteredList.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [filteredList]
  );
  const summaryNet = summaryIncome - summaryExpense;

  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredList, categories, members);
  };

  const handleConfirmSingleDelete = () => {
    if (deleteTargetId) {
      onDeleteTransaction(deleteTargetId);
      setDeleteTargetId(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTargetId);
        return next;
      });
    }
  };

  const handleConfirmBulkDelete = () => {
    selectedIds.forEach((id) => onDeleteTransaction(id));
    setSelectedIds(new Set());
    setIsBulkDeleteModalOpen(false);
  };

  const toggleSelectAllPage = () => {
    const pageIds = paginatedList.map((t) => t.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedMember('all');
    setTimeFilter('current_month');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('date-desc');
  };

  const paymentLabels: Record<string, string> = {
    cash: 'Tiền mặt',
    transfer: 'Chuyển khoản',
    credit: 'Thẻ tín dụng',
    ewallet: 'Ví điện tử',
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedMember !== 'all' ||
    timeFilter !== 'current_month' ||
    sortBy !== 'date-desc';

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Mobile & Desktop Header with Quick Action Bar */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Sổ Giao Dịch
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                {filteredList.length} giao dịch
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Lịch sử thu chi, tìm kiếm và phân loại chi tiết
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa {selectedIds.size}</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
              title="Xuất file Excel CSV UTF-8"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>

            <button
              onClick={() => onOpenAddModal('expense')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shadow-xs shadow-rose-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Chi</span>
            </button>

            <button
              onClick={() => onOpenAddModal('income')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-xs shadow-emerald-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thu</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Compact Search & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xs space-y-2.5">
        {/* Search input + Filter toggle button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo ghi chú, số tiền, danh mục..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className={`sm:hidden p-2 rounded-xl border flex items-center gap-1 text-xs font-bold transition-colors ${
              showFiltersMobile || hasActiveFilters
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'border-slate-200 text-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Time Pills (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => setTimeFilter('current_month')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-bold transition-all ${
              timeFilter === 'current_month'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setTimeFilter('prev_month')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-bold transition-all ${
              timeFilter === 'prev_month'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tháng trước
          </button>
          <button
            onClick={() => setTimeFilter('this_year')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-bold transition-all ${
              timeFilter === 'this_year'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Năm {currentYearStr}
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-bold transition-all ${
              timeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setTimeFilter('custom')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-bold transition-all ${
              timeFilter === 'custom'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tùy chọn
          </button>
        </div>

        {/* Custom date range if active */}
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs flex-wrap border border-slate-100">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-hidden"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-hidden"
            />
          </div>
        )}

        {/* Secondary Filters (Always visible on desktop, toggleable on mobile) */}
        <div className={`space-y-2 pt-1 border-t border-slate-100 ${showFiltersMobile ? 'block' : 'hidden sm:block'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Type selector */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold outline-hidden"
              >
                <option value="all">Loại: Tất cả</option>
                <option value="expense">Khoản Chi (-)</option>
                <option value="income">Khoản Thu (+)</option>
              </select>

              {/* Category selector */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold outline-hidden max-w-[150px]"
              >
                <option value="all">Danh mục: Tất cả</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold outline-hidden"
              >
                <option value="date-desc">Mới nhất</option>
                <option value="date-asc">Cũ nhất</option>
                <option value="amount-desc">Số tiền lớn nhất</option>
                <option value="amount-asc">Số tiền nhỏ nhất</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-0.5 ml-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>

          {/* Quick Member avatar filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thành viên:</span>
            <button
              onClick={() => setSelectedMember('all')}
              className={`text-xs px-2.5 py-0.5 rounded-full border transition-all ${
                selectedMember === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 font-bold'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              Cả nhà
            </button>
            {members.map((m) => {
              const isSelected = selectedMember === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m.id)}
                  className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'border-slate-800 bg-slate-800 text-white font-bold shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: m.avatarColor }}
                  />
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Summary Metric Chips */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Giao dịch</p>
          <p className="text-base font-black text-slate-800 mt-0.5">{filteredList.length}</p>
        </div>
        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs text-center">
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Thu vào</p>
          <p className="text-sm sm:text-base font-black text-emerald-600 mt-0.5 truncate">
            +{formatVND(summaryIncome)}
          </p>
        </div>
        <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs text-center">
          <p className="text-[10px] font-bold text-rose-600 uppercase">Chi ra</p>
          <p className="text-sm sm:text-base font-black text-rose-600 mt-0.5 truncate">
            -{formatVND(summaryExpense)}
          </p>
        </div>
      </div>

      {/* 4. Transactions List (Cards on Mobile, Clean Table on Desktop) */}
      <div className="space-y-2">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-8 text-center border border-slate-100 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">Không tìm thấy giao dịch nào</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Hãy thử tìm kiếm từ khóa khác hoặc đặt lại bộ lọc.
            </p>
            <button
              onClick={resetAllFilters}
              className="mt-3 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Vertical Cards View (Criteria 4) */}
            <div className="sm:hidden space-y-2">
              {paginatedList.map((tx) => {
                const cat = categoryMap.get(tx.categoryId);
                const mem = memberMap.get(tx.memberId);
                const isExpense = tx.type === 'expense';
                const isSelected = selectedIds.has(tx.id);

                return (
                  <div
                    key={tx.id}
                    onClick={() => onEditTransaction(tx)}
                    className={`bg-white p-3 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50/20'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Category Icon */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-2xs"
                          style={{ backgroundColor: cat ? cat.color : '#94a3b8' }}
                        >
                          <CategoryIcon name={cat ? cat.icon : 'Tag'} className="w-5 h-5" />
                        </div>

                        {/* Middle: Title & Subtitle */}
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {tx.note || (cat ? cat.name : 'Giao dịch')}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-semibold text-slate-500">
                              {formatRelativeDateVN(tx.date)}
                            </span>
                            <span>•</span>
                            <span
                              className="font-bold inline-flex items-center gap-1"
                              style={{ color: mem ? mem.avatarColor : '#64748b' }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full inline-block"
                                style={{ backgroundColor: mem ? mem.avatarColor : '#64748b' }}
                              />
                              {mem ? mem.name : ''}
                            </span>
                            <span>•</span>
                            <span className="truncate">{cat ? cat.name : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Payment */}
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-sm font-black tracking-tight ${
                            isExpense ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {formatVND(tx.amount)}
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {tx.paymentMethod ? paymentLabels[tx.paymentMethod] : 'Tiền mặt'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action row */}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-50 text-[11px] text-slate-400">
                      <span className="text-[10px]">Chạm để sửa chi tiết</span>
                      <div className="flex items-center gap-3">
                        {onDuplicateTransaction && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateTransaction(tx);
                            }}
                            className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(tx.id);
                          }}
                          className="font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-3xl border border-slate-100 shadow-2xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-10 text-center">
                      <button
                        onClick={toggleSelectAllPage}
                        title="Chọn tất cả trên trang này"
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {paginatedList.every((t) => selectedIds.has(t.id)) && paginatedList.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Ngày</th>
                    <th className="py-3.5 px-4">Danh mục</th>
                    <th className="py-3.5 px-4">Ghi chú</th>
                    <th className="py-3.5 px-4">Thành viên</th>
                    <th className="py-3.5 px-4">Hình thức</th>
                    <th className="py-3.5 px-4 text-right">Số tiền (VNĐ)</th>
                    <th className="py-3.5 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedList.map((tx) => {
                    const cat = categoryMap.get(tx.categoryId);
                    const mem = memberMap.get(tx.memberId);
                    const isExpense = tx.type === 'expense';
                    const isSelected = selectedIds.has(tx.id);

                    return (
                      <tr
                        key={tx.id}
                        className={`transition-colors group ${
                          isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleSelectId(tx.id)}
                            className="text-slate-400 hover:text-indigo-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                          {formatDateVN(tx.date)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-2xs"
                              style={{ backgroundColor: cat ? cat.color : '#94a3b8' }}
                            >
                              <CategoryIcon name={cat ? cat.icon : 'Tag'} className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-semibold text-slate-800 text-xs">
                              {cat ? cat.name : 'Khác'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-800 text-xs font-normal max-w-xs truncate">
                            {tx.note || '—'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${mem ? mem.avatarColor : '#64748b'}15`,
                              color: mem ? mem.avatarColor : '#64748b',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full inline-block"
                              style={{ backgroundColor: mem ? mem.avatarColor : '#64748b' }}
                            />
                            {mem ? mem.name : 'Gia đình'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                          {tx.paymentMethod ? paymentLabels[tx.paymentMethod] || tx.paymentMethod : 'Tiền mặt'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span
                            className={`font-black text-sm ${
                              isExpense ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {isExpense ? '-' : '+'}
                            {formatVND(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {onDuplicateTransaction && (
                              <button
                                onClick={() => onDuplicateTransaction(tx)}
                                title="Nhân bản giao dịch này"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onEditTransaction(tx)}
                              title="Chỉnh sửa giao dịch"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(tx.id)}
                              title="Xóa giao dịch"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-white p-3 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Xem</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>dòng • Tổng {filteredList.length} giao dịch</span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-bold text-slate-700">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">Xác nhận xóa giao dịch?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Khoản thu chi này sẽ bị xóa khỏi sổ chi tiêu.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                Xóa {selectedIds.size} giao dịch đã chọn?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Tất cả các khoản đã chọn sẽ bị xóa vĩnh viễn khỏi sổ.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
