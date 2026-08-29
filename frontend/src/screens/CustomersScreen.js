import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Contacts from "expo-contacts";
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function suggestedDailyAmount(phase) {
  if (!phase?.totalPayable || !phase?.standardDays) return "";
  return String(Math.round(phase.totalPayable / phase.standardDays));
}

export default function CustomersScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");

  // customerId -> { paid, total } for the status label
  const [statusMap, setStatusMap] = useState({});
  // customerId -> [phases] - each active loan for inline quick-collect
  const [phasesByCustomer, setPhasesByCustomer] = useState({});
  // "phaseId" -> typed amount (defaults to suggested, editable)
  const [amountInputs, setAmountInputs] = useState({});
  // "phaseId" -> "CASH" | "GPAY"
  const [modeInputs, setModeInputs] = useState({});
  const [collectingId, setCollectingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchCustomers = useCallback(async (q) => {
    setLoading(true);
    try {
      const { data } = await client.get("/api/customers", { params: q ? { q } : {} });
      setCustomers(data);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTodayStatus = useCallback(async () => {
    try {
      const [phasesRes, collectionsRes] = await Promise.all([
        client.get("/api/loan-phases/all-active"),
        client.get("/api/collections", { params: { date: todayIso() } }),
      ]);
      const phases = phasesRes.data || [];
      const todayCollections = collectionsRes.data || [];
      const paidPhaseIds = new Set(todayCollections.map((c) => c.loanPhase?.id).filter(Boolean));

      const counts = {};
      const byCustomer = {};
      const defaultAmounts = {};
      phases.forEach((phase) => {
        const custId = phase.customer?.id;
        if (!custId) return;
        if (!counts[custId]) counts[custId] = { paid: 0, total: 0 };
        counts[custId].total += 1;
        if (paidPhaseIds.has(phase.id)) counts[custId].paid += 1;

        if (!byCustomer[custId]) byCustomer[custId] = [];
        byCustomer[custId].push(phase);
        defaultAmounts[phase.id] = suggestedDailyAmount(phase);
      });
      setStatusMap(counts);
      setPhasesByCustomer(byCustomer);
      setAmountInputs((prev) => ({ ...defaultAmounts, ...prev }));
    } catch (err) {
      // labels/quick-collect are a nice-to-have - don't block the list on failure
    }
  }, []);

  useEffect(() => {
    fetchCustomers("");
  }, [fetchCustomers]);

  useFocusEffect(
    useCallback(() => {
      loadTodayStatus();
    }, [loadTodayStatus])
  );

  const handleSearch = (text) => {
    setQuery(text);
    fetchCustomers(text);
  };

  const quickCollect = async (phase) => {
    const amount = parseFloat(amountInputs[phase.id]);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid amount", "Enter a valid amount to collect.");
      return;
    }
    setCollectingId(phase.id);
    try {
      await client.post("/api/collections", {
        loanPhaseId: phase.id,
        amount,
        paymentMode: modeInputs[phase.id] || "CASH",
      });
      await loadTodayStatus();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setCollectingId(null);
    }
  };

  const openContactPicker = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Contacts access is needed to search customers by their saved phone name.");
      return;
    }
    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
    setContacts(data.filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0));
    setPickerVisible(true);
  };

  const addCustomerFromContact = async (contact) => {
    const phone = contact.phoneNumbers?.[0]?.number?.replace(/\s/g, "") || "";
    try {
      await client.post("/api/customers", { name: contact.name, phone });
      setPickerVisible(false);
      fetchCustomers(query);
      Alert.alert("Added", `${contact.name} added as a customer.`);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const deleteCustomer = (customer) => {
    Alert.alert(
      "Delete this customer?",
      `Remove ${customer.name} and all their history? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await client.delete(`/api/customers/${customer.id}`);
              fetchCustomers(query);
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const filteredContacts = contacts.filter((c) =>
    (c.name || "").toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={handleSearch}
        placeholder="Search by name, phone, or area..."
        placeholderTextColor="#94A3B8"
      />

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddCustomer")} activeOpacity={0.8}>
        <Text style={styles.addButtonText}>+ Add Customer</Text>
      </TouchableOpacity>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotUnpaid]} />
          <Text style={styles.legendText}>0 paid</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#F59E0B" }]} />
          <Text style={styles.legendText}>Partial</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotPaid]} />
          <Text style={styles.legendText}>All paid</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: scaleHeight(20) }} color="#2563EB" />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item, idx) => (item?.id != null ? String(item.id) : `tmp-${idx}`)}
          contentContainerStyle={{ paddingBottom: scaleHeight(20) }}
          renderItem={({ item }) => {
            if (!item?.id) return null;
            const count = statusMap[item.id];
            let labelStyle = null;
            let labelText = null;
            if (count && count.total > 0) {
              labelText = `${count.paid}/${count.total} PAID`;
              if (count.paid === 0) labelStyle = styles.labelNone;
              else if (count.paid === count.total) labelStyle = styles.labelFull;
              else labelStyle = styles.labelPartial;
            }
            const phases = phasesByCustomer[item.id] || [];
            const isExpanded = expandedId === item.id;

            return (
              <View style={styles.customerCard}>
                <TouchableOpacity
                  onPress={() => setExpandedId(isExpanded ? null : item.id)}
                  onLongPress={() => deleteCustomer(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.customerTopRow}>
                    {!!labelStyle && (
                      <View style={[styles.statusLabel, labelStyle]}>
                        <Text style={styles.statusLabelText}>{labelText}</Text>
                      </View>
                    )}
                    <Text style={styles.customerName}>{item.name}</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("AddCustomer", { customer: item })}
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>✏️</Text>
                    </TouchableOpacity>
                  </View>
                  {!!item.phone && <Text style={styles.customerPhone}>{item.phone}</Text>}
                  {!!item.address && <Text style={styles.customerArea}>📍 {item.address}</Text>}
                  {phases.length > 0 && (
                    <Text style={styles.expandHint}>
                      {isExpanded ? "▲ Hide loans" : `▼ ${phases.length} active loan${phases.length > 1 ? "s" : ""} — tap to collect`}
                    </Text>
                  )}
                </TouchableOpacity>

                {isExpanded &&
                  phases.map((phase) => (
                    <View key={phase.id} style={styles.phaseRow}>
                      <Text style={styles.phaseLabel}>{phase.category?.name || "Loan"}</Text>

                      <View style={styles.modeRow}>
                        <TouchableOpacity
                          style={[styles.modeChip, (modeInputs[phase.id] || "CASH") === "CASH" && styles.modeChipActive]}
                          onPress={() => setModeInputs((p) => ({ ...p, [phase.id]: "CASH" }))}
                        >
                          <Text style={styles.modeChipText}>Cash</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modeChip, modeInputs[phase.id] === "GPAY" && styles.modeChipActive]}
                          onPress={() => setModeInputs((p) => ({ ...p, [phase.id]: "GPAY" }))}
                        >
                          <Text style={styles.modeChipText}>GPay</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.collectRow}>
                        <TextInput
                          style={styles.amountInput}
                          value={amountInputs[phase.id] ?? ""}
                          onChangeText={(v) => setAmountInputs((p) => ({ ...p, [phase.id]: v }))}
                          keyboardType="numeric"
                          placeholder="Amount"
                          placeholderTextColor="#64748B"
                        />
                        <TouchableOpacity
                          style={styles.collectButton}
                          onPress={() => quickCollect(phase)}
                          disabled={collectingId === phase.id}
                        >
                          {collectingId === phase.id ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.collectButtonText}>Collect</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                {isExpanded && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate("CustomerDetail", { customer: item })}
                    style={styles.moreLink}
                  >
                    <Text style={styles.moreLinkText}>Full details, history & new disbursement →</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No customers yet. Add one from contacts above.</Text>
          }
        />
      )}

      <Modal visible={pickerVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Pick a contact</Text>
          <TextInput
            style={styles.searchInput}
            value={contactSearch}
            onChangeText={setContactSearch}
            placeholder="Search your phone contacts..."
            placeholderTextColor="#94A3B8"
          />
          <FlatList
            data={filteredContacts}
            keyExtractor={(item, idx) => item.id || String(idx)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.contactRow} onPress={() => addCustomerFromContact(item)}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactPhone}>{item.phoneNumbers?.[0]?.number}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setPickerVisible(false)}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: scaleWidth(16) },
  searchInput: {
    backgroundColor: "#1E293B", borderRadius: 10, paddingHorizontal: scaleWidth(14), paddingVertical: scaleHeight(12),
    color: "#F8FAFC", fontSize: scaleFont(15), borderWidth: 1, borderColor: "#334155", marginBottom: scaleHeight(10),
  },
  addButton: { backgroundColor: "#16A34A", borderRadius: 10, paddingVertical: scaleHeight(12), alignItems: "center", marginBottom: scaleHeight(10) },
  addButtonText: { color: "#fff", fontSize: scaleFont(14), fontWeight: "600" },
  legendRow: { flexDirection: "row", gap: scaleWidth(16), marginBottom: scaleHeight(12) },
  legendItem: { flexDirection: "row", alignItems: "center", gap: scaleWidth(6) },
  legendText: { color: "#94A3B8", fontSize: scaleFont(11) },
  dot: { width: scaleWidth(10), height: scaleWidth(10), borderRadius: scaleWidth(5) },
  dotPaid: { backgroundColor: "#22C55E" },
  dotUnpaid: { backgroundColor: "#EF4444" },
  customerCard: { backgroundColor: "#1E293B", borderRadius: 12, padding: scaleWidth(14), marginBottom: scaleHeight(10) },
  customerTopRow: { flexDirection: "row", alignItems: "center", gap: scaleWidth(8) },
  editButton: { marginLeft: "auto" },
  editButtonText: { fontSize: scaleFont(14) },
  statusLabel: { paddingHorizontal: scaleWidth(6), paddingVertical: scaleHeight(2), borderRadius: 4 },
  labelNone: { backgroundColor: "#7F1D1D" },
  labelPartial: { backgroundColor: "#92400E" },
  labelFull: { backgroundColor: "#166534" },
  statusLabelText: { color: "#fff", fontSize: scaleFont(9), fontWeight: "700" },
  customerName: { color: "#F8FAFC", fontSize: scaleFont(16), fontWeight: "600" },
  customerPhone: { color: "#94A3B8", fontSize: scaleFont(13), marginTop: scaleHeight(4) },
  customerArea: { color: "#60A5FA", fontSize: scaleFont(12), marginTop: scaleHeight(2) },
  expandHint: { color: "#60A5FA", fontSize: scaleFont(11), marginTop: scaleHeight(6), fontWeight: "600" },
  phaseRow: { backgroundColor: "#0F172A", borderRadius: 10, padding: scaleWidth(10), marginTop: scaleHeight(10) },
  phaseLabel: { color: "#CBD5E1", fontSize: scaleFont(12), fontWeight: "700", marginBottom: scaleHeight(6) },
  modeRow: { flexDirection: "row", gap: scaleWidth(8), marginBottom: scaleHeight(8) },
  modeChip: { paddingHorizontal: scaleWidth(12), paddingVertical: scaleHeight(5), borderRadius: 14, borderWidth: 1, borderColor: "#334155" },
  modeChipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  modeChipText: { color: "#F8FAFC", fontSize: scaleFont(11) },
  collectRow: { flexDirection: "row", gap: scaleWidth(8) },
  amountInput: {
    flex: 1, backgroundColor: "#1E293B", borderRadius: 8, paddingHorizontal: scaleWidth(12), paddingVertical: scaleHeight(8),
    color: "#F8FAFC", fontSize: scaleFont(14), borderWidth: 1, borderColor: "#334155",
  },
  collectButton: { backgroundColor: "#16A34A", borderRadius: 8, paddingHorizontal: scaleWidth(18), justifyContent: "center", alignItems: "center" },
  collectButtonText: { color: "#fff", fontSize: scaleFont(13), fontWeight: "700" },
  moreLink: { marginTop: scaleHeight(10), alignItems: "center" },
  moreLinkText: { color: "#94A3B8", fontSize: scaleFont(11) },
  emptyText: { color: "#64748B", textAlign: "center", marginTop: scaleHeight(40), fontSize: scaleFont(14) },
  modalContainer: { flex: 1, backgroundColor: "#0F172A", padding: scaleWidth(16), paddingTop: scaleHeight(50) },
  modalTitle: { color: "#F8FAFC", fontSize: scaleFont(20), fontWeight: "700", marginBottom: scaleHeight(14) },
  contactRow: { paddingVertical: scaleHeight(12), borderBottomWidth: 1, borderBottomColor: "#1E293B" },
  contactName: { color: "#F8FAFC", fontSize: scaleFont(15), fontWeight: "500" },
  contactPhone: { color: "#94A3B8", fontSize: scaleFont(12), marginTop: scaleHeight(2) },
  closeButton: { marginTop: scaleHeight(14), paddingVertical: scaleHeight(12), alignItems: "center", backgroundColor: "#1E293B", borderRadius: 10 },
  closeButtonText: { color: "#F8FAFC", fontSize: scaleFont(14) },
});
