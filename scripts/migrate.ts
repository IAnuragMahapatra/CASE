import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and Key must be provided in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DAY_MAPPING: Record<string, string> = {
  'MONDAY': 'MON',
  'TUESDAY': 'TUE',
  'WEDNESDAY': 'WED',
  'THURSDAY': 'THU',
  'FRIDAY': 'FRI',
  'SATURDAY': 'SAT'
};

async function main() {
  console.log('Starting migration...');

  // 1. Parse teacher-designation.md
  const mdContent = fs.readFileSync(path.join(__dirname, '../resources/teacher-designation.md'), 'utf-8');
  const lines = mdContent.split('\n');
  const teachers = [];
  
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.startsWith('|')) continue;
    
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 5) continue;
    
    const name = parts[2];
    const designation = parts[3];
    const subject = parts[4];
    
    if (name) {
      const protectedNames = ['Mr. N. C. Sahoo', 'Mrs. Poonam Sinha', 'Mrs. Sangita Dash', 'Mr. Abhishek Mahapatra'];
      const isProtected = (['Principal', 'Librarian', 'Counsellor', 'Staff'].includes(designation) || protectedNames.includes(name)) && name !== 'New Nurse';
      teachers.push({ name, designation, subject_group: subject, protected: isProtected });
    }
  }

  console.log(`Found ${teachers.length} teachers. Inserting into Supabase...`);
  
  // Clear existing data (order matters for foreign keys)
  await supabase.from('timetable_slots').delete().neq('day', '');
  await supabase.from('teacher_subjects').delete().neq('subject', '');
  await supabase.from('teachers').delete().neq('name', '');

  const { data: insertedTeachers, error: tError } = await supabase
    .from('teachers')
    .insert(teachers)
    .select();

  if (tError) {
    console.error('Error inserting teachers:', tError);
    return;
  }

  // Basic normalization for matching names from excel
  const normalizeName = (name: string) => name.toLowerCase().replace(/^(mr|mrs|ms|miss)\s*\.?\s*/, '').replace(/[^a-z0-9]/g, '');

  const teacherMap = new Map();
  insertedTeachers.forEach(t => {
      teacherMap.set(normalizeName(t.name), t.id);
  });

  const teacherSubjects = insertedTeachers.map(t => ({
    teacher_id: t.id,
    subject: t.subject_group
  }));
  
  await supabase.from('teacher_subjects').insert(teacherSubjects);

  // 2. Parse Excel files
  const files = [
    "FINAL TEACHER'S  TIME TABLE 2026-27(MON,TUE,WED).xlsx",
    "FINAL TEACHER'S  TIME TABLE 2026-27(THURS,FRI,SAT).xlsx"
  ];

  const slots = [];
  const unmatchedTeachers = new Set();
  
  for (const fileName of files) {
      const filePath = path.join(__dirname, '../resources', fileName);
      console.log(`Parsing ${fileName}...`);
      const workbook = xlsx.readFile(filePath);
      
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      
      // Row 1 contains days (MONDAY, TUESDAY...)
      // Row 2 contains periods (1ST, 2nd, RECESS...)
      
      const dayHeaders = data[1];
      const periodHeaders = data[2];

      const periodMappings: { day: string, periodIndex: number, colIndex: number }[] = [];
      
      let currentDay = '';
      let currentPeriodIndex = 0;
      
      for (let col = 2; col < dayHeaders.length || col < periodHeaders.length; col++) {
          const dayVal = dayHeaders[col]?.toString().trim();
          if (dayVal && DAY_MAPPING[dayVal]) {
              currentDay = DAY_MAPPING[dayVal];
              currentPeriodIndex = 0; // reset for new day
          }
          
          const periodVal = periodHeaders[col]?.toString().trim().toUpperCase();
          if (periodVal && !periodVal.includes('RECESS') && !periodVal.includes('ACT/ZERO') && !periodVal.includes('CCA')) {
              if (currentDay) {
                  currentPeriodIndex++;
                  periodMappings.push({ day: currentDay, periodIndex: currentPeriodIndex, colIndex: col });
              }
          }
      }

      // Start reading from row 4 (index 4)
      for (let r = 4; r < data.length; r++) {
          const row = data[r];
          if (!row || row.length < 2) continue;
          
          const teacherNameRaw = row[1];
          if (!teacherNameRaw || typeof teacherNameRaw !== 'string') continue;

          // Try to match teacher
          // e.g. "Mr. SUSANTA KUMAR PRADHAN (PRINCIPAL)"
          let teacherName = teacherNameRaw.replace(/\([^)]*\)/g, '').trim(); // remove bracketed text
          let normName = normalizeName(teacherName);
          let teacherId = teacherMap.get(normName);
          
          const getSubjectGroup = (tid: string) => {
              const t = insertedTeachers.find(it => it.id === tid);
              return t ? t.subject_group : '';
          };
          
          if (!teacherId) {
              // Try finding partial match
              for (const [norm, id] of teacherMap.entries()) {
                  if (norm.includes(normName) || normName.includes(norm)) {
                      teacherId = id;
                      break;
                  }
              }
          }

          if (!teacherId) {
              unmatchedTeachers.add(teacherNameRaw);
              continue;
          }

          for (const mapping of periodMappings) {
              const classRaw = row[mapping.colIndex];
              if (classRaw && typeof classRaw === 'string') {
                  let className = classRaw.trim();
                  
                  // Extract subject if appended e.g. XIIA1(PHY) or XIIA2 (W.E)
                  let subject = '';
                  const match = className.match(/\((.*?)\)/);
                  if (match) {
                      subject = match[1].trim();
                      className = className.replace(/\(.*?\)/, '').trim();
                  }
                  
                  if (!subject) {
                      subject = getSubjectGroup(teacherId);
                  }

                  let classLevel = '0';
                  if (className.startsWith('XII')) classLevel = '12';
                  else if (className.startsWith('XI')) classLevel = '11';
                  else if (className.startsWith('X')) classLevel = '10';
                  else if (className.startsWith('IX')) classLevel = '9';
                  else if (className.startsWith('VIII')) classLevel = '8';
                  else if (className.startsWith('VII')) classLevel = '7';
                  else if (className.startsWith('VI')) classLevel = '6';
                  else if (className.startsWith('V')) classLevel = '5';
                  else if (className.startsWith('IV')) classLevel = '4';
                  else if (className.startsWith('III')) classLevel = '3';
                  else if (className.startsWith('II')) classLevel = '2';
                  else if (className.startsWith('I')) classLevel = '1';
                  else if (className.startsWith('NURSERY') || className.startsWith('LKG') || className.startsWith('UKG')) classLevel = '0';

                  slots.push({
                      day: mapping.day,
                      period: mapping.periodIndex,
                      class_name: className,
                      subject: subject,
                      teacher_id: teacherId,
                      class_level: classLevel
                  });
              }
          }
      }
  }

  console.log(`Inserting ${slots.length} timetable slots...`);
  // Insert in chunks to avoid payload size issues
  const chunkSize = 500;
  for (let i = 0; i < slots.length; i += chunkSize) {
      const chunk = slots.slice(i, i + chunkSize);
      const { error } = await supabase.from('timetable_slots').insert(chunk);
      if (error) {
          console.error(`Error inserting chunk ${i}:`, error);
      }
  }

  if (unmatchedTeachers.size > 0) {
      console.log('Unmatched teachers (could not find in designation markdown):');
      console.log(Array.from(unmatchedTeachers));
  }

  console.log('Migration completed!');
}

main().catch(console.error);
