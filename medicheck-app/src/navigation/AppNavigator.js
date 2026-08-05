import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import SplashScreen from '../screens/SplashScreen';
import HealthDashboardScreen from '../screens/DashboardScreen';
import DoctorDetailScreen from '../screens/DoctorDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MedicineScanner from '../screens/MedicineScanner';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SymptomCheckerScreen from '../screens/SymptomCheckerScreen';
import DoctorsScreen from '../screens/DoctorsScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import FamilyScreen from '../screens/FamilyScreen';
import ChatScreen from '../screens/ChatScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

import { COLORS } from '../utils/constants';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* HOME */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarButtonTestID: 'tab-home',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
          ),
        }}
      />

      {/* SYMPTOMS */}
      <Tab.Screen
        name="SymptomChecker"
        component={SymptomCheckerScreen}
        options={{
          tabBarButtonTestID: 'tab-symptoms',
          tabBarLabel: 'Symptoms',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🩺" focused={focused} />
          ),
        }}
      />

      {/* FAMILY */}
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          tabBarButtonTestID: 'tab-family',
          tabBarLabel: 'Family',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👨‍👩‍👧‍👦" focused={focused} />
          ),
        }}
      />

      {/* DOCTORS */}
      <Tab.Screen
        name="Doctors"
        component={DoctorsScreen}
        options={{
          tabBarButtonTestID: 'tab-doctors',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👨‍⚕️" focused={focused} />
          ),
        }}
      />

      {/* EMERGENCY */}
      <Tab.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{
          tabBarButtonTestID: 'tab-emergency',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🚨" focused={focused} />
          ),
          tabBarActiveTintColor: '#E63946',
        }}
      />

      {/* AI CHAT */}
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarButtonTestID: 'tab-chat',
          tabBarLabel: 'AI Chat',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🤖" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />

        <Stack.Screen
          name="HealthDashboard"
          component={HealthDashboardScreen}
        />

        <Stack.Screen
          name="DoctorDetail"
          component={DoctorDetailScreen}
        />

        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />

        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="MedicineScanner"
          component={MedicineScanner}
        />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
        />

        {/* MAIN TABS */}
        <Stack.Screen
          name="Main"
          component={MainTabs}
        />

        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}