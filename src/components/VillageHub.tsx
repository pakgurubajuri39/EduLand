import React, { useState } from 'react';
import { LevelData, LevelProgress, VillageBuilding } from '../types/game';
import { sound } from '../utils/audio';
import { AmbientSoundController } from './AmbientSoundController';
import { BookOpen, Star, Play, Sparkles, CheckCircle2, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface VillageHubProps {
  bankedBooks: number;
  buildings: VillageBuilding[];
  levels: LevelData[];
  levelsProgress: Record<number, LevelProgress>;
  onConstructBuilding: (buildingId: VillageBuilding['id'], cost: number) => void;
  onSelectLevel: (levelId: number) => void;
  onOpenLore: () => void;
}

export const VillageHub: React.FC<VillageHubProps> = ({
  bankedBooks,
  buildings,
  levels,
  levelsProgress,
  onConstructBuilding,
  onSelectLevel,
  onOpenLore,
}) => {
  const [selectedTab, setSelectedTab] = useState<'MAP' | 'ARCHIVE' | 'PAIGE'>('MAP');
  const [constructingId, setConstructingId] = useState<string | null>(null);

  const totalStars = Object.values(levelsProgress).reduce((acc, curr) => acc + (curr.stars || 0), 0);
  const totalConstructed = buildings.filter((b) => b.isConstructed).length;

  const handleBuild = (b: VillageBuilding) => {
    if (bankedBooks < b.cost) return;
    setConstructingId(b.id);
    sound.playBuildingPopUp();
    setTimeout(() => {
      onConstructBuilding(b.id, b.cost);
      setConstructingId(null);
    }, 600);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 text-slate-100 overflow-y-auto">
      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="text-amber-400">EduLand</span>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold border border-sky-400/30">
              Village Hub
            </span>
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setSelectedTab('MAP');
              sound.playButton();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedTab === 'MAP' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Level Expeditions
          </button>
          <button
            onClick={() => {
              setSelectedTab('ARCHIVE');
              sound.playButton();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedTab === 'ARCHIVE' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Restore Archive</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-950/40 rounded-full font-bold">
              {totalConstructed}/4
            </span>
          </button>
          <button
            onClick={() => {
              setSelectedTab('PAIGE');
              sound.playButton();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedTab === 'PAIGE' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            Paige & Lore
          </button>
        </nav>

        {/* Ambient Sound Controller & Vault Stats */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <AmbientSoundController currentView="VILLAGE" />

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="tabular-nums font-bold text-sm">{bankedBooks}</span>
            <span className="text-slate-400 font-normal">Books</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 border border-sky-400/30 rounded-lg text-sky-300">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="tabular-nums font-bold text-sm">{totalStars}</span>
            <span className="text-slate-400 font-normal">Stars</span>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative w-full border-b border-slate-800 bg-slate-950 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 text-xs text-sky-400 font-bold uppercase tracking-wider">
              <span>Living Pop-Up Diorama</span>
              <span aria-hidden="true">·</span>
              <span>The Great Library Restoration</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Rebuild EduLand, one platforming quest at a time.
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
              When a chaotic squall scattered the sacred Golden Books across untamed green ridges, the Great Library unraveled into flat cardstock. Bounding across breezy peaks as Paige to rescue living tomes and fold raw cardstock back into a thriving papercraft realm!
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedTab('MAP')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Play Next Expedition</span>
              </button>
              <button
                onClick={onOpenLore}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                Story & Controls
              </button>
            </div>
          </div>

          {/* Diorama Hero Art Asset */}
          <div className="w-full md:w-96 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl relative bg-slate-900 group">
            <img
              src="/src/assets/images/eduland_hero_diorama_1791174099257.jpg"
              alt="EduLand Pop-up Diorama"
              referrerPolicy="no-referrer"
              className="w-full h-48 md:h-56 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex items-end p-4">
              <div>
                <span className="text-xs font-bold text-amber-300">Tactile Storybook Realm</span>
                <p className="text-[11px] text-slate-300">
                  Visible creased cardstock edges & warm clothbound book textures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {selectedTab === 'MAP' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Hill Zone Expeditions</h2>
                <p className="text-xs text-slate-400">
                  Select a zone to explore. Recover scattered Golden Books to bank as architectural resources.
                </p>
              </div>
              <div className="text-xs text-slate-400">
                Stars Collected: <span className="font-bold text-amber-400">{totalStars} / 12</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {levels.map((lvl) => {
                const prog = levelsProgress[lvl.id] || {
                  unlocked: lvl.id === 1,
                  stars: 0,
                  highScore: 0,
                  bestTime: null,
                  booksFound: 0,
                  totalBooks: lvl.books.length,
                };

                return (
                  <div
                    key={lvl.id}
                    className={`relative rounded-2xl p-6 border transition-all ${
                      prog.unlocked
                        ? 'bg-slate-800/80 border-slate-700 hover:border-amber-500/60 hover:shadow-xl'
                        : 'bg-slate-900/60 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                          {lvl.zone}
                        </div>
                        <h3 className="text-lg font-bold text-white mt-0.5">{lvl.title}</h3>
                      </div>

                      {/* Stars Earned */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < prog.stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">{lvl.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-5 border-t border-slate-700/60 pt-3">
                      <div>
                        Target Time: <span className="text-white font-semibold tabular-nums">{lvl.targetTime}s</span>
                      </div>
                      <span aria-hidden="true">·</span>
                      <div>
                        Golden Books: <span className="text-amber-300 font-semibold">{lvl.books.length} scattered</span>
                      </div>
                      {prog.highScore > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <div>
                            Best: <span className="text-emerald-400 font-semibold tabular-nums">{prog.highScore} pts</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Launch Expedition Button */}
                    <div className="flex items-center justify-between">
                      {prog.unlocked ? (
                        <button
                          onClick={() => {
                            sound.playButton();
                            onSelectLevel(lvl.id);
                          }}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                        >
                          <Play className="w-4 h-4 fill-slate-950" />
                          <span>Enter Expedition</span>
                        </button>
                      ) : (
                        <div className="w-full py-2.5 bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-700">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Restore preceding Archive Wing to unlock</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedTab === 'ARCHIVE' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Skyward Archive Reconstruction</h2>
                <p className="text-xs text-slate-400">
                  Banked Golden Books fold raw cardstock into inhabited buildings, unlocking new mechanics and zones.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Available Vault: {bankedBooks} Golden Books</span>
                </div>
              </div>
            </div>

            {/* Archive Wing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {buildings.map((b) => {
                const canAfford = bankedBooks >= b.cost;
                const isBuilding = constructingId === b.id;

                return (
                  <div
                    key={b.id}
                    className={`relative rounded-2xl p-6 border transition-all ${
                      b.isConstructed
                        ? 'bg-slate-800/90 border-emerald-500/40 shadow-lg'
                        : canAfford
                        ? 'bg-slate-800/70 border-amber-500/50 hover:border-amber-400'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-[11px] font-bold text-sky-400 tracking-wide">{b.subtitle}</div>
                        <h3 className="text-lg font-bold text-white">{b.name}</h3>
                      </div>

                      {b.isConstructed ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Restored</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-300 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
                          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                          <span>{b.cost} Books Required</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">{b.description}</p>

                    {/* Architectural Perk */}
                    <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1 mb-5">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{b.perkTitle}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{b.perkDescription}</p>
                    </div>

                    {/* Action Button */}
                    <div>
                      {b.isConstructed ? (
                        <div className="w-full py-2.5 bg-emerald-950/40 text-emerald-400 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Wing Active & Benefiting Paige</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBuild(b)}
                          disabled={!canAfford || isBuilding}
                          className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>
                            {isBuilding ? 'Folding Papercraft...' : canAfford ? `Fold Wing (${b.cost} Books)` : `Need ${b.cost - bankedBooks} More Books`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedTab === 'PAIGE' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Character Profile Card */}
            <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6 flex flex-col items-center text-center">
              <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl mb-4 bg-slate-900 group relative">
                <img
                  src="/src/assets/images/paige_sprite_run_1791174716732.jpg"
                  alt="Paige running sprite"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-900/80 text-[10px] text-amber-300 font-bold rounded">
                  Scout Form
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">Paige</h3>
              <p className="text-xs text-sky-400 font-semibold mb-3">The Apprentice Binder</p>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Renowned throughout EduLand for agile papercraft boots and boundless curiosity. Venturing onto breezy windy ridges to recover living tomes and earn her Master Binder’s Ribbon!
              </p>
              <div className="w-full border-t border-slate-700 pt-3 text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Role:</span>
                  <span className="text-white font-semibold">Agile Traversal Scout</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Specialty:</span>
                  <span className="text-white font-semibold">High-Altitude Glider</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Core Tool:</span>
                  <span className="text-amber-400 font-semibold">Hardcover Glider</span>
                </div>
              </div>
            </div>

            {/* Mechanics Lore Breakdown */}
            <div className="md:col-span-2 space-y-4">
              {/* Glider Form Spotlight Card */}
              <div className="rounded-2xl bg-slate-800/80 border border-sky-500/40 p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-sky-400/60 shadow-lg shrink-0 bg-slate-900">
                  <img
                    src="/src/assets/images/paige_sprite_glide_1791174732914.jpg"
                    alt="Paige Hardcover Glider Flight"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wide">Aerial Transformation</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold">Hardcover Flight</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Hardcover Glider Flutter</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Carrying rescued Golden Books allows Paige to unfurl their durable hardcovers as diorama wings! Gliding slows descent, rides thermal chimney currents, and harmlessly bounces off pests.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-6">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Key Abilities & Tactical Rules</span>
                </h3>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="font-bold text-amber-300">Hardcover Glider Flutter:</span>
                    <p className="mt-1 text-slate-400 leading-relaxed">
                      Hold the Jump button in mid-air while carrying at least one unbanked Golden Book. Slows aerial descent, catches vertical drafts over village chimneys, and gliding directly into patrolling pests bounces Paige harmlessly backward without taking damage!
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="font-bold text-sky-300">Pop-Up Page Bridges:</span>
                    <p className="mt-1 text-slate-400 leading-relaxed">
                      Tap glowing bookmark nodes mid-run to instantly unfold folded-paper platforms across hazardous pits. Unfolded bridges collapse automatically after a 4-second visible crease timer.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <span className="font-bold text-emerald-300">Quill Leap on Accordion Pads:</span>
                    <p className="mt-1 text-slate-400 leading-relaxed">
                      Accordion-folded origami bounce pads launch Paige into high altitudes to discover secret floating ledges and rare high-altitude Golden Books.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer conforming to constitution */}
      <footer className="w-full py-4 px-6 border-t border-slate-800 bg-slate-950 text-center text-xs text-slate-500">
        <span>EduLand Builder Jump · Tactile Storybook Papercraft Platformer</span>
        <span className="mx-2">·</span>
        <span>@Copyright by. Pak GuruAI</span>
      </footer>
    </div>
  );
};
