import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, Animated, Dimensions
} from 'react-native';
import useUserStore from '../store/userStore';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { icon: '🩺', label: 'Symptom\nChecker', screen: 'SymptomChecker', color: '#0077B6', light: '#E8F4FD', testID: 'action-symptoms' },
  { icon: '👨‍⚕️', label: 'Find\nDoctors', screen: 'Doctors', color: '#023E8A', light: '#E8EDF8', testID: 'action-doctors' },
  { icon: '🚨', label: 'Emergency\nSOS', screen: 'Emergency', color: '#E63946', light: '#FDE8E8', testID: 'action-emergency' },
  { icon: '💊', label: 'My\nMedicines', screen: 'MedicineScanner', color: '#6A0572', light: '#F3E8FD', testID: 'action-medicines' },
  { icon: '📊', label: 'Health\nDashboard', screen: 'HealthDashboard', color: '#03045E', light: '#E8EDF8', testID: 'action-dashboard' },
  { icon: '👨‍👩‍👧', label: 'Family\nHealth', screen: 'Family', color: '#023E8A', light: '#E8EEF8', testID: 'action-family' },
];

const HEALTH_TIPS = [
  { icon: '💧', tip: 'Drink 8 glasses of water daily', color: '#0096C7', detail: 'Staying hydrated improves energy, skin and digestion.' },
  { icon: '🏃', tip: 'Walk 30 minutes every day', color: '#2DC653', detail: 'Daily walking reduces risk of heart disease by 35%.' },
  { icon: '😴', tip: 'Get 7–8 hours of sleep', color: '#6A0572', detail: 'Quality sleep boosts immunity and mental health.' },
  { icon: '🥦', tip: 'Eat more fruits & vegetables', color: '#F4A261', detail: 'Aim for 5 servings of fruits and vegetables daily.' },
  { icon: '🧘', tip: 'Practice deep breathing', color: '#0077B6', detail: '5 minutes of deep breathing reduces stress and anxiety.' },
  { icon: '☀️', tip: 'Get morning sunlight', color: '#F4A261', detail: '10 minutes of morning sun regulates your sleep cycle.' },
  { icon: '🚫', tip: 'Avoid processed foods', color: '#E63946', detail: 'Processed foods increase risk of diabetes and heart disease.' },
  { icon: '🧴', tip: 'Wash hands frequently', color: '#2DC653', detail: 'Proper handwashing prevents 80% of common infections.' },
  { icon: '🪥', tip: 'Brush teeth twice daily', color: '#0096C7', detail: 'Good oral hygiene is linked to overall heart health.' },
  { icon: '📵', tip: 'Limit screen time before bed', color: '#6A0572', detail: 'Blue light from screens disrupts melatonin production.' },
  { icon: '🤸', tip: 'Stretch every morning', color: '#023E8A', detail: 'Morning stretches improve flexibility and reduce injury risk.' },
  { icon: '🍎', tip: 'Eat an apple a day', color: '#E63946', detail: 'Apples are rich in fiber and antioxidants for gut health.' },
  { icon: '🧠', tip: 'Stay mentally active', color: '#0077B6', detail: 'Reading and puzzles keep your brain sharp as you age.' },
  { icon: '👟', tip: 'Take stairs instead of lift', color: '#2DC653', detail: 'Small daily activity choices add up to big health benefits.' },
  { icon: '🫀', tip: 'Check BP regularly', color: '#E63946', detail: 'High blood pressure often has no symptoms — check monthly.' },
];

const DAILY_FACTS = [
  { fact: 'Your heart beats about 100,000 times every day!', icon: '🫀' },
  { fact: 'The human body has 206 bones in adulthood.', icon: '🦴' },
  { fact: 'Laughing 100 times equals 10 minutes of rowing exercise.', icon: '😄' },
  { fact: 'Honey is the only food that never spoils.', icon: '🍯' },
  { fact: 'Your brain uses 20% of your body\'s total energy.', icon: '🧠' },
  { fact: 'Walking barefoot on grass reduces stress hormones.', icon: '🌿' },
  { fact: 'Turmeric has powerful anti-inflammatory properties.', icon: '🌿' },
];

function ActionCard({ item, onPress, index }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, tension: 60, friction: 8,
      delay: index * 80, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '18%' }}>
      <TouchableOpacity testID={item.testID} style={styles.actionBtn} onPress={onPress}>
        <View style={[styles.actionIconBox, { backgroundColor: item.light }]}>
          <Text style={styles.actionIcon}>{item.icon}</Text>
        </View>
        <Text style={styles.actionLabel}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, loadStoredSession } = useUserStore();
  const headerAnim = useRef(new Animated.Value(-20)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const [dailyTipIndex, setDailyTipIndex] = useState(0);
  const tipAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadStoredSession();
    Animated.parallel([
      Animated.spring(headerAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Set daily tip based on day of year
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    setDailyTipIndex(dayOfYear % HEALTH_TIPS.length);
  }, []);

  const rotateTip = () => {
    Animated.sequence([
      Animated.timing(tipAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(tipAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setDailyTipIndex(prev => (prev + 1) % HEALTH_TIPS.length);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetIcon = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';
  const dailyTip = HEALTH_TIPS[dailyTipIndex];
  const dailyFact = DAILY_FACTS[new Date().getDay() % DAILY_FACTS.length];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[styles.header, {
          transform: [{ translateY: headerAnim }], opacity: headerOpacity
        }]}>
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greetIcon} {greeting}</Text>
              <Text testID="dashboard-title" style={styles.userName}>{user?.name || 'Friend'} 👋</Text>
            </View>
            <TouchableOpacity
              testID="profile-avatar"
              style={styles.avatarBox}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.avatarText}>
                {user?.name ? user.name[0].toUpperCase() : '?'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Banner */}
          <TouchableOpacity
            style={styles.banner}
            onPress={() => navigation.navigate('SymptomChecker')}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.bannerTag}>
                <Text style={styles.bannerTagText}>AI POWERED</Text>
              </View>
              <Text style={styles.bannerTitle}>How are you{'\n'}feeling today?</Text>
              <View style={styles.bannerBtn}>
                <Text style={styles.bannerBtnText}>Check Symptoms →</Text>
              </View>
            </View>
            <Text style={styles.bannerEmoji}>🩺</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((item, index) => (
              <ActionCard
                key={item.label}
                item={item}
                index={index}
                onPress={() => navigation.navigate(item.screen)}
              />
            ))}
          </View>
        </View>

        {/* Daily Tip of the Day */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💡 Tip of the Day</Text>
            <TouchableOpacity onPress={rotateTip} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
          <Animated.View style={[styles.dailyTipCard, { opacity: tipAnim, borderLeftColor: dailyTip.color }]}>
            <View style={styles.dailyTipTop}>
              <Text style={styles.dailyTipIcon}>{dailyTip.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.dailyTipTitle}>{dailyTip.tip}</Text>
                <Text style={styles.dailyTipDetail}>{dailyTip.detail}</Text>
              </View>
            </View>
            <View style={[styles.dailyTipBadge, { backgroundColor: dailyTip.color + '20' }]}>
              <Text style={[styles.dailyTipBadgeText, { color: dailyTip.color }]}>
                Tip {dailyTipIndex + 1} of {HEALTH_TIPS.length}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Health Tips Horizontal Scroll */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Health Tips</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {HEALTH_TIPS.map((item, i) => (
              <View key={i} style={[styles.tipCard, { borderTopColor: item.color }]}>
                <Text style={styles.tipIcon}>{item.icon}</Text>
                <Text style={styles.tipText}>{item.tip}</Text>
                <Text style={styles.tipDetail}>{item.detail}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Did You Know */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Did You Know? 🧠</Text>
          <View style={styles.factCard}>
            <Text style={styles.factIcon}>{dailyFact.icon}</Text>
            <Text style={styles.factText}>{dailyFact.fact}</Text>
          </View>
        </View>

        {/* Symptom Checker CTA */}
        <View style={styles.section}>
          <View style={styles.didYouKnowCard}>
            <Text style={styles.didYouKnowText}>
              Describing your symptoms accurately helps our AI suggest the most relevant specialist for you — saving you time and money on unnecessary consultations.
            </Text>
            <TouchableOpacity
              style={styles.tryNowBtn}
              onPress={() => navigation.navigate('SymptomChecker')}
            >
              <Text style={styles.tryNowBtnText}>Try Symptom Checker →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#03045E', paddingBottom: 28,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    overflow: 'hidden', marginBottom: 8,
  },
  bgCircle1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#0077B6', opacity: 0.2, top: -80, right: -60 },
  bgCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#00B4D8', opacity: 0.1, bottom: -40, left: -40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  greeting: { fontSize: 13, color: 'rgba(144,224,239,0.8)', fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  avatarBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0077B6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(0,180,216,0.4)' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  banner: { marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  bannerTag: { backgroundColor: 'rgba(0,180,216,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 },
  bannerTagText: { fontSize: 9, fontWeight: '700', color: '#90E0EF', letterSpacing: 1.5 },
  bannerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', lineHeight: 28, marginBottom: 14 },
  bannerBtn: { backgroundColor: '#0077B6', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16, alignSelf: 'flex-start' },
  bannerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  bannerEmoji: { fontSize: 60, marginLeft: 12 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#03045E', marginBottom: 14 },
  nextBtn: { backgroundColor: '#E8F4FD', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  nextBtnText: { fontSize: 12, fontWeight: '700', color: '#0077B6' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIconBox: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionIcon: { fontSize: 26 },
  actionLabel: { fontSize: 10, fontWeight: '600', color: '#03045E', textAlign: 'center', lineHeight: 14 },
  dailyTipCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 12,
    borderLeftWidth: 4,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  dailyTipTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  dailyTipIcon: { fontSize: 36 },
  dailyTipTitle: { fontSize: 15, fontWeight: '800', color: '#03045E', lineHeight: 22 },
  dailyTipDetail: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: 4 },
  dailyTipBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  dailyTipBadgeText: { fontSize: 11, fontWeight: '700' },
  tipCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginRight: 12, width: 160, borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: 6,
  },
  tipIcon: { fontSize: 28 },
  tipText: { fontSize: 12, color: '#03045E', lineHeight: 18, fontWeight: '700' },
  tipDetail: { fontSize: 11, color: '#9CA3AF', lineHeight: 16 },
  factCard: {
    backgroundColor: '#03045E', borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  factIcon: { fontSize: 40 },
  factText: { flex: 1, fontSize: 14, color: '#fff', lineHeight: 22, fontWeight: '500' },
  didYouKnowCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 14,
    borderLeftWidth: 4, borderLeftColor: '#0077B6',
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  didYouKnowText: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
  tryNowBtn: { backgroundColor: '#03045E', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  tryNowBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});