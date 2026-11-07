// ============================================================================
// شاشة الدخول وإنشاء الحساب — حسابات حقيقية عبر نظام المصادقة:
// إنشاء حساب (اسم/بريد/كلمة سر/تأكيد) أو تسجيل دخول، وكل لاعب ليه سجله الخاص.
// ============================================================================

import React, { useState } from 'react';
import cover from '../photos/case-cover.jpg';
import { useAuth } from '../game/auth';

export function EntryScreen({ onEnter }: { onEnter: () => void }) {
    const { signIn, signUp, signOut, recovery, requestPasswordReset, updatePassword } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [resetMode, setResetMode] = useState(false);

    const enter = () => {
        setLeaving(true);
        window.setTimeout(onEnter, 450); // مهلة انتقال الحركة
    };

    const submit = async () => {
        if (busy) return;
        setError(null);
        setNotice(null);
        const mail = email.trim();
        if (!mail || !password) {
            setError('اكتب البريد الإلكتروني وكلمة السر الأول.');
            return;
        }
        if (mode === 'signup') {
            if (!name.trim()) {
                setError('اكتب اسم المحقق الأول.');
                return;
            }
            if (password.length < 6) {
                setError('كلمة السر لازم تكون ٦ أحرف على الأقل.');
                return;
            }
            if (password !== confirm) {
                setError('كلمتا السر مش متطابقتين. اكتبهم تاني.');
                return;
            }
        }
        setBusy(true);
        try {
            if (mode === 'login') {
                const err = await signIn(mail, password);
                if (err) {
                    setError(err);
                    return;
                }
                enter();
            } else {
                const res = await signUp(name.trim(), mail, password);
                if (res === 'ok') {
                    enter();
                } else if (res === 'confirm-email') {
                    setNotice('تم إنشاء حسابك. افتح بريدك الإلكتروني وأكّد الحساب من اللينك اللي اتبعتلك، وبعدين سجّل الدخول. لو مش لاقي الرسالة، بص في الرسائل غير المرغوبة (سبام).');
                    setMode('login');
                    setPassword('');
                    setConfirm('');
                } else {
                    setError(res);
                }
            }
        } finally {
            setBusy(false);
        }
    };

    const requestReset = async () => {
        if (busy) return;
        setError(null);
        setNotice(null);
        const mail = email.trim();
        if (!mail) {
            setError('اكتب البريد الإلكتروني بتاع حسابك الأول.');
            return;
        }
        setBusy(true);
        try {
            const err = await requestPasswordReset(mail);
            if (err) {
                setError(err);
            } else {
                setNotice('لو الحساب ده موجود، اتبعتلك لينك استرجاع على بريدك. افتح اللينك واختار كلمة سر جديدة. لو مش لاقي الرسالة، بص في الرسائل غير المرغوبة (سبام).');
                setResetMode(false);
            }
        } finally {
            setBusy(false);
        }
    };

    const submitNewPassword = async () => {
        if (busy) return;
        setError(null);
        setNotice(null);
        if (password.length < 6) {
            setError('كلمة السر لازم تكون ٦ أحرف على الأقل.');
            return;
        }
        if (password !== confirm) {
            setError('كلمتا السر مش متطابقتين. اكتبهم تاني.');
            return;
        }
        setBusy(true);
        try {
            const err = await updatePassword(password);
            if (err) {
                setError(err);
                return;
            }
            await signOut();
            setPassword('');
            setConfirm('');
            setMode('login');
            setNotice('تم تغيير كلمة السر. سجّل الدخول دلوقتي بكلمة السر الجديدة.');
        } finally {
            setBusy(false);
        }
    };

    const switchMode = (m: 'login' | 'signup') => {
        setMode(m);
        setError(null);
        setNotice(null);
    };

    if (recovery) {
        return (
            <div className="entry-screen screen-enter">
                <div className="entry-bg" style={{ backgroundImage: `url(${cover})` }} aria-hidden />
                <div className="entry-content">
                    <h1 className="game-logo anim-fade-down">
                        <span className="game-logo-line">أرشيف القاهرة:</span>
                        <span className="game-logo-gold">قضايا الليل</span>
                    </h1>
                    <section className="entry-card anim-scale" aria-label="استرجاع كلمة السر">
                        <span className="stamp stamp-red entry-stamp">⚠ سري للغاية · مستوى أول</span>
                        <div className="entry-card-head">
                            <span className="chip chip-gold">محضر رسمي رقم ٨٨٤#</span>
                            <h2>استرجاع رمز الخزينة</h2>
                        </div>
                        <label className="field">
                            <span className="field-label">كلمة السر الجديدة 🗝️</span>
                            <input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="كلمة السر الجديدة" autoComplete="new-password" />
                            <span className="field-hint">٦ أحرف على الأقل، وتتخزن مشفرة على النظام.</span>
                        </label>
                        <label className="field">
                            <span className="field-label">تأكيد كلمة السر 🔁</span>
                            <input dir="ltr" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="تأكيد كلمة السر" autoComplete="new-password" />
                        </label>
                        {error && <p className="entry-error" role="alert">{error}</p>}
                        <button type="button" className="btn-gold" onClick={() => void submitNewPassword()} disabled={busy}>
                            {busy ? '⏳ جاري الحفظ...' : '🗝️ حفظ كلمة السر الجديدة'}
                        </button>
                    </section>
                </div>
            </div>
        );
    }

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
                        <h2>{mode === 'login' ? 'بوابة إثبات الهوية' : 'قيد محقق جديد'}</h2>
                    </div>

                    {mode === 'signup' && (
                        <label className="field">
                            <span className="field-label">اسم المحقق 🕵️</span>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} aria-label="اسم المحقق" autoComplete="name" />
                            <span className="field-hint">الاسم اللي هيظهر في سجل الأرشيف.</span>
                        </label>
                    )}

                    <label className="field">
                        <span className="field-label">البريد الإلكتروني 📧</span>
                        <input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="البريد الإلكتروني" autoComplete="email" />
                    </label>

                    <label className="field">
                        <span className="field-label">رمز الخزينة (كلمة السر) 🗝️</span>
                        <input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="كلمة السر" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                        {mode === 'signup' && <span className="field-hint">٦ أحرف على الأقل، وتتخزن مشفرة على النظام.</span>}
                    </label>

                    {mode === 'login' && (
                        <p className="entry-switch">
                            نسيت كلمة السر؟{' '}
                            <button type="button" className="entry-link" onClick={() => { setResetMode((v) => !v); setError(null); setNotice(null); }}>
                                ابعتلي لينك استرجاع
                            </button>
                        </p>
                    )}
                    {mode === 'login' && resetMode && (
                        <button type="button" className="btn-dark" onClick={() => void requestReset()} disabled={busy}>
                            {busy ? '⏳ جاري الإرسال...' : '📧 ابعت لينك الاسترجاع على بريدي'}
                        </button>
                    )}

                    {mode === 'signup' && (
                        <label className="field">
                            <span className="field-label">تأكيد كلمة السر 🔁</span>
                            <input dir="ltr" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="تأكيد كلمة السر" autoComplete="new-password" />
                        </label>
                    )}

                    {error && <p className="entry-error" role="alert">{error}</p>}
                    {notice && <p className="entry-notice" role="status">{notice}</p>}

                    <button type="button" className="btn-amber btn-block" onClick={() => void submit()} disabled={busy}>
                        {busy ? '⏳ جاري التحقق...' : mode === 'login' ? '🔒 تسجيل الدخول' : '📝 إنشاء الحساب'}
                    </button>

                    <p className="entry-switch">
                        {mode === 'login' ? (
                            <>
                                لسه ماعملتش حساب؟{' '}
                                <button type="button" className="entry-link" onClick={() => switchMode('signup')}>
                                    أنشئ حساب جديد
                                </button>
                            </>
                        ) : (
                            <>
                                عندك حساب بالفعل؟{' '}
                                <button type="button" className="entry-link" onClick={() => switchMode('login')}>
                                    سجّل الدخول
                                </button>
                            </>
                        )}
                    </p>
                    <p className="entry-note">سجل تحقيقاتك بيتحفظ في حسابك على نظام الأرشيف — كل محقق بيشوف سجله بس.</p>
                </section>

                <p className="entry-footer anim-fade-up" style={{ animationDelay: '320ms' }}>
                    نظام الأرشيف: <b className="ok-dot">متصل</b> · دفتر أحوال الجنايات · القاهرة الخديوية ١٩٥٢ 📻
                </p>
            </div>
        </div>
    );
}
