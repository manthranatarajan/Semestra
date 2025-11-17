import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteModalProps {
  courseName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const DeleteModal = ({ courseName, onConfirm, onCancel, loading }: DeleteModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 p-6 max-w-md w-full"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Delete Course</h3>
              <p className="text-sm text-slate-400">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-white">
            Are you sure you want to delete <span className="font-semibold">{courseName}</span>?
          </p>
          <p className="text-sm text-slate-400 mt-2">
            All assignments, exams, and related data will be permanently removed.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
