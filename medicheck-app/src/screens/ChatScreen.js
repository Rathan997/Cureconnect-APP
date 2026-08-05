import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useUserStore from '../store/userStore';

import { chatbotAPI } from '../services/api';

const QUICK_QUESTIONS = [
  '🤒 I have fever and headache',
  '💊 What is Dolo 650 used for?',
  '🩺 Which doctor for back pain?',
  '🥗 Diet tips for diabetes',
  '😴 How to sleep better?',
  '🧘 Stress relief tips',
];

function MessageBubble({ message, isUser }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      styles.bubbleWrap,
      isUser ? styles.bubbleWrapUser : styles.bubbleWrapBot,
      { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }
    ]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>🤖</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {message.text}
        </Text>
        <Text style={[styles.bubbleTime, isUser ? styles.bubbleTimeUser : styles.bubbleTimeBot]}>
          {new Date(message.timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
          })}
        </Text>
      </View>
    </Animated.View>
  );
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.typingWrap}>
      <View style={styles.botAvatar}>
        <Text style={styles.botAvatarText}>🤖</Text>
      </View>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

export default function ChatbotScreen({ navigation }) {
  const { user } = useUserStore();
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm CureConnect AI, your personal health assistant.\n\nI can help you with:\n💊 Medicine information\n🩺 Symptom analysis\n👨‍⚕️ Doctor recommendations\n🥗 Diet & nutrition\n🧘 Wellness tips\n\nHow can I help you today?`,
      isUser: false,
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory = messages
        .slice(-10)
        .map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text,
        }));

      const data = await chatbotAPI.chat(messageText, conversationHistory);

      if (data && data.reply) {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          isUser: false,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('No response from AI');
      }
    } catch (e) {
      console.warn('Chatbot error:', e);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: '😔 Sorry, I am having trouble connecting right now. Please check your internet connection and try again.\n\nFor urgent health issues please call 108 or visit your nearest hospital.',
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 Chat cleared! How can I help you?`,
      isUser: false,
      timestamp: Date.now(),
    }]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>🗑️ Clear</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatarBox}>
            <Text style={styles.headerAvatar}>🤖</Text>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerName}>CureConnect AI</Text>
            <Text style={styles.headerStatus}>● Online — Ready to help</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map(message => (
            <MessageBubble key={message.id} message={message} isUser={message.isUser} />
          ))}
          {loading && <TypingIndicator />}
          <View style={{ height: 16 }} />
        </ScrollView>

        {messages.length <= 2 && !loading && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickQuestionsRow}
          >
            {QUICK_QUESTIONS.map(q => (
              <TouchableOpacity key={q} style={styles.quickQuestion} onPress={() => sendMessage(q)}>
                <Text style={styles.quickQuestionText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.inputRow}>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything about health..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendBtnText}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 20,
  },
  backBtn: { padding: 4 },
  backText: { color: '#90E0EF', fontWeight: '600', fontSize: 14 },
  clearBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  clearBtnText: { color: '#90E0EF', fontWeight: '600', fontSize: 13 },
  headerInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, marginTop: 16,
  },
  headerAvatarBox: { position: 'relative' },
  headerAvatar: { fontSize: 44 },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#2DC653', borderWidth: 2, borderColor: '#03045E',
  },
  headerName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerStatus: { fontSize: 12, color: '#2DC653', fontWeight: '600', marginTop: 2 },
  messagesContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  bubbleWrap: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  bubbleWrapUser: { justifyContent: 'flex-end' },
  bubbleWrapBot: { justifyContent: 'flex-start', gap: 8 },
  botAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E8F4FD', alignItems: 'center', justifyContent: 'center',
  },
  botAvatarText: { fontSize: 18 },
  bubble: { maxWidth: '75%', borderRadius: 20, padding: 12, gap: 4 },
  bubbleUser: { backgroundColor: '#03045E', borderBottomRightRadius: 4 },
  bubbleBot: {
    backgroundColor: '#fff', borderBottomLeftRadius: 4,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextBot: { color: '#03045E' },
  bubbleTime: { fontSize: 10, alignSelf: 'flex-end' },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.6)' },
  bubbleTimeBot: { color: '#9CA3AF' },
  typingWrap: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 8, marginBottom: 12, paddingHorizontal: 16,
  },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 20, borderBottomLeftRadius: 4,
    padding: 14,
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' },
  quickQuestionsRow: { paddingLeft: 16, paddingVertical: 10, flexGrow: 0 },
  quickQuestion: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
    marginRight: 8, borderWidth: 1.5, borderColor: '#0077B6',
  },
  quickQuestionText: { fontSize: 12, fontWeight: '600', color: '#03045E' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  inputBox: {
    flex: 1, backgroundColor: '#F0F4F8', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10, maxHeight: 120,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  input: { fontSize: 14, color: '#03045E', maxHeight: 100 },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#03045E', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#03045E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: '#9CA3AF', elevation: 0 },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});