import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

export default function DailyScreen({ navigation }) {
  const [summary, setSummary] = useState({ totalCollection: 0 });

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await client.get("/api/day-closing/today-summary");
      setSummary(data);
    } catch (err) {
      // stays silent - summary is a nice-to-have, not blocking
    }
  }, []);

  // Refresh every time this screen comes into focus - e.g. after recording a collection
  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Today's Collection</Text>
        <Text style={styles.summaryAmount}>₹{summary.totalCollection ?? 0}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.collectButton]}
          onPress={() => navigation.navigate("Customers", { mode: "collect" })}
        >
          <Text style={styles.actionButtonText}>Collect</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.addButton]}
          onPress={() => navigation.navigate("AddCustomer")}
        >
          <Text style={styles.actionButtonText}>+ Add Customer</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => navigation.navigate("Reports")}
        activeOpacity={0.85}
      >
        <Text style={styles.reportButtonText}>📊 Today's Report</Text>
      </TouchableOpacity>

      <View style={styles.secondaryRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Categories")}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>⚙️ Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Export")}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>📥 Export Excel</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hintText}>
        Tap "Collect" to search and select a customer — the customer list now lives there instead
        of here, to keep this screen focused on today's summary.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: scaleWidth(16) },
  summaryCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: scaleWidth(20),
    alignItems: "center",
    marginBottom: scaleHeight(14),
  },
  summaryLabel: { color: "#94A3B8", fontSize: scaleFont(13) },
  summaryAmount: {
    color: "#4ADE80",
    fontSize: scaleFont(32),
    fontWeight: "800",
    marginTop: scaleHeight(4),
  },
  actionRow: { flexDirection: "row", gap: scaleWidth(10), marginBottom: scaleHeight(10) },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: scaleHeight(14),
    alignItems: "center",
  },
  collectButton: { backgroundColor: "#16A34A" },
  addButton: { backgroundColor: "#2563EB" },
  actionButtonText: { color: "#fff", fontSize: scaleFont(14), fontWeight: "700" },
  reportButton: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingVertical: scaleHeight(12),
    alignItems: "center",
    marginBottom: scaleHeight(18),
    borderWidth: 1,
    borderColor: "#334155",
  },
  reportButtonText: { color: "#F8FAFC", fontSize: scaleFont(14), fontWeight: "600" },
  secondaryRow: { flexDirection: "row", gap: scaleWidth(10), marginBottom: scaleHeight(18) },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingVertical: scaleHeight(10),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  secondaryButtonText: { color: "#CBD5E1", fontSize: scaleFont(12), fontWeight: "600" },
  hintText: {
    color: "#475569",
    fontSize: scaleFont(12),
    textAlign: "center",
    marginTop: scaleHeight(10),
    lineHeight: scaleFont(18),
  },
});