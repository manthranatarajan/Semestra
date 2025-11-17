/*
  # Add Parsing and Caching Fields to Courses

  1. Changes
    - Add `file_sha256` field to courses (text) - SHA256 hash of uploaded file for deduplication
    - Add `parsed_json` field to courses (jsonb) - Structured JSON from AI parser
  
  2. Notes
    - file_sha256 enables idempotent parsing by caching results
    - parsed_json stores the complete structured output from Gemini
    - These fields support deterministic PDF parsing with fallback
*/

-- Add parsing and caching columns to courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'file_sha256'
  ) THEN
    ALTER TABLE courses ADD COLUMN file_sha256 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses' AND column_name = 'parsed_json'
  ) THEN
    ALTER TABLE courses ADD COLUMN parsed_json jsonb;
  END IF;
END $$;

-- Create index for fast hash lookups
CREATE INDEX IF NOT EXISTS idx_courses_file_sha256 ON courses(file_sha256);