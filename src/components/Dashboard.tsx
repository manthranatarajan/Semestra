import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Upload, LogOut, Plus, Calendar, Trash2, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, Course } from '../lib/supabase';
import { UploadModal } from './UploadModal';
import { CourseDetail } from './CourseDetail';
import { DeleteModal } from './DeleteModal';
import { ProfilePanel } from './ProfilePanel';
import { useToast } from './Toast';

interface CourseWithProgress extends Course {
  progress: number;
}

export const Dashboard = () => {
  const { user, userPreferences, signOut } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CourseWithProgress | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const displayName =
    userPreferences?.display_name ||
    (user?.user_metadata?.display_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'User';
  const username = userPreferences?.username || (user?.user_metadata?.username as string | undefined) || '';

  const fetchCourses = async () => {
    if (!user) return;

    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: progressData } = await supabase
        .from('friends_progress')
        .select('course_id, progress_percent')
        .eq('user_id', user.id);

      const coursesWithProgress = (coursesData || []).map(course => {
        const progress = progressData?.find(p => p.course_id === course.id);
        return {
          ...course,
          progress: progress?.progress_percent || 0
        };
      });

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleUploadSuccess = () => {
    fetchCourses();
    setShowUploadModal(false);
    showToast('Syllabus uploaded successfully!', 'success');
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete.id);

      if (error) throw error;

      setCourses(courses.filter(c => c.id !== courseToDelete.id));
      setCourseToDelete(null);
      showToast('Course deleted successfully', 'delete');
    } catch (error) {
      console.error('Error deleting course:', error);
      showToast('Failed to delete course', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (selectedCourse) {
    return <CourseDetail course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <nav className="relative z-10 px-6 py-6 border-b border-slate-200 dark:border-white/10 backdrop-blur-xl bg-white/50 dark:bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Semestra</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-400 transition-colors">
                  {displayName}
                </p>
                {username && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">@{username}</p>
                )}
              </div>
            </button>
            <button
              onClick={() => signOut()}
              className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Your Courses</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your semester at a glance</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/25 transition-all"
          >
            <Plus className="w-5 h-5" />
            Upload Syllabus
          </motion.button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10 rounded-2xl border border-slate-200 dark:border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6">
              <Upload className="w-12 h-12 text-blue-500 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No courses yet</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Upload your first syllabus to get started</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all"
            >
              Upload Syllabus
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative"
              >
                <div className="relative p-6 bg-white/90 backdrop-blur-md dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all shadow-lg hover:shadow-2xl">
                  <div
                    className="absolute top-0 left-0 w-full h-2 rounded-t-2xl"
                    style={{ backgroundColor: course.color_theme }}
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCourseToDelete(course);
                    }}
                    className="absolute top-4 right-4 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>

                  <div className="mt-4 cursor-pointer" onClick={() => setSelectedCourse(course)}>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {course.course_name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{course.instructor}</p>

                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>{course.semester}</span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-400">Progress</span>
                        <span className="text-blue-400 font-semibold">{course.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">View Details</span>
                        <motion.div
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          className="text-blue-400"
                        >
                          →
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={handleUploadSuccess}
          />
        )}
        {courseToDelete && (
          <DeleteModal
            courseName={courseToDelete.course_name}
            onConfirm={handleDeleteCourse}
            onCancel={() => setCourseToDelete(null)}
            loading={deleteLoading}
          />
        )}
        {showProfile && (
          <ProfilePanel onClose={() => setShowProfile(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
