import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

export interface VFXHandle {
  spawnImpactSparks: (x: number, y: number, color?: string, count?: number) => void;
  spawnSlashArc: (x1: number, y1: number, x2: number, y2: number, color?: string) => void;
  spawnBarrierShatter: (x: number, y: number) => void;
  spawnCleaveWave: (x: number, y: number, width: number) => void;
  spawnDeathExplosion: (x: number, y: number, tribe?: string) => void;
  spawnHeroOrb: (x1: number, y1: number, x2: number, y2: number, onImpact: () => void) => void;
  spawnCritNumber: (x: number, y: number, amount: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'shard' | 'smoke' | 'star' | 'ember';
  rotation: number;
  vRot: number;
}

interface Slash {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  life: number;
  maxLife: number;
}

interface HeroOrb {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  color: string;
  onImpact: () => void;
}

interface FloatingCrit {
  x: number;
  y: number;
  amount: number;
  life: number;
  maxLife: number;
}

export const CombatVFXCanvas = forwardRef<VFXHandle, { className?: string }>(({ className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const slashes = useRef<Slash[]>([]);
  const heroOrbs = useRef<HeroOrb[]>([]);
  const critNumbers = useRef<FloatingCrit[]>([]);
  const animFrame = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    spawnImpactSparks(x: number, y: number, color = '#ffd700', count = 45) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 9 + 3;
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 5 + 2,
          color,
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 28 + 14,
          type: 'spark',
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.25,
        });
      }
    },

    spawnCritNumber(x: number, y: number, amount: number) {
      critNumbers.current.push({
        x,
        y,
        amount,
        life: 0,
        maxLife: 45,
      });

      // Starburst sparks behind the critical number
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const speed = Math.random() * 6 + 4;
        particles.current.push({
          x,
          y: y - 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          color: '#ffd700',
          alpha: 1,
          life: 0,
          maxLife: 25,
          type: 'star',
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.3,
        });
      }
    },

    spawnBarrierShatter(x: number, y: number) {
      for (let i = 0; i < 48; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 11 + 4;
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 9 + 4,
          color: '#00f0ff',
          alpha: 1,
          life: 0,
          maxLife: 35,
          type: 'shard',
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.35,
        });
      }
    },

    spawnSlashArc(x1: number, y1: number, x2: number, y2: number, color = '#ff2a5f') {
      slashes.current.push({
        x1,
        y1,
        x2,
        y2,
        color,
        life: 0,
        maxLife: 16,
      });
      for (let i = 0; i < 18; i++) {
        const t = Math.random();
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        particles.current.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          size: Math.random() * 4 + 1.5,
          color: '#ffffff',
          alpha: 1,
          life: 0,
          maxLife: 22,
          type: 'spark',
          rotation: 0,
          vRot: 0,
        });
      }
    },

    spawnCleaveWave(x: number, y: number, width: number) {
      for (let i = -width / 2; i <= width / 2; i += 12) {
        particles.current.push({
          x: x + i,
          y,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 7 - 2,
          size: Math.random() * 7 + 3,
          color: '#ff6600',
          alpha: 1,
          life: 0,
          maxLife: 26,
          type: 'spark',
          rotation: 0,
          vRot: 0,
        });
      }
    },

    spawnDeathExplosion(x: number, y: number, tribe = 'NEUTRAL') {
      const colors: Record<string, string[]> = {
        AUTOMATA: ['#c89b3c', '#ff5500', '#777777'],
        VOIDBORN: ['#9d4edd', '#ff007f', '#2a0845'],
        ALCHEMIST: ['#00e676', '#a3e635', '#064e3b'],
        CELESTIAL: ['#00f0ff', '#ffffff', '#38bdf8'],
        BEAST: ['#ff2a5f', '#dc2626', '#450a0a'],
        PIRATE: ['#ffd700', '#f59e0b', '#78350f'],
        NEUTRAL: ['#e2e8f0', '#94a3b8', '#475569'],
      };
      const palette = colors[tribe] || colors.NEUTRAL;

      for (let i = 0; i < 55; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        const col = palette[Math.floor(Math.random() * palette.length)];
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2, // Slight upward draft
          size: Math.random() * 8 + 3,
          color: col,
          alpha: 1,
          life: 0,
          maxLife: 32 + Math.random() * 18,
          type: Math.random() > 0.4 ? 'ember' : 'smoke',
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.2,
        });
      }
    },

    spawnHeroOrb(x1: number, y1: number, x2: number, y2: number, onImpact: () => void) {
      heroOrbs.current.push({
        x: x1,
        y: y1,
        targetX: x2,
        targetY: y2,
        progress: 0,
        color: '#ffd700',
        onImpact,
      });
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Slashes
      for (let i = slashes.current.length - 1; i >= 0; i--) {
        const s = slashes.current[i];
        s.life++;
        const progress = s.life / s.maxLife;
        const alpha = 1 - progress;

        ctx.save();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = (1 - progress) * 10 + 3;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 24;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        const cx = (s.x1 + s.x2) / 2 + (s.y2 - s.y1) * 0.35;
        const cy = (s.y1 + s.y2) / 2 + (s.x1 - s.x2) * 0.35;
        ctx.quadraticCurveTo(cx, cy, s.x2, s.y2);
        ctx.stroke();
        ctx.restore();

        if (s.life >= s.maxLife) {
          slashes.current.splice(i, 1);
        }
      }

      // Hero Damage Orbs
      for (let i = heroOrbs.current.length - 1; i >= 0; i--) {
        const orb = heroOrbs.current[i];
        orb.progress += 0.035;

        const curX = orb.x + (orb.targetX - orb.x) * orb.progress;
        const arcY = Math.sin(orb.progress * Math.PI) * -130;
        const curY = orb.y + (orb.targetY - orb.y) * orb.progress + arcY;

        ctx.save();
        ctx.fillStyle = orb.color;
        ctx.shadowColor = orb.color;
        ctx.shadowBlur = 28;
        ctx.beginPath();
        ctx.arc(curX, curY, 14, 0, Math.PI * 2);
        ctx.fill();

        particles.current.push({
          x: curX,
          y: curY,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          size: Math.random() * 4 + 2,
          color: '#ffaa00',
          alpha: 1,
          life: 0,
          maxLife: 20,
          type: 'spark',
          rotation: 0,
          vRot: 0,
        });

        ctx.restore();

        if (orb.progress >= 1) {
          orb.onImpact();
          heroOrbs.current.splice(i, 1);
        }
      }

      // Floating Critical Damage Numbers
      for (let i = critNumbers.current.length - 1; i >= 0; i--) {
        const crit = critNumbers.current[i];
        crit.life++;
        const progress = crit.life / crit.maxLife;
        const alpha = Math.max(0, 1 - progress);
        const floatY = crit.y - 25 - progress * 40;
        const scale = 1 + Math.sin(progress * Math.PI * 0.8) * 0.4;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `900 ${Math.floor(36 * scale)}px Cinzel, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Radiant glow
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;

        // Outline
        ctx.strokeStyle = '#780016';
        ctx.lineWidth = 6;
        ctx.strokeText(`CRIT -${crit.amount}!`, crit.x, floatY);

        // Fill
        ctx.fillStyle = '#fff066';
        ctx.fillText(`CRIT -${crit.amount}!`, crit.x, floatY);

        ctx.restore();

        if (crit.life >= crit.maxLife) {
          critNumbers.current.splice(i, 1);
        }
      }

      // Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'ember') {
          p.vy -= 0.08; // Upward draft
          p.vx += (Math.random() - 0.5) * 0.2;
        } else {
          p.vy += 0.16; // Gravity
        }

        p.vx *= 0.96;
        p.rotation += p.vRot;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === 'spark' || p.type === 'star') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'shard') {
          ctx.strokeStyle = p.color;
          ctx.fillStyle = 'rgba(0, 240, 255, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-p.size, -p.size);
          ctx.lineTo(p.size, -p.size * 0.5);
          ctx.lineTo(p.size * 0.5, p.size);
          ctx.lineTo(-p.size * 0.5, p.size);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (p.type === 'ember') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * (1 - p.life / p.maxLife * 0.5), 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'smoke') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * (1 + p.life / p.maxLife * 1.2), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (p.life >= p.maxLife) {
          particles.current.splice(i, 1);
        }
      }

      animFrame.current = requestAnimationFrame(render);
    };

    animFrame.current = requestAnimationFrame(render);

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-50 ${className || ''}`}
    />
  );
});
