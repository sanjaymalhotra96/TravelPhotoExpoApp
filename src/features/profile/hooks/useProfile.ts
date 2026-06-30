import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { HistoryItem } from '@/constants';
import { UserProfile } from '../types';
import { profileRepository } from '../services/profileRepository';

export const useProfile = () => {
  const { user } = useAuthStore();

  return useQuery<{ profile: UserProfile; history: HistoryItem[] }, Error>({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User is not authenticated.');
      return profileRepository.getUserProfileAndHistory({ id: user.id, email: user.email });
    },
    enabled: !!user,
  });
};
