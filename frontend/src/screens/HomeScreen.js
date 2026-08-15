import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>தின வசூல்</Text>
        <Text style={styles.appSubName}>Dina Vasool</Text>
      </View>

      <TouchableOpacity
        style={[styles.card, styles.dailyCard]}
        onPress={() => navigation.navigate("Daily")}
        activeOpacity={0.85}
      >
        <Text style={styles.cardTitle}>Daily</Text>
        <Text style={styles.cardSubtitle}>Today's collections, customers & report</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, styles.weeklyCard]}
        onPress={() => Alert.alert("Coming soon", "Weekly view is planned for a future update.")}
        activeOpacity={0.85}
      >
        <Text style={styles.cardTitle}>Weekly</Text>
        <Text style={styles.cardSubtitle}>Coming soon</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", padding: scaleWidth(20), justifyContent: "center" },
  header: { alignItems: "center", marginBottom: scaleHeight(50) },
  appName: { color: "#F8FAFC", fontSize: scaleFont(34), fontWeight: "800" },
  appSubName: { color: "#94A3B8", fontSize: scaleFont(14), marginTop: scaleHeight(4) },
  card: {
    borderRadius: 18,
    padding: scaleWidth(24),
    marginBottom: scaleHeight(16),
  },
  dailyCard: { backgroundColor: "#2563EB" },
  weeklyCard: { backgroundColor: "#1E293B" },
  cardTitle: { color: "#fff", fontSize: scaleFont(22), fontWeight: "700" },
  cardSubtitle: { color: "#DBEAFE", fontSize: scaleFont(13), marginTop: scaleHeight(6) },
});
