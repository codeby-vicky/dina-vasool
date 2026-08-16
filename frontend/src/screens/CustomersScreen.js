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
import * as Contacts from "expo-contacts";
import client from "../api/client";
import { scaleFont, scaleWidth, scaleHeight } from "../utils/responsive";

export default function CustomersScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");

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

  useEffect(() => {
    fetchCustomers("");
  }, [fetchCustomers]);

  const handleSearch = (text) => {
    setQuery(text);
    fetchCustomers(text);
  };

  const openContactPicker = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Contacts access is needed to search customers by their saved phone name."
      );
      return;
    }
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });
    const withPhones = data.filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0);
    setContacts(withPhones);
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
      <View style={styles.searchRow}>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={handleSearch}
        placeholder="Search by name, phone, or area..."
        placeholderTextColor="#94A3B8"
      />
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddCustomer")} activeOpacity={0.8}>
        <Text style={styles.addButtonText}>+ Add Customer</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ marginTop: scaleHeight(20) }} color="#2563EB" />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item, idx) => (item?.id != null ? String(item.id) : `tmp-${idx}`)}
          contentContainerStyle={{ paddingBottom: scaleHeight(20) }}
          renderItem={({ item }) =>
            !item?.id ? null : (
            <TouchableOpacity
              style={styles.customerCard}
              onPress={() => navigation.navigate("CustomerDetail", { customer: item })}
              onLongPress={() => deleteCustomer(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.customerName}>{item.name}</Text>
              {!!item.phone && <Text style={styles.customerPhone}>{item.phone}</Text>}
              {!!item.address && <Text style={styles.customerArea}>📍 {item.address}</Text>}
              <Text style={styles.longPressHint}>Hold to delete</Text>
            </TouchableOpacity>
          )
          }
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
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => addCustomerFromContact(item)}
              >
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
  searchRow: { marginBottom: scaleHeight(10) },
  searchInput: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingHorizontal: scaleWidth(14),
    paddingVertical: scaleHeight(12),
    color: "#F8FAFC",
    fontSize: scaleFont(15),
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: scaleHeight(10),
  },
  addButton: {
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: scaleHeight(12),
    alignItems: "center",
    marginBottom: scaleHeight(14),
  },
  addButtonText: { color: "#fff", fontSize: scaleFont(14), fontWeight: "600" },
  customerCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: scaleWidth(14),
    marginBottom: scaleHeight(10),
  },
  customerName: { color: "#F8FAFC", fontSize: scaleFont(16), fontWeight: "600" },
  customerPhone: { color: "#94A3B8", fontSize: scaleFont(13), marginTop: scaleHeight(4) },
  customerArea: { color: "#60A5FA", fontSize: scaleFont(12), marginTop: scaleHeight(2) },
  longPressHint: { color: "#475569", fontSize: scaleFont(10), marginTop: scaleHeight(4) },
  emptyText: {
    color: "#64748B",
    textAlign: "center",
    marginTop: scaleHeight(40),
    fontSize: scaleFont(14),
  },
  modalContainer: { flex: 1, backgroundColor: "#0F172A", padding: scaleWidth(16), paddingTop: scaleHeight(50) },
  modalTitle: {
    color: "#F8FAFC",
    fontSize: scaleFont(20),
    fontWeight: "700",
    marginBottom: scaleHeight(14),
  },
  contactRow: {
    paddingVertical: scaleHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
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