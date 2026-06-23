import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { Icons } from '@/theme';

interface ImageSourceDialogProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

export const ImageSourceDialog: React.FC<ImageSourceDialogProps> = ({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-slate-900/50 justify-end z-10" 
        onPress={onClose}
      >
        <View className="bg-white dark:bg-dark-card w-full rounded-t-3xl border-t border-light-border dark:border-dark-border px-6 pt-6 pb-8 shadow-2xl">
          <View className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full mb-6 self-center" />
          
          <Text className="text-light-text dark:text-dark-text text-lg font-bold mb-5 text-center">
            Upload Travel Headshot
          </Text>

          <View className="flex-row justify-around mb-6">
            <Pressable
              onPress={() => {
                onClose();
                onSelectCamera();
              }}
              className="items-center bg-slate-50 dark:bg-zinc-800/40 p-5 rounded-2xl w-[42%] border border-light-border dark:border-dark-border active:bg-slate-100 dark:active:bg-zinc-800"
            >
              <View className="bg-primary-50 dark:bg-primary-950/40 p-3.5 rounded-full mb-3">
                <Icons.Camera size={26} color="#8b5cf6" />
              </View>
              <Text className="text-light-text dark:text-dark-text font-semibold text-sm">
                Camera
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onClose();
                onSelectGallery();
              }}
              className="items-center bg-slate-50 dark:bg-zinc-800/40 p-5 rounded-2xl w-[42%] border border-light-border dark:border-dark-border active:bg-slate-100 dark:active:bg-zinc-800"
            >
              <View className="bg-accent/10 p-3.5 rounded-full mb-3">
                <Icons.Image size={26} color="#ff1f75" />
              </View>
              <Text className="text-light-text dark:text-dark-text font-semibold text-sm">
                Gallery
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onClose}
            className="w-full bg-slate-100 dark:bg-zinc-800 py-3.5 rounded-xl active:bg-slate-200 dark:active:bg-zinc-750"
          >
            <Text className="text-light-text dark:text-dark-text text-center font-bold text-sm">
              Cancel
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};
