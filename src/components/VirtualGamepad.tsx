import React from 'react';
import { Sparkles, Wind, RotateCcw, Volume2, VolumeX, Eye, EyeOff } from 'lucide-react';
import { BookmarkBridge } from '../types/game';

interface VirtualGamepadProps {
  onLeftStart: () => void;
  onLeftEnd: () => void;
  onRightStart: () => void;
  onRightEnd: () => void;
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onBridgeAction: () => void;
  onReset: () => void;
  activeBookmarkNear: BookmarkBridge | null;
  canGlide: boolean;
  isGliding: boolean;
  isTouchDevice: boolean;
  controllerMode: 'AUTO' | 'ON' | 'OFF';
  onToggleControllerMode: () => void;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({
  onLeftStart,
  onLeftEnd,
  onRightStart,
  onRightEnd,
  onJumpStart,
  onJumpEnd,
  onBridgeAction,
  onReset,
  activeBookmarkNear,
  canGlide,
  isGliding,
  isTouchDevice,
  controllerMode,
  onToggleControllerMode,
}) => {
  // Determine visibility based on mode & device
  const isVisible =
    controllerMode === 'ON' || (controllerMode === 'AUTO' && (isTouchDevice || typeof window !== 'undefined' && window.innerWidth < 1180));

  if (!isVisible) {
    return (
      <div className="absolute bottom-4 right-4 z-30">
        <button
          onClick={onToggleControllerMode}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700/80 backdrop-blur-md shadow-md cursor-pointer transition-colors"
          title="Enable On-Screen Gamepad"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span>Gamepad: OFF</span>
        </button>
      </div>
    );
  }

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none pb-safe">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-3 md:pb-6 flex items-end justify-between select-none">
        {/* Left Thumb Cluster: Directional D-Pad */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Left Arrow Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              triggerHaptic();
              onLeftStart();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onLeftEnd();
            }}
            onPointerLeave={onLeftEnd}
            onPointerCancel={onLeftEnd}
            className="w-16 h-16 md:w-20 md:h-20 bg-slate-900/85 active:bg-sky-600 text-white font-black text-2xl md:text-3xl rounded-2xl border-2 border-slate-700 active:border-sky-300 backdrop-blur-md shadow-2xl flex items-center justify-center touch-manipulation cursor-pointer transition-all active:scale-95 active:shadow-sky-500/30"
            aria-label="Move Left"
          >
            ◀
          </button>

          {/* Right Arrow Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              triggerHaptic();
              onRightStart();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onRightEnd();
            }}
            onPointerLeave={onRightEnd}
            onPointerCancel={onRightEnd}
            className="w-16 h-16 md:w-20 md:h-20 bg-slate-900/85 active:bg-sky-600 text-white font-black text-2xl md:text-3xl rounded-2xl border-2 border-slate-700 active:border-sky-300 backdrop-blur-md shadow-2xl flex items-center justify-center touch-manipulation cursor-pointer transition-all active:scale-95 active:shadow-sky-500/30"
            aria-label="Move Right"
          >
            ▶
          </button>
        </div>

        {/* Center Controller Mode Toggle & Keyboard Hint */}
        <div className="hidden lg:flex flex-col items-center pointer-events-auto mb-1">
          <button
            onClick={onToggleControllerMode}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold rounded-lg border border-slate-700/80 backdrop-blur-md transition-colors cursor-pointer"
          >
            <EyeOff className="w-3 h-3 text-slate-400" />
            <span>Gamepad ({controllerMode})</span>
          </button>
          <span className="text-[10px] text-slate-400 mt-1">
            Keyboard: A/D (Move) · Space (Jump/Glide) · E (Bridge)
          </span>
        </div>

        {/* Right Thumb Cluster: Unfold Bridge + Jump / Glider Flutter */}
        <div className="flex items-center gap-2.5 md:gap-3.5 pointer-events-auto">
          {/* Unfold Bridge Action Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              triggerHaptic();
              onBridgeAction();
            }}
            disabled={!activeBookmarkNear || activeBookmarkNear.isUnfolded}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all touch-manipulation shadow-xl ${
              activeBookmarkNear && !activeBookmarkNear.isUnfolded
                ? 'bg-amber-500 active:bg-amber-400 text-slate-950 border-amber-300 animate-pulse cursor-pointer shadow-amber-500/40'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 cursor-not-allowed opacity-60'
            }`}
            aria-label="Unfold Page Bridge"
          >
            <Sparkles className="w-5 h-5 mb-0.5" />
            <span className="text-[9px] md:text-[10px] font-extrabold uppercase leading-none">Bridge</span>
          </button>

          {/* Jump / Glider Hold Button */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              triggerHaptic();
              onJumpStart();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onJumpEnd();
            }}
            onPointerLeave={onJumpEnd}
            onPointerCancel={onJumpEnd}
            className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl font-black flex flex-col items-center justify-center border-2 shadow-2xl touch-manipulation cursor-pointer transition-all active:scale-95 ${
              canGlide
                ? 'bg-sky-600 active:bg-sky-500 text-white border-sky-300 shadow-sky-500/40'
                : 'bg-amber-500 active:bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/40'
            }`}
            aria-label="Jump or Glide"
          >
            {canGlide ? (
              <>
                <Wind className={`w-6 h-6 md:w-7 md:h-7 mb-1 ${isGliding ? 'animate-bounce text-amber-300' : ''}`} />
                <span className="text-xs md:text-sm tracking-tight leading-none font-black">
                  {isGliding ? 'GLIDING' : 'GLIDE'}
                </span>
                <span className="text-[8px] md:text-[9px] opacity-80 mt-0.5 font-bold uppercase">Hold</span>
              </>
            ) : (
              <>
                <span className="text-2xl md:text-3xl leading-none mb-0.5">▲</span>
                <span className="text-xs md:text-sm tracking-tight leading-none font-black">JUMP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
