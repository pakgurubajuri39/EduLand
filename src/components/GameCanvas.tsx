import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LevelData, Player, Particle, BookmarkBridge, AccordionPad, ChimneyThermal, Pest, GoldenBook } from '../types/game';
import { sound } from '../utils/audio';
import { assetManager } from '../utils/assets';
import { WeatherEngine } from '../utils/weatherEngine';
import { VirtualGamepad } from './VirtualGamepad';
import { AmbientSoundController } from './AmbientSoundController';
import { Volume2, VolumeX, RotateCcw, Home, Sparkles, BookOpen, Wind, CloudSun, Gamepad2 } from 'lucide-react';

interface GameCanvasProps {
  level: LevelData;
  bankedBooksTotal: number;
  onLevelComplete: (stats: { time: number; booksCollected: number; totalBooks: number; stars: number }) => void;
  onExitToVillage: () => void;
  unlockedPerks: {
    speedBoost: boolean;
    quillLeapBoost: boolean;
    thermalGliderBoost: boolean;
    masterSpire: boolean;
  };
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  onLevelComplete,
  onExitToVillage,
  unlockedPerks,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const weatherEngineRef = useRef<WeatherEngine>(new WeatherEngine(level.weather || 'CONFETTI_BREEZE'));

  // Multi-platform detection: PC, Laptop, Large/Small Tablets, Mobile Phones
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });
  const [controllerMode, setControllerMode] = useState<'AUTO' | 'ON' | 'OFF'>('AUTO');

  // Sound state
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [activeBookmarkNear, setActiveBookmarkNear] = useState<BookmarkBridge | null>(null);
  const [gameStats, setGameStats] = useState({
    carriedBooks: 0,
    health: 3,
    maxHealth: 3,
    time: 0,
    isGliding: false,
    canGlide: false,
    score: 0,
    hasWon: false,
    isDead: false,
  });

  // Mutable Game Loop State
  const gameStateRef = useRef<{
    player: Player;
    platforms: LevelData['platforms'];
    bookmarkBridges: BookmarkBridge[];
    chimneys: ChimneyThermal[];
    bouncePads: AccordionPad[];
    pests: Pest[];
    books: GoldenBook[];
    particles: Particle[];
    cameraX: number;
    cameraY: number;
    keys: {
      left: boolean;
      right: boolean;
      jump: boolean;
      interact: boolean;
    };
    elapsedTime: number;
    score: number;
    isPaused: boolean;
    hasWon: boolean;
    isDead: boolean;
    animationFrameId: number;
  }>({
    player: {
      x: level.playerStart.x,
      y: level.playerStart.y,
      width: 32,
      height: 48,
      vx: 0,
      vy: 0,
      isGrounded: false,
      isGliding: false,
      facing: 'right',
      carriedBooks: 0,
      health: 3,
      maxHealth: 3,
      invincibleTimer: 0,
      bounceStreak: 0,
      runFrame: 0,
    },
    platforms: JSON.parse(JSON.stringify(level.platforms)),
    bookmarkBridges: JSON.parse(JSON.stringify(level.bookmarkBridges)),
    chimneys: JSON.parse(JSON.stringify(level.chimneys)),
    bouncePads: JSON.parse(JSON.stringify(level.bouncePads)),
    pests: JSON.parse(JSON.stringify(level.pests)),
    books: JSON.parse(JSON.stringify(level.books)),
    particles: [],
    cameraX: 0,
    cameraY: 0,
    keys: { left: false, right: false, jump: false, interact: false },
    elapsedTime: 0,
    score: 0,
    isPaused: false,
    hasWon: false,
    isDead: false,
    animationFrameId: 0,
  });

  // Particle helper
  const createParticles = (
    x: number,
    y: number,
    count: number,
    color: string,
    shape: 'square' | 'circle' | 'sparkle' | 'leaf' = 'sparkle',
    speed = 3
  ) => {
    const s = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.7 + 0.3) * speed;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - (shape === 'leaf' ? 1 : 0),
        size: Math.random() * 4 + 3,
        color,
        life: 1,
        maxLife: Math.random() * 0.5 + 0.4,
        shape,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
      });
    }
  };

  // Bridge unfold action
  const unfoldBridge = useCallback((bridgeId: string) => {
    const s = gameStateRef.current;
    const bridge = s.bookmarkBridges.find((b) => b.id === bridgeId);
    if (bridge && !bridge.isUnfolded) {
      bridge.isUnfolded = true;
      bridge.creaseTimer = bridge.maxTimer;
      sound.playPopUpBridge();
      createParticles(bridge.bridgeX + bridge.bridgeWidth / 2, bridge.bridgeY, 15, '#f59e0b', 'square', 4);
    }
  }, []);

  // Reset Level
  const resetLevel = useCallback(() => {
    const s = gameStateRef.current;
    s.player = {
      x: level.playerStart.x,
      y: level.playerStart.y,
      width: 32,
      height: 48,
      vx: 0,
      vy: 0,
      isGrounded: false,
      isGliding: false,
      facing: 'right',
      carriedBooks: 0,
      health: 3,
      maxHealth: 3,
      invincibleTimer: 0,
      bounceStreak: 0,
      runFrame: 0,
    };
    s.bookmarkBridges = JSON.parse(JSON.stringify(level.bookmarkBridges));
    s.bouncePads = JSON.parse(JSON.stringify(level.bouncePads));
    s.pests = JSON.parse(JSON.stringify(level.pests));
    s.books = JSON.parse(JSON.stringify(level.books));
    s.particles = [];
    s.elapsedTime = 0;
    s.score = 0;
    s.hasWon = false;
    s.isDead = false;
    sound.stopGlider();
    setGameStats((prev) => ({
      ...prev,
      carriedBooks: 0,
      health: 3,
      hasWon: false,
      isDead: false,
      score: 0,
    }));
  }, [level]);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const s = gameStateRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        s.keys.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        s.keys.right = true;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!s.keys.jump) {
          // If on ground, trigger jump sound
          if (s.player.isGrounded) {
            sound.playJump();
          }
        }
        s.keys.jump = true;
      }
      if (e.code === 'KeyE' || e.code === 'KeyF') {
        s.keys.interact = true;
        // Check near bookmark
        const nearBm = s.bookmarkBridges.find((b) => {
          const dist = Math.hypot(s.player.x + 16 - b.nodeX, s.player.y + 24 - b.nodeY);
          return dist < 80;
        });
        if (nearBm && !nearBm.isUnfolded) {
          unfoldBridge(nearBm.id);
        }
      }
      if (e.code === 'KeyR') {
        resetLevel();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const s = gameStateRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') s.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') s.keys.right = false;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        s.keys.jump = false;
        sound.stopGlider();
      }
      if (e.code === 'KeyE' || e.code === 'KeyF') s.keys.interact = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [unfoldBridge, resetLevel]);

  // Main Canvas Loop
  useEffect(() => {
    // Preload high-fidelity 2D/3D sprites and panoramic backdrop
    assetManager.loadAll();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05); // cap delta
      lastTime = currentTime;

      const s = gameStateRef.current;

      if (!s.isPaused && !s.hasWon && !s.isDead) {
        s.elapsedTime += dt;

        // 1. Horizontal Movement
        const speedBonus = unlockedPerks.speedBoost ? 1.15 : 1.0;
        const maxSpeed = 5.2 * speedBonus;
        const accel = 22 * speedBonus;
        const friction = s.player.isGrounded ? 0.8 : 0.94;

        if (s.keys.left) {
          s.player.vx = Math.max(s.player.vx - accel * dt, -maxSpeed);
          s.player.facing = 'left';
          s.player.runFrame += dt * 10;
        } else if (s.keys.right) {
          s.player.vx = Math.min(s.player.vx + accel * dt, maxSpeed);
          s.player.facing = 'right';
          s.player.runFrame += dt * 10;
        } else {
          s.player.vx *= friction;
          if (Math.abs(s.player.vx) < 0.1) s.player.vx = 0;
        }

        // 2. Jumping & Hardcover Glider Flutter Mechanics
        // Gravity
        const gravity = 20.0;
        const jumpForce = -9.2;

        if (s.keys.jump) {
          if (s.player.isGrounded) {
            s.player.vy = jumpForce;
            s.player.isGrounded = false;
            createParticles(s.player.x + 16, s.player.y + 48, 6, '#e2e8f0', 'circle', 2);
          } else if (s.player.vy > 0 && s.player.carriedBooks > 0) {
            // Hardcover Glider Flutter Active!
            s.player.isGliding = true;
            // Float down smoothly
            s.player.vy = Math.min(s.player.vy, 1.8);
            sound.playGliderFlutter(true);

            // Spawn glider foil sparkles
            if (Math.random() < 0.3) {
              createParticles(
                s.player.x + (s.player.facing === 'right' ? -6 : 38),
                s.player.y + 12,
                1,
                unlockedPerks.masterSpire ? '#fbbf24' : '#fef08a',
                'sparkle',
                1.5
              );
            }
          }
        } else {
          s.player.isGliding = false;
          sound.stopGlider();
        }

        // Apply gravity if not in upward boost
        if (!s.player.isGliding) {
          s.player.vy += gravity * dt;
        } else {
          s.player.vy += gravity * 0.15 * dt;
        }

        // 3. Chimney Thermals (Warm Air Updrafts)
        let inThermal = false;
        s.chimneys.forEach((ch) => {
          const px = s.player.x + 16;
          const py = s.player.y + 24;
          const thermalTop = ch.y - ch.height;
          const thermalLeft = ch.x;
          const thermalRight = ch.x + ch.width;

          if (px >= thermalLeft && px <= thermalRight && py >= thermalTop && py <= ch.y) {
            inThermal = true;
            const boost = unlockedPerks.thermalGliderBoost ? 1.3 : 1.0;
            const force = ch.updraftForce * boost;
            s.player.vy = Math.min(s.player.vy, force);
            s.player.isGrounded = false;

            if (Math.random() < 0.4) {
              sound.playThermalUpdraft();
              createParticles(px, py, 2, '#fdba74', 'sparkle', 3);
            }
          }

          // Ambient chimney thermal particles
          if (Math.random() < 0.25) {
            s.particles.push({
              x: ch.x + Math.random() * ch.width,
              y: ch.y - Math.random() * 20,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -(Math.random() * 3 + 2.5),
              size: Math.random() * 3 + 2,
              color: Math.random() < 0.6 ? '#fed7aa' : '#fb923c',
              life: 1,
              maxLife: 1.2,
              shape: 'circle',
            });
          }
        });

        // 4. Accordion-Folded Bounce Pads (Quill Leap)
        s.bouncePads.forEach((bp) => {
          if (bp.compression > 0) {
            bp.compression = Math.max(0, bp.compression - dt * 3);
          }

          const px = s.player.x;
          const py = s.player.y;
          const pw = s.player.width;
          const ph = s.player.height;

          // Check if player lands on bounce pad
          if (
            px + pw > bp.x &&
            px < bp.x + bp.width &&
            py + ph >= bp.y &&
            py + ph <= bp.y + bp.height + 12 &&
            s.player.vy > 0
          ) {
            bp.compression = 1.0;
            const boost = unlockedPerks.quillLeapBoost ? 1.3 : 1.0;
            s.player.vy = -16.5 * boost;
            s.player.isGrounded = false;
            sound.playAccordionBounce();
            createParticles(bp.x + bp.width / 2, bp.y, 16, '#38bdf8', 'square', 4);
          }
        });

        // 5. Bookmark Bridges (4-second crease timer)
        s.bookmarkBridges.forEach((bm) => {
          if (bm.isUnfolded) {
            const prevTimer = bm.creaseTimer;
            bm.creaseTimer -= dt;

            // Audible warning tick in the final 1.5 seconds
            if (bm.creaseTimer < 1.5 && Math.floor(prevTimer * 3) !== Math.floor(bm.creaseTimer * 3)) {
              sound.playCreaseTick();
            }

            if (bm.creaseTimer <= 0) {
              bm.isUnfolded = false;
              bm.creaseTimer = 0;
              sound.playBridgeCollapse();
              createParticles(bm.bridgeX + bm.bridgeWidth / 2, bm.bridgeY, 12, '#94a3b8', 'square', 2.5);
            }
          }
        });

        // 6. Integrate Position & Platform Collisions
        s.player.x += s.player.vx;
        s.player.y += s.player.vy;

        // Clamp to world horizontal
        if (s.player.x < 0) s.player.x = 0;

        // Build list of active solid colliders (Platforms + Unfolded Bridges)
        const colliders: { x: number; y: number; width: number; height: number; type: string }[] = [
          ...s.platforms,
          ...s.bookmarkBridges
            .filter((b) => b.isUnfolded)
            .map((b) => ({
              x: b.bridgeX,
              y: b.bridgeY,
              width: b.bridgeWidth,
              height: b.bridgeHeight,
              type: 'bridge',
            })),
        ];

        let groundedThisFrame = false;

        colliders.forEach((c) => {
          const px = s.player.x;
          const py = s.player.y;
          const pw = s.player.width;
          const ph = s.player.height;

          // AABB check
          if (px + pw > c.x && px < c.x + c.width && py + ph > c.y && py < c.y + c.height) {
            // Landing on top
            const prevY = py - s.player.vy;
            if (prevY + ph <= c.y + 12 && s.player.vy >= 0) {
              s.player.y = c.y - ph;
              s.player.vy = 0;
              groundedThisFrame = true;
              s.player.isGliding = false;
            } else if (py < c.y + c.height && py + ph > c.y + c.height && s.player.vy < 0) {
              // Hitting head
              s.player.y = c.y + c.height;
              s.player.vy = 0;
            } else if (s.player.vx > 0 && px + pw >= c.x && px < c.x) {
              // Right collision
              s.player.x = c.x - pw;
              s.player.vx = 0;
            } else if (s.player.vx < 0 && px <= c.x + c.width && px + pw > c.x + c.width) {
              // Left collision
              s.player.x = c.x + c.width;
              s.player.vx = 0;
            }
          }
        });

        s.player.isGrounded = groundedThisFrame;
        if (groundedThisFrame && s.player.isGliding) {
          s.player.isGliding = false;
          sound.stopGlider();
        }

        // Pit death check
        if (s.player.y > level.worldHeight + 50) {
          s.isDead = true;
          sound.playHurt();
        }

        // Invincible timer
        if (s.player.invincibleTimer > 0) {
          s.player.invincibleTimer -= dt;
        }

        // 7. Golden Books Collection
        s.books.forEach((book) => {
          if (!book.collected) {
            const bx = book.x + 12;
            const by = book.y + Math.sin(s.elapsedTime * 3 + book.bobOffset) * 6 + 12;
            const dist = Math.hypot(s.player.x + 16 - bx, s.player.y + 24 - by);

            if (dist < 32) {
              book.collected = true;
              s.player.carriedBooks += 1;
              const points = (book.isSecret ? 300 : 150) * (unlockedPerks.masterSpire ? 2 : 1);
              s.score += points;
              sound.playBookPickup();
              createParticles(bx, by, 18, '#fbbf24', 'sparkle', 3.5);
            }
          }
        });

        // 8. Patrolling Pests & Harmless Glider Bounce!
        // PDF Rule: "Gliding directly into patrolling pests bounces the player harmlessly backward without taking damage."
        s.pests.forEach((pest) => {
          pest.x += pest.vx;
          if (pest.x <= pest.minX || pest.x + pest.width >= pest.maxX) {
            pest.vx = -pest.vx;
          }

          if (pest.bumpTimer > 0) {
            pest.bumpTimer -= dt;
          }

          const px = s.player.x;
          const py = s.player.y;
          const pw = s.player.width;
          const ph = s.player.height;

          if (
            px + pw > pest.x &&
            px < pest.x + pest.width &&
            py + ph > pest.y &&
            py < pest.y + pest.height
          ) {
            if (s.player.isGliding) {
              // Harmless bounce backward!
              sound.playPestGliderBounce();
              s.player.vx = s.player.facing === 'right' ? -6 : 6;
              s.player.vy = -6;
              s.player.invincibleTimer = 0.5;
              createParticles(pest.x + pest.width / 2, pest.y + pest.height / 2, 14, '#38bdf8', 'square', 4);
            } else if (s.player.invincibleTimer <= 0) {
              // Took damage on foot!
              s.player.health -= 1;
              s.player.invincibleTimer = 1.2;
              s.player.vx = s.player.facing === 'right' ? -5 : 5;
              s.player.vy = -5;
              sound.playHurt();
              createParticles(px + 16, py + 24, 12, '#ef4444', 'square', 3);

              // Drop 1 carried book if carrying any
              if (s.player.carriedBooks > 0) {
                s.player.carriedBooks -= 1;
                // Respawn a book nearby
                s.books.push({
                  id: 'dropped_' + Date.now(),
                  x: px + (Math.random() - 0.5) * 60,
                  y: py - 40,
                  collected: false,
                  bobOffset: Math.random() * 2,
                });
              }

              if (s.player.health <= 0) {
                s.isDead = true;
              }
            }
          }
        });

        // 9. Flagpole Victory Check
        const fx = level.flag.x;
        const fy = level.flag.y;
        if (s.player.x + s.player.width >= fx && s.player.y + s.player.height >= fy - level.flag.height) {
          s.hasWon = true;
          sound.playLevelVictory();
          createParticles(fx + 20, fy - 60, 40, '#f59e0b', 'sparkle', 6);
          createParticles(fx + 20, fy - 60, 30, '#38bdf8', 'square', 5);

          // Calculate stars
          const collectedCount = s.books.filter((b) => b.collected).length;
          let starsEarned = 1;
          if (collectedCount >= level.requiredBooksFor3Star) starsEarned = 2;
          if (collectedCount >= level.requiredBooksFor3Star && s.elapsedTime <= level.targetTime) {
            starsEarned = 3;
          }

          setTimeout(() => {
            onLevelComplete({
              time: Math.round(s.elapsedTime),
              booksCollected: collectedCount,
              totalBooks: s.books.length,
              stars: starsEarned,
            });
          }, 1400);
        }

        // 10. Update Particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= dt / p.maxLife;
          if (p.rotation !== undefined && p.vRot) p.rotation += p.vRot;
          if (p.life <= 0) {
            s.particles.splice(i, 1);
          }
        }

        // 11. Find Nearest Bookmark Bridge for HUD button
        const nearBm = s.bookmarkBridges.find((b) => {
          const dist = Math.hypot(s.player.x + 16 - b.nodeX, s.player.y + 24 - b.nodeY);
          return dist < 95;
        });
        setActiveBookmarkNear(nearBm || null);

        // Dynamically modulate paper rustle soundscape intensity based on player gliding / running
        sound.setGameplayActivity(s.player.isGliding, Math.abs(s.player.vx) > 0.2);

        // Update stats for React HUD
        setGameStats({
          carriedBooks: s.player.carriedBooks,
          health: s.player.health,
          maxHealth: s.player.maxHealth,
          time: Math.floor(s.elapsedTime),
          isGliding: s.player.isGliding,
          canGlide: s.player.carriedBooks > 0 && !s.player.isGrounded,
          score: s.score,
          hasWon: s.hasWon,
          isDead: s.isDead,
        });
      }

      // Smooth Camera Follow
      const targetCamX = s.player.x - canvas.width * 0.35;
      const targetCamY = s.player.y - canvas.height * 0.55;
      s.cameraX += (targetCamX - s.cameraX) * 0.1;
      s.cameraY += (targetCamY - s.cameraY) * 0.08;

      // Clamp camera
      s.cameraX = Math.max(0, Math.min(s.cameraX, level.worldWidth - canvas.width));
      s.cameraY = Math.max(0, Math.min(s.cameraY, level.worldHeight - canvas.height));

      // RENDER PIPELINE: Tactile Storybook Diorama
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const assets = assetManager.getAssets();

      // A. Panoramic Diorama Backdrop with Real 3D Atmosphere
      if (assets.backdropImg) {
        const bgImg = assets.backdropImg;
        const bgRatio = bgImg.width / bgImg.height;
        const bgH = canvas.height;
        const bgW = bgH * bgRatio;

        // Subtle 3D parallax scroll (moves at 0.2x speed for distant mountains & village)
        const pX = -((s.cameraX * 0.2) % bgW);

        ctx.drawImage(bgImg, pX, 0, bgW, bgH);
        if (pX + bgW < canvas.width) {
          ctx.drawImage(bgImg, pX + bgW, 0, bgW, bgH);
        }
        if (pX > 0) {
          ctx.drawImage(bgImg, pX - bgW, 0, bgW, bgH);
        }

        // Soft sunny atmospheric illumination scrim
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Fallback Sky Cerulean & Papercraft Clouds Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, '#7dd3fc');
        skyGrad.addColorStop(0.7, '#bae6fd');
        skyGrad.addColorStop(1, '#f0fdf4');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Parallax Distant Layer: Cardboard Mountain Ridges
        ctx.save();
        const pOffset = s.cameraX * 0.2;
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.moveTo(-100, canvas.height);
        for (let x = -100; x < canvas.width + 100; x += 180) {
          const hillH = 140 + Math.sin((x + pOffset) * 0.005) * 45;
          ctx.lineTo(x, canvas.height - hillH);
        }
        ctx.lineTo(canvas.width + 100, canvas.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Midground Parallax: Soft Village Rooftops & Chimneys
        ctx.save();
        const midOffset = s.cameraX * 0.45;
        ctx.fillStyle = '#bbf7d0';
        ctx.beginPath();
        ctx.moveTo(-50, canvas.height);
        for (let x = -50; x < canvas.width + 50; x += 130) {
          const h = 90 + Math.sin((x + midOffset) * 0.008) * 35;
          ctx.lineTo(x, canvas.height - h);
        }
        ctx.lineTo(canvas.width + 50, canvas.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // World Transform
      ctx.save();
      ctx.translate(-Math.round(s.cameraX), -Math.round(s.cameraY));

      // B. Render Chimneys & Warm Thermal Updraft Columns
      s.chimneys.forEach((ch) => {
        // Updraft Column with wavy shimmer
        const grad = ctx.createLinearGradient(0, ch.y, 0, ch.y - ch.height);
        grad.addColorStop(0, 'rgba(254, 215, 170, 0.45)');
        grad.addColorStop(0.6, 'rgba(253, 186, 116, 0.2)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

        ctx.fillStyle = grad;
        ctx.fillRect(ch.x, ch.y - ch.height, ch.width, ch.height);

        // Rising thermal wind streaks
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        for (let ox = 15; ox < ch.width; ox += 25) {
          const shift = (s.elapsedTime * 80) % ch.height;
          ctx.beginPath();
          ctx.moveTo(ch.x + ox, ch.y);
          ctx.lineTo(ch.x + ox, Math.max(ch.y - ch.height, ch.y - shift));
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Brick Chimney Base (Tactile cardboard cutout)
        const bx = ch.x + (ch.width - ch.chimneyWidth) / 2;
        const by = ch.y;

        // Shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
        ctx.fillRect(bx + 4, by + 4, ch.chimneyWidth, ch.chimneyHeight);

        // Brick body
        ctx.fillStyle = '#b45309';
        ctx.fillRect(bx, by, ch.chimneyWidth, ch.chimneyHeight);

        // Rim
        ctx.fillStyle = '#d97706';
        ctx.fillRect(bx - 4, by - 6, ch.chimneyWidth + 8, 8);

        // Chimney flue label
        ctx.fillStyle = '#fef3c7';
        ctx.font = '10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('THERMAL', bx + 3, by + 28);
      });

      // C. Render Platforms (Cardstock, Wood, Clover)
      s.platforms.forEach((p) => {
        // 3D Cardboard Bevel Shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
        ctx.beginPath();
        ctx.roundRect(p.x + 5, p.y + 6, p.width, p.height, 6);
        ctx.fill();

        // Platform Core Material
        if (p.type === 'clover') {
          // Lush green top
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.width, p.height, 6);
          ctx.fill();

          // Grass rim blade pattern
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(p.x, p.y, p.width, 10);

          // Cardboard soil bevel
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(p.x, p.y + p.height - 8, p.width, 8);
        } else if (p.type === 'wood') {
          // Clothbound book shelf
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.width, p.height, 4);
          ctx.fill();

          ctx.fillStyle = '#92400e';
          ctx.fillRect(p.x, p.y, p.width, 8);

          // Gilded edge
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(p.x, p.y + 7, p.width, 2);
        } else if (p.type === 'stone') {
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.width, p.height, 6);
          ctx.fill();

          ctx.fillStyle = '#64748b';
          ctx.fillRect(p.x, p.y, p.width, 8);
        } else {
          // Pressed craft cardboard
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.width, p.height, 6);
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(p.x, p.y, p.width, 8);
        }

        // Visible Creased Fold Line (Papercraft identity)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x + 4, p.y + 4);
        ctx.lineTo(p.x + p.width - 4, p.y + 4);
        ctx.stroke();

        // Optional Shelf Label
        if (p.label) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(p.label, p.x + 12, p.y + 24);
        }
      });

      // D. Render Accordion-Folded Bounce Pads
      s.bouncePads.forEach((bp) => {
        const comp = bp.compression; // 0 (extended) to 1 (compressed)
        const currentH = bp.springHeight * (1 - comp * 0.6);
        const yTop = bp.y - currentH;

        // Base plate
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(bp.x - 4, bp.y + bp.height - 4, bp.width + 8, 6);

        // Accordion Origami Bellows (Zig-zag folds)
        ctx.fillStyle = comp > 0.5 ? '#38bdf8' : '#7dd3fc';
        ctx.strokeStyle = '#0369a1';
        ctx.lineWidth = 2;

        ctx.beginPath();
        const folds = 4;
        const stepY = currentH / folds;
        ctx.moveTo(bp.x, bp.y);

        for (let i = 0; i <= folds; i++) {
          const fy = bp.y - i * stepY;
          const fx = i % 2 === 0 ? bp.x : bp.x + bp.width;
          ctx.lineTo(fx, fy);
        }
        ctx.stroke();

        // Top Launch Cap (Quill Pad)
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(bp.x - 2, yTop - 6, bp.width + 4, 8, 3);
        ctx.fill();

        // Spring indicator icon / quill marker
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('▲ BOUNCE ▲', bp.x + 3, yTop);
      });

      // E. Render Pop-Up Page Bridges & Bookmark Nodes
      s.bookmarkBridges.forEach((bm) => {
        // Dormant / Active Bookmark Node
        const isNear = activeBookmarkNear?.id === bm.id;

        // Glow ring if near
        if (isNear) {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.beginPath();
          ctx.arc(bm.nodeX, bm.nodeY, bm.nodeRadius + 10, 0, Math.PI * 2);
          ctx.fill();
        }

        // Bookmark Ribbon Cutout
        ctx.fillStyle = bm.isUnfolded ? '#10b981' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(bm.nodeX, bm.nodeY, bm.nodeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bm.isUnfolded ? '✓' : '★', bm.nodeX, bm.nodeY);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';

        // Bridge itself
        if (bm.isUnfolded) {
          // Unfolded pop-up 3D papercraft bridge
          ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
          ctx.fillRect(bm.bridgeX + 4, bm.bridgeY + 4, bm.bridgeWidth, bm.bridgeHeight);

          // Cardstock bridge plank
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(bm.bridgeX, bm.bridgeY, bm.bridgeWidth, bm.bridgeHeight);

          // Fold crease stripes
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.5;
          for (let bx = bm.bridgeX + 20; bx < bm.bridgeX + bm.bridgeWidth; bx += 25) {
            ctx.beginPath();
            ctx.moveTo(bx, bm.bridgeY);
            ctx.lineTo(bx, bm.bridgeY + bm.bridgeHeight);
            ctx.stroke();
          }

          // 4-Second Crease Timer Bar
          const progress = bm.creaseTimer / bm.maxTimer;
          const barW = bm.bridgeWidth * progress;

          ctx.fillStyle = progress < 0.35 ? '#ef4444' : '#10b981';
          ctx.fillRect(bm.bridgeX, bm.bridgeY - 6, barW, 4);

          // Timer label
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(`FOLD IN ${bm.creaseTimer.toFixed(1)}s`, bm.bridgeX + 4, bm.bridgeY - 10);
        } else {
          // Ghost outline of dormant bridge
          ctx.strokeStyle = 'rgba(202, 138, 4, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(bm.bridgeX, bm.bridgeY, bm.bridgeWidth, bm.bridgeHeight);
          ctx.setLineDash([]);
        }
      });

      // F. Render Golden Books (Rescued Treasures)
      s.books.forEach((book) => {
        if (!book.collected) {
          const bx = book.x;
          const by = book.y + Math.sin(s.elapsedTime * 3 + book.bobOffset) * 6;

          // Glowing Aura
          ctx.fillStyle = book.isSecret ? 'rgba(245, 158, 11, 0.45)' : 'rgba(250, 204, 21, 0.35)';
          ctx.beginPath();
          ctx.arc(bx + 14, by + 16, 22, 0, Math.PI * 2);
          ctx.fill();

          if (assets.goldenBookCanvas) {
            // Draw real high-fidelity 3D Golden Book sprite
            const bookSize = 38;
            ctx.save();
            ctx.translate(bx + 14, by + 16);
            ctx.rotate(Math.sin(s.elapsedTime * 2.5 + book.bobOffset) * 0.08);
            ctx.drawImage(
              assets.goldenBookCanvas,
              -bookSize / 2,
              -bookSize / 2,
              bookSize,
              bookSize
            );
            ctx.restore();
          } else {
            // Gilded Hardcover Book fallback
            ctx.fillStyle = book.isSecret ? '#b45309' : '#d97706';
            ctx.beginPath();
            ctx.roundRect(bx, by, 28, 34, 4);
            ctx.fill();

            // Radiant Golden Spine & Pages
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(bx + 5, by + 4, 18, 26);

            // Gold Foil Emblem
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(bx + 14, by + 17, 5, 0, Math.PI * 2);
            ctx.fill();
          }

          if (book.isSecret) {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
            ctx.fillText('★', bx + 9, by + 3);
          }
        }
      });

      // G. Render Patrolling Pests
      s.pests.forEach((pest) => {
        // Shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
        ctx.beginPath();
        ctx.ellipse(pest.x + pest.width / 2, pest.y + pest.height, pest.width / 2 + 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (pest.type === 'bookworm' && assets.bookwormCanvas) {
          // Render real 3D-styled bookworm creature sprite with squish/stretch!
          ctx.save();
          const cx = pest.x + pest.width / 2;
          const cy = pest.y + pest.height / 2;
          ctx.translate(cx, cy);

          // Facing direction
          if (pest.vx < 0) {
            ctx.scale(-1, 1);
          }

          // Inchworm crawl squish/stretch
          const squish = 1 + Math.sin(s.elapsedTime * 10) * 0.12;
          const stretch = 1 - Math.sin(s.elapsedTime * 10) * 0.08;
          ctx.scale(squish, stretch);

          const spriteW = 48;
          const spriteH = 36;
          ctx.drawImage(assets.bookwormCanvas, -spriteW / 2, -spriteH / 2, spriteW, spriteH);
          ctx.restore();
        } else if (pest.type === 'bookworm') {
          // Segmented cute papercraft worm fallback
          const segments = 3;
          const segW = pest.width / segments;
          for (let i = 0; i < segments; i++) {
            ctx.fillStyle = i === 0 ? '#4d7c0f' : '#65a30d';
            const sx = pest.x + i * segW;
            const sy = pest.y + Math.sin(s.elapsedTime * 8 + i) * 3;
            ctx.beginPath();
            ctx.arc(sx + segW / 2, sy + pest.height / 2, segW / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          // Tiny eyes
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(pest.vx > 0 ? pest.x + pest.width - 6 : pest.x + 6, pest.y + 8, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(pest.vx > 0 ? pest.x + pest.width - 5 : pest.x + 5, pest.y + 8, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (pest.type === 'inkblob') {
          // Quivering ink drop
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.ellipse(
            pest.x + pest.width / 2,
            pest.y + pest.height / 2,
            pest.width / 2,
            pest.height / 2,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          // Ink gloss
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(pest.x + pest.width / 3, pest.y + pest.height / 3, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Silverfish cutout
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(pest.vx > 0 ? pest.x + pest.width : pest.x, pest.y + pest.height / 2);
          ctx.lineTo(pest.vx > 0 ? pest.x : pest.x + pest.width, pest.y);
          ctx.lineTo(pest.vx > 0 ? pest.x : pest.x + pest.width, pest.y + pest.height);
          ctx.closePath();
          ctx.fill();
        }
      });

      // H. Render Goal Flagpole (3-Star Banner)
      const fx = level.flag.x;
      const fy = level.flag.y;
      const fh = level.flag.height;

      // Wooden flagpole
      ctx.fillStyle = '#78350f';
      ctx.fillRect(fx, fy - fh, 6, fh);

      // Gold sphere finial
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(fx + 3, fy - fh, 8, 0, Math.PI * 2);
      ctx.fill();

      // Fluttering Papercraft Banner
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      const wave = Math.sin(s.elapsedTime * 4) * 6;
      ctx.moveTo(fx + 6, fy - fh);
      ctx.quadraticCurveTo(fx + 35, fy - fh + 15 + wave, fx + 65, fy - fh + 10);
      ctx.lineTo(fx + 65, fy - fh + 38);
      ctx.quadraticCurveTo(fx + 35, fy - fh + 45 + wave, fx + 6, fy - fh + 32);
      ctx.closePath();
      ctx.fill();

      // Stars on Banner
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('★ 3-STAR', fx + 12, fy - fh + 24);

      // I. Render Paige, the Apprentice Binder! (Realistic 2D/3D Diorama Character)
      const px = s.player.x;
      const py = s.player.y;
      const pw = s.player.width;
      const ph = s.player.height;

      // Soft ambient contact shadow under Paige
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, py + ph - 2, pw / 2 + 5, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      if (s.player.invincibleTimer > 0 && Math.floor(s.elapsedTime * 20) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      const centerX = px + pw / 2;
      const centerY = py + ph / 2;

      if (s.player.isGliding && assets.paigeGlideCanvas) {
        // High-Fidelity 3D Paige Glider Sprite with Gilded Hardcover Wings!
        ctx.save();
        ctx.translate(centerX, centerY - 2);

        // Directional flip (Sprite faces right by default)
        if (s.player.facing === 'left') {
          ctx.scale(-1, 1);
        }

        // Glider wind turbulence flutter tilt
        const flutterTilt = Math.sin(s.elapsedTime * 14) * 0.08;
        ctx.rotate(flutterTilt);

        // Golden aura glow behind wings
        ctx.fillStyle = unlockedPerks.masterSpire ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.35)';
        ctx.beginPath();
        ctx.arc(0, -6, 32, 0, Math.PI * 2);
        ctx.fill();

        // Render high-res sprite
        const spriteSize = 76;
        ctx.drawImage(assets.paigeGlideCanvas, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);

        ctx.restore();
      } else if (assets.paigeRunCanvas) {
        // High-Fidelity 3D Paige Running & Jumping Sprite!
        ctx.save();
        ctx.translate(centerX, centerY);

        // Directional flip (Sprite faces right by default)
        if (s.player.facing === 'left') {
          ctx.scale(-1, 1);
        }

        // Running speed tilt and step bounce
        const isMoving = Math.abs(s.player.vx) > 0.2;
        const walkBob = s.player.isGrounded && isMoving ? Math.sin(s.player.runFrame * 1.2) * 2.5 : 0;
        const forwardTilt = isMoving ? (s.player.vx > 0 ? 0.06 : -0.06) : 0;

        ctx.translate(0, walkBob);
        ctx.rotate(forwardTilt);

        // In-air slight vertical stretch
        if (!s.player.isGrounded) {
          ctx.scale(0.96, 1.04);
        }

        const spriteW = 60;
        const spriteH = 64;
        ctx.drawImage(assets.paigeRunCanvas, -spriteW / 2, -spriteH / 2, spriteW, spriteH);

        // Floating Carried Golden Books Stack
        if (s.player.carriedBooks > 0) {
          const stackCount = Math.min(s.player.carriedBooks, 3);
          for (let i = 0; i < stackCount; i++) {
            const bookOffset = (i + 1) * 7;
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-spriteW / 2 - 4, -12 + bookOffset, 8, 5);
          }
        }

        ctx.restore();
      } else {
        // Fallback stylized papercraft outfit
        // Hardcover Glider Flutter Wings (When Gliding!)
        if (s.player.isGliding) {
          ctx.fillStyle = unlockedPerks.masterSpire ? '#f59e0b' : '#3b82f6';
          ctx.beginPath();
          ctx.roundRect(px - 18, py - 14, 28, 12, 3);
          ctx.roundRect(px + pw - 10, py - 14, 28, 12, 3);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.fillRect(px - 14, py - 8, 22, 4);
          ctx.fillRect(px + pw - 6, py - 8, 22, 4);

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px - 16, py - 2);
          ctx.lineTo(px - 26, py + 12);
          ctx.moveTo(px + pw + 16, py - 2);
          ctx.lineTo(px + pw + 26, py + 12);
          ctx.stroke();
        }

        const legWalk = s.player.isGrounded ? Math.sin(s.player.runFrame) * 6 : 2;

        ctx.fillStyle = '#854d0e';
        ctx.fillRect(px + 4 + legWalk, py + ph - 10, 8, 10);
        ctx.fillRect(px + pw - 12 - legWalk, py + ph - 10, 8, 10);

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(px + 4, py + 16, pw - 8, 24, 4);
        ctx.fill();

        ctx.fillStyle = '#9a3412';
        ctx.fillRect(px + (s.player.facing === 'right' ? 6 : pw - 14), py + 22, 9, 12);

        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + 11, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + 8, 11, Math.PI, Math.PI * 2);
        ctx.fill();

        const eyeX = s.player.facing === 'right' ? px + pw / 2 + 3 : px + pw / 2 - 5;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(eyeX, py + 11, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(px + pw / 2 - 2, py + 2);
        ctx.lineTo(px + pw / 2 + (s.player.facing === 'right' ? 8 : -8), py - 8);
        ctx.lineTo(px + pw / 2, py - 4);
        ctx.closePath();
        ctx.fill();

        if (s.player.carriedBooks > 0) {
          const stackCount = Math.min(s.player.carriedBooks, 3);
          for (let i = 0; i < stackCount; i++) {
            const bookOffset = (i + 1) * 7;
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(px + (s.player.facing === 'right' ? -10 : pw + 2), py + 14 + bookOffset, 8, 5);
          }
        }
      }

      ctx.restore();

      // J. Render Particles
      s.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;

        if (p.shape === 'square') {
          ctx.translate(p.x, p.y);
          if (p.rotation) ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === 'sparkle') {
          ctx.translate(p.x, p.y);
          if (p.rotation) ctx.rotate(p.rotation);
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.4, -p.size * 0.4);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(p.size * 0.4, p.size * 0.4);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.4, p.size * 0.4);
          ctx.lineTo(-p.size, 0);
          ctx.lineTo(-p.size * 0.4, -p.size * 0.4);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      ctx.restore(); // Restore world transform

      // Dynamic Weather Overlay System (Level Theme: Confetti, Hearth Embers, Ink Squall, Gold Blizzard)
      weatherEngineRef.current.update(dt, s.elapsedTime);
      weatherEngineRef.current.render(ctx, s.elapsedTime);

      // Request Next Frame
      s.animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameStateRef.current.animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(gameStateRef.current.animationFrameId);
      sound.stopGlider();
    };
  }, [level, unlockedPerks, onLevelComplete, activeBookmarkNear]);

  // Touch button handlers
  const handleTouchStartLeft = () => {
    gameStateRef.current.keys.left = true;
  };
  const handleTouchEndLeft = () => {
    gameStateRef.current.keys.left = false;
  };
  const handleTouchStartRight = () => {
    gameStateRef.current.keys.right = true;
  };
  const handleTouchEndRight = () => {
    gameStateRef.current.keys.right = false;
  };
  const handleTouchStartJump = () => {
    const s = gameStateRef.current;
    if (s.player.isGrounded) sound.playJump();
    s.keys.jump = true;
  };
  const handleTouchEndJump = () => {
    gameStateRef.current.keys.jump = false;
    sound.stopGlider();
  };
  const handleTouchBridge = () => {
    if (activeBookmarkNear && !activeBookmarkNear.isUnfolded) {
      unfoldBridge(activeBookmarkNear.id);
    }
  };

  const weatherInfo = (() => {
    switch (level.weather) {
      case 'CONFETTI_BREEZE':
        return { icon: '🎉', label: 'Paper Confetti Breeze' };
      case 'HEARTH_EMBER_MOTES':
        return { icon: '♨️', label: 'Thermal Hearth Embers' };
      case 'INK_SQUALL':
        return { icon: '🌧️', label: 'Ink Splatter Squall' };
      case 'GALE_GOLD_BLIZZARD':
        return { icon: '⭐', label: 'Gilded Foil Blizzard' };
      default:
        return { icon: '☁️', label: 'Papercraft Breeze' };
    }
  })();

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 select-none overflow-hidden touch-none">
      {/* Top HUD Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 md:px-5 py-2.5 bg-slate-900/85 backdrop-blur-md border-b border-slate-700/60 text-white">
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={onExitToVillage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors cursor-pointer"
            title="Return to EduLand Village"
          >
            <Home className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Village</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
            <span className="font-bold text-amber-300">{level.zone}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[180px]">{level.title}</span>
          </div>

          {/* Dynamic Weather Theme Indicator */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 rounded-lg text-slate-200 text-xs font-medium"
            title={`Active Level Atmosphere: ${weatherInfo.label}`}
          >
            <span>{weatherInfo.icon}</span>
            <span className="hidden lg:inline text-[11px]">{weatherInfo.label}</span>
          </div>
        </div>

        {/* Meters: Golden Books, Health, Glider, Timer */}
        <div className="flex items-center gap-2 md:gap-3.5 text-xs font-semibold">
          {/* Carried Golden Books */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="tabular-nums font-bold text-sm">{gameStats.carriedBooks}</span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-wide opacity-80">Carried</span>
          </div>

          {/* Glider Flutter Status Indicator */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              gameStats.carriedBooks > 0
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                : 'bg-slate-800/40 border-slate-700 text-slate-500'
            }`}
          >
            <Wind className={`w-3.5 h-3.5 ${gameStats.isGliding ? 'animate-bounce text-sky-400' : ''}`} />
            <span className="text-[11px]">
              {gameStats.isGliding
                ? 'Gliding Flutter'
                : gameStats.carriedBooks > 0
                ? 'Glider Ready'
                : 'Need 1 Book'}
            </span>
          </div>

          {/* Hearts / Health */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: gameStats.maxHealth }).map((_, i) => (
              <span
                key={i}
                className={`text-sm md:text-base transition-transform ${
                  i < gameStats.health ? 'text-rose-500 scale-100' : 'text-slate-600 scale-90'
                }`}
              >
                ♥
              </span>
            ))}
          </div>

          {/* Time & Score */}
          <div className="text-right">
            <div className="text-xs text-slate-300 tabular-nums font-mono">{gameStats.time}s</div>
            <div className="text-[10px] text-amber-400 tabular-nums">{gameStats.score} pts</div>
          </div>

          {/* Controller Mode Toggle (Auto / On / Off) */}
          <button
            onClick={() => {
              setControllerMode((prev) => (prev === 'AUTO' ? 'ON' : prev === 'ON' ? 'OFF' : 'AUTO'));
              sound.playButton();
            }}
            className="hidden sm:flex items-center gap-1 px-2 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer text-xs"
            title="Switch Virtual Gamepad Mode (Auto / On / Off)"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] font-bold">{controllerMode}</span>
          </button>

          {/* Ambient Sound Controller & Reset */}
          <div className="flex items-center gap-1.5">
            <AmbientSoundController currentView="PLAYING" compact />

            <button
              onClick={resetLevel}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Restart Level"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Pop-Up Bridge Interaction Hint Notification Banner */}
      {activeBookmarkNear && !activeBookmarkNear.isUnfolded && (
        <div className="absolute top-14 md:top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-1.5 bg-amber-500/95 text-slate-950 font-bold text-xs rounded-full shadow-lg backdrop-blur-md animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Tap [E], Click node, or press BRIDGE button to unfold 4s paper bridge!</span>
        </div>
      )}

      {/* Main Canvas Area - Multi-Platform Responsive (PC, Laptop, Tablet, Mobile) */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none overscroll-none">
        <canvas
          ref={canvasRef}
          width={1024}
          height={576}
          className="w-full h-full max-w-full max-h-full object-contain bg-sky-200 cursor-crosshair select-none touch-none"
          onClick={(e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const clickWorldX = (e.clientX - rect.left) * scaleX + gameStateRef.current.cameraX;
            const clickWorldY = (e.clientY - rect.top) * scaleY + gameStateRef.current.cameraY;

            gameStateRef.current.bookmarkBridges.forEach((b) => {
              const dist = Math.hypot(clickWorldX - b.nodeX, clickWorldY - b.nodeY);
              if (dist < 45 && !b.isUnfolded) {
                unfoldBridge(b.id);
              }
            });
          }}
        />

        {/* Game Over Screen Overlay */}
        {gameStats.isDead && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm text-white p-6">
            <div className="text-4xl font-extrabold text-rose-500 mb-2">Creased Out!</div>
            <p className="text-slate-300 text-sm max-w-md text-center mb-6">
              Paige tumbled into the hazardous crags! Collect your books, fold your courage, and try again.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={resetLevel}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-lg transition-colors cursor-pointer shadow-lg"
              >
                Retry Level
              </button>
              <button
                onClick={onExitToVillage}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer border border-slate-700"
              >
                Return to Village
              </button>
            </div>
          </div>
        )}

        {/* Victory Screen Flash */}
        {gameStats.hasWon && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm text-white p-6 animate-fade-in">
            <div className="text-4xl font-black text-amber-400 mb-2">Goal Flag Reached!</div>
            <p className="text-emerald-300 font-semibold text-sm mb-4">
              Rescued {gameStats.carriedBooks} Golden Books for the Skyward Archive!
            </p>
            <div className="text-slate-300 text-xs">Returning to EduLand Hub...</div>
          </div>
        )}
      </div>

      {/* Universal Ergonomic Virtual Controller for Tablets (Large & Small), Mobile Phones & Touch Laptops */}
      <VirtualGamepad
        onLeftStart={handleTouchStartLeft}
        onLeftEnd={handleTouchEndLeft}
        onRightStart={handleTouchStartRight}
        onRightEnd={handleTouchEndRight}
        onJumpStart={handleTouchStartJump}
        onJumpEnd={handleTouchEndJump}
        onBridgeAction={handleTouchBridge}
        onReset={resetLevel}
        activeBookmarkNear={activeBookmarkNear}
        canGlide={gameStats.canGlide}
        isGliding={gameStats.isGliding}
        isTouchDevice={isTouchDevice}
        controllerMode={controllerMode}
        onToggleControllerMode={() => {
          setControllerMode((prev) => (prev === 'AUTO' ? 'ON' : prev === 'ON' ? 'OFF' : 'AUTO'));
          sound.playButton();
        }}
      />
    </div>
  );
};
