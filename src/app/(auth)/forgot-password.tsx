import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { TextField } from '../../components/forms/TextField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { Toast } from '../../components/common/Toast';
import { Icons } from '../../theme';
import { t } from '../../utils/i18n';


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
    <SafeAreaView className="flex-1 bg-light-bg dark:bg-dark-bg">
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
            <Icons.Warning size={32} color="#ffffff" />
          </View>
          <Text className="text-light-text dark:text-dark-text text-3xl font-black tracking-tight mb-1 text-center">
            {t('auth.forgotPassword.title')}
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-sm text-center">
            {t('auth.forgotPassword.subtitle')}
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 rounded-3xl shadow-premium mb-8">
          <TextField
            name="email"
            control={control}
            label={t('auth.forgotPassword.emailLabel')}
            placeholder={t('auth.forgotPassword.emailPlaceholder')}
            keyboardType="email-address"
            error={errors.email?.message}
            leftIcon={<Icons.Mail size={18} className="text-light-muted dark:text-dark-muted" />}
          />

          <View className="mt-4">
            <LoadingButton
              onPress={handleSubmit(onSubmit)}
              title={t('auth.forgotPassword.requestButton')}
              loading={loading}
              loadingTitle={t('auth.forgotPassword.requesting')}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
