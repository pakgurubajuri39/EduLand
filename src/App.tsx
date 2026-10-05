/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { VillageHub } from './components/VillageHub';
import { LevelSummaryModal } from './components/LevelSummaryModal';
import { LoreModal } from './components/LoreModal';
import { GAME_LEVELS, INITIAL_VILLAGE_BUILDINGS } from './data/levels';
import { LevelProgress, VillageBuilding } from './types/game';
import { sound } from './utils/audio';

const STORAGE_KEYS = {
  BANKED_BOOKS: 'eduland_banked_books',
  BUILDINGS: 'eduland_village_buildings',
  LEVEL_PROGRESS: 'eduland_level_progress',
};

export default function App() {
  // Game View State
  const [currentView, setCurrentView] = useState<'VILLAGE' | 'PLAYING'>('VILLAGE');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [isLoreModalOpen, setIsLoreModalOpen] = useState<boolean>(false);

  // Dynamic Ambient Soundscape Transition on View Change
  useEffect(() => {
    sound.transitionTo(currentView === 'VILLAGE' ? 'VILLAGE' : 'GAMEPLAY');
  }, [currentView]);

  // Audio Context unlock on initial user interaction (for browser autoplay policies)
  useEffect(() => {
    const handleFirstGesture = () => {
      sound.transitionTo(currentView === 'VILLAGE' ? 'VILLAGE' : 'GAMEPLAY');
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [currentView]);

  // Persistent Game State (Banked Books, Village Buildings, Level Progress)
  const [bankedBooks, setBankedBooks] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BANKED_BOOKS);
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const [buildings, setBuildings] = useState<VillageBuilding[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUILDINGS);
    return saved ? JSON.parse(saved) : INITIAL_VILLAGE_BUILDINGS;
  });

  const [levelsProgress, setLevelsProgress] = useState<Record<number, LevelProgress>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEVEL_PROGRESS);
    if (saved) return JSON.parse(saved);
    return {
      1: { unlocked: true, stars: 0, highScore: 0, bestTime: null, booksFound: 0, totalBooks: 6 },
      2: { unlocked: false, stars: 0, highScore: 0, bestTime: null, booksFound: 0, totalBooks: 7 },
      3: { unlocked: false, stars: 0, highScore: 0, bestTime: null, booksFound: 0, totalBooks: 8 },
      4: { unlocked: false, stars: 0, highScore: 0, bestTime: null, booksFound: 0, totalBooks: 9 },
    };
  });

  // Level Summary Modal State
  const [summaryStats, setSummaryStats] = useState<{
    time: number;
    booksCollected: number;
    totalBooks: number;
    stars: number;
  } | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BANKED_BOOKS, bankedBooks.toString());
  }, [bankedBooks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(buildings));
  }, [buildings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEVEL_PROGRESS, JSON.stringify(levelsProgress));
  }, [levelsProgress]);

  // Construct Village Building Action
  const handleConstructBuilding = (buildingId: VillageBuilding['id'], cost: number) => {
    if (bankedBooks < cost) return;

    setBankedBooks((prev) => prev - cost);
    setBuildings((prev) =>
      prev.map((b) => (b.id === buildingId ? { ...b, isConstructed: true } : b))
    );

    // Check if building unlocks a new level
    const targetBuilding = buildings.find((b) => b.id === buildingId);
    if (targetBuilding && targetBuilding.unlockLevelId) {
      const nextLvl = targetBuilding.unlockLevelId;
      setLevelsProgress((prev) => ({
        ...prev,
        [nextLvl]: {
          ...prev[nextLvl],
          unlocked: true,
        },
      }));
    }
  };

  // Level Selection
  const handleSelectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setSummaryStats(null);
    setCurrentView('PLAYING');
  };

  // Level Complete Handler
  const handleLevelComplete = (stats: {
    time: number;
    booksCollected: number;
    totalBooks: number;
    stars: number;
  }) => {
    // 1. Bank collected books into village vault
    setBankedBooks((prev) => prev + stats.booksCollected);

    // 2. Update level progress
    setLevelsProgress((prev) => {
      const existing = prev[currentLevelId] || {
        unlocked: true,
        stars: 0,
        highScore: 0,
        bestTime: null,
        booksFound: 0,
        totalBooks: stats.totalBooks,
      };

      const newStars = Math.max(existing.stars, stats.stars);
      const newScore = Math.max(existing.highScore, stats.booksCollected * 200 + Math.max(0, 1000 - stats.time * 10));
      const newBestTime = existing.bestTime ? Math.min(existing.bestTime, stats.time) : stats.time;

      const updated = {
        ...prev,
        [currentLevelId]: {
          ...existing,
          stars: newStars,
          highScore: newScore,
          bestTime: newBestTime,
          booksFound: Math.max(existing.booksFound, stats.booksCollected),
        },
      };

      // Automatically unlock next level if passed with at least 1 star
      const nextId = currentLevelId + 1;
      if (stats.stars >= 1 && updated[nextId]) {
        updated[nextId] = {
          ...updated[nextId],
          unlocked: true,
        };
      }

      return updated;
    });

    // Show summary modal
    setSummaryStats(stats);
  };

  const currentLevelData = GAME_LEVELS.find((l) => l.id === currentLevelId) || GAME_LEVELS[0];

  // Calculated active perks from constructed buildings
  const activePerks = {
    speedBoost: buildings.find((b) => b.id === 'atrium')?.isConstructed ?? false,
    quillLeapBoost: buildings.find((b) => b.id === 'forge')?.isConstructed ?? false,
    thermalGliderBoost: buildings.find((b) => b.id === 'archive')?.isConstructed ?? false,
    masterSpire: buildings.find((b) => b.id === 'spire')?.isConstructed ?? false,
  };

  return (
    <div className="w-screen h-screen bg-slate-950 font-sans text-slate-100 flex flex-col overflow-hidden select-none">
      {currentView === 'VILLAGE' ? (
        <VillageHub
          bankedBooks={bankedBooks}
          buildings={buildings}
          levels={GAME_LEVELS}
          levelsProgress={levelsProgress}
          onConstructBuilding={handleConstructBuilding}
          onSelectLevel={handleSelectLevel}
          onOpenLore={() => setIsLoreModalOpen(true)}
        />
      ) : (
        <GameCanvas
          key={currentLevelId}
          level={currentLevelData}
          bankedBooksTotal={bankedBooks}
          onLevelComplete={handleLevelComplete}
          onExitToVillage={() => setCurrentView('VILLAGE')}
          unlockedPerks={activePerks}
        />
      )}

      {/* Summary Modal on Level Complete */}
      {summaryStats && (
        <LevelSummaryModal
          stats={summaryStats}
          levelTitle={currentLevelData.title}
          targetTime={currentLevelData.targetTime}
          onContinueToVillage={() => {
            setSummaryStats(null);
            setCurrentView('VILLAGE');
          }}
          onReplay={() => {
            setSummaryStats(null);
          }}
          onNextLevel={
            currentLevelId < GAME_LEVELS.length && levelsProgress[currentLevelId + 1]?.unlocked
              ? () => {
                  setCurrentLevelId(currentLevelId + 1);
                  setSummaryStats(null);
                }
              : undefined
          }
        />
      )}

      {/* Lore & Instructions Modal */}
      <LoreModal isOpen={isLoreModalOpen} onClose={() => setIsLoreModalOpen(false)} />
    </div>
  );
}
