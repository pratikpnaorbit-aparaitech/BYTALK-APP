import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { speakEnglish, stopSpeech } from '../utils/speechHelper';

const { width: windowWidth } = Dimensions.get('window');

// 3 Structured Levels with 14 Complete Chapters
export const LEARNING_LEVELS = [
  {
    id: 1,
    name: 'Beginner',
    tag: 'Level 1',
    description: 'Master everyday greetings, basics, and daily routines',
    color: '#10B981',
    units: [
      {
        unitNumber: 1,
        title: 'Meet and Greet',
        chapters: [
          {
            id: 1,
            num: 1,
            title: 'Informal Opening Greetings',
            subtitle: 'Everyday casual greetings for friends and peers',
            phrases: [
              { phrase: "Hey, what's up?", phonetic: '/heɪ wʌts ʌp/', meaning: 'Casual friendly greeting used with peers and friends', example: "Hey, what's up? Long time no see!" },
              { phrase: "How's it going?", phonetic: '/haʊz ɪt ˈɡoʊɪŋ/', meaning: 'Inquiring how someone is doing in an informal way', example: "Hey Sarah! How's it going with your new course?" },
              { phrase: "Great to meet you!", phonetic: '/ɡreɪt tu miːt juː/', meaning: 'Warm greeting when meeting someone for the first time', example: "Great to meet you, David. Welcome to BYTALK!" },
              { phrase: "Catch you later!", phonetic: '/kætʃ juː ˈleɪtər/', meaning: 'Casual goodbye phrase for everyday talk', example: "I have to jump into a call now. Catch you later!" },
            ],
            quiz: {
              scenario: "You meet an acquaintance at a coffee shop in the afternoon. What is the most natural greeting?",
              question: "Choose the best informal greeting:",
              options: ["How do you do, sir?", "Hey, how's it going?", "Farewell to thee", "I am standing here"],
              correctIndex: 1,
              explanation: "'Hey, how's it going?' is natural and friendly between peers."
            }
          },
          {
            id: 2,
            num: 2,
            title: 'Introductions & Small Talk',
            subtitle: 'Sharing names, origins, and making friends',
            phrases: [
              { phrase: "Where are you based?", phonetic: '/wɛər ɑːr juː beɪst/', meaning: 'Asking what city or place someone currently lives in', example: "Nice to meet you! Where are you based currently?" },
              { phrase: "What do you do for fun?", phonetic: '/wʌt duː juː duː fɔːr fʌn/', meaning: 'Friendly way to ask someone about their hobbies', example: "On weekends, what do you usually do for fun?" },
              { phrase: "I'm originally from...", phonetic: '/aɪm əˈrɪdʒɪnəli frʌm/', meaning: 'Stating your hometown or birthplace', example: "I'm originally from Mumbai, but now I live in Pune." },
              { phrase: "It was lovely chatting!", phonetic: '/ɪt wʌz ˈlʌvli ˈtʃætɪŋ/', meaning: 'Polite wrap-up phrase when ending a pleasant conversation', example: "It was lovely chatting with you! Let's connect again." },
            ],
            quiz: {
              scenario: "Your new speaking partner asks about where you live. How do you answer naturally?",
              question: "Select the most conversational response:",
              options: ["I reside in location coordinate X.", "I am based in Delhi, living here for two years.", "No comment on my geography.", "I am a human."],
              correctIndex: 1,
              explanation: "'I am based in...' is the standard modern conversational expression."
            }
          },
          {
            id: 3,
            num: 3,
            title: 'Everyday Polite Phrases',
            subtitle: 'Saying thanks, pardons, and clarifying ideas',
            phrases: [
              { phrase: "Could you repeat that?", phonetic: '/kʊd juː rɪˈpiːt ðæt/', meaning: 'Polite request when you did not catch what someone said', example: "Sorry, the connection dipped. Could you repeat that?" },
              { phrase: "I appreciate your help!", phonetic: '/aɪ əˈpriːʃieɪt jʊər hɛlp/', meaning: 'Warmly expressing gratitude', example: "Thank you for practicing with me, I appreciate your help!" },
              { phrase: "No worries at all!", phonetic: '/noʊ ˈwʌriz æt ɔːl/', meaning: 'Casual way to say you are welcome or it is okay', example: "Thanks for waiting! — No worries at all, take your time." },
              { phrase: "Could you speak slower?", phonetic: '/kʊd juː spiːk ˈsloʊər/', meaning: 'Helpful phrase when someone is speaking too fast', example: "I'm learning English, could you speak a little slower please?" },
            ],
            quiz: {
              scenario: "Your partner spoke quickly and you didn't hear the last sentence. What should you say?",
              question: "What is the best polite request?",
              options: ["Speak again now!", "Could you repeat that, please?", "You talk bad.", "Why are you fast?"],
              correctIndex: 1,
              explanation: "'Could you repeat that, please?' is polite and clear."
            }
          },
        ]
      },
      {
        unitNumber: 2,
        title: 'Daily Life & Routines',
        chapters: [
          {
            id: 4,
            num: 4,
            title: 'Morning Routines & Habits',
            subtitle: 'Talking about daily schedules and mornings',
            phrases: [
              { phrase: "I'm an early riser", phonetic: '/aɪm ən ˈɜːrli ˈraɪzər/', meaning: 'Someone who naturally wakes up early in the morning', example: "I'm an early riser, so I love jogging at 6 AM." },
              { phrase: "Grabbing a quick bite", phonetic: '/ˈɡræbɪŋ ə kwɪk baɪt/', meaning: 'Getting food quickly when you have limited time', example: "I'm grabbing a quick bite before my morning meeting." },
              { phrase: "Commuting to work", phonetic: '/kəˈmjuːtɪŋ tu wɜːrk/', meaning: 'Traveling from home to your workplace or university', example: "I spend about 30 minutes commuting to work by metro." },
              { phrase: "Winding down for bed", phonetic: '/ˈwaɪndɪŋ daʊn fɔːr bɛd/', meaning: 'Relaxing activities before going to sleep', example: "I usually wind down with a book before going to sleep." },
            ],
            quiz: {
              scenario: "Your friend asks what you do after work to relax before sleeping.",
              question: "Which phrase best expresses relaxing before bed?",
              options: ["I run 20 km at midnight.", "I like winding down with some peaceful music.", "I wake up immediately.", "I start my workday."],
              correctIndex: 1,
              explanation: "'Winding down' means gradually relaxing before sleep."
            }
          },
          {
            id: 5,
            num: 5,
            title: 'Asking Directions & Places',
            subtitle: 'Navigating cities, streets, and finding locations',
            phrases: [
              { phrase: "Excuse me, how do I get to...?", phonetic: '/ɪkˈskjuːz miː haʊ duː aɪ ɡɛt tuː/', meaning: 'Standard polite way to ask for directions', example: "Excuse me, how do I get to the central train station?" },
              { phrase: "Is it within walking distance?", phonetic: '/ɪz ɪt wɪˈðɪn ˈwɔːkɪŋ ˈdɪstəns/', meaning: 'Asking if you can walk there or need transport', example: "Is the museum within walking distance from here?" },
              { phrase: "Take the second right", phonetic: '/teɪk ðə ˈsɛkənd raɪt/', meaning: 'Direction instruction to turn at the second street on the right', example: "Go straight down this avenue and take the second right." },
              { phrase: "You can't miss it!", phonetic: '/juː kænt mɪs ɪt/', meaning: 'The destination is very obvious and easy to spot', example: "It's a big glass building with a blue sign, you can't miss it!" },
            ],
            quiz: {
              scenario: "You want to know if a cafe is close enough to reach on foot.",
              question: "Which question is most natural?",
              options: ["Are my legs able to proceed?", "Is it within walking distance?", "Can you drive me immediately?", "Do they sell food there?"],
              correctIndex: 1,
              explanation: "'Within walking distance' is the standard English idiom."
            }
          },
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'Intermediate',
    tag: 'Level 2',
    description: 'Order food, make plans, express hobbies, and travel with ease',
    color: '#3B82F6',
    units: [
      {
        unitNumber: 3,
        title: 'Social & Dining',
        chapters: [
          {
            id: 6,
            num: 6,
            title: 'Ordering at a Restaurant',
            subtitle: 'Navigating menus, ordering, and paying the bill',
            phrases: [
              { phrase: "Could we get a table for two?", phonetic: '/kʊd wiː ɡɛt ə ˈteɪbəl fɔːr tuː/', meaning: 'Asking the restaurant host for seating', example: "Good evening! Could we get a table for two by the window?" },
              { phrase: "What do you recommend?", phonetic: '/wʌt duː juː ˌrɛkəˈmɛnd/', meaning: 'Asking the server for their top dish suggestions', example: "Everything looks delicious! What do you recommend today?" },
              { phrase: "Can we have the dressing on the side?", phonetic: '/kæn wiː hæv ðə ˈdrɛsɪŋ ɒn ðə saɪd/', meaning: 'Requesting sauce or dressing served separately', example: "I'd love the Caesar salad, but can I have dressing on the side?" },
              { phrase: "Could we split the bill?", phonetic: '/kʊd wiː splɪt ðə bɪl/', meaning: 'Paying for your meal separately with friends', example: "The meal was fantastic! Could we split the bill two ways?" },
            ],
            quiz: {
              scenario: "You are dining with a friend and want to divide the expense equally.",
              question: "What do you say to the waiter?",
              options: ["Take money from everyone randomly.", "Could we split the bill, please?", "You pay for us today.", "We refuse the invoice."],
              correctIndex: 1,
              explanation: "'Could we split the bill?' is the standard and polite expression."
            }
          },
          {
            id: 7,
            num: 7,
            title: 'Hobbies, Music & Films',
            subtitle: 'Sharing opinions on cinema, playlists, and entertainment',
            phrases: [
              { phrase: "I'm really into...", phonetic: '/aɪm ˈrɪəli ˈɪntuː/', meaning: 'Expressing that you enjoy or are enthusiastic about something', example: "Lately I'm really into documentary podcasts about science." },
              { phrase: "It kept me on the edge of my seat!", phonetic: '/ɪt kɛpt miː ɒn ði ɛdʒ ʌv maɪ siːt/', meaning: 'A movie or book that was thrilling and suspenseful', example: "That thriller was brilliant, it kept me on the edge of my seat!" },
              { phrase: "I can't get enough of this song!", phonetic: '/aɪ kænt ɡɛt ɪˈnʌf ʌv ðɪs sɔːŋ/', meaning: 'You love listening to this music on repeat', example: "This melody is so catchy, I can't get enough of it." },
              { phrase: "What kind of genre do you prefer?", phonetic: '/wʌt kaɪnd ʌv ˈʒɑːnrə duː juː prɪˈfɜːr/', meaning: 'Asking what category of music or film someone likes', example: "Do you like sci-fi or are comedy dramas more your genre?" },
            ],
            quiz: {
              scenario: "You want to say that you find an adventure movie extremely exciting.",
              question: "Which idiom fits best?",
              options: ["It put me to sleep.", "It kept me on the edge of my seat!", "It was a plate of salad.", "I broke a leg watching."],
              correctIndex: 1,
              explanation: "'Kept me on the edge of my seat' means thrilling and suspenseful."
            }
          },
          {
            id: 8,
            num: 8,
            title: 'Making & Rescheduling Plans',
            subtitle: 'Setting up dates, invites, and calendar coordination',
            phrases: [
              { phrase: "Are you free this weekend?", phonetic: '/ɑːr juː friː ðɪs ˈwiːkˌɛnd/', meaning: 'Checking someone’s availability for an outing', example: "Are you free this weekend? Let's check out the new art gallery." },
              { phrase: "Does 4 PM work for you?", phonetic: '/dʌz fɔːr piː-ɛm wɜːrk fɔːr juː/', meaning: 'Confirming if a proposed time is convenient', example: "I have an opening in the afternoon. Does 4 PM work for you?" },
              { phrase: "Something came up", phonetic: '/ˈsʌmθɪŋ keɪm ʌp/', meaning: 'An unexpected event happened that requires rescheduling', example: "I'm so sorry, something urgent came up at work. Can we postpone?" },
              { phrase: "Let's take a rain check!", phonetic: '/lɛts teɪk ə reɪn tʃɛk/', meaning: 'Politely declining now but agreeing to do it another time', example: "I'm overloaded tonight, but let's take a rain check for next Tuesday!" },
            ],
            quiz: {
              scenario: "A friend invites you to dinner, but you have an urgent deadline tonight. You want to go next week.",
              question: "What is a polite idiom to suggest doing it later?",
              options: ["Never invite me again.", "Can we take a rain check for next week?", "I am disappearing.", "Rain is falling."],
              correctIndex: 1,
              explanation: "'Take a rain check' means postponing a social invite to a later time."
            }
          },
        ]
      },
      {
        unitNumber: 4,
        title: 'Travel & Adventures',
        chapters: [
          {
            id: 9,
            num: 9,
            title: 'Airport & Flight Navigation',
            subtitle: 'Boarding gates, luggage, and customs check',
            phrases: [
              { phrase: "Where is the boarding gate?", phonetic: '/wɛər ɪz ðə ˈbɔːrdɪŋ ɡeɪt/', meaning: 'Locating the departure area for your airplane', example: "Excuse me, which way to boarding gate B14?" },
              { phrase: "Window or aisle seat?", phonetic: '/ˈwɪndoʊ ɔːr aɪl siːt/', meaning: 'Choosing seat placement in an aircraft', example: "I prefer an aisle seat so I can stretch my legs easily." },
              { phrase: "Do you have baggage to check in?", phonetic: '/duː juː hæv ˈbæɡɪdʒ tu tʃɛk ɪn/', meaning: 'Airport agent asking if you have large luggage', example: "I only have this carry-on backpack, no checked baggage." },
              { phrase: "Have a safe flight!", phonetic: '/hæv ə seɪf flaɪt/', meaning: 'Wishing someone well before airplane departure', example: "It was great seeing you! Have a safe flight back home!" },
            ],
            quiz: {
              scenario: "At airport check-in, you prefer sitting near the walkway rather than next to the glass.",
              question: "Which seat do you request?",
              options: ["The cockpit seat", "An aisle seat, please", "A cloud seat", "A window seat"],
              correctIndex: 1,
              explanation: "An 'aisle seat' is located beside the walking corridor of the plane."
            }
          },
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'Advanced',
    tag: 'Level 3',
    description: 'Professional presentations, job interviews, debates, and idioms',
    color: '#8B5CF6',
    units: [
      {
        unitNumber: 5,
        title: 'Career & Business',
        chapters: [
          {
            id: 11,
            num: 11,
            title: 'Job Interview Excellence',
            subtitle: 'Highlighting skills, experience, and leadership',
            phrases: [
              { phrase: "My core strength lies in...", phonetic: '/maɪ kɔːr strɛŋkθ laɪz ɪn/', meaning: 'Highlighting your primary professional ability', example: "My core strength lies in rapid cross-functional problem solving." },
              { phrase: "I led a high-impact project", phonetic: '/aɪ lɛd ə haɪ ˈɪmpækt ˈprɒdʒɛkt/', meaning: 'Demonstrating initiative and quantifiable success', example: "In my previous role, I led a high-impact team that reduced churn by 18%." },
              { phrase: "I thrive in dynamic environments", phonetic: '/aɪ θraɪv ɪn daɪˈnæmɪk ɪnˈvaɪrənmənts/', meaning: 'Expressing adaptability to fast-paced team challenges', example: "I thrive in dynamic environments where innovation is prioritized." },
              { phrase: "Thank you for this opportunity!", phonetic: '/θæŋk juː fɔːr ðɪs ˌɒpərˈtjuːnɪti/', meaning: 'Professional closing at the end of an interview', example: "Thank you for your time and for this opportunity to discuss the role." },
            ],
            quiz: {
              scenario: "An interviewer asks what makes you stand out for this software role.",
              question: "What is an impressive opening statement?",
              options: ["I need money immediately.", "My core strength lies in designing scalable, reliable systems.", "I don't know much.", "Ask someone else."],
              correctIndex: 1,
              explanation: "'My core strength lies in...' sounds authoritative and professional."
            }
          },
          {
            id: 12,
            num: 12,
            title: 'Business Meetings & Alignment',
            subtitle: 'Expressing viewpoints, agendas, and consensus',
            phrases: [
              { phrase: "Let's align on key milestones", phonetic: '/lɛts əˈlaɪn ɒn kiː ˈmaɪlˌstoʊnz/', meaning: 'Ensuring all team members share the same goals', example: "Before concluding, let's align on key deliverables for Q2." },
              { phrase: "From my perspective...", phonetic: '/frʌm maɪ pərˈspɛktɪv/', meaning: 'Politely voicing your professional viewpoint', example: "From my perspective, focusing on user feedback is the highest priority." },
              { phrase: "Let's circle back on this", phonetic: '/lɛts ˈsɜːrkəl bæk ɒn ðɪs/', meaning: 'Revisiting an agenda topic after gathering more information', example: "We need more data from marketing, so let's circle back on this Thursday." },
              { phrase: "Can you walk us through that?", phonetic: '/kæn juː wɔːk ʌs θruː ðæt/', meaning: 'Asking a presenter to explain their proposal step by step', example: "Great proposal! Can you walk us through the implementation timeline?" },
            ],
            quiz: {
              scenario: "During a meeting, an unresolved topic needs more research before deciding.",
              question: "What is standard professional business phrasing?",
              options: ["Forget about this forever.", "Let's circle back on this once we have the user metrics.", "Everyone leave the room.", "Stop discussing."],
              correctIndex: 1,
              explanation: "'Circle back' is standard business phrasing for returning to an item later."
            }
          },
        ]
      },
      {
        unitNumber: 6,
        title: 'Fluent Debates & Idioms',
        chapters: [
          {
            id: 13,
            num: 13,
            title: 'Popular Idiomatic Expressions',
            subtitle: 'Speaking naturally with native idioms',
            phrases: [
              { phrase: "Hit the nail on the head", phonetic: '/hɪt ðə neɪl ɒn ðə hɛd/', meaning: 'Describing exactly what is causing a situation or issue', example: "Your analysis hit the nail on the head; that's exactly the bottleneck." },
              { phrase: "Bite the bullet", phonetic: '/baɪt ðə ˈbʊlɪt/', meaning: 'Deciding to do something difficult that you have avoided', example: "I was dreading the dentist, but I had to bite the bullet and go." },
              { phrase: "Once in a blue moon", phonetic: '/wʌns ɪn ə bluː muːn/', meaning: 'Happening very rarely or infrequently', example: "He lives overseas, so we only meet once in a blue moon." },
              { phrase: "Break the ice", phonetic: '/breɪk ði aɪs/', meaning: 'Do or say something to relieve tension when strangers meet', example: "Playing a quick language game helped break the ice between learners." },
            ],
            quiz: {
              scenario: "Someone made an observation that was 100% accurate and precise.",
              question: "Which idiom describes their statement?",
              options: ["You broke a leg.", "You hit the nail on the head!", "You spilled the milk.", "You bit the dust."],
              correctIndex: 1,
              explanation: "'Hit the nail on the head' means to say or do something exactly right."
            }
          },
          {
            id: 14,
            num: 14,
            title: 'Expressing Nuanced Opinions',
            subtitle: 'Debating with tact, respect, and persuasion',
            phrases: [
              { phrase: "I see your point, however...", phonetic: '/aɪ siː jʊər pɔɪnt haʊˈɛvər/', meaning: 'Politely acknowledging their logic before presenting a counterpoint', example: "I see your point, however cost efficiency is equally vital here." },
              { phrase: "On the flip side...", phonetic: '/ɒn ðə flɪp saɪd/', meaning: 'Looking at the alternate perspective or other side of an issue', example: "Remote work is flexible, but on the flip side, team bonding takes extra effort." },
              { phrase: "It goes without saying", phonetic: '/ɪt ɡoʊz wɪˈðaʊt ˈseɪɪŋ/', meaning: 'Something that is obvious or generally accepted', example: "It goes without saying that consistent daily practice leads to fluency." },
              { phrase: "I wholeheartedly agree!", phonetic: '/aɪ ˌhoʊlˈhɑːrtɪdli əˈɡriː/', meaning: 'Agreeing with enthusiasm and complete sincerity', example: "I wholeheartedly agree with your suggestion to practice daily." },
            ],
            quiz: {
              scenario: "You want to acknowledge someone's argument respectfully while presenting a different viewpoint.",
              question: "Which phrase creates the most diplomatic transition?",
              options: ["You are completely wrong.", "I see your point, however let's also consider...", "I refuse to hear that.", "End of debate."],
              correctIndex: 1,
              explanation: "'I see your point, however...' validates the other speaker while introducing a counterpoint."
            }
          },
        ]
      }
    ]
  }
];

export default function LearnScreen({
  user,
  userStats,
  onPressHistory,
  onAddStars,
  request,
}) {
  const [selectedLevelId, setSelectedLevelId] = useState(1);
  const [showTooltip, setShowTooltip] = useState(true);
  const [activeChapter, setActiveChapter] = useState(LEARNING_LEVELS[0].units[0].chapters[0]);
  const [completedChapterIds, setCompletedChapterIds] = useState([1]);
  
  // Lesson Modal State
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [lessonCompleted, setLessonCompleted] = useState(false);

  // Gemini AI Practice Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiQuiz, setAiQuiz] = useState(null);
  const [aiSelectedOption, setAiSelectedOption] = useState(null);
  const [aiQuizSubmitted, setAiQuizSubmitted] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');

  // Daily study countdown timer (starts at 20:00)
  const [secondsRemaining, setSecondsRemaining] = useState(20 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Restore completed chapters from local storage
  useEffect(() => {
    AsyncStorage.getItem('bytalk_completed_chapters').then((stored) => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCompletedChapterIds(parsed);
          }
        } catch {}
      }
    }).catch(() => {});
  }, []);

  const saveCompletedChapter = async (chapId) => {
    setCompletedChapterIds((prev) => {
      if (!prev.includes(chapId)) {
        const updated = [...prev, chapId];
        AsyncStorage.setItem('bytalk_completed_chapters', JSON.stringify(updated)).catch(() => {});
        return updated;
      }
      return prev;
    });
  };

  const formatTimer = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentLevel = LEARNING_LEVELS.find((lvl) => lvl.id === selectedLevelId) || LEARNING_LEVELS[0];

  const handleOpenChapter = (chap) => {
    setActiveChapter(chap);
    setShowTooltip(true);
  };

  const handleStartLesson = () => {
    if (!activeChapter) return;
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
    if (activeChapter && activePhraseIndex < activeChapter.phrases.length - 1) {
      setActivePhraseIndex((prev) => prev + 1);
    } else {
      setLessonCompleted(true);
      if (activeChapter) {
        saveCompletedChapter(activeChapter.id);
      }
      if (onAddStars) onAddStars(20);
    }
  };

  // Start Gemini AI Practice for the active chapter
  const handleStartAiPractice = async () => {
    if (!activeChapter) return;
    setShowLessonModal(false);
    setShowAiModal(true);
    setAiSelectedOption(null);
    setAiQuizSubmitted(false);
    setAiFeedback('');
    setAiLoading(true);

    const fallbackQuiz = activeChapter.quiz || {
      scenario: `You are practicing ${activeChapter.title} in a realistic conversation.`,
      question: "Which expression is the most natural in this context?",
      options: [
        activeChapter.phrases[0]?.phrase || "Good morning!",
        "I have no response.",
        "Incorrect sentence here.",
        "None of the above."
      ],
      correctIndex: 0,
      explanation: "This phrase represents the authentic everyday expression for this situation."
    };

    setAiQuiz(fallbackQuiz);

    // Call Gemini API via backend /api/ai/chat if available
    if (request) {
      try {
        const prompt = `Generate a 1-question conversational English quiz for Chapter: "${activeChapter.title}" (${currentLevel.name} level).
Return ONLY valid JSON in this exact structure:
{
  "scenario": "Brief 1-sentence real-world situation",
  "question": "The question to ask the learner",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Why the correct answer is the most natural choice"
}`;
        const res = await request('ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: prompt,
            topic: activeChapter.title,
            proficiencyLevel: currentLevel.name,
          }),
        });

        if (res && res.message) {
          const jsonMatch = res.message.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4) {
              setAiQuiz(parsed);
            }
          }
        }
      } catch (err) {
        console.log('[LearnScreen Gemini Quiz] Using local dynamic quiz:', err.message);
      } finally {
        setAiLoading(false);
      }
    } else {
      setAiLoading(false);
    }
  };

  const handleCheckAiAnswer = () => {
    if (aiSelectedOption === null || !aiQuiz) return;
    setAiQuizSubmitted(true);
    const isCorrect = aiSelectedOption === aiQuiz.correctIndex;
    if (isCorrect) {
      setAiFeedback(`🎉 Excellent! That is exactly right.\n\n${aiQuiz.explanation}`);
      if (activeChapter) {
        saveCompletedChapter(activeChapter.id);
      }
      if (onAddStars) onAddStars(20);
    } else {
      setAiFeedback(`Keep practicing! The best answer was "${aiQuiz.options[aiQuiz.correctIndex]}".\n\n${aiQuiz.explanation}`);
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Sub Header: Learning Pathway | Timer Pill | History */}
      <View style={styles.subHeader}>
        <View style={styles.pathwayTitleGroup}>
          <Text style={styles.pathwayTitleText}>Learning Pathway</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Learning Pathway', 'Follow the units and chapters step-by-step to master spoken English with audio and AI!')}
            style={styles.helpCircle}
          >
            <Ionicons name="help-circle-outline" size={17} color="#64748B" />
          </TouchableOpacity>
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

      {/* Level Selector Tabs */}
      <View style={styles.levelTabsContainer}>
        {LEARNING_LEVELS.map((lvl) => {
          const isSelected = lvl.id === selectedLevelId;
          return (
            <TouchableOpacity
              key={lvl.id}
              onPress={() => {
                setSelectedLevelId(lvl.id);
                const firstChap = lvl.units[0]?.chapters[0];
                if (firstChap) {
                  setActiveChapter(firstChap);
                  setShowTooltip(true);
                }
              }}
              style={[
                styles.levelTabPill,
                isSelected && { backgroundColor: lvl.color, borderColor: lvl.color },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.levelTabTag, isSelected && { color: '#FFFFFF' }]}>
                {lvl.tag}
              </Text>
              <Text style={[styles.levelTabName, isSelected && { color: '#FFFFFF', fontWeight: '700' }]}>
                {lvl.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sky Blue Cloud Background & Scrollable Pathway */}
      <LinearGradient
        colors={['#BFDBFE', '#DBEAFE', '#EFF6FF', '#F8FAFC']}
        style={styles.skyGradient}
      >
        <ScrollView contentContainerStyle={styles.pathwayScroll} showsVerticalScrollIndicator={false}>
          {currentLevel.units.map((unit) => (
            <View key={unit.unitNumber} style={styles.unitSection}>
              {/* Unit Frosted Header */}
              <View style={styles.unitHeaderCard}>
                <Text style={styles.unitBadgeText}>Unit {unit.unitNumber}</Text>
                <Text style={styles.unitTitleText}>{unit.title}</Text>
              </View>

              {/* Pathway Canvas with Chapters */}
              <View style={styles.pathwayCanvas}>
                {unit.chapters.map((chap, idx) => {
                  const isCompleted = completedChapterIds.includes(chap.id);
                  const isSelected = activeChapter?.id === chap.id;
                  const isRightSide = idx % 2 === 1;

                  return (
                    <View key={chap.id} style={{ width: '100%', alignItems: 'center' }}>
                      <View
                        style={[
                          styles.milestoneNode,
                          isRightSide
                            ? { alignSelf: 'flex-end', marginRight: 42, marginTop: 24 }
                            : { alignSelf: 'flex-start', marginLeft: 42, marginTop: 24 },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => handleOpenChapter(chap)}
                          activeOpacity={0.85}
                          style={[
                            styles.hexagonShape,
                            isCompleted && styles.hexagonShapeCompleted,
                            isSelected && styles.hexagonShapeSelected,
                          ]}
                        >
                          {isCompleted ? (
                            <Ionicons name="checkmark-sharp" size={26} color="#FFFFFF" />
                          ) : (
                            <Text style={styles.hexagonNum}>{chap.num}</Text>
                          )}
                          <Text style={[styles.hexagonLabel, isCompleted && { color: '#FFFFFF' }]}>
                            Chapter
                          </Text>
                        </TouchableOpacity>

                        <Text style={styles.chapterSubtitle} numberOfLines={1}>
                          {chap.title}
                        </Text>
                      </View>

                      {/* Tooltip Card for Active Chapter */}
                      {isSelected && showTooltip && (
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
                              <View style={[styles.statusDot, isCompleted ? { backgroundColor: '#10B981' } : { backgroundColor: '#F59E0B' }]} />
                              <Text style={styles.tooltipBadge}>
                                {isCompleted ? 'Completed' : 'Ready to Start'}
                              </Text>
                            </View>

                            <Text style={styles.tooltipTitle}>{chap.title}</Text>
                            <Text style={styles.tooltipSubtitle}>{chap.subtitle}</Text>

                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
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
                                style={styles.geminiAiBtn}
                                activeOpacity={0.88}
                              >
                                <Ionicons name="sparkles" size={15} color="#4338CA" style={{ marginRight: 5 }} />
                                <Text style={styles.geminiAiBtnText}>Gemini AI</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
          <View style={{ height: 60 }} />
        </ScrollView>
      </LinearGradient>

      {/* ================= MODAL 1: CHAPTER LESSON PHRASES ================= */}
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
                  {currentLevel.name} • Chapter {activeChapter?.num}
                </Text>
                <Text style={styles.lessonSheetTitle}>{activeChapter?.title}</Text>
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

            {/* Lesson Progress Dots */}
            {activeChapter && (
              <View style={styles.progressDotsRow}>
                {activeChapter.phrases.map((_, i) => (
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
            )}

            {!lessonCompleted && activeChapter ? (
              <View style={styles.phraseCardBody}>
                {/* Phrase Highlight Box */}
                <View style={styles.phraseDisplayBox}>
                  <Text style={styles.phraseMainText}>
                    "{activeChapter.phrases[activePhraseIndex].phrase}"
                  </Text>
                  {activeChapter.phrases[activePhraseIndex].phonetic ? (
                    <Text style={styles.phrasePhoneticText}>
                      {activeChapter.phrases[activePhraseIndex].phonetic}
                    </Text>
                  ) : null}

                  {/* Audio Play Button */}
                  <TouchableOpacity
                    onPress={() =>
                      handlePlayAudio(
                        activeChapter.phrases[activePhraseIndex].phrase,
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
                    {activeChapter.phrases[activePhraseIndex].meaning}
                  </Text>

                  <Text style={[styles.phraseMetaLabel, { marginTop: 12 }]}>Example:</Text>
                  <Text style={[styles.phraseMetaVal, { fontStyle: 'italic', color: '#1E293B' }]}>
                    "{activeChapter.phrases[activePhraseIndex].example}"
                  </Text>
                </View>

                {/* Next Phrase Button */}
                <TouchableOpacity
                  onPress={handleNextPhrase}
                  style={styles.nextPhraseBtn}
                  activeOpacity={0.88}
                >
                  <Text style={styles.nextPhraseBtnText}>
                    {activePhraseIndex < activeChapter.phrases.length - 1 ? 'Next Phrase →' : 'Complete & Earn 20 Stars ⭐'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Lesson Finished Celebration View */
              <View style={styles.lessonDoneBox}>
                <Ionicons name="trophy" size={60} color="#F59E0B" />
                <Text style={styles.lessonDoneTitle}>Chapter Completed! 🎉</Text>
                <Text style={styles.lessonDoneSubtitle}>
                  You earned +20 Stars and unlocked your next milestone!
                </Text>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' }}>
                  <TouchableOpacity
                    onPress={handleStartAiPractice}
                    style={[styles.geminiAiBtn, { flex: 1, paddingVertical: 14 }]}
                  >
                    <Ionicons name="sparkles" size={17} color="#4338CA" style={{ marginRight: 6 }} />
                    <Text style={styles.geminiAiBtnText}>Gemini AI Practice</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowLessonModal(false)}
                    style={[styles.startStarsBtn, { flex: 1, paddingVertical: 14 }]}
                  >
                    <Text style={styles.startStarsBtnText}>Back to Pathway</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= MODAL 2: GEMINI AI PRACTICE QUIZ ================= */}
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
                <Text style={styles.lessonSheetTitle}>Gemini AI Speaking Practice</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {aiLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={{ marginTop: 14, color: '#4B5563', fontWeight: '600' }}>
                  Gemini is crafting your personalized scenario…
                </Text>
              </View>
            ) : aiQuiz ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Scenario Card */}
                <View style={styles.aiScenarioCard}>
                  <Text style={styles.aiScenarioBadge}>CONVERSATION SCENARIO</Text>
                  <Text style={styles.aiScenarioText}>"{aiQuiz.scenario}"</Text>
                </View>

                {/* Question Prompt */}
                <Text style={styles.aiQuestionText}>{aiQuiz.question}</Text>

                {/* 4 Multiple Choice Options */}
                {aiQuiz.options.map((opt, idx) => {
                  const isSelected = aiSelectedOption === idx;
                  let optStyle = styles.aiOptionBox;
                  if (isSelected) optStyle = [styles.aiOptionBox, styles.aiOptionBoxSelected];
                  if (aiQuizSubmitted) {
                    if (idx === aiQuiz.correctIndex) {
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

                {/* Feedback Box after Submit */}
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
                    onPress={() => setShowAiModal(false)}
                    style={styles.nextPhraseBtn}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.nextPhraseBtnText}>Finish & Return to Pathway</Text>
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
  },
  pathwayTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  helpCircle: {
    marginLeft: 5,
    padding: 2,
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
  levelTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  levelTabPill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  levelTabTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  levelTabName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 1,
  },
  skyGradient: {
    flex: 1,
  },
  pathwayScroll: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  unitSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  unitHeaderCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 16,
  },
  unitBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unitTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  pathwayCanvas: {
    width: '100%',
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
  hexagonNum: {
    fontSize: 22,
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
    maxWidth: 130,
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
  geminiAiBtn: {
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
  geminiAiBtnText: {
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
