import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Alert, AppState, LogBox } from 'react-native';

// Suppress push notification warnings that are irrelevant for local reminders in Expo Go
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';

const FAMILY_KEY = 'Cureconnect_family';
const BASE_URL = 'http://10.43.151.175:8000';

function parseTime(timeStr) {
  try {
    const upper = timeStr.toUpperCase().trim();
    const match = upper.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);
    if (!match) return null;
    let hour = parseInt(match[1]);
    const minute = match[2] ? parseInt(match[2]) : 0;
    const period = match[3];
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return { hour, minute };
  } catch { return null; }
}

async function checkAllReminders() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // ── Check personal medicines from backend ──
  try {
    const token = await AsyncStorage.getItem('Cureconnect_token');
    const userStr = await AsyncStorage.getItem('Cureconnect_user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      const userId = user.id || user.uid;
      const res = await fetch(`${BASE_URL}/api/medicines/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const medicines = data.medicines || [];

      for (const med of medicines) {
        const timesRaw = med.reminder_times || med.reminderTimes || '';
        const times = Array.isArray(timesRaw)
          ? timesRaw
          : timesRaw.split(',').map(t => t.trim()).filter(Boolean);

        for (const timeStr of times) {
          const parsed = parseTime(timeStr);
          if (!parsed) continue;
          if (parsed.hour === currentHour && Math.abs(parsed.minute - currentMinute) <= 1) {
            Alert.alert(
              '💊 Medicine Reminder',
              `Time to take ${med.name}!`,
              [{ text: 'OK ✅' }]
            );
          }
        }
      }
    }
  } catch (e) {
    console.warn('Personal medicine reminder error:', e);
  }

  // ── Check family medicines from AsyncStorage ──
  try {
    const stored = await AsyncStorage.getItem(FAMILY_KEY);
    if (stored) {
      const members = JSON.parse(stored);
      for (const member of members) {
        if (!member.medicines_list) continue;
        const meds = JSON.parse(member.medicines_list);
        for (const med of meds) {
          const times = Array.isArray(med.times) ? med.times : [med.times];
          for (const timeStr of times) {
            const parsed = parseTime(timeStr);
            if (!parsed) continue;
            if (parsed.hour === currentHour && Math.abs(parsed.minute - currentMinute) <= 1) {
              Alert.alert(
                '💊 Family Medicine Reminder',
                `Time for ${member.name} to take ${med.name}!`,
                [{ text: 'OK ✅' }]
              );
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Family medicine reminder error:', e);
  }
}

export default function App() {
  const appState = useRef(AppState.currentState);
  const timerRef = useRef(null);

  useEffect(() => {
    checkAllReminders();
    timerRef.current = setInterval(checkAllReminders, 60 * 1000);

    const subscription = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkAllReminders();
      }
      appState.current = nextState;
    });

    return () => {
      clearInterval(timerRef.current);
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}