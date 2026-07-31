import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
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
  if (Platform.OS === 'web') return false;
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

    const timesRaw = medicine.reminderTimes || [];
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
        },
        trigger: {
          hour: parsed.hour,
          minute: parsed.minute,
          repeats: true,
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

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: { medicineId: medicine.id, type: 'expiry' },
        sound: true,
        color: '#E63946',
      },
      trigger: triggerDate,
    });
    console.log(`Scheduled expiry alert for ${medicine.name} on ${triggerDate.toDateString()}`);
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
  if (Platform.OS === 'web') return;
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