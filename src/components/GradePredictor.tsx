import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Save, Check, Edit2, X } from 'lucide-react';
import { useToast } from './Toast';
import { useState, useEffect } from 'react';
import { Assignment, Exam, GradeWeight, supabase } from '../lib/supabase';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface GradePredictorProps {
  assignments: Assignment[];
  exams: Exam[];
  gradeWeights: GradeWeight[];
  courseId: string;
  onRefresh: () => void;
}

export const GradePredictor = ({ assignments, exams, gradeWeights, courseId, onRefresh }: GradePredictorProps) => {
  const { showToast } = useToast();
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [whatIfScore, setWhatIfScore] = useState<number>(85);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingWeights, setEditingWeights] = useState(false);
  const [editedWeights, setEditedWeights] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const initialScores: { [key: string]: number } = {};
    assignments.forEach((a) => {
      if (a.score !== null) {
        initialScores[`assignment-${a.id}`] = a.score;
      }
    });
    exams.forEach((e) => {
      if (e.score !== null) {
        initialScores[`exam-${e.id}`] = e.score;
      }
    });
    setScores(initialScores);
  }, [assignments, exams]);

  useEffect(() => {
    const weights: { [key: string]: number } = {};
    gradeWeights.forEach((w) => {
      weights[w.id] = w.weight * 100;
    });
    setEditedWeights(weights);
  }, [gradeWeights]);

  const handleScoreChange = (id: string, type: 'assignment' | 'exam', value: number) => {
    const key = `${type}-${id}`;
    setScores((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
    setSaved(false);
  };

  const handleSaveScores = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(scores).map(([key, value]) => {
        const [type, id] = key.split('-');
        return { type, id, value };
      });

      for (const { type, id, value } of updates) {
        const table = type === 'assignment' ? 'assignments' : 'exams';
        await supabase.from(table).update({ score: value }).eq('id', id);
      }

      setHasUnsavedChanges(false);
      setSaved(true);
      showToast('Scores saved successfully', 'success');
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving scores:', error);
      showToast('Failed to save scores', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWeights = async () => {
    setSaving(true);
    try {
      const total = Object.values(editedWeights).reduce((sum, val) => sum + val, 0);
      if (Math.abs(total - 100) > 0.1) {
        showToast('Grade weights must sum to 100%', 'error');
        setSaving(false);
        return;
      }

      for (const [id, weight] of Object.entries(editedWeights)) {
        await supabase
          .from('grade_weights')
          .update({ weight: weight / 100 })
          .eq('id', id);
      }

      setEditingWeights(false);
      await onRefresh();
      showToast('Grade breakdown updated', 'success');
    } catch (error) {
      console.error('Error saving weights:', error);
      showToast('Failed to update grade breakdown', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelWeightEdit = () => {
    const weights: { [key: string]: number } = {};
    gradeWeights.forEach((w) => {
      weights[w.id] = w.weight * 100;
    });
    setEditedWeights(weights);
    setEditingWeights(false);
  };

  const calculateGrade = (useWhatIf: boolean = false) => {
    let totalWeight = 0;
    let totalEarned = 0;
    let totalPossible = 0;

    assignments.forEach((a) => {
      const score = scores[`assignment-${a.id}`];
      if (score !== undefined) {
        totalEarned += score * a.weight;
        totalPossible += 100 * a.weight;
        totalWeight += a.weight;
      }
    });

    exams.forEach((e) => {
      const score = useWhatIf ? whatIfScore : scores[`exam-${e.id}`];
      if (score !== undefined) {
        totalEarned += score * e.weight;
        totalPossible += 100 * e.weight;
        totalWeight += e.weight;
      }
    });

    if (totalPossible === 0) return 0;
    return (totalEarned / totalPossible) * 100;
  };

  const currentGrade = calculateGrade();
  const whatIfGrade = calculateGrade(true);

  const getLetterGrade = (percent: number) => {
    if (percent >= 93) return 'A';
    if (percent >= 90) return 'A-';
    if (percent >= 87) return 'B+';
    if (percent >= 83) return 'B';
    if (percent >= 80) return 'B-';
    if (percent >= 77) return 'C+';
    if (percent >= 73) return 'C';
    if (percent >= 70) return 'C-';
    if (percent >= 67) return 'D+';
    if (percent >= 63) return 'D';
    if (percent >= 60) return 'D-';
    return 'F';
  };

  const getGradeColor = (percent: number) => {
    if (percent >= 90) return 'text-green-400';
    if (percent >= 80) return 'text-blue-400';
    if (percent >= 70) return 'text-yellow-400';
    if (percent >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const chartData = {
    labels: gradeWeights.map((w) => w.category),
    datasets: [
      {
        data: gradeWeights.map((w) => w.weight * 100),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: { size: 14 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.parsed.toFixed(1)}%`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Current Grade</h2>

          <div className="flex items-center justify-center mb-8">
            <div className="text-center">
              <div className={`text-7xl font-bold mb-2 ${getGradeColor(currentGrade)}`}>
                {getLetterGrade(currentGrade)}
              </div>
              <div className="text-2xl text-slate-300">{currentGrade.toFixed(1)}%</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <span className="text-slate-300">Letter Grade</span>
              <span className={`font-semibold ${getGradeColor(currentGrade)}`}>
                {getLetterGrade(currentGrade)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <span className="text-slate-300">Percentage</span>
              <span className="font-semibold text-white">{currentGrade.toFixed(2)}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Grade Breakdown</h2>
            {editingWeights ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveWeights}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleCancelWeightEdit}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingWeights(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
          {editingWeights ? (
            <div className="space-y-3">
              {gradeWeights.map((weight) => (
                <div key={weight.id} className="flex items-center gap-4">
                  <label className="flex-1 text-slate-300">{weight.category}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editedWeights[weight.id] || 0}
                      onChange={(e) => setEditedWeights({ ...editedWeights, [weight.id]: parseFloat(e.target.value) || 0 })}
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-white">Total</span>
                  <span className={`${Math.abs(Object.values(editedWeights).reduce((sum, val) => sum + val, 0) - 100) < 0.1 ? 'text-green-400' : 'text-red-400'}`}>
                    {Object.values(editedWeights).reduce((sum, val) => sum + val, 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6">What-If Scenario</h2>

        <div className="mb-6">
          <label className="block text-slate-300 mb-3">
            If you score {whatIfScore}% on upcoming items:
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={whatIfScore}
            onChange={(e) => setWhatIfScore(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {getLetterGrade(whatIfGrade)}
            </div>
            <div className="text-sm text-slate-300">Predicted Grade</div>
          </div>

          <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {whatIfGrade.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-300">Final Percentage</div>
          </div>

          <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {whatIfGrade > currentGrade ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : whatIfGrade < currentGrade ? (
                <TrendingDown className="w-8 h-8 text-red-400" />
              ) : (
                <Minus className="w-8 h-8 text-slate-400" />
              )}
              <span className="text-3xl font-bold text-white">
                {Math.abs(whatIfGrade - currentGrade).toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-slate-300">Change</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Enter Your Scores</h2>

        <div className="space-y-6">
          {assignments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Assignments</h3>
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{assignment.title}</p>
                      <p className="text-sm text-slate-400">
                        Weight: {(assignment.weight * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scores[`assignment-${assignment.id}`] || ''}
                        onChange={(e) =>
                          handleScoreChange(
                            assignment.id,
                            'assignment',
                            Number(e.target.value)
                          )
                        }
                        placeholder="Score"
                        className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-slate-400">/ 100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exams.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Exams</h3>
              <div className="space-y-3">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{exam.title}</p>
                      <p className="text-sm text-slate-400">
                        Weight: {(exam.weight * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scores[`exam-${exam.id}`] || ''}
                        onChange={(e) =>
                          handleScoreChange(exam.id, 'exam', Number(e.target.value))
                        }
                        placeholder="Score"
                        className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-slate-400">/ 100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          {saved && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-green-400"
            >
              <Check className="w-5 h-5" />
              <span>Scores saved!</span>
            </motion.div>
          )}
          <button
            onClick={handleSaveScores}
            disabled={!hasUnsavedChanges || saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Scores'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
