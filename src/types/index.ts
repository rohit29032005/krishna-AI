export type SupportedLanguage = 'hi' | 'en';

export interface GitaVerse {
  id: string; // e.g. "BG_2_47"
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration: string;
  wordMeanings?: string;
  hindiTranslation: string;
  englishTranslation: string;
  context: string;
  explanation: string;
  practicalLifeApplication: string;
  topics: string[];
  emotions: string[];
  verifiedSource: string;
}

export interface GitaChapter {
  chapterNumber: number;
  nameSanskrit: string;
  nameTransliteration: string;
  nameEnglish: string;
  nameHindi: string;
  versesCount: number;
  summary: string;
}

export interface StructuredGitaResponse {
  supportingPassages?: { verse: GitaVerse; connection: string }[]; // Up to two; legacy shloka stays primary
  acknowledgement: string;
  shloka: GitaVerse | null;
  explanation: string;
  practicalLifeApplication: string;
  followUpSuggestion: string;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatRequest {
  message: string;
  language: SupportedLanguage;
  conversationId?: string;
  history?: ChatHistoryMessage[];
}

