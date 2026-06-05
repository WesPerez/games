class AudioEngine {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.bgmOscillators = [];
        this.bgmGains = [];
        this.bgmTimer = null;
        this.bgmNoteIndex = 0;
        this.bgmType = null;
    }
    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) { }
    }
    playSound(type) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const sounds = {
            jump:      { freq: 500, dur: 0.15, wave: 'square' },
            stomp:     { freq: 300, dur: 0.1,  wave: 'triangle' },
            coin:      { freq: 988, dur: 0.08, wave: 'square' },
            powerup:   { freq: 520, dur: 0.3,  wave: 'sine',   sweep: 1040 },
            hurt:      { freq: 200, dur: 0.2,  wave: 'sawtooth', sweep: 100 },
            brick:     { freq: 150, dur: 0.08, wave: 'square' },
            bump:      { freq: 100, dur: 0.06, wave: 'triangle' },
            flagpole:  { freq: 660, dur: 0.5,  wave: 'sine',   sweep: 1320 },
            death:     { freq: 400, dur: 0.5,  wave: 'square', sweep: 100 },
            gameover:  { freq: 200, dur: 0.8,  wave: 'sawtooth', sweep: 80 },
            oneup:     { freq: 330, dur: 0.3,  wave: 'square', sweep: 660 },
            fireball:  { freq: 800, dur: 0.1,  wave: 'sawtooth', sweep: 400 }
        };
        const s = sounds[type] || sounds.jump;
        osc.type = s.wave;
        osc.frequency.setValueAtTime(s.freq, this.ctx.currentTime);
        if (s.sweep) osc.frequency.linearRampToValueAtTime(s.sweep, this.ctx.currentTime + s.dur);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + s.dur);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + s.dur);
    }
    playBGM(type) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.stopBGM();
        this.bgmType = type || 'overworld';
        this.bgmNoteIndex = 0;
        this._scheduleBGMNote();
    }
    playStarMusic() {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.stopBGM();
        this.bgmType = 'star';
        this.bgmNoteIndex = 0;
        this._scheduleBGMNote();
    }
    stopBGM() {
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
        for (const osc of this.bgmOscillators) {
            try { osc.stop(); } catch (e) { }
        }
        for (const gain of this.bgmGains) {
            try { gain.disconnect(); } catch (e) { }
        }
        this.bgmOscillators = [];
        this.bgmGains = [];
        this.bgmNoteIndex = 0;
    }
    _scheduleBGMNote() {
        if (!this.ctx || !this.bgmType) return;
        const notes = this.bgmType === 'star'
            ? this._getStarNotes()
            : this._getOverworldNotes();
        if (this.bgmNoteIndex >= notes.length) {
            this.bgmNoteIndex = 0;
        }
        const note = notes[this.bgmNoteIndex];
        this.bgmNoteIndex++;
        if (note.freq > 0) {
            this._playBGMNote(note.freq, note.dur);
        }
        this.bgmTimer = setTimeout(() => this._scheduleBGMNote(), note.dur * 1000);
    }
    _playBGMNote(freq, dur) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + dur);
        this.bgmOscillators.push(osc);
        this.bgmGains.push(gain);
    }
    _getOverworldNotes() {
        const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23;
        const G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25;
        const G3 = 196.00, As4 = 466.16, B3 = 246.94;
        const R = 0;
        const q = 0.12, h = 0.24;
        return [
            { freq: E4, dur: q }, { freq: E4, dur: q }, { freq: R, dur: q },
            { freq: E4, dur: q }, { freq: R, dur: q }, { freq: C4, dur: q },
            { freq: E4, dur: q }, { freq: R, dur: q },
            { freq: G4, dur: q }, { freq: R, dur: h }, { freq: G3, dur: q },
            { freq: R, dur: h },
            { freq: C5, dur: q }, { freq: R, dur: h }, { freq: G3, dur: q },
            { freq: R, dur: h }, { freq: E4, dur: q }, { freq: R, dur: h },
            { freq: A4, dur: q }, { freq: R, dur: q }, { freq: B4, dur: q },
            { freq: R, dur: q }, { freq: As4, dur: q }, { freq: A4, dur: q },
            { freq: R, dur: q },
            { freq: G4, dur: q }, { freq: E4, dur: q }, { freq: G4, dur: q },
            { freq: A4, dur: q }, { freq: R, dur: q }, { freq: F4, dur: q },
            { freq: G4, dur: q }, { freq: R, dur: q }, { freq: E4, dur: q },
            { freq: R, dur: q }, { freq: C4, dur: q }, { freq: D4, dur: q },
            { freq: B3, dur: q }, { freq: R, dur: h }
        ];
    }
    _getStarNotes() {
        const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46;
        const G5 = 783.99, A5 = 880.00, B5 = 987.77, C6 = 1046.50;
        const R = 0;
        const e = 0.06, q = 0.12;
        return [
            { freq: C5, dur: e }, { freq: E5, dur: e }, { freq: G5, dur: e },
            { freq: C6, dur: q },
            { freq: G5, dur: e }, { freq: E5, dur: e }, { freq: C5, dur: e },
            { freq: G5, dur: q },
            { freq: F5, dur: e }, { freq: A5, dur: e }, { freq: C6, dur: e },
            { freq: F6 || C6, dur: q },
            { freq: C6, dur: e }, { freq: A5, dur: e }, { freq: F5, dur: e },
            { freq: C6, dur: q },
            { freq: D5, dur: e }, { freq: F5, dur: e }, { freq: A5, dur: e },
            { freq: D6 || C6, dur: q },
            { freq: A5, dur: e }, { freq: F5, dur: e }, { freq: D5, dur: e },
            { freq: A5, dur: q },
            { freq: E5, dur: e }, { freq: G5, dur: e }, { freq: B5, dur: e },
            { freq: E6 || C6, dur: q },
            { freq: B5, dur: e }, { freq: G5, dur: e }, { freq: E5, dur: e },
            { freq: B5, dur: q }
        ];
    }
}
