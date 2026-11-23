import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { getUser, exportBackupData, importBackupData } from "../utils/storage";

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState("");

  const loadUser = () => {
    getUser().then((u) => setUserName(u?.name || ""));
  };

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, []),
  );

  const handleBackup = async () => {
    try {
      const json = await exportBackupData();
      const dateStamp = new Date().toISOString().split("T")[0];
      const backupFile = new File(
        Paths.cache,
        `Kakeibo_backup_${dateStamp}.json`,
      );
      backupFile.create({ overwrite: true });
      await backupFile.write(json);

      await Sharing.shareAsync(backupFile.uri, {
        mimeType: "application/json",
        dialogTitle: "Save or Send Kakeibo Backup",
      });
    } catch (err) {
      Alert.alert(
        "Backup Failed",
        err?.message || "Could not create backup file.",
      );
    }
  };

  const handleRestore = async () => {
    try {
      const result = await File.pickFileAsync();
      if (result.canceled || !result.result) return;

      const pickedFile = Array.isArray(result.result)
        ? result.result
        : result.result;
      const content = await pickedFile.text();

      Alert.alert(
        "Restore Backup",
        "This will replace current entries on this device with the backup file. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            onPress: async () => {
              try {
                await importBackupData(content);
                loadUser();
                Alert.alert(
                  "Success",
                  "All old data has been restored to this device!",
                );
              } catch (e) {
                Alert.alert(
                  "Restore Failed",
                  e?.message || "Invalid backup file.",
                );
              }
            },
          },
        ],
      );
    } catch (err) {
      Alert.alert(
        "Restore Failed",
        err?.message || "Could not read selected file.",
      );
    }
  };

  return (
    <View style={styles.container}>
      {userName ? (
        <Text style={styles.welcome}>Welcome, {userName}</Text>
      ) : null}
      <Text style={styles.title}>Kakeibo Ledger</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/entry-type")}
      >
        <Text style={styles.buttonText}>1. New Entry</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.reportBtn]}
        onPress={() => router.push("/report-type")}
      >
        <Text style={styles.buttonText}>2. View Report</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.profileBtn}
        onPress={() =>
          router.push({ pathname: "/onboarding", params: { edit: "true" } })
        }
      >
        <Ionicons name="person-circle-outline" size={22} color="#1B5E20" />
        <Text style={styles.profileBtnText}>Edit Profile</Text>
      </TouchableOpacity>

      <View style={styles.backupRow}>
        <TouchableOpacity style={styles.backupBtn} onPress={handleBackup}>
          <Ionicons name="cloud-upload-outline" size={18} color="#1565C0" />
          <Text style={styles.backupText}>Backup Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backupBtn} onPress={handleRestore}>
          <Ionicons name="cloud-download-outline" size={18} color="#1565C0" />
          <Text style={styles.backupText}>Restore Data</Text>
        </TouchableOpacity>
      </View>
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
  welcome: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#1B5E20",
  },
  button: {
    backgroundColor: "#2E7D32",
    padding: 18,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: "center",
  },
  reportBtn: { backgroundColor: "#1565C0" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  profileBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    padding: 12,
  },
  profileBtnText: { color: "#1B5E20", fontSize: 16, fontWeight: "600" },
  backupRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  backupBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1565C0",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  backupText: { color: "#1565C0", fontSize: 14, fontWeight: "600" },
});
