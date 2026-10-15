import React from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  ChevronRight,
  Plus,
  Target,
} from 'lucide-react';
import { Transaction, Category, FamilyMember, MonthlyBudget, TransactionType } from '../types';
import { formatVND, formatCompactVND, formatRelativeDateVN } from '../utils/formatters';
import { RechartsExpenseDistribution, CategoryExpenseData } from './Charts/RechartsExpenseDistribution';
import { MonthlyBarChart, MonthlyStats } from './Charts/MonthlyBarChart';
import { CategoryIcon } from './CategoryIcon';

interface DashboardViewProps {
  currentMonth: string; // YYYY-MM
  transactions: Transaction[];
  categories: Category[];
  members: FamilyMember[];
  budget: MonthlyBudget;
  onOpenAddModal: (type: TransactionType) => void;
  onOpenBudgetModal: () => void;
  onNavigateToTab: (tab: 'dashboard' | 'transactions' | 'categories' | 'members') => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentMonth,
  transactions,
  categories,
  members,
  budget,
  onOpenAddModal,
  onOpenBudgetModal,
  onNavigateToTab,
  onEditTransaction,
}) => {
  // Map category and member lookups
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const memberMap = new Map(members.map((m) => [m.id, m]));

  // Transactions in current selected month
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));

  // Current month totals
  const monthlyIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyNet = monthlyIncome - monthlyExpense;

  // Total balance of all time in app
  const allTimeIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const allTimeExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = allTimeIncome - allTimeExpense;

  // Savings rate
  const savingsRate =
    monthlyIncome > 0 ? Math.round((monthlyNet / monthlyIncome) * 100) : 0;

  // Budget calculations
  const totalBudget = budget.totalBudget || 35000000;
  const budgetSpentPct = totalBudget > 0 ? Math.min(Math.round((monthlyExpense / totalBudget) * 100), 200) : 0;
  const budgetRemaining = totalBudget - monthlyExpense;
  const isBudgetExceeded = monthlyExpense > totalBudget;

  // Expense breakdown by Category for Recharts Chart
  const expenseByCategory: Record<string, number> = {};
  monthTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] || 0) + t.amount;
    });

  const rechartsData: CategoryExpenseData[] = Object.entries(expenseByCategory)
    .map(([catId, amount]) => {
      const cat = categoryMap.get(catId);
      const percentage = monthlyExpense > 0 ? Math.round((amount / monthlyExpense) * 100) : 0;
      return {
        id: catId,
        name: cat ? cat.name : 'Khác',
        value: amount,
        color: cat ? cat.color : '#94a3b8',
        icon: cat ? cat.icon : 'Tag',
        percentage,
      };
    })
    .sort((a, b) => b.value - a.value);

  // Spending by Member
  const expenseByMember: Record<string, number> = {};
  monthTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expenseByMember[t.memberId] = (expenseByMember[t.memberId] || 0) + t.amount;
    });

  // Calculate 6-month historical stats for MonthlyBarChart
  const last6MonthsData: MonthlyStats[] = [];
  const [curYear, curMonthNum] = currentMonth.split('-').map(Number);

  for (let i = 5; i >= 0; i--) {
    const d = new Date(curYear, curMonthNum - 1 - i, 1);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const mKey = `${y}-${m}`;

    const txsInM = transactions.filter((t) => t.date.startsWith(mKey));
    const inc = txsInM.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = txsInM.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    last6MonthsData.push({
      monthKey: mKey,
      label: `T${d.getMonth() + 1}`,
      income: inc,
      expense: exp,
    });
  }

  // Recent 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-3 pb-2">
      {/* 1. Hero Balance Card (Dark Neutral Slate with Highlighted Thumb Buttons) */}
      <div className="bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-800 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">
          <Wallet className="w-28 h-28" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Tổng số dư tích lũy
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-zinc-200">
              Gia đình
            </span>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {formatVND(totalBalance)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Khả dụng hiện tại
            </p>
          </div>

          {/* 2 Prominent Thumb Action Buttons: + Chi (Rose) & + Thu (Emerald) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenAddModal('expense')}
              className="py-2.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-rose-950/20 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span>+ Chi Tiêu</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAddModal('income')}
              className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span>+ Thu Nhập</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Compact 3 Monthly Metric Cards (Thu, Chi, Tiết kiệm) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Thu trong tháng */}
        <div className="bg-white rounded-2xl p-2.5 border border-zinc-200/70 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 truncate">
              Thu tháng
            </span>
            <div className="w-4 h-4 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
          <p className="text-xs font-black text-zinc-900 truncate">
            {formatVND(monthlyIncome)}
          </p>
          <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">Tiền vào</span>
        </div>

        {/* Chi trong tháng */}
        <div className="bg-white rounded-2xl p-2.5 border border-zinc-200/70 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 truncate">
              Chi tháng
            </span>
            <div className="w-4 h-4 rounded bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <ArrowDownRight className="w-3 h-3" />
            </div>
          </div>
          <p className="text-xs font-black text-zinc-900 truncate">
            {formatVND(monthlyExpense)}
          </p>
          <span className="text-[9px] text-rose-600 font-bold block mt-0.5">Đã tiêu</span>
        </div>

        {/* Tiết kiệm & Tỷ lệ */}
        <div className="bg-white rounded-2xl p-2.5 border border-zinc-200/70 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 truncate">
              Tiết kiệm
            </span>
            <div className="w-4 h-4 rounded bg-zinc-100 text-zinc-700 flex items-center justify-center flex-shrink-0">
              <PiggyBank className="w-3 h-3" />
            </div>
          </div>
          <p className={`text-xs font-black truncate ${monthlyNet >= 0 ? 'text-zinc-900' : 'text-rose-600'}`}>
            {formatVND(monthlyNet)}
          </p>
          <span className="text-[9px] text-zinc-400 font-bold block mt-0.5">
            Dư: {savingsRate}%
          </span>
        </div>
      </div>

      {/* 3. Monthly Budget Bar */}
      <div className="bg-white rounded-2xl p-3 border border-zinc-200/70 shadow-2xs">
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center flex-shrink-0">
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold text-zinc-900 truncate">
                Ngân sách chi tháng
              </h4>
              <p className="text-[10px] text-zinc-400 truncate">
                {formatVND(monthlyExpense)} / {formatVND(totalBudget)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isBudgetExceeded ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Vượt {formatCompactVND(Math.abs(budgetRemaining))}
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Còn {formatCompactVND(budgetRemaining)}
              </span>
            )}
            <button
              type="button"
              onClick={onOpenBudgetModal}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 underline"
            >
              Đổi
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isBudgetExceeded
                ? 'bg-rose-500'
                : budgetSpentPct > 80
                ? 'bg-amber-500'
                : 'bg-zinc-900'
            }`}
            style={{ width: `${Math.min(budgetSpentPct, 100)}%` }}
          />
        </div>
      </div>

      {/* 4. Category Expense Distribution */}
      <div className="bg-white rounded-2xl p-3.5 border border-zinc-200/70 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-black text-zinc-900">
              Cơ cấu Chi tiêu theo Danh mục
            </h4>
            <p className="text-[10px] text-zinc-400">
              Tỷ lệ chi theo từng nhóm
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('categories')}
            className="text-[11px] font-bold text-zinc-700 hover:text-zinc-900 flex items-center gap-0.5"
          >
            Quản lý <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <RechartsExpenseDistribution
          data={rechartsData}
          totalValue={monthlyExpense}
        />
      </div>

      {/* 5. Member Spending Summary */}
      <div className="bg-white rounded-2xl p-3.5 border border-zinc-200/70 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-zinc-700" />
            <h4 className="text-xs font-black text-zinc-900">
              Chi tiêu theo Thành viên
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('members')}
            className="text-[11px] font-bold text-zinc-500 hover:text-zinc-900 flex items-center"
          >
            Tất cả <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {members.map((member) => {
            const spent = expenseByMember[member.id] || 0;
            const pct = monthlyExpense > 0 ? Math.round((spent / monthlyExpense) * 100) : 0;

            return (
              <div key={member.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                      style={{ backgroundColor: member.avatarColor }}
                    />
                    <span className="font-bold text-zinc-800 text-xs truncate">
                      {member.name}
                    </span>
                    <span className="text-[9px] font-semibold text-zinc-400 bg-zinc-100 px-1 py-0.2 rounded">
                      {member.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="font-extrabold text-zinc-900 text-xs">{formatVND(spent)}</span>
                    <span className="text-[10px] text-zinc-400">({pct}%)</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: member.avatarColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Recent Transactions List Cards */}
      <div className="bg-white rounded-2xl p-3.5 border border-zinc-200/70 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-xs font-black text-zinc-900">
              Giao dịch gần đây
            </h4>
            <p className="text-[10px] text-zinc-400">
              Mới ghi nhận
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('transactions')}
            className="text-[11px] font-bold text-zinc-700 hover:text-zinc-900 flex items-center"
          >
            Sổ thu chi <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-zinc-100">
          {recentTransactions.length === 0 ? (
            <p className="text-center py-4 text-xs text-zinc-400">
              Chưa có giao dịch nào
            </p>
          ) : (
            recentTransactions.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              const mem = memberMap.get(tx.memberId);
              const isExpense = tx.type === 'expense';

              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction(tx)}
                  className="py-2 flex items-center justify-between hover:bg-zinc-50 px-1 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat ? cat.color : '#94a3b8' }}
                    >
                      <CategoryIcon name={cat ? cat.icon : 'Tag'} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-zinc-900 truncate">
                        {tx.note || (cat ? cat.name : 'Giao dịch')}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                        <span>{formatRelativeDateVN(tx.date)}</span>
                        <span>•</span>
                        <span
                          className="font-bold"
                          style={{ color: mem ? mem.avatarColor : '#64748b' }}
                        >
                          {mem ? mem.name : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-2">
                    <p
                      className={`text-xs font-black ${
                        isExpense ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatVND(tx.amount)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 7. Historical Trend Chart */}
      <div className="bg-white rounded-2xl p-3.5 border border-zinc-200/70 shadow-2xs">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-black text-zinc-900">
            Xu hướng Thu - Chi 6 tháng
          </h4>
          <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
        </div>
        <p className="text-[10px] text-zinc-400 mb-2">
          Biểu đồ so sánh lịch sử
        </p>
        <MonthlyBarChart data={last6MonthsData} />
      </div>
    </div>
  );
};

