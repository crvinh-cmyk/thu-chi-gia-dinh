import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  User,
  FileText,
  CreditCard,
  Trash2,
  Sparkles,
  Check,
} from 'lucide-react';
import { Transaction, TransactionType, Category, FamilyMember, PaymentMethod } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatVND, numberToVietnameseWords } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
  categories: Category[];
  members: FamilyMember[];
  editingTransaction?: Transaction | null;
  defaultType?: TransactionType;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'transfer', label: 'Chuyển khoản' },
  { id: 'cash', label: 'Tiền mặt' },
  { id: 'credit', label: 'Thẻ tín dụng' },
  { id: 'ewallet', label: 'Ví điện tử' },
];

const QUICK_AMOUNTS = [
  { label: '+50k', value: 50000 },
  { label: '+100k', value: 100000 },
  { label: '+200k', value: 200000 },
  { label: '+500k', value: 500000 },
  { label: '+1tr', value: 1000000 },
  { label: '+2tr', value: 2000000 },
];

const QUICK_NOTES_EXPENSE = [
  'Đi chợ / Siêu thị',
  'Tiền điện EVN',
  'Tiền nước sinh hoạt',
  'Internet / Điện thoại',
  'Học phí của con',
  'Cả nhà ăn ngoài',
  'Đổ xăng xe',
  'Mua sắm đồ dùng',
  'Thuốc & Khám bệnh',
  'Tiền mừng / Hiếu hỷ',
];

const QUICK_NOTES_INCOME = [
  'Lương công ty',
  'Kinh doanh online',
  'Tiền thưởng',
  'Làm thêm ngoài giờ',
  'Lãi đầu tư',
  'Được biếu tặng',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  categories,
  members,
  editingTransaction,
  defaultType = 'expense',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [memberId, setMemberId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [error, setError] = useState<string>('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(editingTransaction.amount ? editingTransaction.amount.toString() : '');
      setCategoryId(editingTransaction.categoryId);
      setMemberId(editingTransaction.memberId);
      setDate(editingTransaction.date);
      setNote(editingTransaction.note || '');
      setPaymentMethod(editingTransaction.paymentMethod || 'transfer');
    } else {
      setType(defaultType);
      setAmountStr('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setPaymentMethod('transfer');
      // Set default category and member
      const matchingCats = categories.filter((c) => c.type === defaultType);
      if (matchingCats.length > 0) setCategoryId(matchingCats[0].id);
      if (members.length > 0) setMemberId(members[0].id);
    }
    setError('');
    setShowConfirmDelete(false);
  }, [editingTransaction, defaultType, isOpen, categories, members]);

  // When type changes, ensure category matches the current type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const available = categories.filter((c) => c.type === newType);
    if (available.length > 0 && (!categoryId || !available.some((c) => c.id === categoryId))) {
      setCategoryId(available[0].id);
    }
  };

  // Add amount incrementally with pills
  const handleQuickAddAmount = (val: number) => {
    const current = parseInt(amountStr, 10) || 0;
    setAmountStr((current + val).toString());
    setError('');
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(rawVal);
    setError('');
  };

  const setDateToday = () => {
    setDate(new Date().toISOString().split('T')[0]);
  };

  const setDateYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const numericAmount = parseInt(amountStr, 10) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!numericAmount || numericAmount <= 0) {
      setError('Vui lòng nhập số tiền lớn hơn 0');
      return;
    }

    if (!categoryId) {
      setError('Vui lòng chọn danh mục');
      return;
    }

    if (!memberId) {
      setError('Vui lòng chọn thành viên');
      return;
    }

    if (!date) {
      setError('Vui lòng chọn ngày giao dịch');
      return;
    }

    onSave({
      id: editingTransaction ? editingTransaction.id : undefined,
      type,
      amount: numericAmount,
      categoryId,
      memberId,
      date,
      note: note.trim(),
      paymentMethod,
    });

    onClose();
  };

  const handleDeleteCurrent = () => {
    if (editingTransaction && onDelete) {
      onDelete(editingTransaction.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);
  const quickNotes = type === 'expense' ? QUICK_NOTES_EXPENSE : QUICK_NOTES_INCOME;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-hidden">
      {/* Background click to dismiss on desktop */}
      <div className="hidden sm:block absolute inset-0 -z-10" onClick={onClose} />

      {/* Drawer / Modal Container */}
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col animate-slide-up sm:animate-fade-in">
        {/* Mobile Pull Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-xs flex-shrink-0 ${
                type === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            >
              {type === 'expense' ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                {editingTransaction ? 'Chỉnh sửa khoản tiền' : 'Ghi chép giao dịch'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {type === 'expense' ? 'Ghi nhận chi tiêu gia đình' : 'Ghi nhận thu nhập gia đình'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {editingTransaction && onDelete && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                title="Xóa giao dịch này"
                className="w-8 h-8 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete confirmation banner */}
        {showConfirmDelete && (
          <div className="p-3.5 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-rose-800">
              Xóa giao dịch này khỏi sổ chi tiêu?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-medium text-slate-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteCurrent}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        )}

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Chi vs Thu Big Thumb Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Khoản Chi (Tiền ra)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Khoản Thu (Tiền vào)
            </button>
          </div>

          {/* 2. Amount Input & Fast 1-Touch Pills */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Số tiền giao dịch <span className="text-rose-500">*</span>
              </label>
              {numericAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountStr('')}
                  className="text-[11px] text-slate-400 hover:text-rose-500 underline"
                >
                  Xóa số
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amountStr ? parseInt(amountStr, 10).toLocaleString('vi-VN') : ''}
                onChange={handleAmountInputChange}
                placeholder="0"
                className={`w-full text-2xl sm:text-3xl font-extrabold px-4 py-2.5 sm:py-3 rounded-2xl border transition-all outline-hidden text-right pr-12 ${
                  type === 'expense'
                    ? 'text-rose-600 border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
                    : 'text-emerald-600 border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
                }`}
                autoFocus={!editingTransaction}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                ₫
              </span>
            </div>

            {/* Vietnamese number-to-words spelling */}
            {numericAmount > 0 && (
              <div className="p-2 mt-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-[11px] text-slate-600">
                <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <span className="italic font-medium truncate">
                  {numberToVietnameseWords(numericAmount)}
                </span>
              </div>
            )}

            {/* Quick 1-Touch Amount Pills */}
            <div className="grid grid-cols-6 gap-1.5 mt-2">
              {QUICK_AMOUNTS.map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => handleQuickAddAmount(pill.value)}
                  className="py-1.5 text-center text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all border border-slate-200/60"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Category Selector (Compact 4-column Icon Grid) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Danh mục {type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {filteredCategories.length} nhóm
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto p-1.5 border border-slate-100 rounded-2xl bg-slate-50/70">
              {filteredCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                      isSelected
                        ? 'bg-white shadow-sm ring-2 ring-indigo-500 text-slate-900 font-bold'
                        : 'hover:bg-white text-slate-600 font-medium'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white mb-1 shadow-2xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] leading-tight truncate w-full">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Family Member 1-Touch Pills & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Member */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                Thành viên thực hiện <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {members.map((m) => {
                  const isSelected = memberId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMemberId(m.id)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-slate-800 bg-slate-800 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: m.avatarColor }}
                      />
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Ngày giao dịch <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={setDateToday}
                    className="text-[10px] text-indigo-600 hover:underline font-bold"
                  >
                    Hôm nay
                  </button>
                  <span className="text-[10px] text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={setDateYesterday}
                    className="text-[10px] text-slate-500 hover:underline font-medium"
                  >
                    Hôm qua
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden font-semibold"
              />
            </div>
          </div>

          {/* 5. Ghi chú & Quick suggestions */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Ghi chú chi tiết
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đi siêu thị WinMart, Tiền điện EVN..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-400 outline-hidden"
            />
            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {quickNotes.slice(0, 5).map((qn) => (
                <button
                  key={qn}
                  type="button"
                  onClick={() => setNote(qn)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 font-medium transition-colors"
                >
                  {qn}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Payment Method */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
              Hình thức thanh toán
            </label>
            <div className="grid grid-cols-4 gap-1">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`py-1.5 text-[11px] rounded-lg border font-semibold transition-all ${
                    paymentMethod === pm.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`flex-2 py-3 rounded-2xl text-white font-extrabold text-sm shadow-md transition-all active:scale-98 ${
                type === 'expense'
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
              }`}
            >
              {editingTransaction ? 'Lưu Thay Đổi' : 'Xác Nhận Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
