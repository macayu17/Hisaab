export type DebtDirection = "lent" | "borrowed";
export type DebtStatus = "pending" | "settled" | "overdue" | "forgiven";
export type ReminderType = "due_soon" | "overdue" | "weekly_digest";

export type Friend = {
  id: string;
  name: string;
  phone: string | null;
  initials: string;
  created_at: number;
};

export type Debt = {
  id: string;
  friend_id: string;
  amount: number;
  note: string | null;
  direction: DebtDirection;
  date_borrowed: number;
  due_date: number | null;
  status: DebtStatus;
  created_at: number;
  updated_at: number;
};

export type DebtWithFriend = Debt & {
  friend_name: string;
  friend_phone: string | null;
  friend_initials: string;
};

export type DebtInput = {
  friendName: string;
  phone?: string | null;
  amount: number;
  note?: string | null;
  direction: DebtDirection;
  dateBorrowed: number;
  dueDate?: number | null;
};

export type FriendSummary = Friend & {
  netAmount: number;
  activeCount: number;
  overdueCount: number;
  settledCount: number;
  lastActivity: number;
};
