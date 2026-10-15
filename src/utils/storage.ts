import { Transaction, Category, FamilyMember, MonthlyBudget } from '../types';
import {
  ALL_DEFAULT_CATEGORIES,
  DEFAULT_MEMBERS,
  INITIAL_TRANSACTIONS,
  DEFAULT_BUDGET,
} from '../constants/initialData';
import { formatDateVN, formatVND } from './formatters';

const STORAGE_KEYS = {
  TRANSACTIONS: 'family_finance_transactions_v2',
  CATEGORIES: 'family_finance_categories_v2',
  MEMBERS: 'family_finance_members_v2',
  BUDGET: 'family_finance_budget_v2',
};

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load transactions from localStorage', e);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveStoredTransactions(txs: Transaction[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  } catch (e) {
    console.error('Failed to save transactions to localStorage', e);
  }
}

export function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(ALL_DEFAULT_CATEGORIES));
      return ALL_DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load categories', e);
    return ALL_DEFAULT_CATEGORIES;
  }
}

export function saveStoredCategories(categories: Category[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save categories', e);
  }
}

export function getStoredMembers(): FamilyMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS));
      return DEFAULT_MEMBERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load members', e);
    return DEFAULT_MEMBERS;
  }
}

export function saveStoredMembers(members: FamilyMember[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Failed to save members', e);
  }
}

export function getStoredBudget(): MonthlyBudget {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGET);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(DEFAULT_BUDGET));
      return DEFAULT_BUDGET;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load budget', e);
    return DEFAULT_BUDGET;
  }
}

export function saveStoredBudget(budget: MonthlyBudget) {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budget));
  } catch (e) {
    console.error('Failed to save budget', e);
  }
}

export function resetAllDataToDefault() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(ALL_DEFAULT_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(DEFAULT_MEMBERS));
  localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(DEFAULT_BUDGET));
}

/**
 * Export transactions to Excel-compatible CSV file with UTF-8 BOM
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  members: FamilyMember[]
) {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const memMap = new Map(members.map((m) => [m.id, m.name]));

  const headers = ['Mã giao dịch', 'Ngày', 'Loại', 'Danh mục', 'Thành viên', 'Số tiền (VNĐ)', 'Phương thức', 'Ghi chú'];
  
  const paymentMethodNames: Record<string, string> = {
    cash: 'Tiền mặt',
    transfer: 'Chuyển khoản',
    credit: 'Thẻ tín dụng',
    ewallet: 'Ví điện tử',
  };

  const rows = transactions.map((t) => [
    t.id,
    formatDateVN(t.date),
    t.type === 'income' ? 'Thu nhập' : 'Chi tiêu',
    catMap.get(t.categoryId) || 'Khác',
    memMap.get(t.memberId) || 'Không xác định',
    t.amount.toString(),
    t.paymentMethod ? paymentMethodNames[t.paymentMethod] || t.paymentMethod : 'Tiền mặt',
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `So_Thu_Chi_Gia_Dinh_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Backup full database to JSON
 */
export function exportBackupJSON(
  transactions: Transaction[],
  categories: Category[],
  members: FamilyMember[],
  budget: MonthlyBudget
) {
  const data = {
    exportedAt: new Date().toISOString(),
    transactions,
    categories,
    members,
    budget,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Sao_Luu_Thu_Chi_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
