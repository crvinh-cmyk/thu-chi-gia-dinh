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
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tab 1: Tổng quan */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
            currentTab === 'dashboard'
              ? 'text-indigo-600 font-black'
              : 'text-slate-400 hover:text-slate-600 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${currentTab === 'dashboard' ? 'bg-indigo-50' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Tổng quan</span>
        </button>

        {/* Tab 2: Sổ giao dịch */}
        <button
          type="button"
          onClick={() => onSelectTab('transactions')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
            currentTab === 'transactions'
              ? 'text-indigo-600 font-black'
              : 'text-slate-400 hover:text-slate-600 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${currentTab === 'transactions' ? 'bg-indigo-50' : ''}`}>
            <ReceiptText className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Sổ giao dịch</span>
        </button>

        {/* Center Quick Add Elevated Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-400/40 border-4 border-white active:scale-90 transition-transform"
            title="Thêm giao dịch thu chi mới"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 3: Danh mục */}
        <button
          type="button"
          onClick={() => onSelectTab('categories')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
            currentTab === 'categories'
              ? 'text-indigo-600 font-black'
              : 'text-slate-400 hover:text-slate-600 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${currentTab === 'categories' ? 'bg-indigo-50' : ''}`}>
            <FolderTree className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Danh mục</span>
        </button>

        {/* Tab 4: Thành viên */}
        <button
          type="button"
          onClick={() => onSelectTab('members')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
            currentTab === 'members'
              ? 'text-indigo-600 font-black'
              : 'text-slate-400 hover:text-slate-600 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${currentTab === 'members' ? 'bg-indigo-50' : ''}`}>
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Thành viên</span>
        </button>
      </div>
    </nav>
  );
};
