// ============================================================================
// نظام الحسابات: تسجيل/دخول حقيقي عن طريق Supabase Auth.
// - كلمات السر بتتخزن مشفرة عند مزود الخدمة، مش في التطبيق ولا على الجهاز.
// - بيانات كل لاعب (الاسم + سجل الإدانات) في جدول محمي بسياسات RLS:
//   كل حساب يقرأ ويكتب صفه بس.
// - الضيف (من غير حساب) بيكمل بنفس السلوك المحلي القديم، وبياناته المحلية
//   منفصلة تمامًا ومبتتنقلش لأي حساب.
// ============================================================================

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { loadRecord, loadCaseRecord, mergeCaseRecord, setRecordSink } from './engine';
import type { CaseFirstEval, CaseRecord } from './engine';
import { ARCHIVE_SLOTS } from './cases';

export interface PlayerProfile {
    display_name: string;
    record: Record<string, CaseRecord>;
}

export interface AuthApi {
    user: User | null;
    profile: PlayerProfile | null;
    ready: boolean;
    displayName: string;
    signIn: (email: string, password: string) => Promise<string | null>;
    signUp: (name: string, email: string, password: string) => Promise<'ok' | 'confirm-email' | string>;
    signOut: () => Promise<void>;
    recovery: boolean;
    requestPasswordReset: (email: string) => Promise<string | null>;
    updatePassword: (password: string) => Promise<string | null>;
    isWon: (caseId: string) => boolean;
    // كل سجلات القضايا المنشورة (فوز + تقييم أول محاولة) — لنظام الرتب.
    getRecords: () => Record<string, CaseRecord>;
}

const AuthCtx = createContext<AuthApi | null>(null);

export function useAuth(): AuthApi {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error('useAuth خارج AuthProvider');
    return ctx;
}

function mapAuthError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes('invalid login credentials')) return 'البريد الإلكتروني أو كلمة السر مش صح. راجعهم وحاول تاني.';
    if (m.includes('email not confirmed')) return 'الحساب ده لسه محتاج تأكيد البريد الإلكتروني قبل أول دخول.';
    if (m.includes('user already registered')) return 'في حساب مسجل بالبريد ده بالفعل. جرّب تسجيل الدخول.';
    if (m.includes('at least') && m.includes('password')) return 'كلمة السر لازم تكون ٦ أحرف على الأقل.';
    if (m.includes('email')) return 'صيغة البريد الإلكتروني مش صحيحة.';
    if (m.includes('password')) return 'كلمة السر لازم تكون ٦ أحرف على الأقل.';
    return 'حصلت مشكلة في الاتصال بالنظام. حاول تاني بعد شوية.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [ready, setReady] = useState(false);
    const [recovery, setRecovery] = useState(false);
    const profileRef = useRef<PlayerProfile | null>(null);
    profileRef.current = profile;

    const loadProfile = useCallback(async (u: User) => {
        const fallbackName = (u.user_metadata?.display_name as string) || u.email?.split('@')[0] || 'محقق';
        const { data } = await supabase
            .from('player_progress')
            .select('display_name, record')
            .eq('user_id', u.id)
            .maybeSingle();
        const name = (data?.display_name as string) || fallbackName;
        if (!data) {
            // أول دخول: إنشاء صف اللاعب بالاسم بس — من غير نقل أي سجل محلي قديم
            await supabase.from('player_progress').upsert({ user_id: u.id, display_name: name });
        }
        setProfile({ display_name: name, record: (data?.record as PlayerProfile['record']) ?? {} });
    }, []);

    useEffect(() => {
        let mounted = true;
        void supabase.auth.getSession().then(async ({ data }) => {
            if (!mounted) return;
            const u = data.session?.user ?? null;
            setUser(u);
            if (u) await loadProfile(u);
            setReady(true);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
            const u = session?.user ?? null;
            setUser(u);
            if (event === 'PASSWORD_RECOVERY') setRecovery(true);
            if (u) void loadProfile(u);
            else setProfile(null);
        });
        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, [loadProfile]);

    // لما لاعب مسجل ينهي محاولة (فوز أو خسارة)، النتيجة بتتحفظ في سجل حسابه
    // على النظام. تقييم أول محاولة ثابت ومش بيتبدل بالإعادة (mergeCaseRecord).
    // الضيف بيفضل على التخزين المحلي زي ما هو.
    const persistWin = useCallback(
        (caseId: string, evaluation: CaseFirstEval) => {
            if (!user) return;
            const record = { ...(profileRef.current?.record ?? {}) };
            record[caseId] = mergeCaseRecord(record[caseId], evaluation);
            const name = profileRef.current?.display_name ?? 'محقق';
            setProfile((p) => (p ? { ...p, record } : p));
            // لازم await: باني الاستعلام في supabase-js مبيبعتش الطلب غير لما يتعمله await —
            // من غيره الفوز كان بيتسجل في الواجهة بس ومبيتحفظش على النظام.
            void (async () => {
                await supabase.from('player_progress').upsert({ user_id: user.id, display_name: name, record });
            })();
        },
        [user],
    );

    useEffect(() => {
        setRecordSink(user ? persistWin : null);
        return () => setRecordSink(null);
    }, [user, persistWin]);

    // سجلات القضايا المنشورة كلها: من الحساب للاعب المسجل، ومن الجهاز للضيف.
    const getRecords = useCallback((): Record<string, CaseRecord> => {
        if (user) return profileRef.current?.record ?? {};
        const out: Record<string, CaseRecord> = {};
        for (const slot of ARCHIVE_SLOTS) {
            if (slot.state !== 'playable' || !slot.caseId) continue;
            const rec = loadCaseRecord(slot.caseId);
            if (rec) out[slot.caseId] = rec;
        }
        return out;
    }, [user]);

    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? mapAuthError(error.message) : null;
    }, []);

    const signUp = useCallback(async (name: string, email: string, password: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: name } },
        });
        if (error) return mapAuthError(error.message);
        // لو تأكيد البريد مفعّل في إعدادات النظام، مفيش جلسة فورية
        if (!data.session) return 'confirm-email';
        return 'ok';
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setRecovery(false);
    }, []);

    const requestPasswordReset = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        return error ? mapAuthError(error.message) : null;
    }, []);

    const updatePassword = useCallback(async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        return error ? mapAuthError(error.message) : null;
    }, []);

    const isWon = useCallback(
        (caseId: string) => {
            if (user) return !!profile?.record?.[caseId]?.won;
            return loadRecord(caseId);
        },
        [user, profile],
    );

    const api: AuthApi = {
        user,
        profile,
        ready,
        displayName: profile?.display_name ?? '',
        signIn,
        signUp,
        signOut,
        recovery,
        requestPasswordReset,
        updatePassword,
        isWon,
        getRecords,
    };

    return <AuthCtx.Provider value={api}>{children}</AuthCtx.Provider>;
}

