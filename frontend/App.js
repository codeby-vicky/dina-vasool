import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TouchableOpacity, Text, View } from "react-native";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import HomeScreen from "./src/screens/HomeScreen";
import DailyScreen from "./src/screens/DailyScreen";
import CustomersScreen from "./src/screens/CustomersScreen";
import AddCustomerScreen from "./src/screens/AddCustomerScreen";
import CustomerDetailScreen from "./src/screens/CustomerDetailScreen";
import ReportsScreen from "./src/screens/ReportsScreen";
import CategoriesScreen from "./src/screens/CategoriesScreen";
import ExportScreen from "./src/screens/ExportScreen";
import { scaleFont } from "./src/utils/responsive";

const Stack = createNativeStackNavigator();

const navTheme = {
  dark: true,
  colors: {
    primary: "#2563EB",
    background: "#0F172A",
    card: "#1E293B",
    text: "#F8FAFC",
    border: "#334155",
    notification: "#DC2626",
  },
};

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={logout} style={{ paddingHorizontal: 8 }}>
      <Text style={{ color: "#F87171", fontSize: scaleFont(14) }}>Log Out</Text>
    </TouchableOpacity>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: "Dina Vasool", headerRight: () => <LogoutButton /> }}
            />
            <Stack.Screen
              name="Daily"
              component={DailyScreen}
              options={{ title: "Daily", headerRight: () => <LogoutButton /> }}
            />
            <Stack.Screen
              name="Customers"
              component={CustomersScreen}
              options={{ title: "Collect — Pick Customer" }}
            />
            <Stack.Screen
              name="AddCustomer"
              component={AddCustomerScreen}
              options={{ title: "Add Customer" }}
            />
            <Stack.Screen
              name="CustomerDetail"
              component={CustomerDetailScreen}
              options={({ route }) => ({ title: route.params.customer.name })}
            />
            <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: "Reports" }} />
            <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: "Categories" }} />
            <Stack.Screen name="Export" component={ExportScreen} options={{ title: "Export Report" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}