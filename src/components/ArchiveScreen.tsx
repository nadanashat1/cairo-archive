// ============================================================================
// شاشة أرشيف القضايا — القضايا بتتفتح بالدور: أول قضية متاحة، وكل قضية بعدها
// بتتفتح بعد ما اللاعب يقفل (يكسب) اللي قبلها. القضية المقفولة بالفعل تفضل
// متاحة لإعادة اللعب. واللي محتواه لسه متكتبش يفضل مقفول.
// ============================================================================

import React from 'react';
import { ARCHIVE_SLOTS } from '../game/cases';
import { useAuth } from '../game/auth';
import cover from '../photos/case-cover.jpg';
import caseTea from '../photos/1-case-2-tea.png';
import caseOffice from '../photos/2-case-3-office.png';
import caseTrain from '../photos/3-case-4-train.png';
import caseCasino from '../photos/4-case-5-casino.png';
import casePainting from '../photos/5-case-6-painting.png';
import caseOpera from '../photos/6-case-7-opera.png';
import caseHotel from '../photos/7-case-8-hotel.png';
import caseQena from '../photos/8-case-9-qena.png';
import caseCinema from '../photos/16-9-case-10-cinema.png';
import caseNewsroom from '../photos/17-10-case-11-newsroom.png';
import caseSaqia from '../photos/18-11-case-12-saqia.png';

const CASE_ART: Record<number, { src: string; alt: string }> = {
    2: { src: caseTea, alt: 'فنجان شاي جنب زجاجة سم على صينية نحاس — جو قضية سم في فنجان الشاي' },
    3: { src: caseOffice, alt: 'باب مكتب مقفول والنور خارج من تحته — جو قضية جريمة في المكتب المقفول' },
    4: { src: caseTrain, alt: 'قطار بخاري ليلي في محطة مليانة ضباب — جو قضية لغز قطار الإسكندرية' },
    5: { src: caseCasino, alt: 'ترابيزة كازينو قدام نيل الليل — جو قضية جريمة كازينو النيل' },
    6: { src: casePainting, alt: 'إطار لوحة دهب فاضي على حيطة قصر — جو قضية اختفاء لوحة الباشا' },
    7: { src: caseOpera, alt: 'علبة جواهر مخمل فاضية قدام الأوبرا — جو قضية سرقة جواهر أوبرا الخديوي' },
    8: { src: caseHotel, alt: 'شنطة مفتوحة فاضية في بهو فندق فخم — جو قضية جريمة فندق رويال' },
    9: { src: caseQena, alt: 'مركب شراعي راسي في مرسى نيلي ليلي على ضوء فانوس — جو قضية آخر مركب لقنا' },
    10: { src: caseCinema, alt: 'واجهة سينما ليلية بلافتة مضيئة وبوستر فيلم — جو قضية مشهد ما اتعرضش' },
    11: { src: caseNewsroom, alt: 'آلة كاتبة قديمة على مكتب صحفي في نور مصباح — جو قضية حرف تحت السطر' },
    12: { src: caseSaqia, alt: 'ساقية على ترعة وقت الفجر في قرية مصرية — جو قضية نوبة السقيا' },
};

export function ArchiveScreen({ onPlay }: { onPlay: (caseId: string) => void }) {
    const { isWon } = useAuth();
    // القفل المتسلسل: القضية متاحة لو هي أول قضية ليها محتوى، أو اللاعب كسبها
    // قبل كده (إعادة لعب)، أو كسب القضية اللي قبلها. مكسبهااش ومش اللي بعد
    // مكسبه = مقفولة بالدور، حتى لو محتواها موجود.
    let prevCaseId: string | null = null;
    const openness = ARCHIVE_SLOTS.map((slot) => {
        if (slot.state !== 'playable' || !slot.caseId) return 'content' as const;
        const open = prevCaseId === null || isWon(slot.caseId) || isWon(prevCaseId);
        prevCaseId = slot.caseId;
        return open ? ('open' as const) : ('seq' as const);
    });
    return (
        <main className="archive-screen screen-enter">
            <div className="archive-head anim-fade-up">
                <h1 className="display-title">أرشيف القضايا</h1>
                <p className="archive-sub">اختار قضية للبدء في التحقيق الجنائي</p>
            </div>
            <div className="case-grid">
                {ARCHIVE_SLOTS.map((slot, i) => (
                    <article
                        key={slot.number}
                        className={`case-card anim-rise ${openness[i] === 'open' ? 'is-playable' : 'is-locked'}`}
                        style={{ animationDelay: `${i * 90}ms` }}
                    >
                        <div className="case-card-media">
                            {(() => {
                                const art = CASE_ART[slot.number];
                                return art ? (
                                    <img src={art.src} alt={art.alt} />
                                ) : (
                                    <img src={cover} alt="غلاف توضيحي لقضية أسورة الهانم" />
                                );
                            })()}
                            {slot.caseId && isWon(slot.caseId) ? (
                                <span className="stamp-solved">تم الحل</span>
                            ) : (
                                <span className={`chip ${openness[i] === 'open' ? 'chip-gold' : 'chip-dark'}`}>
                                    {openness[i] === 'open' ? '● الدور عليك' : '🔒 مقفلة'}
                                </span>
                            )}
                        </div>
                        <h2 className="case-card-title">قضية {toArabicNumeral(slot.number)}: {slot.title}</h2>
                        {openness[i] === 'open' ? (
                            <button type="button" className="btn-amber btn-block" onClick={() => onPlay(slot.caseId!)}>
                                ابدأ التحقيق
                            </button>
                        ) : openness[i] === 'seq' ? (
                            <p className="case-card-note">🔒 اقفل القضية اللي قبلها الأول — القضايا بتتفتح بالدور.</p>
                        ) : (
                            <p className="case-card-note">المحتوى لسه بيتكتب — هتتفتح بالترتيب بعد القضية السابقة.</p>
                        )}
                    </article>
                ))}
            </div>
        </main>
    );
}

export function toArabicNumeral(n: number): string {
    const digits = '٠١٢٣٤٥٦٧٨٩';
    return String(n).split('').map((d) => digits[Number(d)] ?? d).join('');
}


