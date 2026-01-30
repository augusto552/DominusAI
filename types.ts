export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string for generated or uploaded images
  timestamp: number;
  isThinking?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface UserMemory {
  facts: string[];
  lastInteraction: number;
}

export enum ModelType {
  TEXT = 'gemini-2.5-flash',
  IMAGE_GEN = 'gemini-2.5-flash-image', // Capable of generation and editing
}
