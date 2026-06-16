import React, { useState } from 'react'; // refreshed
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'expo-router';
import { useRegister } from '../../hooks/useRegister';
import { TextField } from '../../components/forms/TextField';
import { PasswordField } from '../../components/forms/PasswordField';
import { LoadingButton } from '../../components/ui/LoadingButton';
import { Toast } from '../../components/common/Toast';
import { Icons } from '../../theme';
import { t } from '../../utils/i18n';

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

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

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
            {t('auth.register.title')}
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-sm text-center">
            {t('auth.register.subtitle')}
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 rounded-3xl shadow-premium mb-8">
          <TextField
            name="email"
            control={control}
            label={t('auth.register.emailLabel')}
            placeholder={t('auth.register.emailPlaceholder')}
            keyboardType="email-address"
            error={errors.email?.message}
            leftIcon={<Icons.Mail size={18} className="text-light-muted dark:text-dark-muted" />}
          />

          <PasswordField
            name="password"
            control={control}
            label={t('auth.register.passwordLabel')}
            placeholder={t('auth.register.passwordPlaceholder')}
            error={errors.password?.message}
            leftIcon={<Icons.Lock size={18} className="text-light-muted dark:text-dark-muted" />}
          />

          <PasswordField
            name="confirmPassword"
            control={control}
            label={t('auth.register.confirmPasswordLabel')}
            placeholder={t('auth.register.passwordPlaceholder')}
            error={errors.confirmPassword?.message}
            leftIcon={<Icons.Lock size={18} className="text-light-muted dark:text-dark-muted" />}
          />

          <View className="mt-4">
            <LoadingButton
              onPress={handleSubmit(onSubmit)}
              title={t('auth.register.registerButton')}
              loading={isPending}
              loadingTitle={t('auth.register.registering')}
            />
          </View>
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
    </SafeAreaView>
  );
}
