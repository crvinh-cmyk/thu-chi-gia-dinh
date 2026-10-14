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

  // Expense breakdown by Category for Donut Chart
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
    <div className="space-y-6">
      {/* Top Quick Actions Bar (Mobile & Desktop) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Thao tác nhanh:
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onOpenAddModal('expense')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            + Ghi khoản Chi
          </button>
          <button
            onClick={() => onOpenAddModal('income')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            + Ghi khoản Thu
          </button>
          <button
            onClick={onOpenBudgetModal}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Target className="w-4 h-4 text-indigo-500" />
            Đặt Ngân Sách
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số dư hiện tại */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-2 -bottom-2 opacity-10 pointer-events-none">
            <Wallet className="w-28 h-28" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-indigo-200 uppercase tracking-wider">
              Tổng số dư tích lũy
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {formatVND(totalBalance)}
          </p>
          <p className="text-xs text-indigo-200 mt-2 flex items-center gap-1">
            <span>Tất cả các tài khoản gia đình</span>
          </p>
        </div>

        {/* Card 2: Tổng thu trong tháng */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng thu trong tháng
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatVND(monthlyIncome)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Tiền vào tháng này</span>
          </div>
        </div>

        {/* Card 3: Tổng chi trong tháng */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng chi trong tháng
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatVND(monthlyExpense)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
            <span>Đã dùng trong tháng</span>
          </div>
        </div>

        {/* Card 4: Tích lũy & Tỷ lệ tiết kiệm */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tiết kiệm tháng này
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${monthlyNet >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatVND(monthlyNet)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-2">
            <span>Tỷ lệ tiết kiệm:</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded-md ${
                savingsRate >= 20
                  ? 'bg-emerald-50 text-emerald-700'
                  : savingsRate >= 0
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {savingsRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Budget Progress Bar Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Kế hoạch Ngân sách Chi tiêu Tháng
              </h4>
              <p className="text-xs text-slate-500">
                Đã dùng {formatVND(monthlyExpense)} / {formatVND(totalBudget)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isBudgetExceeded ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                Vượt ngân sách {formatVND(Math.abs(budgetRemaining))}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Còn lại {formatVND(budgetRemaining)}
              </span>
            )}
            <button
              onClick={onOpenBudgetModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
            >
              Đổi hạn mức
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
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
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
          <span>0 ₫</span>
          <span className="font-semibold text-slate-600">{budgetSpentPct}% ngân sách</span>
          <span>{formatVND(totalBudget)}</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tỷ lệ chi tiêu theo danh mục (Donut Chart) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Cơ cấu Chi tiêu theo Danh mục
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Tỷ trọng các khoản chi trong tháng đang chọn
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('categories')}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <RechartsExpenseDistribution
            data={rechartsData}
            totalValue={monthlyExpense}
          />
        </div>

        {/* Right: So sánh Thu - Chi qua các tháng (MonthlyBarChart) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-bold text-slate-900">
                Xu hướng Thu - Chi 6 tháng
              </h4>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              So sánh tương quan giữa tiền thu về và tiền chi ra
            </p>

            <MonthlyBarChart data={last6MonthsData} />
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Dữ liệu tự động tổng hợp</span>
            <span className="font-medium text-slate-700">Gia đình thông minh</span>
          </div>
        </div>
      </div>

      {/* Second Row: Chi tiêu theo thành viên & Giao dịch gần đây */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Member spending breakdown */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Chi tiêu theo Thành viên
                </h4>
                <p className="text-xs text-slate-500">
                  Ai là người chi tiêu nhiều nhất trong tháng?
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('members')}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
            >
              Chi tiết <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {members.map((member) => {
              const spent = expenseByMember[member.id] || 0;
              const pct = monthlyExpense > 0 ? Math.round((spent / monthlyExpense) * 100) : 0;

              return (
                <div key={member.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: member.avatarColor }}
                      />
                      <span className="text-sm font-semibold text-slate-800">
                        {member.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {member.role}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">
                        {formatVND(spent)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1.5">({pct}%)</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
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
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Giao dịch gần đây
              </h4>
              <p className="text-xs text-slate-500">
                5 khoản thu chi mới được ghi chép gần nhất
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTransactions.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400">
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
                    className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: cat ? cat.color : '#94a3b8' }}
                      >
                        <CategoryIcon name={cat ? cat.icon : 'Tag'} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {tx.note || (cat ? cat.name : 'Giao dịch')}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{formatRelativeDateVN(tx.date)}</span>
                          <span>•</span>
                          <span
                            className="font-medium"
                            style={{ color: mem ? mem.avatarColor : '#64748b' }}
                          >
                            {mem ? mem.name : 'Gia đình'}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">{cat ? cat.name : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-3">
                      <p
                        className={`text-sm font-bold ${
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
    </div>
  );
};
