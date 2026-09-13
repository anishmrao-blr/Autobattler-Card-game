import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Application,
  Container,
  Sprite,
  Graphics,
  Text,
  Texture,
  Assets,
} from 'pixi.js';
import { AdvancedBloomFilter } from 'pixi-filters';
import gsap from 'gsap';

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

const TEXTURE_URLS = {
  sparkSoft: '/assets/vfx/textures/spark-soft.png',
  sparkHard: '/assets/vfx/textures/spark-hard.png',
  smoke1: '/assets/vfx/textures/smoke-01.png',
  smoke2: '/assets/vfx/textures/smoke-02.png',
  smoke3: '/assets/vfx/textures/smoke-03.png',
  smoke4: '/assets/vfx/textures/smoke-04.png',
  flame1: '/assets/vfx/textures/flame-01.png',
  flame2: '/assets/vfx/textures/flame-02.png',
  flame3: '/assets/vfx/textures/flame-03.png',
  glowRing: '/assets/vfx/textures/glow-ring.png',
  slash1: '/assets/vfx/textures/slash-01.png',
  slash2: '/assets/vfx/textures/slash-02.png',
  slash3: '/assets/vfx/textures/slash-03.png',
  star4pt: '/assets/vfx/textures/star-4pt.png',
  coin: '/assets/vfx/textures/coin.png',
  voidWisp: '/assets/vfx/textures/void-wisp.png',
};

type TextureKey = keyof typeof TEXTURE_URLS;

interface PooledParticle {
  sprite: Sprite;
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  friction: number;
  life: number;
  maxLife: number;
  scaleStart: number;
  scaleEnd: number;
  scaleXMult: number;
  scaleYMult: number;
  alphaStart: number;
  alphaEnd: number;
  rotation: number;
  vRot: number;
  growth: number;
  inwardTarget?: { cx: number; cy: number; speed: number; spiralSpeed: number };
}

interface ActiveFloatingText {
  textObj: Text;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  isCrit: boolean;
  baseSize: number;
}

interface ActiveHeroOrb {
  sprite: Sprite;
  aura: Sprite;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  onImpact: () => void;
}

const MAX_PARTICLES = 450;

export const CombatVFXCanvas = forwardRef<VFXHandle, { className?: string }>(({ className }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const texturesRef = useRef<Record<TextureKey, Texture>>({} as Record<TextureKey, Texture>);
  const bloomFilterRef = useRef<AdvancedBloomFilter | null>(null);

  // Containers
  const surfaceContainerRef = useRef<Container | null>(null);
  const bloomContainerRef = useRef<Container | null>(null);
  const uiContainerRef = useRef<Container | null>(null);

  // Particle pool
  const particlePoolRef = useRef<PooledParticle[]>([]);
  const floatingTextsRef = useRef<ActiveFloatingText[]>([]);
  const heroOrbsRef = useRef<ActiveHeroOrb[]>([]);

  // Spawn helper with pooling & budget check
  const spawnParticle = (opts: {
    texture: Texture;
    container: Container;
    x: number;
    y: number;
    vx: number;
    vy: number;
    gravity?: number;
    friction?: number;
    maxLife: number;
    color?: string | number;
    blendMode?: 'add' | 'normal';
    scaleStart?: number;
    scaleEnd?: number;
    scaleXMult?: number;
    scaleYMult?: number;
    alphaStart?: number;
    alphaEnd?: number;
    rotation?: number;
    vRot?: number;
    growth?: number;
    inwardTarget?: { cx: number; cy: number; speed: number; spiralSpeed: number };
  }) => {
    const pool = particlePoolRef.current;
    let p: PooledParticle | null = null;

    for (let i = 0; i < pool.length; i++) {
      if (!pool[i].active && !pool[i].sprite.destroyed) {
        p = pool[i];
        break;
      }
    }

    if (!p) {
      if (pool.length < MAX_PARTICLES) {
        const sprite = new Sprite(opts.texture);
        sprite.anchor.set(0.5);
        opts.container.addChild(sprite);
        p = {
          sprite,
          active: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          gravity: 0,
          friction: 1,
          life: 0,
          maxLife: 1,
          scaleStart: 1,
          scaleEnd: 0,
          scaleXMult: 1,
          scaleYMult: 1,
          alphaStart: 1,
          alphaEnd: 0,
          rotation: 0,
          vRot: 0,
          growth: 1,
        };
        pool.push(p);
      } else {
        // Particle budget capped: skip spawn to guarantee 60 FPS
        return;
      }
    }

    // Switch container if needed
    if (p.sprite.parent !== opts.container) {
      opts.container.addChild(p.sprite);
    }

    p.sprite.texture = opts.texture;
    p.sprite.blendMode = opts.blendMode || 'add';
    p.sprite.tint = opts.color !== undefined ? opts.color : 0xffffff;
    p.sprite.rotation = opts.rotation || 0;
    p.sprite.visible = true;

    p.active = true;
    p.x = opts.x;
    p.y = opts.y;
    p.vx = opts.vx;
    p.vy = opts.vy;
    p.gravity = opts.gravity ?? 0;
    p.friction = opts.friction ?? 1;
    p.life = 0;
    p.maxLife = opts.maxLife;
    p.scaleStart = opts.scaleStart ?? 1;
    p.scaleEnd = opts.scaleEnd ?? 0;
    p.scaleXMult = opts.scaleXMult ?? 1;
    p.scaleYMult = opts.scaleYMult ?? 1;
    p.alphaStart = opts.alphaStart ?? 1;
    p.alphaEnd = opts.alphaEnd ?? 0;
    p.rotation = opts.rotation || 0;
    p.vRot = opts.vRot ?? 0;
    p.growth = opts.growth ?? 1;
    p.inwardTarget = opts.inwardTarget;

    p.sprite.x = p.x;
    p.sprite.y = p.y;
    p.sprite.scale.set(p.scaleStart * p.scaleXMult, p.scaleStart * p.scaleYMult);
    p.sprite.alpha = p.alphaStart;
  };

  useImperativeHandle(ref, () => ({
    // 🩸 Visceral Fluid / Energy Mist Spatters (Surface layer)
    spawnFluidSpatters(cx: number, cy: number, color = '#dc2626', isCrit = false) {
      const surface = surfaceContainerRef.current;
      const textures = texturesRef.current;
      if (!surface || !textures.sparkSoft) return;

      const dropCount = isCrit ? 26 : 14;
      for (let i = 0; i < dropCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (isCrit ? 9 : 5.5) + 2;
        const maxLife = Math.floor(Math.random() * 20 + 16);

        spawnParticle({
          texture: textures.sparkSoft,
          container: surface,
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          friction: 0.91,
          gravity: 0.35,
          color,
          blendMode: 'normal',
          scaleStart: Math.random() * 0.35 + 0.15,
          scaleEnd: 0.05,
          alphaStart: 0.95,
          alphaEnd: 0,
          maxLife,
        });

        // Surface residual puddle
        if (Math.random() > 0.45) {
          const puddle = new Sprite(textures.sparkSoft);
          puddle.anchor.set(0.5);
          puddle.position.set(
            cx + Math.cos(angle) * (speed * 7),
            cy + Math.sin(angle) * (speed * 7)
          );
          puddle.rotation = angle;
          puddle.tint = color;
          puddle.blendMode = 'normal';
          puddle.scale.set((Math.random() * 0.4 + 0.2), (Math.random() * 0.18 + 0.08));
          puddle.alpha = 0.8;
          surface.addChild(puddle);

          gsap.to(puddle, {
            alpha: 0,
            duration: 0.65,
            delay: 0.25,
            ease: 'power2.out',
            onComplete: () => {
              surface.removeChild(puddle);
              puddle.destroy();
            },
          });
        }
      }
    },

    // 🐉 MALAKOR / BEAST: Torrent of Primal Fire Breath & Magma Claws
    spawnPrimalFireBreath(fromX: number, fromY: number, toX: number, toY: number) {
      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      if (!bloom || !textures.flame1) return;

      const dx = toX - fromX;
      const dy = toY - fromY;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      // 1. Rapid fire breath stream using painted flame textures
      const streamCount = 38;
      const flameTextures = [textures.flame1, textures.flame2, textures.flame3];
      const fireColors = ['#ffffff', '#fde047', '#f97316', '#ef4444', '#b91c1c'];

      for (let i = 0; i < streamCount; i++) {
        const progress = i / streamCount;
        const delayMs = progress * 140;

        setTimeout(() => {
          const spreadAngle = angle + (Math.random() - 0.5) * 0.44;
          const speed = (dist / 14) * (Math.random() * 0.38 + 0.82);
          const chosenTex = flameTextures[Math.floor(Math.random() * flameTextures.length)] || textures.flame1;
          const chosenCol = fireColors[Math.floor(Math.random() * fireColors.length)];

          spawnParticle({
            texture: chosenTex,
            container: bloom,
            x: fromX,
            y: fromY,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed - 0.8,
            friction: 0.98,
            color: chosenCol,
            blendMode: 'add',
            scaleStart: Math.random() * 0.3 + 0.25,
            scaleEnd: Math.random() * 0.8 + 0.5,
            growth: 1.035,
            alphaStart: 0.95,
            alphaEnd: 0,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.25,
            maxLife: Math.floor(Math.random() * 16 + 14),
          });
        }, delayMs);
      }

      // 2. Twin Magma Claws tearing across target at impact point
      setTimeout(() => {
        const offsets = [-28, 0, 28];
        offsets.forEach((offset, idx) => {
          const slashSprite = new Sprite(textures.slash1 || textures.sparkSoft);
          slashSprite.anchor.set(0.5);
          slashSprite.position.set(toX + offset * 0.6, toY + offset);
          slashSprite.rotation = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
          slashSprite.tint = idx === 1 ? '#ff3b00' : '#ff9900';
          slashSprite.blendMode = 'add';
          slashSprite.scale.set(0.4, 0.6);
          slashSprite.alpha = 1;
          bloom.addChild(slashSprite);

          gsap.to(slashSprite.scale, {
            x: 1.5,
            y: 2.0,
            duration: 0.28,
            ease: 'power2.out',
          });
          gsap.to(slashSprite, {
            alpha: 0,
            duration: 0.28,
            ease: 'power2.out',
            onComplete: () => {
              bloom.removeChild(slashSprite);
              slashSprite.destroy();
            },
          });
        });

        this.spawn3DImpactBurst(toX, toY, '#f97316', true);
        this.spawnFluidSpatters(toX, toY, '#ef4444', false);
      }, 160);
    },

    // 🤖 AUTOMATA / MECH: Focused Ion Railgun Laser & Overcharge Discharge
    spawnIonLaser(fromX: number, fromY: number, toX: number, toY: number) {
      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      if (!bloom) return;

      // 1. Muzzle convergence particles
      if (textures.sparkHard) {
        for (let i = 0; i < 14; i++) {
          const angle = Math.random() * Math.PI * 2;
          const rad = Math.random() * 40 + 20;
          spawnParticle({
            texture: textures.sparkHard,
            container: bloom,
            x: fromX + Math.cos(angle) * rad,
            y: fromY + Math.sin(angle) * rad,
            vx: -Math.cos(angle) * 4.5,
            vy: -Math.sin(angle) * 4.5,
            color: '#00f0ff',
            blendMode: 'add',
            scaleStart: 0.3,
            scaleEnd: 0.05,
            alphaStart: 0.95,
            alphaEnd: 0,
            maxLife: 10,
          });
        }
      }

      // 2. High-power dual-core laser beam
      const beamGraphics = new Graphics();
      beamGraphics.blendMode = 'add';
      bloom.addChild(beamGraphics);

      const dx = toX - fromX;
      const dy = toY - fromY;
      const steps = 6;
      const arcOffsets = Array.from({ length: steps - 1 }).map(() => ({
        ox: (Math.random() - 0.5) * 26,
        oy: (Math.random() - 0.5) * 26,
      }));

      const redrawBeam = (alpha: number, widthMult: number) => {
        beamGraphics.clear();

        // Outer cyan glow beam
        beamGraphics
          .moveTo(fromX, fromY)
          .lineTo(toX, toY)
          .stroke({ color: 0x00f0ff, width: 26 * widthMult, alpha: alpha * 0.85 });

        // Core white blinding ray
        beamGraphics
          .moveTo(fromX, fromY)
          .lineTo(toX, toY)
          .stroke({ color: 0xffffff, width: 8 * widthMult, alpha });

        // Electric arcs
        let px = fromX;
        let py = fromY;
        for (let s = 1; s < steps; s++) {
          const t = s / steps;
          const nx = fromX + dx * t + arcOffsets[s - 1].ox * (Math.random() * 0.5 + 0.75);
          const ny = fromY + dy * t + arcOffsets[s - 1].oy * (Math.random() * 0.5 + 0.75);
          beamGraphics
            .moveTo(px, py)
            .lineTo(nx, ny)
            .stroke({ color: 0xe0f2fe, width: 2 * widthMult, alpha: alpha * 0.9 });
          px = nx;
          py = ny;
        }
        beamGraphics
          .moveTo(px, py)
          .lineTo(toX, toY)
          .stroke({ color: 0xe0f2fe, width: 2 * widthMult, alpha: alpha * 0.9 });
      };

      redrawBeam(1, 1);

      const anim = { progress: 0 };
      gsap.to(anim, {
        progress: 1,
        duration: 0.26,
        ease: 'power2.out',
        onUpdate: () => {
          const a = 1 - anim.progress;
          const w = 1 - anim.progress * 0.45;
          redrawBeam(a, w);
        },
        onComplete: () => {
          bloom.removeChild(beamGraphics);
          beamGraphics.destroy();
        },
      });

      // 3. Impact sparks and slag spray
      this.spawn3DImpactBurst(toX, toY, '#00f0ff', true);
      this.spawnFluidSpatters(toX, toY, '#38bdf8', false);
    },

    // 🔮 VOIDBORN: Abyssal Singularity Vortex & Dimension Fissure
    spawnVoidSingularity(cx: number, cy: number) {
      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      if (!bloom) return;

      // 1. Inward contracting gravity pulse (using glow-ring)
      if (textures.glowRing) {
        const ring = new Sprite(textures.glowRing);
        ring.anchor.set(0.5);
        ring.position.set(cx, cy);
        ring.tint = '#a855f7';
        ring.blendMode = 'add';
        ring.scale.set(2.2);
        ring.alpha = 0.85;
        bloom.addChild(ring);

        gsap.to(ring.scale, {
          x: 0.15,
          y: 0.15,
          duration: 0.35,
          ease: 'power2.in',
        });
        gsap.to(ring, {
          alpha: 0,
          duration: 0.35,
          ease: 'power2.in',
          onComplete: () => {
            bloom.removeChild(ring);
            ring.destroy();
          },
        });
      }

      // 2. Inward dark matter spiral particles (void-wisp)
      if (textures.voidWisp) {
        for (let i = 0; i < 36; i++) {
          const theta = (i / 36) * Math.PI * 2;
          const r = Math.random() * 75 + 35;
          const px = cx + Math.cos(theta) * r;
          const py = cy + Math.sin(theta) * r;
          const color = Math.random() > 0.4 ? '#c084fc' : '#ec4899';

          spawnParticle({
            texture: textures.voidWisp,
            container: bloom,
            x: px,
            y: py,
            vx: -Math.cos(theta) * 3 - Math.sin(theta) * 4,
            vy: -Math.sin(theta) * 3 + Math.cos(theta) * 4,
            inwardTarget: { cx, cy, speed: 3.2, spiralSpeed: 4.2 },
            color,
            blendMode: 'add',
            scaleStart: Math.random() * 0.4 + 0.3,
            scaleEnd: 0.05,
            alphaStart: 1,
            alphaEnd: 0,
            rotation: Math.random() * Math.PI,
            vRot: 0.22,
            maxLife: 24,
          });
        }
      }

      // 3. Abyssal tendril slashes
      if (textures.slash3) {
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2 + Math.PI / 6;
          const slash = new Sprite(textures.slash3);
          slash.anchor.set(0.1, 0.5);
          slash.position.set(cx, cy);
          slash.rotation = angle;
          slash.tint = '#9333ea';
          slash.blendMode = 'add';
          slash.scale.set(0.3, 0.5);
          slash.alpha = 1;
          bloom.addChild(slash);

          gsap.to(slash.scale, {
            x: 1.4,
            y: 1.2,
            duration: 0.32,
            ease: 'power2.out',
          });
          gsap.to(slash, {
            alpha: 0,
            duration: 0.32,
            ease: 'power2.out',
            onComplete: () => {
              bloom.removeChild(slash);
              slash.destroy();
            },
          });
        }
      }

      this.spawn3DImpactBurst(cx, cy, '#9333ea', false);
      this.spawnFluidSpatters(cx, cy, '#a855f7', false);
    },

    // ✨ CELESTIAL: Orbital Starlight Lance & Astral Constellation
    spawnCelestialOrbitalLance(cx: number, cy: number) {
      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      const app = appRef.current;
      if (!bloom || !app) return;

      const screenH = app.renderer.height;

      // 1. Blinding celestial orbital beam from top of screen
      const pillar = new Graphics();
      pillar.blendMode = 'add';
      pillar
        .rect(cx - 35, 0, 70, screenH)
        .fill({ color: 0x38bdf8, alpha: 0.65 })
        .rect(cx - 12, 0, 24, screenH)
        .fill({ color: 0xffffff, alpha: 0.95 });
      bloom.addChild(pillar);

      gsap.to(pillar, {
        alpha: 0,
        duration: 0.38,
        ease: 'power3.out',
        onComplete: () => {
          bloom.removeChild(pillar);
          pillar.destroy();
        },
      });

      // 2. 8-Point Starlight Nova Starburst
      if (textures.star4pt) {
        for (let i = 0; i < 24; i++) {
          const angle = (i / 24) * Math.PI * 2;
          const speed = Math.random() * 6.5 + 3.5;
          spawnParticle({
            texture: textures.star4pt,
            container: bloom,
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            friction: 0.95,
            color: '#fef08a',
            blendMode: 'add',
            scaleStart: Math.random() * 0.45 + 0.3,
            scaleEnd: 0.05,
            alphaStart: 1,
            alphaEnd: 0,
            rotation: 0,
            vRot: 0.12,
            maxLife: 26,
          });
        }
      }

      this.spawn3DImpactBurst(cx, cy, '#fef08a', true);
      this.spawnFluidSpatters(cx, cy, '#0284c7', false);
    },

    // 🧪 ALCHEMIST: Caustic Acid Geyser & Toxic Fume Bubbles
    spawnAlchemistCausticSpray(cx: number, cy: number) {
      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      if (!bloom) return;

      const smokeTextures = [textures.smoke1, textures.smoke2, textures.smoke3, textures.smoke4].filter(Boolean);
      for (let i = 0; i < 36; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2.5;
        const chosenTex = smokeTextures[Math.floor(Math.random() * smokeTextures.length)] || textures.sparkSoft;
        const color = Math.random() > 0.5 ? '#22c55e' : '#84cc16';

        spawnParticle({
          texture: chosenTex,
          container: bloom,
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.8,
          friction: 0.94,
          gravity: -0.05, // Bubbles float up gently
          color,
          blendMode: 'add',
          scaleStart: Math.random() * 0.25 + 0.15,
          scaleEnd: Math.random() * 0.6 + 0.45,
          growth: 1.025,
          alphaStart: 0.95,
          alphaEnd: 0,
          rotation: Math.random() * Math.PI,
          vRot: 0.1,
          maxLife: 32,
        });
      }

      this.spawn3DImpactBurst(cx, cy, '#22c55e', false);
      this.spawnFluidSpatters(cx, cy, '#15803d', false);
    },

    // 🏴‍☠️ PIRATE: Rapid Cutlass Flurry & Golden Doubloon Shower
    spawnPirateFlurry(cx: number, cy: number) {
      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      if (!bloom) return;

      // Cutlass slash 1
      const slash1 = new Sprite(textures.slash1 || textures.sparkSoft);
      slash1.anchor.set(0.5);
      slash1.position.set(cx, cy);
      slash1.rotation = Math.PI / 4;
      slash1.tint = '#fbbf24';
      slash1.blendMode = 'add';
      slash1.scale.set(0.5, 0.8);
      slash1.alpha = 1;
      bloom.addChild(slash1);

      gsap.to(slash1.scale, { x: 1.6, y: 2.2, duration: 0.22, ease: 'power2.out' });
      gsap.to(slash1, {
        alpha: 0,
        duration: 0.22,
        ease: 'power2.out',
        onComplete: () => {
          bloom.removeChild(slash1);
          slash1.destroy();
        },
      });

      // Staggered cross-slash 2
      setTimeout(() => {
        const slash2 = new Sprite(textures.slash2 || textures.sparkSoft);
        slash2.anchor.set(0.5);
        slash2.position.set(cx, cy);
        slash2.rotation = -Math.PI / 4;
        slash2.tint = '#ffffff';
        slash2.blendMode = 'add';
        slash2.scale.set(0.5, 0.8);
        slash2.alpha = 1;
        bloom.addChild(slash2);

        gsap.to(slash2.scale, { x: 1.6, y: 2.2, duration: 0.22, ease: 'power2.out' });
        gsap.to(slash2, {
          alpha: 0,
          duration: 0.22,
          ease: 'power2.out',
          onComplete: () => {
            bloom.removeChild(slash2);
            slash2.destroy();
          },
        });

        // Bouncing golden aether doubloons
        if (textures.coin) {
          for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6.5 + 3;
            spawnParticle({
              texture: textures.coin,
              container: bloom,
              x: cx,
              y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 3.5,
              friction: 0.96,
              gravity: 0.42,
              color: '#f59e0b',
              blendMode: 'add',
              scaleStart: Math.random() * 0.35 + 0.25,
              scaleEnd: 0.1,
              alphaStart: 1,
              alphaEnd: 0,
              rotation: Math.random() * Math.PI,
              vRot: 0.25,
              maxLife: 32,
            });
          }
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
      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      if (!bloom) return;

      const streak = new Graphics();
      streak.blendMode = 'add';
      streak
        .moveTo(fromX, fromY)
        .lineTo(toX, toY)
        .stroke({ color, width: 22, alpha: 0.85 });
      bloom.addChild(streak);

      gsap.to(streak, {
        alpha: 0,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          bloom.removeChild(streak);
          streak.destroy();
        },
      });

      if (textures.sparkSoft) {
        const steps = 8;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const px = fromX + (toX - fromX) * t + (Math.random() - 0.5) * 16;
          const py = fromY + (toY - fromY) * t + (Math.random() - 0.5) * 16;
          spawnParticle({
            texture: textures.sparkSoft,
            container: bloom,
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 2.5,
            vy: (Math.random() - 0.5) * 2.5,
            color,
            blendMode: 'add',
            scaleStart: Math.random() * 0.3 + 0.15,
            scaleEnd: 0.05,
            alphaStart: 0.9,
            alphaEnd: 0,
            maxLife: 14,
          });
        }
      }
    },

    spawnTargetReticle(x: number, y: number, color = '#ef4444') {
      const surface = surfaceContainerRef.current;
      if (!surface) return;

      const reticle = new Graphics();
      surface.addChild(reticle);

      const half = 36;
      const cornerLen = half * 0.45;

      const drawReticle = (alpha: number, scale: number) => {
        reticle.clear();
        reticle.position.set(x, y);
        reticle.scale.set(scale);

        // 4 corner brackets
        reticle
          .moveTo(-half, -half + cornerLen).lineTo(-half, -half).lineTo(-half + cornerLen, -half)
          .moveTo(half - cornerLen, -half).lineTo(half, -half).lineTo(half, -half + cornerLen)
          .moveTo(-half, half - cornerLen).lineTo(-half, half).lineTo(-half + cornerLen, half)
          .moveTo(half - cornerLen, half).lineTo(half, half).lineTo(half, half - cornerLen)
          .stroke({ color, width: 2.8, alpha });
      };

      drawReticle(1, 1.35);

      const anim = { scale: 1.35, alpha: 1 };
      gsap.to(anim, {
        scale: 0.95,
        alpha: 0,
        duration: 0.36,
        ease: 'power2.out',
        onUpdate: () => drawReticle(anim.alpha, anim.scale),
        onComplete: () => {
          surface.removeChild(reticle);
          reticle.destroy();
        },
      });
    },

    spawn3DImpactBurst(x: number, y: number, color = '#ff2a5f', isCrit = false) {
      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      const bloomFilter = bloomFilterRef.current;
      if (!bloom) return;

      // 1. Perspective 3D Shockwave Ring (glow-ring)
      if (textures.glowRing) {
        const ring = new Sprite(textures.glowRing);
        ring.anchor.set(0.5);
        ring.position.set(x, y);
        ring.tint = isCrit ? '#ffd700' : color;
        ring.blendMode = 'add';
        ring.scale.set(0.2, 0.09); // Perspective compression for 3D floor feel
        ring.alpha = 1;
        bloom.addChild(ring);

        const targetScaleX = isCrit ? 2.6 : 1.7;
        const targetScaleY = targetScaleX * 0.44;

        gsap.to(ring.scale, {
          x: targetScaleX,
          y: targetScaleY,
          duration: isCrit ? 0.38 : 0.28,
          ease: 'power2.out',
        });
        gsap.to(ring, {
          alpha: 0,
          duration: isCrit ? 0.38 : 0.28,
          ease: 'power2.out',
          onComplete: () => {
            bloom.removeChild(ring);
            ring.destroy();
          },
        });
      }

      // 2. Impact Flash Core
      const flashTex = textures.sparkHard || textures.sparkSoft;
      if (flashTex) {
        const flash = new Sprite(flashTex);
        flash.anchor.set(0.5);
        flash.position.set(x, y);
        flash.tint = isCrit ? '#ffffff' : color;
        flash.blendMode = 'add';
        flash.scale.set(isCrit ? 1.6 : 1.0);
        flash.alpha = 1;
        bloom.addChild(flash);

        gsap.to(flash.scale, {
          x: isCrit ? 2.4 : 1.5,
          y: isCrit ? 2.4 : 1.5,
          duration: 0.16,
          ease: 'power2.out',
        });
        gsap.to(flash, {
          alpha: 0,
          duration: 0.16,
          ease: 'power2.out',
          onComplete: () => {
            bloom.removeChild(flash);
            flash.destroy();
          },
        });
      }

      // 3. Debris & Spark Particles
      const debrisTex = textures.sparkHard || textures.sparkSoft;
      if (debrisTex) {
        const debrisCount = isCrit ? 26 : 16;
        const debrisPalette = isCrit
          ? ['#ffd700', '#ffffff', '#f97316', '#fbbf24']
          : [color, '#ffffff', '#ffd700', '#38bdf8'];

        for (let i = 0; i < debrisCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * (isCrit ? 12 : 7.5) + 3;
          const chosenColor = debrisPalette[Math.floor(Math.random() * debrisPalette.length)];

          spawnParticle({
            texture: debrisTex,
            container: bloom,
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (Math.random() * 3.5 + 1.5),
            friction: 0.94,
            gravity: 0.32,
            color: chosenColor,
            blendMode: 'add',
            scaleStart: Math.random() * (isCrit ? 0.45 : 0.3) + 0.18,
            scaleEnd: 0.05,
            alphaStart: 1,
            alphaEnd: 0,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.3,
            maxLife: Math.floor(Math.random() * 20 + 14),
          });
        }
      }

      // 4. Critical Hit Bloom Pulse
      if (isCrit && bloomFilter) {
        gsap.fromTo(
          bloomFilter,
          { bloomScale: 2.2, brightness: 1.35 },
          { bloomScale: 1.4, brightness: 1.05, duration: 0.22, ease: 'power2.out' }
        );
      }
    },

    // 🏷️ Floating Damage Numbers (NON-BLOOMED UI Layer for sub-pixel sharpness)
    spawnFloatingDamage(x: number, y: number, text: string, type: 'NORMAL' | 'CRIT' | 'SHIELD' | 'HEAL' = 'NORMAL') {
      const ui = uiContainerRef.current;
      if (!ui) return;

      let fill = '#ffffff';
      let strokeColor = '#991b1b';
      let fontSize = 30;
      let strokeWidth = 4;
      let isCrit = false;

      if (type === 'CRIT') {
        fill = '#fef08a';
        strokeColor = '#78350f';
        fontSize = 42;
        strokeWidth = 6;
        isCrit = true;
      } else if (type === 'SHIELD') {
        fill = '#67e8f9';
        strokeColor = '#0e7490';
        fontSize = 26;
        strokeWidth = 4;
      } else if (type === 'HEAL') {
        fill = '#86efac';
        strokeColor = '#166534';
        fontSize = 28;
        strokeWidth = 4;
      }

      const textObj = new Text({
        text,
        style: {
          fontFamily: 'Cinzel, serif',
          fontSize,
          fontWeight: '900',
          fill,
          stroke: { color: strokeColor, width: strokeWidth },
          align: 'center',
        },
      });

      textObj.anchor.set(0.5);
      textObj.position.set(x, y - 10);
      ui.addChild(textObj);

      floatingTextsRef.current.push({
        textObj,
        x,
        y: y - 10,
        vx: (Math.random() - 0.5) * 1.8,
        vy: isCrit ? -9.5 : -8,
        life: 0,
        maxLife: isCrit ? 48 : 38,
        isCrit,
        baseSize: fontSize,
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
      this.spawn3DImpactBurst(x, y, '#00f0ff', true);

      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      if (!bloom || !textures.star4pt) return;

      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const speed = Math.random() * 8 + 4;
        spawnParticle({
          texture: textures.star4pt,
          container: bloom,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          friction: 0.94,
          color: '#67e8f9',
          blendMode: 'add',
          scaleStart: 0.35,
          scaleEnd: 0.05,
          alphaStart: 1,
          alphaEnd: 0,
          rotation: Math.random() * Math.PI,
          vRot: 0.2,
          maxLife: 22,
        });
      }
    },

    spawnSlashArc(x1: number, y1: number, x2: number, y2: number, color = '#ff2a5f') {
      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      if (!bloom) return;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const dist = Math.hypot(x2 - x1, y2 - y1);

      const slash = new Sprite(textures.slash1 || textures.sparkSoft);
      slash.anchor.set(0.5);
      slash.position.set(midX, midY);
      slash.rotation = angle;
      slash.tint = color;
      slash.blendMode = 'add';
      slash.scale.set((dist / 140) * 0.6, 0.8);
      slash.alpha = 1;
      bloom.addChild(slash);

      gsap.to(slash.scale, {
        x: (dist / 140) * 1.4,
        y: 1.6,
        duration: 0.24,
        ease: 'power2.out',
      });
      gsap.to(slash, {
        alpha: 0,
        duration: 0.24,
        ease: 'power2.out',
        onComplete: () => {
          bloom.removeChild(slash);
          slash.destroy();
        },
      });
    },

    spawnCleaveWave(x: number, y: number, width: number) {
      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      if (!bloom) return;

      const wave = new Sprite(textures.slash2 || textures.glowRing || textures.sparkSoft);
      wave.anchor.set(0.5);
      wave.position.set(x, y);
      wave.tint = '#ff6600';
      wave.blendMode = 'add';
      wave.scale.set((width / 120) * 0.5, 0.4);
      wave.alpha = 1;
      bloom.addChild(wave);

      gsap.to(wave.scale, {
        x: (width / 120) * 1.6,
        y: 1.2,
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to(wave, {
        alpha: 0,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          bloom.removeChild(wave);
          wave.destroy();
        },
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
      const bloom = bloomContainerRef.current;
      const textures = texturesRef.current;
      if (!bloom) return;

      const tex = textures.sparkHard || textures.sparkSoft;
      const auraTex = textures.sparkSoft;

      const orbSprite = new Sprite(tex);
      orbSprite.anchor.set(0.5);
      orbSprite.tint = '#ffd700';
      orbSprite.blendMode = 'add';
      orbSprite.scale.set(0.9);

      const auraSprite = new Sprite(auraTex);
      auraSprite.anchor.set(0.5);
      auraSprite.tint = '#f97316';
      auraSprite.blendMode = 'add';
      auraSprite.scale.set(1.5);

      bloom.addChild(auraSprite);
      bloom.addChild(orbSprite);

      heroOrbsRef.current.push({
        sprite: orbSprite,
        aura: auraSprite,
        x1,
        y1,
        x2,
        y2,
        progress: 0,
        onImpact,
      });
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDestroyed = false;
    let appDestroyed = false;
    const app = new Application();
    appRef.current = app;

    const destroyApp = () => {
      if (appDestroyed) return;
      appDestroyed = true;
      try {
        if (bloomContainerRef.current) {
          bloomContainerRef.current.filters = [];
        }
        if (bloomFilterRef.current) {
          bloomFilterRef.current.destroy();
          bloomFilterRef.current = null;
        }
        app.destroy(true, { children: true, texture: false, textureSource: false });
      } catch {
        // Ignore cleanup errors
      }
    };

    const initPixi = async () => {
      await app.init({
        resizeTo: container,
        backgroundAlpha: 0,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        antialias: true,
      });

      if (isDestroyed) {
        destroyApp();
        return;
      }

      container.appendChild(app.canvas);

      // Preload the 16 painted textures
      try {
        const loaded = await Assets.load(Object.values(TEXTURE_URLS));
        const entries = Object.entries(TEXTURE_URLS) as [TextureKey, string][];
        entries.forEach(([key, url]) => {
          texturesRef.current[key] = loaded[url] || Texture.WHITE;
        });
      } catch (err) {
        console.warn('VFX texture preloading fallback:', err);
      }

      // Layer 1: Surface layer (normal blend mode for visceral spatters & residual puddles)
      const surfaceContainer = new Container();
      surfaceContainerRef.current = surfaceContainer;
      app.stage.addChild(surfaceContainer);

      // Layer 2: Bloom layer (AdvancedBloomFilter with real light bleed & additive blend)
      const bloomContainer = new Container();
      const bloomFilter = new AdvancedBloomFilter({
        threshold: 0.15,
        bloomScale: 1.4,
        brightness: 1.05,
        quality: 4,
      });
      bloomContainer.filters = [bloomFilter];
      bloomContainerRef.current = bloomContainer;
      bloomFilterRef.current = bloomFilter;
      app.stage.addChild(bloomContainer);

      // Layer 3: Unbloomed UI layer (crisp floating damage text)
      const uiContainer = new Container();
      uiContainerRef.current = uiContainer;
      app.stage.addChild(uiContainer);

      // 60 FPS Ticker loop
      app.ticker.add((ticker) => {
        const delta = ticker.deltaTime;

        // 1. Update pooled particles
        const pool = particlePoolRef.current;
        for (let i = 0; i < pool.length; i++) {
          const p = pool[i];
          if (!p.active) continue;

          p.life += delta;
          if (p.life >= p.maxLife) {
            p.active = false;
            p.sprite.visible = false;
            continue;
          }

          const t = p.life / p.maxLife;

          if (p.inwardTarget) {
            const dx = p.inwardTarget.cx - p.x;
            const dy = p.inwardTarget.cy - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            const nx = dx / dist;
            const ny = dy / dist;

            // Inward radial pull + tangential spiral swirl
            p.x += (nx * p.inwardTarget.speed - ny * p.inwardTarget.spiralSpeed) * delta;
            p.y += (ny * p.inwardTarget.speed + nx * p.inwardTarget.spiralSpeed) * delta;
          } else {
            p.vx *= Math.pow(p.friction, delta);
            p.vy += p.gravity * delta;
            p.x += p.vx * delta;
            p.y += p.vy * delta;
          }

          p.rotation += p.vRot * delta;

          let curScale = p.scaleStart + (p.scaleEnd - p.scaleStart) * t;
          if (p.growth !== 1) {
            curScale *= Math.pow(p.growth, p.life);
          }
          const curAlpha = p.alphaStart + (p.alphaEnd - p.alphaStart) * t;

          p.sprite.x = p.x;
          p.sprite.y = p.y;
          p.sprite.scale.set(curScale * p.scaleXMult, curScale * p.scaleYMult);
          p.sprite.alpha = Math.max(0, curAlpha);
          p.sprite.rotation = p.rotation;
        }

        // 2. Update floating damage numbers
        const texts = floatingTextsRef.current;
        for (let i = texts.length - 1; i >= 0; i--) {
          const ft = texts[i];
          ft.life += delta;
          ft.x += ft.vx * delta;
          ft.y += ft.vy * delta;
          ft.vy += 0.38 * delta;
          ft.vx *= 0.96;

          const progress = ft.life / ft.maxLife;
          const alpha = Math.max(0, 1 - progress);
          const scale = ft.isCrit
            ? 1 + Math.sin(progress * Math.PI * 0.7) * 0.45
            : 1 + Math.sin(progress * Math.PI * 0.6) * 0.22;

          ft.textObj.x = ft.x;
          ft.textObj.y = ft.y;
          ft.textObj.scale.set(scale);
          ft.textObj.alpha = alpha;

          if (ft.life >= ft.maxLife) {
            uiContainer.removeChild(ft.textObj);
            ft.textObj.destroy();
            texts.splice(i, 1);
          }
        }

        // 3. Update hero energy orbs
        const orbs = heroOrbsRef.current;
        for (let i = orbs.length - 1; i >= 0; i--) {
          const orb = orbs[i];
          orb.progress += 0.032 * delta;

          const curX = orb.x1 + (orb.x2 - orb.x1) * orb.progress;
          const arcY = Math.sin(orb.progress * Math.PI) * -130;
          const curY = orb.y1 + (orb.y2 - orb.y1) * orb.progress + arcY;

          orb.sprite.x = curX;
          orb.sprite.y = curY;
          orb.aura.x = curX;
          orb.aura.y = curY;

          // Trail ember
          if (Math.random() > 0.4 && texturesRef.current.sparkSoft) {
            spawnParticle({
              texture: texturesRef.current.sparkSoft,
              container: bloomContainer,
              x: curX + (Math.random() - 0.5) * 10,
              y: curY + (Math.random() - 0.5) * 10,
              vx: (Math.random() - 0.5) * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              color: '#ffd700',
              blendMode: 'add',
              scaleStart: 0.3,
              scaleEnd: 0.05,
              alphaStart: 0.9,
              alphaEnd: 0,
              maxLife: 12,
            });
          }

          if (orb.progress >= 1) {
            orb.onImpact();
            bloomContainer.removeChild(orb.sprite);
            bloomContainer.removeChild(orb.aura);
            orb.sprite.destroy();
            orb.aura.destroy();
            orbs.splice(i, 1);
          }
        }
      });
    };

    initPixi();

    return () => {
      isDestroyed = true;
      particlePoolRef.current = [];
      floatingTextsRef.current = [];
      heroOrbsRef.current = [];
      destroyApp();
      appRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-[9999] overflow-hidden ${className || ''}`}
    />
  );
});
