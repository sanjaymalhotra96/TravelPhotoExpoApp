import React, { useState } from 'react'; // refreshed
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'expo-router';
import { useLogin } from '../../hooks/useLogin';
import { TextField } from '../../components/forms/TextField';
import { PasswordField } from '../../components/forms/PasswordField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { Toast } from '../../components/common/Toast';
import { Icons } from '../../theme';
import { t } from '../../utils/i18n';

// Validation constraints
const loginSchema = z.object({
  email: z.string().email(t('auth.validation.email')),
  password: z.string().min(6, t('auth.validation.password')),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { mutateAsync: loginUser, isPending } = useLogin();
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await loginUser({ email: data.email, password: data.password });
      showToast(t('auth.login.successToast'), 'success');
      // Navigation will be automatically managed by Auth layout guards in root layout
    } catch (e: any) {
      showToast(e?.message || t('auth.login.errorToast'), 'error');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      await loginUser({ email: '', provider });
      showToast(provider === 'google' ? t('auth.login.googleSuccessToast') : t('auth.login.appleSuccessToast'), 'success');
    } catch (e: any) {
      showToast(`OAuth failure: ${e?.message}`, 'error');
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
        <View className="items-center mb-8">
          <View className="bg-primary-500 rounded-2xl p-4 mb-4 shadow-premium">
            <Icons.Sparkles size={32} color="#ffffff" />
          </View>
          <Text className="text-light-text dark:text-dark-text text-3xl font-black tracking-tight mb-1 text-center">
            {t('auth.login.title')}
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-sm text-center">
            {t('auth.login.subtitle')}
          </Text>
        </View>

        {/* Form Fields */}
        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 rounded-3xl shadow-premium mb-6">
          <TextField
            name="email"
            control={control}
            label={t('auth.login.emailLabel')}
            placeholder={t('auth.login.emailPlaceholder')}
            keyboardType="email-address"
            error={errors.email?.message}
            leftIcon={<Icons.Mail size={18} className="text-light-muted dark:text-dark-muted" />}
          />

          <PasswordField
            name="password"
            control={control}
            label={t('auth.login.passwordLabel')}
            placeholder={t('auth.login.passwordPlaceholder')}
            error={errors.password?.message}
            leftIcon={<Icons.Lock size={18} className="text-light-muted dark:text-dark-muted" />}
          />

          <View className="align-self-end items-end mb-5">
            <Link href="/(auth)/forgot-password" asChild>
              <Pressable className="active:opacity-50">
                <Text className="text-primary-500 dark:text-primary-400 font-semibold text-xs">
                  {t('auth.login.forgotPassword')}
                </Text>
              </Pressable>
            </Link>
          </View>

          <LoadingButton
            onPress={handleSubmit(onSubmit)}
            title={t('auth.login.loginButton')}
            loading={isPending}
            loadingTitle={t('auth.login.loggingIn')}
          />
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-[1px] bg-light-border dark:bg-dark-border" />
          <Text className="text-light-muted dark:text-dark-muted text-xs mx-4">{t('auth.login.dividerText')}</Text>
          <View className="flex-1 h-[1px] bg-light-border dark:bg-dark-border" />
        </View>

        {/* Social Logins */}
        <View className="flex-row justify-between mb-8">
          <Pressable
            onPress={() => handleOAuthLogin('google')}
            className="flex-row items-center justify-center bg-white dark:bg-dark-card border border-light-border dark:border-dark-border w-[47%] py-3.5 rounded-2xl active:bg-slate-50 dark:active:bg-zinc-800 shadow-sm"
          >
            <Icons.User size={18} color="#ea4335" className="mr-2" />
            <Text className="text-light-text dark:text-dark-text font-bold text-sm">{t('auth.login.googleButton')}</Text>
          </Pressable>

          <Pressable
            onPress={() => handleOAuthLogin('apple')}
            className="flex-row items-center justify-center bg-white dark:bg-dark-card border border-light-border dark:border-dark-border w-[47%] py-3.5 rounded-2xl active:bg-slate-50 dark:active:bg-zinc-800 shadow-sm"
          >
            <Icons.User size={18} className="text-light-text dark:text-dark-text mr-2" />
            <Text className="text-light-text dark:text-dark-text font-bold text-sm">{t('auth.login.appleButton')}</Text>
          </Pressable>
        </View>

        {/* Sign Up Link */}
        <View className="flex-row justify-center items-center pb-8">
          <Text className="text-light-muted dark:text-dark-muted text-sm mr-1.5">
            {t('auth.login.noAccount')}
          </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable className="active:opacity-50">
              <Text className="text-primary-500 dark:text-primary-400 font-bold text-sm">
                {t('auth.login.signUpLink')}
              </Text>
            </Pressable>
          </Link>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
