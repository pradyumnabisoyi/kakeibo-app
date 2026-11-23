import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { getUser } from "../utils/storage";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [showSplashAnim, setShowSplashAnim] = useState(true);
  const [hasUser, setHasUser] = useState(null);

  const logoScale = useRef(new Animated.Value(0.65)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(12)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // 1. Play 100% full-screen animation FIRST, then reveal the app
  useEffect(() => {
    SplashScreen.hideAsync();

    // Load user status in the background while animation plays
    getUser().then((user) => {
      setHasUser(!!user);
    });

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(650),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSplashAnim(false);
    });
  }, []);

  // 2. Navigate once animation finishes and user state is loaded
    // 2. Re-check user whenever navigation changes (after splash finishes)
  useEffect(() => {
    if (showSplashAnim) return;

    getUser().then((user) => {
      const exists = !!user;
      setHasUser(exists);

      const inOnboarding = segments === "onboarding";
      if (!exists && !inOnboarding) {
        router.replace("/onboarding");
      }
    });
  }, [showSplashAnim, segments]);


  // Show ONLY the full-screen animation first (prevents 65%/35% split)
  if (showSplashAnim) {
    return (
      <Animated.View
        style={[styles.splashFullScreen, { opacity: overlayOpacity }]}
      >
        <Animated.Image
          source={require("../../assets/images/android-icon-foreground.png")}
          style={[
            styles.splashLogo,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
          resizeMode="contain"
        />
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
            alignItems: "center",
          }}
        >
          <Text style={styles.appTitle}>Kakeibo</Text>
          <Text style={styles.tagline}>Powered by chatashali.com</Text>
        </Animated.View>
      </Animated.View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  splashFullScreen: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#008E4B",
    justifyContent: "center",
    alignItems: "center",
  },
  splashLogo: {
    width: 170,
    height: 170,
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: "#D8F3DC",
    marginTop: 6,
  },
});
