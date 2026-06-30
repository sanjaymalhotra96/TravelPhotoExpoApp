import React from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRevenueCat } from '@/features/billing/providers/revenuecat-provider';
import { COLORS } from '@/theme';
import { t } from '@/utils/i18n';

// Safely require PurchasesUI to avoid crashing environments where it isn't linked/present (like Expo Go or Web)
let RevenueCatUI: any = null;
try {
  RevenueCatUI = require('react-native-purchases-ui').default;
} catch (e) {
  console.warn('RevenueCatUI is not available on this platform/environment.');
}

export default function PaywallRoute() {
  const { refreshSubscription } = useRevenueCat();
  
  const iconColor = '#111827';

  // Determine whether to show the native designed RevenueCat dashboard paywall
  const showNativePaywall = Platform.OS !== 'web' && RevenueCatUI !== null;

  if (showNativePaywall) {
    return (
      <View className="flex-1 bg-light-bg dark:bg-dark-bg">
        <RevenueCatUI.Paywall
          onDismiss={() => {
            router.back();
          }}
          onPurchaseCompleted={() => {
            refreshSubscription().then(() => {
              Alert.alert(t('common.success'), t('paywall.purchaseSuccess'), [
                { text: t('common.ok'), onPress: () => router.back() }
              ]);
            });
          }}
          onRestoreCompleted={() => {
            refreshSubscription().then(() => {
              Alert.alert(t('common.success'), t('paywall.restoreSuccess'));
            });
          }}
        />
      </View>
    );
  }

  // Display error message/state when the native paywall cannot be displayed or failed to load
  return (
    <View className="flex-1 justify-center items-center px-6 bg-light-bg dark:bg-dark-bg">
      <View className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-zinc-800/80 rounded-full">
        <TouchableOpacity 
          onPress={() => router.back()} 
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="close" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>
      
      <Ionicons name="alert-circle-outline" size={64} color={COLORS.primary} />
      
      <Text className="text-2xl font-black text-light-text dark:text-dark-text mt-6 mb-2 text-center">
        {t('paywall.unavailableTitle')}
      </Text>
      
      <Text className="text-base text-light-muted dark:text-dark-muted text-center mb-8 px-4 leading-relaxed">
        {t('paywall.unavailableDesc')}
      </Text>
      
      <TouchableOpacity
        style={{ backgroundColor: COLORS.primary }}
        className="px-8 py-3.5 rounded-xl shadow-lg"
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text className="text-white text-base font-bold">{t('paywall.goBack')}</Text>
      </TouchableOpacity>
    </View>
  );
}

