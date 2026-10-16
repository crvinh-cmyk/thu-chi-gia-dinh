import React, { useState, useMemo } from 'react';
import { GoldTransaction, GoldTransactionType } from '../types';
import { formatGoldQuantity, formatDateVN, formatVND } from '../utils/formatters';
import {
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
  Search,
  Calendar,
  Trash2,
  Edit2,
  FileText,
  Vault,
  ShieldCheck,
} from 'lucide-react';

interface GoldViewProps {
  goldTransactions: GoldTransaction[];
  onOpenModal: (type?: GoldTransactionType) => void;
  onEditTransaction: (tx: GoldTransaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const GoldView: React.FC<GoldViewProps> = ({
  goldTransactions,
  onOpenModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'import' | 'export'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate Totals in Phân
  const { totalImportPhan, totalExportPhan, currentBalancePhan } = useMemo(() => {
    let imp = 0;
    let exp = 0;
    goldTransactions.forEach((tx) => {
      const phan = tx.amountPhan || 0;
      if (tx.type === 'import') {
        imp += phan;
      } else {
        exp += phan;
      }
    });
    return {
      totalImportPhan: imp,
      totalExportPhan: exp,
      currentBalancePhan: imp - exp,
    };
  }, [goldTransactions]);

  // Filtered list
  const filteredTransactions = useMemo(() => {
    return goldTransactions
      .filter((tx) => {
        if (filterType === 'import' && tx.type !== 'import') return false;
        if (filterType === 'export' && tx.type !== 'export') return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchReason = (tx.reason || '').toLowerCase().includes(q);
          const matchType = (tx.goldType || '').toLowerCase().includes(q);
          const matchDate = (tx.date || '').includes(q);
          return matchReason || matchType || matchDate;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [goldTransactions, filterType, searchQuery]);

  return (
    <div className="space-y-4 pb-20 animate-fade-in px-3 pt-2 max-w-md mx-auto">
      {/* 1. Header Vault Card - Gold Balance Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white p-4 shadow-xl shadow-amber-500/20 border border-amber-400/30">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-100">
              <Vault className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-extrabold text-amber-100 tracking-wider uppercase">
              Sổ Quản Lý Vàng Mẹ Giữ
            </span>
          </div>
          <div className="flex items-center gap-1 bg-amber-900/30 px-2 py-0.5 rounded-full border border-white/20 text-[10px] font-bold text-amber-100">
            <ShieldCheck className="w-3 h-3 text-amber-300" />
            <span>Tích lũy an toàn</span>
          </div>
        </div>

        {/* Current Total Stock Display */}
        <div className="my-2">
          <div className="text-[11px] font-semibold text-amber-200">
            Tổng lượng vàng tồn quỹ hiện tại:
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white flex items-baseline gap-2">
            <span>{formatGoldQuantity(currentBalancePhan)}</span>
            <span className="text-xs font-bold text-amber-200">
              ({currentBalancePhan} phân)
            </span>
          </div>
        </div>

        {/* Import vs Export Mini Badges */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-xs p-2 rounded-2xl flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
              <ArrowDownLeft className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-bold text-amber-200 uppercase">Tổng Nhập (Mua)</div>
              <div className="text-xs font-extrabold text-white truncate">
                {formatGoldQuantity(totalImportPhan)}
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-2 rounded-2xl flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-400/20 text-rose-300 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-bold text-amber-200 uppercase">Tổng Xuất (Bán)</div>
              <div className="text-xs font-extrabold text-white truncate">
                {formatGoldQuantity(totalExportPhan)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onOpenModal('import')}
          className="w-full py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>+ Nhập Vàng (Mua)</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenModal('export')}
          className="w-full py-3 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-900 text-white font-extrabold text-xs shadow-md shadow-zinc-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
            <Minus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>- Xuất Vàng (Bán)</span>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="space-y-2 bg-white p-3 rounded-2xl border border-zinc-200/80 shadow-xs">
        {/* Search Field */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo lý do, ngày tháng..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-zinc-50"
          />
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all active:scale-95 whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Tất cả ({goldTransactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('import')}
            className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all active:scale-95 whitespace-nowrap ${
              filterType === 'import'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            + Nhập vàng ({goldTransactions.filter((t) => t.type === 'import').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('export')}
            className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all active:scale-95 whitespace-nowrap ${
              filterType === 'export'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            - Xuất vàng ({goldTransactions.filter((t) => t.type === 'export').length})
          </button>
        </div>
      </div>

      {/* 4. Gold Transaction History List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold text-zinc-700 uppercase tracking-wider">
            Lịch sử xuất nhập vàng ({filteredTransactions.length})
          </h3>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-zinc-700">Chưa có thông tin xuất nhập vàng</p>
            <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
              Bấm nút <strong>+ Nhập Vàng</strong> để bắt đầu ghi chép lượng vàng mẹ mua hoặc tích lũy.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => {
              const isImport = tx.type === 'import';
              return (
                <div
                  key={tx.id}
                  className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-amber-300 transition-colors"
                >
                  {/* Left Icon & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold ${
                        isImport
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isImport ? (
                        <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-zinc-900 truncate">
                          {tx.reason || (isImport ? 'Nhập vàng' : 'Xuất vàng')}
                        </span>
                        {tx.goldType && (
                          <span className="text-[9px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-md">
                            {tx.goldType}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          {formatDateVN(tx.date)}
                        </span>
                        {tx.priceVND && tx.priceVND > 0 && (
                          <span className="font-bold text-zinc-600 bg-zinc-50 px-1.5 py-0.5 rounded-md border border-zinc-100">
                            {formatVND(tx.priceVND)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Quantity Badge & Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm font-black tracking-tight ${
                          isImport ? 'text-amber-600' : 'text-rose-600'
                        }`}
                      >
                        {isImport ? '+' : '-'}{formatGoldQuantity(tx.amountPhan)}
                      </div>
                      <div className="text-[9px] font-semibold text-zinc-400">
                        {tx.amountPhan} phân
                      </div>
                    </div>

                    {/* Edit & Delete Actions */}
                    <div className="flex items-center gap-0.5 ml-1">
                      <button
                        type="button"
                        onClick={() => onEditTransaction(tx)}
                        title="Sửa"
                        className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition-colors active:scale-90"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Bạn có chắc chắn muốn xóa lịch sử giao dịch vàng này?')) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        title="Xóa"
                        className="w-7 h-7 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
