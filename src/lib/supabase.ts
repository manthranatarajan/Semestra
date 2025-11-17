import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  console.error('\nPlease ensure your .env file contains:');
  console.error('VITE_SUPABASE_URL=your_supabase_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');

  throw new Error('Missing Supabase environment variables');
}

console.log('Supabase client initialized with:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseConfig = {
  url: supabaseUrl,
  isConfigured: true,
};

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
  completed: boolean;
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

export interface UserPreferences {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  theme: 'light' | 'dark';
  share_progress: boolean;
  share_courses: boolean;
  school: string | null;
  grad_year: number | null;
  major: string | null;
  created_at: string;
  updated_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface FriendProgress {
  id: string;
  user_id: string;
  course_id: string;
  progress_percent: number;
  tasks_completed: number;
  total_tasks: number;
  study_streak: number;
  last_activity: string;
  updated_at: string;
}
