/*
  # Add Study Notes Table

  ## New Table
  - `study_notes` - Stores student study notes and ideas for each course
    - `id` (uuid, primary key)
    - `course_id` (uuid, foreign key) - reference to courses
    - `content` (text) - note content
    - `created_at` (timestamptz) - creation timestamp

  ## Security
  - Enable RLS
  - Users can only access notes for their own courses
*/

CREATE TABLE IF NOT EXISTS study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view study notes for own courses"
  ON study_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = study_notes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert study notes for own courses"
  ON study_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = study_notes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update study notes for own courses"
  ON study_notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = study_notes.course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = study_notes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete study notes for own courses"
  ON study_notes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = study_notes.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_study_notes_course_id ON study_notes(course_id);