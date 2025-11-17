import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Award, CheckCircle, Edit2, Trash2, Check, X, Plus } from 'lucide-react';
import { Assignment, Exam } from '../lib/supabase';
import { format, parseISO, isAfter } from 'date-fns';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

interface TimelineProps {
  assignments: Assignment[];
  exams: Exam[];
  colorTheme: string;
  courseId: string;
  onRefresh: () => void;
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

export const Timeline = ({ assignments, exams, colorTheme, courseId, onRefresh }: TimelineProps) => {
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'assignment' | 'exam'>('assignment');
  const [addTitle, setAddTitle] = useState('');
  const [addDate, setAddDate] = useState('');
  const [addWeight, setAddWeight] = useState('10');
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
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

    setItems([...assignmentItems, ...examItems].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
  }, [assignments, exams]);

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

    setSaving(true);
    try {
      const table = item.type === 'assignment' ? 'assignments' : 'exams';
      const dateField = item.type === 'assignment' ? 'due_date' : 'exam_date';

      await supabase
        .from(table)
        .update({ title: editTitle, [dateField]: editDate })
        .eq('id', editingId);

      setEditingId(null);
      await onRefresh();
      showToast('Changes saved successfully', 'success');
    } catch (error) {
      console.error('Error updating item:', error);
      showToast('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDate('');
  };

  const deleteItem = async (item: TimelineItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    setSaving(true);
    try {
      const table = item.type === 'assignment' ? 'assignments' : 'exams';

      await supabase
        .from(table)
        .delete()
        .eq('id', item.id);

      await onRefresh();
      showToast('Item deleted successfully', 'delete');
    } catch (error) {
      console.error('Error deleting item:', error);
      showToast('Failed to delete item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!addTitle || !addDate || !addWeight) {
      showToast('Please fill all fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const weight = parseFloat(addWeight) / 100;

      if (addType === 'assignment') {
        await supabase.from('assignments').insert({
          course_id: courseId,
          title: addTitle,
          due_date: addDate,
          weight,
          type: 'assignment',
          description: '',
          completed: false,
        });
      } else {
        await supabase.from('exams').insert({
          course_id: courseId,
          title: addTitle,
          exam_date: addDate,
          weight,
          type: 'exam',
          location: '',
          completed: false,
        });
      }

      setShowAddModal(false);
      setAddTitle('');
      setAddDate('');
      setAddWeight('10');
      await onRefresh();
      showToast('Item added successfully', 'success');
    } catch (error) {
      console.error('Error adding item:', error);
      showToast('Failed to add item', 'error');
    } finally {
      setSaving(false);
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
        <Calendar className="w-16 h-16 text-slate-700 dark:text-slate-400 mb-4" />
        <p className="text-slate-700 dark:text-slate-400">No assignments or exams found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">Course Timeline</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-700 dark:text-slate-300">Assignment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-slate-700 dark:text-slate-300">Exam</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-700 dark:text-slate-300">Final</span>
            </div>
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
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white"
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
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-900 dark:text-white font-medium transition-colors"
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
                                    : 'text-black dark:text-white'
                              }`}
                            >
                              {item.title}
                            </h3>
                            <p className="text-sm text-slate-700 dark:text-slate-400">
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

                        <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300 cursor-pointer" onClick={() => toggleComplete(item)}>
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

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-black dark:text-white">Add Item to Timeline</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                      <button
                      onClick={() => setAddType('assignment')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        addType === 'assignment'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <Clock className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                      <p className="text-black dark:text-white text-sm">Assignment</p>
                    </button>
                    <button
                      onClick={() => setAddType('exam')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        addType === 'exam'
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <Award className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                      <p className="text-black dark:text-white text-sm">Exam</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="e.g., Final Project"
                    className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {addType === 'assignment' ? 'Due Date' : 'Exam Date'}
                  </label>
                  <input
                    type="date"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    value={addWeight}
                    onChange={(e) => setAddWeight(e.target.value)}
                    min="0"
                    max="100"
                    placeholder="10"
                    className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl font-medium text-black dark:text-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
