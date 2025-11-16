import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Assignment, Exam, supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, isAfter, startOfToday } from 'date-fns';

interface CalendarViewProps {
  assignments: Assignment[];
  exams: Exam[];
  colorTheme: string;
  courseId: string;
}

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: 'assignment' | 'exam';
  weight: number;
};

export const CalendarView = ({ assignments, exams, colorTheme, courseId }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventType, setNewEventType] = useState<'assignment' | 'exam'>('assignment');
  const [saving, setSaving] = useState(false);

  const events: CalendarEvent[] = [
    ...assignments
      .filter((a) => a.due_date)
      .map((a) => ({
        id: a.id,
        title: a.title,
        date: parseISO(a.due_date!),
        type: 'assignment' as const,
        weight: a.weight,
      })),
    ...exams
      .filter((e) => e.exam_date)
      .map((e) => ({
        id: e.id,
        title: e.title,
        date: parseISO(e.exam_date!),
        type: 'exam' as const,
        weight: e.weight,
      })),
  ];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date));
  };

  const handleAddEvent = async () => {
    if (!newEventTitle || !newEventDate) return;

    setSaving(true);
    try {
      const table = newEventType === 'assignment' ? 'assignments' : 'exams';
      const data = newEventType === 'assignment'
        ? { course_id: courseId, title: newEventTitle, due_date: newEventDate, weight: 0, type: 'custom' }
        : { course_id: courseId, title: newEventTitle, exam_date: newEventDate, weight: 0, type: 'custom' };

      await supabase.from(table).insert(data);

      setShowAddEventModal(false);
      setNewEventTitle('');
      setNewEventDate('');
      window.location.reload();
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const icsEvents = events.map((event) => {
      const start = format(event.date, "yyyyMMdd'T'HHmmss");
      return [
        'BEGIN:VEVENT',
        `DTSTART:${start}`,
        `DTEND:${start}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.type} - ${(event.weight * 100).toFixed(0)}% of grade`,
        'END:VEVENT',
      ].join('\r\n');
    });

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Smart Syllabus//EN',
      ...icsEvents,
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'syllabus-calendar.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  const today = startOfToday();
  const upcomingAssignments = assignments
    .filter((a) => a.due_date && isAfter(parseISO(a.due_date), today))
    .sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime())
    .slice(0, 5);

  const upcomingExams = exams
    .filter((e) => e.exam_date && isAfter(parseISO(e.exam_date), today))
    .sort((a, b) => parseISO(a.exam_date!).getTime() - parseISO(b.exam_date!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <h2 className="text-3xl font-bold text-white min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddEventModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold text-white transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all"
          >
            <Download className="w-5 h-5" />
            Export to Calendar
          </button>
        </div>
      </div>

      <motion.div
        key={currentDate.toISOString()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6"
      >
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-slate-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());

            return (
              <motion.div
                key={day.toISOString()}
                whileHover={{ scale: 1.05 }}
                className={`aspect-square p-2 rounded-xl transition-all cursor-pointer ${
                  isToday
                    ? 'bg-blue-500/20 border-2 border-blue-500'
                    : dayEvents.length > 0
                    ? 'bg-white/5 hover:bg-white/10'
                    : 'bg-transparent hover:bg-white/5'
                }`}
              >
                <div className="h-full flex flex-col">
                  <div
                    className={`text-sm font-semibold mb-1 ${
                      isToday ? 'text-blue-400' : 'text-white'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>

                  <div className="flex-1 space-y-1 overflow-y-auto">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs px-2 py-1 rounded ${
                          event.type === 'exam'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-blue-500/20 text-blue-300'
                        } truncate`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-slate-400 px-2">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Upcoming Assignments</h3>
          <div className="space-y-3">
            {upcomingAssignments.length > 0 ? (
              upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                >
                  <div>
                    <p className="text-white font-medium text-sm">{assignment.title}</p>
                    <p className="text-xs text-slate-400">
                      {format(parseISO(assignment.due_date!), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                    {(assignment.weight * 100).toFixed(0)}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No upcoming assignments</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Upcoming Exams</h3>
          <div className="space-y-3">
            {upcomingExams.length > 0 ? (
              upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <div>
                    <p className="text-white font-medium text-sm">{exam.title}</p>
                    <p className="text-xs text-slate-400">
                      {format(parseISO(exam.exam_date!), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                    {(exam.weight * 100).toFixed(0)}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No upcoming exams</p>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAddEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Add Custom Event</h2>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g., Office Hours, Study Session"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setNewEventType('assignment')}
                      className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                        newEventType === 'assignment'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      Assignment
                    </button>
                    <button
                      onClick={() => setNewEventType('exam')}
                      className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                        newEventType === 'exam'
                          ? 'bg-red-500 text-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      Exam
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddEventModal(false)}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEvent}
                    disabled={!newEventTitle || !newEventDate || saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Adding...' : 'Add Event'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
