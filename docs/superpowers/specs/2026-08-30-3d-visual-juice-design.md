# Design Specification: 3D Visual Juice & WebGL Combat VFX System

**Date**: 2026-08-30  
**Status**: Approved  
**Topic**: High-Fidelity Combat Physics, 60 FPS Particle Shaders, Tactile Tavern Micro-Interactions, and Dynamic Procedural Audio

---

## 1. Objectives & Scope
Upgrade *Aetherium: Astral Battlegrounds* visual and sensory experience using best practices from `game-feel`, `threejs-aaa-graphics-builder`, `shader-programming`, `impeccable`, and `audio-design`:
1. **3D Combat Kinetics**: 4-phase physical attack leaps, parabolic $Z$-axis elevation, squash-and-stretch on impact, directional board tremor.
2. **60 FPS Particle & Shader VFX**: Dynamic critical hit damage numerals, pulsing hexagonal forcefield domes, holographic chromatic aberration foil sheens, and death dissolve embers.
3. **Tactile Tavern Micro-Interactions**: Mechanical freeze padlocks with frosted card frames, spinning brass reroll levers with steam puffs, and elevation card lift physics.
4. **Procedural Dynamic Audio**: Synthetic pitch randomization ($\pm 8\%$), layered sub-bass impact thuds, and distinct barrier break frequencies.

---

## 2. Architecture & Component Blueprint

```
┌─────────────────────────────────────────────────────────────┐
│                       UI / DOM LAYER                        │
│  - CardView (3D Matrix Transforms, Holographic CSS Foil)   │
│  - TavernShop (Mechanical Freeze Padlock, Reroll Cogs)      │
│  - CombatArena3D (Kinetic 4-Phase Physics State Machine)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Coordinates / Bounding Boxes
┌──────────────────────────────▼──────────────────────────────┐
│                    VFX OVERLAY LAYER                        │
│  - CombatVFXCanvas (HTML5 60 FPS Hardware-Accelerated)      │
│    * Parabolic Slash Arcs                                   │
│    * Directional Kinetic Sparks                             │
│    * Hexagonal Barrier Shatter                              │
│    * Critical Hit Number Starbursts                         │
│    * Death Dissolve Embers                                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Trigger Events
┌──────────────────────────────▼──────────────────────────────┐
│                    AUDIO SYNTH LAYER                        │
│  - SoundEngine (Web Audio API with ±8% Pitch Jitter)       │
│    * Mechanical Gear Clicks & Steam Hisses                  │
│    * Resonant Sub-Bass Impact Thuds                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Specifications

### 3.1 3D Kinetic Combat Loop (`src/components/CombatArena3D.tsx`)
* **State Management**: Track active attacker, defender, leap progress $t \in [0, 1]$, and directional offset $(\Delta X, \Delta Y)$.
* **4-Phase Attack Animation**:
  * **Phase 1: Wind-Up ($0 \le t < 0.28$)**:
    * Attacker translation: $Z = +60\text{px}$, pullback along $-\vec{V}$ by $25\text{px}$.
    * Attacker rotation: $\text{rotateX} = -25^\circ \times \text{sign}(\Delta Y)$, scale: $1.15$.
  * **Phase 2: Parabolic Leap ($0.28 \le t < 0.56$)**:
    * Parabolic trajectory: $X(t) = \Delta X \cdot u$, $Y(t) = \Delta Y \cdot u$, $Z(t) = 120 \cdot 4u(1-u)$ where $u = \frac{t - 0.28}{0.28}$.
    * Forward-pitch rotation: $\text{rotateX} = 30^\circ \times \text{sign}(\Delta Y)$, $\text{rotateZ} = \text{tilt}(\Delta X)$.
  * **Phase 3: Impact & Squash ($0.56 \le t < 0.72$)**:
    * Squash matrix: $\text{scaleX} = 1.25, \text{scaleY} = 0.82$.
    * Trigger canvas impact burst at defender coordinate $(X_{\text{def}}, Y_{\text{def}})$.
    * Board directional screen shake: translate entire arena by $(-\vec{V}_{\text{norm}} \times 12\text{px})$ with exponential decay.
    * Defender stagger: translate $30\text{px}$ along $\vec{V}$, $\text{rotateZ} = \pm 10^\circ$.
  * **Phase 4: Spring Recoil & Settle ($0.72 \le t \le 1.0$)**:
    * Attacker and defender interpolate back to baseline with damped harmonic oscillation.

### 3.2 VFX Canvas System (`src/components/CombatVFXCanvas.tsx`)
* **Critical Hit Floating Numbers**:
  * If $\text{damage} \ge 8$ or $\text{isLethal} = \text{true}$:
    * Size: $38\text{px}$ Cinzel font, glowing gold outline (`#ffd700`) with crimson fill (`#ff1744`).
    * Spawns 8 directional golden starburst rays behind the number.
    * Upward floating velocity with deceleration and elastic bounce.
* **Hexagonal Barrier Forcefield & Shatter**:
  * Draws 6-sided polygon overlay with rotating cyan energy filaments around minions with `barrierActive`.
  * On `BARRIER_BROKEN`: emits 18 crystalline glass polygon shards with gravity, rotation, and fading alpha.
* **Dissolve Embers**:
  * On `MINION_DIED`: card position emits 30 rising dark-violet and golden fire sparks with turbulence velocity.

### 3.3 Tavern Polish & Micro-Interactions (`src/components/TavernShop.tsx` & `CardView.tsx`)
* **Freeze Padlock & Frosted Ice Overlay**:
  * When `isFrozen = true`:
    * An ornate brass padlock snaps shut with audio click.
    * Shop minion borders acquire an icy blue frost vignette (`rgba(56, 189, 248, 0.45)`) and snowflake particles.
* **Mechanical Reroll Lever**:
  * Clicking Reroll animates a 3D lever pull (`rotateZ(-35deg)`) and cog rotation with a steam puff.
* **Holographic Golden Card Sheen**:
  * Astral Forged (Golden) minions feature an active animated multi-stop diagonal rainbow sheen (`linear-gradient(115deg, transparent 20%, rgba(255,215,0,0.4) 40%, rgba(0,255,255,0.4) 50%, rgba(255,0,128,0.4) 60%, transparent 80%)`) with infinite shimmer animation.

### 3.4 Procedural Web Audio Engine (`src/audio/sound.ts`)
* **Pitch Randomization**:
  * Helper `applyJitter(baseFreq, semitones = 1.2)` applies a $\pm 8\%$ uniform random pitch variation to ensure every sound feels hand-crafted.
* **Sub-Bass Thud**:
  * Adds a $55\text{Hz} \rightarrow 20\text{Hz}$ sine wave drop for heavy impacts ($>8$ damage).
* **Steam Whistle / Lever Sound**:
  * Bandpass-filtered white noise burst simulating high-pressure steam valve release for Rerolling and Tier Upgrades.

---

## 4. Error Handling & Edge Cases
* **Rapid Combat Events**: If speed is set to $4\times$, all particle lifetimes scale down proportionally to prevent canvas particle overflow.
* **Missing DOM Elements**: Fallback to estimated slot coordinates if `cardElements.current.get(id)` is momentarily unmounted.
* **Audio Context Suspension**: User interaction resume handler ensures audio context initializes seamlessly without browser autoplay blocks.

---

## 5. Verification Plan
* **Visual Verification**:
  * Verify 3D parabolic arcs during combat on both bottom $\rightarrow$ top and top $\rightarrow$ bottom attacks.
  * Verify critical damage numbers trigger for $\ge 8$ damage.
  * Verify Freeze padlock and frost overlay visually lock shop units.
  * Verify Golden cards display active holographic rainbow foil shimmer.
* **Automated Tests**:
  * `npx vitest run` to ensure all engine tests pass without regression.
  * `npm run build` to confirm 0 TypeScript and build errors.
