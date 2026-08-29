import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportsScreen() {
  const [date] = useState(todayIso());
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [additionalInvestment, setAdditionalInvestment] = useState("");
  const [openingBalanceOverride, setOpeningBalanceOverride] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [addingExpense, setAddingExpense] = useState(false);

  const loadExpenses = useCallback(async () => {
    try {
      const { data } = await client.get("/api/expenses", { params: { date } });
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      // non-fatal
    }
  }, [date]);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const params = { date };
      if (additionalInvestment) params.additionalInvestment = additionalInvestment;
      if (openingBalanceOverride) params.openingBalanceOverride = openingBalanceOverride;
      const { data } = await client.get("/api/day-closing/preview", { params });
      setPreview(data);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, [date, additionalInvestment, openingBalanceOverride]);

  // Auto-load the moment this screen opens - no button tap needed to see today's numbers.
  useFocusEffect(
    useCallback(() => {
      loadExpenses();
      loadPreview();
    }, [loadExpenses, loadPreview])
  );

  const addExpense = async () => {
    if (!expenseDesc.trim()) {
      Alert.alert("Missing description", "What was this expense for? e.g. Petrol, Milk");
      return;
    }
    const amount = parseFloat(expenseAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid amount", "Enter a valid expense amount.");
      return;
    }
    setAddingExpense(true);
    try {
      await client.post("/api/expenses", {
        description: expenseDesc.trim(),
        amount,
        expenseDate: date,
      });
      setExpenseDesc("");
      setExpenseAmount("");
      await loadExpenses();
      loadPreview();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setAddingExpense(false);
    }
  };

  const shortfall =
    preview && preview.closingBalance < 0 ? Math.abs(preview.closingBalance) : null;

  const applyShortfallAsInvestment = () => {
    if (!shortfall) return;
    setAdditionalInvestment(String(shortfall));
    setTimeout(loadPreview, 0);
  };

  const closeDay = async () => {
    Alert.alert(
      "Close today's day?",
      "This locks today's calculation and sets tomorrow's opening mun-irupu. This can't be casually undone.\n\n(If you don't close manually, the day auto-closes on its own at 11:59 PM.)",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Day",
          style: "destructive",
          onPress: async () => {
            setClosing(true);
            try {
              const params = { date };
              if (additionalInvestment) params.additionalInvestment = additionalInvestment;
              if (openingBalanceOverride) params.openingBalanceOverride = openingBalanceOverride;
              const { data } = await client.post("/api/day-closing/close", null, { params });
              setPreview(data);
              Alert.alert("Day closed", "Today's collection has been finalized.");
            } catch (err) {
              Alert.alert("Error", err.message);
            } finally {
              setClosing(false);
            }
          },
        },
      ]
    );
  };

  const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: scaleWidth(16) }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Today's Report</Text>
          <Text style={styles.dateText}>{date}</Text>
        </View>
        {loading && <ActivityIndicator color="#2563EB" />}
      </View>

      <View style={styles.explainBox}>
        <Text style={styles.explainText}>
          (Opening balance) + (today's collection) + (today's aadhaiyam) + (extra investment) −
          (money given out) − (expenses) = tomorrow's opening balance.{"\n\n"}
          This screen recalculates automatically. Auto-closes at 11:59 PM if not closed manually.
        </Text>
      </View>

      {/* Expenses - add as many as needed, one at a time */}
      <View style={styles.expenseBox}>
        <Text style={styles.sectionTitle}>Today's Expenses</Text>
        <Text style={styles.expenseHint}>Add each one as it happens - petrol now, milk later.</Text>

        {expenses.length > 0 && (
          <View style={styles.expenseList}>
            {expenses.map((e) => (
              <View key={e.id} style={styles.expenseRow}>
                <Text style={styles.expenseDescText}>{e.description}</Text>
                <Text style={styles.expenseAmountText}>₹{e.amount}</Text>
              </View>
            ))}
            <View style={styles.expenseDivider} />
            <View style={styles.expenseRow}>
              <Text style={styles.expenseTotalLabel}>Total Expenses</Text>
              <Text style={styles.expenseTotalValue}>₹{expenseTotal}</Text>
            </View>
          </View>
        )}

        <TextInput
          style={styles.input}
          value={expenseDesc}
          onChangeText={setExpenseDesc}
          placeholder="What for? e.g. Petrol"
          placeholderTextColor="#94A3B8"
        />
        <TextInput
          style={styles.input}
          value={expenseAmount}
          onChangeText={setExpenseAmount}
          placeholder="Amount e.g. 100"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addExpenseButton} onPress={addExpense} disabled={addingExpense}>
          <Text style={styles.addExpenseButtonText}>{addingExpense ? "Adding..." : "+ Add Expense"}</Text>
        </TouchableOpacity>
      </View>

      {preview && (
        <View style={styles.card}>
          <View style={styles.editableRow}>
            <Text style={styles.rowLabel}>Opening Balance (Mun-Irupu)</Text>
            <TextInput
              style={styles.inlineInput}
              value={openingBalanceOverride}
              onChangeText={setOpeningBalanceOverride}
              placeholder={String(preview.openingBalance)}
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              onEndEditing={loadPreview}
            />
          </View>
          <Row label="Today's Collection" value={preview.totalCollection} />
          <Row label="Aadhaiyam (new disbursements)" value={preview.totalAadhaiyam} />
          <View style={styles.editableRow}>
            <Text style={styles.rowLabel}>Additional Investment</Text>
            <TextInput
              style={styles.inlineInput}
              value={additionalInvestment}
              onChangeText={setAdditionalInvestment}
              placeholder="0"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              onEndEditing={loadPreview}
            />
          </View>
          <Row label="Adapu (principal disbursed)" value={preview.totalAdapu} negative />
          <Row label="Expenses" value={preview.totalExpenses} negative />
          <View style={styles.divider} />
          <Row label="Closing Balance → Tomorrow's Mun-Irupu" value={preview.closingBalance} bold />
          <Text style={styles.statusText}>
            {preview.closed ? "✓ Day is closed" : "Not yet closed — live preview"}
          </Text>

          {shortfall && !preview.closed && (
            <View style={styles.shortfallBox}>
              <Text style={styles.shortfallText}>
                Mun-irupu falls short by ₹{shortfall.toFixed(2)} to cover today's loans given out.
              </Text>
              <TouchableOpacity style={styles.shortfallButton} onPress={applyShortfallAsInvestment}>
                <Text style={styles.shortfallButtonText}>Add ₹{shortfall.toFixed(2)} as Investment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {preview && !preview.closed && (
        <TouchableOpacity style={styles.closeButton} onPress={closeDay} disabled={closing}>
          {closing ? <ActivityIndicator color="#fff" /> : <Text style={styles.closeButtonText}>Close Today's Day</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Row({ label, value, negative, bold }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, negative && styles.rowValueNegative, bold && styles.rowValueBold]}>
        {negative ? "− " : ""}₹{value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#F8FAFC", fontSize: scaleFont(22), fontWeight: "700" },
  dateText: { color: "#94A3B8", fontSize: scaleFont(13), marginBottom: scaleHeight(12) },
  explainBox: { backgroundColor: "#1E293B", borderRadius: 10, padding: scaleWidth(12), marginBottom: scaleHeight(14) },
  explainText: { color: "#94A3B8", fontSize: scaleFont(12), lineHeight: scaleFont(18) },
  sectionTitle: { color: "#F8FAFC", fontSize: scaleFont(15), fontWeight: "700", marginBottom: scaleHeight(4) },
  expenseBox: { backgroundColor: "#1E293B", borderRadius: 14, padding: scaleWidth(16), marginBottom: scaleHeight(16) },
  expenseHint: { color: "#94A3B8", fontSize: scaleFont(11), marginBottom: scaleHeight(10) },
  expenseList: { marginBottom: scaleHeight(12) },
  expenseRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: scaleHeight(4) },
  expenseDescText: { color: "#CBD5E1", fontSize: scaleFont(13) },
  expenseAmountText: { color: "#F87171", fontSize: scaleFont(13), fontWeight: "600" },
  expenseDivider: { height: 1, backgroundColor: "#334155", marginVertical: scaleHeight(6) },
  expenseTotalLabel: { color: "#F8FAFC", fontSize: scaleFont(13), fontWeight: "700" },
  expenseTotalValue: { color: "#F87171", fontSize: scaleFont(14), fontWeight: "700" },
  input: {
    backgroundColor: "#0F172A", borderRadius: 10, paddingHorizontal: scaleWidth(14), paddingVertical: scaleHeight(12),
    color: "#F8FAFC", fontSize: scaleFont(14), borderWidth: 1, borderColor: "#334155", marginBottom: scaleHeight(10),
  },
  addExpenseButton: { backgroundColor: "#DC2626", borderRadius: 10, paddingVertical: scaleHeight(12), alignItems: "center" },
  addExpenseButtonText: { color: "#fff", fontSize: scaleFont(13), fontWeight: "700" },
  card: { backgroundColor: "#1E293B", borderRadius: 14, padding: scaleWidth(16) },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: scaleHeight(8) },
  editableRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: scaleHeight(6),
  },
  rowLabel: { color: "#94A3B8", fontSize: scaleFont(13), flex: 1 },
  rowValue: { color: "#F8FAFC", fontSize: scaleFont(14), fontWeight: "600" },
  rowValueNegative: { color: "#F87171" },
  rowValueBold: { fontSize: scaleFont(17), color: "#4ADE80" },
  inlineInput: {
    backgroundColor: "#0F172A", borderRadius: 8, paddingHorizontal: scaleWidth(10), paddingVertical: scaleHeight(6),
    color: "#F8FAFC", fontSize: scaleFont(13), borderWidth: 1, borderColor: "#334155", width: scaleWidth(110), textAlign: "right",
  },
  divider: { height: 1, backgroundColor: "#334155", marginVertical: scaleHeight(8) },
  statusText: { color: "#94A3B8", fontSize: scaleFont(12), marginTop: scaleHeight(10), textAlign: "center" },
  shortfallBox: { backgroundColor: "#7C2D12", borderRadius: 10, padding: scaleWidth(12), marginTop: scaleHeight(14) },
  shortfallText: { color: "#FED7AA", fontSize: scaleFont(12), marginBottom: scaleHeight(10) },
  shortfallButton: { backgroundColor: "#EA580C", borderRadius: 8, paddingVertical: scaleHeight(10), alignItems: "center" },
  shortfallButtonText: { color: "#fff", fontSize: scaleFont(13), fontWeight: "700" },
  closeButton: {
    backgroundColor: "#DC2626", borderRadius: 10, paddingVertical: scaleHeight(14), alignItems: "center",
    marginTop: scaleHeight(20), marginBottom: scaleHeight(30),
  },
  closeButtonText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "700" },
});
