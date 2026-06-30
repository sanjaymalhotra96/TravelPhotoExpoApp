import React, { useState } from 'react'; // refreshed
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'expo-router';
import { useRegister } from '@/hooks/useRegister';
import { useLogin } from '@/hooks/useLogin';
import { Toast } from '@/components/common/Toast';
import { useTheme } from '@/hooks/useTheme';
import { Icons } from '@/theme';
import { t } from '@/utils/i18n';

// Validation schema
const registerSchema = z
  .object({
    email: z.string().email(t('auth.validation.email')),
    password: z.string().min(6, t('auth.validation.password')),
    confirmPassword: z.string().min(6, t('auth.validation.confirmPasswordRequired')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordMatch'),
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { mutateAsync: registerUser, isPending } = useRegister();
  const { mutateAsync: loginUser } = useLogin();
  const { colors } = useTheme();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser({ email: data.email, password: data.password });
      showToast(t('auth.register.successToast'), 'success');
    } catch (e: any) {
      showToast(e?.message || t('auth.register.errorToast'), 'error');
    }
  };

  const handleOAuthSignUp = async (provider: 'google' | 'apple') => {
    try {
      await loginUser({ email: '', provider });
      showToast(provider === 'google' ? t('auth.login.googleSuccessToast') : t('auth.login.appleSuccessToast'), 'success');
    } catch (e: any) {
      showToast(t('auth.register.oauthFailure', { error: e?.message || '' }), 'error');
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
        <View className="items-center mb-8">
          <View className="bg-primary-500 rounded-2xl p-4 mb-4 shadow-premium">
            <Icons.Sparkles size={32} color="#ffffff" />
          </View>
          <Text className="text-light-text dark:text-dark-text text-3xl font-black tracking-tight mb-1 text-center">
            {t('auth.register.title')}
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-sm text-center">
            {t('auth.register.subtitle')}
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 rounded-3xl shadow-premium mb-6">
          {/* Email Field */}
          <View className="w-full mb-4.5">
            <Text className="text-light-text dark:text-dark-text font-bold text-sm mb-1.5">
              {t('auth.register.emailLabel')}
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
                    placeholder={t('auth.register.emailPlaceholder')}
                    placeholderTextColor="#94a3b8"
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

          {/* Password Field */}
          <View className="w-full mb-4.5">
            <Text className="text-light-text dark:text-dark-text font-bold text-sm mb-1.5">
              {t('auth.register.passwordLabel')}
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
                    placeholder={t('auth.register.passwordPlaceholder')}
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

          {/* Confirm Password Field */}
          <View className="w-full mb-4.5">
            <Text className="text-light-text dark:text-dark-text font-bold text-sm mb-1.5">
              {t('auth.register.confirmPasswordLabel')}
            </Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="relative flex-row items-center w-full">
                  <View className="absolute left-4 z-10">
                    <Icons.Lock size={18} className="text-light-muted dark:text-dark-muted" />
                  </View>
                  <TextInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ''}
                    secureTextEntry={!showConfirmPassword}
                    className={`w-full bg-white dark:bg-dark-card border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-light-border dark:border-dark-border'
                    } rounded-xl py-3.5 pr-12 pl-11 text-light-text dark:text-dark-text text-sm shadow-sm`}
                    placeholder={t('auth.register.passwordPlaceholder')}
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
              disabled={isPending}
              className={`w-full flex-row items-center justify-center py-4 px-6 rounded-2xl ${
                isPending ? 'bg-slate-200 dark:bg-zinc-800 opacity-60' : 'bg-primary-500 active:bg-primary-600'
              } shadow-premium`}
            >
              {isPending ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="#ffffff" size="small" className="mr-2.5" />
                  <Text className="text-white text-base font-semibold text-center tracking-wide">
                    {t('auth.register.registering')}
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-base font-bold text-center tracking-wide">
                  {t('auth.register.registerButton')}
                </Text>
              )}
            </Pressable>
          </View>
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
            onPress={() => handleOAuthSignUp('google')}
            className={`flex-row items-center justify-center bg-white dark:bg-dark-card border border-light-border dark:border-dark-border py-3.5 rounded-2xl active:bg-slate-50 dark:active:bg-zinc-800 shadow-sm ${
              Platform.OS === 'ios' ? 'w-[47%]' : 'w-full'
            }`}
          >
            <Icons.User size={18} color="#ea4335" className="mr-2" />
            <Text className="text-light-text dark:text-dark-text font-bold text-sm">{t('auth.login.googleButton')}</Text>
          </Pressable>

          {Platform.OS === 'ios' && (
            <Pressable
              onPress={() => handleOAuthSignUp('apple')}
              className="flex-row items-center justify-center bg-white dark:bg-dark-card border border-light-border dark:border-dark-border w-[47%] py-3.5 rounded-2xl active:bg-slate-50 dark:active:bg-zinc-800 shadow-sm"
            >
              <Icons.User size={18} className="text-light-text dark:text-dark-text mr-2" />
              <Text className="text-light-text dark:text-dark-text font-bold text-sm">{t('auth.login.appleButton')}</Text>
            </Pressable>
          )}
        </View>

        {/* Login Link */}
        <View className="flex-row justify-center items-center pb-8">
          <Text className="text-light-muted dark:text-dark-muted text-sm mr-1.5">
            {t('auth.register.hasAccount')}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable className="active:opacity-50">
              <Text className="text-primary-500 dark:text-primary-400 font-bold text-sm">
                {t('auth.register.loginLink')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}
