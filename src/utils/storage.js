import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_KEY = "@Kakeibo_user";
const TX_KEY = "@Kakeibo_transactions";

export const getUser = async () => {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveUser = async (user) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getTransactions = async () => {
  const data = await AsyncStorage.getItem(TX_KEY);
  const parsed = data ? JSON.parse(data) : [];
  return parsed.map((t) => ({
    ...t,
    date: Array.isArray(t.date) ? t.date[0] : String(t.date),
  }));
};

export const addTransaction = async (tx) => {
  const existing = await getTransactions();
  const updated = [{ id: Date.now().toString(), ...tx }, ...existing];
  await AsyncStorage.setItem(TX_KEY, JSON.stringify(updated));
  return updated;
};

export const updateTransaction = async (id, updatedFields) => {
  const existing = await getTransactions();
  const updated = existing.map((item) =>
    item.id === id ? { ...item, ...updatedFields } : item,
  );
  await AsyncStorage.setItem(TX_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteTransaction = async (id) => {
  const existing = await getTransactions();
  const updated = existing.filter((item) => item.id !== id);
  await AsyncStorage.setItem(TX_KEY, JSON.stringify(updated));
  return updated;
};

export const exportBackupData = async () => {
  const user = await getUser();
  const transactions = await getTransactions();
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), user, transactions },
    null,
    2,
  );
};

export const importBackupData = async (jsonString) => {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !Array.isArray(parsed.transactions)) {
    throw new Error("Invalid Kakeibo backup file.");
  }
  if (parsed.user) {
    await saveUser(parsed.user);
  }
  await AsyncStorage.setItem(TX_KEY, JSON.stringify(parsed.transactions));
};
