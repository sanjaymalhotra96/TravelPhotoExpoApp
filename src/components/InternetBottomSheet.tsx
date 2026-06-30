import React, { useEffect, useState } from 'react';
import { View, Text, Modal } from 'react-native';
import { useInternet } from '@/hooks/useInternet';
import { useTheme } from '@/hooks/useTheme';
import { WifiOff, CheckCircle } from 'lucide-react-native';
import { t } from '@/utils/i18n';

export const InternetBottomSheet = () => {
  const { isOnline, isConnected, isInternetReachable } = useInternet();
  const { colors, isDark } = useTheme();
  
  // States:
  // - 'hidden': offline check hasn't run or we started online and never disconnected
  // - 'offline': currently offline, modal is shown
  // - 'online': connection restored, showing success check for 2 seconds before closing
  const [uiState, setUiState] = useState<'hidden' | 'offline' | 'online'>('hidden');

  console.log(`[InternetBottomSheet] Render State -> isOnline: ${isOnline}, isConnected: ${isConnected}, isInternetReachable: ${isInternetReachable}, uiState: ${uiState}`);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!isOnline) {
      setUiState('offline');
    } else {
      setUiState((prev) => {
        if (prev === 'offline') {
          timeoutId = setTimeout(() => {
            setUiState('hidden');
          }, 2000);
          return 'online';
        }
        return prev;
      });
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOnline]);

  const isVisible = uiState === 'offline' || uiState === 'online';

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="slide"
      statusBarTranslucent={true}
    >
      {/* Backdrop area (takes up full screen) */}
      <View className="flex-1 justify-end bg-black/50">
        
        {/* Custom bottom sheet overlay */}
        <View 
          className="px-6 pb-12 pt-6 rounded-t-[24px]"
          style={{ backgroundColor: colors.card }}
        >
          {/* Handle bar decor */}
          <View className="items-center mb-6">
            <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-zinc-700" />
          </View>

          {uiState === 'offline' && (
            <View className="items-center justify-center py-6">
              <View className="p-4 rounded-full mb-4 bg-red-100 dark:bg-red-950/40">
                <WifiOff size={40} color={colors.danger} />
              </View>
              <Text className="text-light-text dark:text-dark-text text-xl font-bold mb-2 text-center">
                {t('common.internetOfflineTitle')}
              </Text>
              <Text className="text-light-muted dark:text-dark-muted text-sm text-center px-4 leading-5">
                {t('common.internetOfflineDesc')}
              </Text>
            </View>
          )}

          {uiState === 'online' && (
            <View className="items-center justify-center py-6">
              <View className="p-4 rounded-full mb-4 bg-emerald-100 dark:bg-emerald-950/40">
                <CheckCircle size={40} color={colors.success} />
              </View>
              <Text className="text-light-text dark:text-dark-text text-xl font-bold mb-2 text-center">
                {t('common.internetOnlineTitle')}
              </Text>
              <Text className="text-light-muted dark:text-dark-muted text-sm text-center px-4 leading-5">
                {t('common.internetOnlineDesc')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
