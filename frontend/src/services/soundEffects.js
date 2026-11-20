class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMessageSent() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {
      // Audio context may be restricted before user interaction
    }
  }

  playMessageReceived() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const triToneNotes = [
        { freq: 830.61, time: 0, duration: 0.18, vol: 0.22 },    // G#5
        { freq: 987.77, time: 0.09, duration: 0.18, vol: 0.24 },  // B5
        { freq: 1318.51, time: 0.18, duration: 0.38, vol: 0.28 }, // E6 (lingering bell finish)
      ];

      const now = this.ctx.currentTime;

      triToneNotes.forEach(({ freq, time, duration, vol }) => {
        const osc = this.ctx.createOscillator();
        const overtone = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        // Add an overtone for a bell-like sound.
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2, now + time);

        // Shape the attack and decay of the chime.
        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(vol, now + time + 0.012);
        gain.gain.exponentialRampToValueAtTime(vol * 0.4, now + time + duration * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gain);
        overtone.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + time);
        overtone.start(now + time);

        osc.stop(now + time + duration);
        overtone.stop(now + time + duration);
      });
    } catch (e) {
      console.warn('Could not play notification sound:', e.message);
    }
  }
}

export const sounds = new SoundEffects();

// Browsers may require a user gesture before audio can play.
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    sounds.init();
    ['click', 'keydown', 'touchstart'].forEach((evt) =>
      window.removeEventListener(evt, unlockAudio)
    );
  };
  ['click', 'keydown', 'touchstart'].forEach((evt) =>
    window.addEventListener(evt, unlockAudio, { passive: true })
  );
}

