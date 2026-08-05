import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMERGENCY_CONTACTS = [
  { id: '1', name: 'Ambulance', number: '108', icon: '🚑', color: '#E63946', bg: '#FDE8E8' },
  { id: '2', name: 'Police', number: '100', icon: '🚔', color: '#0077B6', bg: '#E8F4FD' },
  { id: '3', name: 'Fire', number: '101', icon: '🚒', color: '#F4A261', bg: '#FDF4E8' },
  { id: '4', name: 'Women Helpline', number: '1091', icon: '👩', color: '#9B59B6', bg: '#F3E8FD' },
  { id: '5', name: 'Child Helpline', number: '1098', icon: '👶', color: '#2DC653', bg: '#E8FDF4' },
  { id: '6', name: 'Disaster', number: '1070', icon: '🆘', color: '#E63946', bg: '#FDE8E8' },
];

const FIRST_AID_TIPS = [
  {
    id: '1', title: 'Heart Attack', icon: '❤️', color: '#E63946',
    steps: [
      'Call 108 immediately',
      'Make person sit or lie comfortably',
      'Loosen tight clothing around chest',
      'Give aspirin if available and not allergic',
      'Begin CPR if person becomes unconscious',
    ],
  },
  {
    id: '2', title: 'Choking', icon: '😮', color: '#F4A261',
    steps: [
      'Ask "Are you choking?"',
      'Encourage to cough forcefully',
      'Give 5 firm back blows between shoulder blades',
      'Give 5 abdominal thrusts (Heimlich maneuver)',
      'Repeat until object dislodged or help arrives',
    ],
  },
  {
    id: '3', title: 'Severe Bleeding', icon: '🩸', color: '#E63946',
    steps: [
      'Call 108 immediately',
      'Apply firm pressure with clean cloth',
      'Do NOT remove cloth — add more on top',
      'Elevate the injured area if possible',
      'Keep person warm and calm',
    ],
  },
  {
    id: '4', title: 'Burns', icon: '🔥', color: '#F4A261',
    steps: [
      'Cool burn under cold running water for 10 min',
      'Do NOT use ice, butter or toothpaste',
      'Cover loosely with clean non-fluffy bandage',
      'Do NOT break blisters',
      'Seek medical help for large or deep burns',
    ],
  },
];

export default function EmergencyScreen({ navigation }) {
  const [expandedTip, setExpandedTip] = useState(null);

  const callNumber = (number, name) => {
    if (Platform.OS === 'web') {
      const choice = window.confirm(
        `Emergency Contact: ${name}\nPhone Number: ${number}\n\nCalling is not supported directly on web browsers.\n\nWould you like to search for nearby "${name}" locations on Google Maps?\n(Click Cancel to copy the number to clipboard instead)`
      );
      if (choice) {
        const query = encodeURIComponent(`${name} near me`);
        Linking.openURL(`https://www.google.com/maps/search/${query}`);
      } else {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(number);
          alert(`${name} number (${number}) copied to clipboard.`);
        } else {
          alert(`Please dial manually: ${number}`);
        }
      }
    } else {
      Alert.alert(`Call ${name}`, `Call ${name} on ${number}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: `Call ${number}`, style: 'destructive', onPress: () => Linking.openURL(`tel:${number}`) },
      ]);
    }
  };

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
          <Text style={styles.headerTitle}>Emergency</Text>
          <Text style={styles.headerSub}>Quick access to emergency services</Text>
        </View>

        {/* SOS Button / Web Hospital Search */}
        <View style={styles.sosWrap}>
          <View style={[
            styles.sosRing, 
            Platform.OS === 'web' && { borderRadius: 16, width: 280, height: 80, shadowColor: '#0077B6' }
          ]}>
            <TouchableOpacity
              style={[
                styles.sosBtn, 
                Platform.OS === 'web' && { borderRadius: 12, width: '100%', height: '100%', flexDirection: 'row', gap: 12, backgroundColor: '#0077B6' }
              ]}
              onPress={() => {
                if (Platform.OS === 'web') {
                  Linking.openURL('https://www.google.com/maps/search/hospitals+near+me');
                } else {
                  callNumber('108', 'Ambulance');
                }
              }}
            >
              <Text style={styles.sosBtnIcon}>{Platform.OS === 'web' ? '🏥' : '🚨'}</Text>
              <View style={Platform.OS === 'web' ? { alignItems: 'flex-start' } : { alignItems: 'center' }}>
                <Text style={[
                  styles.sosBtnTitle, 
                  Platform.OS === 'web' && { fontSize: 16, letterSpacing: 0.5 }
                ]}>
                  {Platform.OS === 'web' ? 'Find Nearby Hospitals' : 'SOS'}
                </Text>
                <Text style={styles.sosBtnSub}>
                  {Platform.OS === 'web' ? 'Open Google Maps search' : 'Tap to call 108'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.sosHint}>
            {Platform.OS === 'web' 
              ? 'Find and navigate to the nearest hospitals and medical centers' 
              : 'Press the button to immediately call an ambulance'}
          </Text>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <View style={styles.contactsGrid}>
            {EMERGENCY_CONTACTS.map(contact => (
              <TouchableOpacity
                key={contact.id}
                style={[styles.contactCard, { borderTopColor: contact.color }]}
                onPress={() => callNumber(contact.number, contact.name)}
              >
                <Text style={styles.contactIcon}>{contact.icon}</Text>
                <Text style={[styles.contactNumber, { color: contact.color }]}>
                  {contact.number}
                </Text>
                <Text style={styles.contactName}>{contact.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* First Aid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>First Aid Guide</Text>
          <Text style={styles.sectionSub}>Tap any card to expand steps</Text>
          {FIRST_AID_TIPS.map(tip => (
            <TouchableOpacity
              key={tip.id}
              style={styles.tipCard}
              onPress={() => setExpandedTip(expandedTip === tip.id ? null : tip.id)}
              activeOpacity={0.8}
            >
              <View style={styles.tipHeader}>
                <View style={[styles.tipIconBox, { backgroundColor: tip.color + '22' }]}>
                  <Text style={styles.tipIcon}>{tip.icon}</Text>
                </View>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <View style={[
                  styles.tipArrowBox,
                  expandedTip === tip.id && { backgroundColor: tip.color + '22' }
                ]}>
                  <Text style={[styles.tipArrow, { color: tip.color }]}>
                    {expandedTip === tip.id ? '▲' : '▼'}
                  </Text>
                </View>
              </View>

              {expandedTip === tip.id && (
                <View style={styles.tipSteps}>
                  <View style={[styles.tipDivider, { backgroundColor: tip.color + '33' }]} />
                  {tip.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={[styles.stepNum, { backgroundColor: tip.color }]}>
                        <Text style={styles.stepNumText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerIcon}>⚠️</Text>
          <Text style={styles.disclaimerText}>
            This app is not a substitute for professional emergency services. Always call 108 in a life-threatening situation.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  header: {
    backgroundColor: '#03045E', paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#E63946', opacity: 0.15, top: -80, right: -60,
  },
  bgCircle2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#0077B6', opacity: 0.15, bottom: -40, left: -40,
  },
  backBtn: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  backText: { color: '#90E0EF', fontWeight: '600', fontSize: 14 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', paddingHorizontal: 20, marginTop: 4 },
  headerSub: { fontSize: 13, color: 'rgba(144,224,239,0.7)', paddingHorizontal: 20, marginTop: 4 },
  sosWrap: { alignItems: 'center', paddingVertical: 32, gap: 16 },
  sosRing: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 3, borderColor: '#E6394633',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E63946', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  sosBtn: {
    width: 136, height: 136, borderRadius: 68,
    backgroundColor: '#E63946', alignItems: 'center', justifyContent: 'center',
    gap: 2,
  },
  sosBtnIcon: { fontSize: 36 },
  sosBtnTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  sosBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  sosHint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 40 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#03045E', marginBottom: 4 },
  sectionSub: { fontSize: 12, color: '#9CA3AF', marginBottom: 14 },
  contactsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  contactCard: {
    width: '30%', backgroundColor: '#fff', borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 5,
    borderTopWidth: 3,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  contactIcon: { fontSize: 28 },
  contactNumber: { fontSize: 16, fontWeight: '800' },
  contactName: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textAlign: 'center' },
  tipCard: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  tipHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 12,
  },
  tipIconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  tipIcon: { fontSize: 24 },
  tipTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#03045E' },
  tipArrowBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0F4F8',
  },
  tipArrow: { fontSize: 12, fontWeight: '700' },
  tipDivider: { height: 1, marginHorizontal: 16, marginBottom: 12 },
  tipSteps: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  stepNumText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 20 },
  disclaimer: {
    marginHorizontal: 20, backgroundColor: '#FDF4E8',
    borderRadius: 16, padding: 16, flexDirection: 'row',
    gap: 10, alignItems: 'flex-start', marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: '#F4A261',
  },
  disclaimerIcon: { fontSize: 16 },
  disclaimerText: { flex: 1, fontSize: 12, color: '#F4A261', lineHeight: 18, fontWeight: '500' },
});