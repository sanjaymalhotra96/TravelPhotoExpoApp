import React, { useState } from 'react'; // refreshed 2
import { View, Text, TextInput, ScrollView, Switch, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { StorageService } from '@/services/storage';
import { STORAGE_KEYS, API_CONFIG, CONFIG } from '@/constants';
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog';
import { Toast } from '@/components/common/Toast';
import { Icons } from '@/theme';
import { apiClient } from '@/services/api/client';
import { t } from '@/utils/i18n';
import { useRevenueCat } from '@/providers/revenuecat-provider';

// Form validation schema
const urlSchema = z.object({
  apiUrl: z.string().url(t('settings.invalidUrl')).or(z.literal('')),
});

type FormValues = z.infer<typeof urlSchema>;

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colorScheme, toggleTheme, colors } = useTheme();
  const { logout } = useAuthStore();
  const { isPremium } = useRevenueCat();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const savedUrl = StorageService.getString(STORAGE_KEYS.CUSTOM_API_URL) || '';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      apiUrl: savedUrl,
    },
  });

  const triggerToast = (msg: string, type: 'success' | 'error') => {
    setToastMessage(msg);
    setToastType(type);
    setToastVisible(true);
  };

  const onSubmit = (data: FormValues) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (data.apiUrl.trim() === '') {
      StorageService.delete(STORAGE_KEYS.CUSTOM_API_URL);
      triggerToast(t('settings.serverResetToast'), 'success');
    } else {
      StorageService.setString(STORAGE_KEYS.CUSTOM_API_URL, data.apiUrl.trim());
      triggerToast(t('settings.serverSavedToast'), 'success');
    }
    queryClient.clear();
  };

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
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <ScreenHeader title={t('settings.title')} showBackButton onBackPress={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5 pt-6">
        
        {/* Subscription Plan */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          {t('settings.subscriptionSection')}
        </Text>
        {isPremium ? (
          <View className="bg-white dark:bg-dark-card border border-purple-500 dark:border-purple-600 rounded-2xl p-5 mb-6 shadow-premium relative overflow-hidden">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-4">
                <View className="bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-xl mr-3">
                  <Icons.Sparkles size={22} color="#8b5cf6" />
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
                <Text className="text-purple-600 dark:text-purple-300 font-bold text-xs">Active</Text>
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
                  <Icons.Sparkles size={22} color="#64748b" />
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

        {/* Style configurations */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          {t('settings.themeSection')}
        </Text>
        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 mb-6 shadow-premium">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-primary-50 dark:bg-primary-950/40 p-2 rounded-xl mr-3">
                {colorScheme === 'dark' ? (
                  <Icons.Moon size={20} color={colors.primary} />
                ) : (
                  <Icons.Sun size={20} color={colors.primary} />
                )}
              </View>
              <View>
                <Text className="text-light-text dark:text-dark-text font-bold text-base">{t('settings.darkModeLabel')}</Text>
                <Text className="text-light-muted dark:text-dark-muted text-xs">{t('settings.darkModeDesc')}</Text>
              </View>
            </View>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </View>

        {/* Notifications config */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          {t('settings.notificationsSection')}
        </Text>
        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 mb-6 shadow-premium">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-primary-50 dark:bg-primary-950/40 p-2 rounded-xl mr-3">
                <Icons.Bell size={20} color={colors.primary} />
              </View>
              <View>
                <Text className="text-light-text dark:text-dark-text font-bold text-base">{t('settings.pushNotifLabel')}</Text>
                <Text className="text-light-muted dark:text-dark-muted text-xs">{t('settings.notifDesc')}</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        </View>

        {/* Custom Server config */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          {t('settings.serverSection')}
        </Text>
        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 mb-6 shadow-premium">
          <Text className="text-light-text dark:text-dark-text font-bold text-sm mb-1.5">
            {t('settings.serverLabel')}
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-xs mb-4 leading-relaxed">
            {t('settings.serverDefaultPrefix')} {API_CONFIG.BASE_URL}
          </Text>

          <Controller
            control={control}
            name="apiUrl"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`w-full bg-slate-50 dark:bg-zinc-800/40 border ${
                  errors.apiUrl ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                } rounded-xl px-4 py-3.5 text-light-text dark:text-dark-text text-sm mb-1`}
                placeholder={t('settings.serverPlaceholder')}
                placeholderTextColor="#94a3b8"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />

          {errors.apiUrl && (
            <Text className="text-red-500 text-xs mb-4 font-semibold">
              {errors.apiUrl.message}
            </Text>
          )}

          <View className="mt-2.5">
            <Pressable
              onPress={handleSubmit(onSubmit)}
              className="w-full flex-row items-center justify-center py-4 px-6 rounded-2xl bg-primary-500 active:bg-primary-600 shadow-premium"
            >
              <Text className="text-white text-base font-bold text-center tracking-wide">
                {t('settings.serverSaveBtn')}
              </Text>
            </Pressable>
          </View>
        </View>

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
                <Icons.DeleteAccount size={20} color="#ef4444" />
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
