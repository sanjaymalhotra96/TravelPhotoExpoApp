import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { TravelTemplate } from '@/constants';
import { Icons } from '@/theme';

interface TemplateCardProps {
  template: TravelTemplate;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl overflow-hidden mb-5 shadow-premium flex-1"
    >
      <View className="relative h-48 w-full">
        <Image
          source={{ uri: template.coverUrl }}
          className="h-full w-full"
          resizeMode="cover"
        />
        {/* Category Badge overlay */}
        <View className="absolute top-4 left-4 bg-slate-900/80 px-3 py-1 rounded-full border border-white/10">
          <Text className="text-white text-[10px] font-bold tracking-widest uppercase">
            {template.category}
          </Text>
        </View>
        <View className="absolute top-3 right-3 bg-primary-500 rounded-full p-2 shadow-sm">
          <Icons.Sparkles size={16} color="#ffffff" />
        </View>
      </View>
      
      <View className="p-5">
        <Text className="text-light-text dark:text-dark-text text-xl font-bold mb-1.5" numberOfLines={1}>
          {template.name}
        </Text>
        
        <Text className="text-light-muted dark:text-dark-muted text-sm mb-4 h-10" numberOfLines={2}>
          {template.description}
        </Text>

        <View className="flex-row items-center justify-between bg-primary-50 dark:bg-primary-900/20 py-2.5 px-4 rounded-xl">
          <Text className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
            Generate Now
          </Text>
          <Icons.ChevronRight size={16} color="#8b5cf6" />
        </View>
      </View>
    </AnimatedPressable>
  );
};
