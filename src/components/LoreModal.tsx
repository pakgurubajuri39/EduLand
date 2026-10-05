import React from 'react';
import { X, BookOpen, Wind, Sparkles, Compass } from 'lucide-react';
import { sound } from '../utils/audio';

interface LoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoreModal: React.FC<LoreModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => {
            sound.playButton();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-xs uppercase tracking-widest text-sky-400 font-bold mb-1">
          EduLand Field Journal
        </div>
        <h2 className="text-2xl font-black text-white mb-4">The Living Folio of EduLand</h2>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            EduLand is a vibrant, living pop-up diorama realm crafted from enchanted cardstock and clothbound lore, where landscape features physically unfold from the pages of history.
          </p>
          <p>
            When a chaotic squall shattered the central Great Library, sacred Golden Books were scattered across breezy mountain ridges. Pathways creased shut and the community was left adrift. Only by bounding across breezy peaks and recovering these living tomes can the papercraft skyline be rebuilt, transforming lost stories back into thriving village architecture.
          </p>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Core Traversal Mechanics</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                  <Wind className="w-3.5 h-3.5" />
                  <span>Hardcover Glider Flutter</span>
                </div>
                <p className="text-slate-400">
                  Hold Jump mid-air while carrying at least 1 Golden Book. Slows descent and rides chimney updrafts to reach high-altitude secret paths. Gliding into pests bounces you harmlessly!
                </p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <div className="font-bold text-sky-300 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pop-Up Page Bridges</span>
                </div>
                <p className="text-slate-400">
                  Tap glowing bookmark nodes or press [E] / Unfold Button to unfold paper bridges across hazardous pits. Unfolded bridges automatically collapse after 4 seconds!
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-sm font-bold text-white mb-2">Controls Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <div className="font-semibold text-white mb-1">Desktop Controls:</div>
                <ul className="text-slate-400 space-y-1">
                  <li>• Move: <span className="text-white">A / D</span> or <span className="text-white">Arrow Keys</span></li>
                  <li>• Jump / Glide: <span className="text-white">W / Space</span> (Hold to Glide)</li>
                  <li>• Unfold Bridge: <span className="text-white">E</span> or Click Bookmark</li>
                  <li>• Restart Level: <span className="text-white">R</span></li>
                </ul>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl">
                <div className="font-semibold text-white mb-1">Mobile & Tablet Controller:</div>
                <ul className="text-slate-400 space-y-1">
                  <li>• Ergonomic D-Pad (◀ / ▶) on left thumb</li>
                  <li>• JUMP / GLIDE button (Hold to Glide) on right thumb</li>
                  <li>• Quick-action BRIDGE button (Glows near bookmarks)</li>
                  <li>• Multi-device support: iPad Pro, iPad Mini, Android tablets, iPhones, laptops & PCs!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              sound.playButton();
              onClose();
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Ready to Bound!
          </button>
        </div>
      </div>
    </div>
  );
};
