// ============================================================================
// شاشة اللعب — الأدلة بتظهر بالترتيب وتفضل ظاهرة، الاستبعاد والاتهام بإيد اللاعب.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import type { CaseData, Clue, Suspect } from '../game/cases';
import { formatClock, DEFAULT_SETTINGS, type EngineApi } from '../game/engine';
import { noirAudio } from '../game/audio';
import { toArabicNumeral } from './ArchiveScreen';
import { useAuth } from '../game/auth';

import photoSulaiman from '../photos/suspect-sulaiman.jpg';
import photoZanouba from '../photos/suspect-zanouba.jpg';
import photoFarid from '../photos/suspect-farid.jpg';
import photoLayla from '../photos/suspect-layla.jpg';
import photoKamel from '../photos/suspect-kamel.jpg';
import photoBahia from '../photos/1-suspect-bahia.jpg';
import photoSaadia from '../photos/2-suspect-saadia.jpg';
import photoNaguib from '../photos/3-suspect-naguib.jpg';
import photoAbdu from '../photos/4-suspect-abdu.jpg';
import photoSawsan from '../photos/5-suspect-sawsan.jpg';

const PHOTOS: Record<string, string> = {
    sulaiman: photoSulaiman,
    zanouba: photoZanouba,
    farid: photoFarid,
    layla: photoLayla,
    kamel: photoKamel,
    bahia: photoBahia,
    saadia: photoSaadia,
    naguib: photoNaguib,
    abdu: photoAbdu,
    sawsan: photoSawsan,
};

// ملاحظات كل لاعب متسجلة تحت حسابه: مفتاح التخزين بياخد هوية المحقق (أو ضيف)
const notesKey = (caseId: string, scope: string) => `cairo-archive-notes-${caseId}-${scope}`;

export function GameScreen({ caseData, engine, onExit }: { caseData: CaseData; engine: EngineApi; onExit: () => void }) {
    const { state, remainingMs, revealedCount, totalClues, visibleClues, nextClueInMs } = engine;
    const reading = state.status === 'reading';
    const [flashWrong, setFlashWrong] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const { user } = useAuth();
    const notesScope = user?.id ?? 'guest';
    const [notes, setNotes] = useState(() => { try { return localStorage.getItem(notesKey(caseData.id, notesScope)) ?? ''; } catch { return ''; } });
    const prevWrong = useRef(state.wrongAccusations);
    const prevRevealed = useRef(revealedCount);

    // وميض أحمر + صوت عند الاتهام الغلط
    useEffect(() => {
        if (state.wrongAccusations > prevWrong.current) {
            setFlashWrong(true);
            noirAudio.sfxWrong();
            const t = window.setTimeout(() => setFlashWrong(false), 900);
            return () => window.clearTimeout(t);
        }
        prevWrong.current = state.wrongAccusations;
    }, [state.wrongAccusations]);

    // صوت وصول دليل جديد
    useEffect(() => {
        if (revealedCount > prevRevealed.current) noirAudio.sfxClue();
        prevRevealed.current = revealedCount;
    }, [revealedCount]);

    // انتقالات النتايج بتتعامل من App (status وصل won/lost)
    useEffect(() => {
        if (state.status === 'won') noirAudio.sfxWin();
        if (state.status === 'lost') noirAudio.sfxLoss();
    }, [state.status]);

    const lowTime = remainingMs <= 30_000;
    const selectedSuspect = caseData.suspects.find((s) => s.id === state.selected) ?? null;

    return (
        <main className={`game-screen screen-enter ${flashWrong ? 'shake' : ''}`}>
            {/* رأس القضية */}
            <section className="case-head anim-fade-up" aria-label="بيانات القضية">
                <div className="case-head-meta">
                    <span>{caseData.level} · {caseData.difficulty}</span>
                    <span>{caseData.setting}</span>
                </div>
                <h1 className="display-title">قضية {toArabicNumeral(caseData.number)}: {caseData.title}</h1>
                {caseData.intro.map((p, i) => <p key={i} className="case-intro">{p}</p>)}
            </section>

            {/* التايمر والعدادات */}
            <section className="hud anim-fade-up" style={{ animationDelay: '80ms' }} aria-label="حالة التحقيق">
                <div className={`hud-card timer-card ${lowTime && !reading ? 'is-low' : ''}`}>
                    <span className="hud-label">{reading ? 'التحقيق لسه ما بدأش — العد التنازلي واقف' : 'العد التنازلي لإغلاق التحقيق'}</span>
                    <span className="timer-digits" role="timer" aria-live="off">{formatClock(remainingMs)}</span>
                    <span className="hud-warn">⚠ اتهام خاطئ يخصم {toArabicNumeral(DEFAULT_SETTINGS.wrongAccusePenaltySeconds)} ثانية فورًا!</span>
                </div>
                <div className="hud-card">
                    <div className="hud-row">
                        <span className="hud-label">📜 الأدلة المكتشفة</span>
                        <b>{toArabicNumeral(revealedCount)} من {toArabicNumeral(totalClues)}</b>
                    </div>
                    <div className="bar"><i style={{ width: `${totalClues ? (revealedCount / totalClues) * 100 : 0}%` }} /></div>
                    <div className="hud-row">
                        <span className="hud-label">🚫 المستبعدون</span>
                        <b>{toArabicNumeral(state.excluded.length)} من {toArabicNumeral(caseData.suspects.length)}</b>
                    </div>
                    <div className="bar bar-red"><i style={{ width: `${(state.excluded.length / caseData.suspects.length) * 100}%` }} /></div>
                </div>
            </section>

            {reading && (
                <section className="start-banner anim-pop" aria-label="بدء التحقيق">
                    <div className="start-banner-text">
                        <h2>🗂️ اقرأ ملف القضية وكروت المشتبه فيهم براحتك</h2>
                        <p>مفيش عد تنازلي دلوقتي. لما تكون جاهز، دوس «ابدأ التحقيق» — ساعتها الوقت هيبدأ وأول دليل هيظهر فورًا.</p>
                    </div>
                    <button type="button" className="btn-amber btn-start" onClick={() => engine.start()}>
                        🕵️ ابدأ التحقيق
                    </button>
                </section>
            )}

            {flashWrong && (
                <div className="wrong-banner anim-pop" role="alert">
                    {caseData.lossText} <b>-{toArabicNumeral(DEFAULT_SETTINGS.wrongAccusePenaltySeconds)} ثانية</b>
                </div>
            )}

            <div className="game-columns">
                {/* خيوط الجريمة والأدلة */}
                <section className="clues-col" aria-label="خيوط الجريمة والأدلة">
                    <div className="col-head">
                        <h2>📌 خيوط الجريمة والأدلة</h2>
                        <span className="chip chip-dark">قسم الأدلة الجنائية</span>
                    </div>
                    {reading && (
                        <div className="next-clue anim-fade-up" aria-live="polite">
                            <span>🔒 الأدلة مقفولة لحد ما يبدأ التحقيق — أول دليل هيظهر فور الضغط على «ابدأ التحقيق».</span>
                            <span className="next-clue-flavor">🕰️ خد وقتك في القراءة، مفيش وقت بيعدي دلوقتي.</span>
                        </div>
                    )}
                    {visibleClues.map((clue, i) => (
                        <ClueCard key={clue.id} clue={clue} isNew={i === revealedCount - 1 && revealedCount > 0} />
                    ))}
                    {nextClueInMs !== null && (
                        <div className="next-clue anim-fade-up" aria-live="polite">
                            <span>الدليل القادم خلال <b className="gold-text">{formatClock(nextClueInMs)}</b></span>
                            <div className="bar bar-gold">
                                <i style={{ width: `${100 - (nextClueInMs / (DEFAULT_SETTINGS.clueIntervalSeconds * 1000)) * 100}%` }} />
                            </div>
                            <span className="next-clue-flavor">🔬 المعمل الجنائي بيحلل البصمات…</span>
                        </div>
                    )}
                </section>

                {/* ساحة المشتبه فيهم */}
                <section className="suspects-col" aria-label="ساحة المشتبه فيهم">
                    <div className="col-head">
                        <h2>🕵️ ساحة المشتبه فيهم</h2>
                        <span className="hud-label">{reading ? 'اتعرف على الشخصيات كويس قبل ما يبدأ العد' : 'اضغط «اختيار الاتهام» لتحديد الهدف'}</span>
                    </div>
                    <div className="suspect-grid">
                        {caseData.suspects.map((s, i) => (
                            <SuspectCard
                                key={s.id}
                                suspect={s}
                                index={i}
                                excluded={state.excluded.includes(s.id)}
                                selected={state.selected === s.id}
                                disabled={reading}
                                onExclude={() => { noirAudio.sfxStamp(); engine.exclude(s.id); }}
                                onUndo={() => engine.undoExclude(s.id)}
                                onSelect={() => engine.select(state.selected === s.id ? null : s.id)}
                            />
                        ))}
                    </div>
                </section>
            </div>

            {/* شريط الاتهام */}
            <section className="accuse-bar anim-fade-up" style={{ animationDelay: '120ms' }}>
                <div className="accuse-side">
                    <button type="button" className="chip chip-button" onClick={() => setNotesOpen((v) => !v)}>📝 دفتر ملاحظاتي</button>
                    <button type="button" className="chip chip-button" onClick={onExit}>📋 العودة لأرشيف القضايا</button>
                </div>
                <button
                    type="button"
                    className="btn-amber btn-accuse"
                    disabled={!selectedSuspect || reading}
                    onClick={() => selectedSuspect && engine.accuse(selectedSuspect.id)}
                >
                    📢 {reading ? 'الاتهام متاح بعد ما يبدأ التحقيق' : selectedSuspect ? `اتهم المشتبه فيه الآن (${selectedSuspect.name})` : 'حدد المشتبه فيه أولًا من كارته'}
                </button>
                <p className="accuse-note">تنبيه المحقق: توجيه اتهام خاطئ يخصم {toArabicNumeral(DEFAULT_SETTINGS.wrongAccusePenaltySeconds)} ثانية فورًا — الخطأ في تحديد اللص بيكلفك وقتًا وقد يضيّع القضية.</p>
            </section>

            {notesOpen && (
                <section className="notes-drawer anim-pop" aria-label="دفتر الملاحظات">
                    <h3>📝 دفتر ملاحظاتي</h3>
                    <textarea
                        value={notes}
                        onChange={(e) => {
                            setNotes(e.target.value);
                            try { localStorage.setItem(notesKey(caseData.id, notesScope), e.target.value); } catch { /* ignore */ }
                        }}
                        placeholder="سجّل ملاحظاتك عن الأدلة والمشتبه فيهم هنا…"
                        rows={5}
                    />
                </section>
            )}
        </main>
    );
}

function ClueCard({ clue, isNew }: { clue: Clue; isNew: boolean }) {
    return (
        <article className={`clue-card ${isNew ? 'clue-new anim-clue' : 'anim-fade-up'}`}>
            <header className="clue-head">
                <span className="chip chip-dark">🕰️ {clue.stamp}</span>
                {isNew && <span className="chip chip-gold chip-pulse">+ دليل جديد</span>}
            </header>
            <h3 className="clue-title">{clue.title}</h3>
            <p className="clue-text">{clue.text}</p>
        </article>
    );
}

function SuspectCard(props: {
    suspect: Suspect;
    index: number;
    excluded: boolean;
    selected: boolean;
    disabled?: boolean;
    onExclude: () => void;
    onUndo: () => void;
    onSelect: () => void;
}) {
    const { suspect, index, excluded, selected, disabled = false } = props;
    return (
        <article
            className={`suspect-card anim-rise ${excluded ? 'is-excluded' : ''} ${selected ? 'is-selected' : ''}`}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="suspect-card-top">
                <span className="suspect-num">#{toArabicNumeral(index + 1)}</span>
                {excluded ? (
                    <span className="chip chip-dark">خارج الشبهات</span>
                ) : selected ? (
                    <span className="chip chip-gold">المتهم المختار</span>
                ) : (
                    <span className="chip chip-dark">قيد التحقيق</span>
                )}
            </div>
            <div className="suspect-id-row">
                <div className="suspect-id-text">
                    <h3 className="suspect-name">{suspect.name}</h3>
                    <p className="suspect-role">{suspect.role} · {suspect.age}</p>
                </div>
                <div className="suspect-headshot">
                    <img className="suspect-photo" src={PHOTOS[suspect.photo]} alt={`صورة توضيحية للمشتبه فيه ${suspect.name}`} />
                </div>
            </div>
            <ul className="suspect-facts">
                {suspect.facts.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            {excluded && <span className="stamp stamp-red stamp-anim suspect-stamp">مستبعدة ✓</span>}
            <div className="suspect-actions">
                {excluded ? (
                    <button type="button" className="btn-dark btn-block" onClick={props.onUndo} disabled={disabled}>↩️ تراجع عن الاستبعاد</button>
                ) : (
                    <>
                        <button type="button" className="btn-dark" onClick={props.onExclude} disabled={disabled}>استبعاد</button>
                        <button type="button" className={`btn-dark ${selected ? 'is-armed' : ''}`} onClick={props.onSelect} disabled={disabled}>
                            {selected ? '✕ إلغاء التحديد' : 'اختيار الاتهام'}
                        </button>
                    </>
                )}
            </div>
        </article>
    );
}


