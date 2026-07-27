import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../utils/constants';

import HomeScreen from '../screens/HomeScreen';
import HealthDashboardScreen from '../screens/HealthDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused }) => (
  <View style={styles.tabItem}>
    <Text style={[styles.icon, focused && styles.iconActive]}>{icon}</Text>
    <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
  </View>
);

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: styles.tabBar }}
    >
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }} />
      <Tab.Screen name="Health" component={HealthDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Health" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 83 : 64,
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 22, opacity: 0.45 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, color: '#6B7280', fontWeight: '500' },
  labelActive: { color: '#0077B6', fontWeight: '700' },
});
