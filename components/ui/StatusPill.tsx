import { StyleSheet, Text, View } from "react-native";
import { AlertTriangle, CheckCircle2, Clock3, Sparkles } from "lucide-react-native";
import { colors, statusMeta } from "@/lib/theme";
import type { DebtStatus } from "@/types/hisaab";

const icons = {
  pending: Clock3,
  overdue: AlertTriangle,
  settled: CheckCircle2,
  forgiven: Sparkles,
} as const;

export function StatusPill({ status }: { status: DebtStatus }) {
  const meta = statusMeta[status];
  const Icon = icons[status];

  return (
    <View style={[styles.pill, { borderColor: meta.color, backgroundColor: `${meta.color}1A` }]}>
      <Icon color={meta.color} size={13} strokeWidth={2.4} />
      <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});

