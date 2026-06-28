import { Teacher, TimetableSlot, AdjustmentRecord, Day } from './types';
import { CONFIG, getCorrelationLevel, getDesignationMatch, getTierScore, getGroupForSubject } from './config';

export interface AdjustmentResult {
    slot: TimetableSlot;
    adjusted_teacher_id: string;
    original_teacher_id: string;
    correlation_level: string;
    designation_match: string;
    soft_constraints_violated: string[];
    tier_score: number;
}

export class CASEEngine {
    private teachers: Map<string, Teacher>;
    private allSlots: TimetableSlot[];
    private monthlyCounts: Map<string, number>;
    private allTimeCounts: Map<string, number>;
    
    constructor(teachers: Teacher[], slots: TimetableSlot[], records: AdjustmentRecord[], currentMonth: number) {
        this.teachers = new Map(teachers.map(t => [t.id, t]));
        this.allSlots = slots;
        
        this.monthlyCounts = new Map();
        this.allTimeCounts = new Map();
        
        for (const record of records) {
            this.allTimeCounts.set(record.adjusted_teacher_id, (this.allTimeCounts.get(record.adjusted_teacher_id) || 0) + 1);
            if (record.month === currentMonth) {
                this.monthlyCounts.set(record.adjusted_teacher_id, (this.monthlyCounts.get(record.adjusted_teacher_id) || 0) + 1);
            }
        }
    }
    
    private getDayFromDate(date: string): Day {
        const d = new Date(date);
        const days: Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as Day[];
        return days[d.getDay()];
    }
    
    public generatePlan(date: string, absentTeacherIds: string[]): AdjustmentResult[] {
        const day = this.getDayFromDate(date);
        if (day === 'SUN') return []; 
        
        const vacancies = this.allSlots.filter(s => s.day === day && absentTeacherIds.includes(s.teacher_id));
        
        const periodAssignments = new Map<number, Set<string>>();
        const teacherDailyTotal = new Map<string, number>();
        
        for (const slot of this.allSlots) {
            if (slot.day === day && !absentTeacherIds.includes(slot.teacher_id)) {
                if (!periodAssignments.has(slot.period)) periodAssignments.set(slot.period, new Set());
                periodAssignments.get(slot.period)!.add(slot.teacher_id);
                teacherDailyTotal.set(slot.teacher_id, (teacherDailyTotal.get(slot.teacher_id) || 0) + 1);
            }
        }
        
        const vacancyMRV = vacancies.map(v => {
            let candidatesCount = 0;
            for (const t of this.teachers.values()) {
                if (absentTeacherIds.includes(t.id)) continue;
                const isFree = !periodAssignments.get(v.period)?.has(t.id);
                if (isFree) candidatesCount++;
            }
            return { vacancy: v, count: candidatesCount };
        });
        
        vacancyMRV.sort((a, b) => {
            if (a.count !== b.count) return a.count - b.count;
            return a.vacancy.period - b.vacancy.period;
        });
        
        const sortedVacancies = vacancyMRV.map(vm => vm.vacancy);
        const results: AdjustmentResult[] = [];
        const unresolvable: TimetableSlot[] = [];
        
        for (const vacancy of sortedVacancies) {
            let assignedTeacher: AdjustmentResult | null = null;
            const originalTeacher = this.teachers.get(vacancy.teacher_id);
            if (!originalTeacher) continue;
            
            for (let round = 1; round <= 4; round++) {
                const candidates = this.getCandidates(vacancy, round, absentTeacherIds, periodAssignments, teacherDailyTotal, originalTeacher);
                if (candidates.length > 0) {
                    assignedTeacher = candidates[0];
                    break;
                }
            }
            
            if (assignedTeacher) {
                results.push(assignedTeacher);
                if (!periodAssignments.has(vacancy.period)) periodAssignments.set(vacancy.period, new Set());
                periodAssignments.get(vacancy.period)!.add(assignedTeacher.adjusted_teacher_id);
                teacherDailyTotal.set(assignedTeacher.adjusted_teacher_id, (teacherDailyTotal.get(assignedTeacher.adjusted_teacher_id) || 0) + 1);
            } else {
                unresolvable.push(vacancy);
            }
        }
        
        return results;
    }
    
    private getCandidates(
        vacancy: TimetableSlot, 
        round: number, 
        absentTeacherIds: string[], 
        periodAssignments: Map<number, Set<string>>,
        teacherDailyTotal: Map<string, number>,
        originalTeacher: Teacher
    ): AdjustmentResult[] {
        let scoredCandidates: AdjustmentResult[] = [];
        const originalGroup = getGroupForSubject(originalTeacher.subject_group);
        
        for (const candidate of this.teachers.values()) {
            if (absentTeacherIds.includes(candidate.id)) continue;
            if (periodAssignments.get(vacancy.period)?.has(candidate.id)) continue;
            if (round < 4 && candidate.protected) continue;
            
            let consecutiveViolation = false;
            let dailyTotal = teacherDailyTotal.get(candidate.id) || 0;
            
            if (periodAssignments.get(vacancy.period - 1)?.has(candidate.id) || 
                periodAssignments.get(vacancy.period + 1)?.has(candidate.id)) {
                consecutiveViolation = true;
            }
            
            if (round === 1) {
                if (dailyTotal >= CONFIG.DAILY_LIMIT) continue;
                if (consecutiveViolation) continue;
            } else if (round === 2) {
                if (dailyTotal >= CONFIG.DAILY_LIMIT) continue;
            }
            
            const correlation = getCorrelationLevel(candidate.subject_group, vacancy.subject, originalGroup);
            const match = getDesignationMatch(candidate.designation, vacancy.class_level);
            let score = getTierScore(correlation, match);
            
            const monthlyCount = this.monthlyCounts.get(candidate.id) || 0;
            
            score -= (monthlyCount * CONFIG.FAIRNESS_WEIGHT);
            if (consecutiveViolation) score -= CONFIG.CONSECUTIVE_PENALTY;
            if (dailyTotal >= CONFIG.DAILY_LIMIT) score -= CONFIG.OVER_LIMIT_PENALTY;
            if (candidate.protected) score -= CONFIG.PROTECTED_PENALTY;
            
            const violations = [];
            if (consecutiveViolation) violations.push("Consecutive (P7)");
            if (dailyTotal >= CONFIG.DAILY_LIMIT) violations.push("Over limit (P6)");
            if (candidate.protected) violations.push("Protected (P8)");
            
            scoredCandidates.push({
                slot: vacancy,
                original_teacher_id: originalTeacher.id,
                adjusted_teacher_id: candidate.id,
                correlation_level: correlation,
                designation_match: match,
                soft_constraints_violated: violations,
                tier_score: score
            });
        }
        
        scoredCandidates.sort((a, b) => {
            if (b.tier_score !== a.tier_score) return b.tier_score - a.tier_score;
            const allTimeA = this.allTimeCounts.get(a.adjusted_teacher_id) || 0;
            const allTimeB = this.allTimeCounts.get(b.adjusted_teacher_id) || 0;
            if (allTimeA !== allTimeB) return allTimeA - allTimeB;
            return a.adjusted_teacher_id.localeCompare(b.adjusted_teacher_id);
        });
        
        return scoredCandidates;
    }
}
