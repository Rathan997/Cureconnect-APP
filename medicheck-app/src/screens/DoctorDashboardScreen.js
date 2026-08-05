import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from '../store/userStore';
import { doctorsAPI } from '../services/api';

export default function DoctorDashboardScreen({ navigation }) {
  const { user, logout } = useUserStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await doctorsAPI.getAppointments();
      setAppointments(data || []);
    } catch (e) {
      console.warn('Fetch appointments error:', e);
      Alert.alert('Connection Error', 'Could not load your appointment list.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await doctorsAPI.getAppointments();
      setAppointments(data || []);
    } catch (e) {
      console.warn(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await doctorsAPI.updateAppointmentStatus(appointmentId, newStatus);
      Alert.alert('Success', `Appointment updated to ${newStatus}.`);
      // Update local state
      setAppointments(prev =>
        prev.map(appt =>
          appt.id === appointmentId ? { ...appt, status: newStatus } : appt
        )
      );
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update appointment status.');
    }
  };

  const doLogout = async () => {
    try {
      await AsyncStorage.removeItem('Cureconnect_token');
      await AsyncStorage.removeItem('Cureconnect_user');
    } catch (e) {
      console.warn(e);
    }
    await logout();
    navigation.replace('Login');
  };

  const totalAppts = appointments.length;
  const pendingAppts = appointments.filter(a => a.status === 'pending').length;
  const activeAppts = appointments.filter(a => a.status === 'confirmed').length;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.greeting}>Welcome Back, Doctor 🩺</Text>
          <Text style={styles.doctorName}>Dr. {user?.name || 'Practitioner'}</Text>
          <Text style={styles.doctorMeta}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={doLogout}>
          <Text style={styles.logoutBtnText}>🚪 Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Board */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalAppts}</Text>
          <Text style={styles.statLabel}>Total slots</Text>
        </View>
        <View style={[styles.statCard, { borderLeftWidth: 1.5, borderLeftColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={[styles.statNumber, { color: '#F4A261' }]}>{pendingAppts}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderLeftWidth: 1.5, borderLeftColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={[styles.statNumber, { color: '#2DC653' }]}>{activeAppts}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
      </View>
    </View>
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#E8FDF4', text: '#2DC653', label: 'Confirmed' };
      case 'cancelled':
        return { bg: '#FDE8E8', text: '#E63946', label: 'Cancelled' };
      default:
        return { bg: '#E8F4FD', text: '#0077B6', label: 'Pending' };
    }
  };

  const renderAppointment = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <View style={styles.apptCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.patientName}>{item.patient_name}</Text>
            <Text style={styles.patientContact}>📞 {item.patient_phone} | {item.patient_email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>📅 {item.date}</Text>
          <Text style={styles.timeText}>⏰ {item.time}</Text>
        </View>

        {item.notes ? (
          <Text style={styles.notesText}>📝 Notes: {item.notes}</Text>
        ) : null}

        {item.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => handleUpdateStatus(item.id, 'cancelled')}
            >
              <Text style={styles.declineText}>Cancel ❌</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              onPress={() => handleUpdateStatus(item.id, 'confirmed')}
            >
              <Text style={styles.confirmText}>Confirm ✅</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {loading && !refreshing ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#03045E" size="large" />
          <Text style={styles.loadingText}>Fetching patient appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAppointment}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#03045E']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyText}>No appointments booked for you yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#03045E',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextWrap: { flex: 1 },
  greeting: { color: '#90E0EF', fontSize: 13, fontWeight: '600' },
  doctorName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  doctorMeta: { color: 'rgba(144,224,239,0.7)', fontSize: 13, marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  logoutBtnText: { color: '#E63946', fontWeight: '700', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statCard: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(144,224,239,0.7)', fontWeight: '600', marginTop: 4 },
  list: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  apptCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#03045E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
    marginBottom: 12,
  },
  patientName: { fontSize: 16, fontWeight: '800', color: '#03045E' },
  patientContact: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  timeText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  notesText: {
    fontSize: 13,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 10,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: '#FDE8E8',
  },
  declineText: { color: '#E63946', fontWeight: '700', fontSize: 13 },
  confirmBtn: {
    backgroundColor: '#E8FDF4',
  },
  confirmText: { color: '#2DC653', fontWeight: '700', fontSize: 13 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  loadingText: { color: '#9CA3AF', marginTop: 12, fontSize: 14 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
});
