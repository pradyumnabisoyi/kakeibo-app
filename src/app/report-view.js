import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { getTransactions, deleteTransaction, getUser } from "../utils/storage";

const formatDate = (d) => d.toISOString().split("T")[0];

export default function ReportViewScreen() {
  const { mode } = useLocalSearchParams();
  const router = useRouter();
  const [allTx, setAllTx] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState({});

  const loadData = () => {
    getTransactions().then(setAllTx);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEdit = (item) => {
    router.push({
      pathname: "/add-entry",
      params: {
        id: item.id,
        type: item.type,
        itemName: item.itemName,
        amount: String(item.amount),
        date: item.date,
      },
    });
  };

  const handleDelete = (item) => {
    Alert.alert("Delete Entry", `Delete "${item.itemName}" (${item.date})?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTransaction(item.id);
          loadData();
        },
      },
    ]);
  };

  const filteredTx = useMemo(() => {
    return allTx.filter((tx) => {
      const txDate = new Date(tx.date);
      if (mode === "annually") {
        return txDate.getFullYear() === startDate.getFullYear();
      }
      if (mode === "monthly") {
        return (
          txDate.getFullYear() === startDate.getFullYear() &&
          txDate.getMonth() === startDate.getMonth()
        );
      }
      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);
      return tx.date >= startStr && tx.date <= endStr;
    });
  }, [allTx, mode, startDate, endDate]);

  const groupedItems = useMemo(() => {
    const map = {};
    filteredTx.forEach((tx) => {
      const key = `${tx.type}_${tx.itemName.trim().toLowerCase()}`;
      if (!map[key]) {
        map[key] = {
          key,
          type: tx.type,
          itemName: tx.itemName.trim(),
          totalAmount: 0,
          entries: [],
        };
      }
      map[key].totalAmount += Number(tx.amount);
      map[key].entries.push(tx);
    });
    return Object.values(map);
  }, [filteredTx]);

  const totalIncome = filteredTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = filteredTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const periodLabel = useMemo(() => {
    const year = startDate.getFullYear();
    if (mode === "annually") {
      return `${year}-01-01 to ${year}-12-31`;
    }
    if (mode === "monthly") {
      const monthIndex = startDate.getMonth();
      const monthStr = String(monthIndex + 1).padStart(2, "0");
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      return `${year}-${monthStr}-01 to ${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
    }
    return `${formatDate(startDate)} to ${formatDate(endDate)}`;
  }, [mode, startDate, endDate]);

  const exportPDF = async () => {
    try {
      const user = await getUser();
      const rowsHtml = groupedItems
        .map((g) => {
          const groupRow = `
            <tr>
              <td><strong>${g.itemName}</strong> (${g.entries.length}x)</td>
              <td>${g.type.toUpperCase()}</td>
              <td style="text-align:right; color:${g.type === "income" ? "#2E7D32" : "#C62828"};">
                ${g.type === "income" ? "+" : "-"}Rs. ${g.totalAmount.toFixed(2)}
              </td>
            </tr>`;

          const subRows = g.entries
            .map(
              (e) => `
              <tr style="background:#f9f9f9; font-size:12px; color:#555;">
                <td style="padding-left:20px;">- ${e.date}</td>
                <td></td>
                <td style="text-align:right;">Rs. ${Number(e.amount).toFixed(2)}</td>
              </tr>`,
            )
            .join("");

          return groupRow + subRows;
        })
        .join("");

      const html = `
        <html>
          <body style="font-family: sans-serif; padding: 24px;">
            <h1 style="color: #1B5E20;">Kakeibo Financial Report</h1>
            <p><strong>Name:</strong> ${user?.name || "-"} | <strong>Mobile:</strong> ${user?.mobile || "-"}</p>
            <p><strong>Period:</strong> ${periodLabel}</p>
            <table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse:collapse; border-color:#ddd;">
              <thead style="background:#2E7D32; color:#fff;">
                <tr>
                  <th style="text-align:left;">Item</th>
                  <th style="text-align:left;">Type</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>${rowsHtml || '<tr><td colspan="3">No entries</td></tr>'}</tbody>
            </table>
            <div style="margin-top:20px; font-size:16px;">
              <p><strong>Total Income:</strong> Rs. ${totalIncome.toFixed(2)}</p>
              <p><strong>Total Expenses:</strong> Rs. ${totalExpense.toFixed(2)}</p>
              <p style="font-size:18px;"><strong>Remaining Balance:</strong> Rs. ${balance.toFixed(2)}</p>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #777; text-align: center;">
              Generated via Kakeibo • <a href="https://chatashali.com" style="color: #1B5E20;">chatashali.com</a>
            </p>
          </body>
        </html>
      `;

      await Print.printAsync({ html });
    } catch (err) {
      console.error("PDF Export Error:", err);
      Alert.alert("Export Error", err?.message || String(err));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setPickerTarget("start")}
        >
          <Text>
            {mode === "annually"
              ? `Year: ${startDate.getFullYear()}`
              : mode === "monthly"
                ? `Month: ${formatDate(startDate).slice(0, 7)}`
                : `From: ${formatDate(startDate)}`}
          </Text>
        </TouchableOpacity>

        {mode === "duration" && (
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setPickerTarget("end")}
          >
            <Text>To: {formatDate(endDate)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {pickerTarget && (
        <DateTimePicker
          value={pickerTarget === "start" ? startDate : endDate}
          mode="date"
          display="default"
          onValueChange={(_, selected) => {
            const target = pickerTarget;
            setPickerTarget(null);
            if (selected) {
              target === "start"
                ? setStartDate(selected)
                : setEndDate(selected);
            }
          }}
          onDismiss={() => setPickerTarget(null)}
        />
      )}

      <FlatList
        data={groupedItems}
        keyExtractor={(group) => group.key}
        ListEmptyComponent={
          <Text style={styles.empty}>No entries for this period.</Text>
        }
        renderItem={({ item: group }) => {
          const isExpanded = !!expandedKeys[group.key];
          return (
            <View style={styles.groupContainer}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => toggleExpand(group.key)}
              >
                <View style={styles.titleRow}>
                  <Ionicons
                    name={isExpanded ? "chevron-down" : "chevron-forward"}
                    size={18}
                    color="#555"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.itemName}>{group.itemName}</Text>
                  <Text style={styles.countBadge}>
                    ({group.entries.length})
                  </Text>
                </View>

                <Text
                  style={{
                    color: group.type === "income" ? "#2E7D32" : "#C62828",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {group.type === "income" ? "+" : "-"}₹
                  {group.totalAmount.toFixed(2)}
                </Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.subList}>
                  {group.entries.map((entry) => (
                    <View key={entry.id} style={styles.subRow}>
                      <Text style={styles.subDate}>{entry.date}</Text>
                      <Text style={styles.subAmount}>
                        ₹{Number(entry.amount).toFixed(2)}
                      </Text>
                      <View style={styles.actions}>
                        <TouchableOpacity
                          onPress={() => handleEdit(entry)}
                          style={styles.iconBtn}
                        >
                          <Ionicons name="pencil" size={18} color="#1565C0" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(entry)}
                          style={styles.iconBtn}
                        >
                          <Ionicons name="trash" size={18} color="#C62828" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Total Income: ₹{totalIncome.toFixed(2)}
        </Text>
        <Text style={styles.summaryText}>
          Total Expenses: ₹{totalExpense.toFixed(2)}
        </Text>
        <Text
          style={[styles.summaryText, { fontWeight: "bold", fontSize: 18 }]}
        >
          Remaining Balance: ₹{balance.toFixed(2)}
        </Text>

        <TouchableOpacity style={styles.pdfBtn} onPress={exportPDF}>
          <Ionicons name="document-text-outline" size={20} color="#fff" />
          <Text style={styles.pdfBtnText}>Export PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footer}
          onPress={() => Linking.openURL("https://chatashali.com")}
        >
          <Text style={styles.footerLink}>chatashali.com</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  filterRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  dateBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1565C0",
    borderRadius: 8,
    alignItems: "center",
  },
  groupContainer: { borderBottomWidth: 1, borderColor: "#eee" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  titleRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  itemName: { fontSize: 16, fontWeight: "600" },
  countBadge: { fontSize: 13, color: "#777", marginLeft: 6 },
  subList: {
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ECECEC",
  },
  subDate: { flex: 1, fontSize: 13, color: "#555" },
  subAmount: { fontSize: 14, fontWeight: "500", marginRight: 14 },
  actions: { flexDirection: "row", gap: 10 },
  iconBtn: { padding: 4 },
  empty: { textAlign: "center", marginTop: 40, color: "#888" },
  summary: {
    borderTopWidth: 2,
    borderColor: "#ddd",
    paddingTop: 12,
    marginTop: 8,
  },
  summaryText: { fontSize: 16, marginBottom: 4 },
  pdfBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1565C0",
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  pdfBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  footer: {
    alignSelf: "center",
    marginTop: 10,
    paddingVertical: 4,
  },
  footerLink: {
    fontSize: 12,
    color: "#1B5E20",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
