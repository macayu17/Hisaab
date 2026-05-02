import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Filter, Plus, Search, Settings } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { DebtCard } from "@/components/DebtCard";
import { colors } from "@/lib/theme";
import { effectiveStatus, formatCurrency, getStats } from "@/lib/utils";
import { useHisaabStore } from "@/lib/store/useHisaabStore";
import { impactMedium, notifySuccess } from "@/lib/safeHaptics";
import type { DebtStatus } from "@/types/hisaab";

type FilterValue = "all" | DebtStatus;

const filters: Array<{ label: string; value: FilterValue }> = [
  { label: "All", value: "all" },
  { label: "Baaki", value: "pending" },
  { label: "Overdue", value: "overdue" },
  { label: "Chukta", value: "settled" },
];

export default function HomeScreen() {
  const debts = useHisaabStore((state) => state.debts);
  const setStatus = useHisaabStore((state) => state.setStatus);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  const stats = useMemo(() => getStats(debts), [debts]);
  const owedToYou = useMemo(
    () =>
      debts
        .filter((debt) => debt.direction === "lent" && ["pending", "overdue"].includes(effectiveStatus(debt)))
        .reduce((sum, debt) => sum + debt.amount, 0),
    [debts],
  );
  const friendCount = useMemo(
    () => new Set(debts.filter((debt) => debt.direction === "lent" && ["pending", "overdue"].includes(effectiveStatus(debt))).map((debt) => debt.friend_id)).size,
    [debts],
  );
  const filteredDebts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return debts.filter((debt) => {
      const status = effectiveStatus(debt);
      const matchesFilter = filter === "all" || status === filter;
      const matchesSearch = !search || debt.friend_name.toLowerCase().includes(search) || debt.note?.toLowerCase().includes(search);
      return matchesFilter && matchesSearch;
    });
  }, [debts, filter, query]);

  return (
    <View style={styles.root}>
      <Screen scroll contentStyle={styles.screenContent}>
        <GlassCard style={styles.hero} innerStyle={styles.heroInner}>
          <Pressable style={styles.settingsButton} onPress={() => router.push("/settings")} accessibilityRole="button" accessibilityLabel="Open settings">
            <Settings color={colors.muted} size={20} />
          </Pressable>
          <Text style={styles.heroLabel}>Total owed to you</Text>
          <Text style={styles.heroAmount}>{formatCurrency(owedToYou)}</Text>
          <Text style={styles.heroHint}>across {friendCount} friends</Text>
        </GlassCard>

        <View style={styles.statsRow}>
          <StatCard label="Active" value={stats.active} color={colors.amber} />
          <StatCard label="Settled" value={stats.settled} color={colors.settled} />
          <StatCard label="Overdue" value={stats.overdue} color={colors.danger} />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search color={colors.muted} size={17} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search friend or note"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              selectionColor={colors.amber}
              accessibilityLabel="Search debts"
            />
          </View>
          <View style={styles.filterIcon}>
            <Filter color={colors.amber} size={18} />
          </View>
        </View>

        <View style={styles.filters}>
          {filters.map((item) => {
            const active = item.value === filter;
            return (
              <Pressable
                key={item.value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(item.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Outstanding</Text>
          <Text style={styles.sectionMeta}>{filteredDebts.length} entries</Text>
        </View>

        {filteredDebts.length ? (
          filteredDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onPress={() => router.push({ pathname: "/friend/[id]", params: { id: debt.friend_id } })}
              onSettle={() => {
                void notifySuccess();
                void setStatus(debt.id, "settled");
              }}
            />
          ))
        ) : (
          <EmptyState title="No hisaab yet" message="Tap the amber button and log a debt in under ten seconds." />
        )}
      </Screen>

      <Pressable
        style={styles.fab}
        onPress={() => {
          void impactMedium();
          router.push("/add");
        }}
        accessibilityRole="button"
        accessibilityLabel="Log new debt"
      >
        <Plus color={colors.ink} size={26} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <GlassCard style={styles.statCard} innerStyle={styles.statInner}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenContent: {
    paddingBottom: 98,
  },
  hero: {
    shadowColor: colors.amber,
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  heroInner: {
    padding: 14,
    minHeight: 126,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  heroLabel: {
    color: colors.muted,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroAmount: {
    fontFamily: "Cinzel_700Bold",
    fontSize: 32,
    lineHeight: 38,
    marginTop: 4,
    color: colors.amberSoft,
    textShadowColor: "rgba(245,163,32,0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  heroHint: {
    color: colors.muted,
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
  },
  statInner: {
    padding: 10,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  statValue: {
    color: colors.mist,
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: "Montserrat_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  searchBox: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.mist,
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
  },
  filterIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245,163,32,0.28)",
    backgroundColor: "rgba(245,163,32,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  filterText: {
    color: colors.muted,
    fontFamily: "Montserrat_700Bold",
    fontSize: 11,
  },
  filterTextActive: {
    color: colors.ink,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.muted,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionMeta: {
    color: colors.muted,
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 84,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.amber,
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9,
  },
});

