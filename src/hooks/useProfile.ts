import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { CONFIG, MOCK_HISTORY, HistoryItem } from '@/constants';
import { apiClient } from '@/services/api/client';

export interface UserProfile {
  email: string;
  avatarUrl: string;
  fullName: string;
}

export const useProfile = () => {
  const { user } = useAuthStore();

  return useQuery<{ profile: UserProfile; history: HistoryItem[] }, Error>({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User is not authenticated.');

      if (CONFIG.USE_MOCK_API) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return {
          profile: {
            email: user.email || 'traveler@example.com',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            fullName: 'Sarah Traveler',
          },
          history: MOCK_HISTORY,
        };
      }

      // Fetch profile and history endpoints in parallel
      const [profileRes, historyRes] = await Promise.all([
        apiClient.get<UserProfile>('/profile'),
        apiClient.get<HistoryItem[]>('/profile/history'),
      ]);

      return {
        profile: profileRes.data,
        history: historyRes.data,
      };
    },
    enabled: !!user,
  });
};
