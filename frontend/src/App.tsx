import { useState, useMemo, useEffect } from 'react';
import { CASEEngine, type AdjustmentResult } from './engine';
import { HOLIDAYS, VACATIONS } from './engine/config';
import { Calendar, Users, Settings2, Save, ArrowLeft, Search } from 'lucide-react';
import { supabase } from './supabaseClient';
import type { Teacher, TimetableSlot, AdjustmentRecord } from './engine/types';
import logo from './assets/logo.png';
import './App.css';

const DAY_MAPPING = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function App() {
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-29'); // A Monday
  const [searchQuery, setSearchQuery] = useState('');
  const [absentTeacherIds, setAbsentTeacherIds] = useState<Set<string>>(new Set());
  const [plan, setPlan] = useState<AdjustmentResult[] | null>(null);
  const [activeView, setActiveView] = useState<'selection' | 'results'>('selection');
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [records, setRecords] = useState<AdjustmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          { data: teachersData, error: teachersError },
          { data: slotsData, error: slotsError },
          { data: recordsData, error: recordsError }
        ] = await Promise.all([
          supabase.from('teachers').select('*'),
          supabase.from('timetable_slots').select('*'),
          supabase.from('adjustment_records').select('*')
        ]);

        if (teachersError) throw teachersError;
        if (slotsError) throw slotsError;
        if (recordsError) throw recordsError;

        if (teachersData) setTeachers(teachersData);
        if (slotsData) setSlots(slotsData);
        if (recordsData) setRecords(recordsData);
      } catch (err: any) {
        console.error('Supabase fetch error:', err);
        setErrorMsg(err.message || 'Failed to fetch data from Supabase');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const teachersForDate = new Set<string>();
    for (const r of records) {
      if (r.date === selectedDate) {
        teachersForDate.add(r.original_teacher_id);
      }
    }
    // Only update if it's different to avoid unnecessary re-renders if user is manually checking/unchecking
    setAbsentTeacherIds(prev => {
      if (prev.size === teachersForDate.size && [...prev].every(id => teachersForDate.has(id))) {
        return prev;
      }
      return teachersForDate;
    });
  }, [selectedDate, records]);

  const engine = useMemo(() => {
    if (loading) return null;
    return new CASEEngine(teachers, slots, records, selectedDate);
  }, [loading, teachers, slots, records, selectedDate]);

  const handleGenerate = () => {
    if (!engine) return;
    const result = engine.generatePlan(selectedDate, Array.from(absentTeacherIds));
    setPlan(result);
    setActiveView('results');
  };

  const handleSave = async () => {
    if (!plan || plan.length === 0) return;
    setSaving(true);
    
    // 1. Delete existing records for the date
    const { error: deleteError } = await supabase
      .from('adjustment_records')
      .delete()
      .eq('date', selectedDate);
      
    if (deleteError) {
      alert('Failed to clear old records: ' + deleteError.message);
      setSaving(false);
      return;
    }
    
    // 2. Prepare new records
    const [year, monthStr] = selectedDate.split('-');
    const newRecords = plan.map(p => ({
      date: selectedDate,
      month: parseInt(year + monthStr, 10),
      day: DAY_MAPPING[new Date(selectedDate).getDay()] || 'MON',
      period: p.slot.period,
      class_name: p.slot.class_name,
      subject: p.slot.subject,
      original_teacher_id: p.original_teacher_id,
      adjusted_teacher_id: p.adjusted_teacher_id,
      correlation_level: p.correlation_level,
      designation_match: p.designation_match,
      soft_constraints_violated: p.soft_constraints_violated
    }));
    
    const { error: insertError } = await supabase
      .from('adjustment_records')
      .insert(newRecords);
      
    if (insertError) {
      alert('Failed to save new records: ' + insertError.message);
    } else {
      alert('Plan saved successfully!');
      // Update local state to reflect new records
      const { data: updatedRecords } = await supabase.from('adjustment_records').select('*');
      if (updatedRecords) setRecords(updatedRecords);
    }
    setSaving(false);
  };

  const toggleTeacher = (id: string) => {
    const newSet = new Set(absentTeacherIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setAbsentTeacherIds(newSet);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading application data...</div>;
  }

  if (errorMsg) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
        <h2>Database Connection Error</h2>
        <p>{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="school-banner">
          <img src={logo} alt="DAV CMC Logo" className="school-logo" />
          <h2 className="school-name">DAV PUBLIC SCHOOL,<br/>MCL, IB VALLEY AREA, BRAJRAJNAGAR</h2>
        </div>
        <div className="app-title-badge">
          <span><strong>CASE</strong> : Class Adjustment and Substitution Engine</span>
        </div>
      </header>

      <main className="main-layout">
        {activeView === 'selection' ? (
        <section className="input-section">
          <div className="card">
            <h2 className="card-title">Setup Adjustment</h2>
            
            <div className="form-group">
              <label><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }}/> Target Date</label>
              <input 
                type="date" 
                className="input-field"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label><Users size={14} style={{ display: 'inline', marginRight: '4px' }}/> Absent Teachers</label>
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search teachers by name, subject, or designation..." 
                  className="input-field search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="multi-select-container">
                {teachers.filter(t => 
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  t.subject_group.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  t.designation.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(t => (
                  <label key={t.id} className="checkbox-item">
                    <input 
                      type="checkbox" 
                      checked={absentTeacherIds.has(t.id)}
                      onChange={() => toggleTeacher(t.id)}
                    />
                    {t.name} <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>({t.designation}, {t.subject_group})</span>
                  </label>
                ))}
              </div>
            </div>

            {(() => {
              const holidayName = HOLIDAYS[selectedDate];
              let vacationName = null;
              if (!holidayName) {
                for (const vac of VACATIONS) {
                  if (selectedDate >= vac.start && selectedDate <= vac.end) {
                    vacationName = vac.name;
                    break;
                  }
                }
              }
              const isBlocked = holidayName || vacationName;
              return isBlocked ? (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                  <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>School is Closed</h3>
                  <p>{holidayName ? `Holiday: ${holidayName}` : `Vacation: ${vacationName}`}</p>
                </div>
              ) : (
                <button className="btn" onClick={handleGenerate} style={{ width: '100%' }}>
                  <Settings2 size={18} /> Generate Plan
                </button>
              );
            })()}
          </div>
        </section>
        ) : (
        <section className="output-section">
          {plan ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button className="btn btn-secondary" onClick={() => setActiveView('selection')} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <h2 className="card-title" style={{ border: 'none', margin: 0, padding: 0 }}>Adjustment Plan</h2>
                </div>
                <button className="btn btn-secondary" onClick={handleSave} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save Plan'}</button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Originally</th>
                      <th>Adjusted To</th>
                      <th>Corr.</th>
                      <th>Desig.</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.length > 0 ? plan.map((p, i) => {
                      const orig = teachers.find(t => t.id === p.original_teacher_id)?.name;
                      const adj = teachers.find(t => t.id === p.adjusted_teacher_id)?.name;
                      
                      return (
                        <tr key={i}>
                          <td>{p.slot.period}</td>
                          <td>{p.slot.class_name}</td>
                          <td>{p.slot.subject}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{orig}</td>
                          <td style={{ fontWeight: 600 }}>{adj}</td>
                          <td><span className="badge">{p.correlation_level}</span></td>
                          <td>
                            <span className={`badge ${p.designation_match === 'OK' ? 'ok' : 'mismatch'}`}>
                              {p.designation_match}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {p.soft_constraints_violated.join(', ') || '—'}
                          </td>
                        </tr>
                      )
                    }) : (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                          No vacancies found for the selected date and absent teachers.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Select absent teachers and click Generate Plan</p>
            </div>
          )}
        </section>
        )}
      </main>
    </div>
  );
}

export default App;
