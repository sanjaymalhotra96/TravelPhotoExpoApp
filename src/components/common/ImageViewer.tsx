import React from 'react';
import { View, Modal, Pressable, Image, StyleSheet, Dimensions } from 'react-native';
import { Icons } from '@/theme';

interface ImageViewerProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export const ImageViewer: React.FC<ImageViewerProps> = ({ visible, imageUrl, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black justify-center items-center relative z-50">
        {/* Floating Close Button */}
        <Pressable
          onPress={onClose}
          className="absolute top-12 right-6 bg-slate-900/60 p-3 rounded-full active:bg-slate-800 z-50"
        >
          <Icons.Back size={24} color="#ffffff" />
        </Pressable>

        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  image: {
    width: width,
    height: height * 0.85,
  },
});
