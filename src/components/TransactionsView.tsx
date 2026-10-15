import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Edit2,
  Download,
  Plus,
  Calendar,
  X,
  Copy,
  ChevronLeft,
  ChevronRight,
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

      if (selectedType !== 'all' && tx.type !== selectedType) return false;
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;
      if (selectedMember !== 'all' && tx.memberId !== selectedMember) return false;

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

  useMemo(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchTerm, selectedType, selectedCategory, selectedMember, timeFilter, customStartDate, customEndDate, sortBy]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  const summaryIncome = useMemo(
    () => filteredList.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [filteredList]
  );
  const summaryExpense = useMemo(
    () => filteredList.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [filteredList]
  );

  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredList, categories, members);
  };

  const handleConfirmSingleDelete = () => {
    if (deleteTargetId) {
      onDeleteTransaction(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleConfirmBulkDelete = () => {
    selectedIds.forEach((id) => onDeleteTransaction(id));
    setSelectedIds(new Set());
    setIsBulkDeleteModalOpen(false);
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
    <div className="space-y-2.5 pb-2">
      {/* 1. Header with Title & Action Buttons */}
      <div className="bg-white p-3 rounded-2xl border border-zinc-200/70 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-zinc-900">
                Sổ Thu Chi
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-700">
                {filteredList.length}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Lịch sử giao dịch chi tiết
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="p-1.5 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50"
              title="Xuất file Excel CSV"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            <button
              type="button"
              onClick={() => onOpenAddModal('expense')}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shadow-xs active:scale-95"
            >
              + Chi
            </button>

            <button
              type="button"
              onClick={() => onOpenAddModal('income')}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-xs active:scale-95"
            >
              + Thu
            </button>
          </div>
        </div>
      </div>

      {/* 2. Compact Search & Filter Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-zinc-200/70 shadow-2xs space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo ghi chú, số tiền..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-zinc-200 focus:border-zinc-800 outline-hidden font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className={`p-1.5 rounded-xl border flex items-center gap-1 text-xs font-bold transition-colors ${
              showFiltersMobile || hasActiveFilters
                ? 'bg-zinc-900 border-zinc-900 text-white'
                : 'border-zinc-200 text-zinc-600'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
          <button
            type="button"
            onClick={() => setTimeFilter('current_month')}
            className={`px-2.5 py-0.5 text-[11px] rounded-full whitespace-nowrap font-extrabold transition-all ${
              timeFilter === 'current_month'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('prev_month')}
            className={`px-2.5 py-0.5 text-[11px] rounded-full whitespace-nowrap font-extrabold transition-all ${
              timeFilter === 'prev_month'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Tháng trước
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('this_year')}
            className={`px-2.5 py-0.5 text-[11px] rounded-full whitespace-nowrap font-extrabold transition-all ${
              timeFilter === 'this_year'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Năm {currentYearStr}
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('all')}
            className={`px-2.5 py-0.5 text-[11px] rounded-full whitespace-nowrap font-extrabold transition-all ${
              timeFilter === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Tất cả
          </button>
        </div>

        {/* Collapsible secondary filters */}
        {showFiltersMobile && (
          <div className="pt-2 border-t border-zinc-100 space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="text-xs px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 outline-hidden"
              >
                <option value="all">Loại: Tất cả</option>
                <option value="expense">Khoản Chi (-)</option>
                <option value="income">Khoản Thu (+)</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 outline-hidden"
              >
                <option value="all">Danh mục: Tất cả</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="text-xs px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-zinc-800 outline-hidden"
              >
                <option value="date-desc">Mới nhất trước</option>
                <option value="date-asc">Cũ nhất trước</option>
                <option value="amount-desc">Tiền lớn nhất</option>
                <option value="amount-asc">Tiền nhỏ nhất</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Đặt lại lọc
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Summary totals */}
      <div className="grid grid-cols-2 gap-2 text-center text-xs">
        <div className="bg-white p-2 rounded-xl border border-zinc-200/70 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Tổng Thu (+)</span>
          <p className="font-black text-emerald-600 truncate mt-0.5">+{formatVND(summaryIncome)}</p>
        </div>
        <div className="bg-white p-2 rounded-xl border border-zinc-200/70 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase">Tổng Chi (-)</span>
          <p className="font-black text-rose-600 truncate mt-0.5">-{formatVND(summaryExpense)}</p>
        </div>
      </div>

      {/* 4. Vertical Transaction Cards List */}
      <div className="space-y-1.5">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-zinc-200/70 shadow-2xs">
            <Search className="w-6 h-6 text-zinc-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-zinc-700">Chưa tìm thấy giao dịch nào</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Hãy thử thay đổi bộ lọc tìm kiếm</p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-2.5 px-3 py-1 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-200"
            >
              Xem tất cả giao dịch
            </button>
          </div>
        ) : (
          <>
            {paginatedList.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              const mem = memberMap.get(tx.memberId);
              const isExpense = tx.type === 'expense';

              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction(tx)}
                  className="bg-white p-3 rounded-2xl border border-zinc-200/70 shadow-2xs hover:border-zinc-300 active:scale-[0.99] cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Left: Icon & Detail */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat ? cat.color : '#94a3b8' }}
                      >
                        <CategoryIcon name={cat ? cat.icon : 'Tag'} className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-zinc-900 truncate">
                          {tx.note || (cat ? cat.name : 'Giao dịch')}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                          <span className="font-semibold text-zinc-500">
                            {formatRelativeDateVN(tx.date)}
                          </span>
                          <span>•</span>
                          <span className="truncate">{cat ? cat.name : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-xs sm:text-sm font-black ${
                          isExpense ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {formatVND(tx.amount)}
                      </p>
                      <span className="text-[9px] text-zinc-400 block mt-0.5">
                        {tx.paymentMethod ? paymentLabels[tx.paymentMethod] || 'Tiền mặt' : 'Tiền mặt'}
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-1.5 mt-2 border-t border-zinc-100 text-[10px] text-zinc-400">
                    <span>Chạm để xem & sửa</span>
                    <div className="flex items-center gap-2.5">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white p-2.5 rounded-2xl border border-zinc-200/70 shadow-2xs flex items-center justify-between text-xs text-zinc-500">
                <span className="text-[11px] font-semibold">
                  Trang {currentPage}/{totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1 rounded-lg border border-zinc-200 bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-1 rounded-lg border border-zinc-200 bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Single Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-4 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-zinc-900">Xóa giao dịch này?</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Khoản thu chi sẽ bị gỡ khỏi sổ.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-xs"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-4 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-zinc-900">
                Xóa {selectedIds.size} giao dịch?
              </h4>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
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

