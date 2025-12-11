
import React, { useState } from 'react';
import { User, X, Sparkles, Check, ChevronRight, History, Trash2, Cloud } from 'lucide-react';
import { UserProfile, Language, Message } from '../types';
import { generateUserProfileSummary } from '../services/gemini';
import { UI_STRINGS } from '../constants';

interface Props {
  currentProfile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
  language: Language;
  messages: Message[];
  onClearHistory: () => void;
  geminiApiKey: string;
}

export const ProfileModal: React.FC<Props> = ({ currentProfile, onSave, onClose, language, messages, onClearHistory, geminiApiKey }) => {
  const [mode, setMode] = useState<'edit' | 'quiz' | 'history'>('edit');
  const [name, setName] = useState(currentProfile?.name || '');
  const [manualBio, setManualBio] = useState(currentProfile?.preferences || '');
  
  const t = UI_STRINGS[language];

  // Quiz State
  const [step, setStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>(['', '', '']);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleQuizSave = async () => {
    if (!geminiApiKey) {
      alert("Please add your Gemini API key in Settings first.");
      return;
    }
    setIsGenerating(true);
    const summary = await generateUserProfileSummary(quizAnswers, language, geminiApiKey);
    setManualBio(summary);
    setMode('edit');
    setIsGenerating(false);
  };

  const handleSaveFinal = () => {
    if (!name.trim()) {
        alert("Please enter a name");
        return;
    }
    // Preserve ID and Auth Provider if they exist
    onSave({ 
        ...currentProfile,
        name, 
        preferences: manualBio 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900/90 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <User size={20} className="text-emerald-500"/> {t.profileTitle}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          <div className="mb-8">
            <label className="block text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-widest">{t.profileNameLabel}</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder={t.profileNamePlaceholder}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:border-emerald-500/50 focus:bg-black/40 focus:outline-none transition-all"
            />
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-1 mb-8 bg-black/30 p-1.5 rounded-2xl border border-white/5">
             <button 
               onClick={() => setMode('edit')}
               className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${mode === 'edit' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {t.profileTabEdit}
             </button>
             <button 
               onClick={() => setMode('quiz')}
               className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'quiz' ? 'bg-emerald-900/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <Sparkles size={14} /> {t.profileTabQuiz}
             </button>
             <button 
               onClick={() => setMode('history')}
               className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'history' ? 'bg-blue-900/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <History size={14} /> {t.profileTabHistory}
             </button>
          </div>

          {mode === 'edit' && (
            <div className="animate-in slide-in-from-left-2 duration-300 space-y-6">
              <div>
                <label className="block text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-widest">
                    {t.profileBioLabel}
                </label>
                <textarea 
                    value={manualBio} 
                    onChange={(e) => setManualBio(e.target.value)}
                    placeholder={t.profileBioPlaceholder}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-slate-600 focus:border-emerald-500/50 focus:bg-black/40 focus:outline-none transition-all min-h-[150px] resize-none leading-relaxed"
                />
              </div>

              {/* Cloud Sync Placeholder */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 border border-white/5 flex items-center justify-between opacity-60">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-black/30 rounded-full border border-white/5">
                        <Cloud size={18} className="text-slate-400"/>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-300">Sync with Cloud</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">Coming Soon</p>
                    </div>
                 </div>
                 <button disabled className="text-[10px] bg-white/5 border border-white/5 px-4 py-2 rounded-full text-slate-500 font-bold uppercase tracking-wider">
                     Connect
                 </button>
              </div>
            </div>
          )}
          
          {mode === 'quiz' && (
             <div className="animate-in slide-in-from-right-2 duration-300 bg-black/20 rounded-2xl p-6 border border-white/5">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Sparkles className="animate-spin text-emerald-400 mb-4" size={32} />
                        <p className="text-slate-300 font-serif italic">{t.quizGenerating}</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">{t.quizTitle} {step + 1} / 3</span>
                            <div className="flex gap-1.5">
                                {[0,1,2].map(i => (
                                    <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-serif text-white mb-6 leading-relaxed">{t.quizQuestions[step]}</h3>
                        
                        <textarea 
                             value={quizAnswers[step]}
                             onChange={(e) => {
                                 const newAnswers = [...quizAnswers];
                                 newAnswers[step] = e.target.value;
                                 setQuizAnswers(newAnswers);
                             }}
                             className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500/50 focus:outline-none mb-6 min-h-[120px]"
                             placeholder="..."
                             autoFocus
                        />

                        <div className="flex justify-end">
                             {step < 2 ? (
                                 <button 
                                    onClick={() => setStep(s => s + 1)}
                                    disabled={!quizAnswers[step].trim()}
                                    className="bg-white/5 hover:bg-white/10 border border-white/5 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                                 >
                                    {t.quizNext} <ChevronRight size={16} />
                                 </button>
                             ) : (
                                 <button 
                                    onClick={handleQuizSave}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all font-bold tracking-wide"
                                 >
                                    <Sparkles size={16} /> {t.quizFinish}
                                 </button>
                             )}
                        </div>
                    </>
                )}
             </div>
          )}

          {mode === 'history' && (
              <div className="animate-in slide-in-from-right-2 duration-300">
                  <div className="bg-black/20 rounded-2xl p-5 border border-white/5 mb-6 flex justify-between items-center">
                      <div>
                          <p className="text-[10px] uppercase text-slate-500 tracking-widest font-bold mb-1">{t.historyStats}</p>
                          <p className="text-3xl font-bold text-white font-mono">{messages.length}</p>
                      </div>
                      <History className="text-blue-500/50" size={40} />
                  </div>

                  <div className="bg-black/40 rounded-2xl p-2 border border-white/5 max-h-[250px] overflow-y-auto mb-6 custom-scrollbar">
                      {messages.length <= 1 ? (
                          <div className="p-8 text-center">
                              <p className="text-slate-600 italic text-sm">{t.historyEmpty}</p>
                          </div>
                      ) : (
                          <div className="space-y-1">
                              {messages.slice(1).reverse().map(m => (
                                  <div key={m.id} className="p-3 hover:bg-white/5 rounded-xl transition-colors">
                                      <div className="flex justify-between items-center mb-1">
                                          <span className={`text-[10px] uppercase font-bold tracking-wider ${m.role === 'user' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                              {m.role === 'user' ? 'YOU' : 'AI'}
                                          </span>
                                          <span className="text-[10px] text-slate-600 font-mono">
                                              {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                      </div>
                                      <p className="text-xs text-slate-400 line-clamp-2">{m.text}</p>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <button 
                      onClick={() => {
                          if (confirm("Are you sure? This will delete all chat history.")) {
                              onClearHistory();
                          }
                      }}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-4 rounded-xl flex items-center justify-center gap-2 transition-colors uppercase font-bold text-xs tracking-widest"
                  >
                      <Trash2 size={16} /> {t.historyClear}
                  </button>
              </div>
          )}
        </div>

        {/* Footer (Only for Edit Mode) */}
        {mode === 'edit' && (
            <div className="p-5 border-t border-white/5 bg-black/20 flex justify-end">
                <button 
                    onClick={handleSaveFinal}
                    className="bg-white text-slate-900 font-bold px-8 py-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                    <Check size={18} /> {t.profileSave}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
