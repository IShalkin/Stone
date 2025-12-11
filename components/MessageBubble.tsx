
import React, { useRef, useState, useEffect } from 'react';
import { Message, Language } from '../types';
import { Play, Pause, Volume2, ImageIcon, Loader2, ExternalLink, Cpu, User } from 'lucide-react';
import { UI_STRINGS } from '../constants';

interface Props {
  message: Message;
  language: Language;
}

export const MessageBubble: React.FC<Props> = ({ message, language }) => {
  const isUser = message.role === 'user';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const t = UI_STRINGS[language];

  // If audio URL changes, reset playing state
  useEffect(() => {
    setIsPlaying(false);
    if(audioRef.current) {
        audioRef.current.load();
    }
  }, [message.audioUrl]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error("Audio playback error:", error);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`relative max-w-[85%] sm:max-w-[75%] transition-all duration-300`}>
        
        {/* Bubble */}
        <div className={`
          relative rounded-3xl p-5 shadow-2xl backdrop-blur-md border
          ${isUser 
            ? 'bg-gradient-to-br from-emerald-600/90 to-emerald-700/90 text-white rounded-br-sm border-emerald-500/20 shadow-emerald-900/20' 
            : 'bg-slate-900/60 text-slate-100 rounded-bl-sm border-white/5 shadow-black/40'
          }
        `}>
            
            {/* Generated Image Container - Cinematic Look */}
            {(message.imageUrl || message.isGeneratingImage) && !isUser && (
            <div className="mb-4 rounded-xl overflow-hidden border border-white/10 relative min-h-[180px] bg-black/40 flex items-center justify-center group-hover:border-white/20 transition-colors">
                
                {/* Loading State */}
                {message.isGeneratingImage && !message.imageUrl && (
                    <div className="flex flex-col items-center gap-3 text-emerald-400/80">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
                            <Loader2 className="animate-spin relative z-10" size={28} />
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-medium opacity-80">
                            {message.imageType === 'photorealistic' ? t.searchingArchives : t.msgSearching}
                        </span>
                    </div>
                )}

                {/* Result Image */}
                {message.imageUrl && (
                    <div className="relative w-full h-full">
                        <img src={message.imageUrl} alt="Generated content" className="w-full h-auto object-cover max-h-80 animate-in fade-in duration-1000" />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

                        {/* Badge */}
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md border border-white/10 text-[9px] uppercase font-bold tracking-widest text-white/90 flex items-center gap-1.5 shadow-lg">
                            <ImageIcon size={10} />
                            {message.imageType === 'photorealistic' ? t.msgArchivePhoto : t.msgImagination}
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* User Uploaded Image */}
            {message.imageUrl && isUser && (
            <div className="mb-3 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                <img src={message.imageUrl} alt="User context" className="w-full h-auto object-cover max-h-60" />
            </div>
            )}

            {/* Text Content */}
            <div className={`whitespace-pre-wrap leading-relaxed tracking-wide ${isUser ? 'font-sans text-[15px] font-light' : 'font-serif text-[16px] text-slate-200'}`}>
            {message.text}
            </div>

            {/* Footer Area for AI */}
            {!isUser && (
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
                
                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                <div>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-slate-500 mb-2 flex items-center gap-1.5">
                        <ExternalLink size={10} /> {t.msgSource}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {message.sources.map((s, i) => (
                            <a 
                                key={i} 
                                href={s.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/5 text-emerald-400 px-2.5 py-1 rounded-md transition-colors truncate max-w-full block font-mono"
                            >
                                {s.title || s.uri}
                            </a>
                        ))}
                    </div>
                </div>
                )}

                {/* Audio Player for Model */}
                {message.audioUrl && (
                <div className="flex items-center gap-3 bg-black/20 rounded-full p-1.5 pr-4 border border-white/5 hover:border-white/10 transition-colors w-max max-w-full">
                    <button
                        onClick={toggleAudio}
                        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                    >
                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="ml-0.5" fill="currentColor" />}
                    </button>
                    
                    <div className="flex-1 min-w-[60px] h-4 flex items-center gap-0.5">
                        {[1,2,3,4,5,6,7].map((bar) => (
                             <div 
                                key={bar} 
                                className={`w-0.5 bg-emerald-500/60 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse h-3' : 'h-1.5'}`} 
                                style={{ animationDelay: `${bar * 0.1}s`, height: isPlaying ? `${Math.random() * 12 + 4}px` : undefined }} 
                             />
                        ))}
                    </div>

                    <Volume2 size={12} className="text-slate-500" />
                    
                    <audio 
                        ref={audioRef} 
                        src={message.audioUrl} 
                        onEnded={handleAudioEnded}
                        className="hidden" 
                    />
                </div>
                )}
                
                {/* Model Badge */}
                {message.modelName && (
                    <div className="flex justify-end mt-1">
                        <span className="text-[9px] text-slate-600 flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded opacity-40 hover:opacity-100 transition-opacity uppercase tracking-wider font-mono">
                            <Cpu size={9} /> {message.modelName}
                        </span>
                    </div>
                )}
            </div>
            )}
        </div>
        
        {/* Avatar / Icon positioning */}
        {!isUser && (
             <div className="absolute -left-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-2xl filter drop-shadow-lg hidden sm:block">
                 {/* Icon could go here if passed via props, but we keep it clean */}
             </div>
        )}
      </div>
    </div>
  );
};
