import React, { useEffect, useState } from "react";
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
  Switch,
} from "react-native";
import * as Contacts from "expo-contacts";
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

function calcPreview(adapu, category) {
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

export default function AddCustomerScreen({ navigation }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [longWait, setLongWait] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");

  // New: optional immediate disbursement
  const [alsoDisburse, setAlsoDisburse] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [adapuAmount, setAdapuAmount] = useState("");

  useEffect(() => {
    client
      .get("/api/categories")
      .then(({ data }) => {
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory(data[0]);
          if (data[0].defaultAmount) setAdapuAmount(String(data[0].defaultAmount));
        }
      })
      .catch(() => {});
  }, []);

  const preview = calcPreview(adapuAmount, selectedCategory);

  const saveCustomer = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Customer name is required (phone number is optional).");
      return;
    }
    if (alsoDisburse) {
      const amount = parseFloat(adapuAmount);
      if (!amount || amount <= 0) {
        Alert.alert("Missing amount", "Enter the principal amount to disburse, or turn off 'Also disburse'.");
        return;
      }
      if (!selectedCategory) {
        Alert.alert("No category", "Create a category on the backend first, or turn off 'Also disburse'.");
        return;
      }
    }

    setSaving(true);
    setLongWait(false);
    const longWaitTimer = setTimeout(() => setLongWait(true), 6000);
    try {
      const { data: customer } = await client.post("/api/customers", {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });

      if (alsoDisburse) {
        await client.post("/api/loan-phases", {
          customerId: customer.id,
          categoryId: selectedCategory.id,
          adapu: parseFloat(adapuAmount),
        });
        Alert.alert(
          "Added & Disbursed",
          `${name} added, and ₹${adapuAmount} disbursed (customer receives ₹${preview?.received}).`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert("Added", `${name} added as a customer.`, [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      clearTimeout(longWaitTimer);
      setSaving(false);
      setLongWait(false);
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

      <Text style={styles.label}>Phone Number (optional)</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="e.g. 9876543210"
        placeholderTextColor="#94A3B8"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Area</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="e.g. Pallavaram (used to search customers by area)"
        placeholderTextColor="#94A3B8"
      />

      <TouchableOpacity style={styles.saveContactButton} onPress={saveToPhoneContacts}>
        <Text style={styles.saveContactButtonText}>📱 Save to Phone Contacts (optional)</Text>
      </TouchableOpacity>

      <View style={styles.disburseToggleRow}>
        <Text style={styles.disburseToggleLabel}>Also give a loan now?</Text>
        <Switch
          value={alsoDisburse}
          onValueChange={setAlsoDisburse}
          trackColor={{ false: "#334155", true: "#2563EB" }}
        />
      </View>

      {alsoDisburse && (
        <View style={styles.disburseBox}>
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
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {categories.length === 0 && (
            <Text style={styles.emptyText}>
              No categories found. Create one via POST /api/categories on the backend first.
            </Text>
          )}

          <Text style={styles.label}>Principal Amount (Adapu)</Text>
          <TextInput
            style={styles.input}
            value={adapuAmount}
            onChangeText={setAdapuAmount}
            placeholder="e.g. 10000"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />

          {preview && (
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
          )}
        </View>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={saveCustomer} disabled={saving}>
        <Text style={styles.submitButtonText}>
          {saving
            ? longWait
              ? "Still working — server waking up, please wait..."
              : "Saving..."
            : alsoDisburse
            ? "Add Customer & Disburse"
            : "Add Customer"}
        </Text>
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
  disburseToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    marginBottom: scaleHeight(14),
  },
  disburseToggleLabel: { color: "#F8FAFC", fontSize: scaleFont(14), fontWeight: "600" },
  disburseBox: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: scaleWidth(14),
    marginBottom: scaleHeight(14),
  },
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
  emptyText: { color: "#64748B", fontSize: scaleFont(12), marginTop: scaleHeight(6) },
  previewBox: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    padding: scaleWidth(12),
    marginTop: scaleHeight(4),
  },
  previewRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: scaleHeight(4) },
  previewLabel: { color: "#94A3B8", fontSize: scaleFont(12) },
  previewValue: { color: "#4ADE80", fontSize: scaleFont(13), fontWeight: "700" },
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