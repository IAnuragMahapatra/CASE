CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    designation TEXT,
    subject_group TEXT,
    protected BOOLEAN DEFAULT false
);

CREATE TABLE teacher_subjects (
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    PRIMARY KEY (teacher_id, subject)
);

CREATE TABLE timetable_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day TEXT NOT NULL,
    period INTEGER NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    class_level TEXT
);

CREATE TABLE adjustment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    month INTEGER NOT NULL,
    day TEXT NOT NULL,
    period INTEGER NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    original_teacher_id UUID REFERENCES teachers(id),
    adjusted_teacher_id UUID REFERENCES teachers(id),
    correlation_level INTEGER,
    designation_match BOOLEAN,
    soft_constraints_violated INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON TABLE teachers TO anon, authenticated, service_role;
GRANT ALL ON TABLE teacher_subjects TO anon, authenticated, service_role;
GRANT ALL ON TABLE timetable_slots TO anon, authenticated, service_role;
GRANT ALL ON TABLE adjustment_records TO anon, authenticated, service_role;
