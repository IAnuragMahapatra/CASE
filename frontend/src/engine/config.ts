import { Designation } from './types';

export const CONFIG = {
  DAILY_LIMIT: 6,
  DESIGNATION_MISMATCH_FACTOR: 0.42,
  FAIRNESS_WEIGHT: 10,
  CONSECUTIVE_PENALTY: 80,
  OVER_LIMIT_PENALTY: 120,
  PROTECTED_PENALTY: 400
};

export const SUBJECT_GROUPS: Record<string, string[]> = {
  'Science': ['Physics', 'Chemistry', 'Biology', 'Computer Science', 'Science'],
  'Mathematics': ['Mathematics'],
  'Social Studies': ['History', 'Geography', 'Social Science', 'Economics'],
  'Language': ['English', 'Hindi', 'Sanskrit', 'Odia'],
  'Commerce': ['Commerce', 'Economics'],
  'Arts & Physical': ['Music', 'Arts', 'Physical Education'],
  'General': ['General']
};

export const SUBJECT_CORRELATION: Record<string, { high: string[], medium: string[] }> = {
  'Physics': { high: ['Chemistry', 'Mathematics'], medium: ['Computer Science', 'Science'] },
  'Chemistry': { high: ['Physics', 'Biology'], medium: ['Mathematics', 'Science'] },
  'Biology': { high: ['Chemistry', 'Science'], medium: ['Physics'] },
  'Mathematics': { high: ['Physics', 'Computer Science'], medium: ['Chemistry', 'Economics', 'Commerce', 'Science'] },
  'Computer Science': { high: ['Mathematics'], medium: ['Physics', 'Science'] },
  'Science': { high: ['Biology', 'Chemistry'], medium: ['Physics', 'Mathematics', 'Computer Science'] },
  'Geography': { high: ['History', 'Social Science'], medium: ['Economics'] },
  'History': { high: ['Geography', 'Social Science'], medium: ['Economics'] },
  'Economics': { high: ['Commerce'], medium: ['History', 'Geography', 'Mathematics', 'Social Science'] },
  'Commerce': { high: ['Economics'], medium: ['Mathematics'] },
  'Social Science': { high: ['History', 'Geography'], medium: ['Economics'] },
  'English': { high: [], medium: ['Hindi', 'Sanskrit'] },
  'Hindi': { high: ['Sanskrit'], medium: ['English', 'Odia'] },
  'Sanskrit': { high: ['Hindi'], medium: ['English'] },
  'Odia': { high: [], medium: ['Hindi'] },
  'Music': { high: [], medium: ['Arts'] },
  'Arts': { high: [], medium: ['Music'] },
  'Physical Education': { high: [], medium: [] },
  'General': { high: [], medium: [] }
};

const DESIGNATION_WEIGHTS: Record<string, number> = {
  'PGT': 3,
  'TGT': 2,
  'PRT': 1,
  'PPRT': 0
};

export function getDesignationMatch(candidateDesignation: string, requiredLevel: string): 'OK' | 'MISMATCH' {
  if (!requiredLevel) return 'OK'; // If slot doesn't have a specific level
  
  const cLevel = DESIGNATION_WEIGHTS[candidateDesignation] ?? -1;
  const rLevel = DESIGNATION_WEIGHTS[requiredLevel] ?? -1;
  
  if (cLevel >= rLevel) return 'OK';
  return 'MISMATCH';
}

export function getGroupForSubject(subject: string): string {
  for (const [group, subjects] of Object.entries(SUBJECT_GROUPS)) {
    if (subjects.includes(subject)) return group;
  }
  return 'General';
}

export function getCorrelationLevel(candidateSubject: string, vacancySubject: string, vacancyReferenceGroup: string) {
  const candidateGroup = getGroupForSubject(candidateSubject);
  
  if (candidateSubject === vacancySubject) return 'SAME';
  if (candidateGroup === vacancyReferenceGroup) return 'SAME_GROUP';
  
  const correlations = SUBJECT_CORRELATION[candidateSubject];
  if (correlations) {
    if (correlations.high.includes(vacancySubject)) return 'HIGH';
    if (correlations.medium.includes(vacancySubject)) return 'MEDIUM';
  }
  
  return 'LOW';
}

export function getTierScore(correlation: string, match: 'OK' | 'MISMATCH'): number {
  const isOk = match === 'OK';
  const factor = isOk ? 1 : CONFIG.DESIGNATION_MISMATCH_FACTOR;
  
  let baseScore = 0;
  switch (correlation) {
    case 'SAME': baseScore = 1000; break;
    case 'SAME_GROUP': baseScore = 700; break;
    case 'HIGH': baseScore = 350; break;
    case 'MEDIUM': baseScore = 200; break;
    case 'LOW': baseScore = 80; break;
  }
  
  return Math.floor(baseScore * factor);
}
