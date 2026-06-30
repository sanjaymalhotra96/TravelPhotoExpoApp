import React from 'react';
import { View, Modal, Pressable } from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, children }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end z-50">
        {/* Backdrop Fade In */}
        {visible && (
          <Animated.View 
            entering={FadeIn.duration(200)}
            className="absolute inset-0 bg-slate-900/50"
          >
            <Pressable className="flex-1" onPress={onClose} />
          </Animated.View>
        )}

        {/* Slide in Content */}
        {visible && (
          <Animated.View
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(250)}
            className="bg-white dark:bg-dark-card rounded-t-3xl border-t border-light-border dark:border-dark-border px-6 pt-5 pb-8 shadow-2xl z-50 w-full"
          >
            {/* Grab Bar */}
            <View className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full mb-6 self-center" />
            {children}
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};
