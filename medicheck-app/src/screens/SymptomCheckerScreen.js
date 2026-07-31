import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, SafeAreaView,
  Alert, Linking
} from 'react-native';
import * as Location from 'expo-location';
import useUserStore from '../store/userStore';
import { symptomsAPI, doctorsAPI } from '../services/api';
import { SYMPTOM_CHIPS, EMERGENCY_KEYWORDS, SYMPTOM_SPECIALIST_MAP } from '../utils/constants';

const MOCK_RESULTS = {
  'General Physician': {
    condition: 'Viral Infection / Fever', confidence: 87, severity: 'Moderate',
    advice: 'Rest well, stay hydrated and take paracetamol if needed. See a doctor if fever exceeds 103°F or persists beyond 3 days.',
  },
  'Neurologist': {
    condition: 'Tension Headache / Migraine', confidence: 79, severity: 'Mild',
    advice: 'Rest in a quiet dark room, stay hydrated and avoid screen time. See a neurologist if headaches are frequent.',
  },
  'Cardiologist': {
    condition: 'Cardiac Concern', confidence: 85, severity: 'Severe',
    advice: 'This could be serious. Please consult a cardiologist immediately. Call 108 if chest pain is severe.',
  },
  'Dermatologist': {
    condition: 'Skin Condition', confidence: 82, severity: 'Mild',
    advice: 'Avoid scratching and use mild soap. See a dermatologist for proper diagnosis and treatment.',
  },
  'ENT Specialist': {
    condition: 'ENT Infection', confidence: 81, severity: 'Mild',
    advice: 'Gargle with warm salt water, stay hydrated. See an ENT specialist if symptoms persist beyond a week.',
  },
  'Orthopedic': {
    condition: 'Musculoskeletal Issue', confidence: 78, severity: 'Moderate',
    advice: 'Rest the affected area, apply ice/heat. See an orthopedic specialist for persistent pain.',
  },
  'Gastroenterologist': {
    condition: 'Gastrointestinal Issue', confidence: 83, severity: 'Moderate',
    advice: 'Eat light foods, stay hydrated. See a gastroenterologist if symptoms persist beyond 2 days.',
  },
  'Diabetologist': {
    condition: 'Diabetes Related Issue', confidence: 80, severity: 'Moderate',
    advice: 'Monitor your blood sugar levels. Consult a diabetologist for proper management.',
  },
  'Gynecologist': {
    condition: 'Gynecological Concern', confidence: 78, severity: 'Moderate',
    advice: 'Please consult a gynecologist for proper diagnosis and treatment.',
  },
  'Pediatrician': {
    condition: 'Child Health Concern', confidence: 82, severity: 'Moderate',
    advice: 'Please consult a pediatrician for proper diagnosis and treatment.',
  },
  default: {
    condition: 'General Discomfort', confidence: 65, severity: 'Mild',
    advice: 'Monitor your symptoms. If they worsen or persist beyond 2 days, consult a doctor.',
  },
};

function getSpecialist(symptoms) {
  const lower = symptoms.toLowerCase();
  for (const [keyword, specialist] of Object.entries(SYMPTOM_SPECIALIST_MAP)) {
    if (lower.includes(keyword)) return specialist;
  }
  return 'General Physician';
}

function isEmergency(text) {
  return EMERGENCY_KEYWORDS.some(k => text.toLowerCase().includes(k));
}

const SEVERITY_CONFIG = {
  Mild: { color: '#2DC653', bg: '#E8FDF4', icon: '🟢' },
  Moderate: { color: '#F4A261', bg: '#FDF4E8', icon: '🟡' },
  Severe: { color: '#E63946', bg: '#FDE8E8', icon: '🔴' },
};

function SuggestedDoctorCard({ doctor }) {
  const callDoctor = () => {
    const cleanedPhone = doctor.phone ? doctor.phone.replace(/\s+/g, '') : '';
    Alert.alert(
      `Call ${doctor.name}`,
      `🏥 ${doctor.clinic}, ${doctor.area}\n📍 ${doctor.city}, ${doctor.state}\n🕐 ${doctor.timings}\n💰 ₹${doctor.fee}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '📞 Call Now', onPress: () => Linking.openURL(`tel:${cleanedPhone}`) },
      ]
    );
  };

  return (
    <View style={styles.suggestedCard}>
      <View style={styles.suggestedTop}>
        <View style={styles.suggestedIconBox}>
          <Text style={styles.suggestedIcon}>👨‍⚕️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.suggestedName}>{doctor.name}</Text>
          <Text style={styles.suggestedSpec}>{doctor.specialization}</Text>
          <View style={styles.suggestedMeta}>
            <Text style={styles.suggestedRating}>★ {doctor.rating}</Text>
            <Text style={styles.suggestedExp}>· {doctor.experience}</Text>
            <Text style={styles.suggestedFee}>· ₹{doctor.fee}</Text>
          </View>
        </View>
        {doctor.distance !== undefined && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{doctor.distance} km</Text>
          </View>
        )}
      </View>

      <View style={styles.suggestedDetails}>
        <View style={styles.suggestedDetailRow}>
          <Text style={styles.suggestedDetailIcon}>🏥</Text>
          <Text style={styles.suggestedDetailText}>{doctor.clinic}, {doctor.area}</Text>
        </View>
        <View style={styles.suggestedDetailRow}>
          <Text style={styles.suggestedDetailIcon}>📍</Text>
          <Text style={styles.suggestedDetailText}>{doctor.city}, {doctor.state}</Text>
        </View>
        <View style={styles.suggestedDetailRow}>
          <Text style={styles.suggestedDetailIcon}>🕐</Text>
          <Text style={styles.suggestedDetailText}>{doctor.timings}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.callBtn} onPress={callDoctor}>
        <Text style={styles.callBtnText}>📞 Call Doctor</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SymptomCheckerScreen({ navigation }) {
  const [input, setInput] = useState('');
  const [selectedChips, setSelectedChips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [suggestedDoctors, setSuggestedDoctors] = useState([]);
  const [recommendedSpec, setRecommendedSpec] = useState('');
  const [userLat, setUserLat] = useState(13.0827);
  const [userLng, setUserLng] = useState(80.2707);
  const [locationName, setLocationName] = useState('your area');
  const { setCurrentSymptoms, setAnalysisResults } = useUserStore();

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLat(loc.coords.latitude);
        setUserLng(loc.coords.longitude);

        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo && geo[0]) {
          setLocationName(geo[0].city || geo[0].subregion || 'your area');
        }
      }
    } catch (e) {
      console.warn('Location error:', e);
    }
  };

  const toggleChip = (chip) => {
    const label = chip.split(' ').slice(1).join(' ');
    setSelectedChips(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
    setInput(prev => {
      if (prev.includes(label)) return prev.replace(label, '').trim();
      return prev ? `${prev}, ${label}` : label;
    });
  };

  const analyze = async () => {
    const fullText = input.trim();
    if (!fullText) {
      Alert.alert('Enter Symptoms', 'Please describe your symptoms first.');
      return;
    }
    if (isEmergency(fullText)) {
      Alert.alert(
        '🚨 Emergency Detected',
        'Your symptoms may require immediate attention. Call 108 now!',
        [
          { text: 'Call 108', onPress: () => navigation.navigate('Emergency') },
          { text: 'Continue Anyway', style: 'cancel' },
        ]
      );
      return;
    }

    setLoading(true);
    setResult(null);
    setSuggestedDoctors([]);

    await new Promise(r => setTimeout(r, 2000));

    const specialist = getSpecialist(fullText);
    const res = MOCK_RESULTS[specialist] || MOCK_RESULTS.default;

    // Fetch nearby doctors based on GPS location
    try {
      const data = await doctorsAPI.getNearby(userLat, userLng, specialist, 50000);
      const nearby = (data.doctors || []).slice(0, 6);
      setSuggestedDoctors(nearby);
    } catch (e) {
      console.warn('Could not fetch nearby doctors:', e.message);
      setSuggestedDoctors([]);
    }

    setCurrentSymptoms(fullText);
    setAnalysisResults(res);
    setResult(res);
    setRecommendedSpec(specialist);

    // Save to backend
    try {
      await symptomsAPI.analyze(fullText);
    } catch (e) {
      console.log('Could not save to backend:', e.message);
    }

    setLoading(false);
  };

  const reset = () => {
    setInput('');
    setSelectedChips([]);
    setResult(null);
    setSuggestedDoctors([]);
    setRecommendedSpec('');
  };

  const sev = result ? SEVERITY_CONFIG[result.severity] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.bgCircle} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptom Checker</Text>
        <Text style={styles.headerSub}>📍 {locationName} — Describe how you're feeling</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>🗣️ DESCRIBE YOUR SYMPTOMS</Text>
          <TextInput
            style={styles.textArea}
            placeholder="e.g. I have a fever since yesterday with headache and body pain..."
            placeholderTextColor="#9CA3AF"
            multiline numberOfLines={4}
            value={input} onChangeText={setInput}
            textAlignVertical="top"
          />
          {input.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setInput('')}>
              <Text style={styles.clearText}>✕ Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chipsSection}>
          <Text style={styles.chipsTitle}>OR TAP COMMON SYMPTOMS</Text>
          <View style={styles.chipsWrap}>
            {SYMPTOM_CHIPS.map(chip => (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, selectedChips.includes(chip) && styles.chipActive]}
                onPress={() => toggleChip(chip)}
              >
                <Text style={[styles.chipText, selectedChips.includes(chip) && styles.chipTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.analyzeBtn, loading && { opacity: 0.7 }]}
          onPress={analyze}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={styles.analyzeBtnText}>Analyze Symptoms</Text>
                <Text style={styles.analyzeBtnIcon}>🔍</Text>
              </>
          }
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#0077B6" size="small" />
            <Text style={styles.loadingText}>🤖 AI is analyzing your symptoms...</Text>
          </View>
        )}

        {result && (
          <>
            <View style={styles.resultCard}>
              <View style={styles.resultTop}>
                <Text style={styles.resultTopText}>AI ANALYSIS COMPLETE</Text>
                <View style={[styles.severityPill, { backgroundColor: sev.bg }]}>
                  <Text style={styles.severityPillIcon}>{sev.icon}</Text>
                  <Text style={[styles.severityPillText, { color: sev.color }]}>{result.severity}</Text>
                </View>
              </View>

              <Text style={styles.conditionName}>{result.condition}</Text>

              <View style={styles.confidenceBox}>
                <View style={styles.confidenceHeader}>
                  <Text style={styles.confidenceLabel}>AI Confidence</Text>
                  <Text style={styles.confidenceValue}>{result.confidence}%</Text>
                </View>
                <View style={styles.confidenceTrack}>
                  <View style={[styles.confidenceFill, { width: `${result.confidence}%` }]} />
                </View>
              </View>

              <View style={styles.adviceBox}>
                <Text style={styles.adviceTitle}>💡 Medical Advice</Text>
                <Text style={styles.adviceText}>{result.advice}</Text>
              </View>

              <View style={styles.specBox}>
                <Text style={styles.specBoxText}>
                  👨‍⚕️ Recommended Specialist:
                  <Text style={styles.specBoxSpec}> {recommendedSpec}</Text>
                </Text>
              </View>

              <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                <Text style={styles.resetBtnText}>Check Again</Text>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                ⚠️ This is not a medical diagnosis. Always consult a qualified doctor.
              </Text>
            </View>

            <View style={styles.suggestedSection}>
              <View style={styles.suggestedHeader}>
                <Text style={styles.suggestedTitle}>Suggested {recommendedSpec}s</Text>
                <Text style={styles.suggestedSub}>
                  {suggestedDoctors.length > 0
                    ? `Near ${locationName}`
                    : 'No doctors found nearby'}
                </Text>
              </View>

              {suggestedDoctors.map(doctor => (
                <SuggestedDoctorCard key={doctor.id} doctor={doctor} />
              ))}

              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => navigation.navigate('Doctors')}
              >
                <Text style={styles.viewAllBtnText}>View All {recommendedSpec}s Near You →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#03045E', paddingBottom: 24, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  bgCircle: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#0077B6', opacity: 0.2, top: -60, right: -40,
  },
  backBtn: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  backText: { color: '#90E0EF', fontWeight: '600', fontSize: 14 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', paddingHorizontal: 20, marginTop: 4 },
  headerSub: { fontSize: 13, color: 'rgba(144,224,239,0.7)', paddingHorizontal: 20, marginTop: 4 },
  scroll: { flex: 1 },
  inputCard: {
    margin: 20, backgroundColor: '#fff', borderRadius: 20, padding: 18,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 10 },
  textArea: { fontSize: 14, color: '#03045E', minHeight: 100, lineHeight: 22 },
  clearBtn: { alignSelf: 'flex-end', marginTop: 8 },
  clearText: { fontSize: 12, color: '#E63946', fontWeight: '600' },
  chipsSection: { paddingHorizontal: 20, marginBottom: 20 },
  chipsTitle: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 12 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#03045E', borderColor: '#03045E' },
  chipText: { fontSize: 12, color: '#03045E', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  analyzeBtn: {
    marginHorizontal: 20, backgroundColor: '#03045E', borderRadius: 16,
    paddingVertical: 17, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginBottom: 16,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  analyzeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  analyzeBtnIcon: { fontSize: 18 },
  loadingCard: {
    marginHorizontal: 20, backgroundColor: '#E8F4FD', borderRadius: 14,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  loadingText: { color: '#0077B6', fontWeight: '600', fontSize: 13 },
  resultCard: {
    marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 24, padding: 22,
    gap: 16, shadowColor: '#03045E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
  },
  resultTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultTopText: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1.5 },
  severityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  severityPillIcon: { fontSize: 12 },
  severityPillText: { fontSize: 12, fontWeight: '700' },
  conditionName: { fontSize: 22, fontWeight: '800', color: '#03045E' },
  confidenceBox: { gap: 8 },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  confidenceLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  confidenceValue: { fontSize: 12, fontWeight: '800', color: '#0077B6' },
  confidenceTrack: { height: 8, backgroundColor: '#F0F4F8', borderRadius: 4, overflow: 'hidden' },
  confidenceFill: { height: '100%', backgroundColor: '#0077B6', borderRadius: 4 },
  adviceBox: {
    backgroundColor: '#F8FAFC', borderRadius: 14, padding: 16, gap: 8,
    borderLeftWidth: 3, borderLeftColor: '#0077B6',
  },
  adviceTitle: { fontSize: 13, fontWeight: '700', color: '#03045E' },
  adviceText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  specBox: { backgroundColor: '#E8F4FD', borderRadius: 12, padding: 12 },
  specBoxText: { fontSize: 13, color: '#03045E', fontWeight: '500' },
  specBoxSpec: { color: '#0077B6', fontWeight: '800' },
  resetBtn: {
    borderWidth: 1.5, borderColor: '#03045E',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  resetBtnText: { color: '#03045E', fontWeight: '700', fontSize: 13 },
  disclaimer: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 16 },
  suggestedSection: { marginHorizontal: 20, marginTop: 20, gap: 12 },
  suggestedHeader: { gap: 4 },
  suggestedTitle: { fontSize: 18, fontWeight: '800', color: '#03045E' },
  suggestedSub: { fontSize: 12, color: '#9CA3AF' },
  suggestedCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 12,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  suggestedTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  suggestedIconBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#F0F4F8', alignItems: 'center', justifyContent: 'center',
  },
  suggestedIcon: { fontSize: 30 },
  suggestedName: { fontSize: 15, fontWeight: '800', color: '#03045E' },
  suggestedSpec: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  suggestedMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  suggestedRating: { fontSize: 12, fontWeight: '700', color: '#F4A261' },
  suggestedExp: { fontSize: 12, color: '#9CA3AF' },
  suggestedFee: { fontSize: 12, color: '#0077B6', fontWeight: '700' },
  distanceBadge: {
    backgroundColor: '#E8F4FD', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  distanceText: { fontSize: 12, fontWeight: '700', color: '#0077B6' },
  suggestedDetails: { gap: 6 },
  suggestedDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  suggestedDetailIcon: { fontSize: 13 },
  suggestedDetailText: { fontSize: 12, color: '#6B7280', flex: 1 },
  callBtn: {
    backgroundColor: '#03045E', borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  viewAllBtn: {
    borderWidth: 1.5, borderColor: '#03045E', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  viewAllBtnText: { color: '#03045E', fontWeight: '700', fontSize: 14 },
});