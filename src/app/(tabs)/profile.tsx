import React, { useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../hooks/useProfile';
import { useAuthStore } from '../../store/authStore';
import { HistoryItem } from '../../constants';
import { ImageCard } from '../../components/cards/ImageCard';
import { ImageViewer } from '../../components/common/ImageViewer';
import { ConfirmationDialog } from '../../components/dialogs/ConfirmationDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { Icons } from '../../theme';
import { t } from '../../utils/i18n';

export default function ProfileScreen() {
  const { data: profileData, isLoading, error, refetch } = useProfile();
  const logoutUser = useAuthStore((state) => state.logout);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const handlePressHistory = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setViewerVisible(true);
  };

  const handleConfirmLogout = async () => {
    console.log('[Profile] Confirming logout...');
    setLogoutDialogVisible(false);
    
    // Give the modal animation time to close on the native side before triggering the logout store update.
    // This prevents the native modal transition from locking up the navigation router.
    setTimeout(async () => {
      console.log('[Profile] Calling logoutUser...');
      try {
        await logoutUser();
        console.log('[Profile] logoutUser call completed.');
      } catch (err) {
        console.error('[Profile] logoutUser error:', err);
      }
    }, 350);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-light-bg dark:bg-dark-bg justify-center items-center">
        <ActivityIndicator color="#8b5cf6" size="large" />
        <Text className="text-light-muted dark:text-dark-muted text-sm mt-3">{t('tabs.profile.loading')}</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  const profile = profileData?.profile;
  const history = profileData?.history || [];

  return (
    <SafeAreaView className="flex-1 bg-light-bg dark:bg-dark-bg">
      {/* Custom Header */}
      <View className="w-full flex-row items-center justify-between px-5 py-4 border-b border-light-border dark:border-dark-border bg-white dark:bg-dark-card">
        <Text className="text-light-text dark:text-dark-text text-xl font-bold tracking-tight">
          {t('tabs.profile.title')}
        </Text>
        
        <Pressable
          onPress={() => {
            console.log('[Profile] Header Logout button clicked! Showing confirmation dialog.');
            setLogoutDialogVisible(true);
          }}
          className="flex-row items-center bg-red-50 dark:bg-red-950/20 px-4 py-2.5 rounded-full border border-red-100 dark:border-red-950 active:bg-red-100 dark:active:bg-red-900/35"
        >
          <Icons.LogOut size={16} color="#ef4444" className="mr-2" />
          <Text className="text-red-500 font-bold text-xs">{t('tabs.profile.signOutBtn')}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5 pt-6">
        
        {/* User Card */}
        {profile && (
          <View className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-6 rounded-3xl items-center shadow-premium mb-6">
            <Image
              source={{ uri: profile.avatarUrl }}
              className="w-24 h-24 rounded-full mb-4 border-2 border-primary-500"
              resizeMode="cover"
            />
            <Text className="text-light-text dark:text-dark-text font-black text-2xl mb-1 text-center">
              {profile.fullName}
            </Text>
            <Text className="text-light-muted dark:text-dark-muted text-sm mb-4 text-center">
              {profile.email}
            </Text>

            {/* Stats */}
            <View className="flex-row border-t border-light-border dark:border-dark-border pt-4 w-full justify-around">
              <View className="items-center">
                <Text className="text-primary-500 font-extrabold text-lg">{history.length}</Text>
                <Text className="text-light-muted dark:text-dark-muted text-xs">{t('tabs.profile.statsGenerations')}</Text>
              </View>
              <View className="items-center">
                <Text className="text-primary-500 font-extrabold text-lg">{t('tabs.profile.statsActive')}</Text>
                <Text className="text-light-muted dark:text-dark-muted text-xs">{t('tabs.profile.statsStatus')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* History Header */}
        <View className="flex-row items-center mb-4">
          <Icons.History size={18} className="text-light-text dark:text-dark-text mr-2" />
          <Text className="text-light-text dark:text-dark-text font-extrabold text-lg">
            {t('tabs.profile.creationsHeader')}
          </Text>
        </View>

        {/* History Items list */}
        {history.length > 0 ? (
          <View className="pb-8">
            {history.map((item: HistoryItem) => (
              <ImageCard
                key={item.id}
                item={item}
                onPress={() => handlePressHistory(item.imageUrl)}
              />
            ))}
          </View>
        ) : (
          <View className="py-8">
            <EmptyState message={t('tabs.profile.emptyCreations')} />
          </View>
        )}

      </ScrollView>

      {/* Full Screen Image Zoomer */}
      <ImageViewer
        visible={viewerVisible}
        imageUrl={selectedImageUrl}
        onClose={() => setViewerVisible(false)}
      />

      {/* Confirmation warning for logout */}
      <ConfirmationDialog
        visible={logoutDialogVisible}
        title={t('tabs.profile.logoutConfirmTitle')}
        description={t('tabs.profile.logoutConfirmDesc')}
        confirmText={t('tabs.profile.signOutBtn')}
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutDialogVisible(false)}
      />
    </SafeAreaView>
  );
}
