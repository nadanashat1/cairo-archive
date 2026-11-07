// ============================================================================
// شاشة أرشيف القضايا — القضية الأولى متاحة، والباقي مقفل (محتواه لسه متكتبش).
// ============================================================================

import React from 'react';
import { ARCHIVE_SLOTS } from '../game/cases';
import cover from '../photos/case-cover.jpg';
import caseTea from '../photos/1-case-2-tea.png';
import caseOffice from '../photos/2-case-3-office.png';
import caseTrain from '../photos/3-case-4-train.png';
import caseCasino from '../photos/4-case-5-casino.png';
import casePainting from '../photos/5-case-6-painting.png';
import caseOpera from '../photos/6-case-7-opera.png';
import caseHotel from '../photos/7-case-8-hotel.png';

const LOCKED_ART: Record<number, { src: string; alt: string }> = {
    2: { src: caseTea, alt: 'فنجان شاي جنب زجاجة سم على صينية نحاس — جو قضية سم في فنجان الشاي' },
    3: { src: caseOffice, alt: 'باب مكتب مقفول والنور خارج من تحته — جو قضية جريمة في المكتب المقفول' },
    4: { src: caseTrain, alt: 'قطار بخاري ليلي في محطة مليانة ضباب — جو قضية لغز قطار الإسكندرية' },
    5: { src: caseCasino, alt: 'ترابيزة كازينو قدام نيل الليل — جو قضية جريمة كازينو النيل' },
    6: { src: casePainting, alt: 'إطار لوحة دهب فاضي على حيطة قصر — جو قضية اختفاء لوحة الباشا' },
    7: { src: caseOpera, alt: 'علبة جواهر مخمل فاضية قدام الأوبرا — جو قضية سرقة جواهر أوبرا الخديوي' },
    8: { src: caseHotel, alt: 'شنطة مفتوحة فاضية في بهو فندق فخم — جو قضية جريمة فندق شبرد' },
};

export function ArchiveScreen({ onPlay }: { onPlay: (caseId: string) => void }) {
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
                        className={`case-card anim-rise ${slot.state === 'playable' ? 'is-playable' : 'is-locked'}`}
                        style={{ animationDelay: `${i * 90}ms` }}
                    >
                        <div className="case-card-media">
                            {slot.state === 'playable' ? (
                                <img src={cover} alt="غلاف توضيحي لقضية أسورة الهانم" />
                            ) : (
                                <img src={LOCKED_ART[slot.number]!.src} alt={LOCKED_ART[slot.number]!.alt} />
                            )}
                            <span className={`chip ${slot.state === 'playable' ? 'chip-gold' : 'chip-dark'}`}>
                                {slot.state === 'playable' ? '● الدور عليك' : '🔒 مقفلة'}
                            </span>
                        </div>
                        <h2 className="case-card-title">قضية {toArabicNumeral(slot.number)}: {slot.title}</h2>
                        {slot.state === 'playable' ? (
                            <button type="button" className="btn-amber btn-block" onClick={() => onPlay(slot.caseId!)}>
                                ابدأ التحقيق
                            </button>
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
