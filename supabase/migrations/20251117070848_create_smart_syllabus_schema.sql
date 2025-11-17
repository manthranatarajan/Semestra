/*
  # Smart Syllabus Database Schema

  ## Overview
  Creates the complete database schema for Smart Syllabus, including tables for users, courses, assignments, exams, and grade tracking.

  ## New Tables

  ### 1. `courses`
  Stores course information extracted from syllabuses
  - `id` (uuid, primary key) - unique course identifier
  - `user_id` (uuid, foreign key) - owner of the course
  - `course_name` (text) - name of the course
  - `instructor` (text) - instructor name
  - `semester` (text) - semester/term
  - `meeting_times` (text) - class schedule
  - `location` (text) - classroom location
  - `color_theme` (text) - UI color for the course
  - `raw_text` (text) - original extracted PDF text
  - `created_at` (timestamptz) - creation timestamp
  - `updated_at` (timestamptz) - last update timestamp

  ### 2. `assignments`
  Stores assignment information for each course
  - `id` (uuid, primary key) - unique assignment identifier
  - `course_id` (uuid, foreign key) - related course
  - `title` (text) - assignment title
  - `due_date` (date) - deadline
  - `weight` (numeric) - percentage of final grade (0-1)
  - `type` (text) - category (homework, project, etc.)
  - `description` (text) - assignment details
  - `completed` (boolean) - completion status
  - `score` (numeric) - earned score if graded
  - `created_at` (timestamptz) - creation timestamp

  ### 3. `exams`
  Stores exam information for each course
  - `id` (uuid, primary key) - unique exam identifier
  - `course_id` (uuid, foreign key) - related course
  - `title` (text) - exam title
  - `exam_date` (date) - exam date
  - `weight` (numeric) - percentage of final grade (0-1)
  - `type` (text) - exam type (midterm, final, quiz)
  - `location` (text) - exam location
  - `score` (numeric) - earned score if graded
  - `created_at` (timestamptz) - creation timestamp

  ### 4. `grade_weights`
  Stores grade weight categories for each course
  - `id` (uuid, primary key) - unique identifier
  - `course_id` (uuid, foreign key) - related course
  - `category` (text) - category name (Exams, Homework, etc.)
  - `weight` (numeric) - percentage weight (0-1)
  - `created_at` (timestamptz) - creation timestamp

  ### 5. `important_dates`
  Stores important dates extracted from syllabuses
  - `id` (uuid, primary key) - unique identifier
  - `course_id` (uuid, foreign key) - related course
  - `event` (text) - event description
  - `date` (date) - event date
  - `created_at` (timestamptz) - creation timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Users can only access their own courses and related data
  - Policies enforce authentication and ownership checks

  ## Important Notes
  1. All monetary/percentage values use numeric type for precision
  2. Timestamps automatically set via default values
  3. Foreign key constraints ensure data integrity
  4. Cascading deletes maintain referential integrity
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_name text NOT NULL,
  instructor text DEFAULT '',
  semester text DEFAULT '',
  meeting_times text DEFAULT '',
  location text DEFAULT '',
  color_theme text DEFAULT '#3b82f6',
  raw_text text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  weight numeric DEFAULT 0,
  type text DEFAULT 'homework',
  description text DEFAULT '',
  completed boolean DEFAULT false,
  score numeric,
  created_at timestamptz DEFAULT now()
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  exam_date date,
  weight numeric DEFAULT 0,
  type text DEFAULT 'midterm',
  location text DEFAULT '',
  score numeric,
  created_at timestamptz DEFAULT now()
);

-- Create grade_weights table
CREATE TABLE IF NOT EXISTS grade_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  category text NOT NULL,
  weight numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create important_dates table
CREATE TABLE IF NOT EXISTS important_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  event text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses table
CREATE POLICY "Users can view own courses"
  ON courses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses"
  ON courses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for assignments table
CREATE POLICY "Users can view assignments for own courses"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert assignments for own courses"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assignments for own courses"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete assignments for own courses"
  ON assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- RLS Policies for exams table
CREATE POLICY "Users can view exams for own courses"
  ON exams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = exams.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert exams for own courses"
  ON exams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = exams.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exams for own courses"
  ON exams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = exams.course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = exams.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exams for own courses"
  ON exams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = exams.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- RLS Policies for grade_weights table
CREATE POLICY "Users can view grade weights for own courses"
  ON grade_weights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = grade_weights.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert grade weights for own courses"
  ON grade_weights FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = grade_weights.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update grade weights for own courses"
  ON grade_weights FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = grade_weights.course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = grade_weights.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete grade weights for own courses"
  ON grade_weights FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = grade_weights.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- RLS Policies for important_dates table
CREATE POLICY "Users can view important dates for own courses"
  ON important_dates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = important_dates.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert important dates for own courses"
  ON important_dates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = important_dates.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update important dates for own courses"
  ON important_dates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = important_dates.course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = important_dates.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete important dates for own courses"
  ON important_dates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = important_dates.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_exams_course_id ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_exam_date ON exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_grade_weights_course_id ON grade_weights(course_id);
CREATE INDEX IF NOT EXISTS idx_important_dates_course_id ON important_dates(course_id);
CREATE INDEX IF NOT EXISTS idx_important_dates_date ON important_dates(date);