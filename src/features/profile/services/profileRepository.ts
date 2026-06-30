import { HistoryItem, CONFIG, MOCK_HISTORY } from '@/constants';
import { apiClient } from '@/shared/services/apiClient';
import { UserProfile } from '../types';

export interface IProfileRepository {
  getUserProfileAndHistory(user: { id: string; email?: string }): Promise<{ profile: UserProfile; history: HistoryItem[] }>;
}

export class ApiProfileRepository implements IProfileRepository {
  async getUserProfileAndHistory(user: { id: string; email?: string }): Promise<{ profile: UserProfile; history: HistoryItem[] }> {
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

    const [profileRes, historyRes] = await Promise.all([
      apiClient.get<UserProfile>('/profile'),
      apiClient.get<HistoryItem[]>('/profile/history'),
    ]);

    return {
      profile: profileRes.data,
      history: historyRes.data,
    };
  }
}

export const profileRepository = new ApiProfileRepository();
