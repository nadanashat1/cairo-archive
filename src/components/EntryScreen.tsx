// ============================================================================
// شاشة الدخول وإنشاء الحساب — حسابات حقيقية عبر نظام المصادقة:
// إنشاء حساب (اسم/بريد/كلمة سر/تأكيد) أو تسجيل دخول، وكل لاعب ليه سجله الخاص.
// ============================================================================

import React, { useState } from 'react';
import cover from '../photos/case-cover.jpg';
import { useAuth } from '../game/auth';


// حقل كلمة سر بزرار إظهار/إخفاء (الافتراضي مخفي). الزرار type=button فمبيعملش إرسال للفورم.
function PasswordInput({ value, onChange, label, autoComplete }: { value: string; onChange: (v: string) => void; label: string; autoComplete: string }) {
    const [shown, setShown] = useState(false);
    return (
        <span style={{ position: 'relative', display: 'block' }}>
            <input dir="ltr" type={shown ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} autoComplete={autoComplete} style={{ width: '100%', paddingRight: 44, boxSizing: 'border-box' }} />
            <button
                type="button"
                onClick={() => setShown((v) => !v)}
                aria-label={shown ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                aria-pressed={shown}
                title={shown ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 4, color: '#c9a24b', opacity: 0.8 }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                    {!shown && <line x1="3" y1="3" x2="21" y2="21" />}
                </svg>
            </button>
        </span>
    );
}

export function EntryScreen({ onEnter }: { onEnter: () => void }) {
    const { signIn, signUp, signOut, recovery, requestPasswordReset, updatePassword } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    // لو اللاعب كان مسجّل دخول في نفس التبويب وبعدين رجع لشاشة الدخول من غير ما يدوس خروج، نعرض السبب المحتمل.
    const [logoutDiag] = useState<string | null>(() => {
        try {
            if (sessionStorage.getItem('ca-login-flag') !== '1') return null;
            const lsFlag = localStorage.getItem('ca-login-flag') === '1';
            const tokenAtLogin = sessionStorage.getItem('ca-token-after-login') === '1';
            if (!lsFlag) return 'المتصفح مسح بيانات الموقع المحفوظة بعد ما سجّلت دخول (مش اللعبة اللي عملت كده). غالبًا إعداد أو إضافة في كروم بتمسح بيانات الموقع عند التحديث.';
            if (!tokenAtLogin) return 'المتصفح ما حفظش جلسة الدخول أصلًا بعد التسجيل.';
            return 'بيانات الموقع موجودة لكن جلسة الدخول اتشالت أو اترفضت.';
        } catch {
            return null;
        }
    });
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
                // تشخيص بسيط: بنسجّل إن الدخول حصل ونتأكد إن المتصفح حافظ على التوكن (لو الصفحة اتحدّثت وطلبت دخول تاني هنعرف السبب).
                try {
                    localStorage.setItem('ca-login-flag', '1');
                    sessionStorage.setItem('ca-login-flag', '1');
                    const hasToken = Object.keys(localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
                    sessionStorage.setItem('ca-token-after-login', hasToken ? '1' : '0');
                } catch { /* التخزين مش متاح */ }
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
                            <PasswordInput value={password} onChange={setPassword} label="كلمة السر الجديدة" autoComplete={"new-password"} />
                            <span className="field-hint">٦ أحرف على الأقل، وتتخزن مشفرة على النظام.</span>
                        </label>
                        <label className="field">
                            <span className="field-label">تأكيد كلمة السر 🔁</span>
                            <PasswordInput value={confirm} onChange={setConfirm} label="تأكيد كلمة السر" autoComplete={"new-password"} />
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
                {logoutDiag && (
                    <p role="status" style={{ maxWidth: 560, margin: '8px auto', textAlign: 'center', fontSize: 13, color: '#f0c969', border: '1px solid #c9a24b', borderRadius: 8, padding: '8px 12px' }}>{logoutDiag}</p>
                )}
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
                        <PasswordInput value={password} onChange={setPassword} label="كلمة السر" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
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
                            <PasswordInput value={confirm} onChange={setConfirm} label="تأكيد كلمة السر" autoComplete={"new-password"} />
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
                    صُنعت بواسطة <b className="gold-text">ندى نشأت</b> 🤍 · نظام الأرشيف: <b className="ok-dot">متصل</b> · دفتر أحوال الجنايات · القاهرة الخديوية ١٩٥٢ 📻
                </p>
            </div>
        </div>
    );
}

