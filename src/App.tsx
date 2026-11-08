// ============================================================================
// التطبيق — موجّه الشاشات: دخول ← أرشيف ← لعب ← نتيجة.
// منطق الجولة (useGameEngine) مرفوع هنا عشان حالة الجولة تفضل عايشة أثناء
// التنقل بين شاشة اللعب وشاشات النتيجة.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { getCase, ARCHIVE_SLOTS, type CaseData } from './game/cases';
import { rankInfo, type RankInfo } from './game/ranks';
import { useGameEngine, clearSavedRound } from './game/engine';
import { AuthProvider, useAuth } from './game/auth';
import { noirAudio } from './game/audio';
import { TopStrip, GameHeader, GameFooter } from './components/chrome';
import { toArabicNumeral } from './components/ArchiveScreen';
import { EntryScreen } from './components/EntryScreen';
import { ArchiveScreen } from './components/ArchiveScreen';
import { GameScreen } from './components/GameScreen';
import { WinScreen, LossScreen, SolutionScreen } from './components/ResultScreens';

type Screen = 'archive' | 'game' | 'records' | 'solution';

// معاينة قصة قضية لصاحبة الحساب بس (بدون بدء تحقيق ولا أي حفظ في السجل).
const PREVIEW_OWNER_EMAIL = 'nadanashat15@gmail.com';
const PREVIEW_CASE_IDS = ['qena-boat'];

function PreviewFlow({ caseData, onArchive }: { caseData: CaseData; onArchive: () => void }) {
    const engine = useGameEngine(caseData);
    return (
        <>
            <div className="preview-banner" role="status" style={{ margin: '12px auto', maxWidth: 900, textAlign: 'center', padding: '10px 14px', border: '1px solid #c9a24b', borderRadius: 8, color: '#f0c969' }}>
                👁️ معاينة القضية فقط — مش محاولة، ومفيش نتيجة هتتسجل، ومفيش أي تأثير على ترتيبك أو رتبتك.
            </div>
            <GameScreen caseData={caseData} engine={engine} onExit={onArchive} preview />
        </>
    );
}

function GameFlow({ caseData, onArchive }: { caseData: CaseData; onArchive: () => void }) {
    const engine = useGameEngine(caseData);
    const s = engine.state;
    const { getRecords } = useAuth();
    // رتبة اللاعب لحظة دخول القضية — عشان نعرف لو الفوز ده سبب ترقية.
    const rankAtEntry = useRef<RankInfo | null>(null);
    if (rankAtEntry.current === null) rankAtEntry.current = rankInfo(getRecords());

    if (s.status === 'won') {
        const infoNow = rankInfo(getRecords());
        let rankNotice: string | null = null;
        if (infoNow.id !== rankAtEntry.current.id) {
            rankNotice = `مبروك الترقية يا حضرة المحقق! بقيت رسميًا «${infoNow.name}»`;
        } else if (infoNow.id === 'veteran' && infoNow.needQualifying === 1 && infoNow.needSolved <= 1) {
            rankNotice = 'عينك لاقطة وخيطك مظبوط، فاضلك قضية بالمستوى ده وتترقّى';
        } else if (infoNow.id === 'rookie' && infoNow.needSolved === 1) {
            rankNotice = 'عينك لاقطة وخيطك مظبوط، فاضلك قضية واحدة وتترقّى لـ«محقق متمرّس»';
        }
        return (
            <WinScreen
                caseData={caseData}
                remainingMs={engine.remainingMs}
                wrongAccusations={s.wrongAccusations}
                cluesUsed={engine.revealedCount}
                totalClues={engine.totalClues}
                rankNotice={rankNotice}
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

function RecordsScreen({ onArchive, onOpen }: { onArchive: () => void; onOpen: (caseId: string) => void }) {
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
                    const label = caseData.recordLabel ?? 'الجاني';
                    return (
                        <article
                            className="record-card record-card-open anim-rise"
                            key={caseData.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onOpen(caseData.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(caseData.id); } }}
                        >
                            <span className="chip chip-gold">إدانة مؤكدة ✓</span>
                            <h2>قضية {toArabicNumeral(caseData.number)}: {caseData.title}</h2>
                            <p>{label}: {culprit.name} — اتقفلت بالأدلة الجنائية.</p>
                            <p className="record-hint">📖 اضغط لقراءة شرح الحل</p>
                        </article>
                    );
                })
            ) : (
                <p className="records-empty anim-fade-up">لسه مفيش إدانات مسجلة. اقفل أول قضية وهتلاقيها هنا.</p>
            )}
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
    const [solutionCaseId, setSolutionCaseId] = useState<string | null>(null);
    const { user, ready, recovery, isWon } = useAuth();
    const previewId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('preview') : null;
    const previewCase = user && !recovery && user.email === PREVIEW_OWNER_EMAIL && previewId && PREVIEW_CASE_IDS.includes(previewId) ? getCase(previewId) : null;

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
                activeTab={screen === 'game' ? 'case' : screen === 'records' || screen === 'solution' ? 'records' : 'archive'}
                caseTitle={activeCase?.title}
                onNavigate={(tab) => {
                    if (tab === 'archive') goArchive();
                    else if (tab === 'records') setScreen('records');
                    else {
                        // شاشة القضية الحالية = القضية اللي عليها الدور: أول قضية لسه ما اتكسبتش بالترتيب.
                        const due = ARCHIVE_SLOTS.find((slot) => slot.state === 'playable' && slot.caseId && !isWon(slot.caseId));
                        if (screen === 'game' && activeCase) setScreen('game');
                        else if (due && due.caseId) { setActiveCase(getCase(due.caseId)); setScreen('game'); }
                        else goArchive(); // كل القضايا اتحلت: نفضل في الأرشيف
                    }
                }}
            />
            {previewCase && screen === 'archive' && (
                <PreviewFlow caseData={previewCase} onArchive={() => { window.history.replaceState(null, '', window.location.pathname); setScreen('records'); goArchive(); }} />
            )}
            {!previewCase && screen === 'archive' && (
                <ArchiveScreen onPlay={(caseId) => { setActiveCase(getCase(caseId)); setScreen('game'); }} />
            )}
            {screen === 'records' && <RecordsScreen onArchive={goArchive} onOpen={(id) => { setSolutionCaseId(id); setScreen('solution'); }} />}
            {screen === 'solution' && solutionCaseId && isWon(solutionCaseId) && (
                <SolutionScreen caseData={getCase(solutionCaseId)} onBack={() => setScreen('records')} />
            )}
            {screen === 'game' && activeCase && (
                <GameFlow key={`${activeCase.id}`} caseData={activeCase} onArchive={goArchive} />
            )}
            <GameFooter />
        </div>
    );
}

export { clearSavedRound };

