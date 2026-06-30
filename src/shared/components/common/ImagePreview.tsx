import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { Icons, COLORS } from '@/theme';

interface ImagePreviewProps {
  uri: string;
  onClear: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ uri, onClear }) => {
  return (
    <View className="w-full aspect-square rounded-3xl overflow-hidden border border-light-border dark:border-dark-border relative shadow-lg bg-slate-100 dark:bg-zinc-900">
      <Image
        source={{ uri }}
        className="w-full h-full"
        resizeMode="cover"
      />
      
      <Pressable
        onPress={onClear}
        className="absolute top-4 right-4 bg-red-500/90 active:bg-red-600 rounded-full p-3 shadow-md"
      >
        <Icons.Trash size={20} color={COLORS.white} />
      </Pressable>
    </View>
  );
};
