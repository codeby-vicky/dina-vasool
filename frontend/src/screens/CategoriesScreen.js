import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

export default function CategoriesScreen() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [deductionRate, setDeductionRate] = useState("50");
  const [repayRate, setRepayRate] = useState("1200");
  const [standardDays, setStandardDays] = useState("60");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/api/categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  const createCategory = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Give this category a name, e.g. 'Standard'.");
      return;
    }
    const deduction = parseFloat(deductionRate);
    const repay = parseFloat(repayRate);
    const days = parseInt(standardDays, 10);
    if (!deduction || !repay || !days) {
      Alert.alert("Missing values", "Fill in deduction rate, repay rate, and days.");
      return;
    }
    setSaving(true);
    try {
      await client.post("/api/categories", {
        name: name.trim(),
        deductionRatePer1000: deduction,
        repayRatePer1000: repay,
        standardDays: days,
      });
      setName("");
      Alert.alert("Created", `Category "${name}" is ready to use.`);
      loadCategories();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: scaleWidth(16) }}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Categories</Text>
            <Text style={styles.subtitle}>
              Set the rate rules once here. Any principal amount you enter later (₹1000, ₹5000,
              ₹23500 — any number) automatically uses these rates.
            </Text>

            <View style={styles.formCard}>
              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Standard"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Deducted per ₹1000 (Aadhaiyam rate)</Text>
              <TextInput
                style={styles.input}
                value={deductionRate}
                onChangeText={setDeductionRate}
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Total Payable per ₹1000</Text>
              <TextInput
                style={styles.input}
                value={repayRate}
                onChangeText={setRepayRate}
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Standard Days to Repay</Text>
              <TextInput
                style={styles.input}
                value={standardDays}
                onChangeText={setStandardDays}
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity style={styles.createButton} onPress={createCategory} disabled={saving}>
                <Text style={styles.createButtonText}>
                  {saving ? "Creating..." : "+ Create Category"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Existing Categories</Text>
            {loading && <ActivityIndicator color="#2563EB" style={{ marginTop: scaleHeight(10) }} />}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>Per ₹1000</Text>
              <Text style={styles.categoryValue}>
                deduct ₹{item.deductionRatePer1000} · repay ₹{item.repayRatePer1000}
              </Text>
            </View>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>Standard Days</Text>
              <Text style={styles.categoryValue}>{item.standardDays}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No categories yet — create one above.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  title: { color: "#F8FAFC", fontSize: scaleFont(22), fontWeight: "700" },
  subtitle: { color: "#94A3B8", fontSize: scaleFont(12), marginTop: scaleHeight(6), marginBottom: scaleHeight(16), lineHeight: scaleFont(18) },
  formCard: { backgroundColor: "#1E293B", borderRadius: 14, padding: scaleWidth(16), marginBottom: scaleHeight(20) },
  label: { color: "#CBD5E1", fontSize: scaleFont(13), marginBottom: scaleHeight(6), marginTop: scaleHeight(10) },
  input: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    color: "#F8FAFC",
    fontSize: scaleFont(15),
    borderWidth: 1,
    borderColor: "#334155",
  },
  createButton: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: scaleHeight(14),
    alignItems: "center",
    marginTop: scaleHeight(16),
  },
  createButtonText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "700" },
  sectionTitle: { color: "#F8FAFC", fontSize: scaleFont(16), fontWeight: "700", marginBottom: scaleHeight(10) },
  categoryCard: { backgroundColor: "#1E293B", borderRadius: 12, padding: scaleWidth(14), marginBottom: scaleHeight(10) },
  categoryName: { color: "#F8FAFC", fontSize: scaleFont(16), fontWeight: "700", marginBottom: scaleHeight(6) },
  categoryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: scaleHeight(3) },
  categoryLabel: { color: "#94A3B8", fontSize: scaleFont(12) },
  categoryValue: { color: "#F8FAFC", fontSize: scaleFont(12), fontWeight: "600" },
  emptyText: { color: "#64748B", fontSize: scaleFont(13), textAlign: "center", marginTop: scaleHeight(20) },
});