import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from '../store/userStore';
import { authAPI } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { setUser, setToken } = useUserStore();

  const switchMode = (newMode) => {
    Animated.spring(slideAnim, {
      toValue: newMode === 'login' ? 0 : 1,
      tension: 60, friction: 10, useNativeDriver: false,
    }).start();
    setMode(newMode);
  };

  const validate = () => {
    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.'); return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email.'); return false;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.'); return false;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.'); return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      await AsyncStorage.setItem('Cureconnect_token', data.access_token);
      await AsyncStorage.setItem('Cureconnect_user', JSON.stringify(data.user));
      setUser({ uid: data.user.id, name: data.user.name, email: data.user.email });
      setToken(data.access_token);
      navigation.replace('Main');
    } catch (e) {
      console.log('Login error:', e.message);
      Alert.alert('Login Failed', 'Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await authAPI.register(name, email, password);
      await AsyncStorage.setItem('Cureconnect_token', data.access_token);
      await AsyncStorage.setItem('Cureconnect_user', JSON.stringify(data.user));
      setUser({ uid: data.user.id, name: data.user.name, email: data.user.email });
      setToken(data.access_token);
      navigation.replace('Main');
    } catch (e) {
      console.log('Signup error:', e.message);
      Alert.alert('Signup Failed', e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          <View style={styles.logoBox}>
            <Text style={styles.logoPlus}>✚</Text>
          </View>
          <Text style={styles.headerTitle}>CureConnect</Text>
          <Text style={styles.headerSub}>Your personal health companion</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Toggle */}
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
              onPress={() => switchMode('login')}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                Log In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'signup' && styles.toggleBtnActive]}
              onPress={() => switchMode('signup')}
            >
              <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>
            {mode === 'login' ? 'Welcome back 👋' : 'Create account 🎉'}
          </Text>
          <Text style={styles.cardSub}>
            {mode === 'login'
              ? 'Sign in to continue to CureConnect'
              : 'Join thousands managing their health'}
          </Text>

          {mode === 'signup' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldIcon}>👤</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldIcon}>📧</Text>
              <TextInput
                testID="email-input"
                style={styles.fieldInput}
                placeholder="your@email.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldIcon}>🔒</Text>
              <TextInput
                testID="password-input"
                style={styles.fieldInput}
                placeholder="Min. 6 characters"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Text style={styles.showPassText}>{showPass ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {mode === 'signup' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldIcon}>🔒</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Re-enter password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPass}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            testID="login-submit"
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>
                  {mode === 'login' ? 'Sign In →' : 'Create Account →'}
                </Text>
            }
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity testID="signup-link" onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
            <Text style={styles.switchText}>
              {mode === 'login'
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Log In'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By continuing you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#03045E' },
  header: {
    paddingTop: 64, paddingBottom: 40, alignItems: 'center', gap: 10,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#0077B6', opacity: 0.2, top: -80, right: -60,
  },
  bgCircle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#00B4D8', opacity: 0.1, top: 20, left: -40,
  },
  logoBox: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: '#0077B6',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#00B4D8', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 16, elevation: 8,
  },
  logoPlus: { fontSize: 36, color: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: 'rgba(144,224,239,0.7)', letterSpacing: 0.5 },
  card: {
    flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 32,
    borderTopRightRadius: 32, padding: 28, gap: 16,
  },
  toggle: {
    flexDirection: 'row', backgroundColor: '#F0F4F8',
    borderRadius: 14, padding: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 11 },
  toggleBtnActive: {
    backgroundColor: '#03045E',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  toggleTextActive: { color: '#fff' },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#03045E' },
  cardSub: { fontSize: 13, color: '#9CA3AF', marginTop: -8 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    borderRadius: 14, paddingHorizontal: 16, height: 54, gap: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  fieldIcon: { fontSize: 16 },
  fieldInput: { flex: 1, fontSize: 15, color: '#03045E' },
  showPassText: { fontSize: 12, fontWeight: '700', color: '#0077B6' },
  submitBtn: {
    backgroundColor: '#03045E', borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchText: { textAlign: 'center', color: '#0077B6', fontSize: 13, fontWeight: '600' },
  disclaimer: { textAlign: 'center', color: '#D1D5DB', fontSize: 11, lineHeight: 16 },
  forgotText: { textAlign: 'right', color: '#0077B6', fontSize: 13, fontWeight: '600' },
});