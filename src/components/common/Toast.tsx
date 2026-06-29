import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { Icons } from '@/theme';
import { useTheme } from '@/hooks/useTheme';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  onHide,
  duration = 3000,
}) => {
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onHide();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  let bgClass = 'bg-slate-900 border-slate-800';
  let icon = <Icons.Info size={18} color={colors.primary} />;

  if (type === 'success') {
    bgClass = 'bg-emerald-500 border-emerald-600';
    icon = <Icons.Check size={18} color="#ffffff" />;
  } else if (type === 'error') {
    bgClass = 'bg-red-500 border-red-600';
    icon = <Icons.Warning size={18} color="#ffffff" />;
  }

  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      exiting={SlideOutUp.duration(250)}
      className="absolute top-12 left-5 right-5 z-[99] shadow-2xl"
    >
      <View className={`flex-row items-center p-4 rounded-2xl border ${bgClass}`}>
        <View className="mr-3">{icon}</View>
        <Text className="text-white text-sm font-bold flex-1">{message}</Text>
      </View>
    </Animated.View>
  );
};
