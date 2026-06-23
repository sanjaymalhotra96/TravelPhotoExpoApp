import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icons } from '@/theme';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-light-bg dark:bg-dark-bg">
      <View className="items-center max-w-[85%] bg-white dark:bg-dark-card border border-red-100 dark:border-red-950 p-6 rounded-3xl shadow-premium">
        <View className="bg-red-50 dark:bg-red-950/30 p-4 rounded-full mb-4">
          <Icons.Warning size={32} color="#ef4444" />
        </View>

        <Text className="text-light-text dark:text-dark-text font-bold text-lg mb-2 text-center">
          Something Went Wrong
        </Text>

        <Text className="text-light-muted dark:text-dark-muted text-sm text-center mb-6 leading-relaxed">
          {message}
        </Text>

        {onRetry && (
          <View className="w-full">
            <Pressable
              onPress={onRetry}
              className="w-full flex-row items-center justify-center py-4 px-6 rounded-2xl border border-primary-500 bg-transparent dark:border-primary-400 active:opacity-60"
            >
              <Text className="text-base font-semibold text-center tracking-wide text-primary-500 dark:text-primary-400">
                Try Again
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};
