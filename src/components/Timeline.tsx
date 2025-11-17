import { motion } from 'framer-motion';
import { Calendar, Clock, Award, CheckCircle, Edit2, Trash2, Check, X } from 'lucide-react';
import { Assignment, Exam } from '../lib/supabase';
import { format, parseISO, isAfter } from 'date-fns';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface TimelineProps {
  assignments: Assignment[];
  exams: Exam[];
  colorTheme: string;
}

type TimelineItem = {
  id: string;
  title: string;
  date: string;
  weight: number;
  type: 'assignment' | 'exam';
  completed?: boolean;
  examType?: string;
};

export const Timeline = ({ assignments, exams, colorTheme }: TimelineProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [items, setItems] = useState<TimelineItem[]>(() => {
    const assignmentItems: TimelineItem[] = assignments
      .filter((a) => a.due_date)
      .map((a) => ({
        id: a.id,
        title: a.title,
        date: a.due_date!,
        weight: a.weight,
        type: 'assignment' as const,
        completed: a.completed,
      }));

    const examItems: TimelineItem[] = exams
      .filter((e) => e.exam_date)
      .map((e) => ({
        id: e.id,
        title: e.title,
        date: e.exam_date!,
        weight: e.weight,
        type: 'exam' as const,
        examType: e.type,
      }));

    return [...assignmentItems, ...examItems].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  });

  const toggleComplete = async (item: TimelineItem) => {
    if (item.type !== 'assignment') return;

    try {
      const newCompleted = !item.completed;
      await supabase
        .from('assignments')
        .update({ completed: newCompleted })
        .eq('id', item.id);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, completed: newCompleted } : i
        )
      );
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const startEditing = (item: TimelineItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDate(item.date);
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const item = items.find(i => i.id === editingId);
    if (!item) return;

    try {
      const table = item.type === 'assignment' ? 'assignments' : 'exams';
      const dateField = item.type === 'assignment' ? 'due_date' : 'exam_date';

      await supabase
        .from(table)
        .update({ title: editTitle, [dateField]: editDate })
        .eq('id', editingId);

      setItems((prev) =>
        prev.map((i) =>
          i.id === editingId ? { ...i, title: editTitle, date: editDate } : i
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );

      setEditingId(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDate('');
  };

  const deleteItem = async (item: TimelineItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      const table = item.type === 'assignment' ? 'assignments' : 'exams';

      await supabase
        .from(table)
        .delete()
        .eq('id', item.id);

      setItems((prev) => prev.filter(i => i.id !== item.id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const getTypeColor = (type: string, examType?: string) => {
    if (type === 'exam') {
      return examType === 'final' ? 'red' : 'orange';
    }
    return 'blue';
  };

  const getTypeLabel = (type: string, examType?: string) => {
    if (type === 'exam') {
      return examType === 'final' ? 'Final Exam' : 'Exam';
    }
    return 'Assignment';
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Calendar className="w-16 h-16 text-slate-600 mb-4" />
        <p className="text-slate-400">No assignments or exams found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Course Timeline</h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-300">Assignment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-slate-300">Exam</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-300">Final</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-transparent" />

        <div className="space-y-4">
          {items.map((item, index) => {
            const isPast = isAfter(new Date(), parseISO(item.date));
            const typeColor = getTypeColor(item.type, item.examType);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <div className="flex items-start gap-6">
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        item.completed
                          ? 'bg-green-500'
                          : `bg-${typeColor}-500`
                      } shadow-lg`}
                    >
                      {item.completed ? (
                        <CheckCircle className="w-8 h-8 text-white" />
                      ) : item.type === 'exam' ? (
                        <Award className="w-8 h-8 text-white" />
                      ) : (
                        <Clock className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`flex-1 p-6 rounded-2xl border transition-all group/item ${
                      item.completed
                        ? 'bg-green-500/10 border-green-500/20'
                        : `bg-${typeColor}-500/10 border-${typeColor}-500/20`
                    } ${
                      isPast && !item.completed
                        ? 'opacity-60'
                        : 'opacity-100'
                    }`}
                  >
                    {editingId === item.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 cursor-pointer" onClick={() => toggleComplete(item)}>
                            <h3
                              className={`text-lg font-semibold mb-1 ${
                                item.completed
                                  ? 'text-green-400 line-through'
                                  : 'text-white'
                              }`}
                            >
                              {item.title}
                            </h3>
                            <p className="text-sm text-slate-400">
                              {getTypeLabel(item.type, item.examType)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                item.completed
                                  ? 'bg-green-500/20 text-green-400'
                                  : `bg-${typeColor}-500/20 text-${typeColor}-400`
                              }`}
                            >
                              {(item.weight * 100).toFixed(0)}%
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(item);
                                }}
                                className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-blue-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem(item);
                                }}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-300 cursor-pointer" onClick={() => toggleComplete(item)}>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(parseISO(item.date), 'MMM d, yyyy')}</span>
                          </div>
                          {isPast && !item.completed && (
                            <span className="text-red-400">Overdue</span>
                          )}
                          {item.completed && (
                            <span className="text-green-400">Completed</span>
                          )}
                        </div>

                        {item.weight > 0.15 && !item.completed && (
                          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-sm text-yellow-400">
                              This is {(item.weight * 100).toFixed(0)}% of your final grade
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
