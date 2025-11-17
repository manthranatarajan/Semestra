/*
  # Add School Information to User Preferences

  1. Changes
    - Add `school` field to user_preferences (text)
    - Add `grad_year` field to user_preferences (integer)
    - Add `major` field to user_preferences (text)
  
  2. Notes
    - These fields are optional and can be updated by users
    - Allows users to track their academic information
*/

-- Add school information columns to user_preferences
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'school'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN school text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'grad_year'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN grad_year integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'major'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN major text;
  END IF;
END $$;