import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight, UsersRound } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { colors } from "@/lib/theme";
import { formatCurrency, summarizeFriends } from "@/lib/utils";
import { useHisaabStore } from "@/lib/store/useHisaabStore";

export default function FriendsScreen() {
  const friends = useHisaabStore((state) => state.friends);
  const debts = useHisaabStore((state) => state.debts);
  const summaries = useMemo(() => summarizeFriends(friends, debts), [debts, friends]);

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>People ledger</Text>
        <Text style={styles.title}>Bhadwe</Text>
        <Text style={styles.subtitle}>Every friend is summarized as one net hisaab, including money you owe back.</Text>
      </View>

      {summaries.length ? (
        summaries.map((friend) => {
          const positive = friend.netAmount >= 0;
          return (
            <Pressable
              key={friend.id}
              onPress={() => router.push({ pathname: "/friend/[id]", params: { id: friend.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Open ${friend.name} ledger`}
            >
              <GlassCard style={styles.card} innerStyle={styles.cardInner}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{friend.initials}</Text>
                </View>
                <View style={styles.main}>
                  <Text style={styles.name}>{friend.name}</Text>
                  <Text style={styles.meta}>
                    {friend.activeCount} active · {friend.overdueCount} overdue · {friend.settledCount} settled
                  </Text>
                </View>
                <View style={styles.amountBlock}>
                  <Text style={[styles.amount, { color: positive ? colors.amber : "#93C5FD" }]}>{formatCurrency(friend.netAmount)}</Text>
                  <Text style={styles.amountLabel}>{positive ? "to receive" : "to pay"}</Text>
                </View>
                <ChevronRight color={colors.muted} size={18} />
              </GlassCard>
            </Pressable>
          );
        })
      ) : (
        <EmptyState title="No bhadwe yet" message="People appear automatically when you log the first debt." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 94,
  },
  header: {
    marginBottom: 14,
  },
  eyebrow: {
    color: colors.amber,
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 38,
    lineHeight: 42,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: "Montserrat_400Regular",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 320,
  },
  card: {
    marginBottom: 12,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,163,32,0.13)",
    borderWidth: 1,
    borderColor: "rgba(245,163,32,0.28)",
  },
  avatarText: {
    color: colors.amber,
    fontFamily: "Montserrat_700Bold",
    fontSize: 15,
  },
  main: {
    flex: 1,
  },
  name: {
    color: colors.mist,
    fontFamily: "Montserrat_700Bold",
    fontSize: 15,
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
    fontFamily: "Cinzel_700Bold",
    fontSize: 21,
  },
  amountLabel: {
    color: colors.muted,
    fontFamily: "Montserrat_500Medium",
    fontSize: 11,
  },
});

