/**
 * Dynamic Weather Overlay System for EduLand Builder Jump
 * Reflects level themes:
 * - CONFETTI_BREEZE: Falling colorful origami paper confetti scraps & clover leaves (Level 1)
 * - HEARTH_EMBER_MOTES: Shimmering golden dust motes & warm floating chimney embers (Level 2)
 * - INK_SQUALL: Diagonal ink droplets, splash ripples & ink mist (Level 3)
 * - GALE_GOLD_BLIZZARD: High-altitude wind streaks, swirling gold leaf foil flakes & starlight sparkles (Level 4)
 */

import { WeatherType, WeatherParticle } from '../types/game';

export class WeatherEngine {
  private particles: WeatherParticle[] = [];
  private type: WeatherType = 'CONFETTI_BREEZE';
  private width: number = 1024;
  private height: number = 576;
  private splashRipples: { x: number; y: number; r: number; maxR: number; alpha: number }[] = [];

  constructor(type: WeatherType = 'CONFETTI_BREEZE') {
    this.type = type;
  }

  public setType(type: WeatherType, width = 1024, height = 576) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.initParticles();
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public initParticles() {
    this.particles = [];
    this.splashRipples = [];

    let count = 40;
    if (this.type === 'HEARTH_EMBER_MOTES') count = 48;
    if (this.type === 'INK_SQUALL') count = 55;
    if (this.type === 'GALE_GOLD_BLIZZARD') count = 65;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  private createParticle(randomY = false): WeatherParticle {
    const x = Math.random() * (this.width + 100) - 50;
    const y = randomY ? Math.random() * this.height : -20;
    const seed = Math.random() * 1000;

    switch (this.type) {
      case 'CONFETTI_BREEZE': {
        const colors = [
          '#38bdf8', // Azure paper
          '#fbbf24', // Warm gold parchment
          '#4ade80', // Clover green
          '#f472b6', // Pastel petal
          '#a78bfa', // Lavender cardstock
          '#fed7aa', // Cream paper
        ];
        const isLeaf = Math.random() < 0.2;
        return {
          x,
          y,
          vx: Math.random() * 0.8 + 0.4,
          vy: Math.random() * 1.5 + 1.2,
          size: isLeaf ? Math.random() * 4 + 7 : Math.random() * 5 + 5,
          color: isLeaf ? '#22c55e' : colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.4 + 0.6,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.08,
          shape: isLeaf ? 'leaf' : 'confetti',
          swaySpeed: Math.random() * 2 + 1.5,
          swayDist: Math.random() * 25 + 15,
          seed,
        };
      }

      case 'HEARTH_EMBER_MOTES': {
        const colors = ['#f59e0b', '#fbbf24', '#f97316', '#fde047', '#fed7aa'];
        const isSpark = Math.random() < 0.3;
        return {
          x,
          y: randomY ? Math.random() * this.height : this.height + 15,
          vx: (Math.random() - 0.5) * 0.7,
          vy: -(Math.random() * 1.4 + 0.8), // float upward like warm thermal embers
          size: isSpark ? Math.random() * 2 + 2 : Math.random() * 3 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.5 + 0.4,
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.04,
          shape: 'ember',
          swaySpeed: Math.random() * 1.8 + 1.0,
          swayDist: Math.random() * 18 + 10,
          seed,
        };
      }

      case 'INK_SQUALL': {
        const colors = ['#1e3a8a', '#1d4ed8', '#0284c7', '#312e81', '#38bdf8'];
        return {
          x,
          y,
          vx: -(Math.random() * 1.5 + 2.0), // slanted wind-blown ink rain
          vy: Math.random() * 4 + 6.0,
          size: Math.random() * 3 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.4 + 0.45,
          rotation: 0.35, // angle of slanted rain
          vRot: 0,
          shape: 'ink_drop',
          swaySpeed: 1,
          swayDist: 4,
          seed,
        };
      }

      case 'GALE_GOLD_BLIZZARD':
      default: {
        const colors = ['#fef08a', '#fbbf24', '#f59e0b', '#ffffff', '#e0f2fe'];
        return {
          x,
          y,
          vx: -(Math.random() * 3 + 4.5), // fast gale wind blowing leftwards
          vy: Math.random() * 2 + 2.2,
          size: Math.random() * 4 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: Math.random() * 0.4 + 0.55,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.15,
          shape: 'foil_flake',
          swaySpeed: Math.random() * 3 + 2,
          swayDist: Math.random() * 30 + 15,
          seed,
        };
      }
    }
  }

  public update(dt: number, time: number) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Natural sway
      const sway = Math.sin(time * p.swaySpeed + p.seed) * p.swayDist;

      p.x += (p.vx + (p.shape === 'confetti' || p.shape === 'leaf' ? Math.cos(time * p.swaySpeed) * 0.8 : 0)) * dt * 60;
      p.y += p.vy * dt * 60;
      p.rotation += p.vRot * dt * 60;

      // Ink droplets spawn ripples occasionally near bottom
      if (p.shape === 'ink_drop' && p.y > this.height - 35 && Math.random() < 0.15) {
        this.splashRipples.push({
          x: p.x,
          y: p.y,
          r: 2,
          maxR: Math.random() * 8 + 6,
          alpha: 0.6,
        });
      }

      // Recycle boundaries
      if (this.type === 'HEARTH_EMBER_MOTES') {
        if (p.y < -30 || p.x < -40 || p.x > this.width + 40) {
          this.particles[i] = this.createParticle(false);
          this.particles[i].y = this.height + 15;
        }
      } else {
        if (p.y > this.height + 30 || p.x < -60 || p.x > this.width + 60) {
          this.particles[i] = this.createParticle(false);
        }
      }
    }

    // Update splash ripples
    for (let i = this.splashRipples.length - 1; i >= 0; i--) {
      const rip = this.splashRipples[i];
      rip.r += dt * 25;
      rip.alpha -= dt * 1.5;
      if (rip.alpha <= 0) {
        this.splashRipples.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, time: number) {
    ctx.save();

    // 1. Render Weather Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.save();

      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      if (p.shape === 'confetti') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // 3D paper tumbling flip effect using scale
        const tumbleX = Math.cos(p.rotation * 1.5);
        ctx.scale(tumbleX, 1);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      } else if (p.shape === 'leaf') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        // Leaf center vein
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-p.size * 0.8, 0);
        ctx.lineTo(p.size * 0.8, 0);
        ctx.stroke();
      } else if (p.shape === 'ember') {
        // Glowing halo around hearth ember motes
        const pulse = Math.sin(time * 4 + p.seed) * 0.25 + 0.75;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2 * pulse);
        grad.addColorStop(0, p.color);
        grad.addColorStop(0.4, p.color);
        grad.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2 * pulse, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'ink_drop') {
        // Elongated slanted raindrop
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.6, p.size * 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'foil_flake') {
        // Sparkling starlight golden foil diamond
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const shimmer = Math.abs(Math.sin(time * 5 + p.seed));
        ctx.scale(shimmer, 1);
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.5, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    // 2. Render Ink Splash Ripples (For INK_SQUALL)
    if (this.splashRipples.length > 0) {
      for (const rip of this.splashRipples) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, rip.alpha);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(rip.x, rip.y, rip.r, rip.r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Ambient Atmospheric Weather Tone Tint
    if (this.type === 'INK_SQUALL') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (this.type === 'HEARTH_EMBER_MOTES') {
      ctx.fillStyle = 'rgba(251, 146, 60, 0.04)';
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (this.type === 'GALE_GOLD_BLIZZARD') {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.03)';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    ctx.restore();
  }
}
