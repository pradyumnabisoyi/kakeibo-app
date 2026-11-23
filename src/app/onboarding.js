import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getUser, saveUser } from "../utils/storage";

export default function OnboardingScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams();
  const isEditing = edit === "true";

  const [name, setName] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      getUser().then((user) => {
        if (user) {
          setName(user.name || "");
        }
      });
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim()) {
      Alert.alert(
        "Required",
        "Please enter your Name to continue.",
      );
      return;
    }

    setSaving(true);
    try {
      await saveUser({
        name: name.trim(),
      });

      if (isEditing) {
        Alert.alert("Saved", "Profile updated!");
        router.back();
      } else {
        router.replace("/");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {isEditing ? "Edit Profile" : "Enter Your Details"}
      </Text>

      <Text style={styles.fieldLabel}>Name</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor="#888"
        placeholder="Full Name *"
        value={name}
        onChangeText={setName}
      />
      
      <TouchableOpacity style={styles.btn} onPress={handleSave}>
        <Text style={styles.btnText}>
          {isEditing ? "Update Profile" : "Save & Continue"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
  },
  placeholderText: { fontSize: 16, color: "#888" },
  btn: {
    backgroundColor: "#2E7D32",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
