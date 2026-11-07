// ============================================================================
// شاشة أرشيف القضايا — القضية الأولى متاحة، والباقي مقفل (محتواه لسه متكتبش).
// ============================================================================

import React from 'react';
import { ARCHIVE_SLOTS } from '../game/cases';
import cover from '../photos/case-cover.jpg';

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
                                <div className="case-card-locked-art" aria-hidden>🗂️</div>
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
