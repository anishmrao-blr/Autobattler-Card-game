import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

export interface VFXHandle {
  spawn3DImpactBurst: (x: number, y: number, color?: string, isCrit?: boolean) => void;
  spawnSlashArc: (x1: number, y1: number, x2: number, y2: number, color?: string) => void;
  spawnBarrierShatter: (x: number, y: number) => void;
  spawnCleaveWave: (x: number, y: number, width: number) => void;
  spawnDeathExplosion: (x: number, y: number, tribe?: string) => void;
  spawnHeroOrb: (x1: number, y1: number, x2: number, y2: number, onImpact: () => void) => void;
  spawnCritNumber: (x: number, y: number, amount: number) => void;
  spawnDashTrail: (fromX: number, fromY: number, toX: number, toY: number, color?: string) => void;
  spawnFloatingDamage: (x: number, y: number, text: string, type?: 'NORMAL' | 'CRIT' | 'SHIELD' | 'HEAL') => void;
  spawnTargetReticle: (x: number, y: number, color?: string) => void;
  // Professional Impact Feedback
  spawnFluidSpatters: (cx: number, cy: number, color?: string, isCrit?: boolean) => void;
  // Lore-Tied Tribe Special Attack Phenomena
  spawnPrimalFireBreath: (fromX: number, fromY: number, toX: number, toY: number) => void;
  spawnIonLaser: (fromX: number, fromY: number, toX: number, toY: number) => void;
  spawnVoidSingularity: (cx: number, cy: number) => void;
  spawnCelestialOrbitalLance: (cx: number, cy: number) => void;
  spawnAlchemistCausticSpray: (cx: number, cy: number) => void;
  spawnPirateFlurry: (cx: number, cy: number) => void;
  spawnTribeAttackVFX: (tribe: string, fromX: number, fromY: number, toX: number, toY: number) => void;
  // Legacy aliases
  spawnBeastClaws: (cx: number, cy: number) => void;
  spawnMechLaser: (fromX: number, fromY: number, toX: number, toY: number) => void;
  spawnVoidTendrils: (cx: number, cy: number) => void;
  spawnCelestialStarlight: (cx: number, cy: number) => void;
  spawnAlchemistAcid: (cx: number, cy: number) => void;
  spawnPirateCrossSlash: (cx: number, cy: number) => void;
  spawnImpactSparks: (x: number, y: number, color?: string, count?: number) => void;
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
  type: 'flame' | 'smoke' | 'laser_spark' | 'void' | 'acid' | 'star' | 'coin' | 'spatter' | 'debris';
  rotation: number;
  vRot: number;
  aspect?: number;
  growth?: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
  width: number;
}

interface ImpactFlash {
  x: number;
  y: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  spikes: { angle: number; length: number }[];
}

interface Slash {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  life: number;
  maxLife: number;
  width: number;
  curvature?: number;
}

interface LaserBeam {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  coreColor: string;
  life: number;
  maxLife: number;
  width: number;
  arcs: { x: number; y: number; dx: number; dy: number }[];
}

interface LightPillar {
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  width: number;
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

interface DashStreak {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  life: number;
  maxLife: number;
  width: number;
}

interface FloatingDamageText {
  x: number;
  y: number;
  text: string;
  color: string;
  borderColor: string;
  size: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  isCrit: boolean;
}

interface TargetReticle {
  x: number;
  y: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface FluidSplotch {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  angle: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export const CombatVFXCanvas = forwardRef<VFXHandle, { className?: string }>(({ className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const shockwaves = useRef<Shockwave[]>([]);
  const impactFlashes = useRef<ImpactFlash[]>([]);
  const slashes = useRef<Slash[]>([]);
  const lasers = useRef<LaserBeam[]>([]);
  const pillars = useRef<LightPillar[]>([]);
  const heroOrbs = useRef<HeroOrb[]>([]);
  const dashStreaks = useRef<DashStreak[]>([]);
  const floatingTexts = useRef<FloatingDamageText[]>([]);
  const targetReticles = useRef<TargetReticle[]>([]);
  const fluidSplotches = useRef<FluidSplotch[]>([]);
  const animFrame = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    // 🩸 Visceral Fluid / Energy Mist Spatters (Professional Damage Cue)
    spawnFluidSpatters(cx: number, cy: number, color = '#dc2626', isCrit = false) {
      const dropCount = isCrit ? 28 : 16;
      for (let i = 0; i < dropCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (isCrit ? 9 : 5.5) + 2;
        const rx = Math.random() * (isCrit ? 14 : 9) + 4;
        const ry = rx * (Math.random() * 0.4 + 0.3);

        particles.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: Math.random() * 4 + 2,
          color,
          alpha: 0.95,
          life: 0,
          maxLife: Math.random() * 24 + 16,
          type: 'spatter',
          rotation: angle,
          vRot: 0,
        });

        // Residual impact splat on surface
        if (Math.random() > 0.4) {
          fluidSplotches.current.push({
            x: cx + Math.cos(angle) * (speed * 8),
            y: cy + Math.sin(angle) * (speed * 8),
            radiusX: rx,
            radiusY: ry,
            angle,
            color,
            alpha: 0.75,
            life: 0,
            maxLife: 32,
          });
        }
      }
    },

    // 🐉 MALAKOR / BEAST: Torrent of Primal Fire Breath & Magma Claws
    spawnPrimalFireBreath(fromX: number, fromY: number, toX: number, toY: number) {
      const dx = toX - fromX;
      const dy = toY - fromY;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // 1. Rapid fire breath stream expanding in a cone
      const streamCount = 42;
      for (let i = 0; i < streamCount; i++) {
        const progress = i / streamCount;
        const delayMs = progress * 140;

        setTimeout(() => {
          const spreadAngle = angle + (Math.random() - 0.5) * 0.45;
          const speed = (dist / 14) * (Math.random() * 0.4 + 0.8);
          const colors = ['#ffffff', '#fde047', '#f97316', '#ef4444', '#7f1d1d'];
          const chosenColor = colors[Math.floor(Math.random() * colors.length)];

          particles.current.push({
            x: fromX,
            y: fromY,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed - 1,
            size: Math.random() * 12 + 6,
            color: chosenColor,
            alpha: 0.95,
            life: 0,
            maxLife: Math.random() * 18 + 14,
            type: 'flame',
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.3,
            growth: 1.06,
          });
        }, delayMs);
      }

      // 2. Twin Magma Claws tearing across target at impact point
      setTimeout(() => {
        const offsets = [-28, 0, 28];
        offsets.forEach((offset, idx) => {
          slashes.current.push({
            x1: toX - 70 + offset * 0.6,
            y1: toY - 75 + offset,
            x2: toX + 70 + offset * 0.6,
            y2: toY + 75 + offset,
            color: idx === 1 ? '#ff3b00' : '#ff9900',
            life: 0,
            maxLife: 22,
            width: 18,
            curvature: 0.25,
          });
        });
        this.spawn3DImpactBurst(toX, toY, '#f97316', true);
        this.spawnFluidSpatters(toX, toY, '#ef4444', false);
      }, 160);
    },

    // 🤖 AUTOMATA / MECH: Focused Ion Railgun Laser & Overcharge Discharge
    spawnIonLaser(fromX: number, fromY: number, toX: number, toY: number) {
      // 1. Pre-fire particle convergence onto muzzle
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * 40 + 20;
        particles.current.push({
          x: fromX + Math.cos(angle) * rad,
          y: fromY + Math.sin(angle) * rad,
          vx: -Math.cos(angle) * 4,
          vy: -Math.sin(angle) * 4,
          size: Math.random() * 4 + 2,
          color: '#00f0ff',
          alpha: 0.9,
          life: 0,
          maxLife: 10,
          type: 'laser_spark',
          rotation: 0,
          vRot: 0,
        });
      }

      // 2. Plasma railgun beam with electric discharge arcs
      const arcs: { x: number; y: number; dx: number; dy: number }[] = [];
      const steps = 6;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        arcs.push({
          x: fromX + (toX - fromX) * t,
          y: fromY + (toY - fromY) * t,
          dx: (Math.random() - 0.5) * 24,
          dy: (Math.random() - 0.5) * 24,
        });
      }

      lasers.current.push({
        fromX,
        fromY,
        toX,
        toY,
        color: '#00f0ff',
        coreColor: '#ffffff',
        life: 0,
        maxLife: 20,
        width: 26,
        arcs,
      });

      // 3. Impact sparks and molten slag spray
      this.spawn3DImpactBurst(toX, toY, '#00f0ff', true);
      this.spawnFluidSpatters(toX, toY, '#38bdf8', false);
    },

    // 🔮 VOIDBORN: Abyssal Singularity Vortex & Dimension Fissure
    spawnVoidSingularity(cx: number, cy: number) {
      // Gravitational singularity shockwave
      shockwaves.current.push({
        x: cx,
        y: cy,
        radius: 80,
        maxRadius: 10, // Inward contracting gravity pulse!
        color: '#a855f7',
        life: 0,
        maxLife: 22,
        width: 12,
      });

      // 36 Dark matter spiral particles orbiting toward singularity
      for (let i = 0; i < 36; i++) {
        const theta = (i / 36) * Math.PI * 2;
        const r = Math.random() * 70 + 35;
        particles.current.push({
          x: cx + Math.cos(theta) * r,
          y: cy + Math.sin(theta) * r,
          vx: -Math.cos(theta) * 3 - Math.sin(theta) * 4,
          vy: -Math.sin(theta) * 3 + Math.cos(theta) * 4,
          size: Math.random() * 6 + 3,
          color: Math.random() > 0.4 ? '#c084fc' : '#ec4899',
          alpha: 1,
          life: 0,
          maxLife: 24,
          type: 'void',
          rotation: Math.random() * Math.PI,
          vRot: 0.25,
        });
      }

      // 3 Abyssal tendril slashes
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
        slashes.current.push({
          x1: cx,
          y1: cy,
          x2: cx + Math.cos(angle) * 90,
          y2: cy + Math.sin(angle) * 90,
          color: '#9333ea',
          life: 0,
          maxLife: 22,
          width: 14,
          curvature: 0.5,
        });
      }

      this.spawn3DImpactBurst(cx, cy, '#9333ea', false);
      this.spawnFluidSpatters(cx, cy, '#a855f7', false);
    },

    // ✨ CELESTIAL: Orbital Starlight Lance & Astral Constellation
    spawnCelestialOrbitalLance(cx: number, cy: number) {
      // 1. Blinding celestial orbital beam from top of screen
      pillars.current.push({
        x: cx,
        y: cy,
        color: '#38bdf8',
        life: 0,
        maxLife: 26,
        width: 85,
      });

      // 2. 8-Point Starlight Nova Starburst
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const speed = Math.random() * 6 + 3;
        particles.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 7 + 4,
          color: '#fef08a',
          alpha: 1,
          life: 0,
          maxLife: 26,
          type: 'star',
          rotation: 0,
          vRot: 0.08,
        });
      }

      this.spawn3DImpactBurst(cx, cy, '#fef08a', true);
      this.spawnFluidSpatters(cx, cy, '#0284c7', false);
    },

    // 🧪 ALCHEMIST: Caustic Acid Geyser & Toxic Fume Bubbles
    spawnAlchemistCausticSpray(cx: number, cy: number) {
      for (let i = 0; i < 38; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        particles.current.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.5,
          size: Math.random() * 8 + 4,
          color: Math.random() > 0.5 ? '#22c55e' : '#84cc16',
          alpha: 1,
          life: 0,
          maxLife: 32,
          type: 'acid',
          rotation: Math.random() * Math.PI,
          vRot: 0.1,
        });
      }

      this.spawn3DImpactBurst(cx, cy, '#22c55e', false);
      this.spawnFluidSpatters(cx, cy, '#15803d', false);
    },

    // 🏴‍☠️ PIRATE: Rapid Cutlass Flurry & Golden Doubloon Shower
    spawnPirateFlurry(cx: number, cy: number) {
      slashes.current.push({
        x1: cx - 75,
        y1: cy - 75,
        x2: cx + 75,
        y2: cy + 75,
        color: '#fbbf24',
        life: 0,
        maxLife: 18,
        width: 18,
      });

      setTimeout(() => {
        slashes.current.push({
          x1: cx + 75,
          y1: cy - 75,
          x2: cx - 75,
          y2: cy + 75,
          color: '#ffffff',
          life: 0,
          maxLife: 18,
          width: 18,
        });

        // Bouncing golden aether doubloons
        for (let i = 0; i < 16; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 7 + 3;
          particles.current.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            size: Math.random() * 5 + 4,
            color: '#f59e0b',
            alpha: 1,
            life: 0,
            maxLife: 32,
            type: 'coin',
            rotation: Math.random() * Math.PI,
            vRot: 0.2,
            aspect: 0.4,
          });
        }

        this.spawn3DImpactBurst(cx, cy, '#fbbf24', false);
        this.spawnFluidSpatters(cx, cy, '#b45309', false);
      }, 50);
    },

    spawnTribeAttackVFX(tribe: string, fromX: number, fromY: number, toX: number, toY: number) {
      this.spawnDashTrail(fromX, fromY, toX, toY);

      switch (tribe) {
        case 'BEAST':
          this.spawnPrimalFireBreath(fromX, fromY, toX, toY);
          break;
        case 'AUTOMATA':
          this.spawnIonLaser(fromX, fromY, toX, toY);
          break;
        case 'VOIDBORN':
          this.spawnVoidSingularity(toX, toY);
          break;
        case 'CELESTIAL':
          this.spawnCelestialOrbitalLance(toX, toY);
          break;
        case 'ALCHEMIST':
          this.spawnAlchemistCausticSpray(toX, toY);
          break;
        case 'PIRATE':
          this.spawnPirateFlurry(toX, toY);
          break;
        default:
          this.spawn3DImpactBurst(toX, toY, '#ff2a5f', false);
          this.spawnFluidSpatters(toX, toY, '#dc2626', false);
          break;
      }
    },

    // Legacy Aliases
    spawnBeastClaws(cx: number, cy: number) { this.spawnPrimalFireBreath(cx, cy - 100, cx, cy); },
    spawnMechLaser(fromX: number, fromY: number, toX: number, toY: number) { this.spawnIonLaser(fromX, fromY, toX, toY); },
    spawnVoidTendrils(cx: number, cy: number) { this.spawnVoidSingularity(cx, cy); },
    spawnCelestialStarlight(cx: number, cy: number) { this.spawnCelestialOrbitalLance(cx, cy); },
    spawnAlchemistAcid(cx: number, cy: number) { this.spawnAlchemistCausticSpray(cx, cy); },
    spawnPirateCrossSlash(cx: number, cy: number) { this.spawnPirateFlurry(cx, cy); },

    // 💨 Dash Trail
    spawnDashTrail(fromX: number, fromY: number, toX: number, toY: number, color = '#ffd700') {
      dashStreaks.current.push({
        fromX,
        fromY,
        toX,
        toY,
        color,
        life: 0,
        maxLife: 16,
        width: 32,
      });

      const steps = 8;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = fromX + (toX - fromX) * t + (Math.random() - 0.5) * 16;
        const py = fromY + (toY - fromY) * t + (Math.random() - 0.5) * 16;
        particles.current.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          size: Math.random() * 5 + 3,
          color,
          alpha: 0.9,
          life: 0,
          maxLife: 14,
          type: 'flame',
          rotation: Math.random() * Math.PI,
          vRot: 0.1,
        });
      }
    },

    spawnTargetReticle(x: number, y: number, color = '#ef4444') {
      targetReticles.current.push({
        x,
        y,
        size: 72,
        color,
        life: 0,
        maxLife: 22,
      });
    },

    spawn3DImpactBurst(x: number, y: number, color = '#ff2a5f', isCrit = false) {
      shockwaves.current.push({
        x,
        y,
        radius: 12,
        maxRadius: isCrit ? 165 : 110,
        color: isCrit ? '#ffd700' : color,
        life: 0,
        maxLife: isCrit ? 24 : 18,
        width: isCrit ? 16 : 9,
      });

      const spikeCount = isCrit ? 10 : 7;
      const spikes = Array.from({ length: spikeCount }).map((_, i) => ({
        angle: (i / spikeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
        length: Math.random() * 40 + (isCrit ? 90 : 55),
      }));

      impactFlashes.current.push({
        x,
        y,
        color: isCrit ? '#ffffff' : color,
        size: isCrit ? 48 : 30,
        life: 0,
        maxLife: 10,
        spikes,
      });

      const debrisCount = isCrit ? 32 : 18;
      const debrisPalette = isCrit
        ? ['#ffd700', '#ffffff', '#f97316', '#78350f']
        : [color, '#ffffff', '#1e1b4b', '#475569'];

      for (let i = 0; i < debrisCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (isCrit ? 13 : 8.5) + 3.5;
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (Math.random() * 4 + 2),
          size: Math.random() * (isCrit ? 9 : 6) + 3,
          color: debrisPalette[Math.floor(Math.random() * debrisPalette.length)],
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 26 + 16,
          type: 'debris',
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.4,
          aspect: Math.random() * 0.8 + 0.4,
        });
      }
    },

    spawnFloatingDamage(x: number, y: number, text: string, type: 'NORMAL' | 'CRIT' | 'SHIELD' | 'HEAL' = 'NORMAL') {
      let color = '#ffffff';
      let borderColor = '#991b1b';
      let size = 30;
      let isCrit = false;

      if (type === 'CRIT') {
        color = '#fef08a';
        borderColor = '#78350f';
        size = 42;
        isCrit = true;
      } else if (type === 'SHIELD') {
        color = '#67e8f9';
        borderColor = '#0e7490';
        size = 26;
      } else if (type === 'HEAL') {
        color = '#86efac';
        borderColor = '#166534';
        size = 28;
      }

      floatingTexts.current.push({
        x,
        y: y - 10,
        text,
        color,
        borderColor,
        size,
        life: 0,
        maxLife: 40,
        vx: (Math.random() - 0.5) * 2,
        vy: -9,
        isCrit,
      });
    },

    spawnCritNumber(x: number, y: number, amount: number) {
      this.spawnFloatingDamage(x, y - 20, `-${amount}! CRIT`, 'CRIT');
      this.spawn3DImpactBurst(x, y - 20, '#ffd700', true);
    },

    spawnImpactSparks(x: number, y: number, color = '#ffd700') {
      this.spawn3DImpactBurst(x, y, color, false);
    },

    spawnBarrierShatter(x: number, y: number) {
      this.spawnFloatingDamage(x, y - 15, '✨ BARRIER BROKEN', 'SHIELD');
      shockwaves.current.push({
        x,
        y,
        radius: 15,
        maxRadius: 140,
        color: '#00f0ff',
        life: 0,
        maxLife: 22,
        width: 14,
      });
    },

    spawnSlashArc(x1: number, y1: number, x2: number, y2: number, color = '#ff2a5f') {
      slashes.current.push({ x1, y1, x2, y2, color, life: 0, maxLife: 16, width: 14 });
    },

    spawnCleaveWave(x: number, y: number, width: number) {
      shockwaves.current.push({
        x,
        y,
        radius: 20,
        maxRadius: width * 0.75,
        color: '#ff6600',
        life: 0,
        maxLife: 20,
        width: 12,
      });
    },

    spawnDeathExplosion(x: number, y: number, tribe = 'NEUTRAL') {
      const colors: Record<string, string> = {
        AUTOMATA: '#c89b3c',
        VOIDBORN: '#9d4edd',
        ALCHEMIST: '#00e676',
        CELESTIAL: '#00f0ff',
        BEAST: '#ff2a5f',
        PIRATE: '#ffd700',
        NEUTRAL: '#e2e8f0',
      };
      const col = colors[tribe] || colors.NEUTRAL;
      this.spawn3DImpactBurst(x, y, col, true);
      this.spawnFluidSpatters(x, y, col, true);
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

      // --- LAYER A: NORMAL BLEND MODE (Splotches & Spatters) ---
      ctx.globalCompositeOperation = 'source-over';

      // Render Fluid Impact Splotches on Table Surface
      for (let i = fluidSplotches.current.length - 1; i >= 0; i--) {
        const splotch = fluidSplotches.current[i];
        splotch.life++;
        const progress = splotch.life / splotch.maxLife;
        const alpha = splotch.alpha * Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = splotch.color;
        ctx.translate(splotch.x, splotch.y);
        ctx.rotate(splotch.angle);

        ctx.beginPath();
        ctx.ellipse(0, 0, splotch.radiusX, splotch.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (splotch.life >= splotch.maxLife) {
          fluidSplotches.current.splice(i, 1);
        }
      }

      // --- LAYER B: ADDITIVE BLEND MODE ('lighter' for studio glowing radiance) ---
      ctx.globalCompositeOperation = 'lighter';

      // 0. Render Target Lock Reticles
      for (let i = targetReticles.current.length - 1; i >= 0; i--) {
        const ret = targetReticles.current[i];
        ret.life++;
        const progress = ret.life / ret.maxLife;
        const currentSize = ret.size * (1.3 - progress * 0.3);
        const alpha = Math.sin(progress * Math.PI);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = ret.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = ret.color;
        ctx.shadowBlur = 15;

        const half = currentSize / 2;
        const cornerLen = half * 0.45;

        ctx.beginPath();
        ctx.moveTo(ret.x - half, ret.y - half + cornerLen);
        ctx.lineTo(ret.x - half, ret.y - half);
        ctx.lineTo(ret.x - half + cornerLen, ret.y - half);

        ctx.moveTo(ret.x + half - cornerLen, ret.y - half);
        ctx.lineTo(ret.x + half, ret.y - half);
        ctx.lineTo(ret.x + half, ret.y - half + cornerLen);

        ctx.moveTo(ret.x - half, ret.y + half - cornerLen);
        ctx.lineTo(ret.x - half, ret.y + half);
        ctx.lineTo(ret.x - half + cornerLen, ret.y + half);

        ctx.moveTo(ret.x + half - cornerLen, ret.y + half);
        ctx.lineTo(ret.x + half, ret.y + half);
        ctx.lineTo(ret.x + half, ret.y + half - cornerLen);
        ctx.stroke();

        ctx.restore();

        if (ret.life >= ret.maxLife) {
          targetReticles.current.splice(i, 1);
        }
      }

      // 1. Render Dash Streaks
      for (let i = dashStreaks.current.length - 1; i >= 0; i--) {
        const ds = dashStreaks.current[i];
        ds.life++;
        const progress = ds.life / ds.maxLife;
        const alpha = Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = ds.color;
        ctx.lineWidth = ds.width * (1 - progress);
        ctx.shadowColor = ds.color;
        ctx.shadowBlur = 25;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(ds.fromX, ds.fromY);
        ctx.lineTo(ds.toX, ds.toY);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = ds.width * 0.35 * (1 - progress);
        ctx.stroke();
        ctx.restore();

        if (ds.life >= ds.maxLife) {
          dashStreaks.current.splice(i, 1);
        }
      }

      // 2. Render Perspective 3D Ground Shockwaves
      for (let i = shockwaves.current.length - 1; i >= 0; i--) {
        const sw = shockwaves.current[i];
        sw.life++;
        const progress = sw.life / sw.maxLife;
        const currentRadius = sw.radius + (sw.maxRadius - sw.radius) * Math.sqrt(progress);
        const alpha = Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = sw.width * (1 - progress * 0.7);
        ctx.shadowColor = sw.color;
        ctx.shadowBlur = 25;

        ctx.beginPath();
        ctx.ellipse(sw.x, sw.y, currentRadius, currentRadius * 0.44, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (sw.life >= sw.maxLife) {
          shockwaves.current.splice(i, 1);
        }
      }

      // 3. Render Impact Flashes
      for (let i = impactFlashes.current.length - 1; i >= 0; i--) {
        const flash = impactFlashes.current[i];
        flash.life++;
        const progress = flash.life / flash.maxLife;
        const alpha = Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = flash.color;
        ctx.shadowBlur = 30;

        ctx.beginPath();
        ctx.arc(flash.x, flash.y, flash.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = flash.color;
        flash.spikes.forEach(s => {
          const rayLen = s.length * (1 + progress * 0.3);
          const endX = flash.x + Math.cos(s.angle) * rayLen;
          const endY = flash.y + Math.sin(s.angle) * rayLen * 0.6;
          const perpAngle = s.angle + Math.PI / 2;
          const halfWidth = 5 * (1 - progress);

          ctx.beginPath();
          ctx.moveTo(flash.x + Math.cos(perpAngle) * halfWidth, flash.y + Math.sin(perpAngle) * halfWidth);
          ctx.lineTo(endX, endY);
          ctx.lineTo(flash.x - Math.cos(perpAngle) * halfWidth, flash.y - Math.sin(perpAngle) * halfWidth);
          ctx.closePath();
          ctx.fill();
        });

        ctx.restore();

        if (flash.life >= flash.maxLife) {
          impactFlashes.current.splice(i, 1);
        }
      }

      // 4. Render Lasers with Electric Discharges
      for (let i = lasers.current.length - 1; i >= 0; i--) {
        const l = lasers.current[i];
        l.life++;
        const progress = l.life / l.maxLife;
        const alpha = Math.sin(progress * Math.PI);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = l.color;
        ctx.lineWidth = l.width * (1 - progress * 0.5);
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 30;

        ctx.beginPath();
        ctx.moveTo(l.fromX, l.fromY);
        ctx.lineTo(l.toX, l.toY);
        ctx.stroke();

        // Core White Beam
        ctx.strokeStyle = l.coreColor;
        ctx.lineWidth = l.width * 0.35;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(l.fromX, l.fromY);
        ctx.lineTo(l.toX, l.toY);
        ctx.stroke();

        // Electric Discharges
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        l.arcs.forEach(arc => {
          ctx.beginPath();
          ctx.moveTo(arc.x, arc.y);
          ctx.lineTo(arc.x + arc.dx * (Math.random() * 0.5 + 0.7), arc.y + arc.dy * (Math.random() * 0.5 + 0.7));
          ctx.stroke();
        });

        ctx.restore();

        if (l.life >= l.maxLife) {
          lasers.current.splice(i, 1);
        }
      }

      // 5. Light Pillars (Celestial)
      for (let i = pillars.current.length - 1; i >= 0; i--) {
        const pil = pillars.current[i];
        pil.life++;
        const progress = pil.life / pil.maxLife;
        const alpha = Math.sin(progress * Math.PI);

        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        const grad = ctx.createLinearGradient(pil.x - pil.width / 2, 0, pil.x + pil.width / 2, 0);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(pil.x - pil.width / 2, 0, pil.width, canvas.height);
        ctx.restore();

        if (pil.life >= pil.maxLife) {
          pillars.current.splice(i, 1);
        }
      }

      // 6. Slashes
      for (let i = slashes.current.length - 1; i >= 0; i--) {
        const s = slashes.current[i];
        s.life++;
        const progress = s.life / s.maxLife;
        const alpha = 1 - progress;

        ctx.save();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = (1 - progress) * (s.width || 14) + 3;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 25;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        const curveFactor = s.curvature || 0.35;
        const cx = (s.x1 + s.x2) / 2 + (s.y2 - s.y1) * curveFactor;
        const cy = (s.y1 + s.y2) / 2 + (s.x1 - s.x2) * curveFactor;
        ctx.quadraticCurveTo(cx, cy, s.x2, s.y2);
        ctx.stroke();
        ctx.restore();

        if (s.life >= s.maxLife) {
          slashes.current.splice(i, 1);
        }
      }

      // 7. Hero Orbs
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
        ctx.restore();

        if (orb.progress >= 1) {
          orb.onImpact();
          heroOrbs.current.splice(i, 1);
        }
      }

      // 8. Custom Lore Particles (Fire, Laser Sparks, Void, Acid, Stars, Coins)
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        if (p.growth) p.size *= p.growth;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === 'flame') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'laser_spark') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'void') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#9333ea';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'star') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#fef08a';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.5);
          ctx.lineTo(p.size * 0.4, -p.size * 0.4);
          ctx.lineTo(p.size * 1.5, 0);
          ctx.lineTo(p.size * 0.4, p.size * 0.4);
          ctx.lineTo(0, p.size * 1.5);
          ctx.lineTo(-p.size * 0.4, p.size * 0.4);
          ctx.lineTo(-p.size * 1.5, 0);
          ctx.lineTo(-p.size * 0.4, -p.size * 0.4);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'acid') {
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'coin') {
          ctx.fillStyle = p.color;
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * (p.aspect || 0.4), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (p.type === 'debris') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.7, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.7, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'spatter') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (p.life >= p.maxLife) {
          particles.current.splice(i, 1);
        }
      }

      // --- LAYER C: NORMAL BLEND FOR DAMAGE NUMBERS ---
      ctx.globalCompositeOperation = 'source-over';

      for (let i = floatingTexts.current.length - 1; i >= 0; i--) {
        const ft = floatingTexts.current[i];
        ft.life++;
        ft.x += ft.vx;
        ft.y += ft.vy;
        ft.vy += 0.42;
        ft.vx *= 0.96;

        const progress = ft.life / ft.maxLife;
        const alpha = Math.max(0, 1 - progress);
        const scale = ft.isCrit
          ? 1 + Math.sin(progress * Math.PI * 0.7) * 0.45
          : 1 + Math.sin(progress * Math.PI * 0.6) * 0.22;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `900 ${Math.floor(ft.size * scale)}px Cinzel, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 20;

        ctx.strokeStyle = ft.borderColor;
        ctx.lineWidth = ft.isCrit ? 6 : 4;
        ctx.strokeText(ft.text, ft.x, ft.y);

        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);

        ctx.restore();

        if (ft.life >= ft.maxLife) {
          floatingTexts.current.splice(i, 1);
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
