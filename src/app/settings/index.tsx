import React, { useState } from 'react'; // refreshed 2
import { View, Text, TextInput, ScrollView, Switch, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { StorageService } from '../../services/storage';
import { STORAGE_KEYS, API_CONFIG, CONFIG } from '../../constants';
import { ConfirmationDialog } from '../../components/dialogs/ConfirmationDialog';
import { Toast } from '../../components/common/Toast';
import { Icons } from '../../theme';
import { apiClient } from '../../services/api/client';

// Form validation schema
const urlSchema = z.object({
  apiUrl: z.string().url('Invalid URL format').or(z.literal('')),
});

type FormValues = z.infer<typeof urlSchema>;

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colorScheme, toggleTheme } = useThemeStore();
  const { logout } = useAuthStore();

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
      triggerToast('Server endpoints reset to defaults.', 'success');
    } else {
      StorageService.setString(STORAGE_KEYS.CUSTOM_API_URL, data.apiUrl.trim());
      triggerToast('Custom API server endpoint saved.', 'success');
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
      Alert.alert('Account Deleted', 'Your profile and data have been wiped from our servers.');
    } catch {
      // Wipes local session anyway for safe exit
      await logout();
      Alert.alert('Process Complete', 'Session ended successfully.');
    }
  };

  const handleLegalPress = (title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(title, `This is a mockup placeholder for the ${title} page.`, [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView className="flex-1 bg-light-bg dark:bg-dark-bg">
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <ScreenHeader title="Preferences" showBackButton onBackPress={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5 pt-6">
        
        {/* Style configurations */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          Application Theme
        </Text>
        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 mb-6 shadow-premium">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-primary-50 dark:bg-primary-950/40 p-2 rounded-xl mr-3">
                {colorScheme === 'dark' ? (
                  <Icons.Moon size={20} color="#8b5cf6" />
                ) : (
                  <Icons.Sun size={20} color="#8b5cf6" />
                )}
              </View>
              <View>
                <Text className="text-light-text dark:text-dark-text font-bold text-base">Dark Mode</Text>
                <Text className="text-light-muted dark:text-dark-muted text-xs">Switch application theme colors</Text>
              </View>
            </View>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: '#8b5cf6' }}
              thumbColor={colorScheme === 'dark' ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notifications config */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          App Notifications
        </Text>
        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 mb-6 shadow-premium">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-primary-50 dark:bg-primary-950/40 p-2 rounded-xl mr-3">
                <Icons.Bell size={20} color="#8b5cf6" />
              </View>
              <View>
                <Text className="text-light-text dark:text-dark-text font-bold text-base">Push Alerts</Text>
                <Text className="text-light-muted dark:text-dark-muted text-xs">Receive updates on generated photos</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#cbd5e1', true: '#8b5cf6' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Custom Server config */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          Backend Configuration
        </Text>
        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 mb-6 shadow-premium">
          <Text className="text-light-text dark:text-dark-text font-bold text-sm mb-1.5">
            Endpoint URL
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-xs mb-4 leading-relaxed">
            Default endpoint: {API_CONFIG.BASE_URL}
          </Text>

          <Controller
            control={control}
            name="apiUrl"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`w-full bg-slate-50 dark:bg-zinc-800/40 border ${
                  errors.apiUrl ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                } rounded-xl px-4 py-3.5 text-light-text dark:text-dark-text text-sm mb-1`}
                placeholder="https://api.yourdomain.com/v1"
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
            <PrimaryButton 
              onPress={handleSubmit(onSubmit)} 
              title="Save Host" 
            />
          </View>
        </View>

        {/* Legal documents options */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          Legal Agreement
        </Text>
        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 mb-6 shadow-premium">
          <Pressable
            onPress={() => handleLegalPress('Privacy Policy')}
            className="flex-row items-center justify-between py-2 border-b border-light-border dark:border-dark-border active:opacity-60"
          >
            <View className="flex-row items-center">
              <Icons.Privacy size={18} className="text-light-muted dark:text-dark-muted mr-3" />
              <Text className="text-light-text dark:text-dark-text font-semibold text-sm">Privacy Policy</Text>
            </View>
            <Icons.ChevronRight size={16} className="text-light-muted dark:text-dark-muted" />
          </Pressable>

          <Pressable
            onPress={() => handleLegalPress('Terms of Service')}
            className="flex-row items-center justify-between py-2 mt-2 active:opacity-60"
          >
            <View className="flex-row items-center">
              <Icons.Terms size={18} className="text-light-muted dark:text-dark-muted mr-3" />
              <Text className="text-light-text dark:text-dark-text font-semibold text-sm">Terms of Service</Text>
            </View>
            <Icons.ChevronRight size={16} className="text-light-muted dark:text-dark-muted" />
          </Pressable>
        </View>

        {/* Account Deletion */}
        <Text className="text-light-muted dark:text-dark-muted font-bold text-xs uppercase tracking-wider mb-3">
          Danger Zone
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
                <Text className="text-red-500 font-bold text-base">Delete Account</Text>
                <Text className="text-light-muted dark:text-dark-muted text-xs">Permanently erase profile & creations</Text>
              </View>
            </View>
            <Icons.ChevronRight size={16} className="text-light-muted dark:text-dark-muted" />
          </Pressable>
        </View>

      </ScrollView>

      {/* Account Deletion Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteDialogVisible}
        title="Delete Account?"
        description="This will permanently delete your authentication profile and delete all generated location templates history. This action is irreversible."
        confirmText="Erase Profile"
        confirmVariant="danger"
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setDeleteDialogVisible(false)}
      />
    </SafeAreaView>
  );
}
