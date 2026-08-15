import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

export default function DailyScreen({ navigation }) {
  const [summary, setSummary] = useState({ totalCollection: 0 });
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await client.get("/api/day-closing/today-summary");
      setSummary(data);
    } catch (err) {
      // stays silent - summary is a nice-to-have, not blocking
    }
  }, []);

  const loadCustomers = useCallback(async (q) => {
    setLoading(true);
    try {
      const { data } = await client.get("/api/customers", { params: q ? { q } : {} });
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh every time this screen comes into focus - e.g. after recording a collection
  useFocusEffect(
    useCallback(() => {
      loadSummary();
      loadCustomers(query);
    }, [loadSummary, loadCustomers, query])
  );

  const handleSearch = (text) => {
    setQuery(text);
    loadCustomers(text);
  };

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

      <Text style={styles.sectionTitle}>Customers</Text>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={handleSearch}
        placeholder="Search saved customers..."
        placeholderTextColor="#94A3B8"
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: scaleHeight(20) }} color="#2563EB" />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item, idx) => (item?.id != null ? String(item.id) : `tmp-${idx}`)}
          contentContainerStyle={{ paddingBottom: scaleHeight(30) }}
          renderItem={({ item }) =>
            !item?.id ? null : (
              <TouchableOpacity
                style={styles.customerCard}
                onPress={() => navigation.navigate("CustomerDetail", { customer: item })}
                activeOpacity={0.7}
              >
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerPhone}>{item.phone}</Text>
              </TouchableOpacity>
            )
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No customers yet. Tap "+ Add Customer" above.</Text>
          }
        />
      )}
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
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: scaleFont(15),
    fontWeight: "700",
    marginBottom: scaleHeight(8),
  },
  searchInput: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(10),
    color: "#F8FAFC",
    fontSize: scaleFont(14),
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: scaleHeight(10),
  },
  customerCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: scaleWidth(14),
    marginBottom: scaleHeight(10),
  },
  customerName: { color: "#F8FAFC", fontSize: scaleFont(16), fontWeight: "600" },
  customerPhone: { color: "#94A3B8", fontSize: scaleFont(13), marginTop: scaleHeight(4) },
  emptyText: {
    color: "#64748B",
    textAlign: "center",
    marginTop: scaleHeight(20),
    fontSize: scaleFont(13),
  },
});
