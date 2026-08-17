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

const emptyForm = { name: "", deductionRate: "50", repayRate: "1200", standardDays: "60", defaultAmount: "" };

export default function CategoriesScreen() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating new
  const [form, setForm] = useState(emptyForm);

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

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      deductionRate: String(cat.deductionRatePer1000),
      repayRate: String(cat.repayRatePer1000),
      standardDays: String(cat.standardDays),
      defaultAmount: cat.defaultAmount ? String(cat.defaultAmount) : "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      Alert.alert("Missing name", "Give this category a name, e.g. 'Standard'.");
      return;
    }
    const deduction = parseFloat(form.deductionRate);
    const repay = parseFloat(form.repayRate);
    const days = parseInt(form.standardDays, 10);
    if (!deduction || !repay || !days) {
      Alert.alert("Missing values", "Fill in deduction rate, repay rate, and days.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        deductionRatePer1000: deduction,
        repayRatePer1000: repay,
        standardDays: days,
        defaultAmount: form.defaultAmount ? parseFloat(form.defaultAmount) : null,
      };
      if (editingId) {
        await client.put(`/api/categories/${editingId}`, body);
        Alert.alert("Updated", `Category "${form.name}" updated.`);
      } else {
        await client.post("/api/categories", body);
        Alert.alert("Created", `Category "${form.name}" is ready to use.`);
      }
      cancelEdit();
      loadCategories();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = (cat) => {
    Alert.alert(
      "Delete this category?",
      `"${cat.name}" won't be selectable for new loans anymore. Existing loans using it are unaffected.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await client.delete(`/api/categories/${cat.id}`);
              loadCategories();
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
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
              <Text style={styles.formTitle}>{editingId ? "Edit Category" : "New Category"}</Text>

              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="e.g. Standard"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Deducted per ₹1000 (Aadhaiyam rate)</Text>
              <TextInput
                style={styles.input}
                value={form.deductionRate}
                onChangeText={(v) => setForm({ ...form, deductionRate: v })}
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Total Payable per ₹1000</Text>
              <TextInput
                style={styles.input}
                value={form.repayRate}
                onChangeText={(v) => setForm({ ...form, repayRate: v })}
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Standard Days to Repay</Text>
              <TextInput
                style={styles.input}
                value={form.standardDays}
                onChangeText={(v) => setForm({ ...form, standardDays: v })}
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.label}>Default Principal Amount (optional)</Text>
              <TextInput
                style={styles.input}
                value={form.defaultAmount}
                onChangeText={(v) => setForm({ ...form, defaultAmount: v })}
                placeholder="e.g. 1000 — auto-fills when this category is picked"
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.formButtonRow}>
                {editingId && (
                  <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.createButton} onPress={submit} disabled={saving}>
                  <Text style={styles.createButtonText}>
                    {saving ? "Saving..." : editingId ? "Save Changes" : "+ Create Category"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Existing Categories</Text>
            {loading && <ActivityIndicator color="#2563EB" style={{ marginTop: scaleHeight(10) }} />}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.categoryCard}>
            <View style={styles.categoryTopRow}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <View style={styles.categoryActions}>
                <TouchableOpacity onPress={() => startEdit(item)} style={styles.iconButton}>
                  <Text style={styles.iconButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteCategory(item)} style={styles.iconButton}>
                  <Text style={styles.iconButtonText}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
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
            {!!item.defaultAmount && (
              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Default Amount</Text>
                <Text style={styles.categoryValue}>₹{item.defaultAmount}</Text>
              </View>
            )}
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
  formTitle: { color: "#F8FAFC", fontSize: scaleFont(15), fontWeight: "700" },
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
  formButtonRow: { flexDirection: "row", gap: scaleWidth(10), marginTop: scaleHeight(16) },
  createButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: scaleHeight(14),
    alignItems: "center",
  },
  createButtonText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "700" },
  cancelButton: {
    flex: 1,
    backgroundColor: "#334155",
    borderRadius: 10,
    paddingVertical: scaleHeight(14),
    alignItems: "center",
  },
  cancelButtonText: { color: "#F8FAFC", fontSize: scaleFont(15), fontWeight: "600" },
  sectionTitle: { color: "#F8FAFC", fontSize: scaleFont(16), fontWeight: "700", marginBottom: scaleHeight(10) },
  categoryCard: { backgroundColor: "#1E293B", borderRadius: 12, padding: scaleWidth(14), marginBottom: scaleHeight(10) },
  categoryTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: scaleHeight(6) },
  categoryName: { color: "#F8FAFC", fontSize: scaleFont(16), fontWeight: "700" },
  categoryActions: { flexDirection: "row", gap: scaleWidth(14) },
  iconButton: { padding: scaleWidth(4) },
  iconButtonText: { fontSize: scaleFont(16) },
  categoryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: scaleHeight(3) },
  categoryLabel: { color: "#94A3B8", fontSize: scaleFont(12) },
  categoryValue: { color: "#F8FAFC", fontSize: scaleFont(12), fontWeight: "600" },
  emptyText: { color: "#64748B", fontSize: scaleFont(13), textAlign: "center", marginTop: scaleHeight(20) },
});