
import { UserProfile, Message, AISettings, Persona, Language } from '../types';

// Keys for LocalStorage (Simulating Database Tables)
const KEYS = {
  PROFILE: 'sw_user_profile',
  HISTORY: 'sw_chat_history',
  SETTINGS: 'sw_ai_settings',
  CUSTOM_PERSONA: 'sw_custom_persona',
  LANG: 'sw_lang'
};

/**
 * UUID Generator fallback for non-secure contexts
 */
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (parseInt(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> parseInt(c) / 4).toString(16)
  );
};

/**
 * Storage Service Abstraction
 * Currently uses localStorage, but all methods are async to allow 
 * easy swapping with Supabase/Firebase in the future.
 */
export const storage = {
  user: {
    load: async (): Promise<UserProfile | null> => {
      try {
        const data = localStorage.getItem(KEYS.PROFILE);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        console.warn("Storage access failed", e);
        return null;
      }
    },
    save: async (profile: UserProfile): Promise<void> => {
      try {
        const dataToSave = { ...profile, id: profile.id || generateUUID(), authProvider: profile.authProvider || 'local' };
        localStorage.setItem(KEYS.PROFILE, JSON.stringify(dataToSave));
      } catch (e) {
        console.error("Failed to save profile", e);
      }
    }
  },
  
  history: {
    load: async (): Promise<Message[]> => {
      try {
        const data = localStorage.getItem(KEYS.HISTORY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.warn("Storage access failed", e);
        return [];
      }
    },
    save: async (messages: Message[]): Promise<void> => {
      try {
        // Sanitize messages before saving to prevent QuotaExceededError
        // 1. Remove Audio URLs (Blobs are temporary)
        // 2. Remove Image Data URLs (Base64 is too large for localStorage)
        // 3. Keep only the last 50 messages
        const messagesToSave = messages
          .slice(-50)
          .map(m => {
            const sanitized = { 
                ...m, 
                audioUrl: undefined, 
                isAudioPlaying: false 
            };
            
            // Strip large base64 strings to save space
            if (sanitized.imageUrl && sanitized.imageUrl.startsWith('data:')) {
                sanitized.imageUrl = undefined;
            }
            
            return sanitized;
          });
          
        localStorage.setItem(KEYS.HISTORY, JSON.stringify(messagesToSave));
      } catch (error) {
        console.warn("Storage quota exceeded or denied. Attempting emergency cleanup.", error);
        
        try {
            // Fallback: Save only the last 10 messages without any visuals to preserve at least some text context
            const emergencySave = messages.slice(-10).map(m => ({
                ...m,
                audioUrl: undefined,
                imageUrl: undefined,
                isAudioPlaying: false
            }));
            localStorage.setItem(KEYS.HISTORY, JSON.stringify(emergencySave));
        } catch (innerError) {
            console.error("Critical storage failure. Could not save history.", innerError);
        }
      }
    },
    clear: async (): Promise<void> => {
      try {
        localStorage.removeItem(KEYS.HISTORY);
      } catch (e) { console.error(e); }
    }
  },

  settings: {
    load: async (): Promise<AISettings | undefined> => {
      try {
        const data = localStorage.getItem(KEYS.SETTINGS);
        return data ? JSON.parse(data) : undefined;
      } catch (e) { return undefined; }
    },
    save: async (settings: AISettings): Promise<void> => {
      try {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      } catch (e) { console.error(e); }
    }
  },

  customPersona: {
    load: async (): Promise<Persona[]> => {
      try {
        const data = localStorage.getItem(KEYS.CUSTOM_PERSONA);
        if (!data) return [];
        
        const parsed = JSON.parse(data);
        
        // Migration: Handle legacy format (single object)
        if (!Array.isArray(parsed)) {
            return [parsed];
        }
        return parsed;
      } catch (e) { return []; }
    },
    save: async (personas: Persona[]): Promise<void> => {
      try {
        localStorage.setItem(KEYS.CUSTOM_PERSONA, JSON.stringify(personas));
      } catch (e) { console.error(e); }
    }
  },

  // Language is critical for immediate UI rendering, so we keep a synchronous accessor
  // but allow for async syncing later.
  language: {
    get: (): Language => {
      try {
        return (localStorage.getItem(KEYS.LANG) as Language) || 'en';
      } catch (e) { return 'en'; }
    },
    set: (lang: Language) => {
      try {
        localStorage.setItem(KEYS.LANG, lang);
      } catch (e) { console.error(e); }
    }
  }
};
