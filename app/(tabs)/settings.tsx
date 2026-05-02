import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Bell, Database, Image as ImageIcon, ShieldCheck, Smartphone } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { colors } from "@/lib/theme";
import { pickLocalBackground } from "@/lib/background";
import { ensureNotificationPermissions } from "@/lib/notifications";
import { notifySuccess, notifyWarning, selectionChanged } from "@/lib/safeHaptics";
import { useHisaabStore } from "@/lib/store/useHisaabStore";

export default function SettingsScreen() {
  const [reduceEffects, setReduceEffects] = useState(false);
  const [backgroundBusy, setBackgroundBusy] = useState(false);
  const [backgroundMessage, setBackgroundMessage] = useState<string | null>(null);
  const [permissionCopy, setPermissionCopy] = useState("Ask only when a due date is used.");
  const debts = useHisaabStore((state) => state.debts);
  const friends = useHisaabStore((state) => state.friends);
  const backgroundUri = useHisaabStore((state) => state.backgroundUri);
  const setBackgroundUri = useHisaabStore((state) => state.setBackgroundUri);
  const resetBackground = useHisaabStore((state) => state.resetBackground);

  async function chooseBackground() {
    setBackgroundBusy(true);
    setBackgroundMessage(null);
    try {
      const uri = await pickLocalBackground();
      if (!uri) return;
      await setBackgroundUri(uri);
      setBackgroundMessage("Custom background saved on this phone.");
      void notifySuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not pick a background right now.";
      setBackgroundMessage(message);
      void notifyWarning();
    } finally {
      setBackgroundBusy(false);
    }
  }

  async function useDefaultBackground() {
    await resetBackground();
    setBackgroundMessage("Default background restored.");
    void selectionChanged();
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Local-first</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Core Hisaab works without login, network, or another person installing the app.</Text>
      </View>

      <SettingCard
        icon={<Database color={colors.amber} size={20} />}
        title="SQLite ledger"
        message={`${debts.length} transactions and ${friends.length} friends stored only on this device.`}
      />
      <SettingCard
        icon={<ShieldCheck color={colors.settled} size={20} />}
        title="Privacy boundary"
        message="No cloud sync is enabled in v1. Export or backup should be added before uninstalling."
      />
      <GlassCard style={styles.card} innerStyle={styles.cardInner}>
        <View style={styles.iconBox}>
          <Bell color={colors.amber} size={20} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Reminder permission</Text>
          <Text style={styles.cardMessage}>{permissionCopy}</Text>
        </View>
        <Pressable
          style={styles.smallButton}
          onPress={async () => {
            const granted = await ensureNotificationPermissions();
            setPermissionCopy(granted ? "Notifications are enabled for due-date nudges." : "Notifications are still blocked for Hisaab.");
          }}
          accessibilityRole="button"
        >
          <Text style={styles.smallButtonText}>Check</Text>
        </Pressable>
      </GlassCard>
      <GlassCard style={styles.card} innerStyle={styles.stackCardInner}>
        <View style={styles.cardLead}>
          <View style={styles.iconBox}>
            <ImageIcon color={colors.amber} size={20} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Home background</Text>
            <Text style={styles.cardMessage}>
              {backgroundUri ? "Using a custom wallpaper from this phone." : "Using the default Hisaab wallpaper."}
            </Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, styles.actionButtonPrimary, backgroundBusy && styles.actionDisabled]}
            onPress={() => void chooseBackground()}
            disabled={backgroundBusy}
            accessibilityRole="button"
            accessibilityLabel="Choose a local background image"
          >
            <Text style={styles.actionButtonTextPrimary}>{backgroundBusy ? "Working..." : "Choose photo"}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.actionButtonGhost, !backgroundUri && styles.actionDisabled]}
            onPress={() => void useDefaultBackground()}
            disabled={!backgroundUri || backgroundBusy}
            accessibilityRole="button"
            accessibilityLabel="Use default background"
          >
            <Text style={styles.actionButtonTextGhost}>Use default</Text>
          </Pressable>
        </View>
        {backgroundMessage ? <Text style={styles.helperMessage}>{backgroundMessage}</Text> : null}
      </GlassCard>
      <GlassCard style={styles.card} innerStyle={styles.cardInner}>
        <View style={styles.iconBox}>
          <Smartphone color="#93C5FD" size={20} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Reduce visual effects</Text>
          <Text style={styles.cardMessage}>Keep this available for low-end Android devices.</Text>
        </View>
        <Switch
          value={reduceEffects}
          onValueChange={(next) => {
            setReduceEffects(next);
            void selectionChanged();
          }}
          thumbColor={reduceEffects ? colors.amber : colors.muted}
          trackColor={{ false: "rgba(255,255,255,0.14)", true: "rgba(245,163,32,0.28)" }}
        />
      </GlassCard>
    </Screen>
  );
}

function SettingCard({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <GlassCard style={styles.card} innerStyle={styles.cardInner}>
      <View style={styles.iconBox}>{icon}</View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardMessage}>{message}</Text>
      </View>
    </GlassCard>
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
  card: {
    marginBottom: 10,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  stackCardInner: {
    gap: 10,
    padding: 14,
  },
  cardLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: colors.mist,
    fontFamily: "Montserrat_700Bold",
    fontSize: 14,
  },
  cardMessage: {
    color: colors.muted,
    fontFamily: "Montserrat_400Regular",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonPrimary: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  actionButtonGhost: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: colors.glassBorder,
  },
  actionButtonTextPrimary: {
    color: colors.ink,
    fontFamily: "Montserrat_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  actionButtonTextGhost: {
    color: colors.mist,
    fontFamily: "Montserrat_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  actionDisabled: {
    opacity: 0.55,
  },
  helperMessage: {
    color: colors.muted,
    fontFamily: "Montserrat_500Medium",
    fontSize: 11,
    lineHeight: 16,
  },
  smallButton: {
    minHeight: 36,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  smallButtonText: {
    color: colors.ink,
    fontFamily: "Montserrat_700Bold",
    fontSize: 11,
  },
});

