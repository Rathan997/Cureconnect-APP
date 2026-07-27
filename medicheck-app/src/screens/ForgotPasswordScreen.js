import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { authAPI } from '../services/api';

const STEPS = {
  EMAIL: 'email',
  OTP: 'otp',
  RESET: 'reset',
  SUCCESS: 'success',
};

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 1 — send OTP via real email
  const handleSendOtp = async () => {
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setStep(STEPS.OTP);
      Alert.alert(
        '📧 OTP Sent!',
        `A 6-digit OTP has been sent to\n${email}\n\nPlease check your inbox!`,
        [{ text: 'Got it!' }]
      );
    } catch (e) {
      Alert.alert('Error', e.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  // Step 2 — verify OTP via backend
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
      return;
    }
    setStep(STEPS.RESET);
  };

  // Step 3 — reset password via backend
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(email, otp, newPassword);
      setStep(STEPS.SUCCESS);
    } catch (e) {
      Alert.alert('Error', e.message || 'Invalid or expired OTP. Please try again.');
    }
    setLoading(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtp('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      Alert.alert(
        '📧 New OTP Sent!',
        `A new OTP has been sent to ${email}. Please check your inbox!`,
        [{ text: 'Got it!' }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not resend OTP. Please try again.');
    }
    setLoading(false);
  };

  const renderStep = () => {
    switch (step) {
      case STEPS.EMAIL:
        return (
          <>
            <View style={styles.iconBox}>
              <Text style={styles.stepIcon}>📧</Text>
            </View>
            <Text style={styles.stepTitle}>Forgot Password?</Text>
            <Text style={styles.stepSub}>
              Enter your registered email and we'll send a 6-digit OTP to reset your password.
            </Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldIcon}>📧</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="your@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Send OTP to Email →</Text>
              }
            </TouchableOpacity>
          </>
        );

      case STEPS.OTP:
        return (
          <>
            <View style={styles.iconBox}>
              <Text style={styles.stepIcon}>🔐</Text>
            </View>
            <Text style={styles.stepTitle}>Check Your Email</Text>
            <Text style={styles.stepSub}>
              We sent a 6-digit OTP to{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
              {'\n\n'}Check your inbox and enter the OTP below.
            </Text>

            {/* Email hint box */}
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>
                📬 Check your spam/junk folder if you don't see it in inbox
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>6-DIGIT OTP</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldIcon}>🔢</Text>
                <TextInput
                  style={[styles.fieldInput, styles.otpInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor="#9CA3AF"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Verify OTP →</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleResendOtp}
              disabled={loading}
            >
              <Text style={styles.resendText}>
                {loading ? 'Sending...' : "Didn't receive it? Resend OTP"}
              </Text>
            </TouchableOpacity>
          </>
        );

      case STEPS.RESET:
        return (
          <>
            <View style={styles.iconBox}>
              <Text style={styles.stepIcon}>🔒</Text>
            </View>
            <Text style={styles.stepTitle}>Reset Password</Text>
            <Text style={styles.stepSub}>
              Create a strong new password for your account.
            </Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldIcon}>🔒</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#9CA3AF"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPass}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Text style={styles.showPassText}>{showPass ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>
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

            {newPassword.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBar}>
                  <View style={[
                    styles.strengthFill,
                    {
                      width: newPassword.length < 6 ? '25%'
                        : newPassword.length < 8 ? '50%'
                        : newPassword.length < 10 ? '75%' : '100%',
                      backgroundColor: newPassword.length < 6 ? '#E63946'
                        : newPassword.length < 8 ? '#F4A261'
                        : newPassword.length < 10 ? '#0096C7' : '#2DC653',
                    }
                  ]} />
                </View>
                <Text style={styles.strengthText}>
                  {newPassword.length < 6 ? 'Too short'
                    : newPassword.length < 8 ? 'Weak'
                    : newPassword.length < 10 ? 'Good' : 'Strong 💪'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Reset Password →</Text>
              }
            </TouchableOpacity>
          </>
        );

      case STEPS.SUCCESS:
        return (
          <>
            <View style={[styles.iconBox, { backgroundColor: '#E8FDF4' }]}>
              <Text style={styles.stepIcon}>✅</Text>
            </View>
            <Text style={styles.stepTitle}>Password Reset!</Text>
            <Text style={styles.stepSub}>
              Your password has been successfully reset.{'\n'}
              You can now log in with your new password.
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => navigation.replace('Login')}
            >
              <Text style={styles.btnText}>Back to Login →</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          <TouchableOpacity
            onPress={() => step === STEPS.EMAIL ? navigation.goBack() : setStep(STEPS.EMAIL)}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.stepsRow}>
            {[STEPS.EMAIL, STEPS.OTP, STEPS.RESET, STEPS.SUCCESS].map((s, i) => (
              <View key={s} style={styles.stepIndicatorWrap}>
                <View style={[
                  styles.stepDot,
                  step === s && styles.stepDotActive,
                  [STEPS.OTP, STEPS.RESET, STEPS.SUCCESS].includes(step) && s === STEPS.EMAIL && styles.stepDotDone,
                  [STEPS.RESET, STEPS.SUCCESS].includes(step) && s === STEPS.OTP && styles.stepDotDone,
                  step === STEPS.SUCCESS && s === STEPS.RESET && styles.stepDotDone,
                ]}>
                  <Text style={styles.stepDotText}>{i + 1}</Text>
                </View>
                {i < 3 && <View style={styles.stepLine} />}
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {renderStep()}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#03045E', paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#0077B6', opacity: 0.2, top: -60, right: -40,
  },
  bgCircle2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#00B4D8', opacity: 0.1, bottom: -40, left: -20,
  },
  backBtn: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  backText: { color: '#90E0EF', fontWeight: '600', fontSize: 14 },
  stepsRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 40,
  },
  stepIndicatorWrap: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
  },
  stepDotActive: { backgroundColor: '#0077B6', borderColor: '#00B4D8' },
  stepDotDone: { backgroundColor: '#2DC653', borderColor: '#2DC653' },
  stepDotText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepLine: {
    width: 40, height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    gap: 16, alignItems: 'center',
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
  },
  iconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#E8F4FD', alignItems: 'center', justifyContent: 'center',
  },
  stepIcon: { fontSize: 40 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: '#03045E', textAlign: 'center' },
  stepSub: {
    fontSize: 14, color: '#9CA3AF', textAlign: 'center',
    lineHeight: 22, width: '100%',
  },
  emailHighlight: { color: '#0077B6', fontWeight: '700' },
  hintBox: {
    backgroundColor: '#E8F4FD', borderRadius: 12,
    padding: 12, width: '100%',
  },
  hintText: { fontSize: 12, color: '#0077B6', fontWeight: '500', textAlign: 'center' },
  field: { gap: 6, width: '100%' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
    borderRadius: 14, paddingHorizontal: 16, height: 54, gap: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB', width: '100%',
  },
  fieldIcon: { fontSize: 16 },
  fieldInput: { flex: 1, fontSize: 15, color: '#03045E' },
  otpInput: { fontSize: 22, fontWeight: '700', letterSpacing: 8 },
  showPassText: { fontSize: 12, fontWeight: '700', color: '#0077B6' },
  strengthWrap: { width: '100%', gap: 6 },
  strengthBar: {
    height: 6, backgroundColor: '#F0F4F8',
    borderRadius: 3, overflow: 'hidden', width: '100%',
  },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  btn: {
    backgroundColor: '#03045E', borderRadius: 16, height: 56,
    alignItems: 'center', justifyContent: 'center', width: '100%',
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendBtn: { paddingVertical: 4 },
  resendText: { color: '#0077B6', fontSize: 13, fontWeight: '600' },
});