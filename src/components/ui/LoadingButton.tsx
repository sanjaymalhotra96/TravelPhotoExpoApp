import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface LoadingButtonProps {
  onPress: () => void;
  title: string;
  loading: boolean;
  loadingTitle?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  onPress,
  title,
  loading,
  loadingTitle = 'Processing...',
  disabled = false,
  icon,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, { damping: 12, stiffness: 200 });
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    }
  };

  const isButtonDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isButtonDisabled}
      style={animatedStyle}
      className={`w-full flex-row items-center justify-center py-4 px-6 rounded-2xl ${
        isButtonDisabled ? 'bg-slate-200 dark:bg-zinc-800 opacity-60' : 'bg-primary-500 active:bg-primary-600'
      } shadow-premium`}
    >
      {loading ? (
        <View className="flex-row items-center justify-center">
          <ActivityIndicator color="#ffffff" size="small" className="mr-2.5" />
          <Text className="text-white text-base font-semibold text-center tracking-wide">
            {loadingTitle}
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-center">
          {icon && <View className="mr-2.5">{icon}</View>}
          <Text className="text-white text-base font-semibold text-center tracking-wide">
            {title}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};
