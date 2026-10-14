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
    <div className="space-y-3 sm:space-y-5">
      {/* Hero Balance Card with Primary Thumb Action Buttons */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 -bottom-4 opacity-10 pointer-events-none">
          <Wallet className="w-36 h-36" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-indigo-200 tracking-wider uppercase">
              Tổng số dư tích lũy
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/15 text-indigo-100">
              Cả gia đình
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-4">
            <p className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {formatVND(totalBalance)}
            </p>
            <span className="text-xs text-indigo-200">
              Số dư thực tế khả dụng
            </span>
          </div>

          {/* 2 Nút thao tác chính: + Chi và + Thu (Thumb-friendly on mobile) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Nút + Chi */}
            <button
              onClick={() => onOpenAddModal('expense')}
              className="py-3 px-3 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-extrabold text-sm sm:text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-950/20 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <span>+ Chi Tiêu</span>
            </button>

            {/* Nút + Thu */}
            <button
              onClick={() => onOpenAddModal('income')}
              className="py-3 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-sm sm:text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <span>+ Thu Nhập</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Compact Monthly Metric Cards (Thu, Chi, Tiết kiệm) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Thu trong tháng */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 truncate">
              Thu tháng
            </span>
            <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-sm sm:text-lg font-black text-slate-900 truncate">
            {formatVND(monthlyIncome)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">Tiền vào</span>
        </div>

        {/* Chi trong tháng */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 truncate">
              Chi tháng
            </span>
            <div className="w-5 h-5 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-sm sm:text-lg font-black text-slate-900 truncate">
            {formatVND(monthlyExpense)}
          </p>
          <span className="text-[10px] text-rose-600 font-semibold mt-0.5">Đã tiêu</span>
        </div>

        {/* Tiết kiệm & Tỷ lệ */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 truncate">
              Tiết kiệm
            </span>
            <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-sm sm:text-lg font-black truncate ${monthlyNet >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatVND(monthlyNet)}
          </p>
          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Tỷ lệ: {savingsRate}%
          </span>
        </div>
      </div>

      {/* Monthly Budget Progress Card */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-100 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                Ngân sách chi tiêu tháng
              </h4>
              <p className="text-[10px] text-slate-400 truncate">
                Đã dùng {formatVND(monthlyExpense)} / {formatVND(totalBudget)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isBudgetExceeded ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Vượt {formatCompactVND(Math.abs(budgetRemaining))}
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Còn {formatCompactVND(budgetRemaining)}
              </span>
            )}
            <button
              onClick={onOpenBudgetModal}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
            >
              Đổi
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isBudgetExceeded
                ? 'bg-rose-500'
                : budgetSpentPct > 80
                ? 'bg-amber-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(budgetSpentPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Main Charts Row: Category Breakdown with Recharts */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
              Cơ cấu Chi tiêu theo Danh mục
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Phân bổ các khoản chi trong tháng
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('categories')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
          >
            Quản lý <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <RechartsExpenseDistribution
          data={rechartsData}
          totalValue={monthlyExpense}
        />
      </div>

      {/* Row 2: Member Spending & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
        {/* Member Spending */}
        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Chi tiêu theo Thành viên
                </h4>
                <p className="text-[10px] text-slate-400">
                  Phân bổ chi phí giữa các thành viên
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('members')}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center"
            >
              Xem tất cả <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {members.map((member) => {
              const spent = expenseByMember[member.id] || 0;
              const pct = monthlyExpense > 0 ? Math.round((spent / monthlyExpense) * 100) : 0;

              return (
                <div key={member.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: member.avatarColor }}
                      />
                      <span className="font-bold text-slate-800">
                        {member.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                        {member.role}
                      </span>
                    </div>
                    <div>
                      <span className="font-black text-slate-900">{formatVND(spent)}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
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

        {/* Recent Transactions List */}
        <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Giao dịch gần đây
              </h4>
              <p className="text-[10px] text-slate-400">
                Các khoản mới ghi nhận gần nhất
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              Xem sổ thu chi <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTransactions.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                Chưa có giao dịch nào được ghi lại
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
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-1.5 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat ? cat.color : '#94a3b8' }}
                      >
                        <CategoryIcon name={cat ? cat.icon : 'Tag'} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {tx.note || (cat ? cat.name : 'Giao dịch')}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span>{formatRelativeDateVN(tx.date)}</span>
                          <span>•</span>
                          <span
                            className="font-semibold"
                            style={{ color: mem ? mem.avatarColor : '#64748b' }}
                          >
                            {mem ? mem.name : ''}
                          </span>
                          <span>•</span>
                          <span className="truncate">{cat ? cat.name : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      <p
                        className={`text-xs sm:text-sm font-black ${
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
      </div>

      {/* 6-Month Comparison Trends (Collapsible or bottom placed) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-2xs">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
            Xu hướng Thu - Chi 6 tháng
          </h4>
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-[10px] text-slate-400 mb-3">
          Tương quan thu nhập và chi tiêu qua các tháng
        </p>
        <MonthlyBarChart data={last6MonthsData} />
      </div>
    </div>
  );
};
