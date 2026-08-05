import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from '../store/userStore';
import { medicineAPI, familyAPI } from '../services/api';

const { width } = Dimensions.get('window');
const MEDICINES_KEY = 'Cureconnect_medicines';
const FAMILY_KEY = 'Cureconnect_family';
const SYMPTOM_HISTORY_KEY = 'cureconnect_symptom_history';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function ScoreRing({ score }) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: score,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const getScoreColor = (s) => {
    if (s >= 80) return '#2DC653';
    if (s >= 60) return '#F4A261';
    if (s >= 40) return '#0096C7';
    return '#E63946';
  };

  const getScoreLabel = (s) => {
    if (s >= 80) return 'Excellent 🌟';
    if (s >= 60) return 'Good 👍';
    if (s >= 40) return 'Fair 😐';
    return 'Needs Attention ⚠️';
  };

  const color = getScoreColor(score);

  return (
    <View style={styles.scoreRingWrap}>
      <View style={[styles.scoreRingOuter, { borderColor: color + '33' }]}>
        <View style={[styles.scoreRingInner, { borderColor: color }]}>
          <Animated.Text style={[styles.scoreNumber, { color }]}>
            {score}
          </Animated.Text>
          <Text style={styles.scoreOutOf}>/100</Text>
        </View>
      </View>
      <Text style={[styles.scoreLabel, { color }]}>{getScoreLabel(score)}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, color, bg, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function WeeklyBar({ day, value, maxValue, color }) {
  const height = maxValue > 0 ? (value / maxValue) * 80 : 4;
  const animHeight = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    Animated.spring(animHeight, {
      toValue: Math.max(height, 4),
      tension: 60, friction: 8,
      useNativeDriver: false,
    }).start();
  }, [height]);

  return (
    <View style={styles.barWrap}>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, {
          height: animHeight,
          backgroundColor: value > 0 ? color : '#E5E7EB',
        }]} />
      </View>
      <Text style={styles.barDay}>{day}</Text>
      <Text style={styles.barValue}>{value > 0 ? value : ''}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState(0);
  const [medicines, setMedicines] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [symptomChecks, setSymptomChecks] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [intakeHistory, setIntakeHistory] = useState([]);
  const headerAnim = useRef(new Animated.Value(-20)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDashboardData();
    Animated.parallel([
      Animated.spring(headerAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      let meds = [];
      try {
        const data = await medicineAPI.getAll();
        meds = data.medicines || [];
        await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(meds));
      } catch {
        const stored = await AsyncStorage.getItem(MEDICINES_KEY);
        meds = stored ? JSON.parse(stored) : [];
      }
      setMedicines(meds);

      let family = [];
      try {
        const data = await familyAPI.getAll();
        family = data.members || [];
        await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(family));
      } catch {
        const stored = await AsyncStorage.getItem(FAMILY_KEY);
        family = stored ? JSON.parse(stored) : [];
      }
      setFamilyMembers(family);

      const historyStr = await AsyncStorage.getItem(SYMPTOM_HISTORY_KEY);
      const history = historyStr ? JSON.parse(historyStr) : [];
      setSymptomChecks(history.length);

      const intakeHistoryStr = await AsyncStorage.getItem('Cureconnect_intake_history');
      const intake = intakeHistoryStr ? JSON.parse(intakeHistoryStr) : [];
      setIntakeHistory(intake);

      const weekly = calculateWeeklyActivity(history);
      setWeeklyActivity(weekly);

      const score = calculateHealthScore(meds, family, history);
      setHealthScore(score);

    } catch (e) {
      console.warn('Dashboard load error:', e);
    }
    setLoading(false);
  };

  const calculateWeeklyActivity = (history) => {
    const days = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);

    history.forEach(check => {
      const checkDate = new Date(check.date);
      const dayIndex = checkDate.getDay() - 1;
      if (dayIndex >= 0 && dayIndex < 7) {
        if (checkDate >= monday) {
          days[dayIndex]++;
        }
      }
    });
    return days;
  };

  const calculateHealthScore = (meds, family, history) => {
    let score = 50;
    const expiredMeds = meds.filter(m => isExpired(m.expiry)).length;
    if (meds.length > 0) score += 10;
    if (expiredMeds === 0) score += 10;
    else score -= expiredMeds * 3;

    const checkedInToday = family.filter(m => {
      if (!m.last_check_in) return false;
      return new Date(m.last_check_in).toDateString() === new Date().toDateString();
    }).length;
    if (family.length > 0) {
      score += Math.round((checkedInToday / family.length) * 15);
    }

    if (history.length > 0) score += 5;
    if (history.length >= 3) score += 5;
    if (history.length >= 7) score += 5;

    return Math.max(0, Math.min(100, score));
  };

  const isExpired = (expiry) => {
    try {
      const [month, year] = expiry.split('/');
      return new Date(parseInt(year), parseInt(month) - 1) < new Date();
    } catch { return false; }
  };

  const isExpiringSoon = (expiry) => {
    try {
      const [month, year] = expiry.split('/');
      const monthsLeft = (new Date(parseInt(year), parseInt(month) - 1) - new Date()) / (1000 * 60 * 60 * 24 * 30);
      return monthsLeft <= 2 && monthsLeft > 0;
    } catch { return false; }
  };

  const expiredCount = medicines.filter(m => isExpired(m.expiry)).length;
  const expiringSoonCount = medicines.filter(m => isExpiringSoon(m.expiry)).length;
  const checkedInToday = familyMembers.filter(m => {
    if (!m.last_check_in) return false;
    return new Date(m.last_check_in).toDateString() === new Date().toDateString();
  }).length;

  const maxWeekly = Math.max(...weeklyActivity, 1);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // ✅ Helper function for nested navigation
  const goTo = (screen) => {
    navigation.navigate('Main', { screen });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[styles.header, {
          transform: [{ translateY: headerAnim }],
          opacity: headerOpacity,
        }]}>
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          <View style={styles.bgCircle3} />

          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadDashboardData}>
              <Text style={styles.refreshText}>↻ Refresh</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.greetingText}>{greeting} 👋</Text>
          <Text testID="dashboard-title" style={styles.headerTitle}>Health Dashboard</Text>
          <Text style={styles.headerSub}>Your daily health overview</Text>

          <ScoreRing score={healthScore} />
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="💊" label="Total Medicines"
              value={medicines.length} color="#0077B6" bg="#E8F4FD"
              onPress={() => goTo('MedicineScanner')} />
            <StatCard icon="⚠️" label="Expiring Soon"
              value={expiringSoonCount} color="#F4A261" bg="#FDF4E8"
              onPress={() => goTo('MedicineScanner')} />
            <StatCard icon="❌" label="Expired"
              value={expiredCount} color="#E63946" bg="#FDE8E8"
              onPress={() => goTo('MedicineScanner')} />
            <StatCard icon="👨‍👩‍👧" label="Family Members"
              value={familyMembers.length} color="#6A0572" bg="#F3E8FD"
              onPress={() => goTo('Family')} />
            <StatCard icon="✅" label="Checked In Today"
              value={checkedInToday} color="#2DC653" bg="#E8FDF4"
              onPress={() => goTo('Family')} />
            <StatCard icon="🩺" label="Symptom Checks"
              value={symptomChecks} color="#03045E" bg="#E8EDF8"
              onPress={() => goTo('SymptomChecker')} />
          </View>
        </View>

        {/* Weekly Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Symptom Activity</Text>
          <View style={styles.weeklyCard}>
            <View style={styles.barsRow}>
              {DAYS.map((day, i) => (
                <WeeklyBar
                  key={day}
                  day={day}
                  value={weeklyActivity[i]}
                  maxValue={maxWeekly}
                  color="#0077B6"
                />
              ))}
            </View>
          </View>
        </View>

        {/* Personalized Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personalized Tips</Text>
          <View style={styles.tipsCard}>
            {expiredCount > 0 && (
              <View style={styles.tipRow}>
                <Text style={styles.tipDot}>🔴</Text>
                <Text style={styles.tipText}>
                  You have {expiredCount} expired medicine(s). Please dispose of them safely.
                </Text>
              </View>
            )}
            {expiringSoonCount > 0 && (
              <View style={styles.tipRow}>
                <Text style={styles.tipDot}>🟡</Text>
                <Text style={styles.tipText}>
                  {expiringSoonCount} medicine(s) expiring soon. Replace them before they expire.
                </Text>
              </View>
            )}
            {familyMembers.length > 0 && checkedInToday < familyMembers.length && (
              <View style={styles.tipRow}>
                <Text style={styles.tipDot}>🟡</Text>
                <Text style={styles.tipText}>
                  {familyMembers.length - checkedInToday} family member(s) not checked in today.
                </Text>
              </View>
            )}
            {symptomChecks === 0 && (
              <View style={styles.tipRow}>
                <Text style={styles.tipDot}>🔵</Text>
                <Text style={styles.tipText}>
                  Try the symptom checker to get AI-powered health insights.
                </Text>
              </View>
            )}
            {healthScore >= 80 && (
              <View style={styles.tipRow}>
                <Text style={styles.tipDot}>🟢</Text>
                <Text style={styles.tipText}>
                  Excellent health score! Keep up the great work. 🌟
                </Text>
              </View>
            )}
            {expiredCount === 0 && expiringSoonCount === 0 && familyMembers.length === checkedInToday && (
              <View style={styles.tipRow}>
                <Text style={styles.tipDot}>🟢</Text>
                <Text style={styles.tipText}>
                  All medicines are valid and family is checked in. Great job! 🎉
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Medication Intake Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Adherence History</Text>
          <View style={styles.logsCard}>
            {intakeHistory.length === 0 ? (
              <Text style={styles.noLogsText}>No recent medication logs. Take your medicines on time to build your history! 🌟</Text>
            ) : (
              intakeHistory.slice(0, 5).map((log, index) => {
                const date = new Date(log.timestamp);
                const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                const isTaken = log.status === 'taken';

                return (
                  <View key={log.id || index} style={[styles.logRow, index !== Math.min(intakeHistory.length, 5) - 1 && styles.logBorder]}>
                    <View style={styles.logLeft}>
                      <Text style={styles.logIcon}>{isTaken ? '✅' : '❌'}</Text>
                      <View>
                        <Text style={styles.logMedName}>{log.medicineName}</Text>
                        <Text style={styles.logTime}>{dateString} at {timeString}</Text>
                      </View>
                    </View>
                    <View style={[styles.logStatusBadge, isTaken ? styles.logStatusTaken : styles.logStatusMissed]}>
                      <Text style={[styles.logStatusText, isTaken ? styles.logStatusTextTaken : styles.logStatusTextMissed]}>
                        {isTaken ? 'Taken' : 'Dismissed'}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: '🩺', label: 'Check Symptoms', screen: 'SymptomChecker', color: '#E8F4FD', border: '#0077B6' },
              { icon: '💊', label: 'Add Medicine', screen: 'MedicineScanner', color: '#F3E8FD', border: '#6A0572' },
              { icon: '👨‍👩‍👧', label: 'Family Health', screen: 'Family', color: '#E8FDF4', border: '#2DC653' },
              { icon: '🚨', label: 'Emergency', screen: 'Emergency', color: '#FDE8E8', border: '#E63946' },
            ].map(action => (
              <TouchableOpacity
                key={action.label}
                style={[styles.actionCard, { backgroundColor: action.color, borderColor: action.border }]}
                onPress={() => goTo(action.screen)}
              >
                <Text style={action.label === 'Emergency' ? [styles.actionIcon, { color: '#E63946' }] : styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
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
    backgroundColor: '#03045E', paddingBottom: 32,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    overflow: 'hidden', marginBottom: 8,
  },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#0077B6', opacity: 0.2, top: -80, right: -60 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#00B4D8', opacity: 0.1, bottom: -40, left: -40 },
  bgCircle3: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#90E0EF', opacity: 0.05, top: 40, left: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  backBtn: { padding: 4 },
  backText: { color: '#90E0EF', fontWeight: '600', fontSize: 14 },
  refreshBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  refreshText: { color: '#90E0EF', fontWeight: '600', fontSize: 13 },
  greetingText: { fontSize: 13, color: 'rgba(144,224,239,0.8)', paddingHorizontal: 20, marginTop: 12 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', paddingHorizontal: 20, marginTop: 4 },
  headerSub: { fontSize: 13, color: 'rgba(144,224,239,0.7)', paddingHorizontal: 20, marginBottom: 20 },
  scoreRingWrap: { alignItems: 'center', gap: 10 },
  scoreRingOuter: { width: 140, height: 140, borderRadius: 70, borderWidth: 8, alignItems: 'center', justifyContent: 'center' },
  scoreRingInner: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  scoreNumber: { fontSize: 38, fontWeight: '800' },
  scoreOutOf: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: -4 },
  scoreLabel: { fontSize: 14, fontWeight: '700' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#03045E', marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '30%', borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, flexGrow: 1, shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  statIcon: { fontSize: 28 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '600', textAlign: 'center' },
  weeklyCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  barsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  barWrap: { alignItems: 'center', gap: 4, flex: 1 },
  barTrack: { width: 28, height: 80, backgroundColor: '#F0F4F8', borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 8 },
  barDay: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  barValue: { fontSize: 10, color: '#0077B6', fontWeight: '700' },
  tipsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 12, shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipDot: { fontSize: 14, marginTop: 1 },
  tipText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 20 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1.5, shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  actionIcon: { fontSize: 32 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: '#03045E', textAlign: 'center' },
  logsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#03045E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  noLogsText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
    lineHeight: 20,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  logBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logIcon: {
    fontSize: 20,
  },
  logMedName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#03045E',
  },
  logTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  logStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  logStatusTaken: {
    backgroundColor: '#E8FDF4',
  },
  logStatusMissed: {
    backgroundColor: '#FDE8E8',
  },
  logStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logStatusTextTaken: {
    color: '#2DC653',
  },
  logStatusTextMissed: {
    color: '#E63946',
  },
});