import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, Linking
} from 'react-native';

export default function DoctorDetailScreen({ navigation, route }) {
  const { doctor } = route.params;

  const callDoctor = () => {
    const cleaned = doctor.phone ? doctor.phone.replace(/\s+/g, '') : '';
    Linking.openURL(`tel:${cleaned}`);
  };

  const getDirections = () => {
    const address = encodeURIComponent(`${doctor.clinic}, ${doctor.area}, ${doctor.city}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
  };

  const getDayRange = () => {
    if (!doctor.timings) return 'Mon–Sat';
    const match = doctor.timings.match(/^[^:]+/);
    return match ? match[0].trim() : 'Mon–Sat';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.avatarBox}>
            <Text style={styles.avatarIcon}>👨‍⚕️</Text>
          </View>

          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
          <Text style={styles.doctorQual}>{doctor.qualification}</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>★ {doctor.rating}</Text>
            <Text style={styles.reviewsText}>({doctor.reviews} Reviews)</Text>
          </View>

          <View style={styles.availBadge}>
            <View style={styles.availDot} />
            <Text style={styles.availText}>Available Today</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{doctor.experience}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🕐</Text>
            <Text style={styles.statValue}>{getDayRange()}</Text>
            <Text style={styles.statLabel}>Availability</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>₹{doctor.fee}</Text>
            <Text style={styles.statLabel}>Consultation Fee</Text>
          </View>
        </View>

        <View style={styles.content}>

          {/* About */}
          <Text style={styles.sectionTitle}>About Doctor</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.aboutText}>
              {doctor.qualification}. Expert {doctor.specialization} with {doctor.experience} of experience at {doctor.clinic}, {doctor.city}.
            </Text>
          </View>

          {/* Languages */}
          {doctor.languages && doctor.languages.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Languages Spoken</Text>
              <View style={styles.sectionCard}>
                <View style={styles.langRow}>
                  {doctor.languages.map(lang => (
                    <View key={lang} style={styles.langBadge}>
                      <Text style={styles.langText}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Clinic Address */}
          <Text style={styles.sectionTitle}>Clinic Address</Text>
          <View style={styles.sectionCard}>
            <View style={styles.addressRow}>
              <Text style={styles.addressIcon}>📍</Text>
              <View>
                <Text style={styles.clinicName}>{doctor.clinic}</Text>
                <Text style={styles.clinicAddress}>{doctor.area}, {doctor.city}</Text>
                <Text style={styles.clinicState}>{doctor.state}</Text>
              </View>
            </View>
          </View>

          {/* Clinic Timings */}
          <Text style={styles.sectionTitle}>Clinic Timings</Text>
          <View style={styles.sectionCard}>
            <View style={styles.timingRow}>
              <Text style={styles.timingIcon}>🕐</Text>
              <Text style={styles.timingText}>{doctor.timings}</Text>
            </View>
          </View>

          {/* Contact */}
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.sectionCard}>
            <View style={styles.timingRow}>
              <Text style={styles.timingIcon}>📞</Text>
              <Text style={styles.timingText}>{doctor.phone}</Text>
            </View>
          </View>

          {/* Distance */}
          {doctor.distance !== undefined && (
            <>
              <Text style={styles.sectionTitle}>Distance</Text>
              <View style={styles.sectionCard}>
                <View style={styles.timingRow}>
                  <Text style={styles.timingIcon}>📏</Text>
                  <Text style={styles.timingText}>{doctor.distance} km from your location</Text>
                </View>
              </View>
            </>
          )}

        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomBtns}>
        <TouchableOpacity style={styles.callBtn} onPress={callDoctor}>
          <Text style={styles.callBtnText}>📞 Call Now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dirBtn} onPress={getDirections}>
          <Text style={styles.dirBtnText}>🗺️ Get Directions</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  hero: {
    backgroundColor: '#03045E', paddingBottom: 32,
    alignItems: 'center', overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: '#0077B6', opacity: 0.2, top: -80, right: -60,
  },
  bgCircle2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#00B4D8', opacity: 0.15, bottom: -60, left: -40,
  },
  backBtn: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  backText: { color: '#90E0EF', fontWeight: '600', fontSize: 14 },
  avatarBox: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 14,
  },
  avatarIcon: { fontSize: 56 },
  doctorName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  doctorSpec: { fontSize: 14, color: '#90E0EF', fontWeight: '600', marginBottom: 2 },
  doctorQual: { fontSize: 12, color: 'rgba(144,224,239,0.7)', marginBottom: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  ratingText: { fontSize: 16, fontWeight: '800', color: '#F4A261' },
  reviewsText: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(45,198,83,0.15)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(45,198,83,0.3)',
  },
  availDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2DC653' },
  availText: { color: '#2DC653', fontWeight: '700', fontSize: 13 },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: 20, marginTop: -20, borderRadius: 20,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
    overflow: 'hidden',
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4 },
  statDivider: { width: 1, backgroundColor: '#F0F4F8', marginVertical: 12 },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 13, fontWeight: '800', color: '#03045E', textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textAlign: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 24, gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#03045E', marginTop: 16, marginBottom: 8 },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  aboutText: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langBadge: {
    backgroundColor: '#E8F4FD', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  langText: { fontSize: 13, color: '#0077B6', fontWeight: '600' },
  addressRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  addressIcon: { fontSize: 20, marginTop: 2 },
  clinicName: { fontSize: 14, fontWeight: '700', color: '#03045E' },
  clinicAddress: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  clinicState: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  timingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timingIcon: { fontSize: 18 },
  timingText: { fontSize: 14, color: '#03045E', fontWeight: '500', flex: 1 },
  bottomBtns: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 12, padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    shadowColor: '#03045E', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },
  callBtn: {
    flex: 1, backgroundColor: '#03045E', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dirBtn: {
    flex: 1, backgroundColor: '#E8F4FD', borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#0077B6',
  },
  dirBtnText: { color: '#0077B6', fontWeight: '700', fontSize: 15 },
});