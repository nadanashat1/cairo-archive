// ============================================================================
// شاشة الدخول — شكلية في النسخة التجريبية: مفيش تحقق حقيقي ولا حفظ لأي بيانات.
// ============================================================================

import React, { useState } from 'react';
import cover from '../photos/case-cover.jpg';

export function EntryScreen({ onEnter }: { onEnter: () => void }) {
    const [email, setEmail] = useState('serag.detective@cairo-investigation.eg');
    const [password, setPassword] = useState('••••••••••');
    const [leaving, setLeaving] = useState(false);

    const enter = () => {
        setLeaving(true);
        window.setTimeout(onEnter, 450); // مهلة انتقال الحركة
    };

    return (
        <div className={`entry-screen ${leaving ? 'screen-leave' : 'screen-enter'}`}>
            <div className="entry-bg" style={{ backgroundImage: `url(${cover})` }} aria-hidden />
            <div className="entry-content">
                <h1 className="game-logo anim-fade-down">
                    <span className="game-logo-line">أرشيف القاهرة:</span>
                    <span className="game-logo-gold">قضايا الليل</span>
                </h1>
                <p className="entry-tagline anim-fade-up" style={{ animationDelay: '120ms' }}>
                    منظومة قيد الجرائم وسجلات التحقيق الجنائي — تصريح دخول رسمي لضباط وقضاة التحقيق
                </p>

                <section className="entry-card anim-scale" style={{ animationDelay: '220ms' }} aria-label="بوابة إثبات الهوية">
                    <span className="stamp stamp-red entry-stamp">⚠ سري للغاية · مستوى أول</span>
                    <div className="entry-card-head">
                        <span className="chip chip-gold">محضر رسمي رقم ٨٨٤#</span>
                        <h2>بوابة إثبات الهوية</h2>
                    </div>

                    <label className="field">
                        <span className="field-label">البريد الإلكتروني للضابط 📧</span>
                        <input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="البريد الإلكتروني" />
                        <span className="field-hint">نستخدم المعرف الرسمي المسجل بدفتر أحوال المديرية.</span>
                    </label>

                    <label className="field">
                        <span className="field-label">رمز الخزينة (كلمة السر) 🗝️</span>
                        <input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="كلمة السر" />
                        <span className="field-hint">خاضع لنظام الحماية من محاولات التسلل العشوائي.</span>
                    </label>

                    <button type="button" className="btn-amber btn-block" onClick={enter}>
                        🔒 تسجيل الدخول
                    </button>
                    <p className="entry-note">نسخة تجريبية: الدخول شكلي، ومفيش أي بيانات بتتبعت أو بتتحفظ.</p>
                </section>

                <p className="entry-footer anim-fade-up" style={{ animationDelay: '320ms' }}>
                    نظام الأرشيف: <b className="ok-dot">متصل</b> · دفتر أحوال الجنايات · القاهرة الخديوية ١٩٥٢ 📻
                </p>
            </div>
        </div>
    );
}
