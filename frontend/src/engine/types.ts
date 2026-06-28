export type Designation = "PGT" | "TGT" | "PRT" | "PPRT" | "Staff" | "Librarian" | "Counsellor" | string;
export type Day = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

export interface Teacher {
  id: string;
  name: string;
  designation: Designation;
  subject_group: string;
  protected: boolean;
}

export interface TimetableSlot {
  id: string;
  day: Day;
  period: number;
  class_name: string;
  subject: string;
  teacher_id: string;
  class_level: "PGT" | "TGT" | "PRT" | "" | string;
}

export interface AdjustmentRecord {
  id?: string;
  date: string; // YYYY-MM-DD
  month: number; // e.g. 202607
  day: Day;
  period: number;
  class_name: string;
  subject: string;
  original_teacher_id: string;
  adjusted_teacher_id: string;
  correlation_level: "SAME" | "SAME_GROUP" | "HIGH" | "MEDIUM" | "LOW";
  designation_match: "OK" | "MISMATCH";
  soft_constraints_violated: string[];
}

export interface Vacancy {
  slot: TimetableSlot;
  candidates: Teacher[];
}
