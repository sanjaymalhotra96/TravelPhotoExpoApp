import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore, setPendingRecovery } from '@/store/authStore';
import { Toast } from '@/components/common/Toast';
import { useTheme } from '@/hooks/useTheme';
import { Icons } from '@/theme';
import { t } from '@/utils/i18n';

// Password recovery schema with strength validation
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, t('auth.resetPassword.validation.min8'))
      .regex(/[a-z]/, t('auth.resetPassword.validation.lowercase'))
      .regex(/[A-Z]/, t('auth.resetPassword.validation.uppercase'))
      .regex(/[0-9]/, t('auth.resetPassword.validation.number'))
      .regex(/[^a-zA-Z0-9]/, t('auth.resetPassword.validation.special')),
    confirmPassword: z.string().min(1, t('auth.resetPassword.validation.confirm')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordMatch'),
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Clear pendingRecovery if user leaves this screen without completing the reset.
  // This prevents the flag from staying true and blocking future normal logins.
  useEffect(() => {
    return () => {
      setPendingRecovery(false);
    };
  }, []);

  // Guard against unauthorized direct access.
  // Instead of querying Supabase for an active session (which fails due to PKCE code exchange race conditions),
  // we rely on our authStore's `isRecoveringPassword` state which is set immediately when the deep link is detected.
  useEffect(() => {
    const checkRecoveryState = () => {
      const isRecovering = useAuthStore.getState().isRecoveringPassword;
      if (!isRecovering) {
        console.warn('[ResetPassword] Not in recovery mode. Redirecting to forgot-password...');
        setPendingRecovery(false);
        showToast(t('auth.resetPassword.sessionErrorToast'), 'error');
        setTimeout(() => {
          router.replace('/(auth)/forgot-password');
        }, 1500);
      }
    };
    
    // Give it a tiny delay to ensure zustand state propagates from _layout.tsx
    setTimeout(checkRecoveryState, 500);
  }, []);

  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Live password strength checks
  const strengthChecks = [
    { label: t('auth.resetPassword.reqLength'), met: passwordValue.length >= 8 },
    { label: t('auth.resetPassword.reqUppercase'), met: /[A-Z]/.test(passwordValue) },
    { label: t('auth.resetPassword.reqLowercase'), met: /[a-z]/.test(passwordValue) },
    { label: t('auth.resetPassword.reqNumber'), met: /[0-9]/.test(passwordValue) },
    { label: t('auth.resetPassword.reqSpecial'), met: /[^a-zA-Z0-9]/.test(passwordValue) },
  ];

  const onSubmit = async (data: ResetPasswordValues) => {
    setLoading(true);
    try {
      console.log('[ResetPassword] Attempting to update user password on Supabase...');
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      showToast(t('auth.resetPassword.successToast'), 'success');

      // Clear all recovery state BEFORE logout so the SIGNED_OUT event
      // is not accidentally treated as a new recovery event.
      console.log('[ResetPassword] Clearing recovery flags and signing out...');
      setPendingRecovery(false);
      useAuthStore.getState().setRecoveringPassword(false);
      await useAuthStore.getState().logout();

      // Navigate back to the Login screen
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (e: any) {
      console.error('[ResetPassword] Password update failed:', e);
      showToast(e?.message || t('auth.resetPassword.errorToast'), 'error');
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-6 justify-center"
      >
        <View className="items-center mb-6">
          <View className="bg-primary-500 rounded-2xl p-4 mb-4 shadow-premium">
            <Icons.Lock size={32} color="#ffffff" />
          </View>
          <Text className="text-light-text dark:text-dark-text text-3xl font-black tracking-tight mb-1 text-center">
            {t('auth.resetPassword.title')}
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-sm text-center px-4">
            {t('auth.resetPassword.subtitle')}
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 rounded-3xl shadow-premium mb-6">
          {/* Password Field */}
          <View className="w-full mb-4.5">
            <Text className="text-light-text dark:text-dark-text font-bold text-sm mb-1.5">
              {t('auth.resetPassword.newPasswordLabel')}
            </Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="relative flex-row items-center w-full">
                  <View className="absolute left-4 z-10">
                    <Icons.Lock size={18} className="text-light-muted dark:text-dark-muted" />
                  </View>
                  <TextInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ''}
                    secureTextEntry={!showPassword}
                    className={`w-full bg-white dark:bg-dark-card border ${
                      errors.password ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                    } rounded-xl py-3.5 pr-12 pl-11 text-light-text dark:text-dark-text text-sm shadow-sm`}
                    placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-4 p-1 active:opacity-60"
                  >
                    {showPassword ? (
                      <Icons.EyeOff size={18} className="text-light-muted dark:text-dark-muted" />
                    ) : (
                      <Icons.Eye size={18} className="text-light-muted dark:text-dark-muted" />
                    )}
                  </Pressable>
                </View>
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-xs mt-1.5 font-semibold">
                {errors.password.message}
              </Text>
            )}
          </View>

          {/* Password strength checklist */}
          <View className="mb-5 px-1">
            <Text className="text-light-text dark:text-dark-text font-bold text-xs mb-2">
              {t('auth.resetPassword.requirementsTitle')}
            </Text>
            {strengthChecks.map((check, idx) => (
              <View key={idx} className="flex-row items-center mb-1">
                <View className={`w-1.5 h-1.5 rounded-full mr-2 ${check.met ? 'bg-green-500' : 'bg-slate-300 dark:bg-zinc-700'}`} />
                <Text className={`text-xs ${check.met ? 'text-green-600 dark:text-green-400 font-medium' : 'text-light-muted dark:text-dark-muted'}`}>
                  {check.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Confirm Password Field */}
          <View className="w-full mb-4.5">
            <Text className="text-light-text dark:text-dark-text font-bold text-sm mb-1.5">
              {t('auth.resetPassword.confirmPasswordLabel')}
            </Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="relative flex-row items-center w-full">
                  <View className="absolute left-4 z-10">
                    <Icons.Privacy size={18} className="text-light-muted dark:text-dark-muted" />
                  </View>
                  <TextInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ''}
                    secureTextEntry={!showConfirmPassword}
                    className={`w-full bg-white dark:bg-dark-card border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                    } rounded-xl py-3.5 pr-12 pl-11 text-light-text dark:text-dark-text text-sm shadow-sm`}
                    placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 p-1 active:opacity-60"
                  >
                    {showConfirmPassword ? (
                      <Icons.EyeOff size={18} className="text-light-muted dark:text-dark-muted" />
                    ) : (
                      <Icons.Eye size={18} className="text-light-muted dark:text-dark-muted" />
                    )}
                  </Pressable>
                </View>
              )}
            />
            {errors.confirmPassword && (
              <Text className="text-red-500 text-xs mt-1.5 font-semibold">
                {errors.confirmPassword.message}
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
                  <ActivityIndicator color="#ffffff" size="small" className="mr-2.5" />
                  <Text className="text-white text-base font-semibold text-center tracking-wide">
                    {t('auth.resetPassword.resetting')}
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-base font-bold text-center tracking-wide">
                  {t('auth.resetPassword.resetButton')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
