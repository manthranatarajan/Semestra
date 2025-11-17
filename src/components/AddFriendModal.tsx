import { motion } from 'framer-motion';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { useState } from 'react';
import { supabase, UserPreferences } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface AddFriendModalProps {
  onClose: () => void;
}

export const AddFriendModal = ({ onClose }: AddFriendModalProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserPreferences[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    setSearching(true);
    try {
      const { data: allUsers, error } = await supabase
        .from('user_preferences')
        .select('*')
        .neq('user_id', user.id);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }

      const searchLower = searchQuery.toLowerCase();
      const matchingUsers = (allUsers || []).filter(u => {
        const displayNameMatch = u.display_name?.toLowerCase().includes(searchLower);
        const usernameMatch = u.username?.toLowerCase().includes(searchLower);
        return displayNameMatch || usernameMatch;
      }).slice(0, 10);

      const { data: existingFriendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id);

      const existingFriendIds = existingFriendships?.map(f => f.friend_id) || [];
      const filteredResults = matchingUsers.filter(u => !existingFriendIds.includes(u.user_id));

      setSearchResults(filteredResults);

      if (filteredResults.length === 0) {
        showToast('No users found', 'info');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      showToast('Failed to search users', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user) return;

    setSending(friendId);
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'accepted',
        });

      if (error) throw error;

      await supabase
        .from('friendships')
        .insert({
          user_id: friendId,
          friend_id: user.id,
          status: 'accepted',
        });

      showToast('Friend added successfully!', 'success');
      setSearchResults(searchResults.filter(r => r.user_id !== friendId));
    } catch (error: any) {
      console.error('Error adding friend:', error);
      if (error.code === '23505') {
        showToast('Already friends with this user', 'error');
      } else {
        showToast('Failed to add friend', 'error');
      }
    } finally {
      setSending(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 p-6 max-w-md w-full max-h-[600px] flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Add Friends</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by username or display name..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {searchResults.length === 0 && searchQuery && !searching && (
            <div className="text-center py-12">
              <p className="text-slate-400">No users found</p>
            </div>
          )}

          {searchResults.map((result) => (
            <motion.div
              key={result.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {getInitials(result.display_name || 'User')}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white">{result.display_name || 'Anonymous'}</h4>
                {result.username && (
                  <p className="text-sm text-slate-400">@{result.username}</p>
                )}
              </div>
              <button
                onClick={() => handleAddFriend(result.user_id)}
                disabled={sending === result.user_id}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              >
                {sending === result.user_id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Add
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-sm text-blue-300">
            Search for friends by their username or display name to connect and track progress together!
          </p>
        </div>
      </motion.div>
    </div>
  );
};
