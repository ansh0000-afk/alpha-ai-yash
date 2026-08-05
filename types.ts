export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  tags?: string[];
}

export interface KnowledgeNote {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  tags?: string[];
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ToolExecution {
  name: string;
  args: Record<string, any>;
  result?: string;
}

export interface DocumentAttachment {
  name: string;
  size: number;
  type: string;
  pageCount?: number;
  textContent: string;
  summary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  groundingSources?: GroundingSource[];
  imageUrl?: string;
  attachedImage?: string; // base64 input image
  attachedDoc?: DocumentAttachment; // attached PDF / text doc
  toolExecutions?: ToolExecution[];
  audioUrl?: string;
  status?: 'sending' | 'thinking' | 'done' | 'error';
  feedback?: 'like' | 'dislike' | null;
  editedAt?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  personaId?: string;
}

export interface UserMemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'preference' | 'fact' | 'instruction' | 'general';
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'email' | 'guest';
  preferredRole?: 'student' | 'coder' | 'creator' | 'general';
  favoriteLanguage?: string;
  preferredLanguage?: string;
  isLoggedIn: boolean;
  joinedAt: string;
}

export interface VoiceSettings {
  voiceURI: string;
  rate: number;
  pitch: number;
  autoSpeak: boolean;
  language: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';

export interface AgentPersona {
  id: string;
  name: string;
  title: string;
  avatar: string;
  description: string;
  systemPrompt: string;
  tone: string;
  accentColor: string;
  suggestedPrompts: string[];
}

export interface AgentSettings {
  activePersonaId: string;
  enableSearch: boolean;
  enableVoiceResponse: boolean;
  userCustomInstructions: string;
  theme: ThemeMode;
  userName: string;
  preferredLanguage: string;
  voiceSettings: VoiceSettings;
  memoryEnabled: boolean;
  aiModel?: string;
  temperature?: number;
  maxTokens?: number;
  fontSize?: 'small' | 'medium' | 'large';
}

