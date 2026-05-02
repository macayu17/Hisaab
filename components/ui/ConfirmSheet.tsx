import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, Pencil, Trash2 } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { colors } from "@/lib/theme";

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "danger" | "settled";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const accent = tone === "danger" ? colors.danger : tone === "settled" ? colors.settled : colors.amber;

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Dismiss confirmation" />
      <BlurView intensity={28} tint="dark" style={styles.sheet}>
        <Text style={styles.kicker}>Confirm action</Text>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={onCancel} accessibilityRole="button">
            <Text style={styles.secondaryText}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: accent }]}
            onPress={onConfirm}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

type DebtActionsSheetProps = {
  visible: boolean;
  canSettle: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSettle: () => void;
  onForgive: () => void;
  onDelete: () => void;
};

export function DebtActionsSheet({
  visible,
  canSettle,
  onClose,
  onEdit,
  onSettle,
  onForgive,
  onDelete,
}: DebtActionsSheetProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss transaction actions" />
      <BlurView intensity={28} tint="dark" style={styles.sheet}>
        <Text style={styles.kicker}>Transaction</Text>
        <Text style={styles.title}>What do you want to do?</Text>
        <Pressable style={styles.listAction} onPress={onEdit} accessibilityRole="button">
          <Pencil color={colors.amber} size={18} />
          <Text style={styles.listActionText}>Edit details</Text>
        </Pressable>
        {canSettle ? (
          <Pressable style={styles.listAction} onPress={onSettle} accessibilityRole="button">
            <Check color={colors.settled} size={18} />
            <Text style={styles.listActionText}>Mark chukta</Text>
          </Pressable>
        ) : null}
        {canSettle ? (
          <Pressable style={styles.listAction} onPress={onForgive} accessibilityRole="button">
            <Check color={colors.forgiven} size={18} />
            <Text style={styles.listActionText}>Maaf kiya</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.listAction} onPress={onDelete} accessibilityRole="button">
          <Trash2 color={colors.danger} size={18} />
          <Text style={[styles.listActionText, { color: colors.danger }]}>Delete transaction</Text>
        </Pressable>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  sheet: {
    margin: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(9,16,14,0.82)",
    padding: 20,
    overflow: "hidden",
  },
  kicker: {
    color: colors.amber,
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 28,
    marginTop: 4,
  },
  message: {
    color: colors.muted,
    fontFamily: "Montserrat_400Regular",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    color: colors.mist,
    fontFamily: "Montserrat_700Bold",
  },
  primaryText: {
    color: colors.ink,
    fontFamily: "Montserrat_700Bold",
  },
  listAction: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  listActionText: {
    color: colors.mist,
    fontFamily: "Montserrat_700Bold",
    fontSize: 15,
  },
});

