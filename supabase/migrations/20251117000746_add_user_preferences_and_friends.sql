/*
  # Add User Preferences and Friends System

  1. New Tables
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `display_name` (text) - User's chosen display name
      - `username` (text, unique) - Unique username
      - `theme` (text) - 'light' or 'dark'
      - `share_progress` (boolean) - Allow friends to see progress
      - `share_courses` (boolean) - Allow friends to see active courses
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `friendships`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `friend_id` (uuid, foreign key to auth.users)
      - `status` (text) - 'pending', 'accepted', 'rejected'
      - `created_at` (timestamptz)
    
    - `friends_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `course_id` (uuid, foreign key to courses)
      - `progress_percent` (integer) - Percentage of tasks completed
      - `tasks_completed` (integer)
      - `total_tasks` (integer)
      - `study_streak` (integer) - Days of consecutive study
      - `last_activity` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add policies for friends to view shared progress data
*/

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name text,
  username text UNIQUE,
  theme text DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  share_progress boolean DEFAULT true,
  share_courses boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create friends_progress table
CREATE TABLE IF NOT EXISTS friends_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  progress_percent integer DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  tasks_completed integer DEFAULT 0,
  total_tasks integer DEFAULT 0,
  study_streak integer DEFAULT 0,
  last_activity timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE friends_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON friends_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Friends can view shared progress"
  ON friends_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM friendships f
      JOIN user_preferences up ON up.user_id = friends_progress.user_id
      WHERE (f.user_id = auth.uid() AND f.friend_id = friends_progress.user_id AND f.status = 'accepted')
      AND up.share_progress = true
    )
  );

CREATE POLICY "Users can insert own progress"
  ON friends_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON friends_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON friends_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add completed field to assignments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'completed'
  ) THEN
    ALTER TABLE assignments ADD COLUMN completed boolean DEFAULT false;
  END IF;
END $$;

-- Add completed field to exams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams' AND column_name = 'completed'
  ) THEN
    ALTER TABLE exams ADD COLUMN completed boolean DEFAULT false;
  END IF;
END $$;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_username ON user_preferences(username);

-- Create index for faster friendship queries
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);

-- Create function to update friends_progress automatically
CREATE OR REPLACE FUNCTION update_friends_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO friends_progress (user_id, course_id, progress_percent, tasks_completed, total_tasks, updated_at)
  SELECT 
    c.user_id,
    c.id as course_id,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE (COUNT(*) FILTER (WHERE completed = true) * 100 / COUNT(*))::integer
    END as progress_percent,
    COUNT(*) FILTER (WHERE completed = true) as tasks_completed,
    COUNT(*) as total_tasks,
    now() as updated_at
  FROM courses c
  LEFT JOIN (
    SELECT course_id, completed FROM assignments
    UNION ALL
    SELECT course_id, completed FROM exams
  ) tasks ON tasks.course_id = c.id
  WHERE c.id = NEW.course_id
  GROUP BY c.user_id, c.id
  ON CONFLICT (user_id, course_id) 
  DO UPDATE SET
    progress_percent = EXCLUDED.progress_percent,
    tasks_completed = EXCLUDED.tasks_completed,
    total_tasks = EXCLUDED.total_tasks,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to update friends_progress
DROP TRIGGER IF EXISTS update_progress_on_assignment_change ON assignments;
CREATE TRIGGER update_progress_on_assignment_change
  AFTER INSERT OR UPDATE OF completed OR DELETE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_friends_progress();

DROP TRIGGER IF EXISTS update_progress_on_exam_change ON exams;
CREATE TRIGGER update_progress_on_exam_change
  AFTER INSERT OR UPDATE OF completed OR DELETE ON exams
  FOR EACH ROW
  EXECUTE FUNCTION update_friends_progress();
