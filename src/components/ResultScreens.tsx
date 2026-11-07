// ============================================================================
// شاشتا النتيجة — الفوز بشرح الحل وسلسلة الاستبعاد، والخسارة بدون كشف الحل.
// ============================================================================

import React from 'react';
import type { CaseData } from '../game/cases';
import { formatClock } from '../game/engine';
import { toArabicNumeral } from './ArchiveScreen';

export function WinScreen({ caseData, remainingMs, wrongAccusations, cluesUsed, onReplay, onArchive }: {
    caseData: CaseData;
    remainingMs: number;
    wrongAccusations: number;
    cluesUsed: number;
    onReplay: () => void;
    onArchive: () => void;
}) {
    const culprit = caseData.suspects.find((s) => s.id === caseData.culpritId)!;
    const culpritLabel = caseData.culpritRoleLabel ?? 'الجاني الحقيقي';
    const winHeadline = caseData.winHeadline ?? 'مبروك يا محقق! كشفت الجاني قبل فوات الأوان ⚖️';
    const registerLine = caseData.winRegisterLine ?? 'النيابة العامة - قطاع الجنايات · سجل رقم ٥٢٤/١٩٥٢';
    const stars = wrongAccusations === 0 ? 3 : wrongAccusations <= 2 ? 2 : 1;
    const rating = stars === 3 ? 'محقق عبقري' : stars === 2 ? 'محقق شاطر' : 'محقق مثابر';

    return (
        <main className="result-screen screen-enter">
            <div className="result-head">
                <span className="chip chip-gold anim-pop">🏅 إسدال الستار رسميًا</span>
                <span className="stamp stamp-red stamp-anim result-stamp">
                    تم إغلاق القضية والإدانة المؤكدة<br />
                    <small>{registerLine}</small>
                </span>
                <h1 className="display-title anim-fade-up">{winHeadline}</h1>
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
                    <span className="stat-note">خيوط مترابطة</span>
                </div>
                <div className="stat-card anim-rise" style={{ animationDelay: '240ms' }}>
                    <span className="hud-label">التقييم الجنائي</span>
                    <b className="stat-value stars">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</b>
                    <span className="stat-note">{rating}</span>
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

