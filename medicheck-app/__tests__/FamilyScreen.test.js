import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FamilyScreen from '../src/screens/FamilyScreen';
import { familyAPI } from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.useFakeTimers();

jest.mock('../src/services/api', () => ({
  familyAPI: {
    getAll: jest.fn(),
    add: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    checkIn: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../src/store/userStore', () => () => ({
  user: { uid: 1, name: 'Test User' },
}));

describe('FamilyScreen UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with no members initially', async () => {
    familyAPI.getAll.mockResolvedValueOnce({ members: [] });

    const { getByText } = render(<FamilyScreen navigation={{}} />);
    
    // Initially shows loading
    expect(getByText('Loading family members...')).toBeTruthy();

    await waitFor(() => {
      expect(getByText('No family members yet')).toBeTruthy();
    });
  });

  it('renders fetched family members', async () => {
    familyAPI.getAll.mockResolvedValueOnce({
      members: [
        {
          id: '1', name: 'John Doe', age: '30', relation: 'Brother',
          blood_group: 'O+', conditions: 'None', last_check_in: new Date().toISOString()
        }
      ]
    });

    const { getByText, queryByText } = render(<FamilyScreen navigation={{}} />);

    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
    });

    expect(getByText('Brother')).toBeTruthy();
  });

  it('opens add member modal and submits', async () => {
    familyAPI.getAll.mockResolvedValueOnce({ members: [] });
    familyAPI.add.mockResolvedValueOnce({ success: true });

    const { getByText, getByPlaceholderText } = render(<FamilyScreen navigation={{}} />);

    await waitFor(() => {
      expect(getByText('➕ Add First Member')).toBeTruthy();
    });

    fireEvent.press(getByText('➕ Add First Member'));

    expect(getByText('Add Family Member')).toBeTruthy();

    const nameInput = getByPlaceholderText('e.g. Rajesh Kumar');
    fireEvent.changeText(nameInput, 'Alice Doe');

    const ageInput = getByPlaceholderText('e.g. 65');
    fireEvent.changeText(ageInput, '28');

    const relationBtn = getByText('Sister');
    fireEvent.press(relationBtn);

    const addBtn = getByText('Add Member');
    fireEvent.press(addBtn);

    await waitFor(() => {
      expect(familyAPI.add).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Alice Doe',
        age: '28',
        relation: 'Sister'
      }));
    });
  });
});
