import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Alert, AppState, LogBox, Platform } from 'react-native';

// Suppress push notification warnings that are irrelevant for local reminders in Expo Go
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { BASE_URL } from './src/services/api';

const FAMILY_KEY = 'Cureconnect_family';

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

async function showWebNotification(title, body) {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (window.Notification.permission === 'granted') {
      new window.Notification(title, { body });
    } else if (window.Notification.permission !== 'denied') {
      const permission = await window.Notification.requestPermission();
      if (permission === 'granted') {
        new window.Notification(title, { body });
      } else {
        Alert.alert(title, body);
      }
    } else {
      Alert.alert(title, body);
    }
  } else {
    Alert.alert(title, body);
  }
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
            if (Platform.OS !== 'web') {
              Notifications.scheduleNotificationAsync({
                content: {
                  title: '💊 Medicine Reminder',
                  body: `Time to take ${med.name}!`,
                  sound: true,
                  priority: 'max',
                  color: '#03045E',
                },
                trigger: null,
              }).catch(err => console.warn(err));
            } else {
              showWebNotification(
                '💊 Medicine Reminder',
                `Time to take ${med.name}!`
              );
            }
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
              if (Platform.OS !== 'web') {
                Notifications.scheduleNotificationAsync({
                  content: {
                    title: '💊 Family Medicine Reminder',
                    body: `Time for ${member.name} to take ${med.name}!`,
                    sound: true,
                    priority: 'max',
                    color: '#03045E',
                  },
                  trigger: null,
                }).catch(err => console.warn(err));
              } else {
                showWebNotification(
                  '💊 Family Medicine Reminder',
                  `Time for ${member.name} to take ${med.name}!`
                );
              }
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
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission !== 'granted' && window.Notification.permission !== 'denied') {
        window.Notification.requestPermission();
      }
    }

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