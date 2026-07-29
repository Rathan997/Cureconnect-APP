import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView, Alert, Linking,
  ActivityIndicator, FlatList
} from 'react-native';
import * as Location from 'expo-location';
import { doctorsAPI } from '../services/api';

const SPECIALIZATIONS = [
  'All', 'General Physician', 'Cardiologist', 'Dermatologist',
  'ENT Specialist', 'Orthopedic', 'Neurologist', 'Pediatrician',
  'Gynecologist', 'Gastroenterologist', 'Diabetologist',
];

export default function DoctorsScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [activeSpec, setActiveSpec] = useState('All');
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('your area');
  const [userLat, setUserLat] = useState(13.0827);
  const [userLng, setUserLng] = useState(80.2707);

  useEffect(() => {
    getLocationAndDoctors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [search, activeSpec, doctors]);

  const getLocationAndDoctors = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 13.0827;
      let lng = 80.2707;

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
        setUserLat(lat);
        setUserLng(lng);

        try {
          const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (geo && geo[0]) {
            const place = geo[0].city || geo[0].subregion || geo[0].region || 'your area';
            setLocationName(place);
          }
        } catch (e) {
          console.warn('Geocode error:', e);
        }
      } else {
        Alert.alert(
          '📍 Location Access',
          'Allow location access to find doctors near you. Showing Chennai doctors by default.',
          [{ text: 'OK' }]
        );
        setLocationName('Chennai');
      }

      await fetchDoctors(lat, lng);
    } catch (e) {
      console.warn('Location error:', e);
      await fetchDoctors(13.0827, 80.2707);
      setLocationName('Chennai');
    }
    setLoading(false);
  };

  const fetchDoctors = async (lat, lng) => {
    try {
      const data = await doctorsAPI.getNearby(lat, lng, 'All', 5000000);
      setDoctors(data.doctors || []);
    } catch (e) {
      console.warn('Fetch doctors error:', e);
      setDoctors([]);
    }
  };

  const applyFilters = () => {
    let result = [...doctors];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        (d.clinic || '').toLowerCase().includes(q) ||
        (d.area || '').toLowerCase().includes(q) ||
        (d.city || '').toLowerCase().includes(q) ||
        (d.state || '').toLowerCase().includes(q)
      );
    }
    if (activeSpec !== 'All') {
      result = result.filter(d => d.specialization === activeSpec);
    }
    setFiltered(result);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.bgCircle} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find Doctors</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <ActivityIndicator color="#0077B6" size="large" />
          <Text style={{ color: '#9CA3AF', fontSize: 14 }}>📍 Finding doctors near you...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>

      <View style={styles.header}>
        <View style={styles.bgCircle} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Doctors</Text>
        <Text style={styles.headerSub}>
          📍 {locationName} — {filtered.length} doctors found
        </Text>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            testID="search-doctors"
            style={styles.searchInput}
            placeholder="Search by name, city, state..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.specsRow}
      >
        {SPECIALIZATIONS.map(spec => (
          <TouchableOpacity
            key={spec}
            style={[styles.specChip, activeSpec === spec && styles.specChipActive]}
            onPress={() => setActiveSpec(spec)}
          >
            <Text style={[styles.specText, activeSpec === spec && styles.specTextActive]}>
              {spec}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.refreshBtn} onPress={getLocationAndDoctors}>
        <Text style={styles.refreshBtnText}>📍 Refresh My Location</Text>
      </TouchableOpacity>

      <FlatList
        testID="doctors-list"
        style={styles.list}
        data={filtered}
        keyExtractor={item => item.id}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No doctors found</Text>
            <Text style={styles.emptySub}>Try searching by city or state name</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
        renderItem={({ item: doctor }) => (
          <TouchableOpacity
            testID="doctor-card"
            style={styles.card}
            onPress={() => navigation.navigate('DoctorDetail', { doctor })}
            activeOpacity={0.9}
          >
            <View style={styles.cardTop}>
              <View style={styles.doctorIconBox}>
                <Text style={styles.doctorIcon}>👨‍⚕️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text testID="doctor-name" style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.rating}>★ {doctor.rating}</Text>
                  <Text style={styles.reviews}>({doctor.reviews} reviews)</Text>
                  <Text style={styles.exp}>· {doctor.experience}</Text>
                </View>
              </View>
              {doctor.distance !== undefined && (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>{doctor.distance} km</Text>
                </View>
              )}
            </View>

            <View style={styles.detailsWrap}>
              <View style={styles.detailPill}>
                <Text style={styles.detailPillText}>🏥 {doctor.clinic}</Text>
              </View>
              <View style={styles.detailPill}>
                <Text style={styles.detailPillText}>📍 {doctor.area}, {doctor.city}</Text>
              </View>
              <View style={styles.detailPill}>
                <Text style={styles.detailPillText}>🗺️ {doctor.state}</Text>
              </View>
              <View style={styles.detailPill}>
                <Text style={styles.detailPillText}>🕐 {doctor.timings}</Text>
              </View>
              <View style={[styles.detailPill, styles.feePill]}>
                <Text style={[styles.detailPillText, { color: '#0077B6', fontWeight: '700' }]}>
                  💰 ₹{doctor.fee}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => navigation.navigate('DoctorDetail', { doctor })}
            >
              <Text style={styles.callBtnText}>View Full Profile →</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
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
  headerSub: { fontSize: 13, color: 'rgba(144,224,239,0.7)', paddingHorizontal: 20, marginBottom: 16 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, paddingHorizontal: 16, height: 48,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  specsRow: { paddingLeft: 20, paddingVertical: 12, flexGrow: 0 },
  specChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', marginRight: 8, borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  specChipActive: { backgroundColor: '#03045E', borderColor: '#03045E' },
  specText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  specTextActive: { color: '#fff' },
  refreshBtn: {
    marginHorizontal: 20, marginBottom: 8, backgroundColor: '#E8F4FD',
    borderRadius: 12, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#0077B6',
  },
  refreshBtnText: { color: '#0077B6', fontWeight: '700', fontSize: 13 },
  list: { flex: 1, paddingHorizontal: 20 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#03045E' },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    marginBottom: 14, gap: 12,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  doctorIconBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: '#F0F4F8', alignItems: 'center', justifyContent: 'center',
  },
  doctorIcon: { fontSize: 32 },
  doctorName: { fontSize: 15, fontWeight: '800', color: '#03045E' },
  doctorSpec: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  rating: { fontSize: 13, fontWeight: '700', color: '#F4A261' },
  reviews: { fontSize: 12, color: '#9CA3AF' },
  exp: { fontSize: 12, color: '#9CA3AF' },
  distanceBadge: {
    backgroundColor: '#E8F4FD', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  distanceText: { fontSize: 12, fontWeight: '700', color: '#0077B6' },
  detailsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailPill: {
    backgroundColor: '#F0F4F8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  feePill: { backgroundColor: '#E8F4FD' },
  detailPillText: { fontSize: 12, color: '#6B7280' },
  callBtn: {
    backgroundColor: '#03045E', borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});