export const requestNotificationPermission = async () => true;

export const scheduleMedicineReminder = async (medicine) => [];

export const scheduleExpiryAlert = async (medicine) => null;

export const cancelMedicineReminders = async (medicineId) => {};

export const cancelAllNotifications = async () => {};

export const getScheduledNotifications = async () => [];

export const sendTestNotification = async () => {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 CureConnect Medicine Reminder',
        body: 'Time to take your medicine! Stay healthy 🌟',
        data: { type: 'test' },
        sound: 'default',
        color: '#03045E',
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('Test notification error:', e);
  }
};