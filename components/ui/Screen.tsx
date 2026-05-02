import type { PropsWithChildren } from "react";
import { ImageBackground, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { colors, stitchBackground } from "@/lib/theme";
import { useHisaabStore } from "@/lib/store/useHisaabStore";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, scroll = false, padded = true, style, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const backgroundUri = useHisaabStore((state) => state.backgroundUri);
  const paddingTop = Math.max(insets.top, 14) + 4;
  const paddingBottom = Math.max(insets.bottom, 14) + 76;
  const imageUri = backgroundUri ?? stitchBackground;

  const content = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, padded && styles.padded, { paddingTop, paddingBottom }, contentStyle]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, padded && styles.padded, { paddingTop, paddingBottom }, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, style]}>
      <StatusBar style="light" />
      <ImageBackground source={{ uri: imageUri }} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={styles.backgroundImage} />
      <LinearGradient colors={["rgba(8,12,16,0.42)", "rgba(25,18,10,0.78)", "rgba(19,13,6,0.98)"]} style={StyleSheet.absoluteFill} />
      <MotiView from={{ opacity: 0, translateY: 18 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 520 }} style={styles.flex}>
        {content}
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
    overflow: "hidden",
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: 16,
  },
  backgroundImage: {
    opacity: 0.6,
  },
});
