import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { speakEnglish, stopSpeech } from '../utils/speechHelper';

const { width: windowWidth } = Dimensions.get('window');

// 5 Core Progression Stages for 1,000 Levels
export const STAGES = [
  { id: 1, name: 'Everyday Foundations', range: '1–200', start: 1, end: 200, color: '#10B981' },
  { id: 2, name: 'Travel & Social Life', range: '201–400', start: 201, end: 400, color: '#3B82F6' },
  { id: 3, name: 'Career & Workplace', range: '401–600', start: 401, end: 600, color: '#8B5CF6' },
  { id: 4, name: 'Business Leadership', range: '601–800', start: 601, end: 800, color: '#F59E0B' },
  { id: 5, name: 'Native Fluency & Idioms', range: '801–1000', start: 801, end: 1000, color: '#EC4899' },
];

// 50 High-Frequency Real-World English Conversational Modules
const CONVERSATION_MODULES = [
  {
    topic: 'Warm Greetings & Openers',
    phrases: [
      { phrase: "Hey, how's it going?", phonetic: '/heɪ haʊz ɪt ˈɡoʊɪŋ/', meaning: 'Natural casual greeting for peers and colleagues', example: "Hey Sarah, how's it going today?" },
      { phrase: "Great to see you again!", phonetic: '/ɡreɪt tu siː juː əˈɡɛn/', meaning: 'Warm welcome when reconnecting with someone', example: "David! Great to see you again, it's been ages." },
      { phrase: "What have you been up to?", phonetic: '/wʌt hæv juː biːn ʌp tuː/', meaning: 'Asking about recent activities and life updates', example: "Long time no see! What have you been up to lately?" },
      { phrase: "Catch you later!", phonetic: '/kætʃ juː ˈleɪtər/', meaning: 'Casual friendly farewell for everyday talk', example: "I have to jump into a call now. Catch you later!" },
    ],
    quiz: {
      scenario: 'You bump into an acquaintance at lunch and want to ask about their recent news.',
      question: 'Which question is most natural and polite?',
      options: ['Give me your life history now.', "Hey! What have you been up to lately?", 'Why are you walking here?', 'I require your news report.'],
      correctIndex: 1,
      explanation: "'What have you been up to?' is the standard natural way to ask for life updates.",
    },
  },
  {
    topic: 'Personal Introductions',
    phrases: [
      { phrase: "I'm originally from...", phonetic: '/aɪm əˈrɪdʒɪnəli frʌm/', meaning: 'Explaining your hometown or roots', example: "I'm originally from Pune, but I've lived in London for 3 years." },
      { phrase: "Where are you based?", phonetic: '/wɛər ɑːr juː beɪst/', meaning: 'Asking where someone currently lives or works', example: "Pleasure to meet you! Where are you based currently?" },
      { phrase: "I work in tech and education", phonetic: '/aɪ wɜːrk ɪn tɛk ænd ˌɛdʒʊˈkeɪʃən/', meaning: 'Describing your industry clearly', example: "I work in tech and education, focusing on language learning." },
      { phrase: "In my free time, I love...", phonetic: '/ɪn maɪ friː taɪm aɪ lʌv/', meaning: 'Sharing hobbies and personal passions', example: "In my free time, I love cooking and photography." },
    ],
    quiz: {
      scenario: 'Your speaking partner asks where your home is.',
      question: 'Select the most natural English phrasing:',
      options: ['My physical body was birthed at coordinates.', "I'm originally from Delhi, but currently based in Mumbai.", 'Location is classified.', 'I am present in reality.'],
      correctIndex: 1,
      explanation: "'I'm originally from... but currently based in...' is polished and natural.",
    },
  },
  {
    topic: 'Ordering Coffee & Food',
    phrases: [
      { phrase: "Could I get a large cappuccino?", phonetic: '/kʊd aɪ ɡɛt ə lɑːrdʒ ˌkæpəˈtʃiːnoʊ/', meaning: 'Polite way to order a drink at a cafe', example: "Could I get a large cappuccino with oat milk, please?" },
      { phrase: "For here or to go?", phonetic: '/fɔːr hɪər ɔːr tu ɡoʊ/', meaning: 'Clarifying if eating at the venue or taking away', example: "Will that coffee be for here or to go today?" },
      { phrase: "Could we split the bill?", phonetic: '/kʊd wiː splɪt ðə bɪl/', meaning: 'Asking to pay separately among friends', example: "The pasta was amazing! Could we split the bill two ways?" },
      { phrase: "Keep the change!", phonetic: '/kiːp ðə tʃeɪndʒ/', meaning: 'Offering a tip to the barista or server', example: "Here is twenty dollars, please keep the change!" },
    ],
    quiz: {
      scenario: 'You want to order breakfast at a cafe with polite manners.',
      question: 'Which phrase is best?',
      options: ['Give me coffee fast!', 'Could I get a large cappuccino with oat milk, please?', 'Hand over drink immediately.', 'Coffee is needed by me.'],
      correctIndex: 1,
      explanation: "'Could I get... please?' is polite, friendly, and universally accepted.",
    },
  },
  {
    topic: 'Asking Directions & Commuting',
    phrases: [
      { phrase: "Excuse me, how do I get to...?", phonetic: '/ɪkˈskjuːz miː haʊ duː aɪ ɡɛt tuː/', meaning: 'Polite opener when asking for directions', example: "Excuse me, how do I get to the central train station?" },
      { phrase: "Is it within walking distance?", phonetic: '/ɪz ɪt wɪˈðɪn ˈwɔːkɪŋ ˈdɪstəns/', meaning: 'Asking if you can walk there comfortably', example: "Is the museum within walking distance from here?" },
      { phrase: "Take the second exit", phonetic: '/teɪk ðə ˈsɛkənd ˈɛɡzɪt/', meaning: 'Navigation instruction at a roundabout or station', example: "Follow this avenue and take the second exit on your right." },
      { phrase: "You can't miss it!", phonetic: '/juː kænt mɪs ɪt/', meaning: 'The destination is very easy to find', example: "It has a large glowing blue sign, you can't miss it!" },
    ],
    quiz: {
      scenario: 'You are in a new city and want to know if you need transport or can walk.',
      question: 'What is the natural question to ask?',
      options: ['Can my feet transport me?', 'Is it within walking distance from here?', 'Do cars go there only?', 'I want to walk now.'],
      correctIndex: 1,
      explanation: "'Is it within walking distance?' is the authentic native idiom.",
    },
  },
  {
    topic: 'Making Plans & Scheduling',
    phrases: [
      { phrase: "Are you free this weekend?", phonetic: '/ɑːr juː friː ðɪs ˈwiːkˌɛnd/', meaning: 'Checking someone’s schedule for an outing', example: "Are you free this weekend? Let's check out the new art festival." },
      { phrase: "Does 3 PM work for you?", phonetic: '/dʌz θriː piː-ɛm wɜːrk fɔːr juː/', meaning: 'Proposing a specific time slot', example: "I have a gap in the afternoon. Does 3 PM work for you?" },
      { phrase: "Something came up", phonetic: '/ˈsʌmθɪŋ keɪm ʌp/', meaning: 'An unexpected event requires rescheduling', example: "I'm so sorry, something urgent came up at the office." },
      { phrase: "Let's take a rain check!", phonetic: '/lɛts teɪk ə reɪn tʃɛk/', meaning: 'Politely postponing plans to a later date', example: "I'm overloaded tonight, but let's take a rain check for Friday!" },
    ],
    quiz: {
      scenario: 'You cannot make it to dinner tonight due to work, but genuinely want to meet next week.',
      question: 'Which idiom conveys this politely?',
      options: ['I cancel you forever.', 'Can we take a rain check for next week?', 'Work is bad today.', 'Never call me again.'],
      correctIndex: 1,
      explanation: "'Take a rain check' means postponing with genuine intent to meet later.",
    },
  },
  {
    topic: 'Job Interview Excellence',
    phrases: [
      { phrase: "My core strength lies in...", phonetic: '/maɪ kɔːr strɛŋkθ laɪz ɪn/', meaning: 'Highlighting your key professional skill', example: "My core strength lies in data-driven decision making and leadership." },
      { phrase: "I led a cross-functional team", phonetic: '/aɪ lɛd ə krɔːs ˈfʌŋkʃənl tiːm/', meaning: 'Demonstrating leadership and teamwork', example: "In my previous role, I led a cross-functional team of 8 engineers." },
      { phrase: "I thrive in fast-paced environments", phonetic: '/aɪ θraɪv ɪn fæst peɪst ɪnˈvaɪrənmənts/', meaning: 'Expressing adaptability and high performance', example: "I thrive in fast-paced environments where agility is valued." },
      { phrase: "Thank you for your time today", phonetic: '/θæŋk juː fɔːr jʊər taɪm tuˈdeɪ/', meaning: 'Professional interview closing', example: "Thank you for your time today, I look forward to hearing from you." },
    ],
    quiz: {
      scenario: 'An interviewer asks why you are a strong candidate for this leadership position.',
      question: 'What is a compelling professional response?',
      options: ['I need the salary.', 'My core strength lies in building high-performing, collaborative teams.', 'I am the best human alive.', 'Hire me now.'],
      correctIndex: 1,
      explanation: "'My core strength lies in...' sets a confident, articulate tone.",
    },
  },
  {
    topic: 'Expressing Opinions & Debates',
    phrases: [
      { phrase: "From my perspective...", phonetic: '/frʌm maɪ pərˈspɛktɪv/', meaning: 'Stating your viewpoint diplomatically', example: "From my perspective, user experience should always come first." },
      { phrase: "I see your point, however...", phonetic: '/aɪ siː jʊər pɔɪnt haʊˈɛvər/', meaning: 'Respectfully acknowledging before countering', example: "I see your point, however we must also consider the timeline." },
      { phrase: "On the flip side...", phonetic: '/ɒn ðə flɪp saɪd/', meaning: 'Examining the opposing angle', example: "Remote work is flexible; on the flip side, in-person workshops build camaraderie." },
      { phrase: "I wholeheartedly agree!", phonetic: '/aɪ ˌhoʊlˈhɑːrtɪdli əˈɡriː/', meaning: 'Expressing complete and genuine agreement', example: "I wholeheartedly agree that daily speaking practice builds fluency." },
    ],
    quiz: {
      scenario: 'You want to disagree tactfully during a team discussion.',
      question: 'Which phrase is the most professional and persuasive?',
      options: ['You are completely wrong.', 'I see your point, however let us also weigh the budget impact.', 'Shut down that opinion.', 'I disagree with your brain.'],
      correctIndex: 1,
      explanation: "'I see your point, however...' bridges agreement with constructive critique.",
    },
  },
  {
    topic: 'Everyday Idioms & Expressions',
    phrases: [
      { phrase: "Hit the nail on the head", phonetic: '/hɪt ðə neɪl ɒn ðə hɛd/', meaning: 'Saying or identifying something with exact accuracy', example: "Your summary hit the nail on the head, that's exactly the issue." },
      { phrase: "Bite the bullet", phonetic: '/baɪt ðə ˈbʊlɪt/', meaning: 'Facing a difficult task with courage', example: "I dreaded speaking in public, but I had to bite the bullet and present." },
      { phrase: "Once in a blue moon", phonetic: '/wʌns ɪn ə bluː muːn/', meaning: 'Something that happens extremely rarely', example: "He travels abroad only once in a blue moon." },
      { phrase: "Break the ice", phonetic: '/breɪk ði aɪs/', meaning: 'Relieving social awkwardness when strangers meet', example: "A quick lighthearted game helped break the ice between learners." },
    ],
    quiz: {
      scenario: 'Your colleague pinpointed the exact root cause of a software bug.',
      question: 'Which idiom compliments them accurately?',
      options: ['You spilled the beans.', 'You hit the nail on the head!', 'You broke a leg.', 'You bit the dust.'],
      correctIndex: 1,
      explanation: "'Hit the nail on the head' means pinpointing the exact truth or issue.",
    },
  },
];

// Generates dynamic data for any level from 1 to 1000
function getLevelData(levelNum) {
  const modIdx = (levelNum - 1) % CONVERSATION_MODULES.length;
  const baseModule = CONVERSATION_MODULES[modIdx];
  const unitNum = Math.ceil(levelNum / 10);
  const stage = STAGES.find((s) => levelNum >= s.start && levelNum <= s.end) || STAGES[0];

  return {
    level: levelNum,
    unit: unitNum,
    stageName: stage.name,
    stageColor: stage.color,
    title: `Level ${levelNum}: ${baseModule.topic}`,
    subtitle: `Unit ${unitNum} • Practical Spoken English`,
    phrases: baseModule.phrases,
    quiz: baseModule.quiz,
  };
}

export default function LearnScreen({
  user,
  userStats,
  onPressHistory,
  onAddStars,
  request,
}) {
  // Current unlocked level: Level 1 is unlocked initially, Levels 2-1000 are locked until solved!
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState([]);
  const [activeLevelNumber, setActiveLevelNumber] = useState(1);
  const [showTooltip, setShowTooltip] = useState(true);

  // Pagination for 1,000 levels (50 levels per page view)
  const [currentBatchPage, setCurrentBatchPage] = useState(1);
  const batchSize = 50;
  const totalPages = Math.ceil(1000 / batchSize); // 20 pages

  // Modal State
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [lessonCompleted, setLessonCompleted] = useState(false);

  // AI Speaking Practice Modal State (NO "Gemini" branding)
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSelectedOption, setAiSelectedOption] = useState(null);
  const [aiQuizSubmitted, setAiQuizSubmitted] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [dynamicAiQuiz, setDynamicAiQuiz] = useState(null);

  // Daily study timer countdown (starts at 20:00)
  const [secondsRemaining, setSecondsRemaining] = useState(20 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Restore progression from persistent storage
  useEffect(() => {
    async function loadProgression() {
      try {
        const [savedUnlocked, savedCompleted] = await Promise.all([
          AsyncStorage.getItem('bytalk_unlocked_level'),
          AsyncStorage.getItem('bytalk_completed_levels'),
        ]);

        if (savedUnlocked) {
          const uNum = parseInt(savedUnlocked, 10);
          if (!isNaN(uNum) && uNum >= 1 && uNum <= 1000) {
            setUnlockedLevel(uNum);
            setActiveLevelNumber(uNum);
            // Automatically switch to the page containing the current active level
            const targetPage = Math.ceil(uNum / batchSize);
            setCurrentBatchPage(targetPage);
          }
        }

        if (savedCompleted) {
          const cArr = JSON.parse(savedCompleted);
          if (Array.isArray(cArr)) {
            setCompletedLevels(cArr);
          }
        }
      } catch (err) {
        console.warn('[LearnScreen restore]', err);
      }
    }
    loadProgression();
  }, []);

  // Save progression whenever a level is solved
  const unlockNextLevel = async (currentLvl) => {
    try {
      const nextLvl = Math.min(1000, currentLvl + 1);

      // Add to completed levels
      setCompletedLevels((prev) => {
        const nextList = prev.includes(currentLvl) ? prev : [...prev, currentLvl];
        AsyncStorage.setItem('bytalk_completed_levels', JSON.stringify(nextList)).catch(() => {});
        return nextList;
      });

      // Unlock next level if advancing
      if (nextLvl > unlockedLevel) {
        setUnlockedLevel(nextLvl);
        setActiveLevelNumber(nextLvl);
        await AsyncStorage.setItem('bytalk_unlocked_level', String(nextLvl));
      }

      // Award +20 stars
      if (onAddStars) onAddStars(20);
    } catch (e) {
      console.warn('[unlockNextLevel]', e);
    }
  };

  const formatTimer = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Levels visible on the current page batch (e.g. 1–50, 51–100, etc.)
  const visibleLevels = useMemo(() => {
    const start = (currentBatchPage - 1) * batchSize + 1;
    const end = Math.min(1000, currentBatchPage * batchSize);
    const list = [];
    for (let i = start; i <= end; i++) {
      list.push(getLevelData(i));
    }
    return list;
  }, [currentBatchPage]);

  const activeLevelData = useMemo(() => getLevelData(activeLevelNumber), [activeLevelNumber]);

  const handleSelectLevelNode = (lvlNum) => {
    if (lvlNum > unlockedLevel) {
      Alert.alert(
        '🔒 Level Locked',
        `Level ${lvlNum} is locked!\n\nPlease solve Level ${lvlNum - 1} first to unlock this English speaking practice.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setActiveLevelNumber(lvlNum);
    setShowTooltip(true);
  };

  const handleStartLesson = () => {
    setShowLessonModal(true);
    setActivePhraseIndex(0);
    setLessonCompleted(false);
  };

  const handlePlayAudio = (phrase, idx) => {
    setSpeakingIndex(idx);
    speakEnglish(
      phrase,
      () => setSpeakingIndex(idx),
      () => setSpeakingIndex(null)
    );
  };

  const handleNextPhrase = () => {
    stopSpeech();
    if (activePhraseIndex < activeLevelData.phrases.length - 1) {
      setActivePhraseIndex((prev) => prev + 1);
    } else {
      setLessonCompleted(true);
      unlockNextLevel(activeLevelNumber);
    }
  };

  // Launch AI Speaking Challenge (labeled "AI Practice", never showing "Gemini")
  const handleStartAiPractice = async () => {
    setShowLessonModal(false);
    setShowAiModal(true);
    setAiSelectedOption(null);
    setAiQuizSubmitted(false);
    setAiFeedback('');
    setDynamicAiQuiz(activeLevelData.quiz);

    // Optional dynamic AI generation via backend
    if (request) {
      setAiLoading(true);
      try {
        const res = await request('ai/chat', {
          method: 'POST',
          body: {
            message: `Generate a 1-question conversational English quiz for Level ${activeLevelNumber}: "${activeLevelData.title}".
Return strictly valid JSON:
{"scenario": "Brief 1-sentence real situation", "question": "Question text", "options": ["Option A", "Option B", "Option C", "Option D"], "correctIndex": 0, "explanation": "Why this option is authentic English"}`,
            topic: activeLevelData.title,
            proficiencyLevel: activeLevelData.stageName,
          },
        });
        if (res?.message) {
          const match = res.message.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4) {
              setDynamicAiQuiz(parsed);
            }
          }
        }
      } catch (err) {
        // Fallback to pre-built level quiz
      } finally {
        setAiLoading(false);
      }
    }
  };

  const handleCheckAiAnswer = () => {
    const currentQuiz = dynamicAiQuiz || activeLevelData.quiz;
    if (aiSelectedOption === null || !currentQuiz) return;

    setAiQuizSubmitted(true);
    const isCorrect = aiSelectedOption === currentQuiz.correctIndex;
    if (isCorrect) {
      setAiFeedback(`🎉 Excellent! You solved Level ${activeLevelNumber}.\n\n${currentQuiz.explanation}`);
      unlockNextLevel(activeLevelNumber);
    } else {
      setAiFeedback(`Keep practicing! The natural response was "${currentQuiz.options[currentQuiz.correctIndex]}".\n\n${currentQuiz.explanation}`);
    }
  };

  // Jump directly to current active level page
  const handleJumpToMyLevel = () => {
    const page = Math.ceil(unlockedLevel / batchSize);
    setCurrentBatchPage(page);
    setActiveLevelNumber(unlockedLevel);
    setShowTooltip(true);
  };

  const progressPercent = Math.min(100, Math.round(((unlockedLevel - 1) / 1000) * 100));

  return (
    <View style={styles.screenContainer}>
      {/* ================= TOP SUB-HEADER ================= */}
      <View style={styles.subHeader}>
        <View style={styles.pathwayTitleGroup}>
          <Text style={styles.pathwayTitleText}>English Mastery</Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>1,000 Levels</Text>
          </View>
        </View>

        {/* Timer Pill: ⏱️ 20:00 */}
        <View style={styles.timerPill}>
          <Ionicons name="time-outline" size={14} color="#D97706" style={{ marginRight: 4 }} />
          <Text style={styles.timerPillText}>{formatTimer(secondsRemaining)}</Text>
        </View>

        {/* History Link */}
        <TouchableOpacity
          onPress={onPressHistory}
          style={styles.historyBtn}
          accessibilityRole="button"
          accessibilityLabel="Open Practice History"
        >
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* ================= OVERALL PROGRESS CARD ================= */}
      <View style={styles.progressCard}>
        <View style={styles.progressCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressLevelText}>
              Current: <Text style={{ color: '#4F46E5', fontWeight: '900' }}>Level {unlockedLevel}</Text> of 1,000
            </Text>
            <Text style={styles.progressSubText}>
              {completedLevels.length} Levels Solved • {completedLevels.length * 20} Stars Earned ⭐
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleJumpToMyLevel}
            style={styles.jumpBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="locate-outline" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.jumpBtnText}>My Level</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.max(2, progressPercent)}%` }]} />
        </View>
      </View>

      {/* ================= PAGE / BATCH SELECTOR (e.g. 1–50, 51–100) ================= */}
      <View style={styles.batchPaginationBar}>
        <TouchableOpacity
          onPress={() => setCurrentBatchPage((prev) => Math.max(1, prev - 1))}
          disabled={currentBatchPage === 1}
          style={[styles.pageNavBtn, currentBatchPage === 1 && { opacity: 0.35 }]}
        >
          <Ionicons name="chevron-back" size={18} color="#4F46E5" />
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isSelected = p === currentBatchPage;
            const startNum = (p - 1) * batchSize + 1;
            const endNum = p * batchSize;
            const hasUnlocked = unlockedLevel >= startNum;

            return (
              <TouchableOpacity
                key={p}
                onPress={() => setCurrentBatchPage(p)}
                style={[
                  styles.batchPill,
                  isSelected && styles.batchPillActive,
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.batchPillText, isSelected && styles.batchPillTextActive]}>
                  {startNum}–{endNum}
                </Text>
                {hasUnlocked && !isSelected && (
                  <View style={styles.unlockedDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={() => setCurrentBatchPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentBatchPage === totalPages}
          style={[styles.pageNavBtn, currentBatchPage === totalPages && { opacity: 0.35 }]}
        >
          <Ionicons name="chevron-forward" size={18} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* ================= 1000 LEVEL ROADMAP CANVAS ================= */}
      <LinearGradient
        colors={['#BFDBFE', '#DBEAFE', '#EFF6FF', '#F8FAFC']}
        style={styles.skyGradient}
      >
        <ScrollView contentContainerStyle={styles.pathwayScroll} showsVerticalScrollIndicator={false}>
          {visibleLevels.map((lvl, idx) => {
            const isCompleted = completedLevels.includes(lvl.level);
            const isUnlocked = lvl.level <= unlockedLevel;
            const isSelected = activeLevelNumber === lvl.level;
            const isRightSide = idx % 2 === 1;

            return (
              <View key={lvl.level} style={{ width: '100%', alignItems: 'center', marginBottom: 16 }}>
                {/* Milestone Node */}
                <View
                  style={[
                    styles.milestoneNode,
                    isRightSide
                      ? { alignSelf: 'flex-end', marginRight: 48 }
                      : { alignSelf: 'flex-start', marginLeft: 48 },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectLevelNode(lvl.level)}
                    activeOpacity={0.85}
                    style={[
                      styles.hexagonShape,
                      isCompleted && styles.hexagonShapeCompleted,
                      isSelected && isUnlocked && styles.hexagonShapeSelected,
                      !isUnlocked && styles.hexagonShapeLocked,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark-sharp" size={26} color="#FFFFFF" />
                    ) : !isUnlocked ? (
                      <Ionicons name="lock-closed" size={22} color="#94A3B8" />
                    ) : (
                      <Text style={styles.hexagonNum}>{lvl.level}</Text>
                    )}
                    <Text
                      style={[
                        styles.hexagonLabel,
                        isCompleted && { color: '#FFFFFF' },
                        !isUnlocked && { color: '#94A3B8' },
                      ]}
                    >
                      {isCompleted ? 'Solved' : !isUnlocked ? 'Locked' : 'Level'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.chapterSubtitle} numberOfLines={1}>
                    {lvl.title.replace(`Level ${lvl.level}: `, '')}
                  </Text>
                </View>

                {/* Active Unlocked Level Interactive Callout Card */}
                {isSelected && isUnlocked && showTooltip && (
                  <View style={styles.tooltipCalloutBox}>
                    <View style={styles.tooltipArrowUp} />
                    <View style={styles.tooltipCard}>
                      <TouchableOpacity
                        onPress={() => setShowTooltip(false)}
                        style={styles.tooltipCloseBtn}
                      >
                        <Ionicons name="close" size={18} color="#64748B" />
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <View
                          style={[
                            styles.statusDot,
                            isCompleted ? { backgroundColor: '#10B981' } : { backgroundColor: '#F59E0B' },
                          ]}
                        />
                        <Text style={styles.tooltipBadge}>
                          {isCompleted ? 'Level Solved ✓' : 'Ready to Practice'}
                        </Text>
                      </View>

                      <Text style={styles.tooltipTitle}>{lvl.title}</Text>
                      <Text style={styles.tooltipSubtitle}>{lvl.subtitle}</Text>

                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                        <TouchableOpacity
                          onPress={handleStartLesson}
                          style={styles.startStarsBtn}
                          activeOpacity={0.88}
                        >
                          <Ionicons name="book-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                          <Text style={styles.startStarsBtnText}>LEARN +20 STARS</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleStartAiPractice}
                          style={styles.aiSpeakingBtn}
                          activeOpacity={0.88}
                        >
                          <Ionicons name="sparkles" size={15} color="#4338CA" style={{ marginRight: 5 }} />
                          <Text style={styles.aiSpeakingBtnText}>AI Practice</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 60 }} />
        </ScrollView>
      </LinearGradient>

      {/* ================= MODAL 1: CHAPTER PHRASES PRACTICE ================= */}
      <Modal
        visible={showLessonModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          stopSpeech();
          setShowLessonModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.lessonCardSheet}>
            <View style={styles.lessonSheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lessonSheetCategory}>
                  Level {activeLevelData.level} • {activeLevelData.stageName}
                </Text>
                <Text style={styles.lessonSheetTitle}>{activeLevelData.title}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  stopSpeech();
                  setShowLessonModal(false);
                }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Dots Indicator */}
            <View style={styles.progressDotsRow}>
              {activeLevelData.phrases.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dotItem,
                    i === activePhraseIndex && styles.dotItemActive,
                    i < activePhraseIndex && styles.dotItemDone,
                  ]}
                />
              ))}
            </View>

            {!lessonCompleted ? (
              <View style={styles.phraseCardBody}>
                {/* Phrase Highlight Box */}
                <View style={styles.phraseDisplayBox}>
                  <Text style={styles.phraseMainText}>
                    "{activeLevelData.phrases[activePhraseIndex].phrase}"
                  </Text>
                  {activeLevelData.phrases[activePhraseIndex].phonetic ? (
                    <Text style={styles.phrasePhoneticText}>
                      {activeLevelData.phrases[activePhraseIndex].phonetic}
                    </Text>
                  ) : null}

                  {/* Audio Play Button */}
                  <TouchableOpacity
                    onPress={() =>
                      handlePlayAudio(
                        activeLevelData.phrases[activePhraseIndex].phrase,
                        activePhraseIndex
                      )
                    }
                    style={styles.listenAudioBtn}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={speakingIndex === activePhraseIndex ? 'volume-high' : 'volume-medium-outline'}
                      size={20}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.listenAudioText}>
                      {speakingIndex === activePhraseIndex ? 'Speaking…' : 'Listen Pronunciation'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Meaning & Usage */}
                <View style={styles.phraseMetaBox}>
                  <Text style={styles.phraseMetaLabel}>Meaning:</Text>
                  <Text style={styles.phraseMetaVal}>
                    {activeLevelData.phrases[activePhraseIndex].meaning}
                  </Text>

                  <Text style={[styles.phraseMetaLabel, { marginTop: 12 }]}>Example in Context:</Text>
                  <Text style={[styles.phraseMetaVal, { fontStyle: 'italic', color: '#1E293B' }]}>
                    "{activeLevelData.phrases[activePhraseIndex].example}"
                  </Text>
                </View>

                {/* Next Phrase Button */}
                <TouchableOpacity
                  onPress={handleNextPhrase}
                  style={styles.nextPhraseBtn}
                  activeOpacity={0.88}
                >
                  <Text style={styles.nextPhraseBtnText}>
                    {activePhraseIndex < activeLevelData.phrases.length - 1
                      ? 'Next Phrase →'
                      : `Solve Level ${activeLevelData.level} & Unlock Next ⭐`}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Level Finished Celebration */
              <View style={styles.lessonDoneBox}>
                <Ionicons name="trophy" size={60} color="#F59E0B" />
                <Text style={styles.lessonDoneTitle}>Level {activeLevelData.level} Solved! 🎉</Text>
                <Text style={styles.lessonDoneSubtitle}>
                  You earned +20 Stars! Level {Math.min(1000, activeLevelData.level + 1)} is now UNLOCKED!
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' }}>
                  <TouchableOpacity
                    onPress={handleStartAiPractice}
                    style={[styles.aiSpeakingBtn, { flex: 1, paddingVertical: 14 }]}
                  >
                    <Ionicons name="sparkles" size={17} color="#4338CA" style={{ marginRight: 6 }} />
                    <Text style={styles.aiSpeakingBtnText}>AI Speaking Quiz</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowLessonModal(false)}
                    style={[styles.startStarsBtn, { flex: 1, paddingVertical: 14 }]}
                  >
                    <Text style={styles.startStarsBtnText}>Continue Pathway</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: AI SPEAKING QUIZ (NO GEMINI WORD) ================= */}
      <Modal
        visible={showAiModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.lessonCardSheet}>
            <View style={styles.lessonSheetHeader}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="sparkles" size={22} color="#6366F1" />
                <Text style={styles.lessonSheetTitle}>AI Speaking Challenge</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {aiLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={{ marginTop: 14, color: '#4B5563', fontWeight: '600' }}>
                  Preparing your personalized speaking challenge…
                </Text>
              </View>
            ) : dynamicAiQuiz || activeLevelData.quiz ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Scenario Card */}
                <View style={styles.aiScenarioCard}>
                  <Text style={styles.aiScenarioBadge}>SPOKEN CONVERSATION SCENARIO</Text>
                  <Text style={styles.aiScenarioText}>
                    "{(dynamicAiQuiz || activeLevelData.quiz).scenario}"
                  </Text>
                </View>

                {/* Question Prompt */}
                <Text style={styles.aiQuestionText}>
                  {(dynamicAiQuiz || activeLevelData.quiz).question}
                </Text>

                {/* 4 Multiple Choice Options */}
                {(dynamicAiQuiz || activeLevelData.quiz).options.map((opt, idx) => {
                  const isSelected = aiSelectedOption === idx;
                  const currentQuiz = dynamicAiQuiz || activeLevelData.quiz;
                  let optStyle = styles.aiOptionBox;
                  if (isSelected) optStyle = [styles.aiOptionBox, styles.aiOptionBoxSelected];
                  if (aiQuizSubmitted) {
                    if (idx === currentQuiz.correctIndex) {
                      optStyle = [styles.aiOptionBox, styles.aiOptionBoxCorrect];
                    } else if (isSelected) {
                      optStyle = [styles.aiOptionBox, styles.aiOptionBoxWrong];
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => !aiQuizSubmitted && setAiSelectedOption(idx)}
                      disabled={aiQuizSubmitted}
                      style={optStyle}
                      activeOpacity={0.8}
                    >
                      <View style={styles.aiOptionLetter}>
                        <Text style={styles.aiOptionLetterText}>
                          {String.fromCharCode(65 + idx)}
                        </Text>
                      </View>
                      <Text style={styles.aiOptionText}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Feedback Box */}
                {aiQuizSubmitted && aiFeedback ? (
                  <View style={styles.aiFeedbackBox}>
                    <Text style={styles.aiFeedbackText}>{aiFeedback}</Text>
                  </View>
                ) : null}

                {/* Action Buttons */}
                {!aiQuizSubmitted ? (
                  <TouchableOpacity
                    onPress={handleCheckAiAnswer}
                    disabled={aiSelectedOption === null}
                    style={[
                      styles.nextPhraseBtn,
                      aiSelectedOption === null && { opacity: 0.5 },
                    ]}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.nextPhraseBtnText}>Check Answer</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setShowAiModal(false);
                      // Auto advance to next level if solved
                      if (activeLevelNumber < 1000) {
                        setActiveLevelNumber(activeLevelNumber + 1);
                      }
                    }}
                    style={styles.nextPhraseBtn}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.nextPhraseBtnText}>
                      Proceed to Level {Math.min(1000, activeLevelNumber + 1)} 🚀
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pathwayTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pathwayTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  totalBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  timerPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  historyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  progressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLevelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  jumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  jumpBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  batchPaginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageNavBtn: {
    padding: 6,
  },
  batchPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batchPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  batchPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  batchPillTextActive: {
    color: '#FFFFFF',
  },
  unlockedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  skyGradient: {
    flex: 1,
  },
  pathwayScroll: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  milestoneNode: {
    alignItems: 'center',
  },
  hexagonShape: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  hexagonShapeCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  hexagonShapeSelected: {
    borderColor: '#4F46E5',
    transform: [{ scale: 1.05 }],
  },
  hexagonShapeLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  hexagonNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  hexagonLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  chapterSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 6,
    maxWidth: 140,
    textAlign: 'center',
  },
  tooltipCalloutBox: {
    width: '88%',
    maxWidth: 380,
    alignItems: 'center',
    marginTop: 10,
    zIndex: 10,
  },
  tooltipArrowUp: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  tooltipCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tooltipCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tooltipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  tooltipSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  startStarsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  startStarsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  aiSpeakingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  aiSpeakingBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  lessonCardSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    maxHeight: '90%',
  },
  lessonSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  lessonSheetCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  lessonSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  progressDotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  dotItem: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  dotItemActive: {
    backgroundColor: '#4F46E5',
  },
  dotItemDone: {
    backgroundColor: '#10B981',
  },
  phraseCardBody: {
    width: '100%',
  },
  phraseDisplayBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phraseMainText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 28,
  },
  phrasePhoneticText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
    marginTop: 6,
  },
  listenAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginTop: 14,
  },
  listenAudioText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  phraseMetaBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phraseMetaLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  phraseMetaVal: {
    fontSize: 14,
    color: '#334155',
    marginTop: 3,
    lineHeight: 20,
  },
  nextPhraseBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  nextPhraseBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lessonDoneBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  lessonDoneTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  lessonDoneSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  aiScenarioCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 14,
  },
  aiScenarioBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  aiScenarioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1B4B',
    marginTop: 4,
    lineHeight: 20,
  },
  aiQuestionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  aiOptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  aiOptionBoxSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  aiOptionBoxCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  aiOptionBoxWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  aiOptionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiOptionLetterText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  aiOptionText: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  aiFeedbackBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  aiFeedbackText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
});
