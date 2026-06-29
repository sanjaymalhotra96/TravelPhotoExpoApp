import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGenerateImage } from '@/hooks/useGenerateImage';
import { useJobStatus } from '@/hooks/useJobStatus';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ErrorState } from '@/components/common/ErrorState';
import { getGenerationParams, clearGenerationParams } from '@/store/generationStore';
import { useTheme } from '@/hooks/useTheme';
import { t } from '@/utils/i18n';

export default function PollingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { templateId: routeTemplateId, imageUri: rawImageUri } = useLocalSearchParams<{ templateId: string; imageUri: string }>();

  // Retrieve parameters from our memory-based store (bypasses URL param truncating issue in Expo Router)
  const params = getGenerationParams();
  const templateId = params?.templateId || routeTemplateId || '';
  const imageUri = params?.imageUri || (rawImageUri ? decodeURIComponent(rawImageUri) : '');

  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutateAsync: uploadImage, isPending: isUploading } = useGenerateImage();
  const { data: jobDetails, error: pollingError } = useJobStatus(jobId);


  // Laser scanner animation values
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0.4);

  // ── Submit image on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    console.log('[PollingScreen] Mounted. Params from store:', params, 'route params:', { routeTemplateId, rawImageUri });
    console.log('[PollingScreen] Final parameters in use: templateId:', templateId, 'imageUri:', imageUri);

    const executeGeneration = async () => {
      try {
        if (!imageUri || !templateId) {
          throw new Error('Generation parameters missing: imageUri or templateId not provided.');
        }

        console.log('[PollingScreen] Starting generation...');
        console.log('[PollingScreen] imageUri :', imageUri);
        console.log('[PollingScreen] templateId:', templateId);

        const response = await uploadImage({ imageUri, templateId });

        console.log('[PollingScreen] uploadImage resolved:', {
          jobId: response.jobId,
          resultUrl: response.resultUrl,
        });

        if (!active) return;

        if (response.resultUrl) {
          // ── Real AI mode: generation already complete inside the hook ──
          // Navigate directly to result without further polling
          console.log('[PollingScreen] Real AI mode: navigating directly to result screen');
          router.replace({
            pathname: `/result/${response.jobId}`,
            params: {
              templateId,
              imageUri,
              resultUrl: response.resultUrl,
              isMock: 'false',
            },
          });
        } else {
          // ── Mock mode: start polling via useJobStatus ──
          console.log('[PollingScreen] Mock mode: starting polling for jobId:', response.jobId);
          setJobId(response.jobId);
        }
      } catch (err: any) {
        if (active) {
          console.error('[PollingScreen] Generation error:', err?.message);
          setErrorMsg(err?.message || t('generate.pollingUploadError'));
        }
      }
    };

    executeGeneration();

    // Laser scan animation loop
    translateY.value = withRepeat(
      withSequence(
        withTiming(120, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(-120, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 900 }),
        withTiming(0.4, { duration: 900 })
      ),
      -1,
      true
    );

    return () => {
      console.log('[PollingScreen] Unmounting. Cleaning up generation parameters from store.');
      active = false;
      clearGenerationParams();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Navigate to result when mock polling completes ─────────────────────────
  useEffect(() => {
    if (!jobDetails) return;

    console.log('[PollingScreen] Job details updated:', {
      id: jobDetails.id,
      status: jobDetails.status,
      progress: jobDetails.progress,
      resultUrl: jobDetails.resultUrl,
      templateUrl: jobDetails.templateUrl,
    });

    if (jobDetails.status === 'completed' && jobDetails.resultUrl) {
      console.log('[PollingScreen] Mock polling complete! Navigating to result.');
      router.replace({
        pathname: `/result/${jobDetails.id}`,
        params: {
          templateId,
          imageUri,       // pass original user photo so result screen can use it
          resultUrl: jobDetails.resultUrl,
          templateUrl: jobDetails.templateUrl ?? '',
          isMock: 'true',
        },
      });
    }
  }, [jobDetails, templateId, imageUri, router]);

  useEffect(() => {
    if (pollingError) {
      console.error('[PollingScreen] Polling query error:', pollingError);
    }
  }, [pollingError]);

  const animatedScannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleRetry = () => {
    console.log('[PollingScreen] Retrying generation...');
    setErrorMsg(null);
    setJobId(null);
    if (imageUri && templateId) {
      uploadImage({ imageUri, templateId })
        .then((res) => {
          if (res.resultUrl) {
            router.replace({
              pathname: `/result/${res.jobId}`,
              params: { templateId, imageUri, resultUrl: res.resultUrl, isMock: 'false' },
            });
          } else {
            setJobId(res.jobId);
          }
        })
        .catch((err) => setErrorMsg(err?.message || t('generate.pollingStartError')));
    }
  };

  const activeError =
    errorMsg ||
    pollingError?.message ||
    (jobDetails?.status === 'failed'
      ? (jobDetails.error || t('generate.pollingModelError'))
      : null);

  if (activeError) {
    return <ErrorState message={activeError} onRetry={handleRetry} />;
  }

  // Build progress label
  let stepMessage = t('generate.pollingStatusUploading');
  if (!isUploading && jobId) {
    const progress = jobDetails?.progress ?? 0;
    if (progress <= 20) stepMessage = t('generate.pollingStatusQueueing');
    else if (progress <= 50) stepMessage = t('generate.pollingStatusAnalyzing');
    else if (progress <= 80) stepMessage = t('generate.pollingStatusBlending');
    else stepMessage = t('generate.pollingStatusFinalizing');
  } else if (isUploading) {
    stepMessage = t('generate.pollingStatusPreparing');
  }

  return (
    <View className="flex-1 bg-light-bg dark:bg-dark-bg justify-center items-center p-6">
      <View className="items-center w-full max-w-[85%]">

        {/* Laser Scanner Frame */}
        <View className="w-56 h-56 rounded-3xl overflow-hidden border-2 border-primary-500 relative bg-slate-900 shadow-2xl items-center justify-center mb-8">
          {imageUri ? (
            <Animated.Image
              source={{ uri: imageUri }}
              className="w-full h-full opacity-70"
              resizeMode="cover"
            />
          ) : null}
          <Animated.View
            style={animatedScannerStyle}
            className="absolute left-0 right-0 h-1 bg-primary-500 shadow-lg"
          />
        </View>

        <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 rounded-3xl w-full items-center shadow-premium">
          <ActivityIndicator color={colors.primary} size="large" className="mb-4" />

          <Text className="text-light-text dark:text-dark-text font-black text-xl mb-1 text-center">
            {t('generate.pollingTitle')}
          </Text>

          <Text className="text-primary-500 font-bold text-sm text-center mb-3">
            {stepMessage}
            {jobDetails?.progress ? ` (${jobDetails.progress}%)` : ''}
          </Text>

          <Text className="text-light-muted dark:text-dark-muted text-xs text-center leading-relaxed">
            {t('generate.pollingSubtitle')}
          </Text>
        </View>

      </View>
    </View>
  );
}
