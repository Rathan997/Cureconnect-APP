import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../src/screens/DashboardScreen';
import { medicineAPI, familyAPI } from '../src/services/api';

jest.useFakeTimers();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(),
}));

jest.mock('../src/store/userStore', () => () => ({
  user: { uid: 1, name: 'Test User' },
}));

jest.mock('../src/services/api', () => ({
  medicineAPI: {
    getAll: jest.fn(),
  },
  familyAPI: {
    getAll: jest.fn(),
  },
}));

describe('DashboardScreen UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard correctly with fetched data', async () => {
    medicineAPI.getAll.mockResolvedValueOnce({
      medicines: [
        { id: 1, name: 'Paracetamol', expiry: '12/2026' }
      ]
    });
    
    familyAPI.getAll.mockResolvedValueOnce({
      members: [
        { id: 1, name: 'Mom', last_check_in: new Date().toISOString() }
      ]
    });

    const { getByTestId, getByText, findAllByText } = render(<DashboardScreen navigation={{}} />);

    // Wait for async load to finish
    await waitFor(() => {
      expect(getByTestId('dashboard-title')).toBeTruthy();
    });

    // Check if the greeting exists (e.g. "Good Morning", "Good Afternoon", "Good Evening")
    const greetings = ['Good Morning', 'Good Afternoon', 'Good Evening'];
    const foundGreeting = greetings.some(g => {
      try {
        return getByText(`${g} 👋`);
      } catch {
        return false;
      }
    });
    expect(foundGreeting).toBe(true);

    // Look for stats
    // Total medicines should be 1
    const totalMedsLabel = await findAllByText('1');
    expect(totalMedsLabel.length).toBeGreaterThan(0);
  });
});
