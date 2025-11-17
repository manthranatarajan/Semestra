import { motion } from 'framer-motion';
import { Users, TrendingUp, Award, Flame, Search, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, UserPreferences, FriendProgress } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface FriendsProgressProps {
  courseId: string;
}

interface FriendWithProgress {
  userId: string;
  displayName: string;
  username: string | null;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  studyStreak: number;
}

export const FriendsProgress = ({ courseId }: FriendsProgressProps) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFriendsProgress();
  }, [courseId, user]);

  const fetchFriendsProgress = async () => {
    if (!user) return;

    try {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (!friendships || friendships.length === 0) {
        setLoading(false);
        return;
      }

      const friendIds = friendships.map(f => f.friend_id);

      const { data: friendsData } = await supabase
        .from('user_preferences')
        .select('user_id, display_name, username')
        .in('user_id', friendIds);

      const { data: progressData } = await supabase
        .from('friends_progress')
        .select('*')
        .eq('course_id', courseId)
        .in('user_id', friendIds);

      const friendsWithProgress: FriendWithProgress[] = (friendsData || []).map(friend => {
        const progress = progressData?.find(p => p.user_id === friend.user_id);
        return {
          userId: friend.user_id,
          displayName: friend.display_name || 'Anonymous',
          username: friend.username,
          progress: progress?.progress_percent || 0,
          tasksCompleted: progress?.tasks_completed || 0,
          totalTasks: progress?.total_tasks || 0,
          studyStreak: progress?.study_streak || 0,
        };
      });

      friendsWithProgress.sort((a, b) => b.progress - a.progress);
      setFriends(friendsWithProgress);
    } catch (error) {
      console.error('Error fetching friends progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-500 to-emerald-600';
    if (progress >= 60) return 'from-blue-500 to-cyan-600';
    if (progress >= 40) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Friends' Progress</h2>
          <p className="text-slate-400">See how your friends are doing in this course</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {friends.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No friends yet</h3>
          <p className="text-slate-400 mb-6 text-center max-w-md">
            Add friends to see their progress and motivate each other to stay on track!
          </p>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold text-white transition-all">
            <UserPlus className="w-5 h-5" />
            Add Friends
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No friends found matching your search</p>
            </div>
          ) : (
            <>
              {filteredFriends[0] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-md rounded-2xl border-2 border-yellow-500/30 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
                  <div className="relative flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {getInitials(filteredFriends[0].displayName)}
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-white">{filteredFriends[0].displayName}</h3>
                        {filteredFriends[0].username && (
                          <span className="text-sm text-slate-400">@{filteredFriends[0].username}</span>
                        )}
                      </div>
                      <p className="text-yellow-400 font-semibold text-sm mb-3">Leading with {filteredFriends[0].progress}% completed!</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-slate-300">{filteredFriends[0].tasksCompleted}/{filteredFriends[0].totalTasks} tasks</span>
                        </div>
                        {filteredFriends[0].studyStreak > 0 && (
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-slate-300">{filteredFriends[0].studyStreak} day streak</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        {filteredFriends[0].progress}%
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {filteredFriends.slice(1).map((friend, index) => (
                  <motion.div
                    key={friend.userId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${getProgressColor(friend.progress)} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                        {getInitials(friend.displayName)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{friend.displayName}</h4>
                        {friend.username && (
                          <p className="text-sm text-slate-400">@{friend.username}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{friend.progress}%</div>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${friend.progress}%` }}
                        transition={{ duration: 1, delay: index * 0.05 + 0.3 }}
                        className={`h-full bg-gradient-to-r ${getProgressColor(friend.progress)} rounded-full`}
                      />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{friend.tasksCompleted}/{friend.totalTasks}</span>
                      </div>
                      {friend.studyStreak > 0 && (
                        <div className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <span>{friend.studyStreak}d</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
