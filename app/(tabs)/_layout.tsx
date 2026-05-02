import { Tabs } from "expo-router";
import { PillTabBar } from "@/components/PillTabBar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <PillTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Vault",
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Bhadwe",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Nudges",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

