// ============================================================================
// هيكل الصفحات المشترك: الشريط العلوي، الهيدر، الفوتر، وتحكم الصوت.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { noirAudio } from '../game/audio';
import { useAuth } from '../game/auth';
import { rankInfo, rankProgressLine } from '../game/ranks';
import { toArabicNumeral } from './ArchiveScreen';

export function TopStrip() {
    return (
        <div className="top-strip anim-fade-down">
            <span>مباحث القاهرة - ١٩٥٢ · وصول مقيد لأفراد التحقيق الجنائي</span>
            <span className="top-strip-warning">⚠ محظور التداول العام - سرية مطلقة</span>
        </div>
    );
}

export function AudioControl() {
    const [playing, setPlaying] = useState(false);

    useEffect(() => () => noirAudio.stopMusic(), []);

    // Keep the icon in sync with the music, including autoplay.
    useEffect(() => {
        const id = window.setInterval(() => setPlaying(noirAudio.isPlaying), 400);
        return () => window.clearInterval(id);
    }, []);

    const toggle = () => {
        if (playing) {
            noirAudio.userStop();
            setPlaying(false);
        } else {
            noirAudio.startMusic();
            setPlaying(true);
        }
    };

    return (
        <div className="audio-control">
            <button
                type="button"
                className={`chip chip-button audio-toggle ${playing ? 'is-on' : ''}`}
                onClick={toggle}
                aria-pressed={playing}
                aria-label={playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
                title={playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}
            >
                <svg className="gramophone-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M12.5 12 23 4.5v11l-10.5-3.8Z" />
                    <ellipse cx="23.5" cy="10" rx="3.5" ry="5.8" />
                    <path d="M12.5 12v5l-3.3 3.1" />
                    <circle cx="8.5" cy="22.5" r="5.5" />
                    <circle cx="8.5" cy="22.5" r="1.7" />
                    <path d="M2.5 29h24M25 16v7" />
                </svg>
            </button>
        </div>
    );
}

export function GameHeader({ activeTab, caseTitle, onNavigate }: { activeTab: 'case' | 'archive' | 'records'; caseTitle?: string; onNavigate: (tab: 'case' | 'archive' | 'records') => void }) {
    const { displayName, signOut, getRecords, saveError } = useAuth();
    const rank = rankInfo(getRecords());
    const rankProgress = rankProgressLine(rank, toArabicNumeral);
    return (
        <header className="game-header anim-fade-down">
            <div className="header-identity">
                <span className="header-badge" aria-hidden>🛡️</span>
                <div className="header-title-block">
                    <div className="header-title-row">
                        <span className="header-title">أرشيف القاهرة: قضايا الليل</span>
                        <span className="chip chip-secret">ملف سري ٤٢٤#</span>
                    </div>
                    <div className="header-sub">المحقق: {displayName} · القضية: {caseTitle ?? 'أسورة الهانم'}</div>
                    <div className="header-sub rank-line" title="رتبتك في الأرشيف والتقدم نحو الرتبة الجاية">
                        🎖️ {rank.name}{rankProgress ? ` · ${rankProgress}` : ' · أعلى رتبة في الأرشيف'}
                    </div>
                    {saveError && (
                        <div className="header-sub save-error-line" role="alert">
                            ⚠ حصلت مشكلة في حفظ سجلّك على النظام — هنحاول تاني مع أول نتيجة جاية. لو الرسالة فضلت ظاهرة، سجّل الخروج والدخول من تاني.
                        </div>
                    )}
                </div>
            </div>
            <nav className="header-nav" aria-label="التنقل الرئيسي">
                <button type="button" className={`nav-tab ${activeTab === 'case' ? 'is-active' : ''}`} onClick={() => onNavigate('case')}>شاشة القضية الحالية</button>
                <button type="button" className={`nav-tab ${activeTab === 'archive' ? 'is-active' : ''}`} onClick={() => onNavigate('archive')}>قائمة القضايا والملفات</button>
                <button type="button" className={`nav-tab ${activeTab === 'records' ? 'is-active' : ''}`} onClick={() => onNavigate('records')}>سجل الإدانات</button>
            </nav>
            <div className="header-side">
                <span className="chip chip-gold header-player" title="المحقق الحالي">🕵️ {displayName}</span>
                <button type="button" className="chip chip-button" onClick={() => void signOut()} title="تسجيل الخروج">
                    🚪 خروج
                </button>
                <AudioControl />
            </div>
        </header>
    );
}

export function GameFooter() {
    return (
        <footer className="game-footer anim-fade-up">
            <span className="creator-credit">صُنعت بواسطة <b className="gold-text">ندى نشأت</b> 🤍</span>
            <span>نظام الأرشيف: <b className="ok-dot">متصل</b></span>
            <span>دفتر أحوال الجنايات · القاهرة الخديوية ١٩٥٢ 📻</span>
            <span>حالة الاتصال: خط مشفر ومؤمن — جميع السجلات سرية ومحمية رسميًا</span>
            <span className="music-credit">
                الموسيقى: Mysterioso March — Kevin MacLeod (incompetech.com) ·{' '}
                <a className="source-link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
                    Licensed under Creative Commons: By Attribution 4.0
                </a>
            </span>
        </footer>
    );
}

