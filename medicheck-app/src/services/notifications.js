import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Helper function to parse time strings like "8:00 AM" or "14:30"
function parseTime(timeStr) {
  try {
    const upper = timeStr.toUpperCase().trim();
    const match = upper.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2]) : 0;
    const period = match[3];
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return { hour, minute };
  } catch {
    return null;
  }
}

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (window.Notification.permission === 'granted') {
          return true;
        }
        if (window.Notification.permission !== 'denied') {
          const permission = await window.Notification.requestPermission();
          return permission === 'granted';
        }
      }
    } catch (e) {
      console.warn('Web notification permission error:', e);
    }
    return false;
  }
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted!');
      return false;
    }

    // Configure channel for Android devices
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7A',
      });
    }
    return true;
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
    return false;
  }
};

export const scheduleMedicineReminder = async (medicine) => {
  if (Platform.OS === 'web') return [];
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return [];

    const timesRaw = medicine.reminderTimes || medicine.reminder_times || [];
    const times = Array.isArray(timesRaw)
      ? timesRaw
      : typeof timesRaw === 'string'
        ? timesRaw.split(',').map(t => t.trim()).filter(Boolean)
        : [];

    const scheduledIds = [];
    for (const timeStr of times) {
      const parsed = parseTime(timeStr);
      if (!parsed) continue;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medicine Reminder',
          body: `Time to take your medicine: ${medicine.name} (${medicine.generic || ''})`,
          data: { medicineId: medicine.id, type: 'reminder', time: timeStr },
          sound: true,
          priority: 'max',
          color: '#03045E',
          android: {
            channelId: 'default',
          },
        },
        trigger: {
          type: 'daily',
          hour: parsed.hour,
          minute: parsed.minute,
        },
      });
      scheduledIds.push(id);
    }
    console.log(`Scheduled ${scheduledIds.length} reminders for medicine: ${medicine.name}`);
    return scheduledIds;
  } catch (e) {
    console.warn('Error scheduling medicine reminder:', e);
    return [];
  }
};

export const scheduleExpiryAlert = async (medicine) => {
  if (Platform.OS === 'web') return null;
  if (!medicine.expiry) return null;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const parts = medicine.expiry.split('/');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    const expiryDate = new Date(year, month - 1, day);
    const now = new Date();

    let triggerDate = new Date(expiryDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    let title = '⚠️ Medicine Expiring Soon';
    let body = `Your medicine "${medicine.name}" will expire on ${medicine.expiry}!`;

    if (expiryDate <= now) {
      // Already expired! Notify immediately (5s delay)
      triggerDate = new Date(Date.now() + 5000);
      title = '❌ Medicine Expired';
      body = `Your medicine "${medicine.name}" has expired (on ${medicine.expiry})!`;
    } else if (triggerDate <= now) {
      // Expiring in less than 7 days! Notify immediately (5s delay)
      triggerDate = new Date(Date.now() + 5000);
      title = '⚠️ Medicine Expiring Soon';
      body = `Your medicine "${medicine.name}" expires soon on ${medicine.expiry}!`;
    }

    // Calculate relative seconds until trigger date
    const secondsRemaining = Math.max(1, Math.round((triggerDate.getTime() - Date.now()) / 1000));

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: { medicineId: medicine.id, type: 'expiry' },
        sound: true,
        color: '#E63946',
        android: {
          channelId: 'default',
        },
      },
      trigger: {
        type: 'timeInterval',
        seconds: secondsRemaining,
        repeats: false,
      },
    });
    console.log(`Scheduled expiry alert for ${medicine.name} in ${secondsRemaining} seconds`);
    return id;
  } catch (e) {
    console.warn('Error scheduling expiry alert:', e);
    return null;
  }
};

export const cancelMedicineReminders = async (medicineId) => {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    let count = 0;
    for (const notification of scheduled) {
      if (notification.content.data?.medicineId === medicineId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        count++;
      }
    }
    console.log(`Cancelled ${count} notifications for medicineId: ${medicineId}`);
  } catch (e) {
    console.warn('Error cancelling medicine reminders:', e);
  }
};

export const cancelAllNotifications = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all notifications');
  } catch (e) {
    console.warn('Error cancelling all notifications:', e);
  }
};

export const getScheduledNotifications = async () => {
  if (Platform.OS === 'web') return [];
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('Error getting scheduled notifications:', e);
    return [];
  }
};

export const sendTestNotification = async () => {
  if (Platform.OS === 'web') {
    try {
      let shown = false;
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (window.Notification.permission === 'granted') {
          new window.Notification('💊 CureConnect Medicine Reminder', {
            body: 'Time to take your medicine! Stay healthy 🌟',
          });
          shown = true;
        } else if (window.Notification.permission !== 'denied') {
          const permission = await window.Notification.requestPermission();
          if (permission === 'granted') {
            new window.Notification('💊 CureConnect Medicine Reminder', {
              body: 'Time to take your medicine! Stay healthy 🌟',
            });
            shown = true;
          }
        }
      }

      window.alert(
        '🔔 Test Notification Triggered!\n\n' +
        'If a desktop banner did not appear at the edge of your screen, check:\n' +
        '1. Browser address bar permissions (make sure Notifications are allowed)\n' +
        '2. Your computer system settings (make sure Focus Assist or Do Not Disturb is turned off)'
      );
    } catch (e) {
      window.alert('🔔 CureConnect Reminder:\nTime to take your medicine! Stay healthy 🌟');
    }
    return;
  }
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 CureConnect Medicine Reminder',
        body: 'Time to take your medicine! Stay healthy 🌟',
        data: { type: 'test' },
        sound: true,
        color: '#03045E',
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('Test notification error:', e);
  }
};

export const syncMedicinesWithLocalNotifications = async (backendMedicines) => {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    // Create sets/maps of already scheduled combinations
    // Key format: `reminder_${medicineId}_${time}` or `expiry_${medicineId}`
    const scheduledKeys = new Set();
    const scheduledNotificationIds = {}; // medicineId -> array of identifiers
    
    for (const notification of scheduled) {
      const data = notification.content.data;
      if (data && data.medicineId) {
        if (!scheduledNotificationIds[data.medicineId]) {
          scheduledNotificationIds[data.medicineId] = [];
        }
        scheduledNotificationIds[data.medicineId].push(notification.identifier);

        if (data.type === 'reminder') {
          const key = `reminder_${data.medicineId}_${data.time}`;
          scheduledKeys.add(key);
        } else if (data.type === 'expiry') {
          const key = `expiry_${data.medicineId}`;
          scheduledKeys.add(key);
        }
      }
    }

    // List of active medicine IDs on backend
    const activeBackendIds = new Set(backendMedicines.map(m => m.id));

    // 1. Cancel notifications for medicines that were deleted on backend
    for (const medicineId in scheduledNotificationIds) {
      if (!activeBackendIds.has(medicineId)) {
        console.log(`Medicine ${medicineId} not in backend list, cancelling scheduled notifications...`);
        for (const identifier of scheduledNotificationIds[medicineId]) {
          await Notifications.cancelScheduledNotificationAsync(identifier);
        }
      }
    }

    // 2. Schedule reminders and expiry alerts for medicines that don't have them scheduled yet
    for (const med of backendMedicines) {
      // Normalize times
      const timesRaw = med.reminder_times || med.reminderTimes || '';
      const times = Array.isArray(timesRaw)
        ? timesRaw
        : typeof timesRaw === 'string'
        ? timesRaw.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      // Check if reminders are scheduled
      let needsReminderScheduling = false;
      for (const timeStr of times) {
        const key = `reminder_${med.id}_${timeStr}`;
        if (!scheduledKeys.has(key)) {
          needsReminderScheduling = true;
          break;
        }
      }

      if (needsReminderScheduling && times.length > 0) {
        // Cancel existing reminders for this medicine first to avoid duplicate schedules
        if (scheduledNotificationIds[med.id]) {
          for (const notification of scheduled) {
            if (notification.content.data?.medicineId === med.id && notification.content.data?.type === 'reminder') {
              await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            }
          }
        }
        console.log(`Scheduling reminders for synced medicine: ${med.name}`);
        await scheduleMedicineReminder(med);
      }

      // Check if expiry is scheduled
      if (med.expiry) {
        const expiryKey = `expiry_${med.id}`;
        if (!scheduledKeys.has(expiryKey)) {
          console.log(`Scheduling expiry alert for synced medicine: ${med.name}`);
          await scheduleExpiryAlert(med);
        }
      }
    }
  } catch (e) {
    console.warn('Error syncing medicines with local notifications:', e);
  }
};