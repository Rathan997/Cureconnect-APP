import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Location Required', 'Please enable location to find nearby doctors.');
    return false;
  }
  return true;
};

export const getCurrentLocation = async () => {
  const granted = await requestLocationPermission();
  if (!granted) return { lat: 13.0827, lng: 80.2707 };
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  };
};

export const openGoogleMaps = (lat, lng) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  Linking.openURL(url).catch(() =>
    Alert.alert('Error', 'Could not open Google Maps')
  );
};