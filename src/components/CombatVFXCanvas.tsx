import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

export interface VFXHandle {
  spawnImpactSparks: (x: number, y: number, color?: string, count?: number) => void;
  spawnSlashArc: (x1: number, y1: number, x2: number, y2: number, color?: string) => void;
  spawnBarrierShatter: (x: number, y: number) => void;
  spawnCleaveWave: (x: number, y: number, width: number) => void;
  spawnDeathExplosion: (x: number, y: number, tribe?: string) => void;
  spawnHeroOrb: (x1: number, y1: number, x2: number, y2: number, onImpact: () => void) => void;
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
  type: 'spark' | 'shard' | 'smoke' | 'star';
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

export const CombatVFXCanvas = forwardRef<VFXHandle, { className?: string }>(({ className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const slashes = useRef<Slash[]>([]);
  const heroOrbs = useRef<HeroOrb[]>([]);
  const animFrame = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    spawnImpactSparks(x: number, y: number, color = '#ffd700', count = 35) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 5 + 2,
          color,
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 25 + 15,
          type: 'spark',
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.2,
        });
      }
    },

    spawnBarrierShatter(x: number, y: number) {
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 10 + 3;
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 8 + 3,
          color: '#00f0ff',
          alpha: 1,
          life: 0,
          maxLife: 35,
          type: 'shard',
          rotation: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.3,
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
        maxLife: 15,
      });
      for (let i = 0; i < 15; i++) {
        const t = Math.random();
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        particles.current.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          size: Math.random() * 4 + 1,
          color: '#ffffff',
          alpha: 1,
          life: 0,
          maxLife: 20,
          type: 'spark',
          rotation: 0,
          vRot: 0,
        });
      }
    },

    spawnCleaveWave(x: number, y: number, width: number) {
      for (let i = -width / 2; i <= width / 2; i += 15) {
        particles.current.push({
          x: x + i,
          y,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 6 - 2,
          size: Math.random() * 6 + 3,
          color: '#ff5500',
          alpha: 1,
          life: 0,
          maxLife: 25,
          type: 'spark',
          rotation: 0,
          vRot: 0,
        });
      }
    },

    spawnDeathExplosion(x: number, y: number, tribe = 'NEUTRAL') {
      const colors: Record<string, string[]> = {
        AUTOMATA: ['#c89b3c', '#ff5500', '#555555'],
        VOIDBORN: ['#9d4edd', '#ff007f', '#120024'],
        ALCHEMIST: ['#00e676', '#a3e635', '#064e3b'],
        CELESTIAL: ['#00f0ff', '#ffffff', '#38bdf8'],
        BEAST: ['#ff2a5f', '#b91c1c', '#450a0a'],
        PIRATE: ['#ffd700', '#f59e0b', '#78350f'],
        NEUTRAL: ['#e2e8f0', '#94a3b8', '#475569'],
      };
      const palette = colors[tribe] || colors.NEUTRAL;

      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        const col = palette[Math.floor(Math.random() * palette.length)];
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 7 + 3,
          color: col,
          alpha: 1,
          life: 0,
          maxLife: 30 + Math.random() * 15,
          type: Math.random() > 0.5 ? 'smoke' : 'spark',
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
        ctx.lineWidth = (1 - progress) * 8 + 2;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 20;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        const cx = (s.x1 + s.x2) / 2 + (s.y2 - s.y1) * 0.3;
        const cy = (s.y1 + s.y2) / 2 + (s.x1 - s.x2) * 0.3;
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
        const arcY = Math.sin(orb.progress * Math.PI) * -120;
        const curY = orb.y + (orb.targetY - orb.y) * orb.progress + arcY;

        ctx.save();
        ctx.fillStyle = orb.color;
        ctx.shadowColor = orb.color;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(curX, curY, 12, 0, Math.PI * 2);
        ctx.fill();

        particles.current.push({
          x: curX,
          y: curY,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          size: Math.random() * 4 + 2,
          color: '#ff9900',
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

      // Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.vx *= 0.96;
        p.rotation += p.vRot;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === 'spark') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'shard') {
          ctx.strokeStyle = p.color;
          ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-p.size, -p.size);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(0, p.size);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (p.type === 'smoke') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * (1 + p.life / p.maxLife), 0, Math.PI * 2);
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
