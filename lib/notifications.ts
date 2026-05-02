import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import type { DebtWithFriend, ReminderType } from "@/types/hisaab";
import { formatCurrency, formatFullDate } from "@/lib/utils";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function ensureNotificationPermissions() {
  if (Platform.OS === "web") return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function scheduleDebtReminders(params: {
  debtId: string;
  friendName: string;
  amount: number;
  dueDate: number | null;
  note?: string | null;
}) {
  if (Platform.OS === "web") return [];
  if (!params.dueDate || params.dueDate <= Date.now()) return [];

  const allowed = await ensureNotificationPermissions();
  if (!allowed) return [];

  const reminders: Array<{ id: string; scheduledAt: number; type: ReminderType }> = [];
  const oneDayBefore = params.dueDate - 86_400_000;
  const scheduleItems: Array<{ scheduledAt: number; type: ReminderType; title: string; body: string }> = [];

  if (oneDayBefore > Date.now()) {
    scheduleItems.push({
      scheduledAt: oneDayBefore,
      type: "due_soon",
      title: "Hisaab due tomorrow",
      body: `${params.friendName} ka ${formatCurrency(params.amount)} kal due hai${params.note ? ` for ${params.note}` : ""}.`,
    });
  }

  scheduleItems.push({
    scheduledAt: params.dueDate,
    type: "overdue",
    title: "Hisaab reminder",
    body: `${params.friendName} ka ${formatCurrency(params.amount)} aaj due hai. Hisaab barabar rakho.`,
  });

  for (const item of scheduleItems) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title,
        body: item.body,
        data: { debtId: params.debtId, type: item.type },
      },
      trigger: new Date(item.scheduledAt) as any,
    });

    reminders.push({ id, scheduledAt: item.scheduledAt, type: item.type });
  }

  return reminders;
}

export async function cancelScheduledNotifications(ids: string[]) {
  if (Platform.OS === "web") return;
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
}

export async function setOverdueBadgeCount(count: number) {
  if (Platform.OS === "web") return;
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Android launchers do not all support app icon badges.
  }
}

export async function openWhatsAppReminder(debt: DebtWithFriend) {
  const message = `Bhai, ${formatCurrency(debt.amount)} baaki hai — ${debt.note ?? "hisaab"}, ${formatFullDate(debt.date_borrowed)} se. No rush, bas yaad dila raha tha.`;
  const encoded = encodeURIComponent(message);
  const phone = debt.friend_phone?.replace(/\D/g, "");
  const nativeUrl = phone ? `whatsapp://send?phone=${phone}&text=${encoded}` : `whatsapp://send?text=${encoded}`;
  const webUrl = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;

  const canOpen = await Linking.canOpenURL(nativeUrl);
  await Linking.openURL(canOpen ? nativeUrl : webUrl);
}
