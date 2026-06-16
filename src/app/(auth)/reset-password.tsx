import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { PasswordField } from '../../components/forms/PasswordField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { Toast } from '../../components/common/Toast';
import { Icons } from '../../theme';

// Password recovery schema with strength validation
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

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

  useEffect(() => {
    const verifySession = async () => {
      const { data } = await supabase.auth.getSession();
      console.log('[ResetPassword] Active session details on mount:', {
        hasSession: !!data?.session,
        userEmail: data?.session?.user?.email,
        expiresAt: data?.session?.expires_at,
      });

      if (!data?.session) {
        console.warn('[ResetPassword] Session missing on mount. Redirecting to forgot-password...');
        useAuthStore.getState().setRecoveringPassword(false);
        showToast('No active recovery session found. Please request a new link.', 'error');
        setTimeout(() => {
          router.replace('/(auth)/forgot-password');
        }, 3000);
      }
    };

    verifySession();
  }, []);

  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Live password strength checks
  const strengthChecks = [
    { label: 'At least 8 characters', met: passwordValue.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(passwordValue) },
    { label: 'One lowercase letter', met: /[a-z]/.test(passwordValue) },
    { label: 'One number', met: /[0-9]/.test(passwordValue) },
    { label: 'One special character', met: /[^a-zA-Z0-9]/.test(passwordValue) },
  ];

  const onSubmit = async (data: ResetPasswordValues) => {
    setLoading(true);
    try {
      console.log('[ResetPassword] Attempting to update user password on Supabase...');
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      showToast('Password updated successfully! Redirecting to login...', 'success');

      // Clear the temporary recovery session and status from the store
      console.log('[ResetPassword] Logging out and resetting recovery flag...');
      useAuthStore.getState().setRecoveringPassword(false);
      await useAuthStore.getState().logout();

      // Navigate back to the Login screen
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (e: any) {
      console.error('[ResetPassword] Password update failed:', e);
      showToast(e?.message || 'Failed to update password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-bg dark:bg-dark-bg">
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
            Create New Password
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-sm text-center px-4">
            Please enter your new password below. Ensure it meets the security strength requirements.
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 rounded-3xl shadow-premium mb-6">
          <PasswordField
            name="password"
            control={control}
            label="New Password"
            placeholder="••••••••"
            error={errors.password?.message}
            leftIcon={<Icons.Lock size={18} className="text-light-muted dark:text-dark-muted" />}
          />

          {/* Password strength checklist */}
          <View className="mb-5 px-1">
            <Text className="text-light-text dark:text-dark-text font-bold text-xs mb-2">
              Password Requirements:
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

          <PasswordField
            name="confirmPassword"
            control={control}
            label="Confirm Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            leftIcon={<Icons.Privacy size={18} className="text-light-muted dark:text-dark-muted" />}
          />

          <View className="mt-4">
            <LoadingButton
              onPress={handleSubmit(onSubmit)}
              title="Reset Password"
              loading={loading}
              loadingTitle="Updating..."
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
