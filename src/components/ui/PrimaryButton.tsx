import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

interface PrimaryButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'brand' | 'accent' | 'danger';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  icon,
  variant = 'brand',
}) => {
  let bgClass = 'bg-primary-500';
  let pressedBgClass = 'bg-primary-600';
  if (variant === 'accent') {
    bgClass = 'bg-accent';
    pressedBgClass = 'bg-accent-dark';
  } else if (variant === 'danger') {
    bgClass = 'bg-danger';
    pressedBgClass = 'bg-danger-dark';
  }

  const isButtonDisabled = disabled || loading;

  return (
    <Pressable
      onPress={() => {
        console.log(`[PrimaryButton] onPress triggered for title: "${title}"`);
        onPress();
      }}
      disabled={isButtonDisabled}
      className="w-full rounded-2xl overflow-hidden"
    >
      {({ pressed }) => (
        <View
          style={pressed && !isButtonDisabled ? { transform: [{ scale: 0.96 }] } : undefined}
          className={`w-full flex-row items-center justify-center py-4 px-6 rounded-2xl ${
            isButtonDisabled
              ? 'bg-slate-200 dark:bg-zinc-800 opacity-60'
              : pressed
              ? pressedBgClass
              : bgClass
          } shadow-premium`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <View className="flex-row items-center justify-center">
              {icon && <View className="mr-2.5">{icon}</View>}
              <Text className="text-white text-base font-semibold text-center tracking-wide">
                {title}
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
};
