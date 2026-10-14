import React, { useState } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  FolderTree,
  Users,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Upload,
  RefreshCw,
  Home,
  Check,
} from 'lucide-react';
import { formatMonthVN } from '../utils/formatters';

interface NavbarProps {
  currentTab: 'dashboard' | 'transactions' | 'categories' | 'members';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'categories' | 'members') => void;
  currentMonth: string; // YYYY-MM
  onChangeMonth: (newMonth: string) => void;
  onOpenAddModal: () => void;
  onResetData: () => void;
  onBackupData: () => void;
  onImportData: (jsonStr: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentMonth,
  onChangeMonth,
  onOpenAddModal,
  onResetData,
  onBackupData,
  onImportData,
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
        } catch (err) {
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

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'transactions', label: 'Sổ giao dịch', icon: ReceiptText },
    { id: 'categories', label: 'Danh mục', icon: FolderTree },
    { id: 'members', label: 'Thành viên', icon: Users },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                  Thu Chi Gia Đình
                </h1>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Quản lý tài chính tổ ấm thông minh
              </p>
            </div>
          </div>

          {/* Month Selector Picker */}
          <div className="flex items-center bg-slate-100/90 rounded-2xl p-1 border border-slate-200/60 shadow-xs">
            <button
              onClick={handlePrevMonth}
              title="Tháng trước"
              className="w-7 h-7 rounded-xl hover:bg-white text-slate-600 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 hidden xs:inline" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 whitespace-nowrap min-w-[90px] text-center">
                {formatMonthVN(currentMonth)}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              title="Tháng sau"
              className="w-7 h-7 rounded-xl hover:bg-white text-slate-600 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Ghi Chép Mới</span>
              <span className="sm:hidden">Ghi chép</span>
            </button>

            {/* Data & Backup Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDataMenu(!showDataMenu)}
                title="Dữ liệu & Cài đặt"
                className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <Database className="w-4 h-4" />
              </button>

              {showDataMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowDataMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 text-xs animate-fade-in space-y-1">
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Quản lý dữ liệu
                    </div>
                    <button
                      onClick={() => {
                        onBackupData();
                        setShowDataMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium"
                    >
                      <Download className="w-4 h-4 text-indigo-500" />
                      <span>Sao lưu dữ liệu (Tải về JSON)</span>
                    </button>

                    <label className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium cursor-pointer">
                      <Upload className="w-4 h-4 text-emerald-500" />
                      <span>Phục hồi từ tệp sao lưu JSON</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                    </label>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        if (
                          confirm(
                            'Bạn có chắc chắn muốn nạp lại dữ liệu mẫu ban đầu? Các giao dịch hiện tại sẽ được thay thế bằng bộ mẫu chuẩn.'
                          )
                        ) {
                          onResetData();
                          showToast('Đã khôi phục dữ liệu mẫu!');
                        }
                        setShowDataMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2.5 text-rose-600 font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Khôi phục dữ liệu mẫu</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar (Desktop & Tablet) */}
        <nav className="hidden sm:flex space-x-1 border-t border-slate-100 py-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
