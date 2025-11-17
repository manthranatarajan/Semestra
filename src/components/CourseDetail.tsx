import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar as CalendarIcon, TrendingUp, Clock, Lightbulb, Edit2, Save, X, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Course, supabase, Assignment, Exam, GradeWeight } from '../lib/supabase';
import { Timeline } from './Timeline';
import { GradePredictor } from './GradePredictor';
import { CalendarView } from './CalendarView';
import { StudyHub } from './StudyHub';
import { FriendsProgress } from './FriendsProgress';

interface CourseDetailProps {
  course: Course;
  onBack: () => void;
}

type Tab = 'timeline' | 'grades' | 'calendar' | 'study' | 'friends';

export const CourseDetail = ({ course, onBack }: CourseDetailProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('timeline');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [gradeWeights, setGradeWeights] = useState<GradeWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCourse, setEditedCourse] = useState({
    course_name: course.course_name,
    instructor: course.instructor,
    semester: course.semester,
    meeting_times: course.meeting_times,
  });
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, [course.id]);

  const handleSaveCourse = async () => {
    setSaving(true);
    try {
      await supabase
        .from('courses')
        .update(editedCourse)
        .eq('id', course.id);

      Object.assign(course, editedCourse);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving course:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedCourse({
      course_name: course.course_name,
      instructor: course.instructor,
      semester: course.semester,
      meeting_times: course.meeting_times,
    });
    setIsEditing(false);
  };

  const tabs = [
    { id: 'timeline' as Tab, label: 'Timeline', icon: Clock },
    { id: 'grades' as Tab, label: 'Grade Predictor', icon: TrendingUp },
    { id: 'calendar' as Tab, label: 'Calendar', icon: CalendarIcon },
    { id: 'study' as Tab, label: 'Study Hub', icon: Lightbulb },
    { id: 'friends' as Tab, label: 'Friends', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="relative z-10">
        <div className="border-b border-white/10 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>

            <div className="flex items-start gap-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-900 dark:text-white flex-shrink-0"
                style={{ backgroundColor: course.color_theme }}
              >
                {(isEditing ? editedCourse.course_name : course.course_name).charAt(0)}
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editedCourse.course_name}
                      onChange={(e) => setEditedCourse({ ...editedCourse, course_name: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-900 dark:text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={editedCourse.instructor}
                        onChange={(e) => setEditedCourse({ ...editedCourse, instructor: e.target.value })}
                        placeholder="Instructor"
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={editedCourse.semester}
                        onChange={(e) => setEditedCourse({ ...editedCourse, semester: e.target.value })}
                        placeholder="Semester"
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={editedCourse.meeting_times}
                        onChange={(e) => setEditedCourse({ ...editedCourse, meeting_times: e.target.value })}
                        placeholder="Meeting Times"
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{course.course_name}</h1>
                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
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
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button
                      onClick={handleSaveCourse}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-slate-900 dark:text-white transition-colors disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-all"
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-slate-900 dark:text-white shadow-lg'
                      : 'bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/10'
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
                  courseId={course.id}
                  onRefresh={fetchData}
                />
              )}
              {activeTab === 'grades' && (
                <GradePredictor
                  assignments={assignments}
                  exams={exams}
                  gradeWeights={gradeWeights}
                  courseId={course.id}
                  onRefresh={fetchData}
                />
              )}
              {activeTab === 'calendar' && (
                <CalendarView
                  assignments={assignments}
                  exams={exams}
                  colorTheme={course.color_theme}
                  courseId={course.id}
                />
              )}
              {activeTab === 'study' && (
                <StudyHub courseId={course.id} />
              )}
              {activeTab === 'friends' && (
                <FriendsProgress courseId={course.id} />
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
