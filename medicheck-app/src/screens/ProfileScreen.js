import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from '../store/userStore';
import { userAPI } from '../services/api';

const PROFILE_KEY = 'Cureconnect_profile';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function ProfileScreen({ navigation }) {
  const { user, setUser, logout } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await userAPI.getProfile();
      setName(data.name || '');
      setPhone(data.phone || '');
      setAge(data.age || '');
      setGender(data.gender || '');
      setHeight(data.height || '');
      setWeight(data.weight || '');
      setBloodGroup(data.bloodGroup || '');
      setAllergies(data.allergies || '');
      setConditions(data.conditions || '');
      setEmergencyContact(data.emergency_contact || '');
    } catch (e) {
      // Fallback to local storage
      try {
        const stored = await AsyncStorage.getItem(PROFILE_KEY);
        if (stored) {
          const p = JSON.parse(stored);
          setName(p.name || user?.name || '');
          setPhone(p.phone || '');
          setAge(p.age || '');
          setGender(p.gender || '');
          setHeight(p.height || '');
          setWeight(p.weight || '');
          setBloodGroup(p.bloodGroup || '');
          setAllergies(p.allergies || '');
          setConditions(p.conditions || '');
          setEmergencyContact(p.emergencyContact || '');
        } else {
          setName(user?.name || '');
        }
      } catch (err) {
        setName(user?.name || '');
      }
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }
    setSaving(true);
    try {
      await userAPI.updateProfile({
        name: name.trim(),
        phone,
        age,
        gender,
        bloodGroup,
        height,
        weight,
        allergies,
        conditions,
        emergency_contact: emergencyContact,
      });
      setUser({ ...user, name: name.trim() });
      setEditing(false);
      Alert.alert('✅ Saved!', 'Your profile has been updated.');
    } catch (e) {
      // Fallback to local storage
      try {
        const profile = {
          name: name.trim(), phone, age, gender,
          height, weight, bloodGroup, allergies,
          conditions, emergencyContact,
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        setUser({ ...user, name: name.trim() });
        setEditing(false);
        Alert.alert('✅ Saved!', 'Your profile has been updated.');
      } catch (err) {
        Alert.alert('Error', 'Could not save profile.');
      }
    }
    setSaving(false);
  };

  const doLogout = async () => {
    try {
      await AsyncStorage.removeItem('Cureconnect_token');
      await AsyncStorage.removeItem('Cureconnect_user');
      await AsyncStorage.removeItem('Cureconnect_medicines');
      await AsyncStorage.removeItem('Cureconnect_family');
      await AsyncStorage.removeItem('Cureconnect_profile');
    } catch (e) {
      console.warn(e);
    }
    await logout();
    navigation.replace('Login');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // react-native-web 0.21 has Alert.alert() as a no-op.
      // Use window.confirm() which works on web and is testable via Selenium.
      if (window.confirm('Are you sure you want to log out?')) {
        doLogout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out', style: 'destructive',
          onPress: doLogout,
        }
      ]);
    }
  };

  const bmi = height && weight
    ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
    : null;

  const bmiCategory = bmi
    ? bmi < 18.5 ? { label: 'Underweight', color: '#0096C7' }
      : bmi < 25 ? { label: 'Normal', color: '#2DC653' }
      : bmi < 30 ? { label: 'Overweight', color: '#F4A261' }
      : { label: 'Obese', color: '#E63946' }
    : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#0077B6" size="large" />
          <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14 }}>
            Loading your profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name ? name[0].toUpperCase() : '?'}
              </Text>
            </View>
            <Text style={styles.headerName}>{name || 'Your Name'}</Text>
            <Text testID="profile-email" style={styles.headerEmail}>{user?.email || ''}</Text>
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>☁️ Synced to Cloud</Text>
            </View>
          </View>

          {/* BMI Card */}
          {bmi && (
            <View style={styles.bmiCard}>
              <View style={styles.bmiItem}>
                <Text style={styles.bmiValue}>{height} cm</Text>
                <Text style={styles.bmiLabel}>Height</Text>
              </View>
              <View style={styles.bmiDivider} />
              <View style={styles.bmiItem}>
                <Text style={styles.bmiValue}>{weight} kg</Text>
                <Text style={styles.bmiLabel}>Weight</Text>
              </View>
              <View style={styles.bmiDivider} />
              <View style={styles.bmiItem}>
                <Text style={[styles.bmiValue, { color: bmiCategory.color }]}>{bmi}</Text>
                <Text style={styles.bmiLabel}>{bmiCategory.label}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Edit Toggle */}
        <View style={styles.editRow}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <TouchableOpacity
            testID="edit-profile-btn"
            style={[styles.editBtn, editing && styles.editBtnActive]}
            onPress={() => editing ? saveProfile() : setEditing(true)}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.editBtnText}>{editing ? '💾 Save' : '✏️ Edit'}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.card}>
          <Field testID="profile-name" label="FULL NAME" icon="👤" value={name} onChange={setName} editing={editing} placeholder="Your full name" />
          <Field label="PHONE NUMBER" icon="📱" value={phone} onChange={setPhone} editing={editing} placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
          <Field label="AGE" icon="🎂" value={age} onChange={setAge} editing={editing} placeholder="e.g. 25" keyboardType="numeric" />

          {/* Gender */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>⚤ GENDER</Text>
            <View style={styles.pillRow}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.pill, gender === g && styles.pillActive, !editing && styles.pillDisabled]}
                  onPress={() => editing && setGender(g)}
                >
                  <Text style={[styles.pillText, gender === g && styles.pillTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Health Info */}
        <Text style={styles.sectionTitle2}>Health Information</Text>
        <View style={styles.card}>
          <Field label="HEIGHT (cm)" icon="📏" value={height} onChange={setHeight} editing={editing} placeholder="e.g. 170" keyboardType="numeric" />
          <Field label="WEIGHT (kg)" icon="⚖️" value={weight} onChange={setWeight} editing={editing} placeholder="e.g. 65" keyboardType="numeric" />

          {/* Blood Group */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>🩸 BLOOD GROUP</Text>
            <View style={styles.pillRow}>
              {BLOOD_GROUPS.map(bg => (
                <TouchableOpacity
                  key={bg}
                  style={[styles.pill, bloodGroup === bg && styles.pillBlood, !editing && styles.pillDisabled]}
                  onPress={() => editing && setBloodGroup(bg)}
                >
                  <Text style={[styles.pillText, bloodGroup === bg && styles.pillTextActive]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Field label="KNOWN ALLERGIES" icon="⚠️" value={allergies} onChange={setAllergies} editing={editing} placeholder="e.g. Penicillin, Peanuts" />
          <Field label="EXISTING CONDITIONS" icon="🏥" value={conditions} onChange={setConditions} editing={editing} placeholder="e.g. Diabetes, Hypertension" />
        </View>

        {/* Emergency */}
        <Text style={styles.sectionTitle2}>Emergency Contact</Text>
        <View style={styles.card}>
          <Field label="EMERGENCY CONTACT" icon="📞" value={emergencyContact} onChange={setEmergencyContact} editing={editing} placeholder="Name & phone number" />
        </View>

        {/* Cancel edit */}
        {editing && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => { setEditing(false); loadProfile(); }}
          >
            <Text style={styles.cancelBtnText}>Cancel Changes</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>CureConnect v1.0.0 · Made with ❤️ in Tamil Nadu</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ testID, label, icon, value, onChange, editing, placeholder, keyboardType }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{icon} {label}</Text>
      {editing ? (
        <TextInput
          testID={testID}
          style={styles.fieldInput}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType || 'default'}
        />
      ) : (
        <Text testID={testID} style={[styles.fieldValue, !value && styles.fieldEmpty]}>
          {value || 'Not set'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#03045E', paddingBottom: 24,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#0077B6', opacity: 0.2, top: -80, right: -60,
  },
  bgCircle2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#00B4D8', opacity: 0.1, bottom: -40, left: -40,
  },
  backBtn: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  backText: { color: '#90E0EF', fontWeight: '600', fontSize: 14 },
  avatarWrap: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#0077B6', alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(0,180,216,0.4)',
  },
  avatarText: { color: '#fff', fontSize: 38, fontWeight: '800' },
  headerName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerEmail: { fontSize: 13, color: 'rgba(144,224,239,0.7)' },
  syncBadge: {
    backgroundColor: 'rgba(0,180,216,0.15)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5, marginTop: 4,
    borderWidth: 1, borderColor: 'rgba(0,180,216,0.3)',
  },
  syncBadgeText: { fontSize: 11, color: '#90E0EF', fontWeight: '600' },
  bmiCard: {
    marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 16, flexDirection: 'row',
    justifyContent: 'space-around', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  bmiItem: { alignItems: 'center', gap: 4 },
  bmiValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  bmiLabel: { fontSize: 11, color: 'rgba(144,224,239,0.7)', fontWeight: '600' },
  bmiDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
  editRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#03045E' },
  sectionTitle2: {
    fontSize: 16, fontWeight: '800', color: '#03045E',
    paddingHorizontal: 20, marginTop: 20, marginBottom: 10,
  },
  editBtn: {
    backgroundColor: '#03045E', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  editBtnActive: { backgroundColor: '#0077B6' },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 20,
    padding: 18, gap: 16,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 },
  fieldInput: {
    backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14,
    height: 48, fontSize: 15, color: '#03045E',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  fieldValue: { fontSize: 15, color: '#03045E', fontWeight: '500', paddingVertical: 4 },
  fieldEmpty: { color: '#9CA3AF', fontStyle: 'italic' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F0F4F8', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  pillActive: { backgroundColor: '#03045E', borderColor: '#03045E' },
  pillBlood: { backgroundColor: '#E63946', borderColor: '#E63946' },
  pillDisabled: { opacity: 0.7 },
  pillText: { fontSize: 12, fontWeight: '600', color: '#03045E' },
  pillTextActive: { color: '#fff' },
  cancelBtn: {
    marginHorizontal: 20, marginTop: 12, borderWidth: 1.5,
    borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { color: '#9CA3AF', fontWeight: '600', fontSize: 14 },
  logoutBtn: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: '#FDE8E8',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  logoutText: { color: '#E63946', fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginTop: 16 },
});