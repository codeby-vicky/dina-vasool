import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { scaleFont, scaleWidth, scaleHeight, isTablet } from "../utils/responsive";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Missing details", "Enter both username and password.");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { maxWidth: isTablet() ? 480 : "100%", alignSelf: "center", width: "100%" },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>தின வசூல்</Text>
          <Text style={styles.subtitle}>Dina Vasool — Daily collection & reports</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="e.g. admin"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0F172A" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(40),
  },
  header: { marginBottom: scaleHeight(40), alignItems: "center" },
  title: {
    fontSize: scaleFont(26),
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
  },
  subtitle: {
    fontSize: scaleFont(14),
    color: "#94A3B8",
    marginTop: scaleHeight(6),
    textAlign: "center",
  },
  form: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: scaleWidth(20),
  },
  label: {
    fontSize: scaleFont(13),
    color: "#CBD5E1",
    marginBottom: scaleHeight(6),
    marginTop: scaleHeight(12),
  },
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
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: scaleHeight(14),
    alignItems: "center",
    marginTop: scaleHeight(24),
  },
  buttonText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "600" },
});
