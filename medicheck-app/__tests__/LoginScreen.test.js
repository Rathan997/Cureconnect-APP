import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

jest.mock('../src/store/userStore', () => () => ({
  setUser: jest.fn(),
  setToken: jest.fn(),
}));

jest.mock('../src/services/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

jest.useFakeTimers();

describe('LoginScreen UI Tests', () => {
  it('renders login components correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen navigation={{}} />);
    
    expect(getByText('Welcome back 👋')).toBeTruthy();
    expect(getByPlaceholderText('your@email.com')).toBeTruthy();
    expect(getByPlaceholderText('Min. 6 characters')).toBeTruthy();
    expect(getByText('Sign In →')).toBeTruthy();
  });

  it('switches to signup mode when Sign Up toggle is pressed', () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = render(<LoginScreen navigation={{}} />);
    
    // Initially no name field
    expect(queryByPlaceholderText('Your full name')).toBeNull();

    // Press Sign Up toggle
    const signUpBtn = getByText('Sign Up');
    fireEvent.press(signUpBtn);

    // Now should see name field
    expect(getByPlaceholderText('Your full name')).toBeTruthy();
    expect(getByText('Create account 🎉')).toBeTruthy();
    expect(getByText('Create Account →')).toBeTruthy();
  });

  it('updates text inputs correctly', () => {
    const { getByPlaceholderText } = render(<LoginScreen navigation={{}} />);
    
    const emailInput = getByPlaceholderText('your@email.com');
    const passwordInput = getByPlaceholderText('Min. 6 characters');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
  });
});
