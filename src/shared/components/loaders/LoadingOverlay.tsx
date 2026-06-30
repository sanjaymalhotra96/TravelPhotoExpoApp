import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '@/theme';
import { t } from '@/utils/i18n';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message = t('common.processing') }) => {

  if (!visible) return null;

  return (
    <View className="absolute inset-0 bg-slate-900/60 z-[99] items-center justify-center flex-1">
      <View className="bg-white dark:bg-dark-card py-6 px-8 rounded-2xl items-center shadow-lg border border-light-border dark:border-dark-border max-w-[80%]">
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text className="text-light-text dark:text-dark-text font-semibold text-base mt-4 text-center">
          {message}
        </Text>
      </View>
    </View>
  );
};
