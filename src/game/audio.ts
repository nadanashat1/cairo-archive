// ============================================================================
// الصوت — موسيقى أجواء نوار مولّدة برمجيًا (WebAudio)، من غير أي ملفات خارجية
// أو مقطوعات محمية بحقوق نشر. لا يبدأ أي صوت إلا بعد تفاعل من المستخدم.
// ============================================================================

export class NoirAudio {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private padGain: GainNode | null = null;
    private rainGain: GainNode | null = null;
    private padTimer: number | null = null;
    private running = false;
    private muted = false;
    private volume = 0.5;

    private ensureCtx(): AudioContext | null {
        if (this.ctx) return this.ctx;
        try {
            const AC = window.AudioContext || (window as any).webkitAudioContext;
            if (!AC) return null;
            this.ctx = new AC();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.muted ? 0 : this.volume;
            this.master.connect(this.ctx.destination);
        } catch {
            return null;
        }
        return this.ctx;
    }

    // نغمات هادئة: تتابع مقامي بطيء (Dm - Bb - Gm - A) بنبرات ناعمة
    private schedulePadChord(freqs: number[], when: number, dur: number) {
        const ctx = this.ctx!;
        freqs.forEach((f, i) => {
            const osc = ctx.createOscillator();
            osc.type = i === 0 ? 'sine' : 'triangle';
            osc.frequency.value = f;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, when);
            g.gain.linearRampToValueAtTime(i === 0 ? 0.05 : 0.028, when + dur * 0.3);
            g.gain.linearRampToValueAtTime(0, when + dur);
            osc.connect(g).connect(this.padGain!);
            osc.start(when);
            osc.stop(when + dur + 0.1);
        });
    }

    // صوت مطر خفيف: ضوضاء بنية مفلترة
    private startRain() {
        const ctx = this.ctx!;
        const len = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < len; i++) {
            const white = Math.random() * 2 - 1;
            last = (last + 0.02 * white) / 1.02;
            data[i] = last * 3.5;
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1400;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 400;
        src.connect(lp).connect(hp).connect(this.rainGain!);
        src.start();
    }

    startMusic() {
        const ctx = this.ensureCtx();
        if (!ctx || this.running) return;
        void ctx.resume();
        this.padGain = ctx.createGain();
        this.padGain.gain.value = 1;
        this.padGain.connect(this.master!);
        this.rainGain = ctx.createGain();
        this.rainGain.gain.value = 0.06;
        this.rainGain.connect(this.master!);
        this.startRain();
        // تتابع هارموني هادي، كل مقطع ٧ ثواني
        const chords: number[][] = [
            [146.83, 220.0, 293.66],  // Dm
            [116.54, 174.61, 233.08], // Bb
            [98.0, 196.0, 293.66],    // Gm
            [110.0, 220.0, 277.18],   // A
        ];
        let step = 0;
        const play = () => {
            const now = ctx.currentTime + 0.05;
            this.schedulePadChord(chords[step % chords.length], now, 7.5);
            step++;
        };
        play();
        this.padTimer = window.setInterval(play, 7000);
        this.running = true;
    }

    stopMusic() {
        if (this.padTimer !== null) { window.clearInterval(this.padTimer); this.padTimer = null; }
        if (this.ctx) { void this.ctx.close(); this.ctx = null; }
        this.master = null;
        this.padGain = null;
        this.rainGain = null;
        this.running = false;
    }

    get isPlaying() { return this.running; }
    get isMuted() { return this.muted; }

    setMuted(m: boolean) {
        this.muted = m;
        if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }

    setVolume(v: number) {
        this.volume = Math.max(0, Math.min(1, v));
        if (this.master && this.ctx && !this.muted) this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }

    private blip(freq: number, dur: number, type: OscillatorType, gain: number, when = 0) {
        const ctx = this.ensureCtx();
        if (!ctx || this.muted) return;
        void ctx.resume();
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        const g = ctx.createGain();
        const t = ctx.currentTime + when;
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(this.master ?? ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.05);
    }

    // مؤثرات قصيرة
    sfxClue() { this.blip(660, 0.18, 'sine', 0.08); this.blip(880, 0.22, 'sine', 0.06, 0.1); }
    sfxStamp() { this.blip(90, 0.25, 'square', 0.12); this.blip(55, 0.35, 'sine', 0.14, 0.02); }
    sfxWrong() { this.blip(220, 0.3, 'sawtooth', 0.07); this.blip(185, 0.4, 'sawtooth', 0.07, 0.15); }
    sfxWin() { [523, 659, 784, 1046].forEach((f, i) => this.blip(f, 0.35, 'sine', 0.07, i * 0.13)); }
    sfxLoss() { [392, 330, 262].forEach((f, i) => this.blip(f, 0.45, 'triangle', 0.08, i * 0.22)); }
}

export const noirAudio = new NoirAudio();
