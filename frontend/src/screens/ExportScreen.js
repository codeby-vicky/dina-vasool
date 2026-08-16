import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

function toIso(d) {
  return d.toISOString().slice(0, 10);
}
function firstOfMonth(d) {
  return toIso(new Date(d.getFullYear(), d.getMonth(), 1));
}
function lastOfMonth(d) {
  return toIso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
function formatColHeader(dateIso) {
  const d = new Date(dateIso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit" });
}
function isValidDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}

/**
 * Builds and shares an .xlsx ledger.
 * Columns: No, Name, Total Payable, [one column per day in range], Total Collected (in range), Remaining.
 * "Remaining" always uses the customer's FULL payment history (not just the exported
 * range), so it's accurate even when exporting a single day or a past month.
 */
async function buildAndShareExcel(start, end, title, customerId) {
  const phasesRes = await client.get("/api/loan-phases/all-active");
  let phases = phasesRes.data || [];

  if (customerId) {
    phases = phases.filter((p) => p.customer?.id === customerId);
  }
  if (phases.length === 0) {
    throw new Error("No active loans found to export for this selection.");
  }

  const collectionsRes = await client.get("/api/collections/range", { params: { start, end } });
  const collections = collectionsRes.data || [];

  // Build the list of date columns for the range
  const dates = [];
  let cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    dates.push(toIso(cur));
    cur.setDate(cur.getDate() + 1);
  }

  // Map: loanPhaseId -> { dateIso -> amount } for the exported range
  const collectedInRange = {};
  collections.forEach((c) => {
    const phaseId = c.loanPhase?.id;
    if (!phaseId) return;
    if (!collectedInRange[phaseId]) collectedInRange[phaseId] = {};
    collectedInRange[phaseId][c.collectedDate] =
      (collectedInRange[phaseId][c.collectedDate] || 0) + Number(c.amount);
  });

  // Fetch each phase's FULL history (all time) to compute an accurate "Remaining" balance
  const fullHistories = await Promise.all(
    phases.map((p) => client.get(`/api/collections/loan-phase/${p.id}`))
  );
  const allTimeCollected = {};
  phases.forEach((p, idx) => {
    const entries = fullHistories[idx].data || [];
    allTimeCollected[p.id] = entries.reduce((sum, e) => sum + Number(e.amount), 0);
  });

  const headerRow = [
    "S.No",
    "Customer Name",
    "Total Amount (Payable)",
    ...dates.map(formatColHeader),
    "Total (this period)",
    "Remaining",
  ];
  const rows = [headerRow];

  phases.forEach((phase, idx) => {
    const dayMap = collectedInRange[phase.id] || {};
    let periodTotal = 0;
    const dayCells = dates.map((d) => {
      const v = dayMap[d];
      if (v !== undefined) {
        periodTotal += v;
        return v;
      }
      return "NP";
    });
    const remaining = Math.max(phase.totalPayable - (allTimeCollected[phase.id] || 0), 0);

    rows.push([
      idx + 1,
      phase.customer?.name || "",
      phase.totalPayable,
      ...dayCells,
      periodTotal,
      remaining,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Collections");

  const wbBase64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  const fileName = `${title.replace(/\s+/g, "_")}_${start}_to_${end}.xlsx`;
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, wbBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: title,
    });
  } else {
    Alert.alert("Saved", `File saved to: ${fileUri}`);
  }
}

export default function ExportScreen({ route }) {
  const customerId = route?.params?.customerId || null;
  const customerName = route?.params?.customerName || null;

  const now = new Date();
  const [startDate, setStartDate] = useState(firstOfMonth(now));
  const [endDate, setEndDate] = useState(toIso(now));
  const [loading, setLoading] = useState(false);

  const runExport = async () => {
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      Alert.alert("Invalid dates", "Use the format YYYY-MM-DD for both dates.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      Alert.alert("Invalid range", "Start date must be before end date.");
      return;
    }
    setLoading(true);
    try {
      const title = customerName ? `${customerName} Report` : "Collection Report";
      await buildAndShareExcel(startDate, endDate, title, customerId);
    } catch (err) {
      Alert.alert("Export Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickSetToday = () => {
    const today = toIso(new Date());
    setStartDate(today);
    setEndDate(today);
  };

  const quickSetThisMonth = () => {
    setStartDate(firstOfMonth(now));
    setEndDate(toIso(now));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: scaleWidth(16) }}>
      <Text style={styles.title}>Export Report</Text>
      {customerName ? (
        <Text style={styles.subtitle}>Filtered to: {customerName} only</Text>
      ) : (
        <Text style={styles.subtitle}>
          Generates an Excel (.xlsx): one row per customer, one column per day. "NP" means not
          paid that day. Remaining is calculated from their full payment history.
        </Text>
      )}

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickButton} onPress={quickSetToday}>
          <Text style={styles.quickButtonText}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={quickSetThisMonth}>
          <Text style={styles.quickButtonText}>This Month</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="2026-08-01"
        placeholderTextColor="#94A3B8"
      />

      <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={endDate}
        onChangeText={setEndDate}
        placeholder="2026-08-31"
        placeholderTextColor="#94A3B8"
      />

      <TouchableOpacity style={styles.exportButton} onPress={runExport} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.exportButtonText}>📄 Generate & Share Excel</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  title: { color: "#F8FAFC", fontSize: scaleFont(22), fontWeight: "700", marginBottom: scaleHeight(8) },
  subtitle: { color: "#94A3B8", fontSize: scaleFont(13), lineHeight: scaleFont(19), marginBottom: scaleHeight(20) },
  quickRow: { flexDirection: "row", gap: scaleWidth(10), marginBottom: scaleHeight(18) },
  quickButton: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingVertical: scaleHeight(10),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  quickButtonText: { color: "#CBD5E1", fontSize: scaleFont(13), fontWeight: "600" },
  label: { color: "#CBD5E1", fontSize: scaleFont(13), marginBottom: scaleHeight(6) },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    color: "#F8FAFC",
    fontSize: scaleFont(15),
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: scaleHeight(14),
  },
  exportButton: {
    backgroundColor: "#16A34A",
    borderRadius: 12,
    paddingVertical: scaleHeight(16),
    alignItems: "center",
    marginTop: scaleHeight(10),
  },
  exportButtonText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "700" },
});