import React, { useEffect, useRef } from 'react';
import { Hero } from '../types';

interface VictoryCelebrationVFXProps {
  hero: Hero;
  winStreak: number;
  turnNumber: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  secondaryColor?: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
  shape: 'gear' | 'coin' | 'bubble' | 'ember' | 'star' | 'voidRune' | 'ring';
  scale: number;
  orbitAngle?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
}

export const VictoryCelebrationVFX: React.FC<VictoryCelebrationVFXProps> = ({
  hero,
  winStreak,
  turnNumber,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const animFrame = useRef<number | null>(null);

  // Determine theme based on hero ID or title
  const getTheme = () => {
    const id = hero.id;
    if (id === 'hero_chronos' || id === 'hero_artificer') return 'CLOCKWORK';
    if (id === 'hero_nyx') return 'VOIDBORN';
    if (id === 'hero_aurelius') return 'ALCHEMIST';
    if (id === 'hero_skylar') return 'PIRATE';
    if (id === 'hero_malakor') return 'BEAST';
    if (id === 'hero_orion') return 'CELESTIAL';
    return 'CELESTIAL';
  };

  const theme = getTheme();
  const celebrationMode = turnNumber % 4; // Changes every victory

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Streak Multiplier: streak 1 = 45, streak 2 = 90, streak 3+ = 160+
    const particleCount = Math.min(220, 45 + winStreak * 40);

    // Initial Particle Burst Configuration based on Theme & Mode
    particles.current = [];

    const getThemeConfig = () => {
      switch (theme) {
        case 'CLOCKWORK':
          return {
            shapes: ['gear', 'star', 'ring'] as const,
            colors: ['#ffd700', '#f59e0b', '#fbbf24', '#e2e8f0', '#b45309'],
          };
        case 'VOIDBORN':
          return {
            shapes: ['voidRune', 'star', 'ring'] as const,
            colors: ['#a855f7', '#ec4899', '#7e22ce', '#3b0764', '#00f0ff'],
          };
        case 'ALCHEMIST':
          return {
            shapes: ['bubble', 'star', 'ring'] as const,
            colors: ['#10b981', '#06b6d4', '#34d399', '#a7f3d0', '#fbbf24'],
          };
        case 'PIRATE':
          return {
            shapes: ['coin', 'star', 'ring'] as const,
            colors: ['#f59e0b', '#fbbf24', '#06b6d4', '#eab308', '#ffffff'],
          };
        case 'BEAST':
          return {
            shapes: ['ember', 'star', 'ring'] as const,
            colors: ['#ef4444', '#f97316', '#dc2626', '#7f1d1d', '#fbbf24'],
          };
        case 'CELESTIAL':
        default:
          return {
            shapes: ['star', 'ring', 'bubble'] as const,
            colors: ['#38bdf8', '#818cf8', '#c084fc', '#ffffff', '#ffd700'],
          };
      }
    };

    const cfg = getThemeConfig();

    for (let i = 0; i < particleCount; i++) {
      const shape = cfg.shapes[Math.floor(Math.random() * cfg.shapes.length)];
      const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;

      let x = cx;
      let y = cy;
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed;

      if (celebrationMode === 2) {
        // Cascade Rain from top
        x = Math.random() * canvas.width;
        y = -20 - Math.random() * 200;
        vx = (Math.random() - 0.5) * 4;
        vy = Math.random() * 6 + 4;
      }

      particles.current.push({
        x,
        y,
        vx,
        vy,
        size: Math.random() * 14 + 8,
        color,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 90 + 60,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.15,
        shape,
        scale: 1,
        orbitAngle: angle,
        orbitRadius: Math.random() * 260 + 80,
        orbitSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.015 + Math.random() * 0.02),
      });
    }

    let globalTick = 0;

    const render = () => {
      globalTick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // 1. Full-Screen Streak Ambient Aura (Pulses faster at higher streaks)
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        50,
        centerX,
        centerY,
        canvas.width * 0.7
      );

      const streakPulse = (Math.sin(globalTick * 0.05) + 1) * 0.5;
      const auraAlpha = (0.15 + streakPulse * 0.15) * Math.min(1, 0.4 + winStreak * 0.3);

      if (theme === 'CLOCKWORK') {
        auraGradient.addColorStop(0, `rgba(234, 179, 8, ${auraAlpha * 1.5})`);
        auraGradient.addColorStop(0.5, `rgba(180, 83, 9, ${auraAlpha * 0.6})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (theme === 'VOIDBORN') {
        auraGradient.addColorStop(0, `rgba(168, 85, 247, ${auraAlpha * 1.5})`);
        auraGradient.addColorStop(0.5, `rgba(59, 7, 100, ${auraAlpha * 0.7})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (theme === 'ALCHEMIST') {
        auraGradient.addColorStop(0, `rgba(16, 185, 129, ${auraAlpha * 1.5})`);
        auraGradient.addColorStop(0.5, `rgba(6, 182, 212, ${auraAlpha * 0.6})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (theme === 'BEAST') {
        auraGradient.addColorStop(0, `rgba(239, 68, 68, ${auraAlpha * 1.5})`);
        auraGradient.addColorStop(0.5, `rgba(249, 115, 22, ${auraAlpha * 0.6})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        auraGradient.addColorStop(0, `rgba(56, 189, 248, ${auraAlpha * 1.5})`);
        auraGradient.addColorStop(0.5, `rgba(129, 140, 248, ${auraAlpha * 0.6})`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = auraGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. High-Streak Lightning / Runic Border Waves for Streaks >= 3
      if (winStreak >= 3) {
        ctx.save();
        ctx.strokeStyle = theme === 'BEAST' ? '#ef4444' : theme === 'VOIDBORN' ? '#ec4899' : '#ffd700';
        ctx.lineWidth = 4;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 20;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        ctx.restore();
      }

      // 3. Render Custom Themed Particle Geometry
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.life++;
        p.rotation += p.vRot;

        if (celebrationMode === 1 && p.orbitRadius && p.orbitAngle !== undefined) {
          // Orbiting Vortex Mode
          p.orbitAngle += p.orbitSpeed || 0.02;
          p.x = centerX + Math.cos(p.orbitAngle) * p.orbitRadius;
          p.y = centerY + Math.sin(p.orbitAngle) * (p.orbitRadius * 0.6); // 3D tilt
        } else {
          p.x += p.vx;
          p.y += p.vy;
          if (celebrationMode === 2) {
            p.vy += 0.15; // Gravity
          } else {
            p.vx *= 0.98;
            p.vy *= 0.98;
          }
        }

        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;

        // Custom Themed Vector Glyphs
        if (p.shape === 'gear') {
          // ⚙️ Detailed Clockwork Cogwheel
          const teeth = 8;
          const outerR = p.size;
          const innerR = p.size * 0.65;
          ctx.beginPath();
          for (let t = 0; t < teeth; t++) {
            const a1 = (t / teeth) * Math.PI * 2;
            const a2 = ((t + 0.5) / teeth) * Math.PI * 2;
            ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
            ctx.lineTo(Math.cos(a2) * innerR, Math.sin(a2) * innerR);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#0a0614';
          ctx.beginPath();
          ctx.arc(0, 0, innerR * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'coin') {
          // 🪙 Plundered Aether Cog-Coin
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.shape === 'bubble') {
          // 🧪 Iridescent Alchemical Transmutation Bubble
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-p.size * 0.35, -p.size * 0.35, p.size * 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'ember') {
          // 🔥 Primal Beast Firestorm Flame
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.4);
          ctx.quadraticCurveTo(p.size * 0.9, 0, 0, p.size);
          ctx.quadraticCurveTo(-p.size * 0.9, 0, 0, -p.size * 1.4);
          ctx.fill();
        } else if (p.shape === 'voidRune') {
          // 🔮 Eldritch Void Singularity Shard
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.5);
          ctx.lineTo(p.size * 0.8, 0);
          ctx.lineTo(0, p.size * 1.5);
          ctx.lineTo(-p.size * 0.8, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'star') {
          // ✨ 8-Point Radiant Celestial Starlight
          const points = 8;
          ctx.beginPath();
          for (let pt = 0; pt < points * 2; pt++) {
            const rad = pt % 2 === 0 ? p.size * 1.4 : p.size * 0.45;
            const a = (pt / (points * 2)) * Math.PI * 2;
            ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'ring') {
          // 🪐 Harmonic Resonance Ring
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();

        if (p.life >= p.maxLife) {
          // Continuous Loop during victory celebration
          p.life = 0;
          p.x = centerX + (Math.random() - 0.5) * 100;
          p.y = centerY + (Math.random() - 0.5) * 100;
          const newAngle = Math.random() * Math.PI * 2;
          const newSpeed = Math.random() * 7 + 2;
          p.vx = Math.cos(newAngle) * newSpeed;
          p.vy = Math.sin(newAngle) * newSpeed;
        }
      }

      animFrame.current = requestAnimationFrame(render);
    };

    animFrame.current = requestAnimationFrame(render);

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [hero, winStreak, turnNumber, theme, celebrationMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
    />
  );
};
