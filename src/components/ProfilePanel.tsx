import { motion, AnimatePresence } from 'framer-motion';
import { X, User, GraduationCap, Calendar, BookOpen, Edit2, Save, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

interface ProfilePanelProps {
  onClose: () => void;
}

export const ProfilePanel = ({ onClose }: ProfilePanelProps) => {
  const { user, userPreferences, updatePreferences, theme, setTheme } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    school: '',
    grad_year: '',
    major: '',
  });

  useEffect(() => {
    if (userPreferences) {
      setFormData({
        display_name: userPreferences.display_name || '',
        username: userPreferences.username || '',
        school: userPreferences.school || '',
        grad_year: userPreferences.grad_year?.toString() || '',
        major: userPreferences.major || '',
      });
    }
  }, [userPreferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        display_name: formData.display_name,
        username: formData.username || null,
        school: formData.school || null,
        grad_year: formData.grad_year ? parseInt(formData.grad_year) : null,
        major: formData.major || null,
      });

      setEditing(false);
      showToast('Profile updated successfully', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.code === '23505') {
        showToast('Username already taken', 'error');
      } else {
        showToast('Failed to update profile', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userPreferences) {
      setFormData({
        display_name: userPreferences.display_name || '',
        username: userPreferences.username || '',
        school: userPreferences.school || '',
        grad_year: userPreferences.grad_year?.toString() || '',
        major: userPreferences.major || '',
      });
    }
    setEditing(false);
  };

  const getInitials = () => {
    const name = formData.display_name || 'User';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-t-3xl sm:rounded-2xl border border-white/10 w-full sm:max-w-md sm:w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Profile</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
              {getInitials()}
            </div>
            {!editing && (
              <div className="text-center">
                <h4 className="text-xl font-bold text-white">{formData.display_name || 'Anonymous'}</h4>
                {formData.username && (
                  <p className="text-slate-400 text-sm">@{formData.username}</p>
                )}
                <p className="text-slate-500 text-xs mt-1">{user?.email}</p>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  School / University
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Graduation Year
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    value={formData.grad_year}
                    onChange={(e) => setFormData({ ...formData, grad_year: e.target.value })}
                    min="2020"
                    max="2035"
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Major / Field of Study
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium text-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.display_name.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-slate-400">Academic Info</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">School</span>
                    <span className="text-white text-sm">{formData.school || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Graduation Year</span>
                    <span className="text-white text-sm">{formData.grad_year || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Major</span>
                    <span className="text-white text-sm">{formData.major || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-400" />
                    )}
                    <span className="text-sm font-medium text-slate-400">Theme</span>
                  </div>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 text-sm font-medium transition-all"
                  >
                    Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
