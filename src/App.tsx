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
import { MembersView } from './components/MembersView';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { MobileBottomNav } from './components/MobileBottomNav';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [members, setMembers] = useState<FamilyMember[]>(() => getStoredMembers());
  const [budget, setBudget] = useState<MonthlyBudget>(() => getStoredBudget());

  // Current selected month: YYYY-MM
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  // Current tab
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'transactions' | 'categories' | 'members'>('dashboard');

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

  const handleOpenAddModal = (type: TransactionType = 'expense') => {
    setEditingTransaction(null);
    setTxModalDefaultType(type);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxModalDefaultType(tx.type);
    setIsTxModalOpen(true);
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    // Open modal as new transaction with copied values
    setEditingTransaction({
      ...tx,
      id: '', // Empty id means new
      date: new Date().toISOString().split('T')[0],
      note: tx.note ? `${tx.note} (Sao chép)` : '',
    });
    setTxModalDefaultType(tx.type);
    setIsTxModalOpen(true);
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
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentMonth={currentMonth}
        onChangeMonth={setCurrentMonth}
        onOpenAddModal={() => handleOpenAddModal('expense')}
        onResetData={handleResetData}
        onBackupData={handleBackupData}
        onImportData={handleImportData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:pb-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            currentMonth={currentMonth}
            transactions={transactions}
            categories={categories}
            members={members}
            budget={budget}
            onOpenAddModal={handleOpenAddModal}
            onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            onNavigateToTab={setCurrentTab}
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

        {currentTab === 'members' && (
          <MembersView
            members={members}
            transactions={transactions}
            categories={categories}
            currentMonth={currentMonth}
            onAddMember={handleAddMember}
            onDeleteMember={handleDeleteMember}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={() => handleOpenAddModal('expense')}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white py-6 text-center text-xs text-slate-400 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Quản Lý Thu Chi Gia Đình. Dữ liệu lưu trữ an toàn trên thiết bị của bạn.</p>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>Tiếng Việt 100%</span>
            <span>•</span>
            <span>VNĐ (₫)</span>
            <span>•</span>
            <span>Bảo mật nội bộ</span>
          </div>
        </div>
      </footer>

      {/* Transaction Add / Edit Modal */}
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
