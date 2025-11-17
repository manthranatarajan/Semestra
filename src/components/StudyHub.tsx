import { motion } from 'framer-motion';
import { Brain, Coffee, Target, Clock, Heart, Lightbulb, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface StudyHubProps {
  courseId: string;
}

interface StudyNote {
  id: string;
  content: string;
  created_at: string;
}

export const StudyHub = ({ courseId }: StudyHubProps) => {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);

  useEffect(() => {
    fetchNotes();
  }, [courseId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      setTimeLeft(focusMinutes * 60);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, focusMinutes]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('study_notes')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      await supabase
        .from('study_notes')
        .insert({ course_id: courseId, content: newNote });

      setNewNote('');
      fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await supabase.from('study_notes').delete().eq('id', id);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const toggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      setTimeLeft(focusMinutes * 60);
      setIsTimerRunning(true);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const studyTips = [
    { icon: Brain, title: 'Space Out Your Study', tip: 'Review material in short sessions over several days' },
    { icon: Target, title: 'Set Clear Goals', tip: 'Define what you want to accomplish before each study session' },
    { icon: Coffee, title: 'Take Breaks', tip: 'Use the Pomodoro Technique: 25 min focus + 5 min break' },
    { icon: Heart, title: 'Stay Healthy', tip: 'Sleep 7-9 hours, exercise regularly, and eat nutritious meals' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-white">Focus Timer</h2>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 mb-6">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - timeLeft / (focusMinutes * 60))}`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-black dark:text-white">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setFocusMinutes(Math.max(5, focusMinutes - 5))}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
              >
                -5
              </button>
              <span className="text-black dark:text-white font-semibold">{focusMinutes} min</span>
              <button
                onClick={() => setFocusMinutes(Math.min(60, focusMinutes + 5))}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
              >
                +5
              </button>
            </div>

            <button
              onClick={toggleTimer}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 rounded-xl font-semibold text-white transition-all"
            >
              {isTimerRunning ? 'Pause' : 'Start Focus Session'}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Lightbulb className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-black dark:text-white">Study Tips</h2>
          </div>

          <div className="space-y-4">
            {studyTips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-start gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                  <tip.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-black dark:text-white mb-1">{tip.title}</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{tip.tip}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-500/20 rounded-xl">
            <Lightbulb className="w-6 h-6 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-black dark:text-white">Study Notes & Ideas</h2>
        </div>

        <div className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNote()}
              placeholder="Add a note, idea, or reminder..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-black dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
            />
            <button
              onClick={addNote}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-semibold text-white transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {notes.length > 0 ? (
            notes.map((note, index) => (
                <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
              >
                <p className="text-black dark:text-white flex-1">{note.content}</p>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </motion.div>
            ))
          ) : (
            <p className="text-slate-700 dark:text-slate-400 text-center py-8">
              No notes yet. Add your first study note or idea above!
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
