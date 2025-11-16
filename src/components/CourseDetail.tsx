import { motion } from 'framer-motion';
import { ArrowLeft, Calendar as CalendarIcon, TrendingUp, FileText, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Course, supabase, Assignment, Exam, GradeWeight } from '../lib/supabase';
import { Timeline } from './Timeline';
import { GradePredictor } from './GradePredictor';
import { CalendarView } from './CalendarView';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
}

type Tab = 'timeline' | 'grades' | 'calendar' | 'raw';

export const CourseDetail = ({ course, onBack }: CourseDetailProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('timeline');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [gradeWeights, setGradeWeights] = useState<GradeWeight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentsRes, examsRes, weightsRes] = await Promise.all([
          supabase.from('assignments').select('*').eq('course_id', course.id).order('due_date'),
          supabase.from('exams').select('*').eq('course_id', course.id).order('exam_date'),
          supabase.from('grade_weights').select('*').eq('course_id', course.id),
        ]);

        if (assignmentsRes.error) throw assignmentsRes.error;
        if (examsRes.error) throw examsRes.error;
        if (weightsRes.error) throw weightsRes.error;

        setAssignments(assignmentsRes.data || []);
        setExams(examsRes.data || []);
        setGradeWeights(weightsRes.data || []);
      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [course.id]);

  const tabs = [
    { id: 'timeline' as Tab, label: 'Timeline', icon: Clock },
    { id: 'grades' as Tab, label: 'Grade Predictor', icon: TrendingUp },
    { id: 'calendar' as Tab, label: 'Calendar', icon: CalendarIcon },
    { id: 'raw' as Tab, label: 'Raw Syllabus', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="relative z-10">
        <div className="border-b border-white/10 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>

            <div className="flex items-start gap-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: course.color_theme }}
              >
                {course.course_name.charAt(0)}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{course.course_name}</h1>
                <div className="flex items-center gap-4 text-slate-300">
                  <span>{course.instructor}</span>
                  <span>•</span>
                  <span>{course.semester}</span>
                  {course.meeting_times && (
                    <>
                      <span>•</span>
                      <span>{course.meeting_times}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'timeline' && (
                <Timeline
                  assignments={assignments}
                  exams={exams}
                  colorTheme={course.color_theme}
                />
              )}
              {activeTab === 'grades' && (
                <GradePredictor
                  assignments={assignments}
                  exams={exams}
                  gradeWeights={gradeWeights}
                  courseId={course.id}
                />
              )}
              {activeTab === 'calendar' && (
                <CalendarView
                  assignments={assignments}
                  exams={exams}
                  colorTheme={course.color_theme}
                />
              )}
              {activeTab === 'raw' && (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Original Syllabus Text</h2>
                  <div className="bg-black/20 rounded-xl p-6 font-mono text-sm text-slate-300 whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                    {course.raw_text || 'No raw text available'}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
