export type Category = 'study' | 'essay' | 'code' | 'language' | 'general';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  category: Category;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export const categoryLabels: Record<Category, string> = {
  study: 'Study',
  essay: 'Essay',
  code: 'Code',
  language: 'Language',
  general: 'General',
};

export const categoryColors: Record<Category, string> = {
  study: 'bg-category-study',
  essay: 'bg-category-essay',
  code: 'bg-category-code',
  language: 'bg-category-language',
  general: 'bg-category-general',
};
