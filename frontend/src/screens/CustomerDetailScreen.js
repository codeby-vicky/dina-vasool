import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

function daysSince(dateStr) {
  const start = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / 86400000);
  return Math.max(diff, 0);
}

function suggestedDailyAmount(phase) {
  if (!phase?.totalPayable || !phase?.standardDays) return "";
  const perDay = phase.totalPayable / phase.standardDays;
  return String(Math.round(perDay));
}

function calcDisbursePreview(adapu, category) {
  const amount = parseFloat(adapu);
  if (!amount || amount <= 0 || !category) return null;
  const aadhaiyam = (amount * category.deductionRatePer1000) / 1000;
  const totalPayable = (amount * category.repayRatePer1000) / 1000;
  const perDay = totalPayable / category.standardDays;
  return {
    aadhaiyam: aadhaiyam.toFixed(2),
    totalPayable: totalPayable.toFixed(2),
    received: (amount - aadhaiyam).toFixed(2),
    perDay: Math.round(perDay),
  };
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export default function CustomerDetailScreen({ route, navigation }) {
  const { customer } = route.params;
  const [phases, setPhases] = useState([]);
  const [allPhases, setAllPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectAmount, setCollectAmount] = useState("");
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [disburseModal, setDisburseModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [adapuAmount, setAdapuAmount] = useState("");
  const [showOverrides, setShowOverrides] = useState(false);
  const [aadhaiyamOverride, setAadhaiyamOverride] = useState("");
  const [totalPayableOverride, setTotalPayableOverride] = useState("");

  const loadPhases = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, allRes] = await Promise.all([
        client.get(`/api/loan-phases/customer/${customer.id}/active`),
        client.get(`/api/loan-phases/customer/${customer.id}/all`),
      ]);
      setPhases(Array.isArray(activeRes.data) ? activeRes.data : []);
      setAllPhases(Array.isArray(allRes.data) ? allRes.data : []);
    } catch (err) {
      setPhases([]);
      setAllPhases([]);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, [customer.id]);

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await client.get("/api/categories");
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategory(data[0]);
        if (data[0].defaultAmount) setAdapuAmount(String(data[0].defaultAmount));
      }
    } catch (err) {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    loadPhases();
    loadCategories();
  }, [loadPhases, loadCategories]);

  const loadHistory = useCallback(async (phase) => {
    setHistoryLoading(true);
    try {
      const { data } = await client.get(`/api/collections/loan-phase/${phase.id}`);
      const sorted = [...(Array.isArray(data) ? data : [])].sort(
        (a, b) => new Date(b.collectedDate) - new Date(a.collectedDate)
      );
      setHistory(sorted);
    } catch (err) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const selectPhase = (phase) => {
    setSelectedPhase(phase);
    setCollectAmount(suggestedDailyAmount(phase));
    loadHistory(phase);
  };

  const totalCollectedFor = (phase) =>
    history.reduce((sum, h) => sum + Number(h.amount), 0);

  const submitCollection = async () => {
    if (!selectedPhase) {
      Alert.alert("Pick a phase", "Select which active loan/category to collect against.");
      return;
    }
    const amount = parseFloat(collectAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid amount", "Enter a valid collection amount, or use 'Mark Not Paid' below.");
      return;
    }

    // Check if today already has an entry - warn before replacing it
    const todayIso = new Date().toISOString().slice(0, 10);
    try {
      const { data: existing } = await client.get(
        `/api/collections/loan-phase/${selectedPhase.id}/for-date`,
        { params: { date: todayIso } }
      );
      if (existing) {
        Alert.alert(
          "Already recorded today",
          `Today's collection is currently ₹${existing.amount}. Replace it with ₹${amount}?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Replace", onPress: () => doSubmitCollection(amount) },
          ]
        );
        return;
      }
    } catch (err) {
      // no existing entry (404) or check failed - proceed to create normally
    }
    doSubmitCollection(amount);
  };

  const doSubmitCollection = async (amount) => {
    try {
      await client.post("/api/collections", {
        loanPhaseId: selectedPhase.id,
        amount,
      });
      setCollectAmount("");
      Alert.alert("Recorded", `₹${amount} collected from ${customer.name} on ${formatDate(new Date())}.`);
      await loadPhases();
      await loadHistory(selectedPhase);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const markNotPaid = () => {
    // No entry is created - an absent day is already treated as "NP" (Not Paid)
    // everywhere: the Excel export and remaining-balance calculation both just
    // skip days with no collection entry, so nothing needs to be recorded.
    setCollectAmount("");
    Alert.alert("Marked", `${customer.name} noted as not paid today (${formatDate(new Date())}). No entry needed.`);
  };

  const submitDisbursement = async () => {
    const adapu = parseFloat(adapuAmount);
    if (!adapu || adapu <= 0) {
      Alert.alert("Invalid amount", "Enter the principal amount to disburse.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("No category", "Create a category on the backend first.");
      return;
    }
    try {
      await client.post("/api/loan-phases", {
        customerId: customer.id,
        categoryId: selectedCategory.id,
        adapu,
        aadhaiyamOverride: aadhaiyamOverride ? parseFloat(aadhaiyamOverride) : null,
        totalPayableOverride: totalPayableOverride ? parseFloat(totalPayableOverride) : null,
      });
      setAdapuAmount("");
      setAadhaiyamOverride("");
      setTotalPayableOverride("");
      setShowOverrides(false);
      setDisburseModal(false);
      Alert.alert("Disbursed", `₹${adapu} disbursed to ${customer.name}.`);
      loadPhases();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const deleteCustomer = () => {
    Alert.alert(
      "Delete this customer?",
      `This permanently removes ${customer.name} and all their loan/collection history. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await client.delete(`/api/customers/${customer.id}`);
              Alert.alert("Deleted", `${customer.name} was removed.`, [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  const hasClosedPhases = allPhases.some((p) => p.status === "CLOSED");
  const nextPhaseNumber =
    allPhases.length > 0 ? Math.max(...allPhases.map((p) => p.phaseNumber || 1)) + 1 : 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: scaleWidth(16) }}>
      <View style={styles.headerCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.phone}>{customer.phone}</Text>
        </View>
        <TouchableOpacity style={styles.deleteIconButton} onPress={deleteCustomer}>
          <Text style={styles.deleteIconText}>🗑</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.disburseButton} onPress={() => setDisburseModal(true)}>
        <Text style={styles.disburseButtonText}>+ New Disbursement / Phase</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.exportLinkButton}
        onPress={() => navigation.navigate("Export", { customerId: customer.id, customerName: customer.name })}
      >
        <Text style={styles.exportLinkButtonText}>📥 Export {customer.name}'s Payment History</Text>
      </TouchableOpacity>

      {phases.length === 0 && hasClosedPhases && !loading && (
        <View style={styles.borrowAgainBox}>
          <Text style={styles.borrowAgainText}>
            {customer.name} has fully repaid all previous loans.
          </Text>
          <TouchableOpacity style={styles.borrowAgainButton} onPress={() => setDisburseModal(true)}>
            <Text style={styles.borrowAgainButtonText}>
              Start {ordinal(nextPhaseNumber)} Time Borrowing
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Active Loan Phases</Text>

      {loading ? (
        <ActivityIndicator color="#2563EB" style={{ marginTop: scaleHeight(20) }} />
      ) : phases.length === 0 ? (
        <Text style={styles.emptyText}>No active phases for this customer.</Text>
      ) : (
        phases.map((phase) => {
          const dayCount = daysSince(phase.startDate);
          const isSelected = selectedPhase?.id === phase.id;
          const collected = isSelected ? totalCollectedFor(phase) : null;
          const outstanding =
            collected !== null ? Math.max(phase.totalPayable - collected, 0) : null;
          const daysLeft = Math.max(phase.standardDays - dayCount, 0);

          return (
            <TouchableOpacity
              key={phase.id}
              style={[styles.phaseCard, isSelected && styles.phaseCardSelected]}
              onPress={() => selectPhase(phase)}
            >
              <View style={styles.phaseTopRow}>
                <Text style={styles.phaseTitle}>
                  {phase.category?.name} · {ordinal(phase.phaseNumber || 1)} time
                </Text>
                <Text style={[styles.statusBadge, phase.status === "OVERDUE" && styles.statusOverdue]}>
                  {phase.status}
                </Text>
              </View>

              <View style={styles.simpleGrid}>
                <View style={styles.simpleCell}>
                  <Text style={styles.simpleLabel}>Total Payable</Text>
                  <Text style={styles.simpleValue}>₹{phase.totalPayable}</Text>
                </View>
                <View style={styles.simpleCell}>
                  <Text style={styles.simpleLabel}>Day</Text>
                  <Text style={styles.simpleValue}>{dayCount} / {phase.standardDays}</Text>
                </View>
                {isSelected && (
                  <>
                    <View style={styles.simpleCell}>
                      <Text style={styles.simpleLabel}>Remaining to Pay</Text>
                      <Text style={[styles.simpleValue, styles.remainingValue]}>
                        {historyLoading ? "…" : `₹${outstanding?.toFixed(2)}`}
                      </Text>
                    </View>
                    <View style={styles.simpleCell}>
                      <Text style={styles.simpleLabel}>Days Left</Text>
                      <Text style={styles.simpleValue}>
                        {phase.status === "OVERDUE" ? "Overdue" : daysLeft}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {!isSelected && (
                <Text style={styles.tapHint}>Tap to view balance & collect</Text>
              )}
            </TouchableOpacity>
          );
        })
      )}

      {selectedPhase && (
        <View style={styles.collectBox}>
          <Text style={styles.sectionTitle}>Collect Today's Payment</Text>
          <Text style={styles.collectSubtitle}>Today: {formatDate(new Date())}</Text>
          <Text style={styles.collectSubtitle}>
            Suggested ₹{suggestedDailyAmount(selectedPhase)} — but type any amount actually paid
          </Text>
          <TextInput
            style={styles.amountInput}
            value={collectAmount}
            onChangeText={setCollectAmount}
            placeholder="Amount received e.g. 200"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.collectButton} onPress={submitCollection}>
            <Text style={styles.collectButtonText}>Record Collection</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notPaidButton} onPress={markNotPaid}>
            <Text style={styles.notPaidButtonText}>— Mark Not Paid Today</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: scaleHeight(20) }]}>
            Collection History
          </Text>
          {historyLoading ? (
            <ActivityIndicator color="#2563EB" style={{ marginTop: scaleHeight(10) }} />
          ) : history.length === 0 ? (
            <Text style={styles.emptyText}>No payments recorded yet for this phase.</Text>
          ) : (
            history.map((h) => (
              <View key={h.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>{formatDate(h.collectedDate)}</Text>
                <Text style={styles.historyAmount}>₹{h.amount}</Text>
              </View>
            ))
          )}
        </View>
      )}

      <Modal visible={disburseModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {hasClosedPhases && phases.length === 0
                ? `${ordinal(nextPhaseNumber)} Time Disbursement`
                : "New Disbursement"}
            </Text>

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory?.id === cat.id && styles.categoryChipSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    if (cat.defaultAmount) setAdapuAmount(String(cat.defaultAmount));
                  }}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory?.id === cat.id && styles.categoryChipTextSelected,
                    ]}
                  >
                    {cat.name} (×{cat.repayRatePer1000}/1000)
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {categories.length === 0 && (
              <Text style={styles.emptyText}>
                No categories found. Create one via POST /api/categories on the backend first.
              </Text>
            )}

            <Text style={styles.label}>Adapu (Principal Amount) — required</Text>
            <TextInput
              style={styles.amountInput}
              value={adapuAmount}
              onChangeText={setAdapuAmount}
              placeholder="e.g. 10000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />

            {(() => {
              const preview = calcDisbursePreview(adapuAmount, selectedCategory);
              if (!preview) return null;
              return (
                <View style={styles.previewBox}>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Aadhaiyam (deducted)</Text>
                    <Text style={styles.previewValue}>₹{preview.aadhaiyam}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Customer Receives</Text>
                    <Text style={styles.previewValue}>₹{preview.received}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Total Payable</Text>
                    <Text style={styles.previewValue}>₹{preview.totalPayable}</Text>
                  </View>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Suggested / day (over {selectedCategory.standardDays}d)</Text>
                    <Text style={styles.previewValue}>₹{preview.perDay}</Text>
                  </View>
                </View>
              );
            })()}

            <TouchableOpacity onPress={() => setShowOverrides(!showOverrides)}>
              <Text style={styles.overrideToggle}>
                {showOverrides ? "− Hide manual override" : "+ Manually set aadhaiyam / total payable"}
              </Text>
            </TouchableOpacity>

            {showOverrides && (
              <>
                <Text style={styles.label}>Aadhaiyam Override (leave blank for auto-calc)</Text>
                <TextInput
                  style={styles.amountInput}
                  value={aadhaiyamOverride}
                  onChangeText={setAadhaiyamOverride}
                  placeholder="e.g. 500"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
                <Text style={styles.label}>Total Payable Override (leave blank for auto-calc)</Text>
                <TextInput
                  style={styles.amountInput}
                  value={totalPayableOverride}
                  onChangeText={setTotalPayableOverride}
                  placeholder="e.g. 12000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </>
            )}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setDisburseModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={submitDisbursement}
              >
                <Text style={styles.modalButtonText}>Disburse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  headerCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: scaleWidth(16),
    marginBottom: scaleHeight(14),
    flexDirection: "row",
    alignItems: "center",
  },
  name: { color: "#F8FAFC", fontSize: scaleFont(20), fontWeight: "700" },
  phone: { color: "#94A3B8", fontSize: scaleFont(13), marginTop: scaleHeight(4) },
  deleteIconButton: {
    backgroundColor: "#7F1D1D",
    borderRadius: 10,
    width: scaleWidth(40),
    height: scaleWidth(40),
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIconText: { fontSize: scaleFont(18) },
  disburseButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: scaleHeight(12),
    alignItems: "center",
    marginBottom: scaleHeight(16),
  },
  disburseButtonText: { color: "#fff", fontSize: scaleFont(14), fontWeight: "600" },
  exportLinkButton: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingVertical: scaleHeight(10),
    alignItems: "center",
    marginBottom: scaleHeight(16),
    borderWidth: 1,
    borderColor: "#334155",
  },
  exportLinkButtonText: { color: "#CBD5E1", fontSize: scaleFont(12), fontWeight: "600" },
  borrowAgainBox: {
    backgroundColor: "#14532D",
    borderRadius: 12,
    padding: scaleWidth(14),
    marginBottom: scaleHeight(16),
  },
  borrowAgainText: { color: "#BBF7D0", fontSize: scaleFont(13), marginBottom: scaleHeight(10) },
  borrowAgainButton: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: scaleHeight(12),
    alignItems: "center",
  },
  borrowAgainButtonText: { color: "#fff", fontSize: scaleFont(14), fontWeight: "700" },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: scaleFont(16),
    fontWeight: "700",
    marginBottom: scaleHeight(10),
  },
  emptyText: { color: "#64748B", fontSize: scaleFont(13), marginBottom: scaleHeight(10) },
  phaseCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: scaleWidth(14),
    marginBottom: scaleHeight(10),
    borderWidth: 2,
    borderColor: "transparent",
  },
  phaseCardSelected: { borderColor: "#2563EB" },
  phaseTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleHeight(10),
  },
  phaseTitle: { color: "#F8FAFC", fontSize: scaleFont(14), fontWeight: "700", flex: 1 },
  statusBadge: { color: "#16A34A", fontSize: scaleFont(11), fontWeight: "700" },
  statusOverdue: { color: "#DC2626" },
  simpleGrid: { flexDirection: "row", flexWrap: "wrap" },
  simpleCell: { width: "50%", marginBottom: scaleHeight(8) },
  simpleLabel: { color: "#94A3B8", fontSize: scaleFont(11) },
  simpleValue: { color: "#F8FAFC", fontSize: scaleFont(15), fontWeight: "700", marginTop: scaleHeight(2) },
  remainingValue: { color: "#FBBF24" },
  tapHint: { color: "#64748B", fontSize: scaleFont(11), marginTop: scaleHeight(4), fontStyle: "italic" },
  collectBox: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: scaleWidth(16),
    marginTop: scaleHeight(10),
    marginBottom: scaleHeight(30),
  },
  collectSubtitle: { color: "#94A3B8", fontSize: scaleFont(12), marginBottom: scaleHeight(6) },
  amountInput: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    color: "#F8FAFC",
    fontSize: scaleFont(15),
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: scaleHeight(12),
    marginTop: scaleHeight(8),
  },
  collectButton: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: scaleHeight(12),
    alignItems: "center",
  },
  collectButtonText: { color: "#fff", fontSize: scaleFont(14), fontWeight: "600" },
  notPaidButton: {
    backgroundColor: "#334155",
    borderRadius: 10,
    paddingVertical: scaleHeight(10),
    alignItems: "center",
    marginTop: scaleHeight(8),
  },
  notPaidButtonText: { color: "#CBD5E1", fontSize: scaleFont(13), fontWeight: "600" },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: scaleHeight(8),
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  historyDate: { color: "#94A3B8", fontSize: scaleFont(13) },
  historyAmount: { color: "#4ADE80", fontSize: scaleFont(14), fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: scaleWidth(20),
  },
  modalCard: { backgroundColor: "#1E293B", borderRadius: 16, padding: scaleWidth(20) },
  modalTitle: {
    color: "#F8FAFC",
    fontSize: scaleFont(18),
    fontWeight: "700",
    marginBottom: scaleHeight(14),
  },
  label: { color: "#CBD5E1", fontSize: scaleFont(13), marginBottom: scaleHeight(8) },
  categoryChip: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(8),
    marginRight: scaleWidth(8),
    borderWidth: 1,
    borderColor: "#334155",
  },
  categoryChipSelected: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  categoryChipText: { color: "#CBD5E1", fontSize: scaleFont(13) },
  categoryChipTextSelected: { color: "#fff", fontWeight: "600" },
  previewBox: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    padding: scaleWidth(12),
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(10),
  },
  previewRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: scaleHeight(4) },
  previewLabel: { color: "#94A3B8", fontSize: scaleFont(12) },
  previewValue: { color: "#4ADE80", fontSize: scaleFont(13), fontWeight: "700" },
  overrideToggle: {
    color: "#60A5FA",
    fontSize: scaleFont(13),
    marginTop: scaleHeight(4),
    marginBottom: scaleHeight(10),
  },
  modalButtonRow: { flexDirection: "row", marginTop: scaleHeight(16), gap: scaleWidth(10) },
  modalButton: {
    flex: 1,
    paddingVertical: scaleHeight(12),
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonCancel: { backgroundColor: "#334155" },
  modalButtonConfirm: { backgroundColor: "#2563EB" },
  modalButtonText: { color: "#fff", fontSize: scaleFont(14), fontWeight: "600" },
});