
import React, { useState, useEffect } from 'react';
import { Settings, X, Check, Lock, Key, Volume2, RefreshCw, Loader2, Globe, Map, Sparkles } from 'lucide-react';
import { AISettings, Language } from '../types';
import { UI_STRINGS } from '../constants';
import { fetchOpenRouterModels } from '../services/external';

interface Props {
  settings: AISettings | undefined;
  onSave: (settings: AISettings) => void;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const SettingsModal: React.FC<Props> = ({ settings, onSave, onClose, language, onLanguageChange }) => {
  const t = UI_STRINGS[language];
  
  const [geminiApiKey, setGeminiApiKey] = useState(settings?.geminiApiKey || '');
  const [openRouterKey, setOpenRouterKey] = useState(settings?.openRouterKey || '');
  const [openRouterModel, setOpenRouterModel] = useState(settings?.openRouterModel || 'gryphe/mythomax-l2-13b');
  const [elevenLabsKey, setElevenLabsKey] = useState(settings?.elevenLabsKey || '');
  const [googleMapsKey, setGoogleMapsKey] = useState(settings?.googleMapsKey || '');

  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
      loadModels();
  }, []);

  const loadModels = async () => {
      setIsLoadingModels(true);
      const models = await fetchOpenRouterModels();
      setAvailableModels(models);
      setIsLoadingModels(false);
  };

  const handleSave = () => {
    onSave({
        geminiApiKey,
        openRouterKey,
        openRouterModel,
        elevenLabsKey,
        googleMapsKey
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900/90 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <Settings size={20} className="text-slate-400"/> {t.settingsTitle}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
          <p className="text-sm text-slate-400 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{t.settingsDesc}</p>

          {/* Language Section */}
          <div className="space-y-4">
              <div className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest">
                  <Globe size={14} className="text-blue-400"/> {t.settingsLanguage}
              </div>
              <div className="flex gap-2">
                {(['en', 'cs', 'ru'] as Language[]).map(lang => (
                    <button
                        key={lang}
                        onClick={() => onLanguageChange(lang)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                            language === lang 
                            ? 'bg-blue-600 text-white shadow-lg border-blue-500' 
                            : 'bg-black/20 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {lang}
                    </button>
                ))}
              </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Gemini Section - Primary */}
          <div className="space-y-6">
              <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles size={14} /> Google AI Studio (Gemini)
              </div>
              <p className="text-xs text-slate-500">Required for core features: text generation, image generation, TTS, live audio, and Google Search.</p>
              
              <div>
                <label className="block text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-widest">API Key</label>
                <div className="relative">
                    <Key size={14} className="absolute left-4 top-4 text-slate-500"/>
                    <input 
                      type="password" 
                      value={geminiApiKey} 
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIza..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 p-3.5 text-white focus:border-cyan-500/50 focus:outline-none text-sm font-mono transition-colors"
                    />
                </div>
                <p className="text-xs text-slate-600 mt-2">Get your free key at ai.google.dev</p>
              </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* OpenRouter Section - Optional */}
          <div className="space-y-6">
              <div className="flex items-center gap-2 text-fuchsia-400 text-[10px] font-bold uppercase tracking-widest">
                  <Lock size={14} /> OpenRouter (Alternative Models)
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-widest">{t.settingsOpenRouterKey}</label>
                <div className="relative">
                    <Key size={14} className="absolute left-4 top-4 text-slate-500"/>
                    <input 
                      type="password" 
                      value={openRouterKey} 
                      onChange={(e) => setOpenRouterKey(e.target.value)}
                      placeholder="sk-or-..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 p-3.5 text-white focus:border-fuchsia-500/50 focus:outline-none text-sm font-mono transition-colors"
                    />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t.settingsOpenRouterModel}</label>
                    <button 
                        onClick={loadModels} 
                        className="text-slate-500 hover:text-fuchsia-400 transition-colors p-1"
                        title="Refresh Models"
                    >
                        <RefreshCw size={12} className={isLoadingModels ? "animate-spin" : ""} />
                    </button>
                </div>
                
                <div className="relative">
                    {isLoadingModels ? (
                        <div className="w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-slate-400 text-sm flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin"/> Loading models...
                        </div>
                    ) : (
                        <select
                            value={openRouterModel}
                            onChange={(e) => setOpenRouterModel(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3.5 text-white focus:border-fuchsia-500/50 focus:outline-none text-sm appearance-none transition-colors"
                        >
                            {!availableModels.some(m => m.id === openRouterModel) && (
                                <option value={openRouterModel}>{openRouterModel} (Current)</option>
                            )}
                            
                            <optgroup label="Popular / Free">
                                {availableModels.filter(m => m.id.includes('free') || m.id.includes('mythomax')).map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </optgroup>
                            
                            <optgroup label="All Models">
                                {availableModels.filter(m => !m.id.includes('free') && !m.id.includes('mythomax')).map(model => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    )}
                </div>
              </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="space-y-6">
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                  <Volume2 size={14} /> ElevenLabs (Speech)
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-widest">{t.settingsElevenLabsKey}</label>
                <div className="relative">
                    <Key size={14} className="absolute left-4 top-4 text-slate-500"/>
                    <input 
                      type="password" 
                      value={elevenLabsKey} 
                      onChange={(e) => setElevenLabsKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 p-3.5 text-white focus:border-emerald-500/50 focus:outline-none text-sm font-mono transition-colors"
                    />
                </div>
              </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Google Maps Section */}
          <div className="space-y-6">
              <div className="flex items-center gap-2 text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                  <Map size={14} /> Google Maps (Street View)
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-500 mb-2 font-bold uppercase tracking-widest">{t.settingsGoogleMapsKey}</label>
                <div className="relative">
                    <Key size={14} className="absolute left-4 top-4 text-slate-500"/>
                    <input 
                      type="password" 
                      value={googleMapsKey} 
                      onChange={(e) => setGoogleMapsKey(e.target.value)}
                      placeholder="AIza..."
                      className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 p-3.5 text-white focus:border-amber-500/50 focus:outline-none text-sm font-mono transition-colors"
                    />
                </div>
              </div>
          </div>

        </div>

        <div className="p-5 border-t border-white/5 bg-black/20 flex justify-end">
            <button 
                onClick={handleSave}
                className="bg-white text-slate-900 font-bold px-8 py-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
                <Check size={18} /> {t.settingsSave}
            </button>
        </div>
      </div>
    </div>
  );
};
