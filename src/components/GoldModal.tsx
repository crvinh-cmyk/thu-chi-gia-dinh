import React, { useState, useEffect } from 'react';
import { GoldTransaction, GoldTransactionType } from '../types';
import { formatGoldQuantity, formatVND } from '../utils/formatters';
import { X, Calendar, Plus, Minus, Coins, ArrowUpRight, ArrowDownLeft, FileText, Banknote } from 'lucide-react';

interface GoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<GoldTransaction, 'id' | 'createdAt'> & { id?: string }) => void;
  defaultType?: GoldTransactionType;
  editingTransaction?: GoldTransaction | null;
}

// Preset gold pills as requested: 5 phân, 1 chỉ, 2 chỉ, 3 chỉ, 4 chỉ, 5 chỉ
const QUICK_GOLD_PILLS = [
  { label: '5 phân', phan: 5 },
  { label: '1 chỉ', phan: 10 },
  { label: '2 chỉ', phan: 20 },
  { label: '3 chỉ', phan: 30 },
  { label: '4 chỉ', phan: 40 },
  { label: '5 chỉ', phan: 50 },
];

// Quick reason suggestions for Gold transactions
const QUICK_REASONS_IMPORT = [
  'Mẹ mua tích lũy',
  'Tích lũy hàng tháng',
  'Con cái biếu tặng',
  'Mua nữ trang mới',
  'Gửi tiết kiệm vàng',
];

const QUICK_REASONS_EXPORT = [
  'Bán vàng trang trải',
  'Tặng quà cưới',
  'Bán vàng sửa nhà',
  'Đổi loại vàng khác',
  'Giải quyết công chuyện',
];

export const GoldModal: React.FC<GoldModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultType = 'import',
  editingTransaction,
}) => {
  const [type, setType] = useState<GoldTransactionType>(defaultType);
  const [chi, setChi] = useState<number>(1);
  const [phan, setPhan] = useState<number>(0);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [goldType, setGoldType] = useState<string>('Vàng 9999 / Nhẫn trơn');
  const [priceVND, setPriceVND] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      const totalPhan = editingTransaction.amountPhan || 0;
      setChi(Math.floor(totalPhan / 10));
      setPhan(totalPhan % 10);
      setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
      setReason(editingTransaction.reason || '');
      setGoldType(editingTransaction.goldType || 'Vàng 9999 / Nhẫn trơn');
      setPriceVND(editingTransaction.priceVND ? editingTransaction.priceVND.toString() : '');
    } else {
      setType(defaultType);
      setChi(1);
      setPhan(0);
      setDate(new Date().toISOString().split('T')[0]);
      setReason('');
      setGoldType('Vàng 9999 / Nhẫn trơn');
      setPriceVND('');
    }
  }, [editingTransaction, defaultType, isOpen]);

  if (!isOpen) return null;

  const totalPhan = chi * 10 + phan;

  // Handle pill click
  const handleSelectPill = (phanVal: number) => {
    setChi(Math.floor(phanVal / 10));
    setPhan(phanVal % 10);
  };

  const handleAdjustChi = (delta: number) => {
    setChi((prev) => Math.max(0, prev + delta));
  };

  const handleAdjustPhan = (delta: number) => {
    let newPhan = phan + delta;
    let newChi = chi;
    if (newPhan >= 10) {
      newChi += Math.floor(newPhan / 10);
      newPhan = newPhan % 10;
    } else if (newPhan < 0) {
      if (newChi > 0) {
        newChi -= 1;
        newPhan = 9;
      } else {
        newPhan = 0;
      }
    }
    setChi(newChi);
    setPhan(newPhan);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalPhan <= 0) {
      alert('Vui lòng nhập số lượng vàng lớn hơn 0!');
      return;
    }

    const finalReason = reason.trim() || (type === 'import' ? 'Nhập tích lũy vàng' : 'Xuất dùng vàng');

    onSave({
      id: editingTransaction?.id,
      type,
      amountPhan: totalPhan,
      date,
      reason: finalReason,
      goldType,
      priceVND: priceVND ? parseFloat(priceVND.replace(/\D/g, '')) : undefined,
    });

    onClose();
  };

  const quickReasons = type === 'import' ? QUICK_REASONS_IMPORT : QUICK_REASONS_EXPORT;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 bg-zinc-950/60 backdrop-blur-xs animate-fade-in overflow-x-hidden">
      {/* Backdrop click */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Modal / Drawer Content */}
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-100 flex flex-col max-h-[92vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Coins className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 leading-none">
                {editingTransaction ? 'Sửa giao dịch Vàng' : 'Ghi chép Xuất/Nhập Vàng'}
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                Đơn vị tính chính xác: Chỉ & Phân (1 chỉ = 10 phân)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 flex items-center justify-center transition-colors active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Type Toggle: Nhập Vàng (Mua) vs Xuất Vàng (Bán) */}
          <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('import')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                type === 'import'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
              <span>+ Nhập vàng (Mua)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('export')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                type === 'export'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
              <span>- Xuất vàng (Bán)</span>
            </button>
          </div>

          {/* Quick Suggestion Pills for Gold Quantity */}
          <div>
            <label className="text-[11px] font-extrabold text-zinc-600 uppercase tracking-wider block mb-1.5">
              ⚡ Gợi ý chọn nhanh lượng vàng:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {QUICK_GOLD_PILLS.map((pill) => {
                const isSelected = totalPhan === pill.phan;
                return (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => handleSelectPill(pill.phan)}
                    className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all active:scale-90 flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-amber-50/60 text-amber-900 border-amber-200/80 hover:bg-amber-100'
                    }`}
                  >
                    <span>{pill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Inputs: Chỉ & Phân */}
          <div className="bg-amber-50/40 p-3 rounded-2xl border border-amber-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">Lượng vàng nhập/xuất:</span>
              <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Tổng: {formatGoldQuantity(totalPhan)} ({totalPhan} phân)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Controls for Số Chỉ */}
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200 text-center space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Số Chỉ
                </span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleAdjustChi(-1)}
                    className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center active:scale-90"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={chi}
                    onChange={(e) => setChi(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-12 text-center text-lg font-black text-zinc-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustChi(1)}
                    className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center active:scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Controls for Số Phân */}
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200 text-center space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Số Phân (0-9)
                </span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleAdjustPhan(-1)}
                    className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center active:scale-90"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={phan}
                    onChange={(e) => setPhan(Math.min(9, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-12 text-center text-lg font-black text-zinc-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustPhan(1)}
                    className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center active:scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reason / Notes Field with Quick Suggestions */}
          <div>
            <label className="text-[11px] font-extrabold text-zinc-600 uppercase tracking-wider block mb-1">
              Lý do {type === 'import' ? 'nhập (mua/tích lũy)' : 'xuất (bán/sử dụng)'}:
            </label>
            <div className="relative">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={type === 'import' ? 'Ví dụ: Mẹ mua tích lũy tháng 10...' : 'Ví dụ: Bán vàng sửa nhà, Mua quà...'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-9"
              />
              <FileText className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>

            {/* Quick Reason Pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors active:scale-95 ${
                    reason === r
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  + {r}
                </button>
              ))}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-[11px] font-extrabold text-zinc-600 uppercase tracking-wider block mb-1">
              Ngày thực hiện:
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-9"
              />
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Optional Gold Type & Optional Price in VND */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Loại vàng:
              </label>
              <select
                value={goldType}
                onChange={(e) => setGoldType(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="Vàng 9999 / Nhẫn trơn">Nhẫn trơn 9999</option>
                <option value="Vàng miếng SJC">Vàng miếng SJC</option>
                <option value="Trang sức / Nữ trang">Nữ trang / Trang sức</option>
                <option value="Vàng 24K khác">Vàng 24K khác</option>
                <option value="Vàng 18K / 14K">Vàng 18K / 14K</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                Giá quy đổi (VNĐ - Tùy chọn):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={priceVND}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setPriceVND(raw ? parseInt(raw, 10).toLocaleString('vi-VN') : '');
                  }}
                  placeholder="Ví dụ: 8.500.000"
                  className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 pl-7"
                />
                <Banknote className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2.5" />
              </div>
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-extrabold text-xs active:scale-95 transition-all"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              className={`flex-2 py-3 rounded-2xl text-white font-extrabold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                type === 'import'
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                  : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>{type === 'import' ? 'Xác nhận Nhập Vàng' : 'Xác nhận Xuất Vàng'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
