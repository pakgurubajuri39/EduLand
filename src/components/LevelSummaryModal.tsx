import React from 'react';
import { Star, BookOpen, Clock, Trophy, ArrowRight, RotateCcw, Home } from 'lucide-react';
import { sound } from '../utils/audio';

interface LevelSummaryModalProps {
  stats: {
    time: number;
    booksCollected: number;
    totalBooks: number;
    stars: number;
  };
  levelTitle: string;
  targetTime: number;
  onContinueToVillage: () => void;
  onReplay: () => void;
  onNextLevel?: () => void;
}

export const LevelSummaryModal: React.FC<LevelSummaryModalProps> = ({
  stats,
  levelTitle,
  targetTime,
  onContinueToVillage,
  onReplay,
  onNextLevel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-white text-center relative overflow-hidden">
        {/* Decorative papercraft creased header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-sky-400 to-emerald-400" />

        <div className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
          Expedition Complete
        </div>
        <h2 className="text-2xl font-black text-white mb-4">{levelTitle}</h2>

        {/* 3-Star Flag Display */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl border transition-all transform ${
                i < stats.stars
                  ? 'bg-amber-500/20 border-amber-400/60 scale-110 shadow-lg text-amber-400'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-600 scale-95'
              }`}
            >
              <Star className={`w-8 h-8 ${i < stats.stars ? 'fill-amber-400' : ''}`} />
            </div>
          ))}
        </div>

        {/* Stat Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="p-3 bg-slate-800/70 border border-slate-700/70 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Golden Books</span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">
              {stats.booksCollected} / {stats.totalBooks}
            </div>
            <div className="text-[10px] text-slate-400">Banked to Village Vault</div>
          </div>

          <div className="p-3 bg-slate-800/70 border border-slate-700/70 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-sky-300 font-semibold mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Clear Time</span>
            </div>
            <div className="text-lg font-bold text-white tabular-nums">{stats.time}s</div>
            <div className="text-[10px] text-slate-400">Target: {targetTime}s</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {onNextLevel && (
            <button
              onClick={() => {
                sound.playButton();
                onNextLevel();
              }}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
            >
              <span>Next Expedition</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playButton();
                onContinueToVillage();
              }}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-sky-400" />
              <span>Village Hub</span>
            </button>

            <button
              onClick={() => {
                sound.playButton();
                onReplay();
              }}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
