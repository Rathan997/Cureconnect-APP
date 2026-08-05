import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminAPI } from '../services/api';
import useUserStore from '../store/userStore';

export default function AdminDashboardScreen({ navigation }) {
  const { user } = useUserStore();
  const [stats, setStats] = useState({ users: 0, appointments: 0, medicines: 0, symptoms: 0 });
  const [usersList, setUsersList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredUsers(usersList);
    } else {
      const q = search.toLowerCase();
      setFilteredUsers(
        usersList.filter(u =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        )
      );
    }
  }, [search, usersList]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsData = await adminAPI.getStats();
      const usersData = await adminAPI.getUsers();
      setStats(statsData);
      setUsersList(usersData);
      setFilteredUsers(usersData);
    } catch (e) {
      console.warn('Admin fetch error:', e);
      Alert.alert('Error', 'Failed to fetch administrative data.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (targetUser) => {
    if (targetUser.id === user.uid) {
      Alert.alert('Access Denied', 'You cannot revoke your own admin rights.');
      return;
    }

    Alert.alert(
      'Change Role',
      `Are you sure you want to toggle admin rights for ${targetUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await adminAPI.toggleAdmin(targetUser.id);
              Alert.alert('Success', res.message);
              // Refresh data
              fetchData();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to toggle admin status.');
            }
          }
        }
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#03045E" size="large" />
          <Text style={styles.loadingText}>Loading administrative console...</Text>
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
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSub}>Manage CureConnect users and system stats</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* STATS SECTION */}
        <Text style={styles.sectionTitle}>System Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statsCard}>
            <Text style={styles.statsEmoji}>👥</Text>
            <Text style={styles.statsVal}>{stats.users}</Text>
            <Text style={styles.statsLabel}>Total Users</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsEmoji}>📅</Text>
            <Text style={styles.statsVal}>{stats.appointments}</Text>
            <Text style={styles.statsLabel}>Appointments</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsEmoji}>💊</Text>
            <Text style={styles.statsVal}>{stats.medicines}</Text>
            <Text style={styles.statsLabel}>Medicines</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsEmoji}>🩺</Text>
            <Text style={styles.statsVal}>{stats.symptoms}</Text>
            <Text style={styles.statsLabel}>Symptom Checks</Text>
          </View>
        </View>

        {/* USERS LIST SECTION */}
        <View style={styles.userSectionHeader}>
          <Text style={styles.sectionTitle}>Registered Users</Text>
          <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH BOX */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* USER LIST CARDS */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found matching search query.</Text>
          </View>
        ) : (
          filteredUsers.map(item => (
            <View key={item.id} style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                {item.phone ? <Text style={styles.userPhone}>📞 {item.phone}</Text> : null}
              </View>
              <TouchableOpacity
                onPress={() => handleToggleAdmin(item)}
                style={[
                  styles.roleBadge,
                  item.isAdmin ? styles.adminBadge : styles.normalBadge
                ]}
              >
                <Text style={[
                  styles.roleText,
                  item.isAdmin ? styles.adminRoleText : styles.normalRoleText
                ]}>
                  {item.isAdmin ? 'Admin ⚙️' : 'User 👤'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 60 }} />
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
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#0077B6', opacity: 0.2, top: -60, right: -40,
  },
  backBtn: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  backText: { color: '#90E0EF', fontWeight: '600', fontSize: 14 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', paddingHorizontal: 20, marginTop: 4 },
  headerSub: { fontSize: 13, color: 'rgba(144,224,239,0.7)', paddingHorizontal: 20 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#9CA3AF', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#03045E', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statsCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16,
    padding: 16, gap: 4, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6,
  },
  statsEmoji: { fontSize: 24, marginBottom: 4 },
  statsVal: { fontSize: 22, fontWeight: '800', color: '#03045E' },
  statsLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  userSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  refreshBtn: { backgroundColor: '#E8F4FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  refreshText: { color: '#0077B6', fontWeight: '700', fontSize: 12 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 14, height: 48, gap: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 16,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#03045E' },
  clearSearch: { color: '#9CA3AF', fontSize: 16 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center' },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 14, marginBottom: 10, gap: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4,
  },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#00B4D8',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 15, fontWeight: '700', color: '#03045E' },
  userEmail: { fontSize: 12, color: '#9CA3AF' },
  userPhone: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  roleBadge: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', minWidth: 80,
  },
  adminBadge: { backgroundColor: '#E8FBF2' },
  normalBadge: { backgroundColor: '#F0F4F8' },
  roleText: { fontSize: 11, fontWeight: '700' },
  adminRoleText: { color: '#10B981' },
  normalRoleText: { color: '#6B7280' },
});
