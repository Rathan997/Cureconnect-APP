import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator, ScrollView, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from '../store/userStore';
import { medicineAPI } from '../services/api';
import {
  scheduleMedicineReminder,
  scheduleExpiryAlert,
  cancelMedicineReminders,
  sendTestNotification,
  requestNotificationPermission
} from '../services/notifications';

const MEDICINES_KEY = 'Cureconnect_medicines';

function ManualAddModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [expiry, setExpiry] = useState('');
  const [times, setTimes] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !expiry.trim()) {
      Alert.alert('Missing Info', 'Please enter medicine name and expiry date.');
      return;
    }
    const expiryRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!expiryRegex.test(expiry.trim())) {
      Alert.alert('Invalid Format', 'Please enter expiry date in DD/MM/YYYY format (e.g. 31/12/2026).');
      return;
    }
    onAdd({
      name: name.trim(),
      generic: dosage.trim() || 'N/A',
      expiry: expiry.trim(),
      reminderTimes: times.split(',').map(t => t.trim()).filter(Boolean),
      barcode: 'manual',
      manufacturer: 'N/A',
      category: 'General',
    });
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modal}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Add Medicine </Text>
        {[
          { label: 'MEDICINE NAME *', value: name, setter: setName, placeholder: 'e.g. Dolo 650', testID: 'medicine-name-input' },
          { label: 'DOSAGE', value: dosage, setter: setDosage, placeholder: 'e.g. Paracetamol 650mg', testID: 'medicine-dosage-input' },
          { label: 'EXPIRY DATE *', value: expiry, setter: setExpiry, placeholder: 'e.g. 31/12/2026', testID: 'medicine-expiry-input' },
          { label: 'REMINDER TIMES', value: times, setter: setTimes, placeholder: 'e.g. 8:00 AM, 2:00 PM', testID: 'medicine-times-input' },
        ].map(field => (
          <View key={field.label} style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.fieldBox}>
              <TextInput
                testID={field.testID}
                style={styles.fieldInput}
                placeholder={field.placeholder}
                placeholderTextColor="#9CA3AF"
                value={field.value}
                onChangeText={field.setter}
              />
            </View>
          </View>
        ))}
        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="medicine-submit" style={styles.modalAddBtn} onPress={handleAdd}>
            <Text style={styles.modalAddText}>Add Medicine</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function MedicineScanner({ navigation }) {
  const [showManual, setShowManual] = useState(false);
  const [savedMedicines, setSavedMedicines] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const { user } = useUserStore();

  useEffect(() => {
    loadMedicines();
    requestNotificationPermission();
  }, []);

  const loadMedicines = async () => {
    setLoadingMeds(true);
    try {
      const data = await medicineAPI.getAll();
      setSavedMedicines(data.medicines || []);
    } catch (e) {
      try {
        const stored = await AsyncStorage.getItem(MEDICINES_KEY);
        if (stored) setSavedMedicines(JSON.parse(stored));
      } catch (err) { console.warn(err); }
    }
    setLoadingMeds(false);
  };

  const saveMedicineToBackend = async (medicine) => {
    try {
      const result = await medicineAPI.add({
        name: medicine.name,
        generic: medicine.generic || '',
        manufacturer: medicine.manufacturer || '',
        barcode: medicine.barcode || '',
        expiry: medicine.expiry,
        reminderTimes: medicine.reminderTimes || [],
        category: medicine.category || 'General',
      });
      await loadMedicines();
      return result;
    } catch (e) {
      const updated = [{
        ...medicine,
        id: `med_${Date.now()}`,
        addedAt: new Date().toISOString()
      }, ...savedMedicines];
      await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(updated));
      setSavedMedicines(updated);
      return null;
    }
  };

  const handleManualAdd = async (medicine) => {
    const medicineId = `med_${Date.now()}`;
    const med = { ...medicine, id: medicineId };

    await saveMedicineToBackend(med);

    // Schedule reminders
    if (med.reminderTimes && med.reminderTimes.length > 0) {
      await scheduleMedicineReminder(med);
    }

    // Schedule expiry alert
    await scheduleExpiryAlert(med);

    setShowManual(false);
    Alert.alert(
      '✅ Added!',
      `${medicine.name} added with ${medicine.reminderTimes?.length || 0} reminder(s)!`,
      [
        { text: 'View All', onPress: () => loadMedicines() },
        { text: 'Add Another', onPress: () => setShowManual(true) },
      ]
    );
  };

  const deleteMedicine = async (id) => {
    Alert.alert('Delete Medicine', 'Remove this medicine and its reminders?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await cancelMedicineReminders(id);
            await medicineAPI.delete(id);
            await loadMedicines();
          } catch (e) {
            const updated = savedMedicines.filter(m => m.id !== id);
            await AsyncStorage.setItem(MEDICINES_KEY, JSON.stringify(updated));
            setSavedMedicines(updated);
          }
        }
      }
    ]);
  };

  const isExpired = (expiry) => {
    try {
      const [day, month, year] = expiry.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)) < new Date();
    } catch { return false; }
  };

  const isExpiringSoon = (expiry) => {
    try {
      const [day, month, year] = expiry.split('/');
      const expiryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const daysLeft = (expiryDate - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft <= 60 && daysLeft > 0;
    } catch { return false; }
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>My Medicines</Text>
            <Text style={styles.headerSub}>Manage your daily medicines & reminders</Text>
          </View>
          <View style={styles.myMedsHeaderBtn}>
            <Text style={styles.myMedsHeaderText}>💊 {savedMedicines.length}</Text>
          </View>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <TouchableOpacity
          testID="add-medicine-btn"
          style={styles.scanNewBtn}
          onPress={() => setShowManual(true)}
        >
          <Text style={styles.scanNewBtnText}>➕ Add Medicine</Text>
        </TouchableOpacity>

        {/* Test notification button */}
        <TouchableOpacity
          style={styles.testNotifBtn}
          onPress={sendTestNotification}
        >
          <Text style={styles.testNotifBtnText}>🔔 Test Notification</Text>
        </TouchableOpacity>

        {loadingMeds ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#0077B6" size="large" />
            <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Loading medicines...</Text>
          </View>
        ) : (
          <ScrollView testID="medicines-list" style={styles.medList} showsVerticalScrollIndicator={false}>
            {savedMedicines.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>💊</Text>
                <Text style={styles.emptyTitle}>No medicines added yet</Text>
                <Text style={styles.emptySub}>Add medicines to get started</Text>
              </View>
            ) : (
              savedMedicines.map(med => {
                const expired = isExpired(med.expiry);
                const expiringSoon = !expired && isExpiringSoon(med.expiry);
                return (
                  <View testID="medicine-card" key={med.id} style={[
                    styles.medCard,
                    expired && { borderLeftColor: '#E63946', borderLeftWidth: 4 },
                    expiringSoon && { borderLeftColor: '#F4A261', borderLeftWidth: 4 },
                  ]}>
                    <View style={styles.medTop}>
                      <View style={styles.medIconBox}>
                        <Text style={styles.medIcon}>💊</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medName}>{med.name}</Text>
                        <Text style={styles.medGeneric}>{med.generic}</Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteMedicine(med.id)}>
                        <Text style={{ fontSize: 20 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.medDetails}>
                      <View style={styles.medDetailRow}>
                        <Text style={styles.medDetailIcon}>📅</Text>
                        <Text style={[
                          styles.medDetailText,
                          expired && { color: '#E63946', fontWeight: '700' },
                          expiringSoon && { color: '#F4A261', fontWeight: '700' },
                        ]}>
                          Expires: {med.expiry}
                          {expired ? ' ⚠️ EXPIRED' : expiringSoon ? ' ⚠️ Expiring Soon' : ''}
                        </Text>
                      </View>
                      {(med.reminder_times || med.reminderTimes) && (
                        <View style={styles.medDetailRow}>
                          <Text style={styles.medDetailIcon}>🔔</Text>
                          <Text style={styles.medDetailText}>
                            Reminders: {med.reminder_times || (Array.isArray(med.reminderTimes) ? med.reminderTimes.join(', ') : med.reminderTimes)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>

      {showManual && (
        <ManualAddModal
          onAdd={handleManualAdd}
          onClose={() => setShowManual(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#03045E', paddingBottom: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#0077B6', opacity: 0.2, top: -60, right: -40,
  },
  bgCircle2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#00B4D8', opacity: 0.1, bottom: -40, left: -20,
  },
  backBtn: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  backText: { color: '#90E0EF', fontWeight: '600', fontSize: 14 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(144,224,239,0.7)', marginTop: 2 },
  myMedsHeaderBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  myMedsHeaderText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fieldWrap: { gap: 6, marginBottom: 12 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 },
  fieldBox: {
    backgroundColor: '#F8FAFC', borderRadius: 14,
    paddingHorizontal: 16, height: 50,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    justifyContent: 'center',
  },
  fieldInput: { fontSize: 14, color: '#03045E' },
  scanNewBtn: {
    marginHorizontal: 20, marginTop: 16, marginBottom: 8,
    backgroundColor: '#03045E', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  scanNewBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  testNotifBtn: {
    marginHorizontal: 20, marginBottom: 12, backgroundColor: '#E8F4FD',
    borderRadius: 14, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#0077B6',
  },
  testNotifBtnText: { color: '#0077B6', fontWeight: '700', fontSize: 13 },
  medList: { flex: 1, paddingHorizontal: 20, marginTop: 4 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#03045E' },
  emptySub: { fontSize: 13, color: '#9CA3AF' },
  medCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 12, gap: 10,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  medTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medIconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#F0F4F8', alignItems: 'center', justifyContent: 'center',
  },
  medIcon: { fontSize: 24 },
  medName: { fontSize: 15, fontWeight: '700', color: '#03045E' },
  medGeneric: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  medDetails: { gap: 6, paddingLeft: 4 },
  medDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medDetailIcon: { fontSize: 13 },
  medDetailText: { fontSize: 13, color: '#9CA3AF', flex: 1 },
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 14, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#E5E7EB',
    borderRadius: 2, alignSelf: 'center', marginBottom: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#03045E' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 12 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  modalCancelText: { color: '#9CA3AF', fontWeight: '600' },
  modalAddBtn: {
    flex: 1, backgroundColor: '#03045E',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  modalAddText: { color: '#fff', fontWeight: '700' },
});