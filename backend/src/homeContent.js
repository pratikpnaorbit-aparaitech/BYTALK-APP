const generalTopics = [
  {
    id: 'talk_anything',
    title: 'Talk about anything',
    level: 'Easy',
    category: 'General',
    icon: 'chatbubbles',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    starterPrompt: "Let's have an open and friendly conversation about anything on your mind!",
    graphic: 'people_chatting',
  },
  {
    id: 'daily_routine',
    title: 'Daily routine',
    level: 'Easy',
    category: 'General',
    icon: 'sunny',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    starterPrompt: 'Tell me about your daily routine. What does a typical day look like for you?',
    graphic: 'person_walking',
  },
  {
    id: 'improve_vocabulary',
    title: "Let's Improve vocabulary",
    level: 'Easy',
    category: 'General',
    icon: 'school',
    color: '#10B981',
    bgColor: '#ECFDF5',
    starterPrompt: "Let's learn and practice new vocabulary words today! What words would you like to explore?",
    graphic: 'classroom_board',
  },
  {
    id: 'childhood_memory',
    title: 'Talk about your childhood memory',
    level: 'Easy',
    category: 'General',
    icon: 'balloon',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    starterPrompt: 'What is one of your favorite memories from growing up as a child?',
    graphic: 'child_balloon',
  },
  {
    id: 'travel_destinations',
    title: 'Travel & Dream destinations',
    level: 'Easy',
    category: 'General',
    icon: 'airplane',
    color: '#06B6D4',
    bgColor: '#ECFEFF',
    starterPrompt: 'Where in the world would you love to travel to next, and why?',
    graphic: 'travel_world',
  },
  {
    id: 'movies_music',
    title: 'Movies & Favorite music',
    level: 'Easy',
    category: 'General',
    icon: 'musical-notes',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    starterPrompt: 'What kind of movies or music do you enjoy listening to when you relax?',
    graphic: 'headphones_music',
  },
];

const interviewTopics = [
  {
    id: 'self_introduction',
    title: 'Tell me about yourself',
    level: 'Easy',
    category: 'Interview',
    icon: 'person',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    starterPrompt: 'Welcome to your interview practice! Please introduce yourself and your background.',
    graphic: 'interview_handshake',
  },
  {
    id: 'job_interview',
    title: 'Job interview practice',
    level: 'Medium',
    category: 'Interview',
    icon: 'briefcase',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    starterPrompt: 'Why are you interested in this position, and what strengths make you a great fit?',
    graphic: 'job_interview',
  },
  {
    id: 'strengths_weaknesses',
    title: 'Strengths & Weaknesses',
    level: 'Medium',
    category: 'Interview',
    icon: 'ribbon',
    color: '#10B981',
    bgColor: '#ECFDF5',
    starterPrompt: 'What do you consider your greatest strength, and what is an area you are actively improving?',
    graphic: 'strengths_weaknesses',
  },
  {
    id: 'career_aspirations',
    title: 'Future career goals',
    level: 'Medium',
    category: 'Interview',
    icon: 'rocket',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    starterPrompt: 'Where do you see your career heading in the next 3 to 5 years?',
    graphic: 'career_aspirations',
  },
];

export const DEFAULT_HOME_CONTENT = {
  sections: [
    { id: 'general', title: 'General', enabled: true, topics: generalTopics.map((topic) => ({ ...topic, enabled: true })) },
    { id: 'interview', title: 'Interview', enabled: true, topics: interviewTopics.map((topic) => ({ ...topic, enabled: true })) },
  ],
};

const LEVELS = new Set(['Easy', 'Medium', 'Hard']);
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,60}$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function normalizeHomeContent(value) {
  if (!value || !Array.isArray(value.sections) || value.sections.length > 12) return null;

  const sectionIds = new Set();
  const sections = [];
  for (const section of value.sections) {
    if (!section || typeof section !== 'object' || !ID_PATTERN.test(section.id || '') || sectionIds.has(section.id)) return null;
    const title = cleanText(section.title, 60);
    if (!title || !Array.isArray(section.topics) || section.topics.length > 30) return null;

    sectionIds.add(section.id);
    const topicIds = new Set();
    const topics = [];
    for (const topic of section.topics) {
      if (!topic || typeof topic !== 'object' || !ID_PATTERN.test(topic.id || '') || topicIds.has(topic.id)) return null;
      const topicTitle = cleanText(topic.title, 80);
      const level = LEVELS.has(topic.level) ? topic.level : 'Easy';
      const starterPrompt = cleanText(topic.starterPrompt, 500);
      const icon = cleanText(topic.icon, 40);
      const color = COLOR_PATTERN.test(topic.color || '') ? topic.color : '#8B5CF6';
      const bgColor = COLOR_PATTERN.test(topic.bgColor || '') ? topic.bgColor : '#F5F3FF';
      if (!topicTitle || !starterPrompt) return null;

      topicIds.add(topic.id);
      topics.push({
        id: topic.id,
        title: topicTitle,
        level,
        category: title,
        starterPrompt,
        icon: icon || 'chatbubbles',
        color,
        bgColor,
        graphic: cleanText(topic.graphic, 40),
        enabled: topic.enabled !== false,
      });
    }

    sections.push({
      id: section.id,
      title,
      enabled: section.enabled !== false,
      topics,
    });
  }

  return { sections };
}

export function publishedHomeContent(content) {
  const normalized = normalizeHomeContent(content) || DEFAULT_HOME_CONTENT;
  return {
    sections: normalized.sections
      .filter((section) => section.enabled)
      .map((section) => ({
        ...section,
        topics: section.topics.filter((topic) => topic.enabled),
      })),
  };
}
