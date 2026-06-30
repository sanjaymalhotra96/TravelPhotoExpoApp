import React from 'react';
import { View, Text } from 'react-native';
import { Icons, COLORS } from '@/theme';
import { t } from '@/utils/i18n';

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = t('common.emptyMessage'),
  icon,
}) => {

  return (
    <View className="flex-1 items-center justify-center p-6 bg-light-bg dark:bg-dark-bg">
      <View className="items-center max-w-[80%]">
        <View className="bg-primary-50 dark:bg-primary-950/30 p-5 rounded-full mb-4">
          {icon || <Icons.Info size={32} color={COLORS.primary} />}
        </View>
        
        <Text className="text-light-text dark:text-dark-text font-bold text-lg mb-2 text-center">
          {t('common.emptyTitle')}
        </Text>
        
        <Text className="text-light-muted dark:text-dark-muted text-sm text-center leading-relaxed">
          {message}
        </Text>
      </View>
    </View>
  );
};
