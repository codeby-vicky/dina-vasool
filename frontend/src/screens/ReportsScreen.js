import React, { useState } from "react";
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

  const loadPreview = async (invAmount) => {
    setLoading(true);
    try {
      const params = { date };
      const inv = invAmount !== undefined ? invAmount : additionalInvestment;
      if (inv) params.additionalInvestment = inv;
      const { data } = await client.get("/api/day-closing/preview", { params });
      setPreview(data);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const shortfall =
    preview && preview.closingBalance < 0
      ? Math.abs(preview.closingBalance)
      : null;

  const applyShortfallAsInvestment = () => {
    if (!shortfall) return;
    setAdditionalInvestment(String(shortfall));
    loadPreview(String(shortfall));
  };

  const closeDay = async () => {
    Alert.alert(
      "Close today's day?",
      "This locks today's calculation and sets tomorrow's opening mun-irupu. This can't be casually undone.",
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: scaleWidth(16) }}>
      <Text style={styles.title}>Today's Report</Text>
      <Text style={styles.dateText}>{date}</Text>

      <View style={styles.explainBox}>
        <Text style={styles.explainText}>
          How this is calculated: (Yesterday's leftover) + (today's collection) + (today's
          aadhaiyam from new loans) + (any extra investment you add below) − (money given out
          today) − (today's expenses) = tomorrow's opening balance.
        </Text>
      </View>

      <TouchableOpacity style={styles.previewButton} onPress={() => loadPreview()} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.previewButtonText}>Load / Refresh Preview</Text>
        )}
      </TouchableOpacity>

      {preview && (
        <View style={styles.card}>
          <Row label="Opening Balance (Mun-Irupu)" value={preview.openingBalance} />
          <Row label="Today's Collection" value={preview.totalCollection} />
          <Row label="Aadhaiyam (new disbursements)" value={preview.totalAadhaiyam} />
          <Row label="Additional Investment (added)" value={preview.additionalInvestment} />
          <Row label="Adapu (principal disbursed)" value={preview.totalAdapu} negative />
          <Row label="Expenses" value={preview.totalExpenses} negative />
          <View style={styles.divider} />
          <Row label="Closing Balance → Tomorrow's Mun-Irupu" value={preview.closingBalance} bold />
          <Text style={styles.statusText}>
            {preview.closed ? "✓ Day is closed" : "Not yet closed — this is a preview"}
          </Text>

          {shortfall && !preview.closed && (
            <View style={styles.shortfallBox}>
              <Text style={styles.shortfallText}>
                Mun-irupu falls short by ₹{shortfall.toFixed(2)} to cover today's loans given out.
                Add that as extra investment below, or type your own amount.
              </Text>
              <TouchableOpacity style={styles.shortfallButton} onPress={applyShortfallAsInvestment}>
                <Text style={styles.shortfallButtonText}>
                  Add ₹{shortfall.toFixed(2)} as Investment
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {preview && !preview.closed && (
        <View style={styles.investmentBox}>
          <Text style={styles.label}>Additional Investment (optional)</Text>
          <TextInput
            style={styles.investmentInput}
            value={additionalInvestment}
            onChangeText={setAdditionalInvestment}
            placeholder="e.g. 5000"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.recalcButton}
            onPress={() => loadPreview()}
          >
            <Text style={styles.recalcButtonText}>Recalculate with this investment</Text>
          </TouchableOpacity>
        </View>
      )}

      {preview && !preview.closed && (
        <TouchableOpacity style={styles.closeButton} onPress={closeDay} disabled={closing}>
          {closing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.closeButtonText}>Close Today's Day</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Row({ label, value, negative, bold }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          negative && styles.rowValueNegative,
          bold && styles.rowValueBold,
        ]}
      >
        {negative ? "− " : ""}₹{value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  title: { color: "#F8FAFC", fontSize: scaleFont(22), fontWeight: "700" },
  dateText: { color: "#94A3B8", fontSize: scaleFont(13), marginBottom: scaleHeight(12) },
  explainBox: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    padding: scaleWidth(12),
    marginBottom: scaleHeight(14),
  },
  explainText: { color: "#94A3B8", fontSize: scaleFont(12), lineHeight: scaleFont(18) },
  previewButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: scaleHeight(12),
    alignItems: "center",
    marginBottom: scaleHeight(16),
  },
  previewButtonText: { color: "#fff", fontSize: scaleFont(14), fontWeight: "600" },
  card: { backgroundColor: "#1E293B", borderRadius: 14, padding: scaleWidth(16) },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: scaleHeight(8),
  },
  rowLabel: { color: "#94A3B8", fontSize: scaleFont(13), flex: 1 },
  rowValue: { color: "#F8FAFC", fontSize: scaleFont(14), fontWeight: "600" },
  rowValueNegative: { color: "#F87171" },
  rowValueBold: { fontSize: scaleFont(17), color: "#4ADE80" },
  divider: { height: 1, backgroundColor: "#334155", marginVertical: scaleHeight(8) },
  statusText: {
    color: "#94A3B8",
    fontSize: scaleFont(12),
    marginTop: scaleHeight(10),
    textAlign: "center",
  },
  shortfallBox: {
    backgroundColor: "#7C2D12",
    borderRadius: 10,
    padding: scaleWidth(12),
    marginTop: scaleHeight(14),
  },
  shortfallText: { color: "#FED7AA", fontSize: scaleFont(12), marginBottom: scaleHeight(10) },
  shortfallButton: {
    backgroundColor: "#EA580C",
    borderRadius: 8,
    paddingVertical: scaleHeight(10),
    alignItems: "center",
  },
  shortfallButtonText: { color: "#fff", fontSize: scaleFont(13), fontWeight: "700" },
  investmentBox: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: scaleWidth(16),
    marginTop: scaleHeight(14),
  },
  label: { color: "#CBD5E1", fontSize: scaleFont(13), marginBottom: scaleHeight(8) },
  investmentInput: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    color: "#F8FAFC",
    fontSize: scaleFont(15),
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: scaleHeight(12),
  },
  recalcButton: {
    backgroundColor: "#334155",
    borderRadius: 10,
    paddingVertical: scaleHeight(10),
    alignItems: "center",
  },
  recalcButtonText: { color: "#F8FAFC", fontSize: scaleFont(13), fontWeight: "600" },
  closeButton: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingVertical: scaleHeight(14),
    alignItems: "center",
    marginTop: scaleHeight(20),
    marginBottom: scaleHeight(30),
  },
  closeButtonText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "700" },
});
