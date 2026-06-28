import type { Teacher, TimetableSlot, AdjustmentRecord } from './engine/types';

export const mockTeachers: Teacher[] = [
    { id: 't1', name: 'Mr. Susanta Kumar Pradhan', designation: 'PGT', subject_group: 'Physics', protected: true },
    { id: 't2', name: 'Mrs. Poonam Sinha', designation: 'PGT', subject_group: 'Biology', protected: false },
    { id: 't3', name: 'Mr. Amiya Kumar Choubey', designation: 'PGT', subject_group: 'Computer Science', protected: false },
    { id: 't4', name: 'Mrs. Tripti Gartia', designation: 'PGT', subject_group: 'Commerce', protected: false },
    { id: 't5', name: 'Mrs. Krishna Dey', designation: 'PGT', subject_group: 'English', protected: false },
    { id: 't6', name: 'Mr. S. B. Pandey', designation: 'TGT', subject_group: 'Science', protected: false },
    { id: 't7', name: 'Mrs. Anju Agarwal', designation: 'PRT', subject_group: 'English', protected: false },
];

export const mockSlots: TimetableSlot[] = [
    { id: 's1', day: 'MON', period: 1, class_name: 'XII-A', subject: 'Physics', teacher_id: 't1', class_level: 'PGT' },
    { id: 's2', day: 'MON', period: 2, class_name: 'XII-A', subject: 'Physics', teacher_id: 't1', class_level: 'PGT' },
    { id: 's3', day: 'MON', period: 3, class_name: 'XI-A', subject: 'Biology', teacher_id: 't2', class_level: 'PGT' },
    { id: 's4', day: 'MON', period: 4, class_name: 'X-A', subject: 'Science', teacher_id: 't6', class_level: 'TGT' },
    { id: 's5', day: 'MON', period: 1, class_name: 'V-B', subject: 'English', teacher_id: 't7', class_level: 'PRT' },
    { id: 's6', day: 'MON', period: 2, class_name: 'IX-B', subject: 'Computer Science', teacher_id: 't3', class_level: 'TGT' },
];

export const mockRecords: AdjustmentRecord[] = [
    {
        id: 'r1',
        date: '2026-06-25',
        month: 202606,
        day: 'THU',
        period: 1,
        class_name: 'XI-A',
        subject: 'Biology',
        original_teacher_id: 't2',
        adjusted_teacher_id: 't3',
        correlation_level: 'LOW',
        designation_match: 'OK',
        soft_constraints_violated: []
    }
];
