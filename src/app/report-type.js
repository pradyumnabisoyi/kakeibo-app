import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function ReportTypeScreen() {
  const router = useRouter();

  const selectMode = (mode) => {
    router.push({ pathname: "/report-view", params: { mode } });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => selectMode("annually")}
      >
        <Text style={styles.btnText}>1. Annually</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => selectMode("monthly")}
      >
        <Text style={styles.btnText}>2. Monthly</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => selectMode("duration")}
      >
        <Text style={styles.btnText}>3. Duration</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F5F5F5",
  },
  btn: {
    backgroundColor: "#1565C0",
    padding: 18,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
