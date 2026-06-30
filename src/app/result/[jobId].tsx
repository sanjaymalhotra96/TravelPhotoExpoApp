import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { studioRepository } from '@/features/studio/services/studioRepository';
import { ScreenHeader } from '@/shared/components/common/ScreenHeader';
import { LoadingOverlay } from '@/shared/components/loaders/LoadingOverlay';
import { Icons, COLORS } from '@/theme';
import { t } from '@/utils/i18n';

export default function ResultScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { jobId, templateId, resultUrl, imageUri, templateUrl, isMock } =
    useLocalSearchParams<{
      jobId: string;
      templateId: string;
      resultUrl: string;   // AI-generated image URL (real) or user's photo URI (mock)
      imageUri: string;    // User's original uploaded photo (always)
      templateUrl: string; // Template background URL (for mock preview)
      isMock: string;      // 'true' | 'false'
    }>();

  const isMockMode = isMock !== 'false'; // default to mock-safe display

  // Decode navigation parameters to prevent double-encoding issues in file paths / URIs
  const decodedImageUri = imageUri ? decodeURIComponent(imageUri) : '';
  const decodedResultUrl = resultUrl ? decodeURIComponent(resultUrl) : '';
  const decodedTemplateUrl = templateUrl ? decodeURIComponent(templateUrl) : '';

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  console.log('[ResultScreen] Params received:', {
    jobId,
    templateId,
    resultUrl,
    imageUri,
    templateUrl,
    isMock,
    isMockMode,
    decodedImageUri,
    decodedResultUrl,
    decodedTemplateUrl,
  });

  // Fetch template metadata for label display
  const { data: template } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => studioRepository.getTemplateById(templateId || ''),
    enabled: !!templateId,
  });

  // The URL to display as the main result image
  // In real mode: resultUrl = the Replicate-generated composite image
  // In mock mode: templateUrl = travel scene background (with user face shown as overlay)
  const displayBackgroundUrl = isMockMode
    ? (decodedTemplateUrl || template?.coverUrl || decodedResultUrl)
    : decodedResultUrl;

  // Download a remote image URL to local cache
  const downloadToLocalCache = async (): Promise<string | null> => {
    try {
      const targetUrl = decodedResultUrl;
      if (!targetUrl) throw new Error('No result URL to download.');

      const filename = `travel_ai_photo_${jobId ?? Date.now()}.jpg`;
      const localUri = `${FileSystem.cacheDirectory}${filename}`;

      console.log('[ResultScreen] Downloading image to:', localUri);
      const result = await FileSystem.downloadAsync(targetUrl, localUri);
      return result.uri;
    } catch (e: any) {
      console.error('[ResultScreen] Download error:', e);
      Alert.alert(t('generate.resultDownloadError'), e?.message || t('generate.resultDownloadErrorDesc'));
      return null;
    }
  };

  const handleDownload = async () => {
    setLoadingMsg(t('generate.resultSaving'));
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const localUri = await downloadToLocalCache();
    setLoading(false);

    if (localUri) {
      Alert.alert(
        t('generate.resultSavedTitle'),
        t('generate.resultSavedDesc', { localUri }),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleShare = async () => {
    setLoadingMsg(t('generate.resultPreparingShare'));
    setLoading(true);

    const localUri = await downloadToLocalCache();
    setLoading(false);

    if (localUri) {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri);
      } else {
        Alert.alert(t('generate.resultShareError'), t('generate.resultShareErrorDesc'));
      }
    }
  };

  const handleGenerateAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    queryClient.clear();
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg">
      <ScreenHeader title={t('generate.resultHeader')} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1 px-5 pt-4"
      >
        <View className="flex-1">

          {/* ── Main Result Image Card ───────────────────────────────────── */}
          <View className="w-full aspect-[4/5] rounded-3xl overflow-hidden border border-light-border dark:border-dark-border relative shadow-lg bg-slate-100 dark:bg-zinc-900 mb-4">

            {/* Background: travel template (mock) or AI-generated composite (real) */}
            {displayBackgroundUrl ? (
              <Image
                source={{ uri: displayBackgroundUrl }}
                className="absolute inset-0 w-full h-full"
                resizeMode="cover"
              />
            ) : null}

            {/* ── MOCK MODE: Show uploaded user photo as face overlay ────── */}
            {isMockMode && decodedImageUri ? (
              <View className="absolute inset-0 items-center justify-center bg-slate-950/25">
                {/* Face circle overlay */}
                <View className="items-center bg-white/10 px-5 py-6 rounded-3xl border border-white/20 backdrop-blur-md shadow-2xl mx-6">
                  <View className="w-32 h-32 rounded-full border-4 border-primary-500 overflow-hidden shadow-premium mb-3 bg-slate-800">
                    <Image
                      source={{ uri: decodedImageUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                  <View className="bg-primary-600/90 px-4 py-1.5 rounded-full shadow-md mb-1">
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                      {t('generate.resultDemoBadge')}
                    </Text>
                  </View>
                  <Text className="text-white/70 text-[10px] text-center mt-1 leading-relaxed max-w-[200px]">
                    {t('generate.resultDemoDesc')}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* ── REAL MODE: Label showing AI composite ─────────────────── */}
            {!isMockMode ? (
              <View className="absolute top-4 right-4 bg-emerald-500/90 px-3 py-1.5 rounded-full shadow-md">
                <Text className="text-white text-[10px] font-black uppercase tracking-widest">
                  {t('generate.resultAiGenerated')}
                </Text>
              </View>
            ) : null}

            {/* Template name badge */}
            <View className="absolute bottom-4 left-4 right-4 bg-slate-900/80 p-4 rounded-2xl flex-row items-center border border-white/10">
              <View className="bg-primary-500 rounded-full p-2 mr-3">
                <Icons.Sparkles size={16} color={COLORS.white} />
              </View>
              <View className="flex-1">
                <Text className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">
                  {t('generate.resultTravelDestination')}
                </Text>
                <Text className="text-white text-sm font-bold">
                  {template?.name ?? t('generate.resultCustomScene')}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Info Strip ─────────────────────────────────────────────────── */}
          {isMockMode ? (
            <View className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 mb-4 flex-row items-start">
              <Icons.Warning size={16} color={COLORS.warning} style={{ marginTop: 1, marginRight: 8 }} />
              <View className="flex-1">
                <Text className="text-amber-700 dark:text-amber-400 font-bold text-xs mb-0.5">
                  {t('generate.resultDemoActiveTitle')}
                </Text>
                <Text className="text-amber-600 dark:text-amber-500 text-xs leading-relaxed">
                  {t('generate.resultDemoActiveDesc')}
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3 mb-4 flex-row items-center">
              <Icons.Check size={16} color={COLORS.success} style={{ marginRight: 8 }} />
              <Text className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex-1">
                {t('generate.resultRealAiSuccess')}
              </Text>
            </View>
          )}

          {/* ── Action Buttons ──────────────────────────────────────────────── */}
          <View className="pb-8 mt-auto">
            <View className="flex-row justify-between mb-4">
              <View className="w-[48%]">
                <Pressable
                  onPress={handleDownload}
                  className="w-full flex-row items-center justify-center py-4 px-6 rounded-2xl border border-primary-500 bg-transparent dark:border-primary-400 active:opacity-60"
                >
                  <View className="flex-row items-center justify-center">
                    <View className="mr-2.5">
                      <Icons.Download size={18} className="text-primary-500 dark:text-primary-400" />
                    </View>
                    <Text className="text-base font-semibold text-center tracking-wide text-primary-500 dark:text-primary-400">
                      {t('generate.resultSaveBtn')}
                    </Text>
                  </View>
                </Pressable>
              </View>
              <View className="w-[48%]">
                <Pressable
                  onPress={handleShare}
                  className="w-full flex-row items-center justify-center py-4 px-6 rounded-2xl border border-primary-500 bg-transparent dark:border-primary-400 active:opacity-60"
                >
                  <View className="flex-row items-center justify-center">
                    <View className="mr-2.5">
                      <Icons.Share size={18} className="text-primary-500 dark:text-primary-400" />
                    </View>
                    <Text className="text-base font-semibold text-center tracking-wide text-primary-500 dark:text-primary-400">
                      {t('generate.resultShareBtn')}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleGenerateAgain}
              className="w-full flex-row items-center justify-center py-4 px-6 rounded-2xl bg-primary-500 active:bg-primary-600 shadow-premium"
            >
              <View className="flex-row items-center justify-center">
                <View className="mr-2.5">
                  <Icons.Refresh size={18} color={COLORS.white} />
                </View>
                <Text className="text-white text-base font-bold text-center tracking-wide">
                  {t('generate.resultGenerateAgainBtn')}
                </Text>
              </View>
            </Pressable>
          </View>

        </View>
      </ScrollView>

      <LoadingOverlay visible={loading} message={loadingMsg} />
    </View>
  );
}
