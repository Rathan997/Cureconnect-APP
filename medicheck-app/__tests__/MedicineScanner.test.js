import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MedicineScanner from '../src/screens/MedicineScanner';
import { medicineAPI } from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.useFakeTimers();

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

jest.mock('../src/services/notifications', () => ({
  scheduleMedicineReminder: jest.fn(),
  scheduleExpiryAlert: jest.fn(),
  cancelMedicineReminders: jest.fn(),
  requestNotificationPermission: jest.fn(),
  sendTestNotification: jest.fn(),
}));

jest.mock('../src/services/api', () => ({
  medicineAPI: {
    getAll: jest.fn(),
    add: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../src/store/userStore', () => () => ({
  user: { uid: 1, name: 'Test User' },
}));

describe('MedicineScanner UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders scanner view initially', () => {
    medicineAPI.getAll.mockResolvedValueOnce({ medicines: [] });
    const { getByText } = render(<MedicineScanner navigation={{}} />);
    
    expect(getByText('Point camera at medicine barcode')).toBeTruthy();
    expect(getByText('✏️ Add Manually')).toBeTruthy();
  });

  it('opens manual add modal when button is pressed', () => {
    medicineAPI.getAll.mockResolvedValueOnce({ medicines: [] });
    const { getByText, getByTestId } = render(<MedicineScanner navigation={{}} />);
    
    const manualBtn = getByTestId('add-medicine-btn');
    fireEvent.press(manualBtn);

    expect(getByText('Add Medicine Manually')).toBeTruthy();
  });

  it('adds medicine manually correctly', async () => {
    medicineAPI.getAll.mockResolvedValueOnce({ medicines: [] });
    medicineAPI.add.mockResolvedValueOnce({ success: true });
    
    const { getByText, getByTestId } = render(<MedicineScanner navigation={{}} />);
    
    // Open modal
    fireEvent.press(getByTestId('add-medicine-btn'));

    // Fill form
    fireEvent.changeText(getByTestId('medicine-name-input'), 'Dolo 650');
    fireEvent.changeText(getByTestId('medicine-expiry-input'), '12/2026');

    // Submit form
    fireEvent.press(getByTestId('medicine-submit'));

    await waitFor(() => {
      expect(medicineAPI.add).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Dolo 650',
        expiry: '12/2026'
      }));
    });
  });
});
