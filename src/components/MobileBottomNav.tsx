import React from 'react';
import { LayoutDashboard, ReceiptText, FolderTree, Users, Plus } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'dashboard' | 'transactions' | 'categories' | 'members';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'categories' | 'members') => void;
  onOpenAddModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
}) => {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-3 py-2 shadow-lg">
      <div className="flex items-center justify-around">
        {/* Tab 1: Tổng quan */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentTab === 'dashboard'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Tổng quan</span>
        </button>

        {/* Tab 2: Sổ giao dịch */}
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentTab === 'transactions'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <ReceiptText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Sổ thu chi</span>
        </button>

        {/* Center Quick Add Button */}
        <div className="relative -top-3">
          <button
            onClick={onOpenAddModal}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-300 active:scale-95 transition-transform"
            title="Ghi chép thu chi mới"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 3: Danh mục */}
        <button
          onClick={() => onSelectTab('categories')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentTab === 'categories'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <FolderTree className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Danh mục</span>
        </button>

        {/* Tab 4: Thành viên */}
        <button
          onClick={() => onSelectTab('members')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            currentTab === 'members'
              ? 'text-indigo-600 font-bold'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Thành viên</span>
        </button>
      </div>
    </div>
  );
};
