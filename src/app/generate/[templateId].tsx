import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { templatesApi } from '../../api/templates';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { ImagePreview } from '../../components/common/ImagePreview';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ImageSourceDialog } from '../../components/dialogs/ImageSourceDialog';
import { ImagePickerHelper, SelectedImage } from '../../utils/imagePicker';
import { FullScreenLoader } from '../../components/loaders/FullScreenLoader';
import { Icons } from '../../theme';
import { setGenerationParams } from '../../store/generationStore';

export default function GenerateSelectScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();

  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  // Retrieve template context info
  const { data: template, isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => templatesApi.getTemplateById(templateId),
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
    console.log('[GenerateSelectScreen] Continue pressed. templateId:', templateId, 'selectedImage:', selectedImage);
    if (selectedImage && templateId) {
      // Store imageUri in module memory — NOT in navigation params.
      // ImagePicker URIs contain slashes that Expo Router misparses as route segments.
      console.log('[GenerateSelectScreen] Storing generation params in memory store:', { imageUri: selectedImage.uri, templateId });
      setGenerationParams({ imageUri: selectedImage.uri, templateId });

      console.log('[GenerateSelectScreen] Navigating to polling screen...');
      router.push({
        pathname: '/generate/polling',
        params: { templateId }, // only safe string, no file path
      });
    } else {
      console.warn('[GenerateSelectScreen] Cannot continue: missing image or templateId');
    }
  };

  const handleClear = () => {
    console.log('[GenerateSelectScreen] Clearing selected image');
    setSelectedImage(null);
  };

  if (isLoading) {
    return <FullScreenLoader message="Loading target template specs..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-light-bg dark:bg-dark-bg">
      <ScreenHeader title="AI Generation Setup" showBackButton onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1 px-5 pt-6">
        <View className="mb-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-4 rounded-2xl flex-row items-center">
          <View className="bg-primary-100 dark:bg-primary-950/40 p-2.5 rounded-full mr-3.5">
            <Icons.Sparkles size={20} color="#8b5cf6" />
          </View>
          <View className="flex-1">
            <Text className="text-light-muted dark:text-dark-muted text-xs">Target Template</Text>
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
                <Icons.Camera size={40} color="#8b5cf6" />
              </View>
              <Text className="text-light-text dark:text-dark-text font-bold text-lg mb-1.5 text-center">
                Add Portrait Photo
              </Text>
              <Text className="text-light-muted dark:text-dark-muted text-sm text-center max-w-[70%]">
                Take a picture or upload from gallery. Headshots work best!
              </Text>
            </Pressable>
          )}
        </View>

        <View className="pb-8 mt-auto">
          <PrimaryButton
            onPress={handleContinue}
            title="Continue to Generate"
            disabled={!selectedImage}
            icon={<Icons.Sparkles size={18} color="#ffffff" />}
          />
        </View>
      </ScrollView>

      <ImageSourceDialog
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        onSelectCamera={handleSelectCamera}
        onSelectGallery={handleSelectGallery}
      />
    </SafeAreaView>
  );
}
