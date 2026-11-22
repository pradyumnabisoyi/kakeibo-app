import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  getTransactions,
  addTransaction,
  updateTransaction,
} from "../utils/storage";

const formatDate = (d) => d.toISOString().split("T")[0];

export default function AddEntryScreen() {
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  const router = useRouter();

  const [type, setType] = useState(params.type || "expense");
  const [itemName, setItemName] = useState(params.itemName || "");
  const [amount, setAmount] = useState(
    params.amount ? String(params.amount) : "",
  );
  const [date, setDate] = useState(
    params.date ? new Date(String(params.date)) : new Date(),
  );
  const [showPicker, setShowPicker] = useState(false);
  const [existingItems, setExistingItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    getTransactions().then((list) => {
      const uniqueNames = [...new Set(list.map((t) => t.itemName))];
      setExistingItems(uniqueNames);
    });
  }, []);

  const handleNameChange = (text) => {
    setItemName(text);
    if (text.trim().length > 0) {
      const matches = existingItems.filter(
        (item) =>
          item.toLowerCase().includes(text.toLowerCase()) &&
          item.toLowerCase() !== text.toLowerCase(),
      );
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleSave = async () => {
    if (!itemName.trim() || !amount || isNaN(Number(amount))) {
      Alert.alert(
        "Invalid Input",
        "Enter a valid item name and numeric amount.",
      );
      return;
    }

    const payload = {
      type,
      itemName: itemName.trim(),
      amount: parseFloat(amount),
      date: formatDate(date),
    };

    if (isEditing) {
      await updateTransaction(String(params.id), payload);
      Alert.alert("Updated", "Entry updated successfully!");
      router.back();
    } else {
      await addTransaction(payload);
      Alert.alert(
        "Saved",
        `${type === "income" ? "Income" : "Expense"} added!`,
      );
      router.replace("/");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {isEditing ? "Edit" : "Add"} {type === "income" ? "Income" : "Expense"}
      </Text>

      {isEditing && (
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, type === "income" && styles.activeIncome]}
            onPress={() => setType("income")}
          >
            <Text
              style={
                type === "income" ? styles.activeText : styles.inactiveText
              }
            >
              Income
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              type === "expense" && styles.activeExpense,
            ]}
            onPress={() => setType("expense")}
          >
            <Text
              style={
                type === "expense" ? styles.activeText : styles.inactiveText
              }
            >
              Expense
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Item Name"
        value={itemName}
        onChangeText={handleNameChange}
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.suggestionItem}
              onPress={() => {
                setItemName(item);
                setSuggestions([]);
              }}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.dateBtn}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.dateText}>Date: {formatDate(date)}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onValueChange={(_, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
          onDismiss={() => setShowPicker(false)}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>
          {isEditing ? "Update Entry" : "Save Entry"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  label: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  typeToggle: { flexDirection: "row", gap: 10, marginBottom: 14 },
  toggleBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
  },
  activeIncome: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  activeExpense: { backgroundColor: "#C62828", borderColor: "#C62828" },
  activeText: { color: "#fff", fontWeight: "bold" },
  inactiveText: { color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  suggestionBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  dateText: { fontSize: 16 },
  saveBtn: {
    backgroundColor: "#2E7D32",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
