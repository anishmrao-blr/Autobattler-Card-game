# 3D Visual Juice & WebGL Combat VFX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate *Aetherium: Astral Battlegrounds* visual quality, game feel, and sensory polish with 4-phase 3D kinetic attack leaps, 60 FPS canvas particle shaders (critical hit numbers, hexagonal barrier shatter, death dissolve embers), tavern micro-interactions (freeze padlocks, reroll cogs), and dynamic procedural audio with pitch jitter.

**Architecture:** Hybrid 3D CSS isometric perspective (`rotateX(18deg)`) with hardware-accelerated 60 FPS HTML5 `<canvas>` VFX overlay and pure Web Audio API synthesizer with pitch jitter.

**Tech Stack:** React 19, TypeScript 5.8, Tailwind CSS, Vite, Web Audio API, HTML5 Canvas 2D / WebGL shaders, Canvas Confetti, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-30-3d-visual-juice-design.md`

## Global Constraints
- Pure client-side zero-external-binary dependencies for instant 60 FPS loading.
- Sub-pixel crisp typography on all cards and UI elements.
- All existing game logic and deterministic combat unit tests must remain $100\%$ green.

---

### Task 1: Procedural Web Audio Engine Upgrade with Pitch Jitter & Sub-Bass Thuds

**Files:**
- Modify: `src/audio/sound.ts`

**Interfaces:**
- Produces: `sound.playImpactDamage(isLethal: boolean, isCrit?: boolean)`
- Produces: `sound.playSteamHiss()`
- Produces: `sound.playGearRattle()`
- Produces: `sound.playFreezeLock()`

- [ ] **Step 1: Update `SoundEngine` with frequency jitter and new sound routines**

```typescript
// Add jitter function
private applyJitter(baseFreq: number, semitones = 1.2): number {
  const factor = Math.pow(2, (Math.random() * 2 - 1) * (semitones / 12));
  return baseFreq * factor;
}
```

- [ ] **Step 2: Add sub-bass sine drop for critical impacts ($\ge 8$ damage) and mechanical clicks**
- [ ] **Step 3: Verify sound synthesizer plays smoothly without clipping in browser**
- [ ] **Step 4: Commit**
```bash
git add src/audio/sound.ts
git commit -m "feat(audio): add pitch jitter, sub-bass thuds, and mechanical tavern sounds"
```

---

### Task 2: Holographic Foil Shimmer, Hex Forcefield & Frost Vignette on Cards

**Files:**
- Modify: `src/components/CardView.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `boardMinion.isGolden`, `boardMinion.barrierActive`, `isFrozen`
- Produces: Visual CSS holographic iridescent gradient, hexagonal cyan forcefield ring, icy frost corners

- [ ] **Step 1: Add `@keyframes holoShimmer` and `@keyframes hexPulse` in `src/index.css`**
- [ ] **Step 2: Update `CardView.tsx` with animated foil overlay for Golden/Astral cards**
- [ ] **Step 3: Add pulsing 6-sided hexagonal SVG barrier shield when `barrierActive` is true**
- [ ] **Step 4: Add frost crystal corner accents when card is frozen in shop**
- [ ] **Step 5: Commit**
```bash
git add src/components/CardView.tsx src/index.css
git commit -m "feat(ui): holographic foil, hex barrier shield, and frosty card frames"
```

---

### Task 3: 60 FPS Canvas VFX Upgrade: Critical Damage Numbers, Hex Shatter & Dissolve Embers

**Files:**
- Modify: `src/components/CombatVFXCanvas.tsx`

**Interfaces:**
- Produces: `vfxRef.current.spawnCritNumber(x, y, amount)`
- Produces: `vfxRef.current.spawnBarrierShatter(x, y)`
- Produces: `vfxRef.current.spawnDeathExplosion(x, y)`

- [ ] **Step 1: Implement polygon shard physics class for hexagonal barrier shattering**
- [ ] **Step 2: Implement rising golden/purple ember particles for unit death dissolve**
- [ ] **Step 3: Implement enlarged critical damage floater with starburst radiant rays**
- [ ] **Step 4: Verify 60 FPS rendering in canvas loop without memory leaks**
- [ ] **Step 5: Commit**
```bash
git add src/components/CombatVFXCanvas.tsx
git commit -m "feat(vfx): hexagonal barrier shatter, death dissolve embers, and crit number starbursts"
```

---

### Task 4: Kinetic 4-Phase 3D Combat Physics & Directional Board Tremor

**Files:**
- Modify: `src/components/CombatArena3D.tsx`

**Interfaces:**
- Consumes: `CombatEvent`, `vfxRef`, `sound`
- Produces: 4-phase physical kinetic sequence (Wind-Up, Parabolic Leap, Impact Squash, Spring Recoil)

- [ ] **Step 1: Calculate exact vector $\vec{V} = (X_{\text{def}} - X_{\text{atk}}, Y_{\text{def}} - Y_{\text{atk}})$ and normalized direction**
- [ ] **Step 2: Implement Phase 1 Wind-Up (tilt backward, elevate in $Z$)**
- [ ] **Step 3: Implement Phase 2 Parabolic Leap ($Z = +120\text{px}$ apex altitude)**
- [ ] **Step 4: Implement Phase 3 Impact & Squash (`scaleX: 1.25, scaleY: 0.85`), directional arena shake, and crit detection ($\ge 8$)**
- [ ] **Step 5: Implement Phase 4 Spring Recoil & Settle**
- [ ] **Step 6: Commit**
```bash
git add src/components/CombatArena3D.tsx
git commit -m "feat(combat): 4-phase parabolic kinetic leap and directional board tremors"
```

---

### Task 5: Tactile Tavern Polish: Mechanical Freeze Padlock & Spinning Reroll Cogs

**Files:**
- Modify: `src/components/TavernShop.tsx`

**Interfaces:**
- Consumes: `isFrozen`, `tavern.freeze()`, `tavern.reroll()`
- Produces: Brass padlock snap animation and spinning gear lever pull on reroll

- [ ] **Step 1: Add animated brass padlock icon with lock/unlock transition**
- [ ] **Step 2: Add rotating gear cogs and steam particle burst on Reroll click**
- [ ] **Step 3: Connect audio triggers for gear clicks and steam valve release**
- [ ] **Step 4: Commit**
```bash
git add src/components/TavernShop.tsx
git commit -m "feat(tavern): tactile freeze padlock, steam reroll lever, and mechanical sounds"
```

---

### Task 6: End-to-End Verification & Test Suite

**Files:**
- Verify: `src/tests/engine.test.ts`
- Verify: `npm run build`

- [ ] **Step 1: Run `npx vitest run` to verify all engine tests pass**
- [ ] **Step 2: Run `npm run build` to confirm 0 TypeScript / compilation errors**
- [ ] **Step 3: Commit**
```bash
git add .
git commit -m "chore: verify build and test suite passing"
```
