import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0)).current;
  const ring1Opacity = useRef(new Animated.Value(0.4)).current;
  const ring2Opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(ring1Scale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
        Animated.spring(ring2Scale, { toValue: 1.2, tension: 30, friction: 8, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    if (Platform.OS === 'web' && window.location.pathname !== '/' && window.location.pathname !== '') {
      return;
    }
    const timer = setTimeout(() => navigation.replace('Onboarding'), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Pulsing rings */}
      <Animated.View style={[styles.ring, styles.ring2, {
        transform: [{ scale: ring2Scale }], opacity: ring2Opacity
      }]} />
      <Animated.View style={[styles.ring, styles.ring1, {
        transform: [{ scale: ring1Scale }], opacity: ring1Opacity
      }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, {
        transform: [{ scale: logoScale }], opacity: logoOpacity
      }]}>
        <View style={styles.logoOuter}>
          <View style={styles.logoInner}>
            <Text style={styles.logoPlus}>✚</Text>
          </View>
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 28 }}>
        <Text style={styles.title}>Cureconnect</Text>
        <View style={styles.titleUnderline} />
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Your AI Health Companion
      </Animated.Text>

      {/* Bottom badge */}
      <Animated.View style={[styles.badge, { opacity: taglineOpacity }]}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>SIMATS ENGINEERING</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03045E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute', width: 500, height: 500, borderRadius: 250,
    backgroundColor: '#0077B6', opacity: 0.15, top: -120, right: -100,
  },
  bgCircle2: {
    position: 'absolute', width: 350, height: 350, borderRadius: 175,
    backgroundColor: '#00B4D8', opacity: 0.1, bottom: -80, left: -80,
  },
  bgCircle3: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#90E0EF', opacity: 0.07, bottom: 100, right: 40,
  },
  ring: {
    position: 'absolute', borderRadius: 999, borderWidth: 1.5,
    borderColor: '#00B4D8',
  },
  ring1: { width: 180, height: 180 },
  ring2: { width: 260, height: 260 },
  logoWrap: { alignItems: 'center', justifyContent: 'center' },
  logoOuter: {
    width: 120, height: 120, borderRadius: 36,
    backgroundColor: 'rgba(0,180,216,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,180,216,0.4)',
  },
  logoInner: {
    width: 86, height: 86, borderRadius: 26,
    backgroundColor: '#0077B6',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#00B4D8', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 20, elevation: 10,
  },
  logoPlus: { fontSize: 44, color: '#fff', fontWeight: '300' },
  title: {
    fontSize: 42, fontWeight: '800', color: '#fff',
    letterSpacing: -1.5,
  },
  titleUnderline: {
    width: 48, height: 3, backgroundColor: '#00B4D8',
    borderRadius: 2, marginTop: 6,
  },
  tagline: {
    fontSize: 14, color: 'rgba(144,224,239,0.8)',
    letterSpacing: 1.5, marginTop: 10, textTransform: 'uppercase',
  },
  badge: {
    position: 'absolute', bottom: 52,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00B4D8' },
  badgeText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
});