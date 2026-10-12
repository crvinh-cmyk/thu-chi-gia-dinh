import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
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
} from 'lucide-react';
import { Transaction, Category, FamilyMember, TransactionType } from '../types';
import { formatVND, formatDateVN } from '../utils/formatters';
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

  // Previous month string helper
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
    <div className="space-y-5">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Quản Lý Lịch Sử Giao Dịch</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {filteredList.length} bản ghi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Thêm mới, sửa, xóa, nhân bản và lọc chi tiết các khoản thu chi gia đình
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa {selectedIds.size} đã chọn</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            title="Xuất file Excel CSV tương thích UTF-8"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Xuất Excel / CSV</span>
            <span className="sm:hidden">Xuất</span>
          </button>

          <button
            onClick={() => onOpenAddModal('expense')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs shadow-rose-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ghi Khoản Chi</span>
          </button>

          <button
            onClick={() => onOpenAddModal('income')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs shadow-emerald-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ghi Khoản Thu</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Control Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        {/* Search input and Time Preset Tabs */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo ghi chú, danh mục, số tiền, thành viên..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Time Preset Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto scrollbar-none">
            <button
              onClick={() => setTimeFilter('current_month')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                timeFilter === 'current_month'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setTimeFilter('prev_month')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                timeFilter === 'prev_month'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tháng trước
            </button>
            <button
              onClick={() => setTimeFilter('this_year')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                timeFilter === 'this_year'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Năm {currentYearStr}
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                timeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTimeFilter('custom')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                timeFilter === 'custom'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tùy chọn ngày
            </button>
          </div>
        </div>

        {/* Custom date range picker */}
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-xs flex-wrap border border-slate-100 animate-fade-in">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium">Từ ngày:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-hidden focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium">Đến ngày:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Secondary Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Lọc:</span>
            </div>

            {/* Type selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-hidden focus:border-indigo-400 font-medium"
            >
              <option value="all">Loại: Tất cả</option>
              <option value="expense">Chi tiêu (Khoản Chi)</option>
              <option value="income">Thu nhập (Khoản Thu)</option>
            </select>

            {/* Category selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-hidden focus:border-indigo-400 font-medium max-w-[180px]"
            >
              <option value="all">Danh mục: Tất cả ({categories.length})</option>
              <optgroup label="Danh mục Chi tiêu">
                {categories
                  .filter((c) => c.type === 'expense')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Danh mục Thu nhập">
                {categories
                  .filter((c) => c.type === 'income')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            </select>

            {/* Member selector */}
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-hidden focus:border-indigo-400 font-medium"
            >
              <option value="all">Thành viên: Cả nhà</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>

            {/* Sort selector */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-hidden focus:border-indigo-400 font-medium"
              >
                <option value="date-desc">Ngày: Mới nhất trước</option>
                <option value="date-asc">Ngày: Cũ nhất trước</option>
                <option value="amount-desc">Số tiền: Lớn nhất trước</option>
                <option value="amount-asc">Số tiền: Nhỏ nhất trước</option>
              </select>
            </div>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-rose-500 hover:text-rose-700 font-medium underline underline-offset-2 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>

        {/* Quick Member avatar filter pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-50 overflow-x-auto scrollbar-none">
          <span className="text-[11px] text-slate-400 font-medium">Lọc nhanh thành viên:</span>
          <button
            onClick={() => setSelectedMember('all')}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              selectedMember === 'all'
                ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tất cả
          </button>
          {members.map((m) => {
            const isSelected = selectedMember === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMember(m.id)}
                className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'border-slate-800 bg-slate-800 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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

      {/* 3. Summary Metric Cards for current filter result */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Tổng số giao dịch
          </p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">
            {filteredList.length}{' '}
            <span className="text-xs font-normal text-slate-400">khoản</span>
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Tổng Tiền Thu
          </p>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">
            +{formatVND(summaryIncome)}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
            Tổng Tiền Chi
          </p>
          <p className="text-xl font-bold text-rose-600 mt-0.5">
            -{formatVND(summaryExpense)}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Chênh lệch Thu - Chi
          </p>
          <p
            className={`text-xl font-bold mt-0.5 ${
              summaryNet >= 0 ? 'text-indigo-600' : 'text-rose-600'
            }`}
          >
            {formatVND(summaryNet)}
          </p>
        </div>
      </div>

      {/* 4. Transactions List (Table for Desktop, Cards for Mobile) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Search className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-700">
              Không tìm thấy giao dịch nào
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Thử tìm kiếm với từ khóa khác hoặc bấm đặt lại bộ lọc thời gian và danh mục.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
              <button
                onClick={() => onOpenAddModal('expense')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                + Thêm giao dịch mới
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-xs"
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
                            className={`font-bold text-sm ${
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

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedList.map((tx) => {
                const cat = categoryMap.get(tx.categoryId);
                const mem = memberMap.get(tx.memberId);
                const isExpense = tx.type === 'expense';
                const isSelected = selectedIds.has(tx.id);

                return (
                  <div
                    key={tx.id}
                    className={`p-4 space-y-2 transition-colors ${
                      isSelected ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => toggleSelectId(tx.id)}
                          className="text-slate-400 hover:text-indigo-600 flex-shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: cat ? cat.color : '#94a3b8' }}
                        >
                          <CategoryIcon name={cat ? cat.icon : 'Tag'} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {tx.note || (cat ? cat.name : 'Giao dịch')}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatDateVN(tx.date)} • {cat ? cat.name : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            isExpense ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {formatVND(tx.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-md font-semibold text-[11px]"
                          style={{
                            backgroundColor: `${mem ? mem.avatarColor : '#64748b'}15`,
                            color: mem ? mem.avatarColor : '#64748b',
                          }}
                        >
                          {mem ? mem.name : 'Gia đình'}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {tx.paymentMethod ? paymentLabels[tx.paymentMethod] : 'Tiền mặt'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onDuplicateTransaction && (
                          <button
                            onClick={() => onDuplicateTransaction(tx)}
                            title="Nhân bản"
                            className="p-1 text-slate-400 hover:text-emerald-600"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditTransaction(tx)}
                          title="Sửa"
                          className="p-1 text-slate-500 hover:text-indigo-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(tx.id)}
                          title="Xóa"
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span>Hiển thị</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-hidden font-semibold"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>mục trên trang • Tổng {filteredList.length} giao dịch</span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 font-semibold text-slate-700">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Single Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Xác nhận xóa giao dịch?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Khoản thu chi này sẽ bị xóa khỏi sổ quản lý gia đình. Thao tác không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm shadow-rose-200"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Xóa {selectedIds.size} giao dịch đã chọn?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Tất cả các khoản thu chi đã chọn sẽ bị xóa vĩnh viễn khỏi hệ thống.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm shadow-rose-200"
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
