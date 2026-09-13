import React, { useState, useRef } from 'react';
import { REALMS_LORE, FACTIONS_LORE, TIMELINE_LORE, RELICS_LORE, RealmEntry, FactionEntry } from '../engine/lore';
import { sound } from '../audio/sound';
import { useLenisScroll } from '../hooks/useLenisScroll';

interface AstralCodexModalProps {
  onClose: () => void;
}

type CodexTab = 'REALMS' | 'FACTIONS' | 'TIMELINE' | 'RELICS';

export const AstralCodexModal: React.FC<AstralCodexModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<CodexTab>('REALMS');
  const [selectedRealm, setSelectedRealm] = useState<RealmEntry>(REALMS_LORE[0]);
  const [selectedFaction, setSelectedFaction] = useState<FactionEntry>(FACTIONS_LORE[0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  useLenisScroll(scrollRef, undefined, [activeTab, selectedRealm, selectedFaction]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex items-center justify-center p-4 sm:p-8 animate-fadeIn select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-full h-[85vh] bg-[#0c071d]/95 border-2 border-yellow-500/70 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col justify-between overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#3e345e] z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-yellow-400">📖</span>
            <div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 tracking-wider">
                THE ASTRAL CODEX
              </h2>
              <span className="text-[11px] text-purple-300 font-sans tracking-wide">
                Chronicles of the Aetherium & Battleground Realities
              </span>
            </div>
          </div>

          {/* Tab Navigation Buttons */}
          <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-purple-900/60">
            {(['REALMS', 'FACTIONS', 'TIMELINE', 'RELICS'] as CodexTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  sound.playCardSnap();
                  setActiveTab(tab);
                }}
                className={`px-3 py-1.5 rounded-lg font-cinzel text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-yellow-500 text-black shadow-brass font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab === 'REALMS' && '🪐 REALMS'}
                {tab === 'FACTIONS' && '⚔️ FACTIONS'}
                {tab === 'TIMELINE' && '📜 TIMELINE'}
                {tab === 'RELICS' && '🔮 RELICS'}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-black/60 border border-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* TAB 1: REALMS & BATTLEGROUNDS */}
        {activeTab === 'REALMS' && (
          <div className="flex-1 flex flex-col md:flex-row gap-6 my-4 overflow-hidden">
            {/* Realms List Sidebar */}
            <div className="w-full md:w-64 space-y-2 overflow-y-auto pr-1">
              {REALMS_LORE.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    sound.playCardSnap();
                    setSelectedRealm(r);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    selectedRealm.id === r.id
                      ? 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                      : 'border-[#3b2a59] bg-[#120a26]/70 hover:border-purple-500/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-yellow-500/40 flex-shrink-0">
                    <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-cinzel text-xs font-bold text-yellow-300 truncate">
                      {r.name}
                    </h4>
                    <span className="text-[10px] text-purple-300 block truncate font-sans">
                      {r.leylineAffinity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Realm Spotlight Card */}
            <div ref={scrollRef} className="flex-1 dark-steel-card rounded-3xl p-5 flex flex-col justify-between overflow-y-auto border-2 border-yellow-500/50">
              <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-[#5a4d7a] shadow-inner mb-4 flex-shrink-0">
                <img
                  src={selectedRealm.image}
                  alt={selectedRealm.name}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute bottom-3 left-4">
                  <h3 className="font-cinzel text-2xl font-black text-yellow-300 drop-shadow">
                    {selectedRealm.name}
                  </h3>
                  <span className="text-xs font-bold text-cyan-300 font-cinzel tracking-wider">
                    {selectedRealm.subtitle}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 font-sans leading-relaxed">
                <div className="bg-black/50 border-l-2 border-yellow-500/70 p-3 rounded-r-xl text-purple-200 italic font-serif">
                  "{selectedRealm.lore}"
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#120a26] p-3 rounded-xl border border-purple-900/60">
                    <div className="text-[10px] font-cinzel font-bold text-yellow-400 uppercase mb-0.5">
                      Atmosphere & Climate
                    </div>
                    <div className="text-slate-200">{selectedRealm.climate}</div>
                  </div>
                  <div className="bg-[#120a26] p-3 rounded-xl border border-purple-900/60">
                    <div className="text-[10px] font-cinzel font-bold text-cyan-400 uppercase mb-0.5">
                      Leyline Resonance
                    </div>
                    <div className="text-slate-200">{selectedRealm.leylineAffinity}</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-950/80 to-purple-950/80 p-3 rounded-xl border border-red-500/50">
                  <div className="text-[10px] font-cinzel font-bold text-red-300 uppercase mb-0.5 flex items-center gap-1">
                    <span>⚔️</span>
                    <span>Battleground Leyline Hazard</span>
                  </div>
                  <div className="text-slate-100 font-semibold">{selectedRealm.battlefieldHazard}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FACTIONS & TRIBES */}
        {activeTab === 'FACTIONS' && (
          <div className="flex-1 flex flex-col md:flex-row gap-6 my-4 overflow-hidden">
            {/* Factions Sidebar */}
            <div className="w-full md:w-64 space-y-2 overflow-y-auto pr-1">
              {FACTIONS_LORE.map((f) => (
                <div
                  key={f.id}
                  onClick={() => {
                    sound.playCardSnap();
                    setSelectedFaction(f);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    selectedFaction.id === f.id
                      ? 'border-yellow-400 bg-yellow-950/40 shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                      : 'border-[#3b2a59] bg-[#120a26]/70 hover:border-purple-500/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-yellow-500/40 flex-shrink-0">
                    <img src={f.image} alt={f.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-cinzel text-xs font-bold text-yellow-300 truncate">
                      {f.name}
                    </h4>
                    <span className="text-[10px] text-cyan-300 block truncate font-sans font-bold">
                      {f.tribe}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Faction Spotlight */}
            <div ref={scrollRef} className="flex-1 dark-steel-card rounded-3xl p-5 flex flex-col justify-between overflow-y-auto border-2 border-yellow-500/50">
              <div className="flex items-center gap-4 mb-3 pb-3 border-b border-purple-950">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-yellow-500/70 shadow-lg flex-shrink-0">
                  <img src={selectedFaction.image} alt={selectedFaction.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-cinzel text-2xl font-black text-yellow-300">
                    {selectedFaction.name}
                  </h3>
                  <div className="text-xs font-cinzel font-bold text-purple-300 italic">
                    {selectedFaction.motto}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-sans">
                    <strong>Leader:</strong> {selectedFaction.leader}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 font-sans leading-relaxed">
                <div className="bg-black/50 border-l-2 border-cyan-400/80 p-3 rounded-r-xl text-purple-200">
                  "{selectedFaction.lore}"
                </div>

                <div className="bg-[#120a26] p-3.5 rounded-xl border border-purple-900/60">
                  <div className="text-[10px] font-cinzel font-bold text-yellow-400 uppercase mb-1">
                    ⚔️ Combat Doctrine
                  </div>
                  <p className="text-slate-200">{selectedFaction.doctrine}</p>
                </div>

                <div className="bg-[#100921] p-3 rounded-xl border border-yellow-600/40 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-cinzel font-bold text-yellow-300 uppercase">
                      Signature Relic
                    </div>
                    <div className="text-slate-100 font-bold text-xs">{selectedFaction.signatureRelic}</div>
                  </div>
                  <span className="text-xl">🔮</span>
                </div>

                {/* Character Concept Moodboard Sheet */}
                {selectedFaction.moodboardUrl && (
                  <div className="bg-[#120a26] p-3.5 rounded-xl border border-purple-900/60">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-cinzel font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                        <span>🎨</span>
                        <span>{selectedFaction.name} Concept Grid & Unit Moodboard</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">CONCEPT DOSSIER</span>
                    </div>
                    <div className="relative w-full rounded-xl overflow-hidden border border-yellow-500/40 shadow-inner group/mb">
                      <img
                        src={selectedFaction.moodboardUrl}
                        alt={`${selectedFaction.name} Moodboard`}
                        className="w-full h-auto object-cover transform transition-transform duration-500 group-hover/mb:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-yellow-300 font-cinzel font-bold">
                        <span>{selectedFaction.tribe} WARBAND UNITS</span>
                        <span className="text-slate-300 text-[9px] font-sans">Official Concept Art</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THE ASTRAL TIMELINE */}
        {activeTab === 'TIMELINE' && (
          <div ref={scrollRef} className="flex-1 flex flex-col gap-4 my-4 overflow-y-auto pr-1">
            {TIMELINE_LORE.map((t, idx) => (
              <div
                key={idx}
                className="dark-steel-card rounded-2xl p-4 border border-[#524775] flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-black/80 border-2 border-yellow-500/60 flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
                  {t.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-cinzel text-xs font-bold text-cyan-300">
                      {t.era} • {t.year}
                    </span>
                  </div>
                  <h4 className="font-cinzel text-base font-bold text-yellow-300 mb-1">
                    {t.title}
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {t.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: RELICS OF POWER */}
        {activeTab === 'RELICS' && (
          <div ref={scrollRef} className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 my-4 overflow-y-auto pr-1">
            {RELICS_LORE.map((relic) => (
              <div
                key={relic.id}
                className="dark-steel-card rounded-2xl p-4 border border-[#524775] flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-yellow-500/40 mb-3 shadow-inner">
                    <img src={relic.image} alt={relic.name} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-cinzel text-sm font-bold text-yellow-300 mb-0.5">
                    {relic.name}
                  </h4>
                  <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider block mb-2 font-cinzel">
                    {relic.originTribe}
                  </span>
                  <p className="text-xs text-slate-300 font-sans mb-3 leading-relaxed">
                    {relic.lore}
                  </p>
                </div>
                <div className="bg-yellow-950/80 border border-yellow-500/50 p-2.5 rounded-xl text-[11px] text-yellow-200 font-sans">
                  <strong>Effect:</strong> {relic.power}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#3e345e] flex items-center justify-between text-[11px] text-slate-400 font-sans">
          <span>Aetherium World Compendium • Compiled from the Astral Atrium Archives</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-cinzel font-bold text-xs rounded-xl shadow-brass transition-all"
          >
            RETURN TO BATTLEGROUNDS ➔
          </button>
        </div>
      </div>
    </div>
  );
};
