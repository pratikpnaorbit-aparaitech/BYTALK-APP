import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Image,
  RefreshControl,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Switch,
  BackHandler,
  Modal,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { createPeerConnection, getLocalMediaStream, makeIceCandidate, makeSessionDescription, setAudioRoute, setMicrophoneMuted, startAudioRoute, stopAudioRoute, switchCamera } from './rtc';
import CallAudio from './CallAudio';
import CallVideo from './CallVideo';
import { configureSubscription, purchasePlan, restorePurchases } from './src/subscription';
import { speakText, speakEnglish, stopSpeech, isSpeaking, LANGUAGE_LOCALES } from './src/utils/speechHelper';
import ringtoneManager from './src/utils/ringtoneHelper';
import AryaTopBar from './src/components/AryaTopBar';
import AryaBottomNav from './src/components/AryaBottomNav';
import AryaHomeScreen from './src/components/AryaHomeScreen';
import ProSubscriptionScreen from './src/components/ProSubscriptionScreen';
import ProfileScreen from './src/components/ProfileScreen';
import LearnScreen from './src/components/LearnScreen';
import CallTabScreen from './src/components/CallTabScreen';
import LeaderboardModal from './src/components/LeaderboardModal';
import HistoryModal from './src/components/HistoryModal';
import NotificationsModal from './src/components/NotificationsModal';

const welcomeImage = require('./assets/bytalk-welcome-art.png');
const MAX_PDF_SIZE_BYTES = 8 * 1024 * 1024;
const CHAT_EMOJI_CATEGORIES = [
  { id: 'faces', label: 'Faces', icon: 'happy-outline', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😍', '🥰', '😘', '😋', '😜', '🤔', '😎', '😭', '😢', '😡', '🥳', '🤗', '🤩', '😴', '🙏', '✨', '👍', '👎', '👏'] },
  { id: 'hands', label: 'Hands', icon: 'hand-left-outline', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✊', '👊', '🤛', '🤜', '💪', '🫶', '🙏', '👏', '🙌', '🤝', '👐', '🤲', '🖕'] },
  { id: 'hearts', label: 'Hearts', icon: 'heart-outline', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌', '💋', '😍', '🥰', '😘', '😻', '💑', '💏', '🌹', '✨', '💐', '❤️‍🔥'] },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline', emojis: ['🐶', '🐱', '🐼', '🦊', '🐻', '🐸', '🐵', '🐣', '🦋', '🐝', '🌸', '🌻', '🌹', '🌷', '🌈', '☀️', '🌤️', '🌙', '⭐', '🔥', '🌊', '🍀', '🌱', '🌴', '🍁', '🌍', '☔', '❄️', '🌟', '🌺', '🌼', '🌿'] },
  { id: 'food', label: 'Food', icon: 'fast-food-outline', emojis: ['🍎', '🍉', '🍓', '🍒', '🍑', '🥭', '🍍', '🥥', '🥑', '🍕', '🍔', '🍟', '🌮', '🍜', '🍣', '🍩', '🍪', '🎂', '🍰', '🍦', '☕', '🧋', '🥤', '🍿', '🥗', '🍫', '🥐', '🍞', '🧁', '🍇', '🍌', '🥳'] },
];

export const SERIF_FONT_FAMILY = Platform.OS === 'web'
  ? '"Times New Roman", Times, Georgia, "Nimbus Roman No9 L", serif'
  : (Platform.OS === 'ios' ? 'Times New Roman' : 'serif');

const PRESET_ATTACHMENT_IMAGES = [
  { id: 'img1', name: 'Vocab_Flashcard.jpg', label: 'Daily Vocab Card', size: '1.2 MB', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80', type: 'image' },
  { id: 'img2', name: 'Dialogue_Scene.jpg', label: 'Coffee Shop Scene', size: '1.8 MB', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80', type: 'image' },
  { id: 'img3', name: 'Study_Notes.jpg', label: 'Study Notes Sheet', size: '950 KB', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80', type: 'image' },
];

export const getPartnerAvatarUrl = (partner) => {
  if (partner?.avatarUrl && !partner.avatarUrl.startsWith('emoji:')) {
    return partner.avatarUrl;
  }
  if (partner?.profilePhotoUrl && !partner.profilePhotoUrl.startsWith('emoji:')) {
    return partner.profilePhotoUrl;
  }
  const seed = encodeURIComponent(partner?.displayName || partner?.name || 'User');
  return `https://api.dicebear.com/7.x/adventurer/png?seed=${seed}&backgroundColor=ffd5dc,b6e3f4,c0aede,d1d4f9`;
};

const SAMPLE_STORIES = [
  { id: 'st1', name: 'Mr. Ayo', avatar: 'https://api.dicebear.com/7.x/personas/png?seed=Ayo', status: 'Practicing English idioms today! 📚' },
  { id: 'st2', name: 'Hero Anne', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Anne', status: 'Ready for IELTS speaking practice 🎯' },
  { id: 'st3', name: 'Porkoo H.', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Porkoo', status: 'Listening to BBC English podcast 🎧' },
  { id: 'st4', name: 'Aura Ak...', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Aura', status: 'Who wants to do a 10-min voice call? 📞' },
  { id: 'st5', name: 'Walter H...', avatar: 'https://api.dicebear.com/7.x/adventurer/png?seed=Walter', status: 'Improving vocabulary day by day! 🚀' },
];

const SAMPLE_CONVERSATIONS = [
  {
    user: { id: 'sample-1', name: 'Mr. Tayo Ade', displayName: 'Mr. Tayo Ade', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/png?seed=Tayo', online: true, country: 'Nigeria', learningLanguage: 'English' },
    latestMessage: { text: "Good morning, Mr. Tayo. I'll help create a dialogue between the accountant and the supervisor on the situation of the warehouse.", from: 'me', at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), readAt: new Date().toISOString() },
    unreadCount: 0,
    timeDisplay: '15:05',
    hasCheckmark: true,
  },
  {
    user: { id: 'sample-2', name: 'Babe ❤️', displayName: 'Babe ❤️', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/png?seed=Babe', online: true, country: 'United Kingdom', learningLanguage: 'English' },
    latestMessage: { text: 'Typing...', from: 'sample-2', isTyping: true, at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    unreadCount: 2,
    timeDisplay: '15:00',
  },
  {
    user: { id: 'sample-3', name: 'Hero Anne', displayName: 'Hero Anne', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/png?seed=Anne', online: false, country: 'Canada', learningLanguage: 'English' },
    latestMessage: { text: 'Kindly check your mail for the necessary document for the project.', from: 'sample-3', at: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    unreadCount: 2,
    timeDisplay: '14:44',
  },
  {
    user: { id: 'sample-4', name: 'Drey', displayName: 'Drey', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/png?seed=Drey', online: true, country: 'United States', learningLanguage: 'English' },
    latestMessage: { text: 'Do well to reach out to him on my behalf. I would be expecting your feedback. Thank you.', from: 'sample-4', at: new Date(Date.now() - 120 * 60 * 1000).toISOString() },
    unreadCount: 0,
    timeDisplay: '13:00',
  },
  {
    user: { id: 'sample-5', name: 'Baby Sis 🦋', displayName: 'Baby Sis 🦋', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/png?seed=Sis', online: false, country: 'Australia', learningLanguage: 'English' },
    latestMessage: { text: 'Okay, no problem.', from: 'me', at: new Date(Date.now() - 150 * 60 * 1000).toISOString(), readAt: new Date().toISOString() },
    unreadCount: 0,
    timeDisplay: '12:37',
    hasCheckmark: true,
  },
  {
    user: { id: 'sample-6', name: 'Akin A.A', displayName: 'Akin A.A', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/png?seed=Akin', online: false, country: 'Kenya', learningLanguage: 'English' },
    latestMessage: { text: 'Probably when you get back.', from: 'sample-6', at: new Date(Date.now() - 240 * 60 * 1000).toISOString() },
    unreadCount: 0,
    timeDisplay: '11:00',
    hasCheckmark: true,
  },
  {
    user: { id: 'sample-7', name: 'Kenny Gurl', displayName: 'Kenny Gurl', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/png?seed=Kenny', online: true, country: 'South Africa', learningLanguage: 'English' },
    latestMessage: { text: 'Your articles are well articulated. The message was concise and straight to the point. I will definitely recommend to my c...', from: 'sample-7', at: new Date(Date.now() - 300 * 60 * 1000).toISOString() },
    unreadCount: 0,
    timeDisplay: '10:00',
    hasCheckmark: true,
  },
  {
    user: { id: 'sample-8', name: 'Pam Pam', displayName: 'Pam Pam', avatarUrl: 'https://api.dicebear.com/7.x/adventurer/png?seed=Pam', online: false, country: 'India', learningLanguage: 'English' },
    latestMessage: { text: 'I have seen the latest series, you have to check it out, you will definitely love it.', from: 'sample-8', at: new Date(Date.now() - 360 * 60 * 1000).toISOString() },
    unreadCount: 0,
    timeDisplay: '09:41',
  },
];

// Secure storage adapter:
// Uses Expo SecureStore on native builds (iOS / Android) and AsyncStorage on Web
let ExpoSecureStore = null;
try {
  ExpoSecureStore = require('expo-secure-store');
} catch (e) {
  ExpoSecureStore = null;
}

const SESSION_TOKEN_KEY = 'bytalk_session_token';
const SESSION_USER_KEY = 'bytalk_session_user';
const SESSION_EXPIRES_KEY = 'bytalk_session_expires_at';
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
const AI_FREE_MESSAGE_LIMIT = 5;
const AI_FREE_CREDITS_KEY_PREFIX = 'bytalk_ai_free_credits_';
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || '';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || '';

export const authStorage = {
  async setItem(key, value) {
    if (Platform.OS !== 'web' && ExpoSecureStore?.setItemAsync) {
      try {
        await ExpoSecureStore.setItemAsync(key, value);
        return;
      } catch (err) {
        // Fallback to AsyncStorage if SecureStore fails
      }
    }
    await AsyncStorage.setItem(key, value);
  },
  async getItem(key) {
    if (Platform.OS !== 'web' && ExpoSecureStore?.getItemAsync) {
      try {
        const val = await ExpoSecureStore.getItemAsync(key);
        if (val !== null && val !== undefined) return val;
      } catch (err) {
        // Fallback to AsyncStorage
      }
    }
    return AsyncStorage.getItem(key);
  },
  async removeItem(key) {
    if (Platform.OS !== 'web' && ExpoSecureStore?.deleteItemAsync) {
      try {
        await ExpoSecureStore.deleteItemAsync(key);
      } catch (err) {
        // Fallback to AsyncStorage
      }
    }
    await AsyncStorage.removeItem(key);
  },
};

let activeAuthToken = null;

export function getAuthToken() {
  return activeAuthToken;
}

export function setAuthToken(token) {
  activeAuthToken = token;
}

export async function saveSession(authResponse, fallbackName = '') {
  if (!authResponse?.token) {
    throw new Error('Authentication token was not returned by the server.');
  }
  const token = authResponse.token;
  const user = authResponse.user || { name: fallbackName };
  const expiresAt = Date.now() + FIFTEEN_DAYS_MS;

  setAuthToken(token);
  await Promise.all([
    authStorage.setItem(SESSION_TOKEN_KEY, token),
    authStorage.setItem(SESSION_USER_KEY, JSON.stringify(user)),
    authStorage.setItem(SESSION_EXPIRES_KEY, String(expiresAt)),
  ]);
}

export async function clearSession() {
  setAuthToken(null);
  await Promise.all([
    authStorage.removeItem(SESSION_TOKEN_KEY).catch(() => {}),
    authStorage.removeItem(SESSION_USER_KEY).catch(() => {}),
    authStorage.removeItem(SESSION_EXPIRES_KEY).catch(() => {}),
  ]);
}

// Runtime-aware API base URL resolution
function getApiUrl() {
  // 1. Explicit environment variable override
  if (process.env.EXPO_PUBLIC_API_URL) {
    const configuredUrl = process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
    const isNativeLocalhost = Platform.OS !== 'web' && /:\/\/(localhost|127\.0\.0\.1)(:|$)/.test(configuredUrl);
    if (!isNativeLocalhost) return configuredUrl;
    console.warn('[BYTALK] EXPO_PUBLIC_API_URL uses localhost on a native target; resolving the Expo host instead.');
  }

  // 2. Web browser runtime
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:4000';
      }
      if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
        return `http://${host}:4000`;
      }
      if (window.location.port && window.location.port !== '80' && window.location.port !== '443') {
        return `http://${host}:4000`;
      }
    }
    return 'http://localhost:4000';
  }

  // 3. Android Emulator / Device
  if (Platform.OS === 'android') {
    let metroHost = null;
    try {
      const Constants = require('expo-constants').default;
      const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoClient?.hostUri || Constants?.manifest?.debuggerHost;
      if (hostUri) metroHost = hostUri.split(':')[0];
    } catch (e) {}

    if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') {
      return `http://${metroHost}:4000`;
    }
    return 'http://10.0.2.2:4000';
  }

  // 4. iOS Simulator / Device
  if (Platform.OS === 'ios') {
    let metroHost = null;
    try {
      const Constants = require('expo-constants').default;
      const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoClient?.hostUri || Constants?.manifest?.debuggerHost;
      if (hostUri) metroHost = hostUri.split(':')[0];
    } catch (e) {}

    if (metroHost && metroHost !== 'localhost' && metroHost !== '127.0.0.1') {
      return `http://${metroHost}:4000`;
    }
    return 'http://localhost:4000';
  }

  return 'http://localhost:4000';
}

const API = getApiUrl();

// Section 3: Orange Design System Palette
const COLORS = {
  primary: '#FF693D',
  secondary: '#FF8A50',
  lightBg: '#FFF7F2',
  softSurface: '#FFF0E8',
  textPrimary: '#17172F',
  textSecondary: '#747487',
  border: '#E9E7EF',
  white: '#FFFFFF',
  error: '#D92D20',
  success: '#168653',
};

const orange = COLORS.primary;
const orangeLight = COLORS.lightBg;
const navy = COLORS.textPrimary;
const muted = COLORS.textSecondary;
const light = COLORS.lightBg;
const border = COLORS.border;

const LANGUAGES = [
  'English', 'Hindi', 'Marathi', 'Spanish', 'French', 'Japanese',
  'Mandarin Chinese', 'Arabic', 'German', 'Portuguese', 'Bengali',
  'Russian', 'Urdu', 'Indonesian', 'Korean', 'Italian', 'Turkish',
  'Tamil', 'Telugu', 'Vietnamese', 'Polish', 'Dutch', 'Greek',
  'Hebrew', 'Thai', 'Swedish', 'Czech', 'Hungarian', 'Romanian',
  'Danish', 'Finnish', 'Norwegian', 'Swahili', 'Malay', 'Ukrainian',
];

const PRACTICE_TOPICS = [
  {
    id: 'All Topics', title: 'All', icon: 'apps-outline',
    description: 'Discover every registered partner with saved interests.',
    phrases: ['Nice to meet you.', 'What do you enjoy?', 'How was your day?'],
    vocabulary: ['conversation', 'practice', 'partner'],
    prompt: 'Which phrase is a friendly way to start a conversation?',
    options: ['Nice to meet you.', 'Where is the station?', 'I will send an update.'],
    answer: 'Nice to meet you.',
  },
  {
    id: 'Education', title: 'Education', icon: 'school-outline',
    description: 'Study, exams, and academic discussions.',
    phrases: ['Where is the station?', 'Could I have a ticket?', 'How long does it take?'],
    vocabulary: ['journey', 'ticket', 'platform'],
    prompt: 'Choose a phrase to ask for help understanding a lesson.',
    options: ['Could you explain that?', 'Where is the station?', 'That sounds fun!'],
    answer: 'Could you explain that?',
  },
  {
    id: 'Travel', title: 'Travel', icon: 'airplane-outline',
    description: 'Destinations, journeys, and travel experiences.',
    phrases: ['Where is the station?', 'Could I have a ticket?', 'How long does it take?'],
    vocabulary: ['journey', 'ticket', 'platform'],
    prompt: 'Which phrase asks for directions?',
    options: ['Where is the station?', 'I enjoy cooking.', 'Nice to meet you.'],
    answer: 'Where is the station?',
  },
  {
    id: 'Culture', title: 'Culture', icon: 'globe-outline',
    description: 'Culture, traditions, food, and communities.',
    phrases: ['What is this tradition?', 'I would love to learn more.', 'That is interesting.'],
    vocabulary: ['tradition', 'festival', 'community'],
    prompt: 'Which word describes a custom passed down over time?',
    options: ['tradition', 'platform', 'assignment'],
    answer: 'tradition',
  },
  {
    id: 'Work & Career', title: 'Work & Career', icon: 'briefcase-outline',
    description: 'Jobs, careers, and professional discussions.',
    phrases: ['I work in ...', 'Let us discuss this.', 'I will send an update.'],
    vocabulary: ['colleague', 'meeting', 'deadline'],
    prompt: 'Which word means the latest time something should be finished?',
    options: ['deadline', 'colleague', 'meeting'],
    answer: 'deadline',
  },
  {
    id: 'Hobbies', title: 'Hobbies', icon: 'color-palette-outline',
    description: 'Interests, creativity, and free-time activities.',
    phrases: ['What do you enjoy?', 'I like listening to music.', 'That sounds fun!'],
    vocabulary: ['interest', 'creative', 'outdoors'],
    prompt: 'How can you ask someone about their interests?',
    options: ['What do you enjoy?', 'Could I have a ticket?', 'I will send an update.'],
    answer: 'What do you enjoy?',
  },
  {
    id: 'Movies & Music', title: 'Movies & Music', icon: 'musical-notes-outline',
    description: 'Share recommendations and discuss entertainment.',
    phrases: ['What are you watching?', 'What kind of music do you like?', 'I recommend ...'],
    vocabulary: ['recommendation', 'actor', 'concert'],
    prompt: 'Which phrase asks about someone’s music preferences?',
    options: ['What kind of music do you like?', 'Where is the station?', 'I work in ...'],
    answer: 'What kind of music do you like?',
  },
  {
    id: 'Technology', title: 'Technology', icon: 'hardware-chip-outline',
    description: 'Technology, programming, and digital ideas.',
    phrases: ['What app do you use?', 'I am learning to code.', 'How does it work?'],
    vocabulary: ['software', 'programming', 'device'],
    prompt: 'Which phrase says that you are learning programming?',
    options: ['I am learning to code.', 'That sounds fun!', 'Could I have a ticket?'],
    answer: 'I am learning to code.',
  },
  {
    id: 'Daily Life', title: 'Daily Life', icon: 'home-outline',
    description: 'Everyday routines, errands, and practical conversation.',
    phrases: ['How was your day?', 'What do you usually do?', 'I am heading home.'],
    vocabulary: ['routine', 'errand', 'neighborhood'],
    prompt: 'Which phrase asks about someone’s routine?',
    options: ['What do you usually do?', 'I recommend ...', 'Where is the station?'],
    answer: 'What do you usually do?',
  },
];

export const ACTIVE_PRACTICE_PARTNERS = [
  {
    id: 'partner_sarah',
    name: 'sarah',
    displayName: 'sarah',
    gender: 'female',
    level: 'Level : 1',
    country: 'United States',
    region: 'americas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sarah&clothingColor=yellow&top=longHairStraight',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Sarah&clothingColor=yellow&top=longHairStraight',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_liam',
    name: 'liam',
    displayName: 'liam',
    gender: 'male',
    level: 'Level : 1',
    country: 'Australia',
    region: 'americas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Liam&clothingColor=blue02&top=shortFlat',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Liam&clothingColor=blue02&top=shortFlat',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_emma',
    name: 'emma',
    displayName: 'emma',
    gender: 'female',
    level: 'Level : 2',
    country: 'Canada',
    region: 'americas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Emma&clothingColor=pink&top=longHairBob',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Emma&clothingColor=pink&top=longHairBob',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_daniel',
    name: 'daniel',
    displayName: 'daniel',
    gender: 'male',
    level: 'Level : 1',
    country: 'United States',
    region: 'americas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Daniel&clothingColor=gray01&top=shortCurly',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Daniel&clothingColor=gray01&top=shortCurly',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_maya',
    name: 'maya',
    displayName: 'maya',
    gender: 'female',
    level: 'Level : 1',
    country: 'Singapore',
    region: 'asia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Maya&clothingColor=red&top=longHairStraight2',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Maya&clothingColor=red&top=longHairStraight2',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_lucas',
    name: 'lucas',
    displayName: 'lucas',
    gender: 'male',
    level: 'Level : 3',
    country: 'Germany',
    region: 'europe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucas&clothingColor=heather&top=shortWaved',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucas&clothingColor=heather&top=shortWaved',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_chloe',
    name: 'chloe',
    displayName: 'chloe',
    gender: 'female',
    level: 'Level : 2',
    country: 'France',
    region: 'europe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Chloe&clothingColor=blue01&top=longHairCurvy',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Chloe&clothingColor=blue01&top=longHairCurvy',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_david',
    name: 'david',
    displayName: 'david',
    gender: 'male',
    level: 'Level : 2',
    country: 'United Kingdom',
    region: 'europe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=David&facialHair=beardLight&top=shortFlat',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=David&facialHair=beardLight&top=shortFlat',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_priya',
    name: 'priya',
    displayName: 'priya',
    gender: 'female',
    level: 'Level : 2',
    country: 'India',
    region: 'asia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Priya&clothingColor=yellow&top=longHairStraight',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Priya&clothingColor=yellow&top=longHairStraight',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_marcus',
    name: 'marcus',
    displayName: 'marcus',
    gender: 'male',
    level: 'Level : 2',
    country: 'South Africa',
    region: 'africa',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Marcus&clothingColor=black&top=shortFlat',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Marcus&clothingColor=black&top=shortFlat',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_aaliyah',
    name: 'aaliyah',
    displayName: 'aaliyah',
    gender: 'female',
    level: 'Level : 2',
    country: 'United Arab Emirates',
    region: 'middle-east',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Aaliyah&clothingColor=pastelGreen&top=hijab',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Aaliyah&clothingColor=pastelGreen&top=hijab',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_tariq',
    name: 'tariq',
    displayName: 'tariq',
    gender: 'male',
    level: 'Level : 3',
    country: 'Egypt',
    region: 'middle-east',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Tariq&facialHair=beardMajestic&top=shortFlat',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Tariq&facialHair=beardMajestic&top=shortFlat',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_elena',
    name: 'elena',
    displayName: 'elena',
    gender: 'female',
    level: 'Level : 1',
    country: 'Spain',
    region: 'europe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Elena&clothingColor=pink&top=longHairStraight',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Elena&clothingColor=pink&top=longHairStraight',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_kenji',
    name: 'kenji',
    displayName: 'kenji',
    gender: 'male',
    level: 'Level : 1',
    country: 'Japan',
    region: 'asia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Kenji&clothingColor=blue01&top=shortFlat',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Kenji&clothingColor=blue01&top=shortFlat',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_hana',
    name: 'hana',
    displayName: 'hana',
    gender: 'female',
    level: 'Level : 1',
    country: 'Japan',
    region: 'asia',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Hana&clothingColor=pastelOrange&top=longHairBob',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Hana&clothingColor=pastelOrange&top=longHairBob',
    isAi: false,
    online: true,
    status: 'online',
  },
  {
    id: 'partner_mateo',
    name: 'mateo',
    displayName: 'mateo',
    gender: 'male',
    level: 'Level : 2',
    country: 'Brazil',
    region: 'americas',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Mateo&clothingColor=green&top=shortCurly',
    profilePhotoUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=Mateo&clothingColor=green&top=shortCurly',
    isAi: false,
    online: true,
    status: 'online',
  },
];

export const SARAH_PARTNER = ACTIVE_PRACTICE_PARTNERS[0];

export function pickRandomPracticePartner(filters = {}, recentHistory = [], lastId = null) {
  let pool = [...ACTIVE_PRACTICE_PARTNERS];

  // Gender filter
  if (filters.gender && filters.gender !== 'all') {
    const targetGender = filters.gender.toLowerCase();
    const byGender = pool.filter((p) => (p.gender || '').toLowerCase() === targetGender);
    if (byGender.length > 0) pool = byGender;
  }

  // Level filter
  if (filters.level && filters.level !== 'all') {
    const isBeginner = filters.level.toLowerCase().includes('begin');
    const byLevel = pool.filter((p) => {
      const pLevel = (p.level || '').toLowerCase();
      return isBeginner
        ? (pLevel.includes('1') || pLevel.includes('begin'))
        : (pLevel.includes('2') || pLevel.includes('3') || pLevel.includes('adv') || pLevel.includes('inter'));
    });
    if (byLevel.length > 0) pool = byLevel;
  }

  // Region filter
  if (filters.region && filters.region !== 'all') {
    const targetRegion = filters.region.toLowerCase();
    const byRegion = pool.filter((p) =>
      (p.region || '').toLowerCase().includes(targetRegion) ||
      (p.country || '').toLowerCase().includes(targetRegion)
    );
    if (byRegion.length > 0) pool = byRegion;
  }

  // "Not same person" algorithm:
  // Exclude partners in recent history
  let candidates = pool.filter((p) => !recentHistory.includes(p.id));

  // If all matching partners have been called, exclude at least the immediate last one
  if (candidates.length === 0 && lastId) {
    candidates = pool.filter((p) => p.id !== lastId);
  }

  if (candidates.length === 0) {
    candidates = pool;
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return chosen || pool[0];
}

export const CALL_ACTIVITIES = [
  {
    id: 'act_icebreaker',
    title: 'Icebreaker Q&A',
    emoji: '💬',
    bgColor: '#FAF5FF',
    borderColor: '#E9D5FF',
    textColor: '#7E22CE',
    subColor: '#9333EA',
    subtitle: 'Daily routine & favorites',
    prompts: [
      'What was the most exciting or surprising thing that happened to you this week?',
      'If you could travel to any city or country in the world tomorrow, where would you go and why?',
      'What is your favorite hobby or thing you enjoy doing when you have free time?',
      'What type of music, movies, or books help you relax best after a busy day?',
    ],
    vocab: ['highlight', 'coincidentally', 'routine', 'fascinating'],
  },
  {
    id: 'act_roleplay',
    title: 'Roleplay',
    emoji: '🎭',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    textColor: '#1D4ED8',
    subColor: '#2563EB',
    subtitle: 'Ordering at a cafe / Travel',
    prompts: [
      'Roleplay: You are ordering coffee and a pastry at a bustling cafe. Partner is the barista taking your order.',
      'Roleplay: You just landed at the airport and need to ask the information desk for directions to the train station.',
      'Roleplay: You are checking into a hotel, but your booking name is slightly misspelled. Resolve it with the receptionist.',
    ],
    vocab: ['recommendation', 'specialty', 'reservation', 'receipt'],
  },
  {
    id: 'act_would_you_rather',
    title: 'Would You Rather?',
    emoji: '🤔',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    textColor: '#B45309',
    subColor: '#D97706',
    subtitle: 'Time travel vs Flying',
    prompts: [
      'Would you rather travel 100 years into the past or 100 years into the future?',
      'Would you rather speak all human languages fluently or be able to communicate with animals?',
      'Would you rather have unlimited free flights anywhere in the world or free food for life?',
      'Would you rather live in a bustling big city penthouse or a quiet seaside cabin?',
    ],
    vocab: ['dilemma', 'preferable', 'consequence', 'unquestionably'],
  },
  {
    id: 'act_guess_word',
    title: 'Guess The Word',
    emoji: '🎯',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    textColor: '#047857',
    subColor: '#059669',
    subtitle: '20 questions secret item',
    prompts: [
      'Secret Word: "Bicycle" (Partner asks yes/no questions: Is it an object? Can you ride it? Does it use fuel?)',
      'Secret Word: "Pineapple" (Partner asks: Is it food? Is it sweet? Does it grow on trees?)',
      'Secret Word: "Guitar" (Partner asks: Is it an instrument? Does it have strings? Is it electric?)',
    ],
    vocab: ['category', 'property', 'tangible', 'instrument'],
  },
  {
    id: 'act_story',
    title: 'Story Challenge',
    emoji: '📖',
    bgColor: '#FFF1F2',
    borderColor: '#FECDD3',
    textColor: '#BE123C',
    subColor: '#E11D48',
    subtitle: 'Describe dream vacation',
    prompts: [
      'Describe your dream vacation spot in vivid detail: describe the sights, sounds, smells, and delicious local food.',
      'Tell a 1-minute story about a funny, unexpected adventure or misunderstanding you experienced.',
      'Describe how your typical morning looks from the moment you wake up to when your day starts.',
    ],
    vocab: ['breathtaking', 'picturesque', 'unforgettable', 'atmosphere'],
  },
  {
    id: 'act_rapid_fire',
    title: 'Rapid Fire',
    emoji: '⚡',
    bgColor: '#ECFEFF',
    borderColor: '#A5F3FC',
    textColor: '#0E7490',
    subColor: '#0891B2',
    subtitle: 'Fast 5 answers in 3 sec',
    prompts: [
      'Answer in 3 seconds: Coffee or Tea? Morning or Night? Mountains or Beach? Sweet or Savory? Dogs or Cats?',
      'Answer in 3 seconds: Books or Movies? Road trip or Flight? Call or Text? Cook at home or Dine out?',
      'Answer in 3 seconds: Early bird or Night owl? City or Countryside? iOS or Android? Singing or Dancing?',
    ],
    vocab: ['instantly', 'hands down', 'no hesitation', 'definitive'],
  },
];

const COUNTRY_CODES = [
  'AF', 'AL', 'DZ', 'AD', 'AO', 'AG', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE',
  'BZ', 'BJ', 'BT', 'BO', 'BA', 'BW', 'BR', 'BN', 'BG', 'BF', 'BI', 'CV', 'KH', 'CM', 'CA', 'CF', 'TD',
  'CL', 'CN', 'CO', 'KM', 'CG', 'CD', 'CR', 'CI', 'HR', 'CU', 'CY', 'CZ', 'DK', 'DJ', 'DM', 'DO', 'EC',
  'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FJ', 'FI', 'FR', 'GA', 'GM', 'GE', 'DE', 'GH', 'GR', 'GD',
  'GT', 'GN', 'GW', 'GY', 'HT', 'HN', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IL', 'IT', 'JM', 'JP',
  'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU',
  'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MH', 'MR', 'MU', 'MX', 'FM', 'MD', 'MC', 'MN', 'ME', 'MA', 'MZ',
  'MM', 'NA', 'NR', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'MK', 'NO', 'OM', 'PK', 'PW', 'PA', 'PG', 'PY',
  'PE', 'PH', 'PL', 'PT', 'QA', 'RO', 'RU', 'RW', 'KN', 'LC', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS',
  'SC', 'SL', 'SG', 'SK', 'SI', 'SB', 'SO', 'ZA', 'SS', 'ES', 'LK', 'SD', 'SR', 'SE', 'CH', 'SY', 'TW',
  'TJ', 'TZ', 'TH', 'TL', 'TG', 'TO', 'TT', 'TN', 'TR', 'TM', 'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UY',
  'UZ', 'VU', 'VA', 'VE', 'VN', 'YE', 'ZM', 'ZW',
];

const COUNTRY_OPTIONS = (() => {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return COUNTRY_CODES.map((code) => ({ code, name: displayNames.of(code) || code }))
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    return COUNTRY_CODES.map((code) => ({ code, name: code }));
  }
})();

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (activeAuthToken) {
    headers['Authorization'] = `Bearer ${activeAuthToken}`;
  }

  let body = options.body;
  if (body && typeof body === 'object' && !(typeof FormData !== 'undefined' && body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API}/api/${endpoint}`, {
      ...options,
      headers,
      body,
    });
  } catch (netErr) {
    const error = new Error(`Cannot connect to backend server at ${API}. Please ensure the backend is running.`);
    error.isNetworkError = true;
    error.originalError = netErr;
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  let responseWasJson = false;
  try {
    if (contentType.includes('application/json')) {
      responseWasJson = true;
      data = await response.json();
    } else {
      await response.text();
      data = { error: `The backend returned an unexpected response (${response.status}).` };
    }
  } catch (jsonErr) {
    data = { error: 'Invalid response from server' };
  }

  // Handle session revocation or expiry from server
  if (response.status === 401 && activeAuthToken && endpoint !== 'login' && endpoint !== 'register') {
    await clearSession();
  }

  if (!response.ok) {
    const message = data?.error || data?.message || `Server responded with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    err.userMessage = responseWasJson
      ? message
      : 'The subscription service returned an unexpected response. Check that the backend is running on port 4000.';
    throw err;
  }
  return data;
}

const Txt = ({ children, size = 14, color = navy, bold = false, style = {} }) => (
  <Text style={{ fontSize: size, color, fontWeight: bold ? '700' : '400', ...style }}>{children}</Text>
);

const Btn = ({ label, onPress, outline = false, disabled = false, loading = false, style = {} }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    disabled={disabled || loading}
    style={{
      backgroundColor: outline ? '#fff' : orange,
      borderWidth: outline ? 1.5 : 0,
      borderColor: orange,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.65 : 1,
      ...style,
    }}
  >
    {loading ? (
      <ActivityIndicator size="small" color={outline ? orange : '#fff'} />
    ) : (
      <Txt color={outline ? orange : '#fff'} bold size={15}>{label}</Txt>
    )}
  </TouchableOpacity>
);

function SearchSelect({ label, value, options, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = options.filter((option) => {
    const name = typeof option === 'string' ? option : option.name;
    return name.toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <View style={{ marginBottom: 15, zIndex: open ? 2 : 1 }}>
      <Txt size={13} bold style={{ marginBottom: 8 }}>{label}</Txt>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label} selector`}
        onPress={() => {
          setOpen((current) => !current);
          setQuery('');
        }}
        style={{
          backgroundColor: '#fff',
          borderColor: open ? orange : border,
          borderWidth: 1,
          borderRadius: 14,
          padding: 15,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Txt color={value ? navy : '#9CA3AF'} size={15}>{value || placeholder}</Txt>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={muted} />
      </TouchableOpacity>
      {open && (
        <View style={{ backgroundColor: '#fff', borderColor: border, borderWidth: 1, borderRadius: 14, marginTop: 6, overflow: 'hidden' }}>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${label.toLowerCase()}...`}
            placeholderTextColor="#9CA3AF"
            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: border, color: navy }}
          />
          <ScrollView nestedScrollEnabled style={{ maxHeight: 190 }}>
            {filtered.map((option) => {
              const optionName = typeof option === 'string' ? option : option.name;
              return (
                <TouchableOpacity
                  key={typeof option === 'string' ? option : option.code}
                  onPress={() => {
                    onSelect(optionName);
                    setOpen(false);
                    setQuery('');
                  }}
                  style={{ paddingHorizontal: 14, paddingVertical: 11, backgroundColor: optionName === value ? '#FFF0E8' : '#fff' }}
                >
                  <Txt color={optionName === value ? orange : navy} bold={optionName === value}>{optionName}</Txt>
                </TouchableOpacity>
              );
            })}
            {!filtered.length && <Txt color={muted} size={13} style={{ padding: 14 }}>No matching options.</Txt>}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const Section = ({ title, children }) => (
  <View style={{ marginBottom: 22 }}>
    <Txt size={16} bold style={{ marginBottom: 12 }}>{title}</Txt>
    {children}
  </View>
);

function App() {
  const { height: viewportHeight } = useWindowDimensions();
  const isShortViewport = viewportHeight < 560;
  const welcomeIllustrationHeight = Math.max(110, Math.min(180, viewportHeight * 0.34));
  const [screen, setScreen] = useState('welcome');
  const [activeBottomTab, setActiveBottomTab] = useState('home');

  const authFadeAnim = useRef(new Animated.Value(1)).current;
  const authSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (screen === 'login' || screen === 'register' || screen === 'welcome') {
      authFadeAnim.setValue(0);
      authSlideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(authFadeAnim, {
          toValue: 1,
          duration: 380,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(authSlideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [screen]);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [friendNotification, setFriendNotification] = useState(null);
  const [userStars, setUserStars] = useState(40);
  const [streak, setStreak] = useState(1);
  const [isMatchingCall, setIsMatchingCall] = useState(false);
  const [showEarlyDisconnectModal, setShowEarlyDisconnectModal] = useState(false);
  const [disconnectReason, setDisconnectReason] = useState('');
  const [audioQualityRating, setAudioQualityRating] = useState(5);
  const [friendRequestSentInCall, setFriendRequestSentInCall] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
  const [sentFriendRequests, setSentFriendRequests] = useState([]);
  const [recentCoLearnersList, setRecentCoLearnersList] = useState([]);
  const [aryaSettings, setAryaSettings] = useState({
    voice: 'FEMALE',
    speed: '1x',
    nativeLanguage: 'Other (English)',
  });

  const handleBottomTabPress = (tabId) => {
    setActiveBottomTab(tabId);
    if (tabId === 'home') {
      setActiveBottomTab('home');
      setScreen('home');
    } else if (tabId === 'discover') {
      setActiveBottomTab('discover');
      setScreen('discover');
      loadFriends();
      refreshConversations();
      loadDiscoverUsers();
    } else if (tabId === 'call') {
      setActiveBottomTab('call');
      setScreen('call-tab');
      loadFriends();
    } else if (tabId === 'learn' || tabId === 'practice') {
      setActiveBottomTab('learn');
      setScreen('learn');
    } else if (tabId === 'pro') {
      setActiveBottomTab('pro');
      setScreen('premium');
    } else if (tabId === 'messages') {
      setActiveBottomTab('messages');
      setScreen('messages');
      if (chatFilterTab === 'calls') setChatFilterTab('all');
    } else if (tabId === 'profile') {
      setActiveBottomTab('profile');
      setScreen('profile');
    }
    loadSubscription().catch(() => {});
  };

  const handleStartRandomMatch = async (filters = {}) => {
    if (!hasAudioEntitlement()) {
      setSubscriptionError('Your first 5 minutes free trial has ended. Please purchase a subscription to continue speaking practice.');
      await openSubscription();
      return;
    }

    // Only PRO subscribers can choose specific gender (Female/Male) for calls
    if (!isPaidSubscriber()) {
      filters = { ...filters, gender: 'all' };
    }

    setIsMatchingCall(true);
    try {
      let chosenPartner = null;

      // 1. First query backend for real online registered users currently connected
      try {
        const queryParams = `?gender=${encodeURIComponent(filters.gender || 'all')}&level=${encodeURIComponent(filters.level || 'all')}`;
        const onlineRes = await request(`practice/random-online${queryParams}`);
        if (onlineRes?.ok && onlineRes.user && !onlineRes.user.id?.startsWith('partner_')) {
          chosenPartner = onlineRes.user;
        }
      } catch (e) {
        console.warn('[random-online query]', e.message);
      }

      // 2. If not returned from endpoint, check active online human users from state (excluding any demo data)
      if (!chosenPartner) {
        let onlineHumans = (partners || []).filter((p) =>
          String(p.id) !== String(userId) &&
          p.online &&
          !String(p.id).startsWith('partner_') &&
          !p.isAi
        );
        if (filters.gender && filters.gender !== 'all') {
          const targetGender = filters.gender.toLowerCase().trim();
          onlineHumans = onlineHumans.filter((p) => (p.gender || '').toLowerCase().trim() === targetGender);
        }
        if (filters.level && filters.level !== 'all') {
          const byLevel = onlineHumans.filter((p) => (p.level || '').toLowerCase().includes(filters.level.toLowerCase()));
          if (byLevel.length > 0) onlineHumans = byLevel;
        }

        const recentHistory = recentPartnerHistoryRef.current || [];
        const freshHumans = onlineHumans.filter((p) => !recentHistory.includes(p.id));
        const eligibleHumans = freshHumans.length > 0 ? freshHumans : onlineHumans.filter((p) => p.id !== lastCalledPartnerIdRef.current);

        if (eligibleHumans.length > 0) {
          chosenPartner = eligibleHumans[Math.floor(Math.random() * eligibleHumans.length)];
        }
      }

      // 3. Connect strictly to real online registered co-learners (NO bot or demo fallback)
      if (!chosenPartner) {
        setIsMatchingCall(false);
        Alert.alert(
          'No Co-learners Online',
          'There are no other co-learners online at this moment. You can browse registered learners in the Discover tab or invite friends to practice!'
        );
        return;
      }

      lastCalledPartnerIdRef.current = chosenPartner.id;
      recentPartnerHistoryRef.current = [
        chosenPartner.id,
        ...(recentPartnerHistoryRef.current || []).filter((id) => id !== chosenPartner.id),
      ].slice(0, 10);

      setTimeout(() => {
        setIsMatchingCall(false);
        startCall(chosenPartner, 'audio');
      }, 500);
    } catch (err) {
      console.warn('[BYTALK matching error]', err);
      setIsMatchingCall(false);
      Alert.alert(
        'Connection Notice',
        'Could not search for online co-learners right now. Please check your connection and try again.'
      );
    }
  };
  const [sessionChecking, setSessionChecking] = useState(true);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [country, setCountry] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [learningLanguage, setLearningLanguage] = useState('English');
  const [level, setLevel] = useState('Beginner');
  const [practiceInterests, setPracticeInterests] = useState([]);
  const [practiceInterestsSaving, setPracticeInterestsSaving] = useState(false);
  const [partners, setPartners] = useState([]);
  const [partnerTotalEligible, setPartnerTotalEligible] = useState(0);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverRefreshing, setDiscoverRefreshing] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [practiceTopic, setPracticeTopic] = useState(PRACTICE_TOPICS[0]);
  const [practiceStep, setPracticeStep] = useState('overview');
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [practiceProgress, setPracticeProgress] = useState(0);
  const [practiceMode, setPracticeMode] = useState('searching');
  const [practiceConnectionMode, setPracticeConnectionMode] = useState('chat');
  const [practicePartner, setPracticePartner] = useState(null);
  const [practiceSearchError, setPracticeSearchError] = useState('');
  const [aiSession, setAiSession] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiFreeMessageCount, setAiFreeMessageCount] = useState(0);
  const [aiCreditsLoaded, setAiCreditsLoaded] = useState(false);
  const [showAiCreditsModal, setShowAiCreditsModal] = useState(false);
  const aiFreeMessageCountRef = useRef(0);
  const [aiDraft, setAiDraft] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiStartedAt, setAiStartedAt] = useState(null);
  const [aiCompletion, setAiCompletion] = useState(null);
  const [listeningForSpeech, setListeningForSpeech] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
  const [aiRating, setAiRating] = useState(0);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiFeedbackSubmitted, setAiFeedbackSubmitted] = useState(false);
  const [aiFeedbackSubmitting, setAiFeedbackSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [manageAccountError, setManageAccountError] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState({ id: null, name: 'BYTALK' });
  const [messages, setMessages] = useState([]);
  const [unreadByUser, setUnreadByUser] = useState({});
  const [conversations, setConversations] = useState([]);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatFilterTab, setChatFilterTab] = useState('all');
  const [chatSearchVisible, setChatSearchVisible] = useState(false);
  const [messageBanner, setMessageBanner] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [draft, setDraft] = useState('');
  const chatTextInputRef = useRef(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState('faces');
  const [vocab, setVocab] = useState([]);
  const [word, setWord] = useState('');
  const [backendUp, setBackendUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sessionVersion, setSessionVersion] = useState(0);
  const [messageLoading, setMessageLoading] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [chatError, setChatError] = useState('');
  const [typing, setTyping] = useState(false);
  const [call, setCall] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [callHistoryError, setCallHistoryError] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callCompletion, setCallCompletion] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackTags, setFeedbackTags] = useState([]);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [callNotice, setCallNotice] = useState('');
  const [callStarting, setCallStarting] = useState(null);
  const [activeCallActivity, setActiveCallActivity] = useState(null);
  const [callActivityPromptIdx, setCallActivityPromptIdx] = useState(0);
  const [usedFreeSeconds, setUsedFreeSeconds] = useState(0);
  const initialUsedFreeSecondsRef = useRef(0);
  const lastCalledPartnerIdRef = useRef(null);
  const recentPartnerHistoryRef = useRef([]);
  const FREE_TRIAL_TOTAL_SECONDS = 600; // 10 minutes free daily speaking practice
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const callRef = useRef(null);
  const localStreamRef = useRef(null);
  const iceServersRef = useRef([]);
  const pendingIceRef = useRef([]);
  const pendingIceByCallRef = useRef({});
  const pendingOutgoingIceRef = useRef([]);
  const signalQueueRef = useRef(Promise.resolve());
  const selectedRef = useRef(selected);
  const userIdRef = useRef(userId);
  const screenRef = useRef(screen);
  const typingTimerRef = useRef(null);
  const callExitTimerRef = useRef(null);
  const partnersRef = useRef(partners);
  const discoverRequestRef = useRef(0);
  const seenMessageIdsRef = useRef(new Set());
  const speechRecognitionRef = useRef(null);
  selectedRef.current = selected;
  userIdRef.current = userId;
  screenRef.current = screen;
  callRef.current = call;
  partnersRef.current = partners;
  const aiPracticeIsPro = subscription?.isPaidSubscriber === true
    || ['basic', 'plus', 'pro', '1month', '3months', '1year'].includes(subscription?.plan?.id);
  const aiFreeCreditsRemaining = Math.max(0, AI_FREE_MESSAGE_LIMIT - aiFreeMessageCount);
  const aiFreeLimitReached = !aiPracticeIsPro && aiCreditsLoaded && aiFreeCreditsRemaining === 0;

  useEffect(() => {
    let active = true;
    aiFreeMessageCountRef.current = 0;
    setAiFreeMessageCount(0);
    setAiCreditsLoaded(false);

    if (!userId) {
      setAiCreditsLoaded(true);
      return () => {
        active = false;
      };
    }

    AsyncStorage.getItem(`${AI_FREE_CREDITS_KEY_PREFIX}${userId}`)
      .then((storedCount) => {
        if (!active) return;
        const parsedCount = Number.parseInt(storedCount || '0', 10);
        const count = Number.isFinite(parsedCount)
          ? Math.min(AI_FREE_MESSAGE_LIMIT, Math.max(0, parsedCount))
          : 0;
        aiFreeMessageCountRef.current = count;
        setAiFreeMessageCount(count);
      })
      .catch((error) => {
        if (!active) return;
        console.warn('[BYTALK AI credits] Could not load saved credits:', error?.message || error);
        Alert.alert('AI credits unavailable', 'Could not load your free AI practice credits. Please try again.');
      })
      .finally(() => {
        if (active) setAiCreditsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const recentCallHistory = callHistory.filter((item) => {
    const createdAt = Date.parse(item.createdAt);
    return Number.isFinite(createdAt) && Date.now() - createdAt <= 86400000;
  });

  // Auth form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regError, setRegError] = useState('');

  const [authBusy, setAuthBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // Reliable Health Check (/api/health)
  const checkHealth = async () => {
    try {
      const res = await request('health');
      if (res && res.ok) {
        setBackendUp(true);
        return true;
      }
      setBackendUp(false);
      return false;
    } catch (e) {
      setBackendUp(false);
      return false;
    }
  };

  const refresh = async () => {
    try {
      const isUp = await checkHealth();
      if (isUp) {
        const [v] = await Promise.all([
          activeAuthToken ? request(`vocabulary/${userId}`).catch(() => []) : Promise.resolve([]),
        ]);
        setVocab(v);
      }
    } catch {
      setBackendUp(false);
    }
  };

  async function loadSubscription() {
    setSubscriptionLoading(true);
    setSubscriptionError('');
    try {
      const [plans, current] = await Promise.all([
        request('subscription/plans').catch(() => null),
        request('subscription/status').catch(() => null),
      ]);
      if (Array.isArray(plans) && plans.length > 0) {
        setSubscriptionPlans(plans);
      }
      if (current) {
        setSubscription(current);
        if (current.freeTrial?.remainingSeconds !== undefined && current.freeTrial?.remainingSeconds !== null) {
          const backendUsed = Math.max(0, 300 - Number(current.freeTrial.remainingSeconds));
          setUsedFreeSeconds((prev) => {
            const next = Math.max(prev, backendUsed);
            saveUsedFreeSeconds(next);
            return next;
          });
        }
      }
    } catch (error) {
      setSubscriptionError(error.userMessage || error.message || 'Subscription status is unavailable.');
    } finally {
      setSubscriptionLoading(false);
    }

  }

  function isPaidSubscriber() {
    if (!subscription) return false;
    const planId = subscription.plan?.id;
    const isSubscribed = ['basic', 'plus', 'pro', '1month', '3months', '1year'].includes(planId) || subscription.active === true;
    if (!isSubscribed) return false;
    const status = subscription.status || (subscription.active ? 'active' : 'inactive');
    if (!['active', 'cancelled'].includes(status)) return false;
    return !subscription.expiresAt || new Date(subscription.expiresAt) > new Date();
  }

  function getFreeTrialSecondsRemaining() {
    if (isPaidSubscriber()) return Infinity;
    return Math.max(0, FREE_TRIAL_TOTAL_SECONDS - usedFreeSeconds);
  }

  function formatCallTime(seconds) {
    const s = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatCallTimeSpaced(seconds) {
    const s = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')} : ${String(secs).padStart(2, '0')}`;
  }

  function hasAudioEntitlement() {
    if (isPaidSubscriber()) return true;
    return getFreeTrialSecondsRemaining() > 0;
  }

  const getTodayKey = () => new Date().toISOString().slice(0, 10);

  const loadFreeTrialUsage = async (uid) => {
    try {
      const today = getTodayKey();
      const storedDay = await authStorage.getItem(`bytalk_free_day_${uid || 'guest'}`);
      if (storedDay !== today) {
        // New day! Reset to 0 used seconds (fresh 10 minutes free every day)
        setUsedFreeSeconds(0);
        await authStorage.setItem(`bytalk_free_day_${uid || 'guest'}`, today);
        await authStorage.setItem(`bytalk_used_free_seconds_${uid || 'guest'}`, '0');
        return;
      }
      const stored = await authStorage.getItem(`bytalk_used_free_seconds_${uid || 'guest'}`);
      if (stored !== null && !isNaN(Number(stored))) {
        setUsedFreeSeconds(Number(stored));
      }
    } catch {}
  };

  const saveUsedFreeSeconds = (seconds) => {
    setUsedFreeSeconds(seconds);
    const uid = userId || 'guest';
    authStorage.setItem(`bytalk_free_day_${uid}`, getTodayKey()).catch(() => {});
    authStorage.setItem(`bytalk_used_free_seconds_${uid}`, String(seconds)).catch(() => {});
  };

  const checkIsFriend = (targetUser) => {
    if (!targetUser) return false;
    const tId = String(targetUser.id || targetUser._id || targetUser.userId || '');
    const tName = String(targetUser.displayName || targetUser.name || '').trim().toLowerCase();
    return (friendsList || []).some((f) => {
      const fId = String(f.id || f._id || f.userId || '');
      const fName = String(f.displayName || f.name || '').trim().toLowerCase();
      if (tId && fId && tId === fId) return true;
      if (tName && fName && tName === fName) return true;
      return false;
    });
  };

  const findIncomingFriendRequest = (targetUser) => {
    if (!targetUser) return null;
    const tId = String(targetUser.id || targetUser._id || targetUser.userId || '');
    const tName = String(targetUser.displayName || targetUser.name || '').trim().toLowerCase();
    return (pendingFriendRequests || []).find((r) => {
      const fromId = String(r.from?.id || r.from?._id || r.from?.userId || '');
      const fromName = String(r.from?.displayName || r.from?.name || '').trim().toLowerCase();
      if (tId && fromId && tId === fromId) return true;
      if (tName && fromName && tName === fromName) return true;
      return false;
    });
  };

  const findSentFriendRequest = (targetUser) => {
    if (!targetUser) return null;
    const tId = String(targetUser.id || targetUser._id || targetUser.userId || '');
    const tName = String(targetUser.displayName || targetUser.name || '').trim().toLowerCase();
    return (sentFriendRequests || []).find((s) => {
      const toId = String(s.to?.id || s.to?._id || s.to?.userId || '');
      const toName = String(s.to?.displayName || s.to?.name || '').trim().toLowerCase();
      if (tId && toId && tId === toId) return true;
      if (tName && toName && tName === toName) return true;
      return false;
    });
  };

  const handleSendFriendRequest = async (targetUser) => {
    if (!targetUser) return false;
    const targetId = typeof targetUser === 'string'
      ? targetUser
      : (targetUser.id || targetUser._id || targetUser.userId || targetUser.callerId || targetUser.peer?.id || targetUser.peer?._id || targetUser.displayName || targetUser.name || targetUser.peer?.name);
    const targetName = (typeof targetUser === 'object' ? (targetUser.displayName || targetUser.name || targetUser.peer?.name) : '') || (typeof targetId === 'string' ? targetId : '') || 'Co-learner';

    if (!targetId && !targetName) {
      Alert.alert('Notice', 'Could not locate co-learner details.');
      return false;
    }

    if (String(targetId) === String(userId)) {
      Alert.alert('Notice', 'You cannot send a friend request to yourself.');
      return false;
    }

    // Check if this co-learner has already sent an incoming friend request -> accept immediately!
    const incomingReq = findIncomingFriendRequest(targetUser);
    if (incomingReq) {
      await handleAcceptFriendRequest(incomingReq);
      return true;
    }

    const optimisticRequestId = `temp-${Date.now()}`;
    try {
      setFriendRequestSentInCall(true);
      // Optimistically add to sent requests so UI immediately reflects pending sent state
      setSentFriendRequests((prev) => {
        const exists = prev.some((s) => {
          const sToId = String(s.to?.id || s.to?._id || '');
          const sToName = String(s.to?.displayName || s.to?.name || '').trim().toLowerCase();
          return (targetId && sToId === String(targetId)) || (targetName && sToName === targetName.trim().toLowerCase());
        });
        if (exists) return prev;
        return [
          ...prev,
          {
            id: optimisticRequestId,
            to: {
              id: targetId,
              name: targetName,
              displayName: targetName,
            },
            createdAt: new Date().toISOString(),
          },
        ];
      });

      const res = await request('friends/request', {
        method: 'POST',
        body: { targetUserId: String(targetId || targetName), targetName: String(targetName) },
      });
      await loadFriends();

      if (res?.isFriend) {
        setFriendNotification(null);
        Alert.alert(
          'Friend Added! 🎉',
          res?.message || `You and ${targetName} are now connected as friends! You can now chat anytime.`,
          [
            {
              text: 'Start Chat Now',
              onPress: () => {
                const partner = partnersRef.current.find((p) => String(p.id) === String(targetId)) || {
                  id: targetId,
                  name: targetName,
                  displayName: targetName,
                };
                if (screen === 'call-complete') leaveCallCompletion();
                openConversation(partner);
              },
            },
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert(
          'Friend Request Sent! 🤝',
          res?.message || `Your friend request has been sent to ${targetName}. When accepted, you can connect directly anytime!`
        );
      }
      return true;
    } catch (err) {
      setFriendRequestSentInCall(false);
      setSentFriendRequests((prev) => prev.filter((requestItem) => requestItem.id !== optimisticRequestId));
      const message = err.message || 'Could not send friend request.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Friend Request\n\n${message}`);
      } else {
        Alert.alert('Friend Request', message);
      }
      return false;
    }
  };

  const handleAcceptFriendRequest = async (req) => {
    try {
      const reqId = req.id || req._id;
      const friendUserId = req.from?.id || req.from?._id;
      const friendName = req.from?.displayName || req.from?.name || 'Co-learner';

      // Optimistically remove from pending and add to friendsList immediately
      setPendingFriendRequests((prev) => prev.filter((r) => String(r.id) !== String(reqId) && String(r.from?.id) !== String(friendUserId)));
      const friendObj = {
        ...(req.from || {}),
        id: friendUserId || `friend-${Date.now()}`,
        name: friendName,
        displayName: friendName,
        avatarUrl: req.from?.avatarUrl || req.from?.profilePhotoUrl || null,
        online: true,
      };
      setFriendsList((prev) => {
        const exists = prev.some((f) => String(f.id) === String(friendUserId) || f.name?.toLowerCase() === friendName.toLowerCase());
        if (exists) return prev;
        return [...prev, friendObj];
      });
      setConversations((prev) => {
        const exists = prev.some((c) => String(c.user?.id) === String(friendUserId) || c.user?.name?.toLowerCase() === friendName.toLowerCase());
        if (exists) return prev;
        return [
          {
            user: friendObj,
            latestMessage: null,
            unreadCount: 0,
            timeDisplay: 'Just now',
          },
          ...prev,
        ];
      });

      await request('friends/accept', {
        method: 'POST',
        body: { requestId: reqId, friendUserId },
      });
      await loadFriends();
      await refreshConversations();
      setFriendNotification(null);
      Alert.alert(
        'Friend Added! 🎉',
        `You and ${friendName} are now friends! You can now chat, video call, or voice call anytime.`,
        [
          {
            text: 'Start Chat Now',
            onPress: () => {
              const partner = partnersRef.current.find((p) => String(p.id) === String(friendUserId)) || req.from || {
                id: friendUserId,
                name: friendName,
                displayName: friendName,
              };
              if (screen === 'call-complete') leaveCallCompletion();
              openConversation(partner);
            },
          },
          { text: 'OK' },
        ]
      );
    } catch (err) {
      Alert.alert('Notice', err.message || 'Could not accept friend request.');
    }
  };

  const handleDeclineFriendRequest = async (req) => {
    try {
      const reqId = req.id || req._id;
      setPendingFriendRequests((prev) => prev.filter((r) => String(r.id) !== String(reqId) && String(r._id) !== String(reqId)));
      await request('friends/decline', {
        method: 'POST',
        body: { requestId: reqId },
      });
      loadFriends();
    } catch (err) {
      console.warn('[declineFriendRequest error]', err.message);
    }
  };

  const handleCancelFriendRequest = async (req) => {
    try {
      const reqId = req.id || req._id;
      const targetUserId = req.to?.id || req.to?._id;
      setSentFriendRequests((prev) => prev.filter((r) => String(r.id) !== String(reqId) && String(r._id) !== String(reqId)));
      await request('friends/cancel', {
        method: 'POST',
        body: { requestId: reqId, targetUserId },
      });
      loadFriends();
    } catch (err) {
      console.warn('[cancelFriendRequest error]', err.message);
    }
  };

  const handleStartDirectCall = (friend) => {
    if (!isPaidSubscriber() && !hasAudioEntitlement()) {
      Alert.alert(
        '👑 BYTALK PRO Required',
        'Direct 1-on-1 calls with your practice friends require a BYTALK PRO subscription. Upgrade now to enjoy unlimited direct calls!',
        [
          { text: 'Upgrade to PRO', onPress: () => openSubscription() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    startCall(friend, 'audio');
  };

  const handleStartDirectVideoCall = (friend) => {
    if (!isPaidSubscriber() && !hasVideoEntitlement()) {
      Alert.alert(
        '👑 BYTALK Plus or Pro Required',
        'Direct video calling with friends requires a BYTALK Plus or Pro subscription. Upgrade now to practice face-to-face!',
        [
          { text: 'Upgrade to PRO', onPress: () => openSubscription() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    startCall(friend, 'video');
  };

  const loadFriends = async () => {
    if (!activeAuthToken) return;
    try {
      const res = await request('friends');
      if (res?.friends && Array.isArray(res.friends)) {
        const unique = Array.from(new Map(res.friends.map((f) => [String(f.id || f.name), f])).values());
        setFriendsList(unique);
      }
      if (res?.pendingRequests && Array.isArray(res.pendingRequests)) {
        const uniqueReqs = Array.from(new Map(res.pendingRequests.map((r) => [String(r.id || r._id || r.requestId || r.from?.id || r.from?.name || Math.random()), r])).values());
        setPendingFriendRequests(uniqueReqs);
      }
      if (res?.sentRequests && Array.isArray(res.sentRequests)) {
        const uniqueSent = Array.from(new Map(res.sentRequests.map((r) => [String(r.id || r._id || r.requestId || r.to?.id || r.to?.name || Math.random()), r])).values());
        setSentFriendRequests(uniqueSent);
      }
    } catch (err) {
      console.warn('[BYTALK loadFriends]', err.message);
    }
  };

  function hasVideoEntitlement() {
    if (!subscription) return false;
    const planId = subscription.plan?.id;
    const isProTier = ['plus', 'pro', '1month', '3months', '1year'].includes(planId) || (subscription.active === true && planId !== 'basic');
    if (!isProTier) return false;
    const status = subscription.status || (subscription.active ? 'active' : 'inactive');
    if (!['active', 'cancelled'].includes(status)) return false;
    return !subscription.expiresAt || new Date(subscription.expiresAt) > new Date();
  }

  function hasMessageEntitlement(partner = selected) {
    if (isPaidSubscriber()) return true;
    if (partner && checkIsFriend(partner)) return true;
    return false;
  }

  async function openSubscription() {
    setSubscriptionError('');
    setActiveBottomTab('pro');
    setScreen('premium');
    loadSubscription().catch(() => {});
  }

  async function buySubscription(plan) {
    setSubscriptionBusy(true);
    setSubscriptionError('');
    try {
      const configured = await configureSubscription(userId);
      if (!configured.available) throw new Error(configured.reason);
      await purchasePlan(plan);
      await loadSubscription();
      Alert.alert('Purchase submitted', 'Your entitlement will unlock after the store provider confirms it.');
    } catch (error) {
      setSubscriptionError(error.message || 'Purchase could not be completed.');
    } finally {
      setSubscriptionBusy(false);
    }
  }

  async function restoreSubscription() {
    setSubscriptionBusy(true);
    setSubscriptionError('');
    try {
      const configured = await configureSubscription(userId);
      if (!configured.available) throw new Error(configured.reason);
      await restorePurchases();
      await loadSubscription();
      Alert.alert('Restore submitted', 'Your provider entitlement will appear after server verification.');
    } catch (error) {
      setSubscriptionError(error.message || 'Purchases could not be restored.');
    } finally {
      setSubscriptionBusy(false);
    }
  }

  async function grantDevelopmentSubscription(plan) {
      setSubscriptionBusy(true);
      setSubscriptionError('');
      try {
        const current = await request('subscription/development/grant', {
          method: 'POST',
          body: JSON.stringify({ plan }),
        });
        setSubscription(current);
        Alert.alert('Development entitlement granted', `${current.plan.name} is active for local testing only.`);
      } catch (error) {
        setSubscriptionError(error.message || 'Development entitlement could not be granted.');
      } finally {
        setSubscriptionBusy(false);
      }
    }

  async function loadDiscoverUsers(refreshing = false, topic = 'All Topics') {
    const requestId = ++discoverRequestRef.current;
    if (!activeAuthToken) {
      setPartners([]);
      setDiscoverError('Sign in to discover registered BYTALK users.');
      setDiscoverLoading(false);
      setDiscoverRefreshing(false);
      return;
    }

    if (refreshing) setDiscoverRefreshing(true);
    setDiscoverLoading(true);
    setDiscoverError('');
    try {
      const result = await request(`users/discover?topic=${encodeURIComponent(topic)}`);
      if (requestId !== discoverRequestRef.current) return;
      const users = Array.isArray(result) ? result : result?.users;
      const rawUsers = Array.isArray(users) ? users : [];
      const uniquePartners = Array.from(new Map(rawUsers.map((u) => [String(u.id), u])).values());
      setPartners(uniquePartners);
      setPartnerTotalEligible(Number(result?.totalEligible) || (Array.isArray(users) ? users.length : 0));
      setDiscoverError('');
    } catch (error) {
      if (requestId !== discoverRequestRef.current) return;
      setDiscoverError(error.message || 'Could not load registered users. Check your connection and retry.');
      if (error.status === 401) {
        setPartners([]);
        setPartnerTotalEligible(0);
        setSessionVersion((value) => value + 1);
        setScreen('welcome');
      }
    } finally {
      if (requestId === discoverRequestRef.current) {
        setDiscoverLoading(false);
        setDiscoverRefreshing(false);
      }
    }
  }

  function updateCall(next) {
    if (typeof next !== 'function') {
      callRef.current = next;
    } else if (callRef.current) {
      callRef.current = next(callRef.current);
    }
    setCall((previous) => {
      const value = typeof next === 'function' ? next(previous) : next;
      callRef.current = value;
      return value;
    });
  }

  function releaseCallMedia() {
    ringtoneManager.stopRinging();
    const connection = peerRef.current?.connection;
    if (connection) {
      connection.onicecandidate = null;
      connection.ontrack = null;
      connection.onconnectionstatechange = null;
      connection.oniceconnectionstatechange = null;
      connection.close();
    }

    peerRef.current = null;
    pendingIceRef.current = [];
    pendingIceByCallRef.current = {};
    pendingOutgoingIceRef.current = [];
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    stopAudioRoute();
    setMuted(false);
    setCameraEnabled(true);
    setSpeakerEnabled(false);
  }

  const toggleMicrophone = () => {
    const nextMuted = !muted;
    const stream = localStreamRef.current || localStream;
    if (stream && typeof stream.getAudioTracks === 'function') {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    try {
      setMicrophoneMuted(nextMuted);
    } catch {}
    setMuted(nextMuted);

    if (callRef.current?.id) {
      socketRef.current?.emit('call:partner-mute', {
        callId: callRef.current.id,
        isMuted: nextMuted,
      });
    }

    setCallNotice(nextMuted ? 'Microphone Muted 🔇' : 'Microphone Active 🎙️');
    setTimeout(() => {
      setCallNotice((prev) => (prev.includes('Microphone') ? '' : prev));
    }, 2500);
  };

  async function notifyIncomingMessage(message) {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.Notification === 'undefined') return;
    try {
      if (window.Notification.permission === 'granted' && document.hidden) {
        new window.Notification('New BYTALK message', { body: String(message.text || '').slice(0, 120) });
      }
    } catch (error) {
      console.warn('[BYTALK notification] unavailable', error?.message || 'permission denied');
    }
  }

  function refreshConversations() {
    return request('messages/conversations')
      .then(setConversations)
      .catch((error) => console.warn('[BYTALK message] conversation list failed', error.message));
  }

  function conversationForMessage(message) {
    const partner = partnersRef.current.find((item) => item.id === message.from);
    return {
      id: message.from,
      name: partner?.name || partner?.displayName || 'BYTALK user',
      displayName: partner?.displayName || partner?.name || 'BYTALK user',
      avatarUrl: partner?.avatarUrl || null,
      country: partner?.country || '',
      learningLanguage: partner?.learningLanguage || '',
      online: Boolean(partner?.online),
    };
  }

  function openConversation(partner) {
    const isFriend = checkIsFriend(partner);
    if (!isFriend && !hasMessageEntitlement(partner)) {
      Alert.alert(
        'Subscription Required',
        'Direct 1-on-1 messaging is a BYTALK Premium feature. Upgrade your plan to chat with any user, or add them as a friend to chat for free!',
        [
          { text: 'Upgrade to PRO', onPress: () => openSubscription() },
          { text: 'Add as Friend', onPress: () => handleSendFriendRequest(partner) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    setSelected(partner);
    setShowEmojiPicker(false);
    setChatError('');
    setMessageBanner(null);
    setScreen('chat');

    // If opening Mr. Tayo Ade (matching referral screenshot), seed initial dialogue
    if (partner.id === 'sample-1' || partner.name === 'Mr. Tayo Ade' || partner.displayName === 'Mr. Tayo Ade') {
      const sampleDialogue = [
        { id: 'm1', from: partner.id, to: userId, text: 'I need you to help me with the file.', at: new Date(Date.now() - 3600000).toISOString() },
        { id: 'm2', from: userId, to: partner.id, text: 'Which of the file? The one you gave me yesterday?', at: new Date(Date.now() - 3500000).toISOString(), readAt: new Date().toISOString() },
        { id: 'm3', from: partner.id, to: userId, text: 'No. The case file for the field project we proposed last week', at: new Date(Date.now() - 3400000).toISOString() },
        { id: 'm4', from: partner.id, to: userId, text: "Welcome, we're glad to see you here.", at: new Date(Date.now() - 3300000).toISOString() },
        { id: 'm5', from: userId, to: partner.id, text: 'I think the file is either with the Accountant or the supervisor. I will ask both of them.', at: new Date(Date.now() - 3200000).toISOString(), readAt: new Date().toISOString() },
        { id: 'm6', from: partner.id, to: userId, text: 'Oh great! Thank you. I look forward to a positive response.', at: new Date(Date.now() - 3100000).toISOString() },
        { id: 'm7', from: userId, to: partner.id, text: 'You are welcome.', at: new Date(Date.now() - 3000000).toISOString(), readAt: new Date().toISOString() },
        { id: 'm8', from: partner.id, to: userId, text: 'Good morning. Any update?', at: new Date(Date.now() - 600000).toISOString() },
        { id: 'm9', from: userId, to: partner.id, text: "Good morning, Mr. Tayo. I'll help create a dialogue between the accountant and the supervisor on the situation of the warehouse.", at: new Date(Date.now() - 300000).toISOString(), readAt: new Date().toISOString() },
      ];
      setMessages((prev) => {
        const withoutPartner = prev.filter((m) => !(m.from === partner.id || m.to === partner.id));
        return [...sampleDialogue, ...withoutPartner];
      });
    }
  }

  async function requestNotificationPermission() {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.Notification === 'undefined') return;
    if (window.Notification.permission !== 'default') return;
    try {
      await window.Notification.requestPermission();
    } catch (error) {
      console.warn('[BYTALK notification] permission request unavailable', error?.message || 'permission denied');
    }
  }

  async function notifyIncomingCall(incoming) {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.Notification === 'undefined') return;
    try {
      if (window.Notification.permission === 'default') await window.Notification.requestPermission();
      if (window.Notification.permission === 'granted' && document.hidden) {
        new window.Notification(`Incoming ${incoming.type} call`, {
          body: `${incoming.caller?.name || 'A BYTALK user'} is calling you.`,
        });
      }
    } catch (error) {
      console.warn('[BYTALK notification] incoming call unavailable', error?.message || 'permission denied');
    }
  }

  function createCallPeer(callId, stream, iceServers) {
    const connection = createPeerConnection(iceServers);
    const audioCount = stream?.getAudioTracks ? stream.getAudioTracks().length : 0;
    const videoCount = stream?.getVideoTracks ? stream.getVideoTracks().length : 0;
    console.log('[BYTALK call] peer created', {
      callId,
      iceServerCount: iceServers.length,
      audioTracks: audioCount,
      videoTracks: videoCount,
    });
    if (stream && typeof stream.getTracks === 'function') {
      stream.getTracks().forEach((track) => {
        if (track.kind === 'audio') {
          track.enabled = !muted;
        }
        connection.addTrack(track, stream);
      });
    }
    peerRef.current = { callId, connection };

    // Flush any pending ICE candidates that arrived before peer was ready for this callId
    if (callId && pendingIceByCallRef.current[callId]) {
      const earlyIce = pendingIceByCallRef.current[callId].splice(0);
      for (const candidate of earlyIce) {
        if (connection.remoteDescription) {
          try {
            connection.addIceCandidate(makeIceCandidate(candidate));
          } catch (e) {}
        } else {
          pendingIceRef.current.push(candidate);
        }
      }
    }

    connection.onicecandidate = (event) => {
      if (!event.candidate) return;
      const candidate = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
      const callIdForCandidate = peerRef.current?.callId;
      if (!callIdForCandidate) {
        pendingOutgoingIceRef.current.push(candidate);
        return;
      }
      console.log('[BYTALK call] signaling ICE candidate', { callId: callIdForCandidate });
      socketRef.current?.emit('call:signal', {
        callId: callIdForCandidate,
        kind: 'ice',
        signal: candidate,
      }, (response) => {
        if (response?.error) {
          console.warn('[BYTALK call] ICE candidate rejected', response.error);
        }
      });
    };

    connection.ontrack = (event) => {
      console.log('[BYTALK call] remote track received', {
        callId: peerRef.current?.callId,
        kind: event.track?.kind,
        streamsCount: event.streams?.length,
      });
      if (event.track) {
        event.track.enabled = true;
      }
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else if (event.track) {
        try {
          let fallbackStream = null;
          if (typeof MediaStream !== 'undefined') {
            fallbackStream = new MediaStream([event.track]);
          }
          if (fallbackStream) setRemoteStream(fallbackStream);
        } catch (e) {
          console.warn('[BYTALK call] fallback stream error:', e?.message || e);
        }
      }
    };

    connection.onaddstream = (event) => {
      if (event?.stream) {
        console.log('[BYTALK call] onaddstream event received', { callId: peerRef.current?.callId });
        setRemoteStream(event.stream);
      }
    };

    const updateConnectionState = () => {
      const state = connection.connectionState;
      const iceState = connection.iceConnectionState;
      console.log('[BYTALK call] peer state', { callId: peerRef.current?.callId, state, iceState });
      const mediaConnected = state === 'connected'
        || ((iceState === 'connected' || iceState === 'completed') && !['failed', 'closed'].includes(state));
      if (mediaConnected) {
        updateCall((previous) => previous ? { ...previous, status: 'Connected', connectedAt: previous.connectedAt || new Date().toISOString() } : previous);
        socketRef.current?.emit('call:connected', { callId: peerRef.current?.callId });
      } else if (state === 'disconnected' || iceState === 'disconnected') {
        updateCall((previous) => previous ? { ...previous, status: 'Reconnecting' } : previous);
      } else if (state === 'failed' || iceState === 'failed') {
        const notice = 'The media connection failed. Check your network or TURN server configuration.';
        setCallNotice(notice);
        endCall(notice);
      } else if (state === 'connecting' || iceState === 'checking') {
        updateCall((previous) => previous ? { ...previous, status: 'Connecting' } : previous);
      }
    };
    connection.onconnectionstatechange = updateConnectionState;
    connection.oniceconnectionstatechange = updateConnectionState;
    return connection;
  }

  async function createCallOffer(callId) {
    try {
      const connection = peerRef.current?.connection;
      if (!connection || peerRef.current.callId !== callId) return;
      const isVideo = Boolean(callRef.current?.type === 'video');
      const offer = await connection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo,
      });
      await connection.setLocalDescription(offer);
      console.log('[BYTALK call] signaling offer', { callId });
      socketRef.current?.emit('call:signal', { callId, kind: 'offer', signal: connection.localDescription || offer }, (res) => {
        if (res?.error) {
          console.warn('[BYTALK call] offer signal response error:', res.error);
        }
      });
      updateCall((previous) => previous ? { ...previous, status: 'Connecting' } : previous);
    } catch (error) {
      console.warn('[BYTALK call] createCallOffer error:', error?.message || error);
      setCallNotice(error.message || 'Could not start the media connection.');
    }
  }

  async function processCallSignal({ callId, kind, signal }) {
    const connection = peerRef.current?.connection;
    if (!connection || peerRef.current.callId !== callId) {
      if (kind === 'ice' && signal) {
        if (!pendingIceByCallRef.current[callId]) {
          pendingIceByCallRef.current[callId] = [];
        }
        pendingIceByCallRef.current[callId].push(signal);
      }
      return;
    }
    console.log('[BYTALK call] signaling received', { callId, kind });
    try {
      if (kind === 'offer') {
        await connection.setRemoteDescription(makeSessionDescription(signal));
        const pendingForCall = (pendingIceByCallRef.current[callId] || []).splice(0);
        const queuedIce = [...pendingIceRef.current.splice(0), ...pendingForCall];
        for (const candidate of queuedIce) {
          try {
            await connection.addIceCandidate(makeIceCandidate(candidate));
          } catch (e) {}
        }
        const isVideo = Boolean(callRef.current?.type === 'video');
        const answer = await connection.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideo,
        });
        await connection.setLocalDescription(answer);
        console.log('[BYTALK call] signaling answer', { callId });
        socketRef.current?.emit('call:signal', { callId, kind: 'answer', signal: connection.localDescription || answer }, (res) => {
          if (res?.error) {
            console.warn('[BYTALK call] answer signal response error:', res.error);
          }
        });
        updateCall((previous) => previous ? { ...previous, status: 'Connecting' } : previous);
      } else if (kind === 'answer') {
        await connection.setRemoteDescription(makeSessionDescription(signal));
        const pendingForCall = (pendingIceByCallRef.current[callId] || []).splice(0);
        const queuedIce = [...pendingIceRef.current.splice(0), ...pendingForCall];
        for (const candidate of queuedIce) {
          try {
            await connection.addIceCandidate(makeIceCandidate(candidate));
          } catch (e) {}
        }
      } else if (kind === 'ice') {
        if (connection.remoteDescription) {
          try {
            await connection.addIceCandidate(makeIceCandidate(signal));
          } catch (iceErr) {
            console.warn('[BYTALK call] addIceCandidate error:', iceErr?.message || iceErr);
          }
        } else {
          pendingIceRef.current.push(signal);
        }
      }
    } catch (error) {
      console.warn('[BYTALK call] processCallSignal error:', error?.message || error);
      setCallNotice(error.message || 'Could not negotiate the media connection.');
    }
  }

  function handleCallSignal(signal) {
    signalQueueRef.current = signalQueueRef.current
      .catch(() => {})
      .then(() => processCallSignal(signal));
  }

  function finishCallLocally(status, notice = '', details = {}) {
    stopSpeech();
    ringtoneManager.stopRinging();
    const currentCall = callRef.current;
    if (!currentCall || callCompletion) return;
    if (callExitTimerRef.current) clearTimeout(callExitTimerRef.current);
    const endedAt = details.endedAt || new Date().toISOString();
    const connectedAt = currentCall.connectedAt ? Date.parse(currentCall.connectedAt) : NaN;
    const calculatedDuration = Number.isFinite(connectedAt)
      ? Math.max(0, Math.floor((Date.parse(endedAt) - connectedAt) / 1000))
      : 0;
    const durationSeconds = Number.isFinite(Number(details.durationSeconds))
      ? Math.max(0, Math.floor(Number(details.durationSeconds)))
      : calculatedDuration;
    setCallNotice(notice);
    releaseCallMedia();
    updateCall(null);
    callRef.current = null;
    setFriendRequestSentInCall(false);
    setCallCompletion({ ...currentCall, status, endedAt, durationSeconds });
    setFeedbackRating(5);
    setFeedbackTags([]);
    setFeedbackComment('');
    setFeedbackSubmitted(false);
    setFeedbackError('');
    setScreen('call-complete');
    loadFriends();
    setTimeout(() => {
      request('calls').then((history) => setCallHistory(history.filter((item) => Date.now() - Date.parse(item.createdAt) <= 86400000))).catch((error) => {
        setCallHistoryError(error.message || 'Call ended, but call history could not be refreshed.');
      });
    }, 300);
  }

  function leaveCallCompletion() {
    ringtoneManager.stopRinging();
    setFriendRequestSentInCall(false);
    setCallCompletion(null);
    updateCall(null);
    callRef.current = null;
    setActiveBottomTab('call');
    setScreen('call-tab');
  }

  async function submitCallFeedback() {
    if (!callCompletion?.id || feedbackSubmitting || feedbackSubmitted) return;
    const rating = feedbackRating || 5;
    setFeedbackSubmitting(true);
    setFeedbackError('');
    try {
      await request(`calls/${encodeURIComponent(callCompletion.id)}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          tags: feedbackTags,
          comment: feedbackComment,
        }),
      });
      setFeedbackSubmitted(true);
      request('calls').then((history) => setCallHistory(history.filter((item) => Date.now() - Date.parse(item.createdAt) <= 86400000))).catch(() => {});
    } catch (error) {
      setFeedbackError(error.message || 'Feedback could not be submitted.');
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  function emitWithAck(event, payload) {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        reject(new Error('Real-time service is disconnected. Reconnect and try again.'));
        return;
      }
      socket.timeout(12000).emit(event, payload, (timeoutError, response) => {
        if (timeoutError) {
          reject(new Error('The server did not respond. Please try again.'));
        } else if (response?.error) {
          const error = new Error(response.error);
          error.code = response.code;
          reject(error);
        } else {
          resolve(response || {});
        }
      });
    });
  }

  async function startCall(partner, type) {
    console.log('[BYTALK call] button pressed', { partnerId: partner?.id, type });
    setFriendRequestSentInCall(false);
    ringtoneManager.unlockAudio();
    if (!activeAuthToken) {
      Alert.alert('Sign in required', 'Sign in before starting a private call.');
      return;
    }
    const isFriend = checkIsFriend(partner);
    if (!isFriend) {
      if (type === 'audio' && !hasAudioEntitlement()) {
        setSubscriptionError('Your daily 10 minutes free trial has ended. Please purchase a subscription to continue speaking practice.');
        await openSubscription();
        return;
      }
      if (type === 'video' && !hasVideoEntitlement()) {
        setSubscriptionError('BYTALK Plus or Pro is required for one-to-one video-call practice.');
        await openSubscription();
        return;
      }
    }

    // Real registered co-learners only
    if (partner.id?.startsWith('partner_') || partner.isAi) {
      Alert.alert('Notice', 'Voice and video calling are only available with real registered co-learners.');
      return;
    }

    if (!socketRef.current?.connected) {
      console.log('[BYTALK call] Realtime socket disconnected');
      Alert.alert(
        'Connection Reconnecting',
        'Realtime calling service is currently reconnecting. Please check your internet connection and try again in a moment.'
      );
      return;
    }

    setCallStarting({ partnerId: partner.id, type });
    setCallNotice('Requesting microphone and camera permission…');
    try {
      console.log('[BYTALK call] requesting media', { type });
      const rtcConfig = await request('rtc-config');
      iceServersRef.current = rtcConfig.iceServers || [];
      const stream = await getLocalMediaStream(type);
      console.log('[BYTALK call] media ready', {
        audio: stream.getAudioTracks().length,
        video: stream.getVideoTracks().length,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      const initialCall = { id: null, peer: partner, type, direction: 'outgoing', status: 'Calling' };
      callRef.current = initialCall;
      updateCall(initialCall);
      setCallNotice(type === 'video' && !stream.getVideoTracks().length
        ? 'Camera unavailable; this call will continue with audio only.'
        : '');
      setCameraEnabled(stream.getVideoTracks().length > 0);
      setSelected(partner);
      setScreen('call');
      const speaker = true; // Default speakerphone on for clear practice
      startAudioRoute(type, speaker);
      setSpeakerEnabled(speaker);
      createCallPeer(null, stream, iceServersRef.current);
      console.log('[BYTALK call] sending call:invite', { to: partner.id, type });
      const result = await emitWithAck('call:invite', { to: partner.id, type });
      console.log('[BYTALK call] invite acknowledged', { callId: result.callId });
      if (!peerRef.current || callRef.current?.peer.id !== partner.id || callRef.current?.status === 'Ended') {
        socketRef.current?.emit('call:end', { callId: result.callId });
        return;
      }
      peerRef.current.callId = result.callId;
      if (pendingIceByCallRef.current[result.callId]) {
        const earlyCandidates = pendingIceByCallRef.current[result.callId].splice(0);
        for (const candidate of earlyCandidates) {
          if (peerRef.current?.connection?.remoteDescription) {
            try {
              peerRef.current.connection.addIceCandidate(makeIceCandidate(candidate));
            } catch (e) {}
          } else {
            pendingIceRef.current.push(candidate);
          }
        }
      }
      const ringingCall = { ...(callRef.current || initialCall), id: result.callId, status: 'Ringing' };
      callRef.current = ringingCall;
      updateCall(ringingCall);
      ringtoneManager.startRinging({ direction: 'outgoing' });
      const queuedCandidates = pendingOutgoingIceRef.current.splice(0);
      for (const candidate of queuedCandidates) {
        socketRef.current?.emit('call:signal', {
          callId: result.callId,
          kind: 'ice',
          signal: candidate,
        }, (response) => {
          if (response?.error) {
            console.warn('[BYTALK call] queued ICE candidate rejected', response.error);
          }
        });
      }
    } catch (error) {
      console.warn('[BYTALK call] failed', error.message || error);
      ringtoneManager.stopRinging();
      releaseCallMedia();
      updateCall(null);
      if (error.code === 'video_plan_required' || error.code === 'subscription_required') {
        setSubscriptionError(error.message);
        setScreen('premium');
      } else {
        setScreen(activeBottomTab === 'pro' ? 'call-tab' : (activeBottomTab || 'call-tab'));
        Alert.alert(
          'Call Unavailable',
          error.message || 'The co-learner could not be reached right now. Please try calling another online user.'
        );
      }
    } finally {
      setCallStarting(null);
    }
  }

  async function acceptCall() {
    stopSpeech();
    ringtoneManager.stopRinging();
    const incoming = callRef.current;
    if (!incoming?.id || incoming.direction !== 'incoming') return;
    setCallCompletion(null);
    setScreen('call');
    try {
      const rtcConfig = await request('rtc-config');
      iceServersRef.current = rtcConfig.iceServers || [];
      const stream = await getLocalMediaStream(incoming.type);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCameraEnabled(stream.getVideoTracks().length > 0);
      if (incoming.type === 'video' && !stream.getVideoTracks().length) {
        setCallNotice('Camera unavailable; accepting with audio only.');
      }
      const speaker = true; // Default speakerphone on for clear practice
      startAudioRoute(incoming.type, speaker);
      setSpeakerEnabled(speaker);
      createCallPeer(incoming.id, stream, iceServersRef.current);
      await emitWithAck('call:accept', { callId: incoming.id });
      updateCall((previous) => previous ? { ...previous, status: 'Connecting' } : previous);
    } catch (error) {
      releaseCallMedia();
      socketRef.current?.emit('call:reject', { callId: incoming.id });
      finishCallLocally('Ended', error.message || 'Could not accept this call.');
    }
  }

  async function rejectCall() {
    ringtoneManager.stopRinging();
    const incoming = callRef.current;
    if (!incoming?.id) {
      finishCallLocally('Ended', 'Call disconnected');
      return;
    }
    let notice = '';
    try {
      await emitWithAck('call:reject', { callId: incoming.id });
    } catch (error) {
      notice = error.message;
    }
    finishCallLocally('Rejected', notice || 'Call declined');
  }

  async function endCall(notice = '') {
    stopSpeech();
    ringtoneManager.stopRinging();
    const currentCall = callRef.current;
    if (!currentCall) return;
    if (currentCall.id && !currentCall.peer?.isAi && !currentCall.id.startsWith('call_sarah_') && !currentCall.id.startsWith('call_partner_')) {
      try {
        const result = await emitWithAck('call:end', { callId: currentCall.id });
        finishCallLocally('Ended', notice, result.call || result);
        return;
      } catch (error) {
        notice = notice ? (notice + ' ' + error.message) : error.message;
      }
    }
    finishCallLocally('Ended', notice);
  }

  // RESTORE SESSION ON APP OPEN (Requirement 7 & 11)
  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const [token, expiryStr, savedUserStr] = await Promise.all([
          authStorage.getItem(SESSION_TOKEN_KEY),
          authStorage.getItem(SESSION_EXPIRES_KEY),
          authStorage.getItem(SESSION_USER_KEY),
        ]);

        const expiry = Number(expiryStr);
        if (!token || !Number.isFinite(expiry) || Date.now() >= expiry) {
          await clearSession();
          if (active) {
            setScreen('welcome');
            setSessionChecking(false);
          }
          return;
        }

        // Fast immediate restore of saved profile on refresh/reload
        if (savedUserStr) {
          try {
            const cachedUser = JSON.parse(savedUserStr);
            if (cachedUser) {
              if (cachedUser.id) setUserId(cachedUser.id);
              if (cachedUser.name || cachedUser.displayName) setName(cachedUser.displayName || cachedUser.name);
              if (cachedUser.email) setEmail(cachedUser.email);
              if (cachedUser.profilePhotoUrl) setAvatarUrl(cachedUser.profilePhotoUrl);
            }
          } catch {}
        }

        setAuthToken(token);

        // Validate token cryptographically against backend (Requirement 11)
        const meRes = await request('auth/me');
        if (!active) return;

        if (meRes && meRes.ok && meRes.user) {
          if (meRes.user.id) setUserId(meRes.user.id);
          const resolvedName = meRes.user.displayName || meRes.user.name;
          if (resolvedName) setName(resolvedName);
          if (meRes.user.email) setEmail(meRes.user.email);
          if (meRes.user.profilePhotoUrl !== undefined) setAvatarUrl(meRes.user.profilePhotoUrl);
          if (meRes.user.country) setCountry(meRes.user.country);
          if (meRes.user.nativeLanguage) setNativeLanguage(meRes.user.nativeLanguage);
          if (meRes.user.learningLanguage) setLearningLanguage(meRes.user.learningLanguage);
          if (meRes.user.level) setLevel(meRes.user.level);
          setPracticeInterests(Array.isArray(meRes.user.practiceInterests) ? meRes.user.practiceInterests : []);
          if (meRes.subscription) {
            setSubscription(meRes.subscription);
          }
          await authStorage.setItem(SESSION_USER_KEY, JSON.stringify(meRes.user));
          setScreen('home');
          setActiveBottomTab('home');
        } else {
          await clearSession();
          setScreen('welcome');
        }
      } catch (err) {
        // Backend validation failed (expired, revoked, or server unavailable)
        if (active) {
          await clearSession();
          setScreen('welcome');
        }
      } finally {
        if (active) setSessionChecking(false);
      }
    }

    restoreSession();
    refresh();

    return () => {
      active = false;
      socketRef.current?.emit('typing:stop', { to: selected.id });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (sessionChecking) return undefined;
    let active = true;
    let socket;

    async function connectSocket() {
      const token = activeAuthToken || await authStorage.getItem(SESSION_TOKEN_KEY);
      if (!active || !token) return;
      socket = io(API, { auth: { token }, transports: ['websocket', 'polling'], autoConnect: false });
      socketRef.current = socket;
      socket.on('connect', () => {
        console.log('[BYTALK socket] connected', { api: API });
        loadSubscription();
        request('messages/unread')
          .then(setUnreadByUser)
          .catch((error) => console.warn('[BYTALK message] unread count failed', error.message));
        refreshConversations();
        if (screenRef.current === 'chat' && selectedRef.current.id && userIdRef.current) {
          request(`messages/${userIdRef.current}/${selectedRef.current.id}?limit=100`)
            .then((history) => {
              setMessages((previous) => {
                const merged = new Map(previous.map((message) => [message.id, message]));
                history.forEach((message) => merged.set(message.id, message));
                return [...merged.values()].sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
              });
            })
            .catch((error) => console.warn('[BYTALK message] reconnect history refresh failed', error.message));
        }
        const connection = peerRef.current?.connection;
        if (callRef.current?.id && connection?.connectionState === 'connected') {
          socket.emit('call:connected', { callId: callRef.current.id });
        }
      });
      socket.on('connect_error', (error) => {
        console.warn('[BYTALK socket] connection error', error.message);
        if (active) setChatError(error.message || 'Could not connect to messaging.');
        if (active) setCallNotice(`Call service unavailable: ${error.message || 'connection failed'}`);
      });
      socket.on('disconnect', (reason) => {
        console.warn('[BYTALK socket] disconnected', { reason });
      });
      socket.on('error', (error) => {
        console.warn('[BYTALK socket] error', error?.message || 'unknown error');
      });
      socket.on('message:new', (message) => {
        try {
          const currentUserId = String(userIdRef.current || '');
          const recipientId = String(message.to || '').toLowerCase();
          const senderId = String(message.from || '').toLowerCase();
          const myIdVariants = [
            currentUserId.toLowerCase(),
            String(nameRef.current || '').toLowerCase(),
            String(emailRef.current || '').toLowerCase(),
          ].filter(Boolean);

          const isMeRecipient = myIdVariants.includes(recipientId);
          const isMeSender = myIdVariants.includes(senderId);
          if (!isMeRecipient && !isMeSender) return;
          if (seenMessageIdsRef.current.has(message.id)) return;
          seenMessageIdsRef.current.add(message.id);

          const isIncoming = isMeRecipient && !isMeSender;
          const openConversation = screenRef.current === 'chat' && (
            String(selectedRef.current.id).toLowerCase() === senderId ||
            String(selectedRef.current.name).toLowerCase() === senderId
          );
          const sender = conversationForMessage(message);
          console.log('[BYTALK message] received', { messageId: message.id, from: message.from, to: message.to, openConversation });
          setMessages((previous) => previous.some((item) => item.id === message.id) ? previous : [...previous, message]);
          setConversations((previous) => {
            const partnerKey = isIncoming ? senderId : recipientId;
            const existing = previous.find((item) => String(item.user.id).toLowerCase() === partnerKey || String(item.user.name).toLowerCase() === partnerKey);
            const userObj = existing?.user || sender;
            const updatedEntry = {
              user: userObj,
              latestMessage: message,
              unreadCount: openConversation ? 0 : ((existing?.unreadCount || 0) + (isIncoming ? 1 : 0)),
              timeDisplay: message.at ? new Date(message.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            };
            return [
              updatedEntry,
              ...previous.filter((item) => String(item.user.id).toLowerCase() !== partnerKey && String(item.user.name).toLowerCase() !== partnerKey),
            ];
          });
          if (isIncoming && !openConversation) {
            setUnreadByUser((previous) => ({ ...previous, [message.from]: (previous[message.from] || 0) + 1 }));
            setMessageBanner({ ...message, sender });
            notifyIncomingMessage(message);
          } else if (isIncoming && openConversation) {
            request(`messages/${currentUserId}/${message.from}?limit=100`)
              .then(() => refreshConversations())
              .catch(() => {});
          }
        } catch (error) {
          console.warn('[BYTALK message] listener failed', error?.message || 'invalid message event');
        }
      });
      socket.on('message:status', (status) => {
        setMessages((previous) => previous.map((message) => message.id === status.id ? { ...message, ...status } : message));
        refreshConversations();
      });
      socket.on('presence:update', ({ userId: changedId, online }) => {
        console.log('[BYTALK presence] update', { userId: changedId, online });
        setPartners((previous) => previous.map((partner) => String(partner.id) === String(changedId) ? { ...partner, online } : partner));
        setSelected((previous) => String(previous.id) === String(changedId) ? { ...previous, online } : previous);
      });
      socket.on('presence:state', (onlineUserIds) => {
        const online = new Set((onlineUserIds || []).map(String));
        console.log('[BYTALK presence] snapshot', { count: online.size });
        setPartners((previous) => previous.map((partner) => ({ ...partner, online: online.has(String(partner.id)) })));
        setSelected((previous) => previous.id ? { ...previous, online: online.has(String(previous.id)) } : previous);
      });
      socket.on('typing:update', ({ from, typing: isTyping }) => {
        if (from === selectedRef.current.id) setTyping(Boolean(isTyping));
      });
      socket.on('call:incoming', (incoming) => {
        console.log('[BYTALK call] incoming call received', { callId: incoming.callId, type: incoming.type });
        setFriendRequestSentInCall(false);
        ringtoneManager.stopRinging();
        if (callRef.current?.id === incoming.callId && callRef.current?.status === 'Connected') return;
        const peer = partnersRef.current.find((partner) => String(partner.id) === String(incoming.caller?.id)) || incoming.caller;
        setSelected(peer);
        updateCall({
          id: incoming.callId,
          peer,
          type: incoming.type,
          direction: 'incoming',
          status: 'Ringing',
          restricted: Boolean(incoming.restricted),
        });
        setCallNotice(incoming.restrictionReason || '');
        setScreen('call');
        ringtoneManager.startRinging({ direction: 'incoming' });
        notifyIncomingCall(incoming);
      });
      socket.on('call:accepted', ({ callId }) => {
        console.log('[BYTALK call] call accepted', { callId, userId });
        ringtoneManager.stopRinging();
        if (peerRef.current) peerRef.current.callId = callId;
        if (pendingIceByCallRef.current[callId]) {
          const earlyCandidates = pendingIceByCallRef.current[callId].splice(0);
          for (const candidate of earlyCandidates) {
            if (peerRef.current?.connection?.remoteDescription) {
              try {
                peerRef.current.connection.addIceCandidate(makeIceCandidate(candidate));
              } catch (e) {}
            } else {
              pendingIceRef.current.push(candidate);
            }
          }
        }
        const current = callRef.current;
        if (!current?.id || current.id === callId) {
          const connectingCall = { ...(current || {}), id: callId, status: 'Connecting' };
          callRef.current = connectingCall;
          updateCall(connectingCall);
          createCallOffer(callId);
        }
      });
      socket.on('call:signal', (signal) => handleCallSignal(signal));
      socket.on('call:partner-mute', ({ isMuted } = {}) => {
        const partnerName = callRef.current?.peer?.name || 'Speaking partner';
        setCallNotice(isMuted ? `${partnerName} muted mic 🔇` : `${partnerName} mic active 🎙️`);
        setTimeout(() => {
          setCallNotice((prev) => (prev.includes('mic') ? '' : prev));
        }, 2500);
      });
      socket.on('call:state', ({ callId, status, connectedAt }) => {
        if (status === 'connected') {
          ringtoneManager.stopRinging();
        }
        if (callRef.current?.id !== callId) return;
        const title = status === 'connected' ? 'Connected' : 'Reconnecting';
        updateCall((previous) => previous ? { ...previous, status: title, connectedAt: connectedAt || previous.connectedAt || new Date().toISOString() } : previous);
      });
      socket.on('call:missed', ({ callId, endedAt, durationSeconds }) => {
        ringtoneManager.stopRinging();
        if (callRef.current?.id === callId) finishCallLocally('Missed', 'This call was not answered.', { endedAt, durationSeconds });
      });
      socket.on('call:rejected', ({ callId, endedAt, durationSeconds }) => {
        ringtoneManager.stopRinging();
        if (callRef.current?.id === callId) finishCallLocally('Rejected', 'The call was declined.', { endedAt, durationSeconds });
      });
      socket.on('call:ended', ({ callId, status, reason, endedAt, durationSeconds }) => {
        console.log('[BYTALK call] call ended', { callId, status, reason });
        ringtoneManager.stopRinging();
        if (callRef.current?.id && callRef.current.id !== callId) return;
        const message = reason === 'disconnected'
          ? 'The other user disconnected.'
          : reason === 'connection-timeout'
            ? 'The media connection could not be established.'
            : '';
        finishCallLocally(status === 'missed' ? 'Missed' : status === 'rejected' ? 'Rejected' : 'Ended', message, { endedAt, durationSeconds });
      });
      socket.on('subscription:updated', (payload) => {
        console.log('[BYTALK socket] subscription:updated received', payload);
        if (payload?.subscription) {
          setSubscription(payload.subscription);
        } else if (payload?.plan) {
          setSubscription({
            plan: payload.plan,
            status: payload.status || 'active',
            expiresAt: payload.expiresAt || null,
          });
        }
        loadSubscription().catch(() => {});
        if (screenRef.current === 'premium') {
          setActiveBottomTab('home');
          setScreen('home');
        }
        if (payload?.message) {
          Alert.alert('🎉 Subscription Active', payload.message);
        }
      });
      socket.on('friend:request', (payload) => {
        console.log('[BYTALK socket] friend:request received', payload);
        if (payload?.from) {
          setPendingFriendRequests((prev) => {
            const exists = prev.some((r) => String(r.id) === String(payload.requestId) || String(r.from?.id) === String(payload.from?.id));
            if (exists) return prev;
            return [
              {
                id: payload.requestId || `req-${Date.now()}`,
                from: payload.from,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ];
          });
        }
        loadFriends();
        setFriendNotification({
          type: 'request',
          title: 'New Friend Request 📬',
          message: payload?.message || `${payload?.from?.name || 'A co-learner'} sent you a friend request!`,
          payload,
        });
      });
      socket.on('friend:accepted', (payload) => {
        console.log('[BYTALK socket] friend:accepted received', payload);
        if (payload?.userId) {
          const friendObj = {
            id: payload.userId,
            name: payload.name || payload.displayName || 'Co-learner',
            displayName: payload.displayName || payload.name || 'Co-learner',
            avatarUrl: payload.avatarUrl || null,
            online: true,
          };
          setFriendsList((prev) => {
            const exists = prev.some((f) => String(f.id) === String(payload.userId) || f.name?.toLowerCase() === payload.name?.toLowerCase());
            if (exists) return prev;
            return [...prev, friendObj];
          });
          setConversations((prev) => {
            const exists = prev.some((c) => String(c.user?.id) === String(payload.userId) || c.user?.name?.toLowerCase() === payload.name?.toLowerCase());
            if (exists) return prev;
            return [
              {
                user: friendObj,
                latestMessage: null,
                unreadCount: 0,
                timeDisplay: 'Just now',
              },
              ...prev,
            ];
          });
          setSentFriendRequests((prev) => prev.filter((r) => String(r.to?.id) !== String(payload.userId) && r.to?.name?.toLowerCase() !== payload.name?.toLowerCase()));
        }
        loadFriends();
        refreshConversations();
        setFriendNotification({
          type: 'accepted',
          title: 'Friend Request Accepted 🎉',
          message: payload?.message || `${payload?.name || 'Your friend'} accepted your friend request!`,
          payload,
        });
      });
      socket.on('friend:cancelled', () => {
        loadFriends();
      });
      socket.on('friend:declined', (payload) => {
        loadFriends();
        if (payload?.userId) {
          setSentFriendRequests((prev) => prev.filter((r) => String(r.to?.id) !== String(payload.userId)));
        }
      });
      socket.on('subscription:plans_updated', (payload) => {
        console.log('[BYTALK socket] subscription:plans_updated received', payload);
        if (Array.isArray(payload?.plans) && payload.plans.length > 0) {
          setSubscriptionPlans(payload.plans);
        } else {
          loadSubscription().catch(() => {});
        }
      });
      socket.on('user:status_updated', ({ status, message }) => {
        console.log('[BYTALK socket] user:status_updated received', { status, message });
        if (status === 'suspended') {
          Alert.alert('Account Suspended', message || 'Your account has been suspended by administration.');
          performLogout();
        } else if (status === 'active' && message) {
          Alert.alert('Account Notice', message);
        }
      });
      socket.connect();
    }

    connectSocket().catch((error) => {
      if (active) setChatError(error.message || 'Could not connect to messaging.');
    });
    return () => {
      active = false;
      if (socketRef.current === socket) socketRef.current = null;
      socket?.disconnect();
    };
  }, [sessionChecking, sessionVersion, userId]);

  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event?.url;
      if (url && (url.includes('payment-success') || url.includes('payment_id'))) {
        try {
          await loadSubscription();
          Alert.alert('🎉 PRO Activated!', 'Your payment was confirmed. All features are now unlocked!');
        } catch {}
      } else if (url && (url.includes('friend') || url.includes('requestId') || url.includes('friendId'))) {
        try {
          const parsed = new URL(url.replace('bytalk://', 'https://bytalk.practice/'));
          const reqId = parsed.searchParams.get('requestId') || parsed.searchParams.get('id');
          const friendId = parsed.searchParams.get('friendId') || parsed.searchParams.get('userId');
          if (reqId || friendId) {
            await request('friends/accept', {
              method: 'POST',
              body: { requestId: reqId, friendUserId: friendId },
            });
            await loadFriends();
            Alert.alert('Friend Connected! 🎉', 'You have accepted the friend link! You can now chat or call anytime.');
          }
        } catch (e) {
          console.warn('[DeepLink friend accept error]', e.message);
        }
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    let onMsg = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.location?.href && (window.location.href.includes('payment-success') || window.location.href.includes('payment_id'))) {
        handleDeepLink({ url: window.location.href });
      }
      onMsg = (e) => {
        if (e.data?.type === 'BYTALK_PAYMENT_SUCCESS' || e.data?.type === 'PAYMENT_SUCCESS') {
          loadSubscription().catch(() => {});
          Alert.alert('🎉 PRO Activated!', 'Your payment was confirmed. All features are now unlocked!');
        }
      };
      window.addEventListener('message', onMsg);
    }

    return () => {
      sub.remove();
      if (onMsg && typeof window !== 'undefined') {
        window.removeEventListener('message', onMsg);
      }
    };
  }, []);

  // Unlock web audio playback on first user touch/click
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleUserGesture = () => {
        ringtoneManager.unlockAudio();
      };
      window.addEventListener('click', handleUserGesture, { passive: true });
      window.addEventListener('touchstart', handleUserGesture, { passive: true });
      return () => {
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('touchstart', handleUserGesture);
      };
    }
  }, []);

  useEffect(() => {
    if (!sessionChecking && (screen === 'discover' || screen === 'call-tab' || screen === 'home') && activeAuthToken) {
      loadDiscoverUsers();
    }
    if (!sessionChecking && (screen === 'call-tab' || screen === 'discover') && activeAuthToken) {
      loadFriends();
      refreshConversations();
    }
  }, [screen, sessionChecking, sessionVersion, userId, activeAuthToken]);

  useEffect(() => {
    if (!activeAuthToken || sessionChecking) return;
    if (screen !== 'discover' && screen !== 'call-tab') return;

    const interval = setInterval(() => {
      loadFriends();
      refreshConversations();
    }, 10000);

    return () => clearInterval(interval);
  }, [screen, activeAuthToken, sessionChecking]);

  useEffect(() => {
    if (friendNotification) {
      const timer = setTimeout(() => {
        setFriendNotification(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [friendNotification]);

  useEffect(() => {
    if (callHistory && callHistory.length > 0) {
      const seen = new Set();
      const recents = [];
      for (const item of callHistory) {
        const peer = item.peer || item.participant;
        if (peer && peer.id && peer.id !== userId && !seen.has(peer.id) && !String(peer.id).startsWith('partner_') && !peer.isAi) {
          seen.add(peer.id);
          recents.push(peer);
        }
      }
      setRecentCoLearnersList(recents);
    }
  }, [callHistory, userId]);

  useEffect(() => {
    if (!sessionChecking && (screen === 'practice' || screen === 'call-tab')) {
      loadDiscoverUsers(false, 'All Topics');
    }
  }, [screen, sessionChecking, sessionVersion, userId]);

  useEffect(() => {
    if (sessionChecking || screen !== 'dashboard' || !activeAuthToken) return undefined;
    let active = true;
    request('auth/me').then((result) => {
      if (!active || !result?.user) return;
      setPracticeInterests(Array.isArray(result.user.practiceInterests) ? result.user.practiceInterests : []);
    }).catch((error) => console.warn('[BYTALK profile] refresh failed', error.message));
    return () => {
      active = false;
    };
  }, [screen, sessionChecking, sessionVersion]);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    authStorage.getItem(`bytalk_practice_progress_${userId}`).then((value) => {
      if (active && value) setPracticeProgress(Math.min(100, Number(value) || 0));
    }).catch((error) => console.warn('[BYTALK practice] progress could not be loaded', error.message));
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (screen === 'chat') {
      if (selected.id) {
        setUnreadByUser((previous) => {
          if (!previous[selected.id]) return previous;
          const next = { ...previous };
          delete next[selected.id];
          return next;
        });
        refreshConversations();
      }
      let active = true;
      setMessageLoading(true);
      setChatError('');
      setTyping(false);
      request(`messages/${userId}/${selected.id}`)
        .then((history) => {
          if (active) {
            setMessages((previous) => {
              const merged = new Map(previous.map((message) => [message.id, message]));
              history.forEach((message) => merged.set(message.id, message));
              return [...merged.values()].sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
            });
            setHasOlderMessages(history.length === 100);
            setTyping(false);
            refreshConversations();
          }
        })
        .catch((error) => {
          if (active) setChatError(error.message || 'Could not load this conversation.');
        })
        .finally(() => {
          if (active) setMessageLoading(false);
        });
      return () => {
        active = false;
      };
    }
    return undefined;
  }, [selected, screen, userId]);

  useEffect(() => {
    if (screen === 'dashboard' && activeAuthToken) {
      setCallHistoryError('');
      request('calls').then((history) => setCallHistory(history.filter((item) => Date.now() - Date.parse(item.createdAt) <= 86400000))).catch((error) => {
        setCallHistoryError(error.message || 'Could not load call history.');
      });
      setConversations((previous) => previous.map((conversation) =>
        conversation.user.id === selected.id ? { ...conversation, unreadCount: 0 } : conversation
      ));
    }
  }, [screen, sessionVersion]);

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (callExitTimerRef.current) clearTimeout(callExitTimerRef.current);
    peerRef.current?.connection?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    stopAudioRoute();
  }, []);

  useEffect(() => {
    if (call?.status !== 'Connected') {
      setCallDuration(0);
      return undefined;
    }
    const callStart = call.connectedAt ? Date.parse(call.connectedAt) : Date.now();
    initialUsedFreeSecondsRef.current = usedFreeSeconds;
    const updateDuration = () => {
      const dur = Math.max(0, Math.floor((Date.now() - callStart) / 1000));
      setCallDuration(dur);
      if (!isPaidSubscriber()) {
        const totalUsed = (initialUsedFreeSecondsRef.current || 0) + dur;
        if (totalUsed >= FREE_TRIAL_TOTAL_SECONDS) {
          saveUsedFreeSeconds(FREE_TRIAL_TOTAL_SECONDS);
          endCall();
          Alert.alert(
            '10 Minutes Daily Free Trial Ended',
            'Your daily 10 minutes free trial has ended. Please purchase a subscription to continue speaking practice.',
            [
              { text: 'Buy Subscription', onPress: () => openSubscription() },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        } else {
          saveUsedFreeSeconds(totalUsed);
        }
      }
    };
    updateDuration();
    const timer = setInterval(updateDuration, 1000);
    return () => clearInterval(timer);
  }, [call?.status, call?.connectedAt]);

  // LOGIN HANDLER
  const handleLogin = async () => {
    setLoginError('');
    const emailTrimmed = loginEmail.trim();
    if (!emailTrimmed) {
      setLoginError('Email address is required.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailTrimmed)) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Password is required.');
      return;
    }

    setAuthBusy(true);
    try {
      const res = await request('login', {
        method: 'POST',
        body: JSON.stringify({ email: emailTrimmed.toLowerCase(), password: loginPassword }),
      });

      if (res && res.token && res.user) {
        await saveSession(res, res.user.name || '');
        setSessionVersion((value) => value + 1);
        if (res.user.id) setUserId(res.user.id);
        if (res.user.name) setName(res.user.name);
        if (res.user.email) setEmail(res.user.email);
        if (res.user.profilePhotoUrl) setAvatarUrl(res.user.profilePhotoUrl);
        if (res.user.country) setCountry(res.user.country);
        if (res.user.nativeLanguage) setNativeLanguage(res.user.nativeLanguage);
        if (res.user.learningLanguage) setLearningLanguage(res.user.learningLanguage);
        if (res.user.level) setLevel(res.user.level);
        setPracticeInterests(Array.isArray(res.user.practiceInterests) ? res.user.practiceInterests : []);
        if (res.subscription) {
          setSubscription(res.subscription);
        }
        setLoginPassword('');
        setBackendUp(true);
        setScreen('home');
        setActiveBottomTab('home');
      } else {
        setLoginError('Authentication failed: Server did not return a valid session token.');
      }
    } catch (err) {
      if (err.isNetworkError) {
        setLoginError(err.message);
      } else if (err.status === 404) {
        setLoginError('Server error: Login endpoint (/api/login) is not implemented on the backend.');
      } else if (err.status === 401) {
        setLoginError('Incorrect email or password.');
      } else if (err.status >= 500) {
        setLoginError('The authentication service is unavailable. Please try again.');
      } else {
        setLoginError(err.message || 'Unable to sign in. Please verify credentials.');
      }
    } finally {
      setAuthBusy(false);
    }
  };

  // REGISTRATION HANDLER (Auto sign-in per Requirement 10)
  const handleRegister = async () => {
    setRegError('');
    const nameTrimmed = regName.trim();
    const emailTrimmed = regEmail.trim();
    if (!nameTrimmed) {
      setRegError('Full name is required.');
      return;
    }
    if (!emailTrimmed) {
      setRegError('Email address is required.');
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailTrimmed)) {
      setRegError('Please enter a valid email address.');
      return;
    }
    if (!regPassword) {
      setRegError('Password is required.');
      return;
    }
    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters long.');
      return;
    }
    if (!regConfirmPassword) {
      setRegError('Please confirm your password.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setAuthBusy(true);
    try {
      const res = await request('register', {
        method: 'POST',
        body: JSON.stringify({
          name: nameTrimmed,
          email: emailTrimmed.toLowerCase(),
          password: regPassword,
        }),
      });

      if (res && res.token && res.user) {
        // Automatically save session and sign in for 15 days
        await saveSession(res, nameTrimmed);
        setSessionVersion((value) => value + 1);
        if (res.user.id) setUserId(res.user.id);
        setName(nameTrimmed);
        setEmail(emailTrimmed);
        if (res.subscription) {
          setSubscription(res.subscription);
        }
        setRegPassword('');
        setRegConfirmPassword('');
        setBackendUp(true);
        // Navigate forward to Onboarding / Profile setup
        setScreen('onboard');
      } else {
        setRegError('Registration failed: Server did not confirm registration.');
      }
    } catch (err) {
      if (err.isNetworkError) {
        setRegError(err.message);
      } else if (err.status === 404) {
        setRegError('Server error: Registration endpoint (/api/register) is not implemented on the backend.');
      } else {
        setRegError(err.message || 'Unable to register. Please try again.');
      }
    } finally {
      setAuthBusy(false);
    }
  };

  // LOGOUT HANDLER (Requirement 9)
  // Core logout logic — clears session, disconnects socket, resets state, navigates to welcome.
  async function performLogout() {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      socketRef.current?.disconnect();
      socketRef.current = null;
      await clearSession();
      setSessionVersion((value) => value + 1);
      setUserId(null);
      setName('');
      setEmail('');
      setAvatarUrl(null);
      setCountry('');
      setNativeLanguage('');
      setLearningLanguage('English');
      setLevel('Beginner');
      setPracticeInterests([]);
      setPartners([]);
      setMessages([]);
      setUnreadByUser({});
      setConversations([]);
      setMessageBanner(null);
      setLoginEmail('');
      setLoginPassword('');
      setLoginError('');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegError('');
      setScreen('welcome');
    } catch (error) {
      console.warn('[BYTALK logout] clearSession failed, forcing local logout', error?.message);
      setUserId(null);
      setName('');
      setScreen('welcome');
    } finally {
      setLogoutBusy(false);
    }
  };

  // handleLogout — shows a confirmation dialog then calls performLogout.
  // Always use this for user-initiated logout buttons.
  const handleLogout = () => {
    if (logoutBusy) return;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('Are you sure you want to log out of BYTALK?')) {
          performLogout();
        }
      } else {
        performLogout();
      }
    } else {
      Alert.alert(
        'Log out?',
        'Are you sure you want to log out of BYTALK?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log out', style: 'destructive', onPress: performLogout },
        ],
        { cancelable: true }
      );
    }
  };

  async function saveProfile(next) {
    if (!name.trim() || !nativeLanguage || !learningLanguage || !country) {
      Alert.alert('Complete your profile', 'Choose your native language, learning language, and country before continuing.');
      return;
    }
    setBusy(true);
    try {
      await request('onboard', {
        method: 'POST',
        body: JSON.stringify({ name, country, nativeLanguage, learningLanguage, level, practiceInterests }),
      });
      setBackendUp(true);
    } catch (error) {
      Alert.alert('Profile not saved', error.message || 'Backend not reachable. Please try again.');
      setBusy(false);
      return;
    }

    setBusy(false);
    setScreen(next);
  }

  async function savePracticeInterests() {
    setPracticeInterestsSaving(true);
    try {
      const updated = await request('profile/practice-interests', {
        method: 'PATCH',
        body: JSON.stringify({ practiceInterests }),
      });
      setPracticeInterests(Array.isArray(updated.practiceInterests) ? updated.practiceInterests : []);
      Alert.alert('Interests saved', 'Your practice partner results will use these interests.');
      if (screen === 'practice') loadDiscoverUsers(true, practiceTopic.id);
    } catch (error) {
      Alert.alert('Interests not saved', error.message || 'Could not update your practice interests.');
    } finally {
      setPracticeInterestsSaving(false);
    }
  }

  async function pickPdfAttachment() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
        base64: false,
      });
      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file) throw new Error('The selected PDF could not be read.');
      const isPdf = file.mimeType?.toLowerCase() === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) throw new Error('Please select a PDF file.');
      if (file.size && file.size > MAX_PDF_SIZE_BYTES) {
        throw new Error('PDF files must be 8 MB or smaller.');
      }

      const base64 = Platform.OS === 'web'
        ? await new Promise((resolve, reject) => {
            if (!file.file) {
              reject(new Error('The selected PDF could not be read in this browser.'));
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result !== 'string') {
                reject(new Error('The selected PDF could not be read.'));
                return;
              }
              const separator = reader.result.indexOf(',');
              if (separator < 0) {
                reject(new Error('The selected PDF could not be read.'));
                return;
              }
              resolve(reader.result.slice(separator + 1));
            };
            reader.onerror = () => reject(new Error('The selected PDF could not be read.'));
            reader.readAsDataURL(file.file);
          })
        : await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });

      const base64Padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
      const sizeBytes = Math.floor((base64.length * 3) / 4) - base64Padding;
      if (sizeBytes > MAX_PDF_SIZE_BYTES) {
        throw new Error('PDF files must be 8 MB or smaller.');
      }

      setPendingAttachment({
        type: 'file',
        name: file.name,
        size: sizeBytes >= 1024 * 1024
          ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(sizeBytes / 1024))} KB`,
        data: base64,
      });
      setChatError('');
      setShowAttachmentModal(false);
    } catch (error) {
      setShowAttachmentModal(false);
      setChatError(error.message || 'Could not select the PDF.');
    }
  }

  async function openAttachment(message) {
    if (!message?.attachmentUrl) return;
    const fileName = message.attachmentName || 'attachment.pdf';
    const attachmentUrl = message.attachmentUrl;

    try {
      if (Platform.OS === 'web') {
        let downloadUrl = attachmentUrl;
        if (!attachmentUrl.startsWith('data:')) {
          const response = await fetch(
            attachmentUrl.startsWith('http') ? attachmentUrl : `${API}${attachmentUrl}`,
            { headers: { Authorization: `Bearer ${activeAuthToken}` } }
          );
          if (!response.ok) throw new Error(`Could not download PDF (${response.status}).`);
          downloadUrl = URL.createObjectURL(await response.blob());
        }

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        if (downloadUrl.startsWith('blob:')) {
          window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        }
        return;
      }

      const directory = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      if (!directory) throw new Error('No temporary file storage is available on this device.');
      const localUri = `${directory}${message.id}.pdf`;
      const existingFile = await FileSystem.getInfoAsync(localUri);
      if (existingFile.exists) await FileSystem.deleteAsync(localUri);
      if (attachmentUrl.startsWith('data:application/pdf;base64,')) {
        await FileSystem.writeAsStringAsync(
          localUri,
          attachmentUrl.slice('data:application/pdf;base64,'.length),
          { encoding: 'base64' }
        );
      } else {
        const response = await FileSystem.downloadAsync(
          attachmentUrl.startsWith('http') ? attachmentUrl : `${API}${attachmentUrl}`,
          localUri,
          { headers: { Authorization: `Bearer ${activeAuthToken}` } }
        );
        if (response.status < 200 || response.status >= 300) {
          throw new Error(`Could not download PDF (${response.status}).`);
        }
      }
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('PDF sharing is not available on this device.');
      }
      await Sharing.shareAsync(localUri, { mimeType: 'application/pdf', dialogTitle: fileName });
    } catch (error) {
      setChatError(error.message || 'Could not download the PDF.');
    }
  }

  async function send(attachmentOverride = null) {
    const attach = attachmentOverride || pendingAttachment;
    if (!draft.trim() && !attach) return;
    if (!hasMessageEntitlement(selected)) {
      Alert.alert(
        'Subscription Required',
        'Direct messaging is a BYTALK Premium feature. Upgrade your plan to send messages, photos, and files, or add them as a friend to chat for free!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: openSubscription },
        ]
      );
      return;
    }
    const text = draft.trim();
    const payload = {
      to: selected.id,
      text,
      attachmentType: attach?.type || null,
      attachmentUrl: attach?.url || null,
      attachmentName: attach?.name || null,
      attachmentSize: attach?.size || null,
      attachmentData: attach?.data || null,
    };
    setDraft('');
    setPendingAttachment(null);
    setShowEmojiPicker(false);

    // If chatting with sample partner from referral design, append locally
    if (selected.id && String(selected.id).startsWith('sample-')) {
      const sampleMsg = {
        id: 'msg-' + Date.now(),
        from: userId,
        to: selected.id,
        text,
        attachmentType: attach?.type || null,
        attachmentUrl: attach?.data
          ? `data:application/pdf;base64,${attach.data}`
          : attach?.url || null,
        attachmentName: attach?.name || null,
        attachmentSize: attach?.size || null,
        at: new Date().toISOString(),
        readAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, sampleMsg]);
      setConversations((previous) => {
        const entry = { user: selected, latestMessage: sampleMsg, unreadCount: 0 };
        return [entry, ...previous.filter((item) => item.user.id !== selected.id)];
      });
      return;
    }

    try {
      const result = await request('messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessages((prev) => (prev.some((x) => x.id === result.id) ? prev : [...prev, result]));
      setConversations((previous) => {
        const partner = partnersRef.current.find((item) => item.id === result.to) || selected;
        const entry = { user: partner, latestMessage: result, unreadCount: 0 };
        return [entry, ...previous.filter((item) => item.user.id !== result.to)];
      });
      setChatError('');
      socketRef.current?.emit('typing:stop', { to: selected.id });
    } catch (error) {
      setChatError(error.message || 'Message could not be sent. Check your connection and try again.');
      setDraft(text);
      if (attach) setPendingAttachment(attach);
    }
  }

  async function loadEarlierMessages() {
    const conversation = messages
      .filter((message) => (message.from === selected.id && message.to === userId) || (message.from === userId && message.to === selected.id))
      .sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
    const oldest = conversation[0];
    if (!oldest || loadingOlderMessages) return;
    setLoadingOlderMessages(true);
    try {
      const history = await request(`messages/${userId}/${selected.id}?limit=100&before=${encodeURIComponent(oldest.at)}`);
      setMessages((previous) => {
        const merged = new Map(previous.map((message) => [message.id, message]));
        history.forEach((message) => merged.set(message.id, message));
        return [...merged.values()].sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
      });
      setHasOlderMessages(history.length === 100);
    } catch (error) {
      setChatError(error.message || 'Could not load earlier messages.');
    } finally {
      setLoadingOlderMessages(false);
    }
  }

  function toggleEmojiPicker() {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      chatTextInputRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
    setShowEmojiPicker(true);
  }

  function insertChatEmoji(emoji) {
    updateDraft(`${draft}${emoji}`);
  }

  function deleteChatEmoji() {
    updateDraft(Array.from(draft).slice(0, -1).join(''));
  }

  function updateDraft(text) {
    setDraft(text);
    const socket = socketRef.current;
    if (!socket?.connected) return;
    if (!text.trim()) {
      socket.emit('typing:stop', { to: selected.id });
      return;
    }
    socket.emit('typing:start', { to: selected.id });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing:stop', { to: selected.id });
    }, 1400);
  }

  async function addWord() {
    if (!word.trim()) return;
    try {
      const x = await request('vocabulary', {
        method: 'POST',
        body: JSON.stringify({ userId, word, category: 'Conversation' }),
      });
      setVocab((v) => [...v, x]);
      setWord('');
    } catch {
      Alert.alert('Connection required', 'Start backend first.');
    }
  }

  async function beginPracticeTopic(topic = practiceTopic, connectionMode = 'chat') {
    setPracticeTopic(topic);
    setPracticeAnswer('');
    setPracticeConnectionMode(connectionMode);
    setPracticeMode('searching');
    setPracticePartner(null);
    setPracticeSearchError('');
    setPracticeStep('conversation');
    setScreen('practiceSession');
    try {
      const result = await request(`practice/partners?topic=${encodeURIComponent('All Topics')}&practiceOnly=true`);
      const partner = result?.users?.[0] || null;
      setPracticePartner(partner);
      setPracticeMode(partner ? 'real' : 'none');
    } catch (error) {
      setPracticeMode('none');
      setPracticeSearchError(error.message || 'Could not search for practice partners.');
    }
  }

  function startPractice(topic = practiceTopic) {
    beginPracticeTopic(topic);
  }

  function handleHomeTopicSelection(topic, mode = 'ai') {
    if (mode === 'ai') {
      startAiPractice(topic);
      return;
    }
    beginPracticeTopic(topic, mode);
  }

  async function startAiPractice(customTopic = null) {
    const targetTopic = customTopic || practiceTopic;
    if (!aiPracticeIsPro && !aiCreditsLoaded) {
      Alert.alert('Checking AI credits', 'Please try again in a moment while we load your free practice credits.');
      return false;
    }
    if (!aiPracticeIsPro && aiFreeMessageCountRef.current >= AI_FREE_MESSAGE_LIMIT) {
      setShowAiCreditsModal(true);
      return false;
    }
    if (customTopic) setPracticeTopic(customTopic);
    stopSpeech();
    setSpeakingMessageIndex(null);
    setAiLoading(true);
    setAiError('');
    setAiMessages([]);
    setAiCompletion(null);
    setAiRating(0);
    setAiFeedback('');
    setAiFeedbackSubmitted(false);
    setAiDraft('');
    setScreen('aiPractice'); // Open AI screen immediately

    try {
      const topicName = targetTopic.id || targetTopic.title || 'All Topics';
      const result = await request('practice/ai/start', {
        method: 'POST',
        body: JSON.stringify({
          topic: topicName,
          language: learningLanguage || 'English',
          level: level || 'Beginner',
        }),
      });

      setAiSession(result);
      const initialMessage = result.message || {
        role: 'assistant',
        content: result.response || 'Hello! I am BYTALK AI. How can I help you practice today?',
        timestamp: new Date().toISOString(),
      };
      setAiMessages([initialMessage]);
      setAiStartedAt(Date.now());
      setPracticeMode('ai');

      // Speak greeting in user's learning language
      speakText(initialMessage.content, learningLanguage || 'English');
      return true;
    } catch (error) {
      setAiError(error.message || 'AI practice could not be started.');
      return false;
    } finally {
      setAiLoading(false);
    }
  }

  function toggleMessageSpeech(content, index) {
    if (speakingMessageIndex === index) {
      stopSpeech();
      setSpeakingMessageIndex(null);
    } else {
      stopSpeech();
      setSpeakingMessageIndex(index);
      speakText(
        content,
        learningLanguage || 'English',
        () => setSpeakingMessageIndex(index),
        () => setSpeakingMessageIndex(null)
      );
    }
  }

  async function sendAiMessage() {
    const text = aiDraft.trim();
    if (!text || aiLoading) return;
    if (!aiPracticeIsPro && aiFreeMessageCountRef.current >= AI_FREE_MESSAGE_LIMIT) {
      setShowAiCreditsModal(true);
      return;
    }

    stopSpeech();
    setSpeakingMessageIndex(null);
    setAiDraft('');
    const userMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setAiMessages((previous) => [...previous, userMessage]);
    if (!aiPracticeIsPro) {
      const nextCount = Math.min(AI_FREE_MESSAGE_LIMIT, aiFreeMessageCountRef.current + 1);
      aiFreeMessageCountRef.current = nextCount;
      setAiFreeMessageCount(nextCount);
      if (userId) {
        AsyncStorage.setItem(`${AI_FREE_CREDITS_KEY_PREFIX}${userId}`, String(nextCount))
          .catch((error) => {
            console.warn('[BYTALK AI credits] Could not save credit usage:', error?.message || error);
            Alert.alert('AI credits could not be saved', 'Your message was sent, but your credit usage could not be saved on this device.');
          });
      }
      if (nextCount >= AI_FREE_MESSAGE_LIMIT) setShowAiCreditsModal(true);
    }
    setAiLoading(true);
    setAiError('');

    try {
      let result;
      if (aiSession?.sessionId) {
        result = await request(`practice/ai/${encodeURIComponent(aiSession.sessionId)}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            text,
            topic: practiceTopic.id || practiceTopic.title,
            language: learningLanguage,
            proficiencyLevel: level,
          }),
        });
      } else {
        result = await request('ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: text,
            topic: practiceTopic.id || practiceTopic.title,
            language: learningLanguage,
            proficiencyLevel: level,
            conversationId: aiSession?.conversationId,
          }),
        });
      }

      const aiReply = result.message || {
        role: 'assistant',
        content: result.response || '',
        timestamp: new Date().toISOString(),
      };
      setAiMessages((previous) => [...previous, aiReply]);

      // Speak response in target language
      speakText(aiReply.content, learningLanguage || 'English');
    } catch (error) {
      setAiError(error.message || 'The AI could not respond. Please try again.');
      setAiDraft(text);
    } finally {
      setAiLoading(false);
    }
  }

  async function startSpeechRecognition() {
    if (listeningForSpeech) {
      try {
        speechRecognitionRef.current?.stop();
      } catch {}
      setListeningForSpeech(false);
      return;
    }

    if (typeof window === 'undefined') {
      Alert.alert('Voice input unavailable', 'Speech recognition is not available on this device.');
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      Alert.alert('Voice input unavailable', 'Your browser does not support speech recognition. You can continue typing below.');
      return;
    }

    // Pre-prompt microphone permission on web if supported
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        testStream.getTracks().forEach((t) => t.stop());
      } catch (permErr) {
        setAiError('Microphone permission required for voice input. Please allow microphone access in your browser or device settings.');
        return;
      }
    }

    try {
      const recognition = new Recognition();
      speechRecognitionRef.current = recognition;
      const locale = (LANGUAGE_LOCALES && LANGUAGE_LOCALES[learningLanguage]) || 'en-US';
      recognition.lang = locale;
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setListeningForSpeech(true);
        setAiError('');
      };
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) setAiDraft(transcript);
      };
      recognition.onerror = (e) => {
        setListeningForSpeech(false);
        if (e.error !== 'no-speech') {
          setAiError(`Microphone notice: ${e.error}. You can continue typing below.`);
        }
      };
      recognition.onend = () => {
        setListeningForSpeech(false);
      };
      recognition.start();
    } catch (err) {
      setListeningForSpeech(false);
      setAiError('Could not access microphone.');
    }
  }

  async function endAiPractice() {
    stopSpeech();
    setSpeakingMessageIndex(null);

    const sessionId = aiSession?.sessionId || aiSession?.conversationId;
    if (!sessionId) {
      setAiCompletion({
        durationSeconds: Math.max(0, Math.floor((Date.now() - (aiStartedAt || Date.now())) / 1000)),
        messageCount: aiMessages.length,
        topic: practiceTopic.title,
        language: learningLanguage,
        level: level,
      });
      return;
    }

    try {
      const result = await request(`practice/ai/${encodeURIComponent(sessionId)}/end`, {
        method: 'POST',
      });
      setAiCompletion({
        ...result,
        topic: practiceTopic.title,
        language: learningLanguage,
        level: level,
      });
    } catch (error) {
      setAiCompletion({
        durationSeconds: Math.max(0, Math.floor((Date.now() - (aiStartedAt || Date.now())) / 1000)),
        messageCount: aiMessages.length,
        topic: practiceTopic.title,
        language: learningLanguage,
        level: level,
      });
    }
  }

  async function submitAiFeedback() {
    if (!aiRating) {
      Alert.alert('Rating required', 'Please select a star rating first.');
      return;
    }
    const sessionId = aiSession?.sessionId || aiCompletion?.sessionId;
    setAiFeedbackSubmitting(true);
    try {
      if (sessionId) {
        await request(`practice/ai/${encodeURIComponent(sessionId)}/feedback`, {
          method: 'POST',
          body: JSON.stringify({ rating: aiRating, feedback: aiFeedback }),
        });
      }
      setAiFeedbackSubmitted(true);
    } catch {
      setAiFeedbackSubmitted(true);
    } finally {
      setAiFeedbackSubmitting(false);
    }
  }

  async function completePractice() {
    const nextProgress = Math.min(100, practiceProgress + 20);
    setPracticeProgress(nextProgress);
    setPracticeStep('complete');
    try {
      await authStorage.setItem(`bytalk_practice_progress_${userId}`, String(nextProgress));
    } catch (error) {
      console.warn('[BYTALK practice] progress could not be saved', error.message);
    }
  }

  function openPractice() {
    setActiveBottomTab('call');
    setScreen('call-tab');
  }

  async function loadSettings() {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      setSettings(await request('settings'));
    } catch (error) {
      setSettingsError(error.message || 'Could not load settings.');
    } finally {
      setSettingsLoading(false);
    }
  }

  async function updateSettings(patch) {
    setSettingsSaving(true);
    setSettingsError('');
    try {
      const result = await request('settings', { method: 'PATCH', body: JSON.stringify(patch) });
      setSettings((previous) => ({ ...previous, ...result.settings, ...(patch.notificationPreferences ? { notificationPreferences: { ...previous?.notificationPreferences, ...patch.notificationPreferences } } : {}), ...(patch.audioPreferences ? { audioPreferences: { ...previous?.audioPreferences, ...patch.audioPreferences } } : {}) }));
      if (patch.learningLanguage) setLearningLanguage(patch.learningLanguage);
      if (patch.level) setLevel(patch.level);
    } catch (error) {
      setSettingsError(error.message || 'Could not save this setting.');
    } finally {
      setSettingsSaving(false);
    }
  }

  async function exportAccountData() {
    try {
      const data = await request('account/export');
      const json = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const link = document.createElement('a');
        const BlobClass = (typeof window !== 'undefined' && window.Blob) ? window.Blob : (typeof globalThis !== 'undefined' ? globalThis.Blob : null);
        const UrlClass = (typeof window !== 'undefined' && window.URL) ? window.URL : (typeof globalThis !== 'undefined' ? globalThis.URL : null);
        if (BlobClass && UrlClass) {
          link.href = UrlClass.createObjectURL(new BlobClass([json], { type: 'application/json' }));
          link.download = 'bytalk-personal-data.json';
          link.click();
          UrlClass.revokeObjectURL(link.href);
        }
      } else {
        Alert.alert('Data ready', 'Your personal data was prepared. Downloading is available in the web app.');
      }
    } catch (error) {
      setManageAccountError(error.message || 'Could not export your data.');
    }
  }

  async function logoutAllDevices() {
    try {
      await request('account/logout-all', { method: 'POST' });
      await performLogout();
    } catch (error) {
      setManageAccountError(error.message || 'Could not log out from all devices.');
    }
  }

  async function deleteAccount() {
    try {
      await request('account', { method: 'DELETE', body: JSON.stringify({ confirmation: 'DELETE', password: accountPassword }) });
      await handleLogout();
    } catch (error) {
      setManageAccountError(error.message || 'Could not delete the account.');
    }
  }

  async function unblockUser(blockedUser) {
    try {
      await request(`users/${encodeURIComponent(blockedUser.id)}/block`, { method: 'DELETE' });
      setSettings((previous) => ({ ...previous, blockedUsers: (previous?.blockedUsers || []).filter((item) => item.id !== blockedUser.id) }));
    } catch (error) {
      setSettingsError(error.message || 'Could not unblock this user.');
    }
  }

  const tabItems = [
    ['discover', 'compass', 'Discover'],
    ['practice', 'book-outline', 'Practice'],
    ['chat', 'chatbubbles', 'Messages'],
    ['dashboard', 'bar-chart', 'Profile'],
  ];
  const isSearching = Boolean(search && search.trim().length > 0);
  const filteredPartners = isSearching
    ? partners.filter((partner) =>
        [partner.displayName, partner.name, partner.country, partner.nativeLanguage, partner.learningLanguage, partner.level]
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      )
    : [];
  const practicePartners = partners;

  const Header = ({ title, subtitle, onBack }) => (
    <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 14 }}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color={navy} />
          <Txt size={14} color={muted} style={{ marginLeft: 6 }}>Back</Txt>
        </TouchableOpacity>
      )}
      <Txt size={26} bold>{title}</Txt>
      {subtitle && <Txt color={muted} style={{ marginTop: 5 }}>{subtitle}</Txt>}
    </View>
  );

  const Field = ({ label, value, setValue, placeholder }) => (
    <View style={{ marginBottom: 15 }}>
      <Txt size={13} bold style={{ marginBottom: 8 }}>{label}</Txt>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={{
          backgroundColor: '#fff',
          borderColor: border,
          borderWidth: 1,
          borderRadius: 14,
          padding: 15,
          color: navy,
          fontSize: 15,
        }}
      />
    </View>
  );

  // Universal Back Navigation & Hardware Back Button Handler (Prevents White Blank Screen)
  useEffect(() => {
    const onHardwareBackPress = () => {
      // 1. Modals
      if (showLeaderboard) {
        setShowLeaderboard(false);
        return true;
      }
      if (showHistoryModal) {
        setShowHistoryModal(false);
        return true;
      }

      // 2. Active call
      if (screen === 'call' && call) {
        Alert.alert('Leave Call?', 'Do you want to end your active conversation?', [
          { text: 'Stay', style: 'cancel' },
          { text: 'End Call', style: 'destructive', onPress: endCall },
        ]);
        return true;
      }

      // 3. Call complete screen
      if (screen === 'call-complete') {
        leaveCallCompletion();
        return true;
      }

      // 4. AI Practice screen
      if (screen === 'aiPractice') {
        stopSpeech();
        setAiSession(null);
        setAiCompletion(null);
        setActiveBottomTab('home');
        setScreen('home');
        return true;
      }

      // 5. Chat screen -> Messages or Discover
      if (screen === 'chat') {
        const fallback = activeBottomTab === 'messages' ? 'messages' : 'discover';
        setActiveBottomTab(fallback);
        setScreen(fallback);
        refreshConversations();
        loadFriends();
        return true;
      }

      // 6. Messages screen -> Home
      if (screen === 'messages') {
        setActiveBottomTab('home');
        setScreen('home');
        return true;
      }

      // 7. Settings sub-screens -> Settings
      if (['manage-account', 'legal-terms', 'legal-privacy'].includes(screen)) {
        setScreen('settings');
        return true;
      }

      // 8. Settings -> Profile
      if (screen === 'settings') {
        setScreen('profile');
        return true;
      }

      // 9. Profile screen -> Home or active tab
      if (screen === 'profile') {
        const fallback = (activeBottomTab && activeBottomTab !== 'pro') ? activeBottomTab : 'home';
        setActiveBottomTab(fallback);
        setScreen(fallback);
        return true;
      }

      // 10. Pro subscription screen -> Home or active tab
      if (screen === 'premium') {
        const fallback = (activeBottomTab && activeBottomTab !== 'pro') ? activeBottomTab : 'home';
        setActiveBottomTab(fallback);
        setScreen(fallback);
        return true;
      }

      // 11. Practice screens -> Home
      if (screen === 'practice' || screen === 'practiceSession') {
        setActiveBottomTab('home');
        setScreen('home');
        return true;
      }

      // 12. Non-home bottom tabs -> go to Home
      if (['learn', 'call-tab', 'discover'].includes(screen)) {
        setActiveBottomTab('home');
        setScreen('home');
        return true;
      }

      // 13. If on Home, allow standard Android behavior
      if (screen === 'home') {
        return false;
      }

      // Fallback: Return to home
      setActiveBottomTab('home');
      setScreen('home');
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);
    return () => sub.remove();
  }, [screen, call, showLeaderboard, showHistoryModal, activeBottomTab]);

  // Safety guardian: If on invalid/null screen state or legacy dashboard, auto-restore
  useEffect(() => {
    if (screen === 'dashboard') {
      setActiveBottomTab('home');
      setScreen('home');
    }
    if (screen === 'practice') {
      setActiveBottomTab('call');
      setScreen('call-tab');
    }
    if (screen === 'call' && !call) {
      setActiveBottomTab('call');
      setScreen('call-tab');
    }
    if (screen === 'call-complete' && !callCompletion) {
      setActiveBottomTab('call');
      setScreen('call-tab');
    }
  }, [screen, call, callCompletion]);

  if (sessionChecking) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 38, fontWeight: '900', color: COLORS.primary, marginBottom: 14 }}>BT</Text>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Txt color={COLORS.textSecondary} size={13} style={{ marginTop: 12 }}>Restoring session...</Txt>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.webShell}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Top unified ARYA Header on main screens (Images 1 & 4) */}
          {!['welcome', 'login', 'register', 'onboard', 'level', 'call', 'call-complete', 'profile', 'premium', 'aiPractice', 'messages', 'chat'].includes(screen) && (
            <AryaTopBar
              user={{ displayName: name || 'Prateek Pawar', streak: streak || 0, profilePhotoUrl: avatarUrl }}
              userStats={{ streak: streak || 0 }}
              currentScreen={screen}
              onPressBack={() => {
                setActiveBottomTab('home');
                setScreen('home');
              }}
              onPressProfile={() => setScreen('profile')}
              onPressGetPro={() => {
                setActiveBottomTab('pro');
                setScreen('premium');
              }}
              onPressLeaderboard={() => setShowLeaderboard(true)}
              onPressNotifications={() => setShowNotificationsModal(true)}
              isPro={aiPracticeIsPro}
              notificationCount={pendingFriendRequests.length}
            />
          )}

          {/* SCREEN: ARYA HOME (IMAGE 1) */}
          {screen === 'home' && (
            <AryaHomeScreen
              user={{ displayName: name, streak }}
              onSelectTopic={(topic, mode) => handleHomeTopicSelection(topic, mode)}
              onPressGetPro={() => {
                setActiveBottomTab('pro');
                setScreen('premium');
              }}
              onPressHistory={() => setShowHistoryModal(true)}
              isPro={aiPracticeIsPro}
              freeCreditsRemaining={aiFreeCreditsRemaining}
            />
          )}

          {/* SCREEN: LEARN PATHWAY (IMAGE 4) */}
          {screen === 'learn' && (
            <LearnScreen
              user={{ displayName: name, streak }}
              onPressHistory={() => setShowHistoryModal(true)}
              onAddStars={(amount) => setUserStars((prev) => prev + amount)}
              request={request}
            />
          )}

          {/* SCREEN: CALL TAB (IMAGE 5) */}
          {screen === 'call-tab' && (
            <CallTabScreen
              onStartRandomMatch={handleStartRandomMatch}
              isMatching={isMatchingCall}
              isSubscribed={isPaidSubscriber()}
              freeTrialSecondsRemaining={getFreeTrialSecondsRemaining()}
              dailyFreeSecondsLimit={FREE_TRIAL_TOTAL_SECONDS}
              onPressUpgrade={openSubscription}
              onBack={() => {
                setActiveBottomTab('home');
                setScreen('home');
              }}
              currentUser={{ id: userId, _id: userId, name, avatarUrl, level, streak }}
              onPressLeaderboard={() => setShowLeaderboard(true)}
              onPressStreak={() => setShowHistoryModal(true)}
              friends={friendsList}
              pendingRequests={pendingFriendRequests}
              sentRequests={sentFriendRequests}
              allPartners={partners}
              recentCoLearners={recentCoLearnersList}
              onDirectCall={handleStartDirectCall}
              onDirectVideoCall={handleStartDirectVideoCall}
              onDirectChat={(friend) => openConversation(friend)}
              onSendFriendRequest={handleSendFriendRequest}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              onDeclineFriendRequest={handleDeclineFriendRequest}
              onCancelFriendRequest={handleCancelFriendRequest}
              onCancelMatch={() => setIsMatchingCall(false)}
              onRefreshFriends={loadFriends}
            />
          )}

          {/* SCREEN: PROFILE (IMAGE 3) */}
          {screen === 'profile' && (
            <ProfileScreen
              user={{
                displayName: name,
                name,
                email: email || 'pratikumeshpawar@gmail.com',
                profilePhotoUrl: avatarUrl,
              }}
              onBack={() => {
                setActiveBottomTab('home');
                setScreen('home');
              }}
              onPressGetPro={() => {
                setActiveBottomTab('pro');
                setScreen('premium');
              }}
              onUpdateProfile={async (updates = {}) => {
                const newName = updates.name || updates.displayName;
                const newAvatar = updates.profilePhotoUrl !== undefined ? updates.profilePhotoUrl : updates.avatarUrl;
                if (newName) setName(newName);
                if (newAvatar !== undefined) setAvatarUrl(newAvatar);
                if (updates.country) setCountry(updates.country);
                if (updates.nativeLanguage) setNativeLanguage(updates.nativeLanguage);
                if (updates.learningLanguage) setLearningLanguage(updates.learningLanguage);
                if (updates.level) setLevel(updates.level);

                try {
                  const payload = {};
                  if (newName) {
                    payload.name = newName;
                    payload.displayName = newName;
                  }
                  if (newAvatar !== undefined) payload.profilePhotoUrl = newAvatar;
                  if (updates.country) payload.country = updates.country;
                  if (updates.nativeLanguage) payload.nativeLanguage = updates.nativeLanguage;
                  if (updates.learningLanguage) payload.learningLanguage = updates.learningLanguage;
                  if (updates.level) payload.level = updates.level;

                  const res = await request('profile', {
                    method: 'PATCH',
                    body: payload,
                  });
                  if (res?.user) {
                    const u = res.user;
                    const resolved = u.displayName || u.name;
                    if (resolved) setName(resolved);
                    if (u.profilePhotoUrl !== undefined) setAvatarUrl(u.profilePhotoUrl);
                    if (u.country) setCountry(u.country);
                    if (u.nativeLanguage) setNativeLanguage(u.nativeLanguage);
                    if (u.learningLanguage) setLearningLanguage(u.learningLanguage);
                    if (u.level) setLevel(u.level);
                    await authStorage.setItem(SESSION_USER_KEY, JSON.stringify(u));
                  }
                } catch (e) {
                  console.warn('[Profile update error]', e.message);
                }
              }}
              onLogout={handleLogout}
              aryaSettings={aryaSettings}
              onUpdateAryaSettings={(newSettings) => setAryaSettings(newSettings)}
              isPro={subscription?.plan?.id === 'pro' || subscription?.plan?.id === 'plus' || subscription?.active === true}
              subscription={subscription}
            />
          )}

          {/* SCREEN 1: WELCOME SCREEN */}
          {screen === 'welcome' && (
            <ScrollView
              contentContainerStyle={[
                styles.welcomeScrollContainer,
                isShortViewport && { justifyContent: 'flex-start' },
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Brand Header */}
              <View style={styles.welcomeHeader}>
                <View style={styles.brandRow}>
                  <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="chatbubble-ellipses" size={34} color={COLORS.primary} />
                  </View>
                  <Text style={styles.brandTitle}>
                    BY<Text style={{ color: COLORS.primary }}>TALK</Text>
                  </Text>
                </View>
                <Text style={styles.brandSubtitle}>Talk  •  Learn  •  Connect</Text>
              </View>

              {/* Hero Headlines */}
              <View style={styles.heroTextSection}>
                <Text style={styles.heroMainTitle}>Find Your{'\n'}Language Partner</Text>
                <Text style={styles.heroSubText}>
                  Make global friends, practice languages{'\n'}and explore new cultures.
                </Text>
              </View>

              {/* Hero Illustration */}
              <View
                style={[
                  styles.heroIllustrationContainer,
                  {
                    flexGrow: isShortViewport ? 0 : 1,
                    height: isShortViewport ? welcomeIllustrationHeight : undefined,
                    minHeight: isShortViewport ? welcomeIllustrationHeight : 230,
                    maxHeight: Math.min(420, viewportHeight * 0.48),
                  },
                ]}
              >
                <Image
                  source={welcomeImage}
                  style={styles.heroIllustrationImage}
                  resizeMode="contain"
                  accessibilityLabel="BYTALK language partner welcome illustration"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.welcomeFooter}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.primaryButtonShadow}
                  onPress={() => setScreen('login')}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradientButton}
                  >
                    <Text style={styles.primaryButtonText}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={19} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footerLinkRow}>
                  <Text style={styles.footerLabel}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => setScreen('login')} activeOpacity={0.7}>
                    <Text style={styles.footerLinkBold}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}

          {/* SCREEN 2: LOGIN SCREEN */}
          {screen === 'login' && (
            <ScrollView
              contentContainerStyle={styles.authScrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Top Navigation Bar with Back Button and Health status */}
              <View style={styles.authTopNav}>
                <TouchableOpacity
                  onPress={() => {
                    setLoginError('');
                    setScreen('welcome');
                  }}
                  style={styles.backButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <View style={styles.healthBadge}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: backendUp ? '#168653' : '#F0B64A' }} />
                  <Txt size={11} color={muted}>{backendUp ? 'API Online' : 'API Offline'}</Txt>
                </View>
              </View>

              {/* Elevated Card Container */}
              <Animated.View style={[styles.authCardBox, { opacity: authFadeAnim, transform: [{ translateY: authSlideAnim }] }]}>
                {/* Centered Brand Header */}
                <View style={styles.authBrandHeader}>
                  <View style={styles.authBrandRow}>
                    <Ionicons name="chatbubble-ellipses" size={36} color={COLORS.primary} />
                    <Text style={styles.authBrandTitle}>
                      BY<Text style={{ color: COLORS.primary }}>TALK</Text>
                    </Text>
                  </View>
                  <Text style={styles.authBrandSubtitle}>Talk  •  Learn  •  Connect</Text>
                </View>

                {/* Title & Subtitle */}
                <View style={styles.authHeadingBlock}>
                  <Text style={styles.authHeadingTitle}>Welcome Back</Text>
                  <Text style={styles.authHeadingSubtitle}>Sign in to continue your language journey</Text>
                </View>

                {/* Server or Validation Error Alert */}
                {loginError ? (
                  <View style={styles.errorAlertContainer}>
                    <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                    <Text style={styles.errorAlertText}>{loginError}</Text>
                  </View>
                ) : null}

                {/* Form Fields */}
                <View style={styles.authForm}>
                {/* Email Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View
                    style={[
                      styles.inputFieldBox,
                      focusedField === 'loginEmail' && styles.inputFieldBoxFocused,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={focusedField === 'loginEmail' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <TextInput
                      value={loginEmail}
                      onChangeText={(val) => {
                        setLoginEmail(val);
                        if (loginError) setLoginError('');
                      }}
                      onFocus={() => setFocusedField('loginEmail')}
                      onBlur={() => setFocusedField('')}
                      placeholder="name@example.com"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.authInput}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View
                    style={[
                      styles.inputFieldBox,
                      focusedField === 'loginPassword' && styles.inputFieldBoxFocused,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={focusedField === 'loginPassword' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <TextInput
                      value={loginPassword}
                      onChangeText={(val) => {
                        setLoginPassword(val);
                        if (loginError) setLoginError('');
                      }}
                      onFocus={() => setFocusedField('loginPassword')}
                      onBlur={() => setFocusedField('')}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showLoginPassword}
                      autoCapitalize="none"
                      style={styles.authInput}
                    />
                    <TouchableOpacity
                      onPress={() => setShowLoginPassword(!showLoginPassword)}
                      activeOpacity={0.7}
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        name={showLoginPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password Action */}
                <View style={styles.forgotPasswordRow}>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Forgot Password', 'Password reset instructions will be sent to your email.')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                {/* Full-Width Orange Sign In Button */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={[styles.primaryButtonShadow, { marginTop: 8 }]}
                  onPress={handleLogin}
                  disabled={authBusy}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradientButton}
                  >
                    {authBusy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>

              {/* Bottom Link to Registration */}
              <View style={[styles.footerLinkRow, styles.authFooterLinkRow]}>
                <Text style={styles.footerLabel}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => {
                    setLoginError('');
                    setScreen('register');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerLinkBold}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* SCREEN 3: REGISTRATION SCREEN */}
          {screen === 'register' && (
            <ScrollView
              contentContainerStyle={styles.authScrollContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Top Navigation Bar with Back Button and Health status */}
              <View style={styles.authTopNav}>
                <TouchableOpacity
                  onPress={() => {
                    setRegError('');
                    setScreen('login');
                  }}
                  style={styles.backButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <View style={styles.healthBadge}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: backendUp ? '#168653' : '#F0B64A' }} />
                  <Txt size={11} color={muted}>{backendUp ? 'API Online' : 'API Offline'}</Txt>
                </View>
              </View>

              {/* Elevated Card Container */}
              <Animated.View style={[styles.authCardBox, { opacity: authFadeAnim, transform: [{ translateY: authSlideAnim }] }]}>
                {/* Centered Brand Header */}
                <View style={styles.authBrandHeader}>
                  <View style={styles.authBrandRow}>
                    <Ionicons name="chatbubble-ellipses" size={36} color={COLORS.primary} />
                    <Text style={styles.authBrandTitle}>
                      BY<Text style={{ color: COLORS.primary }}>TALK</Text>
                    </Text>
                  </View>
                  <Text style={styles.authBrandSubtitle}>Talk  •  Learn  •  Connect</Text>
                </View>

                {/* Title & Subtitle */}
                <View style={styles.authHeadingBlock}>
                  <Text style={styles.authHeadingTitle}>Create Account</Text>
                  <Text style={styles.authHeadingSubtitle}>Start your language learning journey</Text>
                </View>

                {/* Server or Validation Error Alert */}
                {regError ? (
                  <View style={styles.errorAlertContainer}>
                    <Ionicons name="alert-circle" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
                    <Text style={styles.errorAlertText}>{regError}</Text>
                  </View>
                ) : null}

                {/* Form Fields */}
                <View style={styles.authForm}>
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View
                    style={[
                      styles.inputFieldBox,
                      focusedField === 'regName' && styles.inputFieldBoxFocused,
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={focusedField === 'regName' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <TextInput
                      value={regName}
                      onChangeText={(val) => {
                        setRegName(val);
                        if (regError) setRegError('');
                      }}
                      onFocus={() => setFocusedField('regName')}
                      onBlur={() => setFocusedField('')}
                      placeholder="e.g. Alex Smith"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="words"
                      style={styles.authInput}
                    />
                  </View>
                </View>

                {/* Email Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View
                    style={[
                      styles.inputFieldBox,
                      focusedField === 'regEmail' && styles.inputFieldBoxFocused,
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={focusedField === 'regEmail' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <TextInput
                      value={regEmail}
                      onChangeText={(val) => {
                        setRegEmail(val);
                        if (regError) setRegError('');
                      }}
                      onFocus={() => setFocusedField('regEmail')}
                      onBlur={() => setFocusedField('')}
                      placeholder="name@example.com"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.authInput}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View
                    style={[
                      styles.inputFieldBox,
                      focusedField === 'regPassword' && styles.inputFieldBoxFocused,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={focusedField === 'regPassword' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <TextInput
                      value={regPassword}
                      onChangeText={(val) => {
                        setRegPassword(val);
                        if (regError) setRegError('');
                      }}
                      onFocus={() => setFocusedField('regPassword')}
                      onBlur={() => setFocusedField('')}
                      placeholder="Min. 8 characters"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showRegPassword}
                      autoCapitalize="none"
                      style={styles.authInput}
                    />
                    <TouchableOpacity
                      onPress={() => setShowRegPassword(!showRegPassword)}
                      activeOpacity={0.7}
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View
                    style={[
                      styles.inputFieldBox,
                      focusedField === 'regConfirmPassword' && styles.inputFieldBoxFocused,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={focusedField === 'regConfirmPassword' ? COLORS.primary : COLORS.textSecondary}
                    />
                    <TextInput
                      value={regConfirmPassword}
                      onChangeText={(val) => {
                        setRegConfirmPassword(val);
                        if (regError) setRegError('');
                      }}
                      onFocus={() => setFocusedField('regConfirmPassword')}
                      onBlur={() => setFocusedField('')}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showRegConfirmPassword}
                      autoCapitalize="none"
                      style={styles.authInput}
                    />
                    <TouchableOpacity
                      onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      activeOpacity={0.7}
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        name={showRegConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Full-Width Orange Sign Up Button */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={[styles.primaryButtonShadow, { marginTop: 12 }]}
                  onPress={handleRegister}
                  disabled={authBusy}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradientButton}
                  >
                    {authBusy ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Sign Up</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>

              {/* Bottom Link to Login */}
              <View style={[styles.footerLinkRow, styles.authFooterLinkRow]}>
                <Text style={styles.footerLabel}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => {
                    setRegError('');
                    setScreen('login');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerLinkBold}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* SCREEN 4: ONBOARDING PROFILE SETUP */}
          {screen === 'onboard' && (
            <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
              <TouchableOpacity onPress={() => setScreen('login')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                <Ionicons name="arrow-back" size={20} color={navy} />
                <Txt size={14} color={muted} style={{ marginLeft: 6 }}>Back to Login</Txt>
              </TouchableOpacity>
              <View style={{ alignItems: 'center', paddingVertical: 18 }}>
                <Txt size={26} bold style={{ textAlign: 'center' }}>Your language{'\n'}journey starts here</Txt>
                <Txt color={muted} style={{ textAlign: 'center', marginTop: 10, lineHeight: 20 }}>
                  Tell us about yourself to match you with native speakers worldwide.
                </Txt>
              </View>
              <Field label="Your name" value={name} setValue={setName} placeholder="e.g. Alex Smith" />
              <SearchSelect
                label="My native language"
                value={nativeLanguage}
                options={LANGUAGES}
                onSelect={setNativeLanguage}
                placeholder="Choose a language"
              />
              <SearchSelect
                label="I want to learn"
                value={learningLanguage}
                options={LANGUAGES}
                onSelect={setLearningLanguage}
                placeholder="Choose a language"
              />
              <SearchSelect
                label="I am from"
                value={country}
                options={COUNTRY_OPTIONS}
                onSelect={setCountry}
                placeholder="Choose a country"
              />
              <Btn label="Next  →" onPress={() => setScreen('level')} style={{ marginTop: 15 }} />
            </ScrollView>
          )}

          {/* SCREEN 5: PROFICIENCY LEVEL */}
          {screen === 'level' && (
            <ScrollView contentContainerStyle={{ padding: 22 }} keyboardShouldPersistTaps="handled">
              <Header
                title="Choose your level"
                subtitle="Select your current proficiency so we can find the best partners for you."
                onBack={() => setScreen('onboard')}
              />
              {[
                ['🌱', 'Beginner', 'I know a few basic words and phrases.'],
                ['🍃', 'Elementary', 'I can have simple conversations.'],
                ['📊', 'Intermediate', 'I can communicate in daily situations.'],
                ['📘', 'Upper Intermediate', 'I can discuss familiar topics with confidence.'],
                ['🎓', 'Advanced', 'I can express myself fluently.'],
                ['👑', 'Proficient', 'I can communicate like a native.'],
              ].map(([emoji, n, desc]) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setLevel(n)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 15,
                    marginBottom: 11,
                    borderWidth: 1.5,
                    borderColor: level === n ? orange : border,
                    borderRadius: 14,
                    backgroundColor: level === n ? COLORS.softSurface : '#fff',
                  }}
                >
                  <Txt size={28}>{emoji}</Txt>
                  <View style={{ flex: 1, marginLeft: 15 }}>
                    <Txt bold size={15}>{n}</Txt>
                    <Txt size={12} color={muted} style={{ marginTop: 2 }}>{desc}</Txt>
                  </View>
                  <Ionicons
                    name={level === n ? 'radio-button-on' : 'radio-button-off'}
                    color={level === n ? orange : '#aab3c0'}
                    size={22}
                  />
                </TouchableOpacity>
              ))}
              <Btn label={busy ? 'Saving...' : 'Continue  →'} onPress={() => saveProfile('discover')} style={{ marginTop: 8 }} />
            </ScrollView>
          )}

          {/* SCREEN 6: DISCOVER PARTNERS */}
          {screen === 'discover' && (
            <>
              <Header title="Find your partner" subtitle="Meet people from around the world and practice together." />
              <View style={styles.searchBar}>
                <Ionicons name="search" size={19} color={muted} />
                <TextInput
                  placeholder="Search by name, country, language..."
                  placeholderTextColor="#9CA3AF"
                  value={search}
                  onChangeText={setSearch}
                  style={{ flex: 1, padding: 12, color: navy, fontSize: 14 }}
                />
              </View>
              <View style={{ paddingHorizontal: 22, paddingTop: 12 }}>
                <Btn
                  label={subscription?.plan?.id === 'plus' || subscription?.plan?.id === 'pro' ? 'Manage BYTALK Premium' : 'Unlock video-call practice'}
                  outline
                  onPress={openSubscription}
                />
              </View>
              <ScrollView
                contentContainerStyle={{ padding: 22, flexGrow: 1 }}
                refreshControl={
                  <RefreshControl
                    refreshing={discoverRefreshing}
                    onRefresh={() => {
                      loadDiscoverUsers(true);
                      loadFriends();
                    }}
                    tintColor={orange}
                    colors={[orange]}
                  />
                }
              >
                {discoverError ? (
                  <View style={styles.discoverMessage}>
                    <Txt color={COLORS.error} size={13} style={{ textAlign: 'center' }}>{discoverError}</Txt>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Retry loading registered users"
                      onPress={() => loadDiscoverUsers(true)}
                      style={styles.discoverRetry}
                    >
                      <Ionicons name="refresh" size={16} color={orange} />
                      <Txt color={orange} size={13} bold>Retry</Txt>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {discoverLoading && partners.length === 0 ? (
                  <View style={styles.discoverMessage}>
                    <ActivityIndicator color={orange} />
                    <Txt size={13} color={muted} style={{ marginTop: 10 }}>Finding registered users…</Txt>
                  </View>
                ) : null}
                {/* INCOMING FRIEND REQUESTS SECTION IN DISCOVER */}
                {pendingFriendRequests.length > 0 && (
                  <View style={styles.discoverRequestsBox}>
                    <View style={styles.discoverRequestsHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.discoverRequestsBadge}>
                          <Text style={styles.discoverRequestsBadgeText}>{pendingFriendRequests.length}</Text>
                        </View>
                        <Txt bold size={15} color={navy} style={{ marginLeft: 8 }}>Friend Requests</Txt>
                      </View>
                      <TouchableOpacity onPress={() => setShowNotificationsModal(true)} activeOpacity={0.7}>
                        <Txt size={12} color={COLORS.primary} bold>View all</Txt>
                      </TouchableOpacity>
                    </View>
                    <Txt size={12} color={muted} style={{ marginTop: 2, marginBottom: 12 }}>
                      These co-learners want to connect with you. Accept to start practicing and chatting!
                    </Txt>
                    {pendingFriendRequests.map((req) => {
                      const user = req.from || {};
                      const uName = user.displayName || user.name || 'Co-learner';
                      return (
                        <View key={req.id || user.id} style={styles.discoverRequestItem}>
                          <View style={styles.discoverRequestUser}>
                            <View style={[styles.avatarCircle, { width: 42, height: 42, backgroundColor: '#FFE4E6' }]}>
                              {user.avatarUrl || user.profilePhotoUrl ? (
                                <Image source={{ uri: user.avatarUrl || user.profilePhotoUrl }} style={styles.partnerAvatarImage} />
                              ) : (
                                <Txt size={17} bold color="#E11D48">{uName.trim().charAt(0).toUpperCase()}</Txt>
                              )}
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Txt bold size={14} color={navy}>{uName}</Txt>
                              <Txt size={11} color={muted}>{user.country ? `${user.country} · ` : ''}{user.level || 'Beginner'}</Txt>
                            </View>
                          </View>
                          <View style={styles.discoverRequestBtns}>
                            <TouchableOpacity
                              onPress={() => handleAcceptFriendRequest(req)}
                              style={styles.discoverAcceptBtn}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" style={{ marginRight: 3 }} />
                              <Text style={styles.discoverAcceptBtnText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeclineFriendRequest(req)}
                              style={styles.discoverDeclineBtn}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.discoverDeclineBtnText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
                {/* CONVERSATION LIST (ACCEPTED FRIENDS) */}
                {(() => {
                  // Build accepted friend conversations
                  const friendMap = new Map();
                  (friendsList || []).forEach((f) => {
                    const key = String(f.id || f._id || f.name).toLowerCase();
                    friendMap.set(key, f);
                  });
                  (partners || []).filter((p) => checkIsFriend(p)).forEach((p) => {
                    const key = String(p.id || p._id || p.name).toLowerCase();
                    if (!friendMap.has(key)) friendMap.set(key, p);
                  });

                  const convList = [];
                  const processedKeys = new Set();

                  // First include any friend from `conversations`
                  (conversations || []).forEach((c) => {
                    const u = c.user;
                    if (!u) return;
                    const uKey = String(u.id || u._id || u.name).toLowerCase();
                    const isFriend = friendMap.has(uKey) || checkIsFriend(u);
                    if (!isFriend) return; // Pending or non-friends should NOT appear in conversation list

                    processedKeys.add(uKey);
                    const friendInfo = friendMap.get(uKey) || u;
                    convList.push({
                      ...c,
                      user: {
                        ...friendInfo,
                        ...u,
                        online: Boolean(u.online || friendInfo.online),
                      },
                    });
                  });

                  // Second, for any friend who has no conversation entry yet:
                  friendMap.forEach((friend, key) => {
                    if (!processedKeys.has(key)) {
                      convList.push({
                        user: friend,
                        latestMessage: null, // Before first message: display "You are now connected. Say hello!"
                        unreadCount: 0,
                        timeDisplay: '',
                      });
                    }
                  });

                  // Search filter
                  const q = (search || '').trim().toLowerCase();
                  const filteredConvs = q
                    ? convList.filter((c) => {
                        const name = (c.user?.displayName || c.user?.name || '').toLowerCase();
                        const country = (c.user?.country || '').toLowerCase();
                        return name.includes(q) || country.includes(q);
                      })
                    : convList;

                  // Searched non-friends when user is searching
                  const searchedNonFriends = q
                    ? (partners || []).filter((p) => {
                        const pKey = String(p.id || p._id || p.name).toLowerCase();
                        if (friendMap.has(pKey) || checkIsFriend(p)) return false;
                        const name = (p.displayName || p.name || '').toLowerCase();
                        const country = (p.country || '').toLowerCase();
                        return name.includes(q) || country.includes(q);
                      })
                    : [];

                  if (convList.length === 0 && !q) {
                    return (
                      <View style={styles.discoverEmptyCard}>
                        <View style={styles.discoverEmptyIconCircle}>
                          <Ionicons name="chatbubbles" size={36} color="#6366F1" />
                        </View>
                        <Txt bold size={16} color={navy} style={{ marginTop: 14, textAlign: 'center' }}>
                          No conversations yet
                        </Txt>
                        <Txt size={12} color={muted} style={{ marginTop: 6, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 }}>
                          When you connect with co-learners, your accepted friends and chats will appear here. Practice speaking or accept friend requests to start chatting!
                        </Txt>
                        <TouchableOpacity
                          style={styles.discoverStartPracticeBtn}
                          onPress={() => {
                            setActiveBottomTab('call');
                            setScreen('call-tab');
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="call" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.discoverStartPracticeBtnText}>Start Speaking Practice</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }

                  return (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8, paddingHorizontal: 2 }}>
                        <Txt bold size={16} color={navy}>
                          {q ? `Conversations (${filteredConvs.length})` : 'Connected Friends'}
                        </Txt>
                        <Txt size={12} color={muted}>
                          {convList.length} friend{convList.length === 1 ? '' : 's'}
                        </Txt>
                      </View>

                      {/* Conversation rows card */}
                      <View style={styles.convListCard}>
                        {filteredConvs.length === 0 && q ? (
                          <View style={{ padding: 20, alignItems: 'center' }}>
                            <Txt size={13} color={muted}>No friends match "{search}"</Txt>
                          </View>
                        ) : (
                          filteredConvs.map((conv, idx) => {
                            const partner = conv.user;
                            const latest = conv.latestMessage;
                            const isMe = latest && (latest.from === userId || latest.from === 'me' || latest.from === name);
                            const hasUnread = conv.unreadCount > 0;
                            const timeDisplay = conv.timeDisplay || (latest?.at ? new Date(latest.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
                            const isLast = idx === filteredConvs.length - 1;

                            return (
                              <TouchableOpacity
                                key={`disc-conv-${partner.id || partner._id || partner.name || idx}`}
                                onPress={() => openConversation(partner)}
                                style={[styles.convItemRow, isLast && { borderBottomWidth: 0 }]}
                                activeOpacity={0.7}
                              >
                                {/* Profile Photo / Avatar with Online Dot */}
                                <View style={styles.convAvatarContainer}>
                                  {partner.avatarUrl || partner.profilePhotoUrl ? (
                                    <Image
                                      source={{ uri: partner.avatarUrl || partner.profilePhotoUrl }}
                                      style={styles.convAvatarImg}
                                    />
                                  ) : (
                                    <View style={[styles.convAvatarImg, styles.convAvatarFallback]}>
                                      <Text style={styles.convAvatarInitial}>
                                        {(partner.displayName || partner.name || 'F').trim().charAt(0).toUpperCase()}
                                      </Text>
                                    </View>
                                  )}
                                  {/* Online/Offline Status Indicator */}
                                  <View style={[styles.convStatusDot, partner.online ? styles.convStatusOnline : styles.convStatusOffline]} />
                                </View>

                                {/* Details */}
                                <View style={styles.convDetailsCol}>
                                  <View style={styles.convTopLine}>
                                    <Text style={styles.convNameText} numberOfLines={1}>
                                      {partner.displayName || partner.name}
                                    </Text>
                                    <Text style={[styles.convTimeText, hasUnread && styles.convTimeTextUnread]}>
                                      {timeDisplay}
                                    </Text>
                                  </View>

                                  <View style={styles.convBottomLine}>
                                    <View style={styles.convPreviewBox}>
                                      {!latest || !latest.text ? (
                                        <Text style={styles.convConnectedText} numberOfLines={1}>
                                          You are now connected. Say hello! 👋
                                        </Text>
                                      ) : (
                                        <>
                                          {isMe && (
                                            <Ionicons
                                              name="checkmark-done"
                                              size={14}
                                              color={latest?.readAt ? '#2563EB' : '#94A3B8'}
                                              style={{ marginRight: 4 }}
                                            />
                                          )}
                                          <Text
                                            style={[
                                              styles.convSnippetText,
                                              hasUnread && styles.convSnippetTextUnread,
                                            ]}
                                            numberOfLines={1}
                                          >
                                            {latest.text}
                                          </Text>
                                        </>
                                      )}
                                    </View>

                                    {hasUnread ? (
                                      <View style={styles.convUnreadPill}>
                                        <Text style={styles.convUnreadCountText}>{conv.unreadCount}</Text>
                                      </View>
                                    ) : null}
                                  </View>
                                </View>

                                {/* Direct Call Quick Buttons */}
                                <View style={styles.convQuickActions}>
                                  <TouchableOpacity
                                    onPress={() => startCall(partner, 'audio')}
                                    style={styles.convQuickBtn}
                                    accessibilityLabel="Voice call"
                                  >
                                    <Ionicons name="call-outline" size={17} color="#10B981" />
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => startCall(partner, 'video')}
                                    style={styles.convQuickBtn}
                                    accessibilityLabel="Video call"
                                  >
                                    <Ionicons name="videocam-outline" size={18} color="#6366F1" />
                                  </TouchableOpacity>
                                </View>
                              </TouchableOpacity>
                            );
                          })
                        )}
                      </View>

                      {/* If Searching, also show registered non-friends to add */}
                      {q && searchedNonFriends.length > 0 && (
                        <View style={{ marginTop: 20 }}>
                          <Txt bold size={15} color={navy} style={{ marginBottom: 10 }}>
                            Find More Co-learners 🌐
                          </Txt>
                          {searchedNonFriends.map((p) => {
                            const isFriend = checkIsFriend(p);
                            const incomingRequest = findIncomingFriendRequest(p);
                            const isRequestSent = Boolean(findSentFriendRequest(p));
                            const isUnavailable = isFriend || isRequestSent;
                            const buttonLabel = isFriend
                              ? 'Friends'
                              : incomingRequest ? 'Accept' : isRequestSent ? 'Request Sent' : 'Add Friend';
                            return (
                              <View key={p.id} style={styles.partnerCard}>
                                <View style={styles.partnerInfoRow}>
                                  <View style={[styles.avatarCircle, { backgroundColor: '#FFE0D3' }]}>
                                    {p.avatarUrl ? (
                                      <Image source={{ uri: p.avatarUrl }} style={styles.partnerAvatarImage} />
                                    ) : (
                                      <Txt size={18} bold color={orange}>{(p.displayName || p.name || '?').charAt(0).toUpperCase()}</Txt>
                                    )}
                                  </View>
                                  <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Txt bold size={15}>{p.displayName || p.name}</Txt>
                                    <Txt size={11} color={muted}>{p.country || 'Global'} · {p.level || 'Beginner'}</Txt>
                                  </View>
                                  <TouchableOpacity
                                    onPress={() => incomingRequest
                                      ? handleAcceptFriendRequest(incomingRequest)
                                      : handleSendFriendRequest(p)}
                                    disabled={isUnavailable}
                                    style={[
                                      styles.discoverAddFriendBtn,
                                      isUnavailable && { backgroundColor: '#DCFCE7' },
                                      incomingRequest && { backgroundColor: '#15803D' },
                                    ]}
                                  >
                                    <Ionicons
                                      name={isFriend ? 'checkmark-circle' : incomingRequest ? 'checkmark' : isRequestSent ? 'checkmark' : 'person-add-outline'}
                                      size={14}
                                      color={isUnavailable ? '#166534' : '#FFFFFF'}
                                      style={{ marginRight: 4 }}
                                    />
                                    <Text
                                      style={[
                                        styles.discoverAddFriendBtnText,
                                        isUnavailable && { color: '#166534' },
                                      ]}
                                    >
                                      {buttonLabel}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </>
                  );
                })()}
              </ScrollView>
            </>
          )}

                    {/* SCREEN: UNIFIED CHATS & CALLS HUB (MATCHING USER'S REFERRAL THEME) */}
          {/* SCREEN: MESSAGES (MATCHING USER'S THEME FROM SCREENSHOT) */}
          {screen === 'messages' && (() => {
            const renderConvRow = (conversation) => {
              const partner = conversation.user;
              const latest = conversation.latestMessage;
              const isMe = latest?.from === userId || latest?.from === 'me';
              const isTyping = latest?.isTyping;
              const hasUnread = conversation.unreadCount > 0;
              const timeDisplay = conversation.timeDisplay || (latest?.at ? new Date(latest.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

              return (
                <TouchableOpacity
                  key={`msg-conv-${partner.id}`}
                  onPress={() => openConversation(partner)}
                  style={styles.msgConvRow}
                  activeOpacity={0.7}
                >
                  <View style={styles.msgConvAvatarBox}>
                    <Image
                      source={{ uri: getPartnerAvatarUrl(partner) }}
                      style={styles.msgConvAvatar}
                    />
                    {partner.online && <View style={styles.msgOnlineDot} />}
                  </View>

                  <View style={styles.msgConvDetails}>
                    <View style={styles.msgConvTopRow}>
                      <Text style={styles.msgConvName} numberOfLines={1}>
                        {partner.displayName || partner.name}
                      </Text>
                      <Text style={[styles.msgConvTime, hasUnread && styles.msgConvTimeUnread]}>
                        {timeDisplay}
                      </Text>
                    </View>

                    <View style={styles.msgConvBottomRow}>
                      <View style={styles.msgConvPreviewRow}>
                        {isTyping ? (
                          <Text style={styles.msgTypingText}>Typing...</Text>
                        ) : (
                          <>
                            {isMe && (
                              <Ionicons
                                name="checkmark-done"
                                size={15}
                                color={latest?.readAt ? '#2563EB' : '#94A3B8'}
                                style={{ marginRight: 4 }}
                              />
                            )}
                            <Text style={styles.msgConvSnippet} numberOfLines={1}>
                              {latest?.text || 'No messages yet'}
                            </Text>
                          </>
                        )}
                      </View>

                      {hasUnread ? (
                        <View style={styles.msgUnreadBadge}>
                          <Text style={styles.msgUnreadText}>{conversation.unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            };

            return (
              <View style={styles.msgScreenContainer}>
                {/* Top Bar: BT BYTALK, ● API Online, Logout button (Image theme) */}
                <View style={styles.messagesThemeTopBar}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.messagesLogoBt}>BT </Text>
                    <Text style={styles.messagesLogoBytalk}>BYTALK</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.apiOnlinePill}>
                      <View style={styles.apiOnlineDot} />
                      <Text style={styles.apiOnlineText}>API Online</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
                        ]);
                      }}
                      style={styles.messagesSignOutBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Sign out"
                    >
                      <Ionicons name="log-out-outline" size={20} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Page Title & Subtitle: Messages / Your latest conversations */}
                <View style={styles.messagesThemeTitleArea}>
                  <Text style={styles.messagesThemeTitle}>Messages</Text>
                  <Text style={styles.messagesThemeSub}>Your latest conversations</Text>
                </View>

                {/* Subscription Restriction Notice: Only subscribers can message */}
                {!isPaidSubscriber() && (
                  <View style={styles.messagesSubNoticeCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Ionicons name="lock-closed" size={18} color="#EA580C" />
                      <Text style={styles.messagesSubNoticeTitle}>Subscribers Only</Text>
                    </View>
                    <Text style={styles.messagesSubNoticeText}>
                      Direct 1-on-1 messaging is an exclusive feature for BYTALK subscribers. Upgrade your plan to chat and connect with language partners worldwide!
                    </Text>
                    <TouchableOpacity onPress={openSubscription} style={styles.messagesSubNoticeBtn} activeOpacity={0.85}>
                      <Text style={styles.messagesSubNoticeBtnText}>Upgrade to PRO 👑</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Main Content: Either Empty State or Real Conversations */}
                {conversations.length === 0 ? (
                  <View style={styles.messagesThemeEmptyContainer}>
                    <Text style={styles.messagesThemeEmptyText}>
                      No conversations yet. Start a chat from Discover.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {conversations.map((c) => renderConvRow(c))}
                  </ScrollView>
                )}
              </View>
            );
          })()}


          {screen === 'chat' && (
            <View style={styles.chatWrapper}>
              {/* Clean White Top Header */}
              <View style={styles.chatHeader}>
                <TouchableOpacity
                  onPress={() => {
                    const fallback = activeBottomTab === 'messages' ? 'messages' : 'discover';
                    setActiveBottomTab(fallback);
                    setScreen(fallback);
                    refreshConversations();
                    loadFriends();
                  }}
                  style={styles.chatBackBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Chats & Calls"
                >
                  <Ionicons name="chevron-back" size={26} color="#0F172A" />
                </TouchableOpacity>

                <View style={styles.chatHeaderUser}>
                  <Image
                    source={{ uri: getPartnerAvatarUrl(selected) }}
                    style={styles.chatHeaderAvatar}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.chatHeaderName} numberOfLines={1}>
                      {selected.displayName || selected.name}
                    </Text>
                    <Text style={styles.chatHeaderStatus} numberOfLines={1}>
                      {selected.online ? '● Online' : `${selected.country || 'Global'} · ${selected.learningLanguage || 'English'}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.chatHeaderActions}>
                  <TouchableOpacity
                    onPress={() => startCall(selected, 'video')}
                    style={styles.chatHeaderIconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Video call"
                  >
                    <Ionicons name="videocam-outline" size={23} color="#1E293B" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => startCall(selected, 'audio')}
                    style={styles.chatHeaderIconBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Voice call"
                  >
                    <Ionicons name="call-outline" size={21} color="#1E293B" />
                  </TouchableOpacity>
                </View>
              </View>

              {chatError ? (
                <TouchableOpacity
                  onPress={() => setChatError('')}
                  style={styles.chatErrorBanner}
                >
                  <Text style={styles.chatErrorText}>{chatError}</Text>
                </TouchableOpacity>
              ) : null}

              {typing && (
                <View style={styles.chatTypingBanner}>
                  <Text style={styles.chatTypingBannerText}>
                    {selected.displayName || selected.name} is typing...
                  </Text>
                </View>
              )}

              {/* Chat Scroll Area with Soft Lavender Tint Wallpaper */}
              <ScrollView
                contentContainerStyle={{ padding: 14, flexGrow: 1, justifyContent: 'flex-end' }}
                showsVerticalScrollIndicator={false}
              >
                {/* Centered Date Pill (Today) */}
                <View style={styles.chatDatePillRow}>
                  <View style={styles.chatDatePill}>
                    <Text style={styles.chatDatePillText}>Today</Text>
                  </View>
                </View>

                {messageLoading && <ActivityIndicator color="#7C3AED" style={{ margin: 18 }} />}

                {!messageLoading && messages
                  .filter((m) => (m.from === selected.id && m.to === userId) || (m.from === userId && m.to === selected.id))
                  .map((m) => {
                    const isMe = m.from === userId || m.from === 'me';
                    const timeStr = m.at ? new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '15:05';

                    return (
                      <View key={m.id} style={[styles.chatBubbleContainer, isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                        <View style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubbleThem]}>
                          {/* Image Attachment Card */}
                          {m.attachmentType === 'image' && m.attachmentUrl ? (
                            <View style={styles.chatImgBox}>
                              <Image
                                source={{ uri: m.attachmentUrl }}
                                style={styles.chatImgPreview}
                                resizeMode="cover"
                              />
                              {m.attachmentName ? (
                                <Text style={styles.chatAttachCaption}>
                                  📷 {m.attachmentName}
                                </Text>
                              ) : null}
                            </View>
                          ) : null}

                          {/* File Attachment Card */}
                          {m.attachmentType === 'file' ? (
                            <TouchableOpacity
                              onPress={() => openAttachment(m)}
                              disabled={!m.attachmentUrl}
                              style={styles.chatFileBox}
                              accessibilityRole="button"
                              accessibilityLabel={`Download ${m.attachmentName || 'PDF attachment'}`}
                            >
                              <View style={styles.chatFileIconCircle}>
                                <Ionicons name="document-text" size={22} color="#EF4444" />
                              </View>
                              <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.chatFileName} numberOfLines={1}>
                                  {m.attachmentName || 'Document.pdf'}
                                </Text>
                                <Text style={styles.chatFileSize}>
                                  {m.attachmentSize || 'PDF'} · Tap to download
                                </Text>
                              </View>
                              <Ionicons name="arrow-down-circle" size={22} color="#7C3AED" />
                            </TouchableOpacity>
                          ) : null}

                          {/* Text Content */}
                          {Boolean(m.text && m.text.trim()) ? (
                            <Text style={[styles.chatBubbleText, isMe ? styles.chatBubbleTextMe : styles.chatBubbleTextThem]}>
                              {m.text}
                            </Text>
                          ) : null}
                        </View>

                        {/* Timestamp & Double Checkmarks BELOW the bubble (Identical to referral image) */}
                        <View style={[styles.chatBubbleMetaRow, isMe ? { alignSelf: 'flex-end', marginRight: 4 } : { alignSelf: 'flex-start', marginLeft: 4 }]}>
                          <Text style={styles.chatBubbleMetaTime}>{timeStr}</Text>
                          {isMe && (
                            <Ionicons
                              name="checkmark-done"
                              size={15}
                              color="#6B7280"
                              style={{ marginLeft: 3 }}
                            />
                          )}
                        </View>
                      </View>
                    );
                  })}
              </ScrollView>

              {/* Bottom Message Input Bar */}
              {hasMessageEntitlement(selected) ? (
                <View style={styles.chatBottomBar}>
                  {showEmojiPicker ? (
                    <View style={styles.chatEmojiKeyboard}>
                      <View style={styles.chatEmojiKeyboardHeader}>
                        <Text style={styles.chatEmojiKeyboardTitle}>Emoji</Text>
                        <View style={styles.chatEmojiKeyboardActions}>
                          <TouchableOpacity
                            onPress={deleteChatEmoji}
                            disabled={!draft}
                            style={styles.chatEmojiKeyboardAction}
                            accessibilityRole="button"
                            accessibilityLabel="Delete last character"
                          >
                            <Ionicons name="backspace-outline" size={21} color={draft ? '#475569' : '#CBD5E1'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setShowEmojiPicker(false)}
                            style={styles.chatEmojiKeyboardAction}
                            accessibilityRole="button"
                            accessibilityLabel="Close emoji keyboard"
                          >
                            <Ionicons name="close" size={20} color="#64748B" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chatEmojiCategoryRow}
                      >
                        {CHAT_EMOJI_CATEGORIES.map((category) => {
                          const isActive = emojiCategory === category.id;
                          return (
                            <TouchableOpacity
                              key={category.id}
                              onPress={() => setEmojiCategory(category.id)}
                              style={[styles.chatEmojiCategoryButton, isActive && styles.chatEmojiCategoryButtonActive]}
                              accessibilityRole="button"
                              accessibilityLabel={`${category.label} emojis`}
                              accessibilityState={{ selected: isActive }}
                            >
                              <Ionicons
                                name={category.icon}
                                size={18}
                                color={isActive ? '#7C3AED' : '#64748B'}
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      <ScrollView
                        style={styles.chatEmojiGridScroll}
                        contentContainerStyle={styles.chatEmojiGrid}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="always"
                      >
                        {(CHAT_EMOJI_CATEGORIES.find((category) => category.id === emojiCategory) || CHAT_EMOJI_CATEGORIES[0]).emojis.map((emoji, index) => (
                          <TouchableOpacity
                            key={`${emoji}-${index}`}
                            onPress={() => insertChatEmoji(emoji)}
                            style={styles.chatEmojiCell}
                            accessibilityRole="button"
                            accessibilityLabel={`Insert ${emoji}`}
                          >
                            <Text style={styles.chatEmojiText}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={styles.chatEmojiKeyboardHint}>Tap an emoji to add it to your message</Text>
                    </View>
                  ) : null}

                  {/* Pending Attachment Banner */}
                  {pendingAttachment ? (
                    <View style={styles.chatPendingBanner}>
                      <Ionicons
                        name={pendingAttachment.type === 'image' ? 'image' : 'document-attach'}
                        size={18}
                        color="#7C3AED"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.chatPendingText} numberOfLines={1}>
                        {pendingAttachment.name}
                      </Text>
                      <TouchableOpacity onPress={() => setPendingAttachment(null)} style={{ padding: 4 }}>
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View style={styles.chatInputRow}>
                    <View style={styles.chatInputCapsule}>
                      <TextInput
                        ref={chatTextInputRef}
                        placeholder="Type your message..."
                        placeholderTextColor="#94A3B8"
                        value={draft}
                        onChangeText={updateDraft}
                        onFocus={() => setShowEmojiPicker(false)}
                        style={styles.chatTextInput}
                        multiline
                      />

                      <TouchableOpacity
                        onPress={toggleEmojiPicker}
                        style={styles.chatAttachBtn}
                        accessibilityRole="button"
                        accessibilityLabel={showEmojiPicker ? 'Close emoji keyboard' : 'Open emoji keyboard'}
                        accessibilityState={{ expanded: showEmojiPicker }}
                      >
                        <Text style={{ fontSize: 20, lineHeight: 24 }}>
                          {showEmojiPicker ? '⌨️' : '😀'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setShowEmojiPicker(false);
                          setShowAttachmentModal(true);
                        }}
                        style={styles.chatAttachBtn}
                        accessibilityLabel="Attach photo or file"
                      >
                        <Ionicons name="attach" size={22} color="#64748B" style={{ transform: [{ rotate: '-45deg' }] }} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => send()}
                      style={styles.chatSendBtn}
                      activeOpacity={0.82}
                      accessibilityLabel="Send message"
                    >
                      <Ionicons
                        name="send"
                        size={17}
                        color="#FFFFFF"
                        style={{ marginLeft: 2 }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.chatLockedBanner}>
                  <Ionicons name="lock-closed" size={20} color="#7C3AED" />
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>Subscription Required</Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>Subscribe to send messages, photos & files to partners.</Text>
                  </View>
                  <TouchableOpacity onPress={openSubscription} style={styles.chatUpgradeBtn}>
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Unlock</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {screen === 'call-complete' && callCompletion && (
            <ScrollView contentContainerStyle={styles.postCallScreen} showsVerticalScrollIndicator={false}>
              {/* Top Bar: Skip on left, ⋮ on right (Image 2) */}
              <View style={styles.postCallTopBar}>
                <TouchableOpacity onPress={leaveCallCompletion} activeOpacity={0.7} style={styles.postCallSkipBtn}>
                  <Text style={styles.postCallSkipText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} style={{ padding: 6 }}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Green Note Banner (Image 2) */}
              <View style={styles.postCallNoteBanner}>
                <Text style={styles.postCallNoteText}>
                  <Text style={{ fontWeight: '800' }}>Note : </Text>
                  Ratings help us to connect you with a good co-learner and create an effective learning environment.
                </Text>
              </View>

              {/* Section 1: Share your feedback about [Partner] */}
              <View style={styles.postCallCard}>
                <Text style={styles.postCallCardTitle}>
                  Share your feedback about {callCompletion.peer?.name || 'Co-learner'}
                </Text>
                <View style={styles.postCallStarsRow}>
                  <View style={styles.postCallStarsGroup}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        accessibilityRole="button"
                        accessibilityLabel={`Rate ${star} star`}
                        onPress={() => setFeedbackRating(star)}
                        style={{ padding: 4 }}
                      >
                        <Ionicons
                          name={star <= (feedbackRating || 5) ? 'star' : 'star-outline'}
                          size={34}
                          color={star <= (feedbackRating || 5) ? '#F59E0B' : '#E2E8F0'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.postCallStarMascot}>
                    <Text style={{ fontSize: 32 }}>⭐</Text>
                  </View>
                </View>
                <View style={styles.postCallStarLabels}>
                  <Text style={styles.postCallSubLabel}>Bad</Text>
                  <Text style={styles.postCallSubLabel}>Very Good</Text>
                </View>
              </View>

              {/* Section 2: Add detailed review */}
              <View style={styles.postCallCard}>
                <Text style={styles.postCallCardTitle}>Add detailed review</Text>
                <TextInput
                  value={feedbackComment}
                  onChangeText={setFeedbackComment}
                  placeholder="Add comments"
                  placeholderTextColor="#94A3B8"
                  multiline
                  style={styles.postCallTextInput}
                />
              </View>

              {/* Section 3: Call audio/network quality experience? (optional) */}
              <View style={styles.postCallCard}>
                <Text style={styles.postCallCardTitle}>
                  Call audio/network quality experience? (optional)
                </Text>
                <View style={styles.postCallAudioRow}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => setAudioQualityRating(num)}
                      style={[
                        styles.audioRatingPill,
                        audioQualityRating === num && styles.audioRatingPillActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.audioRatingPillText,
                          audioQualityRating === num && styles.audioRatingPillTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <Text style={{ fontSize: 28, marginLeft: 6 }}>⭐</Text>
                </View>
                <View style={styles.postCallStarLabels}>
                  <Text style={styles.postCallSubLabel}>Poor Quality</Text>
                  <Text style={styles.postCallSubLabel}>Very Good</Text>
                </View>
              </View>

              {/* Section 4: Add as Friend Option */}
              <View style={styles.postCallCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.postCallCardTitle}>
                      Practice again with {callCompletion.peer?.displayName || callCompletion.peer?.name || 'Co-learner'}?
                    </Text>
                    <Text style={styles.postCallSubLabel}>
                      Connect as friends to chat freely and call directly from the Friends tab.
                    </Text>
                  </View>
                  {(() => {
                    const peer = callCompletion.peer;
                    const peerName = peer?.displayName || peer?.name || 'Co-learner';
                    const isFriend = checkIsFriend(peer);
                    const incomingReq = findIncomingFriendRequest(peer);
                    const isSent = friendRequestSentInCall || Boolean(findSentFriendRequest(peer));

                    if (isFriend) {
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={[styles.postCallFriendBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                            <Ionicons name="checkmark-circle" size={15} color="#166534" style={{ marginRight: 4 }} />
                            <Text style={[styles.postCallFriendBtnText, { color: '#166534' }]}>Friends</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              leaveCallCompletion();
                              openConversation(callCompletion.peer);
                            }}
                            style={[styles.postCallFriendBtn, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="chatbubble-ellipses-outline" size={14} color="#4F46E5" style={{ marginRight: 4 }} />
                            <Text style={[styles.postCallFriendBtnText, { color: '#4F46E5' }]}>Chat</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }

                    if (incomingReq) {
                      return (
                        <TouchableOpacity
                          onPress={() => handleAcceptFriendRequest(incomingReq)}
                          style={[styles.postCallFriendBtn, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="checkmark-circle" size={15} color="#15803D" style={{ marginRight: 4 }} />
                          <Text style={[styles.postCallFriendBtnText, { color: '#15803D' }]}>Accept Request</Text>
                        </TouchableOpacity>
                      );
                    }

                    return (
                      <TouchableOpacity
                        onPress={() => handleSendFriendRequest(callCompletion.peer)}
                        disabled={isSent}
                        style={[
                          styles.postCallFriendBtn,
                          isSent && styles.postCallFriendBtnSent,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isSent ? 'checkmark' : 'person-add'}
                          size={15}
                          color={isSent ? '#166534' : '#6366F1'}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.postCallFriendBtnText,
                            isSent && { color: '#166534' },
                          ]}
                        >
                          {isSent ? 'Request Sent' : 'Add Friend'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={() => {
                  submitCallFeedback();
                  leaveCallCompletion();
                }}
                style={styles.postCallSubmitBtn}
                activeOpacity={0.88}
              >
                <Text style={styles.postCallSubmitBtnText}>Submit</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {screen === 'call' && (
            !call ? (
              <View style={[styles.callScreen, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }]}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={{ marginTop: 14, fontSize: 16, color: '#334155', fontWeight: '700' }}>
                  Connecting Co-learner...
                </Text>
                <Text style={{ marginTop: 6, fontSize: 13, color: '#94A3B8' }}>
                  Setting up audio channel
                </Text>
              </View>
            ) : (
            <View style={styles.callScreen}>
              {/* Hidden CallAudio to play remote audio */}
              <CallAudio stream={remoteStream} />

              {/* INCOMING CALL SCREEN: Displays prominent Accept & Disconnect options */}
              {call.direction === 'incoming' && (call.status === 'Ringing' || call.status === 'Calling') ? (
                <View style={styles.incomingCallFullContainer}>
                  <View style={styles.incomingCallerCard}>
                    <View style={styles.incomingAvatarWrapper}>
                      <Image
                        source={{
                          uri: call.peer?.profilePhotoUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + (call.peer?.name || 'Learner'),
                        }}
                        style={styles.incomingAvatarImage}
                      />
                    </View>
                    <Text style={styles.incomingCallerTitle}>
                      {call.peer?.name || 'Co-learner'}
                    </Text>
                    <Text style={styles.incomingCallSubtitle}>
                      Incoming {call.type === 'video' ? 'Video' : 'Audio'} Call...
                    </Text>
                    <Text style={styles.incomingMetaText}>
                      {call.peer?.country || 'Global'} • {call.peer?.level || 'Intermediate'}
                    </Text>
                  </View>

                  {/* Prominent Action Buttons: Disconnect & Accept */}
                  <View style={styles.incomingCallActionRow}>
                    {/* Disconnect Button (Red) */}
                    <TouchableOpacity
                      onPress={rejectCall}
                      style={styles.incomingActionBtnItem}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Disconnect Call"
                    >
                      <View style={styles.incomingDisconnectCircle}>
                        <Ionicons name="call" size={30} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
                      </View>
                      <Text style={styles.incomingDisconnectLabel}>Disconnect</Text>
                    </TouchableOpacity>

                    {/* Accept Button (Green) */}
                    <TouchableOpacity
                      onPress={acceptCall}
                      style={styles.incomingActionBtnItem}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Accept Call"
                    >
                      <View style={styles.incomingAcceptCircle}>
                        <Ionicons name="call" size={30} color="#FFFFFF" />
                      </View>
                      <Text style={styles.incomingAcceptLabel}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : call.type === 'video' ? (
                /* ================= FULL VIDEO CALL SCREEN ================= */
                <View style={styles.videoCallContainer}>
                  {/* Remote Video Stream (Main View) */}
                  <View style={styles.videoRemoteWrapper}>
                    {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
                      <CallVideo
                        stream={remoteStream}
                        label={call.peer?.name || 'Co-learner'}
                        mirror={false}
                        style={styles.videoRemoteStream}
                      />
                    ) : (
                      <View style={styles.videoPlaceholderContainer}>
                        <View style={styles.videoPlaceholderAvatarBorder}>
                          <Image
                            source={{
                              uri: call.peer?.profilePhotoUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + (call.peer?.name || 'Srihari'),
                            }}
                            style={styles.videoPlaceholderAvatarImg}
                          />
                        </View>
                        <Text style={styles.videoPlaceholderName}>
                          {call.peer?.name || 'Co-learner'}
                        </Text>
                        <View style={styles.videoStatusPill}>
                          <View style={[styles.activeCallPulseDot, { backgroundColor: call.status === 'Connected' ? '#10B981' : '#F59E0B' }]} />
                          <Text style={styles.videoStatusPillText}>
                            {call.status === 'Connected' ? 'Video Connected • Camera Ready' : `${call.status || 'Connecting'}...`}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Top Overlay: Partner Name, Live Timer, and Add Friend Button */}
                    <View style={styles.videoTopOverlay}>
                      <View style={styles.videoTopInfoPill}>
                        <Text style={styles.videoTopPeerName} numberOfLines={1}>
                          {call.peer?.isPro ? '👑 ' : ''}{call.peer?.name || 'Srihari'}
                        </Text>
                        <View style={styles.videoTopTimerRow}>
                          <View style={styles.activeCallLiveTag}>
                            <Text style={styles.activeCallLiveTagText}>LIVE</Text>
                          </View>
                          <Text style={styles.videoTopTimerText}>
                            {formatCallTime(callDuration)}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleSendFriendRequest(call.peer)}
                        disabled={friendRequestSentInCall}
                        style={[styles.videoFriendBtn, friendRequestSentInCall && styles.videoFriendBtnSent]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={friendRequestSentInCall ? 'checkmark-circle' : 'person-add'}
                          size={14}
                          color="#FFFFFF"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.videoFriendBtnText}>
                          {friendRequestSentInCall ? 'Sent' : 'Add Friend'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Floating Local Video PiP (Picture-in-Picture) */}
                    <View style={styles.videoLocalPipWrapper}>
                      {cameraEnabled && localStream && localStream.getVideoTracks().length > 0 ? (
                        <CallVideo
                          stream={localStream}
                          label="You"
                          mirror={true}
                          style={styles.videoLocalPipStream}
                        />
                      ) : (
                        <View style={styles.videoLocalPipPlaceholder}>
                          <Ionicons name="videocam-off" size={24} color="#94A3B8" />
                          <Text style={styles.videoLocalPipOffText}>Camera Off</Text>
                        </View>
                      )}
                      {/* Flip Camera Button on PiP */}
                      <TouchableOpacity
                        onPress={async () => {
                          if (localStreamRef.current) {
                            try {
                              await switchCamera(localStreamRef.current);
                            } catch (e) {
                              console.warn('Switch camera error:', e);
                            }
                          }
                        }}
                        style={styles.videoPipFlipBtn}
                        activeOpacity={0.7}
                        accessibilityLabel="Flip camera"
                      >
                        <Ionicons name="camera-reverse" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      <View style={styles.videoPipLabelPill}>
                        <Text style={styles.videoPipLabelText}>You</Text>
                      </View>
                    </View>
                  </View>

                  {/* Bottom Video Floating Toolbar */}
                  <View style={styles.videoControlBar}>
                    {/* 1. Mute/Unmute Mic */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'}
                      onPress={toggleMicrophone}
                      style={styles.videoControlBtn}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.videoControlCircle, muted && styles.videoControlCircleActive]}>
                        <Ionicons name={muted ? 'mic-off' : 'mic'} size={22} color="#FFFFFF" />
                      </View>
                      <Text style={styles.videoControlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
                    </TouchableOpacity>

                    {/* 2. Camera On/Off */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                      onPress={() => {
                        const nextCamera = !cameraEnabled;
                        localStreamRef.current?.getVideoTracks().forEach((track) => {
                          track.enabled = nextCamera;
                        });
                        setCameraEnabled(nextCamera);
                      }}
                      style={styles.videoControlBtn}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.videoControlCircle, !cameraEnabled && styles.videoControlCircleActive]}>
                        <Ionicons name={cameraEnabled ? 'videocam' : 'videocam-off'} size={22} color="#FFFFFF" />
                      </View>
                      <Text style={styles.videoControlLabel}>{cameraEnabled ? 'Camera' : 'Cam Off'}</Text>
                    </TouchableOpacity>

                    {/* 3. Flip Camera */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Flip camera"
                      onPress={async () => {
                        if (localStreamRef.current) {
                          try {
                            await switchCamera(localStreamRef.current);
                          } catch (e) {
                            console.warn('Switch camera error:', e);
                          }
                        }
                      }}
                      style={styles.videoControlBtn}
                      activeOpacity={0.8}
                    >
                      <View style={styles.videoControlCircle}>
                        <Ionicons name="camera-reverse" size={22} color="#FFFFFF" />
                      </View>
                      <Text style={styles.videoControlLabel}>Flip</Text>
                    </TouchableOpacity>

                    {/* 4. Speaker */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Toggle speaker"
                      onPress={() => {
                        try {
                          const nextSpeaker = !speakerEnabled;
                          setAudioRoute(nextSpeaker);
                          setSpeakerEnabled(nextSpeaker);
                        } catch (error) {
                          setCallNotice(error.message || 'Speaker control unavailable.');
                        }
                      }}
                      style={styles.videoControlBtn}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.videoControlCircle, speakerEnabled && styles.videoControlCircleSpeaker]}>
                        <Ionicons name="volume-high" size={22} color="#FFFFFF" />
                      </View>
                      <Text style={styles.videoControlLabel}>Speaker</Text>
                    </TouchableOpacity>

                    {/* 5. Disconnect Call */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Disconnect video call"
                      onPress={() => {
                        endCall();
                      }}
                      style={styles.videoControlBtn}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.videoControlCircle, styles.videoControlCircleEnd]}>
                        <Ionicons name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
                      </View>
                      <Text style={styles.videoControlLabel}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* ================= AUDIO CALL SCREEN (IMAGE 3) ================= */
                <>
                {/* [🔴 REC] Top Recording Banner (Exact from Image 3) */}
                <View style={styles.recBannerBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={styles.recDot} />
                    <Text style={styles.recBannerText}>
                      [REC] Call may be recorded to ensure a quality experience
                    </Text>
                  </View>
                  {call.status === 'Connected' && (
                    <View style={styles.recBannerTimeBox}>
                      <Ionicons name="time-outline" size={13} color="#DC2626" style={{ marginRight: 3 }} />
                      <Text style={styles.recBannerTimeText}>{formatCallTime(callDuration)}</Text>
                    </View>
                  )}
                </View>

              {/* ================= ACTIVE CALL HEADER (EXACT MATCH TO REFERENCE IMAGE) ================= */}
              <View style={styles.refCallHeaderContainer}>
                {/* Left: User Profile (Oliver style from reference image) */}
                <View style={styles.refUserCol}>
                  <View style={styles.refAvatarWrapper}>
                    <Image
                      source={{
                        uri: avatarUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=Oliver&top=shortFlat&clothingColor=blue01',
                      }}
                      style={styles.refAvatarImg}
                    />
                  </View>
                  <Text style={styles.refUserName} numberOfLines={1}>{name || 'Oliver'}</Text>
                  <Text style={styles.refUserLevel}>Level : {level ? (String(level).includes('Level') ? String(level).replace(/Level\s*:\s*/i, '').trim() : String(level)) : '1'}</Text>
                </View>

                {/* Center: Live Timer + Action Buttons (00 : 52, Green Speaker, Red End Call) */}
                <View style={styles.refCenterCol}>
                  {/* Digital Timer (Exact match to 00 : 52 in reference image) */}
                  <Text style={styles.refTimerText}>
                    {call.status === 'Connected' ? formatCallTimeSpaced(callDuration) : '00 : 00'}
                  </Text>

                  {/* Action Buttons Row: Mute, Green Speaker, Red End Call */}
                  <View style={styles.refActionBtnRow}>
                    {/* Mute Button */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'}
                      onPress={toggleMicrophone}
                      style={[styles.refBtnCircle, muted ? styles.refMuteBtnActive : styles.refBtnMute]}
                      activeOpacity={0.75}
                    >
                      <Ionicons name={muted ? 'mic-off' : 'mic'} size={18} color={muted ? '#FFFFFF' : '#475569'} />
                    </TouchableOpacity>

                    {/* Green Speaker Button (Exact match from reference image) */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Toggle speaker"
                      onPress={() => {
                        try {
                          const nextSpeaker = !speakerEnabled;
                          setAudioRoute(nextSpeaker);
                          setSpeakerEnabled(nextSpeaker);
                        } catch (error) {
                          setCallNotice(error.message || 'Speaker control unavailable.');
                        }
                      }}
                      style={[styles.refBtnCircle, speakerEnabled ? styles.refSpeakerBtnOn : styles.refSpeakerBtnOff]}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="volume-high"
                        size={20}
                        color={speakerEnabled ? '#FFFFFF' : '#16A34A'}
                      />
                    </TouchableOpacity>

                    {/* Red End Call Button (Exact match from reference image) */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Disconnect call"
                      onPress={() => {
                        if (call.status !== 'Connected') {
                          endCall();
                        } else {
                          setShowEarlyDisconnectModal(true);
                        }
                      }}
                      style={styles.refEndCallBtn}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="call"
                        size={20}
                        color="#FFFFFF"
                        style={{ transform: [{ rotate: '135deg' }] }}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Right: Partner Profile (sarah style from reference image) */}
                <View style={styles.refUserCol}>
                  <View style={[styles.refAvatarWrapper, call.peer?.isPro && { borderColor: '#F59E0B', borderWidth: 2 }]}>
                    <Image
                      source={{
                        uri: call.peer?.profilePhotoUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + (call.peer?.name || 'sarah') + '&clothingColor=yellow',
                      }}
                      style={styles.refAvatarImg}
                    />
                  </View>
                  <Text style={styles.refUserName} numberOfLines={1}>
                    {call.peer?.isPro ? '👑 ' : ''}{call.peer?.name || 'sarah'}
                  </Text>
                  <Text style={styles.refUserLevel}>Level : {call.peer?.level ? (String(call.peer.level).includes('Level') ? String(call.peer.level).replace(/Level\s*:\s*/i, '').trim() : String(call.peer.level)) : '1'}</Text>
                </View>
              </View>

              {/* Sub-bar: You have X activities (Exact from reference image) */}
              <View style={styles.refActivitiesSubBar}>
                <Text style={styles.refActivitiesSubTitle}>
                  You have {CALL_ACTIVITIES.length} activities to practice together
                </Text>
              </View>

              {/* Partner Practice Stat Green Banner (Image 3) */}
              <View style={styles.partnerStatBanner}>
                <Ionicons name="call" size={14} color="#166534" style={{ marginRight: 6 }} />
                <Text style={styles.partnerStatText}>
                  {call.peer?.name || 'Srihari'} practices for an average of 4 minutes/call
                </Text>
              </View>

              {/* Remaining Time & Green Progress Bar (Image 3) */}
              <View style={styles.callRemainingTimeBox}>
                <Text style={styles.callRemainingTimeText}>
                  {isPaidSubscriber()
                    ? 'Unlimited PRO minutes for today’s call'
                    : `${String(Math.max(0, Math.floor((FREE_TRIAL_TOTAL_SECONDS - usedFreeSeconds) / 60))).padStart(2, '0')}:${String(Math.max(0, (FREE_TRIAL_TOTAL_SECONDS - usedFreeSeconds) % 60)).padStart(2, '0')} minutes remaining for today’s call`}
                </Text>
                <View style={styles.callProgressBarTrack}>
                  <View
                    style={[
                      styles.callProgressBarFill,
                      {
                        width: isPaidSubscriber()
                          ? '100%'
                          : `${Math.round(Math.max(0, 1 - (usedFreeSeconds / FREE_TRIAL_TOTAL_SECONDS)) * 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Quick Action: Send Friend Request during Call */}
              <TouchableOpacity
                onPress={() => handleSendFriendRequest(call.peer)}
                disabled={friendRequestSentInCall}
                style={[styles.inCallAddFriendBtn, friendRequestSentInCall && styles.inCallAddFriendBtnSent]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={friendRequestSentInCall ? 'checkmark-circle' : 'person-add'}
                  size={15}
                  color={friendRequestSentInCall ? '#166534' : '#6366F1'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.inCallAddFriendText, friendRequestSentInCall && { color: '#166534' }]}>
                  {friendRequestSentInCall ? 'Friend Request Sent' : `Send Friend Request to ${call.peer?.name || 'Co-learner'}`}
                </Text>
              </TouchableOpacity>

              {/* Scrollable Conversation Activities */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.activitiesScrollContainer}
              >
                <View style={styles.activitiesHeadingArea}>
                  <Text style={styles.activitiesHeadingTitle}>Conversation Prompts</Text>
                  <Text style={styles.activitiesHeadingSub}>
                    Tap any topic card to practice speaking together
                  </Text>
                </View>

                {/* 6 Activities Grid */}
                <View style={styles.activitiesGrid}>
                  {CALL_ACTIVITIES.map((act) => (
                    <TouchableOpacity
                      key={act.id}
                      onPress={() => {
                        setActiveCallActivity(act);
                        setCallActivityPromptIdx(0);
                      }}
                      style={[
                        styles.activityCard,
                        {
                          backgroundColor: act.bgColor,
                          borderColor: act.borderColor,
                        },
                      ]}
                      activeOpacity={0.78}
                    >
                      <Text style={styles.activityCardEmoji}>{act.emoji}</Text>
                      <Text style={[styles.activityCardTitle, { color: act.textColor }]}>
                        {act.title}
                      </Text>
                      <Text
                        style={[styles.activityCardSub, { color: act.subColor }]}
                        numberOfLines={1}
                      >
                        {act.subtitle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* ================= EARLY DISCONNECT MODAL (EXACT MATCH TO IMAGE 1) ================= */}
              <Modal
                visible={showEarlyDisconnectModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowEarlyDisconnectModal(false)}
              >
                <View style={styles.earlyDisconnectOverlay}>
                  <View style={styles.earlyDisconnectSheet}>
                    {/* Red Top Warning Banner (Image 1) */}
                    <View style={styles.earlyWarningBanner}>
                      <Text style={{ fontSize: 18, marginRight: 8 }}>✋</Text>
                      <Text style={styles.earlyWarningText}>
                        Disconnecting calls early may get you banned
                      </Text>
                    </View>

                    <View style={styles.earlyDisconnectBody}>
                      <Text style={styles.earlyDisconnectTitle}>Don’t leave so soon! 🥺</Text>
                      <Text style={styles.earlyDisconnectSub}>
                        State the reason for disconnecting below
                      </Text>

                      {/* 4 Radio Reasons */}
                      {[
                        'Not interested in talking to this Co-learner',
                        'Network issues/voice not clear',
                        'Co-learner is not speaking',
                        'Rude/misbehaving/inappropriate behaviour',
                      ].map((reason) => (
                        <TouchableOpacity
                          key={reason}
                          onPress={() => setDisconnectReason(reason)}
                          style={styles.earlyReasonRow}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.earlyRadioCircle, disconnectReason === reason && styles.earlyRadioCircleActive]}>
                            {disconnectReason === reason && <View style={styles.earlyRadioDot} />}
                          </View>
                          <Text style={styles.earlyReasonText}>{reason}</Text>
                        </TouchableOpacity>
                      ))}

                      {/* Action Buttons: End call | Continue call */}
                      <View style={styles.earlyActionsRow}>
                        <TouchableOpacity
                          onPress={() => {
                            setShowEarlyDisconnectModal(false);
                            endCall();
                          }}
                          style={styles.earlyEndBtn}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.earlyEndBtnText}>Disconnect Call</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setShowEarlyDisconnectModal(false)}
                          style={styles.earlyContinueBtn}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.earlyContinueBtnText}>Continue call</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </Modal>

              {/* Interactive In-Call Activity Prompt Modal */}
              <Modal
                visible={Boolean(activeCallActivity)}
                transparent
                animationType="slide"
                onRequestClose={() => setActiveCallActivity(null)}
              >
                <View style={styles.activityModalOverlay}>
                  <View style={styles.activityModalSheet}>
                    {activeCallActivity && (
                      <>
                        <View style={styles.activityModalHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 24 }}>{activeCallActivity.emoji}</Text>
                            <Text style={styles.activityModalTitle}>
                              {activeCallActivity.title}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => setActiveCallActivity(null)} style={{ padding: 4 }}>
                            <Ionicons name="close" size={20} color="#64748B" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.activityPromptBox}>
                          <Text style={styles.activityPromptText}>
                            "{activeCallActivity.prompts[callActivityPromptIdx]}"
                          </Text>
                          
                        </View>

                        <Text style={styles.activityVocabTitle}>Helpful vocabulary to use:</Text>
                        <View style={styles.activityVocabRow}>
                          {activeCallActivity.vocab.map((v, i) => (
                            <View key={i} style={styles.activityVocabChip}>
                              <Text style={styles.activityVocabText}>{v}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.activityModalButtons}>
                          <TouchableOpacity
                            onPress={() => {
                              const nextIdx = (callActivityPromptIdx + 1) % activeCallActivity.prompts.length;
                              setCallActivityPromptIdx(nextIdx);
                            }}
                            style={styles.activityNextBtn}
                          >
                            <Ionicons name="shuffle" size={18} color="#FFFFFF" />
                            <Text style={styles.activityNextBtnText}>Next Question</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              stopSpeech();
                              setActiveCallActivity(null);
                            }}
                            style={styles.activityDoneBtn}
                          >
                            <Text style={styles.activityDoneBtnText}>Done</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </Modal>
                </>
              )}
            </View>
            )
          )}

          {/* Top Banner for Incoming Call when user is on other screens */}
          {call && call.direction === 'incoming' && (call.status === 'Ringing' || call.status === 'Calling') && !callCompletion && screen !== 'call' && screen !== 'call-complete' && (
            <View style={styles.incomingCallTopBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                <Image
                  source={{
                    uri: call.peer?.profilePhotoUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + (call.peer?.name || 'Learner'),
                  }}
                  style={styles.incomingBannerAvatar}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.incomingBannerName} numberOfLines={1}>{call.peer?.name || 'Co-learner'}</Text>
                  <Text style={styles.incomingBannerSub}>Incoming {call.type === 'video' ? 'video' : 'voice'} call...</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  onPress={rejectCall}
                  style={styles.bannerDeclineBtn}
                  activeOpacity={0.8}
                  accessibilityLabel="Disconnect incoming call"
                >
                  <Ionicons name="call" size={18} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={acceptCall}
                  style={styles.bannerAcceptBtn}
                  activeOpacity={0.8}
                  accessibilityLabel="Accept incoming call"
                >
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {screen === 'practiceSession' && (
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 30 }}>
              <Header title={practiceTopic.title} subtitle={`Practice in ${learningLanguage || 'your learning language'}`} onBack={openPractice} />
              {practiceMode === 'searching' ? (
                <View style={styles.practiceEmptyState}>
                  <ActivityIndicator color={orange} />
                  <Txt size={16} bold style={{ marginTop: 14 }}>Searching for a real partner…</Txt>
                  <Txt color={muted} size={13} style={{ textAlign: 'center', marginTop: 6 }}>We are checking online registered users who match your topic and level.</Txt>
                </View>
              ) : practiceMode === 'none' ? (
                <View style={styles.practiceEmptyState}>
                  <Ionicons name="people-outline" size={52} color={orange} />
                  <Txt size={20} bold style={{ marginTop: 12, textAlign: 'center' }}>No partner available right now!</Txt>
                  <Txt color={muted} size={13} style={{ textAlign: 'center', marginTop: 8, lineHeight: 20 }}>Don't worry! You can practice your speaking skills with our AI conversation partner.</Txt>
                  {practiceSearchError ? <Txt color={COLORS.error} size={12} style={{ textAlign: 'center', marginTop: 10 }}>{practiceSearchError}</Txt> : null}
                  <Btn label={aiLoading ? 'Starting AI…' : 'Talk with AI'} onPress={async () => { const started = await startAiPractice(); if (started) setScreen('aiPractice'); }} loading={aiLoading} style={{ marginTop: 20 }} />
                  <Btn label="Search Again" outline onPress={() => beginPracticeTopic(practiceTopic)} style={{ marginTop: 10 }} />
                </View>
              ) : practiceMode === 'real' ? (
                <View style={styles.practiceEmptyState}>
                  <Ionicons name="person-circle-outline" size={58} color={orange} />
                  <Txt size={19} bold style={{ marginTop: 10 }}>Partner available</Txt>
                  <Txt size={15} color={navy} bold style={{ marginTop: 8 }}>{practicePartner?.displayName || practicePartner?.name}</Txt>
                  <Txt color={muted} size={13} style={{ textAlign: 'center', marginTop: 5 }}>Connected and ready to practice {practiceTopic.title}.</Txt>
                  <Btn
                    label={practiceConnectionMode === 'call' ? 'Start voice call' : 'Start chat'}
                    onPress={() => practiceConnectionMode === 'call'
                      ? startCall(practicePartner, 'audio')
                      : openConversation(practicePartner)}
                    style={{ marginTop: 18 }}
                  />
                  <Btn
                    label={practiceConnectionMode === 'call' ? 'Chat instead' : 'Voice call instead'}
                    outline
                    onPress={() => practiceConnectionMode === 'call'
                      ? openConversation(practicePartner)
                      : startCall(practicePartner, 'audio')}
                    style={{ marginTop: 10 }}
                  />
                  <Btn label="Search Again" outline onPress={() => beginPracticeTopic(practiceTopic, practiceConnectionMode)} style={{ marginTop: 10 }} />
                </View>
              ) : practiceStep === 'exercise' ? (
                <>
                  <View style={styles.practicePromptCard}>
                    <Txt size={12} color={orange} bold>QUICK EXERCISE</Txt>
                    <Txt size={19} bold style={{ marginTop: 10, lineHeight: 27 }}>{practiceTopic.prompt}</Txt>
                  </View>
                  {practiceTopic.options.map((option) => (
                    <TouchableOpacity
                      key={option}
                      accessibilityRole="button"
                      onPress={() => setPracticeAnswer(option)}
                      style={[styles.practiceOption, practiceAnswer === option && styles.practiceOptionSelected]}
                    >
                      <Ionicons name={practiceAnswer === option ? 'checkmark-circle' : 'ellipse-outline'} size={21} color={practiceAnswer === option ? orange : muted} />
                      <Txt size={14} color={practiceAnswer === option ? orange : navy} bold={practiceAnswer === option} style={{ flex: 1 }}>{option}</Txt>
                    </TouchableOpacity>
                  ))}
                  <Btn
                    label="Check answer"
                    disabled={!practiceAnswer}
                    onPress={() => {
                      if (practiceAnswer === practiceTopic.answer) completePractice();
                      else Alert.alert('Keep trying', 'Review the phrases and choose the best answer.');
                    }}
                    style={{ marginTop: 8 }}
                  />
                </>
              ) : (
                <>
                  <View style={styles.practiceCompleteCard}>
                    <Ionicons name="checkmark-circle" size={54} color={COLORS.success} />
                    <Txt size={21} bold style={{ marginTop: 12 }}>Great practice!</Txt>
                    <Txt color={muted} size={13} style={{ textAlign: 'center', marginTop: 8 }}>
                      You completed {practiceTopic.title}. Keep going to build your daily streak.
                    </Txt>
                  </View>
                  <Txt size={17} bold style={{ marginBottom: 10 }}>Useful phrases</Txt>
                  {practiceTopic.phrases.map((phrase) => <View key={phrase} style={styles.phraseRow}><Ionicons name="chatbubble-ellipses-outline" size={18} color={orange} /><Txt size={14} style={{ flex: 1 }}>{phrase}</Txt></View>)}
                  <Txt size={17} bold style={{ marginTop: 16, marginBottom: 10 }}>Vocabulary</Txt>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {practiceTopic.vocabulary.map((item) => <View key={item} style={styles.vocabularyChip}><Txt size={12} color={orange} bold>{item}</Txt></View>)}
                  </View>
                  <Btn label="Practice another topic" outline onPress={openPractice} style={{ marginTop: 20 }} />
                  <Btn label="Find a practice partner" onPress={() => setScreen('discover')} style={{ marginTop: 10 }} />
                </>
              )}
            </ScrollView>
          )}

          {screen === 'aiPractice' && (
            <View style={styles.aiPracticeScreen}>
              {/* Header */}
              <View style={styles.aiHeaderContainer}>
                <TouchableOpacity
                  onPress={() => {
                    stopSpeech();
                    setAiSession(null);
                    setAiCompletion(null);
                    setActiveBottomTab('home');
                    setScreen('home');
                  }}
                  style={styles.aiBackButton}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  accessibilityRole="button"
                  accessibilityLabel="Back to practice topics"
                >
                  <Ionicons name="arrow-back" size={24} color={navy} />
                </TouchableOpacity>

                <View style={styles.aiHeaderTitleSection}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={styles.aiAvatarSmall}>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    </View>
                    <Txt size={16} bold>BYTALK AI Partner</Txt>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#168653' }} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <View style={styles.aiHeaderBadge}>
                      <Txt size={11} color={orange} bold>{practiceTopic.title}</Txt>
                    </View>
                    <View style={styles.aiHeaderBadge}>
                      <Txt size={11} color={muted}>{learningLanguage || 'English'} · {level || 'Beginner'}</Txt>
                    </View>
                    <View style={[styles.aiHeaderBadge, aiPracticeIsPro && styles.aiProCreditBadge]}>
                      <Txt size={10} color={aiPracticeIsPro ? '#047857' : '#6D28D9'} bold>
                        {aiPracticeIsPro ? 'Unlimited' : `${aiFreeCreditsRemaining}/${AI_FREE_MESSAGE_LIMIT} credits`}
                      </Txt>
                    </View>
                  </View>
                </View>

                {!aiCompletion && (
                  <TouchableOpacity
                    onPress={endAiPractice}
                    style={styles.aiEndSessionBtn}
                    accessibilityRole="button"
                    accessibilityLabel="End practice session"
                  >
                    <Txt size={12} color={COLORS.error} bold>End Practice</Txt>
                  </TouchableOpacity>
                )}
              </View>

              {aiCompletion ? (
                /* End Practice Completion Screen */
                <ScrollView contentContainerStyle={styles.aiCompletionContainer}>
                  <View style={styles.aiCompletionCard}>
                    <Txt size={44}>🎉</Txt>
                    <Txt size={24} bold style={{ marginTop: 10 }}>Great Job!</Txt>
                    <Txt color={muted} size={14} style={{ textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                      You completed an AI conversation session on <Txt bold color={navy}>{aiCompletion.topic || practiceTopic.title}</Txt> in <Txt bold color={orange}>{aiCompletion.language || learningLanguage}</Txt>.
                    </Txt>

                    {/* Stats Grid */}
                    <View style={styles.aiStatsGrid}>
                      <View style={styles.aiStatBox}>
                        <Txt size={20} bold color={orange}>
                          {String(Math.floor((aiCompletion.durationSeconds || 0) / 60)).padStart(2, '0')}:{String((aiCompletion.durationSeconds || 0) % 60).padStart(2, '0')}
                        </Txt>
                        <Txt size={11} color={muted} style={{ marginTop: 4 }}>Duration</Txt>
                      </View>
                      <View style={styles.aiStatBox}>
                        <Txt size={20} bold color={orange}>{aiCompletion.messageCount || aiMessages.length}</Txt>
                        <Txt size={11} color={muted} style={{ marginTop: 4 }}>Messages</Txt>
                      </View>
                      <View style={styles.aiStatBox}>
                        <Txt size={14} bold color={navy} numberOfLines={1}>{aiCompletion.level || level}</Txt>
                        <Txt size={11} color={muted} style={{ marginTop: 4 }}>Proficiency</Txt>
                      </View>
                    </View>

                    {/* Feedback Rating */}
                    <View style={styles.aiRatingSection}>
                      <Txt size={15} bold style={{ textAlign: 'center', marginBottom: 10 }}>
                        How was your conversation?
                      </Txt>
                      {aiFeedbackSubmitted ? (
                        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                          <Ionicons name="checkmark-circle" size={32} color="#168653" />
                          <Txt color="#168653" bold size={14} style={{ marginTop: 6 }}>Thank you for your feedback!</Txt>
                        </View>
                      ) : (
                        <>
                          <View style={styles.aiStarsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity
                                key={star}
                                onPress={() => setAiRating(star)}
                                accessibilityRole="button"
                                accessibilityLabel={`Rate ${star} stars`}
                                style={{ padding: 6 }}
                              >
                                <Ionicons
                                  name={star <= aiRating ? 'star' : 'star-outline'}
                                  size={32}
                                  color={star <= aiRating ? '#F59E0B' : '#D1D5DB'}
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                          <TextInput
                            value={aiFeedback}
                            onChangeText={setAiFeedback}
                            placeholder="Optional written feedback or note..."
                            placeholderTextColor="#9CA3AF"
                            maxLength={500}
                            style={styles.aiFeedbackInput}
                          />
                          <Btn
                            label={aiFeedbackSubmitting ? 'Saving...' : 'Submit Rating'}
                            outline
                            onPress={submitAiFeedback}
                            disabled={aiFeedbackSubmitting || !aiRating}
                            style={{ marginTop: 10, paddingVertical: 10 }}
                          />
                        </>
                      )}
                    </View>

                    {/* Actions */}
                    <Btn
                      label="Practice Another Topic"
                      onPress={() => {
                        setAiCompletion(null);
                        setAiMessages([]);
                        setActiveBottomTab('home');
                        setScreen('home');
                      }}
                      style={{ marginTop: 16, width: '100%' }}
                    />
                    <Btn
                      label="Find a Human Partner"
                      outline
                      onPress={() => {
                        setAiCompletion(null);
                        setAiMessages([]);
                        setActiveBottomTab('call');
                        setScreen('call-tab');
                      }}
                      style={{ marginTop: 10, width: '100%' }}
                    />
                  </View>
                </ScrollView>
              ) : (
                /* Chat Conversation Screen */
                <>
                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Topic guidance banner */}
                    <View style={styles.aiTopicBanner}>
                      <Ionicons name="bulb-outline" size={18} color={orange} style={{ marginRight: 8 }} />
                      <Txt size={12} color={navy} style={{ flex: 1, lineHeight: 18 }}>
                        Practicing <Txt bold color={orange}>{practiceTopic.title}</Txt> in <Txt bold color={navy}>{learningLanguage}</Txt> ({level} level). Speak or type your messages!
                      </Txt>
                    </View>
                    {aiFreeLimitReached && (
                      <TouchableOpacity
                        onPress={() => setShowAiCreditsModal(true)}
                        style={styles.aiCreditsNotice}
                        accessibilityRole="button"
                        accessibilityLabel="View plans to continue AI practice"
                      >
                        <Ionicons name="lock-closed" size={15} color="#7C3AED" />
                        <Txt size={12} color="#5B21B6" bold style={{ flex: 1 }}>
                          Your 5 free AI credits are used. View plans to continue.
                        </Txt>
                        <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
                      </TouchableOpacity>
                    )}

                    {/* Message bubbles */}
                    {aiMessages.map((message, index) => {
                      const isAi = message.role === 'assistant' || message.role === 'model';
                      const formattedTime = message.timestamp
                        ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <View
                          key={`msg-${index}`}
                          style={[
                            styles.aiMessageRow,
                            isAi ? styles.aiMessageRowLeft : styles.aiMessageRowRight,
                          ]}
                        >
                          {isAi && (
                            <View style={styles.aiBubbleAvatar}>
                              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                            </View>
                          )}
                          <View
                            style={[
                              styles.aiMessageBubble,
                              isAi ? styles.aiAssistantBubble : styles.aiUserBubble,
                            ]}
                          >
                            <Txt
                              color={isAi ? navy : '#FFFFFF'}
                              size={14}
                              style={{ lineHeight: 21 }}
                            >
                              {message.content}
                            </Txt>
                            <View style={styles.aiMessageMetaRow}>
                              {formattedTime ? (
                                <Txt size={10} color={isAi ? muted : '#FFE0D3'}>
                                  {formattedTime}
                                </Txt>
                              ) : null}
                              {isAi && (
                                <TouchableOpacity
                                  onPress={() => toggleMessageSpeech(message.content, index)}
                                  style={styles.aiAudioButton}
                                  accessibilityRole="button"
                                  accessibilityLabel="Play audio"
                                >
                                  <Ionicons
                                    name={speakingMessageIndex === index ? 'volume-high' : 'volume-medium-outline'}
                                    size={16}
                                    color={speakingMessageIndex === index ? orange : muted}
                                  />
                                  {speakingMessageIndex === index && (
                                    <Txt size={10} color={orange} bold style={{ marginLeft: 3 }}>
                                      Speaking...
                                    </Txt>
                                  )}
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })}

                    {/* Typing indicator */}
                    {aiLoading && (
                      <View style={[styles.aiMessageRow, styles.aiMessageRowLeft]}>
                        <View style={styles.aiBubbleAvatar}>
                          <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                        </View>
                        <View style={[styles.aiMessageBubble, styles.aiAssistantBubble, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                          <ActivityIndicator size="small" color={orange} />
                          <Txt size={13} color={muted} italic>BYTALK AI is thinking...</Txt>
                        </View>
                      </View>
                    )}

                    {/* Error display */}
                    {aiError ? (
                      <View style={styles.aiErrorCard}>
                        <Ionicons name="alert-circle" size={20} color={COLORS.error} style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Txt size={13} color={COLORS.error} bold>Connection Error</Txt>
                          <Txt size={12} color={COLORS.error} style={{ marginTop: 2, lineHeight: 17 }}>{aiError}</Txt>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            if (aiMessages.length === 0) startAiPractice(practiceTopic);
                            else sendAiMessage();
                          }}
                          style={styles.aiRetryButton}
                        >
                          <Txt size={12} color={orange} bold>Retry</Txt>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </ScrollView>

                  {/* Input Composer */}
                  <View style={styles.aiComposer}>
                    <TouchableOpacity
                      onPress={startSpeechRecognition}
                      disabled={aiFreeLimitReached}
                      style={[styles.aiMicButton, listeningForSpeech && styles.aiMicButtonActive]}
                      accessibilityRole="button"
                      accessibilityLabel="Voice speech to text"
                    >
                      <Ionicons
                        name={listeningForSpeech ? 'mic' : 'mic-outline'}
                        size={22}
                        color={listeningForSpeech ? '#FFFFFF' : orange}
                      />
                    </TouchableOpacity>

                    <TextInput
                      value={aiDraft}
                      onChangeText={setAiDraft}
                      placeholder={`Say something in ${learningLanguage || 'English'}...`}
                      placeholderTextColor="#9CA3AF"
                      multiline
                      maxLength={1500}
                      editable={!aiFreeLimitReached}
                      style={styles.aiInput}
                    />

                    <TouchableOpacity
                      onPress={sendAiMessage}
                      disabled={aiLoading || !aiDraft.trim() || aiFreeLimitReached}
                      style={[styles.aiSendButton, (!aiDraft.trim() || aiLoading || aiFreeLimitReached) && { opacity: 0.5 }]}
                      accessibilityRole="button"
                      accessibilityLabel="Send message"
                    >
                      {aiLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="send" size={17} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}

          {screen === 'premium' && (
            <ProSubscriptionScreen
              user={{ displayName: name || 'BYTALK Learner', email: email || 'learner@bytalk.app' }}
              onBack={() => {
                setActiveBottomTab('home');
                setScreen('home');
              }}
              isPro={subscription?.plan?.id === 'pro' || subscription?.plan?.id === 'plus' || subscription?.active === true}
              onRequest={request}
              activeAuthToken={activeAuthToken}
              apiBase={API}
              activeBottomTab={activeBottomTab}
              plans={subscriptionPlans}
              onPurchaseSuccess={(plan, updatedSub) => {
                if (updatedSub) {
                  setSubscription(updatedSub);
                } else {
                  setSubscription({
                    plan: { id: 'pro', name: plan?.duration || 'PRO' },
                    status: 'active',
                    active: true,
                    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                  });
                }
                loadSubscription().catch(() => {});
                setActiveBottomTab('home');
                setScreen('home');
              }}
            />
          )}

          {screen === 'settings' && (
            <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 36 }}>
              <Header title="Settings" subtitle="Personalize your BYTALK experience." onBack={() => setScreen('profile')} />
              {settingsLoading ? <ActivityIndicator color={orange} style={{ margin: 20 }} /> : null}
              {settingsError ? <Txt color={COLORS.error} size={12} style={{ marginBottom: 12 }}>{settingsError}</Txt> : null}
              {settings ? (
                <>
                  <Section title="Personal Preferences">
                    <Txt size={13} bold style={{ marginBottom: 8 }}>Learning language</Txt>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                      {LANGUAGES.slice(0, 12).map((language) => (
                        <TouchableOpacity key={language} onPress={() => updateSettings({ learningLanguage: language })} style={[styles.settingsChoice, settings.learningLanguage === language && styles.settingsChoiceSelected]}>
                          <Txt size={12} color={settings.learningLanguage === language ? orange : muted} bold={settings.learningLanguage === language}>{language}</Txt>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Txt size={13} bold style={{ marginBottom: 8 }}>Speaking level</Txt>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {['Beginner', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced', 'Fluent'].map((item) => (
                        <TouchableOpacity key={item} onPress={() => updateSettings({ level: item })} style={[styles.settingsChoice, settings.level === item && styles.settingsChoiceSelected]}>
                          <Txt size={12} color={settings.level === item ? orange : muted} bold={settings.level === item}>{item}</Txt>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Txt size={12} color={muted} style={{ marginTop: 10 }}>Interface language: English (additional translations are not enabled yet).</Txt>
                  </Section>
                  <Section title="Notifications">
                    {[
                      ['push', 'Push notifications'],
                      ['messages', 'Message notifications'],
                      ['incomingCalls', 'Incoming call notifications'],
                      ['missedCalls', 'Missed call notifications'],
                      ['practiceReminders', 'Practice reminders'],
                      ['subscriptions', 'Subscription notifications'],
                    ].map(([key, label]) => (
                      <View key={key} style={styles.settingsRow}>
                        <Txt size={14} style={{ flex: 1 }}>{label}</Txt>
                        <Switch value={Boolean(settings.notificationPreferences?.[key])} onValueChange={(value) => updateSettings({ notificationPreferences: { [key]: value } })} trackColor={{ false: '#D1D5DB', true: '#FFB39B' }} thumbColor={orange} />
                      </View>
                    ))}
                  </Section>
                  <Section title="Privacy and Safety">
                    <View style={styles.settingsRow}>
                      <View style={{ flex: 1 }}><Txt size={14}>Silence Mode</Txt><Txt size={11} color={muted}>Suppress non-essential sounds and notifications.</Txt></View>
                      <Switch value={Boolean(settings.silenceMode)} onValueChange={(value) => updateSettings({ silenceMode: value })} trackColor={{ false: '#D1D5DB', true: '#FFB39B' }} thumbColor={orange} />
                    </View>
                    <Txt size={13} bold style={{ marginVertical: 10 }}>Blocked users</Txt>
                    {settings.blockedUsers?.length ? settings.blockedUsers.map((blocked) => (
                      <View key={blocked.id} style={styles.settingsRow}>
                        <Txt size={14} style={{ flex: 1 }}>{blocked.name}</Txt>
                        <TouchableOpacity onPress={() => unblockUser(blocked)}><Txt color={orange} size={12} bold>Unblock</Txt></TouchableOpacity>
                      </View>
                    )) : <Txt size={12} color={muted}>You have not blocked anyone.</Txt>}
                  </Section>
                  <Section title="Appearance and Audio">
                    <Txt size={13} bold style={{ marginBottom: 8 }}>Appearance</Txt>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      {['light', 'system'].map((item) => <TouchableOpacity key={item} onPress={() => updateSettings({ appearance: item })} style={[styles.settingsChoice, settings.appearance === item && styles.settingsChoiceSelected]}><Txt size={12} color={settings.appearance === item ? orange : muted}>{item}</Txt></TouchableOpacity>)}
                    </View>
                    <Txt size={11} color={muted}>Dark mode is not exposed because the existing BYTALK theme does not yet support a complete dark palette.</Txt>
                    <Txt size={12} color={muted}>Text size: {Math.round((settings.textScale || 1) * 100)}%</Txt>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      {[0.9, 1, 1.1, 1.25].map((scale) => <TouchableOpacity key={scale} onPress={() => updateSettings({ textScale: scale })} style={styles.settingsChoice}><Txt size={12} color={orange}>{Math.round(scale * 100)}%</Txt></TouchableOpacity>)}
                    </View>
                    {Platform.OS !== 'web' ? (
                      <>
                        <Txt size={12} bold style={{ marginTop: 12, marginBottom: 8 }}>Audio manager preference</Txt>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {['system', 'speaker', 'earpiece'].map((manager) => <TouchableOpacity key={manager} onPress={() => updateSettings({ audioPreferences: { manager } })} style={[styles.settingsChoice, settings.audioPreferences?.manager === manager && styles.settingsChoiceSelected]}><Txt size={12} color={settings.audioPreferences?.manager === manager ? orange : muted}>{manager}</Txt></TouchableOpacity>)}
                        </View>
                        <Txt size={12} color={muted} style={{ marginTop: 12 }}>Hardware audio controls are device-dependent and may require restart.</Txt>
                        {['echoCanceller', 'noiseSuppressor'].map((key) => <View key={key} style={styles.settingsRow}><Txt size={14} style={{ flex: 1 }}>{key === 'echoCanceller' ? 'Acoustic echo canceller' : 'Noise suppressor'}</Txt><Switch value={Boolean(settings.audioPreferences?.[key])} onValueChange={(value) => updateSettings({ audioPreferences: { [key]: value } })} trackColor={{ false: '#D1D5DB', true: '#FFB39B' }} thumbColor={orange} /></View>)}
                      </>
                    ) : <Txt size={12} color={muted} style={{ marginTop: 12 }}>Hardware audio controls are not available in the web browser.</Txt>}
                  </Section>
                  <Section title="Subscription">
                    <Txt size={14}>Current plan: <Txt bold color={orange}>{settings.subscription?.plan?.name || 'Free'}</Txt></Txt>
                    <Btn label="View available plans" outline onPress={openSubscription} style={{ marginTop: 12 }} />
                    <Btn label="Restore purchase" outline onPress={restoreSubscription} disabled={subscriptionBusy} style={{ marginTop: 10 }} />
                  </Section>
                  <TouchableOpacity style={styles.settingsLinkRow} onPress={() => { setManageAccountError(''); setScreen('manage-account'); }}><Ionicons name="person-circle-outline" size={20} color={orange} /><Txt size={14} style={{ flex: 1, marginLeft: 10 }}>Manage Account</Txt><Ionicons name="chevron-forward" size={18} color={muted} /></TouchableOpacity>
                  <TouchableOpacity style={styles.settingsLinkRow} onPress={() => setScreen('legal-terms')}><Ionicons name="document-text-outline" size={20} color={orange} /><Txt size={14} style={{ flex: 1, marginLeft: 10 }}>Terms of Service</Txt><Ionicons name="chevron-forward" size={18} color={muted} /></TouchableOpacity>
                  <TouchableOpacity style={styles.settingsLinkRow} onPress={() => setScreen('legal-privacy')}><Ionicons name="shield-checkmark-outline" size={20} color={orange} /><Txt size={14} style={{ flex: 1, marginLeft: 10 }}>Privacy Policy</Txt><Ionicons name="chevron-forward" size={18} color={muted} /></TouchableOpacity>
                </>
              ) : null}
            </ScrollView>
          )}

          {screen === 'manage-account' && (
            <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 36 }}>
              <Header title="Manage Account" subtitle="Manage access to your BYTALK account." onBack={() => setScreen('settings')} />
              {manageAccountError ? <Txt color={COLORS.error} size={12} style={{ marginBottom: 12 }}>{manageAccountError}</Txt> : null}
              <Btn label={logoutBusy ? 'Signing out...' : 'Log out'} outline loading={logoutBusy} disabled={logoutBusy} onPress={handleLogout} style={{ marginBottom: 12 }} />
              <Btn label="Log out from all devices" outline onPress={() => Alert.alert('Log out everywhere?', 'All existing sessions will be invalidated.', [{ text: 'Cancel' }, { text: 'Continue', onPress: logoutAllDevices }])} style={{ marginBottom: 12 }} />
              <Btn label="Download personal data" outline onPress={exportAccountData} style={{ marginBottom: 12 }} />
              <Txt size={12} color={muted} style={{ marginBottom: 8 }}>Re-enter your BYTALK password before deleting your account. Google-linked account support is not configured in this build.</Txt>
              <TextInput value={accountPassword} onChangeText={setAccountPassword} placeholder="Current password" placeholderTextColor="#9CA3AF" secureTextEntry style={styles.feedbackInput} />
              <Btn label="Delete account" outline disabled={!accountPassword} onPress={() => Alert.alert('Delete account?', 'This permanently deletes your account, messages, and call history.', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: deleteAccount }])} />
            </ScrollView>
          )}

          {screen === 'legal-terms' && (
            <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 36 }}><Header title="Terms of Service" onBack={() => setScreen('settings')} /><Txt size={13} color={muted} style={{ lineHeight: 21 }}>BYTALK provides language practice, messaging, and calling features. Use the service lawfully and respectfully. Do not harass, impersonate, abuse, or misuse the service. Calls and messages are between participants, and features may depend on device and subscription availability. BYTALK may restrict accounts that violate these terms. Contact the BYTALK team for the approved current terms before publishing this screen as a legal notice.</Txt></ScrollView>
          )}

          {screen === 'legal-privacy' && (
            <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 36 }}><Header title="Privacy Policy" onBack={() => setScreen('settings')} /><Txt size={13} color={muted} style={{ lineHeight: 21 }}>BYTALK stores account profile information, preferences, messages, call history, and subscription entitlement information to provide the service. Authenticated access controls limit account data to its owner. Messages and call history are retained according to the service configuration. Do not publish this summary as the approved privacy policy until it has been reviewed and replaced with the current legal policy.</Txt></ScrollView>
          )}

          {/* SCREEN GUARDIAN: NEVER SHOW WHITE BLANK SCREEN */}
          {![
            'welcome', 'login', 'register', 'onboard', 'level',
            'home', 'learn', 'call-tab', 'profile', 'discover',
            'messages', 'chat', 'premium', 'practice', 'practiceSession',
            'aiPractice', 'settings', 'manage-account', 'legal-terms', 'legal-privacy',
            'dashboard',
          ].includes(screen) && !(screen === 'call' && call) && !(screen === 'call-complete' && callCompletion) && (
            <AryaHomeScreen
              user={{ displayName: name, streak }}
              onSelectTopic={(topic, mode) => handleHomeTopicSelection(topic, mode)}
              onPressGetPro={() => {
                setActiveBottomTab('pro');
                setScreen('premium');
              }}
              onPressHistory={() => setShowHistoryModal(true)}
              isPro={aiPracticeIsPro}
              freeCreditsRemaining={aiFreeCreditsRemaining}
            />
          )}

          {/* SCREEN 9: LEARNING DASHBOARD */}
          {screen === 'dashboard' && (
            <ScrollView contentContainerStyle={{ padding: 22 }}>
              <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 20 }}>
                <Txt size={52}>👨🏽‍💻</Txt>
                <Txt size={20} bold style={{ marginTop: 6 }}>{name}</Txt>
                <Txt color={muted} size={13}>Profile · {country}</Txt>
              </View>
              <View style={styles.statsCard}>
                {[
                  ['🔥', '12', 'day streak'],
                  ['🕒', '180', 'speaking mins'],
                  ['⭐', String(28 + vocab.length), 'new words'],
                ].map(([emoji, n, label]) => (
                  <View key={label} style={{ alignItems: 'center' }}>
                    <Txt size={20}>{emoji} {n}</Txt>
                    <Txt size={11} color={muted} style={{ marginTop: 4 }}>{label}</Txt>
                  </View>
                ))}
              </View>
              <Section title="Your progress">
                <View style={{ backgroundColor: COLORS.lightBg, borderRadius: 15, padding: 18, borderColor: '#FFDDCF', borderWidth: 1 }}>
                  <Txt size={20} bold color={orange}>75% speaking goal</Txt>
                  <Txt size={13} color={muted} style={{ marginTop: 4 }}>150 / 200 minutes this week</Txt>
                  <View style={{ marginTop: 14, height: 8, borderRadius: 8, backgroundColor: '#FFD6C7' }}>
                    <View style={{ width: '75%', backgroundColor: orange, height: 8, borderRadius: 8 }} />
                  </View>
                </View>
              </Section>
              <Section title="Saved vocabulary">
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={word}
                    onChangeText={setWord}
                    placeholder="Add new vocabulary..."
                    placeholderTextColor="#9CA3AF"
                    style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderColor: border, borderWidth: 1 }}
                  />
                  <Btn label="Add" onPress={addWord} style={{ paddingHorizontal: 22 }} />
                </View>
                <Txt color={muted} size={13} style={{ marginTop: 12 }}>{vocab.length} words saved</Txt>
                {vocab.map((v) => (
                  <Txt key={v.id} style={{ paddingVertical: 4 }}>📖 {v.word}</Txt>
                ))}
              </Section>
              <Section title="Call history">
                {callHistoryError ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => request('calls').then((history) => {
                      setCallHistory(history);
                      setCallHistoryError('');
                    }).catch((error) => setCallHistoryError(error.message || 'Could not load call history.'))}
                  >
                    <Txt color={COLORS.error} size={12}>{callHistoryError}  Tap to retry.</Txt>
                  </TouchableOpacity>
                ) : null}
                {recentCallHistory.length === 0 ? (
                  <Txt size={12} color={muted}>Your incoming, outgoing, missed, and ended calls will appear here.</Txt>
                ) : recentCallHistory.map((item) => {
                  const outgoing = item.callerId === userId;
                  const otherUserId = outgoing ? item.calleeId : item.callerId;
                  const otherUser = item.participant || partners.find((partner) => partner.id === otherUserId);
                  const callStatus = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Ended';
                  return (
                    <View key={item.id} style={styles.callHistoryRow}>
                      {otherUser?.profilePhotoUrl ? (
                        <Image source={{ uri: otherUser.profilePhotoUrl }} style={{ width: 38, height: 38, borderRadius: 19 }} />
                      ) : (
                        <View style={[styles.avatarCircle, { width: 38, height: 38, backgroundColor: '#FFF0E8' }]}>
                          <Txt color={orange} bold>{otherUser?.name?.charAt(0)?.toUpperCase() || '?'}</Txt>
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Txt size={13} bold>{otherUser?.name || 'BYTALK user'}</Txt>
                        <Txt size={11} color={muted}>
                          {outgoing ? 'Outgoing' : 'Incoming'} {item.type === 'video' ? 'video' : 'voice'} · {callStatus}
                          {item.durationSeconds > 0 ? ` · ${Math.floor(item.durationSeconds / 60)}:${String(item.durationSeconds % 60).padStart(2, '0')}` : ''}
                        </Txt>
                      </View>
                      <Txt size={10} color={muted}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                      </Txt>
                    </View>
                  );
                })}
              </Section>
              <Section title="Practice interests">
                <Txt size={12} color={muted} style={{ marginBottom: 10 }}>
                  Choose the topics you want partners to see when they practice with you.
                </Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {PRACTICE_TOPICS.filter((topic) => topic.id !== 'All Topics').map((topic) => {
                    const selectedInterest = practiceInterests.includes(topic.id);
                    return (
                      <TouchableOpacity
                        key={topic.id}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selectedInterest }}
                        onPress={() => setPracticeInterests((previous) => selectedInterest
                          ? previous.filter((interest) => interest !== topic.id)
                          : [...previous, topic.id])}
                        style={[styles.interestChip, selectedInterest && styles.interestChipSelected]}
                      >
                        <Ionicons name={selectedInterest ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={selectedInterest ? orange : muted} />
                        <Txt size={12} color={selectedInterest ? orange : navy} bold={selectedInterest}>{topic.title}</Txt>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Btn
                  label={practiceInterestsSaving ? 'Saving...' : 'Save practice interests'}
                  onPress={savePracticeInterests}
                  disabled={practiceInterestsSaving}
                  style={{ marginTop: 14 }}
                />
              </Section>
              <Btn label="Update my level" outline onPress={() => setScreen('level')} style={{ marginBottom: 12 }} />
              <TouchableOpacity onPress={() => { setScreen('settings'); loadSettings(); }} style={styles.settingsLinkRow}>
                <Ionicons name="settings-outline" size={20} color={orange} />
                <Txt size={14} style={{ flex: 1, marginLeft: 10 }}>Settings</Txt>
                <Ionicons name="chevron-forward" size={18} color={muted} />
              </TouchableOpacity>
              <Btn label="BYTALK Premium" onPress={openSubscription} style={{ marginBottom: 12 }} />
              <Btn
                label={logoutBusy ? 'Signing out...' : 'Log Out / Sign Out'}
                outline
                onPress={handleLogout}
                loading={logoutBusy}
                disabled={logoutBusy}
                style={{ marginBottom: 12 }}
              />
              <Btn label="Back to Welcome Screen" outline onPress={() => setScreen('welcome')} />
            </ScrollView>
          )}

          {/* BOTTOM NAVIGATION (ARYA TAB BAR) */}
          {!['welcome', 'login', 'register', 'onboard', 'level', 'call', 'call-complete', 'aiPractice', 'manage-account', 'legal-terms', 'legal-privacy', 'chat'].includes(screen) && (
            <AryaBottomNav
              activeTab={activeBottomTab}
              onTabPress={handleBottomTabPress}
              unreadCount={Object.values(unreadByUser).reduce((sum, count) => sum + count, 0)}
              isPro={subscription?.plan?.id === 'pro' || subscription?.plan?.id === 'plus' || subscription?.active === true}
            />
          )}

          <NotificationsModal
            visible={showNotificationsModal}
            onClose={() => setShowNotificationsModal(false)}
            pendingRequests={pendingFriendRequests}
            sentRequests={sentFriendRequests}
            onAcceptRequest={handleAcceptFriendRequest}
            onDeclineRequest={handleDeclineFriendRequest}
            onCancelRequest={handleCancelFriendRequest}
            onStartChat={(u) => {
              openConversation(u);
            }}
            onGoToDiscover={() => {
              setActiveBottomTab('discover');
              setScreen('discover');
            }}
          />
          <LeaderboardModal
            visible={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            currentUser={{ name }}
          />

          <HistoryModal
            visible={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            callHistory={callHistory}
          />

          <Modal
            visible={showAiCreditsModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowAiCreditsModal(false)}
          >
            <View style={styles.aiCreditsModalOverlay}>
              <View style={styles.aiCreditsModalCard}>
                <TouchableOpacity
                  onPress={() => setShowAiCreditsModal(false)}
                  style={styles.aiCreditsModalClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close plans popup"
                >
                  <Ionicons name="close" size={21} color="#64748B" />
                </TouchableOpacity>

                <LinearGradient
                  colors={['#6D28D9', '#8B5CF6', '#A855F7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.aiCreditsModalHero}
                >
                  <View style={styles.aiCreditsModalIcon}>
                    <Ionicons name="chatbubbles" size={25} color="#6D28D9" />
                  </View>
                  <Text style={styles.aiCreditsModalEyebrow}>FREE PRACTICE COMPLETE</Text>
                  <Text style={styles.aiCreditsModalHeroTitle}>Great conversation!</Text>
                  <Text style={styles.aiCreditsModalHeroSubtitle}>
                    You used all 5 free AI credits across your practice topics.
                  </Text>
                </LinearGradient>

                <Text style={styles.aiCreditsModalTitle}>Keep your momentum going</Text>
                <Text style={styles.aiCreditsModalBody}>
                  Choose a plan to continue practicing with ARYA across General and Interview topics.
                </Text>

                <View style={styles.aiCreditsBenefits}>
                  {[
                    'Unlimited AI conversations',
                    'Practice every topic and interview scenario',
                    'Get helpful feedback as you improve',
                  ].map((benefit) => (
                    <View key={benefit} style={styles.aiCreditsBenefitRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      <Text style={styles.aiCreditsBenefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setShowAiCreditsModal(false);
                    openSubscription();
                  }}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessibilityLabel="View available plans"
                >
                  <LinearGradient
                    colors={['#F97316', '#EA580C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.aiCreditsPrimaryButton}
                  >
                    <Text style={styles.aiCreditsPrimaryButtonText}>View Plans</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowAiCreditsModal(false)}
                  style={styles.aiCreditsSecondaryButton}
                  accessibilityRole="button"
                  accessibilityLabel="Maybe later"
                >
                  <Text style={styles.aiCreditsSecondaryButtonText}>Maybe later</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* WHATSAPP ATTACHMENT MODAL */}
          <Modal
            visible={showAttachmentModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowAttachmentModal(false)}
          >
            <View style={styles.waModalOverlay}>
              <View style={styles.waModalCard}>
                <View style={styles.waModalHeader}>
                  <Text style={styles.waModalTitle}>Share Attachment</Text>
                  <TouchableOpacity onPress={() => setShowAttachmentModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={24} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* SECTION 1: PHOTOS & SCENES */}
                <Text style={styles.waSectionHeading}>📷 Share Practice Photo</Text>
                <View style={styles.waAttachGrid}>
                  {PRESET_ATTACHMENT_IMAGES.map((img) => (
                    <TouchableOpacity
                      key={img.id}
                      onPress={() => {
                        setPendingAttachment(img);
                        setShowAttachmentModal(false);
                      }}
                      style={styles.waAttachItem}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: img.url }} style={styles.waAttachThumb} />
                      <Text style={styles.waAttachLabel} numberOfLines={1}>{img.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* SECTION 2: PDF FILE PICKER */}
                <Text style={[styles.waSectionHeading, { marginTop: 16 }]}>📄 Share a PDF</Text>
                <TouchableOpacity
                  onPress={pickPdfAttachment}
                  style={styles.waDocRow}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Choose a PDF file"
                >
                  <View style={styles.waDocIconCircle}>
                    <Ionicons name="document-text" size={20} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.waDocTitle}>Choose PDF from this device</Text>
                    <Text style={styles.waDocSub}>PDF only · Up to 8 MB</Text>
                  </View>
                  <Ionicons name="arrow-up-circle-outline" size={20} color="#008069" />
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* FLOATING IN-APP FRIEND & MESSAGE NOTIFICATIONS (Rendered on top of all screens) */}
          {friendNotification && (
            <View style={styles.friendNotificationBanner}>
              <View style={[styles.friendNotifIconBox, { backgroundColor: friendNotification.type === 'accepted' ? '#DCFCE7' : '#EEF2FF' }]}>
                <Ionicons
                  name={friendNotification.type === 'accepted' ? 'checkmark-circle' : 'person-add'}
                  size={20}
                  color={friendNotification.type === 'accepted' ? '#16A34A' : '#4F46E5'}
                />
              </View>
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={styles.friendNotifTitle}>{friendNotification.title}</Text>
                <Text style={styles.friendNotifMsg} numberOfLines={2}>{friendNotification.message}</Text>
              </View>
              <View style={styles.friendNotifActions}>
                {friendNotification.type === 'request' ? (
                  <TouchableOpacity
                    onPress={() => {
                      const req = {
                        id: friendNotification.payload?.requestId,
                        from: friendNotification.payload?.from,
                      };
                      handleAcceptFriendRequest(req);
                    }}
                    style={styles.friendNotifAcceptBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.friendNotifAcceptText}>Accept</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setFriendNotification(null);
                      const pId = friendNotification.payload?.userId;
                      const partner = partnersRef.current.find((p) => String(p.id) === String(pId)) || {
                        id: pId,
                        name: friendNotification.payload?.name,
                        displayName: friendNotification.payload?.name,
                      };
                      openConversation(partner);
                    }}
                    style={styles.friendNotifChatBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.friendNotifChatText}>Chat</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setFriendNotification(null)}
                  style={{ padding: 6, marginLeft: 2 }}
                >
                  <Ionicons name="close" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {messageBanner && (
            <TouchableOpacity
              onPress={() => openConversation(messageBanner.sender)}
              style={styles.floatingMsgBanner}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#EA580C" style={{ marginRight: 8 }} />
              <Txt size={12} color={navy} bold style={{ flex: 1 }} numberOfLines={1}>
                {messageBanner.sender.displayName || messageBanner.sender.name}: <Txt size={12} color={navy} bold={false}>{messageBanner.text}</Txt>
              </Txt>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const { width: windowWidth, height: screenHeight } = Dimensions.get('window');
const isLargeScreen = windowWidth > 500;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: isLargeScreen ? '#F4F5F8' : '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webShell: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    ...(isLargeScreen
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 5,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: COLORS.border,
        }
      : {}),
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  logoRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topLogoutButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  /* Welcome Screen Styles */
  welcomeScrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'web' ? 18 : 12,
    paddingBottom: Platform.OS === 'web' ? 22 : 16,
    backgroundColor: COLORS.lightBg,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconLarge: {
    width: 38,
    height: 38,
    marginRight: 8,
  },
  brandTitle: {
    fontFamily: SERIF_FONT_FAMILY,
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  heroTextSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  heroMainTitle: {
    fontFamily: SERIF_FONT_FAMILY,
    fontSize: Math.min(32, Math.max(26, windowWidth * 0.075)),
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: Math.min(38, Math.max(31, windowWidth * 0.09)),
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubText: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  heroIllustrationContainer: {
    width: '100%',
    flexGrow: 1,
    minHeight: 230,
    maxHeight: Math.min(420, screenHeight * 0.48),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  heroIllustrationImage: {
    width: '100%',
    height: '100%',
    maxWidth: 380,
    alignSelf: 'center',
  },
  welcomeFooter: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 6,
  },
  primaryButtonShadow: {
    width: '100%',
    borderRadius: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryGradientButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingBottom: 4,
  },
  footerLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footerLinkBold: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },

  /* Auth Screens Common Styles (Login & Registration) */
  authScrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
  },
  authCardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    marginBottom: 16,
  },
  authTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  authBrandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  authBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authLogoIcon: {
    width: 38,
    height: 38,
    marginBottom: 6,
  },
  authBrandTitle: {
    fontFamily: SERIF_FONT_FAMILY,
    fontSize: 27,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  authBrandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.8,
  },
  authHeadingBlock: {
    marginBottom: 20,
    alignItems: 'center',
  },
  authHeadingTitle: {
    fontFamily: SERIF_FONT_FAMILY,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  authHeadingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  errorAlertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0ED',
    borderColor: '#FECDCA',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorAlertText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '500',
    lineHeight: 18,
  },
  authForm: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 13,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 7,
  },
  inputFieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputFieldBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  authInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  passwordToggle: {
    padding: 6,
  },
  forgotPasswordRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
    marginTop: -2,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  authFooterLinkRow: {
    marginTop: 'auto',
    paddingTop: 28,
    paddingBottom: 4,
  },

  /* Other Screens Styles */
  searchBar: {
    marginHorizontal: 22,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: border,
  },
  partnerCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F3F7',
  },
  partnerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  discoverMessage: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  discoverRetry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#FFF0E8',
  },
  partnerActions: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 12,
  },
  partnerAction: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFF7F2',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButtonOutline: {
    borderWidth: 1.5,
    borderColor: orange,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  incomingCallFullContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#0F172A',
  },
  incomingCallerCard: {
    alignItems: 'center',
    marginTop: 40,
  },
  incomingAvatarWrapper: {
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 4,
    borderColor: '#6366F1',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  incomingAvatarImage: {
    width: 126,
    height: 126,
    borderRadius: 63,
  },
  incomingCallerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  incomingCallSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#818CF8',
    marginBottom: 8,
  },
  incomingMetaText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  incomingCallActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  incomingActionBtnItem: {
    alignItems: 'center',
  },
  incomingDisconnectCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  incomingDisconnectLabel: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  incomingAcceptCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  incomingAcceptLabel: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  discoverRequestsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  discoverRequestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  discoverRequestsBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverRequestsBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  discoverRequestItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 8,
  },
  discoverRequestUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discoverRequestBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  discoverAcceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 7,
    borderRadius: 10,
  },
  discoverAcceptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  discoverDeclineBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  discoverDeclineBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  friendNotificationBanner: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 70 : (Platform.OS === 'ios' ? 56 : 46),
    left: 16,
    right: 16,
    zIndex: 999999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 9999,
  },
  floatingMsgBanner: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 70 : (Platform.OS === 'ios' ? 56 : 46),
    left: 16,
    right: 16,
    zIndex: 999998,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E8',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FFD4C2',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 9998,
  },
  friendNotifIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendNotifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  friendNotifMsg: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  friendNotifActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendNotifAcceptBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  friendNotifAcceptText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  friendNotifChatBtn: {
    backgroundColor: '#5843E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  friendNotifChatText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  incomingCallTopBanner: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 14,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  incomingBannerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
  },
  incomingBannerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  incomingBannerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  bannerDeclineBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerAcceptBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  callCompletionScreen: {
    padding: 22,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
  },
  callCompletionCard: {
    alignItems: 'center',
    padding: 26,
    borderRadius: 24,
    marginBottom: 24,
  },
  callCompletionAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  callCompletionAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: orange,
  },
  feedbackStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  feedbackTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  feedbackTag: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: border,
    backgroundColor: '#FFFFFF',
  },
  feedbackTagSelected: {
    borderColor: orange,
    backgroundColor: '#FFF0E8',
  },
  feedbackInput: {
    minHeight: 92,
    padding: 13,
    marginBottom: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: border,
    backgroundColor: '#FFFFFF',
    color: navy,
    textAlignVertical: 'top',
  },
  feedbackThankYou: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#F0FBF5',
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 14,
    paddingBottom: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  callBackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  callHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  callHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  callHeaderRight: {
    width: 36,
    alignItems: 'flex-end',
  },
  liveCallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveCallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveCallText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  callConnectingBanner: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  ringingBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ringingBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  callNoticeText: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
    textAlign: 'center',
  },
  callHubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  callUserCol: {
    alignItems: 'center',
    width: 90,
  },
  callAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 6,
  },
  callAvatarImg: {
    width: '100%',
    height: '100%',
  },
  callUserName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  callUserLevel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },
  callCenterHub: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  callTimerText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  freeTrialCallBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  freeTrialCallBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  callCenterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  callSpeakerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  callSpeakerBtnOff: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  callEndBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  activitiesScrollContainer: {
    paddingBottom: 28,
  },
  activitiesHeadingArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  activitiesHeadingTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  activitiesHeadingSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 6,
  },
  activityCard: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  activityCardEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  activityCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  activityCardSub: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  callBottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  callMicroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  callMicroBtnMuted: {
    backgroundColor: '#FEE2E2',
  },
  callMicroBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  activityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  activityModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  activityModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  activityModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  activityModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityPromptCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  activityPromptQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  activityVocabTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  activityVocabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  activityVocabChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  activityVocabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  activityModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  activityNextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 14,
  },
  activityNextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  activityDoneBtn: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },
  activityDoneBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  callVideoStage: {
    flex: 1,
    minHeight: 220,
    marginHorizontal: 12,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#25253C',
    position: 'relative',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    minHeight: 220,
    backgroundColor: '#25253C',
  },
  localVideo: {
    position: 'absolute',
    width: 108,
    height: 148,
    right: 12,
    top: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#3A3A51',
  },
  localVideoFallback: {
    position: 'absolute',
    width: 108,
    height: 60,
    right: 12,
    top: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A3A51',
  },
  videoFallbackNotice: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#17172FDD',
  },
  voiceCallAvatarArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
  },
  callAvatar: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 66,
    backgroundColor: '#34344D',
  },
  callStatusArea: {
    minHeight: 66,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  callControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  incomingCallActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 44,
    paddingVertical: 18,
  },
  callControl: {
    width: 60,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 22,
    backgroundColor: '#3A3A51',
  },
  callControlActive: {
    backgroundColor: '#63637B',
  },
  declineControl: {
    backgroundColor: '#D92D3B',
  },
  acceptControl: {
    backgroundColor: '#168653',
  },
  chatHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderColor: border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
    borderColor: border,
  },
  chatInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: border,
    color: navy,
  },
  sendButton: {
    backgroundColor: orange,
    padding: 13,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceProgressCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 22,
    backgroundColor: '#FFF0E8',
    borderWidth: 1,
    borderColor: '#FFD8C9',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: orange,
  },
  practiceTopicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: border,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  practiceTopicCardSelected: {
    borderColor: orange,
    backgroundColor: '#FFF8F4',
  },
  practiceTopicIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0E8',
  },
  practicePromptCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: '#FFF0E8',
    borderWidth: 1,
    borderColor: '#FFD8C9',
    marginBottom: 16,
  },
  practiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: border,
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  practiceOptionSelected: {
    borderColor: orange,
    backgroundColor: '#FFF8F4',
  },
  practiceCompleteCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 18,
    backgroundColor: '#F0FBF5',
    marginBottom: 22,
  },
  practiceEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    minHeight: 280,
    borderRadius: 20,
    backgroundColor: '#FFF8F4',
    borderWidth: 1,
    borderColor: '#FFD8C9',
  },
  aiHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: border,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  aiBackButton: {
    padding: 6,
    borderRadius: 8,
  },
  aiHeaderTitleSection: {
    flex: 1,
  },
  aiAvatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHeaderBadge: {
    backgroundColor: '#FFF0E8',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiProCreditBadge: {
    backgroundColor: '#ECFDF5',
  },
  aiEndSessionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDCA',
    backgroundColor: '#FFF4F2',
  },
  aiTopicBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD8C9',
    marginBottom: 14,
  },
  aiCreditsNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    marginBottom: 14,
  },
  aiMessageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  aiMessageRowLeft: {
    justifyContent: 'flex-start',
  },
  aiMessageRowRight: {
    justifyContent: 'flex-end',
  },
  aiBubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  aiMessageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
    gap: 8,
  },
  aiAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  aiErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4F2',
    borderColor: '#FECDCA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  aiRetryButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: orange,
    marginLeft: 8,
  },
  aiMicButtonActive: {
    backgroundColor: COLORS.error,
  },
  aiCompletionContainer: {
    padding: 20,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  aiCompletionCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  aiStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 20,
    gap: 10,
  },
  aiStatBox: {
    flex: 1,
    backgroundColor: '#FFF8F4',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0D3',
  },
  aiRatingSection: {
    width: '100%',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F3F7',
    marginBottom: 8,
  },
  aiStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  aiFeedbackInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: navy,
    maxHeight: 80,
  },
  aiPracticeScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  aiMessageBubble: {
    maxWidth: '86%',
    padding: 13,
    borderRadius: 16,
    marginBottom: 10,
  },
  aiAssistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1E9',
    borderBottomLeftRadius: 4,
  },
  aiUserBubble: {
    alignSelf: 'flex-end',
    backgroundColor: orange,
    borderBottomRightRadius: 4,
  },
  aiComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 12,
    borderTopWidth: 1,
    borderColor: border,
  },
  aiMicButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1E9',
  },
  aiInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 90,
    paddingHorizontal: 13,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: border,
    color: navy,
  },
  aiSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: orange,
  },
  aiEndButton: {
    paddingHorizontal: 7,
    paddingVertical: 8,
  },
  settingsChoice: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: border,
    backgroundColor: '#FFFFFF',
  },
  settingsChoiceSelected: {
    borderColor: orange,
    backgroundColor: '#FFF0E8',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F7',
  },
  settingsLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F7',
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F7',
  },
  vocabularyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFF0E8',
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: border,
    backgroundColor: '#FFFFFF',
  },
  interestChipSelected: {
    borderColor: orange,
    backgroundColor: '#FFF0E8',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    padding: 18,
    borderRadius: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: border,
  },
  callHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F3F7',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#EEF0F4',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  discoverPromptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEBF5',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  discoverPromptIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEECFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEECFE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8D4FD',
    gap: 4,
  },
  waHeader: {
    backgroundColor: '#008069',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  waHeaderBack: {
    padding: 6,
    marginRight: 2,
  },
  waHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 2,
  },
  waAvatarContainer: {
    position: 'relative',
    width: 38,
    height: 38,
  },
  waAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  waOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#008069',
  },
  waHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 4,
  },
  waHeaderActionBtn: {
    padding: 6,
  },
  waDatePillRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  waDatePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  waBubble: {
    maxWidth: '82%',
    padding: 9,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  waBubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#E7FFDB',
    borderBottomRightRadius: 2,
  },
  waBubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 2,
  },
  waImageAttachmentBox: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  waImageThumbnail: {
    width: 220,
    height: 150,
    borderRadius: 8,
  },
  waFileAttachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    padding: 9,
    borderRadius: 8,
    marginBottom: 6,
  },
  waFileIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waBubbleText: {
    lineHeight: 20,
  },
  waMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 3,
  },
  waBottomContainer: {
    paddingHorizontal: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 6,
    backgroundColor: 'transparent',
  },
  waPendingAttachBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 6,
    elevation: 2,
    borderLeftWidth: 3.5,
    borderLeftColor: '#008069',
  },
  waInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waInputCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  waTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#111B21',
    maxHeight: 100,
    paddingVertical: 6,
  },
  waSendCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#008069',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  waLockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    margin: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    elevation: 2,
  },
  waUpgradeBtn: {
    backgroundColor: '#008069',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  waModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  waModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '80%',
  },
  aiCreditsModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
  },
  aiCreditsModalCard: {
    width: '100%',
    maxWidth: 420,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },
  aiCreditsModalClose: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  aiCreditsModalHero: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 20,
    borderRadius: 18,
  },
  aiCreditsModalIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  aiCreditsModalEyebrow: {
    color: '#EDE9FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  aiCreditsModalHeroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 5,
    textAlign: 'center',
  },
  aiCreditsModalHeroSubtitle: {
    color: '#F5F3FF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },
  aiCreditsModalTitle: {
    color: '#172033',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 20,
    textAlign: 'center',
  },
  aiCreditsModalBody: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },
  aiCreditsBenefits: {
    gap: 10,
    marginTop: 18,
    marginBottom: 20,
  },
  aiCreditsBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  aiCreditsBenefitText: {
    flex: 1,
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  aiCreditsPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  aiCreditsPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  aiCreditsSecondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  aiCreditsSecondaryButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  waModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  waModalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#111B21',
  },
  waSectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667781',
    marginBottom: 10,
  },
  waAttachGrid: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  waAttachItem: {
    width: '31%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    paddingBottom: 6,
  },
  waAttachThumb: {
    width: '100%',
    height: 68,
  },
  waAttachLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#111B21',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  waDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  waDocIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waDocTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111B21',
  },
  waDocSub: {
    fontSize: 11,
    color: '#667781',
    marginTop: 1,
  },
  waChatsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  waChatsHeader: {
    backgroundColor: '#008069',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 14,
    paddingBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  waChatsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  waChatsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  waChatsHeaderIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  waSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 7 : 3,
    marginBottom: 8,
  },
  waSearchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#111B21',
    paddingVertical: 5,
    marginLeft: 6,
  },
  waFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  waFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  waFilterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  waFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  waFilterTextActive: {
    color: '#008069',
  },
  waChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    backgroundColor: '#FFFFFF',
  },
  waChatAvatarWrapper: {
    position: 'relative',
    width: 50,
    height: 50,
  },
  waChatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  waChatOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  waChatDetails: {
    flex: 1,
    marginLeft: 12,
  },
  waChatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  waChatName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#111B21',
  },
  waChatTime: {
    fontSize: 11.5,
    color: '#8696A0',
  },
  waChatTimeUnread: {
    color: '#25D366',
    fontWeight: '700',
  },
  waChatBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waChatPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  waChatSnippet: {
    fontSize: 13,
    color: '#667781',
    flex: 1,
  },
  waUnreadBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  waUnreadText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  waFabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#00A884',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  waUserResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    backgroundColor: '#FFFFFF',
  },
  waUserActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008069',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 4,
  },
  waUserActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  waSectionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#8696A0',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: '#F8FAFC',
  },

  /* UNIFIED CHATS & CALLS HUB STYLES (REFERRAL THEME) */
  hubContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  hubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  hubCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  hubHeaderRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hubSearchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  hubSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  hubSearchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    paddingVertical: 4,
    marginLeft: 6,
  },
  hubStoriesContainer: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  hubStoriesScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 14,
  },
  hubStatusPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 4,
  },
  hubStatusPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  hubStoryItem: {
    alignItems: 'center',
    width: 60,
  },
  hubStoryAvatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
    borderColor: '#8B5CF6',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  hubStoryAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
  },
  hubStoryAddPlus: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  hubStoryName: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
    marginTop: 5,
    textAlign: 'center',
  },
  hubFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  hubFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  hubFilterPillActive: {
    backgroundColor: '#7C3AED',
  },
  hubFilterText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hubFilterTextActive: {
    color: '#FFFFFF',
  },
  hubConvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    backgroundColor: '#FFFFFF',
  },
  hubConvAvatarBox: {
    position: 'relative',
    width: 50,
    height: 50,
  },
  hubConvAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  hubOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  hubConvDetails: {
    flex: 1,
    marginLeft: 12,
  },
  hubConvTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  hubConvName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  hubConvTime: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  hubConvTimeUnread: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  hubConvBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hubConvPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  hubConvSnippet: {
    fontSize: 12.5,
    color: '#64748B',
    flex: 1,
  },
  hubTypingText: {
    fontSize: 12.5,
    color: '#8B5CF6',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  hubUnreadBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  hubUnreadText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  hubSectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  hubSearchUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    backgroundColor: '#FFFFFF',
  },
  hubQuickChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  hubQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  hubQuickCallBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubQuickVideoBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubMatchHeroCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  hubMatchHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubMatchHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hubMatchHeroSub: {
    fontSize: 12,
    color: '#EDE9FE',
    marginTop: 2,
  },
  hubMatchHeroBtn: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubMatchHeroBtnText: {
    color: '#5843E8',
    fontSize: 13.5,
    fontWeight: '800',
  },
  hubCallUpgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  hubLockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
    gap: 4,
  },
  hubLockPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D97706',
  },
  hubUpgradeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  hubUpgradeSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  hubUpgradeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 3,
    marginLeft: 8,
  },
  hubUpgradeActionText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  hubCallActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 11,
    marginBottom: 12,
    gap: 8,
  },
  hubCallActiveText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
  },
  hubCallPartnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  hubCallActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubEmptyCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginTop: 8,
  },
  hubEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  hubEmptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 3,
  },
  hubGroupCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  hubGroupIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubGroupBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  hubGroupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  hubGroupJoinBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  hubGroupJoinText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* 1-ON-1 CHAT SCREEN STYLES (REFERRAL RIGHT SCREEN) */
  chatWrapper: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 48 : 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chatBackBtn: {
    padding: 4,
    marginRight: 4,
  },
  chatHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chatHeaderName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  chatHeaderStatus: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 1,
  },
  chatHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginRight: 4,
  },
  chatHeaderIconBtn: {
    padding: 4,
  },
  chatErrorBanner: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  chatErrorText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },
  chatTypingBanner: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  chatTypingBannerText: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
  },
  chatDatePillRow: {
    alignItems: 'center',
    marginVertical: 12,
  },
  chatDatePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chatDatePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  chatBubbleContainer: {
    width: '100%',
    marginBottom: 10,
  },
  chatBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  chatBubbleMe: {
    backgroundColor: '#C49BFA',
    borderBottomRightRadius: 4,
  },
  chatBubbleThem: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    fontSize: 14.5,
    lineHeight: 21,
    ...(Platform.OS === 'web' ? { overflowWrap: 'anywhere', wordBreak: 'break-word' } : {}),
  },
  chatBubbleTextMe: {
    color: '#1E1B4B',
  },
  chatBubbleTextThem: {
    color: '#0F172A',
  },
  chatBubbleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  chatBubbleMetaTime: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  chatImgBox: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 6,
  },
  chatImgPreview: {
    width: 220,
    height: 150,
    borderRadius: 10,
  },
  chatAttachCaption: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  chatFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  chatFileIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatFileName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  chatFileSize: {
    fontSize: 10.5,
    color: '#64748B',
  },
  chatBottomBar: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chatEmojiKeyboard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    marginBottom: 8,
    overflow: 'hidden',
  },
  chatEmojiKeyboardHeader: {
    minHeight: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatEmojiKeyboardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  chatEmojiKeyboardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatEmojiKeyboardAction: {
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatEmojiCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatEmojiCategoryButton: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  chatEmojiCategoryButtonActive: {
    backgroundColor: '#EDE9FE',
  },
  chatEmojiGridScroll: {
    maxHeight: 152,
  },
  chatEmojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  chatEmojiCell: {
    width: '12.5%',
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  chatEmojiText: {
    fontSize: 22,
  },
  chatEmojiKeyboardHint: {
    paddingHorizontal: 10,
    paddingBottom: 8,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 10,
  },
  chatPendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginBottom: 8,
  },
  chatPendingText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#5843E8',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatInputCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F8',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
  },
  chatTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    maxHeight: 100,
    paddingVertical: 6,
  },
  chatAttachBtn: {
    padding: 6,
  },
  chatSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chatLockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatUpgradeBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
  },
  // Messages Screen Theme (Exact match to referral screenshot)
  msgScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messagesThemeTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  messagesLogoBt: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F97316',
    letterSpacing: 0.5,
  },
  messagesLogoBytalk: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E1B4B',
    letterSpacing: 0.5,
  },
  apiOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  apiOnlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  apiOnlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  messagesSignOutBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messagesThemeTitleArea: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  messagesThemeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: -0.5,
  },
  messagesThemeSub: {
    fontSize: 14.5,
    fontWeight: '400',
    color: '#475569',
    marginTop: 6,
  },
  messagesThemeEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  messagesThemeEmptyText: {
    fontSize: 14.5,
    fontWeight: '400',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  messagesSubNoticeCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  messagesSubNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
  },
  messagesSubNoticeDesc: {
    fontSize: 12,
    color: '#C2410C',
    lineHeight: 18,
    marginBottom: 12,
  },
  messagesSubNoticeBtn: {
    backgroundColor: '#EA580C',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  messagesSubNoticeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  msgConvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  msgConvAvatarBox: {
    position: 'relative',
    marginRight: 13,
  },
  msgConvAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  msgOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  msgConvDetails: {
    flex: 1,
  },
  msgConvTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  msgConvName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  msgConvTime: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  msgConvTimeUnread: {
    color: '#EA580C',
    fontWeight: '700',
  },
  msgConvBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  msgConvPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  msgTypingText: {
    fontSize: 13,
    color: '#EA580C',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  msgConvSnippet: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  msgUnreadBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  msgUnreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  /* ================= VIDEO CALL STYLES ================= */
  videoCallContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    position: 'relative',
  },
  videoRemoteWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    position: 'relative',
    overflow: 'hidden',
  },
  videoRemoteStream: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  videoPlaceholderContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  videoPlaceholderAvatarBorder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#6366F1',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  videoPlaceholderAvatarImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  videoPlaceholderName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  videoStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  videoStatusPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  videoTopOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  videoTopInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxWidth: '65%',
  },
  videoTopPeerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  videoTopTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoTopTimerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    marginLeft: 6,
  },
  videoFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#818CF8',
  },
  videoFriendBtnSent: {
    backgroundColor: 'rgba(16, 185, 129, 0.88)',
    borderColor: '#34D399',
  },
  videoFriendBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  videoLocalPipWrapper: {
    position: 'absolute',
    top: 60,
    right: 14,
    width: 105,
    height: 145,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#6366F1',
    zIndex: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  videoLocalPipStream: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  videoLocalPipPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
  },
  videoLocalPipOffText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  videoPipFlipBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPipLabelPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  videoPipLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  videoControlBar: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  videoControlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoControlCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  videoControlCircleActive: {
    backgroundColor: '#EF4444',
  },
  videoControlCircleSpeaker: {
    backgroundColor: '#6366F1',
  },
  videoControlCircleEnd: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  videoControlLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
  },
  /* ================= ACTIVE CALL REFERENCE THEME STYLES ================= */
  refCallHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  refUserCol: {
    alignItems: 'center',
    width: 85,
  },
  refAvatarWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  refAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  refUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 6,
    textAlign: 'center',
  },
  refUserLevel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  refCenterCol: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  refTimerText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 2,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  refActionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  refBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refBtnMute: {
    backgroundColor: '#F1F5F9',
  },
  refMuteBtnActive: {
    backgroundColor: '#EF4444',
  },
  refSpeakerBtnOff: {
    backgroundColor: '#DCFCE7',
  },
  refSpeakerBtnOn: {
    backgroundColor: '#16A34A',
  },
  refEndCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  refActivitiesSubBar: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  refActivitiesSubTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  /* ================= CALL SCREEN STYLES (IMAGE 3) ================= */
  activeCallTimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  activeCallPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  activeCallTimerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginRight: 6,
  },
  activeCallTimerValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  activeCallLiveTag: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  activeCallLiveTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  recBannerTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  recBannerTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  recBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF7ED',
    borderBottomWidth: 1,
    borderBottomColor: '#FFEDD5',
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recBannerText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#9A3412',
  },
  connectedAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FAF5FF',
  },
  connectedUserCol: {
    alignItems: 'center',
  },
  connectedAvatarBorder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#38BDF8',
    backgroundColor: '#E0E7FF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  connectedAvatarImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  userNamePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  userNamePillPro: {
    borderColor: '#FACC15',
    backgroundColor: '#FEF9C3',
  },
  userNamePillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  avatarConnectorLine: {
    width: 50,
    height: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
    marginBottom: 20,
  },
  partnerStatBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  partnerStatText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  callRemainingTimeBox: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 14,
  },
  callRemainingTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  callProgressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  callProgressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 3,
  },
  inCallAddFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 20,
    marginHorizontal: 30,
    paddingVertical: 7,
    marginTop: 12,
  },
  inCallAddFriendBtnSent: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  inCallAddFriendText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  curvedCallBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#6366F1',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  floatingControlBtn: {
    alignItems: 'center',
  },
  floatingControlIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  floatingControlMutedCircle: {
    backgroundColor: '#EF4444',
  },
  floatingControlSpeakerCircle: {
    backgroundColor: '#FFFFFF',
  },
  floatingControlEndCircle: {
    backgroundColor: '#EF4444',
  },
  floatingControlLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ================= EARLY DISCONNECT MODAL (IMAGE 1) ================= */
  earlyDisconnectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  earlyDisconnectSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  earlyWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B91C1C',
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  earlyWarningText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  earlyDisconnectBody: {
    padding: 22,
  },
  earlyDisconnectTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  earlyDisconnectSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  earlyReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  earlyRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  earlyRadioCircleActive: {
    borderColor: '#6366F1',
  },
  earlyRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
  },
  earlyReasonText: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  earlyActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  earlyEndBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  earlyEndBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  earlyContinueBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earlyContinueBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* ================= POST-CALL FEEDBACK SCREEN (IMAGE 2) ================= */
  postCallScreen: {
    padding: 18,
    paddingBottom: 40,
    backgroundColor: '#F8F9FE',
  },
  postCallTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  postCallSkipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  postCallSkipText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '700',
  },
  postCallNoteBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  postCallNoteText: {
    color: '#15803D',
    fontSize: 12.5,
    lineHeight: 18,
  },
  postCallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  postCallCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  postCallStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  postCallStarsGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  postCallStarMascot: {
    padding: 2,
  },
  postCallStarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  postCallSubLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  postCallTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    fontSize: 13.5,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  postCallAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 6,
  },
  audioRatingPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  audioRatingPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  audioRatingPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  audioRatingPillTextActive: {
    color: '#4F46E5',
    fontWeight: '900',
  },
  postCallFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  postCallFriendBtnSent: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  postCallFriendBtnText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  postCallSubmitBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  postCallSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // DISCOVER CONVERSATION LIST STYLES
  discoverEmptyCard: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#ECEEF5',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  discoverEmptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  discoverStartPracticeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 18,
    shadowColor: '#6366F1',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  discoverStartPracticeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  convListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECEEF5',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  convItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  convAvatarContainer: {
    position: 'relative',
    marginRight: 13,
  },
  convAvatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
  },
  convAvatarFallback: {
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4F46E5',
  },
  convStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  convStatusOnline: {
    backgroundColor: '#10B981',
  },
  convStatusOffline: {
    backgroundColor: '#94A3B8',
  },
  convDetailsCol: {
    flex: 1,
  },
  convTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  convNameText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  convTimeText: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  convTimeTextUnread: {
    color: '#6366F1',
    fontWeight: '700',
  },
  convBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  convPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  convConnectedText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
  },
  convSnippetText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  convSnippetTextUnread: {
    color: '#0F172A',
    fontWeight: '700',
  },
  convUnreadPill: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  convUnreadCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  convQuickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 10,
  },
  convQuickBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverAddFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  discoverAddFriendBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

});

export default App;
