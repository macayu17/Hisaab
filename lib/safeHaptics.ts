import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

async function runNativeHaptic(action: () => Promise<void>) {
  if (Platform.OS === "web") return;
  try {
    await action();
  } catch {
    // Haptics support differs by device and runtime; feedback is enhancement-only.
  }
}

export function impactMedium() {
  return runNativeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

export function notifySuccess() {
  return runNativeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function notifyWarning() {
  return runNativeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

export function selectionChanged() {
  return runNativeHaptic(() => Haptics.selectionAsync());
}
