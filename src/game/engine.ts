// ============================================================================
// منطق اللعب — ملف مستقل عن الواجهة.
// التايمر مبني على الوقت الفعلي (Date.now) مش عدّاد لفات، عشان ميحصلش تسريع
// أو بطء، ولما تخرجي من الصفحة وترجعي الوقت بيكمّل من مكانه الصح.
// ============================================================================

import { useEffect, useMemo, useReducer, useRef } from 'react';
import type { CaseData } from './cases';

// ---- أرقام الجولة القابلة للضبط (تتظبط بعد تجربة اللعب) -------------------
export interface GameSettings {
    roundSeconds: number;          // مدة الجولة كاملة
    clueIntervalSeconds: number;   // كل قد إيه يظهر دليل جديد
    wrongAccusePenaltySeconds: number; // خصم الاتهام الغلط
}

export const DEFAULT_SETTINGS: GameSettings = {
    roundSeconds: 180,
    clueIntervalSeconds: 25,
    wrongAccusePenaltySeconds: 20,
};

export type RoundStatus = 'playing' | 'won' | 'lost';

export interface RoundState {
    status: RoundStatus;
    startedAtMs: number;       // بداية الجولة الحالية بالوقت الفعلي
    carriedElapsedMs: number;  // وقت متراكم من قبل آخر استئناف (استرجاع بعد غلق الصفحة)
    penaltyMs: number;         // مجموع خصومات الاتهامات الغلط
    excluded: string[];        // المشتبه فيهم المستبعدون
    selected: string | null;   // المتهم المختار
    wrongAccusations: number;
    withExtraClue: boolean;    // جولة إعادة بعد خسارة مع دليل إضافي
    wonWithRemainingMs: number;
    lastWrongAt: number;       // طابع آخر اتهام غلط (لتأثير الواجهة)
}

export type RoundAction =
    | { type: 'exclude'; suspectId: string }
    | { type: 'undoExclude'; suspectId: string }
    | { type: 'select'; suspectId: string | null }
    | { type: 'accuse'; suspectId: string; culpritId: string; penaltyMs: number }
    | { type: 'timeout' }
    | { type: 'restart'; withExtraClue: boolean }
    | { type: 'restore'; state: RoundState };

function freshRound(withExtraClue: boolean): RoundState {
    return {
        status: 'playing',
        startedAtMs: Date.now(),
        carriedElapsedMs: 0,
        penaltyMs: 0,
        excluded: [],
        selected: null,
        wrongAccusations: 0,
        withExtraClue,
        wonWithRemainingMs: 0,
        lastWrongAt: 0,
    };
}

export function elapsedMsOf(s: RoundState, now: number): number {
    if (s.status !== 'playing') return s.carriedElapsedMs;
    return s.carriedElapsedMs + (now - s.startedAtMs);
}

export function remainingMsOf(s: RoundState, settings: GameSettings, now: number): number {
    if (s.status === 'won') return s.wonWithRemainingMs;
    return settings.roundSeconds * 1000 - elapsedMsOf(s, now) - s.penaltyMs;
}

// عدد الأدلة الظاهرة: أول دليل فوري، وكل دليل وراه بعد فاصل ثابت.
export function revealedCountOf(s: RoundState, settings: GameSettings, totalClues: number, now: number): number {
    const elapsed = elapsedMsOf(s, now) / 1000;
    const byTime = 1 + Math.floor(elapsed / settings.clueIntervalSeconds);
    return Math.max(1, Math.min(totalClues, byTime));
}

function reducer(s: RoundState, a: RoundAction): RoundState {
    switch (a.type) {
        case 'exclude':
            if (s.status !== 'playing' || s.excluded.includes(a.suspectId)) return s;
            return { ...s, excluded: [...s.excluded, a.suspectId], selected: s.selected === a.suspectId ? null : s.selected };
        case 'undoExclude':
            if (s.status !== 'playing') return s;
            return { ...s, excluded: s.excluded.filter((id) => id !== a.suspectId) };
        case 'select':
            if (s.status !== 'playing' || s.excluded.includes(a.suspectId ?? '')) return s;
            return { ...s, selected: a.suspectId };
        case 'accuse': {
            if (s.status !== 'playing' || s.excluded.includes(a.suspectId)) return s;
            // حماية من الضغط المتكرر السريع: اتهام واحد كل ١٫٥ ثانية كحد أقصى.
            if (s.lastWrongAt && Date.now() - s.lastWrongAt < 1500) return s;
            if (a.suspectId === a.culpritId) {
                const now = Date.now();
                const remaining = Math.max(0, (s as any).__roundMs - elapsedMsOf(s, now) - s.penaltyMs);
                return { ...s, status: 'won', selected: a.suspectId, carriedElapsedMs: elapsedMsOf(s, now), wonWithRemainingMs: remaining };
            }
            return { ...s, wrongAccusations: s.wrongAccusations + 1, penaltyMs: s.penaltyMs + a.penaltyMs, selected: null, lastWrongAt: Date.now() };
        }
        case 'timeout':
            if (s.status !== 'playing') return s;
            return { ...s, status: 'lost', carriedElapsedMs: elapsedMsOf(s, Date.now()), selected: null };
        case 'restart':
            return freshRound(a.withExtraClue);
        case 'restore':
            return a.state;
        default:
            return s;
    }
}

const storageKey = (caseId: string) => `cairo-archive-round-${caseId}`;

function saveRound(caseId: string, s: RoundState) {
    try {
        // نخزن اللقطة والوقت المنقضي لحد دلوقتي، فلما ترجع الصفحة يكمّل من هنا.
        const snapshot: RoundState = { ...s, carriedElapsedMs: elapsedMsOf(s, Date.now()), startedAtMs: Date.now() };
        localStorage.setItem(storageKey(caseId), JSON.stringify(snapshot));
    } catch { /* التخزين المحلي مش متاح — الجولة تفضل في الذاكرة */ }
}

function loadRound(caseId: string): RoundState | null {
    try {
        const raw = localStorage.getItem(storageKey(caseId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as RoundState;
        if (!parsed || typeof parsed.startedAtMs !== 'number') return null;
        return { ...parsed, startedAtMs: Date.now() };
    } catch {
        return null;
    }
}

export function clearSavedRound(caseId: string) {
    try { localStorage.removeItem(storageKey(caseId)); } catch { /* ignore */ }
}

export interface EngineApi {
    state: RoundState;
    now: number;
    remainingMs: number;
    elapsedMs: number;
    revealedCount: number;
    visibleClues: CaseData['clues'];
    nextClueInMs: number | null;
    exclude: (id: string) => void;
    undoExclude: (id: string) => void;
    select: (id: string | null) => void;
    accuse: (id: string) => void;
    restart: (withExtraClue: boolean) => void;
}

export function useGameEngine(caseData: CaseData, settings: GameSettings = DEFAULT_SETTINGS): EngineApi {
    const [rawState, dispatch] = useReducer(reducer, undefined as unknown as RoundState, () => loadRound(caseData.id) ?? freshRound(false));
    // بنحتاج roundMs جوّه reducer لحساب المتبقي عند الفوز
    const state = useMemo(() => Object.assign(rawState, { __roundMs: settings.roundSeconds * 1000 }), [rawState, settings.roundSeconds]);
    const [now, setNow] = useReducer((_: number, t: number) => t, Date.now());
    const stateRef = useRef(state);
    stateRef.current = state;

    // نبض التايمر: تحديث كل ربع ثانية، ويتحسب من الوقت الفعلي فمفيش انحراف.
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), 250);
        const onVis = () => setNow(Date.now());
        document.addEventListener('visibilitychange', onVis);
        return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
    }, []);

    const remainingMs = remainingMsOf(state, settings, now);

    // انتهاء الوقت = خسارة
    useEffect(() => {
        if (state.status === 'playing' && remainingMs <= 0) dispatch({ type: 'timeout' });
    }, [remainingMs, state.status]);

    // حفظ تلقائي مع كل تغيير + عند إغلاق الصفحة
    useEffect(() => {
        saveRound(caseData.id, state);
    }, [caseData.id, state]);
    useEffect(() => {
        const onUnload = () => saveRound(caseData.id, stateRef.current);
        window.addEventListener('beforeunload', onUnload);
        return () => window.removeEventListener('beforeunload', onUnload);
    }, [caseData.id]);

    const allClues = useMemo(
        () => (state.withExtraClue ? [...caseData.clues, caseData.extraClue] : caseData.clues),
        [caseData, state.withExtraClue],
    );
    const revealedCount = revealedCountOf(state, settings, allClues.length, now);
    const nextClueInMs = useMemo(() => {
        if (state.status !== 'playing' || revealedCount >= allClues.length) return null;
        const nextAt = revealedCount * settings.clueIntervalSeconds * 1000; // دليل رقم n بيظهر عند n * الفاصل
        return Math.max(0, nextAt - elapsedMsOf(state, now));
    }, [state, revealedCount, allClues.length, settings.clueIntervalSeconds, now]);

    return {
        state,
        now,
        remainingMs,
        elapsedMs: elapsedMsOf(state, now),
        revealedCount,
        visibleClues: allClues.slice(0, revealedCount),
        nextClueInMs,
        exclude: (id) => dispatch({ type: 'exclude', suspectId: id }),
        undoExclude: (id) => dispatch({ type: 'undoExclude', suspectId: id }),
        select: (id) => dispatch({ type: 'select', suspectId: id }),
        accuse: (id) => dispatch({ type: 'accuse', suspectId: id, culpritId: caseData.culpritId, penaltyMs: settings.wrongAccusePenaltySeconds * 1000 }),
        restart: (withExtra) => { clearSavedRound(caseData.id); dispatch({ type: 'restart', withExtraClue: withExtra }); },
    };
}

// تنسيق الأرقام بالعربي المصري زي التصميم
export function formatClock(ms: number): string {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
