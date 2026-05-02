import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DebtCard } from "@/components/DebtCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { colors } from "@/lib/theme";
import { formatCurrency, groupDebtsByMonth } from "@/lib/utils";
import { useHisaabStore } from "@/lib/store/useHisaabStore";

export default function HistoryScreen() {
  const debts = useHisaabStore((state) => state.debts);
  const groups = useMemo(() => groupDebtsByMonth(debts), [debts]);

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Full log</Text>
        <Text style={styles.title}>Itihaas</Text>
        <Text style={styles.subtitle}>Every pending, settled, overdue, and forgiven transaction stays visible here.</Text>
      </View>

      {groups.length ? (
        groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <Text style={[styles.groupTotal, { color: group.total >= 0 ? colors.amber : "#93C5FD" }]}>
                {formatCurrency(group.total, true)}
              </Text>
            </View>
            {group.data.map((debt) => (
              <DebtCard key={debt.id} debt={debt} />
            ))}
          </View>
        ))
      ) : (
        <EmptyState title="History is empty" message="Your full settlement trail will appear after the first entry." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 104,
  },
  header: {
    marginBottom: 14,
  },
  eyebrow: {
    color: colors.amber,
    fontFamily: "Montserrat_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 40,
    lineHeight: 44,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: "Montserrat_400Regular",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 330,
  },
  group: {
    marginBottom: 14,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  groupTitle: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 24,
  },
  groupTotal: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 13,
  },
});

