import "react-native-gesture-handler";

import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Cinzel_600SemiBold,
  Cinzel_700Bold,
  useFonts as useCinzelFonts,
} from "@expo-google-fonts/cinzel";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts as useMontserratFonts,
} from "@expo-google-fonts/montserrat";
import { useHisaabStore } from "@/lib/store/useHisaabStore";
import { colors } from "@/lib/theme";

if (Platform.OS !== "web") {
  void SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const hydrate = useHisaabStore((state) => state.hydrate);
  const isReady = useHisaabStore((state) => state.isReady);
  const [displayLoaded] = useCinzelFonts({ Cinzel_600SemiBold, Cinzel_700Bold });
  const [bodyLoaded] = useMontserratFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (Platform.OS === "web") {
      document.documentElement.style.backgroundColor = colors.ink;
      document.body.style.backgroundColor = colors.ink;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" && displayLoaded && bodyLoaded && isReady) {
      void SplashScreen.hideAsync();
    }
  }, [bodyLoaded, displayLoaded, isReady]);

  const canRenderWeb = Platform.OS === "web" && isReady;
  if (!canRenderWeb && (!displayLoaded || !bodyLoaded || !isReady)) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom", contentStyle: { backgroundColor: colors.ink } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="add"
            options={{
              presentation: Platform.OS === "ios" ? "modal" : "card",
              animation: Platform.OS === "ios" ? "fade_from_bottom" : "slide_from_bottom",
              contentStyle: { backgroundColor: colors.ink },
            }}
          />
          <Stack.Screen name="friend/[id]" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
