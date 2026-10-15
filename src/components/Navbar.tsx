import React, { useState } from 'react';
import {
  Home,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Upload,
  RefreshCw,
  Check,
  Smartphone,
  Maximize2,
} from 'lucide-react';
import { formatMonthVN } from '../utils/formatters';

interface NavbarProps {
  currentTab: 'dashboard' | 'transactions' | 'categories';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'categories') => void;
  currentMonth: string; // YYYY-MM
  onChangeMonth: (newMonth: string) => void;
  onOpenAddModal: () => void;
  onResetData: () => void;
  onBackupData: () => void;
  onImportData: (jsonStr: string) => void;
  isPhoneFrame?: boolean;
  onTogglePhoneFrame?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMonth,
  onChangeMonth,
  onResetData,
  onBackupData,
  onImportData,
  isPhoneFrame,
  onTogglePhoneFrame,
}) => {
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    const newMonth = `${prev.getFullYear()}-${(prev.getMonth() + 1).toString().padStart(2, '0')}`;
    onChangeMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const next = new Date(y, m, 1);
    const newMonth = `${next.getFullYear()}-${(next.getMonth() + 1).toString().padStart(2, '0')}`;
    onChangeMonth(newMonth);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          onImportData(content);
          showToast('Nhập dữ liệu thành công!');
        } catch {
          alert('Tệp dữ liệu không hợp lệ!');
        }
      };
      reader.readAsText(file);
    }
    setShowDataMenu(false);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-3 py-2 flex-shrink-0">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-xs font-medium px-3.5 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce whitespace-nowrap">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black shadow-xs flex-shrink-0">
            <Home className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm text-zinc-900 tracking-tight leading-none truncate">
              Thu Chi Gia Đình
            </h1>
            <p className="text-[10px] text-zinc-400 font-semibold truncate mt-0.5">
              Sổ tay tài chính di động
            </p>
          </div>
        </div>

        {/* Center Compact Month Navigation Picker */}
        <div className="flex items-center bg-zinc-100 rounded-xl p-0.5 border border-zinc-200/80">
          <button
            type="button"
            onClick={handlePrevMonth}
            title="Tháng trước"
            className="w-6 h-6 rounded-lg hover:bg-white text-zinc-600 flex items-center justify-center transition-colors active:scale-90"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1 px-1.5">
            <Calendar className="w-3 h-3 text-zinc-500" />
            <span className="text-xs font-black text-zinc-800 whitespace-nowrap min-w-[70px] text-center">
              {formatMonthVN(currentMonth)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            title="Tháng sau"
            className="w-6 h-6 rounded-lg hover:bg-white text-zinc-600 flex items-center justify-center transition-colors active:scale-90"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Header Controls (Backup / Frame Toggle) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onTogglePhoneFrame && (
            <button
              type="button"
              onClick={onTogglePhoneFrame}
              title={isPhoneFrame ? 'Mở rộng màn hình' : 'Khung điện thoại 16:9'}
              className="hidden sm:flex w-8 h-8 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 items-center justify-center transition-colors"
            >
              {isPhoneFrame ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDataMenu(!showDataMenu)}
              title="Dữ liệu & Cài đặt"
              className="w-8 h-8 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 flex items-center justify-center transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
            </button>

            {showDataMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowDataMenu(false)}
                />
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 z-40 text-xs animate-fade-in space-y-0.5">
                  <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Sao lưu & Dữ liệu
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onBackupData();
                      setShowDataMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Tải dữ liệu sao lưu (.JSON)</span>
                  </button>

                  <label className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2 text-zinc-700 font-semibold cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Nạp lại từ tệp sao lưu</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>

                  <div className="border-t border-zinc-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          'Khôi phục bộ dữ liệu thu chi mẫu ban đầu?'
                        )
                      ) {
                        onResetData();
                        showToast('Đã nạp lại dữ liệu mẫu!');
                      }
                      setShowDataMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Nạp lại dữ liệu mẫu ban đầu</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

