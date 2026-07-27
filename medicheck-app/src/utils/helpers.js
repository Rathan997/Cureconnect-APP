import { Linking, Alert } from 'react-native';
import { EMERGENCY_NUMBER, EMERGENCY_KEYWORDS } from './constants';

export const callEmergency = () => {
  Alert.alert(
    '🚨 Emergency Call',
    `Call ${EMERGENCY_NUMBER} (Ambulance)?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', style: 'destructive', onPress: () => Linking.openURL(`tel:${EMERGENCY_NUMBER}`) },
    ]
  );
};

export const callDoctor = (phone) => {
  Linking.openURL(`tel:${phone}`).catch(() =>
    Alert.alert('Error', 'Unable to make call')
  );
};

export const openGoogleMaps = (lat, lng, label) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  Linking.openURL(url).catch(() =>
    Alert.alert('Error', 'Unable to open Google Maps')
  );
};

export const isEmergency = (symptoms) => {
  const lower = symptoms.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const sanitizeInput = (text) =>
  text.replace(/[<>{}]/g, '').trim().slice(0, 500);

export const getNext7Days = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: days[d.getDay()],
      date: d.getDate(),
      full: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
  });
};