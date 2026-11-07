// ============================================================================
// هيكل الصفحات المشترك: الشريط العلوي، الهيدر، الفوتر، وتحكم الصوت.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { noirAudio } from '../game/audio';

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
    const [open, setOpen] = useState(false);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(0.5);

    useEffect(() => () => noirAudio.stopMusic(), []);

    const toggle = () => {
        if (playing) {
            noirAudio.stopMusic();
            setPlaying(false);
            setOpen(false);
        } else {
            noirAudio.startMusic();
            setPlaying(true);
            setOpen(true);
        }
    };

    return (
        <div className="audio-control">
            <button type="button" className={`chip chip-button ${playing ? 'is-on' : ''}`} onClick={toggle} aria-pressed={playing}>
                <span className={`eq ${playing ? 'eq-on' : ''}`}><i /><i /><i /></span>
                أصوات المطر / الجاز الهادئ
            </button>
            {playing && open && (
                <div className="audio-pop anim-pop" role="group" aria-label="تحكم الصوت">
                    <button
                        type="button"
                        className="chip chip-button"
                        onClick={() => { const m = !muted; noirAudio.setMuted(m); setMuted(m); }}
                        aria-pressed={muted}
                    >
                        {muted ? '🔇 مكتوم' : '🔊 الصوت شغال'}
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(volume * 100)}
                        aria-label="درجة الصوت"
                        onChange={(e) => {
                            const v = Number(e.target.value) / 100;
                            setVolume(v);
                            noirAudio.setVolume(v);
                            if (v > 0 && muted) { noirAudio.setMuted(false); setMuted(false); }
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export function GameHeader({ activeTab, onNavigate }: { activeTab: 'case' | 'archive' | 'records'; onNavigate: (tab: 'case' | 'archive' | 'records') => void }) {
    return (
        <header className="game-header anim-fade-down">
            <div className="header-identity">
                <span className="header-badge" aria-hidden>🛡️</span>
                <div className="header-title-block">
                    <div className="header-title-row">
                        <span className="header-title">أرشيف القاهرة: قضايا الليل</span>
                        <span className="chip chip-secret">ملف سري ٤٢٤#</span>
                    </div>
                    <div className="header-sub">المحقق: سراج مهران · القضية: أسورة الهانم</div>
                </div>
            </div>
            <nav className="header-nav" aria-label="التنقل الرئيسي">
                <button type="button" className={`nav-tab ${activeTab === 'case' ? 'is-active' : ''}`} onClick={() => onNavigate('case')}>شاشة القضية الحالية</button>
                <button type="button" className={`nav-tab ${activeTab === 'archive' ? 'is-active' : ''}`} onClick={() => onNavigate('archive')}>قائمة القضايا والملفات</button>
                <button type="button" className={`nav-tab ${activeTab === 'records' ? 'is-active' : ''}`} onClick={() => onNavigate('records')}>سجل الإدانات</button>
            </nav>
            <div className="header-side">
                <AudioControl />
            </div>
        </header>
    );
}

export function GameFooter() {
    return (
        <footer className="game-footer anim-fade-up">
            <span>نظام الأرشيف: <b className="ok-dot">متصل</b></span>
            <span>دفتر أحوال الجنايات · القاهرة الخديوية ١٩٥٢ 📻</span>
            <span>حالة الاتصال: خط مشفر ومؤمن — جميع السجلات سرية ومحمية رسميًا</span>
        </footer>
    );
}
