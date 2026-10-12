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
  CreditCard,
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
  currentMonth: string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  members,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
  currentMonth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'current_month' | 'all' | 'custom'>('current_month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Delete confirmation modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // Filtered transactions
  const filteredList = useMemo(() => {
    return transactions.filter((tx) => {
      // Time filter
      if (timeFilter === 'current_month') {
        if (!tx.date.startsWith(currentMonth)) return false;
      } else if (timeFilter === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      // Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) return false;

      // Category filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;

      // Member filter
      if (selectedMember !== 'all' && tx.memberId !== selectedMember) return false;

      // Search term filter
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
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    timeFilter,
    currentMonth,
    customStartDate,
    customEndDate,
    selectedType,
    selectedCategory,
    selectedMember,
    searchTerm,
    categoryMap,
    memberMap,
  ]);

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

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      onDeleteTransaction(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const paymentLabels: Record<string, string> = {
    cash: 'Tiền mặt',
    transfer: 'Chuyển khoản',
    credit: 'Thẻ tín dụng',
    ewallet: 'Ví điện tử',
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedMember('all');
    setTimeFilter('current_month');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Quick Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sổ Giao Dịch Gia Đình</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem lại lịch sử, tìm kiếm, lọc theo ngày tháng và thành viên
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            title="Xuất file Excel CSV tương thích UTF-8"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất Excel / CSV</span>
          </button>
          <button
            onClick={() => onOpenAddModal('expense')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm giao dịch</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        {/* Search input & Time Filter Switcher */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo ghi chú, danh mục, số tiền..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
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

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setTimeFilter('current_month')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  timeFilter === 'current_month'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tháng này
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  timeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả thời gian
              </button>
              <button
                onClick={() => setTimeFilter('custom')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  timeFilter === 'custom'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tùy chọn ngày
              </button>
            </div>
          </div>
        </div>

        {/* Custom date range if active */}
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs flex-wrap">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600 font-medium">Từ ngày:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
            />
            <span className="text-slate-600 font-medium">Đến ngày:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>
        )}

        {/* Secondary Filters: Type, Category, Member */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Bộ lọc:</span>
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden focus:border-indigo-400"
          >
            <option value="all">Loại: Tất cả</option>
            <option value="expense">Khoản Chi (Chi tiêu)</option>
            <option value="income">Khoản Thu (Thu nhập)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden focus:border-indigo-400 max-w-[160px]"
          >
            <option value="all">Danh mục: Tất cả</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === 'expense' ? 'Chi' : 'Thu'})
              </option>
            ))}
          </select>

          {/* Member Filter */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-hidden focus:border-indigo-400"
          >
            <option value="all">Thành viên: Cả nhà</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {(searchTerm ||
            selectedType !== 'all' ||
            selectedCategory !== 'all' ||
            selectedMember !== 'all' ||
            timeFilter !== 'current_month') && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-rose-500 hover:text-rose-700 font-medium underline underline-offset-2 ml-auto"
            >
              Xóa các bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Filter Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Số lượng giao dịch</p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{filteredList.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase">Tổng Thu trong lọc</p>
          <p className="text-lg font-bold text-emerald-600 mt-0.5">+{formatVND(summaryIncome)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-600 uppercase">Tổng Chi trong lọc</p>
          <p className="text-lg font-bold text-rose-600 mt-0.5">-{formatVND(summaryExpense)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Chênh lệch (Dư/Thiếu)</p>
          <p
            className={`text-lg font-bold mt-0.5 ${
              summaryNet >= 0 ? 'text-indigo-600' : 'text-rose-600'
            }`}
          >
            {formatVND(summaryNet)}
          </p>
        </div>
      </div>

      {/* Transactions Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Search className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-700">Không tìm thấy giao dịch nào</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc ngày tháng / danh mục.
            </p>
            <button
              onClick={resetAllFilters}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold hover:bg-indigo-100"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
                  {filteredList.map((tx) => {
                    const cat = categoryMap.get(tx.categoryId);
                    const mem = memberMap.get(tx.memberId);
                    const isExpense = tx.type === 'expense';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                          {formatDateVN(tx.date)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                              style={{ backgroundColor: cat ? cat.color : '#94a3b8' }}
                            >
                              <CategoryIcon name={cat ? cat.icon : 'Tag'} className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium text-slate-800 text-xs">
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
              {filteredList.map((tx) => {
                const cat = categoryMap.get(tx.categoryId);
                const mem = memberMap.get(tx.memberId);
                const isExpense = tx.type === 'expense';

                return (
                  <div key={tx.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: cat ? cat.color : '#94a3b8' }}
                        >
                          <CategoryIcon name={cat ? cat.icon : 'Tag'} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
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
                          className="px-2 py-0.5 rounded-md font-medium text-[11px]"
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
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-500 hover:text-indigo-600"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(tx.id)}
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
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Xác nhận xóa giao dịch?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Khoản thu chi này sẽ bị xóa vĩnh viễn khỏi sổ quản lý gia đình. Thao tác không thể hoàn tác.
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
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm shadow-rose-200"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
