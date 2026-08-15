import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import * as Contacts from "expo-contacts";
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

export default function AddCustomerScreen({ navigation }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");

  const saveCustomer = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing details", "Name and phone number are required.");
      return;
    }
    setSaving(true);
    try {
      await client.post("/api/customers", {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
      });
      Alert.alert("Added", `${name} added as a customer.`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveToPhoneContacts = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing details", "Enter name and phone number first.");
      return;
    }
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Contacts access is needed to save this customer to your phone.");
      return;
    }
    try {
      const contact = {
        [Contacts.Fields.FirstName]: name.trim(),
        [Contacts.Fields.PhoneNumbers]: [{ label: "mobile", number: phone.trim() }],
        contactType: Contacts.ContactTypes.Person,
      };
      await Contacts.addContactAsync(contact);
      Alert.alert("Saved", `${name} saved to your phone contacts.`);
    } catch (err) {
      Alert.alert("Error", "Could not save to phone contacts: " + err.message);
    }
  };

  const openContactPicker = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Contacts access is needed to pick from your phone.");
      return;
    }
    const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
    setContacts(data.filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0));
    setPickerVisible(true);
  };

  const pickContact = (contact) => {
    setName(contact.name || "");
    setPhone((contact.phoneNumbers?.[0]?.number || "").replace(/\s/g, ""));
    setPickerVisible(false);
  };

  const filteredContacts = contacts.filter((c) =>
    (c.name || "").toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: scaleWidth(16) }}>
      <Text style={styles.title}>Add Customer</Text>

      <TouchableOpacity style={styles.pickButton} onPress={openContactPicker}>
        <Text style={styles.pickButtonText}>📇 Pick from Phone Contacts</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>— or enter manually —</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Customer name"
        placeholderTextColor="#94A3B8"
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="e.g. 9876543210"
        placeholderTextColor="#94A3B8"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Address (optional)</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Optional"
        placeholderTextColor="#94A3B8"
      />

      <TouchableOpacity style={styles.saveContactButton} onPress={saveToPhoneContacts}>
        <Text style={styles.saveContactButtonText}>📱 Save to Phone Contacts (optional)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={saveCustomer} disabled={saving}>
        <Text style={styles.submitButtonText}>{saving ? "Saving..." : "Add Customer"}</Text>
      </TouchableOpacity>

      <Modal visible={pickerVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Pick a contact</Text>
          <TextInput
            style={styles.input}
            value={contactSearch}
            onChangeText={setContactSearch}
            placeholder="Search your phone contacts..."
            placeholderTextColor="#94A3B8"
          />
          <FlatList
            data={filteredContacts}
            keyExtractor={(item, idx) => `contact-${idx}-${item.id || item.name || "x"}`}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.contactRow} onPress={() => pickContact(item)}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  title: { color: "#F8FAFC", fontSize: scaleFont(22), fontWeight: "700", marginBottom: scaleHeight(16) },
  pickButton: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingVertical: scaleHeight(14),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  pickButtonText: { color: "#F8FAFC", fontSize: scaleFont(14), fontWeight: "600" },
  orText: {
    color: "#64748B",
    textAlign: "center",
    fontSize: scaleFont(12),
    marginVertical: scaleHeight(14),
  },
  label: { color: "#CBD5E1", fontSize: scaleFont(13), marginBottom: scaleHeight(6) },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    color: "#F8FAFC",
    fontSize: scaleFont(15),
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: scaleHeight(14),
  },
  saveContactButton: {
    backgroundColor: "#334155",
    borderRadius: 10,
    paddingVertical: scaleHeight(12),
    alignItems: "center",
    marginBottom: scaleHeight(14),
  },
  saveContactButtonText: { color: "#F8FAFC", fontSize: scaleFont(13), fontWeight: "600" },
  submitButton: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: scaleHeight(14),
    alignItems: "center",
    marginBottom: scaleHeight(30),
  },
  submitButtonText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "700" },
  modalContainer: { flex: 1, backgroundColor: "#0F172A", padding: scaleWidth(16), paddingTop: scaleHeight(50) },
  modalTitle: { color: "#F8FAFC", fontSize: scaleFont(20), fontWeight: "700", marginBottom: scaleHeight(14) },
  contactRow: { paddingVertical: scaleHeight(12), borderBottomWidth: 1, borderBottomColor: "#1E293B" },
  contactName: { color: "#F8FAFC", fontSize: scaleFont(15), fontWeight: "500" },
  contactPhone: { color: "#94A3B8", fontSize: scaleFont(12), marginTop: scaleHeight(2) },
  closeButton: {
    marginTop: scaleHeight(14),
    paddingVertical: scaleHeight(12),
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
  },
  closeButtonText: { color: "#F8FAFC", fontSize: scaleFont(14) },
});
