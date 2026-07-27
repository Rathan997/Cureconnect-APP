import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DoctorsScreen from '../src/screens/DoctorsScreen';
import * as Location from 'expo-location';
import { doctorsAPI } from '../src/services/api';

jest.useFakeTimers();

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({ coords: { latitude: 13.0, longitude: 80.0 } })),
  reverseGeocodeAsync: jest.fn(() => Promise.resolve([{ city: 'Chennai' }])),
  Accuracy: { Balanced: 2 }
}));

jest.mock('../src/services/api', () => ({
  doctorsAPI: {
    getNearby: jest.fn(),
  },
}));

describe('DoctorsScreen UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and fetches doctors', async () => {
    doctorsAPI.getNearby.mockResolvedValueOnce({
      doctors: [
        {
          id: '1', name: 'Dr. Test Smith', specialization: 'Cardiologist',
          rating: 4.5, experience: '10 years', fee: '500', city: 'Chennai'
        }
      ]
    });

    const { getByText, getByTestId, queryByText, getAllByText } = render(<DoctorsScreen navigation={{}} />);
    
    // Initially shows loading
    expect(getByText('📍 Finding doctors near you...')).toBeTruthy();

    await waitFor(() => {
      expect(queryByText('📍 Finding doctors near you...')).toBeNull();
    });

    // Check doctor card renders
    expect(getByText('Dr. Test Smith')).toBeTruthy();
    expect(getAllByText('Cardiologist').length).toBeGreaterThan(0);
  });

  it('filters doctors by search text', async () => {
    doctorsAPI.getNearby.mockResolvedValueOnce({
      doctors: [
        { id: '1', name: 'Dr. Alpha', specialization: 'Cardiologist', city: 'Chennai' },
        { id: '2', name: 'Dr. Beta', specialization: 'Dermatologist', city: 'Chennai' }
      ]
    });

    const { getByText, getByTestId, queryByText } = render(<DoctorsScreen navigation={{}} />);
    
    await waitFor(() => {
      expect(getByText('Dr. Alpha')).toBeTruthy();
    });

    const searchInput = getByTestId('search-doctors');
    fireEvent.changeText(searchInput, 'Beta');

    expect(queryByText('Dr. Alpha')).toBeNull();
    expect(getByText('Dr. Beta')).toBeTruthy();
  });
});
