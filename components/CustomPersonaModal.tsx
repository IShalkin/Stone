
import React, { useState, useEffect } from 'react';
import { Bot, X, Sparkles, Check, ChevronRight } from 'lucide-react';
import { Persona, PersonaId, Language } from '../types';
import { generateCustomPersona } from '../services/gemini';
import { UI_STRINGS } from '../constants';

interface Props {
  existingPersona?: Persona | null;
  onSave: (persona: Persona) => void;
  onClose: () => void;
  language: Language;
  geminiApiKey: string;
}

const VOICES = [
  { name: 'Puck', desc: 'Energetic' },
  { name: 'Kore', desc: 'Calm' },
  { name: 'Fenrir', desc: 'Deep' },
  { name: 'Charon', desc: 'Authoritative' },
  { name: 'Zephyr', desc: 'Friendly' },
];

export const CustomPersonaModal: React.FC<Props> = ({ existingPersona, onSave, onClose, language, geminiApiKey }) => {
  const [mode, setMode] = useState<'edit' | 'quiz'>('edit');
  const t = UI_STRINGS[language];
  
  // Fields
  const [name, setName] = useState('');
  const [voiceName, setVoiceName] = useState('Kore');
  const [elVoiceId, setElVoiceId] = useState('');
  const [role, setRole] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');

  // Initial load
  useEffect(() => {
      if (existingPersona) {
          setName(existingPersona.name);
          setVoiceName(existingPersona.voiceName);
          setElVoiceId(existingPersona.elevenLabsVoiceId || '');
          setRole(existingPersona.role);
          setSystemInstruction(existingPersona.systemInstruction);
      } else {
          setName('');
          setVoiceName('Kore');
          setElVoiceId('');
          setRole('');
          setSystemInstruction('');
      }
  }, [existingPersona]);

  // Quiz State
  const [step, setStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>(['', '', '']);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleQuizSave = async () => {
    if (!name) { alert("Name required!"); return; }
    if (!geminiApiKey) {
      alert("Please add your Gemini API key in Settings first.");
      return;
    }
    setIsGenerating(true);
    const result = await generateCustomPersona(name, quizAnswers, language, geminiApiKey);
    if (result) {
        setRole(result.role || "Custom Guide");
        setSystemInstruction(result.systemInstruction || "");
        setMode('edit');
    }
    setIsGenerating(false);
  };

  const handleSaveFinal = () => {
    if (!name.trim() || !role.trim() || !systemInstruction.trim()) {
        alert("Please fill all fields.");
        return;
    }

    // IMPORTANT: If editing an existing persona (even standard), keep its ID.
    // If it's a new creation, generate a unique ID.
    const newPersona: Persona = {
        id: existingPersona?.id || `custom-${Date.now()}`,
        name,
        role,
        description: existingPersona?.description || "Custom Guide",
        systemInstruction,
        voiceName,
        elevenLabsVoiceId: elVoiceId || undefined,
        icon: existingPersona?.icon || "🤖",
        color: existingPersona?.color || "from-fuchsia-900 to-purple-900" 
    };

    onSave(newPersona);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900/90 border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <Bot size={20} className="text-fuchsia-500"/> {existingPersona ? t.profileTabEdit : t.customPersonaTitle}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
                <label className="block text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-widest">{t.customNameLabel}</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-fuchsia-500 focus:outline-none transition-colors"
                />
            </div>
            <div>
                <label className="block text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-widest">{t.customVoiceLabel}</label>
                <select 
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-fuchsia-500 focus:outline-none appearance-none"
                >
                    {VOICES.map(v => (
                        <option key={v.name} value={v.name}>{v.name} ({v.desc})</option>
                    ))}
                </select>
            </div>
          </div>
          
          <div className="mb-8">
              <label className="block text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-widest">{t.customELVoiceLabel}</label>
              <input 
                  type="text" 
                  value={elVoiceId} 
                  onChange={(e) => setElVoiceId(e.target.value)}
                  placeholder="e.g. ErXwobaYiN019PkySvjV"
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 focus:outline-none font-mono text-sm"
              />
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-1 mb-8 bg-black/30 p-1.5 rounded-2xl border border-white/5">
             <button 
               onClick={() => setMode('edit')}
               className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide rounded-xl transition-all ${mode === 'edit' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {t.customTabManual}
             </button>
             <button 
               onClick={() => setMode('quiz')}
               className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 ${mode === 'quiz' ? 'bg-fuchsia-900/20 text-fuchsia-400' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <Sparkles size={14} /> {t.customTabAI}
             </button>
          </div>

          {mode === 'edit' ? (
            <div className="animate-in slide-in-from-left-2 duration-300 space-y-6">
              <div>
                 <label className="block text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-widest">{t.customRoleLabel}</label>
                 <input 
                    type="text"
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-fuchsia-500 focus:outline-none"
                  />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-widest">
                   {t.customSystemLabel}
                </label>
                <textarea 
                  value={systemInstruction} 
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  placeholder="..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white focus:border-fuchsia-500 focus:outline-none transition-colors min-h-[150px] resize-none leading-relaxed text-sm"
                />
              </div>
            </div>
          ) : (
             <div className="animate-in slide-in-from-right-2 duration-300 bg-black/20 rounded-2xl p-6 border border-white/5">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Sparkles className="animate-spin text-fuchsia-400 mb-4" size={32} />
                        <p className="text-slate-300 font-serif italic">{t.customQuizGenerating}</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">{t.quizTitle} {step + 1} / 3</span>
                            <div className="flex gap-1.5">
                                {[0,1,2].map(i => (
                                    <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-fuchsia-500' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-serif text-white mb-6 leading-relaxed">{t.customQuizQuestions[step]}</h3>
                        
                        <textarea 
                             value={quizAnswers[step]}
                             onChange={(e) => {
                                 const newAnswers = [...quizAnswers];
                                 newAnswers[step] = e.target.value;
                                 setQuizAnswers(newAnswers);
                             }}
                             className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white focus:border-fuchsia-500 focus:outline-none mb-6 min-h-[100px]"
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
                                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-fuchsia-900/40 transition-all font-bold tracking-wide"
                                 >
                                    <Sparkles size={16} /> {t.personaCreate}
                                 </button>
                             )}
                        </div>
                    </>
                )}
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-black/20 flex justify-end">
            <button 
                onClick={handleSaveFinal}
                className="bg-white text-slate-900 font-bold px-8 py-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
                <Check size={18} /> {t.customSave}
            </button>
        </div>
      </div>
    </div>
  );
};
