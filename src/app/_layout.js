import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUser } from "../utils/storage";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const [hasUser, setHasUser] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    getUser().then((user) => {
      const exists = !!user;
      setHasUser(exists);
      setLoading(false);

      const inOnboarding = segments === "onboarding";
      if (!exists && !inOnboarding) {
        router.replace("/onboarding");
      }
    });
  }, [segments]);

  const HomeButton = () => (
    <TouchableOpacity
      onPress={() => router.replace("/")}
      style={{ paddingHorizontal: 8 }}
    >
      <Ionicons name="home" size={24} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#2E7D32" },
        headerTintColor: "#fff",
        headerRight: () => <HomeButton />,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Kakeibo Home", headerRight: () => null }}
      />
      <Stack.Screen
        name="onboarding"
        options={({ route }) => ({
          title:
            route.params?.edit === "true" ? "Edit Profile" : "Welcome Setup",
          headerBackVisible: route.params?.edit === "true",
          headerRight: () =>
            route.params?.edit === "true" ? <HomeButton /> : null,
        })}
      />
      <Stack.Screen name="entry-type" options={{ title: "New Entry" }} />
      <Stack.Screen name="add-entry" options={{ title: "Transaction Entry" }} />
      <Stack.Screen name="report-type" options={{ title: "View Report" }} />
      <Stack.Screen
        name="report-view"
        options={{ title: "Financial Report" }}
      />
    </Stack>
  );
}
