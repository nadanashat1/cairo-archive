// ============================================================================
// الصوت — موسيقى اللعبة: مقطوعة «Mysterioso March» لـ Kevin MacLeod
// (incompetech.com)، مرخّصة تحت Creative Commons: By Attribution 4.0
// https://creativecommons.org/licenses/by/4.0/
// المصدر: https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100143
// المقطوعة بتشتغل كاملة من غير قصّ وتتكرر (loop) طوال اللعب.
// المؤثرات القصيرة (دليل/ختم/فوز/خسارة) مولّدة برمجيًا WebAudio.
// لا يبدأ أي صوت إلا بعد تفاعل من المستخدم (زر الموسيقى في الهيدر).
// ============================================================================

import musicUrl from '../assets/mysterioso-march.mp3';

export class NoirAudio {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private musicSrc: AudioBufferSourceNode | null = null;
    private musicBytes: ArrayBuffer | null = null;
    private loading = false;
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

    // الموسيقى بتتجاب مرة واحدة وتتفك وتشتغل في حلقة مفرغة على نفس قناة
    // التحكم في الصوت/الكتم زي ما هي.
    async startMusic() {
        const ctx = this.ensureCtx();
        if (!ctx || this.running || this.loading) return;
        void ctx.resume();
        this.loading = true;
        try {
            if (!this.musicBytes) {
                const res = await fetch(musicUrl);
                if (!res.ok) throw new Error('music fetch failed');
                this.musicBytes = await res.arrayBuffer();
            }
            // decodeAudioData بيفرّغ الـ buffer، فبنفك من نسخة عشان نقدر نعيد التشغيل
            const buffer = await ctx.decodeAudioData(this.musicBytes.slice(0));
            this.musicGain = ctx.createGain();
            this.musicGain.gain.value = 0.7;
            this.musicGain.connect(this.master!);
            const src = ctx.createBufferSource();
            src.buffer = buffer;
            src.loop = true;
            src.connect(this.musicGain);
            src.start();
            this.musicSrc = src;
            this.running = true;
        } catch {
            // لو التحميل أو فك الترميز فشل، اللعبة تفضل شغالة من غير موسيقى
        } finally {
            this.loading = false;
        }
    }

    stopMusic() {
        if (this.musicSrc) { try { this.musicSrc.stop(); } catch { /* متوقف أصلًا */ } this.musicSrc = null; }
        this.musicGain = null;
        if (this.ctx) { void this.ctx.close(); this.ctx = null; }
        this.master = null;
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
