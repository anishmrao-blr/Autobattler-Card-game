// Real High-Fidelity Audio Engine using Game-Sound-Effects Collection

class SoundEngine {
  private muted: boolean = false;
  private audioPool: Map<string, HTMLAudioElement[]> = new Map();
  private maxPoolSize: number = 5;
  private volume: number = 0.7;

  private soundUrls = {
    coin: '/assets/audio/coin.wav',
    coinsClink: '/assets/audio/coins_clinking.wav',
    cashRegister: '/assets/audio/cash_register_sfx.wav',
    castSpell: '/assets/audio/cast_a_spell_sound.wav',
    magicShot: '/assets/audio/short_magic_shot.wav',
    whoosh: '/assets/audio/WHOOSH.WAV',
    attackLeap: '/assets/audio/minty_attack.wav',
    smack: '/assets/audio/smack.wav',
    donk: '/assets/audio/donk.wav',
    donk2: '/assets/audio/donk2.wav',
    hammer: '/assets/audio/HAMMER.WAV',
    voltage: '/assets/audio/VOLTAGE.WAV',
    laser: '/assets/audio/laser_shot.wav',
    laser2: '/assets/audio/laser_shot2.wav',
    windowBreak: '/assets/audio/windowBreak.wav',
    protect: '/assets/audio/protect_sound.wav',
    starCollect: '/assets/audio/cat_star_collect.wav',
    healing: '/assets/audio/wildrumble_healing.wav',
    victory: '/assets/audio/victory_confetti.wav',
    cheer: '/assets/audio/crowd_cheer_sfx.wav',
    defeat: '/assets/audio/oh_no.wav',
    badBoing: '/assets/audio/badBoing.wav',
    drumroll: '/assets/audio/DRUMROLL.WAV',
    reminder: '/assets/audio/Reminder.wav',
    chime: '/assets/audio/chime1.wav',
    ding: '/assets/audio/ding_ding.wav',
    boop: '/assets/audio/boodoodaloop.wav',
    complete: '/assets/audio/complete.wav',
    splash: '/assets/audio/Splash_Big.wav',
    waveAlert: '/assets/audio/wave_alert.wav',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      Object.entries(this.soundUrls).forEach(([key, url]) => {
        const pool: HTMLAudioElement[] = [];
        for (let i = 0; i < 2; i++) {
          const audio = new Audio(url);
          audio.preload = 'auto';
          pool.push(audio);
        }
        this.audioPool.set(key, pool);
      });
    }
  }

  private playSound(key: keyof typeof this.soundUrls, customVol = 1.0, playbackRate = 1.0) {
    if (this.muted || typeof window === 'undefined') return;

    try {
      let pool = this.audioPool.get(key);
      if (!pool) {
        pool = [];
        this.audioPool.set(key, pool);
      }

      let audio = pool.find(a => a.paused || a.ended);
      if (!audio) {
        if (pool.length < this.maxPoolSize) {
          audio = new Audio(this.soundUrls[key]);
          pool.push(audio);
        } else {
          audio = pool[0];
        }
      }

      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, this.volume * customVol));
      audio.playbackRate = playbackRate;
      audio.play().catch(() => {
        // Intercept browser autoplay restrictions gracefully
      });
    } catch {
      // Audio error catch
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public isMute(): boolean {
    return this.muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // --- UI & TAVERN SOUNDS ---
  public playCardSnap() {
    this.playSound('reminder', 0.6, 1.15);
  }

  public playCardHover() {
    this.playSound('boop', 0.25, 1.4);
  }

  public playCoinClink() {
    this.playSound('coin', 0.85, 1.0 + (Math.random() * 0.2 - 0.1));
  }

  public playBuyMinion() {
    this.playSound('coinsClink', 0.9);
    setTimeout(() => this.playSound('castSpell', 0.7), 80);
  }

  public playTierUpgrade() {
    this.playSound('cashRegister', 0.95);
    setTimeout(() => this.playSound('starCollect', 0.85), 180);
  }

  public playFreezeLock() {
    this.playSound('protect', 0.8, 1.25);
  }

  public playSteamHiss() {
    this.playSound('whoosh', 0.7, 0.9);
    this.playSound('laser2', 0.5, 0.8);
  }

  public playGearRattle() {
    this.playSound('hammer', 0.6, 1.3);
  }

  public playGoldenMerge() {
    this.playSound('starCollect', 1.0);
    setTimeout(() => this.playSound('healing', 0.9), 120);
  }

  public playDiscoverReward() {
    this.playSound('complete', 0.9);
  }

  public playTimerTick() {
    this.playSound('ding', 0.4, 1.2);
  }

  // --- COMBAT SOUNDS ---
  public playAttackLunge() {
    this.playSound('attackLeap', 0.9);
    this.playSound('whoosh', 0.65);
  }

  public playImpactDamage(isLethal: boolean = false, isCrit: boolean = false) {
    if (isCrit) {
      this.playSound('voltage', 0.9);
      this.playSound('smack', 1.0);
      this.playSound('donk', 0.85);
    } else {
      this.playSound('smack', 0.8, 1.05);
    }

    if (isLethal) {
      setTimeout(() => {
        this.playSound('splash', 0.85);
      }, 90);
    }
  }

  public playBarrierBreak() {
    this.playSound('windowBreak', 1.0);
  }

  public playBarrierShatter() {
    this.playSound('windowBreak', 1.0);
  }

  public playBarrierGain() {
    this.playSound('protect', 0.85);
  }

  public playMinionDied() {
    this.playSound('donk', 0.75, 0.85);
  }

  public playVictory() {
    this.playSound('victory', 1.0);
    setTimeout(() => this.playSound('cheer', 0.8), 200);
  }

  public playDefeat() {
    this.playSound('defeat', 0.9);
    setTimeout(() => this.playSound('badBoing', 0.7), 150);
  }
}

export const sound = new SoundEngine();
