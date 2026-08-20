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
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

/**
 * For starting a BRAND NEW, separate daily-collection business on this same
 * app/backend - creates a new independent admin account. Existing collectors
 * for an existing business should instead be created by their own admin via
 * the (not-yet-built) staff management screen, not here.
 */
export default function SignupScreen({ navigation }) {
  const { setUserDirectly } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim() || !username.trim() || !password) {
      Alert.alert("Missing details", "Fill in your name, username, and password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Use at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post("/api/auth/signup", {
        fullName: fullName.trim(),
        username: username.trim(),
        password,
      });
      await setUserDirectly(data);
    } catch (err) {
      Alert.alert("Signup failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Start a New Account</Text>
        <Text style={styles.subtitle}>
          Creates a brand new admin login for your own daily-collection business.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="e.g. Vignesh"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="choose a username"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="at least 6 characters"
            placeholderTextColor="#94A3B8"
          />

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: scaleHeight(16) }}>
            <Text style={styles.backLink}>← Back to Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0F172A" },
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: scaleWidth(24), paddingVertical: scaleHeight(40) },
  title: { fontSize: scaleFont(24), fontWeight: "700", color: "#F8FAFC", textAlign: "center" },
  subtitle: { fontSize: scaleFont(13), color: "#94A3B8", marginTop: scaleHeight(8), marginBottom: scaleHeight(24), textAlign: "center" },
  form: { backgroundColor: "#1E293B", borderRadius: 16, padding: scaleWidth(20) },
  label: { fontSize: scaleFont(13), color: "#CBD5E1", marginBottom: scaleHeight(6), marginTop: scaleHeight(12) },
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
  button: { backgroundColor: "#16A34A", borderRadius: 10, paddingVertical: scaleHeight(14), alignItems: "center", marginTop: scaleHeight(24) },
  buttonText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "600" },
  backLink: { color: "#60A5FA", fontSize: scaleFont(13), textAlign: "center" },
});