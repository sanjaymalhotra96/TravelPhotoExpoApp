import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icons } from '../../theme';

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightAction,
}) => {
  return (
    <View className="w-full flex-row items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border bg-white dark:bg-dark-card">
      <View className="flex-row items-center flex-1">
        {showBackButton && (
          <Pressable
            onPress={onBackPress}
            className="mr-4 p-1 rounded-full active:bg-slate-100 dark:active:bg-zinc-800"
          >
            <Icons.Back size={24} className="text-light-text dark:text-dark-text" />
          </Pressable>
        )}
        
        <Text className="text-light-text dark:text-dark-text text-xl font-bold tracking-tight" numberOfLines={1}>
          {title}
        </Text>
      </View>

      {rightAction && <View className="ml-4">{rightAction}</View>}
    </View>
  );
};
