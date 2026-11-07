// ============================================================================
// التطبيق — موجّه الشاشات: دخول ← أرشيف ← لعب ← نتيجة.
// منطق الجولة (useGameEngine) مرفوع هنا عشان حالة الجولة تفضل عايشة أثناء
// التنقل بين شاشة اللعب وشاشات النتيجة.
// ============================================================================

import React, { useState } from 'react';
import { getCase, CASE_HANEM_BRACELET, type CaseData } from './game/cases';
import { useGameEngine, clearSavedRound } from './game/engine';
import { TopStrip, GameHeader, GameFooter } from './components/chrome';
import { EntryScreen } from './components/EntryScreen';
import { ArchiveScreen } from './components/ArchiveScreen';
import { GameScreen } from './components/GameScreen';
import { WinScreen, LossScreen } from './components/ResultScreens';

type Screen = 'entry' | 'archive' | 'game' | 'records';

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
    // سجل الإدانات: بيقرأ آخر نتيجة محفوظة محليًا على الجهاز
    let won = false;
    try {
        const raw = localStorage.getItem(`cairo-archive-round-${CASE_HANEM_BRACELET.id}`);
        won = !!raw && JSON.parse(raw).status === 'won';
    } catch { /* ignore */ }
    return (
        <main className="records-screen screen-enter">
            <h1 className="display-title anim-fade-up">سجل الإدانات</h1>
            {won ? (
                <article className="record-card anim-rise">
                    <span className="chip chip-gold">إدانة مؤكدة ✓</span>
                    <h2>قضية ١: أسورة الهانم</h2>
                    <p>اللص: كامل، ابن الهانم — اتقفلت بالأدلة الجنائية.</p>
                </article>
            ) : (
                <p className="records-empty anim-fade-up">لسه مفيش إدانات مسجلة. اقفل أول قضية وهتلاقيها هنا.</p>
            )}
            <button type="button" className="btn-dark" onClick={onArchive}>📋 العودة لأرشيف القضايا</button>
        </main>
    );
}

export function App() {
    const [screen, setScreen] = useState<Screen>('entry');
    const [activeCase, setActiveCase] = useState<CaseData | null>(null);

    const goArchive = () => { setActiveCase(null); setScreen('archive'); };

    if (screen === 'entry') {
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
