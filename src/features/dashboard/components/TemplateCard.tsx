import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { TravelTemplate } from '@/constants';
import { Icons, COLORS } from '@/theme';
import { t } from '@/utils/i18n';

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
      className="relative w-full h-[330px] rounded-[36px] overflow-hidden mb-6 shadow-premium bg-premiumCard"
    >
      <Image
        source={{ uri: template.coverUrl }}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />
      {/* Dark overlay covering the bottom area to ensure readable text */}
      <View className="absolute inset-0 bg-black/10" />
      <View className="absolute bottom-0 left-0 right-0 h-[140px] bg-black/40 px-6 pb-6 pt-4 flex-row items-end justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-white text-[25px] font-serif font-semibold tracking-tight leading-8 mb-1">
            {template.name}
          </Text>
          <Text className="text-neutral-300 text-xs font-normal">
            {template.description}
          </Text>
        </View>

        <View className="bg-white rounded-full w-12 h-12 items-center justify-center shadow-md active:opacity-85">
          <Icons.ArrowRight size={20} color={COLORS.premiumBg} />
        </View>
      </View>
    </AnimatedPressable>
  );
};
