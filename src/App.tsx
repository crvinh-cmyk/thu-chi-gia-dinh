import React, { useState, useEffect } from 'react';
import { Transaction, Category, FamilyMember, MonthlyBudget, TransactionType } from './types';
import {
  getStoredTransactions,
  saveStoredTransactions,
  getStoredCategories,
  saveStoredCategories,
  getStoredMembers,
  saveStoredMembers,
  getStoredBudget,
  saveStoredBudget,
  resetAllDataToDefault,
  exportBackupJSON,
} from './utils/storage';
import { INITIAL_TRANSACTIONS, ALL_DEFAULT_CATEGORIES, DEFAULT_MEMBERS, DEFAULT_BUDGET } from './constants/initialData';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { CategoriesView } from './components/CategoriesView';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Wifi, Battery, Signal } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [members, setMembers] = useState<FamilyMember[]>(() => getStoredMembers());
  const [budget, setBudget] = useState<MonthlyBudget>(() => getStoredBudget());

  // Phone frame simulation toggle for desktop
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Current selected month: YYYY-MM
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  // Current tab
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'transactions' | 'categories'>('dashboard');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalDefaultType, setTxModalDefaultType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

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

  // Tab switcher with browser history state for phone Back button
  const handleSelectTab = (tab: 'dashboard' | 'transactions' | 'categories') => {
    if (tab !== currentTab) {
      window.history.pushState({ tab, modal: null }, '', `#${tab}`);
      setCurrentTab(tab);
    }
  };

  // Open modal handlers with history state
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

  // Setup history popstate listener for phone physical Back button
  useEffect(() => {
    // Set initial state if not present
    if (!window.history.state) {
      window.history.replaceState({ tab: 'dashboard', modal: null }, '', '#dashboard');
    }

    const handlePopState = (e: PopStateEvent) => {
      // 1. If any modal is open, close modal
      if (isTxModalOpen || isBudgetModalOpen) {
        setIsTxModalOpen(false);
        setIsBudgetModalOpen(false);
        return;
      }

      // 2. Otherwise navigate to tab in history or fallback to home dashboard
      if (e.state && e.state.tab) {
        setCurrentTab(e.state.tab);
      } else {
        setCurrentTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isTxModalOpen, isBudgetModalOpen]);

  // Handle transaction save (create or update)
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (txData.id) {
      // Update existing
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
      // Create new
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

  // Member handlers
  const handleAddMember = (newMem: Omit<FamilyMember, 'id'>) => {
    const id = `mem-${Date.now()}`;
    setMembers((prev) => [...prev, { ...newMem, id }]);
  };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
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
  };

  const handleBackupData = () => {
    exportBackupJSON(transactions, categories, members, budget);
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
    } catch (err) {
      console.error('Import error', err);
      alert('Tệp dữ liệu sao lưu không đúng định dạng!');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-200/60 sm:p-4 flex items-center justify-center selection:bg-zinc-900 selection:text-white font-sans antialiased">
      {/* Outer Phone Shell Frame Container */}
      <div
        className={`w-full bg-zinc-50 flex flex-col relative overflow-hidden transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[430px] h-screen sm:h-[860px] sm:max-h-[92vh] sm:rounded-[44px] sm:shadow-2xl sm:border-[8px] sm:border-zinc-900'
            : 'max-w-4xl min-h-screen sm:min-h-[850px] sm:rounded-3xl sm:shadow-xl sm:border border-zinc-200'
        }`}
      >
        {/* Phone Notch & Status Bar (Simulated Mobile Display) */}
        {isPhoneFrame && (
          <div className="bg-white pt-2.5 px-6 pb-1.5 flex items-center justify-between text-[11px] font-black text-zinc-900 flex-shrink-0 select-none border-b border-zinc-100">
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
        <main className="flex-1 overflow-y-auto p-2.5 sm:p-3 scrollbar-none overscroll-contain">
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

        {/* Phone Bottom Home Swipe Bar Indicator */}
        {isPhoneFrame && (
          <div className="bg-white py-1 flex justify-center flex-shrink-0">
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
    </div>
  );
}

