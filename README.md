# 🌌 Aetherium: Astral Battlegrounds

> An asynchronous 8-player fantasy auto-battler card game inspired by *Hearthstone Battlegrounds*, crafted in a Dark Steel Runic aesthetic with 3D perspective battlefields, visceral kinetic combat animations, faction-specific signature particle phenomena, and deep astral lore.

---

## ⚔️ Key Features

### 1. 🎴 Dark Steel Runic Card Craft & 3D Parallax Inspection
* **Dark Steel Aesthetic**: Cold charcoal gunmetal frames, etched celestial filigree, runic faction sigils, and responsive 3D tilt illumination.
* **Astral Forged (Golden) Transformation**: Tripling any minion unlocks its golden card form with dynamic holographic foil shimmer, gilded runic borders, and **$2\times$ doubled stats and mechanical triggers**.
* **Interactive 3D Inspector**: Double-click or right-click any card to view its high-res splash artwork in full 3D gyroscope parallax with a Standard $\leftrightarrow$ Golden preview toggle.

### 2. 🏛️ The Astral Codex & World Lore
* **Lore-Flow Driven Worldbuilding**: Explore the history of the Astral Convergence across the 6 major realms:
  * 🕰️ *Chronos Clockwork Spires* (Automata)
  * 🔮 *The Abyssal Rift* (Voidborn)
  * 🐺 *Untamed Primal Expanse* (Beasts)
  * ✨ *Astral Apex Observatory* (Celestial)
  * 🧪 *Subterranean Crucible* (Alchemists)
  * 🏴‍☠️ *Nebula Shallows* (Void Corsairs)
* **Comprehensive Minion & Commander Bestiary**: Detailed lore excerpts and mechanical breakdowns for every unit in the 36-card roster.

### 3. 🎬 Studio-Grade Combat & Additive-Blended Particle Phenomena
* **Multi-Stage Kinetic Attack Sequence**:
  1. *Anticipation & Lift-Off*: Card lifts into 3D z-space with separated dynamic shadow and target lock crosshairs.
  2. *Rocket Dash*: Accelerates along the exact relative vector into the target with luminous dual-core motion speed streaks.
  3. *Impact Collision*: Physical board recoil (`translateZ(-65px)`), micro-pause at contact, and localized card shudder.
  4. *Card Dissolution*: Slain minions overcharge with white-hot luminescence before fracturing into 3D debris shards.
* **Lore-Tied Signature Attack VFX**:
  * 🐉 **Beasts**: *Primal Fire Breath* — cone of 42 rolling flame globes and twin magma claw slashes.
  * 🤖 **Automata**: *Focused Ion Railgun* — pre-charge electrical sparks, thick cyan/white plasma beam, and live arc discharges.
  * 🔮 **Voidborn**: *Abyssal Singularity Vortex* — gravitational inward spiral of 36 dark matter particles and void tendrils.
  * 🧪 **Alchemist**: *Caustic Acid Geyser* — volatile emerald acidic spray with toxic fume clouds.
  * ✨ **Celestial**: *Orbital Starlight Lance* — vertical orbital beam with 8-point geometric starbursts.
  * 🏴‍☠️ **Pirate**: *Cutlass Flurry* — dual rapid cutlass sweeps scattering spinning golden doubloons.
* **Professional Impact Feedback**: Subtle redshift vignette pulse on the screen perimeter and fluid spatters without jarring whole-screen camera shake.

### 4. 🏆 Commander Hero Station & Streak-Scaled Celebrations
* **Bottom-Left Commander Station**: Large hero splash portrait, Tavern Tier badge, dynamic color-threshold health bar, and interactive Hero Power / Passive token with tooltip cards.
* **Hero-Themed Victory Particles**: Rotates between themed geometric particles (gears, void runes, bubbles, embers, starlight, doubloons) across 4 victory modes.
* **Win-Streak Intensity Scaling**:
  * *Streak 1*: Focused thematic burst + fanfare.
  * *Streak 2*: 2x particle volume + rotating aura halo (`⚡ 2X WIN STREAK`).
  * *Streak 3+*: 3.5x particle intensity + screen-border lightning (`🔥 3X+ UNSTOPPABLE STREAK!`).

### 5. 🔊 Studio Audio Soundscape
* Tactile mechanical sound effects: steam reroll lever whooshes, padlock freeze clicks, coin clinks, attack lunges, glass barrier breaks, and victory fanfares.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
* **Card Board & Hero Station**: DOM + CSS 3D transforms (perspective, holo-foil shimmer, tavern-tier layout)
* **Combat VFX**: PixiJS 8 (WebGL) with `pixi-filters` real-time bloom and GSAP-choreographed card shudder/attack dash
* **Build & Dev**: Vite 6, Vitest (100% test coverage on game & combat engine)
* **Design & Styling**: Custom Dark Steel CSS shaders, painted particle textures, Holo-foil keyframes, Cinzel typography

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* npm

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/anishmrao-blr/Autobattler-Card-game.git
cd Autobattler-Card-game

# Install dependencies
npm install

# Start development server
npm run dev

# Run unit test suite
npx vitest run

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser to enter the Aetherium!