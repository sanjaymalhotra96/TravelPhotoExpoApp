import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '@/theme';
import { t } from '@/utils/i18n';

interface FullScreenLoaderProps {
  message?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ message = t('common.loadingDetails') }) => {

  return (
    <View className="flex-1 items-center justify-center bg-light-bg dark:bg-dark-bg p-6">
      <View className="items-center">
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text className="text-light-muted dark:text-dark-muted font-medium text-base mt-4 text-center">
          {message}
        </Text>
      </View>
    </View>
  );
};
