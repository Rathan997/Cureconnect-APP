import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Alert, AppState, LogBox, Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';

// Suppress push notification warnings that are irrelevant for local reminders in Expo Go
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { BASE_URL } from './src/services/api';
import { syncMedicinesWithLocalNotifications } from './src/services/notifications';

const FAMILY_KEY = 'Cureconnect_family';
const MEDICINES_KEY = 'Cureconnect_medicines';

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
        window.alert(title + '\n' + body);
      }
    } else {
      window.alert(title + '\n' + body);
    }
  } else {
    window.alert(title + '\n' + body);
  }
}

export default function App() {
  const appState = useRef(AppState.currentState);
  const timerRef = useRef(null);
  const triggeredRef = useRef({});
  const [activeReminder, setActiveReminder] = useState(null);

  const checkAllReminders = async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const dateStr = now.toDateString();

    // ── Check personal medicines ──
    let medicines = [];
    try {
      const token = await AsyncStorage.getItem('Cureconnect_token');
      const userStr = await AsyncStorage.getItem('Cureconnect_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        const userId = user.id || user.uid;
        const res = await fetch(`${BASE_URL}/api/medicines/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          medicines = data.medicines || [];
          await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(medicines));
          if (Platform.OS !== 'web') {
            await syncMedicinesWithLocalNotifications(medicines);
          }
        }
      }
    } catch (e) {
      console.warn('Personal medicine backend reminder error:', e);
    }

    // Merge with local medicines from AsyncStorage (fallback/offline)
    try {
      const localMedsStr = await AsyncStorage.getItem(MEDICINES_KEY);
      if (localMedsStr) {
        const localMeds = JSON.parse(localMedsStr);
        for (const med of localMeds) {
          if (!medicines.some(m => m.id === med.id || m.name === med.name)) {
            medicines.push(med);
          }
        }
      }
    } catch (e) {
      console.warn('Personal medicine local storage reminder error:', e);
    }

    // Process personal medicines
    for (const med of medicines) {
      const timesRaw = med.reminder_times || med.reminderTimes || '';
      const times = Array.isArray(timesRaw)
        ? timesRaw
        : typeof timesRaw === 'string'
        ? timesRaw.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      for (const timeStr of times) {
        const parsed = parseTime(timeStr);
        if (!parsed) continue;

        const triggeredKey = `personal_${med.id || med.name}_${timeStr}_${dateStr}`;
        if (triggeredRef.current[triggeredKey]) continue;

        if (parsed.hour === currentHour && Math.abs(parsed.minute - currentMinute) <= 1) {
          triggeredRef.current[triggeredKey] = true;
          const title = '💊 Medicine Reminder';
          const body = `Time to take your medicine: ${med.name}${med.generic && med.generic !== 'N/A' ? ' (' + med.generic + ')' : ''}`;
          
          // Trigger native notification
          if (Platform.OS !== 'web') {
            Notifications.scheduleNotificationAsync({
              content: { title, body, sound: true, priority: 'max', color: '#03045E' },
              trigger: null,
            }).catch(err => console.warn(err));
          } else {
            showWebNotification(title, body);
          }

          // Trigger in-app alert
          setActiveReminder({ title, body, medicine: med });
        }
      }
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

              const triggeredKey = `family_${member.id || member.name}_${med.id || med.name}_${timeStr}_${dateStr}`;
              if (triggeredRef.current[triggeredKey]) continue;

              if (parsed.hour === currentHour && Math.abs(parsed.minute - currentMinute) <= 1) {
                triggeredRef.current[triggeredKey] = true;
                const title = '💊 Family Medicine Reminder';
                const body = `Time for ${member.name} to take ${med.name}!`;
                
                // Trigger native notification
                if (Platform.OS !== 'web') {
                  Notifications.scheduleNotificationAsync({
                    content: { title, body, sound: true, priority: 'max', color: '#03045E' },
                    trigger: null,
                  }).catch(err => console.warn(err));
                } else {
                  showWebNotification(title, body);
                }

                // Trigger in-app alert
                setActiveReminder({ title, body, medicine: med, memberName: member.name });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Family medicine reminder error:', e);
    }
  };

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

        {/* Global Premium In-App Reminder Modal */}
        {activeReminder && (
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
              <Text style={styles.alertIcon}>💊</Text>
              <Text style={styles.alertTitle}>{activeReminder.title}</Text>
              <Text style={styles.alertBody}>{activeReminder.body}</Text>
              {activeReminder.medicine?.instructions ? (
                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsText}>
                    💡 {activeReminder.medicine.instructions}
                  </Text>
                </View>
              ) : null}
              <View style={styles.alertButtons}>
                <TouchableOpacity 
                  style={styles.alertBtnDismiss} 
                  onPress={() => setActiveReminder(null)}
                >
                  <Text style={styles.alertBtnDismissText}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.alertBtnAction} 
                  onPress={() => {
                    setActiveReminder(null);
                    if (Platform.OS === 'web') {
                      window.alert("Logged: Medicine taken successfully!");
                    } else {
                      Alert.alert("Success", "Medicine marked as taken!");
                    }
                  }}
                >
                  <Text style={styles.alertBtnActionText}>I Took It</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 4, 94, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#03045E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  alertIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#03045E',
    textAlign: 'center',
    marginBottom: 6,
  },
  alertBody: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  instructionsBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 20,
  },
  instructionsText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
    textAlign: 'center',
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertBtnDismiss: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  alertBtnDismissText: {
    color: '#9CA3AF',
    fontWeight: '600',
    fontSize: 13,
  },
  alertBtnAction: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#03045E',
    alignItems: 'center',
  },
  alertBtnActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});