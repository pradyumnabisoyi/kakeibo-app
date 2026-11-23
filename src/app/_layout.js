import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { getUser } from "../utils/storage";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const [hasUser, setHasUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplashAnim, setShowSplashAnim] = useState(true);

  const logoScale = useRef(new Animated.Value(0.65)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(12)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // 1. Run 1.8s lightweight native launch animation
  useEffect(() => {
    SplashScreen.hideAsync();

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
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSplashAnim(false);
    });
  }, []);

  // 2. Single-check onboarding redirect (fixes double welcome setup)
  useEffect(() => {
    getUser().then((user) => {
      const exists = !!user;
      setHasUser(exists);
      setLoading(false);

      const inOnboarding = segments[0] === "onboarding";
      if (!exists && !inOnboarding) {
        router.replace("/onboarding");
      }
    });
  }, [segments]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />

      {showSplashAnim && (
        <Animated.View
          pointerEvents="none"
          style={[styles.splashOverlay, { opacity: overlayOpacity }]}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#008E4B",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
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
