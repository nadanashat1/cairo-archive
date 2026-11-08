// ============================================================================
// شاشة اللعب — أول دليل فوري، وكل ظرف بعده بيتجهز في المعمل بعد فاصل ثابت، يظهر مختوم
// ويفضل مقفول لحد ما اللاعب يفتحه بإيده. الاستبعاد والاتهام بإيد اللاعب.
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
import photoFouad from '../photos/6-suspect-fouad.jpg';
import photoSaneya from '../photos/7-suspect-saneya.jpg';
import photoAbed from '../photos/8-suspect-abed.jpg';
import photoKaram from '../photos/9-suspect-karam.jpg';
import photoSabri from '../photos/10-suspect-sabri.jpg';
import photoWageeha from '../photos/11-suspect-wageeha.jpg';
import photoHekmat from '../photos/12-suspect-hekmat.jpg';
import photoNabil from '../photos/13-suspect-nabil.jpg';
import photoAnwar from '../photos/14-suspect-anwar.jpg';
import photoFathi from '../photos/15-suspect-fathi.jpg';
import photoLeila from '../photos/16-suspect-leila.jpg';
import photoShokry from '../photos/17-suspect-shokry.jpg';
import photoAziza from '../photos/18-suspect-aziza.jpg';
import photoGhani from '../photos/19-suspect-ghani.jpg';
import photoBahgat from '../photos/20-suspect-bahgat.jpg';
import photoFawzia from '../photos/6-21-suspect-fawzia.jpg';
import photoRashad from '../photos/2-22-suspect-rashad.jpg';
import photoToto from '../photos/3-23-suspect-toto.jpg';
import photoAbdo from '../photos/4-24-suspect-abdo.jpg';
import photoMedhat from '../photos/5-25-suspect-medhat.jpg';
import photoSawsanOpera from '../photos/7-36-suspect-sawsan-opera.jpg';
import photoKarima from '../photos/8-37-suspect-karima.jpg';
import photoFahmy from '../photos/9-38-suspect-fahmy.jpg';
import photoRaafat from '../photos/10-39-suspect-raafat.jpg';
import photoHoda from '../photos/11-40-suspect-hoda.jpg';
import photoMediha from '../photos/12-26-suspect-mediha.jpg';
import photoGalal from '../photos/13-27-suspect-galal.jpg';
import photoSamir from '../photos/14-28-suspect-samir.jpg';
import photoRadwan from '../photos/15-29-suspect-radwan.jpg';
import photoNagy from '../photos/16-30-suspect-nagy.jpg';
import photoTahir from '../photos/17-31-suspect-tahir.jpg';
import photoZeinab from '../photos/18-32-suspect-zeinab.jpg';
import photoAbedQena from '../photos/19-33-suspect-abed-qena.jpg';
import photoMabrouk from '../photos/20-34-suspect-mabrouk.jpg';
import photoFarag from '../photos/21-35-suspect-farag.jpg';
import photoEmil from '../photos/1-36-suspect-emil.jpg';
import photoFattouh from '../photos/2-37-suspect-fattouh.jpg';
import photoZeinat from '../photos/3-38-suspect-zeinat.jpg';
import photoBibo from '../photos/4-39-suspect-bibo.jpg';
import photoShafik from '../photos/5-40-suspect-shafik.jpg';
import photoEzzat from '../photos/6-41-suspect-ezzat.jpg';
import photoKawsar from '../photos/7-42-suspect-kawsar.jpg';
import photoFouadSaei from '../photos/8-43-suspect-fouad-saei.jpg';
import photoNabila from '../photos/9-44-suspect-nabila.jpg';
import photoShawqy from '../photos/10-45-suspect-shawqy.jpg';
import photoShaaban from '../photos/11-46-suspect-shaaban.jpg';
import photoAbdelkarim from '../photos/12-47-suspect-abdelkarim.jpg';
import photoZaki from '../photos/13-48-suspect-zaki.jpg';
import photoSafwat from '../photos/14-49-suspect-safwat.jpg';
import photoFarahat from '../photos/15-50-suspect-farahat.jpg';

const PHOTOS: Record<string, string> = {
    sawsanOpera: photoSawsanOpera,
    karima: photoKarima,
    fahmy: photoFahmy,
    raafat: photoRaafat,
    hoda: photoHoda,
    mediha: photoMediha,
    galal: photoGalal,
    samir: photoSamir,
    radwan: photoRadwan,
    nagy: photoNagy,
    tahir: photoTahir,
    zeinab: photoZeinab,
    abedQena: photoAbedQena,
    mabrouk: photoMabrouk,
    farag: photoFarag,
    emil: photoEmil,
    fattouh: photoFattouh,
    zeinat: photoZeinat,
    bibo: photoBibo,
    shafik: photoShafik,
    ezzat: photoEzzat,
    kawsar: photoKawsar,
    fouadSaei: photoFouadSaei,
    nabila: photoNabila,
    shawqy: photoShawqy,
    shaaban: photoShaaban,
    abdelkarim: photoAbdelkarim,
    zaki: photoZaki,
    safwat: photoSafwat,
    farahat: photoFarahat,
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
    fouad: photoFouad,
    saneya: photoSaneya,
    abed: photoAbed,
    karam: photoKaram,
    sabri: photoSabri,
    wageeha: photoWageeha,
    hekmat: photoHekmat,
    nabil: photoNabil,
    anwar: photoAnwar,
    fathi: photoFathi,
    leila: photoLeila,
    shokry: photoShokry,
    aziza: photoAziza,
    ghani: photoGhani,
    bahgat: photoBahgat,
    fawzia: photoFawzia,
    rashad: photoRashad,
    toto: photoToto,
    abdo: photoAbdo,
    medhat: photoMedhat,
};

// ملاحظات كل لاعب متسجلة تحت حسابه: مفتاح التخزين بياخد هوية المحقق (أو ضيف)
const notesKey = (caseId: string, scope: string) => `cairo-archive-notes-${caseId}-${scope}`;

export function GameScreen({ caseData, engine, onExit, preview = false }: { caseData: CaseData; engine: EngineApi; onExit: () => void; preview?: boolean }) {
    const { state, remainingMs, revealedCount, totalClues, visibleClues, envelopesRemaining } = engine;
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
                        <p>مفيش عد تنازلي دلوقتي. لما تكون جاهز، دوس «ابدأ التحقيق» — الوقت هيبدأ وأول دليل هيظهر فورًا، وباقي الأدلة المعمل الجنائي بيجهزها ورا بعض، وكل ظرف لما يوصل بيفضل مختوم لحد ما تفتحه لما تحس إن اللي معاك مش كفاية. كل ما تفتح أظرف أقل درجة استدلالك تعلا، ولو حليتها قبل آخر ظرف ومن غير ولا اتهام غلط تستاهل لقب «محقق محصلش» 🏆.</p>
                    </div>
                    {preview ? (
                        <button type="button" className="btn-amber btn-start" disabled title="معاينة فقط">
                            👁️ معاينة فقط — مفيش بدء تحقيق
                        </button>
                    ) : (
                        <button type="button" className="btn-amber btn-start" onClick={() => engine.start()}>
                            🕵️ ابدأ التحقيق
                        </button>
                    )}
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
                            <span>🔒 الأدلة مقفولة لحد ما يبدأ التحقيق — أول دليل هيظهر فور الضغط على «ابدأ التحقيق»، والباقي بيتجهز بالدور في المعمل الجنائي ويوصلك في أظرف مختومة تفتحها وقت ما تحتاجها.</span>
                            <span className="next-clue-flavor">🕰️ خد وقتك في القراءة، مفيش وقت بيعدي دلوقتي.</span>
                        </div>
                    )}
                    {visibleClues.map((clue, i) => (
                        <ClueCard key={clue.id} clue={clue} isNew={i === revealedCount - 1 && revealedCount > 0} />
                    ))}
                    {!reading && engine.prepRemainingMs !== null && (
                        <div className="next-clue anim-fade-up" aria-live="polite">
                            <span>الظرف اللي بعده بيوصل خلال <b className="gold-text">{formatClock(engine.prepRemainingMs)}</b></span>
                            <div className="bar bar-gold">
                                <i style={{ width: `${Math.min(100, 100 - (engine.prepRemainingMs / engine.prepTotalMs) * 100)}%` }} />
                            </div>
                            <span className="next-clue-flavor">🔬 المعمل الجنائي بيحلل البصمات…</span>
                        </div>
                    )}
                    {!reading && envelopesRemaining > 0 && engine.envelopeReady && (
                        <div className="envelope-card anim-fade-up" aria-live="polite">
                            <div className="envelope-visual">
                                <span className="envelope-icon" aria-hidden>✉️</span>
                                <span className="envelope-title">ظرف مختوم من قسم الأدلة الجنائية</span>
                                <span className="envelope-seal" aria-hidden>★</span>
                            </div>
                            <span className="envelope-hint">الظرف وصل من المعمل — الأدلة اللي معاك مش كفاية؟ افتحه لما تكون محتاجه، والتايمر شغال، فاختار وقتك بذكاء.</span>
                            <div className="envelope-meta">
                                <button type="button" className="btn-amber envelope-open" onClick={() => engine.openClue()}>
                                    🔓 افتح الظرف
                                </button>
                                <span className="hud-label">متبقي {envelopesLabel(envelopesRemaining)} · كل ظرف إضافي بينزّل درجة استدلالك</span>
                            </div>
                        </div>
                    )}
                    {!reading && envelopesRemaining === 0 && (
                        <div className="envelopes-done anim-fade-up">📂 كل الأظرف اتفتحت — الأدلة كاملة قدامك، وربط الخيوط عليك يا محقق.</div>
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
                <button
                    type="button"
                    className="btn-amber btn-accuse"
                    disabled={!selectedSuspect || reading}
                    onClick={() => selectedSuspect && engine.accuse(selectedSuspect.id)}
                >
                    📢 {reading ? 'الاتهام متاح بعد ما يبدأ التحقيق' : selectedSuspect ? `اتهم المشتبه فيه الآن (${selectedSuspect.name})` : 'حدد المشتبه فيه أولًا من كارته'}
                </button>
                <p className="accuse-note">تنبيه المحقق: توجيه اتهام خاطئ يخصم {toArabicNumeral(DEFAULT_SETTINGS.wrongAccusePenaltySeconds)} ثانية فورًا — الخطأ في تحديد الجاني بيكلفك وقتًا وقد يضيّع القضية.</p>
            </section>

            {!reading && (
                <button
                    type="button"
                    className={`notes-fab ${notesOpen ? 'is-open' : ''}`}
                    onClick={() => setNotesOpen((v) => !v)}
                    aria-label="دفتر ملاحظاتي"
                    aria-expanded={notesOpen}
                    title="دفتر ملاحظاتي"
                >
                    📝
                </button>
            )}

            {notesOpen && !reading && (
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

function envelopesLabel(n: number): string {
    if (n === 1) return 'ظرف واحد';
    if (n === 2) return 'ظرفين';
    return `${toArabicNumeral(n)} أظرف`;
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





