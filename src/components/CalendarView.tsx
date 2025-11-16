import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useState } from 'react';
import { Assignment, Exam } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';

interface CalendarViewProps {
  assignments: Assignment[];
  exams: Exam[];
  colorTheme: string;
}

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: 'assignment' | 'exam';
  weight: number;
};

export const CalendarView = ({ assignments, exams, colorTheme }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all"
        >
          <Download className="w-5 h-5" />
          Export to Calendar
        </button>
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
            {assignments
              .filter((a) => a.due_date)
              .slice(0, 5)
              .map((assignment) => (
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
              ))}
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
            {exams
              .filter((e) => e.exam_date)
              .slice(0, 5)
              .map((exam) => (
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
              ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
