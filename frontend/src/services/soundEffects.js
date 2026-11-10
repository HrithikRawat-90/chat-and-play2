// Native Browser Web Audio API Sound Effects (Zero External Assets Required)

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

  // Soft high-tech pop when a message is sent
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

  // Friendly chime when an incoming message is received (Apple-style Tri-tone)
  playMessageReceived() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // Classic Apple iOS Tri-tone bell notes: G#5, B5, E6
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

        // Fundamental pure crystal sine
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        // Subtle harmonic shimmer overtone for rich marimba/bell timbre
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2, now + time);

        // Apple bell chime envelope: rapid attack, smooth exponential chime decay
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

  // Crisp click when a Tic-Tac-Toe move is made
  playGameMove() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(523.25, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  // Fanfare chord when a match is won
  playGameWin() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = this.ctx.currentTime + idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch (e) {}
  }

  // Alert chime on game challenge
  playGameInvite() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = this.ctx.currentTime + idx * 0.09;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.09, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch (e) {}
  }
}

export const sounds = new SoundEffects();

// Unlock AudioContext on first user interaction so Apple chime plays reliably
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

