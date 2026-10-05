import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Wind, Sliders } from 'lucide-react';
import { sound, AmbientMode } from '../utils/audio';

interface AmbientSoundControllerProps {
  currentView: 'VILLAGE' | 'PLAYING';
  compact?: boolean;
}

export const AmbientSoundController: React.FC<AmbientSoundControllerProps> = ({ currentView, compact = false }) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [volume, setVolume] = useState(sound.getVolume());
  const [mode, setMode] = useState<AmbientMode>(sound.getCurrentMode());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = sound.subscribe(() => {
      setIsMuted(sound.getMuted());
      setVolume(sound.getVolume());
      setMode(sound.getCurrentMode());
    });
    return unsubscribe;
  }, []);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    sound.setVolume(val);
  };

  const isVillage = currentView === 'VILLAGE';

  return (
    <div className="relative inline-block text-left select-none">
      {/* Trigger Pill / Button */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl backdrop-blur-md shadow-sm transition-colors">
        {/* Quick Mute / Unmute */}
        <button
          onClick={handleToggleMute}
          className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          title={isMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
          aria-label="Toggle Sound Mute"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        {/* Ambient Mode & Visualizer Badge */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 pr-2 pl-0.5 text-xs font-semibold cursor-pointer text-slate-200 hover:text-white"
          title="Open Ambient Sound Settings"
        >
          {isVillage ? (
            <>
              <Music className="w-3.5 h-3.5 text-amber-400" />
              {!compact && <span className="hidden sm:inline text-[11px] text-amber-300">Village Music</span>}
            </>
          ) : (
            <>
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              {!compact && <span className="hidden sm:inline text-[11px] text-sky-300">Paper Soundscape</span>}
            </>
          )}

          {/* Dancing Audio Wave Bars */}
          {!isMuted && (
            <div className="flex items-end gap-0.5 h-3 ml-1">
              <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="w-0.5 h-3 bg-emerald-300 rounded-full animate-pulse delay-75" />
              <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse delay-150" />
            </div>
          )}
        </button>
      </div>

      {/* Popover Settings Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 text-white animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Ambient Sound Controller</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
              {isVillage ? 'Hub Mode' : 'Play Mode'}
            </span>
          </div>

          {/* Mode Description */}
          <div className="my-3 p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
              {isVillage ? <Music className="w-3.5 h-3.5 text-amber-400" /> : <Wind className="w-3.5 h-3.5 text-sky-400" />}
              <span>{isVillage ? 'Lively Village Music' : 'Paper-Rustle Soundscape'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isVillage
                ? 'Cozy kalimba, wooden marimba melodies & bustling village atmosphere.'
                : 'Soothing mountain breezes, tactile whispering cardstock & gliding flutters.'}
            </p>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Master Volume</span>
              <span className="tabular-nums font-semibold text-slate-200">
                {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Manual Switcher */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => {
                sound.transitionTo('VILLAGE');
              }}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                mode === 'VILLAGE'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              Village
            </button>
            <button
              onClick={() => {
                sound.transitionTo('GAMEPLAY');
              }}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                mode === 'GAMEPLAY'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              Paper Breeze
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
