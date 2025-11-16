import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Course {
  id: string;
  user_id: string;
  course_name: string;
  instructor: string;
  semester: string;
  meeting_times: string;
  location: string;
  color_theme: string;
  raw_text: string;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  due_date: string | null;
  weight: number;
  type: string;
  description: string;
  completed: boolean;
  score: number | null;
  created_at: string;
}

export interface Exam {
  id: string;
  course_id: string;
  title: string;
  exam_date: string | null;
  weight: number;
  type: string;
  location: string;
  score: number | null;
  created_at: string;
}

export interface GradeWeight {
  id: string;
  course_id: string;
  category: string;
  weight: number;
  created_at: string;
}

export interface ImportantDate {
  id: string;
  course_id: string;
  event: string;
  date: string;
  created_at: string;
}
