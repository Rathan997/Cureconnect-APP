import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, FlatList
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1', icon: '🩺', gradient: '#0077B6',
    title: 'Smart Symptom\nAnalysis',
    desc: 'Describe your symptoms and get instant AI-powered health insights backed by medical data.',
    tag: 'AI POWERED',
  },
  {
    id: '2', icon: '💊', gradient: '#023E8A',
    title: 'Medicine\nTracker',
    desc: 'Scan barcodes, set reminders, track expiry dates and never miss a dose again.',
    tag: 'SMART REMINDERS',
  },
{
  id: '3', icon: '👨‍⚕️', gradient: '#03045E',
  title: 'Find the Right\nDoctor',
  desc: 'Describe your symptoms and we instantly suggest the perfect verified specialist in Chennai.',
  tag: 'AI SUGGESTED',
},
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goNext = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const current = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={[styles.bg, { backgroundColor: current.gradient }]} />
      <View style={styles.bgCircle} />

      {/* Skip */}
      <TouchableOpacity testID="skip-onboarding" style={styles.skipBtn} onPress={() => navigation.replace('Login')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slide content */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Animated.View style={[styles.slide, { width, opacity: fadeAnim }]}>
            {/* Icon box */}
            <View style={styles.iconBox}>
              <Text style={styles.slideIcon}>{item.icon}</Text>
            </View>

            {/* Tag */}
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>

            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDesc}>{item.desc}</Text>
          </Animated.View>
        )}
      />

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[
              styles.dot,
              i === currentIndex && styles.dotActive,
              i < currentIndex && styles.dotDone,
            ]} />
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
          <Text style={styles.nextBtnText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <Text style={styles.nextArrow}>→</Text>
        </TouchableOpacity>

        <Text style={styles.stepText}>{currentIndex + 1} of {SLIDES.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#03045E' },
  bg: {
    position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.65,
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  bgCircle: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -60,
  },
  skipBtn: {
    position: 'absolute', top: 52, right: 24, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  skipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  slide: {
    paddingHorizontal: 32, paddingTop: 100, alignItems: 'center', gap: 16,
  },
  iconBox: {
    width: 140, height: 140, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },
  slideIcon: { fontSize: 72 },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  tagText: { color: '#90E0EF', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  slideTitle: {
    fontSize: 34, fontWeight: '800', color: '#fff',
    textAlign: 'center', lineHeight: 42, letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: 15, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', lineHeight: 24, paddingHorizontal: 8,
  },
  bottom: {
    position: 'absolute', bottom: 48, left: 0, right: 0,
    paddingHorizontal: 32, alignItems: 'center', gap: 20,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 28, backgroundColor: '#00B4D8' },
  dotDone: { backgroundColor: 'rgba(0,180,216,0.4)' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0077B6', borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 40, width: '100%',
    justifyContent: 'center',
    shadowColor: '#00B4D8', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nextArrow: { color: '#90E0EF', fontSize: 18, fontWeight: '700' },
  stepText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
});