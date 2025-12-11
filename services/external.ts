
import { Message, AISettings, TourResponse } from "../types";

/**
 * Fetches the list of available models from OpenRouter.
 */
export const fetchOpenRouterModels = async (): Promise<{ id: string; name: string }[]> => {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/models");
        if (!response.ok) {
            throw new Error("Failed to fetch models");
        }
        const data = await response.json();
        
        // Map and sort alphabetically
        return data.data
            .map((m: any) => ({
                id: m.id,
                name: m.name || m.id
            }))
            .sort((a: any, b: any) => a.name.localeCompare(b.name));
            
    } catch (error) {
        console.warn("Could not fetch OpenRouter models:", error);
        // Return a basic fallback list if API fails
        return [
            { id: "gryphe/mythomax-l2-13b", name: "Mythomax L2 13B" },
            { id: "meta-llama/llama-3-8b-instruct:free", name: "Llama 3 8B Instruct (Free)" },
            { id: "microsoft/wizardlm-2-8x22b", name: "WizardLM-2 8x22B" },
            { id: "google/gemini-flash-1.5", name: "Gemini Flash 1.5" }
        ];
    }
};

/**
 * Calls OpenRouter (or compatible OpenAI-format API) for text generation.
 */
export const generateTextOpenRouter = async (
    settings: AISettings,
    messages: Message[],
    systemPrompt: string,
    userPrompt: string
): Promise<TourResponse> => {
    try {
        const historyMessages = messages
            .filter(m => m.id !== 'init')
            .slice(-6)
            .map(m => ({
                role: m.role === 'model' ? 'assistant' : 'user',
                content: m.text
            }));

        const performRequest = async (model: string) => {
            return fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${settings.openRouterKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://storywalker.ai", // Required by OpenRouter
                    "X-Title": "StoryWalker"
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...historyMessages,
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.8,
                })
            });
        };

        const primaryModel = settings.openRouterModel || "gryphe/mythomax-l2-13b";
        let response = await performRequest(primaryModel);

        // FALLBACK LOGIC: If rate limited (429) or not found (404) or server error (5xx)
        if (!response.ok && (response.status === 429 || response.status === 404 || response.status >= 500)) {
            const fallbackModel = "gryphe/mythomax-l2-13b";
            
            // Only retry if we haven't already tried the fallback model
            if (primaryModel !== fallbackModel) {
                console.warn(`OpenRouter model ${primaryModel} failed (${response.status}). Retrying with fallback: ${fallbackModel}`);
                const fallbackResponse = await performRequest(fallbackModel);
                
                // If fallback succeeds, use it. If not, stick to original error to throw.
                if (fallbackResponse.ok) {
                    response = fallbackResponse;
                }
            }
        }

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter API Error: ${err}`);
        }

        const data = await response.json();
        const fullText = data.choices[0]?.message?.content || "";
        const usedModel = data.model || primaryModel; // Capture actual model used

        // Parse visual tag for image generation (OpenRouter model must strictly follow system prompt)
        const tagRegex = /\|\|VISUAL:\s*(PHOTO|ART)\s*(.*?)\|\|/i;
        const match = fullText.match(tagRegex);
        
        const cleanText = fullText.replace(tagRegex, '').trim();
        let visual: TourResponse['visual'] | undefined;

        if (match) {
            visual = {
                type: match[1].toUpperCase() === 'PHOTO' ? 'photorealistic' : 'artistic',
                query: match[2].trim()
            };
        }

        // Note: Grounding sources are not supported via standard OpenRouter text completion without plugins.
        return { text: cleanText, visual, modelName: usedModel };

    } catch (error) {
        console.error("OpenRouter generation failed:", error);
        throw error;
    }
};

/**
 * Calls ElevenLabs API for text-to-speech.
 */
export const generateSpeechElevenLabs = async (
    text: string,
    voiceId: string,
    apiKey: string
): Promise<string> => {
    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: "POST",
                headers: {
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`ElevenLabs API Error: ${err}`);
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);

    } catch (error) {
        console.error("ElevenLabs generation failed:", error);
        throw error;
    }
};

/**
 * Generates a Google Static Street View URL based on location and POV.
 */
export const getGoogleStreetViewImage = (
    lat: number,
    lng: number,
    heading: number,
    pitch: number,
    apiKey: string
): string => {
    return `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${lat},${lng}&heading=${heading}&pitch=${pitch}&key=${apiKey}`;
};