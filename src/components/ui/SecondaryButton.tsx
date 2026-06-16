import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

interface SecondaryButtonProps {
  onPress: () => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  onPress,
  title,
  loading = false,
  disabled = false,
  icon,
}) => {
  const isButtonDisabled = disabled || loading;

  return (
    <Pressable
      onPress={() => {
        console.log(`[SecondaryButton] onPress triggered for title: "${title}"`);
        onPress();
      }}
      disabled={isButtonDisabled}
      className="w-full rounded-2xl overflow-hidden"
    >
      {({ pressed }) => (
        <View
          style={pressed && !isButtonDisabled ? { transform: [{ scale: 0.96 }] } : undefined}
          className={`w-full flex-row items-center justify-center py-4 px-6 rounded-2xl border ${
            isButtonDisabled
              ? 'border-slate-200 dark:border-zinc-800 bg-transparent opacity-50'
              : 'border-primary-500 bg-transparent dark:border-primary-400'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#8b5cf6" size="small" />
          ) : (
            <View className="flex-row items-center justify-center">
              {icon && <View className="mr-2.5">{icon}</View>}
              <Text className={`text-base font-semibold text-center tracking-wide ${
                isButtonDisabled
                  ? 'text-slate-400 dark:text-zinc-600'
                  : 'text-primary-500 dark:text-primary-400'
              }`}>
                {title}
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
};
