
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

export const HOLIDAYS: Record<string, string> = {
    "2026-04-03": "Good Friday",
    "2026-04-14": "Maha Visuba Sankranti & Dr. Ambedkar Jayanti",
    "2026-06-26": "Muharram",
    "2026-07-16": "Ratha Yatra",
    "2026-08-26": "Birthday of Prophet Mohammed",
    "2026-08-27": "Raksha Bandhan / Jhulan Purnima",
    "2026-09-04": "Janmashtami",
    "2026-09-14": "Ganesh Puja",
    "2026-09-15": "Nuakhai",
    "2026-10-10": "Mahalaya",
    "2026-11-08": "Diwali / Kali Puja",
    "2026-11-24": "Guru Nanak Jayanti",
    "2026-12-01": "Prathamastami",
    "2026-12-25": "Christmas",
    "2027-01-01": "New Year Day",
    "2027-01-14": "Makar Sankranti / Pongal",
    "2027-02-11": "Saraswati Puja",
    "2027-03-06": "Maha Sivaratri",
    "2027-03-22": "Dola Purnima",
    "2027-03-23": "Holi",
    "2027-03-26": "Good Friday"
};

export const VACATIONS = [
    { start: "2026-04-19", end: "2026-06-17", name: "Summer Vacation" },
    { start: "2026-10-17", end: "2026-10-26", name: "Durga Puja Vacation" },
    { start: "2026-12-26", end: "2026-12-31", name: "Winter Vacation" }
];

export function getDesignationMatch(candidateDesignation: string, requiredLevelStr: string): 'OK' | 'MISMATCH' {
  if (!requiredLevelStr) return 'OK'; // If slot doesn't have a specific level
  
  const reqClass = parseInt(requiredLevelStr, 10);
  if (isNaN(reqClass)) return 'OK';

  let minClass = 0;
  let maxClass = 12;

  switch (candidateDesignation) {
    case 'PPRT':
      minClass = 0;
      maxClass = 2;
      break;
    case 'PRT':
      minClass = 1;
      maxClass = 8;
      break;
    case 'TGT':
      minClass = 5;
      maxClass = 12;
      break;
    case 'PGT':
      minClass = 9;
      maxClass = 12;
      break;
  }
  
  if (reqClass >= minClass && reqClass <= maxClass) {
    return 'OK';
  }
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
