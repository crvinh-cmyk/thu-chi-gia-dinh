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
  Copy,
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
  { id: 'ewallet', label: 'Ví Momo/ZaloPay' },
];

const QUICK_AMOUNTS = [
  50000,
  100000,
  200000,
  500000,
  1000000,
  2000000,
  5000000,
  10000000,
];

const QUICK_NOTES_EXPENSE = [
  'Đi chợ / Siêu thị',
  'Hóa đơn tiền điện EVN',
  'Tiền nước sinh hoạt',
  'Cước Internet & Điện thoại',
  'Học phí & Tiền bán trú',
  'Ăn uống cả nhà cuối tuần',
  'Đổ xăng xe',
  'Bảo dưỡng / Thay dầu xe',
  'Mua đồ dùng gia đình',
  'Khám bệnh & Mua thuốc',
  'Tiền mừng cưới / Hiếu hỷ',
];

const QUICK_NOTES_INCOME = [
  'Lương tháng công ty',
  'Lợi nhuận kinh doanh',
  'Tiền thưởng KPI / Dự án',
  'Thu nhập làm thêm (Freelance)',
  'Lãi tiết kiệm & Đầu tư',
  'Tiền biếu tặng',
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
      setAmountStr(editingTransaction.amount.toString());
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

  const handleQuickAmount = (val: number) => {
    setAmountStr(val.toString());
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
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0');
      return;
    }

    if (!categoryId) {
      setError('Vui lòng chọn danh mục giao dịch');
      return;
    }

    if (!memberId) {
      setError('Vui lòng chọn thành viên thực hiện');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
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
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingTransaction ? 'Chỉnh sửa khoản thu / chi' : 'Thêm giao dịch mới'}
              </h3>
              <p className="text-xs text-slate-500">
                Ghi chép thu chi minh bạch cho cả gia đình
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {editingTransaction && onDelete && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                title="Xóa giao dịch này"
                className="w-9 h-9 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              type="button"
              className="w-9 h-9 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete confirmation banner if triggered inside modal */}
        {showConfirmDelete && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-rose-800">
              Bạn có chắc muốn xóa giao dịch này?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-medium text-slate-600"
              >
                Không
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              {error}
            </div>
          )}

          {/* 1. Loại giao dịch (Khoản Chi vs Khoản Thu) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
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
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Khoản Thu (Tiền vào)
            </button>
          </div>

          {/* 2. Số tiền (VNĐ) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Số tiền giao dịch <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Đơn vị: Đồng (VNĐ)</span>
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amountStr ? parseInt(amountStr, 10).toLocaleString('vi-VN') : ''}
                onChange={handleAmountInputChange}
                placeholder="0"
                className={`w-full text-2xl sm:text-3xl font-extrabold px-4 py-3 rounded-2xl border transition-all outline-hidden text-right pr-14 ${
                  type === 'expense'
                    ? 'text-rose-600 border-slate-200 focus:border-rose-400 focus:ring-3 focus:ring-rose-100'
                    : 'text-emerald-600 border-slate-200 focus:border-emerald-400 focus:ring-3 focus:ring-emerald-100'
                }`}
                autoFocus={!editingTransaction}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                ₫
              </span>
            </div>

            {/* Đọc số tiền bằng chữ tiếng Việt */}
            {numericAmount > 0 && (
              <div className="p-2.5 mt-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="italic font-medium">
                  {numberToVietnameseWords(numericAmount)}
                </span>
              </div>
            )}

            {/* Quick Amount Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                    numericAmount === val
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{val >= 1000000 ? `${val / 1000000}tr` : `${val / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Danh mục */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Danh mục {type === 'expense' ? 'chi tiêu' : 'thu nhập'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {filteredCategories.length} danh mục
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1.5 border border-slate-100 rounded-2xl bg-slate-50/60">
              {filteredCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-white shadow-sm ring-2 ring-indigo-200'
                        : 'border-transparent bg-white/70 hover:bg-white text-slate-700'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white mb-1 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium truncate w-full">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Thành viên & Ngày giao dịch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Thành viên */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
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
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-slate-800 bg-slate-800 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: m.avatarColor }}
                      />
                      <span className="truncate">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ngày giao dịch */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Ngày giao dịch <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={setDateToday}
                    className="text-[10px] text-indigo-600 hover:underline font-semibold"
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
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden font-medium"
              />
            </div>
          </div>

          {/* 5. Ghi chú chi tiết & Quick Suggestion Chips */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Ghi chú chi tiết
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đi siêu thị WinMart, Tiền điện EVN, Học phí tiếng Anh..."
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-hidden"
            />
            {/* Quick note suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 flex items-center gap-1 self-center">
                Gợi ý nhanh:
              </span>
              {quickNotes.slice(0, 4).map((qn) => (
                <button
                  key={qn}
                  type="button"
                  onClick={() => setNote(qn)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
                >
                  {qn}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Phương thức thanh toán */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
              Hình thức thanh toán
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`py-1.5 px-2 text-xs rounded-lg border font-medium transition-all ${
                    paymentMethod === pm.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
              }`}
            >
              {editingTransaction ? 'Lưu thay đổi' : 'Xác nhận thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
