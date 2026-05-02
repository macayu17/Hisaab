import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bell, Clock3, Flame } from "lucide-react-native";
import { DebtCard } from "@/components/DebtCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { Screen } from "@/components/ui/Screen";
import { colors } from "@/lib/theme";
import { effectiveStatus, formatCurrency } from "@/lib/utils";
import { openWhatsAppReminder } from "@/lib/notifications";
import { useHisaabStore } from "@/lib/store/useHisaabStore";

function overdueCopy(dueDate: number | null) {
  if (!dueDate) return "No due date set";
  const days = Math.max(0, Math.floor((Date.now() - dueDate) / 86_400_000));
  if (days <= 0) return "Due today";
  if (days === 1) return "1 day overdue";
  return `${days} days overdue`;
}

export default function NotificationsScreen() {
  const debts = useHisaabStore((state) => state.debts);
  const nudgeDebts = useMemo(
    () =>
      debts
        .filter((debt) => debt.direction === "lent" && ["pending", "overdue"].includes(effectiveStatus(debt)))
        .sort((a, b) => (a.due_date ?? Number.MAX_SAFE_INTEGER) - (b.due_date ?? Number.MAX_SAFE_INTEGER)),
    [debts],
  );

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Pending Nudges</Text>
        <Text style={styles.subtitle}>Gentle reminders for unsettled balances.</Text>
      </View>

      {nudgeDebts.length ? (
        nudgeDebts.map((debt) => {
          const status = effectiveStatus(debt);
          return (
            <GlassCard key={debt.id} style={styles.card} innerStyle={styles.cardInner}>
              <View style={[styles.rail, { backgroundColor: status === "overdue" ? colors.danger : colors.amber }]} />
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{debt.friend_initials}</Text>
              </View>
              <View style={styles.main}>
                <Text style={styles.name}>{debt.friend_name}</Text>
                <View style={styles.dueRow}>
                  <Clock3 color={status === "overdue" ? colors.danger : colors.amberSoft} size={14} />
                  <Text style={[styles.dueText, { color: status === "overdue" ? colors.danger : colors.amberSoft }]}>
                    {overdueCopy(debt.due_date)}
                  </Text>
                </View>
              </View>
              <View style={styles.amountBlock}>
                <Text style={styles.amount}>{formatCurrency(debt.amount)}</Text>
                <Pressable style={styles.nudgeButton} onPress={() => void openWhatsAppReminder(debt)} accessibilityRole="button">
                  <Bell color={colors.ink} size={13} />
                  <Text style={styles.nudgeText}>Nudge</Text>
                </Pressable>
              </View>
            </GlassCard>
          );
        })
      ) : (
        <View style={styles.emptyWrap}>
          <View style={styles.lantern}>
            <Flame color={colors.amber} size={34} fill={colors.amber} />
          </View>
          <EmptyState title="All clear" message="No dues pending." />
        </View>
      )}

      {nudgeDebts.length ? (
        <View style={styles.preview}>
          <Text style={styles.sectionLabel}>Next up</Text>
          <DebtCard debt={nudgeDebts[0]} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 108,
  },
  header: {
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  title: {
    color: colors.mist,
    fontFamily: "Cinzel_600SemiBold",
    fontSize: 20,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  card: {
    marginBottom: 12,
  },
  cardInner: {
    minHeight: 76,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceHighest,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  avatarText: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 15,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 15,
  },
  dueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  dueText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
  },
  amountBlock: {
    alignItems: "flex-end",
    gap: 8,
  },
  amount: {
    color: colors.amberSoft,
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
  },
  nudgeButton: {
    minHeight: 30,
    borderRadius: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: colors.amber,
    shadowColor: colors.amber,
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  nudgeText: {
    color: colors.ink,
    fontFamily: "Montserrat_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
  },
  emptyWrap: {
    alignItems: "center",
  },
  lantern: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,163,32,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,163,32,0.26)",
    shadowColor: colors.amber,
    shadowOpacity: 0.45,
    shadowRadius: 24,
  },
  preview: {
    marginTop: 14,
  },
  sectionLabel: {
    color: colors.muted,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
    paddingLeft: 8,
  },
});
