import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Bell, LayoutDashboard, ReceiptText, UsersRound, type LucideIcon } from "lucide-react-native";
import { colors } from "@/lib/theme";

const icons: Record<string, LucideIcon> = {
  index: LayoutDashboard,
  friends: UsersRound,
  history: ReceiptText,
  notifications: Bell,
};

type ExpoTabOptions = BottomTabBarProps["descriptors"][string]["options"] & {
  href?: string | null;
};

export function PillTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const visibleRoutes = state.routes.filter((route) => {
    const options = descriptors[route.key].options as ExpoTabOptions;
    return options.href !== null;
  });

  if (!visibleRoutes.length) return null;

  const bottom = Math.max(insets.bottom, 8) + 8;

  function openRoute(route: (typeof state.routes)[number]) {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented && state.routes[state.index]?.key !== route.key) {
      navigation.navigate(route.name, route.params);
    }
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <View style={styles.shell}>
        <BlurView
          intensity={Platform.OS === "android" ? 58 : 78}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={styles.blur}
        >
          <View style={styles.bar}>
            {visibleRoutes.map((route) => {
              const focused = state.routes[state.index]?.key === route.key;
              const options = descriptors[route.key].options;
              const label = typeof options.title === "string" ? options.title : route.name;
              const Icon = icons[route.name] ?? ReceiptText;

              return (
                <Pressable
                  key={route.key}
                  onPress={() => openRoute(route)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={`Open ${label}`}
                  style={({ pressed }) => [styles.iconButton, focused && styles.iconButtonActive, pressed && styles.pressed]}
                >
                  <Icon color={focused ? colors.ink : colors.mist} size={18} strokeWidth={2.3} />
                  {focused ? <View style={styles.activeDot} /> : null}
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 24,
    right: 24,
    zIndex: 50,
    alignItems: "center",
  },
  shell: {
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(240,237,232,0.2)",
    shadowColor: colors.ink,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
    backgroundColor: "rgba(15,16,18,0.15)",
  },
  blur: {
    borderRadius: 999,
    overflow: "hidden",
  },
  bar: {
    minHeight: 50,
    padding: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(8,12,16,0.44)",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8,12,16,0.5)",
  },
  iconButtonActive: {
    backgroundColor: "rgba(245,163,32,0.95)",
  },
  activeDot: {
    position: "absolute",
    bottom: 5,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.ink,
  },
  pressed: {
    opacity: 0.74,
  },
});
