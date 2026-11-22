import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function EntryTypeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#2E7D32" }]}
        onPress={() =>
          router.push({ pathname: "/add-entry", params: { type: "income" } })
        }
      >
        <Text style={styles.btnText}>1. Income</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "#C62828" }]}
        onPress={() =>
          router.push({ pathname: "/add-entry", params: { type: "expense" } })
        }
      >
        <Text style={styles.btnText}>2. Expenses</Text>
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
    padding: 20,
    borderRadius: 10,
    marginBottom: 18,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
