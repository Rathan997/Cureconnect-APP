import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, AppState, Platform
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useUserStore from '../store/userStore';
import { familyAPI } from '../services/api';

const FAMILY_KEY = 'Cureconnect_family';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELATIONS = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandparent', 'Other'];
const RELATION_ICONS = {
  Father: '👨', Mother: '👩', Spouse: '💑', Son: '👦',
  Daughter: '👧', Brother: '🧑', Sister: '👱‍♀️', Grandparent: '👴', Other: '🧑',
};

// ─── Add Medicine Modal ───────────────────────────────
function AddMedicineModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState('');
  const [expiry, setExpiry] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleAdd = () => {
    if (!name.trim()) { Alert.alert('Missing Info', 'Please enter medicine name.'); return; }
    if (!times.trim()) { Alert.alert('Missing Info', 'Please enter reminder times.'); return; }
    onAdd({
      id: `med_${Date.now()}`,
      name: name.trim(),
      dosage: dosage.trim() || '',
      times: times.split(',').map(t => t.trim()).filter(Boolean),
      expiry: expiry.trim() || '',
      instructions: instructions.trim() || '',
      addedAt: new Date().toISOString(),
    });
  };

  return (
    <View style={styles.modalOverlay}>
      <ScrollView>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>💊 Add Medicine</Text>
          <Text style={styles.modalSub}>No barcode? Add manually below</Text>

          {[
            { label: 'MEDICINE NAME *', value: name, setter: setName, placeholder: 'e.g. Metformin 500mg', icon: '💊' },
            { label: 'DOSAGE', value: dosage, setter: setDosage, placeholder: 'e.g. 1 tablet twice daily', icon: '📋' },
            { label: 'REMINDER TIMES *', value: times, setter: setTimes, placeholder: 'e.g. 8:00 AM, 9:00 PM', icon: '⏰' },
            { label: 'EXPIRY DATE', value: expiry, setter: setExpiry, placeholder: 'e.g. 12/2026', icon: '📅' },
            { label: 'INSTRUCTIONS', value: instructions, setter: setInstructions, placeholder: 'e.g. Take after food', icon: '📝' },
          ].map(field => (
            <View key={field.label} style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldIcon}>{field.icon}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={field.placeholder}
                  placeholderTextColor="#9CA3AF"
                  value={field.value}
                  onChangeText={field.setter}
                />
              </View>
            </View>
          ))}

          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              💡 Enter times separated by commas: "8:00 AM, 2:00 PM, 9:00 PM"
            </Text>
          </View>

          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalAddBtn} onPress={handleAdd}>
              <Text style={styles.modalAddText}>Add Medicine</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Add Member Modal ─────────────────────────────────
function AddMemberModal({ onAdd, onClose }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [relation, setRelation] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [conditions, setConditions] = useState('');
  const [phone, setPhone] = useState('');

  const handleAdd = () => {
    if (!name.trim()) { Alert.alert('Missing Name', 'Please enter a name.'); return; }
    if (!relation) { Alert.alert('Missing Relation', 'Please select a relation.'); return; }
    onAdd({ name: name.trim(), age, relation, blood_group: bloodGroup, conditions, phone });
  };

  return (
    <View style={styles.modalOverlay}>
      <ScrollView>
        <View style={styles.modal}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Family Member</Text>

          {[
            { label: 'FULL NAME *', value: name, setter: setName, placeholder: 'e.g. Rajesh Kumar', icon: '👤', keyboard: 'default' },
            { label: 'AGE', value: age, setter: setAge, placeholder: 'e.g. 65', icon: '🎂', keyboard: 'numeric' },
            { label: 'PHONE NUMBER', value: phone, setter: setPhone, placeholder: '+91 XXXXX XXXXX', icon: '📱', keyboard: 'phone-pad' },
          ].map(field => (
            <View key={field.label} style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldIcon}>{field.icon}</Text>
                <TextInput style={styles.fieldInput} placeholder={field.placeholder}
                  placeholderTextColor="#9CA3AF" value={field.value} onChangeText={field.setter}
                  keyboardType={field.keyboard} />
              </View>
            </View>
          ))}

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>RELATION *</Text>
            <View style={styles.pillRow}>
              {RELATIONS.map(r => (
                <TouchableOpacity key={r} style={[styles.pill, relation === r && styles.pillActive]} onPress={() => setRelation(r)}>
                  <Text style={styles.pillEmoji}>{RELATION_ICONS[r]}</Text>
                  <Text style={[styles.pillText, relation === r && styles.pillTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>BLOOD GROUP</Text>
            <View style={styles.pillRow}>
              {BLOOD_GROUPS.map(bg => (
                <TouchableOpacity key={bg} style={[styles.pill, bloodGroup === bg && styles.pillBlood]} onPress={() => setBloodGroup(bg)}>
                  <Text style={[styles.pillText, bloodGroup === bg && styles.pillTextActive]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>EXISTING CONDITIONS</Text>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldIcon}>🏥</Text>
              <TextInput style={styles.fieldInput} placeholder="e.g. Diabetes, BP"
                placeholderTextColor="#9CA3AF" value={conditions} onChangeText={setConditions} />
            </View>
          </View>

          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalAddBtn} onPress={handleAdd}>
              <Text style={styles.modalAddText}>Add Member</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Member Card ──────────────────────────────────────
function MemberCard({ member, onPress, onDelete }) {
  const age = member.age ? `${member.age} yrs` : '';
  const icon = RELATION_ICONS[member.relation] || '🧑';
  const medicines = member.medicines_list ? JSON.parse(member.medicines_list) : [];

  return (
    <TouchableOpacity style={styles.memberCard} onPress={onPress}>
      <View style={styles.memberLeft}>
        <View style={styles.memberIconBox}>
          <Text style={styles.memberIcon}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{member.name}</Text>
            <View style={styles.relationBadge}>
              <Text style={styles.relationText}>{member.relation}</Text>
            </View>
          </View>
          <Text style={styles.memberMeta}>
            {[age, member.blood_group, member.conditions].filter(Boolean).join(' · ')}
          </Text>
          <View style={styles.memberStats}>
            {medicines.length > 0 && (
              <View style={styles.memberStat}>
                <Text style={styles.memberStatIcon}>💊</Text>
                <Text style={styles.memberStatText}>{medicines.length} medicine{medicines.length > 1 ? 's' : ''}</Text>
              </View>
            )}
            <View style={styles.memberStat}>
              <Text style={styles.memberStatIcon}>📅</Text>
              <Text style={styles.memberStatText}>
                {member.last_check_in
                  ? `Last check: ${new Date(member.last_check_in).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                  : 'No check-in yet'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>🗑️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Member Detail View ───────────────────────────────
function MemberDetailView({ member, onBack, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [checkInNote, setCheckInNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [medicines, setMedicines] = useState(
    member.medicines_list ? JSON.parse(member.medicines_list) : []
  );
  const icon = RELATION_ICONS[member.relation] || '🧑';

  const saveMedicines = async (updatedMeds) => {
    setMedicines(updatedMeds);
    const updatedMember = { ...member, medicines_list: JSON.stringify(updatedMeds) };
    try {
      await familyAPI.update(member.id, { medicines: JSON.stringify(updatedMeds) });
    } catch (e) {
      console.warn('Could not save to backend:', e.message);
    }
    onUpdate(updatedMember);
  };

  const handleAddMedicine = async (med) => {
    const updated = [...medicines, med];
    await saveMedicines(updated);
    setShowAddMedicine(false);
    Alert.alert('✅ Added!', `${med.name} added for ${member.name}.\n\nReminder set for: ${med.times.join(', ')}`);
  };

  const handleDeleteMedicine = (medId) => {
    Alert.alert('Remove Medicine', 'Remove this medicine?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          const updated = medicines.filter(m => m.id !== medId);
          await saveMedicines(updated);
        }
      }
    ]);
  };

  const logCheckIn = async () => {
    setSaving(true);
    try {
      await familyAPI.checkIn(member.id, checkInNote);
      const updated = { ...member, last_check_in: new Date().toISOString(), check_in_note: checkInNote.trim() };
      onUpdate(updated);
      setCheckInNote('');
      Alert.alert('✅ Check-in Logged', `Recorded health check for ${member.name}`);
    } catch (e) {
      Alert.alert('Error', 'Could not log check-in. Please try again.');
    }
    setSaving(false);
  };

  return (
    <View style={styles.detailContainer}>
      <View style={styles.detailHeader}>
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.detailHeroRow}>
          <View style={styles.detailIconBox}>
            <Text style={styles.detailIcon}>{icon}</Text>
          </View>
          <View>
            <Text style={styles.detailName}>{member.name}</Text>
            <Text style={styles.detailMeta}>
              {member.relation}{member.age ? ` · ${member.age} yrs` : ''}
              {member.blood_group ? ` · ${member.blood_group}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.detailStats}>
          <View style={styles.detailStat}>
            <Text style={styles.detailStatValue}>
              {member.last_check_in
                ? new Date(member.last_check_in).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : 'Never'}
            </Text>
            <Text style={styles.detailStatLabel}>Last Check-in</Text>
          </View>
          <View style={styles.detailStatDivider} />
          <View style={styles.detailStat}>
            <Text style={styles.detailStatValue}>{medicines.length}</Text>
            <Text style={styles.detailStatLabel}>Medicines</Text>
          </View>
          <View style={styles.detailStatDivider} />
          <View style={styles.detailStat}>
            <Text style={styles.detailStatValue}>{member.phone || 'N/A'}</Text>
            <Text style={styles.detailStatLabel}>Phone</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        {['overview', 'medicines', 'checkin'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'overview' ? '📋 Info' : tab === 'medicines' ? `💊 Meds (${medicines.length})` : '✅ Check-in'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Personal Information</Text>
              {[
                { label: 'Full Name', value: member.name, icon: '👤' },
                { label: 'Age', value: member.age || 'Not set', icon: '🎂' },
                { label: 'Phone', value: member.phone || 'Not set', icon: '📱' },
                { label: 'Blood Group', value: member.blood_group || 'Not set', icon: '🩸' },
                { label: 'Conditions', value: member.conditions || 'None', icon: '🏥' },
              ].map(item => (
                <View key={item.label} style={styles.infoRow}>
                  <Text style={styles.infoIcon}>{item.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            {member.check_in_note && (
              <View style={[styles.infoCard, { marginTop: 14 }]}>
                <Text style={styles.infoCardTitle}>Last Check-in Note</Text>
                <Text style={{ color: '#6B7280', fontSize: 14, lineHeight: 20 }}>"{member.check_in_note}"</Text>
                {member.last_check_in && (
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
                    🕐 {new Date(member.last_check_in).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Medicines Tab */}
        {activeTab === 'medicines' && (
          <View style={styles.tabContent}>
            <TouchableOpacity style={styles.addMedBtn} onPress={() => setShowAddMedicine(true)}>
              <Text style={styles.addMedBtnText}>➕ Add Medicine Manually</Text>
            </TouchableOpacity>

            {medicines.length === 0 ? (
              <View style={styles.emptyMeds}>
                <Text style={styles.emptyMedsIcon}>💊</Text>
                <Text style={styles.emptyMedsTitle}>No medicines added yet</Text>
                <Text style={styles.emptyMedsSub}>Add medicines to track and get reminders</Text>
              </View>
            ) : (
              medicines.map(med => (
                <View key={med.id} style={styles.medCard}>
                  <View style={styles.medTop}>
                    <View style={styles.medIconBox}>
                      <Text style={styles.medIcon}>💊</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{med.name}</Text>
                      {med.dosage ? <Text style={styles.medDosage}>{med.dosage}</Text> : null}
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteMedicine(med.id)}>
                      <Text style={{ fontSize: 18 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.medDetails}>
                    <View style={styles.medDetailRow}>
                      <Text style={styles.medDetailIcon}>⏰</Text>
                      <Text style={styles.medDetailText}>
                        {Array.isArray(med.times) ? med.times.join(', ') : med.times}
                      </Text>
                    </View>
                    {med.expiry ? (
                      <View style={styles.medDetailRow}>
                        <Text style={styles.medDetailIcon}>📅</Text>
                        <Text style={styles.medDetailText}>Expires: {med.expiry}</Text>
                      </View>
                    ) : null}
                    {med.instructions ? (
                      <View style={styles.medDetailRow}>
                        <Text style={styles.medDetailIcon}>📝</Text>
                        <Text style={styles.medDetailText}>{med.instructions}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.reminderBadge}>
                    <Text style={styles.reminderBadgeText}>
                      🔔 Reminder: {Array.isArray(med.times) ? med.times.join(' · ') : med.times}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Check-in Tab */}
        {activeTab === 'checkin' && (
          <View style={styles.tabContent}>
            <View style={styles.checkinCard}>
              <Text style={styles.checkinTitle}>📋 Log Health Check-in</Text>
              <Text style={styles.checkinSub}>Record how {member.name} is feeling today</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldIcon}>📝</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Feeling good, took all medicines"
                  placeholderTextColor="#9CA3AF"
                  value={checkInNote}
                  onChangeText={setCheckInNote}
                />
              </View>

              {/* Medicine checklist */}
              {medicines.length > 0 && (
                <View style={styles.medCheckList}>
                  <Text style={styles.medCheckTitle}>💊 Today's Medicines</Text>
                  {medicines.map(med => (
                    <View key={med.id} style={styles.medCheckRow}>
                      <Text style={styles.medCheckIcon}>💊</Text>
                      <Text style={styles.medCheckName}>{med.name}</Text>
                      <Text style={styles.medCheckTime}>
                        {Array.isArray(med.times) ? med.times[0] : med.times}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.checkinBtn, saving && { opacity: 0.7 }]}
                onPress={logCheckIn}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.checkinBtnText}>✅ Log Check-in</Text>
                }
              </TouchableOpacity>
            </View>

            {member.last_check_in && (
              <View style={styles.lastCheckinCard}>
                <Text style={styles.lastCheckinTitle}>Last Check-in</Text>
                <Text style={styles.lastCheckinTime}>
                  🕐 {new Date(member.last_check_in).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                {member.check_in_note && <Text style={styles.lastCheckinNote}>"{member.check_in_note}"</Text>}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {showAddMedicine && (
        <AddMedicineModal
          onAdd={handleAddMedicine}
          onClose={() => setShowAddMedicine(false)}
        />
      )}
    </View>
  );
}

async function showWebNotification(title, body) {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (window.Notification.permission === 'granted') {
      new window.Notification(title, { body });
    } else if (window.Notification.permission !== 'denied') {
      const permission = await window.Notification.requestPermission();
      if (permission === 'granted') {
        new window.Notification(title, { body });
      } else {
        window.alert(title + '\n' + body);
      }
    } else {
      window.alert(title + '\n' + body);
    }
  } else {
    window.alert(title + '\n' + body);
  }
}

// ─── Main Screen ──────────────────────────────────────
export default function FamilyScreen({ navigation }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const { user } = useUserStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission !== 'granted' && window.Notification.permission !== 'denied') {
        window.Notification.requestPermission();
      }
    }

    loadMembers();

    // Check medicine reminders when app comes to foreground
    const subscription = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkMedicineReminders();
      }
      appState.current = nextState;
    });

    // Check on first load too
    checkMedicineReminders();

    return () => subscription.remove();
  }, []);

  const checkMedicineReminders = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAMILY_KEY);
      if (!stored) return;
      const familyMembers = JSON.parse(stored);
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      for (const member of familyMembers) {
        if (!member.medicines_list) continue;
        const meds = JSON.parse(member.medicines_list);
        for (const med of meds) {
          const times = Array.isArray(med.times) ? med.times : [med.times];
          for (const timeStr of times) {
            const parsed = parseTime(timeStr);
            if (!parsed) continue;
            if (parsed.hour === currentHour && Math.abs(parsed.minute - currentMinute) <= 2) {
              if (Platform.OS !== 'web') {
                Notifications.scheduleNotificationAsync({
                  content: {
                    title: '💊 Medicine Reminder',
                    body: `Time for ${member.name} to take ${med.name}!\n${med.dosage || ''}\n${med.instructions || ''}`.trim(),
                    sound: true,
                    priority: 'max',
                    color: '#03045E',
                  },
                  trigger: null,
                }).catch(err => console.warn(err));
              } else {
                showWebNotification(
                  `💊 Medicine Reminder`,
                  `Time for ${member.name} to take ${med.name}!\n${med.dosage || ''}\n${med.instructions || ''}`.trim()
                );
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Reminder check error:', e);
    }
  };

  const parseTime = (timeStr) => {
    try {
      const upper = timeStr.toUpperCase().trim();
      const match = upper.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);
      if (!match) return null;
      let hour = parseInt(match[1]);
      const minute = match[2] ? parseInt(match[2]) : 0;
      const period = match[3];
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return { hour, minute };
    } catch { return null; }
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await familyAPI.getAll();
      const mems = data.members || [];
      setMembers(mems);
      await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(mems));
    } catch (e) {
      try {
        const stored = await AsyncStorage.getItem(FAMILY_KEY);
        if (stored) setMembers(JSON.parse(stored));
      } catch (err) { console.warn(err); }
    }
    setLoading(false);
  };

  const saveMembers = async (updated) => {
    await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(updated));
    setMembers(updated);
  };

  const handleAddMember = async (member) => {
    try {
      await familyAPI.add({ ...member, userId: user?.uid });
      await loadMembers();
      setShowAddModal(false);
      Alert.alert('✅ Added!', `${member.name} has been added to your family.`);
    } catch (e) {
      const updated = [...members, { ...member, id: `member_${Date.now()}`, medicines_list: '[]', addedAt: new Date().toISOString() }];
      await saveMembers(updated);
      setShowAddModal(false);
      Alert.alert('✅ Added!', `${member.name} has been added to your family.`);
    }
  };

  const handleDeleteMember = (id) => {
    Alert.alert('Remove Member', 'Remove this family member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await familyAPI.delete(id);
            await loadMembers();
          } catch (e) {
            const updated = members.filter(m => m.id !== id);
            await saveMembers(updated);
          }
        }
      }
    ]);
  };

  const handleUpdateMember = async (updated) => {
    const updatedList = members.map(m => m.id === updated.id ? updated : m);
    setMembers(updatedList);
    await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(updatedList));
    setSelectedMember(updated);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#0077B6" size="large" />
          <Text style={{ color: '#9CA3AF', marginTop: 12 }}>Loading family members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedMember) {
    return (
      <SafeAreaView style={styles.safe}>
        <MemberDetailView
          member={selectedMember}
          onBack={() => { setSelectedMember(null); loadMembers(); }}
          onUpdate={handleUpdateMember}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Health</Text>
        <Text style={styles.headerSub}>Monitor your loved ones</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {members.length > 0 && (
          <View style={styles.summaryRow}>
            {[
              { label: 'Members', value: members.length, icon: '👨‍👩‍👧', color: '#0077B6' },
              {
                label: 'Checked In', icon: '✅', color: '#2DC653',
                value: members.filter(m => {
                  if (!m.last_check_in) return false;
                  return new Date(m.last_check_in).toDateString() === new Date().toDateString();
                }).length,
              },
              {
                label: 'Need Attention', icon: '⚠️', color: '#E63946',
                value: members.filter(m => !m.last_check_in).length,
              },
            ].map(s => (
              <View key={s.label} style={styles.summaryCard}>
                <Text style={styles.summaryIcon}>{s.icon}</Text>
                <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👨‍👩‍👧</Text>
            <Text style={styles.emptyStateTitle}>No family members yet</Text>
            <Text style={styles.emptyStateSub}>Add your family members to monitor their health and daily check-ins</Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addFirstBtnText}>➕ Add First Member</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {members.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                onPress={() => setSelectedMember(member)}
                onDelete={() => handleDeleteMember(member.id)}
              />
            ))}
            <TouchableOpacity style={styles.addMoreBtn} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addMoreBtnText}>➕ Add Another Member</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {members.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {showAddModal && (
        <AddMemberModal onAdd={handleAddMember} onClose={() => setShowAddModal(false)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#03045E', paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden',
  },
  bgCircle1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#0077B6', opacity: 0.2, top: -80, right: -60 },
  bgCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#00B4D8', opacity: 0.1, bottom: -40, left: -40 },
  backBtn: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  backText: { color: '#90E0EF', fontWeight: '600', fontSize: 14 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', paddingHorizontal: 20, marginTop: 4 },
  headerSub: { fontSize: 13, color: 'rgba(144,224,239,0.7)', paddingHorizontal: 20, marginTop: 4 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 4 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  summaryIcon: { fontSize: 24 },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textAlign: 'center' },
  memberCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  memberLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberIconBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#F0F4F8', alignItems: 'center', justifyContent: 'center' },
  memberIcon: { fontSize: 32 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  memberName: { fontSize: 16, fontWeight: '800', color: '#03045E' },
  relationBadge: { backgroundColor: '#E8F4FD', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  relationText: { fontSize: 10, fontWeight: '700', color: '#0077B6' },
  memberMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  memberStats: { flexDirection: 'row', gap: 12, marginTop: 6, flexWrap: 'wrap' },
  memberStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberStatIcon: { fontSize: 12 },
  memberStatText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 20 },
  addMoreBtn: { marginTop: 14, borderWidth: 2, borderColor: '#03045E', borderStyle: 'dashed', borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  addMoreBtnText: { color: '#03045E', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 20 },
  emptyStateIcon: { fontSize: 64 },
  emptyStateTitle: { fontSize: 20, fontWeight: '800', color: '#03045E' },
  emptyStateSub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  addFirstBtn: { backgroundColor: '#03045E', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  addFirstBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#03045E', alignItems: 'center', justifyContent: 'center', shadowColor: '#03045E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' },
  detailContainer: { flex: 1 },
  detailHeader: { backgroundColor: '#03045E', paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  detailHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, marginBottom: 16 },
  detailIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  detailIcon: { fontSize: 36 },
  detailName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  detailMeta: { fontSize: 13, color: 'rgba(144,224,239,0.7)', marginTop: 2 },
  detailStats: { marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  detailStat: { alignItems: 'center', gap: 4, flex: 1 },
  detailStatValue: { fontSize: 13, fontWeight: '800', color: '#fff' },
  detailStatLabel: { fontSize: 10, color: 'rgba(144,224,239,0.7)', fontWeight: '600' },
  detailStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 6 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB' },
  tabActive: { backgroundColor: '#03045E', borderColor: '#03045E' },
  tabText: { fontSize: 10, fontWeight: '700', color: '#9CA3AF' },
  tabTextActive: { color: '#fff' },
  detailScroll: { flex: 1 },
  tabContent: { paddingHorizontal: 20, paddingTop: 4 },
  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 14, shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  infoCardTitle: { fontSize: 15, fontWeight: '800', color: '#03045E' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { fontSize: 18 },
  infoLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#03045E', fontWeight: '500', marginTop: 1 },
  addMedBtn: { backgroundColor: '#03045E', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 14 },
  addMedBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyMeds: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyMedsIcon: { fontSize: 48 },
  emptyMedsTitle: { fontSize: 16, fontWeight: '700', color: '#03045E' },
  emptyMedsSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  medCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, gap: 10, shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  medTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0F4F8', alignItems: 'center', justifyContent: 'center' },
  medIcon: { fontSize: 24 },
  medName: { fontSize: 15, fontWeight: '700', color: '#03045E' },
  medDosage: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  medDetails: { gap: 6 },
  medDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medDetailIcon: { fontSize: 13 },
  medDetailText: { fontSize: 13, color: '#6B7280', flex: 1 },
  reminderBadge: { backgroundColor: '#E8F4FD', borderRadius: 10, padding: 10 },
  reminderBadgeText: { fontSize: 12, color: '#0077B6', fontWeight: '600' },
  medCheckList: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, gap: 8 },
  medCheckTitle: { fontSize: 13, fontWeight: '700', color: '#03045E', marginBottom: 4 },
  medCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medCheckIcon: { fontSize: 14 },
  medCheckName: { flex: 1, fontSize: 13, color: '#03045E', fontWeight: '500' },
  medCheckTime: { fontSize: 12, color: '#0077B6', fontWeight: '600' },
  checkinCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 12, shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  checkinTitle: { fontSize: 15, fontWeight: '800', color: '#03045E' },
  checkinSub: { fontSize: 13, color: '#9CA3AF' },
  checkinBtn: { backgroundColor: '#03045E', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  checkinBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  lastCheckinCard: { backgroundColor: '#E8F4FD', borderRadius: 16, padding: 16, marginTop: 14, gap: 6 },
  lastCheckinTitle: { fontSize: 13, fontWeight: '700', color: '#03045E' },
  lastCheckinTime: { fontSize: 13, color: '#0077B6', fontWeight: '500' },
  lastCheckinNote: { fontSize: 13, color: '#6B7280', fontStyle: 'italic' },
  hintBox: { backgroundColor: '#FDF4E8', borderRadius: 10, padding: 10 },
  hintText: { fontSize: 12, color: '#F4A261', fontWeight: '500' },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1 },
  fieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 14, height: 50, gap: 10, borderWidth: 1.5, borderColor: '#E5E7EB' },
  fieldIcon: { fontSize: 16 },
  fieldInput: { flex: 1, fontSize: 14, color: '#03045E' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F4F8', borderWidth: 1.5, borderColor: '#E5E7EB' },
  pillActive: { backgroundColor: '#03045E', borderColor: '#03045E' },
  pillBlood: { backgroundColor: '#E63946', borderColor: '#E63946' },
  pillEmoji: { fontSize: 14 },
  pillText: { fontSize: 12, fontWeight: '600', color: '#03045E' },
  pillTextActive: { color: '#fff' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#03045E' },
  modalSub: { fontSize: 13, color: '#9CA3AF', marginTop: -8 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { color: '#9CA3AF', fontWeight: '600' },
  modalAddBtn: { flex: 1, backgroundColor: '#03045E', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalAddText: { color: '#fff', fontWeight: '700' },
});