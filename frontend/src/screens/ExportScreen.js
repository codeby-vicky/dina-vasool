import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

function toIso(d) {
  return d.toISOString().slice(0, 10);
}

function formatColHeader(dateIso) {
  const d = new Date(dateIso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/** Builds and shares an .xlsx ledger: rows = customers, columns = one per date in range. */
async function buildAndShareExcel(start, end, title) {
  const [phasesRes, collectionsRes] = await Promise.all([
    client.get("/api/loan-phases/all-active"),
    client.get("/api/collections/range", { params: { start, end } }),
  ]);

  const phases = phasesRes.data || [];
  const collections = collectionsRes.data || [];

  if (phases.length === 0) {
    throw new Error("No active customers/loans found to export.");
  }

  // Build the list of date columns for the range
  const dates = [];
  let cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    dates.push(toIso(cur));
    cur.setDate(cur.getDate() + 1);
  }

  // Map: loanPhaseId -> { dateIso -> amount }
  const collectedMap = {};
  collections.forEach((c) => {
    const phaseId = c.loanPhase?.id;
    if (!phaseId) return;
    if (!collectedMap[phaseId]) collectedMap[phaseId] = {};
    const dateKey = c.collectedDate;
    collectedMap[phaseId][dateKey] = (collectedMap[phaseId][dateKey] || 0) + Number(c.amount);
  });

  const headerRow = ["No", "Customer Name", "Category", "Principal", ...dates.map(formatColHeader)];
  const rows = [headerRow];

  phases.forEach((phase, idx) => {
    const dayMap = collectedMap[phase.id] || {};
    const row = [
      idx + 1,
      phase.customer?.name || "",
      phase.category?.name || "",
      phase.adapu,
      ...dates.map((d) => (dayMap[d] !== undefined ? dayMap[d] : "NP")),
    ];
    rows.push(row);
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

export default function ExportScreen() {
  const [loading, setLoading] = useState(null); // 'today' | 'month' | null

  const exportToday = async () => {
    setLoading("today");
    try {
      const today = toIso(new Date());
      await buildAndShareExcel(today, today, "Daily Collection Report");
    } catch (err) {
      Alert.alert("Export Failed", err.message);
    } finally {
      setLoading(null);
    }
  };

  const exportThisMonth = async () => {
    setLoading("month");
    try {
      const now = new Date();
      const first = toIso(new Date(now.getFullYear(), now.getMonth(), 1));
      const today = toIso(now);
      await buildAndShareExcel(first, today, "Monthly Collection Report");
    } catch (err) {
      Alert.alert("Export Failed", err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Export Report</Text>
      <Text style={styles.subtitle}>
        Generates an Excel (.xlsx) file: one row per customer, one column per day. "NP" means not
        paid that day. Share it straight to WhatsApp, Drive, or email.
      </Text>

      <TouchableOpacity style={styles.exportButton} onPress={exportToday} disabled={!!loading}>
        {loading === "today" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.exportButtonText}>📄 Export Today's Collection</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.exportButton, styles.monthButton]}
        onPress={exportThisMonth}
        disabled={!!loading}
      >
        {loading === "month" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.exportButtonText}>📅 Export This Month</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: scaleWidth(16) },
  title: { color: "#F8FAFC", fontSize: scaleFont(22), fontWeight: "700", marginBottom: scaleHeight(8) },
  subtitle: { color: "#94A3B8", fontSize: scaleFont(13), lineHeight: scaleFont(19), marginBottom: scaleHeight(24) },
  exportButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: scaleHeight(16),
    alignItems: "center",
    marginBottom: scaleHeight(14),
  },
  monthButton: { backgroundColor: "#16A34A" },
  exportButtonText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "700" },
});