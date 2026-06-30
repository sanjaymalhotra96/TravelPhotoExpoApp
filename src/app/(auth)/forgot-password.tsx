import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Toast } from '@/shared/components/common/Toast';
import { COLORS, Icons } from '@/theme';
import { t } from '@/utils/i18n';


const forgotPasswordSchema = z.object({
  email: z.string().email(t('auth.validation.email')),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const onSubmit = async (data: ForgotPasswordValues) => {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL('/reset-password');
      console.log('═══════════════════════════════════════════');
      console.log('🔑 Supabase Password Recovery Redirect URL');
      console.log(`👉 Using dynamically generated URL:`);
      console.log(`   ${redirectTo}`);
      console.log('═══════════════════════════════════════════');
      // Clear explicitlyLoggedOut flag so that if a user recovery deep link is triggered,
      // the store does not filter out the returned session.
      useAuthStore.getState().clearExplicitLogout();

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo,
      });
      if (error) throw error;
      showToast(t('auth.forgotPassword.successToast'), 'success');
    } catch (e: any) {
      showToast(e?.message || t('auth.forgotPassword.errorToast'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg">
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <View className="flex-1 px-6 justify-center">
        <View className="mb-6">
          <Link href="/(auth)/login" asChild>
            <Pressable className="flex-row items-center active:opacity-50 self-start">
              <Icons.Back size={18} className="text-primary-500 dark:text-primary-400 mr-2" />
              <Text className="text-primary-500 dark:text-primary-400 font-bold text-sm">{t('auth.forgotPassword.backToLogin')}</Text>
            </Pressable>
          </Link>
        </View>

        <View className="items-center mb-8">
          <View className="bg-primary-500 rounded-2xl p-4 mb-4 shadow-premium">
            <Icons.Warning size={32} color={COLORS.white} />
          </View>
          <Text className="text-light-text dark:text-dark-text text-3xl font-black tracking-tight mb-1 text-center">
            {t('auth.forgotPassword.title')}
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-sm text-center">
            {t('auth.forgotPassword.subtitle')}
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 rounded-3xl shadow-premium mb-8">
          {/* Email Field */}
          <View className="w-full mb-4.5">
            <Text className="text-light-text dark:text-dark-text font-bold text-sm mb-1.5">
              {t('auth.forgotPassword.emailLabel')}
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="relative flex-row items-center w-full">
                  <View className="absolute left-4 z-10">
                    <Icons.Mail size={18} className="text-light-muted dark:text-dark-muted" />
                  </View>
                  <TextInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ''}
                    keyboardType="email-address"
                    className={`w-full bg-white dark:bg-dark-card border ${
                      errors.email ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                    } rounded-xl py-3.5 pr-4 pl-11 text-light-text dark:text-dark-text text-sm shadow-sm`}
                    placeholder={t('auth.forgotPassword.emailPlaceholder')}
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1.5 font-semibold">
                {errors.email.message}
              </Text>
            )}
          </View>

          <View className="mt-4">
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              className={`w-full flex-row items-center justify-center py-4 px-6 rounded-2xl ${
                loading ? 'bg-slate-200 dark:bg-zinc-800 opacity-60' : 'bg-primary-500 active:bg-primary-600'
              } shadow-premium`}
            >
              {loading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color={COLORS.white} size="small" className="mr-2.5" />
                  <Text className="text-white text-base font-semibold text-center tracking-wide">
                    {t('auth.forgotPassword.requesting')}
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-base font-bold text-center tracking-wide">
                  {t('auth.forgotPassword.requestButton')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
