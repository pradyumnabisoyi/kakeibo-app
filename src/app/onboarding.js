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
import DateTimePicker from "@react-native-community/datetimepicker";
import { getUser, saveUser } from "../utils/storage";

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OnboardingScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams();
  const isEditing = edit === "true";

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthdate, setBirthdate] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      getUser().then((user) => {
        if (user) {
          setName(user.name || "");
          setMobile(user.mobile || "");
          setEmail(user.email || "");
          setGender(user.gender || "");
          if (user.birthdate) {
            const parsed = new Date(user.birthdate);
            if (!isNaN(parsed.getTime())) setBirthdate(parsed);
          }
        }
      });
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (saving) return;
    if (!name.trim() || !mobile.trim()) {
      Alert.alert(
        "Required",
        "Please enter at least your Name and Mobile number.",
      );
      return;
    }

    const cleanedMobile = mobile.trim().replace(/\D/g, "");
    if (cleanedMobile.length < 9 || cleanedMobile.length > 11) {
      Alert.alert(
        "Invalid Mobile Number",
        "Please enter a valid mobile number between 9 and 11 digits.",
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail.length > 0 && !EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address (e.g., name@example.com).",
      );
      return;
    }

    setSaving(true);
    try {
      await saveUser({
        name: name.trim(),
        mobile: cleanedMobile,
        email: trimmedEmail,
        gender,
        birthdate: birthdate ? formatDate(birthdate) : "",
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

      <Text style={styles.fieldLabel}>Mobile</Text>
      <TextInput
        style={styles.input}
        placeholder="Mobile Number *"
        placeholderTextColor="#888"
        keyboardType="number-pad"
        maxLength={11}
        value={mobile}
        onChangeText={setMobile}
      />

      <Text style={styles.fieldLabel}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email (e.g., user@example.com)"
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.fieldLabel}>Gender</Text>
      <View style={styles.genderRow}>
        {["Male", "Female", "Other"].map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.genderBtn,
              gender === option && styles.genderBtnActive,
            ]}
            onPress={() => setGender(option)}
          >
            <Text
              style={
                gender === option ? styles.genderTextActive : styles.genderText
              }
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Birthdate</Text>
      <TouchableOpacity
        style={styles.dateBtn}
        onPress={() => setShowPicker(true)}
      >
        <Text style={birthdate ? styles.dateText : styles.placeholderText}>
          {birthdate ? formatDate(birthdate) : "Select Birthdate (YYYY-MM-DD)"}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={birthdate || new Date(2000, 0, 1)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onValueChange={(_, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setBirthdate(selectedDate);
          }}
          onDismiss={() => setShowPicker(false)}
        />
      )}

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
  genderRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
  },
  genderBtnActive: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  genderText: { color: "#333", fontSize: 15 },
  genderTextActive: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  dateBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  dateText: { fontSize: 16, color: "#000" },
  placeholderText: { fontSize: 16, color: "#888" },
  btn: {
    backgroundColor: "#2E7D32",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
