
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, Send, MapPin, Loader2, Navigation, User, Settings as SettingsIcon, Image as ImageIcon, X, Globe, MapPinned, LocateFixed, Map } from 'lucide-react';
import { useGeolocation } from './hooks/useGeolocation';
import { PersonaSelector } from './components/PersonaSelector';
import { MessageBubble } from './components/MessageBubble';
import { LiveSessionOverlay } from './components/LiveSessionOverlay';
import { ProfileModal } from './components/ProfileModal';
import { CustomPersonaModal } from './components/CustomPersonaModal';
import { SettingsModal } from './components/SettingsModal';
import { CameraModal } from './components/CameraModal';
import { LocationPickerModal } from './components/LocationPickerModal';
import { UI_STRINGS, INITIAL_MESSAGE_TEXT, getPersonas, STANDARD_IDS } from './constants';
import { Message, Persona, UserProfile, Language, AISettings, LocationData } from './types';
import { generateTourText, generateSpeech, getNearbyKnowledge, generateImage } from './services/gemini';
import { storage } from './services/storage';

const DEFAULT_SETTINGS: AISettings = {
    geminiApiKey: '',
    openRouterKey: '',
    openRouterModel: '',
    elevenLabsKey: '',
    googleMapsKey: ''
};

const App: React.FC = () => {
  const { location: gpsLocation, error: geoError } = useGeolocation();
  
  // Language State
  const [language, setLanguage] = useState<Language>(storage.language.get());
  const t = UI_STRINGS[language];

  // Data States
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Personas State
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const staticPersonas = getPersonas(language);
  
  const mergedPersonas = useMemo(() => {
      const standardWithOverrides = staticPersonas.map(staticP => {
          const override = customPersonas.find(cp => cp.id === staticP.id);
          return override || staticP;
      });
      const pureCustoms = customPersonas.filter(cp => !STANDARD_IDS.includes(cp.id as any));
      return [...standardWithOverrides, ...pureCustoms];
  }, [customPersonas, staticPersonas, language]);

  const [currentPersona, setCurrentPersona] = useState<Persona>(mergedPersonas[0]);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Location State (Manual or GPS)
  const [manualLocation, setManualLocation] = useState<LocationData | null>(null);
  // If manual location is set, use it. Otherwise use GPS.
  const activeLocation = manualLocation || gpsLocation;

  // UI State
  const [showLiveOverlay, setShowLiveOverlay] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'profile' | 'customPersona' | 'settings' | 'camera' | 'map'>('none');
  const [contextImage, setContextImage] = useState<string | undefined>(undefined); // For sending with next message
  const [knowledgeContext, setKnowledgeContext] = useState("");
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);

  // --- INITIALIZATION & STORAGE ---
  useEffect(() => {
      const loadData = async () => {
          const s = await storage.settings.load();
          if (s && (s.openRouterKey || s.elevenLabsKey || s.googleMapsKey)) {
             setAiSettings(s);
          } else {
             // If no saved settings, ensure defaults (with the key) are used/saved
             setAiSettings(DEFAULT_SETTINGS);
          }

          const p = await storage.user.load();
          if (p) setUserProfile(p);

          const h = await storage.history.load();
          if (h && h.length > 0) {
              setMessages(h);
          } else {
              // Add welcome message
              setMessages([{
                  id: 'init',
                  role: 'model',
                  text: INITIAL_MESSAGE_TEXT[language],
                  timestamp: Date.now()
              }]);
          }

          const cp = await storage.customPersona.load();
          setCustomPersonas(cp);
      };
      loadData();
  }, []);

  // Save history on change
  useEffect(() => {
      if(messages.length > 0) storage.history.save(messages);
  }, [messages]);

  // Save language on change
  useEffect(() => {
      storage.language.set(language);
  }, [language]);

  // Auto-scroll chat
  useEffect(() => {
      if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
  }, [messages, isLoading]);

  // Pre-fetch knowledge when location changes significantly (every ~100m)
  useEffect(() => {
      if (activeLocation && aiSettings?.geminiApiKey) {
          getNearbyKnowledge(activeLocation, language, aiSettings.geminiApiKey).then(setKnowledgeContext);
      }
  }, [activeLocation?.latitude, activeLocation?.longitude, language, aiSettings?.geminiApiKey]);

  // Update current persona when language changes (if standard)
  useEffect(() => {
    if (STANDARD_IDS.includes(currentPersona.id as any)) {
        const updated = mergedPersonas.find(p => p.id === currentPersona.id);
        if (updated) setCurrentPersona(updated);
    }
  }, [language, mergedPersonas]);

  // --- GLOBAL PASTE LISTENER ---
  useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
          if (e.clipboardData && e.clipboardData.items) {
              const items = e.clipboardData.items;
              for (let i = 0; i < items.length; i++) {
                  if (items[i].type.indexOf('image') !== -1) {
                      const blob = items[i].getAsFile();
                      if (blob) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                              if (event.target?.result) {
                                  setContextImage(event.target.result as string);
                              }
                          };
                          reader.readAsDataURL(blob);
                          // Prevent default paste behavior (optional, depending on where focus is)
                          // e.preventDefault(); 
                      }
                  }
              }
          }
      };

      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
  }, []);


  // --- HANDLERS ---

  const handleSendMessage = async () => {
      if ((!inputText.trim() && !contextImage) || isLoading || !activeLocation) return;

      const userMsg: Message = {
          id: Date.now().toString(),
          role: 'user',
          text: inputText,
          imageUrl: contextImage,
          timestamp: Date.now()
      };

      setMessages(prev => [...prev, userMsg]);
      setInputText('');
      setContextImage(undefined);
      setIsLoading(true);

      try {
          // 1. Generate Text
          const response = await generateTourText({
              text: userMsg.text,
              image: userMsg.imageUrl,
              location: activeLocation,
              persona: currentPersona,
              history: messages,
              userProfile: userProfile || undefined,
              language,
              settings: aiSettings
          });

          const aiMsgId = (Date.now() + 1).toString();
          let aiMsg: Message = {
              id: aiMsgId,
              role: 'model',
              text: response.text,
              timestamp: Date.now(),
              sources: response.sources,
              modelName: response.modelName
          };

          setMessages(prev => [...prev, aiMsg]);

          // 2. Generate Speech (Async)
          generateSpeech(response.text, currentPersona, aiSettings).then(audioUrl => {
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, audioUrl } : m));
          });

          // 3. Generate Visual if requested (Async)
          if (response.visual && aiSettings?.geminiApiKey) {
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isGeneratingImage: true, imageType: response.visual?.type } : m));
              
              generateImage(response.visual.query, response.visual.type, aiSettings.geminiApiKey).then(imageUrl => {
                 if (imageUrl) {
                     setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, imageUrl, isGeneratingImage: false } : m));
                 } else {
                     setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isGeneratingImage: false } : m));
                 }
              });
          }

      } catch (error) {
          console.error(error);
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: t.errorConnection,
              timestamp: Date.now()
          }]);
      } finally {
          setIsLoading(false);
      }
  };

  const handleCustomPersonaSave = (newPersona: Persona) => {
      setCustomPersonas(prev => {
          const exists = prev.some(p => p.id === newPersona.id);
          const updated = exists 
             ? prev.map(p => p.id === newPersona.id ? newPersona : p)
             : [...prev, newPersona];
          
          storage.customPersona.save(updated);
          return updated;
      });
      setCurrentPersona(newPersona);
  };

  const handleCustomPersonaDelete = (id: string) => {
      setCustomPersonas(prev => {
          const updated = prev.filter(p => p.id !== id);
          storage.customPersona.save(updated);
          return updated;
      });
      setCurrentPersona(mergedPersonas[0]);
  };

  const handleStartLive = () => {
      if (!activeLocation) {
          alert("Location required for live mode.");
          return;
      }
      if (!aiSettings?.geminiApiKey) {
          alert("Please add your Gemini API key in Settings first.");
          return;
      }
      setShowLiveOverlay(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-200 font-sans overflow-hidden flex flex-col">
        
        {/* --- HEADER --- */}
        <header className="flex-none bg-slate-900/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                    <MapPin className="text-white" size={20} />
                </div>
                <div>
                   <h1 className="text-lg font-serif font-bold text-white tracking-wide">{t.appTitle}</h1>
                   
                   {/* Location Mode Toggle */}
                   <button 
                        onClick={() => setActiveModal('map')}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 mt-1 rounded-full border transition-all duration-300
                            text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95
                            ${manualLocation
                               ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/30 hover:border-indigo-400 shadow-indigo-500/20'
                               : activeLocation
                                   ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                                   : 'bg-slate-800/50 border-white/5 text-slate-500'
                            }
                        `}
                   >
                       {manualLocation ? (
                           <>
                                <MapPinned size={12} className="text-indigo-400" />
                                <span className="text-indigo-100">{t.mapManualMode}</span>
                                <span className="flex h-1.5 w-1.5 relative ml-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                                </span>
                           </>
                       ) : (
                           activeLocation ? (
                               <>
                                   <LocateFixed size={12} />
                                   {t.gpsOn}
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                               </>
                           ) : (
                               <>
                                   <Loader2 size={12} className="animate-spin" />
                                   {t.gpsWaiting}
                               </>
                           )
                       )}
                   </button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={() => handleStartLive()}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white px-3 py-2 rounded-full border border-red-500/20 transition-all active:scale-95 group"
                >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 group-hover:bg-white"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 group-hover:bg-white"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t.liveButton}</span>
                </button>

                <button onClick={() => setActiveModal('profile')} className="p-2.5 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-white/5">
                    <User size={18} />
                </button>
                <button onClick={() => setActiveModal('settings')} className="p-2.5 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-white/5">
                    <SettingsIcon size={18} />
                </button>
            </div>
        </header>

        {/* --- MAIN CHAT --- */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative" ref={chatContainerRef}>
            
            {/* Persona Selector */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-slate-950/60 pt-2 pb-2 border-b border-white/5">
                 <PersonaSelector 
                     personas={mergedPersonas}
                     currentPersona={currentPersona}
                     onSelect={setCurrentPersona}
                     customPersonas={customPersonas}
                     onAddCustom={() => { setPersonaToEdit(null); setActiveModal('customPersona'); }}
                     onEdit={(p) => { setPersonaToEdit(p); setActiveModal('customPersona'); }}
                     onDelete={handleCustomPersonaDelete}
                     onReset={handleCustomPersonaDelete} // Resetting an override is effectively deleting it from customPersonas
                     language={language}
                 />
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} language={language} />
                ))}
                {isLoading && (
                    <div className="flex gap-2 items-center text-slate-500 text-sm px-4 animate-pulse">
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                )}
            </div>
        </main>

        {/* --- INPUT AREA --- */}
        <footer className="flex-none p-4 z-20 max-w-2xl mx-auto w-full">
             {/* Preview Image Attachment */}
             {contextImage && (
                 <div className="relative inline-block mb-2 group">
                     <img src={contextImage} alt="Attachment" className="h-16 rounded-lg border border-white/20 shadow-lg" />
                     <button 
                        onClick={() => setContextImage(undefined)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                     >
                         <X size={12} />
                     </button>
                 </div>
             )}

             {/* White Capsule Input Bar */}
             <div className="flex items-end gap-2 bg-white text-slate-900 p-2 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl">
                 <button 
                    onClick={() => setActiveModal('map')}
                    className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                 >
                     <Map size={24} />
                 </button>
                 
                 <button 
                    onClick={() => setActiveModal('camera')}
                    className={`p-3 rounded-full transition-colors ${contextImage ? 'text-emerald-600 bg-emerald-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                 >
                     <Camera size={24} />
                 </button>

                 <div className="flex-1 py-3">
                     <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder={`${t.inputPlaceholder} ${currentPersona.name}...`}
                        className="w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none resize-none max-h-32 text-[16px] leading-relaxed font-medium"
                        rows={1}
                        style={{ minHeight: '24px' }}
                     />
                 </div>

                 <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || (!inputText.trim() && !contextImage)}
                    className={`
                        p-3 rounded-full transition-all duration-300 shadow-md
                        ${(inputText.trim() || contextImage) && !isLoading
                           ? 'bg-slate-800 text-white hover:bg-slate-700 hover:scale-105' 
                           : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                    `}
                 >
                     {isLoading ? <Loader2 size={24} className="animate-spin"/> : <Send size={24} className={inputText.trim() ? "ml-1" : ""} />}
                 </button>
             </div>
        </footer>

        {/* --- MODALS --- */}
        
        {showLiveOverlay && activeLocation && aiSettings?.geminiApiKey && (
            <LiveSessionOverlay 
                persona={currentPersona}
                location={activeLocation}
                knowledgeContext={knowledgeContext}
                userProfile={userProfile}
                onClose={() => setShowLiveOverlay(false)}
                language={language}
                geminiApiKey={aiSettings.geminiApiKey}
                googleMapsKey={aiSettings.googleMapsKey}
            />
        )}

        {activeModal === 'profile' && (
            <ProfileModal 
                currentProfile={userProfile}
                onSave={(p) => { setUserProfile(p); storage.user.save(p); }}
                onClose={() => setActiveModal('none')}
                language={language}
                messages={messages}
                onClearHistory={() => { setMessages([]); storage.history.clear(); setActiveModal('none'); }}
                geminiApiKey={aiSettings?.geminiApiKey || ''}
            />
        )}

        {activeModal === 'customPersona' && (
            <CustomPersonaModal
                existingPersona={personaToEdit}
                onSave={handleCustomPersonaSave}
                onClose={() => setActiveModal('none')}
                language={language}
                geminiApiKey={aiSettings?.geminiApiKey || ''}
            />
        )}

        {activeModal === 'settings' && (
            <SettingsModal 
                settings={aiSettings}
                onSave={(s) => { setAiSettings(s); storage.settings.save(s); }}
                onClose={() => setActiveModal('none')}
                language={language}
                onLanguageChange={setLanguage}
            />
        )}

        {activeModal === 'camera' && (
            <CameraModal 
                onCapture={(img) => { setContextImage(img); setActiveModal('none'); }}
                onClose={() => setActiveModal('none')}
                onGalleryClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => setContextImage(evt.target?.result as string);
                            reader.readAsDataURL(file);
                        }
                    };
                    input.click();
                }}
            />
        )}

        {activeModal === 'map' && (
            <LocationPickerModal 
                initialLocation={activeLocation}
                onSelectLocation={(loc, snap) => {
                    setManualLocation(loc);
                    if (snap) {
                        setContextImage(snap); // Automatically attach street view snapshot if available
                    }
                }}
                onResetToGPS={() => {
                    setManualLocation(null);
                    setActiveModal('none');
                }}
                onClose={() => setActiveModal('none')}
                language={language}
                googleMapsKey={aiSettings.googleMapsKey}
            />
        )}
    </div>
  );
};

export default App;
