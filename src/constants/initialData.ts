import { Category, FamilyMember, Transaction, MonthlyBudget } from '../types';

export const DEFAULT_MEMBERS: FamilyMember[] = [
  { id: 'bo', name: 'Bố', role: 'Bố', avatarColor: '#2563eb' },
  { id: 'me', name: 'Mẹ', role: 'Mẹ', avatarColor: '#db2777' },
  { id: 'con', name: 'Con', role: 'Con', avatarColor: '#10b981' },
];

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'an-uong', name: 'Ăn uống', type: 'expense', icon: 'Utensils', color: '#f97316' },
  { id: 'dien-nuoc', name: 'Điện / Nước / Internet', type: 'expense', icon: 'Zap', color: '#0ea5e9' },
  { id: 'hoc-phi', name: 'Học phí của con', type: 'expense', icon: 'GraduationCap', color: '#8b5cf6' },
  { id: 'nha-xe', name: 'Nhà cửa / Xe cộ', type: 'expense', icon: 'Home', color: '#6366f1' },
  { id: 'y-te', name: 'Y tế & Sức khỏe', type: 'expense', icon: 'HeartPulse', color: '#ef4444' },
  { id: 'mua-sam', name: 'Mua sắm', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'phat-sinh', name: 'Phát sinh & Khác', type: 'expense', icon: 'AlertCircle', color: '#f59e0b' },
  { id: 'giai-tri', name: 'Giải trí & Du lịch', type: 'expense', icon: 'Compass', color: '#14b8a6' },
];

export const DEFAULT_EXPENSE_CATEGORIES_ALL: Category[] = [...DEFAULT_EXPENSE_CATEGORIES];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'luong', name: 'Tiền lương', type: 'income', icon: 'Wallet', color: '#10b981' },
  { id: 'kinh-doanh', name: 'Kinh doanh & Đầu tư', type: 'income', icon: 'TrendingUp', color: '#059669' },
  { id: 'thu-nhap-khac', name: 'Khác', type: 'income', icon: 'Coins', color: '#3b82f6' },
];

export const ALL_DEFAULT_CATEGORIES: Category[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

// Helper to get current YYYY-MM and date strings
const now = new Date();
const currentYear = now.getFullYear();
const currentMonthNum = now.getMonth() + 1;
const pad = (n: number) => n.toString().padStart(2, '0');
const curMonthStr = `${currentYear}-${pad(currentMonthNum)}`;

// Previous month
const prevDate = new Date(currentYear, now.getMonth() - 1, 1);
const prevMonthStr = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}`;

export const DEFAULT_BUDGET: MonthlyBudget = {
  month: curMonthStr,
  totalBudget: 0,
  categoryBudgets: {},
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

