import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import { CheckCircle2, IndianRupee, MoveLeft, UserRound } from "lucide-react-native";
import { Swipeable } from "react-native-gesture-handler";
import { colors } from "@/lib/theme";
import { debtAgeLabel, effectiveStatus, formatCompactDate, formatCurrency } from "@/lib/utils";
import type { DebtWithFriend } from "@/types/hisaab";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusPill } from "@/components/ui/StatusPill";

type DebtCardProps = {
  debt: DebtWithFriend;
  showFriend?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: () => void;
  onSettle?: () => void;
};

export function DebtCard({ debt, showFriend = true, onPress, onLongPress, onSettle }: DebtCardProps) {
  const status = effectiveStatus(debt);
  const active = status === "pending" || status === "overdue";
  const directionCopy = debt.direction === "lent" ? "Owed to you" : "You owe";
  const directionColor = debt.direction === "lent" ? colors.amber : "#93C5FD";

  const content = (
    <Pressable onPress={onPress} onLongPress={onLongPress} accessibilityRole="button">
      <GlassCard style={styles.card} innerStyle={styles.cardInner}>
        <View style={[styles.statusRail, { backgroundColor: status === "overdue" ? colors.danger : status === "settled" ? colors.settled : directionColor }]} />
        <View style={styles.topRow}>
          <View style={styles.avatar}>
            {showFriend ? <Text style={styles.avatarText}>{debt.friend_initials}</Text> : <IndianRupee color={colors.amber} size={18} />}
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.name}>{showFriend ? debt.friend_name : debt.note || "Transaction"}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {debt.note || "No note"} · {debtAgeLabel(debt.date_borrowed)}
            </Text>
          </View>
          <View style={styles.amountBlock}>
            <Text style={[styles.amount, { color: directionColor }]}>{formatCurrency(debt.amount)}</Text>
            <Text style={styles.direction}>{formatCompactDate(debt.due_date)}</Text>
          </View>
        </View>
        <View style={styles.bottomRow}>
          <StatusPill status={status} />
          <View style={styles.dueBlock}>
            <UserRound color={colors.muted} size={13} />
            <Text style={styles.dueText}>{directionCopy}</Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );

  if (!onSettle || !active) return content;

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.swipeAction}>
          <MoveLeft color={colors.ink} size={18} />
          <CheckCircle2 color={colors.ink} size={22} />
          <Text style={styles.swipeText}>Chukta</Text>
        </View>
      )}
      onSwipeableOpen={onSettle}
    >
      {content}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  cardInner: {
    padding: 16,
  },
  statusRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(245,163,32,0.14)",
    borderWidth: 1,
    borderColor: "rgba(245,163,32,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.amber,
    fontFamily: "Montserrat_700Bold",
    fontSize: 14,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 16,
  },
  meta: {
    color: colors.muted,
    fontFamily: "Montserrat_400Regular",
    fontSize: 12,
    marginTop: 3,
  },
  amountBlock: {
    alignItems: "flex-end",
  },
  amount: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 18,
  },
  direction: {
    color: colors.muted,
    fontFamily: "Montserrat_500Medium",
    fontSize: 11,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  dueBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dueText: {
    color: colors.muted,
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
  },
  swipeAction: {
    width: 118,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: colors.settled,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  swipeText: {
    color: colors.ink,
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});

