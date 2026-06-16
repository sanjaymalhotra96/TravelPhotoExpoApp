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

// Validation schema
const registerSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
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
      showToast(
        'Account created! Check your email to confirm your account, then log in.',
        'success'
      );
    } catch (e: any) {
      showToast(e?.message || 'Registration failed. Please try again.', 'error');
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
            Create Account
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-sm text-center">
            Sign up to unlock travel locations
          </Text>
        </View>

        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 rounded-3xl shadow-premium mb-8">
          <TextField
            name="email"
            control={control}
            label="Email Address"
            placeholder="example@domain.com"
            keyboardType="email-address"
            error={errors.email?.message}
            leftIcon={<Icons.Mail size={18} className="text-light-muted dark:text-dark-muted" />}
          />

          <PasswordField
            name="password"
            control={control}
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            leftIcon={<Icons.Lock size={18} className="text-light-muted dark:text-dark-muted" />}
          />

          <PasswordField
            name="confirmPassword"
            control={control}
            label="Confirm Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            leftIcon={<Icons.Lock size={18} className="text-light-muted dark:text-dark-muted" />}
          />

          <View className="mt-4">
            <LoadingButton
              onPress={handleSubmit(onSubmit)}
              title="Sign Up"
              loading={isPending}
              loadingTitle="Creating account..."
            />
          </View>
        </View>

        {/* Login Link */}
        <View className="flex-row justify-center items-center pb-8">
          <Text className="text-light-muted dark:text-dark-muted text-sm mr-1.5">
            Already have an account?
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable className="active:opacity-50">
              <Text className="text-primary-500 dark:text-primary-400 font-bold text-sm">
                Log In
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
