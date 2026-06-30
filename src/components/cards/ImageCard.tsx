import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { HistoryItem } from '@/constants';
import { Icons } from '@/theme';
import { t } from '@/utils/i18n';

interface ImageCardProps {
  item: HistoryItem;
  onPress: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ item, onPress }) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl overflow-hidden mb-4 shadow-sm flex-row items-center p-3 active:bg-slate-50 dark:active:bg-zinc-800"
    >
      <Image
        source={{ uri: item.imageUrl }}
        className="w-16 h-20 rounded-xl"
        resizeMode="cover"
      />
      
      <View className="flex-1 ml-4 justify-center">
        <Text className="text-light-text dark:text-dark-text font-bold text-base mb-1" numberOfLines={1}>
          {item.templateName}
        </Text>
        <Text className="text-light-muted dark:text-dark-muted text-xs flex-row items-center">
          {t('common.generatedOn', { date: formatDate(item.created_at) })}
        </Text>
      </View>

      <View className="bg-slate-50 dark:bg-zinc-800 p-2.5 rounded-full border border-light-border dark:border-dark-border">
        <Icons.ChevronRight size={16} className="text-light-muted dark:text-dark-muted" />
      </View>
    </Pressable>
  );
};
