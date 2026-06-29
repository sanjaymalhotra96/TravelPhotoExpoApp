import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTemplates } from '@/hooks/useTemplates';
import { TravelTemplate } from '@/constants';
import { TemplateCard } from '@/components/cards/TemplateCard';
import { FullScreenLoader } from '@/components/loaders/FullScreenLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Icons } from '@/theme';
import { useTheme } from '@/hooks/useTheme';
import { t } from '@/utils/i18n';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: templates, isLoading, error, refetch } = useTemplates();

  const handleSelectTemplate = (templateId: string) => {
    router.push(`/generate/${templateId}`);
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  if (isLoading) {
    return <FullScreenLoader message={t('tabs.studio.loading')} />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg">
      {/* Custom Premium Header */}
      <View className="w-full flex-row items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border bg-white dark:bg-dark-card">
        <View className="flex-row items-center">
          <View className="bg-primary-500 rounded-full p-2 mr-3.5">
            <Icons.Sparkles size={18} color="#ffffff" />
          </View>
          <Text className="text-light-text dark:text-dark-text text-xl font-bold tracking-tight">
            {t('tabs.studio.title')}
          </Text>
        </View>

        <Pressable
          onPress={handleSettingsPress}
          className="p-2.5 rounded-full bg-slate-50 dark:bg-zinc-800/60 border border-light-border dark:border-dark-border active:bg-slate-100 dark:active:bg-zinc-700"
        >
          <Icons.Settings size={20} color={colors.text} />
        </Pressable>
      </View>

      <View className="flex-1 px-4 pt-4">
        {templates && templates.length > 0 ? (
          <FlashList<TravelTemplate>
            data={templates}
            keyExtractor={(item) => item.id}
            estimatedItemSize={280}
            renderItem={({ item }) => (
              <TemplateCard
                template={item}
                onPress={() => handleSelectTemplate(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListHeaderComponent={() => (
              <View className="mb-5">
                <Text className="text-light-text dark:text-dark-text text-2xl font-black tracking-tight mb-1">
                  {t('tabs.studio.chooseDestination')}
                </Text>
                <Text className="text-light-muted dark:text-dark-muted text-sm leading-relaxed">
                  {t('tabs.studio.subtitle')}
                </Text>
              </View>
            )}
          />
        ) : (
          <EmptyState />
        )}
      </View>
    </View>
  );
}
