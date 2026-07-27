import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EmergencyScreen from '../src/screens/EmergencyScreen';
import { Linking, Alert } from 'react-native';

jest.useFakeTimers();

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Linking.openURL = jest.fn();
  return RN;
});

describe('EmergencyScreen UI Tests', () => {
  it('renders emergency buttons correctly', () => {
    const { getByText } = render(<EmergencyScreen navigation={{}} />);
    
    expect(getByText('Ambulance')).toBeTruthy();
    expect(getByText('Police')).toBeTruthy();
    expect(getByText('Fire')).toBeTruthy();
    expect(getByText('First Aid Guide')).toBeTruthy();
  });

  it('calls correct URL when clicking Ambulance button and confirming Alert', () => {
    // Spy on Alert.alert to simulate pressing the call button
    jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      // Find the Call button and trigger its onPress
      const callBtn = buttons.find(b => b.style === 'destructive');
      if (callBtn && callBtn.onPress) {
        callBtn.onPress();
      }
    });

    const { getByText } = render(<EmergencyScreen navigation={{}} />);
    
    // Press the SOS Ambulance button (we can target "SOS" or "Ambulance")
    const ambulanceBtn = getByText('Ambulance');
    fireEvent.press(ambulanceBtn);

    expect(Alert.alert).toHaveBeenCalled();
    expect(Linking.openURL).toHaveBeenCalledWith('tel:108');
    
    Alert.alert.mockRestore();
  });
});
