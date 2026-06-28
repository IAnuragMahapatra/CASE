import * as xlsx from 'xlsx';
import * as path from 'path';

const filePath = path.join(__dirname, '../resources/FINAL TEACHER\'S  TIME TABLE 2026-27(MON,TUE,WED).xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('First 10 rows:');
for (let i = 0; i < 10; i++) {
    console.log(`Row ${i}:`, data[i]);
}
