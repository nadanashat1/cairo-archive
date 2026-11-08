// ============================================================================
// نظام الرتب — محقق مبتدئ ← محقق متمرّس ← كبير المحققين.
// القواعد معتمدة من صاحبة اللعبة:
// - «محقق متمرّس» بعد حل ٤ قضايا مختلفة.
// - «كبير المحققين» بعد حل التسعة كلها، منهم ٥ بامتياز:
//   الحل قبل فتح آخر ظرف ومن غير ولا اتهام غلط.
// - تقييم أول محاولة هو الثابت: لو أول محاولة خسرت، القضية تتحل عادي وتفتح
//   اللي بعدها، بس مش بتتحسب ضمن الخمسة المميزين مهما اتعادت.
// - الإعادة للمتعة بس — مفيش تحسين للتقييم بعد أول محاولة.
// - المجموع الكلي ثابت على ٩ قضايا مخططة، مش عدد المتاح حاليًا.
// ============================================================================

import { ARCHIVE_SLOTS } from './cases';
import type { CaseRecord } from './engine';

export const TOTAL_PLANNED_CASES = 9; // كل قضايا الأرشيف المخططة (معتمد من اللاعبة)
export const VETERAN_SOLVES = 4;
export const CHIEF_QUALIFYING = 5;

export type RankId = 'rookie' | 'veteran' | 'chief';

export interface RankInfo {
    id: RankId;
    name: string;
    solvedCount: number;      // قضايا محلولة من المنشورة حاليًا
    qualifyingCount: number;  // قضايا بامتياز (أول محاولة قبل آخر ظرف ومن غير خطأ)
    nextName: string | null;  // اسم الرتبة الجاية، null لو وصل القمة
    needSolved: number;       // فاضل قد إيه حل للترقية
    needQualifying: number;   // فاضل قد إيه امتياز للترقية
}

const playableIds = ARCHIVE_SLOTS.filter((s) => s.state === 'playable' && s.caseId).map((s) => s.caseId as string);

export function rankInfo(record: Record<string, CaseRecord | undefined>): RankInfo {
    const solvedCount = playableIds.filter((id) => record[id]?.won).length;
    const qualifyingCount = playableIds.filter((id) => record[id]?.firstEval?.qualified).length;
    const isChief = solvedCount >= TOTAL_PLANNED_CASES && qualifyingCount >= CHIEF_QUALIFYING;
    const isVeteran = isChief || solvedCount >= VETERAN_SOLVES;
    if (isChief) {
        return { id: 'chief', name: 'كبير المحققين', solvedCount, qualifyingCount, nextName: null, needSolved: 0, needQualifying: 0 };
    }
    if (isVeteran) {
        return {
            id: 'veteran',
            name: 'محقق متمرّس',
            solvedCount,
            qualifyingCount,
            nextName: 'كبير المحققين',
            needSolved: Math.max(0, TOTAL_PLANNED_CASES - solvedCount),
            needQualifying: Math.max(0, CHIEF_QUALIFYING - qualifyingCount),
        };
    }
    return {
        id: 'rookie',
        name: 'محقق مبتدئ',
        solvedCount,
        qualifyingCount,
        nextName: 'محقق متمرّس',
        needSolved: Math.max(0, VETERAN_SOLVES - solvedCount),
        needQualifying: 0,
    };
}

// سطر تقدّم صغير يظهر جنب الرتبة في الواجهة الخارجية.
export function rankProgressLine(info: RankInfo, num: (n: number) => string): string | null {
    if (!info.nextName) return null;
    if (info.id === 'rookie') {
        return info.needSolved === 1
            ? `فاضلك قضية واحدة وتترقّى لـ«${info.nextName}»`
            : `فاضلك ${num(info.needSolved)} قضايا مختلفة وتترقّى لـ«${info.nextName}»`;
    }
    const parts: string[] = [];
    if (info.needSolved > 0) parts.push(info.needSolved === 1 ? 'قضية واحدة' : `${num(info.needSolved)} قضايا`);
    if (info.needQualifying > 0) parts.push(info.needQualifying === 1 ? 'قضية بالمستوى ده' : `${num(info.needQualifying)} بالمستوى ده`);
    return `فاضلك ${parts.join(' و')} وتترقّى لـ«${info.nextName}»`;
}
