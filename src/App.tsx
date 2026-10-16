import React, { useState, useEffect } from 'react';
import {
  Transaction,
  Category,
  FamilyMember,
  MonthlyBudget,
  TransactionType,
  GoldTransaction,
  GoldTransactionType,
} from './types';
import {
  getStoredTransactions,
  saveStoredTransactions,
  getStoredCategories,
  saveStoredCategories,
  getStoredMembers,
  saveStoredMembers,
  getStoredBudget,
  saveStoredBudget,
  getStoredGoldTransactions,
  saveStoredGoldTransactions,
  resetAllDataToDefault,
  exportBackupJSON,
} from './utils/storage';
import { INITIAL_TRANSACTIONS, ALL_DEFAULT_CATEGORIES, DEFAULT_MEMBERS, DEFAULT_BUDGET } from './constants/initialData';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { CategoriesView } from './components/CategoriesView';
import { GoldView } from './components/GoldView';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { GoldModal } from './components/GoldModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Wifi, Battery, Signal } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [members, setMembers] = useState<FamilyMember[]>(() => getStoredMembers());
  const [budget, setBudget] = useState<MonthlyBudget>(() => getStoredBudget());
  const [goldTransactions, setGoldTransactions] = useState<GoldTransaction[]>(() => getStoredGoldTransactions());

  // Phone frame simulation toggle for desktop
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Current selected month: YYYY-MM
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  // Current active tab
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'transactions' | 'gold' | 'categories'>('dashboard');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalDefaultType, setTxModalDefaultType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Gold modal state
  const [isGoldModalOpen, setIsGoldModalOpen] = useState(false);
  const [goldModalDefaultType, setGoldModalDefaultType] = useState<GoldTransactionType>('import');
  const [editingGoldTx, setEditingGoldTx] = useState<GoldTransaction | null>(null);

  // Sync to local storage
  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStoredCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveStoredMembers(members);
  }, [members]);

  useEffect(() => {
    saveStoredBudget(budget);
  }, [budget]);

  useEffect(() => {
    saveStoredGoldTransactions(goldTransactions);
  }, [goldTransactions]);

  // Tab switcher with browser history state for phone Back button
  const handleSelectTab = (tab: 'dashboard' | 'transactions' | 'gold' | 'categories') => {
    if (tab !== currentTab) {
      window.history.pushState({ tab, modal: null }, '', `#${tab}`);
      setCurrentTab(tab);
    }
  };

  // Open transaction modal handlers with history state
  const handleOpenAddModal = (type: TransactionType = 'expense') => {
    setEditingTransaction(null);
    setTxModalDefaultType(type);
    setIsTxModalOpen(true);
    window.history.pushState({ tab: currentTab, modal: 'txModal' }, '', '#modal');
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxModalDefaultType(tx.type);
    setIsTxModalOpen(true);
    window.history.pushState({ tab: currentTab, modal: 'txModal' }, '', '#modal');
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    setEditingTransaction({
      ...tx,
      id: '', // Empty id means new
      date: new Date().toISOString().split('T')[0],
      note: tx.note ? `${tx.note} (Sao chép)` : '',
    });
    setTxModalDefaultType(tx.type);
    setIsTxModalOpen(true);
    window.history.pushState({ tab: currentTab, modal: 'txModal' }, '', '#modal');
  };

  const handleOpenBudgetModal = () => {
    setIsBudgetModalOpen(true);
    window.history.pushState({ tab: currentTab, modal: 'budgetModal' }, '', '#modal');
  };

  // Gold modal handlers
  const handleOpenGoldModal = (type: GoldTransactionType = 'import') => {
    setEditingGoldTx(null);
    setGoldModalDefaultType(type);
    setIsGoldModalOpen(true);
    window.history.pushState({ tab: currentTab, modal: 'goldModal' }, '', '#gold-modal');
  };

  const handleEditGoldTransaction = (tx: GoldTransaction) => {
    setEditingGoldTx(tx);
    setGoldModalDefaultType(tx.type);
    setIsGoldModalOpen(true);
    window.history.pushState({ tab: currentTab, modal: 'goldModal' }, '', '#gold-modal');
  };

  // Setup history popstate listener for physical phone Back button
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ tab: 'dashboard', modal: null }, '', '#dashboard');
    }

    const handlePopState = (e: PopStateEvent) => {
      // 1. If any modal is open, close modal first
      if (isTxModalOpen || isBudgetModalOpen || isGoldModalOpen) {
        setIsTxModalOpen(false);
        setIsBudgetModalOpen(false);
        setIsGoldModalOpen(false);
        return;
      }

      // 2. Otherwise navigate to tab in history or fallback to dashboard
      if (e.state && e.state.tab) {
        setCurrentTab(e.state.tab);
      } else {
        setCurrentTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isTxModalOpen, isBudgetModalOpen, isGoldModalOpen]);

  // Handle Money transaction save (create or update)
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (txData.id) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === txData.id
            ? {
                ...t,
                type: txData.type,
                amount: txData.amount,
                categoryId: txData.categoryId,
                memberId: txData.memberId,
                date: txData.date,
                note: txData.note,
                paymentMethod: txData.paymentMethod,
              }
            : t
        )
      );
    } else {
      const newTx: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: txData.type,
        amount: txData.amount,
        categoryId: txData.categoryId,
        memberId: txData.memberId,
        date: txData.date,
        note: txData.note,
        paymentMethod: txData.paymentMethod,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Handle Gold transaction save (create or update)
  const handleSaveGoldTransaction = (
    txData: Omit<GoldTransaction, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (txData.id) {
      setGoldTransactions((prev) =>
        prev.map((t) =>
          t.id === txData.id
            ? {
                ...t,
                type: txData.type,
                amountPhan: txData.amountPhan,
                date: txData.date,
                reason: txData.reason,
                goldType: txData.goldType,
                priceVND: txData.priceVND,
              }
            : t
        )
      );
    } else {
      const newGoldTx: GoldTransaction = {
        id: `gold-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: txData.type,
        amountPhan: txData.amountPhan,
        date: txData.date,
        reason: txData.reason,
        goldType: txData.goldType,
        priceVND: txData.priceVND,
        createdAt: new Date().toISOString(),
      };
      setGoldTransactions((prev) => [newGoldTx, ...prev]);
    }
  };

  const handleDeleteGoldTransaction = (id: string) => {
    setGoldTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Category handlers
  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const id = `cat-${Date.now()}`;
    setCategories((prev) => [...prev, { ...newCat, id }]);
  };

  const handleUpdateCategory = (updatedCat: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
  };

  const handleUpdateCategoryBudget = (catId: string, amount: number) => {
    setBudget((prev) => ({
      ...prev,
      categoryBudgets: {
        ...(prev.categoryBudgets || {}),
        [catId]: amount,
      },
    }));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Budget handler
  const handleSaveBudget = (newBudget: MonthlyBudget) => {
    setBudget(newBudget);
  };

  // Backup & restore
  const handleResetData = () => {
    resetAllDataToDefault();
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(ALL_DEFAULT_CATEGORIES);
    setMembers(DEFAULT_MEMBERS);
    setBudget(DEFAULT_BUDGET);
    setGoldTransactions([]);
  };

  const handleBackupData = () => {
    exportBackupJSON(transactions, categories, members, budget, goldTransactions);
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
      if (data.members && Array.isArray(data.members)) {
        setMembers(data.members);
      }
      if (data.budget) {
        setBudget(data.budget);
      }
      if (data.goldTransactions && Array.isArray(data.goldTransactions)) {
        setGoldTransactions(data.goldTransactions);
      }
    } catch (err) {
      console.error('Import error', err);
      alert('Tệp dữ liệu sao lưu không đúng định dạng!');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-full bg-zinc-200/60 sm:p-4 flex items-center justify-center selection:bg-zinc-900 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Outer Phone Shell Frame Container */}
      <div
        className={`w-full max-w-full bg-zinc-50 flex flex-col relative overflow-x-hidden transition-all duration-300 ${
          isPhoneFrame
            ? 'sm:max-w-[430px] h-[100dvh] sm:h-[860px] sm:max-h-[92vh] sm:rounded-[44px] sm:shadow-2xl sm:border-[8px] sm:border-zinc-900'
            : 'max-w-4xl min-h-[100dvh] sm:min-h-[850px] sm:rounded-3xl sm:shadow-xl sm:border border-zinc-200'
        }`}
      >
        {/* Phone Notch & Status Bar (Simulated Mobile Display on Desktop) */}
        {isPhoneFrame && (
          <div className="hidden sm:flex bg-white pt-2.5 px-6 pb-1.5 items-center justify-between text-[11px] font-black text-zinc-900 flex-shrink-0 select-none border-b border-zinc-100">
            <span>09:41</span>
            {/* Camera / Island Notch */}
            <div className="w-24 h-4 bg-zinc-900 rounded-full mx-2 flex-shrink-0" />
            <div className="flex items-center gap-1.5 text-zinc-800">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Top Header Navbar */}
        <Navbar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          currentMonth={currentMonth}
          onChangeMonth={setCurrentMonth}
          onOpenAddModal={() => handleOpenAddModal('expense')}
          onResetData={handleResetData}
          onBackupData={handleBackupData}
          onImportData={handleImportData}
          isPhoneFrame={isPhoneFrame}
          onTogglePhoneFrame={() => setIsPhoneFrame(!isPhoneFrame)}
        />

        {/* Scrollable Main Phone Screen Content View */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-3 scrollbar-none overscroll-contain w-full max-w-full min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardView
              currentMonth={currentMonth}
              transactions={transactions}
              categories={categories}
              members={members}
              budget={budget}
              onOpenAddModal={handleOpenAddModal}
              onOpenBudgetModal={handleOpenBudgetModal}
              onNavigateToTab={handleSelectTab}
              onEditTransaction={handleEditTransaction}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              categories={categories}
              members={members}
              onOpenAddModal={handleOpenAddModal}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onDuplicateTransaction={handleDuplicateTransaction}
              currentMonth={currentMonth}
            />
          )}

          {currentTab === 'gold' && (
            <GoldView
              goldTransactions={goldTransactions}
              onOpenModal={handleOpenGoldModal}
              onEditTransaction={handleEditGoldTransaction}
              onDeleteTransaction={handleDeleteGoldTransaction}
            />
          )}

          {currentTab === 'categories' && (
            <CategoriesView
              categories={categories}
              transactions={transactions}
              members={members}
              currentMonth={currentMonth}
              budget={budget}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onUpdateCategoryBudget={handleUpdateCategoryBudget}
              onEditTransaction={handleEditTransaction}
            />
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <MobileBottomNav
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onOpenAddModal={() => handleOpenAddModal('expense')}
        />

        {/* Phone Bottom Home Swipe Bar Indicator (Simulated on Desktop) */}
        {isPhoneFrame && (
          <div className="hidden sm:flex bg-white py-1 justify-center flex-shrink-0">
            <div className="w-28 h-1 bg-zinc-300 rounded-full" />
          </div>
        )}
      </div>

      {/* Transaction Add / Edit Modal Sheet */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        categories={categories}
        members={members}
        editingTransaction={editingTransaction}
        defaultType={txModalDefaultType}
      />

      {/* Monthly Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        currentBudget={budget}
        expenseCategories={categories.filter((c) => c.type === 'expense')}
        onSaveBudget={handleSaveBudget}
      />

      {/* Gold Transaction Modal */}
      <GoldModal
        isOpen={isGoldModalOpen}
        onClose={() => setIsGoldModalOpen(false)}
        onSave={handleSaveGoldTransaction}
        defaultType={goldModalDefaultType}
        editingTransaction={editingGoldTx}
      />
    </div>
  );
}
