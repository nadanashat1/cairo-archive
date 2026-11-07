// ============================================================================
// التطبيق — موجّه الشاشات: دخول ← أرشيف ← لعب ← نتيجة.
// منطق الجولة (useGameEngine) مرفوع هنا عشان حالة الجولة تفضل عايشة أثناء
// التنقل بين شاشة اللعب وشاشات النتيجة.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { getCase, CASE_HANEM_BRACELET, ARCHIVE_SLOTS, type CaseData } from './game/cases';
import { useGameEngine, clearSavedRound } from './game/engine';
import { AuthProvider, useAuth } from './game/auth';
import { noirAudio } from './game/audio';
import { TopStrip, GameHeader, GameFooter } from './components/chrome';
import { toArabicNumeral } from './components/ArchiveScreen';
import { EntryScreen } from './components/EntryScreen';
import { ArchiveScreen } from './components/ArchiveScreen';
import { GameScreen } from './components/GameScreen';
import { WinScreen, LossScreen } from './components/ResultScreens';

type Screen = 'archive' | 'game' | 'records';

function GameFlow({ caseData, onArchive }: { caseData: CaseData; onArchive: () => void }) {
    const engine = useGameEngine(caseData);
    const s = engine.state;

    if (s.status === 'won') {
        return (
            <WinScreen
                caseData={caseData}
                remainingMs={engine.remainingMs}
                wrongAccusations={s.wrongAccusations}
                cluesUsed={engine.revealedCount}
                onReplay={() => engine.restart(false)}
                onArchive={onArchive}
            />
        );
    }
    if (s.status === 'lost') {
        return <LossScreen caseData={caseData} onRetry={(extra) => engine.restart(extra)} onArchive={onArchive} />;
    }
    return <GameScreen caseData={caseData} engine={engine} onExit={onArchive} />;
}

function RecordsScreen({ onArchive }: { onArchive: () => void }) {
    // سجل الإدانات: للاعب المسجل من حسابه على النظام، وللضيف من الجهاز.
    // كل قضية متاحة وليها سجلها الخاص المتعزول بمفتاح القضية.
    const { isWon } = useAuth();
    const wonCases = ARCHIVE_SLOTS.filter((slot) => slot.state === 'playable' && slot.caseId && isWon(slot.caseId)).map((slot) => ({
        slot,
        caseData: getCase(slot.caseId!),
    }));
    return (
        <main className="records-screen screen-enter">
            <h1 className="display-title anim-fade-up">سجل الإدانات</h1>
            {wonCases.length > 0 ? (
                wonCases.map(({ slot, caseData }) => {
                    const culprit = caseData.suspects.find((c) => c.id === caseData.culpritId)!;
                    const label = caseData.recordLabel ?? 'اللص';
                    return (
                        <article className="record-card anim-rise" key={caseData.id}>
                            <span className="chip chip-gold">إدانة مؤكدة ✓</span>
                            <h2>قضية {toArabicNumeral(caseData.number)}: {caseData.title}</h2>
                            <p>{label}: {culprit.name} — اتقفلت بالأدلة الجنائية.</p>
                        </article>
                    );
                })
            ) : (
                <p className="records-empty anim-fade-up">لسه مفيش إدانات مسجلة. اقفل أول قضية وهتلاقيها هنا.</p>
            )}
            <button type="button" className="btn-dark" onClick={onArchive}>📋 العودة لأرشيف القضايا</button>
        </main>
    );
}

export function App() {
    return (
        <AuthProvider>
            <AppInner />
        </AuthProvider>
    );
}

function AppInner() {
    const [screen, setScreen] = useState<Screen>('archive');
    const [activeCase, setActiveCase] = useState<CaseData | null>(null);
    const { user, ready, recovery } = useAuth();

    // الموسيقى بتبدأ تلقائيًا مع فتح الموقع (ومع أول تفاعل لو المتصفح مانع)
    useEffect(() => { noirAudio.autoStart(); }, []);

    const goArchive = () => { setActiveCase(null); setScreen('archive'); };

    // لسه بنحمّل حالة الجلسة المحفوظة
    if (!ready) {
        return (
            <div className="noir-app" dir="rtl" lang="ar">
                <div className="app-loading">⏳ جاري فتح سجلات الأرشيف...</div>
            </div>
        );
    }

    // مفيش حساب مسجل، أو المستخدم جاي من لينك استرجاع كلمة السر:
    // بوابة إثبات الهوية هي أول شاشة (وفي حالة الاسترجاع بتعرض فورم كلمة سر جديدة)
    if (!user || recovery) {
        return (
            <div className="noir-app" dir="rtl" lang="ar">
                <EntryScreen onEnter={() => setScreen('archive')} />
            </div>
        );
    }

    return (
        <div className="noir-app" dir="rtl" lang="ar">
            <TopStrip />
            <GameHeader
                activeTab={screen === 'game' ? 'case' : screen === 'records' ? 'records' : 'archive'}
                caseTitle={activeCase?.title}
                onNavigate={(tab) => {
                    if (tab === 'archive') goArchive();
                    else if (tab === 'records') setScreen('records');
                    else if (activeCase) setScreen('game');
                    else { setActiveCase(getCase(CASE_HANEM_BRACELET.id)); setScreen('game'); }
                }}
            />
            {screen === 'archive' && (
                <ArchiveScreen onPlay={(caseId) => { setActiveCase(getCase(caseId)); setScreen('game'); }} />
            )}
            {screen === 'records' && <RecordsScreen onArchive={goArchive} />}
            {screen === 'game' && activeCase && (
                <GameFlow key={`${activeCase.id}`} caseData={activeCase} onArchive={goArchive} />
            )}
            <GameFooter />
        </div>
    );
}

export { clearSavedRound };

