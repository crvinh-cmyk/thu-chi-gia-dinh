import React, { useState } from 'react';
import { Users, Plus, User, ArrowUpRight, ArrowDownRight, X, Trash2 } from 'lucide-react';
import { FamilyMember, Transaction, Category } from '../types';
import { formatVND, formatDateVN } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface MembersViewProps {
  members: FamilyMember[];
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string;
  onAddMember: (member: Omit<FamilyMember, 'id'>) => void;
  onDeleteMember: (id: string) => void;
}

const MEMBER_COLORS = ['#2563eb', '#db2777', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  transactions,
  categories,
  currentMonth,
  onAddMember,
  onDeleteMember,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Bố' | 'Mẹ' | 'Con' | 'Khác'>('Con');
  const [avatarColor, setAvatarColor] = useState('#10b981');
  const [error, setError] = useState('');

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Month transactions
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
  const totalMonthIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalMonthExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  // Active member details
  const activeMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const activeMemberTxs = monthTransactions.filter((t) => t.memberId === activeMember?.id);

  const activeIncome = activeMemberTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const activeExpense = activeMemberTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên thành viên');
      return;
    }
    onAddMember({
      name: name.trim(),
      role,
      avatarColor,
    });
    setIsModalOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Thành Viên Trong Gia Đình</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi sự đóng góp thu nhập và thói quen chi tiêu của từng người
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setRole('Con');
            setError('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-200 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm thành viên</span>
        </button>
      </div>

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {members.map((m) => {
          const mTx = monthTransactions.filter((t) => t.memberId === m.id);
          const inc = mTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const exp = mTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const isSelected = activeMember?.id === m.id;

          const expPct = totalMonthExpense > 0 ? Math.round((exp / totalMonthExpense) * 100) : 0;

          return (
            <div
              key={m.id}
              onClick={() => setSelectedMemberId(m.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-200'
                  : 'bg-white border-slate-100 hover:border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-xs"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{m.name}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {m.role}
                    </span>
                  </div>
                </div>

                {members.length > 2 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Bạn có chắc muốn xóa thành viên ${m.name}?`)) {
                        onDeleteMember(m.id);
                      }
                    }}
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                    title="Xóa thành viên"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Stats overview */}
              <div className="space-y-2 pt-2 border-t border-slate-50 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> Thu về:
                  </span>
                  <span className="font-semibold text-emerald-600">+{formatVND(inc)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" /> Chi ra:
                  </span>
                  <span className="font-semibold text-rose-600">-{formatVND(exp)}</span>
                </div>
              </div>

              {/* Expense proportion bar */}
              <div className="mt-3 pt-2 border-t border-slate-50">
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
                  <span>Chiếm chi tiêu gia đình:</span>
                  <span className="font-bold text-slate-700">{expPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${expPct}%`, backgroundColor: m.avatarColor }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Member Detail View */}
      {activeMember && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: activeMember.avatarColor }}
              >
                {activeMember.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Lịch sử giao dịch tháng của: {activeMember.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Tổng {activeMemberTxs.length} giao dịch được ghi nhận
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-slate-400">Thu:</span>{' '}
                <span className="font-bold text-emerald-600">+{formatVND(activeIncome)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Chi:</span>{' '}
                <span className="font-bold text-rose-600">-{formatVND(activeExpense)}</span>
              </div>
            </div>
          </div>

          {/* List of active member transactions */}
          <div className="divide-y divide-slate-100">
            {activeMemberTxs.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                Thành viên này chưa có giao dịch nào trong tháng đang chọn
              </p>
            ) : (
              activeMemberTxs.map((tx) => {
                const cat = categoryMap.get(tx.categoryId);
                const isExpense = tx.type === 'expense';
                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: cat ? cat.color : '#94a3b8' }}
                      >
                        <CategoryIcon name={cat ? cat.icon : 'Tag'} className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {tx.note || (cat ? cat.name : 'Giao dịch')}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateVN(tx.date)} • {cat ? cat.name : ''}
                        </p>
                      </div>
                    </div>

                    <p
                      className={`text-xs font-bold ${
                        isExpense ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatVND(tx.amount)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Thêm thành viên gia đình</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-xl">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Tên thành viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Bé Bon, Bà Ngoại, Bác Hai..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Vai trò
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-hidden"
                >
                  <option value="Bố">Bố</option>
                  <option value="Mẹ">Mẹ</option>
                  <option value="Con">Con</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Màu đại diện
                </label>
                <div className="flex gap-2">
                  {MEMBER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        avatarColor === c ? 'scale-125 ring-2 ring-slate-900' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
