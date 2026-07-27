import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SymptomCheckerScreen from '../src/screens/SymptomCheckerScreen';
import * as Location from 'expo-location';

jest.useFakeTimers();

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({ coords: { latitude: 13.0, longitude: 80.0 } })),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([{ city: 'Chennai' }])),
  Accuracy: { Balanced: 2 }
}));

jest.mock('../src/store/userStore', () => () => ({
  setCurrentSymptoms: jest.fn(),
  setAnalysisResults: jest.fn(),
}));

jest.mock('../src/services/api', () => ({
  symptomsAPI: {
    analyze: jest.fn(() => Promise.resolve({ id: 1 })),
  },
  doctorsAPI: {
    getNearby: jest.fn(() => Promise.resolve({ doctors: [] })),
  },
}));

describe('SymptomCheckerScreen UI Tests', () => {
  it('renders correctly and loads location', async () => {
    const { getByText, getByPlaceholderText } = render(<SymptomCheckerScreen navigation={{}} />);
    
    expect(getByText('Symptom Checker')).toBeTruthy();
    expect(getByPlaceholderText('e.g. I have a fever since yesterday with headache and body pain...')).toBeTruthy();
    
    // Wait for location to resolve
    await waitFor(() => {
      expect(getByText('📍 Chennai — Describe how you\'re feeling')).toBeTruthy();
    });
  });

  it('adds symptom chips to input correctly', () => {
    const { getByText, getByPlaceholderText } = render(<SymptomCheckerScreen navigation={{}} />);
    
    const chip = getByText('🌡️ Fever');
    fireEvent.press(chip);

    const input = getByPlaceholderText('e.g. I have a fever since yesterday with headache and body pain...');
    expect(input.props.value).toBe('Fever');
    
    // Toggle off
    fireEvent.press(chip);
    expect(input.props.value).toBe('');
  });
});
