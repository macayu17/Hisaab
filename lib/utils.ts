import type { DebtWithFriend, DebtStatus, Friend, FriendSummary } from "@/types/hisaab";

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function startOfToday(now = Date.now()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function addDays(timestamp: number, days: number) {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

export function formatCurrency(amount: number, signed = false) {
  const value = Math.round(amount);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));

  if (!signed || value === 0) return formatted;
  return `${value > 0 ? "+" : "-"}${formatted}`;
}

export function formatCompactDate(timestamp: number | null) {
  if (!timestamp) return "No due date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

export function formatFullDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function formatMonth(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function effectiveStatus(debt: Pick<DebtWithFriend, "status" | "due_date">, today = startOfToday()): DebtStatus {
  if (debt.status === "pending" && debt.due_date && debt.due_date < today) return "overdue";
  return debt.status;
}

export function signedDebtAmount(debt: Pick<DebtWithFriend, "amount" | "direction" | "status">) {
  if (debt.status === "settled" || debt.status === "forgiven") return 0;
  return debt.direction === "lent" ? debt.amount : -debt.amount;
}

export function netActiveAmount(debts: DebtWithFriend[]) {
  return debts.reduce((sum, debt) => sum + signedDebtAmount({ ...debt, status: effectiveStatus(debt) }), 0);
}

export function getStats(debts: DebtWithFriend[]) {
  return debts.reduce(
    (acc, debt) => {
      const status = effectiveStatus(debt);
      if (status === "settled") acc.settled += 1;
      if (status === "overdue") acc.overdue += 1;
      if (status === "pending" || status === "overdue") acc.active += 1;
      return acc;
    },
    { active: 0, settled: 0, overdue: 0 },
  );
}

export function summarizeFriends(friends: Friend[], debts: DebtWithFriend[]): FriendSummary[] {
  return friends
    .map((friend) => {
      const friendDebts = debts.filter((debt) => debt.friend_id === friend.id);
      const stats = getStats(friendDebts);
      return {
        ...friend,
        netAmount: netActiveAmount(friendDebts),
        activeCount: stats.active,
        overdueCount: stats.overdue,
        settledCount: stats.settled,
        lastActivity: friendDebts[0]?.updated_at ?? friend.created_at,
      };
    })
    .sort((a, b) => b.lastActivity - a.lastActivity);
}

export function groupDebtsByMonth(debts: DebtWithFriend[]) {
  return debts.reduce<Array<{ title: string; total: number; data: DebtWithFriend[] }>>((groups, debt) => {
    const title = formatMonth(debt.date_borrowed);
    const existing = groups.find((group) => group.title === title);
    const signed = debt.direction === "lent" ? debt.amount : -debt.amount;
    if (existing) {
      existing.data.push(debt);
      existing.total += signed;
      return groups;
    }
    groups.push({ title, total: signed, data: [debt] });
    return groups;
  }, []);
}

export function debtAgeLabel(timestamp: number) {
  const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day old";
  return `${days} days old`;
}
