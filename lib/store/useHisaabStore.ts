import { create } from "zustand";
import {
  deleteAppSetting,
  deleteDebtRecord,
  deleteRemindersForDebt,
  ensureFriend,
  getAppSetting,
  getDebts,
  getFriends,
  getReminderIdsForDebt,
  insertDebt,
  insertReminder,
  migrateDatabase,
  refreshOverdueStatuses,
  setAppSetting,
  setDebtStatus,
  settleAllForFriendRecord,
  updateDebtRecord,
} from "@/lib/db/client";
import {
  cancelScheduledNotifications,
  scheduleDebtReminders,
  setOverdueBadgeCount,
} from "@/lib/notifications";
import { effectiveStatus } from "@/lib/utils";
import type { DebtInput, DebtStatus, DebtWithFriend, Friend } from "@/types/hisaab";

type HisaabState = {
  friends: Friend[];
  debts: DebtWithFriend[];
  backgroundUri: string | null;
  isReady: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  setBackgroundUri: (uri: string) => Promise<void>;
  resetBackground: () => Promise<void>;
  addDebt: (input: DebtInput) => Promise<string>;
  updateDebt: (id: string, input: DebtInput) => Promise<void>;
  setStatus: (id: string, status: DebtStatus) => Promise<void>;
  settleAllForFriend: (friendId: string) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
};

async function rescheduleDebtReminders(debtId: string, input: DebtInput) {
  const existingIds = await getReminderIdsForDebt(debtId);
  await cancelScheduledNotifications(existingIds);
  await deleteRemindersForDebt(debtId);

  const reminders = await scheduleDebtReminders({
    debtId,
    friendName: input.friendName,
    amount: input.amount,
    dueDate: input.dueDate ?? null,
    note: input.note,
  });

  await Promise.all(reminders.map((reminder) => insertReminder(reminder.id, debtId, reminder.scheduledAt, reminder.type)));
}

export const useHisaabStore = create<HisaabState>((set, get) => ({
  friends: [],
  debts: [],
  backgroundUri: null,
  isReady: false,

  hydrate: async () => {
    await migrateDatabase();
    await refreshOverdueStatuses();
    const backgroundUri = await getAppSetting("backgroundUri");
    await get().refresh();
    set({ backgroundUri, isReady: true });
  },

  refresh: async () => {
    await refreshOverdueStatuses();
    const [friends, debts] = await Promise.all([getFriends(), getDebts()]);
    set({ friends, debts });
    const overdueCount = debts.filter((debt) => effectiveStatus(debt) === "overdue").length;
    await setOverdueBadgeCount(overdueCount);
  },

  setBackgroundUri: async (uri) => {
    await setAppSetting("backgroundUri", uri);
    set({ backgroundUri: uri });
  },

  resetBackground: async () => {
    await deleteAppSetting("backgroundUri");
    set({ backgroundUri: null });
  },

  addDebt: async (input) => {
    const friend = await ensureFriend(input.friendName, input.phone);
    const debtId = await insertDebt({
      friendId: friend.id,
      amount: input.amount,
      note: input.note,
      direction: input.direction,
      dateBorrowed: input.dateBorrowed,
      dueDate: input.dueDate,
    });
    await rescheduleDebtReminders(debtId, input);
    await get().refresh();
    return debtId;
  },

  updateDebt: async (id, input) => {
    const friend = await ensureFriend(input.friendName, input.phone);
    await updateDebtRecord(id, {
      friendId: friend.id,
      amount: input.amount,
      note: input.note,
      direction: input.direction,
      dateBorrowed: input.dateBorrowed,
      dueDate: input.dueDate,
    });
    await rescheduleDebtReminders(id, input);
    await get().refresh();
  },

  setStatus: async (id, status) => {
    await setDebtStatus(id, status);
    if (status === "settled" || status === "forgiven") {
      const reminderIds = await getReminderIdsForDebt(id);
      await cancelScheduledNotifications(reminderIds);
      await deleteRemindersForDebt(id);
    }
    await get().refresh();
  },

  settleAllForFriend: async (friendId) => {
    const activeIds = get()
      .debts.filter((debt) => debt.friend_id === friendId && ["pending", "overdue"].includes(effectiveStatus(debt)))
      .map((debt) => debt.id);
    await settleAllForFriendRecord(friendId);
    for (const debtId of activeIds) {
      const reminderIds = await getReminderIdsForDebt(debtId);
      await cancelScheduledNotifications(reminderIds);
      await deleteRemindersForDebt(debtId);
    }
    await get().refresh();
  },

  deleteDebt: async (id) => {
    const reminderIds = await getReminderIdsForDebt(id);
    await cancelScheduledNotifications(reminderIds);
    await deleteDebtRecord(id);
    await get().refresh();
  },
}));
