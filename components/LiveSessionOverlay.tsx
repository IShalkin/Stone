
import React, { useEffect, useState, useRef } from 'react';
import { Persona, LocationData, UserProfile, Language } from '../types';
import { connectLiveSession } from '../services/gemini';
import { PhoneOff, Mic, MicOff, Signal, Radio, Search, AlertCircle } from 'lucide-react';
import { UI_STRINGS } from '../constants';

interface Props {
  persona: Persona;
  location: LocationData | null;
  knowledgeContext: string;
  userProfile: UserProfile | null;
  onClose: () => void;
  language: Language;
  geminiApiKey: string;
  googleMapsKey?: string;
}

type ToolStatus = 'idle' | 'gps' | 'search';

// Simple Synth for UI Sound Effects
class SoundGenerator {
  private ctx: AudioContext;
  private masterGain: GainNode;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.1; // Low volume
    this.masterGain.connect(this.ctx.destination);
  }

  playScanningSound() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.5);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 1.0);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 1.0);
  }

  playPingSound() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

export const LiveSessionOverlay: React.FC<Props> = ({ persona, location, knowledgeContext, userProfile, onClose, language, geminiApiKey, googleMapsKey }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<ToolStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  
  const locationRef = useRef<LocationData | null>(location);
  const disconnectRef = useRef<(() => Promise<void>) | null>(null);
  const soundGenRef = useRef<SoundGenerator | null>(null);
  const t = UI_STRINGS[language];

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    try {
        soundGenRef.current = new SoundGenerator();
    } catch(e) { console.error("Audio API not supported"); }
  }, []);
  
  const handleToolUpdate = (newStatus: ToolStatus) => {
    setToolStatus(newStatus);
    if (newStatus === 'search') soundGenRef.current?.playScanningSound();
    if (newStatus === 'gps') soundGenRef.current?.playPingSound();
  };

  useEffect(() => {
    let isMounted = true;

    const startSession = async () => {
      try {
        const { disconnect } = await connectLiveSession(
          persona,
          () => locationRef.current,
          knowledgeContext,
          userProfile,
          language,
          (audioBuffer) => {
            if (isMounted) {
               const data = audioBuffer.getChannelData(0);
               let sum = 0;
               for(let i=0; i<data.length; i+=10) sum += data[i] * data[i];
               const rms = Math.sqrt(sum / (data.length / 10));
               setVolume(Math.min(rms * 5, 1));
               setTimeout(() => { if(isMounted) setVolume(0); }, audioBuffer.duration * 1000);
            }
          },
          () => { if (isMounted) onClose(); },
          (ts) => { if (isMounted) handleToolUpdate(ts); },
          geminiApiKey,
          googleMapsKey
        );
        disconnectRef.current = disconnect;
        setStatus('connected');
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setErrorMessage(err.message || t.liveError);
      }
    };

    startSession();

    return () => {
      isMounted = false;
      if (disconnectRef.current) disconnectRef.current();
    };
  }, [persona.id]);

  let ringColor = "border-white/10";
  let pulseColor = persona.color;
  let statusText = t.liveOnAir;
  let StatusIcon = Signal;

  if (toolStatus === 'search') {
      ringColor = "border-amber-500/50";
      pulseColor = "from-amber-600 to-orange-600";
      statusText = t.liveSearching;
      StatusIcon = Search;
  } else if (toolStatus === 'gps') {
      ringColor = "border-blue-500/50";
      pulseColor = "from-blue-600 to-cyan-600";
      statusText = t.liveGPS;
      StatusIcon = Radio;
  }

  if (status === 'error') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-3xl text-white animate-in fade-in duration-300">
             <div className="flex flex-col items-center gap-6 p-8 max-w-sm text-center">
                 <div className="p-4 bg-red-500/10 rounded-full border border-red-500/50 text-red-400">
                     <AlertCircle size={48} />
                 </div>
                 <h3 className="text-xl font-bold text-white">Connection Failed</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">{errorMessage}</p>
                 <button 
                    onClick={onClose}
                    className="mt-4 px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                 >
                     Close
                 </button>
             </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-3xl text-white animate-in fade-in duration-500">
      
      {/* Background Ambience */}
      <div className={`absolute inset-0 bg-gradient-to-br ${persona.color} opacity-20 transition-colors duration-1000`} />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      
      {/* HUD Elements */}
      <div className="absolute inset-0 pointer-events-none border-[20px] border-white/5"></div>
      <div className="absolute top-8 left-8 w-32 h-[1px] bg-white/20"></div>
      <div className="absolute top-8 right-8 w-32 h-[1px] bg-white/20"></div>
      <div className="absolute bottom-8 left-8 w-32 h-[1px] bg-white/20"></div>
      <div className="absolute bottom-8 right-8 w-32 h-[1px] bg-white/20"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md p-8 h-full justify-between">
        
        {/* Status Bar */}
        <div className="w-full flex justify-center items-center py-4">
            <div className={`
                flex items-center gap-3 px-4 py-1.5 rounded-full border bg-black/40 backdrop-blur-md transition-all duration-300
                ${toolStatus !== 'idle' ? 'border-white/30 text-white' : 'border-white/10 text-white/50'}
            `}>
                <StatusIcon size={14} className={toolStatus !== 'idle' ? 'animate-bounce' : (status === 'connected' ? 'text-emerald-500' : 'animate-pulse text-amber-500')} />
                <span className="text-xs font-mono uppercase tracking-[0.2em]">
                    {status === 'connecting' ? t.liveConnecting : statusText}
                </span>
            </div>
        </div>

        {/* Central Visualizer */}
        <div className="relative flex items-center justify-center">
            {/* Outer Rings */}
            <div className={`absolute w-[400px] h-[400px] border border-dashed rounded-full animate-[spin_10s_linear_infinite] opacity-20 ${ringColor}`} />
            <div className={`absolute w-[300px] h-[300px] border border-dotted rounded-full animate-[spin_15s_linear_infinite_reverse] opacity-20 ${ringColor}`} />
            
            {/* Volume Reactive Ring */}
            <div className={`absolute inset-0 rounded-full bg-white/5 blur-2xl transition-all duration-75`} 
                 style={{ transform: `scale(${1 + volume * 2})`, opacity: volume }} />

            {/* Main Avatar Circle */}
            <div className={`
                relative w-48 h-48 rounded-full flex items-center justify-center 
                bg-gradient-to-br ${pulseColor} shadow-[0_0_100px_rgba(0,0,0,0.6)]
                border-4 border-white/10 transition-colors duration-500 group
            `}>
                <div className="absolute inset-0 rounded-full border border-white/20 opacity-50 scale-110"></div>
                <span className="text-7xl filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-500">{persona.icon}</span>
            </div>
        </div>

        {/* Persona Info */}
        <div className="text-center space-y-2">
            <h2 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">{persona.name}</h2>
            <p className="text-emerald-400 text-xs font-mono uppercase tracking-[0.3em]">{persona.role}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 mb-8">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-5 rounded-full border border-white/10 transition-all duration-300 ${isMuted ? 'bg-white text-slate-950 hover:bg-slate-200' : 'bg-black/40 text-white hover:bg-white/10 hover:border-white/30'}`}
            >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button 
                onClick={onClose}
                className="p-8 rounded-full bg-red-600 hover:bg-red-500 shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 hover:rotate-90 active:scale-95 border border-white/10"
            >
                <PhoneOff size={32} fill="currentColor" />
            </button>
        </div>
        
        {/* Debug/Error Info */}
        <div className="h-6 flex items-center justify-center">
            {location && (
                <p className="text-white/20 text-[9px] font-mono tracking-widest">
                    {location.latitude.toFixed(4)}N  /  {location.longitude.toFixed(4)}E
                </p>
            )}
        </div>
      </div>
    </div>
  );
};
