
import React from 'react';
import { Persona, Language, PersonaId } from '../types';
import { UI_STRINGS, STANDARD_IDS } from '../constants';
import { Edit2, Plus, Trash2, RotateCcw } from 'lucide-react';

interface Props {
  personas: Persona[]; // The merged list of standard + custom + overrides
  currentPersona: Persona;
  onSelect: (persona: Persona) => void;
  customPersonas: Persona[]; // Raw custom/override list to check existence
  onAddCustom: () => void;
  onEdit: (persona: Persona) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
  language: Language;
}

export const PersonaSelector: React.FC<Props> = ({ 
    personas,
    currentPersona, 
    onSelect, 
    customPersonas, 
    onAddCustom, 
    onEdit,
    onDelete,
    onReset,
    language 
}) => {
  const t = UI_STRINGS[language];

  return (
    <div className="w-full overflow-x-auto pb-6 pt-2 px-2 no-scrollbar mask-linear-fade">
      <div className="flex gap-5 px-2 min-w-max">
        {personas.map((p) => {
          const isSelected = p.id === currentPersona.id;
          
          const isStandard = STANDARD_IDS.includes(p.id as any);
          const isOverridden = isStandard && customPersonas.some(cp => cp.id === p.id);
          const isPureCustom = !isStandard;

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className={`
                group relative flex flex-col items-center justify-between p-4 rounded-[1.5rem] transition-all duration-500 w-28 h-36 flex-shrink-0
                ${isSelected 
                  ? `bg-gradient-to-b ${p.color} border border-white/20 shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)] scale-105 z-10` 
                  : 'bg-slate-900/40 border border-white/5 hover:bg-slate-800/60 hover:border-white/10 hover:-translate-y-1'
                }
              `}
            >
              {/* Glow Effect for Selected */}
              {isSelected && <div className="absolute inset-0 rounded-[1.5rem] bg-white/5 blur-xl -z-10"></div>}

              {/* Indicator for modified standard persona */}
              {isOverridden && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-500/50"></div>
              )}

              <div className={`text-4xl filter drop-shadow-2xl transition-transform duration-300 ${isSelected ? 'scale-110 rotate-3' : 'group-hover:scale-110'}`}>
                  {p.icon}
              </div>
              
              <div className="flex flex-col items-center gap-1 w-full">
                  <span className={`text-[11px] uppercase tracking-widest font-bold truncate w-full text-center ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {p.role}
                  </span>
                  <div className={`h-0.5 w-8 rounded-full transition-colors ${isSelected ? 'bg-white/50' : 'bg-transparent'}`} />
              </div>

              {/* Actions Overlay */}
              {isSelected && (
                  <>
                      {/* EDIT (Always available) */}
                      <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(p);
                        }}
                        className={`absolute -top-2 -right-2 bg-slate-800 rounded-full p-1.5 shadow-lg border border-slate-600 hover:bg-fuchsia-600 hover:border-fuchsia-400 hover:text-white z-20 transition-all opacity-100 scale-100`}
                      >
                          <Edit2 size={12} className="text-fuchsia-400 hover:text-white"/>
                      </div>
                      
                      {/* DELETE (Only for Pure Custom) */}
                      {isPureCustom && (
                         <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                if(confirm("Delete this guide?")) onDelete(p.id);
                            }}
                            className="absolute -top-2 -left-2 bg-slate-800 rounded-full p-1.5 shadow-lg border border-slate-600 hover:bg-red-600 hover:border-red-400 hover:text-white z-20 transition-all"
                        >
                            <Trash2 size={12} className="text-red-400 hover:text-white"/>
                        </div>
                      )}

                      {/* RESET (Only for Overridden Standard) */}
                      {isOverridden && (
                         <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                if(confirm("Reset this guide to default settings?")) onReset(p.id);
                            }}
                            className="absolute -top-2 -left-2 bg-slate-800 rounded-full p-1.5 shadow-lg border border-slate-600 hover:bg-amber-600 hover:border-amber-400 hover:text-white z-20 transition-all"
                        >
                            <RotateCcw size={12} className="text-amber-400 hover:text-white"/>
                        </div>
                      )}
                  </>
              )}
            </button>
          );
        })}

        {/* Add New Custom Persona Button */}
        <button
            onClick={onAddCustom}
            className="flex flex-col items-center justify-center p-4 rounded-[1.5rem] bg-slate-900/20 hover:bg-slate-900/60 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 transition-all duration-300 w-28 h-36 flex-shrink-0 group"
        >
             <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center mb-3 transition-colors duration-300">
                 <Plus size={24} className="text-slate-500 group-hover:text-emerald-400"/>
             </div>
             <span className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-emerald-400 tracking-wider">
                {t.personaCreate}
             </span>
        </button>

      </div>
    </div>
  );
};
