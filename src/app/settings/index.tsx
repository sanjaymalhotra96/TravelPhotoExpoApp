import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenHeader } from '@/shared/components/common/ScreenHeader';
import { COLORS } from '@/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { CONFIG } from '@/constants';
import { ConfirmationDialog } from '@/shared/components/dialogs/ConfirmationDialog';
import { Icons } from '@/theme';
import { apiClient } from '@/shared/services/apiClient';
import { t } from '@/utils/i18n';
import { useRevenueCat } from '@/features/billing/providers/revenuecat-provider';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { isPremium } = useRevenueCat();

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const handleConfirmDeleteAccount = async () => {
    setDeleteDialogVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      if (CONFIG.USE_MOCK_API) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        // In Supabase, standard client cannot delete users directly unless invoking an edge function or admin client.
        // We simulate the API request and sign out the user.
        await apiClient.delete('/profile/delete-account');
      }

      await logout();
      Alert.alert(t('settings.accountDeletedTitle'), t('settings.accountDeletedDesc'));
    } catch {
      // Wipes local session anyway for safe exit
      await logout();
      Alert.alert(t('settings.processCompleteTitle'), t('settings.processCompleteDesc'));
    }
  };

  const handleLegalPress = (title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(title, t('settings.legalMockAlert', { title }), [{ text: t('common.ok') }]);
  };

  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg">
      <ScreenHeader title={t('settings.title')} showBackButton onBackPress={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5 pt-6">
        
        {/* Account Profile Section */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          {t('settings.profileSection')}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/profile');
          }}
          className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 mb-6 shadow-premium active:opacity-60"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-purple-100 dark:bg-purple-950/40 p-2.5 rounded-xl mr-3">
                <Icons.User size={18} color={COLORS.primary} />
              </View>
              <Text className="text-light-text dark:text-dark-text font-semibold text-sm">
                {t('settings.viewProfile')}
              </Text>
            </View>
            <Icons.ChevronRight size={16} className="text-light-muted dark:text-dark-muted" />
          </View>
        </Pressable>

        {/* Subscription Plan */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          {t('settings.subscriptionSection')}
        </Text>
        {isPremium ? (
          <View className="bg-white dark:bg-dark-card border border-purple-500 dark:border-purple-600 rounded-2xl p-5 mb-6 shadow-premium relative overflow-hidden">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-4">
                <View className="bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-xl mr-3">
                  <Icons.Sparkles size={22} color={COLORS.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-light-text dark:text-dark-text font-extrabold text-lg">
                    {t('settings.subscriptionPremium')}
                  </Text>
                  <Text className="text-light-muted dark:text-dark-muted text-xs mt-1">
                    {t('settings.premiumActiveDesc')}
                  </Text>
                </View>
              </View>
              <View className="bg-purple-100 dark:bg-purple-900/50 px-3 py-1.5 rounded-full">
                <Text className="text-purple-600 dark:text-purple-300 font-bold text-xs">{t('common.active')}</Text>
              </View>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/paywall');
            }}
            className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 mb-6 shadow-premium active:opacity-90"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1 pr-4">
                <View className="bg-slate-100 dark:bg-zinc-800/80 p-2.5 rounded-xl mr-3">
                  <Icons.Sparkles size={22} color={COLORS.textMuted} />
                </View>
                <View className="flex-1">
                  <Text className="text-light-text dark:text-dark-text font-bold text-base">
                    {t('settings.subscriptionFree')}
                  </Text>
                  <Text className="text-light-muted dark:text-dark-muted text-xs mt-1 leading-relaxed">
                    {t('settings.upgradeDesc')}
                  </Text>
                </View>
              </View>
              <Icons.ChevronRight size={20} className="text-light-muted dark:text-dark-muted" />
            </View>
            <View className="bg-purple-500 py-3 rounded-xl items-center justify-center shadow-sm">
              <Text className="text-white font-bold text-sm">
                {t('settings.upgradeToPremium')}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Legal documents options */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          {t('settings.legalSection')}
        </Text>
        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 mb-6 shadow-premium">
          <Pressable
            onPress={() => handleLegalPress(t('settings.legalPrivacy'))}
            className="flex-row items-center justify-between py-2 border-b border-light-border dark:border-dark-border active:opacity-60"
          >
            <View className="flex-row items-center">
              <Icons.Privacy size={18} className="text-light-muted dark:text-dark-muted mr-3" />
              <Text className="text-light-text dark:text-dark-text font-semibold text-sm">{t('settings.legalPrivacy')}</Text>
            </View>
            <Icons.ChevronRight size={16} className="text-light-muted dark:text-dark-muted" />
          </Pressable>

          <Pressable
            onPress={() => handleLegalPress(t('settings.legalTerms'))}
            className="flex-row items-center justify-between py-2 mt-2 active:opacity-60"
          >
            <View className="flex-row items-center">
              <Icons.Terms size={18} className="text-light-muted dark:text-dark-muted mr-3" />
              <Text className="text-light-text dark:text-dark-text font-semibold text-sm">{t('settings.legalTerms')}</Text>
            </View>
            <Icons.ChevronRight size={16} className="text-light-muted dark:text-dark-muted" />
          </Pressable>
        </View>

        {/* Account Deletion */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          {t('settings.dangerSection')}
        </Text>
        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 mb-12 shadow-premium">
          <Pressable
            onPress={() => setDeleteDialogVisible(true)}
            className="flex-row items-center justify-between py-1 active:opacity-60"
          >
            <View className="flex-row items-center">
              <View className="bg-red-50 dark:bg-red-950/20 p-2 rounded-xl mr-3">
                <Icons.DeleteAccount size={20} color={COLORS.danger} />
              </View>
              <View>
                <Text className="text-red-500 font-bold text-base">{t('settings.deleteAccountTitle')}</Text>
                <Text className="text-light-muted dark:text-dark-muted text-xs">{t('settings.deleteAccountDesc')}</Text>
              </View>
            </View>
            <Icons.ChevronRight size={16} className="text-light-muted dark:text-dark-muted" />
          </Pressable>
        </View>

      </ScrollView>

      {/* Account Deletion Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteDialogVisible}
        title={t('settings.deleteConfirmTitle')}
        description={t('settings.deleteConfirmDesc')}
        confirmText={t('settings.deleteConfirmBtn')}
        confirmVariant="danger"
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setDeleteDialogVisible(false)}
      />
    </View>
  );
}
