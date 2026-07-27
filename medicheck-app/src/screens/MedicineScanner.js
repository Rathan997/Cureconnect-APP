import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator, ScrollView, TextInput
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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

const lookupMedicine = async (barcode) => {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      return {
        name: p.product_name || p.abbreviated_product_name || 'Unknown Medicine',
        generic: p.generic_name || p.ingredients_text || 'N/A',
        manufacturer: p.brands || p.manufacturer || 'N/A',
        category: p.categories || 'Medicine',
        sideEffects: 'Consult your doctor or pharmacist for side effects.',
        barcode,
      };
    }
    const res2 = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
    const data2 = await res2.json();
    if (data2.code === 'OK' && data2.items?.length > 0) {
      const item = data2.items[0];
      return {
        name: item.title || 'Unknown Medicine',
        generic: item.description || 'N/A',
        manufacturer: item.brand || 'N/A',
        category: 'Medicine',
        sideEffects: 'Consult your doctor or pharmacist for side effects.',
        barcode,
      };
    }
    return null;
  } catch (e) { return null; }
};

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
        <Text style={styles.modalTitle}>Add Medicine Manually</Text>
        {[
          { label: 'MEDICINE NAME *', value: name, setter: setName, placeholder: 'e.g. Dolo 650', testID: 'medicine-name-input' },
          { label: 'DOSAGE', value: dosage, setter: setDosage, placeholder: 'e.g. Paracetamol 650mg', testID: 'medicine-dosage-input' },
          { label: 'EXPIRY DATE *', value: expiry, setter: setExpiry, placeholder: 'e.g. 12/2026', testID: 'medicine-expiry-input' },
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

function MedicineResultCard({ medicine, onSave, onRescan }) {
  const [expiry, setExpiry] = useState('');
  const [times, setTimes] = useState('8:00 AM, 2:00 PM, 9:00 PM');

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <View style={styles.resultCard}>
        <View style={styles.resultTop}>
          <View style={styles.resultIconBox}>
            <Text style={styles.resultIcon}>💊</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.resultName}>{medicine.name}</Text>
            <Text style={styles.resultGeneric}>{medicine.generic}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{medicine.category}</Text>
          </View>
        </View>

        <View style={styles.resultDetails}>
          {[
            { icon: '🏭', label: 'MANUFACTURER', value: medicine.manufacturer },
            { icon: '⚠️', label: 'SIDE EFFECTS', value: medicine.sideEffects || 'Consult your doctor.' },
          ].map(item => (
            <View key={item.label} style={styles.resultDetailRow}>
              <Text style={styles.resultDetailIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultDetailLabel}>{item.label}</Text>
                <Text style={styles.resultDetailValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>📅 EXPIRY DATE *</Text>
          <View style={styles.fieldBox}>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 06/2026"
              placeholderTextColor="#9CA3AF"
              value={expiry}
              onChangeText={setExpiry}
            />
          </View>
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>⏰ REMINDER TIMES (comma separated)</Text>
          <View style={styles.fieldBox}>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 8:00 AM, 2:00 PM, 9:00 PM"
              placeholderTextColor="#9CA3AF"
              value={times}
              onChangeText={setTimes}
            />
          </View>
        </View>

        {/* Reminder hint */}
        <View style={styles.reminderHint}>
          <Text style={styles.reminderHintText}>
            🔔 You'll get daily notifications at the times you set above
          </Text>
        </View>

        <View style={styles.resultBtns}>
          <TouchableOpacity style={styles.rescanBtn} onPress={onRescan}>
            <Text style={styles.rescanBtnText}>📷 Scan Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => onSave({
              expiry,
              reminderTimes: times.split(',').map(t => t.trim()).filter(Boolean)
            })}
          >
            <Text style={styles.saveBtnText}>✅ Save & Set Reminder</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

export default function MedicineScanner({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [foundMedicine, setFoundMedicine] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [savedMedicines, setSavedMedicines] = useState([]);
  const [view, setView] = useState('scanner');
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

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setScanning(true);
    const medicine = await lookupMedicine(data);
    setScanning(false);
    if (medicine) {
      setFoundMedicine(medicine);
      setView('result');
    } else {
      Alert.alert('Medicine Not Found', `Barcode: ${data}\n\nAdd it manually?`, [
        { text: 'Scan Again', onPress: () => setScanned(false) },
        { text: 'Add Manually', onPress: () => { setShowManual(true); setScanned(false); } },
      ]);
      setScanned(false);
    }
  };

  const handleSaveMedicine = async ({ expiry, reminderTimes }) => {
    if (!expiry.trim()) {
      Alert.alert('Missing Expiry', 'Please enter the expiry date.');
      return;
    }

    const medicineId = `med_${Date.now()}`;
    const medicine = {
      ...foundMedicine,
      id: medicineId,
      expiry,
      reminderTimes
    };

    await saveMedicineToBackend(medicine);

    // Schedule daily reminders
    if (reminderTimes && reminderTimes.length > 0) {
      await scheduleMedicineReminder(medicine);
    }

    // Schedule expiry alert (7 days before expiry)
    await scheduleExpiryAlert(medicine);

    Alert.alert(
      '✅ Medicine Saved!',
      `${foundMedicine.name} added with ${reminderTimes?.length || 0} daily reminder(s)!\n\n🔔 You'll be notified at: ${reminderTimes?.join(', ') || 'No reminders set'}`,
      [
        { text: 'View All', onPress: () => { setView('list'); } },
        { text: 'Scan Another', onPress: () => { setView('scanner'); setScanned(false); setFoundMedicine(null); } },
      ]
    );
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
        { text: 'View All', onPress: () => setView('list') },
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

  if (!permission) return <View style={styles.safe} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.bgCircle1} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medicine Scanner</Text>
        </View>
        <View style={styles.permBox}>
          <View style={styles.permIconBox}>
            <Text style={styles.permIcon}>📷</Text>
          </View>
          <Text style={styles.permTitle}>Camera Permission Needed</Text>
          <Text style={styles.permSub}>
            We need camera access to scan medicine barcodes
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>Medicine Scanner</Text>
            <Text style={styles.headerSub}>Scan barcode or add manually</Text>
          </View>
          <TouchableOpacity
            style={styles.myMedsHeaderBtn}
            onPress={() => { setView('list'); loadMedicines(); }}
          >
            <Text style={styles.myMedsHeaderText}>💊 {savedMedicines.length}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scanner View */}
      {view === 'scanner' && (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39']
            }}
          >
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>Point camera at medicine barcode</Text>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                {scanning && (
                  <View style={styles.scanningBox}>
                    <ActivityIndicator color="#fff" size="large" />
                    <Text style={styles.scanningText}>Looking up medicine...</Text>
                  </View>
                )}
              </View>
              <View style={styles.overlayHintBox}>
                <Text style={styles.overlayHint}>
                  {scanning ? '🔍 Searching database...' : 'Align barcode within the frame'}
                </Text>
              </View>
            </View>
          </CameraView>

          <View style={styles.scanActions}>
            <TouchableOpacity testID="add-medicine-btn" style={styles.manualBtn} onPress={() => setShowManual(true)}>
              <Text style={styles.manualBtnText}>✏️ Add Manually</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.myMedsBtn}
              onPress={() => { setView('list'); loadMedicines(); }}
            >
              <Text style={styles.myMedsBtnText}>
                💊 My Medicines ({savedMedicines.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Result View */}
      {view === 'result' && foundMedicine && (
        <View style={{ flex: 1, padding: 20 }}>
          <MedicineResultCard
            medicine={foundMedicine}
            onSave={handleSaveMedicine}
            onRescan={() => { setView('scanner'); setScanned(false); setFoundMedicine(null); }}
          />
        </View>
      )}

      {/* List View */}
      {view === 'list' && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.scanNewBtn}
            onPress={() => { setView('scanner'); setScanned(false); }}
          >
            <Text style={styles.scanNewBtnText}>📷 Scan New Medicine</Text>
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
                  <Text style={styles.emptySub}>Scan a barcode or add manually</Text>
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
      )}

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
  scannerContainer: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', gap: 24,
  },
  overlayTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scanFrame: {
    width: 280, height: 180, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  corner: {
    position: 'absolute', width: 28, height: 28,
    borderColor: '#00B4D8', borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  scanningBox: { alignItems: 'center', gap: 10 },
  scanningText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  overlayHintBox: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  overlayHint: { color: '#fff', fontSize: 13, fontWeight: '600' },
  scanActions: {
    flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff',
    shadowColor: '#03045E', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
  },
  manualBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#03045E',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  manualBtnText: { color: '#03045E', fontWeight: '700', fontSize: 14 },
  myMedsBtn: {
    flex: 1, backgroundColor: '#03045E',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  myMedsBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  resultCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 16,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
  },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultIconBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: '#F0F4F8', alignItems: 'center', justifyContent: 'center',
  },
  resultIcon: { fontSize: 32 },
  resultName: { fontSize: 18, fontWeight: '800', color: '#03045E' },
  resultGeneric: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  categoryBadge: {
    backgroundColor: '#E8F4FD', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  categoryText: { fontSize: 10, fontWeight: '700', color: '#0077B6' },
  resultDetails: { gap: 12 },
  resultDetailRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  resultDetailIcon: { fontSize: 16, marginTop: 2 },
  resultDetailLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', letterSpacing: 0.5 },
  resultDetailValue: { fontSize: 13, color: '#03045E', lineHeight: 18, marginTop: 2 },
  reminderHint: {
    backgroundColor: '#E8F4FD', borderRadius: 12, padding: 12,
  },
  reminderHintText: { fontSize: 12, color: '#0077B6', fontWeight: '500', textAlign: 'center' },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 },
  fieldBox: {
    backgroundColor: '#F8FAFC', borderRadius: 14,
    paddingHorizontal: 16, height: 50,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    justifyContent: 'center',
  },
  fieldInput: { fontSize: 14, color: '#03045E' },
  resultBtns: { flexDirection: 'row', gap: 10 },
  rescanBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#03045E',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  rescanBtnText: { color: '#03045E', fontWeight: '700', fontSize: 13 },
  saveBtn: {
    flex: 1, backgroundColor: '#03045E',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
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
  permBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  permIconBox: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: '#E8F4FD', alignItems: 'center', justifyContent: 'center',
  },
  permIcon: { fontSize: 52 },
  permTitle: { fontSize: 20, fontWeight: '800', color: '#03045E' },
  permSub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  permBtn: {
    backgroundColor: '#03045E', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 32, marginTop: 8,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
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
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
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