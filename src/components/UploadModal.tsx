import { motion } from 'framer-motion';
import { X, Upload, FileText, Loader, CheckCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadModal = ({ onClose, onSuccess }: UploadModalProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [parsedSummary, setParsedSummary] = useState<any | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    console.log('Uploading syllabus...', { fileName: file.name, size: file.size });
    setUploading(true);
    setProgress(10);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        const envMessage = 'Supabase environment variables are missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
        console.error(envMessage, { supabaseUrl, supabaseKeySet: !!supabaseKey });
        setError(envMessage);
        setUploading(false);
        setProgress(0);
        return;
      }

      const { data: { session } } = await (await import('../lib/supabase')).supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      setProgress(50);

      // Use the functions subdomain to avoid gateway/proxy issues
      const functionsUrl = supabaseUrl.replace('.supabase.co', '.functions.supabase.co');
      const requestUrl = `${functionsUrl}/parse-syllabus`;
      console.log('Posting syllabus to edge function', { requestUrl });

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseKey,
        },
        body: formData,
      });

      setProgress(80);

      if (!response.ok) {
        const text = await response.text();
        console.error('Upload failed response', { status: response.status, body: text });
        let message = 'Upload failed';
        try {
          const parsed = JSON.parse(text);
          message = parsed.error || message;
        } catch {
          message = text || message;
        }
        throw new Error(message);
      }

      const result = await response.json();
      console.log('Upload successful', result);
      setParsedSummary(result);
      setShowSummary(true);
      setProgress(100);
      setUploading(false);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err?.message ? `Upload failed: ${err.message}` : 'Failed to upload syllabus (network error)');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {uploading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
          <div className="flex items-center gap-3 text-white">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Parsing syllabus...</span>
          </div>
        </div>
      )}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 p-8 max-w-lg w-full shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black dark:text-white">Upload Syllabus</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {!success && !showSummary ? (
          <div className="space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="w-12 h-12 text-blue-400" />
                  <p className="text-black dark:text-white font-medium">{file.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-slate-600 dark:text-slate-400" />
                  <p className="text-black dark:text-white font-medium">Drop PDF here or click to browse</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Maximum file size: 10MB</p>
                </div>
              )}
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {uploading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Parsing with Smart AI</span>
                  <span className="text-blue-400">{progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Extracting assignments, exams, and deadlines...</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-black dark:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload & Parse'}
              </button>
            </div>
          </div>
        ) : showSummary ? (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Review before saving</h3>
            <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 space-y-2">
              <p className="text-slate-200"><span className="text-slate-400">Course:</span> {parsedSummary?.courseName || 'Untitled Course'}</p>
              <p className="text-slate-200"><span className="text-slate-400">Instructor:</span> {parsedSummary?.instructor || 'Unknown'}</p>
              <p className="text-slate-200"><span className="text-slate-400">Semester:</span> {parsedSummary?.semester || 'N/A'}</p>
              {parsedSummary?.gradeScheme?.length > 0 && (
                <div className="text-slate-200">
                  <p className="text-slate-400 mb-1">Grading Scheme:</p>
                  <ul className="space-y-1">
                    {parsedSummary.gradeScheme.map((g: any, idx: number) => (
                      <li key={idx} className="flex justify-between text-sm text-slate-200">
                        <span>{g.component}</span>
                        <span>{g.weight}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {parsedSummary?.needsReview && (
                <p className="text-amber-300 text-sm">Some fields are missing. Please review after saving.</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowSummary(false); setParsedSummary(null); }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-white transition-all"
              >
                Edit / Reparse
              </button>
              <button
                onClick={() => { setSuccess(true); onSuccess(); }}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
            <p className="text-slate-400">Your syllabus has been parsed and added to your courses</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
