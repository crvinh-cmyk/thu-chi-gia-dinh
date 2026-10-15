import React from 'react';
import { LayoutDashboard, ReceiptText, FolderTree, Plus } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'dashboard' | 'transactions' | 'categories';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'categories') => void;
  onOpenAddModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
}) => {
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] flex-shrink-0">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tab 1: Tổng quan */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            currentTab === 'dashboard'
              ? 'text-zinc-900 font-extrabold'
              : 'text-zinc-400 hover:text-zinc-600 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-colors ${currentTab === 'dashboard' ? 'bg-zinc-100 text-zinc-900' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Tổng quan</span>
        </button>

        {/* Tab 2: Sổ giao dịch */}
        <button
          type="button"
          onClick={() => onSelectTab('transactions')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            currentTab === 'transactions'
              ? 'text-zinc-900 font-extrabold'
              : 'text-zinc-400 hover:text-zinc-600 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-colors ${currentTab === 'transactions' ? 'bg-zinc-100 text-zinc-900' : ''}`}>
            <ReceiptText className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Sổ thu chi</span>
        </button>

        {/* Center Quick Add Elevated Thumb Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-12 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center shadow-lg shadow-zinc-900/25 border-4 border-white active:scale-90 transition-transform"
            title="Thêm khoản thu chi mới"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 3: Danh mục */}
        <button
          type="button"
          onClick={() => onSelectTab('categories')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95 ${
            currentTab === 'categories'
              ? 'text-zinc-900 font-extrabold'
              : 'text-zinc-400 hover:text-zinc-600 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-2xl transition-colors ${currentTab === 'categories' ? 'bg-zinc-100 text-zinc-900' : ''}`}>
            <FolderTree className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Danh mục</span>
        </button>
      </div>
    </nav>
  );
};


