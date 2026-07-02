import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { dashboardRepository } from '@/features/dashboard/services/dashboardRepository';
import { ScreenHeader } from '@/shared/components/common/ScreenHeader';
import { ImagePreview } from '@/shared/components/common/ImagePreview';
import { ImageSourceDialog } from '@/features/dashboard/components/ImageSourceDialog';
import { ImagePickerHelper, SelectedImage } from '@/utils/imagePicker';
import { FullScreenLoader } from '@/shared/components/loaders/FullScreenLoader';
import { COLORS, Icons } from '@/theme';
import { t } from '@/utils/i18n';

export default function GenerateSelectScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();

  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  // Retrieve template context info
  const { data: template, isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => dashboardRepository.getTemplateById(templateId),
  });

  const handleSelectCamera = async () => {
    console.log('[GenerateSelectScreen] Launching camera...');
    const result = await ImagePickerHelper.takePhoto();
    console.log('[GenerateSelectScreen] Camera result:', result);
    if (result) {
      setSelectedImage(result);
    }
  };

  const handleSelectGallery = async () => {
    console.log('[GenerateSelectScreen] Launching image gallery...');
    const result = await ImagePickerHelper.selectFromGallery();
    console.log('[GenerateSelectScreen] Gallery result:', result);
    if (result) {
      setSelectedImage(result);
    }
  };

  const handleContinue = () => {
    if (!selectedImage) return;

    router.push({
      pathname: '/generate/polling',
      params: {
        templateId,
        userImageUri: selectedImage.uri,
      },
    });
  };

  const handleClear = () => {
    console.log('[GenerateSelectScreen] Clearing selected image');
    setSelectedImage(null);
  };

  if (isLoading) {
    return <FullScreenLoader message={t('generate.loadingSpecs')} />;
  }

  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg">
      <ScreenHeader title={t('generate.setupTitle')} showBackButton onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-5 pt-6">
        <View className="mb-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-4 rounded-2xl flex-row items-center">
          <View className="bg-primary-100 dark:bg-primary-950/40 p-2.5 rounded-full mr-3.5">
            <Icons.Sparkles size={20} color={COLORS.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-light-muted dark:text-dark-muted text-xs">{t('generate.targetTemplate')}</Text>
            <Text className="text-light-text dark:text-dark-text font-bold text-base">{template?.name}</Text>
          </View>
        </View>

        <View className="flex-1 justify-center items-center py-6">
          {selectedImage ? (
            <ImagePreview uri={selectedImage.uri} onClear={handleClear} />
          ) : (
            <Pressable
              onPress={() => setDialogVisible(true)}
              className="w-full aspect-square border-2 border-dashed border-primary-300 dark:border-zinc-700 bg-white dark:bg-dark-card rounded-3xl items-center justify-center p-6 active:bg-slate-50 dark:active:bg-zinc-800 shadow-sm"
            >
              <View className="bg-primary-50 dark:bg-primary-950/30 p-5 rounded-full mb-4">
                <Icons.Camera size={40} color={COLORS.primary} />
              </View>
              <Text className="text-light-text dark:text-dark-text font-bold text-lg mb-1.5 text-center">
                {t('generate.addPortraitTitle')}
              </Text>
              <Text className="text-light-muted dark:text-dark-muted text-sm text-center max-w-[70%]">
                {t('generate.addPortraitDesc')}
              </Text>
            </Pressable>
          )}
        </View>

        <View className="pb-8 mt-auto">
          <Pressable
            onPress={handleContinue}
            disabled={!selectedImage}
            className={`w-full flex-row items-center justify-center py-4 px-6 rounded-2xl ${
              !selectedImage ? 'bg-slate-200 dark:bg-zinc-800 opacity-60' : 'bg-primary-500 active:bg-primary-600'
            } shadow-premium`}
          >
            <View className="flex-row items-center justify-center">
              <View className="mr-2.5">
                <Icons.Sparkles size={18} color={COLORS.white} />
              </View>
              <Text className="text-white text-base font-semibold text-center tracking-wide">
                {t('generate.continueBtn')}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <ImageSourceDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        onSelectCamera={handleSelectCamera}
        onSelectGallery={handleSelectGallery}
      />
    </View>
  );
}
