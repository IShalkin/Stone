
export type Language = 'en' | 'ru' | 'cs';

export interface LocationData {
  latitude: number;
  longitude: number;
  heading?: number | null; // 0-360 degrees
  speed?: number | null; // meters per second
  address?: string; // Human readable address for manual picker
}

export interface UserProfile {
  id?: string; // Database ID
  email?: string; // Auth email
  authProvider?: 'local' | 'google' | 'supabase';
  name: string;
  preferences: string; // The system prompt context generated or written by user
}

export interface AISettings {
  geminiApiKey: string;
  openRouterKey: string;
  openRouterModel: string;
  elevenLabsKey: string;
  googleMapsKey?: string;
}

export enum PersonaId {
  HISTORIAN = 'historian',
  ATMOSPHERIC = 'atmospheric', // Like "Perfume"
  PRISONER = 'prisoner',
  GOSSIP = 'gossip',
  CINEMATOGRAPHER = 'cinematographer',
  CUSTOM = 'custom'
}

export interface Persona {
  id: string; // Changed from PersonaId to string to allow unique custom IDs (e.g., 'custom-123')
  name: string;
  role: string;
  description: string;
  systemInstruction: string;
  voiceName: string; // Map to Gemini TTS voices (Kore, Puck, etc.)
  elevenLabsVoiceId?: string; // Optional ID for ElevenLabs
  icon: string; // Lucide icon name or emoji
  color: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  audioUrl?: string; // Blob URL
  imageUrl?: string; // Data URL for user uploaded images or generated images
  imageType?: 'photorealistic' | 'artistic'; // To badge the image
  isGeneratingImage?: boolean; // UI state for loading image
  timestamp: number;
  isAudioPlaying?: boolean;
  sources?: { title: string; uri: string }[];
  modelName?: string; // The ID of the model that generated this message
}

export interface TourRequest {
  text?: string;
  image?: string; // base64
  location: LocationData;
  persona: Persona;
  history?: Message[]; // Chat history for context
  userProfile?: UserProfile;
  language: Language;
  settings?: AISettings;
}

export interface TourResponse {
  text: string;
  visual?: {
    type: 'photorealistic' | 'artistic';
    query: string;
  };
  sources?: { title: string; uri: string }[];
  modelName?: string;
}
