import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTemplates } from '@/features/dashboard/hooks/useTemplates';
import { TravelTemplate } from '@/constants';
import { TemplateCard } from '@/features/dashboard/components/TemplateCard';
import { FullScreenLoader } from '@/shared/components/loaders/FullScreenLoader';
import { ErrorState } from '@/shared/components/common/ErrorState';
import { EmptyState } from '@/shared/components/common/EmptyState';
import { COLORS, Icons } from '@/theme';
import { t } from '@/utils/i18n';

export default function DashboardScreen() {
  const router = useRouter();
  const { data: templates, isLoading, error, refetch } = useTemplates();
  const [buttonLayout, setButtonLayout] = useState<{ width: number; height: number } | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    router.push(`/generate/${templateId}`);
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  const handleGetProPress = () => {
    router.push('/paywall');
  };

  if (isLoading) {
    return <FullScreenLoader message={t('tabs.dashboard.loading')} />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  return (
    <View className="flex-1 bg-premiumBg">
      {/* Custom Premium Header */}
      <View className="w-full flex-row items-center justify-end px-6 py-4 bg-premiumBg gap-3">
        <Pressable
          onPress={handleGetProPress}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setButtonLayout({ width, height });
          }}
          style={{
            shadowColor: COLORS.gradientShadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
          }}
          className="rounded-full px-5 py-2.5 active:opacity-90"
        >
          {buttonLayout && (
            <View className="absolute inset-0 z-[-1] rounded-full overflow-hidden">
              <Svg height={buttonLayout.height} width={buttonLayout.width}>
                <Defs>
                  <SvgLinearGradient id="getProGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={COLORS.gradientStart} />
                    <Stop offset="100%" stopColor={COLORS.gradientEnd} />
                  </SvgLinearGradient>
                </Defs>
                <Rect x={0} y={0} width={buttonLayout.width} height={buttonLayout.height} fill="url(#getProGrad)" />
              </Svg>
            </View>
          )}
          <Text className="text-premiumBg text-sm font-bold tracking-tight">
            {t('common.getPro')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSettingsPress}
          className="w-10 h-10 rounded-full bg-premiumCard items-center justify-center active:opacity-90"
        >
          <Icons.User size={20} color={COLORS.white} />
        </Pressable>
      </View>

      <View className="flex-1 px-6 pt-2">
        {templates && templates.length > 0 ? (
          <FlashList<TravelTemplate>
            data={templates}
            keyExtractor={(item) => item.id}
            estimatedItemSize={340}
            renderItem={({ item }) => (
              <TemplateCard
                template={item}
                onPress={() => handleSelectTemplate(item.id)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        ) : (
          <EmptyState />
        )}
      </View>
    </View>
  );
}
