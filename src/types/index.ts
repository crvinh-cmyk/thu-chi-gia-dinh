export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'transfer' | 'credit' | 'ewallet';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: 'Bố' | 'Mẹ' | 'Con' | 'Khác';
  avatarColor: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  note: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  totalBudget: number;
  categoryBudgets: Record<string, number>;
}

export type GoldTransactionType = 'import' | 'export'; // 'import': Nhập/Mua (+Vàng), 'export': Xuất/Bán (-Vàng)

export interface GoldTransaction {
  id: string;
  type: GoldTransactionType;
  amountPhan: number; // Số phân (1 chỉ = 10 phân)
  date: string; // YYYY-MM-DD
  reason: string; // Lý do xuất/nhập vàng
  goldType?: string; // Ví dụ: Vàng Nhẫn, Vàng SJC, Vàng 9999, Trang sức
  priceVND?: number; // Số tiền mua/bán (VNĐ, tùy chọn)
  createdAt: string;
}

