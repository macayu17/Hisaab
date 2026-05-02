import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Bell, CheckCircle2, MoreHorizontal } from "lucide-react-native";
import { DebtCard } from "@/components/DebtCard";
import { ConfirmSheet, DebtActionsSheet } from "@/components/ui/ConfirmSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { Screen } from "@/components/ui/Screen";
import { StatusPill } from "@/components/ui/StatusPill";
import { colors } from "@/lib/theme";
import { effectiveStatus, formatCurrency, getStats, netActiveAmount } from "@/lib/utils";
import { openWhatsAppReminder } from "@/lib/notifications";
import { useHisaabStore } from "@/lib/store/useHisaabStore";
import { notifySuccess, notifyWarning } from "@/lib/safeHaptics";
import type { DebtStatus, DebtWithFriend } from "@/types/hisaab";

type ConfirmAction =
  | { type: "settle"; debt: DebtWithFriend }
  | { type: "forgive"; debt: DebtWithFriend }
  | { type: "delete"; debt: DebtWithFriend }
  | { type: "settleAll" };

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function FriendDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const friendId = getParam(params.id);
  const friends = useHisaabStore((state) => state.friends);
  const debts = useHisaabStore((state) => state.debts);
  const setStatus = useHisaabStore((state) => state.setStatus);
  const settleAllForFriend = useHisaabStore((state) => state.settleAllForFriend);
  const deleteDebt = useHisaabStore((state) => state.deleteDebt);
  const [actionDebt, setActionDebt] = useState<DebtWithFriend | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const friend = friends.find((item) => item.id === friendId);
  const friendDebts = useMemo(() => debts.filter((debt) => debt.friend_id === friendId), [debts, friendId]);
  const activeDebts = useMemo(
    () => friendDebts.filter((debt) => ["pending", "overdue"].includes(effectiveStatus(debt))),
    [friendDebts],
  );
  const stats = useMemo(() => getStats(friendDebts), [friendDebts]);
  const net = useMemo(() => netActiveAmount(friendDebts), [friendDebts]);
  const heroStatus: DebtStatus = stats.overdue > 0 ? "overdue" : stats.active > 0 ? "pending" : "settled";
  const reminderDebt = activeDebts.find((debt) => debt.direction === "lent") ?? activeDebts[0];

  if (!friend) {
    return (
      <Screen>
        <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <ArrowLeft color={colors.mist} size={21} />
        </Pressable>
        <EmptyState title="Friend not found" message="This ledger may have been deleted." />
      </Screen>
    );
  }

  const confirmCopy = getConfirmCopy(confirmAction);

  async function runConfirmAction() {
    if (!confirmAction || !friendId) return;

    if (confirmAction.type === "settle") {
      await setStatus(confirmAction.debt.id, "settled");
      await notifySuccess();
    }

    if (confirmAction.type === "forgive") {
      await setStatus(confirmAction.debt.id, "forgiven");
      await notifySuccess();
    }

    if (confirmAction.type === "delete") {
      await deleteDebt(confirmAction.debt.id);
      await notifyWarning();
    }

    if (confirmAction.type === "settleAll") {
      await settleAllForFriend(friendId);
      await notifySuccess();
    }

    setConfirmAction(null);
    setActionDebt(null);
  }

  return (
    <View style={styles.root}>
      <Screen scroll contentStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
            <ArrowLeft color={colors.mist} size={21} />
          </Pressable>
          <Pressable
            style={styles.moreButton}
            onPress={() => {
              if (activeDebts.length) setConfirmAction({ type: "settleAll" });
            }}
            accessibilityRole="button"
            accessibilityLabel="Settle all active debts"
          >
            <MoreHorizontal color={colors.mist} size={21} />
          </Pressable>
        </View>

        <GlassCard style={styles.hero} innerStyle={styles.heroInner}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{friend.initials}</Text>
          </View>
          <View style={styles.heroTitleRow}>
            <View style={styles.heroTitleBlock}>
              <Text style={styles.friendName}>{friend.name}</Text>
              <Text style={styles.friendMeta}>{friend.phone ?? "Manual contact"}</Text>
            </View>
            <StatusPill status={heroStatus} />
          </View>
          <Text style={styles.heroLabel}>{net >= 0 ? "Net to receive" : "Net to pay"}</Text>
          <Text style={[styles.heroAmount, { color: net >= 0 ? colors.amber : "#93C5FD" }]}>{formatCurrency(net)}</Text>
          <View style={styles.heroStats}>
            <MiniStat label="Active" value={stats.active} />
            <MiniStat label="Overdue" value={stats.overdue} />
            <MiniStat label="Settled" value={stats.settled} />
          </View>
        </GlassCard>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionButton, !reminderDebt && styles.actionDisabled]}
            disabled={!reminderDebt}
            onPress={() => {
              if (reminderDebt) void openWhatsAppReminder(reminderDebt);
            }}
            accessibilityRole="button"
          >
            <Bell color={reminderDebt ? colors.amber : colors.muted} size={17} />
            <Text style={styles.actionText}>Remind</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, !activeDebts.length && styles.actionDisabled]}
            disabled={!activeDebts.length}
            onPress={() => setConfirmAction({ type: "settleAll" })}
            accessibilityRole="button"
          >
            <CheckCircle2 color={activeDebts.length ? colors.settled : colors.muted} size={17} />
            <Text style={styles.actionText}>Settle all</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <Text style={styles.sectionMeta}>{friendDebts.length} entries</Text>
        </View>

        {friendDebts.length ? (
          friendDebts.map((debt) => {
            const active = ["pending", "overdue"].includes(effectiveStatus(debt));
            return (
              <DebtCard
                key={debt.id}
                debt={debt}
                showFriend={false}
                onSettle={active ? () => setConfirmAction({ type: "settle", debt }) : undefined}
                onLongPress={() => setActionDebt(debt)}
              />
            );
          })
        ) : (
          <EmptyState title="No transactions" message="This friend has no recorded history yet." />
        )}
      </Screen>

      <DebtActionsSheet
        visible={Boolean(actionDebt)}
        canSettle={Boolean(actionDebt && ["pending", "overdue"].includes(effectiveStatus(actionDebt)))}
        onClose={() => setActionDebt(null)}
        onEdit={() => {
          if (!actionDebt) return;
          const id = actionDebt.id;
          setActionDebt(null);
          router.push({ pathname: "/add", params: { debtId: id } });
        }}
        onSettle={() => {
          if (actionDebt) setConfirmAction({ type: "settle", debt: actionDebt });
        }}
        onForgive={() => {
          if (actionDebt) setConfirmAction({ type: "forgive", debt: actionDebt });
        }}
        onDelete={() => {
          if (actionDebt) setConfirmAction({ type: "delete", debt: actionDebt });
        }}
      />

      <ConfirmSheet
        visible={Boolean(confirmAction)}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.confirmLabel}
        tone={confirmCopy.tone}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmAction}
      />
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function getConfirmCopy(action: ConfirmAction | null): {
  title: string;
  message: string;
  confirmLabel: string;
  tone: "default" | "danger" | "settled";
} {
  if (!action) {
    return { title: "Confirm", message: "", confirmLabel: "Confirm", tone: "default" };
  }
  if (action.type === "settle") {
    return {
      title: "Mark this chukta?",
      message: "The transaction moves to settled history and due reminders are cancelled.",
      confirmLabel: "Chukta",
      tone: "settled",
    };
  }
  if (action.type === "forgive") {
    return {
      title: "Maaf kiya?",
      message: "This marks the amount forgiven instead of paid, keeping the history clear.",
      confirmLabel: "Forgive",
      tone: "default",
    };
  }
  if (action.type === "delete") {
    return {
      title: "Delete transaction?",
      message: "This permanently removes the entry and any local reminders.",
      confirmLabel: "Delete",
      tone: "danger",
    };
  }
  return {
    title: "Settle all active debts?",
    message: "All pending and overdue entries with this friend will move to chukta.",
    confirmLabel: "Settle all",
    tone: "settled",
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingBottom: 118,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  hero: {
    marginBottom: 12,
  },
  heroInner: {
    padding: 20,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,163,32,0.14)",
    borderWidth: 1,
    borderColor: "rgba(245,163,32,0.3)",
  },
  avatarLargeText: {
    color: colors.amber,
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
  },
  heroTitleBlock: {
    flex: 1,
  },
  friendName: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 38,
    lineHeight: 40,
  },
  friendMeta: {
    color: colors.muted,
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
  heroLabel: {
    color: colors.muted,
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 20,
  },
  heroAmount: {
    fontFamily: "Cinzel_700Bold",
    fontSize: 52,
    lineHeight: 58,
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  miniStat: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniValue: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 24,
  },
  miniLabel: {
    color: colors.muted,
    fontFamily: "Montserrat_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  actionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionDisabled: {
    opacity: 0.48,
  },
  actionText: {
    color: colors.mist,
    fontFamily: "Montserrat_700Bold",
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 30,
  },
  sectionMeta: {
    color: colors.muted,
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
  },
});

