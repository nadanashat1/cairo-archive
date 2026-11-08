// ============================================================================
// شاشتا النتيجة — الفوز بشرح الحل وسلسلة الاستبعاد، والخسارة بدون كشف الحل.
// ============================================================================

import React from 'react';
import type { CaseData } from '../game/cases';
import { formatClock } from '../game/engine';
import { toArabicNumeral } from './ArchiveScreen';

// جمل تشجيع مختلفة لكل قضية — عامية مصرية، من غير شخصية رئيس أو راوي.
const WIN_ENCOURAGEMENT: Record<string, string> = {
    'hanem-bracelet': 'عاش يا حضرة المحقق، أول ملف يتقفل بإيدك!',
    'poison-tea': 'شاي مسموم وقضية أدهى — عينك ما فاتهاش حاجة!',
    'locked-office': 'مكتب مقفول وسر انفتح على إيدك، برافو عليك!',
    'alex-train': 'القطار وقف على كلمة منك، قفلت ملف تقيل!',
    'nile-casino': 'عاش يا حضرة المحقق، قفلت ملف تقيل!',
    'pasha-painting': 'اللوحة اختفت بس الحقيقة ظهرت — ذكاءك أجدع من أي خزنة!',
    'opera-jewels': 'تحت الأنوار وقدام الكل، لقطتها يا معلم!',
    'royal-hotel': 'فندق مليان أسرار، وإنت اللي قفلت أتقل ملف فيه!',
    'qena-boat': 'آخر مركب ما فاتكش — قفلتها على المرسى!',
};

export function WinScreen({ caseData, remainingMs, wrongAccusations, cluesUsed, totalClues, rankNotice, onReplay, onArchive }: {
    caseData: CaseData;
    remainingMs: number;
    wrongAccusations: number;
    cluesUsed: number;
    totalClues: number;
    rankNotice?: string | null;
    onReplay: () => void;
    onArchive: () => void;
}) {
    const encouragement = WIN_ENCOURAGEMENT[caseData.id] ?? 'ملف جديد اتقفل باسمك يا محقق!';
    const culprit = caseData.suspects.find((s) => s.id === caseData.culpritId)!;
    const culpritLabel = caseData.culpritRoleLabel ?? 'الجاني الحقيقي';
    const winHeadline = caseData.winHeadline ?? 'مبروك يا محقق! كشفت الجاني قبل فوات الأوان ⚖️';
    const registerLine = caseData.winRegisterLine ?? 'النيابة العامة - قطاع الجنايات · سجل رقم ٥٢٤/١٩٥٢';
    // التقييم له طبقتين: اللقب (نجوم) + درجة استدلال من ١٠٠.
    // اللقب بيحقق قاعدة اللاعبة: الحل قبل فتح آخر ظرف (الدليل المبسّط) = محقق محصلش.
    // الدرجة بتتدرج مع كل ظرف إضافي (نسبة من عدد أظرف القضية) ومع الاتهامات الغلط.
    const openedAll = cluesUsed >= totalClues;
    const totalEnvelopes = Math.max(1, totalClues - 1);
    const envelopesOpened = Math.max(0, cluesUsed - 1);
    const cluePenalty = Math.round((40 * envelopesOpened) / totalEnvelopes); // حتى ٤٠ درجة، نسبة لعدد أظرف القضية
    const wrongPenalty = Math.min(20, 10 * wrongAccusations); // حتى ٢٠ درجة
    const deductionScore = Math.max(5, 100 - cluePenalty - wrongPenalty);
    // اللقب الأعلى محجوز لمن حل قبل آخر ظرف ومن غير ولا اتهام غلط —
    // التخمين الأعمى ممكن يكسب بالضغط على الوقت، بس مش ياخد لقب محصلش.
    const stars = !openedAll && wrongAccusations === 0 ? 3 : deductionScore >= 50 ? 2 : 1;
    const rating = stars === 3 ? 'محقق محصلش' : stars === 2 ? 'محقق شاطر' : 'محقق مثابر';

    return (
        <main className="result-screen screen-enter">
            <div className="result-head">
                <span className="chip chip-gold anim-pop">🏅 إسدال الستار رسميًا</span>
                <span className="stamp stamp-red stamp-anim result-stamp">
                    تم إغلاق القضية والإدانة المؤكدة<br />
                    <small>{registerLine}</small>
                </span>
                <h1 className="display-title anim-fade-up">{winHeadline}</h1>
                <p className="win-flair anim-fade-up">{encouragement}</p>
                {rankNotice && (
                    <p className="win-flair rank-notice anim-fade-up">🎖️ {rankNotice}</p>
                )}
                {stars === 3 && (
                    <p className="win-flair anim-fade-up">🏆 حليتها من غير ما تفتح آخر ظرف — محقق محصلش بامتياز.</p>
                )}
            </div>

            <section className="stats-row" aria-label="نتيجة الجولة">
                <div className="stat-card anim-rise" style={{ animationDelay: '60ms' }}>
                    <span className="hud-label">الوقت المتبقي</span>
                    <b className="stat-value">{formatClock(remainingMs)}</b>
                    <span className="stat-note">سرعة بديهية استثنائية</span>
                </div>
                <div className="stat-card anim-rise" style={{ animationDelay: '120ms' }}>
                    <span className="hud-label">الاتهامات الخاطئة</span>
                    <b className="stat-value">{toArabicNumeral(wrongAccusations)} أخطاء</b>
                    <span className="stat-note">دقة استدلال {wrongAccusations === 0 ? '١٠٠٪' : 'محترمة'}</span>
                </div>
                <div className="stat-card anim-rise" style={{ animationDelay: '180ms' }}>
                    <span className="hud-label">الأدلة المستخدمة</span>
                    <b className="stat-value">{toArabicNumeral(cluesUsed)} أدلة</b>
                    <span className="stat-note">{openedAll ? 'فتحت كل الأظرف' : 'قفلتها قبل آخر ظرف 👏'}</span>
                </div>
                <div className="stat-card anim-rise" style={{ animationDelay: '240ms' }}>
                    <span className="hud-label">التقييم الجنائي</span>
                    <b className="stat-value stars">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</b>
                    <span className="stat-note">{rating}</span>
                </div>
                <div className="stat-card anim-rise" style={{ animationDelay: '300ms' }}>
                    <span className="hud-label">درجة الاستدلال</span>
                    <b className="stat-value">{toArabicNumeral(deductionScore)} من ١٠٠</b>
                    <span className="stat-note">أقل أظرف وأخطاء = درجة أعلى</span>
                </div>
            </section>

            <section className="culprit-panel anim-fade-up" style={{ animationDelay: '200ms' }} aria-label="ملف الجاني">
                <span className="chip chip-gold">ملف المتهم</span>
                <h2>{culprit.name} — {culpritLabel}</h2>
                <p>{caseData.winText}</p>
                <p className="culprit-summary">{caseData.culpritSummary}</p>
            </section>

            <section className="elimination-panel anim-fade-up" style={{ animationDelay: '280ms' }} aria-label="سلسلة الاستنتاج">
                <h2>🧩 سلسلة الاستنتاج والأدلة القاطعة</h2>
                <ol className="elim-list">
                    {caseData.eliminationRows.map((row, i) => (
                        <li key={i} className="anim-rise" style={{ animationDelay: `${340 + i * 90}ms` }}>
                            <b className="gold-text">{row.clueTitle}</b>
                            <p>{row.detail}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="result-actions anim-fade-up" style={{ animationDelay: '360ms' }}>
                <button type="button" className="btn-amber" onClick={onReplay}>🔁 إعادة اللعب من الأول</button>
                <button type="button" className="btn-dark" onClick={onArchive}>📋 العودة لأرشيف القضايا</button>
                <p className="next-case-hint">الخطوة القادمة في مسيرتك: قضايا جديدة بتتفتح بالترتيب — القضية الجاية أصعب!</p>
            </section>
        </main>
    );
}

export function LossScreen({ caseData, onRetry, onArchive }: {
    caseData: CaseData;
    onRetry: (withExtraClue: boolean) => void;
    onArchive: () => void;
}) {
    return (
        <main className="result-screen loss-screen screen-enter">
            <div className="loss-icon anim-scale" aria-hidden>🔍</div>
            <span className="chip chip-gold anim-pop">● تحقيق غير مكتمل</span>
            <h1 className="display-title anim-fade-up">للأسف القضية متحلتش…</h1>
            <h2 className="loss-case gold-text">قضية {toArabicNumeral(caseData.number)}: {caseData.title}</h2>
            <p className="loss-text anim-fade-up" style={{ animationDelay: '120ms' }}>الخيوط لسه مش كاملة.. محتاج دليل كمان؟</p>
            <div className="result-actions anim-fade-up" style={{ animationDelay: '200ms' }}>
                <button type="button" className="btn-amber" onClick={() => onRetry(true)}>🔍 عايز دليل كمان وراجع القضية</button>
                <button type="button" className="btn-dark" onClick={() => onRetry(false)}>🔁 إعادة المحاولة من غير دليل زيادة</button>
                <button type="button" className="btn-dark" onClick={onArchive}>📋 ارجع للقضايا ←</button>
            </div>
        </main>
    );
}

