import { GoogleGenAI, Modality, LiveServerMessage, FunctionDeclaration, Type, Tool } from "@google/genai";
import { TourRequest, Persona, LocationData, TourResponse, UserProfile, PersonaId, Language, AISettings } from "../types";
import { generateTextOpenRouter, generateSpeechElevenLabs } from "./external";

const createGeminiClient = (apiKey: string): GoogleGenAI => {
  if (!apiKey) {
    throw new Error("Gemini API key is required. Please add it in Settings.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Helper: Fetch deep knowledge about the location using Google Search
 */
export const getNearbyKnowledge = async (location: LocationData, language: Language, geminiApiKey: string): Promise<string> => {
  try {
    const ai = createGeminiClient(geminiApiKey);
    const langName = language === 'ru' ? 'Russian' : (language === 'cs' ? 'Czech' : 'English');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find interesting, specific, and lesser-known historical and current facts about the location at Latitude ${location.latitude}, Longitude ${location.longitude}. 
      Focus on:
      1. What are the specific buildings/landmarks right there?
      2. How are they used TODAY?
      3. Any dark history, legends, or specific architectural details.
      4. Avoid generic tourist info, look for "deep cuts".
      
      OUTPUT REQUIREMENT: Return a concise summary paragraph (approx 200 words) IN ${langName.toUpperCase()}.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a senior researcher preparing a dossier for a tour guide.",
      }
    });
    
    return response.text || "";
  } catch (error) {
    console.warn("Failed to fetch background knowledge", error);
    return "";
  }
};

/**
 * Helper: Perform a specific web search query on behalf of the Live Agent
 */
const performWebSearch = async (query: string, language: Language, ai: GoogleGenAI): Promise<string> => {
  try {
    const langName = language === 'ru' ? 'Russian' : (language === 'cs' ? 'Czech' : 'English');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Search query: ${query}. 
      Summarize the answer in 2-3 sentences IN ${langName.toUpperCase()}.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a search engine proxy. Provide a concise, factual answer based on results.",
      }
    });
    return response.text || "Information not found.";
  } catch (error) {
    console.error("Web search failed", error);
    return "Archive access error.";
  }
};

/**
 * Helper: Generate user profile summary from quiz answers
 */
export const generateUserProfileSummary = async (answers: string[], language: Language, geminiApiKey: string): Promise<string> => {
  try {
    const ai = createGeminiClient(geminiApiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze these user answers to a travel preference quiz (Language: ${language}):
        1. Interests: ${answers[0]}
        2. Presentation Style: ${answers[1]}
        3. Dislikes/Avoid: ${answers[2]}

        Create a concise (2-3 sentences) "System Instruction Context" that describes this user to a tour guide AI. 
        Format it like: "The user is interested in X and Y. They prefer Z style of explanation. Avoid Q."
        Keep the instruction in English for the system prompt compatibility.
      `,
    });
    return response.text || "User loves exploring.";
  } catch (error) {
    console.error("Profile generation failed", error);
    return "User loves exploring.";
  }
};

/**
 * Helper: Generate a Custom Persona based on quiz answers
 */
export const generateCustomPersona = async (name: string, answers: string[], language: Language, geminiApiKey: string): Promise<Partial<Persona>> => {
  try {
    const ai = createGeminiClient(geminiApiKey);
    const langName = language === 'ru' ? 'Russian' : (language === 'cs' ? 'Czech' : 'English');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Create a detailed "System Instruction" for a fictional AI Tour Guide character based on these user answers:
          
          Character Name: ${name}
          1. Who is this character? (Archetype): ${answers[0]}
          2. Relationship to user: ${answers[1]}
          3. Speaking Style/Catchphrases: ${answers[2]}
          
          Task: Return a JSON object (without Markdown code blocks) with:
          {
             "role": "Short 2-3 word role title (in ${langName})",
             "description": "One sentence description of the character (in ${langName})",
             "systemInstruction": "A highly detailed, immersive system prompt (approx 100 words). Define the voice, tone, specific vocabulary, how they treat the user, and how they describe surroundings. Make it unique and creative. IMPORTANT: INSTRUCT THE AI TO SPEAK IN ${langName}."
          }
        `,
        config: {
            responseMimeType: "application/json"
        }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned");
    return JSON.parse(text);

  } catch (error) {
      console.error("Persona generation failed", error);
      return {
          role: "Custom Guide",
          description: "A custom character created by you.",
          systemInstruction: "You are a custom guide. Act according to the name " + name + `. Speak in ${language}.`
      };
  }
}

/**
 * Helper: Generate an image based on the prompt
 */
export const generateImage = async (prompt: string, type: 'photorealistic' | 'artistic', geminiApiKey: string): Promise<string | null> => {
  try {
    const ai = createGeminiClient(geminiApiKey);
    const refinedPrompt = type === 'photorealistic'
      ? `A highly detailed, 4k, photorealistic travel photography shot of: ${prompt}. Natural lighting, professional composition.`
      : `A cinematic, atmospheric, artistic interpretation of: ${prompt}. Moody, detailed, expressive style, like concept art or a movie frame.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: refinedPrompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed", error);
    return null;
  }
};

/**
 * Helper: Convert URL to Base64
 */
const imageUrlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove data:image/...;base64, prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Failed to convert image URL to base64", e);
        throw e;
    }
};

/**
 * Step 1: Generate the tour content (Text) based on Location, Image, and Persona.
 */
export const generateTourText = async (request: TourRequest): Promise<TourResponse> => {
  const { location, image, persona, text, history, userProfile, language, settings } = request;

  let historyText = "";
  if (history && history.length > 0) {
      const recentHistory = history.slice(-6).filter(msg => msg.id !== 'init'); 
      historyText = recentHistory.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Guide'}: ${msg.text}`
      ).join('\n');
  }

  const userContext = userProfile 
    ? `\n[USER PROFILE]\nName: ${userProfile.name}\nPreferences: ${userProfile.preferences}\nADAPT YOUR STORYTELLING TO MATCH THESE PREFERENCES.`
    : "";

  const langName = language === 'ru' ? 'Russian' : (language === 'cs' ? 'Czech' : 'English');

  let promptText = `
    [CONTEXT]
    User Location: Latitude ${location.latitude}, Longitude ${location.longitude}.
    Language: ${langName} (Strictly output in this language)
    
    [CHAT HISTORY]
    ${historyText}

    [CURRENT USER INPUT]
    ${text || "Tell me about my immediate surroundings based on my location."}
    
    [ROLE]
    ${persona.systemInstruction}

    ${userContext}
    
    [CRITICAL: TOOLS & FACTS]
    - If you have search tools, use them for volatile info (prices, menu, schedule).
    - If no search tools are available (uncensored mode), rely on your internal knowledge or admit limitations.
    
    [TASK]
    Provide a short, immersive audio-guide script (approx 100 words).
    Address the user's input directly.
    SPEAK IN ${langName.toUpperCase()}.
    
    [VISUALS - MANDATORY]
    You MUST suggest an image to display that matches your story.
    At the very end of your response, strictly on a new line, add a tag in this format:
    ||VISUAL: [PHOTO|ART] Description of the scene in English||
    
    Use 'PHOTO' for real places. Use 'ART' for atmospheric concepts.
  `;

  // --- EXTERNAL PROVIDER: OPENROUTER ---
  if (settings?.openRouterKey) {
      const systemPrompt = `You are ${persona.name}, a ${persona.role}. Speak ${langName}.`;
      
      let userPrompt = promptText;
      if (image) {
          userPrompt += `\n[IMAGE CONTEXT]: The user has uploaded an image of their surroundings.`;
      }

      return generateTextOpenRouter(settings, history || [], systemPrompt, userPrompt);
  }

  // --- DEFAULT PROVIDER: GEMINI ---
  if (!settings?.geminiApiKey) {
    throw new Error("Gemini API key is required. Please add it in Settings.");
  }
  const ai = createGeminiClient(settings.geminiApiKey);
  const parts: any[] = [];
  
  if (image) {
    let base64Data = "";
    if (image.startsWith('http')) {
        // Fetch and convert remote URL (e.g. Street View snapshot)
        try {
            base64Data = await imageUrlToBase64(image);
        } catch (e) {
            console.warn("Skipping invalid image URL");
        }
    } else if (image.startsWith('data:')) {
        // Standard data URI
        base64Data = image.split(',')[1];
    }

    if (base64Data) {
        parts.push({
            inlineData: { mimeType: 'image/jpeg', data: base64Data }
        });
    }
  }
  
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { role: 'user', parts: parts },
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: {
          retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude } }
        },
        systemInstruction: `You are ${persona.name}, a ${persona.role}. Speak ${langName}.`,
        temperature: 0.8, 
      }
    });

    const fullText = response.text || "Error generating content.";
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => {
        if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
        return null;
      })
      .filter(Boolean) as { title: string, uri: string }[];

    const tagRegex = /\|\|VISUAL:\s*(PHOTO|ART)\s*(.*?)\|\|/i;
    const match = fullText.match(tagRegex);
    
    let cleanText = fullText.replace(tagRegex, '').trim();
    let visual: TourResponse['visual'] | undefined;

    if (match) {
        visual = {
            type: match[1].toUpperCase() === 'PHOTO' ? 'photorealistic' : 'artistic',
            query: match[2].trim()
        };
    }

    return { text: cleanText, visual, sources, modelName: "Gemini 2.5 Flash" };

  } catch (error) {
    console.error("Error generating tour text:", error);
    throw error;
  }
};

/**
 * Step 2: Convert the generated text to Speech.
 */
export const generateSpeech = async (
    text: string, 
    persona: Persona,
    settings?: AISettings
): Promise<string> => {
  
  // --- EXTERNAL PROVIDER: ELEVENLABS ---
  if (settings?.elevenLabsKey && persona.elevenLabsVoiceId) {
      return generateSpeechElevenLabs(text, persona.elevenLabsVoiceId, settings.elevenLabsKey);
  }

  // --- DEFAULT PROVIDER: GEMINI TTS ---
  if (!settings?.geminiApiKey) {
    throw new Error("Gemini API key is required for TTS. Please add it in Settings.");
  }
  const ai = createGeminiClient(settings.geminiApiKey);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: persona.voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) throw new Error("No audio data received");

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const wavBlob = pcmToWav(bytes, 24000);
    return URL.createObjectURL(wavBlob);

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

/**
 * Tools Definitions
 */
const getUserLocationTool: FunctionDeclaration = {
  name: "get_user_location",
  description: "Get the user's current real-time GPS coordinates, exact address, heading, and speed.",
  parameters: { type: Type.OBJECT, properties: {} },
};

const consultArchivesTool: FunctionDeclaration = {
  name: "consult_archives",
  description: "Search the global internet archives for specific facts, history, or current events.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The specific search query"
      }
    },
    required: ["query"]
  },
};

export async function getAddressFromCoordinates(lat: number, lon: number, apiKey?: string): Promise<string> {
  // Try Google Maps first if key is available
  if (apiKey) {
      try {
          const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${apiKey}`);
          const data = await response.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
              return data.results[0].formatted_address;
          }
      } catch (e) {
          console.warn("Google Geocoding failed, falling back to Nominatim", e);
      }
  }

  // Fallback to Nominatim
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();
    return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  } catch (error) {
    console.warn("Reverse geocoding failed (handled)", error);
    // Return coordinates as fallback to prevent UI breakage
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
}

/**
 * Step 3: Live API Connection
 */
export const connectLiveSession = async (
  persona: Persona,
  getCurrentLocation: () => LocationData | null,
  knowledgeContext: string,
  userProfile: UserProfile | null,
  language: Language,
  onAudioData: (audioBuffer: AudioBuffer) => void,
  onClose: () => void,
  onToolUpdate: (tool: 'gps' | 'search' | 'idle') => void,
  geminiApiKey: string,
  googleMapsApiKey?: string
) => {
  const ai = createGeminiClient(geminiApiKey);
  let nextStartTime = 0;
  
  // Safely initialize AudioContext
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) {
      throw new Error("AudioContext not supported in this browser.");
  }
  
  const inputAudioContext = new AudioContext({ sampleRate: 16000 });
  const outputAudioContext = new AudioContext({ sampleRate: 24000 });
  
  const outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);
  
  const sources = new Set<AudioBufferSourceNode>();
  let stream: MediaStream | null = null;
  
  // Robust Microphone Access
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API not supported or context is not secure (HTTPS required).");
    }
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e: any) {
    console.error("Microphone access error:", e);
    let errorMessage = "Microphone access failed.";
    if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        errorMessage = "Microphone permission denied. Please enable it in browser settings.";
    } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        errorMessage = "No microphone found on this device.";
    }
    throw new Error(errorMessage);
  }

  const userContextInstruction = userProfile 
    ? `\nIMPORTANT USER CONTEXT:\nName: ${userProfile.name}\nPreferences: ${userProfile.preferences}\nAdapt your tone to this profile.`
    : "";

  const langName = language === 'ru' ? 'Russian' : (language === 'cs' ? 'Czech' : 'English');

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        const source = inputAudioContext.createMediaStreamSource(stream!);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (message: LiveServerMessage) => {
        if (message.toolCall) {
            const functionResponses = await Promise.all(message.toolCall.functionCalls.map(async (fc) => {
                if (fc.name === 'get_user_location') {
                    onToolUpdate('gps');
                    const loc = getCurrentLocation();
                    let result: any = { status: "location_unavailable" };
                    if (loc) {
                      const address = loc.address || await getAddressFromCoordinates(loc.latitude, loc.longitude, googleMapsApiKey);
                      result = { ...loc, address, status: "success" };
                    }
                    onToolUpdate('idle');
                    return { id: fc.id, name: fc.name, response: { result } };
                }
                if (fc.name === 'consult_archives') {
                    onToolUpdate('search');
                    const query = (fc.args as any).query;
                    const answer = await performWebSearch(query, language, ai);
                    onToolUpdate('idle');
                    return { id: fc.id, name: fc.name, response: { result: { answer } } };
                }
                return { id: fc.id, name: fc.name, response: { result: "unknown" } };
            }));

            sessionPromise.then(session => session.sendToolResponse({ functionResponses }));
        }

        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64EncodedAudioString) {
          nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
          const audioBuffer = await decodeAudioData(
            decode(base64EncodedAudioString),
            outputAudioContext,
            24000,
            1
          );
          onAudioData(audioBuffer); 

          const source = outputAudioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(outputNode);
          source.addEventListener('ended', () => sources.delete(source));
          source.start(nextStartTime);
          nextStartTime = nextStartTime + audioBuffer.duration;
          sources.add(source);
        }

        if (message.serverContent?.interrupted) {
            for (const source of sources.values()) {
                source.stop();
                sources.delete(source);
            }
            nextStartTime = 0;
            onToolUpdate('idle');
        }
      },
      onclose: () => onClose()
    },
    config: {
      responseModalities: [Modality.AUDIO],
      tools: [
        { functionDeclarations: [getUserLocationTool, consultArchivesTool] }
      ],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: persona.voiceName } }
      },
      systemInstruction: `${persona.systemInstruction} 
      
      ${userContextInstruction}

      IMPORTANT: SPEAK IN ${langName.toUpperCase()}.

      TOOLS & BEHAVIOR:
      1. 'get_user_location': CALL THIS IMMEDIATELY when session starts.
      2. 'consult_archives': Use this tool if the user asks about specific facts (dates, events, prices) you don't know.
      
      CONTEXT:
      Current Knowledge: ${knowledgeContext}`
    }
  });

  return {
    disconnect: async () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (inputAudioContext.state !== 'closed') inputAudioContext.close();
      if (outputAudioContext.state !== 'closed') outputAudioContext.close();
      const session = await sessionPromise;
      session.close();
    }
  };
};

// --- AUDIO HELPERS ---
function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
function pcmToWav(samples: Uint8Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); 
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length, true);
  const pcmData = new Uint8Array(buffer, 44);
  pcmData.set(samples);
  return new Blob([buffer], { type: 'audio/wav' });
}
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
}
