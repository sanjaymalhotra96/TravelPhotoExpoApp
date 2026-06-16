import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface FullScreenLoaderProps {
  message?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ message = 'Loading details...' }) => {
  return (
    <View className="flex-1 items-center justify-center bg-light-bg dark:bg-dark-bg p-6">
      <View className="items-center">
        <ActivityIndicator color="#8b5cf6" size="large" />
        <Text className="text-light-muted dark:text-dark-muted font-medium text-base mt-4 text-center">
          {message}
        </Text>
      </View>
    </View>
  );
};
